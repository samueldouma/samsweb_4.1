(() => {
  "use strict";
  const toggle = document.getElementById("connectomeToggle");
  const arrows = [...document.querySelectorAll(".home-view-arrow")];
  if (!toggle) return;

  const rainbow = ["#ff0000", "#ff7f00", "#ffe600", "#00b83f", "#006eff", "#5a00c8", "#d000ff"];
  function recolorArrows() {
    const pool = [...rainbow].sort(() => Math.random() - 0.5);
    arrows.forEach((arrow, i) => {
      arrow.style.color = pool[i % pool.length];
      arrow.style.opacity = String(0.55 + Math.random() * 0.45);
    });
  }
  recolorArrows();
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(recolorArrows, 667);
  }

  toggle.addEventListener("click", () => {
    toggle.setAttribute("aria-checked", "true");
    window.location.href = "contentconnectomev1.html";
  });
  window.addEventListener("pageshow", () => toggle.setAttribute("aria-checked", "false"));
})();
