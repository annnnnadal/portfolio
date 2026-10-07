# CLAUDE.md — Instrucciones para Claude Code

Este archivo es el brief del portfolio de Ana Nadal. Léelo entero antes de cada tarea.

## Cómo trabajar

- **Stack:** web estática con HTML, CSS y JavaScript sin frameworks. Debe desplegarse en Vercel sin configuración.
- **Idioma de la web:** inglés. Usa los textos de este documento tal cual; no reescribas el copy sin pedir permiso.
- **Niveles de lectura:** el Nivel 1 siempre visible; el Nivel 2 se despliega al interactuar (por ejemplo, con `<details>` o un botón accesible).
- **Dirección visual:** manda la sección "Dirección visual (v1)": DM Sans, blanco y negro, retícula de 12 columnas, detalles en las esquinas, líneas finas. En la v1 no hay gradientes ni color.
- **Imágenes:** están en `/images`, una subcarpeta por proyecto. Optimízalas para web. Esquinas rectas, sin sombras.
- **Reglas:** respeta siempre la sección "Reglas, confidencialidad y backlog".
- **Forma de trabajar:** construye sección por sección. Antes de cambios grandes, explica brevemente qué vas a hacer.

---

# Portfolio Ana Nadal — Brief & Copy

## Concepto

Un portfolio minimalista que muestra cómo trabajo, no solo lo que he hecho. Objetivo: aplicar a puestos de Design Lead y Product Designer senior.

- **Referencia:** Balance Phone. Quedarse con lo esencial y quitar el ruido. La mayoría de portfolios son galerías; este muestra criterio.
- **Por qué:** los proyectos son siempre de equipo. Lo que importa es qué aporto yo a ese equipo: mi proceso, mis decisiones y mi forma de trabajar con otras personas.
- **Columna vertebral:** tres principios (Keep it clean, Show the direction, Keep it compelling), demostrados con proyectos.
- **Hilo conductor interno (no aparece en la web):** la casa. El logo o la interfaz es el tejado y llega al final; antes van la escucha, el discovery, el plan y las decisiones compartidas.
- **Idioma de la web:** inglés.

## Voz y tono

**Personalidad:** una diseñadora senior que explica las cosas como lo haría una buena compañera. Clara, cercana, segura de lo que sabe y honesta con lo que no. Usa su experiencia para que los demás entiendan, no para impresionar.

**Valores:** Helpful · Human-centered · Expert · Positive impact · Cercana · Inteligencia para crear comprensión · Honestidad · Amabilidad.

| Escala | Posición |
| --- | --- |
| Formal ↔ Cercana | Profesional y cálida |
| Seria ↔ Lúdica | Seria, con algún toque ligero |
| Técnica ↔ Sencilla | Sencilla; jerga solo si se explica |
| Reservada ↔ Directa | Directa, sin rodeos |

**Reglas de escritura**

- Cada frase ayuda a entender algo. Un término técnico se explica en la misma frase.
- Hablamos de lo que cambió para las personas, no de entregables.
- La experiencia se nota en las decisiones y su porqué, no en adjetivos ni superlativos.
- "We" cuando el trabajo fue de equipo; "I" para mi rol y mis decisiones.
- Frases cortas, como se hablan. Nunca se critica a un cliente, ni de forma sutil.
- Decimos con naturalidad qué es concepto, qué está en curso y qué no salió.
- Evitamos: frases-aforismo, fragmentos tipo eslogan, el "no es X, es Y" y todo lo que suene a LinkedIn.

## Estructura e interacción

Una one-page con los tres principios como eje, y una página ligera por caso de estudio.

**Orden de la home**

1. About
2. Principles, con sus casos de estudio dentro (cada principio lleva sus proyectos)
3. How I work
4. Contact

Los capítulos se numeran del 01 al 04 y se llaman About, Principles, How I work y Contact (en el menú de la cabecera, "01 — About"). Kept / Cut, Evidence y Now ya no están en la web (su copy se conserva al final, en "Copy retirado de la web").

