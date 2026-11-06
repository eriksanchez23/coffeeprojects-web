# Contenido del rediseño — textos en español

> Estado: **BORRADOR — pendiente de revisión por el equipo.** Fecha: 2026-11-06.
> Acompaña a `08-plan-rediseno.md`. Cuando estos textos estén aprobados se traducen a EN/FR y se meten en el seed (`src/seed/data/*`) y en `messages/*.json`.

**Cómo leer este documento**

- Los textos van tal cual se verán en la web.
- `[PENDIENTE: …]` indica un dato que solo podéis darnos vosotros. Hasta tenerlo, ese bloque **no se publica** (no se inventan cifras ni testimonios).
- `→` indica a dónde lleva un botón.
- Tono: de tú, frases cortas, beneficios concretos, sin jerga técnica en la parte comercial.

---

## 0. Elementos globales

### Cabecera

- Menú: **Servicios** (desplegable) · **Proyectos** · **Precios** · **Cómo trabajamos**
- Desplegable de Servicios:
  - **Diseño de páginas web** — Webs nuevas, de una landing a una web corporativa.
  - **Rediseño y mejora de webs** — Renovamos la web que ya tienes.
  - **Tiendas online** — Vende por internet con una tienda fácil de gestionar.
  - **Mantenimiento web** — Tu web siempre rápida, segura y al día.
- Botón: **Pide tu presupuesto** → `/contacto`

### Barra fija en móvil

- **Pide tu presupuesto** → `/contacto`

### Pie de página

- Frase de marca: **Sin café no hay código. Sin compromiso no hay proyecto.**
- Texto: Estudio de diseño y desarrollo web en España. Trabajamos en remoto con clientes de todo el mundo.
- Columnas:
  - **Servicios:** Diseño de páginas web · Rediseño y mejora de webs · Tiendas online · Mantenimiento web · Precios
  - **Otros desarrollos:** Desarrollo a medida · Bots de Discord · Scripts FiveM · Servidores FiveM
  - **Estudio:** Proyectos · Cómo trabajamos · Equipo · Programa de colaboradores · Contacto
  - **Legal:** Aviso legal · Privacidad · Cookies · Configurar cookies
- Contacto: contact@coffeeprojects.es · Respuesta en menos de 24 h

### Metadatos (SEO) de la portada

- Título: **Diseño web profesional y rediseño de webs | CoffeeProjects**
- Descripción: Creamos webs nuevas y renovamos las que ya no funcionan: rápidas, bonitas y pensadas para conseguir clientes. Precio cerrado y respuesta en 24 h.

---

## 1. Portada

### 1.1 Hero

- Antetítulo: **CoffeeProjects · Estudio de diseño y desarrollo web en España** *(el nombre de la marca se mantiene visible: logo en la cabecera + antetítulo + título de la pestaña)*
- Titular: **Webs profesionales que *consiguen clientes*.** *(aprobado; la parte en cursiva va en la tipografía serif de acento)*
- Subtítulo: Diseñamos webs nuevas y renovamos las que se han quedado atrás. Rápidas, cuidadas al detalle y pensadas para que te contacten. Precio cerrado antes de empezar.
- Botón principal: **Quiero una web nueva** → `/contacto?type=web`
- Botón secundario: **Quiero mejorar mi web** → `/contacto?type=redesign`
- Línea de confianza: Respuesta en menos de 24 h · Precio cerrado · El código es tuyo
- Visual: captura de coffeeprojects.es en marco de navegador + captura móvil de otro proyecto.

### 1.2 Franja de confianza

Cuatro garantías en línea, con icono:

1. **Precio cerrado** — Sabes lo que pagas antes de empezar.
2. **Un solo interlocutor** — Hablas siempre con la misma persona.
3. **Avances cada semana** — Ves tu web crecer y opinas a tiempo.
4. **El código es tuyo** — Sin ataduras ni permanencias ocultas.

Debajo, en pequeño: «Hemos trabajado para el **sector público**, **hostelería** y **empresas de servicios**.» `[PENDIENTE: confirmar sectores reales]`

### 1.3 Dos caminos

- Antetítulo: **Servicios**
- Título: **¿Empezamos de cero o mejoramos lo que tienes?**

