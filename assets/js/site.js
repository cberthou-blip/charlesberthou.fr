function setupMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.getElementById(toggle?.getAttribute("aria-controls"));
  if (!toggle || !nav) return;

  const mobileQuery = window.matchMedia("(max-width: 759px)");
  const navLinks = Array.from(nav.querySelectorAll("a"));

  const setInteractive = (interactive) => {
    nav.hidden = mobileQuery.matches && !interactive;
    nav.toggleAttribute("inert", mobileQuery.matches && !interactive);
    nav.setAttribute("aria-hidden", String(mobileQuery.matches && !interactive));
    navLinks.forEach((link) => {
      if (mobileQuery.matches && !interactive) {
        link.setAttribute("tabindex", "-1");
      } else {
        link.removeAttribute("tabindex");
      }
    });
  };

  const setOpen = (open, restoreFocus = false) => {
    const shouldOpen = Boolean(open && mobileQuery.matches);
    document.body.classList.toggle("menu-open", shouldOpen);
    toggle.setAttribute("aria-expanded", String(shouldOpen));
    toggle.setAttribute("aria-label", shouldOpen ? "Fermer le menu" : "Ouvrir le menu");
    setInteractive(shouldOpen || !mobileQuery.matches);
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
  navLinks.forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false, document.body.classList.contains("menu-open"));
  });
  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("menu-open")) return;
    if (toggle.contains(event.target) || nav.contains(event.target)) return;
    setOpen(false);
  });
  mobileQuery.addEventListener?.("change", () => setOpen(false));
  setOpen(false);
}

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
});