**Orden de los principios:** Show the direction, Keep it compelling, Keep it clean.

**Casos dentro de cada principio:** bajo el texto del principio hay un título pequeño "Case studies" y una fila de cards (máximo 3 en horizontal en escritorio, 2 en tablet y 1 en móvil). Cada card lleva miniatura, nombre del proyecto, tipo de proyecto y año. Los proyectos en curso llevan un label "WIP" con un punto que pulsa. Al hacer clic en una card se abre la página del caso (ver "Páginas de caso").

**Páginas de caso:** cada caso tiene su propia página y su id: `/case/resa/`, `/case/ai-tools/`, `/case/oros/`, `/case/mr-sunday/`, `/case/havaianas/`, `/case/newcomers-guide/`. Cada una es un `index.html` estático dentro de `case/<id>/`, con rutas absolutas a `/styles.css`, `/script.js` y `/images`.

- **Colores invertidos:** la página del caso tiene fondo negro y texto blanco (la home es blanco roto y negro). Las miniaturas de líneas se invierten para verse en blanco.
- **Imagen hero:** la miniatura de la card se convierte, con una transición suave, en la imagen hero de la página a todo el ancho. Es la misma imagen; no se repite en la galería.
- **Estructura del texto:** principio, título, frase de Nivel 1, línea de datos y los bloques del caso (Challenge, Direction, Solution…), igual que en el brief.
- **Cerrar:** una "x" arriba a la derecha, en la cabecera, cierra el caso y vuelve a la home, a la card del caso, con la misma transición a la inversa.
- **Siguiente proyecto:** si el principio tiene más de un proyecto, al final de la página hay un acceso directo al siguiente, con miniatura y la misma transición. El último vuelve al primero del principio. Keep it clean tiene un solo caso y no lleva acceso.
- **Transición:** View Transitions API entre documentos (`@view-transition`, eventos `pageswap` y `pagereveal`, con `view-transition-name: case-hero`). Sin soporte del navegador, o con `prefers-reduced-motion`, se navega sin animación.

**Línea guía (solo en la home):** concepto "I turn noise into direction". Una línea de 1.5 px en #0044FF (el color de la web) que se dibuja con el scroll como un hilo que crece hacia abajo. Su extremo inferior va a la altura de la mitad del viewport. Implementación: `guide.js` (SVG + `requestAnimationFrame`, sin librerías), cargado solo en `index.html`. Las páginas de caso no la llevan. Todo el trazado, la flor y la figura final son #0044FF.

