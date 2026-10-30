# CLAUDE.md — Instrucciones para Claude Code

Este archivo es el brief del portfolio de Ana Nadal. Léelo entero antes de cada tarea.

## Cómo trabajar

- **Stack:** web estática con HTML, CSS y JavaScript sin frameworks. Debe desplegarse en Vercel sin configuración.
- **Idioma de la web:** inglés. Usa los textos de este documento tal cual; no reescribas el copy sin pedir permiso.
- **Niveles de lectura:** el Nivel 1 siempre visible; el Nivel 2 se despliega al interactuar (por ejemplo, con `<details>` o un botón accesible).
- **Dirección visual:** la home sigue la sección "Home (v2)" (crema, rojo y formas planas de color, diseño en Figma). Las páginas de caso siguen "Dirección visual (v1)": DM Sans, negro y blanco, retícula de 12 columnas, líneas finas.
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

**Orden de la home** (ver "Home (v2)")

1. About
2. Principles
3. Case studies (y, en el mismo fondo rojo, "Brands I've designed for")
4. How I work
5. Contact (footer fijo que se descubre al final)

Los capítulos del menú de la cabecera son "01 — About", "02 — Principles", "03 — Case studies", "04 — How I work" y "05 — Contact". Kept / Cut, Evidence y Now ya no están en la web (su copy se conserva al final, en "Copy retirado de la web").

**Orden de los principios:** Show the direction, Keep it compelling, Keep it clean.

**Parallax en las miniaturas:** la imagen de cada card con imagen de Case studies es un 30 % mayor que su marco (`scale: 1.3`) y se desplaza un 12 % de la altura del marco en cada sentido (`shift: 0.12`, constante `PX` de `script.js`) mientras la card cruza el viewport, sin dejar bordes vacíos. No se aplica con `prefers-reduced-motion`.

**Páginas de caso:** cada caso tiene su propia página y su id: `/case/resa/`, `/case/ai-tools/`, `/case/oros/`, `/case/mr-sunday/`, `/case/havaianas/`, `/case/newcomers-guide/`. Cada una es un `index.html` estático dentro de `case/<id>/`, con rutas absolutas a `/styles.css`, `/script.js` y `/images`.

