# coffeeprojects-web — feature document

Objective: new trilingual coffeeprojects.es (Next.js + Payload admin) delivered first as a full-fidelity protected prototype on Vercel (`staging`).
Branch: `staging` (production = `main`) · Delivery strategy: `ask-on-risk` (forecast ≫ 400 authored lines → chain strategy to be asked before the first work-unit commit) · Test runner: Vitest (unit) + Playwright (E2E) + Lighthouse CI.
Plan: `docs/03-implementation-plan.md` + `docs/plan/T00..T18` · Spec: `docs/01-design-spec.md` · Copy: `docs/02-content-es.md`

## Specs

- **S1** — "una web grande con un diseño muy llamativo y que se vea profesional para poder darnos a conocer y que se note que somos profesionales". Acceptance: spec G1; staging checklist "Look & feel".
- **S2** — "necesito que le metas las ultimas tecnologías" / "MUY IMPORTANTE hacer que se vea profesional y que las tecnologías nuevas necesarias y modernas que hagan sorprender al cliente y engancharse y confiar en nosotros". Acceptance: stack in spec §3 (Next.js App Router, Payload 3, Tailwind 4, GSAP, R3F, View Transitions).
- **S3** — "no necesito que sea una web interactiva, solo para mi y para mi equipo desde un panel externo donde la gente no puede acceder". Clarified: option 1 (team-only admin panel); scope "1 + 2 + 3" (contacts inbox, content editing in 3 languages, portfolio); metrics deferred to phase 2. Acceptance: spec G6, T04/T06/T16.
- **S4** — "Quiero que tenga nuestro contacto de información para poder contactar con nosotros en caso de querer colaborar con nosotros". Acceptance: T11 contact flow + footer/contact page email.
- **S5** — "hay que mejorar muchísimo el SEO". Acceptance: spec G3/§10, T13, Lighthouse SEO ≥ 95.
- **S6** — "haciendo llamadas de atención que nos gustaria implementar para esto Meta Ads". Acceptance: spec §8, T08 service landings + CTAs, T12 Pixel/CAPI consent-gated.
- **S7** — "me gustaria que fuese traducible de español (idioma original) a inglés y francés en un principio. En caso de querer añadir más lo planearemos en un futuro así que no te centres en añadir más que esos tres idiomas." Acceptance: T03/T04/T05, locales exactly es/en/fr.
- **S8** — "faltaría añadirme a mi que soy Erik. Mi información personal es la siguiente: Nombre: Erik; Encargado de diseño y tacto con los clientes en primera persona; Residente en España, Murcia; Desde 2026 ya que soy nuevo; lenguajes: HTML, CSS, JavaScripst, ASTRO, TypeScript, C#, Java, Python, Kotlin; un total de 3 repositorios por ahora; créame una descripción que aspire confianza al cliente tanto a mi como a mis compañeros en caso de que su descripción no llame la atención." Acceptance: `docs/02-content-es.md` §5 (approved), T05 seed team data, T09.
- **S9** — "hacerlo de tal manera que el cliente se vea toda la web con llamadas de atención y animaciones que enganchen junto a información nuestra y de la empresa, toda la que puedas recopilar". Acceptance: T08 sections, T14 motion/3D; content migrated from coffeeprojects.es (only real facts).
- **S10** — "NO ES UNA MODIFICACIÓN DE LA WEB, ES UNA NUEVA MODERNA Y MÁS PROFESIONAL CON LAS NUEVAS TECNOLOGIAS Y UN MEJOR SEO". Acceptance: new repo from scratch (T01).
- **S11** — "quiero que primero hagamos un prototipo CALCADO al resultado FINAL para poder subir luego a un repositorio privado para el equipo y poder subir a vercel a ver el resultado y ver si tenemos que modificar cosas antes de mandar a producción y publicarla. Y ver si todo el panel funciona en la web o hay que tocar algunas cositas". Acceptance: T18 staging deploy + `docs/04-staging-checklist.md`.
- **S12** — "Opción 1, una evolución clara a algo más premium con las últimas tecnologias" (evolve current coffee + terminal brand). Acceptance: spec §6, T02 tokens.
- **S13** — "Vamos con la opción A" (Next.js + Payload CMS). Acceptance: T01/T04.

## Tasks

| ID | Specs | Route | Status | Evidence / commit |
|----|-------|-------|--------|-------------------|
| T00 accounts & secrets | S11 | human | pending | — |
| T01 scaffold | S2, S10, S13 | delegated (writer) | pending | — |
| T02 design system | S1, S12 | delegated (writer) | pending | — |
| T03 i18n | S7 | delegated (writer) | pending | — |
| T04 CMS model | S3, S7 | delegated (writer) | pending | — |
| T05 seed content | S7, S8, S9 | delegated (writer) | pending | — |
| T06 data layer | S3 | delegated (writer) | pending | — |
| T07 shell + consent | S1, S6 | delegated (writer) | pending | — |
| T08 home + services | S1, S6, S9 | delegated (writer) | pending | — |
| T09 team | S8, S9 | delegated (writer) | pending | — |
| T10 projects | S9 | delegated (writer) | pending | — |
| T11 contact | S4 | delegated (writer) | pending | — |
| T12 Meta Ads | S6 | delegated (writer) | pending | — |
| T13 SEO | S5 | delegated (writer) | pending | — |
| T14 motion & 3D | S1, S2, S9 | delegated (writer) | pending | — |
| T15 legal/404/security | S5 | delegated (writer) | pending | — |
| T16 admin UX | S3 | delegated (writer) | pending | — |
| T17 quality gates | S5, S11 | delegated (writer) | pending | — |
| T18 staging deploy | S11 | human + agent | pending | — |

