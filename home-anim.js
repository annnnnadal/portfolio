/* Homepage scroll animations (GSAP + ScrollTrigger, local copies in /vendor).
   1. Section colours: the page's background and text colour dissolve from one section to the next.
   2. Principles: pinned, one principle at a time; each figure takes two steps, then grows into the next background.
   3. How I work: one figure travels down the timeline.
   With prefers-reduced-motion only the colour switch runs: the page shows its static design. */
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var root = document.documentElement;

  var mm = gsap.matchMedia();
  var MOTION = "(prefers-reduced-motion: no-preference)";

  /* ---------- 1. Section colours: one dissolve per boundary ---------- */

  /* The page (main) has one background and one text colour, --page-bg / --page-fg; each section declares its pair
     (data-bg / data-fg). Where the pair changes, the two colours dissolve from one pair to the next while the boundary
     crosses the screen from 75 % to 35 % of its height, scrubbed. All the changes live in one timeline, laid out in
     scroll px, so the colour is always the one of the current position, in either direction. Measured after the pins
     (refreshPriority -1) and again on every refresh. With reduced motion, the colours switch at the boundary. */
  var page = document.querySelector("main.page");
  var parts = Array.prototype.slice.call(document.querySelectorAll("main.page > [data-bg]"));
  var bounds = [];
  parts.forEach(function (sec, i) {
    var prev = parts[i - 1];
    if (prev && (prev.dataset.bg !== sec.dataset.bg || prev.dataset.fg !== sec.dataset.fg)) bounds.push({ sec: sec, from: prev.dataset, to: sec.dataset });
  });
  function pair(d) { return { "--page-bg": d.bg, "--page-fg": d.fg }; }
  var principlesST = null;                                    // the Principles pin (section 2), when there is one

  if (page && parts.length) {
    gsap.set(page, pair(parts[0].dataset));

    mm.add(MOTION, function () {
      root.classList.add("gsap-on");                              // CSS smooth scrolling off: it fights the snapping
      // One trigger per boundary, only to measure where it starts and ends (pins included)
      var marks = bounds.map(function (b) {
        return ScrollTrigger.create({ trigger: b.sec, start: "top 75%", end: "top 35%", refreshPriority: -1 });
      });
      var tl = gsap.timeline({ paused: true });
      var st = ScrollTrigger.create({ start: 0, end: function () { return ScrollTrigger.maxScroll(window); }, scrub: 0.6, animation: tl, refreshPriority: -2 });
      // Rebuilt in place after every refresh (the positions change), keeping the current progress
      function build() {
        var max = ScrollTrigger.maxScroll(window) || 1;
        tl.clear();
        tl.set(page, pair(parts[0].dataset), 0);
        // Principles: the page turns lavender, then light blue, exactly when the growing figure has filled the section
        var pst = principlesST, len = pst ? pst.end - pst.start : 0;
        if (pst) {
          // (2 px early: the figure has covered the section by then, and the page never lags behind it)
          tl.set(page, { "--page-bg": "#B7C3F3" }, pst.start + len / 3 - 2);
          tl.set(page, { "--page-bg": "#DDE7FF" }, pst.start + len * 2 / 3 - 2);
        }
        bounds.forEach(function (b, i) {
          var m = marks[i], from = pst && b.from.bgEnd ? { bg: b.from.bgEnd, fg: b.from.fg } : b.from;
          tl.fromTo(page, pair(from), Object.assign(pair(b.to), { duration: Math.max(1, m.end - m.start), ease: "none", immediateRender: false }), Math.max(0, m.start));
        });
        tl.set({}, {}, max);                                      // the timeline is as long as the page scroll
        tl.progress(Math.min(1, Math.max(0, window.pageYOffset / max)));
      }
      build();
      ScrollTrigger.addEventListener("refresh", build);
      return function () {
        ScrollTrigger.removeEventListener("refresh", build);
        marks.forEach(function (m) { m.kill(); });
        st.kill(); tl.kill();
        gsap.set(page, pair(parts[0].dataset));
        root.classList.remove("gsap-on");
      };
    });

    // Reduced motion: the colours switch at the boundary (its middle point), with no interpolation
    mm.add("(prefers-reduced-motion: reduce)", function () {
      var marks = bounds.map(function (b) {
        return ScrollTrigger.create({
          trigger: b.sec, start: "top 55%",
          onEnter: function () { gsap.set(page, pair(b.to)); },
          onLeaveBack: function () { gsap.set(page, pair(b.from)); }
        });
      });
      return function () { marks.forEach(function (m) { m.kill(); }); };
    });
  }

  /* ---------- 2. Principles: one at a time; each figure grows into the next background ---------- */

  /* Figma 107:207 (01.1/01.2 85:121 + 85:150, 02.1/02.2 85:178 + 85:218, 03.1/03.2 85:268 + 89:512).
     The figures are drawn on a stage in Figma px (a 1440 × 800 frame) that is scaled and placed to fit the section:
     on desktop like the frame (the container's left edge, centred vertically), on mobile the right part of the frame
     (x 720–1440) above the text. Each principle: step 1 → step 2 over the first 40 % of its scroll, a hold, then (01
     and 02) the figure grows over the last 30 % until it fills the section and becomes the next background. The
     background itself is the page colour (--page-bg), switched by the section-colour timeline at the exact moments
     the growing figure has covered everything, so it never shows a seam. */
  var section = document.querySelector(".principles");
  var list = section && section.querySelector(".principle-list");
  var items = section ? Array.prototype.slice.call(section.querySelectorAll(".principle")) : [];
  var BG = ["#F5F5F2", "#B7C3F3", "#DDE7FF"];                // 01 cream, 02 lavender, 03 light blue
  var EASE = "power2.inOut";

  function el(cls, parent) { var d = document.createElement("div"); d.className = cls; if (parent) parent.appendChild(d); return d; }
  /* One stage; `only` limits it to one principle's figure (the still version) */
  function makeStage(host, only) {
    var stage = el("p-stage"), design = el("p-design", stage), f = { stage: stage, design: design, cols: [] };
    stage.setAttribute("aria-hidden", "true");
    if (only == null || only === 0) {
      // 01: four lines placed like the edges of a staircase, rising to the right (the last one runs off the edge)
      for (var i = 0; i < 4; i++) { var c = el("p-col", design); c._x = 825 + 205 * i; c._y = 670 - 205 * i; f.cols.push(c); }
    }
    if (only == null || only === 1) {
      // 02: the coral half under the flat side, the large half-disc, and the thin ring outlining the full circle
      f.fig2 = el("p-fig2", design);
      f.coral = el("p-half-coral", f.fig2); f.half = el("p-half-big", f.fig2); f.ring = el("p-ring", f.fig2);
    }
    if (only == null || only === 2) {
      // 03: the lime arch, and its mirrored copy hinged on the arch's top
      f.fig3 = el("p-fig3", design);
      f.archB = el("p-arch", f.fig3); f.archA = el("p-arch", f.fig3);
    }
    host.insertBefore(stage, host.firstChild);
    return f;
  }
  /* Place the stage: scale k, offset (tx, ty) in px; the section's own rectangle in Figma px (the fill), the floor
     the 01 lines grow to, and how much the 02 half-disc must grow to cover everything */
  function measure(f, W, H, mobile, areaTop, areaBottom) {
    var g = {};
    if (mobile) {
      var A = Math.max(120, areaBottom - areaTop);
      g.k = Math.min(W / 720, A / 760);
      g.tx = (W - 720 * g.k) / 2 - 720 * g.k;
      g.ty = areaTop + (A - 760 * g.k) / 2 - 40 * g.k;
    } else {
      g.k = Math.min(W, 1440) / 1440;
      g.tx = (W - 1440 * g.k) / 2;
      g.ty = H / 2 - 400 * g.k;
    }
    g.x0 = -g.tx / g.k; g.x1 = (W - g.tx) / g.k; g.y0 = -g.ty / g.k; g.y1 = (H - g.ty) / g.k;
    g.floor = mobile ? (areaBottom - g.ty) / g.k : g.y1;
    g.line = 1 / g.k;                                          // 1 screen px
    // 02: scaled about its centroid, the half-disc's flat side must pass the section's left edge and its dome
    // must reach every corner (it is turned 90° clockwise by then: dome to the right)
    var cx = 1075, cy = 406, r = 338, d = 143, S = (cx - g.x0 + 24) / d + 1;
    function covers(S) {
      var ccx = cx - d * (S - 1), R = r * S;
      return [[g.x0, g.y0], [g.x1, g.y0], [g.x0, g.y1], [g.x1, g.y1]].every(function (p) { return Math.hypot(p[0] - ccx, p[1] - cy) < R - 24; });
    }
    while (!covers(S) && S < 60) S += 0.5;
    g.S2 = S;
    f.geo = g;
    gsap.set(f.design, { x: g.tx, y: g.ty, scale: g.k });
    return g;
  }
  // The states, in Figma px
  function col01(f, i, step) {
    var c = f.cols[i], g = f.geo;
    var w = 205 + g.line;                                      // one screen px of overlap: no seams between columns
    if (step === 1) return { left: c._x, top: c._y, width: w, height: g.line };
    if (step === 2) return { left: c._x, top: c._y, width: w, height: g.floor - c._y };
    // filled: all of them full height, the first reaching the left edge, the last the right edge
    var left = i === 0 ? g.x0 - 2 : c._x, right = i === 3 ? Math.max(c._x + 205, g.x1 + 2) : c._x + w;
    return { left: left, top: g.y0 - 2, width: right - left, height: g.y1 - g.y0 + 4 };
  }
  function setStatic(f, which) {
    // A principle at its step 2 (the still version)
    if (which === 0) f.cols.forEach(function (c, i) { gsap.set(c, col01(f, i, 2)); });
    if (which === 1) { gsap.set(f.fig2, { rotation: 90 }); }
    if (which === 2) { gsap.set(f.fig3, { x: 1099, y: 401 }); gsap.set(f.archB, { scaleY: -1, transformOrigin: "50% 0%" }); }
  }

  if (section && list && items.length === 3) {
    var texts = items.map(function (li) { return li.querySelector(".principle-text"); });

    var build = function (perPrinciple, mobile) {
      section.classList.add("is-anim");
      var f = makeStage(section);
      var steps = el("p-steps"); steps.setAttribute("aria-hidden", "true");
      var bars = [0, 1, 2].map(function () { var b = document.createElement("span"); b.className = "p-step"; steps.appendChild(b); return b; });
      section.appendChild(steps);

      function place() {
        var r = section.getBoundingClientRect(), W = r.width, H = r.height, top = 0, bottom = H;
        if (mobile) {
          var hTxt = Math.max.apply(null, texts.map(function (t) { return t.offsetHeight; }));
          top = 56; bottom = H - 48 - hTxt - 24;
        }
        measure(f, W, H, mobile, top, bottom);
      }
      place();
      f.cols.forEach(function (c, i) { gsap.set(c, col01(f, i, 1)); });

      /* Timeline, 3 units: principle i runs from i to i + 1. Step 1 → 2 over 0–0.4, hold, grow 0.7–1 (01, 02);
         the text swaps during the grow, after the outgoing text has faded; 03 holds its step 2 to the end. */
      var tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.set({}, {}, 3);
      // Start: 01 at step 1, the others hidden; the first text and step on
      tl.set(f.cols, { autoAlpha: 1 }, 0);
      tl.set([f.fig2, f.fig3], { autoAlpha: 0 }, 0);
      gsap.set(texts, { autoAlpha: 0, y: 24 }); gsap.set(texts[0], { autoAlpha: 1, y: 0 });
      gsap.set(bars, { width: 1, opacity: 0.35 }); gsap.set(bars[0], { width: 4, opacity: 1 });

      // 01: the lines grow down into a staircase, which then fills the section
      f.cols.forEach(function (c, i) {
        tl.fromTo(c, { left: function () { return col01(f, i, 1).left; }, width: function () { return col01(f, i, 1).width; }, top: function () { return col01(f, i, 1).top; }, height: function () { return col01(f, i, 1).height; } },
          { left: function () { return col01(f, i, 2).left; }, width: function () { return col01(f, i, 2).width; }, top: function () { return col01(f, i, 2).top; }, height: function () { return col01(f, i, 2).height; }, duration: 0.4, immediateRender: false }, 0);
        tl.fromTo(c, { left: function () { return col01(f, i, 2).left; }, width: function () { return col01(f, i, 2).width; }, top: function () { return col01(f, i, 2).top; }, height: function () { return col01(f, i, 2).height; } },
          { left: function () { return col01(f, i, 3).left; }, width: function () { return col01(f, i, 3).width; }, top: function () { return col01(f, i, 3).top; }, height: function () { return col01(f, i, 3).height; }, duration: 0.3, immediateRender: false }, 0.7);
      });
      tl.set(f.cols, { autoAlpha: 0 }, 1);                     // the page is lavender now
      // 02: appears at step 1, turns 90° clockwise, then the large half-disc grows into the next background
      tl.fromTo(f.fig2, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04, ease: "none", immediateRender: false }, 1);
      tl.fromTo(f.fig2, { rotation: 0 }, { rotation: 90, duration: 0.4, immediateRender: false }, 1);
      tl.fromTo(f.ring, { opacity: 1 }, { opacity: 0, duration: 0.08, ease: "none", immediateRender: false }, 1.7);
      tl.fromTo(f.half, { scale: 1 }, { scale: function () { return f.geo.S2; }, transformOrigin: "338px 195px", duration: 0.3, immediateRender: false }, 1.7);
      tl.set(f.fig2, { autoAlpha: 0 }, 2);                     // the page is light blue now
      // 03: the arch, then its mirrored copy unfolds from the hinge, forming the X
      tl.fromTo(f.fig3, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04, ease: "none", immediateRender: false }, 2);
      tl.fromTo(f.fig3, { x: 1065, y: 201 }, { x: 1099, y: 401, duration: 0.4, immediateRender: false }, 2);
      tl.fromTo(f.archB, { scaleY: 1 }, { scaleY: -1, transformOrigin: "50% 0%", duration: 0.4, immediateRender: false }, 2);
      gsap.set(f.fig3, { x: 1065, y: 201 }); gsap.set(f.archB, { scaleY: 1, transformOrigin: "50% 0%" }); gsap.set(f.fig2, { rotation: 0 });
      gsap.set(f.half, { scale: 1, transformOrigin: "338px 195px" });
      // Text and steps: in sequence during each grow (out in its first half, in in its second half)
      [0, 1].forEach(function (from) {
        var at = from + 0.7, to = from + 1;
        tl.to(texts[from], { autoAlpha: 0, y: -24, duration: 0.15, ease: "power2.in" }, at);
        tl.fromTo(texts[to], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.15, ease: "power2.out", immediateRender: false }, at + 0.15);
        tl.to(bars[from], { width: 1, opacity: 0.35, duration: 0.06, ease: "none" }, at + 0.15);
        tl.fromTo(bars[to], { width: 1, opacity: 0.35 }, { width: 4, opacity: 1, duration: 0.06, ease: "none", immediateRender: false }, at + 0.15);
      });

      var st = ScrollTrigger.create({
        trigger: section,
        start: "center center+=20",                            // centred under the topbar (it fills that space up to 900 px)
        end: function () { return "+=" + Math.round(window.innerHeight * perPrinciple * 3); },
        pin: true, scrub: 0.6, animation: tl, invalidateOnRefresh: true,
        onRefreshInit: place,
        // Rests: each principle's start (step 1) and its hold (step 2); the end of the pin
        snap: { snapTo: [0, 0.55 / 3, 1 / 3, 1.55 / 3, 2 / 3, 1], inertia: false, duration: { min: 0.4, max: 0.6 }, ease: "power2.inOut", delay: 0.3 }
      });
      principlesST = st;

      return function () {
        principlesST = null;
        st.kill(); tl.kill();
        f.stage.remove(); steps.remove();
        gsap.set(texts, { clearProps: "all" });
        section.classList.remove("is-anim");
      };
    };

    // Reduced motion: no pin; each principle on its own background with its figure at step 2
    var buildStill = function () {
      section.classList.add("is-still");
      var mobile = window.matchMedia("(max-width: 860px)").matches;
      var stages = items.map(function (li, i) {
        li.style.background = BG[i];
        var f = makeStage(li, i);
        return f;
      });
      function place() {
        stages.forEach(function (f, i) {
          var li = items[i], r = li.getBoundingClientRect(), t = texts[i];
          var top = 24, bottom = mobile ? (t.offsetTop - 24) : r.height;
          measure(f, r.width, r.height, mobile, top, bottom);
          setStatic(f, i);
        });
      }
      place();
      ScrollTrigger.addEventListener("refreshInit", place);
      return function () {
        ScrollTrigger.removeEventListener("refreshInit", place);
        stages.forEach(function (f) { f.stage.remove(); });
        items.forEach(function (li) { li.style.background = ""; });
        section.classList.remove("is-still");
      };
    };

    mm.add("(min-width: 861px) and " + MOTION, function () { return build(1, false); });
    mm.add("(max-width: 860px) and " + MOTION, function () { return build(0.8, true); });
    mm.add("(prefers-reduced-motion: reduce)", function () { return buildStill(); });
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
