# Plan de reestructuración — CoffeeProjects centrado en webs profesionales

> Estado: **BORRADOR — pendiente de validación por Erik.** No se toca código hasta que este plan esté aprobado.
> Fecha: 2026-11-06 · Rama de trabajo prevista: `rediseno-webs`

---

## 1. Objetivo

Convertir coffeeprojects.es en la web de un **estudio de desarrollo web profesional** para dos tipos de cliente:

1. **Quien necesita una web nueva** (negocio local, pyme, profesional, institución).
2. **Quien ya tiene web y quiere mejorarla o rehacerla** (lenta, anticuada, no aparece en Google, no funciona bien en móvil, no le trae clientes).

Los scripts de FiveM, bots de Discord y desarrollos a medida **se mantienen**, pero como línea secundaria: fuera de la portada y de la navegación principal.

**Qué debe sentir el visitante en 5 segundos:** «Esta gente hace webs serias, se ve cuidado, sé cuánto me va a costar y sé cómo contactarles».

### Criterios de éxito

| # | Criterio | Cómo se mide |
|---|----------|--------------|
| C1 | La portada solo habla de webs (nuevas, rediseño, tiendas, mantenimiento) | Revisión manual: ninguna mención a FiveM/Discord/Roblox en la home ni en el menú principal |
| C2 | Imagen sobria y profesional | Validación del equipo sobre la preview de Vercel |
| C3 | Camino claro para «mejorar mi web» | Existe servicio, landing y opción en el formulario con campo «URL de tu web actual» |
| C4 | No se pierde nada técnico | Lighthouse móvil ≥ 95 en las 4 categorías, axe sin errores graves, tests verdes |
| C5 | No se pierde SEO | Las URLs actuales siguen funcionando (o redirigen con 301) |

---

## 2. Diagnóstico de la web actual

Basado en el código del repo (`main`):

