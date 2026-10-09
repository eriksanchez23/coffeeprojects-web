import { lexical } from '../lexical'
import type { Localized } from '../types'

const P = (text: string) => ({ p: text })
const H = (text: string) => ({ h2: text })

// Factual description of what the site does (data, processors, cookies). Company data and decisions the
// company still has to make stay as [PENDIENTE]/[PENDING]/[EN ATTENTE] markers; while any marker remains the
// legal pages are noindex and left out of the sitemap (src/lib/legal.ts). Not legal advice: the company
// must review these texts before production.

const REVIEW_ES = P('[PENDIENTE: revisión] Borrador: la empresa debe revisar este texto antes de publicar la web en producción.')
const REVIEW_EN = P('[PENDING: review] Draft: the company must review this text before the website goes live in production.')
const REVIEW_FR = P('[EN ATTENTE : relecture] Brouillon : la société doit relire ce texte avant la mise en production du site.')

export const legal: Localized<{ legalNotice: unknown; privacyPolicy: unknown; cookiePolicy: unknown }> = {
  es: {
    legalNotice: lexical([
      REVIEW_ES,
      H('Datos identificativos'),
      P('Titular: [PENDIENTE: razón social]. NIF/CIF: [PENDIENTE]. Domicilio: [PENDIENTE]. Email: contact@coffeeprojects.es.'),
      H('Objeto'),
      P('Este sitio web informa sobre los servicios de desarrollo de software de coffeeProjects y permite solicitar presupuestos.'),
      H('Propiedad intelectual'),
      P('Los contenidos, el diseño y el código de este sitio pertenecen a su titular salvo que se indique lo contrario.'),
      H('Legislación aplicable'),
      P('Este aviso legal se rige por la legislación española (LSSI-CE).'),
    ]),
    privacyPolicy: lexical([
      REVIEW_ES,
      H('Responsable del tratamiento'),
      P('[PENDIENTE: razón social], NIF/CIF [PENDIENTE], domicilio [PENDIENTE], contact@coffeeprojects.es.'),
      H('Qué datos tratamos y para qué'),
      P('Solicitudes de presupuesto: los datos que nos envías en el formulario de contacto (nombre, email, teléfono opcional, tipo de proyecto, paquete elegido junto con el resumen de precio final y plazo estimado que te mostramos, cómo nos conociste y descripción del proyecto), junto con el idioma y la página desde la que escribes. Los usamos para responder a tu solicitud, preparar un presupuesto y enviarte un email de confirmación.'),
      P('Protección del formulario: guardamos con tu solicitud un hash (huella cifrada e irreversible) de tu dirección IP, que solo sirve para limitar el número de envíos por hora, y el formulario usa la verificación anti-spam Cloudflare Turnstile.'),
      P('Medición de anuncios, solo si aceptas las cookies de marketing: usamos Meta Pixel y la API de Conversiones de Meta para saber qué anuncios generan solicitudes. Al enviar el formulario mandamos a Meta tu email y tu teléfono cifrados con hash (SHA-256), tu dirección IP, el agente de usuario de tu navegador y los identificadores de las cookies _fbp/_fbc, y guardamos con tu solicitud la campaña de origen (parámetros UTM y fbclid). Sin ese consentimiento no se envía nada a Meta.'),
      H('Base legal'),
      P('Tu consentimiento al enviar el formulario y la aplicación de medidas precontractuales a petición tuya; tu consentimiento de cookies de marketing para la medición de anuncios (puedes retirarlo en cualquier momento); y nuestro interés legítimo en proteger el formulario frente al abuso (hash de la IP y Turnstile).'),
      H('Conservación'),
      P('Conservamos las solicitudes, incluido el hash de la IP, hasta 12 meses si no se convierten en proyecto, salvo obligación legal. [PENDIENTE: procedimiento de borrado].'),
      H('Destinatarios y encargados del tratamiento'),
      P('Vercel (alojamiento de la web y estadísticas de uso agregadas sin cookies), Neon (base de datos), Resend (envío de emails), Cloudflare (verificación anti-spam Turnstile) y, solo con tu consentimiento de marketing, Meta Platforms (medición de anuncios). Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo: [PENDIENTE: garantías de las transferencias internacionales]. No vendemos tus datos.'),
      H('Tus derechos'),
      P('Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a contact@coffeeprojects.es, y reclamar ante la Agencia Española de Protección de Datos (aepd.es).'),
    ]),
    cookiePolicy: lexical([
      REVIEW_ES,
      H('Qué son las cookies'),
      P('Pequeños archivos que el navegador guarda para que la web funcione o para medir su uso.'),
      H('Cookies necesarias'),
      P('cp_consent (6 meses): guarda tu elección de cookies. Cloudflare Turnstile: al usar el formulario de contacto se carga la verificación anti-spam de Cloudflare, que puede usar almacenamiento técnico propio para distinguir personas de bots.'),
      H('Cookies de marketing (solo con tu consentimiento)'),
      P('_fbp y _fbc (Meta Pixel, hasta 90 días): miden nuestras campañas en Facebook e Instagram. cp_attr (30 días): recuerda qué campaña te trajo (parámetros UTM y fbclid). cp_lead (10 minutos): tras enviar el formulario, evita que la misma solicitud se cuente dos veces en Meta.'),
      H('Estadísticas sin cookies'),
      P('Vercel Web Analytics y Speed Insights miden visitas y rendimiento de forma agregada, sin cookies.'),
      H('Cómo cambiar tu elección'),
      P('Pulsa «Configurar cookies» en el pie de página en cualquier momento.'),
    ]),
  },
  en: {
    legalNotice: lexical([
      REVIEW_EN,
      H('Company details'),
      P('Owner: [PENDING: legal name]. Tax ID: [PENDING]. Address: [PENDING]. Email: contact@coffeeprojects.es.'),
      H('Purpose'),
      P("This website presents coffeeProjects' software development services and lets you request quotes."),
      H('Intellectual property'),
      P('The content, design and code of this website belong to its owner unless stated otherwise.'),
      H('Applicable law'),
      P('This legal notice is governed by Spanish law (LSSI-CE).'),
    ]),
    privacyPolicy: lexical([
      REVIEW_EN,
      H('Data controller'),
      P('[PENDING: legal name], Tax ID [PENDING], address [PENDING], contact@coffeeprojects.es.'),
      H('What data we process and why'),
      P('Quote requests: the data you send through the contact form (name, email, optional phone, project type, chosen package together with the final price and estimated time summary we show you, how you found us and project description), together with the language and the page you write from. We use it to answer your request, prepare a quote and send you a confirmation email.'),
      P('Form protection: we store with your request a hash (an irreversible fingerprint) of your IP address, used only to limit the number of submissions per hour, and the form uses the Cloudflare Turnstile anti-spam check.'),
      P('Ad measurement, only if you accept marketing cookies: we use the Meta Pixel and the Meta Conversions API to learn which ads bring in requests. When you submit the form we send Meta your email and phone hashed (SHA-256), your IP address, your browser user agent and the _fbp/_fbc cookie identifiers, and we store the source campaign (UTM parameters and fbclid) with your request. Without that consent nothing is sent to Meta.'),
      H('Legal basis'),
      P('Your consent when submitting the form and pre-contractual measures taken at your request; your marketing-cookie consent for ad measurement (you can withdraw it at any time); and our legitimate interest in protecting the form against abuse (IP hash and Turnstile).'),
      H('Retention'),
      P('We keep requests, including the IP hash, for up to 12 months if they do not become a project, unless legally required otherwise. [PENDING: deletion procedure].'),
      H('Recipients and processors'),
      P('Vercel (website hosting and aggregated, cookieless usage statistics), Neon (database), Resend (email delivery), Cloudflare (Turnstile anti-spam check) and, only with your marketing consent, Meta Platforms (ad measurement). Some of these providers may process data outside the European Economic Area: [PENDING: safeguards for international transfers]. We never sell your data.'),
      H('Your rights'),
      P('You can exercise your rights of access, rectification, erasure, objection, restriction and portability by writing to contact@coffeeprojects.es, and lodge a complaint with the Spanish Data Protection Agency (aepd.es).'),
    ]),
    cookiePolicy: lexical([
      REVIEW_EN,
      H('What cookies are'),
      P('Small files your browser stores so the website works or so its use can be measured.'),
      H('Necessary cookies'),
      P("cp_consent (6 months): stores your cookie choice. Cloudflare Turnstile: when you use the contact form, Cloudflare's anti-spam check is loaded and may use its own technical storage to tell people from bots."),
      H('Marketing cookies (only with your consent)'),
      P('_fbp and _fbc (Meta Pixel, up to 90 days): measure our campaigns on Facebook and Instagram. cp_attr (30 days): remembers which campaign brought you here (UTM parameters and fbclid). cp_lead (10 minutes): after you submit the form, keeps the same request from being counted twice in Meta.'),
      H('Cookieless statistics'),
      P('Vercel Web Analytics and Speed Insights measure visits and performance in aggregate, without cookies.'),
      H('How to change your choice'),
      P('Click "Cookie settings" in the footer at any time.'),
    ]),
  },
  fr: {
    legalNotice: lexical([
      REVIEW_FR,
      H("Informations sur l'éditeur"),
      P('Éditeur : [EN ATTENTE : raison sociale]. N° fiscal : [EN ATTENTE]. Adresse : [EN ATTENTE]. E-mail : contact@coffeeprojects.es.'),
      H('Objet'),
      P('Ce site présente les services de développement logiciel de coffeeProjects et permet de demander des devis.'),
      H('Propriété intellectuelle'),
      P('Les contenus, le design et le code de ce site appartiennent à son éditeur sauf mention contraire.'),
      H('Droit applicable'),
      P('Les présentes mentions légales sont régies par le droit espagnol (LSSI-CE).'),
    ]),
    privacyPolicy: lexical([
      REVIEW_FR,
      H('Responsable du traitement'),
      P('[EN ATTENTE : raison sociale], n° fiscal [EN ATTENTE], adresse [EN ATTENTE], contact@coffeeprojects.es.'),
      H('Données traitées et finalités'),
      P('Demandes de devis : les données envoyées via le formulaire de contact (nom, e-mail, téléphone facultatif, type de projet, formule choisie avec le récapitulatif du prix final et du délai estimé que nous vous affichons, comment vous nous avez connus et description du projet), ainsi que la langue et la page depuis laquelle vous écrivez. Elles servent à répondre à votre demande, à préparer un devis et à vous envoyer un e-mail de confirmation.'),
      P('Protection du formulaire : nous conservons avec votre demande un hash (empreinte chiffrée et irréversible) de votre adresse IP, utilisé uniquement pour limiter le nombre d’envois par heure, et le formulaire utilise la vérification anti-spam Cloudflare Turnstile.'),
      P('Mesure publicitaire, uniquement si vous acceptez les cookies marketing : nous utilisons le Meta Pixel et l’API Conversions de Meta pour savoir quelles publicités génèrent des demandes. Lors de l’envoi du formulaire, nous transmettons à Meta votre e-mail et votre téléphone hachés (SHA-256), votre adresse IP, l’agent utilisateur de votre navigateur et les identifiants des cookies _fbp/_fbc, et nous conservons avec votre demande la campagne d’origine (paramètres UTM et fbclid). Sans ce consentement, rien n’est envoyé à Meta.'),
      H('Base légale'),
      P('Votre consentement lors de l’envoi du formulaire et des mesures précontractuelles prises à votre demande ; votre consentement aux cookies marketing pour la mesure publicitaire (retirable à tout moment) ; et notre intérêt légitime à protéger le formulaire contre les abus (hash de l’IP et Turnstile).'),
      H('Conservation'),
      P('Nous conservons les demandes, y compris le hash de l’IP, jusqu’à 12 mois si elles ne deviennent pas un projet, sauf obligation légale. [EN ATTENTE : procédure de suppression].'),
      H('Destinataires et sous-traitants'),
      P('Vercel (hébergement du site et statistiques d’utilisation agrégées sans cookies), Neon (base de données), Resend (envoi d’e-mails), Cloudflare (vérification anti-spam Turnstile) et, uniquement avec votre consentement marketing, Meta Platforms (mesure publicitaire). Certains de ces prestataires peuvent traiter des données hors de l’Espace économique européen : [EN ATTENTE : garanties des transferts internationaux]. Nous ne vendons jamais vos données.'),
      H('Vos droits'),
      P('Vous pouvez exercer vos droits d’accès, de rectification, d’effacement, d’opposition, de limitation et de portabilité en écrivant à contact@coffeeprojects.es, et introduire une réclamation auprès de l’autorité espagnole de protection des données (aepd.es).'),
    ]),
    cookiePolicy: lexical([
      REVIEW_FR,
      H('Que sont les cookies ?'),
      P('De petits fichiers enregistrés par votre navigateur pour faire fonctionner le site ou mesurer son utilisation.'),
      H('Cookies nécessaires'),
      P('cp_consent (6 mois) : enregistre votre choix de cookies. Cloudflare Turnstile : lorsque vous utilisez le formulaire de contact, la vérification anti-spam de Cloudflare est chargée et peut utiliser son propre stockage technique pour distinguer les personnes des robots.'),
      H('Cookies marketing (uniquement avec votre accord)'),
      P('_fbp et _fbc (Meta Pixel, jusqu’à 90 jours) : mesurent nos campagnes sur Facebook et Instagram. cp_attr (30 jours) : retient la campagne qui vous a amené ici (paramètres UTM et fbclid). cp_lead (10 minutes) : après l’envoi du formulaire, évite que la même demande soit comptée deux fois chez Meta.'),
      H('Statistiques sans cookies'),
      P('Vercel Web Analytics et Speed Insights mesurent les visites et les performances de façon agrégée, sans cookies.'),
      H('Modifier votre choix'),
      P('Cliquez sur « Gérer les cookies » en bas de page à tout moment.'),
    ]),
  },
}
