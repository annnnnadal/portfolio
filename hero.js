/* About hero: the five shapes float, compose on scroll (GSAP + ScrollTrigger), then become a balance game
   (Matter.js, local copy in /vendor). The real DOM/SVG shapes are moved to follow the physics bodies (no canvas).

   Each .shape gets four nested layers, so the motions never fight over the same transform:
     .shape      position at rest (CSS) + the composition's translation (scroll)
     .sh-play    the game: translation and rotation from the physics body, relative to the composed place
     .sh-turn    the composed rotation and scale (the pill lies flat, the triangle points up…)
     .sh-float   the gentle floating
   Coordinates are px inside .about-frame. Figma coordinates are px of the 1440 frame (node 42:568). */
(function () {
  "use strict";
  var about = document.querySelector(".about");
  var frame = about && about.querySelector(".about-frame");
  if (!frame || !window.gsap) return;
  var hasST = !!window.ScrollTrigger, M = window.Matter;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var IDS = ["half", "diamond", "circle", "pill", "triangle"];     // the stack, top to bottom (diamond and circle side by side)
  /* The composition (Figma 42:568), per shape: centre of its box, rotation and scale from its drawing to the stack */
  var STACK = {
    half:     { x: 1296,   y: 441.5, rot: 0,     sc: 1 },
    diamond:  { x: 1212,   y: 558,   rot: 0,     sc: 1 },
    circle:   { x: 1338,   y: 565,   rot: 0,     sc: 0.872 },
    pill:     { x: 1277,   y: 674,   rot: 24.19, sc: 1 },
    triangle: { x: 1263.1, y: 793.5, rot: -22,   sc: 1.4 }
  };
  var PLAY_RIGHT = 1420, FLOOR = 828;                               // the play area's right edge and floor, in Figma px
  /* Detours so that nothing crosses the text: the pill goes over the top, the diamond and the circle along the bottom */
  var VIA = {
    pill: [[260, 45], [1277, 45]],
    diamond: [[157, 770], [1212, 770]],
    circle: [[231.5, 790], [1338, 790]]
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
    var pr = { left: playArea.offsetLeft, top: playArea.offsetTop, width: playArea.offsetWidth, height: playArea.offsetHeight };
    pr.right = pr.left + pr.width; pr.bottom = pr.top + pr.height;
    var any = shapes.half;
    var kRest = any.el.offsetWidth / any.w;                       // px per Figma px for the shapes at rest
    var k = mobile ? 0.6 : kRest;                                  // ...and in the stack
    IDS.forEach(function (id) {
      var s = shapes[id], st = STACK[id];
      s.rest = { x: s.el.offsetLeft + s.el.offsetWidth / 2, y: s.el.offsetTop + s.el.offsetHeight / 2 };
      s.target = { x: pr.right - (PLAY_RIGHT - st.x) * k, y: pr.bottom - (FLOOR - st.y) * k };
      s.dx = s.target.x - s.rest.x; s.dy = s.target.y - s.rest.y;
      s.rot = st.rot; s.sc = st.sc * k / kRest;
    });
    geo = { play: pr, k: k, kRest: kRest, mobile: mobile };
  }
  function fig(x, y) {                                             // Figma point → translation for a shape (detours)
    var k = geo.kRest;
    return { x: x * k, y: y * k };
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
    var engine = M.Engine.create({ enableSleeping: true });
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
    // Floor, walls, a high ceiling (pieces can be dropped from above) and the shuffle button as an obstacle
    var P = geo.play, W = 400;
    var floor = Bodies.rectangle((P.left + P.right) / 2, P.bottom + W / 2, P.width + 2 * W, W, { isStatic: true, friction: 1 });
    var statics = [floor,
      Bodies.rectangle(P.left - W / 2, P.bottom - 2000, W, 4000 + W, { isStatic: true }),
      Bodies.rectangle(P.right + W / 2, P.bottom - 2000, W, 4000 + W, { isStatic: true }),
      Bodies.rectangle((P.left + P.right) / 2, P.bottom - 4000 - W / 2, P.width + 2 * W, W, { isStatic: true })];
    var b = shuffleBtn.getBoundingClientRect(), fr = frame.getBoundingClientRect();
    if (!geo.mobile || b.width) statics.push(Bodies.rectangle(b.left - fr.left + b.width / 2, b.top - fr.top + b.height / 2, b.width + 8, b.height + 8, { isStatic: true }));
    M.Composite.add(engine.world, list.map(function (x) { return x.body; }).concat(statics));
    // Asleep until touched: the composition holds as it is
    list.forEach(function (x) { M.Sleeping.set(x.body, true); });
    return { engine: engine, list: list, floor: floor, drag: null };
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
    M.Engine.update(world.engine, 1000 / 60);
    sync();
    checkBalance();
    if (assist && (performance.now() - assist > 4000 || world.list.every(function (x) { return x.body.isSleeping; }))) setAssist(false);
    // Everything asleep and already checked: stop until the next touch or shuffle
    if (!world.drag && (settled || !interacted) && world.list.every(function (x) { return x.body.isSleeping; })) return;
    raf = requestAnimationFrame(loop);
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
    var c = M.Constraint.create({ pointA: pt, bodyB: hit, pointB: { x: pt.x - hit.position.x, y: pt.y - hit.position.y }, stiffness: 0.12, damping: 0.08, length: 0 });
    M.Composite.add(world.engine.world, c);
    world.drag = { c: c, id: e.pointerId };
    about.classList.add("is-dragging");
    try { frame.setPointerCapture(e.pointerId); } catch (err) {}
    settled = false; wake();
  }
  function onMove(e) {
    if (!world || !world.drag || e.pointerId !== world.drag.id) return;
    world.drag.c.pointA = localPoint(e);
    M.Sleeping.set(world.drag.c.bodyB, false);
  }
  function endDrag() {
    if (!world || !world.drag) return;
    M.Composite.remove(world.engine.world, world.drag.c);
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
      : [["diamond"], ["pill"], ["half"], pair("circle")];
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
    var bottom = P.bottom - 1 - drop, cx = (P.left + P.right) / 2 + (Math.random() - 0.5) * 16 * geo.k, under = {};
    rows.forEach(function (r) {
      var bs = r.map(box), fs = r.map(function (id, i) { return foot(id, bs[i], r.length); });
      var wAll = fs.reduce(function (t, w) { return t + w; }, 0) + gap * (r.length - 1);
      var left = cx - wAll / 2, hRow = 0;
      r.forEach(function (id, i) {
        var b = by[id].body, bd = b.bounds, q = bs[i];
        // Side by side; the circle alone sits on the square; a circle on the left overhangs to the left
        var x = r.length === 1 && id === "circle" ? under.diamond : id === "circle" && i === 0 ? left + fs[i] - q.w / 2 : left + q.w / 2;
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
    if (world) world.list.forEach(function (x) { x.body.frictionAir = on ? 0.2 : 0.01; });
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
        var s = shapes[id], via = VIA[id];
        var path = (via || []).map(function (p) { return p; });
        if (!path.length) {
          tl.fromTo(s.el, { x: 0, y: 0 }, { x: function () { return s.dx; }, y: function () { return s.dy; }, duration: 0.8 }, 0.2);
        } else {
          // Detours, in Figma px from the shape's rest centre (measured each refresh)
          var seg = [0, 0.3, 0.72, 1];
          path.concat([null]).forEach(function (p, i) {
            tl.to(s.el, {
              x: function () { if (!p) return s.dx; var q = fig(p[0], p[1]); return q.x - s.rest.x; },
              y: function () { if (!p) return s.dy; var q = fig(p[0], p[1]); return q.y - s.rest.y; },
              duration: seg[i + 1] - seg[i]
            }, seg[i]);
          });
        }
        tl.fromTo(s.turn, { rotation: 0, scale: 1 }, { rotation: function () { return s.rot; }, scale: function () { return s.sc; }, duration: id === "pill" ? 0.3 : 0.7, transformOrigin: "50% 50%" }, id === "pill" ? 0 : 0.3);
      });
      tl.fromTo([game, shuffleBtn], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "none" }, 0.88);
      var st = ScrollTrigger.create({
        trigger: about, start: "top top+=40", end: "+=50%", pin: true, scrub: 0.6, animation: tl,
        invalidateOnRefresh: true, refreshPriority: 2,
        onUpdate: function (self) { amp = 1 - self.progress; },
        onLeave: function () { amp = 0; enterGame(); },
        onEnterBack: function () { exitGame(true); },
        onRefreshInit: function () { exitGame(false); measure(); },
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
