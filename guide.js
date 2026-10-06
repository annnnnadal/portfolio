/* Guide line — "I turn noise into direction".
   A black thread grows down the home page as you scroll. Its lower end sits at the middle of the viewport.
   It runs along the third grid line from the right (hero), then the third from the left (principles), and so on,
   changing side with a right-angle jog in the gap between sections. In the hero it comes down the axis of the flower,
   which draws itself (rings, then fan) when the thread reaches its base. In Contact the thread opens into vertical stripes.
   Pointer or finger near the thread plucks it like a guitar string.

   Plain SVG + requestAnimationFrame. Home only. */
(function () {
  "use strict";

  var hero = document.getElementById("hero");
  var flower = document.querySelector(".hero-flower");
  var finale = document.querySelector(".finale");
  if (!hero || !flower || !finale || !document.createElementNS) return;

  var NS = "http://www.w3.org/2000/svg";
  var mobileMQ = window.matchMedia("(max-width: 860px)");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  var CATCH_UP = 3;          // after a pause (flower, jog) the thread runs 3x the scroll speed until it is back at mid-viewport
  var PLUCK = { tau: 0.2, freq: 9, speed: 1100, reach: 110, window: 300 };   // damped well under 1 s

  var svg = null;            // overlay
  var geo = null;            // measured layout
  var stages = [];           // ordered pieces of the thread
  var table = null;          // scroll position -> state of the thread
  var plucks = [];
  var dirty = true;
  var rafId = 0;

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

  /* ---------- 1. measure the page ---------- */

  function measure() {
    var sx = window.pageXOffset || 0, sy = window.pageYOffset || 0;
    var root = document.documentElement;
    if (svg) svg.style.height = "0px";                      // so the overlay never counts as page height
    var vw = root.clientWidth, vh = window.innerHeight;
    var docH = Math.max(document.body.scrollHeight, root.scrollHeight);
    function top(node) { return node.getBoundingClientRect().top + sy; }

    var grid = hero.querySelector(".gridlines").getBoundingClientRect();
    var left = grid.left + sx, colW = grid.width / 12;
    var mobile = mobileMQ.matches;

    var fr = flower.querySelector("svg").getBoundingClientRect();
    var ar = document.getElementById("flower-axis").getBoundingClientRect();

    geo = {
      vw: vw, vh: vh, docH: docH, mobile: mobile, left: left, colW: colW,
      xR: left + 10 * colW,                                  // third grid line from the right
      xL: left + 2 * colW,                                   // third grid line from the left
      xM: vw - left / 2,                                     // mobile: fixed margin
      xAxis: ar.left + ar.width / 2 + sx,                    // flower axis
      yBase: ar.bottom + sy,                                 // flower base
      flowerTop: fr.top + sy,
      flowerWidth: fr.width,
      y01: top(document.getElementById("principles")),
      y12: top(document.getElementById("how-i-work")),
      y23: top(document.getElementById("contact")),
      yF: top(finale),
      stripeLeft: left, stripeRight: left + grid.width
    };
    geo.mMax = Math.max(1, docH - vh / 2);
  }

  /* About baseline = base of the flower (desktop). The probe is a zero-size inline box sitting on the last line's baseline. */
  function alignFlower() {
    flower.style.marginBottom = "0px";
    if (mobileMQ.matches) return;
    var probe = document.querySelector(".baseline-probe");
    var about = document.querySelector(".about");
    if (!probe || !about) return;
    var d = about.getBoundingClientRect().bottom - probe.getBoundingClientRect().bottom;
    flower.style.marginBottom = num(d) + "px";
  }

  function scaleFlowerStroke() {
    // keep the flower's line at 1.5 px whatever its size
    var scale = flower.querySelector("svg").getBoundingClientRect().width / 1000;
    flower.querySelector("svg").style.setProperty("--fsw", scale ? (1.5 / scale).toFixed(3) : "3");
  }

  /* ---------- 2. the stages of the thread ---------- */

  function buildStages() {
    var g = geo, s = [];
    function v(x, y0, y1) { if (y1 - y0 > 1) s.push({ t: "v", x: x, y0: y0, y1: y1, len: y1 - y0 }); }
    function j(y, x0, x1, label) {
      var len = Math.abs(x1 - x0);
      if (len > 1) s.push({ t: "j", y: y, x0: x0, x1: x1, len: len, D: clamp(len * 0.25, 80, 220), label: label });
    }
    var flowerD = clamp(g.vh * 0.3, 160, 320);

    if (!g.mobile) {
      v(g.xR, 0, g.yBase);
      s.push({ t: "f", y: g.yBase, D: flowerD });
      v(g.xR, g.yBase, g.y01);
      j(g.y01, g.xR, g.xL);
      v(g.xL, g.y01, g.y12);
      j(g.y12, g.xL, g.xR);
      v(g.xR, g.y12, g.y23);
      j(g.y23, g.xR, g.xL);
      v(g.xL, g.y23, g.yF);
    } else {
      var yJ = g.flowerTop - 18;                             // in the gap above the flower
      v(g.xM, 0, yJ);
      j(yJ, g.xM, g.xAxis);
      v(g.xAxis, yJ, g.yBase);
      s.push({ t: "f", y: g.yBase, D: flowerD });
      v(g.xAxis, g.yBase, g.y01);
      j(g.y01, g.xAxis, g.xM);
      v(g.xM, g.y01, g.yF);
    }
    s.push({ t: "s" });                                      // stripes
    g.xEnd = s.length > 1 && s[s.length - 2].t === "v" ? s[s.length - 2].x : g.xM;
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
      } else if (st.t === "s" && arrive < 0) {
        arrive = m;
      }
      si[m] = s;
      var cur = stages[Math.min(s, stages.length - 1)];
      val[m] = cur.t === "v" ? yEnd : p;
      if (m === 0 && st.t === "v") val[0] = 0;
    }
    // stripes open between the moment the thread arrives and the end of the page
    var last = stages.length - 1;
    for (var k = 0; k < n; k++) {
      if (si[k] >= last) {
        si[k] = last;
        val[k] = arrive >= 0 && n - 1 > arrive ? clamp((k - arrive) / (n - 1 - arrive), 0, 1) : 0;
      }
    }
    return { n: n, si: si, val: val };
  }

  /* ---------- 4. build the overlay ---------- */

  function build() {
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
    svg = el("svg", { "class": "guide", "aria-hidden": "true", focusable: "false" });
    svg.style.width = geo.vw + "px";
    svg.style.height = geo.docH + "px";
    svg.setAttribute("viewBox", "0 0 " + geo.vw + " " + geo.docH);

    stages.forEach(function (st) {
      if (st.t === "v" || st.t === "j") {
        st.d = st.t === "v" ? "M" + num(st.x) + " " + num(st.y0) + "V" + num(st.y1)
                            : "M" + num(st.x0) + " " + num(st.y) + "H" + num(st.x1);
        st.el = el("path", { d: st.d, pathLength: num(st.len) });
        st.el.style.strokeDasharray = num(st.len);
        st.el.style.strokeDashoffset = num(st.len);
        st.el.style.visibility = "hidden";
        st.f = -1; st.inside = false;
        svg.appendChild(st.el);
      }
    });
    buildStripes();
    document.body.appendChild(svg);
  }

  /* Closing stripes: thin lines of different lengths with rhythm, hanging from where the thread arrives. */
  var stripes = [];
  function buildStripes() {
    stripes = [];
    var g = geo, y0 = g.yF, maxH = (g.docH - y0) * 0.9;
    var unit = g.mobile ? 8 : 11, x = g.stripeLeft;
    var steps = [1, 1, 2, 1, 3, 1, 1, 4, 2, 1, 2], seed = 7, i = 0, items = [];
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    while (x <= g.stripeRight) {
      var h = (0.18 + 0.82 * Math.pow(rnd(), 0.8)) * maxH;
      if (i % 7 === 3) h = maxH * (0.88 + 0.12 * rnd());     // a few long ones give the rhythm
      items.push({ x: x, h: h });
      x += steps[i % steps.length] * unit * (0.9 + 0.5 * rnd());
      i++;
    }
    // one stripe continues the thread itself
    items.push({ x: g.xEnd, h: maxH });
    items.sort(function (a, b) { return Math.abs(a.x - g.xEnd) - Math.abs(b.x - g.xEnd); });   // open outwards from the thread
    items.forEach(function (it, rank) {
      var line = el("line", { "class": "stripe", x1: num(it.x), y1: num(y0), x2: num(it.x), y2: num(y0 + it.h) });
      line.style.strokeDasharray = num(it.h);
      line.style.strokeDashoffset = num(it.h);
      line.style.visibility = "hidden";
      svg.appendChild(line);
      stripes.push({ el: line, h: it.h, rank: rank, n: items.length, f: -1 });
    });
  }

  /* ---------- 5. flower ---------- */

  var flowerItems = [];
  function collectFlower() {
    flowerItems = [];
    var sel = ["#flower-rings .ring", "#flower-fan .petal"];
    sel.forEach(function (q) {
      var groups = Array.prototype.slice.call(document.querySelectorAll(q));
      groups.sort(function (a, b) { return a.getAttribute("data-order") - b.getAttribute("data-order"); });
      groups.forEach(function (gr) { flowerItems.push(Array.prototype.slice.call(gr.querySelectorAll("path"))); });
    });
  }

  function drawFlower(p) {
    var n = flowerItems.length, ov = 0.3;
    var d = 1 / (1 + (n - 1) * (1 - ov));                    // consecutive, each starting as the previous one nears its end
    for (var i = 0; i < n; i++) {
      var t = ease((p - i * (1 - ov) * d) / d);
      for (var k = 0; k < flowerItems[i].length; k++) {
        var path = flowerItems[i][k];
        path.style.strokeDashoffset = t >= 1 ? "0" : String(1 - t);
        path.style.visibility = t <= 0 ? "hidden" : "visible";
      }
    }
  }

  /* ---------- 6. draw one frame ---------- */

  function setStage(st, f) {
    f = clamp(f, 0, 1);
    if (Math.abs(f - st.f) < 0.0005) return;
    st.f = f;
    st.el.style.visibility = f <= 0 ? "hidden" : "visible";
    st.el.style.strokeDashoffset = f >= 1 ? "0" : num(st.len * (1 - f));
  }

  var lastFlower = -1;
  function render(all) {
    var n = table.n, cur, val;
    if (all) { cur = stages.length - 1; val = 1; }
    else {
      var m = clamp(Math.round((window.pageYOffset || 0) + geo.vh / 2), 0, n - 1);
      cur = table.si[m]; val = table.val[m];
    }
    var flowerP = 0;
    for (var i = 0; i < stages.length; i++) {
      var st = stages[i], f = i < cur || all ? 1 : i > cur ? 0 : -1;
      if (st.t === "v") {
        if (f < 0) f = (val - st.y0) / st.len;
        setStage(st, f);
      } else if (st.t === "j") {
        if (f < 0) f = val;
        setStage(st, f);
      } else if (st.t === "f") {
        flowerP = f < 0 ? val : f;
      } else if (st.t === "s") {
        var q = all ? 1 : (f < 0 ? val : f);
        drawStripes(q);
      }
    }
    if (Math.abs(flowerP - lastFlower) > 0.0003) { lastFlower = flowerP; drawFlower(flowerP); }
  }

  function drawStripes(q) {
    var w = 0.4;                                             // each stripe takes 40 % of the timeline, staggered outwards
    for (var i = 0; i < stripes.length; i++) {
      var s = stripes[i];
      var f = ease((q - (s.rank / s.n) * (1 - w)) / w);
      if (Math.abs(f - s.f) < 0.0005) continue;
      s.f = f;
      s.el.style.visibility = f <= 0 ? "hidden" : "visible";
      s.el.style.strokeDashoffset = f >= 1 ? "0" : num(s.h * (1 - f));
    }
  }

  /* ---------- 7. plucking ---------- */

  function onPointer(e) {
    if (!plucks || reduceMQ.matches || !svg) return;
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
      if (inside && !st.inside || (inside && e.type === "pointerdown")) {
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
    plucks.forEach(function (pl, idx) { var k = stages.indexOf(pl.st); (active[k] = active[k] || []).push(pl); });

    stages.forEach(function (st, k) {
      if (st.t !== "v" && st.t !== "j") return;
      var list = active[k];
      if (!list) { if (st.vibrating) { st.el.setAttribute("d", st.d); st.vibrating = false; } return; }
      var aMin = Infinity, aMax = -Infinity;
      list.forEach(function (pl) { aMin = Math.min(aMin, pl.a0 - PLUCK.window); aMax = Math.max(aMax, pl.a0 + PLUCK.window); });
      aMin = Math.max(0, aMin); aMax = Math.min(st.len, aMax);
      var sgn = st.t === "j" && st.x1 < st.x0 ? -1 : 1, d = "";
      function pt(a, u) {
        return st.t === "v" ? num(st.x + u) + " " + num(st.y0 + a) : num(st.x0 + sgn * a) + " " + num(st.y + u);
      }
      d = "M" + pt(0, 0);
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
    alignFlower();
    scaleFlowerStroke();
    measure();
    stages = buildStages();
    table = simulate();
    build();
    lastFlower = -1;
    collectFlower();
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
