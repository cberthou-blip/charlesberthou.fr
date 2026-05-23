const BLOG_DATA_URL = "/data/blog.json";
const ANALYTICS_ID = "G-JH2SZFYEHR";
const ANALYTICS_CONSENT_KEY = "cb-analytics-consent";
const CONTACT_ENDPOINT = "https://api.web3forms.com/submit";
const CONTACT_ACCESS_KEY = "17656ba1-b511-4eed-b0b7-a34bc7716102";
const CONTACT_RECIPIENT_CODES = [99, 98, 101, 114, 116, 104, 111, 117, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109];

function ensureIconSprite() {
  if (document.querySelector(".icon-sprite")) return;
  document.body.insertAdjacentHTML("afterbegin", `
    <svg class="icon-sprite" aria-hidden="true">
      <symbol id="icon-blog" viewBox="0 0 24 24">
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M14 4v4h4" />
        <path d="M9 11h6M9 15h6M9 18h4" />
      </symbol>
      <symbol id="icon-tools" viewBox="0 0 24 24">
        <path d="M12 3l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z" />
      </symbol>
      <symbol id="icon-share" viewBox="0 0 24 24">
        <circle cx="7" cy="12" r="2.5" />
        <circle cx="17" cy="6" r="2.5" />
        <circle cx="17" cy="18" r="2.5" />
        <path d="M9.2 10.8l5.6-3.4M9.2 13.2l5.6 3.4" />
      </symbol>
      <symbol id="icon-shield" viewBox="0 0 24 24">
        <path d="M12 3l7 3v5c0 4.7-2.9 7.9-7 10-4.1-2.1-7-5.3-7-10V6z" />
        <path d="M9 12l2 2 4-4" />
      </symbol>
      <symbol id="icon-chart" viewBox="0 0 24 24">
        <path d="M4 19h16" />
        <path d="M7 16v-5M12 16V7M17 16v-8" />
      </symbol>
      <symbol id="icon-prompt" viewBox="0 0 24 24">
        <path d="M5 6h14v12H5z" />
        <path d="M8 10l2 2-2 2M12 14h4" />
      </symbol>
      <symbol id="icon-learning" viewBox="0 0 24 24">
        <path d="M4 7l8-4 8 4-8 4z" />
        <path d="M7 10v5c0 1.6 2.2 3 5 3s5-1.4 5-3v-5" />
      </symbol>
      <symbol id="icon-contact" viewBox="0 0 24 24">
        <path d="M4 6h16v12H4z" />
        <path d="M4 7l8 6 8-6" />
      </symbol>
      <symbol id="icon-arrow-up" viewBox="0 0 24 24">
        <path d="M12 19V5" />
        <path d="M6 11l6-6 6 6" />
      </symbol>
    </svg>
  `);
}

function formatPostDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function isLongformPost(post) {
  return post.format === "longform";
}

function postFormatLabel(post) {
  return isLongformPost(post) ? "Analyse longue" : "Guide pratique";
}

function postMeta(post) {
  return `${postFormatLabel(post)} · ${formatPostDate(post.date)} · ${post.readingTime}`;
}

function postCta(post) {
  return isLongformPost(post) ? "Lire l'analyse" : "Lire le guide";
}

function renderTags(tags) {
  return tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
}

function articleCard(post, heading = "h3", extraClass = "") {
  const formatClass = isLongformPost(post) ? "format-longform" : "format-guide";
  const classes = ["article-card", formatClass, extraClass].filter(Boolean).join(" ");

  return `
    <a class="${classes}" href="${post.url}">
      <div>
        <p class="meta">${postMeta(post)}</p>
        <${heading}>${post.title}</${heading}>
        <p>${post.description}</p>
        <div class="tag-row">${renderTags(post.tags)}</div>
      </div>
      <span class="text-link">${postCta(post)}</span>
    </a>
  `;
}

