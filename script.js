(function () {
  "use strict";

  /* Page transitions: a soft cross-fade of the whole page, done in CSS (@view-transition). Nothing to do here. */

  /* Level 2 disclosures. A trigger is any button with aria-controls pointing to a .panel.
     Triggers that share data-group behave like an accordion: one open at a time. */
  var triggers = document.querySelectorAll(".toggle[aria-controls], .step-btn[aria-controls]");

  triggers.forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    var text = btn.querySelector(".toggle-text");
    var openLabel = btn.dataset.open || "Close";
    var closedLabel = text ? text.textContent : "";

    function set(open) {
      btn.setAttribute("aria-expanded", String(open));
      if (open) panel.setAttribute("data-open", "");
      else panel.removeAttribute("data-open");
      if (text) text.textContent = open ? openLabel : closedLabel;
    }
    btn._set = set;

    set(false);
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      if (open && btn.dataset.group) {
        triggers.forEach(function (other) {
          if (other !== btn && other.dataset.group === btn.dataset.group && other._set) other._set(false);
        });
      }
      set(open);
    });
  });

  /* Case study thumbnails: a small parallax. The image is a little larger than its frame and drifts
     as the card crosses the viewport. Not on images shown whole (.fit), and not with reduced motion. */
  var parallax = [];
  var motionOK = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  document.querySelectorAll(".card-btn .card-thumb img:not(.fit)").forEach(function (img) { parallax.push({ img: img, box: img.parentNode, y: null }); });
  var PX = { scale: 1.3, shift: 0.12 };            // shift: share of the frame height, each way (scale leaves 0.15 spare on each side)
  function updateParallax() {
    var vh = window.innerHeight;
    parallax.forEach(function (it) {
      var r = it.box.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var p = clamp01(((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2), -1, 1);   // -1 entering from below ... 1 leaving at the top
      var y = Math.round(-p * PX.shift * r.height * 10) / 10;
      if (y === it.y) return;
      it.y = y;
      it.img.style.transform = "translate3d(0," + y + "px,0) scale(" + PX.scale + ")";
    });
  }
  function clamp01(v, a, b) { return v < a ? a : v > b ? b : v; }
  var pxTick = false;
  function onScrollParallax() {
    if (pxTick) return;
    pxTick = true;
    requestAnimationFrame(function () { pxTick = false; updateParallax(); });
  }
  if (motionOK && parallax.length) {
    window.addEventListener("scroll", onScrollParallax, { passive: true });
    window.addEventListener("resize", onScrollParallax);
    updateParallax();
  }
  /* Lines draw in when they enter the viewport. */
  var drawn = document.querySelectorAll(".gridlines");
  if ("IntersectionObserver" in window) {
    var drawObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          drawObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    drawn.forEach(function (el) { drawObserver.observe(el); });
  } else {
    drawn.forEach(function (el) { el.classList.add("in"); });
  }

  /* Generated line-art thumbnails: load them when they come into view so their drawing animation is seen. */
  var animated = document.querySelectorAll("img[data-anim]");
  function startThumb(img) { img.src = img.dataset.anim; }
  if ("IntersectionObserver" in window) {
    var thumbObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          startThumb(entry.target);
          thumbObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    animated.forEach(function (img) { thumbObserver.observe(img); });
  } else {
    animated.forEach(startThumb);
  }

  /* Case pages: two gallery views + viewer.
     "Expanded" (default): the images float beside the text they illustrate, in small constellations, with a slight
     3D tilt, a scroll drift and an entrance. "Strip": a horizontal strip fixed to the bottom of the screen, each
     thumbnail with its own proportions. The list in .case-gallery is the source for both and sets the viewer order.
     The view is remembered in localStorage ("galleryView"); a small script in <head> applies it before first paint. */
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gallery = document.querySelector(".case-gallery");
  if (gallery) {
    var root = document.documentElement;
    var track = gallery.querySelector(".gallery-track");
    var items = Array.prototype.slice.call(gallery.querySelectorAll(".gallery-item"));
    var mobileMQ = window.matchMedia("(max-width: 860px)");

    // Fold / unfold the strip (the button is shown on mobile only)
    var fold = gallery.querySelector(".gallery-toggle");
    if (fold) {
      fold.addEventListener("click", function () {
        var open = fold.getAttribute("aria-expanded") !== "true";
        fold.setAttribute("aria-expanded", String(open));
        gallery.classList.toggle("is-folded", !open);
        fold.querySelector(".gallery-toggle-text").textContent = open ? "Hide images" : "Show images";
      });
    }

    // Vertical wheel turns into horizontal scroll while the pointer is over the strip (only while it can still move)
    track.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;           // trackpads already scroll sideways
      var max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;
      var next = track.scrollLeft + e.deltaY;
      if ((e.deltaY < 0 && track.scrollLeft <= 0) || (e.deltaY > 0 && track.scrollLeft >= max - 1)) return;
      e.preventDefault();
      track.scrollLeft = Math.max(0, Math.min(max, next));
    }, { passive: false });

    // Drag with the mouse (touch keeps its native swipe). A real drag does not open the viewer.
    var drag = null, dragged = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft };
      dragged = false;
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!dragged && Math.abs(dx) > 5) { dragged = true; track.classList.add("is-dragging"); }
      if (dragged) track.scrollLeft = drag.left - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!drag) return;
      drag = null;
      track.classList.remove("is-dragging");
      setTimeout(function () { dragged = false; }, 0);
    });

    /* ----- Expanded view: constellations ----- */

    var SIZE = { l: 34, m: 26, s: 20 };                 // width in vw
    var DEPTH = { l: 1, m: 0.7, s: 0.45 };              // drift and stacking: larger is closer
    var MOBILE_W = { l: 85, m: 78, s: 70 };             // width in vw on mobile
    var MOBILE_H = { l: 66, m: 60, s: 54 };             // height in svh for tall images on mobile
    var GAP = 24;                                       // minimum clearance between an image and any text
    // Placements for pages without hand-tuned data (x, y in % of the row width)
    var AUTO = [
      { x: 69, y: 0, size: "m", rx: 4, ry: -7, rz: 1.5 },
      { x: 0, y: 6, size: "s", rx: -3, ry: 8, rz: -2 },
      { x: 34, y: 18, size: "l", rx: 3, ry: -5, rz: 1 },
      { x: 72, y: 34, size: "m", rx: -4, ry: 7, rz: -1.5 },
      { x: 6, y: 44, size: "s", rx: 4, ry: -8, rz: 2.5 },
      { x: 40, y: 56, size: "m", rx: -3, ry: 6, rz: -1 }
    ];

    // Anchors: elements marked data-anchor (Resa); otherwise every row of the case
    var anchors = {};
    var anchorList = [];
    var marked = document.querySelectorAll(".case-content [data-anchor]");
    if (marked.length) {
      Array.prototype.forEach.call(marked, function (el) { anchors[el.dataset.anchor] = el; anchorList.push(el); });
    } else {
      Array.prototype.forEach.call(document.querySelectorAll(".case-content .case-row"), function (el, i) {
        el.dataset.anchor = "row-" + i; anchors["row-" + i] = el; anchorList.push(el);
      });
    }
    // Items without data-section are spread evenly over the anchors, in order
    var groups = anchorList.map(function () { return []; });
    items.forEach(function (btn, i) {
      var a = btn.dataset.section && anchors[btn.dataset.section];
      var g = a ? anchorList.indexOf(a) : Math.min(anchorList.length - 1, Math.floor(i * anchorList.length / items.length));
      groups[g].push(i);
    });

    var floats = [];        // { el, card, btn, i, size, rx, ry, rz, x, y, ar, depth, sign, cy }
    var consts = [];        // { el, anchor, row, list }
    groups.forEach(function (list, g) {
      if (!list.length) return;
      var anchor = anchorList[g];
      var row = anchor.classList.contains("case-row") ? anchor : anchor.closest(".case-row");
      var box = document.createElement("div");
      box.className = "constellation";
      if (anchor === row) row.appendChild(box); else anchor.insertAdjacentElement("afterend", box);
      var c = { el: box, anchor: anchor, row: row, list: [] };
      list.forEach(function (i, k) {
        var src = items[i], d = src.dataset, auto = AUTO[k % AUTO.length];
        var num = function (v, f) { return v === undefined || v === "" || isNaN(+v) ? f : +v; };
        var f = {
          i: i, k: k, btn: null,
          x: num(d.x, auto.x), y: num(d.y, auto.y + (k >= AUTO.length ? 60 : 0)),
          size: SIZE[d.size] ? d.size : auto.size,
          rx: num(d.rx, auto.rx), ry: num(d.ry, auto.ry), rz: num(d.rz, auto.rz),
          ar: (+d.width || 4) / (+d.height || 3),
          sign: k % 2 ? -1 : 1, cy: 0, near: false, video: null
        };
        f.depth = DEPTH[f.size];
        var b = document.createElement("button");
        b.type = "button";
        b.className = "float float-" + f.size + (d.video ? " is-video" : "");
        b.setAttribute("aria-label", src.getAttribute("aria-label"));
        b.innerHTML = '<span class="float-card"><span class="float-enter"></span></span>';
        var enter = b.querySelector(".float-enter");
        var sh = Math.round(f.ry * -1.6) + "px " + Math.round(18 + f.rx * 1.6) + "px";
        enter.style.boxShadow = sh + " 40px rgba(0, 0, 0, 0.55)";
        if (d.video && !reduceMotion) {
          var v = document.createElement("video");
          v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
          v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
          v.width = +d.width; v.height = +d.height;
          enter.appendChild(v);
          f.video = v;
        } else {
          var img = document.createElement("img");
          img.src = d.full; img.width = +d.width; img.height = +d.height; img.alt = "";
          img.loading = "lazy"; img.decoding = "async";
          enter.appendChild(img);
          if (d.video) enter.insertAdjacentHTML("beforeend", '<span class="gallery-play" aria-hidden="true"></span>');
        }
        b.addEventListener("click", function () { openAt(i, b); });
        box.appendChild(b);
        f.btn = b; f.card = b.querySelector(".float-card");
        c.list.push(f); floats.push(f);
      });
      consts.push(c);
    });

    // A video gets its poster and sources only when it comes near the viewport
    function primeVideo(f) {
      var v = f.video;
      if (!v || v.dataset.ready) return;
      v.dataset.ready = "1";
      v.poster = items[f.i].dataset.full;
      (items[f.i].dataset.video || "").split("|").filter(Boolean).forEach(function (pair) {
        var bits = pair.split(";"), so = document.createElement("source");
        so.src = bits[0]; so.type = bits[1]; v.appendChild(so);
      });
      v.load();
      if (f.visible) play(f);
    }
    function play(f) { var pr = f.video.play(); if (pr && pr.catch) pr.catch(function () {}); }

    function expanded() { return root.classList.contains("view-expanded"); }
    function overlap(a, b) {
      var w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      return w > 0 && h > 0 ? w * h : 0;
    }

    /* Layout. Measures only here (on load, font load, view change and real resizes), never while scrolling.
       Desktop: each image is placed at its data-x / data-y (in % of the row width, from the top of its anchor) and
       pushed down until it clears every text block by GAP plus its own drift and tilt; images overlap each other by
       20 % at most; the constellation then grows so the following text starts below its last image.
       Mobile: the constellation is a band in the flow, between paragraphs, with alternating offsets. */
    var vw = 0, vh = 0, mobile = false;
    function layout() {
      if (!expanded()) return;
      vw = document.documentElement.clientWidth; vh = window.innerHeight; mobile = mobileMQ.matches;
      consts.forEach(function (c) { c.el.style.height = ""; });
      var sy = window.pageYOffset;
      var rowPlaced = new Map();
      consts.forEach(function (c) {
        var placedInRow = rowPlaced.get(c.row) || [];
        rowPlaced.set(c.row, placedInRow);
        c.list.forEach(function (f) {
          var w, h, el = f.btn;
          if (mobile) {
            if (f.ar < 1) { h = Math.min(MOBILE_H[f.size] * vh / 100, 1.5 * MOBILE_W[f.size] * vw / 100); w = h * f.ar; }
            else { w = MOBILE_W[f.size] * vw / 100; h = w / f.ar; }
          } else if (f.ar < 1) {
            h = Math.min(Math.max(SIZE[f.size] * vw / 100 * 1.2, 420), vh * 0.8); w = h * f.ar;
          } else {
            w = Math.max(SIZE[f.size] * vw / 100, 260); h = w / f.ar;
          }
          f.w = w; f.h = h;
          el.style.width = Math.round(w) + "px"; el.style.height = Math.round(h) + "px";
          el.style.left = ""; el.style.top = "";
        });
        if (mobile) return;
        var rowRect = c.row.getBoundingClientRect(), W = rowRect.width;
        var top0 = c.anchor.getBoundingClientRect().top - rowRect.top;
        if (c.anchor === c.row) top0 = c.row.querySelector(".span-main").getBoundingClientRect().top - rowRect.top;
        // Text blocks of the row that come before this constellation
        var texts = [];
        c.row.querySelectorAll("h2, h3, p, .case-visit").forEach(function (t) {
          if (c.el.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) return;
          var r = t.getBoundingClientRect();
          if (r.height) texts.push({ l: r.left - rowRect.left, r: r.right - rowRect.left, t: r.top - rowRect.top, b: r.bottom - rowRect.top });
        });
        var order = c.list.slice().sort(function (a, b) { return a.y - b.y; });
        order.forEach(function (f) {
          var mx = GAP + 20 * f.depth + f.w * 0.05, my = GAP + 40 * f.depth + f.h * 0.06;
          var x = Math.max(0, Math.min(W - f.w, f.x / 100 * W));
          var y = top0 + f.y / 100 * W;
          for (var guard = 0; guard < 40; guard++) {
            var box = { l: x, r: x + f.w, t: y, b: y + f.h }, moved = false;
            for (var j = 0; j < texts.length; j++) {
              var t = texts[j];
              if (box.l < t.r + mx && box.r > t.l - mx && box.t < t.b + my && box.b > t.t - my) { y = t.b + my; moved = true; break; }
            }
            if (moved) continue;
            for (var q = 0; q < placedInRow.length; q++) {
              var o = placedInRow[q];
              if (overlap(box, o) > 0.2 * Math.min(f.w * f.h, (o.r - o.l) * (o.b - o.t))) { y = o.b - Math.min(f.h, o.b - o.t) * 0.14; moved = true; break; }
            }
            if (!moved) break;
          }
          f.left = x; f.top = y;
          placedInRow.push({ l: x, r: x + f.w, t: y, b: y + f.h });
          f.btn.style.left = Math.round(x) + "px"; f.btn.style.top = Math.round(y) + "px";
        });
        // The constellation grows so the next text starts below its last image (plus room for the drift)
        var boxTop = c.el.getBoundingClientRect().top - rowRect.top;
        var bottom = Math.max.apply(null, c.list.map(function (f) { return f.top + f.h + 40 * f.depth; }));
        c.el.style.height = Math.max(0, Math.round(bottom - boxTop + GAP * 2)) + "px";
      });
      // Cache each image's centre (document coordinates) for the scroll loop
      floats.forEach(function (f) {
        var r = f.btn.getBoundingClientRect();
        f.cy = r.top + sy + r.height / 2;
      });
      frame();
    }

    /* Motion: one rAF loop, only for images near the viewport. Transforms only. */
    var ticking = false, lastY = window.pageYOffset, dir = 1;
    function frame() {
      ticking = false;
      if (!expanded()) return;
      var sy = window.pageYOffset, half = (mobile ? 0.5 : 1);
      floats.forEach(function (f) {
        if (!f.near && !reduceMotion) return;
        var p = reduceMotion ? 1 : Math.max(-1.2, Math.min(1.2, (f.cy - sy - vh / 2) / vh));
        var ease = reduceMotion ? 1 : 0.3 + 0.7 * Math.min(1, Math.abs(p) * 1.4);   // flatter at the middle of the screen
        var tilt = mobile ? 0.6 : 1;                                             // at most ±6° on mobile
        var dy = reduceMotion ? 0 : -p * 40 * f.depth * half;
        var dx = reduceMotion ? 0 : p * 20 * f.depth * f.sign * half;
        f.card.style.transform = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0) perspective(1200px) rotateX(" +
          (f.rx * tilt * ease).toFixed(2) + "deg) rotateY(" + (f.ry * tilt * ease).toFixed(2) + "deg) rotateZ(" + (f.rz * ease).toFixed(2) + "deg)";
      });
    }
    function onScroll() {
      var y = window.pageYOffset;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;
      if (!ticking && !reduceMotion) { ticking = true; requestAnimationFrame(frame); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    if ("IntersectionObserver" in window) {
      // Near the viewport: animate, load video sources
      var nearIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var f = e.target._float;
          f.near = e.isIntersecting;
          if (f.near) primeVideo(f);
        });
        if (!ticking) { ticking = true; requestAnimationFrame(frame); }
      }, { rootMargin: "50% 0px" });
      // Visible: videos play muted and in a loop, only while on screen
      var playIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var f = e.target._float;
          f.visible = e.isIntersecting && expanded();
          if (f.visible) { primeVideo(f); play(f); } else f.video.pause();
        });
      }, { threshold: 0.3 });
      // Entrance: each image fades and slides in from the scroll direction, once; images entering together are staggered
      var enterIO = new IntersectionObserver(function (entries) {
        var k = 0;
        entries.filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; })
          .forEach(function (e) {
            e.target.style.setProperty("--k", k++);
            e.target.style.setProperty("--from", dir);
            e.target.classList.add("is-in");
            enterIO.unobserve(e.target);
          });
      }, { rootMargin: "0px 0px -8% 0px" });
      floats.forEach(function (f) {
        f.btn._float = f;
        nearIO.observe(f.btn);
        if (f.video) playIO.observe(f.btn);
        if (reduceMotion) f.btn.classList.add("is-in"); else enterIO.observe(f.btn);
      });
    } else {
      floats.forEach(function (f) { f.near = true; f.btn.classList.add("is-in"); primeVideo(f); });
    }

    // Real resizes only (another width, or more than 120 px of height), with a short debounce
    var lastW = window.innerWidth, lastH = window.innerHeight, rt = null;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) <= 120) return;
      lastW = window.innerWidth; lastH = window.innerHeight;
      clearTimeout(rt); rt = setTimeout(layout, 120);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    window.addEventListener("load", layout);
    layout();

    /* ----- View toggle: Expanded | Strip ----- */

    var toggle = document.createElement("div");
    toggle.className = "view-toggle label";
    toggle.setAttribute("role", "group");
    toggle.setAttribute("aria-label", "Gallery view");
    toggle.innerHTML = '<button type="button" data-view="expanded">Expanded</button><button type="button" data-view="strip">Strip</button>';
    document.body.appendChild(toggle);
    var viewBtns = toggle.querySelectorAll("button");
    function syncToggle() {
      var v = expanded() ? "expanded" : "strip";
      viewBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.view === v)); });
    }
    // The toggle sits just above the strip while the strip is shown
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { root.style.setProperty("--strip-h", gallery.offsetHeight + "px"); }).observe(gallery);
    }
    // Keep the reading position: the text at the top of the screen stays where it is
    function readingAnchor() {
      var els = document.querySelectorAll(".case-intro, .case-row h2, .case-row p, .case-next");
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        if (r.bottom > 48) return { el: els[i], top: r.top };
      }
      return null;
    }
    function setView(v) {
      if ((v === "expanded") === expanded()) return;
      var ref = readingAnchor();
      root.classList.toggle("view-expanded", v === "expanded");
      root.classList.toggle("view-strip", v === "strip");
      try { localStorage.setItem("galleryView", v); } catch (e) {}
      syncToggle();
      if (v === "expanded") layout();
      else floats.forEach(function (f) { if (f.video) f.video.pause(); });
      if (ref) window.scrollTo({ top: window.pageYOffset + ref.el.getBoundingClientRect().top - ref.top, behavior: "instant" });
    }
    viewBtns.forEach(function (b) { b.addEventListener("click", function () { setView(b.dataset.view); }); });
    if (!root.classList.contains("view-strip") && !root.classList.contains("view-expanded")) root.classList.add("view-expanded");
    syncToggle();

    /* Viewer: a native modal <dialog> (the rest of the page becomes inert, focus stays inside, Esc closes) */
    var dlg = document.createElement("dialog");
    dlg.className = "viewer";
    dlg.setAttribute("aria-modal", "true");
    dlg.setAttribute("aria-label", "Image viewer");
    dlg.innerHTML =
      '<div class="viewer-stage">' +
        '<figure class="viewer-figure"><div class="viewer-media"></div>' +
        '<figcaption class="viewer-meta label"><span class="viewer-caption"></span><span class="viewer-count"></span></figcaption></figure>' +
      '</div>' +
      '<button class="viewer-btn viewer-prev" type="button" aria-label="Previous image"><span aria-hidden="true"></span></button>' +
      '<button class="viewer-btn viewer-next" type="button" aria-label="Next image"><span aria-hidden="true"></span></button>' +
      '<button class="viewer-btn viewer-close" type="button" aria-label="Close viewer"><span aria-hidden="true"></span></button>';
    document.body.appendChild(dlg);
    if (reduceMotion) dlg.classList.add("no-motion");
    var media = dlg.querySelector(".viewer-media");
    var capEl = dlg.querySelector(".viewer-caption");
    var countEl = dlg.querySelector(".viewer-count");
    var current = 0, opener = null;

    function videoSources(btn) {
      return (btn.dataset.video || "").split("|").filter(Boolean).map(function (pair) {
        var bits = pair.split(";"); return { src: bits[0], type: bits[1] };
      });
    }

    function render(i) {
      var n = items.length;
      current = (i + n) % n;
      var btn = items[current];
      var w = +btn.dataset.width || 16, h = +btn.dataset.height || 9;
      media.style.setProperty("--ratio", w + " / " + h);
      media.style.setProperty("--aspect", String(w / h));
      media.innerHTML = "";
      if (btn.dataset.video) {
        var wrap = document.createElement("div");
        wrap.className = "video-wrap";
        var v = document.createElement("video");
        v.muted = true; v.loop = true; v.playsInline = true;
        v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
        v.poster = btn.dataset.full;
        v.width = w; v.height = h;
        if (btn.dataset.alt) v.setAttribute("aria-label", btn.dataset.alt);
        videoSources(btn).forEach(function (s) {
          var so = document.createElement("source"); so.src = s.src; so.type = s.type; v.appendChild(so);
        });
        var tg = document.createElement("button");
        tg.className = "video-toggle"; tg.type = "button";
        tg.innerHTML = '<span aria-hidden="true"></span>';
        function sync() {
          var playing = !v.paused;
          wrap.setAttribute("data-playing", String(playing));
          tg.setAttribute("aria-label", playing ? "Pause video" : "Play video");
        }
        v.addEventListener("play", sync); v.addEventListener("pause", sync);
        tg.addEventListener("click", function () { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(sync); } else v.pause(); });
        wrap.appendChild(v); wrap.appendChild(tg);
        media.appendChild(wrap);
        sync();
        if (!reduceMotion) { var p = v.play(); if (p && p.catch) p.catch(sync); }
      } else {
        var img = document.createElement("img");
        img.src = btn.dataset.full; img.width = w; img.height = h;
        img.alt = btn.dataset.alt || "";
        img.decoding = "async";
        media.appendChild(img);
      }
      capEl.textContent = btn.dataset.caption || "";
      countEl.textContent = (current + 1) + " / " + n;
      if (!reduceMotion) { media.classList.remove("is-in"); void media.offsetWidth; media.classList.add("is-in"); }
    }

    function openAt(i, from) {
      opener = from || items[i];
      render(i);
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      root.classList.add("viewer-open");
      dlg.querySelector(".viewer-close").focus();
    }
    function close() {
      if (dlg.open && typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
    }
    dlg.addEventListener("close", function () {
      media.innerHTML = "";                                            // stops a playing video
      root.classList.remove("viewer-open");
      if (opener) opener.focus({ preventScroll: true });               // focus back to the image that opened it
    });

    items.forEach(function (btn, i) {
      btn.addEventListener("click", function (e) {
        if (dragged) { e.preventDefault(); return; }
        openAt(i, btn);
      });
    });
    dlg.querySelector(".viewer-prev").addEventListener("click", function () { render(current - 1); });
    dlg.querySelector(".viewer-next").addEventListener("click", function () { render(current + 1); });
    dlg.querySelector(".viewer-close").addEventListener("click", close);
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); render(current - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); render(current + 1); }
      else if (e.key === "Tab") {                                       // keep focus inside the viewer
        var f = Array.prototype.slice.call(dlg.querySelectorAll("button")).filter(function (b) { return b.offsetParent !== null; });
        var at = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    // A click outside the image (on the blurred page) closes
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.classList.contains("viewer-stage") || e.target.classList.contains("viewer-figure")) close();
    });
    // Swipe on touch screens
    var sx = null, sy0 = null;
    dlg.addEventListener("touchstart", function (e) { var t = e.touches[0]; sx = t.clientX; sy0 = t.clientY; }, { passive: true });
    dlg.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy0;
      sx = sy0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) render(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* Header: current chapter + chapter menu. */
  var sectionLabel = document.getElementById("section-label");
  var sections = document.querySelectorAll("main section[data-label]");
  var menuLinks = document.querySelectorAll("#chapter-menu a");
  function setCurrent(section) {
    if (sectionLabel) sectionLabel.textContent = section.dataset.label;
    menuLinks.forEach(function (a) {
      if (a.getAttribute("href") === "#" + section.id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) setCurrent(entry.target); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  var chapters = document.querySelector(".chapters");
  var chapterBtn = chapters && chapters.querySelector(".chapter-btn");
  function setMenu(open) {
    if (open) chapters.setAttribute("data-open", ""); else chapters.removeAttribute("data-open");
    chapterBtn.setAttribute("aria-expanded", String(open));
  }
  if (chapterBtn) {
    chapterBtn.addEventListener("click", function () {
      setMenu(chapterBtn.getAttribute("aria-expanded") !== "true");
    });
    menuLinks.forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("click", function (e) {
      if (!chapters.contains(e.target)) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && chapterBtn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        chapterBtn.focus();
      }
    });
  }

  /* Header: Madrid local time, live. */
  var clock = document.getElementById("clock");
  if (clock) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
      });
    } catch (e) { fmt = null; }
    var tick = function () {
      if (fmt) clock.textContent = fmt.format(new Date());
    };
    tick();
    setInterval(tick, 1000);
  }
})();