- **Líneas verticales:** About, la tercera línea del grid desde la derecha (el eje de la flor); Principles, la segunda desde la izquierda; How I work y Contact, la segunda desde la derecha.
- **Recorrido en escritorio:** About (tercera línea desde la derecha) → flor → hacia la izquierda sobre la línea que subraya "Principles" → baja por la segunda línea desde la izquierda durante Principles → en How I work, hacia la derecha sobre la línea que hay bajo "How I take a project…" → baja por la segunda línea desde la derecha → Contact, también a la derecha. Los tramos horizontales van superpuestos exactamente a esas líneas.
- **Flor (`images/flower.svg`, en línea):** volteada: su base está abajo y se abre hacia arriba; el tallo recto central es la propia línea guía. Ocupa cuatro columnas de ancho, en las cuatro últimas, con su eje sobre la tercera línea del grid desde la derecha (la antepenúltima). Tiene su propia línea base, que no pasa del ancho del dibujo. La línea baja por el tallo hasta la base; entonces, con el scroll, se dibujan de forma consecutiva la base (desde el centro hacia los lados), los anillos (`#flower-rings`) y después el abanico (`#flower-fan`), cada grupo por `data-order`, con las dos mitades creciendo a la vez desde la base. Después la línea sigue hacia abajo, hasta Principles, y continúa su recorrido.
- **Contact (sticky):** al llegar al título "Contact", la sección se queda fija bajo la cabecera. El scroll solo sirve para que la línea siga bajando por la derecha hasta el eje central de `images/closing-wave.svg` y para dibujar la onda, de derecha a izquierda, onda a onda en el orden de `data-order`, con cada barra creciendo desde el eje. La onda queda justo debajo del email. La página termina cuando la onda está completa, sin espacio sobrante.
- **Pausas:** mientras se dibuja la flor o un cambio de lado, el extremo se queda parado y el scroll sigue; después la línea acelera hasta recuperar la mitad del viewport.
- **Vibración:** al acercar el cursor o el dedo, el tramo cercano se deforma y oscila como una cuerda pulsada, y se amortigua en menos de un segundo. La línea tiene `pointer-events: none`; la vibración se detecta con eventos de la ventana.
- **Móvil (hasta 860 px):** la línea va por un margen lateral fijo, sin alternar de lado. La flor se queda a ancho completo bajo el texto de About: la línea se desvía a su eje en el hueco sobre ella y vuelve al margen sobre la línea bajo el título de Principles. Contact es igual de fijo (sticky).
- **`prefers-reduced-motion`:** línea, flor y onda completas, estáticas y sin vibración; Contact sin recorrido extra.
- **Decidido:** la vertical izquierda puede cruzar el título "How I work".

**Dos niveles de lectura**

- **Nivel 1, en diagonal:** una frase corta y humana. Se entiende el enfoque en segundos.
- **Nivel 2, en profundidad:** aparece al interactuar (desplegar, clicar o hover). Mantiene el detalle completo de los textos.

**Experiencia**

- Web dinámica con imágenes abstractas. Nada literal: la casa no se dibuja.
- Transiciones entre home y caso que parezcan la misma página: la imagen hero se queda fija o solo cambia de escala (View Transitions API).
- Carga rápida, responsive en cualquier dispositivo, accesible (WCAG AA como mínimo).

**Profundidad por tipo de caso**

| Tipo | Casos | Contenido |
| --- | --- | --- |
| Caso completo | Resa | Challenge, Direction, Solution, Outcome con imágenes "Concept design" |
| Caso de proceso (NDA) | AI tools for corporate bankers, A guide for newcomers to Spain | Sin nombres ni pantallas; miniatura de líneas en lugar de imagen y artefactos recreados en estilo neutro |
| Pieza de craft | Oros, Mr Sunday, Havaianas | Una imagen potente y la decisión de detalle que la explica |

## Dirección visual (v1)

Versión sencilla para presentar ya: tipografía protagonista, retícula visible y líneas finas, en azul #0044FF sobre blanco roto.

- **Tipografía:** DM Sans (Google Fonts). Jerarquía muy marcada: titulares enormes y ajustados, texto de lectura pequeño y limpio, etiquetas en mayúsculas pequeñas.
- **Color:** fondo blanco roto y todo lo demás en azul #0044FF: texto, líneas, retícula y figuras SVG. Las páginas de caso son negro con blanco.
- **Retícula:** 12 columnas, líneas de la retícula visibles y muy finas en algunas secciones, como en un plano. Negro al 3 % de opacidad y siempre en el fondo: las imágenes van por encima.
- **Cabecera:** barra fija con fondo opaco (100 %). A la izquierda, Madrid con la hora local en directo; a la derecha, el número y nombre del capítulo en curso ("03 — How I work"). Al hacer clic en el capítulo se abre un menú con los capítulos para saltar de uno a otro dentro de la página. Sin versión, sin estado y sin nombre en la cabecera.
- **Imágenes abstractas:** composiciones de líneas finas con ritmo y pausas, nunca literales. La flor de círculos y arcos de `images/flower.svg` y la onda de barras de `images/closing-wave.svg` van en línea (todo es trazo; ver "Línea guía"). Las miniaturas de los casos sin imagen (AI tools, A guide for newcomers) son composiciones de puntos o trazos en diagonal con grosor variable, SVG trazados a partir de las referencias de Ana (`images/generated/`).
- **Imágenes de proyecto:** esquinas rectas, sin bordes redondeados ni sombras.
- **Movimiento:** discreto. En las miniaturas generadas cada línea se dibuja por separado, con su propio retraso, para un movimiento fluido y orgánico (lo hacen al entrar en pantalla). La flor y la línea guía se dibujan con el scroll. El nivel 2 se despliega con suavidad y el punto de WIP pulsa.
- **Referencias:** clemenceguillemot.com (meta-información, listado editorial numerado) y creativewebmanual.com (retícula, etiquetas tipo código, capítulos numerados). Carteles tipográficos suizos con líneas y números grandes.

