const BLOG_DATA_URL = "/data/blog.json";

function formatPostDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function renderTags(tags) {
  return (tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("");
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
    if (homeTarget) homeTarget.innerHTML = homeBlogShowcase(posts);
    if (blogTarget) blogTarget.innerHTML = blogDirectory(posts);
  } catch (error) {
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
    if (href && button.tagName === "A") button.href = href;
  });
}

function hydrateProfileFilters() {
  const root = document.querySelector("[data-tool-filter-root]");
  if (!root) return;

  const buttons = root.querySelectorAll("[data-profile-filter]");
  const cards = document.querySelectorAll("[data-profiles]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const profile = button.dataset.profileFilter;
      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
      cards.forEach((card) => {
        const values = card.dataset.profiles.split(",").map((value) => value.trim());
        card.dataset.hidden = profile !== "Tous" && !values.includes(profile) ? "true" : "false";
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderBlogAreas();
  hydrateShareButtons();
  hydrateProfileFilters();
});
