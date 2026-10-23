const test = require('node:test');
const assert = require('node:assert');
const { sidBytesToHexString, sidBytesToSddl } = require('../src/ad/sid');

// Vetor de SID conhecido: S-1-5-21-3623811015-3361044348-30300820-1013
const SID_HEX = '010500000000000515000000c7f7fed77c7755c8945ace01f5030000';

test('sidBytesToSddl converte corretamente um SID de usuario de dominio', () => {
  const bytes = Buffer.from(SID_HEX, 'hex');
  const sddl = sidBytesToSddl(bytes);
  assert.strictEqual(sddl, 'S-1-5-21-3623811015-3361044348-30300820-1013');
});

test('sidBytesToHexString retorna a representacao hexadecimal em maiusculas', () => {
  const bytes = Buffer.from(SID_HEX, 'hex');
  const hex = sidBytesToHexString(bytes);
  assert.strictEqual(hex, SID_HEX.toUpperCase());
});