## Copy: Hero

El texto de "About me" (Nivel 2) es siempre visible, con el mismo tamaño de letra que los títulos de los principios.

**Nivel 1**

> **Ana Nadal** — Product & Brand Design Lead
>
> I turn noise into direction

**Nivel 2**

> For more than ten years I've designed brands and digital products. Today I also design how people talk to AI. I help teams bring order to complexity, choose the direction worth following, and make it beautiful enough to be noticed.

## Copy: Principles

Un solo nivel de lectura. En la web, los títulos de los principios van sin punto final (también "I turn noise into direction" y "Let's talk").

> **Show the direction** When anything can be generated, options are cheap and endless. The real work is knowing which one to pursue: orchestrating toward the strongest solution, or questioning the default when something better is possible.
>
> **Keep it compelling** Beauty isn't decoration — it's what earns attention. We shape each piece to fit the medium it will live in, so it gets noticed amid the noise.
>
> **Keep it clean** In a world buried in information, we order and compose so the important things rise to the surface — turning noise into stories people can actually follow.

## Copy: How I work

En la web los pasos van sin numeración. Cada paso es un desplegable: el Nivel 1 siempre visible y el Nivel 2 al hacer clic, con un símbolo + que aparece al pasar el ratón. "Always" es un paso más de la lista. La frase "How I take a project from the first conversation to the final design." queda visible encima de los pasos, y los textos del Nivel 1 de cada paso tienen el mismo tamaño que esa frase.

**Nivel 1**

> **Listen** — Every project starts with listening.
>
> **Discover** — I get to know the brand, the people and what's already there, and share what I find.
>
> **Plan** — We agree on clear steps, so everyone knows what's coming.
>
> **Build together** — We decide as a team. Once something's agreed, we move on.
>
> **Craft** — Then it's time to make it beautiful.

**Nivel 2**

> How I take a project from the first conversation to the final design.
>
> **01 · Listen**
> Every project starts with listening: what the project needs, and what the people behind it need too. Experience helps me ask the right questions from day one, and show where design can help long before anything is drawn.
>
> **02 · Discover**
> Before shaping anything, I get to know the brand, look at what already exists and search for the value proposition. When a project is already underway, a blueprint workshop helps us see where we stand. I share what I'm finding before we choose a path, often with references or a quick low-fi sketch. A simple visual sparks a better conversation than a concept explained in words.
>
> **03 · Plan**
> We set clear milestones, with clear deliverables at each one. Delivering in phases gives strategy the weight it deserves, and gives the visual work a solid reason to exist.
>
> **04 · Build together**
> Every proposal is a draft, open to improvement until we reach a shared goal. I bring the team and the client into each decision, because a decision made together rarely gets overturned. Once we agree, that phase is closed and we move forward without going back.
>
> **05 · Craft**
> Only now does the final design take shape, built on everything that came before.
>
> **Always**
> *Talk early, talk often.* With the team and with the client, at every step.
> *Even a draft should be beautiful.* A rough idea presented with care earns the trust to develop the rest calmly.
> *Build to last.* When everyone understands why each phase exists, what we create can grow and scale over time.