Route evidence: large task (resume test fails: multi-session, external accounts, separate deliverables) → Writer trigger: one bounded writer per task.

## Log

- **L1 (2026-10-06, user original request, verbatim):** "Buenas, quiero hacer algo grande, soy parte de una empresa llamada coffeeProjects,  y queremos hacer una web grande con un diseño muy llamativo y que se vea profesional para poder darnos a conocer y que se note que somos profesionales, necesito que le metas las ultimas tecnologías, no necesito que sea una web interactiva, solo para mi y para mi equipo desde un panel externo donde la gente no puede acceder. Quiero que tenga nuestro contacto de información para poder contactar con nosotros en caso de querer colaborar con nosotros, hay que mejorar muchísimo el SEO y haciendo llamadas de atención que nos gustaria implementar para esto Meta Ads. Vamos a empezar con la planificación sin ninguna implementación aun hasta que YO TE VALIDE y te DE PERMISO de poder empezar con la validación, al ser una web de darnos a conocer y conseguir clientes me gustaria que fuese  traducible de español (idioma original) a inglés y francés en un principio. En caso de querer añadir más lo planearemos en un futuro así que no te centres en añadir más que esos tres idiomas. MUY IMPORTANTE hacer que se vea profesional y que las tecnologías nuevas necesarias y modernas que hagan sorprender al cliente y engancharse y confiar en nosotros. Te voy a pasar este enlace que es el que tengo de la web actual que solo tiene dos integrantes, Juan y Diego, faltaría añadirme a mi que soy Erik. Mi información personal es la siguiente: Nombre: Erik; Encargado de diseño y tacto con los clientes en primera persona; Residente en España, Murcia; Desde 2026 ya que soy nuevo; lenguajes: HTML, CSS, JavaScripst, ASTRO, TypeScript, C#, Java, Python, Kotlin; un total de 3 repositorios por ahora; créame una descripción que aspire confianza al cliente tanto a mi como a mis compañeros en caso de que su descripción no llame la atención. Insisto en que la web tiene que llamar mucho la atención y hacer ver que somos profesionales y que nos tomamos en serio nuestro trabajo, hacerlo de tal manera que el cliente se vea toda la web con llamadas de atención y animaciones que enganchen junto a información nuestra y de la empresa, toda la que puedas recopilar, NO ES UNA MODIFICACIÓN DE LA WEB, ES UNA NUEVA MODERNA Y MÁS PROFESIONAL CON LAS NUEVAS TECNOLOGIAS Y UN MEJOR SEO. Te paso el link a continuación para que procedas con la planificación e insisto NO IMPLEMENTES NADA HASTA QUE EL PLAN NO ESTE TERMINADO NI VALIDADO POR MI. Aquí tienes el link: https://coffeeprojects.es"
- **L2 (2026-10-06, user):** "Es la opción 1, pero quiero que primero hagamos un prototipo CALCADO al resultado FINAL para poder subir luego a un repositorio privado para el equipo y poder subir a vercel a ver el resultado y ver si tenemos que modificar cosas antes de mandar a producción y publicarla. Y ver si todo el panel funciona en la web o hay que tocar algunas cositas"
- **L3 (2026-10-06, user):** "Opción 1, una evolución clara a algo más premium con las últimas tecnologias"
- **L4 (2026-10-06, user):** "Me gusta tu recomendación, hazlo de esa manera" (panel scope 1 + 2 + 3; metrics phase 2)
- **L5 (2026-10-06, user):** "Vamos con la opción A, en la carpeta que estas vinculado puedes guardar archivos .md que te hagan falta para la planificación para la hora de implementar solo tener que ejecutar las instrucciones de los .md"
- **L6 (2026-10-06, user):** "Los apruebo, en caso de que haya cambiar algo después de la implementación te lo digo y ya esta, Tienes mi aprobación para empezar con la implementación" (spec + content approved; implementation authorized)
- **L7 (2026-10-06):** Plan written (`docs/03-implementation-plan.md`, 19 task files). Decisions during planning: fonts switched to Bricolage Grotesque + Geist via `next/font/google` (spec §6 updated; avoids manual font downloads); contact submission via Server Action (avoids clash with Payload's `/api/[...slug]`); Meta Pixel not loaded at all without consent (stricter than revoke); FAQ #10 states ES/EN service only until Q9 is answered. Verified with Context7: Next.js 16 `proxy.ts`, `revalidateTag(tag, 'max')`, Payload 3.85 adapters, next-intl 4 routing.
- **Next step:** user reviews the plan and chooses the execution method; humans complete T00 (accounts, Neon `dev` DB URL) before T01 Step 11.
