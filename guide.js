/* Guide line — "I turn noise into direction".
   A thread (#0044FF, 3 px) grows down the home page as you scroll. Its lower end sits at the middle of the viewport.

   Route (desktop)
   - About: down the third grid line from the right, which is the axis of the flower. The flower (base at the bottom, opening upwards) is four
     columns wide and its central stem is the thread itself. The thread comes down the stem to the base; then About stays
     still (sticky) while the base line, the rings and the fan draw themselves with the scroll. Once the flower is complete
     About is released and the thread goes on down to the line under "Principles".
   - There it turns left, over that line, to the first grid line (the left edge of the grid) and goes down it, through
     Principles, How I work and Contact, with no more changes of side.
   - Contact is a stage that stays pinned (sticky). The thread arrives at the left end of the wave, where the 3 px line of
     images/closing-wave.svg starts, and from there the scroll draws the wave from left to right. The page ends when it is complete.
   Mobile: a fixed margin (the right edge of the grid) instead of the left edge; the wave is mirrored and draws right to left.
   Pointer or finger near the thread plucks it like a guitar string.

   Plain SVG + requestAnimationFrame. Home only. */
(function () {
  "use strict";

  var hero = document.getElementById("hero");
  var pinWrap = document.getElementById("hero-pin");
  var flower = document.querySelector(".hero-flower");
  var contact = document.getElementById("contact");
  var stage = document.querySelector(".contact-stage");
  var finale = document.querySelector(".finale");
  var wave = document.getElementById("closing-wave");
  if (!hero || !pinWrap || !flower || !contact || !stage || !finale || !wave || !document.createElementNS) return;

  var NS = "http://www.w3.org/2000/svg";
  var mobileMQ = window.matchMedia("(max-width: 860px)");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  var CATCH_UP = 3;          // after a pause (flower, side change) the thread runs 3x the scroll speed until it is back at mid-viewport
  var PLUCK = { tau: 0.2, freq: 9, speed: 1100, reach: 110, window: 300 };   // damped well under 1 s

  var pin = { on: false, T: 0 }, svg = null, heroG = null, heroDy = 0, localSvg = null, geo = null, stages = [], segs = [], localSeg = null, table = null, plucks = [];
  var dirty = true, rafId = 0, lastFlower = -1, lastWave = -1;
  var flowerItems = [], waveLines = [], waveStartY = 154;

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

  function scaleFlowerStroke() {
    // 1 px whatever its size
    var svgEl = flower.querySelector("svg");
    var scale = svgEl.getBoundingClientRect().width / 1000;
    svgEl.style.setProperty("--fsw", scale ? (1 / scale).toFixed(3) : "2");   // keep the flower's lines at 1 px (the heavy ones are 2.5x)
  }

  /* Contact: where the thread must arrive (the axis of the wave, inside the stage) and how much extra scroll the pinned
     stage needs so the thread can go down to it and the wave can draw. */
  function measureContact() {
    var vh = window.innerHeight;
    stage.style.top = Math.min(40, vh - stage.offsetHeight) + "px";   // pinned under the header; a tall stage is pinned by its bottom
    var sr = stage.getBoundingClientRect(), fr = finale.getBoundingClientRect();
    var headerH = parseFloat(getComputedStyle(stage).top) || 0;
    var axis = (fr.top - sr.top) + waveStartY;                     // where the 3 px line of the wave starts, relative to the stage
    var wavePx = clamp(vh * 0.45, 240, 480);                       // scroll spent drawing the wave
    var uAxis = axis - (vh / 2 - headerH);                         // scroll (since the pin starts) when the thread reaches the axis
    return {
      stageH: sr.height, headerH: headerH, axis: axis, wavePx: wavePx, uAxis: uAxis,
      travel: reduceMQ.matches ? 0 : Math.max(uAxis, 0) + wavePx
    };
  }

  /* About stays pinned while the flower draws. Everything is expressed in "released" coordinates: the hero's own
     points are shifted down by T (the pinned scroll), which is where they end up once About is released.
       sPin  scroll where About gets pinned: as late as possible, with its bottom still covering the viewport
       y0    where the thread's end is by then (mid-viewport); sr = what is left of the stem down to the base
       T     scroll spent pinned: the rest of the stem, then the flower drawing */
  function measurePin() {
    var sy = window.pageYOffset || 0, vh = window.innerHeight;
    var on = !reduceMQ.matches;
    pinWrap.classList.toggle("is-pinned", on);
    pinWrap.style.height = ""; hero.style.top = "";
    var wr = pinWrap.getBoundingClientRect();
    var heroTop = wr.top + sy, H = hero.offsetHeight;
    var base = flower.querySelector("#flower-axis").getBoundingClientRect().bottom + sy;   // hero not displaced: no height or offset set
    var pin = { on: on, T: 0, sPin: 0, y0: 0, sr: 0, Df: 0, H: H, heroTop: heroTop, base: base };
    if (on) {
      pin.Df = clamp(vh * 0.3, 160, 320);
      pin.sPin = Math.max(0, Math.min(heroTop + H - vh, base - vh / 2));
      pin.y0 = pin.sPin + vh / 2;
      pin.sr = Math.max(0, base - pin.y0);
      pin.T = pin.sr + pin.Df;
      pinWrap.style.height = Math.round(H + pin.T) + "px";
      hero.style.top = (heroTop - pin.sPin).toFixed(1) + "px";
    }
    return pin;
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
    var T = pin.T;
    var dispNow = pin.on ? hero.getBoundingClientRect().top - pinWrap.getBoundingClientRect().top : 0;   // sticky displacement right now
    var ar = r(document.getElementById("flower-axis"));
    var fr = r(flower.querySelector("svg"));

    geo = {
      vw: vw, vh: vh, docH: docH, mobile: mobile,
      xLeft: left,                                           // the first grid line: the left edge of the grid
      xMargin: left + grid.width,                            // mobile: fixed margin, the right edge of the grid
      xAxis: ar.left + ar.width / 2 + sx,
      yBase: ar.bottom + sy - dispNow + T,                   // base of the flower: bottom centre, where the stem ends
      yAxisEnd: ar.bottom + sy,
      flowerTop: ar.top + sy - dispNow + T,                  // top of the stem
      yPrinciples: r(document.querySelector("#principles .principle")).top + sy + 0.5,   // the line under "Principles"
      yHow: r(document.querySelector("#how-i-work .steps > li")).top + sy + 0.5,         // the line under "How I take a project…"
      yContact: r(contact).top + sy                          // where the pinned Contact stage begins
    };
  }

  /* ---------- 2. the stages of the thread ---------- */

  function buildStages() {
    var g = geo, s = [];
    function v(x, y0, y1) { if (y1 - y0 > 1) s.push({ t: "v", x: x, y0: y0, y1: y1, len: y1 - y0 }); }
    function j(y, x0, x1) {
      var len = Math.abs(x1 - x0);
      if (len > 1) s.push({ t: "j", y: y, x0: x0, x1: x1, len: len, D: clamp(len * 0.25, 70, 220) });
    }
    var flowerD = pin.on ? 1e-6 : clamp(g.vh * 0.3, 160, 320);   // pinned: the flower is driven by the pinned scroll, not by the table

    if (!g.mobile) {
      v(g.xAxis, 0, g.yBase);                                // About: the flower's axis, third grid line from the right
      s.push({ t: "f", y: g.yBase, D: flowerD });
      v(g.xAxis, g.yBase, g.yPrinciples);                    // on down the axis
      j(g.yPrinciples, g.xAxis, g.xLeft);                    // left, over the line under "Principles"
      v(g.xLeft, g.yPrinciples, g.yContact);                 // down the first grid line, to Contact
      g.xEnd = g.xLeft;
    } else {
      var yJ = g.flowerTop - 18;                             // in the gap above the flower
      v(g.xMargin, 0, yJ);
      j(yJ, g.xMargin, g.xAxis);
      v(g.xAxis, yJ, g.yBase);
      s.push({ t: "f", y: g.yBase, D: flowerD });
      v(g.xAxis, g.yBase, g.yPrinciples);
      j(g.yPrinciples, g.xAxis, g.xMargin);                  // over the line under "Principles"
      v(g.xMargin, g.yPrinciples, g.yContact);
      g.xEnd = g.xMargin;
    }
    for (var k = 0; k < s.length && s[k].t !== "f"; k++) s[k].hero = true;   // these move with About while it is pinned
    return s;
  }

  /* ---------- 3. scroll position -> state of the thread (computed once per layout) ---------- */

  function simulate() {
    var n = Math.ceil(geo.mMax || (geo.docH - geo.vh / 2)) + 1;
    var si = new Int16Array(n), val = new Float32Array(n);
    var s = 0, yEnd = stages[0].y0, p = 0;

    for (var m = 0; m < n; m++) {
      if (s < stages.length) {
        var st = stages[s];
        if (st.t === "v") {
          yEnd = Math.min(m, yEnd + CATCH_UP);               // follows mid-viewport, catching up quickly if it lagged
          if (yEnd >= st.y1) { yEnd = st.y1; s++; p = 0; }
        } else {
          p += 1 / st.D;                                     // draws while the page scrolls under it; the end stays parked
          if (p >= 1) { p = 1; s++; p = 0; }
        }
      }
      si[m] = s;
      var cur = stages[s];
      val[m] = !cur ? 0 : cur.t === "v" ? yEnd : p;
    }
    return { n: n, si: si, val: val };
  }

  /* ---------- 4. the overlays ---------- */

  function makeSeg(st, parent) {
    st.d = st.t === "v" ? "M" + num(st.x) + " " + num(st.y0) + "V" + num(st.y1)
                        : "M" + num(st.x0) + " " + num(st.y) + "H" + num(st.x1);
    st.el = el("path", { d: st.d, pathLength: num(st.len) });
    st.el.style.strokeDasharray = num(st.len);
    st.el.style.strokeDashoffset = num(st.len);
    st.el.style.visibility = "hidden";
    st.f = -1; st.inside = false; st.vibrating = false;
    parent.appendChild(st.el);
  }

  function build() {
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
    if (localSvg && localSvg.parentNode) localSvg.parentNode.removeChild(localSvg);

    svg = el("svg", { "class": "guide", "aria-hidden": "true", focusable: "false" });
    svg.style.width = geo.vw + "px";
    svg.style.height = geo.docH + "px";
    svg.setAttribute("viewBox", "0 0 " + geo.vw + " " + geo.docH);
    heroG = el("g", {});
    svg.appendChild(heroG);
    stages.forEach(function (st) { if (st.t === "v" || st.t === "j") makeSeg(st, st.hero ? heroG : svg); });
    document.body.appendChild(svg);

    // inside the pinned Contact stage: the last stretch, down to the axis of the wave
    localSvg = el("svg", { "class": "guide-local", "aria-hidden": "true", focusable: "false" });
    localSeg = { t: "v", local: true, x: geo.xEnd, y0: 0, y1: geo.loc.axis, len: geo.loc.axis };
    makeSeg(localSeg, localSvg);
    stage.appendChild(localSvg);

    segs = stages.filter(function (st) { return st.t === "v" || st.t === "j"; }).concat([localSeg]);
  }

  /* ---------- 5. flower and closing wave ---------- */

  function groupsOf(selector) {
    var list = Array.prototype.slice.call(document.querySelectorAll(selector));
    list.sort(function (a, b) { return a.getAttribute("data-order") - b.getAttribute("data-order"); });
    return list.map(function (g) { return Array.prototype.slice.call(g.querySelectorAll("path")); });
  }

  function collect() {
    // flower: the base line, then the rings, then the fan, each group by data-order
    flowerItems = [].concat(groupsOf("#flower-ground .ground"), groupsOf("#flower-rings .ring"), groupsOf("#flower-fan .petal"));

    // wave: five lines, each made of two paths drawn from the left. The 3 px line (order 1) goes first; it is the
    // continuation of the thread. With non-scaling strokes the dashes are measured in screen pixels, so the length of
    // each path is measured on screen and every path gets a table x -> length drawn.
    var wsvg = wave.getBoundingClientRect(), sx = wsvg.width / 1360;
    waveLines = Array.prototype.slice.call(wave.querySelectorAll(".wline"))
      .sort(function (a, b) { return a.getAttribute("data-order") - b.getAttribute("data-order"); })
      .map(function (g) {
        return Array.prototype.slice.call(g.querySelectorAll("path")).map(function (path) {
          var Lu = path.getTotalLength(), N = 320, xs = [], ls = [], px = 0, py = 0, acc = 0, maxX = -1e9;
          for (var i = 0; i <= N; i++) {
            var pt = path.getPointAtLength(Lu * i / N);
            if (i) acc += Math.hypot((pt.x - px) * sx, pt.y - py);
            px = pt.x; py = pt.y; maxX = Math.max(maxX, pt.x);
            xs.push(maxX); ls.push(acc);
          }
          return { el: path, L: acc, xs: xs, ls: ls };
        });
      });
    var first = waveLines[0] && waveLines[0][0];
    if (first) {                                             // y of the 3 px line where it enters the grid (x = 0)
      var pa = first.el, Lq = pa.getTotalLength(), lo = 0, hi = Lq;
      for (var it = 0; it < 30; it++) { var mid = (lo + hi) / 2; if (pa.getPointAtLength(mid).x < 0) lo = mid; else hi = mid; }
      waveStartY = pa.getPointAtLength(hi).y;
    }
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

  function lengthAtX(item, X) {
    var xs = item.xs, lo = 0, hi = xs.length - 1;
    if (X <= xs[0]) return 0;
    if (X >= xs[hi]) return item.L;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (xs[mid] <= X) lo = mid; else hi = mid; }
    var t = (X - xs[lo]) / ((xs[hi] - xs[lo]) || 1);
    return item.ls[lo] + t * (item.ls[hi] - item.ls[lo]);
  }

  function drawWave(q) {
    var n = waveLines.length, stag = 0.07;                   // each line starts a little after the previous one
    for (var k = 0; k < n; k++) {
      var X = ease((q - k * stag) / (1 - (n - 1) * stag)) * 1360;   // where the head of this line is, in the wave's own x
      for (var i = 0; i < waveLines[k].length; i++) {
        var it = waveLines[k][i], drawn = lengthAtX(it, X);
        it.el.style.strokeDasharray = it.L.toFixed(1) + " " + (it.L + 5).toFixed(1);
        it.el.style.strokeDashoffset = (it.L - drawn).toFixed(1);
        it.el.style.visibility = (X <= 0.5 || drawn <= 0.5) ? "hidden" : "visible";   // nothing shows before the head enters the grid
      }
    }
  }

  /* ---------- 6. one frame ---------- */

  function setSeg(st, f) {
    f = clamp(f, 0, 1);
    if (Math.abs(f - st.f) < 0.0005) return;
    st.f = f;
    st.el.style.visibility = f <= 0 ? "hidden" : "visible";
    st.el.style.strokeDashoffset = f >= 1 ? "0" : num(st.len * (1 - f));
  }

  function render(all) {
    var sy = window.pageYOffset || 0, L = geo.loc;
    var cur, val, flowerP = 0, f, q = 0;

    if (all) { cur = stages.length; val = 1; }
    else {
      var m;
      if (pin.on) {
        // about pinned: before it, after it, and in between (the end runs down the stem, then the flower draws)
        q = clamp(sy - pin.sPin, 0, pin.T);
        if (sy < pin.sPin) m = sy + geo.vh / 2 + pin.T;
        else if (sy < pin.sPin + pin.T) m = pin.y0 + pin.T + Math.min(q, pin.sr);
        else m = Math.max(sy + geo.vh / 2, geo.yBase);
      } else m = sy + geo.vh / 2;
      m = clamp(Math.round(m), 0, table.n - 1);
      cur = table.si[m]; val = table.val[m];
    }
    if (pin.on) {
      heroDy = all ? 0 : q - pin.T;
      heroG.setAttribute("transform", "translate(0 " + num(heroDy) + ")");
    } else heroDy = 0;
    for (var i = 0; i < stages.length; i++) {
      var st = stages[i];
      f = (i < cur || all) ? 1 : i > cur ? 0 : -1;
      if (st.t === "v") setSeg(st, f < 0 ? (val - st.y0) / st.len : f);
      else if (st.t === "j") setSeg(st, f < 0 ? val : f);
      else flowerP = f < 0 ? val : f;
    }
    if (pin.on && !all) flowerP = clamp((q - pin.sr) / pin.Df, 0, 1);

    // Contact: u = scroll since the stage got pinned. The thread's end is at mid-viewport, which in the stage is u + vh/2 - header.
    var u = sy - (geo.yContact - L.headerH);
    var local = all ? 1 : (u + geo.vh / 2 - L.headerH) / L.axis;
    var waveQ = all ? 1 : (u - L.uAxis) / L.wavePx;
    setSeg(localSeg, local);
    waveQ = clamp(waveQ, 0, 1);

    if (Math.abs(flowerP - lastFlower) > 0.0003) { lastFlower = flowerP; drawFlower(flowerP); }
    if (Math.abs(waveQ - lastWave) > 0.0003) { lastWave = waveQ; drawWave(waveQ); }
  }

  /* ---------- 7. plucking ---------- */

  function onPointer(e) {
    if (!svg || reduceMQ.matches) return;
    var sx = window.pageXOffset || 0, sy = window.pageYOffset || 0;
    var stageRect = stage.getBoundingClientRect();
    var touch = e.pointerType === "touch";
    var R = touch ? 44 : 28, now = performance.now();
    var speed = onPointer.t ? Math.hypot(e.clientX - onPointer.x, e.clientY - onPointer.y) / Math.max(1, now - onPointer.t) : 0;
    onPointer.x = e.clientX; onPointer.y = e.clientY; onPointer.t = now;

    for (var i = 0; i < segs.length; i++) {
      var st = segs[i];
      if (st.f <= 0) continue;
      // the Contact stretch lives inside the pinned stage, so it uses stage coordinates
      var px = st.local ? e.clientX - stageRect.left : e.clientX + sx;
      var py = st.local ? e.clientY - stageRect.top : e.clientY + sy - (st.hero ? heroDy : 0);
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
    plucks = plucks.filter(function (pl) { return now - pl.t0 < 1050; });

    segs.forEach(function (st) {
      var list = plucks.filter(function (pl) { return pl.st === st; });
      if (!list.length) { if (st.vibrating) { st.el.setAttribute("d", st.d); st.vibrating = false; } return; }
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
    else if (segs.some(function (s) { return s.vibrating; })) vibrate(now);
  }
  function schedule() { if (!rafId) rafId = requestAnimationFrame(frame); }

  /* ---------- 9. start / rebuild ---------- */

  function setup() {
    plucks = [];
    scaleFlowerStroke();
    collect();                                               // the wave is measured on screen before the layout of Contact
    pin = measurePin();
    var loc = measureContact();
    // the section is as tall as the pinned stage plus the scroll the wave needs; the page ends when the wave is complete
    contact.style.height = loc.travel ? Math.round(loc.stageH + loc.travel) + "px" : "";
    measure();
    geo.loc = loc;
    stages = buildStages();                                  // its last stretch ends on the column where the wave ends (right)
    geo.mMax = geo.docH - geo.vh / 2;
    table = simulate();
    build();
    lastFlower = -1; lastWave = -1;
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
