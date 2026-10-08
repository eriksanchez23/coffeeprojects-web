import type { SeedDoc } from '../types'

// Source of truth: docs/sources/comisiones-colaboradores.txt (Programa de colaboradores 2026), adapted for a public
// page. Spanish follows the source; EN/FR are translations made for the site. Plan prices are NOT here: the page
// reads them from the Pricing global. The source's "Premium 139 €/mes" and "2 a 25 cambios" are v3 leftovers
// (S16 ruling), so the maintenance text names no plan list or change counts.
// {high}/{low}/{diff} (commission rates) and {min}/{max} (savings) are filled in by the page.
// Keep every string WIN1252-encodable (no arrows, no narrow no-break spaces): the local dev Postgres is WIN1252.

type Block = { title: string; text: string }

type PartnersShared = { rateWithMaintenance: number; rateWebOnly: number }
type PartnersLocalized = {
  eyebrow: string
  title: string
  intro: string
  notice: Block
  withMaintenanceTitle: string
  withMaintenanceBadge: string
  webOnlyTitle: string
  rateNote: string
  tableTitle: string
  tableNote: string
  sellTitle: string
  webPlansTitle: string
  maintenanceTitle: string
  maintenanceText: string
  sellArgument: string
  stepsTitle: string
  steps: Block[]
  conditionsTitle: string
  conditions: { topic: string; condition: string }[]
  dontPromise: Block
  footnote: string
  cta: { title: string; text: string; registerLabel: string; contactLabel: string; emailSubject: string; emailBody: string }
  seo: { title: string; description: string }
}

