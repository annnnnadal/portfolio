/* Site modes: Expressive (colour, motion and the hero game) and Essential (flat, still, light, accessible).
   The mode lives in <html data-mode>, set before first paint by a small inline script in each page's <head>
   (the saved choice in localStorage "siteMode", else Essential with reduced motion or Save-Data, else Expressive).

   Essential is the base page. Expressive is a layer on top: on the homepage this script swaps in its markup
   (home-expressive.html, already being fetched by the <head> script) and only then loads GSAP, ScrollTrigger,
   Matter.js and the animation scripts. In Essential none of them is ever requested.

   The switch saves the choice, remembers the section in view, reloads, and returns to that section, so each
   mode always starts clean. */
(function () {
  "use strict";
  var root = document.documentElement;
  var mode = root.getAttribute("data-mode") === "essential" ? "essential" : "expressive";
  var isHome = document.body.classList.contains("home");
  var RETURN_KEY = "siteModeReturn";
  var TIP = {
    essential: "Essential: no animations, a lighter page and lower energy use.",
    expressive: "Expressive: colour, motion and a small game."
  };

  /* ---------- The switch ---------- */

  // Sections a visitor can come back to: the chapters on the homepage, the blocks of a case page
  function anchors() {
    var list = document.querySelectorAll(isHome ? "main [data-label], footer[data-label], .footer-spacer[data-label]" : "main .case-intro, main .case-row, main .case-next");
    return Array.prototype.slice.call(list).filter(function (el) { return el.id || !isHome; });
  }
  function currentAnchor() {
    var list = anchors(), found = null;
    list.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      if (r.top <= 120 && r.height) found = { id: el.id, index: i };   // the one at the top of the screen
    });
    return found;
  }
  function setMode(next) {
    if (next === mode) return;
    try { localStorage.setItem("siteMode", next); } catch (e) {}
    var at = currentAnchor();
    try { if (at && window.pageYOffset > 40) sessionStorage.setItem(RETURN_KEY, JSON.stringify(at)); else sessionStorage.removeItem(RETURN_KEY); } catch (e) {}
    location.reload();
  }
  function wire(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll(".mode-switch"), function (sw) {
      var btn = sw.querySelector(".mode-toggle"), tip = sw.querySelector(".mode-tip");
      // On = Essential. The description (also the tooltip) tells what the other mode gives.
      btn.setAttribute("aria-checked", String(mode === "essential"));
      if (tip) tip.textContent = TIP[mode === "essential" ? "expressive" : "essential"];
      btn.addEventListener("click", function () { setMode(mode === "essential" ? "expressive" : "essential"); });
      Array.prototype.forEach.call(sw.querySelectorAll("[data-mode-set]"), function (label) {
        label.addEventListener("click", function () { setMode(label.getAttribute("data-mode-set")); });
      });
    });
  }

  /* ---------- Back to the section the visitor was in ---------- */

  function returnTo() {
    var at;
    try { at = JSON.parse(sessionStorage.getItem(RETURN_KEY) || "null"); sessionStorage.removeItem(RETURN_KEY); } catch (e) {}
    if (!at) return;
    var el = (at.id && document.getElementById(at.id)) || anchors()[at.index];
    if (!el) return;
    var go = function () {
      // A pinned section sits inside its spacer: go to the spacer's top
      var box = el.parentElement && el.parentElement.classList.contains("pin-spacer") ? el.parentElement : el;
      window.scrollTo({ top: Math.max(0, box.getBoundingClientRect().top + window.pageYOffset - 40), behavior: "instant" });
    };
    go();
    // Fonts and (in Expressive) the scroll animations change the page height after load: settle again
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(go, 60); });
    // ...and the floating gallery of a case page lays itself out on load
    if (document.readyState !== "complete") window.addEventListener("load", function () { setTimeout(go, 60); });
    setTimeout(go, 700);
    setTimeout(go, 1600);
  }

  /* ---------- Loading ---------- */

  function load(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.async = false;
      s.onload = resolve; s.onerror = reject;
      document.body.appendChild(s);
    });
  }
  function chain(list) {
    return list.reduce(function (p, src) { return p.then(function () { return load(src); }); }, Promise.resolve());
  }
  function essentialPage() {
    // (if the Expressive layer failed, its stylesheet goes too)
    Array.prototype.forEach.call(document.querySelectorAll('link[href="home.css"]'), function (l) { l.remove(); });
    root.setAttribute("data-mode", "essential");
    mode = "essential";
    wire(document);
    return load("script.js");
  }

  if (!isHome) {
    // Case pages: script.js is already on the page and reads the mode itself. In Essential, the next project's
    // thumbnail is the small one (lazy, so it has not been requested yet)
    if (mode === "essential") {
      Array.prototype.forEach.call(document.querySelectorAll(".next-thumb img[data-small]"), function (img) {
        var k = "/images/thumbs/" + img.getAttribute("data-small");
        img.srcset = k + "-320.webp 320w, " + k + "-640.webp 640w";
        img.sizes = "160px";
        img.src = k + "-320.webp";
      });
    }
    wire(document);
    returnTo();
    return;
  }

  if (mode === "essential" || !window.__layer) {
    essentialPage().then(returnTo);
    return;
  }

  // Expressive homepage: the layer replaces the Essential page, then its scripts load in order
  window.__layer.then(function (html) {
    var tpl = document.createElement("template");
    tpl.innerHTML = html;
    var oldMain = document.querySelector("main"), oldFoot = document.querySelector("footer");
    oldMain.replaceWith(tpl.content);
    if (oldFoot) oldFoot.remove();
    root.classList.add("layer-ready");
    wire(document);
    return chain(["script.js", "vendor/gsap.min.js", "vendor/ScrollTrigger.min.js", "vendor/matter.min.js", "hero.js", "home-anim.js", "home.js"]);
  }).then(returnTo, function () {
    // The layer could not load: show the Essential page instead (the choice is kept for next time)
    essentialPage().then(returnTo);
  });
})();
