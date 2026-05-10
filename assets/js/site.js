const BLOG_DATA_URL = "/data/blog.json";

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

function renderTags(tags) {
  return tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
}

function articleCard(post, heading = "h3") {
  return `
    <a class="article-card" href="${post.url}">
      <div>
        <p class="meta">${formatPostDate(post.date)} · ${post.readingTime}</p>
        <${heading}>${post.title}</${heading}>
        <p>${post.description}</p>
        <div class="tag-row">${renderTags(post.tags)}</div>
      </div>
      <span class="text-link">Lire</span>
    </a>
  `;
}

function homeBlogShowcase(posts) {
  const [featured, ...secondary] = posts.slice(0, 3);
  if (!featured) return "";

  return `
    <a class="blog-feature" href="${featured.url}">
      <div>
        <p class="meta">${formatPostDate(featured.date)} · ${featured.readingTime}</p>
        <h3>${featured.title}</h3>
        <p>${featured.description}</p>
        <div class="tag-row">${renderTags(featured.tags)}</div>
      </div>
      <span class="text-link">Lire l'article</span>
    </a>
    <div class="blog-side-list">
      ${secondary.map((post) => `
        <a class="article-card compact" href="${post.url}">
          <div>
            <p class="meta">${formatPostDate(post.date)} · ${post.readingTime}</p>
            <h3>${post.title}</h3>
            <p>${post.description}</p>
          </div>
          <span class="text-link">Lire</span>
        </a>
      `).join("")}
    </div>
  `;
}

function blogDirectory(posts) {
  const [featured, ...secondary] = posts;
  if (!featured) return "";

  return `
    <div class="blog-showcase blog-directory">
      <a class="blog-feature" href="${featured.url}">
        <div>
          <p class="meta">${formatPostDate(featured.date)} · ${featured.readingTime}</p>
          <h2>${featured.title}</h2>
          <p>${featured.description}</p>
          <div class="tag-row">${renderTags(featured.tags)}</div>
        </div>
        <span class="text-link">Lire l'article</span>
      </a>
      <div class="blog-side-list">
        ${secondary.map((post) => `
          <a class="article-card compact" href="${post.url}">
            <div>
              <p class="meta">${formatPostDate(post.date)} · ${post.readingTime}</p>
              <h2>${post.title}</h2>
              <p>${post.description}</p>
              <div class="tag-row">${renderTags(post.tags)}</div>
            </div>
            <span class="text-link">Lire</span>
          </a>
        `).join("")}
      </div>
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

function hydrateShareButtons() {
  document.querySelectorAll("[data-share]").forEach((button) => {
    const shareRoot = button.closest("[data-share-root]") || document;
    const url = shareRoot.dataset.shareUrl || window.location.href;
    const title = shareRoot.dataset.shareTitle || document.title;
    const service = button.dataset.share;

    if (service === "copy") {
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch (error) {
          const helper = document.createElement("textarea");
          helper.value = url;
          document.body.appendChild(helper);
          helper.select();
          document.execCommand("copy");
          helper.remove();
        }
        button.classList.add("copied");
        button.setAttribute("aria-label", "Lien copié");
        setTimeout(() => button.classList.remove("copied"), 1600);
      });
      return;
    }

    const href = shareUrl(service, url, title);
    if (href && button.tagName === "A") {
      button.href = href;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ensureIconSprite();
  renderBlogAreas();
  hydrateShareButtons();
});