**Tarjeta 1 — Web nueva**
- Título: **Quiero una web nueva**
- Texto: Para negocios que aún no tienen web o necesitan empezar de cero. Te entregamos una web lista para captar clientes, con tu dominio, adaptada al móvil y preparada para Google.
- Lista: Landing page o web corporativa · Diseño a medida, nada de plantillas genéricas · SEO básico y velocidad de carga · Textos legales incluidos
- Precio: **Desde 349 € + IVA** · Plazo: **1-2 semanas**
- Botón: **Ver diseño de páginas web** → `/servicios/webs-y-landing-pages`

**Tarjeta 2 — Mejorar mi web**
- Título: **Quiero mejorar mi web**
- Texto: Para quien ya tiene web pero no le da resultados. Analizamos qué falla y la renovamos: diseño actual, carga rápida, bien en el móvil y visible en Google.
- Lista: Revisión gratuita de tu web actual · Rediseño completo o mejoras por partes · Migración sin perder tu posicionamiento · Puedes editarla tú mismo
- Precio: **Presupuesto cerrado tras la revisión gratuita**
- Botón: **Ver rediseño de webs** → `/servicios/rediseno-web`

Debajo, enlaces pequeños: **Tiendas online** desde 1.490 € + IVA · **Mantenimiento** desde 25 €/mes + IVA

### 1.4 ¿Tu web te está costando clientes?

- Antetítulo: **Revisión gratuita**
- Título: **¿Tu web te está costando clientes?**
- Texto: Si te reconoces en alguno de estos puntos, tu web está perdiendo visitas que podrían ser clientes.
- Lista de síntomas:
  - Tarda más de 3 segundos en cargar.
  - En el móvil se ve mal o hay que hacer zoom.
  - No apareces en Google cuando te buscan.
  - El diseño se ha quedado anticuado.
  - Para cambiar un texto tienes que llamar a alguien.
  - Recibes visitas, pero nadie te contacta.
- Bloque de oferta:
  - Título: **Te la revisamos gratis**
  - Texto: Déjanos la dirección de tu web y en un máximo de 48 h te enviamos un informe breve con lo que falla y cómo arreglarlo. Sin compromiso.
  - Campo: **Dirección de tu web** (placeholder: `https://tuweb.com`)
  - Campo: **Tu email**
  - Botón: **Quiero mi revisión gratuita**
  - Nota: Solo usamos tu email para enviarte el informe. `[enlace a Privacidad]`

> Compromiso operativo confirmado: el equipo envía el informe en un máximo de 48 h.

### 1.5 Proyectos destacados

- Antetítulo: **Proyectos**
- Título: **Trabajo real, resultados concretos**
- Texto: Una selección de webs que hemos diseñado, desarrollado o renovado.
- Tarjetas (ver textos completos en §6):
  1. **Portal web institucional** — Ayuntamiento · Rediseño
  2. **coffeeprojects.es** — Web corporativa · Web nueva
  3. **Noore Lounge** — Ocio y hostelería · San Javier
  4. **Don Panini** — Restauración · Cartagena
- Botón: **Ver todos los proyectos** → `/proyectos`

### 1.6 Cómo trabajamos

- Antetítulo: **Proceso**
- Título: **De la primera llamada a tu web publicada**
1. **Hablamos** — Una llamada de 30-45 minutos para entender tu negocio, tus clientes y lo que necesitas de tu web.
2. **Propuesta cerrada** — Te enviamos qué incluye, el plazo y el precio total. Sin letra pequeña. Tú decides.
3. **Diseño y desarrollo** — Con un adelanto del 30-50 % arrancamos. Cada semana ves los avances y nos das tu opinión.
4. **Pruebas y ajustes** — Revisamos la web en ordenador, tablet y móvil y pulimos cada detalle contigo.
5. **Publicación** — La ponemos en marcha, te enseñamos a gestionarla y, si quieres, seguimos cuidándola.

### 1.7 Precios (resumen)

- Antetítulo: **Precios**
- Título: **Precios claros desde el primer día**
- Texto: Elige tu web y, si quieres, un plan de mantenimiento que la abarata. Todos los precios + IVA.
- Tres tarjetas destacadas: **Landing Page** (desde 349 €) · **Web Corporativa** (desde 890 €) · **Tienda Online** (desde 1.490 €)
- Botón: **Ver todos los precios** → `/precios`

*(Los precios exactos salen del panel, Contenido → Precios; no se tocan.)*

### 1.8 Por qué nosotros

