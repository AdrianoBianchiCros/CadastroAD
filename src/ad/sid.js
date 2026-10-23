// Porte de ADSync.AD.ConvertSidBytesToString / ConvertSidBytesToSDDL (C#).
// Estrutura binaria do SID: 1 byte de revisao, 1 byte com a contagem de
// sub-autoridades, 6 bytes de autoridade (big-endian), N sub-autoridades
// de 4 bytes cada (little-endian).

function sidBytesToHexString(sidBytes) {
  return Buffer.from(sidBytes)
    .toString('hex')
    .toUpperCase();
}

function sidBytesToSddl(sidBytes) {
  const buf = Buffer.from(sidBytes);

  const revision = buf.readUInt8(0);
  const subAuthorityCount = buf.readUInt8(1);

  let authority = 0n;
  for (let i = 2; i < 8; i++) {
    authority = (authority << 8n) | BigInt(buf.readUInt8(i));
  }

  const subAuthorities = [];
  for (let i = 0; i < subAuthorityCount; i++) {
    const offset = 8 + i * 4;
    subAuthorities.push(buf.readUInt32LE(offset));
  }

  return `S-${revision}-${authority.toString()}${subAuthorities.map((sa) => `-${sa}`).join('')}`;
}

module.exports = { sidBytesToHexString, sidBytesToSddl };
