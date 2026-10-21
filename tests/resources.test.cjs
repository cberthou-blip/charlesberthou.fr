const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/passage/resources.js'), 'utf8');

function setup(clipboard, hash = '') {
  const feedback = { textContent: '' };
  const prompt = { textContent: 'Ligne une\nLigne deux & suite' };
  const details = { open: false };
  const button = {
    hidden: true, disabled: false, dataset: { copy: 'prompt' },
    addEventListener(name, handler) { this[name] = handler; },
    closest() { return { querySelector: () => feedback }; },
  };
  const entry = { classList: { contains: name => name === 'resource-entry' }, querySelector: () => details };
  const document = {
    getElementById: id => id === 'prompt' ? prompt : id === 'resource-test' ? entry : null,
    querySelectorAll: () => [button],
  };
  const window = { location: { hash }, addEventListener() {} };
  vm.runInNewContext(source, { document, window, navigator: { clipboard } });
  return { button, feedback, prompt, details };
}

test('la copie conserve intégralement le prompt et annonce le résultat', async () => {
  let copied;
  const ui = setup({ writeText: async text => { copied = text; } });
  assert.equal(ui.button.hidden, false);
  await ui.button.click();
  assert.equal(copied, ui.prompt.textContent);
  assert.equal(ui.feedback.textContent, 'Prompt copié');
  assert.equal(ui.button.disabled, false);
});

test('un refus du presse-papiers conserve le texte et permet de réessayer', async () => {
  const ui = setup({ writeText: async () => { throw new Error('refused'); } });
  const original = ui.prompt.textContent;
  await ui.button.click();
  assert.match(ui.feedback.textContent, /Sélectionnez le texte/);
  assert.equal(ui.prompt.textContent, original);
  assert.equal(ui.button.disabled, false);
});

test('sans API de copie, le lien direct ouvre encore la ressource', () => {
  const ui = setup(undefined, '#resource-test');
  assert.equal(ui.button.hidden, true);
  assert.equal(ui.details.open, true);
  assert.doesNotThrow(() => setup(undefined, '#%not-valid'));
});
