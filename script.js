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

  /* Lines draw in when they enter the viewport. */
  var drawn = document.querySelectorAll(".art, .gridlines");
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

  /* Short website video: plays muted on a loop while visible; with reduced motion it stays paused, with controls. */
  var videos = document.querySelectorAll("video[data-autoplay]");
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  videos.forEach(function (v) {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    v.removeAttribute("controls");
    v.muted = true;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () { v.setAttribute("controls", ""); }); }
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
