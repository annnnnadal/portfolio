(function () {
  "use strict";

  /* Level 2 disclosures. A trigger is any button with aria-controls pointing to a .panel.
     Triggers that share data-group behave like an accordion: one open at a time. */
  var triggers = document.querySelectorAll(".toggle[aria-controls], .step-btn[aria-controls], .card-btn[aria-controls]");

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

  /* "Close case" button at the end of a case: closes it and returns to its card. */
  document.querySelectorAll("[data-close]").forEach(function (closer) {
    closer.addEventListener("click", function () {
      var card = document.getElementById(closer.dataset.close);
      if (!card) return;
      if (card._set) card._set(false);
      card.focus({ preventScroll: true });
      card.scrollIntoView({ block: "center", behavior: "smooth" });
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

  /* Corner meta: current section. */
  var sectionLabel = document.getElementById("section-label");
  var sections = document.querySelectorAll("main section[data-label]");
  if (sectionLabel && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) sectionLabel.textContent = entry.target.dataset.label;
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* Corner meta: Madrid local time, live. */
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
