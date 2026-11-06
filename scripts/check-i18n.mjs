import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const locales = ['en', 'es', 'pt-BR', 'fr', 'de', 'ja', 'it', 'ko', 'zh-Hans', 'zh-Hant', 'ar', 'hi', 'id', 'tr', 'bg'];
const source = JSON.parse(await readFile('common/src/i18n/messages/en.json', 'utf8'));
const variables = value => [...value.matchAll(/{{\w+}}/g)].map(match => match[0]).sort();
for (const locale of locales) {
  const messages = JSON.parse(await readFile(`common/src/i18n/messages/${locale}.json`, 'utf8'));
  assert.deepEqual(Object.keys(messages).sort(), Object.keys(source).sort(), `${locale}: keys`);
  for (const [key, value] of Object.entries(messages)) {
    assert.ok(typeof value === 'string' && value.trim(), `${locale}: ${key}`);
    assert.deepEqual(variables(value), variables(source[key]), `${locale}: ${key} placeholders`);
  }
  if (locale !== 'en') assert.ok(Object.keys(source).some(key => source[key] !== messages[key]), `${locale}: English clone`);
}
console.log(`Validated ${Object.keys(source).length} product messages in ${locales.length} locales`);