- **Colores invertidos:** la página del caso tiene fondo negro y texto blanco (la home es blanco roto y negro). Las miniaturas de líneas se invierten para verse en blanco.
- **Sin imagen hero:** las páginas de caso no tienen hero. El texto ocupa la página y hace scroll normal.
- **Dos vistas de la galería: Expanded | Strip.** Un selector segmentado fijo abajo a la derecha (estilo etiqueta, dos `<button>` con `aria-pressed`, foco visible) cambia de vista; mientras se ve la tira, el selector queda justo encima. Expanded es la vista por defecto. La elección se guarda en `localStorage` (`galleryView`, dentro de `try/catch`) y un script mínimo en el `<head>` de cada caso con galería pone la clase `view-expanded` o `view-strip` en `<html>` antes de pintar. Al cambiar de vista, el texto que estaba arriba de la pantalla se queda en el mismo sitio. Sin JavaScript se ve la tira. La lista de `section.case-gallery` es la fuente de las dos vistas y marca el orden del visor (orden de lectura).
- **Expanded (constelaciones):** las imágenes flotan junto al texto que ilustran, en pequeñas constelaciones por sección (y por párrafo en Solution de Resa): en la columna izquierda bajo la etiqueta, a la derecha del texto (60ch) y en el espacio extra después del texto; la sección crece lo necesario. `script.js` mide al cargar, al cargar las fuentes, al cambiar de vista y en resizes reales (otro ancho o más de 120 px de alto, debounce de 120 ms). **Espaciado:** al menos 48 px entre cualquier imagen y cualquier texto, etiqueta o regla de sección (en vertical, más la deriva y la inclinación); cada banda termina al menos 96 px antes de la regla de la siguiente sección; las imágenes que no se solapan a propósito guardan 32 px entre ellas; ninguna comparte borde superior con otra. Si una imagen no cabe junto a una columna de texto, puede encogerse hasta un 15 % (sin bajar del mínimo); si no, baja y la banda crece. Tamaños: `l` ≈ 34vw, `m` ≈ 24vw, `s` ≈ 16vw (mínimo 260 px de ancho en horizontales y 200 px en verticales; como mucho el 75 % del alto de la ventana). Sin caption en las flotantes; clic o Enter abre el visor en esa imagen. Cada miniatura lleva sus datos de colocación, ajustados a mano: `data-section` (el `data-anchor` de la fila o del párrafo), `data-x` y `data-y` (en % del ancho de la fila, desde el inicio del texto de su ancla), `data-size` (`l|m|s`), `data-rx`, `data-ry`, `data-rz` (grados) y, si hace falta, `data-over` (el número de la imagen que solapa a propósito, como mucho un 20 % de la menor; la sigue aunque esta se mueva), `data-z` (para ponerla delante) y `data-screen` (pantallas de móvil: esquinas de 8 px en las dos vistas y en el visor, vídeo incluido; el resto, esquinas rectas). Las páginas sin `data-section` (Oros, Mr Sunday, Havaianas) reparten sus imágenes por igual entre sus secciones, en su orden, con colocaciones automáticas.
- **Inclinación y movimiento (Expanded):** `perspective(1200px)` con `rotateX/Y` (−10…10°) y `rotateZ` (−3…3°), con sombra suave acorde a la inclinación y un brillo muy tenue para separarlas del fondo negro (a petición de Ana, solo en esta vista). En Resa, values, logo-colour, booking flow y booking summary quedan casi planas (3–4° como mucho) y delante donde se solapan; fotos y piezas promocionales se inclinan más. Con el scroll derivan hasta ±40 px en vertical según su profundidad (sin deriva lateral, para respetar los 48 px junto al texto), y la rotación se suaviza hacia plano en el centro de la pantalla. Entrada: fundido, deslizamiento desde el sentido del scroll y escala 0,96 → 1, escalonada 80 ms. Los vídeos se reproducen en línea (sin sonido, en bucle, `playsinline`) solo mientras se ven; sus fuentes se cargan al acercarse. Rendimiento: solo `transform` y `opacity`, un único bucle `requestAnimationFrame`, solo para imágenes cerca del viewport (IntersectionObserver) y ninguna medida durante el scroll; imágenes con lazy loading. Con `prefers-reduced-motion`: sin deriva, sin entrada y sin reproducción automática (póster con icono de play), con la inclinación estática.
- **Expanded en móvil (hasta 860 px):** las constelaciones son bandas entre párrafos y secciones, en el flujo: imágenes de 70–85vw (las verticales por altura), alternando izquierda y derecha, 32 px entre ellas y solape solo cuando una imagen solapa a propósito a la anterior (`data-over`), 68 px hasta el texto y al menos 96 px hasta la regla siguiente, inclinación de ±6° como mucho y la deriva a la mitad. Nunca sobre el texto.
- **Strip (la tira fija abajo):** las imágenes del caso van en una galería horizontal (`section.case-gallery`, `position: sticky; bottom: 0`), al final del `<article>`, siempre visible mientras se lee. Como va en el flujo tras el texto, el último párrafo nunca queda tapado. Miniaturas de la misma altura (1/3 del alto de la ventana en escritorio y 22 % en móvil), cada una con su propia proporción (ancho automático, sin recorte), separadas 1rem, sin bordes redondeados ni sombras, sobre el fondo de la página. Scroll horizontal con rueda (la rueda vertical se convierte en horizontal sobre la galería), trackpad, arrastre con el ratón y swipe; sin barra visible y con `scroll-snap` suave. Los vídeos se ven con su póster y un pequeño icono de play. Lazy loading. En móvil, un botón pequeño ("Hide images" / "Show images") pliega y despliega la tira. Los casos NDA (AI tools y A guide for newcomers) no tienen galería ni imágenes.
- **Visor:** al hacer clic en una miniatura se abre un `<dialog>` modal (`aria-modal`, foco atrapado, botones con etiqueta): la imagen centrada, con su proporción, lo más grande posible sin recortes (máximo 90 % del ancho y del alto, caption incluido), sobre la página difuminada (`::backdrop` con `backdrop-filter: blur` y una capa semitransparente del color de fondo). Flechas a izquierda y derecha, teclas ← → y swipe en móvil. Debajo, el caption y el contador ("2 / 6"). Se cierra con la X de arriba a la derecha, con Esc o con un clic fuera de la imagen, y el foco vuelve a la imagen que lo abrió (miniatura de la tira o imagen flotante). Los vídeos se reproducen dentro del visor (sin sonido, en bucle) con el botón redondo de play/pausa; con `prefers-reduced-motion` empiezan en pausa y no hay animación de apertura ni de cambio de imagen. Todo está en `script.js`; las miniaturas llevan los datos del visor en atributos `data-` (`data-full`, `data-caption`, `data-width`, `data-height`, `data-alt` y, en vídeos, `data-video`).
- **Captions (en el visor):** en Resa, los textos escritos para cada imagen (ver "Galerías actuales"). En Oros, Mr Sunday y Havaianas, el nombre del archivo sin extensión, sin guiones y sin el prefijo de la marca ("identity panel", "typo", "promo window 1"…). Las etiquetas accesibles de las miniaturas siguen el formato "Open image 3 of 17: caption".
- **Estructura del texto:** principio, título, frase de Nivel 1, línea de datos y los bloques del caso (Challenge, Direction, Solution…), igual que en el brief.
- **Cerrar:** una "x" arriba a la derecha, en la cabecera, cierra el caso y vuelve a la home, a Case studies, con el mismo fundido. Las páginas de caso enlazan a `/#principle-direction` (Resa y AI tools), `/#principle-compelling` (Oros, Mr Sunday y Havaianas) y `/#principle-clean` (Newcomers); en la home esos tres `id` están al inicio de Case studies, que queda justo bajo la cabecera.
- **Siguiente proyecto:** si el principio tiene más de un proyecto, al final de la página hay un acceso directo al siguiente, con miniatura y el mismo fundido. El último vuelve al primero del principio. Keep it clean tiene un solo caso y no lleva acceso.
- **Transición:** un fundido suave de toda la página, de unos 250 ms, en los dos sentidos (home ↔ caso y caso ↔ caso), con View Transitions entre documentos (`@view-transition { navigation: auto }`, solo CSS). Sin soporte del navegador, o con `prefers-reduced-motion`, se navega sin animación.

