(function () {
  "use strict";

  /* Page transitions between the homepage and the case study pages.
     The thumbnail (or the "next project" image) and the case hero share a view-transition-name,
     so the image grows into the hero when opening and shrinks back when closing.
     Browsers without cross-document view transitions simply navigate. */
  var VT = "case-hero";
  function path(url) { return new URL(url, location.href).pathname.replace(/index\.html$/, ""); }
  function isCase(p) { return /^\/case\/[^/]+\/?$/.test(p); }
  function thumbFor(target) {
    // Image on the current page that links to the given case page
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (!a.matches(".card-btn, .next-link")) continue;
      if (path(a.href).replace(/\/$/, "") === target.replace(/\/$/, "")) return a.querySelector(".card-thumb");
    }
    return null;
  }
  function clearNames() {
    document.querySelectorAll(".card-thumb, .case-hero-fig").forEach(function (el) { el.style.viewTransitionName = ""; });
  }

  window.addEventListener("pageswap", function (e) {
    if (!e.viewTransition || !e.activation || !e.activation.entry) return;
    var to = path(e.activation.entry.url);
    clearNames();
    var hero = document.querySelector(".case-hero-fig");
    if (isCase(to)) {
      var thumb = thumbFor(to);              // homepage card or "next project"
      if (!thumb) { e.viewTransition.skipTransition(); return; }
      if (hero) hero.style.viewTransitionName = "none";
      thumb.style.viewTransitionName = VT;
      resetParallax(thumb.querySelector("img"));
    } else if (!hero) {
      e.viewTransition.skipTransition();     // homepage to something else
    }                                          // case page to homepage: the hero keeps its name
  });

  window.addEventListener("pagereveal", function (e) {
    if (!e.viewTransition || !window.navigation || !navigation.activation || !navigation.activation.from) return;
    var from = path(navigation.activation.from.url);
    if (isCase(path(location.href))) return;   // a case page: its hero already has the name
    if (!isCase(from)) return;
    var thumb = thumbFor(from);                // back on the homepage: the card of the case we just left
    if (!thumb) return;
    thumb.scrollIntoView({ block: "center", behavior: "instant" });
    thumb.style.viewTransitionName = VT;
    e.viewTransition.finished.then(clearNames, clearNames);
  });

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
     as the card crosses the viewport. Not on images shown whole (.fit), and not with reduced motion; reset just before a page transition. */
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
  function resetParallax(img) {
    if (!img) return;
    img.style.transform = "";
    parallax.forEach(function (it) { if (it.img === img) it.y = null; });
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

  /* Short website video: no sound, so a single centred play / pause button.
     It plays on a loop while visible; with reduced motion it waits for the button. */
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("video[data-autoplay]").forEach(function (v) {
    var wrap = v.closest(".video-wrap");
    var btn = wrap && wrap.querySelector(".video-toggle");
    if (!btn) return;
    var userPaused = false;
    v.removeAttribute("controls");
    v.muted = true;

    function sync() {
      var playing = !v.paused;
      wrap.setAttribute("data-playing", String(playing));
      btn.setAttribute("aria-label", playing ? "Pause video" : "Play video");
    }
    function play() { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(sync); }
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    sync();

    btn.addEventListener("click", function () {
      if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); }
    });

    if (reduceMotion || !("IntersectionObserver" in window)) { userPaused = true; return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { if (!userPaused) play(); }
        else v.pause();
      });
    }, { threshold: 0.35 }).observe(v);
  });

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
