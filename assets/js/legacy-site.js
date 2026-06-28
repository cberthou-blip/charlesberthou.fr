function ensureIconSprite() {
  if (document.querySelector(".icon-sprite")) return;
  document.body.insertAdjacentHTML("afterbegin", `
    <svg class="icon-sprite" aria-hidden="true">
      <symbol id="icon-tools" viewBox="0 0 24 24">
        <path d="M12 3l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z" />
      </symbol>
      <symbol id="icon-arrow-up" viewBox="0 0 24 24">
        <path d="M12 19V5" />
        <path d="M6 11l6-6 6 6" />
      </symbol>
    </svg>
  `);
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/`/g, "&#096;");
}

function enhanceMobileNavigation() {
  const header = document.querySelector(".site-header");
  const nav = header?.querySelector(".main-nav");
  const navBar = header?.querySelector(".nav-bar");
  if (!header || !nav || !navBar || header.querySelector(".menu-toggle")) return;
  const mobileQuery = window.matchMedia("(max-width: 680px)");
  const navLinks = Array.from(nav.querySelectorAll("a"));

  const navId = nav.id || "navigation-principale";
  nav.id = navId;
  header.classList.add("has-mobile-menu");

  const button = document.createElement("button");
  button.className = "menu-toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Ouvrir le menu");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", navId);
  button.innerHTML = "<span></span><span></span><span></span>";
  navBar.insertBefore(button, nav);

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

  const setOpen = (isOpen, restoreFocus = false) => {
    const shouldOpen = Boolean(isOpen && mobileQuery.matches);
    header.classList.toggle("menu-open", shouldOpen);
    document.documentElement.classList.toggle("mobile-nav-open", shouldOpen);
    button.setAttribute("aria-expanded", String(shouldOpen));
    button.setAttribute("aria-label", shouldOpen ? "Fermer le menu" : "Ouvrir le menu");
    setInteractive(shouldOpen || !mobileQuery.matches);
    if (restoreFocus) button.focus();
  };

  button.addEventListener("click", () => setOpen(!header.classList.contains("menu-open")));
  navLinks.forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("click", (event) => {
    if (!header.classList.contains("menu-open") || header.contains(event.target)) return;
    setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false, header.classList.contains("menu-open"));
  });
  mobileQuery.addEventListener?.("change", () => setOpen(false));
  setOpen(false);
}

function enhanceMobileCollapsibles() {
  const blocks = Array.from(document.querySelectorAll("[data-mobile-collapse]"));
  if (!blocks.length) return;

  const mobileQuery = window.matchMedia("(max-width: 680px)");
  const configuredBlocks = [];

  blocks.forEach((block, index) => {
    if (block.dataset.mobileCollapseReady === "true") return;
    block.dataset.mobileCollapseReady = "true";
    const label = block.dataset.mobileCollapse || "Section";
    const defaultOpen = block.dataset.mobileOpen !== "false";
    const button = document.createElement("button");
    button.className = "mobile-collapse-toggle";
    button.type = "button";
    button.setAttribute("aria-controls", `mobile-collapse-${index}`);
    button.innerHTML = `<span>${escapeAttribute(label)}</span><span aria-hidden="true"></span>`;

    const content = block.querySelector(".mobile-collapse-content");
    if (content) content.id = content.id || `mobile-collapse-${index}`;

    const setCollapsed = (collapsed) => {
      block.dataset.collapsed = collapsed ? "true" : "false";
      button.setAttribute("aria-expanded", String(!collapsed));
    };

    button.addEventListener("click", () => {
      if (mobileQuery.matches) block.dataset.mobileTouched = "true";
      setCollapsed(block.dataset.collapsed !== "true");
    });
    block.insertBefore(button, block.firstChild);
    setCollapsed(mobileQuery.matches ? !defaultOpen : false);
    configuredBlocks.push({ block, button, defaultOpen });
  });

  const syncForViewport = () => {
    configuredBlocks.forEach(({ block, button, defaultOpen }) => {
      if (mobileQuery.matches) {
        if (block.dataset.mobileTouched === "true") return;
        block.dataset.collapsed = defaultOpen ? "false" : "true";
        button.setAttribute("aria-expanded", String(defaultOpen));
      } else {
        delete block.dataset.mobileTouched;
        block.dataset.collapsed = "false";
        button.setAttribute("aria-expanded", "true");
      }
    });
  };

  mobileQuery.addEventListener?.("change", syncForViewport);
}

function hydrateBackToTop() {
  if (document.querySelector("[data-back-to-top]")) return;
  const button = document.createElement("button");
  button.className = "back-to-top";
  button.type = "button";
  button.setAttribute("data-back-to-top", "");
  button.setAttribute("aria-label", "Remonter en haut de la page");
  button.innerHTML = '<svg aria-hidden="true"><use href="#icon-arrow-up"></use></svg>';
  document.body.appendChild(button);
  const mobileQuery = window.matchMedia("(max-width: 719px)");
  const updateVisibility = () => button.classList.toggle("is-visible", mobileQuery.matches && window.scrollY > 520);
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", updateVisibility, { passive: true });
  mobileQuery.addEventListener?.("change", updateVisibility);
  updateVisibility();
}

document.addEventListener("DOMContentLoaded", () => {
  ensureIconSprite();
  enhanceMobileNavigation();
  enhanceMobileCollapsibles();
  hydrateBackToTop();
});
