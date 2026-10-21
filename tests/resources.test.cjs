const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/passage/resources.js'), 'utf8');

function setup(clipboard, hash = '') {
  const feedback = { textContent: '' };
  const summary = { focused: false, focus() { this.focused = true; } };
  const index = { focused: false, scrolled: false, parentElement: null,
    focus() { this.focused = true; }, closest: () => null,
    scrollIntoView() { this.scrolled = true; } };
  const entry = { scrolled: false,
    closest: selector => selector === '.resource-entry' ? entry : null,
    querySelector: selector => selector === 'summary' ? summary : details,
    scrollIntoView() { this.scrolled = true; } };
  const details = { open: false, parentElement: entry, querySelector: () => summary,
    closest: selector => selector === '.resource-entry' ? entry : details };
  const promptBlock = { scrolled: false,
    closest: selector => selector === 'details' ? details : selector === '.resource-entry' ? entry : promptBlock,
    querySelector: selector => selector === '.copy-feedback' ? feedback : promptDetails,
    scrollIntoView() { this.scrolled = true; } };
  const promptDetails = { open: false, parentElement: promptBlock };
  const prompt = { textContent: 'Ligne une\nLigne deux & suite',
    closest: selector => selector === '.resource-entry' ? entry : selector === 'details' ? promptDetails : promptBlock };
  const button = {
    hidden: true, disabled: false, dataset: { copy: 'prompt-text' },
    addEventListener(name, handler) { this[name] = handler; },
    closest: () => promptBlock,
  };
  const close = { hidden: true, closest: () => details,
    addEventListener(name, handler) { this[name] = handler; } };
  const document = {
    getElementById: id => ({ prompt: promptBlock, 'prompt-text': prompt, 'resource-test': entry, 'choisir-usage': index }[id] || null),
    querySelectorAll: selector => selector === '.guide-close' ? [close] : [button],
    addEventListener(name, handler) { this[name] = handler; },
  };
  const window = { location: { hash }, addEventListener(name, handler) { this[name] = handler; } };
  vm.runInNewContext(source, { document, window, navigator: { clipboard } });
  return { button, close, feedback, prompt, details, promptDetails, promptBlock, summary, index, entry, window, document };
}

test('la copie conserve intégralement le prompt et annonce le résultat', async () => {
  let copied;
  const ui = setup({ writeText: async text => { copied = text; } });
  assert.equal(ui.button.hidden, false);
  await ui.button.click();
  assert.equal(copied, ui.prompt.textContent);
  assert.equal(ui.feedback.textContent, 'Prompt copié. Collez-le dans votre conversation.');
  assert.equal(ui.button.disabled, false);
  assert.equal(ui.promptDetails.open, false);
});

test('un refus du presse-papiers conserve le texte et permet de réessayer', async () => {
  const ui = setup({ writeText: async () => { throw new Error('refused'); } });
  const original = ui.prompt.textContent;
  await ui.button.click();
  assert.match(ui.feedback.textContent, /Sélectionnez le texte/);
  assert.equal(ui.prompt.textContent, original);
  assert.equal(ui.button.disabled, false);
  assert.equal(ui.promptDetails.open, true);
});

test('sans API de copie, le lien direct ouvre encore la ressource', () => {
  const ui = setup(undefined, '#resource-test');
  assert.equal(ui.button.hidden, true);
  assert.equal(ui.details.open, true);
  assert.doesNotThrow(() => setup(undefined, '#%not-valid'));
});

test('une ancienne ancre ouvre le guide et le texte, puis rejoint le bloc avec la copie', () => {
  const ui = setup(undefined, '#prompt');
  assert.equal(ui.details.open, true);
  assert.equal(ui.promptDetails.open, true);
  assert.equal(ui.promptBlock.scrolled, true);
});

test('replier en bas rend le focus au résumé et revient au titre, même sans presse-papiers', () => {
  const ui = setup(undefined, '#resource-test');
  assert.equal(ui.close.hidden, false);
  ui.close.click();
  assert.equal(ui.details.open, false);
  assert.equal(ui.summary.focused, true);
  assert.equal(ui.entry.scrolled, true);
});

test('le retour donne le focus au sommaire permanent et une sélection ouvre le guide', () => {
  const ui = setup(undefined, '#choisir-usage');
  assert.equal(ui.index.focused, true);
  assert.equal(ui.index.scrolled, true);
  ui.window.location.hash = '#resource-test';
  ui.window.hashchange();
  assert.equal(ui.details.open, true);
});

test('sélectionner de nouveau la même ancre rouvre un guide replié', () => {
  const ui = setup(undefined, '#resource-test');
  ui.close.click();
  let prevented = false;
  ui.document.click({ target: { closest: () => ({ hash: '#resource-test' }) },
    preventDefault() { prevented = true; } });
  assert.equal(ui.details.open, true);
  assert.equal(prevented, true);
});