export const partners: SeedDoc<PartnersShared, PartnersLocalized> = {
  shared: { rateWithMaintenance: 10, rateWebOnly: 5 },
  localized: {
    es: {
      eyebrow: 'Programa de colaboradores · 2026',
      title: 'Gana dinero con nosotros',
      intro:
        'Por cada cliente que nos traigas y contrate una web, te llevas una comisión sobre el precio de la web. Si la contrata con cualquiera de nuestros planes de mantenimiento, ganas el doble de porcentaje: un {high} frente al {low} si solo quiere la web.',
      notice: {
        title: 'Sin compra no hay comisión',
        text: 'Solo cobras cuando el cliente compra uno de nuestros paquetes web. Si nos presentas a alguien interesado pero al final no contrata ningún paquete, no se genera ningún pago.',
      },
      withMaintenanceTitle: 'Web + cualquier plan de mantenimiento',
      withMaintenanceBadge: 'La mejor opción',
      webOnlyTitle: 'Solo la web, sin mantenimiento',
      rateNote: 'del precio de la web (sin IVA)',
      tableTitle: 'Lo que cobras por cada venta',
      tableNote:
        'En los planes con precio «desde» el precio final se cierra tras una reunión con el cliente; tu comisión se calcula sobre ese precio final.',
      sellTitle: 'Qué vendes',
      webPlansTitle: 'Webs · pago único',
      maintenanceTitle: 'Mantenimiento · opcional',
      maintenanceText:
        'Incluyen hosting, dominio y SSL, actualizaciones de seguridad, copias de seguridad y un cupo de cambios al mes según el plan.',
      sellArgument: 'Argumento clave: con cualquier plan de mantenimiento, la web le sale al cliente entre {min} y {max} más barata.',
      stepsTitle: 'Cómo funciona',
      steps: [
        {
          title: 'Registra al cliente',
          text: 'Antes de presentárnoslo, envíanos por email su nombre, su negocio y su teléfono. Te confirmamos el registro por escrito.',
        },
        {
          title: 'Tu registro vale 60 días',
          text: 'Si el cliente contrata en ese plazo, la venta es tuya. Si dos colaboradores registran al mismo cliente, cuenta el primero.',
        },
        {
          title: 'Nosotros cerramos la venta',
          text: 'La cerramos contigo o directamente con el cliente: presupuesto, contrato y cobro los gestionamos nosotros.',
        },
        {
          title: 'Cobras tu comisión',
          text: 'Cobras cuando el cliente paga el segundo 50 % de la web, a la entrega. En la Landing Page sin mantenimiento, que se paga al 100 % por adelantado, cobras desde ese pago. Te pagamos en un máximo de 15 días.',
        },
      ],
      conditionsTitle: 'Condiciones de la comisión',
      conditions: [
        {
          topic: 'Sin compra no hay comisión',
          condition:
            'Solo hay comisión si el cliente compra un paquete web. Presentarnos a alguien interesado que al final no contrata nada no genera ningún pago.',
        },
        {
          topic: 'Base de cálculo',
          condition: 'Precio de la web sin IVA. No se comisiona sobre las cuotas de mantenimiento ni sobre servicios extra posteriores.',
        },
        {
          topic: 'Con o sin mantenimiento',
          condition: '{high} si el cliente contrata la web con cualquier plan de mantenimiento; {low} si contrata solo la web.',
        },
        {
          topic: 'Baja temprana del mantenimiento',
          condition:
            'Si el cliente cancela el mantenimiento en los primeros 6 meses, la diferencia ({diff} del precio de la web) se descuenta de tus siguientes comisiones.',
        },
        { topic: 'Ventas no cobradas', condition: 'Si el cliente no completa el pago o cancela el proyecto, no se genera comisión.' },
        {
          topic: 'Clientes ya existentes',
          condition: 'No se comisionan clientes que ya trabajaban con nosotros o que ya estaban en conversaciones antes de tu registro.',
        },
        { topic: 'Facturación', condition: 'El pago se realiza contra factura o documento de liquidación, según tu situación fiscal.' },
        { topic: 'Exclusividad', condition: 'Ninguna. Puedes colaborar con otras empresas y dejar el programa cuando quieras.' },
      ],
      dontPromise: {
        title: 'Lo que no debes prometer al cliente',
        text: 'Precios distintos a los de nuestra tarifa, plazos de entrega más cortos, funciones que no estén en el plan o resultados garantizados de posicionamiento en Google. Ante cualquier duda, consúltanos antes de cerrar.',
      },
      footnote:
        'Precios de lanzamiento 2026, sujetos a cambios. Las comisiones se calculan con la tarifa vigente el día en que el cliente firma. Esta información es orientativa; las condiciones se formalizan en el acuerdo de colaboración.',
      cta: {
        title: '¿Tienes a alguien en mente?',
        text: 'Regístralo antes de presentárnoslo: envíanos su nombre, su negocio y su teléfono y te confirmamos el registro por escrito. Recuerda: solo hay comisión si contrata un paquete.',
        registerLabel: 'Registrar un cliente',
        contactLabel: 'Tengo dudas sobre el programa',
        emailSubject: 'Registro de cliente · Programa de colaboradores',
        emailBody: 'Hola, quiero registrar a este cliente:\n\nNombre del cliente:\nNegocio:\nTeléfono:\n\nMi nombre:\nMi teléfono:',
      },
      seo: {
        title: 'Gana dinero con nosotros: comisión por cliente',
        description:
          'Recomiéndanos y gana un {high} del precio de la web si tu cliente la contrata con mantenimiento, o un {low} solo la web. Sin compra no hay comisión.',
      },
    },
    en: {
      eyebrow: 'Partner programme · 2026',
      title: 'Earn with us',
      intro:
        'For every client you bring us who hires a website, you earn a commission on the website price. If they hire it with any of our maintenance plans, your rate doubles: {high} instead of {low} when they only want the website.',
      notice: {
        title: 'No purchase, no commission',
        text: 'You are paid only when the client buys one of our website packages. If you introduce someone who is interested but in the end does not hire any package, no payment is made.',
      },
      withMaintenanceTitle: 'Website + any maintenance plan',
      withMaintenanceBadge: 'The best option',
      webOnlyTitle: 'Website only, no maintenance',
      rateNote: 'of the website price (excl. VAT)',
      tableTitle: 'What you earn per sale',
      tableNote:
        'For plans priced "from", the final price is agreed after a meeting with the client; your commission is calculated on that final price.',
      sellTitle: 'What you sell',
      webPlansTitle: 'Websites · one-off payment',
      maintenanceTitle: 'Maintenance · optional',
      maintenanceText:
        'Plans include hosting, domain and SSL, security updates, backups and a monthly allowance of changes depending on the plan.',
      sellArgument: 'Key argument: with any maintenance plan, the website costs the client between {min} and {max} less.',
      stepsTitle: 'How it works',
      steps: [
        {
          title: 'Register the client',
          text: 'Before introducing them, email us their name, business and phone number. We confirm the registration in writing.',
        },
        {
          title: 'Your registration lasts 60 days',
          text: 'If the client signs within that period, the sale is yours. If two partners register the same client, the first one counts.',
        },
        {
          title: 'We close the sale',
          text: 'We close it with you or directly with the client: we handle the quote, the contract and the billing.',
        },
        {
          title: 'You get your commission',
          text: 'You are paid when the client pays the second 50 % of the website, on delivery. For the Landing Page without maintenance, paid 100 % upfront, you are paid from that payment. We pay you within 15 days at most.',
        },
      ],
      conditionsTitle: 'Commission terms',
      conditions: [
        {
          topic: 'No purchase, no commission',
          condition:
            'There is a commission only if the client buys a website package. Introducing someone interested who ends up hiring nothing earns no payment.',
        },
        {
          topic: 'Calculation basis',
          condition: 'The website price excluding VAT. No commission on maintenance fees or on later extra services.',
        },
        {
          topic: 'With or without maintenance',
          condition: '{high} if the client hires the website with any maintenance plan; {low} if they hire the website only.',
        },
        {
          topic: 'Early maintenance cancellation',
          condition:
            'If the client cancels maintenance within the first 6 months, the difference ({diff} of the website price) is deducted from your next commissions.',
        },
        { topic: 'Unpaid sales', condition: 'If the client does not complete payment or cancels the project, no commission is earned.' },
        {
          topic: 'Existing clients',
          condition: 'Clients who already worked with us, or were already in talks with us before your registration, are not commissioned.',
        },
        { topic: 'Invoicing', condition: 'Payment is made against an invoice or a settlement statement, depending on your tax situation.' },
        { topic: 'Exclusivity', condition: 'None. You can work with other companies and leave the programme whenever you want.' },
      ],
      dontPromise: {
        title: 'What you must not promise the client',
        text: 'Prices different from our price list, shorter delivery times, features that are not in the plan or guaranteed Google rankings. If in doubt, ask us before closing.',
      },
      footnote:
        '2026 launch prices, subject to change. Commissions are calculated with the price list in force on the day the client signs. This information is for guidance only; the terms are formalised in the partnership agreement.',
      cta: {
        title: 'Have someone in mind?',
        text: 'Register them before introducing them: send us their name, business and phone number and we will confirm the registration in writing. Remember: there is only a commission if they buy a package.',
        registerLabel: 'Register a client',
        contactLabel: 'I have questions about the programme',
        emailSubject: 'Client registration · Partner programme',
        emailBody: 'Hello, I would like to register this client:\n\nClient name:\nBusiness:\nPhone:\n\nMy name:\nMy phone:',
      },
      seo: {
        title: 'Earn with us: a commission for every client',
        description:
          'Refer clients and earn {high} of the website price when they hire it with maintenance, or {low} for the website only. No purchase, no commission.',
      },
    },
    fr: {
      eyebrow: 'Programme partenaires · 2026',
      title: 'Gagnez avec nous',
      intro:
        'Pour chaque client que vous nous apportez et qui commande un site, vous touchez une commission sur le prix du site. S\'il le commande avec l\'une de nos formules de maintenance, votre taux double : {high} au lieu de {low} s\'il ne veut que le site.',
      notice: {
        title: 'Pas d\'achat, pas de commission',
        text: 'Vous n\'êtes payé que lorsque le client achète l\'une de nos offres de site. Si vous nous présentez une personne intéressée qui, au final, ne commande aucune offre, aucun paiement n\'est dû.',
      },
      withMaintenanceTitle: 'Site + n\'importe quelle formule de maintenance',
      withMaintenanceBadge: 'La meilleure option',
      webOnlyTitle: 'Site seul, sans maintenance',
      rateNote: 'du prix du site (HT)',
      tableTitle: 'Ce que vous touchez par vente',
      tableNote:
        'Pour les offres au prix « à partir de », le prix final est fixé après un rendez-vous avec le client ; votre commission est calculée sur ce prix final.',
      sellTitle: 'Ce que vous vendez',
      webPlansTitle: 'Sites · paiement unique',
      maintenanceTitle: 'Maintenance · en option',
      maintenanceText:
        'Les formules incluent l\'hébergement, le domaine et le SSL, les mises à jour de sécurité, les sauvegardes et un quota de modifications par mois selon la formule.',
      sellArgument: 'Argument clé : avec n\'importe quelle formule de maintenance, le site revient au client entre {min} et {max} moins cher.',
      stepsTitle: 'Comment ça marche',
      steps: [
        {
          title: 'Enregistrez le client',
          text: 'Avant de nous le présenter, envoyez-nous par e-mail son nom, son activité et son téléphone. Nous vous confirmons l\'enregistrement par écrit.',
        },
        {
          title: 'Votre enregistrement vaut 60 jours',
          text: 'Si le client signe dans ce délai, la vente est à vous. Si deux partenaires enregistrent le même client, le premier compte.',
        },
        {
          title: 'Nous concluons la vente',
          text: 'Nous la concluons avec vous ou directement avec le client : devis, contrat et facturation sont gérés par nous.',
        },
        {
          title: 'Vous touchez votre commission',
          text: 'Vous êtes payé lorsque le client règle le second acompte de 50 % du site, à la livraison. Pour la Landing Page sans maintenance, payée à 100 % d\'avance, vous êtes payé dès ce paiement. Nous vous payons sous 15 jours maximum.',
        },
      ],
      conditionsTitle: 'Conditions de la commission',
      conditions: [
        {
          topic: 'Pas d\'achat, pas de commission',
          condition:
            'Il n\'y a de commission que si le client achète une offre de site. Nous présenter une personne intéressée qui ne commande finalement rien ne donne lieu à aucun paiement.',
        },
        {
          topic: 'Base de calcul',
          condition: 'Le prix du site HT. Pas de commission sur les mensualités de maintenance ni sur les services supplémentaires ultérieurs.',
        },
        {
          topic: 'Avec ou sans maintenance',
          condition: '{high} si le client commande le site avec n\'importe quelle formule de maintenance ; {low} s\'il commande le site seul.',
        },
        {
          topic: 'Résiliation anticipée de la maintenance',
          condition:
            'Si le client résilie la maintenance au cours des 6 premiers mois, la différence ({diff} du prix du site) est déduite de vos commissions suivantes.',
        },
        { topic: 'Ventes non encaissées', condition: 'Si le client ne règle pas la totalité ou annule le projet, aucune commission n\'est due.' },
        {
          topic: 'Clients existants',
          condition: 'Les clients qui travaillaient déjà avec nous, ou qui étaient déjà en discussion avec nous avant votre enregistrement, ne sont pas commissionnés.',
        },
        { topic: 'Facturation', condition: 'Le paiement se fait sur facture ou sur relevé de commissions, selon votre situation fiscale.' },
        { topic: 'Exclusivité', condition: 'Aucune. Vous pouvez travailler avec d\'autres entreprises et quitter le programme quand vous le souhaitez.' },
      ],
      dontPromise: {
        title: 'Ce que vous ne devez pas promettre au client',
        text: 'Des prix différents de notre grille tarifaire, des délais de livraison plus courts, des fonctionnalités absentes de l\'offre ou un référencement garanti sur Google. En cas de doute, consultez-nous avant de conclure.',
      },
      footnote:
        'Prix de lancement 2026, susceptibles d\'évoluer. Les commissions sont calculées selon le tarif en vigueur le jour où le client signe. Ces informations sont indicatives ; les conditions sont formalisées dans l\'accord de partenariat.',
      cta: {
        title: 'Vous pensez à quelqu\'un ?',
        text: 'Enregistrez-le avant de nous le présenter : envoyez-nous son nom, son activité et son téléphone, et nous vous confirmons l\'enregistrement par écrit. Rappel : il n\'y a de commission que s\'il achète une offre.',
        registerLabel: 'Enregistrer un client',
        contactLabel: 'J\'ai des questions sur le programme',
        emailSubject: 'Enregistrement client · Programme partenaires',
        emailBody: 'Bonjour, je souhaite enregistrer ce client :\n\nNom du client :\nActivité :\nTéléphone :\n\nMon nom :\nMon téléphone :',
      },
      seo: {
        title: 'Gagnez avec nous : une commission par client',
        description:
          'Recommandez-nous et touchez {high} du prix du site si le client le commande avec maintenance, ou {low} pour le site seul. Pas d\'achat, pas de commission.',
      },
    },
  },
}
