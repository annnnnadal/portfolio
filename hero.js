/* About hero: the five shapes float, compose on scroll (GSAP + ScrollTrigger), then become a balance game
   (Matter.js, local copy in /vendor). The real DOM/SVG shapes are moved to follow the physics bodies (no canvas).

   Each .shape gets four nested layers, so the motions never fight over the same transform:
     .shape      position at rest (CSS) + the composition's translation (scroll)
     .sh-play    the game: translation and rotation from the physics body, relative to the composed place
     .sh-turn    the composed rotation and scale (the pill lies flat, the triangle points up…)
     .sh-float   the gentle floating
   Coordinates are px inside .about-frame, the hero's 1440 px container. Figma coordinates are px of the 1440 frame
   (node 42:568). The world is the container: a floor along its whole width, walls at both sides, a ceiling at its top,
   and the texts as invisible static bodies, so the pieces can be thrown anywhere, never cover a text, never leave. */
(function () {
  "use strict";
  var about = document.querySelector(".about");
  var frame = about && about.querySelector(".about-frame");
  if (!frame || !window.gsap) return;
  var hasST = !!window.ScrollTrigger, M = window.Matter;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var IDS = ["half", "diamond", "circle", "pill", "triangle"];     // the stack, top to bottom (diamond and circle side by side)
  /* The composition (Figma 42:568), per shape: centre of its box, rotation and scale from its drawing to the stack.
     It stands under the lead, centre-right, on the floor (the triangle's base, y 946); CX is its middle. */
  var STACK = {
    half:     { x: 1155.5, y: 560,   rot: 0,     sc: 1 },
    diamond:  { x: 1070.6, y: 676.6, rot: 0,     sc: 1 },
    circle:   { x: 1196,   y: 683,   rot: 0,     sc: 0.872 },
    pill:     { x: 1135,   y: 792.2, rot: 24.19, sc: 1 },
    triangle: { x: 1121.6, y: 911.8, rot: -22,   sc: 1.4 }
  };
  var FLOOR = 946, CX = 1130, AREA = { l: 1005, r: 1255, t: 426 };   // the floor, and the stack's area (Figma px)
  /* Paths so that nothing crosses the text (Figma px, centre of the shape): the pill over the headline and down the
     right side, the half-disc down its right side, the diamond and the circle under the lead */
  var VIA = {
    pill: [[260, 45], [1300, 45], [1300, 792]],
    half: [[1250, 317.5], [1250, 560]],
    diamond: [[157, 800], [1070.6, 800]],
    circle: [[231.5, 850], [1196, 850]]
  };

  var shapes = {};
  IDS.forEach(function (id) {
    var el = document.getElementById("shape-" + id);
    var play = document.createElement("span"), turn = document.createElement("span"), flt = document.createElement("span");
    play.className = "sh-play"; turn.className = "sh-turn"; flt.className = "sh-float";
    while (el.firstChild) flt.appendChild(el.firstChild);
    turn.appendChild(flt); play.appendChild(turn); el.appendChild(play);
    shapes[id] = { id: id, el: el, play: play, turn: turn, flt: flt,
      w: parseFloat(el.style.getPropertyValue("--w")), h: parseFloat(el.style.getPropertyValue("--h")) };
  });

  var playArea = frame.querySelector(".hero-play");
  var game = frame.querySelector(".hero-game");
  var label = frame.querySelector(".hero-game-label");
  var shuffleBtn = frame.querySelector(".hero-shuffle");
  var playBtn = frame.querySelector(".hero-play-btn");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileMQ = window.matchMedia("(max-width: 860px)");

  /* ---------- Measuring (on start and on refresh, never while scrolling) ---------- */

  var geo = {};
  function measure() {
    var mobile = mobileMQ.matches;
    var any = shapes.half;
    var kRest = any.el.offsetWidth / any.w;                       // px per Figma px for the shapes at rest
    var k = mobile ? 0.6 : kRest;                                  // ...and in the stack
    var map, floor;
    if (mobile) {
      // On mobile the stack stands in the area under the copy, centred, on the hero's bottom edge
      var pa = { left: playArea.offsetLeft, top: playArea.offsetTop, width: playArea.offsetWidth, height: playArea.offsetHeight };
      floor = pa.top + pa.height;
      map = function (X, Y) { return { x: pa.left + pa.width / 2 + (X - CX) * k, y: floor - (FLOOR - Y) * k }; };
    } else {
      floor = FLOOR * k;
      map = function (X, Y) { return { x: X * k, y: Y * k }; };
    }
    IDS.forEach(function (id) {
      var s = shapes[id], st = STACK[id];
      s.rest = { x: s.el.offsetLeft + s.el.offsetWidth / 2, y: s.el.offsetTop + s.el.offsetHeight / 2 };
      s.target = map(st.x, st.y);
      s.dx = s.target.x - s.rest.x; s.dy = s.target.y - s.rest.y;
      s.rot = st.rot; s.sc = st.sc * k / kRest;
    });
    var a0 = map(AREA.l, AREA.t), a1 = map(AREA.r, FLOOR);
    geo = { k: k, kRest: kRest, mobile: mobile, floor: floor, W: frame.offsetWidth,
      play: { left: a0.x, top: a0.y, right: a1.x, bottom: floor, width: a1.x - a0.x, height: floor - a0.y } };
  }
  function fig(x, y) {                                             // Figma point → px in the frame (desktop paths)
    return { x: x * geo.kRest, y: y * geo.kRest };
  }

  /* ---------- 1. Floating ---------- */

  var amp = 0, floatOn = false, t0 = performance.now();
  var PH = IDS.map(function (id, i) { return { px: i * 1.7, py: i * 2.3 + 1, pr: i * 0.9 + 2, tx: 6 + i * 0.7, ty: 7.5 - i * 0.3, tr: 9 - i * 0.6 }; });
  function floatTick() {
    var t = (performance.now() - t0) / 1000;
    IDS.forEach(function (id, i) {
      var p = PH[i], a = amp;
      gsap.set(shapes[id].flt, {
        x: Math.sin(t / p.tx * Math.PI * 2 + p.px) * 8 * a,
        y: Math.sin(t / p.ty * Math.PI * 2 + p.py) * 8 * a,
        rotation: Math.sin(t / p.tr * Math.PI * 2 + p.pr) * 3 * a
      });
    });
  }
  function startFloat() { if (!floatOn) { floatOn = true; gsap.ticker.add(floatTick); } }
  function stopFloat() { if (floatOn) { floatOn = false; gsap.ticker.remove(floatTick); IDS.forEach(function (id) { gsap.set(shapes[id].flt, { x: 0, y: 0, rotation: 0 }); }); } }

  /* ---------- Composed state (static) ---------- */

  function setComposed(on) {
    IDS.forEach(function (id) {
      var s = shapes[id];
      gsap.set(s.el, { x: on ? s.dx : 0, y: on ? s.dy : 0 });
      gsap.set(s.turn, { rotation: on ? s.rot : 0, scale: on ? s.sc : 1, transformOrigin: "50% 50%" });
    });
    gsap.set([game, shuffleBtn], { autoAlpha: on ? 1 : 0 });
  }

  /* ---------- 3. The balance game ---------- */

  var world = null;           // { engine, bodies: [{ s, body, a0, off }], floor, drag, ... }
  var running = false, raf = 0, visible = true, interacted = false;
  var stillSince = 0, shownBalance = false, settled = false, assist = 0, labelTimer = 0;

  function localPoint(evt) {
    var r = frame.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }
  function samplePath(path, n) {
    var L = path.getTotalLength(), pts = [];
    for (var i = 0; i < n; i++) { var p = path.getPointAtLength(L * i / n); pts.push({ x: p.x, y: p.y }); }
    return pts;
  }
  // Points of a shape's drawing (its own px) → points around the composed centre (stack px)
  function toLocal(s, pts) {
    var a = s.rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), k = geo.k * STACK[s.id].sc;
    return pts.map(function (p) {
      var x = p.x - s.w / 2, y = p.y - s.h / 2;
      return { x: (x * c - y * sn) * k, y: (x * sn + y * c) * k };
    });
  }

  function buildWorld() {
    var Bodies = M.Bodies, k = geo.k;
    var engine = M.Engine.create({ enableSleeping: true, positionIterations: 10, velocityIterations: 8 });
    engine.gravity.y = 1;
    var opts = { friction: 0.7, frictionStatic: 1, restitution: 0.02, slop: 0.02, density: 0.002 };
    var list = [];
    IDS.forEach(function (id) {
      var s = shapes[id], T = s.target, body, a0 = 0, off = { x: 0, y: 0 };
      if (id === "pill") {
        body = Bodies.rectangle(T.x, T.y, 200 * k, 90.33 * k, Object.assign({ chamfer: { radius: 45.16 * k } }, opts));
      } else if (id === "diamond") {
        a0 = Math.PI / 4;
        body = Bodies.rectangle(T.x, T.y, 90.28 * k, 90.28 * k, Object.assign({ angle: a0 }, opts));
      } else if (id === "circle") {
        body = Bodies.circle(T.x, T.y, 66.43 * 0.872 * k, Object.assign({}, opts));
      } else {
        // Half-disc and triangle: the outline of the real drawing
        var path = s.el.querySelector(".piece path");
        var pts = toLocal(s, id === "triangle" ? [{ x: 69.62, y: 0 }, { x: 82.19, y: 87.27 }, { x: 0, y: 54.1 }] : samplePath(path, 32));
        pts = M.Vertices.hull(pts);                                // convex (sampling can leave tiny dents)
        off = M.Vertices.centre(pts);
        body = Bodies.fromVertices(T.x + off.x, T.y + off.y, [pts], opts);
        M.Body.setPosition(body, { x: T.x + off.x, y: T.y + off.y });
      }
      list.push({ s: s, body: body, a0: a0, off: off });
    });
    // The container: a floor along its whole width, walls at both sides and a ceiling at its top
    var W = geo.W, F = geo.floor, T = 400;
    var floor = Bodies.rectangle(W / 2, F + T / 2, W + 2 * T, T, { isStatic: true, friction: 1 });
    var statics = [floor,
      Bodies.rectangle(-T / 2, F / 2, T, F + 2 * T, { isStatic: true }),
      Bodies.rectangle(W + T / 2, F / 2, T, F + 2 * T, { isStatic: true }),
      Bodies.rectangle(W / 2, -T / 2, W + 2 * T, T, { isStatic: true })];
    // The texts and buttons, line by line, as invisible static bodies: the pieces bounce off them
    var texts = textRects(), textBodies = texts.map(function (r) {
      return Bodies.rectangle((r.l + r.r) / 2, (r.t + r.b) / 2, r.r - r.l, r.b - r.t, { isStatic: true, friction: 0.3 });
    });
    statics = statics.concat(textBodies);
    M.Composite.add(engine.world, list.map(function (x) { return x.body; }).concat(statics));
    // Asleep until touched: the composition holds as it is
    list.forEach(function (x) { M.Sleeping.set(x.body, true); });
    return { engine: engine, list: list, floor: floor, drag: null, texts: texts, textBodies: textBodies };
  }

  function sync() {
    world.list.forEach(function (x) {
      var b = x.body, da = b.angle - x.a0, c = Math.cos(da), sn = Math.sin(da);
      var cx = b.position.x - (x.off.x * c - x.off.y * sn), cy = b.position.y - (x.off.x * sn + x.off.y * c);
      x.s.play.style.transform = "translate(" + (cx - x.s.target.x).toFixed(2) + "px," + (cy - x.s.target.y).toFixed(2) + "px) rotate(" + (da * 180 / Math.PI).toFixed(2) + "deg)";
    });
  }

  function loop() {
    raf = 0;
    if (!world || !running || !visible) return;
    // Two substeps per frame and a speed limit, so a thrown piece never tunnels through a text or the floor
    for (var n = 0; n < 2; n++) { drive(); M.Engine.update(world.engine, 1000 / 120); limit(); }
    sync();
    checkBalance();
    if (assist && (performance.now() - assist > 4000 || world.list.every(function (x) { return x.body.isSleeping; }))) setAssist(false);
    // Everything asleep and already checked: stop until the next touch or shuffle
    if (!world.drag && (settled || !interacted) && world.list.every(function (x) { return x.body.isSleeping; })) return;
    raf = requestAnimationFrame(loop);
  }
  var MAX_V = 18, MAX_W = 0.35;
  function limit() {
    var F = geo.floor, W = geo.W;
    world.list.forEach(function (x) {
      var b = x.body, v = b.velocity, sp = Math.sqrt(v.x * v.x + v.y * v.y);
      if (sp > MAX_V) M.Body.setVelocity(b, { x: v.x * MAX_V / sp, y: v.y * MAX_V / sp });
      if (Math.abs(b.angularVelocity) > MAX_W) M.Body.setAngularVelocity(b, MAX_W * Math.sign(b.angularVelocity));
      // Outside the hero after all: back above the floor, near the composition
      var p = b.position;
      // (or caught over a text, squeezed between two of them: never left covering it)
      if (p.x < -20 || p.x > W + 20 || p.y > F + 20 || p.y < -20 || (!(world.drag && world.drag.b === b) && overText(b))) {
        M.Body.setVelocity(b, { x: 0, y: 0 }); M.Body.setAngularVelocity(b, 0);
        M.Body.setPosition(b, { x: (geo.play.left + geo.play.right) / 2, y: geo.play.top });
      }
    });
  }
  /* Rectangles (px in the frame) of the texts and buttons of the hero, with a little margin: one solid block per
     text (the text itself, not its box), since thin line-by-line walls let a dragged piece squeeze between them */
  function textRects() {
    var fr = frame.getBoundingClientRect(), out = [], m = 6;
    function add(r) { if (r.width && r.height) out.push({ l: r.left - fr.left - m, r: r.right - fr.left + m, t: r.top - fr.top - m, b: r.bottom - fr.top + m }); }
    frame.querySelectorAll(".about-eyebrow, .about h1, .about-lead, .hero-game-label, .hero-game-text").forEach(function (el) {
      var rg = document.createRange(); rg.selectNodeContents(el);
      add(rg.getBoundingClientRect());
    });
    frame.querySelectorAll(".hero-shuffle, .hero-play-btn").forEach(function (el) { add(el.getBoundingClientRect()); });
    return out;
  }
  function overText(b) {
    for (var i = 0; i < world.textBodies.length; i++) {
      var c = M.Collision.collides(b, world.textBodies[i]);
      if (c && c.depth > 8) return true;
    }
    return false;
  }
  function inText(x, y, pad) {
    for (var i = 0; i < world.texts.length; i++) {
      var r = world.texts[i];
      if (x > r.l - pad && x < r.r + pad && y > r.t - pad && y < r.b + pad) return r;
    }
    return null;
  }
  function wake() { if (world && running && visible && !raf) raf = requestAnimationFrame(loop); }

  function enterGame() {
    if (world || !M) return;
    world = buildWorld();
    running = true; interacted = false; shownBalance = false;
    about.classList.add("is-game");
    sync(); wake();
  }
  function exitGame(animate) {
    if (!world) return;
    running = false; cancelAnimationFrame(raf); raf = 0;
    endDrag();
    M.Engine.clear(world.engine);
    world = null;
    about.classList.remove("is-game");
    IDS.forEach(function (id) {
      var p = shapes[id].play;
      if (animate) gsap.to(p, { x: 0, y: 0, rotation: 0, duration: 0.4, ease: "power2.out", onStart: function () { p.style.transform = ""; }, overwrite: true });
      else { p.style.transform = ""; gsap.set(p, { clearProps: "transform" }); }
    });
  }

  /* Drag and drop (mouse and touch): a soft spring from the pointer to the point of the piece that was grabbed */
  function onDown(e) {
    if (!world || !running || (geo.mobile && !about.classList.contains("is-playing"))) return;
    var pt = localPoint(e);
    var hit = M.Query.point(world.list.map(function (x) { return x.body; }), pt)[0];
    if (!hit) return;
    e.preventDefault();
    interacted = true; shownBalance = false;
    if (assist) setAssist(false);
    M.Sleeping.set(hit, false);
    // The grabbed point, in the piece's own frame (it turns with the piece)
    var a = -hit.angle, dx = pt.x - hit.position.x, dy = pt.y - hit.position.y;
    world.drag = { b: hit, off: { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) }, target: pt, id: e.pointerId };
    about.classList.add("is-dragging");
    try { frame.setPointerCapture(e.pointerId); } catch (err) {}
    settled = false; wake();
  }
  // The pointer pulls the piece, but never into a text: inside one, the pull stops at its nearest edge
  function outside(pt) {
    var r = inText(pt.x, pt.y, 8);
    if (!r) return pt;
    var d = [pt.x - (r.l - 8), (r.r + 8) - pt.x, pt.y - (r.t - 8), (r.b + 8) - pt.y], m = Math.min.apply(null, d);
    if (m === d[0]) return { x: r.l - 8, y: pt.y };
    if (m === d[1]) return { x: r.r + 8, y: pt.y };
    if (m === d[2]) return { x: pt.x, y: r.t - 8 };
    return { x: pt.x, y: r.b + 8 };
  }
  function onMove(e) {
    if (!world || !world.drag || e.pointerId !== world.drag.id) return;
    world.drag.target = outside(localPoint(e));
    M.Sleeping.set(world.drag.b, false);
  }
  /* Each substep, the grabbed point is driven towards the pointer by its velocity (not by moving it), so the
     collisions always win: a piece pulled against a text stops at its edge. It swings gently under its own weight. */
  function drive() {
    var d = world.drag; if (!d) return;
    var b = d.b, c = Math.cos(b.angle), sn = Math.sin(b.angle);
    var gx = b.position.x + d.off.x * c - d.off.y * sn, gy = b.position.y + d.off.x * sn + d.off.y * c;
    M.Sleeping.set(b, false);
    M.Body.setVelocity(b, { x: (d.target.x - gx) * 0.35, y: (d.target.y - gy) * 0.35 });
    M.Body.setAngularVelocity(b, b.angularVelocity * 0.9 + (b.position.x - gx) * 0.00006);
  }
  function endDrag() {
    if (!world || !world.drag) return;
    world.drag = null;
    about.classList.remove("is-dragging");
  }
  frame.addEventListener("pointerdown", onDown);
  frame.addEventListener("pointermove", onMove);
  frame.addEventListener("pointerup", endDrag);
  frame.addEventListener("pointercancel", endDrag);

  /* "Perfect balance.": all five stacked (one on the floor, all touching), still for 1 s, after the visitor played */
  function checkBalance() {
    if (!interacted || world.drag) { stillSince = 0; return; }
    var still = world.list.every(function (x) { return x.body.isSleeping || (x.body.speed < 0.12 && Math.abs(x.body.angularVelocity) < 0.008); });
    if (!still) { stillSince = 0; shownBalance = false; settled = false; return; }
    if (shownBalance || settled) return;
    var now = performance.now();
    if (!stillSince) { stillSince = now; settled = false; return; }
    if (now - stillSince < 1000) return;
    // Contacts measured from the shapes themselves (sleeping bodies have no active collision pairs):
    // two pieces touch when their outlines, grown by 2 px, overlap
    var n = world.list.length, polys = world.list.map(function (x) { return grow(x.body.vertices, x.body.position, 2); });
    var floorY = geo.play.bottom - 2, onFloor = 0, links = [], seen = {}, stack = [0];
    world.list.forEach(function (x, i) { links[i] = []; if (x.body.bounds.max.y >= floorY) onFloor++; });
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) if (overlap(polys[i], polys[j])) { links[i].push(j); links[j].push(i); }
    while (stack.length) { var q = stack.pop(); if (seen[q]) continue; seen[q] = true; links[q].forEach(function (m) { stack.push(m); }); }
    settled = true;
    if (onFloor === 1 && Object.keys(seen).length === n) { shownBalance = true; say("Perfect balance."); }
  }
  function grow(vs, c, d) {
    return vs.map(function (v) { var dx = v.x - c.x, dy = v.y - c.y, l = Math.sqrt(dx * dx + dy * dy) || 1; return { x: v.x + dx / l * d, y: v.y + dy / l * d }; });
  }
  function separated(A, B) {                                       // an edge of A separates the two (SAT)
    for (var i = 0; i < A.length; i++) {
      var a = A[i], b = A[(i + 1) % A.length], nx = b.y - a.y, ny = a.x - b.x;
      var minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity, k, d;
      for (k = 0; k < A.length; k++) { d = A[k].x * nx + A[k].y * ny; if (d < minA) minA = d; if (d > maxA) maxA = d; }
      for (k = 0; k < B.length; k++) { d = B[k].x * nx + B[k].y * ny; if (d < minB) minB = d; if (d > maxB) maxB = d; }
      if (maxA < minB || maxB < minA) return true;
    }
    return false;
  }
  function overlap(A, B) { return !separated(A, B) && !separated(B, A); }
  function say(text) {
    clearTimeout(labelTimer);
    gsap.to(label, { autoAlpha: 0, duration: 0.2, onComplete: function () {
      label.textContent = text;
      gsap.to(label, { autoAlpha: 1, duration: 0.3 });
      labelTimer = setTimeout(function () {
        gsap.to(label, { autoAlpha: 0, duration: 0.4, onComplete: function () { label.textContent = "Touch and play"; gsap.to(label, { autoAlpha: 1, duration: 0.3 }); } });
      }, 3200);
    } });
  }

  /* Shuffle: the five pieces drop from above the play area in a random order, roughly on top of each other */
  function shuffle() {
    if (geo.mobile && !about.classList.contains("is-playing")) setPlaying(true);
    if (!world) enterGame();
    if (!world) return;
    endDrag();
    interacted = true; shownBalance = false; stillSince = 0;
    var by = {}; world.list.forEach(function (x) { by[x.s.id] = x; });
    /* A random arrangement that can stand. Only flat-topped pieces can hold another (the pill flat, the half-disc
       lying on its dome, the diamond as a square), and the circle and the triangle's point hold nothing, so they go
       on top, on the half-disc's long flat side: the triangle beside the square with the circle on it, or the
       triangle beside the circle with the square at the bottom. Sides and small tilts are random. */
    var flip = Math.random() < 0.5, pair = function (a) { return flip ? [a, "triangle"] : ["triangle", a]; };
    var rows = Math.random() < 0.5
      ? [["pill"], ["half"], pair("diamond"), ["circle"]]
      : [["diamond"], ["pill"], ["half"], ["triangle", "circle"]];   // the overhanging circle on the side away from the lead
    var POSE = { half: 0.552, diamond: -Math.PI / 4, pill: 0, triangle: 0, circle: 0 };   // from the composed angle
    var P = geo.play, gap = 3 * geo.k, total = 0;
    world.list.forEach(function (x) {
      var b = x.body;
      M.Sleeping.set(b, false);
      M.Body.setVelocity(b, { x: 0, y: 0 }); M.Body.setAngularVelocity(b, 0);
      M.Body.setAngle(b, x.a0 + POSE[x.s.id] + (Math.random() - 0.5) * 0.06);
    });
    function box(id) { var bd = by[id].body.bounds; return { w: bd.max.x - bd.min.x, h: bd.max.y - bd.min.y }; }
    function foot(id, q, n) { return id === "circle" && n > 1 ? q.w * 0.6 : q.w; }   // a circle beside a piece may overhang
    rows.forEach(function (r) { total += Math.max.apply(null, r.map(function (id) { return box(id).h; })) + gap; });
    // Built just above the floor and dropped from a short height (reduced motion: placed on the floor),
    // all inside the play area, so it usually stands and never falls over the text
    var drop = reduce ? 0 : Math.max(0, Math.min(0.05 * P.height, P.height - total - 8));
    var bottom = P.bottom - 1 - drop, cx = (P.left + P.right) / 2 + (geo.mobile ? 0 : 10 * geo.k) + (Math.random() - 0.5) * 12 * geo.k, under = {};
    rows.forEach(function (r) {
      var bs = r.map(box), fs = r.map(function (id, i) { return foot(id, bs[i], r.length); });
      var wAll = fs.reduce(function (t, w) { return t + w; }, 0) + gap * (r.length - 1);
      var left = cx - wAll / 2, hRow = 0;
      r.forEach(function (id, i) {
        var b = by[id].body, bd = b.bounds, q = bs[i];
        // Side by side; the circle alone sits on the square. Beside the triangle, the circle may tuck in over the
        // triangle's slope: both stand near the middle of the half-disc, where it doesn't tip
        var x = r.length === 1 && id === "circle" ? under.diamond : left + q.w / 2;
        if (r.join() === "triangle,circle") x = cx + (id === "circle" ? 46 : -46) * geo.k;
        // By the outline, not the centre of mass (the half-disc and the triangle have it off-centre)
        var ox = b.position.x - (bd.min.x + bd.max.x) / 2, oy = b.position.y - (bd.min.y + bd.max.y) / 2;
        M.Body.setPosition(b, { x: x + ox + (Math.random() - 0.5) * 6 * geo.k, y: bottom - q.h / 2 + oy });
        under[id] = x; left += fs[i] + gap; hRow = Math.max(hRow, q.h);
      });
      bottom -= hRow + gap;
    });
    // Settling help: heavily damped until the pile falls asleep (or the visitor grabs a piece), so a roughly
    // balanced stack comes to rest before it can tip; once asleep, any touch brings the normal physics back
    setAssist(true);
    settled = false; wake();
  }
  function setAssist(on) {
    assist = on ? performance.now() : 0;
    if (world) world.list.forEach(function (x) { x.body.frictionAir = on ? 0.12 : 0.01; });
  }
  shuffleBtn.addEventListener("click", shuffle);

  /* Mobile: Play / Done turns the game on and off (touch-action: none on the play area only while playing) */
  function setPlaying(on) {
    about.classList.toggle("is-playing", on);
    if (playBtn) { playBtn.setAttribute("aria-pressed", String(on)); playBtn.textContent = on ? "Done" : "Play"; }
    if (on) { enterGame(); running = true; wake(); }
    else if (world) { endDrag(); running = false; }
  }
  if (playBtn) playBtn.addEventListener("click", function () { setPlaying(!about.classList.contains("is-playing")); });

  /* Pause the engine when the hero is off-screen (and on mobile, leave the game) */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) wake();
      else if (geo.mobile && about.classList.contains("is-playing")) setPlaying(false);
    }).observe(about);
  }

  /* ---------- 2. Compose on scroll, per context ---------- */

  var mm = gsap.matchMedia();
  function start() {
    measure();

    // Desktop with motion: float, then the pinned composition; the game starts when it is complete
    mm.add("(min-width: 861px) and (prefers-reduced-motion: no-preference)", function () {
      measure();
      amp = 1; startFloat();
      gsap.set([game, shuffleBtn], { autoAlpha: 0 });
      var tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      IDS.forEach(function (id) {
        var s = shapes[id], via = VIA[id] || [];
        // Each shape follows its path (rest → detour points → its place in the stack), timed by distance
        var proxy = { t: 0 };
        function along(t) {
          var pts = [{ x: 0, y: 0 }].concat(via.map(function (q) { var f = fig(q[0], q[1]); return { x: f.x - s.rest.x, y: f.y - s.rest.y }; }), [{ x: s.dx, y: s.dy }]);
          var lens = [], total = 0;
          for (var i = 1; i < pts.length; i++) { var l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); lens.push(l); total += l; }
          var d = t * total, j = 0;
          while (j < lens.length - 1 && d > lens[j]) { d -= lens[j]; j++; }
          var u = lens[j] ? Math.min(1, d / lens[j]) : 1;
          gsap.set(s.el, { x: pts[j].x + (pts[j + 1].x - pts[j].x) * u, y: pts[j].y + (pts[j + 1].y - pts[j].y) * u });
        }
        tl.fromTo(proxy, { t: 0 }, { t: 1, duration: via.length ? 1 : 0.8, onUpdate: function () { along(proxy.t); } }, via.length ? 0 : 0.15);
        tl.fromTo(s.turn, { rotation: 0, scale: 1 }, { rotation: function () { return s.rot; }, scale: function () { return s.sc; }, duration: id === "pill" ? 0.25 : 0.7, transformOrigin: "50% 50%" }, id === "pill" ? 0 : 0.3);
      });
      tl.fromTo([game, shuffleBtn], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "none" }, 0.88);
      /* Pinned with the design centred under the topbar: from the label to the floor. On a short screen the pin
         starts a little later, so the whole composition is in view; on a tall one it starts at once. */
      function startAt() {
        var top = about.getBoundingClientRect().top + window.pageYOffset;
        var mid = frame.offsetTop + (104 + FLOOR) / 2 * geo.kRest;
        return Math.max(0, Math.round(top + mid - (40 + (window.innerHeight - 40) / 2)));
      }
      var st = ScrollTrigger.create({
        trigger: about, start: startAt, end: function () { return startAt() + Math.round(window.innerHeight * 0.5); },
        pin: true, scrub: 0.6, animation: tl,
        invalidateOnRefresh: true, refreshPriority: 2,
        onUpdate: function (self) { amp = 1 - self.progress; },
        onLeave: function () { amp = 0; enterGame(); },
        onEnterBack: function () { exitGame(true); },
        // A refresh (fonts, late images) keeps the game as it is, unless the hero changed size
        onRefreshInit: function () { var w = frame.offsetWidth; if (!world || w !== geo.W) { exitGame(false); measure(); } },
        onRefresh: function (self) { if (self.progress >= 1) enterGame(); }
      });
      return function () { st.kill(); tl.kill(); exitGame(false); stopFloat(); setComposed(false); };
    });

    // Desktop with reduced motion: the stack directly, the game ready (no floating, no pin)
    mm.add("(min-width: 861px) and (prefers-reduced-motion: reduce)", function () {
      measure(); setComposed(true); enterGame();
      var onR = function () { exitGame(false); measure(); setComposed(true); enterGame(); };
      window.addEventListener("resize", onR);
      return function () { window.removeEventListener("resize", onR); exitGame(false); setComposed(false); };
    });

    // Mobile: the stack is static so the page scrolls normally; Play turns the game on
    mm.add("(max-width: 860px)", function () {
      measure(); setComposed(true); about.classList.add("is-ready");
      var lastW = window.innerWidth;
      var onR = function () { if (window.innerWidth === lastW) return; lastW = window.innerWidth; setPlaying(false); exitGame(false); measure(); setComposed(true); };
      window.addEventListener("resize", onR);
      return function () { window.removeEventListener("resize", onR); setPlaying(false); exitGame(false); setComposed(false); about.classList.remove("is-ready"); };
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
