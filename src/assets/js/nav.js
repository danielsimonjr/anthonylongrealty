document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");
  if (!toggle || !panel) return;

  const mq = window.matchMedia("(min-width: 48rem)");

  function syncLayout() {
    if (mq.matches) {
      panel.hidden = false;
      toggle.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    } else {
      toggle.hidden = false;
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  function closePanel() {
    if (mq.matches) return;
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanel();
      toggle.focus();
    }
  });

  mq.addEventListener("change", syncLayout);
  syncLayout();
});
