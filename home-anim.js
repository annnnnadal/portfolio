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

      /* Timeline, 3 units long. The rests are at 0, 1.5 and 3 (progress 0, 0.5, 1, where the snapping goes).
         Between two rests (1.5 units) the change takes 45 % (0.675) and the figure holds for the other 55 %:
         01 holds 0–0.41, changes 0.41–1.09, 02 holds 1.09–1.91, changes 1.91–2.59, 03 holds 2.59–3. */
      var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
      tl.set({}, {}, 3);                                     // fixes the length
      var CHANGE = 0.675, HALF = CHANGE / 2;
      [[0, 1, 0.75 - HALF], [1, 2, 2.25 - HALF]].forEach(function (step) {
        var from = step[0], to = step[1], at = step[2];
        // Text, in sequence: the outgoing one fades and rises 24 px in the first half and is gone at the midpoint;
        // the incoming one comes up from 24 px below in the second half. The number goes with its text.
        tl.to(texts[from], { autoAlpha: 0, y: -24, duration: HALF, ease: "power2.in" }, at);
        tl.fromTo(texts[to], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: HALF, ease: "power2.out", immediateRender: false }, at + HALF);
        // Pieces: the figure recomposes across the whole change; same start and end for all (tiny stagger), straight paths
        // (from → to, both given, so nothing is read from the page and scrolling back is exact)
        STATES[to].forEach(function (s, i) {
          var a = STATES[from][i];
          tl.fromTo(pieces[i], geometry(a), Object.assign(geometry(s), { duration: CHANGE - 0.06, immediateRender: false }), at + i * 0.02);
          // The colour changes in the middle of the movement, quickly, so it never looks muddy
          tl.fromTo(pieces[i], { backgroundColor: token(a.c) }, { backgroundColor: token(s.c), duration: 0.1, ease: "none", immediateRender: false }, at + HALF - 0.05 + i * 0.02);
        });
      });

      var st = ScrollTrigger.create({
        trigger: section,
        start: "top top+=40",                                  // under the topbar
        end: function () { return "+=" + Math.round(window.innerHeight * perPrinciple * 3); },
        pin: true, scrub: 0.5, animation: tl, invalidateOnRefresh: true,
        snap: { snapTo: [0, 0.5, 1], inertia: false, duration: { min: 0.4, max: 0.6 }, ease: "power2.inOut", delay: 0.3 }   // waits for the scroll to stop: a shorter delay snapped between wheel ticks and played the change as a cut
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

  /* ---------- 3. How I work: one figure travels down the line ---------- */

  var how = document.querySelector(".how");
  var steps = how ? Array.prototype.slice.call(how.querySelectorAll(".tl-step")) : [];
  if (how && steps.length === 5) {
    /* Which pieces of each static figure make each of the 5 pool pieces (indices in the SVG's order).
       Craft's drawing has 9 paths: each corner pair (big petal + small corner) is one piece, plus the circle. */
    var MAP = [
      [[0]],                                   // Listen: 1
      [[1], [0]],                              // Discover: top half, bottom half
      [[1], [2], [0]],                         // Plan: big D, middle, thin
      [[0], [1], [2], [3]],                    // Build together: left, top, right, bottom
      [[1, 2], [7, 4], [0, 3], [6, 5], [8]]    // Craft: four corners, then the circle
    ];
    function num(el, k) { return parseFloat(el.style.getPropertyValue("--" + k)); }

    mm.add(MOTION, function () {
      how.classList.add("is-anim");
      var timeline = how.querySelector(".timeline");
      var track = document.createElement("div");
      track.className = "tl-track"; track.setAttribute("aria-hidden", "true");
      var runner = document.createElement("div");
      runner.className = "tl-runner";
      track.appendChild(runner);
      timeline.insertBefore(track, timeline.firstChild);    // first, so .tl-step:last-child still matches

      // Build the pool: each piece has a box per step (in % of the figure) and one svg per step with its shape
      var pool = [0, 1, 2, 3, 4].map(function () {
        var el = document.createElement("span"); el.className = "run-piece"; runner.appendChild(el);
        return { el: el, boxes: [], svgs: [] };
      });
      steps.forEach(function (step, n) {
        var src = Array.prototype.slice.call(step.querySelectorAll(".figure .piece"));
        MAP[n].forEach(function (parts, i) {
          var l = 1e9, t = 1e9, r = -1e9, b = -1e9, vx = 1e9, vy = 1e9, vr = -1e9, vb = -1e9, inner = "";
          parts.forEach(function (k) {
            var pc = src[k], vb4 = pc.getAttribute("viewBox").split(" ").map(Number);
            l = Math.min(l, num(pc, "l")); t = Math.min(t, num(pc, "t"));
            r = Math.max(r, num(pc, "l") + num(pc, "w")); b = Math.max(b, num(pc, "t") + num(pc, "h"));
            vx = Math.min(vx, vb4[0]); vy = Math.min(vy, vb4[1]); vr = Math.max(vr, vb4[0] + vb4[2]); vb = Math.max(vb, vb4[1] + vb4[3]);
            inner += pc.innerHTML;
          });
          var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", [vx, vy, vr - vx, vb - vy].join(" "));
          svg.setAttribute("preserveAspectRatio", "none");
          svg.innerHTML = inner;
          pool[i].el.appendChild(svg);
          pool[i].boxes[n] = { left: l + "%", top: t + "%", width: (r - l) + "%", height: (b - t) + "%" };
          pool[i].svgs[n] = svg;
        });
      });

      var titles = steps.map(function (st) { return st.querySelector(".tl-title"); });
      var texts = steps.map(function (st) { return st.querySelector(".tl-text"); });
      var current = 0;                                          // index of the step shown (0 = Listen)

      function showShape(p, n, fade) {
        p.svgs.forEach(function (svg, k) { if (svg) gsap.to(svg, { opacity: k === n ? 1 : 0, duration: fade ? 0.2 : 0, overwrite: true }); });
      }
      function setStep(n, instant) {
        if (n === current && !instant) return;
        pool.forEach(function (p, i) {
          var needed = i <= n, had = i <= current && !instant;
          if (needed) {
            var box = p.boxes[n];
            if (had) {
              // An existing piece glides to its new place and takes its new shape
              gsap.to(p.el, Object.assign({ duration: instant ? 0 : 0.5, ease: "power3.out", overwrite: "auto" }, box));
              showShape(p, n, !instant);
            } else {
              // A new piece pops in where it belongs
              gsap.set(p.el, Object.assign({ display: "block" }, box));
              showShape(p, n, false);
              gsap.fromTo(p.el, { scale: 0 }, { scale: 1, duration: instant ? 0 : 0.4, ease: "back.out(1.6)", overwrite: "auto" });
            }
          } else if (i <= current || instant) {
            // Scrolling back: the last piece leaves
            gsap.to(p.el, { scale: 0, duration: instant ? 0 : 0.3, ease: "power2.in", overwrite: "auto",
              onComplete: function () { gsap.set(p.el, { display: "none" }); } });
          }
        });
        current = n;
        // The active step at full opacity, the others at 40 %
        titles.concat(texts).forEach(function (el, k) {
          gsap.to(el, { opacity: (k % 5) === n ? 1 : 0.4, duration: instant ? 0 : 0.3, overwrite: "auto" });
        });
      }
      pool.forEach(function (p) { gsap.set(p.el, { display: "none", scale: 0, transformOrigin: "50% 50%" }); });
      setStep(0, true);

      // A step starts when the figure (sticky, centred in the screen) crosses its title
      var triggers = steps.slice(1).map(function (st, k) {
        return ScrollTrigger.create({
          trigger: st.querySelector(".tl-title"),
          start: "top center",                                  // the title crosses the vertical centre, where the figure travels
          onEnter: function () { setStep(k + 1); },
          onLeaveBack: function () { setStep(k); }
        });
      });
      // After a refresh (resize, load), show the step that matches the scroll position, without animation
      function sync() {
        var n = 0;
        triggers.forEach(function (t, k) { if (t.progress > 0 || window.scrollY >= t.start) n = k + 1; });
        setStep(n, true);
      }
      ScrollTrigger.addEventListener("refresh", sync);

      return function () {
        ScrollTrigger.removeEventListener("refresh", sync);
        triggers.forEach(function (t) { t.kill(); });
        track.remove();
        gsap.set(titles.concat(texts), { clearProps: "opacity" });
        how.classList.remove("is-anim");
      };
    });
  }

  // The footer spacer and the fonts change the page height after load: measure again then
  /* Measure again whenever the page changes height after the first measurement: when DM Sans arrives from Google
     Fonts after the scripts ran, every text reflows and the trigger positions would be stale (the steps of How I
     work would switch far from the centre). Debounced; the page height after each refresh is the new reference. */
  var lastH = 0, rt = null;
  function remeasure() { clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); }, 150); }
  ScrollTrigger.addEventListener("refresh", function () { lastH = document.body.scrollHeight; });
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () {
      if (Math.abs(document.body.scrollHeight - lastH) > 2) remeasure();
    }).observe(document.body);
  }
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(remeasure);
    if (document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", remeasure);
  }
  window.addEventListener("load", remeasure);
})();
