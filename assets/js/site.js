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

function setupResourceFilters() {
  const tabs = Array.from(document.querySelectorAll("[data-filter]"));
  const cards = Array.from(document.querySelectorAll("[data-category]"));
  if (!tabs.length || !cards.length) return;

  const applyFilter = (filter) => {
    tabs.forEach((tab) => {
      const selected = tab.dataset.filter === filter;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
    cards.forEach((card) => {
      const visible = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !visible);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => applyFilter(tab.dataset.filter || "all"));
  });
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

function setupPromptCopy() {
  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;
      const initialText = button.textContent;
      try {
        await copyToClipboard(target.textContent.trim());
        button.textContent = "Prompt copié";
      } catch {
        button.textContent = "Copie impossible";
      } finally {
        window.setTimeout(() => {
          button.textContent = initialText;
        }, 1600);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupResourceFilters();
  setupPromptCopy();
});
