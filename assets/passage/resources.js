/* Amélioration progressive : la lecture et les panneaux fonctionnent sans JS. */
(() => {
  'use strict';

  function openLinkedResource() {
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);
    const entry = target?.closest('.resource-entry');
    if (entry) {
      const details = entry.querySelector('details');
      if (details && !details.open) {
        details.open = true;
        if (target !== entry) target.scrollIntoView({ block: 'start' });
      }
    }
  }

  openLinkedResource();
  window.addEventListener('hashchange', openLinkedResource);

  if (!navigator.clipboard?.writeText) return;

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const prompt = document.getElementById(button.dataset.copy);
      const feedback = button.closest('.resource-prompt').querySelector('.copy-feedback');
      if (!prompt || !feedback) return;
      button.disabled = true;
      feedback.textContent = '';
      try {
        await navigator.clipboard.writeText(prompt.textContent);
        feedback.textContent = 'Prompt copié';
      } catch {
        feedback.textContent = 'La copie automatique est indisponible. Sélectionnez le texte du prompt pour le copier.';
      } finally {
        button.disabled = false;
      }
    });
  });
})();