function homeSideArticleCard(post) {
  const formatClass = isLongformPost(post) ? "format-longform" : "format-guide";
  const metaLabel = isLongformPost(post) ? "Article" : postFormatLabel(post);
  const cta = isLongformPost(post) ? "Lire l'article" : postCta(post);

  return `
    <a class="article-card ${formatClass} compact" href="${post.url}">
      <div>
        <p class="meta">${metaLabel} · ${formatPostDate(post.date)} · ${post.readingTime}</p>
        <h3>${post.title}</h3>
        <p>${post.description}</p>
      </div>
      <span class="text-link">${cta}</span>
    </a>
  `;
}

function homeBlogShowcase(posts) {
  const longformPosts = posts.filter(isLongformPost);
  const featured = longformPosts[0] || posts[0];
  const secondary = longformPosts.filter((post) => post !== featured).slice(0, 2);
  const fallback = posts.filter((post) => post !== featured).slice(0, 2);
  if (!featured) return "";

  return `
    <a class="blog-feature ${isLongformPost(featured) ? "format-longform" : "format-guide"}" href="${featured.url}">
      <div>
        <p class="meta">${postMeta(featured)}</p>
        <h3>${featured.title}</h3>
        <p>${featured.description}</p>
        <div class="tag-row">${renderTags(featured.tags)}</div>
      </div>
      <span class="text-link">${postCta(featured)}</span>
    </a>
    <div class="blog-side-list">
      ${(secondary.length ? secondary : fallback).map((post) => homeSideArticleCard(post)).join("")}
    </div>
  `;
}

function blogDirectory(posts) {
  const longformPosts = posts.filter(isLongformPost);
  const guidePosts = posts.filter((post) => !isLongformPost(post));
  const [latestLongform, ...otherLongformPosts] = longformPosts;

  return `
    <div class="blog-directory-split article-index">
      ${latestLongform ? `
        <section class="blog-directory-group longform-group" aria-labelledby="analyses-longues">
          <div class="blog-directory-heading">
            <h3 id="analyses-longues">Analyses longues</h3>
            <p>Des textes de recul, plus personnels, pour lire l'IA comme un mouvement économique, culturel et humain.</p>
          </div>
          <div class="blog-showcase blog-directory longform-showcase">
            <a class="blog-feature format-longform latest-analysis" href="${latestLongform.url}">
              <div>
                <p class="meta">Dernière analyse publiée · ${formatPostDate(latestLongform.date)} · ${latestLongform.readingTime}</p>
                <h2>${latestLongform.title}</h2>
                <p>${latestLongform.description}</p>
                <div class="tag-row">${renderTags(latestLongform.tags)}</div>
              </div>
              <span class="text-link">${postCta(latestLongform)}</span>
            </a>
            ${otherLongformPosts.length ? `
              <div class="blog-side-list">
                ${otherLongformPosts.map((post) => articleCard(post, "h3", "compact")).join("")}
              </div>
            ` : ""}
          </div>
        </section>
      ` : ""}
      ${guidePosts.length ? `
        <section class="blog-directory-group guide-group" aria-labelledby="guides-pratiques">
          <div class="blog-directory-heading">
            <h3 id="guides-pratiques">Guides pratiques</h3>
            <p>Des formats plus ciblés pour répondre vite à une question de méthode, de gouvernance ou de pilotage.</p>
          </div>
          <div class="article-grid guide-grid">
            ${guidePosts.map((post) => articleCard(post, "h3", "index-card")).join("")}
          </div>
        </section>
      ` : ""}
    </div>
  `;
}