- Antetítulo: **Por qué CoffeeProjects**
- Título: **Lo que nos piden nuestros clientes, por escrito**
1. **Un único punto de contacto** — Hablas siempre con la misma persona, desde la primera llamada hasta la entrega.
2. **Precio cerrado** — Propuesta con entregables, plazos y coste total antes de empezar. Sin sorpresas.
3. **Avances cada semana** — Revisiones semanales para que veas tu web crecer y puedas opinar a tiempo.
4. **El código es tuyo** — Al completar el pago, todos los derechos de tu web pasan a ti.
5. **Confidencialidad** — Firmamos un acuerdo de confidencialidad (NDA) si tu proyecto lo necesita.
6. **No desaparecemos** — Planes de mantenimiento para que tu web siga rápida, segura y actualizada.

### 1.9 Testimonios

- Título: **Lo que dicen de nosotros**
- `[PENDIENTE: testimonios reales con nombre, cargo/empresa y permiso. Sin testimonios, la sección no se muestra.]`

### 1.10 Preguntas frecuentes (portada)

Solo preguntas de webs. Las de FiveM salen de aquí.

1. **¿Cuánto tarda una web?** — Una landing page suele estar lista en 1-2 semanas; una web corporativa, en 2-4; una tienda online, en 4-8. Tras la primera llamada te damos un plazo concreto. `[PENDIENTE: confirmar 2-4 semanas para corporativa]`
2. **¿Cuánto cuesta?** — Tienes los precios orientativos en nuestra página de precios. Para proyectos especiales te enviamos una propuesta cerrada con entregables, plazos y coste total. Sin costes ocultos.
3. **Ya tengo web. ¿Hay que hacerla de cero?** — No siempre. Primero la revisamos gratis y te decimos si conviene mejorarla por partes o rehacerla. Te recomendamos lo que tenga más sentido para tu negocio, no lo más caro.
4. **¿Perderé mi posición en Google si cambio de web?** — No, si se hace bien. Mantenemos tus direcciones o las redirigimos, conservamos lo que ya funciona y lo comprobamos tras publicar.
5. **¿Podré cambiar los textos y fotos yo mismo?** — Sí. Si lo necesitas, tu web incluye un panel sencillo para editar textos, imágenes y precios sin tocar código.
6. **¿Os encargáis del dominio y el hosting?** — Sí. Con cualquier plan de mantenimiento, el hosting, el dominio y el certificado SSL están incluidos.
7. **¿Hacéis mantenimiento después?** — Sí. Tenemos planes mensuales desde 25 € + IVA con actualizaciones, copias de seguridad y cambios incluidos.
8. **¿Quién es el dueño de la web?** — Tú. Al completar el pago, todos los derechos de tu web son tuyos.

### 1.11 CTA final (sección oscura)

- Título: **¿Hablamos de tu web?**
- Texto: Cuéntanos qué necesitas y te respondemos en menos de 24 h con una primera propuesta. Sin compromiso.
- Botón principal: **Pide tu presupuesto** → `/contacto`
- Botón secundario: **Escríbenos un email** → `mailto:contact@coffeeprojects.es`

---

## 2. Servicios principales

### 2.0 Página índice `/servicios`

- Título (H1): **Servicios de diseño y desarrollo web**
- Texto: Todo lo que necesitas para tener una web que funcione: desde crearla de cero hasta renovarla y mantenerla.
- Cuatro tarjetas (orden): Diseño de páginas web · Rediseño y mejora de webs · Tiendas online · Mantenimiento web
- Bloque final pequeño:
  - **¿Necesitas otro tipo de desarrollo?** También hacemos desarrollo a medida, automatizaciones y bots. → **Ver otros desarrollos** (`/otros-desarrollos`)
- SEO: título «Servicios de diseño web, rediseño y tiendas online» · descripción «Diseño de páginas web, rediseño de webs, tiendas online y mantenimiento. Precio cerrado, respuesta en 24 h y el código es tuyo.»

### 2.1 Diseño de páginas web — `/servicios/webs-y-landing-pages`

- Nombre en tarjetas y menú: **Diseño de páginas web** *(antes «Webs & landing pages»)*
- Titular de la landing: **Una web profesional que trabaja por tu negocio.**
- Resumen: Diseñamos y desarrollamos tu web desde cero: landing page, web corporativa o web profesional con panel propio. Rápida, adaptada al móvil y preparada para aparecer en Google.
- Qué incluye:
  - Diseño a medida de tu marca, sin plantillas genéricas
  - Adaptada a móvil, tablet y ordenador
  - Carga rápida y SEO técnico desde el primer día
  - Formulario de contacto y botón de WhatsApp
  - Alta de tu ficha de Google Business Profile
  - Textos legales (aviso legal, privacidad y cookies)
  - Panel para editar textos e imágenes (según plan)
