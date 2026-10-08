# Pricing v4 (source of truth for S15 / T20)

Source: `docs/sources/propuesta-tarifas-web-v4.txt` (pdftotext of `propuesta-tarifas-web-v4.pdf`, provided by Erik, 2026-10-08). Some table columns of the text export are misaligned; the plan cards on pages 3–5 are authoritative. Spanish is the source; EN/FR are translations made for the site (`src/seed/data/pricing.ts`). Replaces the S14 sheet (Básico / Estándar / Profesional, T19).

The page (`/presupuestos`, `/en/pricing`, `/fr/tarifs`) follows the source's p.9 step 1: **"1. Elige tu web"** with the price with maintenance big and the "solo la web" price below, then **"2. Elige tu mantenimiento (opcional)"** with the comparison table. All prices **+ IVA**. Everything is editable in the panel (Contenido → Precios, tabs *Cabecera*, *1. Planes de web*, *2. Mantenimiento*, *Servicios extra*).

## 1. Web plans (one-off payment)

*Todas incluyen diseño responsive, SSL, textos legales, 2 rondas de revisiones y 30 días de garantía de corrección de fallos.*

| Plan (slug) | With maintenance | Web only | Reduced price from | Badge |
|---|---|---|---|---|
| Landing Page (`landing-page`) | 349 € | 590 € | Esencial | |
| Landing Premium (`landing-premium`) | 590 € | 890 € | Esencial | Nuevo |
| Custom (`custom`) | desde 490 € | desde 790 € | Plus | |
| Web Corporativa (`web-corporativa`) | 890 € | 1.390 € | Esencial | |
| Tienda Online (`tienda-online`) | 1.490 € | 2.190 € | Plus | Recomendado |
| Web Profesional (`web-profesional`) | desde 1.790 € | desde 2.590 € | Pro | |

Inclusions per plan are transcribed verbatim from pp.3–4. Terms shown under the plans: *Forma de pago*, *«Solo la web»*, *Funciones extra en la Web Profesional* (p.4).

Each web plan's button links to `/contacto?type=<web|ecommerce|custom>&plan=<slug>`; the contact form keeps the plan only when the slug is one of the published web plans.

## 2. Maintenance (optional, monthly fee)

*Opcional, pero con cualquier plan la web sale más barata. Todos incluyen hosting, dominio, SSL, actualizaciones de seguridad y copias de seguridad.*

| Plan (slug) | Fee | Permanence | Badge |
|---|---|---|---|
| Esencial (`esencial`) | 25 €/mes | 24 meses | |
| Plus (`plus`) | 45 €/mes | 24 meses | Recomendado |
| Pro (`pro`) | 79 €/mes | 12 meses | |

- **Soporte a medida** (not a published plan): quoted on request, as a guide from 139 €/mes with 12 months of permanence.
- **¿Qué cuenta como un cambio?** and **Reglas del cupo** (p.5).
- **Con mantenimiento vs. solo la web** (p.6 table).
- **Reglas de la permanencia** (p.9, client-facing rows only): Inicio, Fin, Baja anticipada, Subir de plan.

Maintenance buttons link to `/contacto?type=maintenance` (no `plan`: the contact `plan` field only accepts web plan slugs).

## Extra services (p.7 "Tarifa de servicios")

| Service | With a plan | Without a plan |
|---|---|---|
| Cambio (texto, foto, precio, horario) | En el cupo · 20 € fuera | 35 € |
| Sección nueva dentro de una página | 45 € | 90 € |
| Página nueva | 75 € | 150 € |
| Pack de 25 productos cargados | 45 € | 90 € |
| Idioma adicional | 180 € | 320 € |
| Redacción de textos (por página) | 30 € | 50 € |
| Logo sencillo | 150 € | 220 € |
| Actualización de seguridad | Incluida | 90 € |
| Recuperar web caída | Incluido | 150 € |
| Limpieza tras hackeo | Incluida | 290 € |
| Rediseño o funciones nuevas | Presupuesto | Presupuesto |

Rows 8–10 are misaligned in the text export; this mapping is the ruling.

## Not published (internal)

p.2 (v3 → v4 changes), p.8 (hosting costs and market position), p.10 (decisions and sources), the legal notice on permanence, and the p.9 rows *Bajar de plan* / *Impago*.

## Services

Service cards follow the sheet: Webs y landing pages desde 349 €, Tiendas online desde 1.490 €, Mantenimiento desde 25 €/mes (all + IVA). The seed re-prices an existing service only while it still shows a previous sheet amount (`src/seed/reprice.ts`), so panel edits are never overwritten.
