import { describe, expect, it } from 'vitest'
import {
  emailAddress,
  findTeamSender,
  htmlToText,
  inboundConfig,
  parseRelayAddress,
  relayAddress,
  relayKey,
  senderAuthenticated,
  stripQuotedReply,
  teamReplyTo,
  verifySvixSignature,
} from '@/features/contact/inbound'

const DOMAIN = 'inbound.coffeeprojects.es'
const key = relayKey('payload-secret-for-tests')

describe('relay Reply-To address (S21)', () => {
  it('builds r+<id>.<mac>@<domain> and parses it back to the request id', () => {
    const address = relayAddress(42, DOMAIN, key)
    expect(address).toMatch(/^r\+42\.[0-9a-f]{20}@inbound\.coffeeprojects\.es$/)
    expect(parseRelayAddress(address, DOMAIN, key)).toBe(42)
  })

  it('accepts display names and any letter case (mail systems may change it)', () => {
    const address = relayAddress(7, DOMAIN, key)
    expect(parseRelayAddress(`"CoffeeProjects" <${address.toUpperCase()}>`, DOMAIN, key)).toBe(7)
  })

  it('rejects a tampered id, a tampered mac, another key and another domain', () => {
    const address = relayAddress(42, DOMAIN, key)
    const mac = address.slice(address.indexOf('.') + 1, address.indexOf('@'))
    expect(parseRelayAddress(`r+43.${mac}@${DOMAIN}`, DOMAIN, key)).toBeNull()
    const flipped = mac.slice(0, -1) + (mac.endsWith('0') ? '1' : '0')
    expect(parseRelayAddress(`r+42.${flipped}@${DOMAIN}`, DOMAIN, key)).toBeNull()
    expect(parseRelayAddress(address, DOMAIN, relayKey('another-secret'))).toBeNull()
    expect(parseRelayAddress(address.replace(DOMAIN, 'evil.example'), DOMAIN, key)).toBeNull()
  })

  it('rejects malformed addresses', () => {
    for (const a of ['', 'hola@coffeeprojects.es', `r+abc.0123456789abcdef0123@${DOMAIN}`, `r+42@${DOMAIN}`, `r+42.short@${DOMAIN}`, `x r+42.0123456789abcdef0123@${DOMAIN}`]) {
      expect(parseRelayAddress(a, DOMAIN, key), a).toBeNull()
    }
  })

  it('derives the key from the secret with a fixed context, never the raw secret', () => {
    expect(relayKey('s').equals(relayKey('s'))).toBe(true)
    expect(relayKey('s').equals(Buffer.from('s'))).toBe(false)
  })
})

describe('teamReplyTo (S21: Reply-To of the team notification)', () => {
  const config = { apiKey: 're_x', domain: DOMAIN, webhookSecret: 'whsec_x', key }
  it('is the relay address when inbound is configured', () => {
    expect(teamReplyTo(42, 'client@example.com', config)).toBe(relayAddress(42, DOMAIN, key))
  })
  it('stays the client email when inbound is not configured (behavior before S21)', () => {
    expect(teamReplyTo(42, 'client@example.com', null)).toBe('client@example.com')
  })
  it('falls back to the client email for a non-numeric id', () => {
    expect(teamReplyTo('abc', 'client@example.com', config)).toBe('client@example.com')
  })
})

describe('inboundConfig (S21: configured only when every piece is set)', () => {
  const full = { RESEND_API_KEY: 're_x', RESEND_INBOUND_DOMAIN: ' Inbound.CoffeeProjects.es ', RESEND_WEBHOOK_SECRET: 'whsec_abc', PAYLOAD_SECRET: 'p' }
  it('returns the normalized config when all variables are set', () => {
    expect(inboundConfig(full)).toEqual({ apiKey: 're_x', domain: 'inbound.coffeeprojects.es', webhookSecret: 'whsec_abc', key: relayKey('p') })
  })
  it.each(['RESEND_API_KEY', 'RESEND_INBOUND_DOMAIN', 'RESEND_WEBHOOK_SECRET', 'PAYLOAD_SECRET'] as const)('is null without %s', (name) => {
    expect(inboundConfig({ ...full, [name]: '' })).toBeNull()
  })
})

