/* Les anciens liens profonds rejoignent le même contenu dans son guide. */
(() => {
  'use strict';
  const data = document.getElementById('resource-guide-links');
  if (!data) return;
  let links;
  try { links = JSON.parse(data.textContent); } catch { return; }
  function followLegacyLink() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (!Object.prototype.hasOwnProperty.call(links, id)) return;
    const destination = links[id];
    if (typeof destination === 'string' && destination.startsWith('/ressources/')) {
      window.location.replace(destination);
    }
  }
  followLegacyLink();
  window.addEventListener('hashchange', followLegacyLink);
})();

/* Copie progressive des requêtes des astuces. */
(() => {
  'use strict';
  const clipboard = window.navigator?.clipboard;
  if (typeof clipboard?.writeText !== 'function' || typeof document.querySelectorAll !== 'function') return;
  document.querySelectorAll('.resource-try-copy[data-copy]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.dataset.copy);
      const feedback = button.closest('[data-copy-scope]')?.querySelector('.copy-feedback');
      if (!target || !feedback) return;
      const prompt = target.textContent.trim().replace(/^«\s*/, '').replace(/\s*»$/, '');
      button.disabled = true;
      feedback.textContent = '';
      try {
        await clipboard.writeText(prompt);
        feedback.textContent = 'Requête copiée. Collez-la dans votre assistant IA.';
      } catch {
        feedback.textContent = 'Copie indisponible. Sélectionnez le texte ci-dessus pour le copier.';
        target.focus({ preventScroll: true });
      } finally {
        button.disabled = false;
      }
    });
  });
})();

/* Les liens directs ouvrent la rubrique repliée correspondante. */
(() => {
  'use strict';
  if (typeof document.querySelectorAll !== 'function') return;
  function openTargetSection() {
    let hash;
    try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (!hash) return;
    const target = document.getElementById(hash);
    if (!target) return;
    const disclosure = target.closest?.('.resource-topic-disclosure')
      || target.querySelector?.('.resource-topic-disclosure');
    if (!disclosure) return;
    disclosure.open = true;
    if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'start' });
  }
  openTargetSection();
  window.addEventListener('hashchange', openTargetSection);
})();