async function loadBlogData() {
  const response = await fetch(BLOG_DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Impossible de charger ${BLOG_DATA_URL}`);
  }
  const data = await response.json();
  return data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function renderBlogAreas() {
  const homeTarget = document.querySelector("[data-home-posts]");
  const blogTarget = document.querySelector("[data-blog-list]");
  if (!homeTarget && !blogTarget) return;

  try {
    const posts = await loadBlogData();
    if (homeTarget) {
      homeTarget.innerHTML = homeBlogShowcase(posts);
    }
    if (blogTarget) {
      blogTarget.innerHTML = blogDirectory(posts);
    }
  } catch (error) {
    // Keep the static article cards already present in the page.
    return;
  }
}

function shareUrl(service, url, title) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const urls = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    mail: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
  };
  return urls[service];
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // Fall back to the hidden textarea method below.
    }
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.inset = "0 auto auto 0";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.focus();
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();
  if (!copied) {
    throw new Error("La copie du lien a échoué.");
  }
}

function setShareStatus(shareRoot, message) {
  const status = shareRoot.querySelector?.("[data-share-status]");
  if (status) status.textContent = message;
}

function revealShareUrl(shareRoot, url) {
  let field = shareRoot.querySelector?.("[data-share-copy-field]");
  if (!field) {
    field = document.createElement("input");
    field.className = "share-copy-field";
    field.type = "text";
    field.readOnly = true;
    field.setAttribute("data-share-copy-field", "");
    field.setAttribute("aria-label", "Lien à copier");
    shareRoot.appendChild(field);
  }

  field.value = url;
  field.hidden = false;
  field.focus();
  field.select();
}

function hydrateShareButtons() {
  document.querySelectorAll("[data-share]").forEach((button) => {
    const shareRoot = button.closest("[data-share-root]") || document;
    const shareData = shareRoot.dataset || {};
    const url = shareData.shareUrl || window.location.href;
    const title = shareData.shareTitle || document.title;
    const service = button.dataset.share;

    if (service === "copy") {
      button.addEventListener("click", async () => {
        const initialText = button.dataset.defaultText || button.textContent;
        button.dataset.defaultText = initialText;
        button.disabled = true;
        let shouldClearStatus = true;
        try {
          await copyTextToClipboard(url);
          button.classList.add("copied");
          button.textContent = "Copié";
          button.setAttribute("aria-label", "Lien copié");
          setShareStatus(shareRoot, "Lien copié.");
          shareRoot.querySelector?.("[data-share-copy-field]")?.setAttribute("hidden", "");
        } catch (error) {
          button.classList.add("copy-error");
          button.textContent = "Lien affiché";
          revealShareUrl(shareRoot, url);
          setShareStatus(shareRoot, "Copie bloquée par le navigateur. Le lien est sélectionné ci-dessous.");
          shouldClearStatus = false;
        } finally {
          setTimeout(() => {
            button.disabled = false;
            button.classList.remove("copied", "copy-error");
            button.textContent = button.dataset.defaultText || initialText;
            button.setAttribute("aria-label", "Copier le lien");
            if (shouldClearStatus) setShareStatus(shareRoot, "");
          }, shouldClearStatus ? 1800 : 2600);
        }
      });
      return;
    }

    const href = shareUrl(service, url, title);
    if (href && button.tagName === "A") {
      button.href = href;
    }
  });
}

function enhanceMobileNavigation() {
  const header = document.querySelector(".site-header");
  const nav = header?.querySelector(".main-nav");
  const navBar = header?.querySelector(".nav-bar");
  if (!header || !nav || !navBar || header.querySelector(".menu-toggle")) return;

  const navId = nav.id || "navigation-principale";
  nav.id = navId;

  const button = document.createElement("button");
  button.className = "menu-toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Ouvrir le menu");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", navId);
  button.innerHTML = "<span></span><span></span><span></span>";
  navBar.insertBefore(button, nav);
  document.body.classList.add("nav-enhanced");

  const setOpen = (isOpen) => {
    header.classList.toggle("menu-open", isOpen);
    document.body.classList.toggle("nav-open", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
  };

  button.addEventListener("click", () => {
    setOpen(!header.classList.contains("menu-open"));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (!header.classList.contains("menu-open")) return;
    if (!header.contains(event.target)) setOpen(false);
  });
}

function hydrateHomeContactForm() {
  const toggle = document.querySelector("[data-contact-form-toggle]");
  const form = document.querySelector("[data-home-contact-form]");
  const panel = document.querySelector("[data-contact-panel]");
  if (!toggle || !form) return;

  toggle.addEventListener("click", () => {
    const willOpen = form.hasAttribute("hidden");
    form.toggleAttribute("hidden", !willOpen);
    panel?.classList.toggle("is-form-open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) {
      form.querySelector("input, textarea")?.focus();
    }
  });

}

function getContactEndpoint() {
  return CONTACT_ENDPOINT;
}

function getContactRecipient() {
  return CONTACT_RECIPIENT_CODES.map((code) => String.fromCharCode(code)).join("");
}

function getContactFallbackUrl(subject = "Message depuis charlesberthou.fr", message = "") {
  const body = message || "Bonjour,\n\n";
  return `mailto:${getContactRecipient()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function getContactReturnUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("contact", "envoye");
  if (document.querySelector("#contact")) {
    url.hash = "contact";
  }
  return url.toString();
}

function contactFormTemplate(context = "Site") {
  const currentUrl = window.location.href;

  return `
    <form class="site-contact-form" action="${escapeAttribute(getContactEndpoint())}" method="POST" accept-charset="UTF-8" data-contact-form data-contact-context="${escapeAttribute(context)}">
      <label class="contact-field">
        Nom
        <input type="text" name="name" placeholder="Votre nom" autocomplete="name" required />
      </label>
      <label class="contact-field">
        Email
        <input type="email" name="email" placeholder="vous@exemple.fr" autocomplete="email" required />
      </label>
      <label class="contact-field contact-field-wide">
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
      <p class="contact-form-status" data-contact-status role="status" aria-live="polite">Votre message sera envoyé depuis ce formulaire. Les données transmises servent uniquement à vous répondre.</p>
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

async function submitContactForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = form.querySelector("[data-contact-status]");
  const button = form.querySelector("button[type='submit']");
  const initialButtonText = button.dataset.defaultText || button.textContent;
  const data = new FormData(form);
  const subject = data.get("sujet") || "Message depuis charlesberthou.fr";
  const replyTo = data.get("email") || "";
  const pageUrl = window.location.href;
  const fullSubject = `[charlesberthou.fr] ${subject}`;

  form.action = getContactEndpoint();
  form.querySelector("[data-contact-subject]").value = fullSubject;
  form.querySelector("[data-contact-replyto]").value = replyTo;
  form.querySelector("[data-contact-next]").value = getContactReturnUrl();
  form.querySelector("[data-contact-url]").value = pageUrl;
  form.querySelector("[data-contact-page]").value = pageUrl;

  data.set("subject", fullSubject);
  data.set("replyto", replyTo);
  data.set("redirect", getContactReturnUrl());
  data.set("form_url", pageUrl);
  data.set("page", pageUrl);

  form.classList.remove("is-sent", "has-error");
  form.classList.add("is-loading");
  button.disabled = true;
  button.dataset.defaultText = initialButtonText;
  status.textContent = "Envoi en cours...";

  try {
    const response = await fetch(getContactEndpoint(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(Object.fromEntries(data))
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "L'envoi n'a pas abouti.");
    }

    form.classList.add("is-sent");
    button.textContent = "Message envoyé";
    button.disabled = true;
    status.textContent = "Merci, le message a bien été transmis.";
  } catch (error) {
    const fallbackUrl = getContactFallbackUrl(fullSubject, data.get("message"));
    form.classList.add("has-error");
    status.innerHTML = `L'envoi automatique n'a pas abouti. <a href="${escapeAttribute(fallbackUrl)}">Ouvrir un email prérempli</a>.`;
    button.disabled = false;
  } finally {
    form.classList.remove("is-loading");
  }
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
  if (status) {
    status.textContent = "Votre message sera envoyé depuis ce formulaire. Les données transmises servent uniquement à vous répondre.";
  }
}

function hydrateAnalyticsConsent() {
  if (!ANALYTICS_ID) return;

  let storedChoice = null;
  try {
    storedChoice = localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch (error) {
    return;
  }
  if (storedChoice === "accepted") {
    loadAnalytics();
    return;
  }
  if (storedChoice === "rejected" || document.querySelector("[data-analytics-consent]")) return;

  const banner = document.createElement("section");
  banner.className = "privacy-consent";
  banner.setAttribute("data-analytics-consent", "");
  banner.setAttribute("aria-label", "Préférences de mesure d'audience");
  banner.innerHTML = `
    <div>
      <strong>Mesure d'audience</strong>
      <p>Le site peut utiliser une mesure d'audience pour comprendre les pages consultées et améliorer les contenus. Vous pouvez refuser sans perdre de fonctionnalité.</p>
    </div>
    <div class="privacy-consent-actions">
      <button class="button secondary" type="button" data-analytics-choice="rejected">Refuser</button>
      <button class="button" type="button" data-analytics-choice="accepted">Autoriser</button>
    </div>
  `;
  document.body.appendChild(banner);

  banner.querySelectorAll("[data-analytics-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.analyticsChoice;
      try {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, choice);
      } catch (error) {
        // Consent cannot be persisted; apply only for the current page view.
      }
      banner.remove();
      if (choice === "accepted") loadAnalytics();
    });
  });
}

function loadAnalytics() {
  if (window.__cbAnalyticsLoaded) return;
  window.__cbAnalyticsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(){ window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", ANALYTICS_ID, { anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ANALYTICS_ID)}`;
  document.head.appendChild(script);
}

function hydrateBackToTop() {
  if (document.querySelector("[data-back-to-top]")) return;

  const button = document.createElement("button");
  button.className = "back-to-top";
  button.type = "button";
  button.setAttribute("data-back-to-top", "");
  button.setAttribute("aria-label", "Remonter en haut de la page");
  button.innerHTML = `<svg aria-hidden="true"><use href="#icon-arrow-up"></use></svg>`;
  document.body.appendChild(button);

  const mobileQuery = window.matchMedia("(max-width: 719px)");
  const updateVisibility = () => {
    const shouldShow = mobileQuery.matches && window.scrollY > 520;
    button.classList.toggle("is-visible", shouldShow);
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", updateVisibility, { passive: true });
  mobileQuery.addEventListener?.("change", updateVisibility);
  updateVisibility();
}

function hydrateToolSwitcher() {
  const main = document.querySelector("main.tool-page");
  const hero = main?.querySelector(".tool-hero, .case-action-hero");
  if (!main || !hero || main.querySelector(".tool-switcher")) return;

  const tools = [
    { href: "/outils-ia/", label: "Tous les outils" },
    { href: "/outils-ia/maturite-ia/", label: "Maturit\u00e9 IA" },
    { href: "/outils-ia/cas-usage/", label: "Cas d'usage" },
    { href: "/outils-ia/roi-ia/", label: "ROI IA" },
    { href: "/outils-ia/registre-ia/", label: "Registre IA" },
  ];
  const currentPath = `${window.location.pathname.replace(/\/index\.html$/, "/").replace(/\/?$/, "/")}`;

  const switcher = document.createElement("nav");
  switcher.className = "tool-switcher";
  switcher.setAttribute("aria-label", "Acc\u00e8s rapide aux outils IA");
  switcher.innerHTML = `
    <div class="container tool-switcher-inner">
      <span>Navigation outils</span>
      <div>
        ${tools.map((tool) => {
          const isCurrent = currentPath === tool.href;
          return `<a href="${tool.href}" ${isCurrent ? 'aria-current="page"' : ""}>${tool.label}</a>`;
        }).join("")}
      </div>
    </div>
  `;
  hero.insertAdjacentElement("afterend", switcher);
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

document.addEventListener("DOMContentLoaded", () => {
  ensureIconSprite();
  enhanceMobileNavigation();
  hydrateBackToTop();
  hydrateToolSwitcher();
  renderBlogAreas();
  hydrateShareButtons();
  hydrateContactForms();
  hydrateHomeContactForm();
  hydrateAnalyticsConsent();
});
