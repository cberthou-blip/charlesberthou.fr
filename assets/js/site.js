const CONTACT_ENDPOINT = "https://api.web3forms.com/submit";
const CONTACT_ACCESS_KEY = "17656ba1-b511-4eed-b0b7-a34bc7716102";
const CONTACT_RECIPIENT_CODES = [99, 98, 101, 114, 116, 104, 111, 117, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109];

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

function enhanceMobileNavigation() {
  const header = document.querySelector(".site-header");
  const nav = header?.querySelector(".main-nav");
  const navBar = header?.querySelector(".nav-bar");
  if (!header || !nav || !navBar || header.querySelector(".menu-toggle")) return;
  const mobileQuery = window.matchMedia("(max-width: 680px)");

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

  const setOpen = (isOpen) => {
    const shouldOpen = Boolean(isOpen && mobileQuery.matches);
    header.classList.toggle("menu-open", shouldOpen);
    document.documentElement.classList.toggle("mobile-nav-open", shouldOpen);
    button.setAttribute("aria-expanded", String(shouldOpen));
    button.setAttribute("aria-label", shouldOpen ? "Fermer le menu" : "Ouvrir le menu");
  };

  button.addEventListener("click", () => setOpen(!header.classList.contains("menu-open")));
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("click", (event) => {
    if (!header.classList.contains("menu-open") || header.contains(event.target)) return;
    setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  mobileQuery.addEventListener?.("change", () => setOpen(false));
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

function getContactRecipient() {
  return CONTACT_RECIPIENT_CODES.map((code) => String.fromCharCode(code)).join("");
}

function getContactFallbackUrl(subject = "Message depuis charlesberthou.fr", message = "") {
  return `mailto:${getContactRecipient()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message || "Bonjour,\n\n")}`;
}

function getContactReturnUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("contact", "envoye");
  return url.toString();
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

function contactFormTemplate(context = "Site") {
  const currentUrl = window.location.href;
  return `
    <form class="site-contact-form" action="${escapeAttribute(CONTACT_ENDPOINT)}" method="POST" accept-charset="UTF-8" data-contact-form data-contact-context="${escapeAttribute(context)}">
      <label class="contact-field">
        Nom
        <input type="text" name="name" placeholder="Votre nom" autocomplete="name" required />
      </label>
      <label class="contact-field">
        Email
        <input type="email" name="email" placeholder="vous@exemple.fr" autocomplete="email" required />
      </label>
      <label class="contact-field">
        Message
        <textarea name="message" rows="8" placeholder="Votre message" required></textarea>
      </label>
      <input type="hidden" name="access_key" value="${escapeAttribute(CONTACT_ACCESS_KEY)}" />
      <input class="contact-honey" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <input type="hidden" name="subject" value="[charlesberthou.fr] Nouveau message" data-contact-subject />
      <input type="hidden" name="from_name" value="charlesberthou.fr" />
      <input type="hidden" name="replyto" value="" data-contact-replyto />
      <input type="hidden" name="redirect" value="${escapeAttribute(getContactReturnUrl())}" data-contact-next />
      <input type="hidden" name="form_url" value="${escapeAttribute(currentUrl)}" data-contact-url />
      <input type="hidden" name="page" value="${escapeAttribute(currentUrl)}" data-contact-page />
      <input type="hidden" name="contexte" value="${escapeAttribute(context)}" />
      <button class="button" type="submit">Envoyer le message</button>
      <p class="contact-form-status" data-contact-status role="status" aria-live="polite">Les données transmises servent uniquement à vous répondre.</p>
    </form>
  `;
}

function hydrateContactForms() {
  document.querySelectorAll("[data-contact-form-mount]").forEach((mount) => {
    if (mount.querySelector("[data-contact-form]")) return;
    mount.innerHTML = contactFormTemplate(mount.dataset.contactContext || document.title);
  });

  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";
    form.addEventListener("submit", submitContactForm);
    form.addEventListener("input", resetContactFormState);
  });

  if (new URLSearchParams(window.location.search).get("contact") === "envoye") {
    document.querySelectorAll("[data-contact-status]").forEach((status) => {
      status.textContent = "Merci, le message a bien été transmis.";
    });
  }
}

function submitContactForm(event) {
  const form = event.currentTarget;
  const status = form.querySelector("[data-contact-status]");
  const button = form.querySelector("button[type='submit']");
  const initialButtonText = button.dataset.defaultText || button.textContent;
  const data = new FormData(form);
  const replyTo = data.get("email") || "";
  const fullSubject = "[charlesberthou.fr] Message depuis le site";
  const pageUrl = window.location.href;

  if (form.dataset.submitting === "true") {
    event.preventDefault();
    return;
  }

  form.querySelector("[data-contact-subject]").value = fullSubject;
  form.querySelector("[data-contact-replyto]").value = replyTo;
  form.querySelector("[data-contact-next]").value = getContactReturnUrl();
  form.querySelector("[data-contact-url]").value = pageUrl;
  form.querySelector("[data-contact-page]").value = pageUrl;

  form.classList.remove("is-sent", "has-error");
  form.classList.add("is-loading");
  button.disabled = true;
  button.dataset.defaultText = initialButtonText;
  button.textContent = "Envoi en cours...";
  status.textContent = "Envoi en cours...";

  if (navigator.onLine === false) {
    event.preventDefault();
    const fallbackUrl = getContactFallbackUrl(fullSubject, data.get("message"));
    form.classList.remove("is-loading");
    form.classList.add("has-error");
    status.innerHTML = `L'envoi automatique n'a pas abouti. <a href="${escapeAttribute(fallbackUrl)}">Ouvrir un email prérempli</a>.`;
    button.disabled = false;
    button.textContent = initialButtonText;
    return;
  }

  form.dataset.submitting = "true";
}

function resetContactFormState(event) {
  const form = event.currentTarget;
  if (!form.classList.contains("is-sent") && !form.classList.contains("has-error")) return;
  const status = form.querySelector("[data-contact-status]");
  const button = form.querySelector("button[type='submit']");
  form.classList.remove("is-sent", "has-error");
  if (button) {
    button.disabled = false;
    button.textContent = button.dataset.defaultText || "Envoyer le message";
  }
  if (status) status.textContent = "Les données transmises servent uniquement à vous répondre.";
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
  hydrateContactForms();
});