- Precio: **Desde 349 € + IVA** · Plazo: **1-2 semanas**
- Nota: Mantenimiento opcional desde 25 €/mes + IVA: con cualquier plan, la web sale más barata.
- Preguntas:
  - **¿Cuánto tarda una web?** — Una landing sencilla suele estar lista en 1-2 semanas. Tras la primera llamada te damos un plazo concreto según el alcance real.
  - **¿Podré editar los textos yo mismo?** — Sí. Si lo necesitas, incluimos un panel de gestión para que cambies textos e imágenes sin tocar código.
  - **¿Usáis plantillas?** — No. Cada web se diseña para tu marca y tus clientes. Por eso se ve distinta a la de tu competencia.
- SEO: título «Diseño de páginas web profesionales» · descripción «Webs y landing pages a medida, rápidas y preparadas para Google. Desde 349 € + IVA, listas en 1-2 semanas.»

### 2.2 Rediseño y mejora de webs — `/servicios/rediseno-web` (NUEVA)

- Nombre: **Rediseño y mejora de webs**
- Titular de la landing: **Tu web actual, renovada y trayendo clientes.**
- Resumen: Si tu web está anticuada, es lenta o no te trae contactos, la renovamos. Empezamos con una revisión gratuita y te proponemos lo que de verdad necesita: desde mejoras puntuales hasta un rediseño completo.
- Bloque «Qué mejoramos»:
  - **Diseño** — Una imagen actual que transmita la confianza que merece tu negocio.
  - **Velocidad** — Webs que cargan en segundos, también con mala cobertura.
  - **Móvil** — Que se vea y funcione perfecta en cualquier pantalla.
  - **Google** — Estructura, contenidos y SEO técnico para que te encuentren.
  - **Conversión** — Llamadas a la acción claras para que la visita te contacte.
  - **Autonomía** — Un panel para que puedas cambiar textos y fotos tú mismo.
- Bloque «Cómo lo hacemos»:
  1. **Revisión gratuita** — Analizamos tu web y te enviamos un informe con lo que falla.
  2. **Propuesta** — Mejoras por partes o rediseño completo, con precio cerrado.
  3. **Renovación** — Trabajamos sin que tu web deje de funcionar.
  4. **Migración segura** — Conservamos tus direcciones y tu posicionamiento en Google.
  5. **Comparativa** — Te mostramos el antes y el después con datos.
- Precio: **Presupuesto cerrado tras la revisión gratuita** (sin «desde»; en el panel: modo de precio «a medida»)
- Plazo: **Revisión en 48 h · renovación según el alcance**
- Caso destacado: **Portal web institucional** (ver §6.1)
- CTA: **Pide tu revisión gratuita** → `/contacto?type=audit`
- Preguntas:
  - **¿Tengo que rehacer la web entera?** — No siempre. Muchas veces con mejoras concretas (velocidad, móvil, textos) basta. Te lo decimos con sinceridad tras revisarla.
  - **¿Funciona con WordPress, Wix u otras plataformas?** — Sí. Revisamos cualquier web. Según el caso, la mejoramos en su plataforma o te proponemos migrarla a una más rápida y fácil de mantener.
  - **¿Perderé mi posición en Google?** — No, si se hace bien. Mantenemos o redirigimos tus direcciones y comprobamos el posicionamiento después de publicar.
  - **¿La web estará caída mientras trabajáis?** — No. Trabajamos en una copia y solo cambiamos la web cuando la nueva está aprobada.
- SEO: título «Rediseño web y mejora de páginas web» · descripción «Renovamos tu web: diseño actual, carga rápida, adaptada al móvil y visible en Google. Revisión gratuita y precio cerrado.»

### 2.3 Tiendas online — `/servicios/tiendas-online`

