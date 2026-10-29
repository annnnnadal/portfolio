/* Homepage scroll animations (GSAP + ScrollTrigger, local copies in /vendor).
   1. Square transitions: the stepped edges build up square by square, scrubbed to the scroll.
   2. Principles: pinned, one principle at a time; the figure on the right recomposes from a fixed pool of pieces.
   With prefers-reduced-motion nothing here runs: the page shows its static design. */
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var root = document.documentElement;

  var mm = gsap.matchMedia();
  var MOTION = "(prefers-reduced-motion: no-preference)";

  /* ---------- 1. Square transitions ---------- */

  // Small deterministic randomness, so the order is the same on every visit
  function rand(seed) { var x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); }

  mm.add(MOTION, function () {
    root.classList.add("gsap-on");                              // CSS smooth scrolling off: it fights the snapping
    document.querySelectorAll(".pixel-edge").forEach(function (edge, e) {
      var down = edge.classList.contains("pixel-edge-down");     // hangs from the section above: grows from its top
      var squares = Array.prototype.slice.call(edge.querySelectorAll(".px")).map(function (el) {
        var cs = el.style;
        return { el: el, x: parseFloat(cs.getPropertyValue("--x")), y: parseFloat(cs.getPropertyValue("--y")) };
      });
      var tl = gsap.timeline({ paused: true });
      squares.forEach(function (sq, i) {
        // Staggered by column (right to left, from the edge of the screen inwards), with a little randomness;
        // in a column with two squares, the one nearest the edge goes first.
        var col = 5 - sq.x;
        var at = col * 0.16 + rand(i + e * 10 + 1) * 0.1 + (down ? sq.y : 1 - sq.y) * 0.12;
        gsap.set(sq.el, { scale: 0, transformOrigin: down ? "50% 0%" : "50% 100%" });
        tl.to(sq.el, { scale: 1, duration: 0.5, ease: "power2.out" }, at);
      });
      ScrollTrigger.create({
        trigger: edge.parentElement, start: "top 40%", end: "top top", scrub: 0.6, animation: tl,
        refreshPriority: -1                                    // measured after the Principles pin adds its length
      });
    });
    return function () { root.classList.remove("gsap-on"); };
  });

  /* ---------- 2. Principles: one at a time, the figure recomposes ---------- */

  var section = document.querySelector(".principles");
  var list = section && section.querySelector(".principle-list");
  var items = section ? Array.prototype.slice.call(section.querySelectorAll(".principle")) : [];
  if (section && list && items.length === 3) {
    /* The stage: one box (223 × 233.5 Figma px, the three figures as placed in Figma) and a pool of 4 pieces,
       the most any figure needs. Positions in % of the stage; border-radius in % of the piece itself, so
       everything scales with the stage. A piece not needed in a figure sits exactly behind another one
       (same box, same colour). Pieces later in the pool are drawn on top. */
    var W = 223, H = 233.5;
    // Corner radii (top-left, top-right, bottom-right, bottom-left), each "horizontal% vertical%" of the piece.
    // Animated corner by corner: GSAP does not read the elliptical "a b / c d" shorthand.
    var RECT = ["0% 0%", "0% 0%", "0% 0%", "0% 0%"];
    var HALF = ["1.86% 3.88%", "1.86% 3.88%", "50% 96.12%", "50% 96.12%"];   // flat edge on top, slightly rounded corners
    var ROUND = ["50% 50%", "50% 50%", "50% 50%", "50% 50%"];
    var ARCH = ["46.07% 50%", "46.07% 50%", "46.07% 50%", "46.07% 50%"];     // the 191 × 176 rounded rectangle, radius 88
    var CORNERS = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"];
    function box(x, y, w, h, r, c) {
      var v = { left: x / W * 100 + "%", top: y / H * 100 + "%", width: w / W * 100 + "%", height: h / H * 100 + "%", c: c };
      CORNERS.forEach(function (k, i) { v[k] = r[i]; });
      return v;
    }
    function geometry(s) { var v = {}; ["left", "top", "width", "height"].concat(CORNERS).forEach(function (k) { v[k] = s[k]; }); return v; }
    var STATES = [
      // 01 Show the direction: four steps (each one 2 px wider, tucked under the next, so no joint shows)
      [box(0, 207, 58, 51, RECT, "yellow"), box(56, 157, 58, 101, RECT, "yellow"), box(112, 106, 57, 152, RECT, "yellow"), box(167, 55, 56, 203, RECT, "yellow")],
      // 02 Keep it compelling: the half-disc (two pieces) and the circle in front (two pieces)
      [box(7.1, 103, 214.8, 103, HALF, "green"), box(7.1, 103, 214.8, 103, HALF, "green"), box(58.1, 46.75, 113.1, 113.1, ROUND, "blue"), box(58.1, 46.75, 113.1, 113.1, ROUND, "blue")],
      // 03 Keep it clean: base (two pieces), arch, and the cream opening in front
      [box(15, 128.73, 191, 79, RECT, "pink"), box(15, 31.73, 191, 176, ARCH, "pink"), box(15, 128.73, 191, 79, RECT, "pink"), box(69.9, 93.96, 80, 116, RECT, "cream")]
    ];
    function token(name) { return getComputedStyle(document.body).getPropertyValue("--" + name).trim(); }

    function build(perPrinciple) {
      section.classList.add("is-anim");
      var stage = document.createElement("div");
      stage.className = "morph";
      stage.setAttribute("aria-hidden", "true");
      var pieces = STATES[0].map(function () {
        var p = document.createElement("span"); p.className = "morph-piece"; stage.appendChild(p); return p;
      });
      list.insertBefore(stage, list.firstChild);
      var texts = items.map(function (li) { return li.querySelector(".principle-text"); });

      function place(i, s, withColour) {
        var v = geometry(s);
        if (withColour) v.backgroundColor = token(s.c);
        gsap.set(pieces[i], v);
      }
      STATES[0].forEach(function (s, i) { place(i, s, true); });
      gsap.set(texts, { autoAlpha: 0, y: 24 });
      gsap.set(texts[0], { autoAlpha: 1, y: 0 });

      /* Timeline, 3 units long: 01 rests 0–0.4, moves 0.4–1.1, 02 rests 1.1–1.9, moves 1.9–2.6, 03 rests 2.6–3.
         Snapping goes to the middle of each rest (progress 0, 0.5, 1). */
      var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
      tl.set({}, {}, 3);                                     // fixes the length
      [[0, 1, 0.4], [1, 2, 1.9]].forEach(function (step) {
        var from = step[0], to = step[1], at = step[2], dur = 0.7;
        // Text: the outgoing one fades and rises 24 px, the incoming one comes from 24 px below, slightly overlapping
        tl.to(texts[from], { autoAlpha: 0, y: -24, duration: 0.36, ease: "power2.in" }, at);
        tl.fromTo(texts[to], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.36, ease: "power2.out", immediateRender: false }, at + 0.3);
        // Pieces: same start and end for all, a tiny stagger (0.02 of a 0.7 move), straight paths, no rotation
        // (from → to, both given, so nothing is read from the page and scrolling back is exact)
        STATES[to].forEach(function (s, i) {
          var a = STATES[from][i];
          tl.fromTo(pieces[i], geometry(a), Object.assign(geometry(s), { duration: dur - 0.06, immediateRender: false }), at + i * 0.02);
          // The colour changes in the middle of the movement, quickly, so it never looks muddy
          tl.fromTo(pieces[i], { backgroundColor: token(a.c) }, { backgroundColor: token(s.c), duration: 0.1, ease: "none", immediateRender: false }, at + dur / 2 - 0.05 + i * 0.02);
        });
      });

      var st = ScrollTrigger.create({
        trigger: section,
        start: "top top+=40",                                  // under the topbar
        end: function () { return "+=" + Math.round(window.innerHeight * perPrinciple * 3); },
        pin: true, scrub: 0.5, animation: tl, invalidateOnRefresh: true,
        snap: { snapTo: [0, 0.5, 1], inertia: false, duration: { min: 0.4, max: 0.6 }, ease: "power2.inOut", delay: 0.08 }
      });

      return function () {
        st.kill(); tl.kill();
        stage.remove();
        gsap.set(texts, { clearProps: "all" });
        section.classList.remove("is-anim");
      };
    }

    mm.add("(min-width: 861px) and " + MOTION, function () { return build(1); });
    mm.add("(max-width: 860px) and " + MOTION, function () { return build(0.8); });
  }

  // The footer spacer and the fonts change the page height after load: measure again then
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
