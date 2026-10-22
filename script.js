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

  /* Case pages: gallery fixed to the bottom of the screen + viewer.
     The gallery is a horizontal strip of square thumbnails (sticky at the bottom while the case is read). It scrolls
     with the wheel or trackpad, by dragging with the mouse and by swiping. A thumbnail opens the viewer: the image
     (or video) whole and as large as possible, on the blurred page, with arrows, keys, swipe, caption and counter. */
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gallery = document.querySelector(".case-gallery");
  if (gallery) {
    var track = gallery.querySelector(".gallery-track");
    var items = Array.prototype.slice.call(gallery.querySelectorAll(".gallery-item"));

    // Fold / unfold (the button is shown on mobile only)
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

    function openAt(i) {
      opener = items[i];
      render(i);
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      document.documentElement.classList.add("viewer-open");
      dlg.querySelector(".viewer-close").focus();
    }
    function close() {
      if (dlg.open && typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
    }
    dlg.addEventListener("close", function () {
      media.innerHTML = "";                                            // stops a playing video
      document.documentElement.classList.remove("viewer-open");
      if (opener) opener.focus();                                       // focus back to the thumbnail
    });

    items.forEach(function (btn, i) {
      btn.addEventListener("click", function (e) {
        if (dragged) { e.preventDefault(); return; }
        openAt(i);
      });
    });
    dlg.querySelector(".viewer-prev").addEventListener("click", function () { render(current - 1); });
    dlg.querySelector(".viewer-next").addEventListener("click", function () { render(current + 1); });
    dlg.querySelector(".viewer-close").addEventListener("click", close);
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {                                           // focus stays inside the viewer
        var f = Array.prototype.slice.call(dlg.querySelectorAll("button")).filter(function (b) { return b.offsetParent !== null; });
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        return;
      }
      if (e.key === "ArrowLeft") { e.preventDefault(); render(current - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); render(current + 1); }
    });
    // A click outside the image (on the blurred page) closes
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.classList.contains("viewer-stage") || e.target.classList.contains("viewer-figure")) close();
    });
    // Swipe on touch screens
    var sx = null, sy = null;
    dlg.addEventListener("touchstart", function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    dlg.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      sx = sy = null;
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