## Copy: Casos de estudio

Cada caso vive dentro de su principio y tiene su propia página (ver "Páginas de caso").

| Principio | Caso | Tipo | Carpeta de imágenes | Card: tipo de proyecto · año |
| --- | --- | --- | --- | --- |
| Show the direction | Resa | Completo | images/resa (thumbnail y hero: resa-concept-merchandising; Outcome: billboard, web desktop y mobile, en imágenes y vídeos) | Brand strategy, UX/UI · 2025 |
| Show the direction | AI tools for corporate bankers | Proceso (NDA), WIP | images/generated (líneas) | Conversation design, UX/UI · 2026 |
| Keep it compelling | Oros Travel & Culture | Craft | images/oros | Brand restyle & website · 2023 |
| Keep it compelling | Mr Sunday | Craft | images/mr-sunday | Brand identity · 2024 |
| Keep it compelling | Havaianas | Craft | images/havaianas | Campaign adaptation for EMEAI · 2017–2022 |
| Keep it clean | A guide for newcomers to Spain | Proceso (NDA) | images/generated (líneas) | UX strategy, content structure, UI, art direction · 2026 |

En las cards va solo el tipo de proyecto, no la posición.

### Resa

**Nivel 1**

> **Resa** — Two businesses, two brands, one website.

**Nivel 2**

> Design Lead · Brand strategy, UX/UI · With SEO, content strategy, data and an external development team · 2025
>
> **Challenge**
> Resa runs university residences across Spain. Students stay for the academic year, and when rooms are free, travellers book them like a hotel. Each business had its own website and its own identity, and Resa wanted one.
>
> One website meant speaking to very different people: students choosing where to live, parents paying for it, and travellers looking for a place in the city. Some of those travellers didn't know they were booking a student residence.
>
> Early on we saw a deeper need: the brand itself wasn't unified. Before designing a website, we had to agree on who Resa was.
>
> **Direction**
> *Brand first.* I proposed starting with a brand strategy workshop, with archetypes, visual references and positioning, so every screen would rest on a shared definition.
>
> *Community at the centre.* Competitors lead with services and locations. Resa's residents talk about something else: activities that turn strangers into friends almost overnight. We put that at the heart of the story.
>
> *Clear for travellers.* We said openly that guests stay in a student residence. Clear expectations make for better stays.
>
> *Building on what they had.* The workshop pointed to a bold new brand. Seeing it on screen, the team preferred to evolve their identity, so the third concept kept Resa's youthful character and refined its existing assets.
>
> **Solution**
> A split-screen layout became the visual thread: two ways to stay, one brand. We rebuilt the palette as a fully accessible digital palette, aligned with the residences' signage. We chose two open-source typefaces: Bricolage Grotesque for personality, and Outfit for easy reading on screen. Two photography styles: natural lifestyle images for life at Resa, and careful architectural shots for the spaces. A modern set of illustrations and icons replaced the old, more childish shapes.
>
> I led the design direction for a multidisciplinary team. SEO shaped a narrative built to convert, content strategy defined one tone of voice for every audience, and data tagged the whole architecture so results could be measured. Everything was documented for the external development team.
>
> **Outcome**
> [Imágenes y vídeos de images/resa, mezclados, cada uno con su nombre de archivo como caption]

