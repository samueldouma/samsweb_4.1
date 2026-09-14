(() => {
  "use strict";
  const back = document.getElementById("directoryBack");
  const search = document.getElementById("directorySearch");
  const sections = [...document.querySelectorAll(".directory-section")];

  back.addEventListener("click", () => {
    let sameSite = false;
    try { sameSite = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin; } catch (_) {}
    if (sameSite) history.back();
    else location.href = "index.html";
  });

  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    sections.forEach(section => {
      const sectionMatch = !query || (section.dataset.sectionSearch || "").toLowerCase().includes(query);
      let shown = 0;
      section.querySelectorAll(".directory-item").forEach(item => {
        const itemMatch = !query || (item.dataset.search || item.textContent).toLowerCase().includes(query);
        const match = sectionMatch || itemMatch;
        item.hidden = !match;
        if (match) shown += 1;
      });
      section.hidden = !sectionMatch && shown === 0;
    });
  });
})();