- Titular: **Vende por internet con una tienda segura y fácil de gestionar.**
- Resumen: Tienda online con catálogo, carrito y pagos con tarjeta o PayPal, y un panel sencillo para gestionar productos, pedidos y stock. Shopify, WooCommerce o a medida, según lo que más te convenga.
- Qué incluye: Catálogo y carrito · Pagos con tarjeta (Stripe) y PayPal · Gestión de stock y pedidos · Panel de administración · Textos legales de venta online
- Precio: **Desde 1.490 € + IVA** · Plazo: **4-8 semanas**
- Nota: Integración con tu logística y CRM.
- Preguntas: *(se mantienen las actuales)*
- SEO: título «Diseño de tiendas online» · descripción «Tiendas online seguras y rápidas con pagos con tarjeta y PayPal, gestión de stock y panel propio. Desde 1.490 € + IVA.»

### 2.4 Mantenimiento web — `/servicios/mantenimiento-web`

- Nombre: **Mantenimiento web** *(antes «Mantenimiento web mensual»)*
- Titular: **Tu web siempre rápida, segura y al día. La hayamos hecho nosotros o no.**
- Resumen y lista: *(se mantienen los actuales)*
- Precio: **Desde 25 €/mes + IVA**
- Nota: Para webs hechas por nosotros o por terceros. Revisión inicial incluida.

---

## 3. Otros desarrollos — `/otros-desarrollos` (NUEVA)

- Título (H1): **Otros desarrollos**
- Texto: Además de webs, desarrollamos software a medida y proyectos para comunidades online. Mismo equipo, mismo compromiso con el trabajo bien hecho.
- Tarjetas (diseño sobrio, sin precios grandes; precio pequeño debajo):
  1. **Desarrollo a medida** — Automatizaciones, integraciones de API, paneles internos y herramientas para tu negocio. · A medida
  2. **Bots de Discord** — Verificación, moderación, tickets e integraciones para tu comunidad. · Desde 120 €
  3. **Scripts FiveM** — Recursos optimizados para servidores de roleplay (ESX y QBCore). · Ver tienda
  4. **Servidores FiveM** — Servidor completo, configurado y listo para tu comunidad. · Desde 800 €
- CTA: **Cuéntanos tu proyecto** → `/contacto?type=custom`
- SEO: título «Desarrollo a medida, bots de Discord y FiveM» · descripción «Software a medida, automatizaciones, bots de Discord y desarrollo para FiveM. Mismo equipo y precio cerrado.»

Las páginas de cada uno mantienen URL y textos actuales; solo cambia el diseño y la miga de pan (Inicio › Otros desarrollos › …).

---

## 4. Precios — `/precios` (antes `/presupuestos`)

- Se mantiene **todo el contenido v4** (planes, mantenimiento, servicios extra, reglas).
- Cambian solo:
  - Título (H1): **Precios de diseño web** *(antes «Tarifas web»)*
  - Subtítulo: Precios claros, sin sorpresas. Elige tu web y, si quieres, un plan de mantenimiento que la abarata. Todos los precios + IVA.
  - Nuevo bloque al final: **¿Ya tienes web?** Te la revisamos gratis y te decimos qué mejorar. → **Pide tu revisión gratuita**

---

## 5. Cómo trabajamos / Equipo — `/equipo`

- Nombre en el menú: **Cómo trabajamos**
- Título (H1): **Un equipo pequeño, un trabajo cuidado**
- Texto: Somos un estudio de desarrollo web de España. Trabajamos en remoto, coordinados cada día, con revisiones cruzadas y un único interlocutor para ti. Preferimos pocos proyectos bien hechos a muchos a medias.
- Bloques: **Proceso** (los 5 pasos de §1.6) · **Equipo** · **Por qué nosotros** (resumen)
- Fichas del equipo (sin estadísticas de GitHub):
  - **Erik** — *Diseño y atención al cliente* · Murcia
    Tu primer contacto con CoffeeProjects. Convierte tus ideas en diseños claros y se asegura de que el resultado final sea exactamente lo que necesitas.
  - **Diego** — *Desarrollo web e interfaces* · Tarancón (Cuenca)
    Construye webs rápidas, accesibles y pensadas para convertir visitas en clientes. Ha participado en el rediseño de un portal institucional y en coffeeprojects.es.
  - **Juan** — *Sistemas y desarrollo a medida* · España
    Se encarga de que todo funcione por detrás: formularios, pagos, integraciones y servidores estables y rápidos. *(se quita «Más de 50 scripts FiveM» de la ficha corta; se mantiene en su perfil completo)*
- Firma de marca al final: **Sin café no hay código. Sin compromiso no hay proyecto.**