## Home (v2)

Diseño en Figma: Wireframes, nodo `34:101` ("Homepage — Desktop 1443", 1440 px). Archivos: `index.html`, `home.css` (solo la home, todo bajo `body.home`), `home.js` (footer y gato), `hero.js` (formas y juego del About) y `home-anim.js` (animaciones con el scroll); `styles.css` queda para lo compartido (base, cabecera, páginas de caso). La línea guía (`guide.js`), la flor y la onda se quitaron de la home (`images/flower.svg` y `images/closing-wave.svg` se conservan sin usar). Esta versión monta la estructura y las interacciones sencillas; las animaciones complejas llegan después, así que todo está hecho por piezas sueltas, fáciles de animar.

- **Tokens:** crema #F5F5F2 · rojo #CD2605 · rojo oscuro #A41E04 · lima #E9FFAA · azul claro #DDE7FF · granate #490000. Formas: rosa #FF91C2, amarillo #FFC400, verde #007923, azul #0042E5, lila #987FFF. Tipos (DM Sans, todos fluidos con `clamp()`): label 11/1 medium mayúsculas · lead 22/30.8 · H3 40/40.8 medium −1.4 · H2 74.88/71.14 medium −3.37 · título de card 25.92/28.51 medium −0.78 · enlace 24/37.2 · titular del hero ≈150 px.
- **Cabecera:** la de siempre (hora de Madrid y menú de capítulos), en crema con texto rojo.
- **About (crema, texto rojo):** label "Ana Nadal — Product & brand design lead", titular "I turn noise / into direction" y el párrafo de About. Cinco formas planas alrededor del texto, nunca encima: píldora rosa con "Hi!" en azul (arriba a la izquierda, −25°), rombo amarillo (izquierda), medio disco verde (derecha, girado), triángulo lila (derecha) y círculo azul (abajo a la izquierda). Cada forma es una caja con su id (`#shape-pill`, `#shape-diamond`, `#shape-half`, `#shape-triangle`, `#shape-circle`) colocada en px de Figma a 1440 (`--x`, `--y`, caja `--w` × `--h`, escalados con `--s`), con las piezas de su SVG dentro (la píldora: la píldora y el "Hi!"), que `hero.js` envuelve en tres capas (`.sh-play` el juego, `.sh-turn` el giro y la escala de la composición, `.sh-float` la flotación) para que los movimientos no se pisen. Sin JavaScript, en móvil van al 60 %, en una banda encima y otra debajo del texto.
- **About interactivo (`hero.js`, Figma `42:568`):**
  - **Flotan:** al cargar, cada forma deriva ±8 px en x e y y gira ±3°, con senos lentos de 6–9 s y fases distintas.
  - **Se componen con el scroll:** el About se fija (pin) durante 50vh de scroll y las formas viajan (scrub) a una pila abajo a la derecha, de arriba abajo: medio disco verde, rombo amarillo con el círculo azul al lado, píldora "Hi!" y triángulo lila. Nunca pasan sobre el texto: la píldora va por encima del titular y el rombo y el círculo por debajo del párrafo. Al llegar aparecen el texto del juego (label "Touch and play" y "As a kid I had a wooden set of coloured shapes and spent hours making endless compositions. Now it’s your turn: drag and drop your own. Don’t lose the balance!") junto a la pila y el botón de barajar. Entre 861 y 1399 px no cabe junto al párrafo y va debajo, en la columna del texto. Al volver hacia arriba, todo se deshace.
  - **Juego de equilibrio:** con la pila compuesta, las formas son cuerpos de Matter.js 0.20.0 (copia local en `vendor/matter.min.js`) con su forma real (círculo, píldora con extremos redondos, rombo, triángulo y medio disco a partir de su trazado), dentro de un área de juego (`.hero-play`) a la derecha de la columna de texto, con suelo y paredes invisibles. Se mueven las propias formas del DOM (sin canvas). Arrastrar y soltar con ratón y táctil. Las formas empiezan dormidas (la composición de Figma se sostiene así) y caen con naturalidad si lo que se construye no se sostiene. Cuando las cinco están apiladas (solo la base toca el suelo, todas en contacto) y quietas 1 s, después de jugar, el label dice "Perfect balance." unos segundos.
  - **Barajar:** botón redondo con icono abajo a la derecha del área (tooltip y `aria-label` "Shuffle — a new random composition"). Monta una pila que se sostiene, con orden, lados e inclinación al azar: solo las piezas de arriba plana sostienen otra (la píldora, el medio disco sobre su cúpula y el rombo como cuadrado), así que el círculo y el triángulo van arriba, sobre el lado plano del medio disco. Cae desde poco más arriba y, hasta que se duerme (o se toca una pieza), va muy amortiguada para que se asiente.
  - **Rendimiento:** sleeping activado; el motor se para cuando todo duerme y cuando el About sale de la pantalla (IntersectionObserver).
  - **Móvil (hasta 860 px):** la pila es estática y la página hace scroll normal. Debajo del texto van el texto del juego y un botón "Play" que activa el juego (y pasa a "Done" para apagarlo); solo entonces el área tiene `touch-action: none`. El juego también se apaga cuando el About sale de la pantalla.
  - **`prefers-reduced-motion`:** sin flotación ni composición con el scroll (la pila se ve compuesta directamente); el juego funciona al arrastrar y barajar coloca las piezas sin caída.
