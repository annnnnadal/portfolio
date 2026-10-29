/* Homepage only: footer reveal and the cat's eyes. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Footer reveal. The footer is fixed underneath the page; a transparent spacer at the end of the page is as tall
     as the footer, so scrolling through it slides the content up and shows the footer. If the footer is taller than
     the screen, it simply follows the page instead (nothing is ever hidden). Measured on load and on real resizes. */
  var footer = document.querySelector(".contact");
  var spacer = document.querySelector(".footer-spacer");
  var root = document.documentElement;
  function fitFooter() {
    if (!footer || !spacer) return;
    footer.classList.remove("is-static");
    var h = footer.offsetHeight;
    if (h > window.innerHeight - 40) {           // 40: the topbar
      footer.classList.add("is-static");
      root.style.setProperty("--footer-h", "0px");
    } else {
      root.style.setProperty("--footer-h", h + "px");
    }
    measureEyes();
  }
  var lastW = window.innerWidth, lastH = window.innerHeight, rt = null;
  window.addEventListener("resize", function () {
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) <= 120) return;
    lastW = window.innerWidth; lastH = window.innerHeight;
    clearTimeout(rt); rt = setTimeout(fitFooter, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFooter);
  window.addEventListener("load", fitFooter);

  /* Cat: the pupils follow the cursor (or the last touch), clamped inside the eye, with easing (lerp).
     With no input they look straight ahead; with reduced motion they stay centred. */
  var eyes = Array.prototype.map.call(document.querySelectorAll(".cat [data-eye]"), function (g) {
    var iris = g.querySelector(".cat-iris"), pupil = g.querySelector(".cat-pupil");
    var r = +iris.getAttribute("r"), pr = +pupil.getAttribute("r");
    return { iris: iris, pupil: pupil, max: r - pr - 0.4, x: 0, y: 0, tx: 0, ty: 0, cx: 0, cy: 0, scale: 1 };
  });
  var svg = document.querySelector(".cat svg");
  function measureEyes() {
    if (!svg) return;
    var box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    var k = box.width / vb.width;                // screen px per SVG unit
    eyes.forEach(function (e) {
      e.scale = k;
      e.cx = box.left + +e.iris.getAttribute("cx") * k;
      e.cy = box.top + +e.iris.getAttribute("cy") * k;
    });
  }
  var pointer = null, ticking = false;
  function aim() {
    eyes.forEach(function (e) {
      if (!pointer) { e.tx = 0; e.ty = 0; return; }
      var dx = pointer.x - e.cx, dy = pointer.y - e.cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var reach = Math.min(1, d / (e.scale * 60));          // close to the eye, the pupil moves less
      e.tx = dx / d * e.max * reach; e.ty = dy / d * e.max * reach;
    });
    if (!ticking) { ticking = true; requestAnimationFrame(step); }
  }
  function step() {
    var moving = false;
    eyes.forEach(function (e) {
      e.x += (e.tx - e.x) * 0.14; e.y += (e.ty - e.y) * 0.14;
      if (Math.abs(e.tx - e.x) > 0.01 || Math.abs(e.ty - e.y) > 0.01) moving = true;
      e.pupil.setAttribute("transform", "translate(" + e.x.toFixed(2) + " " + e.y.toFixed(2) + ")");
    });
    if (moving) requestAnimationFrame(step); else ticking = false;
  }
  if (eyes.length && !reduceMotion) {
    // The footer is fixed, so the eyes only move on screen when the page scrolls past its end or when it is static
    window.addEventListener("scroll", function () { if (footer && footer.classList.contains("is-static")) measureEyes(); }, { passive: true });
    window.addEventListener("pointermove", function (ev) {
      if (ev.pointerType === "touch") return;
      pointer = { x: ev.clientX, y: ev.clientY }; aim();
    }, { passive: true });
    // The mouse leaves the window: look straight ahead again (a finger lifting keeps the last touch)
    document.documentElement.addEventListener("pointerleave", function (ev) { if (ev.pointerType === "mouse") { pointer = null; aim(); } });
    window.addEventListener("touchstart", function (ev) {
      var t = ev.touches[0]; if (!t) return;
      if (footer && footer.classList.contains("is-static")) measureEyes();
      pointer = { x: t.clientX, y: t.clientY }; aim();
    }, { passive: true });
  }
  fitFooter();
})();
