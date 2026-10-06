import type { Localized } from '../types'

type QA = { question: string; answer: string }

export const faqs: { order: number; localized: Localized<QA> }[] = [
  {
    order: 1,
    localized: {
      es: { question: '¿Cuánto tarda un proyecto?', answer: 'Depende del alcance. Una landing sencilla: 1-2 semanas. Una tienda online: 4-8 semanas. Un script de FiveM: días. Tras la primera llamada te damos un plazo concreto basado en el alcance real.' },
      en: { question: 'How long does a project take?', answer: 'It depends on the scope. A simple landing page: 1-2 weeks. An online store: 4-8 weeks. A FiveM script: days. After the first call we give you a concrete timeline based on the real scope.' },
      fr: { question: 'Combien de temps dure un projet ?', answer: 'Cela dépend du périmètre. Une landing page simple : 1 à 2 semaines. Une boutique en ligne : 4 à 8 semaines. Un script FiveM : quelques jours. Après le premier appel, nous vous donnons un délai précis basé sur le périmètre réel.' },
    },
  },
  {
    order: 2,
    localized: {
      es: { question: '¿Cuánto cuesta?', answer: 'Cada proyecto es diferente, por eso trabajamos con presupuestos personalizados. Cuéntanos tu idea y te enviamos una propuesta detallada con entregables, plazos y coste total. Sin costes ocultos.' },
      en: { question: 'How much does it cost?', answer: 'Every project is different, so we work with tailored quotes. Tell us your idea and we will send a detailed proposal with deliverables, timeline and total cost. No hidden fees.' },
      fr: { question: 'Combien ça coûte ?', answer: 'Chaque projet est différent, c’est pourquoi nous travaillons sur devis personnalisé. Partagez votre idée et nous vous enverrons une proposition détaillée avec livrables, délais et coût total. Sans frais cachés.' },
    },
  },
  {
    order: 3,
    localized: {
      es: { question: '¿Cómo es el proceso desde la primera llamada?', answer: 'Empezamos con una llamada de descubrimiento de 30-45 minutos. Después te enviamos una propuesta con entregables y precio cerrado. Con un adelanto del 30-50% arrancamos, con revisiones semanales. Tras las pruebas y ajustes finales: entrega, pago restante y, si quieres, plan de mantenimiento.' },
      en: { question: 'What happens after the first call?', answer: 'We start with a 30-45 minute discovery call. Then we send you a proposal with deliverables and a fixed price. With a 30-50% deposit we get started, with weekly reviews. After testing and final tweaks: delivery, remaining payment and, if you want, a maintenance plan.' },
      fr: { question: 'Comment se déroule le projet après le premier appel ?', answer: 'Nous commençons par un appel de découverte de 30 à 45 minutes. Nous vous envoyons ensuite une proposition avec livrables et prix fixe. Avec un acompte de 30 à 50 %, nous démarrons, avec des revues hebdomadaires. Après les tests et derniers ajustements : livraison, solde et, si vous le souhaitez, formule de maintenance.' },
    },
  },
  {
    order: 4,
    localized: {
      es: { question: '¿Cómo trabajáis si estáis en ciudades diferentes?', answer: 'Trabajamos en remoto desde Murcia, Tarancón y otros puntos de España, con coordinación diaria en tiempo real, revisiones cruzadas de código y un único punto de contacto para ti. La distancia no afecta ni a la calidad ni a los plazos.' },
      en: { question: 'How do you work from different cities?', answer: 'We work remotely from Murcia, Tarancón and other parts of Spain, with daily real-time coordination, cross code reviews and a single point of contact for you. Distance affects neither quality nor deadlines.' },
      fr: { question: 'Comment travaillez-vous depuis des villes différentes ?', answer: 'Nous travaillons à distance depuis Murcie, Tarancón et d’autres villes d’Espagne, avec une coordination quotidienne en temps réel, des revues de code croisées et un interlocuteur unique pour vous. La distance n’affecte ni la qualité ni les délais.' },
    },
  },
  {
    order: 5,
    localized: {
      es: { question: '¿Aceptáis cambios de alcance a mitad del proyecto?', answer: 'Sí, son habituales. Los gestionamos como un anexo al presupuesto inicial: te enviamos coste y plazo del cambio antes de hacerlo, y tú decides. Nada se factura sin tu aprobación.' },
      en: { question: 'Do you accept scope changes mid-project?', answer: 'Yes, they are common. We handle them as an addendum to the original quote: we send you the cost and timeline of the change before doing it, and you decide. Nothing is billed without your approval.' },
      fr: { question: 'Acceptez-vous les changements de périmètre en cours de projet ?', answer: 'Oui, c’est courant. Nous les traitons comme un avenant au devis initial : nous vous envoyons le coût et le délai du changement avant de le réaliser, et vous décidez. Rien n’est facturé sans votre accord.' },
    },
  },
  {
    order: 6,
    localized: {
      es: { question: '¿Hacéis mantenimiento después?', answer: 'Sí. Ofrecemos planes mensuales de mantenimiento (actualizaciones, copias de seguridad, monitorización) o trabajo por bolsa de horas si prefieres algo más flexible.' },
      en: { question: 'Do you offer maintenance afterwards?', answer: 'Yes. We offer monthly maintenance plans (updates, backups, monitoring) or a block of hours if you prefer something more flexible.' },
      fr: { question: 'Assurez-vous la maintenance ensuite ?', answer: 'Oui. Nous proposons des formules de maintenance mensuelle (mises à jour, sauvegardes, surveillance) ou un forfait d’heures si vous préférez plus de souplesse.' },
    },
  },
  {
    order: 7,
    localized: {
      es: { question: '¿Trabajáis con la tecnología que necesito?', answer: 'Con toda probabilidad, sí. Si no dominamos una tecnología concreta, te lo decimos con claridad antes de comprometernos. Solo aceptamos proyectos que podamos entregar con garantías.' },
      en: { question: 'Do you work with the technology I need?', answer: "Most likely, yes. If we don't master a specific technology, we tell you clearly before committing. We only take on projects we can deliver with confidence." },
      fr: { question: 'Travaillez-vous avec la technologie dont j’ai besoin ?', answer: 'Très probablement, oui. Si nous ne maîtrisons pas une technologie précise, nous vous le disons clairement avant de nous engager. Nous n’acceptons que les projets que nous pouvons livrer avec garantie.' },
    },
  },
  {
    order: 8,
    localized: {
      es: { question: '¿Quién tiene los derechos del código?', answer: 'Una vez completado el pago, todos los derechos del código a medida pasan a ti. Solo usamos una referencia general del proyecto en nuestro portfolio si nos das permiso, y respetamos cualquier NDA firmado.' },
      en: { question: 'Who owns the code?', answer: 'Once paid in full, all rights to the custom code are yours. We only mention the project in our portfolio with your permission, and we respect any signed NDA.' },
      fr: { question: 'À qui appartient le code ?', answer: 'Une fois le paiement effectué, tous les droits sur le code sur mesure vous appartiennent. Nous ne mentionnons le projet dans notre portfolio qu’avec votre accord, et nous respectons tout NDA signé.' },
    },
  },
  {
    order: 9,
    localized: {
      es: { question: '¿Firmáis NDA?', answer: 'Claro. Si tu proyecto lo requiere, firmamos antes de recibir cualquier detalle sensible.' },
      en: { question: 'Do you sign NDAs?', answer: 'Of course. If your project requires it, we sign before receiving any sensitive details.' },
      fr: { question: 'Signez-vous des NDA ?', answer: 'Bien sûr. Si votre projet l’exige, nous signons avant de recevoir le moindre détail sensible.' },
    },
  },
  {
    order: 10,
    localized: {
      es: { question: '¿En qué idiomas atendéis?', answer: 'Atendemos en español e inglés. Nuestra web está disponible en español, inglés y francés.' },
      en: { question: 'Which languages do you work in?', answer: 'We work in Spanish and English. Our website is available in Spanish, English and French.' },
      fr: { question: 'Dans quelles langues travaillez-vous ?', answer: 'Nous travaillons en espagnol et en anglais. Notre site est disponible en espagnol, en anglais et en français.' },
    },
  },
]