`[PENDIENTE: fotos del equipo. Sin foto, se usa la inicial sobre fondo café.]`

---

## 6. Proyectos y casos de estudio

Estructura de cada caso: **Sector · Tipo · Año** → **El reto** → **Qué hicimos** → **Resultados** → **Antes / después** → **Tecnologías** (al final, en pequeño).

### 6.1 Portal web institucional (bajo NDA)

- Sector: **Administración pública** · Tipo: **Rediseño** · Año: **2025**
- Resumen: Rediseño y mejora de rendimiento de la web de un ayuntamiento.
- El reto: La web era lenta, difícil de usar en el móvil y poco accesible, y los vecinos no encontraban la información.
- Qué hicimos: Nueva estructura de navegación, diseño actual y accesible, optimización de imágenes y código, y adaptación completa a móvil.
- Resultados: `[PENDIENTE: datos reales — p. ej. tiempo de carga antes/después, puntuación de Lighthouse, accesibilidad. Si no hay datos, se describen sin cifras.]`
- Antes / después: `[PENDIENTE: capturas, solo si el NDA lo permite; si no, capturas difuminadas o sin imagen]`
- Nota visible: Por confidencialidad no mostramos el nombre del cliente ni enlaces.

### 6.2 coffeeprojects.es

- Sector: **Servicios digitales** · Tipo: **Web nueva** · Año: **2026**
- Resumen: Nuestra propia web, diseñada y desarrollada desde cero.
- El reto: Una web trilingüe, rápida y fácil de gestionar por todo el equipo, con formulario seguro y bandeja de solicitudes.
- Qué hicimos: Diseño a medida, panel de gestión en tres idiomas, formulario con protección antispam y respuestas desde el panel, SEO técnico y textos legales.
- Resultados: Lighthouse móvil: Accesibilidad 100 · Buenas prácticas 100 · SEO 100 *(medición del 2026-10-10; se actualizará tras el rediseño)*
- Enlace: **Ver web** → https://coffeeprojects.es

### 6.3 ¿Qué comemos hoy? · 6.4 Trading Journal

- Se mantienen en `/proyectos` con la categoría **Aplicaciones web**, pero **no** se destacan en la portada (no son webs para negocios).

### 6.5 Noore Lounge (San Javier)

Datos públicos encontrados: local de ocio en San Javier (Murcia), Av. de San Pedro del Pinatar, 54, junto a Salón Orenes. Ya tiene web propia (noorelounge.es). En Vercel existe el proyecto `noore-club`.

- Sector: **Ocio y hostelería** · Tipo: **`[PENDIENTE: ¿web nueva o rediseño de noorelounge.es?]`** · Año: **2026**
- Resumen: Web para un lounge de San Javier, pensada para mostrar el ambiente del local y facilitar reservas y contacto desde el móvil.
- El reto: Transmitir la experiencia del local en pocos segundos y convertir las visitas desde Instagram y Google en reservas.
- Qué hicimos: Diseño a medida centrado en la imagen, carta y horarios fáciles de consultar, botón de contacto/reserva siempre visible y SEO local para San Javier y el Mar Menor.
- Resultados: `[sin cifras hasta tener datos]`
- Visual: capturas del proyecto `noore-club` de Vercel (ver nota de capturas abajo).

### 6.6 Don Panini (Cartagena)

Datos públicos encontrados: cadena de comida rápida de Cartagena (paninis, bocadillos, hamburguesas, tacos) con locales en C/ Floridablanca 53, C/ del Carmen 78 y Los Dolores; presente en Just Eat. En Vercel existe el proyecto `don-panini-prototipo`.

- Sector: **Restauración** · Tipo: **`[PENDIENTE: ¿web nueva entregada o propuesta/prototipo?]`** · Año: **2026**
- Resumen: Web para una cadena de paninis y bocadillos de Cartagena con varios locales.
- El reto: Que el cliente encuentre en segundos la carta, el local más cercano y cómo pedir.
- Qué hicimos: Carta digital clara y apetecible, fichas de cada local con mapa y horario, acceso directo a pedido a domicilio y diseño pensado para el móvil.
- Resultados: `[sin cifras hasta tener datos]`

> **Importante (honestidad del portfolio):** si alguno de estos dos proyectos es un **prototipo que no se ha llegado a entregar o publicar**, se muestra con la etiqueta **«Propuesta de diseño»** en lugar de presentarlo como cliente. Si es un cliente real, conviene confirmar que podemos usar su nombre.

