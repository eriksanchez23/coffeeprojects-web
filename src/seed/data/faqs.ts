import type { Localized } from '../types'

type QA = { question: string; answer: string }

/** Website-focused FAQ (home page and service fallback). Order is the seed's match key. */
export const faqs: { order: number; localized: Localized<QA> }[] = [
  {
    order: 1,
    localized: {
      es: { question: '¿Cuánto tarda una web?', answer: 'Una landing page suele estar lista en 1-2 semanas y una tienda online en 4-8 semanas. Tras la primera llamada te damos un plazo concreto según el alcance real de tu proyecto.' },
      en: { question: 'How long does a website take?', answer: 'A landing page is usually ready in 1-2 weeks and an online store in 4-8 weeks. After the first call we give you a concrete timeline based on the real scope of your project.' },
      fr: { question: 'Combien de temps faut-il pour un site ?', answer: 'Une landing page est généralement prête en 1 à 2 semaines et une boutique en ligne en 4 à 8 semaines. Après le premier appel, nous vous donnons un délai précis selon le périmètre réel.' },
    },
  },
  {
    order: 2,
    localized: {
      es: { question: '¿Cuánto cuesta?', answer: 'Tienes los precios orientativos en nuestra página de precios. Para proyectos especiales te enviamos una propuesta cerrada con entregables, plazos y coste total. Sin costes ocultos.' },
      en: { question: 'How much does it cost?', answer: 'You will find guide prices on our pricing page. For special projects we send you a fixed proposal with deliverables, timeline and total cost. No hidden fees.' },
      fr: { question: 'Combien ça coûte ?', answer: 'Vous trouverez des prix indicatifs sur notre page de tarifs. Pour les projets particuliers, nous vous envoyons une proposition fixe avec livrables, délais et coût total. Sans frais cachés.' },
    },
  },
  {
    order: 3,
    localized: {
      es: { question: 'Ya tengo web. ¿Hay que hacerla de cero?', answer: 'No siempre. Primero la revisamos gratis y te decimos si conviene mejorarla por partes o rehacerla. Te recomendamos lo que tenga más sentido para tu negocio, no lo más caro.' },
      en: { question: 'I already have a website. Does it have to be rebuilt?', answer: 'Not always. First we review it for free and tell you whether it is better to improve it step by step or rebuild it. We recommend what makes most sense for your business, not the most expensive option.' },
      fr: { question: "J'ai déjà un site. Faut-il le refaire ?", answer: "Pas toujours. Nous l'auditons d'abord gratuitement et vous disons s'il vaut mieux l'améliorer par étapes ou le refaire. Nous recommandons ce qui a le plus de sens pour votre entreprise, pas le plus cher." },
    },
  },
  {
    order: 4,
    localized: {
      es: { question: '¿Perderé mi posición en Google si cambio de web?', answer: 'No, si se hace bien. Mantenemos tus direcciones o las redirigimos, conservamos lo que ya funciona y lo comprobamos tras publicar.' },
      en: { question: 'Will I lose my Google ranking if I change websites?', answer: 'Not if it is done right. We keep your addresses or redirect them, preserve what already works and check it after launch.' },
      fr: { question: 'Vais-je perdre mon référencement Google en changeant de site ?', answer: "Non, si c'est bien fait. Nous conservons vos adresses ou les redirigeons, gardons ce qui fonctionne déjà et vérifions après la mise en ligne." },
    },
  },
  {
    order: 5,
    localized: {
      es: { question: '¿Podré cambiar los textos y fotos yo mismo?', answer: 'Sí. Si lo necesitas, tu web incluye un panel sencillo para editar textos, imágenes y precios sin tocar código.' },
      en: { question: 'Can I change the text and photos myself?', answer: 'Yes. If you need it, your website includes a simple panel to edit text, images and prices without touching code.' },
      fr: { question: 'Pourrai-je modifier les textes et les photos moi-même ?', answer: 'Oui. Si besoin, votre site inclut un panneau simple pour modifier textes, images et prix sans toucher au code.' },
    },
  },
  {
    order: 6,
    localized: {
      es: { question: '¿Os encargáis del dominio y el hosting?', answer: 'Sí. Con cualquier plan de mantenimiento, el hosting, el dominio y el certificado SSL están incluidos.' },
      en: { question: 'Do you take care of the domain and hosting?', answer: 'Yes. With any maintenance plan, hosting, the domain and the SSL certificate are included.' },
      fr: { question: "Vous occupez-vous du nom de domaine et de l'hébergement ?", answer: "Oui. Avec n'importe quelle formule de maintenance, l'hébergement, le nom de domaine et le certificat SSL sont inclus." },
    },
  },
  {
    order: 7,
    localized: {
      es: { question: '¿Hacéis mantenimiento después?', answer: 'Sí. Tenemos planes mensuales desde 25 € + IVA con actualizaciones, copias de seguridad y cambios incluidos.' },
      en: { question: 'Do you offer maintenance afterwards?', answer: 'Yes. We have monthly plans from €25 + VAT with updates, backups and changes included.' },
      fr: { question: 'Assurez-vous la maintenance ensuite ?', answer: 'Oui. Nous proposons des formules mensuelles à partir de 25 € + TVA avec mises à jour, sauvegardes et modifications incluses.' },
    },
  },
  {
    order: 8,
    localized: {
      es: { question: '¿Quién es el dueño de la web?', answer: 'Tú. Al completar el pago, todos los derechos de tu web son tuyos. Si tu proyecto lo requiere, firmamos un acuerdo de confidencialidad antes de recibir cualquier dato sensible.' },
      en: { question: 'Who owns the website?', answer: 'You do. Once paid in full, all rights to your website are yours. If your project requires it, we sign a confidentiality agreement before receiving any sensitive information.' },
      fr: { question: 'À qui appartient le site ?', answer: "À vous. Une fois le paiement effectué, tous les droits sur votre site vous appartiennent. Si votre projet l'exige, nous signons un accord de confidentialité avant de recevoir la moindre information sensible." },
    },
  },
]
