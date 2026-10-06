/* Guide line — "I turn noise into direction".
   A thread (#0A0A0A, 1.5 px) grows down the home page as you scroll. Its lower end sits at the middle of the viewport.

   Route (desktop)
   - About: the third grid line from the right, down to the flower.
   - Flower (images/flower.svg, inline): hangs from the line under the "Principles" title (its #flower-baseline overlaps it).
     The thread reaches the base from above; scrolling then draws the rings and the fan; then the thread goes on down #flower-axis.
   - After that it runs down the outermost grid line of each side, alternating by section. The side change is a horizontal run
     laid exactly over the line under the section title.
   - Contact: the thread meets the central axis of images/closing-wave.svg by its right end and the wave draws itself, wave by wave.
   Pointer or finger near the thread plucks it like a guitar string.

   Plain SVG + requestAnimationFrame. Home only. */
(function () {
  "use strict";

  var hero = document.getElementById("hero");
  var flower = document.querySelector(".hero-flower");
  var finale = document.querySelector(".finale");
  var wave = document.getElementById("closing-wave");
  if (!hero || !flower || !finale || !wave || !document.createElementNS) return;

  var NS = "http://www.w3.org/2000/svg";
  var mobileMQ = window.matchMedia("(max-width: 860px)");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  var CATCH_UP = 3;          // after a pause (flower, side change) the thread runs 3x the scroll speed until it is back at mid-viewport
  var PLUCK = { tau: 0.2, freq: 9, speed: 1100, reach: 110, window: 300 };   // damped well under 1 s

  var svg = null, geo = null, stages = [], table = null, plucks = [];
  var dirty = true, rafId = 0, lastFlower = -1, lastWave = -1;
  var flowerItems = [], waveGroups = [];

  /* ---------- helpers ---------- */

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1)); }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function num(v) { return Math.round(v * 10) / 10; }
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---------- 1. where things live ---------- */

  /* The flower sits in the hero on mobile and hangs from the Principles title line on desktop. */
  function placeFlower() {
    var host = mobileMQ.matches ? hero.querySelector(".hero-row") : document.querySelector("#principles .principle");
    if (host && flower.parentNode !== host) host.appendChild(flower);
    var scale = flower.querySelector("svg").getBoundingClientRect().width / 2006;
    // keep the flower's lines at 1.5 px whatever its size
    flower.querySelector("svg").style.setProperty("--fsw", scale ? (1.5 / scale).toFixed(3) : "6");
  }

  /* The wave needs scroll room after the thread arrives, so the page ends with some air below it. */
  function sizeFinale() {
    var vh = window.innerHeight;
    var figH = finale.clientWidth * (360 / 1200);
    var ds = clamp(vh * 0.28, 160, 320);                      // scroll spent drawing the wave
    var top = parseFloat(getComputedStyle(finale).paddingTop) || 0;
    finale.style.minHeight = Math.round(top + figH / 2 + vh / 2 + ds) + "px";
  }

  function measure() {
    var sx = window.pageXOffset || 0, sy = window.pageYOffset || 0;
    var root = document.documentElement;
    if (svg) svg.style.height = "0px";                      // so the overlay never counts as page height
    var vw = root.clientWidth, vh = window.innerHeight;
    var docH = Math.max(document.body.scrollHeight, root.scrollHeight);
    function r(node) { return node.getBoundingClientRect(); }

    var grid = r(hero.querySelector(".gridlines"));
    var left = grid.left + sx, colW = grid.width / 12;
    var mobile = mobileMQ.matches;

    var ar = r(document.getElementById("flower-axis"));
    var fr = r(flower.querySelector("svg"));
    var wr = r(wave);
    var principleLine = r(document.querySelector("#principles .principle"));   // the line under the "Principles" title
    var howLine = r(document.querySelector("#how-i-work .steps > li"));        // the line under the "How I work" title

    geo = {
      vw: vw, vh: vh, docH: docH, mobile: mobile,
      xHero: left + 10 * colW,                               // third grid line from the right (About)
      xRight: left + 12 * colW,                              // outermost grid lines
      xLeft: left,
      xMargin: vw - left / 2,                                // mobile: fixed margin
      xAxis: ar.left + ar.width / 2 + sx,
      yBase: ar.top + sy,                                    // base of the flower: top centre
      yAxisEnd: ar.bottom + sy,
      flowerTop: fr.top + sy,
      yPrinciples: principleLine.top + sy + 0.5,
      yHow: howLine.top + sy + 0.5,
      yContact: r(document.getElementById("contact")).top + sy,   // Contact has no title line: the section's top edge
      yWave: wr.top + sy + wr.height / 2,                    // central axis of the closing wave
      xWave: wr.right + sx                                   // its right end
    };
    geo.mMax = Math.max(1, docH - vh / 2);
  }

  /* ---------- 2. the stages of the thread ---------- */

  function buildStages() {
    var g = geo, s = [];
    function v(x, y0, y1) { if (y1 - y0 > 1) s.push({ t: "v", x: x, y0: y0, y1: y1, len: y1 - y0 }); }
    function j(y, x0, x1) {
      var len = Math.abs(x1 - x0);
      if (len > 1) s.push({ t: "j", y: y, x0: x0, x1: x1, len: len, D: clamp(len * 0.25, 70, 220) });
    }
    var flowerD = clamp(g.vh * 0.3, 160, 320);

    if (!g.mobile) {
      v(g.xHero, 0, g.yBase);                                // About, down to the base of the flower
      s.push({ t: "f", y: g.yBase, D: flowerD });
      v(g.xAxis, g.yBase, g.yAxisEnd);                       // on down the axis
      j(g.yAxisEnd, g.xAxis, g.xRight);                      // to the outermost line on the right
      v(g.xRight, g.yAxisEnd, g.yHow);                       // Principles
      j(g.yHow, g.xRight, g.xLeft);                          // side change, over the line under "How I work"
      v(g.xLeft, g.yHow, g.yContact);
      j(g.yContact, g.xLeft, g.xRight);
      v(g.xRight, g.yContact, g.yWave);                      // Contact, to the axis of the wave
      g.xArrive = g.xRight;
    } else {
      var yJ = g.flowerTop - 18;                             // in the gap above the flower
      v(g.xMargin, 0, yJ);
      j(yJ, g.xMargin, g.xAxis);
      v(g.xAxis, yJ, g.yBase);
      s.push({ t: "f", y: g.yBase, D: flowerD });
      v(g.xAxis, g.yBase, g.yAxisEnd);
      v(g.xAxis, g.yAxisEnd, g.yPrinciples);
      j(g.yPrinciples, g.xAxis, g.xMargin);                  // over the line under "Principles"
      v(g.xMargin, g.yPrinciples, g.yWave);
      g.xArrive = g.xMargin;
    }
    s.push({ t: "w" });                                      // the closing wave
    return s;
  }

  /* ---------- 3. scroll position -> state of the thread (computed once per layout) ---------- */

  function simulate() {
    var n = Math.ceil(geo.mMax) + 1;
    var si = new Int16Array(n), val = new Float32Array(n);
    var s = 0, yEnd = stages[0].y0, p = 0, arrive = -1;

    for (var m = 0; m < n; m++) {
      var st = stages[s];
      if (st.t === "v") {
        yEnd = Math.min(m, yEnd + CATCH_UP);                 // follows mid-viewport, catching up quickly if it lagged
        if (yEnd >= st.y1) { yEnd = st.y1; s++; p = 0; }
      } else if (st.t === "j" || st.t === "f") {
        p += 1 / st.D;                                       // draws while the page scrolls under it; the end stays parked
        if (p >= 1) { p = 1; s++; p = 0; }
      } else if (st.t === "w" && arrive < 0) {
        arrive = m;
      }
      si[m] = s;
      var cur = stages[Math.min(s, stages.length - 1)];
      val[m] = cur.t === "v" ? yEnd : p;
    }
    // the wave draws from the moment the thread reaches its axis until the end of the page
    var last = stages.length - 1;
    for (var k = 0; k < n; k++) {
      if (si[k] >= last) {
        si[k] = last;
        val[k] = arrive >= 0 && n - 1 > arrive ? clamp((k - arrive) / (n - 1 - arrive), 0, 1) : 0;
      }
    }
    return { n: n, si: si, val: val };
  }

  /* ---------- 4. the overlay ---------- */

  function build() {
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
    svg = el("svg", { "class": "guide", "aria-hidden": "true", focusable: "false" });
    svg.style.width = geo.vw + "px";
    svg.style.height = geo.docH + "px";
    svg.setAttribute("viewBox", "0 0 " + geo.vw + " " + geo.docH);

    stages.forEach(function (st) {
      if (st.t !== "v" && st.t !== "j") return;
      st.d = st.t === "v" ? "M" + num(st.x) + " " + num(st.y0) + "V" + num(st.y1)
                          : "M" + num(st.x0) + " " + num(st.y) + "H" + num(st.x1);
      st.el = el("path", { d: st.d, pathLength: num(st.len) });
      st.el.style.strokeDasharray = num(st.len);
      st.el.style.strokeDashoffset = num(st.len);
      st.el.style.visibility = "hidden";
      st.f = -1; st.inside = false; st.vibrating = false;
      svg.appendChild(st.el);
    });
    document.body.appendChild(svg);
  }

  /* ---------- 5. flower and closing wave ---------- */

  function groupsOf(selector) {
    var list = Array.prototype.slice.call(document.querySelectorAll(selector));
    list.sort(function (a, b) { return a.getAttribute("data-order") - b.getAttribute("data-order"); });
    return list.map(function (g) { return Array.prototype.slice.call(g.querySelectorAll("path")); });
  }

  function collect() {
    // flower: the baseline first, then the rings, then the fan, each group by data-order
    flowerItems = [[document.getElementById("flower-baseline")]]
      .concat(groupsOf("#flower-rings .ring"), groupsOf("#flower-fan .petal"));

    // wave: each wave is a group of bars; bars are ranked from the end where the thread arrives (right)
    waveGroups = groupsOf("#closing-wave .wave").map(function (bars) {
      var items = bars.map(function (b) {
        var x = parseFloat(b.getAttribute("d").slice(1));
        return { el: b, x: x };
      });
      items.sort(function (a, b) { return b.x - a.x; });
      return items;
    });
  }

  function setPath(path, t) {
    path.style.strokeDashoffset = t >= 1 ? "0" : String(1 - t);
    path.style.visibility = t <= 0 ? "hidden" : "visible";
  }

  function drawFlower(p) {
    var n = flowerItems.length, ov = 0.3;
    var d = 1 / (1 + (n - 1) * (1 - ov));                    // consecutive, each starting as the previous one nears its end
    for (var i = 0; i < n; i++) {
      var t = ease((p - i * (1 - ov) * d) / d);
      for (var k = 0; k < flowerItems[i].length; k++) setPath(flowerItems[i][k], t);
    }
  }

  function drawWave(q) {
    var n = waveGroups.length, ov = 0.15;
    var d = 1 / (1 + (n - 1) * (1 - ov));                    // wave after wave, in data-order
    for (var w = 0; w < n; w++) {
      var g = clamp((q - w * (1 - ov) * d) / d, 0, 1), bars = waveGroups[w];
      for (var i = 0; i < bars.length; i++) {
        var t = ease((g - (i / bars.length) * 0.55) / 0.45); // every bar grows from the central axis, a little after its neighbour
        setPath(bars[i].el, t);
      }
    }
  }

  /* ---------- 6. one frame ---------- */

  function setStage(st, f) {
    f = clamp(f, 0, 1);
    if (Math.abs(f - st.f) < 0.0005) return;
    st.f = f;
    st.el.style.visibility = f <= 0 ? "hidden" : "visible";
    st.el.style.strokeDashoffset = f >= 1 ? "0" : num(st.len * (1 - f));
  }

  function render(all) {
    var cur, val;
    if (all) { cur = stages.length - 1; val = 1; }
    else {
      var m = clamp(Math.round((window.pageYOffset || 0) + geo.vh / 2), 0, table.n - 1);
      cur = table.si[m]; val = table.val[m];
    }
    var flowerP = 0, waveQ = 0;
    for (var i = 0; i < stages.length; i++) {
      var st = stages[i], f = (i < cur || all) ? 1 : i > cur ? 0 : -1;
      if (st.t === "v") { setStage(st, f < 0 ? (val - st.y0) / st.len : f); }
      else if (st.t === "j") { setStage(st, f < 0 ? val : f); }
      else if (st.t === "f") { flowerP = f < 0 ? val : f; }
      else if (st.t === "w") { waveQ = all ? 1 : (f < 0 ? val : f); }
    }
    if (Math.abs(flowerP - lastFlower) > 0.0003) { lastFlower = flowerP; drawFlower(flowerP); }
    if (Math.abs(waveQ - lastWave) > 0.0003) { lastWave = waveQ; drawWave(waveQ); }
  }

  /* ---------- 7. plucking ---------- */

  function onPointer(e) {
    if (!svg || reduceMQ.matches) return;
    var px = e.clientX + (window.pageXOffset || 0), py = e.clientY + (window.pageYOffset || 0);
    var touch = e.pointerType === "touch";
    var R = touch ? 44 : 28, now = performance.now();
    var speed = onPointer.t ? Math.hypot(e.clientX - onPointer.x, e.clientY - onPointer.y) / Math.max(1, now - onPointer.t) : 0;
    onPointer.x = e.clientX; onPointer.y = e.clientY; onPointer.t = now;

    for (var i = 0; i < stages.length; i++) {
      var st = stages[i];
      if ((st.t !== "v" && st.t !== "j") || st.f <= 0) continue;
      var a, d;
      if (st.t === "v") { a = py - st.y0; d = px - st.x; }
      else { a = (px - st.x0) * (st.x1 >= st.x0 ? 1 : -1); d = py - st.y; }
      var inside = Math.abs(d) < R && a > 0 && a < st.f * st.len;
      if ((inside && !st.inside) || (inside && e.type === "pointerdown")) {
        var amp = touch ? 12 : clamp(5 + speed * 5, 5, 15);
        plucks.push({ st: st, a0: a, t0: now, u0: (d > 0 ? -1 : 1) * amp });
        if (plucks.length > 8) plucks.shift();
        schedule();
      }
      st.inside = inside;
    }
  }

  function pluckOffset(pl, a, now) {
    var dt = (now - pl.t0) / 1000, dist = Math.abs(a - pl.a0);
    var tt = dt - dist / PLUCK.speed;                        // the wave travels away from the pluck
    if (tt < 0) return 0;
    return pl.u0 * Math.exp(-tt / PLUCK.tau) * Math.exp(-dist / PLUCK.reach) * Math.cos(2 * Math.PI * PLUCK.freq * tt);
  }

  function vibrate(now) {
    var active = {};
    plucks = plucks.filter(function (pl) { return now - pl.t0 < 1050; });
    plucks.forEach(function (pl) { var k = stages.indexOf(pl.st); (active[k] = active[k] || []).push(pl); });

    stages.forEach(function (st, k) {
      if (st.t !== "v" && st.t !== "j") return;
      var list = active[k];
      if (!list) { if (st.vibrating) { st.el.setAttribute("d", st.d); st.vibrating = false; } return; }
      var aMin = Infinity, aMax = -Infinity;
      list.forEach(function (pl) { aMin = Math.min(aMin, pl.a0 - PLUCK.window); aMax = Math.max(aMax, pl.a0 + PLUCK.window); });
      aMin = Math.max(0, aMin); aMax = Math.min(st.len, aMax);
      var sgn = st.t === "j" && st.x1 < st.x0 ? -1 : 1;
      function pt(a, u) {
        return st.t === "v" ? num(st.x + u) + " " + num(st.y0 + a) : num(st.x0 + sgn * a) + " " + num(st.y + u);
      }
      var d = "M" + pt(0, 0);
      for (var a = aMin; a <= aMax; a += 6) {
        var u = 0, taper = smooth(0, 36, Math.min(a, st.len - a));   // the corners stay put
        list.forEach(function (pl) { u += pluckOffset(pl, a, now); });
        d += "L" + pt(a, u * taper);
      }
      d += "L" + pt(st.len, 0);
      st.el.setAttribute("d", d);
      st.vibrating = true;
    });
  }

  /* ---------- 8. frame loop ---------- */

  function frame(now) {
    rafId = 0;
    if (dirty) { dirty = false; render(false); }
    if (plucks.length) { vibrate(now); schedule(); }
    else if (stages.some(function (s) { return s.vibrating; })) vibrate(now);
  }
  function schedule() { if (!rafId) rafId = requestAnimationFrame(frame); }

  /* ---------- 9. start / rebuild ---------- */

  function setup() {
    plucks = [];
    placeFlower();
    sizeFinale();
    measure();
    stages = buildStages();
    table = simulate();
    build();
    lastFlower = -1; lastWave = -1;
    collect();
    dirty = false;
    render(reduceMQ.matches);                                // drawn straight away, so a relayout never blinks; reduced motion: complete and still
  }

  var pending = false;
  function resetup() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; setup(); });
  }

  window.addEventListener("scroll", function () { if (!reduceMQ.matches) { dirty = true; schedule(); } }, { passive: true });
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onPointer, { passive: true });
  window.addEventListener("resize", resetup);
  window.addEventListener("load", resetup);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resetup);
  if (window.ResizeObserver) new ResizeObserver(resetup).observe(document.body);   // sections open and close
  [mobileMQ, reduceMQ].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener("change", resetup); else if (mq.addListener) mq.addListener(resetup);
  });

  setup();
})();