- **Principles (crema, texto rojo):** label "Principles" y los tres principios apilados (número, título, texto) con su figura a la derecha: 01 escalera amarilla de 4 peldaños, 02 círculo azul sobre medio disco verde, 03 arco rosa. Cada figura va colocada como en Figma (`--px`, `--py`) y es una caja con las proporciones de su SVG (`.figure`, `--fw` × `--fh`): escalera = 4 rectángulos; compelling = medio disco + círculo; clean = base, arco y el hueco en crema. En móvil la figura va encima del texto.
- **Case studies (fondo rojo, texto y bordes de 1 px en lima):** label "Case studies"; rejilla 2×2: Resa (`images/resa/resa-thumbnail.webp`, y `resa-thumbnail-2x.webp` en pantallas de alta densidad), Signify (sin página ni imagen: caja #A41E04 con borde lima y "Coming soon" en cursiva, centrado), Oros Travel & Culture (`oros-poster`) y Mr Sunday (`mr-sunday-logo`). Debajo, el badge "● WIP" (el punto pulsa) y dos cards pequeñas con borde, sin imagen todavía: AI tools for corporate bankers y A guide for newcomers to Spain. Sus miniaturas tienen la misma proporción que las grandes (660 × 354; en móvil, a ancho completo, miden lo mismo) y llevan la misma marca de agua decorativa (`aria-hidden`): el medio disco del hero (`images/shapes/shape-half.svg`) en granate #490000, centrado, al 40 % de la altura de la miniatura y con el mismo giro en las dos. Havaianas ya no está en la home (su página sigue existiendo). En móvil, una card por fila.
- **Brands I've designed for (mismo rojo):** fila de logos de `/images/logos/` (Amadeus, Signify, BBVA, Havaianas, Avolta, Santander, Loewe; ya en lima) separados por líneas verticales de 1 px en lima y con una línea de 1 px en lima arriba y abajo, de lado a lado, que se mueve sin parar de derecha a izquierda (animación CSS; el conjunto va duplicado para que el bucle no tenga corte). Se para al pasar el ratón; con `prefers-reduced-motion` no se mueve.
- **Figuras exactas (`images/shapes/`):** las figuras de Principles (`principle-1..3.svg`), las de How I work (`step-1..5.svg`), las formas del About (`shape-*.svg`) y el gato (`cat.svg`) salen de los SVG originales de Figma. Cada trazo del SVG es una pieza: un `<svg class="piece">` propio, con su `viewBox` ajustado a ese trazo, colocado con `--l`, `--t`, `--w`, `--h` (en % de la caja de la figura) y con su color como token (`--c`, por ejemplo `var(--yellow)`). Así cada pieza se puede animar por separado. Si se cambia un SVG, hay que volver a generar sus piezas.
- **Sin juntas:** en las figuras de Principles (`.figure-seamless`), las piezas que se tocan crecen un píxel de pantalla por cada lado (un trazo de 2 px que no escala), así que se solapan a cualquier tamaño, zoom o densidad de pantalla; el hueco del arco crece algo más (`.piece-hole`) para que no asome el rosa de debajo. Las figuras de How I work conservan las pequeñas separaciones de su diseño, y la línea de tiempo no se ve a través de ellas (la caja tiene el fondo de la sección).
- **Bordes pixelados:** donde acaba el crema y empieza el rojo de Case studies, y donde empieza How I work, el borde es escalonado, de cuadrados (`.pixel-edge` con `.px`, colocados con `--x` / `--y` en cuadrados de 80 px a 1440). Arriba de Case studies suben hacia el crema; arriba de How I work cuelgan hacia el azul. Se construyen con el scroll (ver "Animaciones con el scroll").
- **How I work (azul claro, texto rojo):** H2 "How I work", la frase de introducción y una línea de tiempo: línea roja de 1 px en el centro, títulos a la izquierda (Listen, Discover, Plan, Build together, Craft; sin "Always") y los textos de Nivel 2 a la derecha. Sobre la línea, la figura de cada paso (estática por ahora), con tantas piezas como su número (de 1 a 5), hechas igual que las de los principios. El borde inferior de la sección es una curva ancha hacia abajo (`.how-curve`). En móvil la línea va a la izquierda.
- **Contact (footer, granate):** label "Contact", "Let's talk" enorme en rojo, enlaces rojos subrayados (email y LinkedIn), y abajo la marca "Concept by human / Made by AI" y la pastilla "© 2026" con sus iconos (los SVG de siempre, en rojo con `mask`). A la derecha, el gato negro sentado con los ojos rojos (`cat.svg`).
- **Footer que se descubre:** el footer está fijo debajo de la página (`position: fixed`, z-index 0); todo lo de encima tiene su fondo y va por encima (`main`, z-index 1). Al final hay un espacio transparente (`.footer-spacer`, tan alto como el footer, medido por `home.js`), así que How I work, con su curva, sube como un telón y descubre el footer. Si el footer es más alto que la pantalla, deja de ser fijo y sigue a la página, para que nunca quede nada oculto.
- **Gato:** las pupilas siguen al cursor (solo se mueven las pupilas, dentro del ojo, con suavizado `lerp`); en pantallas táctiles miran hacia el último toque. Sin interacción, y con `prefers-reduced-motion`, se quedan donde las pone el dibujo (`cat.svg`, mirando arriba a la izquierda).
- **Animaciones con el scroll (`home-anim.js`):** GSAP 3.12.5 y ScrollTrigger en copias locales (`vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js`, sin CDN); toda animación ligada al scroll se hace con ellos (también la del About, en `hero.js`, cuyo pin se mide antes que los demás: `refreshPriority: 2`). Las posiciones se vuelven a medir cada vez que la página cambia de alto después de cargar (cuando llega DM Sans de Google Fonts, por ejemplo), para que nada se dispare fuera de sitio. Con `prefers-reduced-motion` no se ejecuta nada y se ve el diseño estático. Con las animaciones activas, el scroll suave de CSS se desactiva en la home (`html.gsap-on`), porque choca con el snapping.
  - **Transiciones de cuadrados:** los cuadrados de cada borde pixelado aparecen uno a uno, escalando de 0 a 1 (`power2.out`, sin rebote), escalonados por columna (de la derecha hacia dentro) con un poco de aleatoriedad fija, y ligados al scroll (`scrub: 0.6`) mientras la sección pasa del 40 % de la pantalla a su borde superior. El estado final es exactamente el diseño estático. Arriba de Case studies (rojo que sube al crema) crecen desde abajo; arriba de How I work los cuadrados son rojos y cuelgan de Brands, así que crecen desde arriba, desde el borde. Se miden después del pin de Principles (`refreshPriority: -1`).
  - **Principles, de uno en uno:** la sección se fija bajo la cabecera durante unos 100vh por principio (80vh en móvil). Solo se ve un principio. Entre dos principios, el cambio ocupa un 45 % del scroll y la pausa el 55 %. Los textos van en secuencia, nunca a la vez: el que sale se desvanece y sube 24 px durante la primera mitad del cambio (ha desaparecido del todo a mitad), y el que entra llega desde 24 px más abajo durante la segunda mitad; el número va con su texto. Snapping suave a cada principio (al más cercano, 0,4–0,6 s, `power2.inOut`), que espera 0,3 s a que el scroll se pare (con menos, saltaba entre dos golpes de rueda y el cambio parecía un corte).
  - **La figura se recompone:** una caja (`.morph`, 223 × 233,5 px de Figma, con las tres figuras colocadas como en Figma) con un grupo fijo de 4 piezas (`.morph-piece`, las que necesita la figura más compleja). Se animan posición, tamaño, radios de las esquinas (esquina a esquina, en %) y color, de una figura a la siguiente: escalera → medio disco + círculo → arco. Las piezas que una figura no necesita se quedan exactamente detrás de otra (misma caja, mismo color). La figura se recompone durante todo el cambio. Todas las piezas empiezan y acaban juntas, con un escalonado mínimo, en línea recta, sin girar y sin pasar sobre el texto; el color cambia rápido, a mitad del movimiento; `power3.inOut`. Cada transición va de un estado dado a otro, así que al volver hacia arriba se deshace igual. Las figuras estáticas de cada principio (las de `images/shapes/`) se ocultan mientras tanto y vuelven sin animaciones.
  - **How I work, una figura que viaja:** una sola figura baja por la línea central mientras se recorre la sección: va en una pista tan larga como la línea (`.tl-track`) y es `sticky` en el centro de la pantalla (`.tl-runner`), así que se queda centrada, avanza de Listen a Craft y se para al final de la línea. Siempre tiene tantas piezas como el paso actual (de 1 a 5), de un grupo fijo de 5 piezas hechas con los trazos de las figuras estáticas (en Craft, cada esquina, pétalo grande y pequeño, es una pieza, más el círculo). Cuando el título de un paso cruza el centro vertical de la pantalla, la misma línea por la que viaja la figura (ScrollTrigger `top center`, sin scrub; igual en escritorio y móvil), las piezas que ya estaban se deslizan a su sitio (0,5 s, `power3.out`) y la nueva aparece (escala 0 → 1, 0,4 s, `back.out(1.6)`); hacia arriba, la última se va (escala a 0) y las demás vuelven. El paso activo, título y texto, al 100 %; los demás al 40 %, con un fundido de 0,3 s. Las figuras estáticas de cada paso se ocultan mientras tanto. En móvil, la figura es más pequeña (36 px) y viaja por la línea de la izquierda. Su centro usa `50dvh`, el mismo que mide ScrollTrigger aunque las barras del navegador del móvil aparezcan y desaparezcan. Con `prefers-reduced-motion`, cada paso muestra su figura estática sobre la línea.
- **Móvil (hasta 860 px):** una columna; principios con la figura encima del texto; línea de tiempo a la izquierda; una card por fila; el marquee sigue moviéndose; el gato más pequeño.

**Dos niveles de lectura**

- **Nivel 1, en diagonal:** una frase corta y humana. Se entiende el enfoque en segundos.
- **Nivel 2, en profundidad:** aparece al interactuar (desplegar, clicar o hover). Mantiene el detalle completo de los textos.

**Experiencia**

- Web dinámica con imágenes abstractas. Nada literal: la casa no se dibuja.
- Transiciones entre home y caso con un fundido suave de toda la página (View Transitions API).
- Carga rápida, responsive en cualquier dispositivo, accesible (WCAG AA como mínimo).

**Profundidad por tipo de caso**

| Tipo | Casos | Contenido |
| --- | --- | --- |
| Caso completo | Resa, Oros | Challenge, Direction, Solution, Outcome con imágenes (y vídeos en Resa) |
| Caso de proceso (NDA) | AI tools for corporate bankers, A guide for newcomers to Spain | Sin nombres ni pantallas; miniatura de líneas en lugar de imagen y artefactos recreados en estilo neutro |
| Pieza de craft | Mr Sunday, Havaianas | Una imagen potente y la decisión de detalle que la explica |

## Dirección visual (v1)

Se aplica a las páginas de caso (la home sigue "Home (v2)"). Versión sencilla para presentar ya: tipografía protagonista, retícula visible y líneas finas, en azul #0044FF sobre blanco roto.

- **Tipografía:** DM Sans (Google Fonts). Jerarquía muy marcada: titulares enormes y ajustados, texto de lectura pequeño y limpio, etiquetas en mayúsculas pequeñas.
- **Color:** fondo blanco roto y todo lo demás en azul #0044FF: texto, líneas, retícula y figuras SVG. Las páginas de caso son negro con blanco.
- **Retícula:** 12 columnas, líneas de la retícula de 1 px, visibles y muy finas en algunas secciones, como en un plano. Azul al 4 % de opacidad y siempre en el fondo: las imágenes van por encima. Reglas y bordes, 1 px.
- **Cabecera:** barra fija con fondo opaco (100 %). A la izquierda, Madrid con la hora local en directo; a la derecha, el número y nombre del capítulo en curso ("03 — How I work"). Al hacer clic en el capítulo se abre un menú con los capítulos para saltar de uno a otro dentro de la página. Sin versión, sin estado y sin nombre en la cabecera.
- **Imágenes abstractas:** composiciones de líneas finas con ritmo y pausas, nunca literales. Las miniaturas de los casos sin imagen (AI tools, A guide for newcomers) son composiciones de elipses y órbitas de línea fina, SVG de `images/generated/` (`ai-tools.svg` —versión con la mitad de líneas, usada tal cual en escritorio y móvil— y `newcomers-guide.svg`, 1600×1200, con su propia animación CSS al cargar y los grosores del archivo; en la página del caso se ven en blanco con `filter: brightness(0) invert(1)`).
- **Imágenes de proyecto:** esquinas rectas, sin bordes redondeados ni sombras (salvo la sombra suave de las imágenes flotantes de la vista Expanded).
- **Movimiento:** discreto. En las miniaturas generadas cada línea se dibuja por separado, con su propio retraso, para un movimiento fluido y orgánico (lo hacen al entrar en pantalla). El nivel 2 se despliega con suavidad y el punto de WIP pulsa.
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

En la home, How I work es una línea de tiempo (ver "Home (v2)"): la frase "How I take a project from the first conversation to the final design." encima, y para cada paso su nombre y su texto de Nivel 2, sin numeración y sin "Always" (su copy se conserva aquí). El Nivel 1 de los pasos no se usa por ahora.

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

| Principio | Caso | Tipo | Carpeta de imágenes | Card: tipo de proyecto |
| --- | --- | --- | --- | --- |
| Show the direction | Resa | Completo | images/resa (card de la home: resa-thumbnail; "siguiente proyecto": resa-thumb; galería: ver "Galerías actuales") | Brand strategy, UX/UI |
| — | Signify | Coming soon (sin página) | — | Brand strategy, UX/UI |
| Show the direction | AI tools for corporate bankers | Proceso (NDA), WIP | images/generated (líneas) | Conversation design, UX/UI |
| Keep it compelling | Oros Travel & Culture | Craft | images/oros (thumbnail: oros-poster; galería: todas) | Brand identity & website |
| Keep it compelling | Mr Sunday | Craft | images/mr-sunday | Brand identity |
| Keep it compelling | Havaianas | Craft | images/havaianas | Campaign adaptation for EMEAI |
| Keep it clean | A guide for newcomers to Spain | Proceso (NDA) | images/generated (líneas) | UX strategy, content structure, UI, art direction |

En las cards va solo el tipo de proyecto, sin la posición y sin años. Ningún caso lleva años: ni las cards de la home, ni el acceso "siguiente proyecto", ni la línea de datos de cada página de caso (los años que forman parte del texto, como "Q4 2026" o "in 2021", se quedan).

**Imágenes de las páginas de caso:** cada página muestra en su galería todas las imágenes de su carpeta (salvo Resa, que usa una selección) (la versión `.webp`; los `.png`, `.jpg`, `.mov` y `.mp4` originales se conservan sin usar). Al añadir una imagen a una carpeta, hay que añadirla también a la galería de su página. La miniatura de la card de la home (y del acceso "siguiente proyecto") es independiente: Resa usa `resa-thumbnail` (660×354) en la card de la home y `resa-thumb` (1600×1200) en el acceso "siguiente proyecto"; ninguna está en la galería (`resa-mockup-thumb` se conserva sin usar); en los demás casos la miniatura es también la primera imagen de la galería.

**Galerías actuales:**
- **Resa (19), en orden de lectura, de visor y de la tira**, con su sección, su caption y su colocación en Expanded:
  - Challenge: 1 `resa-promo-tote` ("Living la vida Resa, on a tote"; mediana, a la derecha, a la altura del último párrafo), 2 `resa-concept-billboard` ("The ‘Somos Resa’ billboard"; grande, izquierda, en la banda bajo el texto), 3 `resa-promo-cap` ("The cap"; mediana, derecha, bajo la tote, solapando un poco su esquina inferior izquierda).
  - Direction: 4 `resa-brand-values` ("Brand values, from the discovery workshop"; mediana, columna izquierda bajo la etiqueta, casi plana), 5 `resa-brand-typography` ("Bricolage Grotesque for headlines, Outfit for text"; mediana, a la derecha del texto, arriba), 6 `resa-brand-icons` ("The icon set"; bajo typography, solapándola un poco, algo a la izquierda), 7 `resa-brand-logo-colour` ("Logo and palette, with accessible digital tints"; bajo icons, solapando un poco, algo a la derecha, casi plana), 8 `resa-promo-tee` ("Icons on a tee"; mediana vertical, izquierda, en la banda bajo el texto), 9 `resa-promo-card` ("‘Esta tarde quería ver a nadie’"; pequeña, sobre la esquina inferior derecha de la camiseta), 10 `resa-brand-notebook` ("A notebook: ‘You’ll want to remember everything’"; mediana, centro-derecha, más abajo que la camiseta).
  - Solution, párrafo 1: 11 `resa-web-pages` ("The live site: home, students and travellers"; grande, derecha, arriba de la banda), 12 `resa-web-menu-laptop` ("One menu, two audiences"; grande, izquierda, más abajo), 13 `resa-concept-web-mobile-students-page` ("The students page on mobile"; pequeña, vertical, sobre la esquina inferior derecha del portátil, delante, esquinas de 8 px).
  - Solution, párrafo 2: 14 vídeo `resa-web-desktop-homepage-hero` ("Scrolling the homepage"; grande, derecha), 15 vídeo `resa-concept-web-mobile-students-page-hero` ("Scrolling the students page on mobile"; mediana vertical, izquierda, con su borde superior a media altura del vídeo 14, esquinas de 8 px), 16 vídeo `resa-web-desktop-homepage-gallery` ("The photo gallery on the homepage"; mediana, derecha, bajo el 14 solapándolo un poco), 17 `resa-booking-flow` ("Booking in four steps"; grande, centro-izquierda, bajo el vídeo móvil, casi plana), 18 `resa-booking-summary` ("Step 2: the summary travels with you"; grande, derecha, sobre la esquina inferior derecha del 17, casi plana, delante), 19 `resa-booking-moments` ("The last step, in Resa’s voice"; mediana, izquierda, bajo el 17).
  - Fuera de la galería (los archivos se conservan): `resa-mockup-hero`, `resa-web-colour-modules`, `resa-brand-applications`, `resa-web-menu`, `resa-concept-merchandising` y `resa-web-desktop-concept-homepage-hero`.
- **Oros (6):** `oros-poster`, `oros-identity-panel`, `oros-website`, `oros-business-cards`, `oros-stickers`, `oros-tote-bag`.
- **Mr Sunday (5):** `mr-sunday-logo`, `mr-sunday-typo`, `mr-sunday-color-palette`, `mr-sunday-linkedin-banner`, `mr-sunday-linkedin`.
- **Havaianas (6):** `Havainas-promo-window-2`, `Havainas-promo`, `Havainas-promo-window-1`, `havainas-caravan`, `havainas-office`, `havainas-office-lockers`.

### Resa

**Nivel 1**

> **Resa** — Two businesses, two brands, one website.

**Nivel 2**

> Design Lead · Brand strategy, UX/UI · With SEO, content strategy, data and an external development team
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
> [Imágenes y vídeos de images/resa, en la galería fija]

**Enlace:** al inicio de la página, bajo los datos del caso, va el enlace a la web, que es el proyecto principal: [Visit the website →](https://resa.es/) (se abre en pestaña nueva).

**Imágenes (images/resa):** en la galería (ver "Galerías actuales"): en Expanded, junto a su sección; en Strip, en la tira. La página no tiene bloque Outcome.

**Vídeos:** en Expanded se reproducen en línea mientras se ven; en la tira se ven con su póster y un icono de play; en el visor se reproducen, sin sonido y en bucle, con un botón circular en el centro para reproducir y pausar. Con `prefers-reduced-motion` quedan en pausa hasta pulsar el botón. Cada vídeo está optimizado para web (mp4 y webm sin audio, con póster en WebP, sufijo `-web`); los originales se conservan en la carpeta.

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

> Brand Designer, co-lead · Brand identity, web design, art direction · With the creative director, an illustrator, a copywriter and an external development team
>
> **Challenge**
> Oros designs tailor-made performance tours in Spain for orchestras, bands and choirs, mostly from the United States, but also from Latin America and Europe. After twenty years working alongside his parents, Nacho took over the family business and added a word to its name: culture.
>
> That word explains how Oros works. A tour is more than a concert: groups play with local musicians, discover the food and get to know the places they visit, so every trip builds a bond between two countries. The old identity didn't show any of this, and it's exactly what sets Oros apart.
>
> **Direction**
> *Fly and connect.* The whole identity grew from one idea: travelling to meet others. Migra, a serif inspired by bird migration, carries it into every piece.
>
> *Warmth over formality.* We presented two concepts, and the team chose the one built on orange: the energy, warmth and joy people associate with Spain.
>
> *Close, like the team.* There's no bureaucracy at Oros. Nacho and his team listen to what each group wants and plan the trip down to the last detail, in direct contact. Illustration brought that same closeness to the brand.
>
> *Real moments.* Photography stays at the centre of the story, and many of the photos are Nacho's own.
>
> **Solution**
> I co-led the new identity with the studio's creative director: visual system, personality and tone of voice. I passed the concept and illustration style to the illustrator, and worked with an external copywriter on the texts. We designed the website in-house and supervised its development with an external team.
>
> From the identity came everything else: a series of concert posters, brochures, business cards, tote bags and merchandise. After the launch, I kept designing every new piece the team needed.
>
> **Outcome**
> The relationship continues today: Oros still uses the identity, and the studio keeps creating new pieces with it.
> [Imágenes de images/oros, en la galería fija]

**Enlace:** bajo la línea de datos, [Visit the website →](https://orostravel.com/) (se abre en pestaña nueva). La página sigue la estructura de Resa: principio, título, frase de Nivel 1, línea de datos, enlace, Challenge, Direction, Solution y Outcome (solo texto; las imágenes van en la galería fija).

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

> Campaign adaptation for EMEAI
>
> I led the team adapting each Havaianas campaign for the EMEAI market: key visuals, retail spaces, final artwork, and motion for stores and social media. Knowing each campaign in depth let us protect the details that make it work in every format. When the brand renewed its identity in 2021, we also brought it to their Madrid headquarters.

## Copy: Contact

> Let's talk
>
> anaonadal@gmail.com · [LinkedIn](https://www.linkedin.com/in/anadal)

Sin teléfono y sin CV en la web: solo email y LinkedIn. Sin texto de versión ni estado en el pie.

Contact es el footer fijo que se descubre al final (ver "Home (v2)"). El footer decorativo ("Concept by human / Made by AI" con `images/cabezas-footer.svg`, la pastilla "© 2026" y `images/fecha-icons.svg`) lleva `aria-hidden="true"`.

## Reglas que no se rompen

- Ningún enlace a trabajo interno, en ninguna parte de la web.
- Proyectos no publicados: sin nombre de empresa, sin pantallas reales ni datos. Solo artefactos recreados en estilo neutro.
- En la galería de Resa, cada imagen lleva el caption escrito para ella (ver "Galerías actuales").
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