### Nota sobre capturas

No hay capturas propias. Plan: obtener el código de los despliegues `noore-club` y `don-panini-prototipo` desde Vercel, levantarlos en local y sacar capturas limpias (escritorio y móvil) con Playwright, más capturas de coffeeprojects.es. Se montan en marcos de navegador/móvil para el hero y las tarjetas. El portal institucional, sin capturas (NDA).

### 6.7 Página `/proyectos`

- Título (H1): **Proyectos**
- Texto: Webs que hemos creado o renovado. Algunas están bajo acuerdo de confidencialidad, por eso no mostramos el nombre del cliente.
- Filtros: **Todos** · **Webs nuevas** · **Rediseños** · **Tiendas online** · **Aplicaciones web**

---

## 7. Contacto — `/contacto`

- Título (H1): **Cuéntanos qué necesitas**
- Texto: Te respondemos en menos de 24 h con una primera propuesta. Sin compromiso.

**Paso 1 — ¿Qué necesitas?** (tres tarjetas)
1. **Una web nueva** — Empezar de cero con una web profesional.
2. **Mejorar mi web actual** — Rediseño, velocidad, móvil o Google.
3. **Otro proyecto** — Tienda online, mantenimiento, desarrollo a medida, bots o FiveM.

**Paso 2 — según la opción**
- *Web nueva:* plan que te interesa (opcional) · plazo · presupuesto aproximado · cuéntanos tu proyecto
- *Mejorar mi web:* **dirección de tu web actual** (obligatoria) · ¿qué te falla? (casillas: Es lenta · Se ve mal en el móvil · No salgo en Google · Diseño anticuado · No puedo editarla · No me trae clientes · Otro) · cuéntanos más
- *Otro proyecto:* tipo (desplegable) · presupuesto · plazo · mensaje

**Paso 3 — Tus datos:** nombre · email · teléfono (opcional) · ¿cómo nos has conocido? · consentimiento

- Botón: **Enviar solicitud**
- Debajo: Respuesta en menos de 24 h · Tus datos no se ceden a terceros

### Página de gracias

- Título: **¡Recibido! Te respondemos en menos de 24 h.**
- Texto: Te hemos enviado una copia a tu email. Mientras tanto, puedes ver algunos de nuestros proyectos.
- Botón: **Ver proyectos**

### Email de confirmación al cliente (asunto)

- Web nueva / otros: **Hemos recibido tu solicitud — CoffeeProjects**
- Mejorar mi web: **Hemos recibido tu web: te enviamos la revisión en 48 h**

---

## 8. Programa de colaboradores — `/colaboradores` (antes `/gana-dinero`)

- Nombre en el pie: **Programa de colaboradores** *(antes «Gana dinero con nosotros»)*
- Contenido: el actual, sin cambios.

---

## 9. Página 404

- Título: **Esta página no existe**
- Texto: Puede que la dirección haya cambiado o que el enlace esté mal escrito.
- Botones: **Volver al inicio** · **Ver servicios**

---

## 10. Resumen de pendientes para el equipo

### Resueltos (2026-11-06)

| # | Decisión |
|---|----------|
| P1 | Titular aprobado; se mantiene «CoffeeProjects» visible como marca |
| P2 | Rediseño: **presupuesto cerrado tras la revisión gratuita**, sin «desde» |
| P3 | Revisión gratuita en **48 h** |
| P10 | URLs `/precios` y `/colaboradores` aprobadas, con 301 desde las antiguas |
| — | Sin capturas propias: se generan a partir de los proyectos (ver nota de capturas en §6) |

### Pendientes

| # | Qué necesitamos | Dónde se usa |
|---|-----------------|--------------|
| P4 | Sectores reales de clientes (propuesta: sector público, ocio y hostelería, restauración) | Franja de confianza |
| P5 | Datos del portal institucional (tiempos de carga, etc.), si los hay | Caso destacado |
| P6 | Noore y Don Panini: ¿clientes reales o propuestas? ¿Noore fue rediseño de noorelounge.es? | Proyectos |
| P7 | Testimonios reales (si Noore o Don Panini pueden dar uno, ideal) | Sección testimonios |
| P8 | Fotos del equipo (si no, iniciales) | Equipo |
| P9 | Plazo típico de una web corporativa (¿2-4 semanas?) | FAQ |