describe('verifySvixSignature', () => {
  // Svix's published example vector (docs.svix.com, "Verifying webhooks manually").
  const vector = {
    secret: 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw',
    id: 'msg_p5jXN8AQM9LWM0D4loKWxJek',
    timestamp: '1614265330',
    body: '{"test": 2432232314}',
    signature: 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=',
  }
  const now = 1614265330

  it('accepts the known vector', () => {
    expect(verifySvixSignature({ ...vector, nowSeconds: now })).toBe(true)
  })

  it('accepts when one of several space-separated signatures matches', () => {
    expect(verifySvixSignature({ ...vector, signature: `v1,AAAA v1a,xyz ${vector.signature}`, nowSeconds: now })).toBe(true)
  })

  it('accepts a second vector built with our own key', () => {
    expect(
      verifySvixSignature({
        secret: 'whsec_Y29mZmVlcHJvamVjdHMtc3ZpeC10ZXN0LWtleS0zMmI=',
        id: 'msg_2Fv1',
        timestamp: '1760000000',
        body: '{"type":"email.received"}',
        signature: 'v1,dR+4sJhIuxhEymCvx1fG7BGg4J5Rw2+9yTeW0beVavg=',
        nowSeconds: 1760000100,
      }),
    ).toBe(true)
  })

  it('rejects a changed body, id, secret or signature', () => {
    expect(verifySvixSignature({ ...vector, body: '{"test": 1}', nowSeconds: now })).toBe(false)
    expect(verifySvixSignature({ ...vector, id: 'msg_other', nowSeconds: now })).toBe(false)
    expect(verifySvixSignature({ ...vector, secret: 'whsec_Y29mZmVlcHJvamVjdHMtc3ZpeC10ZXN0LWtleS0zMmI=', nowSeconds: now })).toBe(false)
    expect(verifySvixSignature({ ...vector, signature: 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE', nowSeconds: now })).toBe(false)
    expect(verifySvixSignature({ ...vector, signature: '', nowSeconds: now })).toBe(false)
  })

  it('rejects timestamps more than 5 minutes old or in the future', () => {
    expect(verifySvixSignature({ ...vector, nowSeconds: now + 299 })).toBe(true)
    expect(verifySvixSignature({ ...vector, nowSeconds: now + 301 })).toBe(false)
    expect(verifySvixSignature({ ...vector, nowSeconds: now - 301 })).toBe(false)
    expect(verifySvixSignature({ ...vector, timestamp: 'abc', nowSeconds: now })).toBe(false)
  })
})

describe('stripQuotedReply', () => {
  it('keeps only the new text above a Gmail "On ... wrote:" header (even wrapped on two lines)', () => {
    expect(stripQuotedReply('Hola Juan,\n\nTe enviamos la propuesta.\n\nOn Thu, Oct 9, 2026 at 10:00 AM CoffeeProjects <\nhola@coffeeprojects.es> wrote:\n> Nueva solicitud')).toBe(
      'Hola Juan,\n\nTe enviamos la propuesta.',
    )
  })

  it('cuts at the Spanish and French reply headers', () => {
    expect(stripQuotedReply('Gracias.\r\n\r\nEl jue, 9 oct 2026 a las 10:00, CoffeeProjects (<hola@coffeeprojects.es>) escribió:\r\n> x')).toBe('Gracias.')
    expect(stripQuotedReply('Merci.\n\nLe jeu. 9 oct. 2026 à 10:00, CoffeeProjects <hola@coffeeprojects.es> a écrit :\n> x')).toBe('Merci.')
  })

  it('cuts at Outlook "-----Original Message-----" and "De:/Enviado:" blocks', () => {
    expect(stripQuotedReply('Ok.\n\n-----Original Message-----\nFrom: a\nSent: b\n\nold')).toBe('Ok.')
    expect(stripQuotedReply('Perfecto.\n\n________________________________\nDe: CoffeeProjects <hola@coffeeprojects.es>\nEnviado: jueves\nPara: Erik\nAsunto: Nueva solicitud\n\nold')).toBe('Perfecto.')
    expect(stripQuotedReply('Vale.\nFrom: CoffeeProjects\nSent: Thursday\nTo: Erik\n\nold')).toBe('Vale.')
  })

  it('drops ">" quoted lines and keeps the rest (inline answers)', () => {
    expect(stripQuotedReply('> ¿Plazo?\nDos semanas.\n> ¿Precio?\n590 €')).toBe('Dos semanas.\n590 €')
  })

  it('keeps a lone "De:" line in the middle of normal text', () => {
    expect(stripQuotedReply('De: lunes a viernes trabajamos.\nGracias.')).toBe('De: lunes a viernes trabajamos.\nGracias.')
  })

  it('returns an empty string when there is nothing new', () => {
    expect(stripQuotedReply('\n> todo citado\n')).toBe('')
  })
})

describe('htmlToText', () => {
  it('turns breaks/blocks into new lines, drops blockquotes and tags, decodes entities', () => {
    expect(htmlToText('<div>Hola &amp; adi&oacute;s<br>Juan</div><p>2 &lt; 3</p><blockquote>citado</blockquote><style>p{}</style>')).toBe(
      'Hola & adiós\nJuan\n2 < 3',
    )
  })
})

describe('sender checks', () => {
  const users = [{ id: 3, email: 'Erik@CoffeeProjects.es' }, { id: 4, email: null }]
  it('extracts the bare address from a From header', () => {
    expect(emailAddress('Erik <ERIK@coffeeprojects.es>')).toBe('erik@coffeeprojects.es')
    expect(emailAddress(' erik@coffeeprojects.es ')).toBe('erik@coffeeprojects.es')
    expect(emailAddress('no address')).toBeNull()
  })
  it('matches a team user case-insensitively and nobody else', () => {
    expect(findTeamSender('erik@coffeeprojects.es', users)).toEqual(users[0])
    expect(findTeamSender('Erik <erik@COFFEEPROJECTS.es>', users)).toEqual(users[0])
    expect(findTeamSender('client@example.com', users)).toBeNull()
    expect(findTeamSender('', users)).toBeNull()
  })
  it('rejects mail whose authentication results show it is spoofed', () => {
    expect(senderAuthenticated(null)).toBe(true)
    expect(senderAuthenticated(undefined)).toBe(true)
    expect(senderAuthenticated({ spf: 'fail', dkim: 'fail', dmarc: 'pass' })).toBe(true)
    expect(senderAuthenticated({ spf: 'pass', dkim: 'pass', dmarc: 'fail' })).toBe(false)
    // Without a DMARC pass, an SPF/DKIM pass may belong to the attacker's own domain: reject.
    expect(senderAuthenticated({ spf: 'pass', dkim: 'unknown', dmarc: 'unknown' })).toBe(false)
    expect(senderAuthenticated({ spf: 'pass', dkim: 'pass' })).toBe(false)
    expect(senderAuthenticated({ spf: 'fail', dkim: 'fail', dmarc: 'unknown' })).toBe(false)
  })
})

describe('stripQuotedReply never forwards the team notification', () => {
  it('cuts at the notification heading even when the quote header is not recognised', () => {
    const text = 'Hola, te paso presupuesto.\n\nRandom client header line\nNueva solicitud desde coffeeprojects.es\nEmail: client@example.com\nUTM: x'
    expect(stripQuotedReply(text)).toBe('Hola, te paso presupuesto.\n\nRandom client header line')
  })
})
