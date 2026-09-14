(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  if (params.get("embedded") === "1") return;

  function sameSiteReferrer() {
    try {
      return Boolean(document.referrer) && new URL(document.referrer).origin === location.origin;
    } catch (_) {
      return false;
    }
  }
  function goBack(fallback = "index.html") {
    if (sameSiteReferrer()) history.back();
    else location.href = fallback;
  }
  function arrowMarkup(control) {
    control.textContent = "";
    const line = document.createElement("span");
    line.setAttribute("aria-hidden", "true");
    control.appendChild(line);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const existing = [...document.querySelectorAll("a.back-button")]
      .find(a => /^back\b/i.test(a.textContent.trim()));

    let control;
    let fallback = "index.html";
    if (existing) {
      control = existing;
      fallback = existing.getAttribute("href") || fallback;
      control.classList.add("page-history-back");
      control.setAttribute("aria-label", "Return to previous page");
      control.removeAttribute("target");
      arrowMarkup(control);
      control.addEventListener("click", event => {
        event.preventDefault();
        goBack(fallback);
      });
    } else {
      control = document.createElement("button");
      control.type = "button";
      control.className = "page-history-back";
      control.setAttribute("aria-label", "Return to previous page");
      arrowMarkup(control);
      control.addEventListener("click", () => goBack("index.html"));
    }

    const bodyStyle = getComputedStyle(document.body);
    const fullScreenApp = (bodyStyle.display === "flex" || bodyStyle.display === "grid") &&
      (bodyStyle.overflow === "hidden" || bodyStyle.overflowY === "hidden");
    if (fullScreenApp) control.classList.add("page-history-back-fixed");

    document.body.insertBefore(control, document.body.firstChild);
  });
})();