**Enlace:** al inicio de la página, bajo los datos del caso, va el enlace a la web, que es el proyecto principal: [Visit the website →](https://resa.es/) (se abre en pestaña nueva). La imagen hero (resa-concept-merchandising) lleva el caption "Concept design".

**Outcome (images/resa):** mezcla imágenes y vídeos. Cuando dos piezas tienen la misma proporción van juntas en la misma línea; el resto, a todo el ancho de la columna. Orden actual:

1. `resa-concept-billboard` (imagen, a todo el ancho)
2. `resa-web-desktop-concept-homepage-hero` (imagen) y `resa-web-desktop-homepage-hero` (vídeo), en la misma línea
3. `resa-web-desktop-homepage-gallery` (vídeo, a todo el ancho)
4. `resa-concept-web-mobile-students-page` (imagen) y `resa-concept-web-mobile-students-page-hero` (vídeo), en la misma línea

**Caption:** el nombre del archivo de cada imagen o vídeo, sin extensión.

**Vídeos:** se reproducen solos, sin sonido y en bucle, mientras están visibles; si el usuario pausa uno, no se reanuda solo. Como no tienen sonido, el único control es un botón circular en el centro para reproducir y pausar (aparece siempre en pausa y, al reproducir, al pasar el ratón o con el foco del teclado). Con `prefers-reduced-motion` quedan en pausa hasta pulsar el botón. Cada vídeo se optimiza para web (mp4 y webm sin audio, con póster en WebP, sufijo `-web`); los originales se conservan en la carpeta.

### AI tools for corporate bankers

**Nivel 1**

> **AI tools for corporate bankers** — AI that saves time, while the banker keeps the final word.

**Nivel 2**

> Product Designer, sole designer · Conversation design, UX/UI · With product, data, engineering, front-end, architecture and business · Financial sector · In progress
>
> **Challenge**
> Corporate bankers win on relationships. What they know about each client, and how they use it, is what makes a proposal work. A research team studied how bankers work today and where their time goes. Two tools came out of that work, and I design both: an AI assistant inside the bankers' CRM, and a tool that drafts client presentations.
>
> Both share one question: how can AI save time without losing what makes a banker's work valuable? An answer is only useful if it can be trusted, and a proposal only works if it sounds like the banker.
>
> **Direction**
> *Reliable answers first.* The assistant works with sensitive internal information, so accurate, verified answers matter more than impressive ones. We designed what happens when it doesn't know as carefully as the ideal answer: it says so clearly and offers a next step.
>
> *A voice that fits.* I defined the assistant's personality, voice and tone for a banker's day-to-day, within the bank's guidelines. Professional and concise, and helpful like a good colleague.
>
> *Designed for the platform.* The assistant lives in the CRM's chat module. I mapped which components the platform supports and brought the bank's identity into them, so it feels at home in both.
>
> *The banker has the final word.* The presentation tool creates a first draft for each type of pitch. The banker then adjusts it through chat until it says exactly what they want their client to hear. Each response explains what changed, why, and what they can do next.
>
> **How we work**
> We map each use case and its user flows to anticipate what bankers will need. Every step is agreed with front-end, data and the product owner. The presentation tool moves in phases: each prototype is reviewed with business, architecture, front-end, data and engineering, then tested with users as a simple prototype before anything is built.
>
> **Status**
> A pilot group of bankers is testing the assistant's first version, and their feedback is shaping what comes next. The presentation tool reaches its first users in Q4 2026.

Visuales: diagrama de human-in-the-loop, tarjeta de voz y tono con ejemplos inventados, taxonomía de fallbacks, mapa de equipos. Estilo neutro de líneas, sin pantallas reales.

### A guide for newcomers to Spain

**Nivel 1**

> **A guide for newcomers to Spain** — Making a new start easier to follow.

**Nivel 2**

> Product Designer · UX strategy, content structure, UI, art direction · With product, business and content · Financial sector · Concept phase
>
> **Challenge**
> Moving to a new country means two journeys at once: the paperwork to become a legal resident, and the personal one of building a life. The goal was a space on a bank's public website for people arriving in or living in Spain. It would help them through that change, and show how the bank could support each stage.
>
> The balance mattered. It had to feel like a guide people could trust, never like a sales brochure.
>
> **Direction**
> *People before products.* We used AI to draft an initial map of who comes to Spain and why, then checked it with associations that support newcomers every day. That gave us four life moments: just arrived, here to study, already living here, and looking to invest.
>
> *One question to start.* The experience opens by asking: where are you right now? Each moment has its own page, written for that person's situation, and products appear only where they help. One flexible offer adapts to each stage.
>
> *Short, clear guidance.* Immigration paperwork is complex and personal, so we kept it brief: what each step involves and where to go next.
>
> *A way in for everyone.* Not everyone knows which moment fits them, so a main page guides each person to what they need.
>
> **Solution**
> A hub and one page per life moment, connected by a single story. The interface uses only the bank's existing design system, so it could be built without new components. The image direction shows real people each audience can recognise themselves in: inclusive, natural and never forced.
>
> **Outcome**
> A clear way to recognise each type of newcomer and offer the right help, through the right channel, at the right moment. For audiences with an existing offer, it opened a path to a long-term relationship. For the rest, it started a relationship built on their real concerns, financial or not. The project has since moved to another team.

Visuales: la pregunta "Where are you right now?" con las cuatro tarjetas en wireframe neutro y un mapa de momentos vitales. Nunca usar capturas del banco.

### Oros Travel & Culture

**Nivel 1**

> **Oros Travel & Culture** — A family brand, ready to fly.

**Nivel 2**

> Brand restyle & website
>
> Oros designs tailor-made performance tours in Spain. After twenty years as a family business, it was ready for a new look. We built everything around one idea, fly and connect: Migra, a serif inspired by bird migration, warm illustrations, and an orange that feels like a welcome. The website shows how Oros plans each trip, personal and professional at the same time.
>
> [Visit the website →](https://orostravel.com/)

### Mr Sunday

**Nivel 1**

> **Mr Sunday** — A logo with a filmmaker's warmth.

**Nivel 2**

> Brand identity
>
> A creative film studio in Madrid, now opening in Stockholm. The studio is built around its founder, a warm and open filmmaker, and the brand needed to show it. Starting from the Lima typeface, I adjusted the letters until they connected and balanced. The palette feels cheerful and close, like him.

### Havaianas

**Nivel 1**

> **Havaianas** — Five years bringing Brazilian campaigns to Europe.

**Nivel 2**

> Campaign adaptation for EMEAI, 2017–2022
>
> I led the team adapting each Havaianas campaign for the EMEAI market: key visuals, retail spaces, final artwork, and motion for stores and social media. Knowing each campaign in depth let us protect the details that make it work in every format. When the brand renewed its identity in 2021, we also brought it to their Madrid headquarters.

## Copy: Contact

> Let's talk
>
> anaonadal@gmail.com · [LinkedIn](https://www.linkedin.com/in/anadal)

Sin teléfono y sin CV en la web: solo email y LinkedIn. Sin texto de versión ni estado en el pie. Contact es una sección fija (sticky) donde la línea guía llega a la figura de la onda.

## Reglas que no se rompen

- Ningún enlace a trabajo interno, en ninguna parte de la web.
- Proyectos no publicados: sin nombre de empresa, sin pantallas reales ni datos. Solo artefactos recreados en estilo neutro.
- La imagen hero de Resa lleva el caption "Concept design". El resto de imágenes y vídeos de Resa llevan como caption el nombre del archivo.
- No se usan imágenes con marca de agua ni moodboards con trabajo de terceros.
- Sin teléfono ni CV en la web.

## Backlog (no construir todavía)

- Brand refresh para una empresa de iluminación: fuera por ahora.
- Revisar el equilibrio de Keep it clean, que de momento tiene un solo caso.

## Copy retirado de la web

Estas secciones se quitaron de la home. Su copy se conserva por si vuelven.

### Kept / Cut

> **Cut:** Endless mockups. Buzzwords. Decoration.
>
> **Kept:** How I think. How I decide. How I work with a team.

### Now

**Nivel 1**

> Conversation design · Designing with AI · Service design · Accessibility

**Nivel 2**

> Right now I'm designing how people talk to AI, and how AI fits into their real work. I use service design to see the whole experience, not only the screen. And I treat accessibility (WCAG) as part of every project from the start.
