const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/passage/resources-catalog.js'), 'utf8');

function visit(hash, links) {
  const redirects = [];
  const window = { location: { hash, replace: value => redirects.push(value) }, addEventListener() {} };
  const document = { getElementById: () => links === undefined ? null : { textContent: JSON.stringify(links) } };
  vm.runInNewContext(source, { window, document });
  return redirects;
}

test('les anciennes ancres profondes rejoignent le guide et la même section', () => {
  const target = '/ressources/exemple/#resource-exemple-prompt-1';
  const links = { 'resource-exemple-prompt-1': target };
  assert.deepEqual(visit('#resource-exemple-prompt-1', links), [target]);
  assert.deepEqual(visit('#resource%2Dexemple-prompt-1', links), [target]);
});

test('les ancres de catalogue, inconnues ou mal formées ne redirigent pas', () => {
  const links = { 'resource-exemple-prompt-1': '/ressources/exemple/#resource-exemple-prompt-1' };
  for (const hash of ['', '#resource-exemple', '#astuces', '#choisir-usage', '#%invalid', '#toString']) {
    assert.deepEqual(visit(hash, links), []);
  }
  assert.deepEqual(visit('#resource-exemple'), []);
});

test('le catalogue refuse une destination externe', () => {
  assert.deepEqual(visit('#test', { test: 'https://example.com' }), []);
});

test('la copie d’une astuce conserve la requête sans les guillemets', async () => {
  let clickHandler;
  let copied = '';
  const feedback = { textContent: '' };
  const target = { textContent: '« Prépare un programme simple. »' };
  const button = {
    hidden: true, disabled: false, dataset: { copy: 'exemple-try-text' },
    addEventListener: (_, cb) => { clickHandler = cb; },
    closest: () => ({ querySelector: () => feedback })
  };
  const document = {
    getElementById: id => id === 'resource-guide-links' ? { textContent: '{}' }
      : id === 'exemple-try-text' ? target : null,
    querySelectorAll: () => [button]
  };
  const window = {
    location: { hash: '', replace() {} }, addEventListener() {},
    navigator: { clipboard: { writeText: async value => { copied = value; } } }
  };
  vm.runInNewContext(source, { document, window });
  assert.equal(button.hidden, false);
  await clickHandler();
  assert.equal(copied, 'Prépare un programme simple.');
  assert.match(feedback.textContent, /Requête copiée/);
  assert.equal(button.disabled, false);
});