| Problema | Dónde | Por qué resta seriedad |
|----------|-------|------------------------|
| Los 7 servicios tienen el mismo peso: webs, tiendas, scripts FiveM, servidores FiveM, bots Discord, mantenimiento, a medida | `ServicesGrid` en la home, `/servicios` | Un cliente que busca una web corporativa ve «Servidores FiveM llave en mano» al mismo nivel. Parece un estudio de gaming |
| Cifras de portada: «50+ scripts FiveM publicados» | `StatsBento` (`home.stats`) | Es lo primero que se ve tras el hero y refuerza la imagen gamer |
| Lenguaje de terminal: `brew --team`, `// servicios`, `// proceso`, tipografía mono, cursor glow | `TerminalLine`, `messages/*.json → sections`, `cursor-glow.tsx` | Guiño para desarrolladores; el cliente de una pyme no lo entiende y lo percibe como poco formal |
| Hero con taza de café 3D y titular «Sin café no hay código. Sin compromiso no hay proyecto.» | `hero.tsx`, `hero-scene.tsx`, `home.hero` | El titular no dice qué hacéis ni para quién. El 3D pesa (Performance 92 en móvil) y no muestra trabajo real |
| Fondo casi negro + ámbar + grano de película + brillos | `globals.css` (`grain`, `steam-glow`) | Estética «dev/gaming». No es oscuro *per se*, es la combinación |
| Marquesina con 20 tecnologías (Lua, FiveM, C#, Kotlin…) | `StackMarquee` | Jerga irrelevante para el cliente; mezcla de nuevo FiveM con webs |
| No existe un servicio de **rediseño / mejora de webs** | `seed/data/services.ts` | Es justo la mitad del público objetivo y no tiene página ni opción en el formulario |
| Menú: «Presupuestos» lleva a precios; «Gana dinero con nosotros» en el menú móvil | `site-header.tsx`, `mobile-menu` | Etiquetas confusas o poco serias |
| Equipo con estadísticas de GitHub | `team/[slug]` | Los repos públicos son mayoritariamente FiveM/personales |

Lo que **sí** está bien y se mantiene: arquitectura (Next.js + Payload), panel, formulario con Turnstile, emails, precios v4, SEO técnico, trilingüe, accesibilidad, tests.

---

## 3. Decisión de diseño: de «Espresso Terminal» a «Café claro»

### 3.1 ¿Modo oscuro o claro?

El oscuro no es poco profesional en sí (Linear, Vercel o Stripe lo usan), pero en esas marcas el cliente es técnico. **Vuestro cliente es una pyme, un negocio local o una institución**, y en ese mercado una web clara, con mucho aire, fotos de trabajos reales y textos directos transmite más confianza.

**Recomendación: base clara cálida, con el café como color de marca y secciones oscuras puntuales para dar ritmo** (CTA final, pie de página).

### 3.2 Paleta propuesta (contrastes WCAG verificados)

| Token | Color | Uso | Contraste |
|-------|-------|-----|-----------|
| `bg` | `#FBF8F3` papel crema | Fondo general | — |
| `surface` | `#FFFFFF` | Tarjetas | — |
| `surface-2` | `#F3EDE4` | Secciones alternas | — |
| `line` | `#E7DED2` | Bordes, divisores | — |
| `ink-0` | `#1A1411` espresso | Titulares | 17,2 : 1 |
| `ink-1` | `#3D332C` | Texto | 11,6 : 1 |
| `ink-2` | `#6B5D52` | Texto secundario | 6,0 : 1 (AA) |
| `brand` | `#6F4E37` café | Botones principales, enlaces | 7,0 : 1; texto blanco encima 7,4 : 1 |
| `accent` | `#9A5B1E` caramelo | Detalles, cifras, iconos | 5,1 : 1 (AA) |
| `espresso` | `#1C1410` | Secciones oscuras (CTA, footer) | crema encima 15,6 : 1 |
| `amber` | `#F5A742` | Solo sobre `espresso` (detalles) | 9,1 : 1 |

El ámbar actual (`#F5A742`) no tiene contraste suficiente sobre fondo claro (3,2 : 1), por eso pasa a usarse solo en las secciones oscuras.

### 3.3 Tipografía

- **Titulares y texto: Geist** (ya está cargada). Sobria, moderna, muy legible.
- **Acento editorial opcional: Instrument Serif** en cursiva para palabras clave del hero («webs que *consiguen clientes*»). Da un toque premium sin parecer de agencia gamer.
- **Se elimina Bricolage Grotesque** (demasiado expresiva) y **JetBrains Mono** de la parte pública (solo se queda para precios/código si hace falta).

### 3.4 Elementos visuales

| Se elimina | Se sustituye por |
|------------|------------------|
| Taza de café 3D (React Three Fiber) | Capturas reales de proyectos en marcos de navegador y móvil |
| Grano de película, brillos «vapor», cursor glow | Fondos limpios, sombras suaves, bordes finos |
| `brew --team`, `// servicios` | Antetítulos normales («Servicios», «Cómo trabajamos») |
| Marquesina de 20 tecnologías | Nada en la home (las tecnologías se ven en cada caso de estudio) |
| Contadores con «50+ scripts FiveM» | Franja de confianza con datos útiles para el cliente (ver §5) |

**Se mantiene con mesura:** animaciones de aparición al hacer scroll (GSAP), transiciones de página, botón CTA fijo en móvil. Todo respetando `prefers-reduced-motion`. Quitar el 3D debería subir Performance móvil por encima de 95.

### 3.5 Marca y tono

- **Nombre y logo:** se mantienen («CoffeeProjects», la taza). El logo se adapta a fondo claro.
- **«Sin café no hay código»:** se queda como firma de marca en el pie de página y en la página de equipo, no como titular.
- **Tono:** de tú, cercano pero profesional. Frases cortas, beneficios concretos, cero jerga técnica en la parte comercial.

---

## 4. Nueva arquitectura de la información

### 4.1 Menú principal

```
[Logo]   Servicios ▾   Proyectos   Precios   Cómo trabajamos   [ES]  [ Pide tu presupuesto ]
           ├─ Diseño de páginas web
           ├─ Rediseño y mejora de webs
           ├─ Tiendas online
           └─ Mantenimiento web
```

- «Presupuestos» pasa a llamarse **«Precios»**.
- «Equipo» sale del menú principal y pasa a «Cómo trabajamos» o al pie.
- «Gana dinero con nosotros» se renombra a **«Programa de colaboradores»** y va solo al pie.

### 4.2 Pie de página

| Servicios | Otros desarrollos | Empresa | Legal |
|-----------|-------------------|---------|-------|
| Diseño web · Rediseño · Tiendas online · Mantenimiento | Desarrollo a medida · Bots de Discord · Scripts FiveM · Servidores FiveM | Proyectos · Equipo · Colaboradores · Contacto | Aviso legal · Privacidad · Cookies |

### 4.3 Mapa de páginas (ES; EN/FR equivalentes)

| Página | URL | Cambio |
|--------|-----|--------|
| Inicio | `/` | **Rehecha** (§5) |
| Servicios | `/servicios` | Solo las 4 líneas web + bloque pequeño «¿Necesitas otro tipo de desarrollo?» con enlace a Otros desarrollos |
| Diseño de páginas web | `/servicios/webs-y-landing-pages` | Rediseñada; se mantiene la URL por SEO |
| **Rediseño y mejora de webs** | `/servicios/rediseno-web` | **Nueva**. Landing para quien ya tiene web |
| Tiendas online | `/servicios/tiendas-online` | Rediseñada |
| Mantenimiento web | `/servicios/mantenimiento-web` | Rediseñada |
| **Otros desarrollos** | `/otros-desarrollos` | **Nueva**. Agrupa a medida, bots, scripts y servidores FiveM con un diseño sobrio |
| Servicios secundarios | `/servicios/scripts-fivem`, etc. | Mismas URLs (no se pierde SEO), plantilla sobria, «miga de pan» → Otros desarrollos |
| Proyectos | `/proyectos` | Rediseñada, con filtros por tipo (web nueva / rediseño / tienda) |
| Caso de estudio | `/proyectos/[slug]` | Ampliada: reto → solución → resultados, antes/después |
| Precios | `/presupuestos` | Mismo contenido v4, diseño claro. Valorar URL `/precios` con 301 desde la antigua |
| Equipo | `/equipo` | Se mantiene; sin estadísticas de GitHub |
| Contacto | `/contacto` | Formulario con dos caminos (§7) |
| Colaboradores | `/gana-dinero` → propuesta `/colaboradores` (301) | Sin cambios de contenido, nuevo estilo |
| Legales, 404, gracias | — | Nuevo estilo. El 404 «coffee not found» se cambia por algo sobrio |

---

## 5. Nueva portada (orden de secciones)

1. **Hero**
   - Antetítulo: «Estudio de diseño y desarrollo web · España»
   - Titular (propuesta): **«Webs profesionales que consiguen clientes»**
   - Subtítulo: «Diseñamos webs nuevas y renovamos las que ya no funcionan: rápidas, bonitas y pensadas para que te contacten. Precio cerrado antes de empezar.»
   - Dos botones: **«Quiero una web nueva»** y **«Quiero mejorar mi web»** (llevan al formulario con el tipo preseleccionado).
   - Línea de confianza: «Respuesta en menos de 24 h · Precio cerrado · El código es tuyo».
   - Visual: composición de capturas reales (escritorio + móvil).
2. **Franja de confianza:** sectores con los que hemos trabajado («Sector público», «Hostelería»…) y 3–4 garantías. Sin cifras infladas.
3. **Dos caminos** (dos tarjetas grandes):
   - *Web nueva* → qué incluye, desde 349 € + IVA, plazo 1–2 semanas.
   - *Renovar mi web* → auditoría, rediseño, velocidad, SEO.
4. **«¿Tu web te está costando clientes?»** — lista de síntomas (tarda en cargar, no se ve bien en móvil, no sale en Google, diseño anticuado, no puedes editarla) + oferta **«Revisión gratuita de tu web»**: el cliente deja su URL y le enviamos un informe breve.
5. **Proyectos destacados** — 3 casos con captura, sector y resultado (por ejemplo el portal institucional: «más rápido y accesible»).
6. **Cómo trabajamos** — los 5 pasos actuales (descubrimiento → propuesta → desarrollo → pruebas → entrega).
7. **Precios** — resumen de planes web con enlace a la página de precios.
8. **Por qué nosotros** — los 6 puntos actuales (contacto único, precio cerrado, avances semanales, código tuyo, NDA, mantenimiento).
9. **Testimonios** — solo si hay reales; si no, la sección no se muestra.
10. **Preguntas frecuentes** — solo de webs (plazos, precio, dominio y hosting, si puedo editarla yo, mantenimiento, NDA).
11. **CTA final** (sección oscura espresso) — «¿Hablamos de tu web?».

Se quitan de la home: cifras (`StatsBento`), servicios FiveM/bots, equipo con fotos grandes (pasa a un bloque pequeño o a «Cómo trabajamos») y la marquesina de tecnologías.

---

## 6. Cambios en el panel (Payload `/admin`)

Todo cambio de esquema lleva su migración (`pnpm payload migrate:create`) y se prueba con la base de datos de preview, nunca con la de producción.

| Área | Cambio | Para qué |
|------|--------|----------|
| **Servicios** | Nuevo campo `linea`: «Webs (principal)» / «Otros desarrollos» | Decide si el servicio sale en la home, en `/servicios` y en el menú, o solo en Otros desarrollos. El equipo lo controla sin tocar código |
| Servicios | Nuevo servicio sembrado «Rediseño y mejora de webs» (ES/EN/FR) | Nuevo público objetivo |
| **Contactos** | Nuevo tipo de proyecto `redesign` («Mejorar mi web actual») | Separar las solicitudes de rediseño |
| Contactos | Nuevo campo `currentUrl` (URL de la web actual), visible en la bandeja | El equipo ve la web del cliente directamente |
| Contactos | Nuevo tipo `audit` («Revisión gratuita») | Medir cuántos leads trae la oferta de auditoría |
| **Proyectos** | Nuevos campos: `tipo` (web nueva / rediseño / tienda / otro), `sector`, `reto`, `solucion`, `resultados[]` (dato + etiqueta, ej. «4,1 s → 1,2 s»), `antes` y `despues` (imágenes) | Casos de estudio de verdad y filtros |
| Proyectos | `mostrarEnWeb` / orden de destacados | Los proyectos FiveM pueden existir sin salir en la portada |
| **Inicio (global)** | Nuevos grupos: «Dos caminos», «Síntomas + auditoría», CTA secundario del hero. Se ocultan `stats` y `stack` (se conservan los datos por si se quieren recuperar) | Editar la nueva home desde el panel |
| **Testimonios** (colección nueva, opcional) | Nombre, empresa, texto, foto, proyecto relacionado, publicado sí/no | Prueba social, solo con testimonios reales |
| **Aspecto del panel** | Colores del panel (`custom.scss`), logo e icono adaptados a la nueva paleta | Coherencia de marca |
| **Emails** | Plantillas de confirmación y notificación con la nueva paleta y el nuevo tipo «rediseño» | Coherencia y contexto para el equipo |

No se toca: usuarios y roles, bandeja de entrada, respuestas desde el panel, integración por API, retención de datos, precios v4, colaboradores.

---

## 7. Formulario de contacto

Primer paso: **«¿Qué necesitas?»** con tres opciones grandes:

1. **Una web nueva** → plan (opcional), plazo, presupuesto, mensaje.
2. **Mejorar mi web actual** → **URL de tu web** (obligatoria), qué te falla (casillas: lenta, móvil, Google, diseño, no puedo editarla), mensaje.
3. **Otro tipo de proyecto** → desplegable con tienda, mantenimiento, desarrollo a medida, bots, FiveM.

Se mantiene todo lo de seguridad y seguimiento: Turnstile, límite por IP, consentimiento, UTM, evento `Lead` de Meta.

---

## 8. Textos (copy)

- Los textos nuevos se escriben primero en **español** y se pasan a **inglés** y **francés** (el sitio es trilingüe).
- Se redactan en `docs/09-contenido-rediseno-es.md` para que los reviséis **antes** de meterlos en el seed.
- Nunca se inventan cifras ni testimonios.

---

## 9. Fases de implementación (cuando deis el visto bueno)

| Fase | Contenido | Entregable |
|------|-----------|------------|
| F0 | Rama `rediseno-webs`, accesos (GitHub escritura, Vercel), preview en Vercel con base de datos propia | URL de preview vacía funcionando |
| F1 | Sistema de diseño: tokens, tipografía, botones, tarjetas, cabecera, pie, menú con submenú. Fuera 3D, grano, glow, terminal | Preview con el nuevo aspecto |
| F2 | Panel: campos y migraciones (§6), servicio «Rediseño», seed actualizado | Panel funcionando en preview |
| F3 | Textos ES (revisión vuestra) → EN/FR | Documento de contenido aprobado |
| F4 | Páginas: home, servicios, rediseño, otros desarrollos, proyectos, caso de estudio, precios, contacto, equipo, legales, 404 | Web completa en preview |
| F5 | Formulario en dos caminos + emails | Prueba completa de envío |
| F6 | Calidad: tests unitarios y E2E actualizados, Lighthouse ≥ 95 móvil, axe, revisión de redirecciones | Informe de calidad |
| F7 | Validación del equipo en la preview → paso a producción (Proxmox) según el procedimiento actual | Web nueva en coffeeprojects.es |
| F8 | README del perfil de GitHub (`CoffeeProjects-es/.github`) alineado con el nuevo enfoque | README actualizado |

Cada fase se publica en la preview de Vercel para que la reviséis antes de pasar a la siguiente.

---

## 10. Preview en Vercel — cómo se haría

Producción ya no está en Vercel (corre en Proxmox desde el 2026-10-10), pero el proyecto `coffeeprojects-web` de Vercel y la base de datos Neon siguen existiendo. Propuesta:

- Usar ese proyecto de Vercel **solo como preview** de la rama `rediseno-webs` (protegido y `noindex`, como el antiguo `staging`).
- Base de datos: **rama de Neon nueva** sembrada con `pnpm seed`. Nunca la base de producción del CT 113.
- Variables mínimas: `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, Blob. Sin Meta, y Resend en modo de prueba para no enviar emails reales.

**Para esto necesito:**
1. Permiso de escritura de la app de Claude en GitHub sobre `eriksanchez23/coffeeprojects-web` (ahora mismo solo puedo leer).
2. Aprobar el acceso de la conexión de Vercel al equipo `coffee-projects`.

---

## 11. Decisiones

### Tomadas (2026-11-06)

| # | Decisión |
|---|----------|
| D1 | Paleta **clara cálida «Café claro»** (§3), con secciones oscuras puntuales |
| D2 | FiveM, bots y desarrollos a medida en **`/otros-desarrollos`**, dentro de la web, solo enlazada desde el pie |
| D3 | **Sí** a la «Revisión gratuita de tu web» como gancho (sección en la home y opción en el formulario) |
| D4 | Se mantienen **ES / EN / FR**; todos los textos nuevos se traducen |

### Pendientes

| # | Pregunta | Mi recomendación |
|---|----------|------------------|
| D5 | Titular del hero | **Aprobado**: «Webs profesionales que consiguen clientes», con CoffeeProjects visible |
| D6 | ¿Hay capturas reales de proyectos (incluido el ayuntamiento, si el NDA lo permite) y testimonios? | Necesarias para el hero y los casos; si no hay, se usan capturas de coffeeprojects.es y de prototipos (noore-club, don-panini) con permiso |
| D7 | ¿La página de equipo sigue mostrando a los 3 (Erik, Diego, Juan)? | Sí, con roles orientados al cliente y sin estadísticas de GitHub |
| D8 | URLs `/precios` y `/colaboradores` con 301 | **Aprobado** |

## Segunda iteración (noviembre 2026)

Peticiones del cliente tras ver la primera vista previa, ya implementadas:

| # | Cambio |
|---|--------|
| I1 | **Precios**: la web nueva ya no se anuncia «desde 349 €»; la portada, la ficha de diseño web y su tarjeta muestran **todos los planes** con su precio. La **remodelación** pasa a «**desde 490 € + IVA**», con presupuesto cerrado tras la revisión gratuita (ficha, portada y aviso en `/precios`). El paso `upgradePriceCopy` del seed actualiza las bases ya sembradas solo donde sigue el texto antiguo. |
| I2 | **Capturas reales**: Nooré Club (`noore-club-demo.vercel.app`, del panel antiguo) y Don Panini (`don-panini-prototipo.vercel.app`) llevan su URL; el seed (`src/seed/screenshots.ts`) les pone portada de escritorio y vista móvil con Microlink, el mismo servicio que «Importar desde web» del panel. coffeeprojects.es usa capturas propias guardadas en `src/seed/assets/projects/`. Solo rellena proyectos sin portada o sin galería. En Vercel exige almacenamiento Blob; en CI se desactiva (`SEED_SCREENSHOTS=0`). |
| I3 | **Portada**: el bloque visual del hero muestra capturas reales que rotan entre proyectos (pausa al pasar el ratón y con movimiento reducido). En la ficha de proyecto, las capturas verticales se ven dentro de un marco de móvil. |
| I4 | **Paleta «Café vivo»**: cobre `#c2410c` como color de marca, degradado naranja→rosa para acentos y espresso para las franjas oscuras; mismo cambio en el panel y en los correos. Todos los textos cumplen contraste AA. |
| I5 | **Animaciones**: luces que se mueven tras el hero y la franja final, palabra destacada con degradado animado, marcos que flotan, brillo en los botones, tarjetas que se elevan, borde superior en degradado y barra de progreso de lectura. Todo se desactiva con «reducir movimiento». |
| I6 | **Panel revisado** (subida de foto en Multimedia, tamaños generados, portada de proyecto visible en la web, foto de miembro del equipo, SVG rechazado, importación desde web con error controlado). Un archivo de más de 10 MB ahora devuelve un mensaje claro (413) en vez de un error genérico (`src/lib/security/upload-guard.ts`). |
| I7 | **Presupuesto de web nueva**: desplegable con el tipo de web (precio con y sin mantenimiento, tarifas v4 sin cambios) y, al elegirlo, el de mantenimiento (solo los planes que dan el precio reducido) o «sin mantenimiento». Debajo, una ficha de lo que incluye cada elección, el ahorro y enlaces a su tarjeta en `/precios`. |
| I8 | **Proyectos deslizables**: el hero se puede deslizar (o usar flechas y puntos) y al pinchar abre el proyecto; debajo muestra su nombre y tecnologías. En la portada los proyectos son una fila deslizable (táctil, arrastre con ratón, flechas). Cada tarjeta muestra tecnologías y lenguajes y, si la web es pública, «Visitar la web». La página de cada proyecto abre con una **ficha** (web, tecnologías, tipo, estado y año) y enlaces al proyecto anterior y siguiente. |
| I9 | **Velocidad**: las apariciones al hacer scroll empiezan en cuanto el bloque asoma y duran la mitad, así un scroll rápido nunca deja huecos en blanco; el scroll suave sigue la rueda más de cerca. En Vercel las imágenes se sirven directas desde el CDN de Blob (antes pasaban por una función de Payload cada una) y las optimizadas se guardan una semana; en el servidor propio, `/api/media/file` envía caché de una semana. Las tarjetas usan la versión de 800 px de la captura. Se precargan 2 fuentes en vez de 4 (la serif solo en cursiva y la monoespaciada sin precarga). |
