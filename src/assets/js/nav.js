(() => {
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");
  if (!toggle || !panel) return;

  const wide = window.matchMedia("(min-width: 48rem)");

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  }

  function sync() {
    // On wide screens the links are always visible and the button is hidden by CSS.
    if (wide.matches) {
      toggle.setAttribute("aria-expanded", "false");
      panel.hidden = false;
    } else {
      setOpen(false);
    }
  }

  toggle.addEventListener("click", () => setOpen(panel.hidden));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || wide.matches || panel.hidden) return;
    setOpen(false);
    toggle.focus();
  });

  wide.addEventListener("change", sync);
  sync();
})();
