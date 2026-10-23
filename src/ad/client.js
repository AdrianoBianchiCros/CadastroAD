const { Client } = require('ldapts');
const { config } = require('../config');
const { sidBytesToHexString, sidBytesToSddl } = require('./sid');
const mockAd = require('../mock/mockAd');

// Mesmos atributos carregados pelo AD.cs original (SyncUsuarios + DisableUsers),
// unificados em uma unica lista.
const USER_ATTRIBUTES = [
  'objectSid', 'sAMAccountName', 'distinguishedName', 'CN', 'description',
  'displayName', 'givenName', 'physicalDeliveryOfficeName', 'SN',
  'userAccountControl', 'userPrincipalName', 'mail', 'c', 'company',
  'department', 'homephone', 'l', 'location', 'manager', 'mobile',
  'postalCode', 'st', 'streetAddress', 'telephoneNumber', 'initials',
  'employeeID', 'division', 'middleName', 'otherMobile', 'title',
  'whenCreated', 'whenChanged', 'usergroup', 'otherTelephone', 'wWWHomePage',
  'co', 'extensionAttribute1', 'extensionAttribute2', 'extensionAttribute3',
  'extensionAttribute4', 'extensionAttribute5', 'extensionAttribute6',
  'employeeNumber', 'employeeType', 'accountExpires',
  'lastLogon', 'pager', 'memberOf',
];

const GROUP_ATTRIBUTES = [
  'objectSid', 'sAMAccountName', 'distinguishedName', 'mail',
  'whenCreated', 'whenChanged', 'memberOf',
];

function firstValue(entry, attr) {
  const v = entry[attr];
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.length > 0 ? String(v[0]) : '';
  return String(v);
}

function allValues(entry, attr) {
  const v = entry[attr];
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v.map(String) : [String(v)];
}

function objectSidOf(entry) {
  const raw = entry.objectSid;
  if (!raw || (Array.isArray(raw) && raw.length === 0)) return null;
  const single = Array.isArray(raw) ? raw[0] : raw;
  const buf = Buffer.isBuffer(single) ? single : Buffer.from(single);
  return { hex: sidBytesToHexString(buf), sddl: sidBytesToSddl(buf) };
}

function mapUserEntry(entry) {
  const sid = objectSidOf(entry);
  const dn = firstValue(entry, 'distinguishedName');

  return {
    sAMAccountName: firstValue(entry, 'sAMAccountName'),
    SID: sid ? sid.hex : '',
    SDDL: sid ? sid.sddl : '',
    domain: extractDomain(dn),
    CN: firstValue(entry, 'CN'),
    description: firstValue(entry, 'description'),
    displayName: firstValue(entry, 'displayName'),
    DN: dn,
    givenName: firstValue(entry, 'givenName'),
    physicalDeliveryOfficeName: firstValue(entry, 'physicalDeliveryOfficeName'),
    SN: firstValue(entry, 'SN'),
    userAccountControl: firstValue(entry, 'userAccountControl'),
    userPrincipalName: firstValue(entry, 'userPrincipalName'),
    mail: firstValue(entry, 'mail'),
    c: firstValue(entry, 'c'),
    company: firstValue(entry, 'company'),
    department: firstValue(entry, 'department'),
    homephone: firstValue(entry, 'homephone'),
    l: firstValue(entry, 'l'),
    location: firstValue(entry, 'location'),
    manager: firstValue(entry, 'manager'),
    mobile: firstValue(entry, 'mobile'),
    postalCode: firstValue(entry, 'postalCode'),
    st: firstValue(entry, 'st'),
    streetAddress: firstValue(entry, 'streetAddress'),
    telephoneNumber: firstValue(entry, 'telephoneNumber'),
    initials: firstValue(entry, 'initials'),
    employeeID: firstValue(entry, 'employeeID'),
    division: firstValue(entry, 'division'),
    middleName: firstValue(entry, 'middleName'),
    otherMobile: firstValue(entry, 'otherMobile'),
    title: firstValue(entry, 'title'),
    whenCreated: parseAdDate(firstValue(entry, 'whenCreated')),
    whenChanged: parseAdDate(firstValue(entry, 'whenChanged')),
    usergroup: firstValue(entry, 'usergroup'),
    otherTelephone: firstValue(entry, 'otherTelephone'),
    wWWHomePage: firstValue(entry, 'wWWHomePage'),
    co: firstValue(entry, 'co'),
    extensionAttribute1: firstValue(entry, 'extensionAttribute1'),
    extensionAttribute2: firstValue(entry, 'extensionAttribute2'),
    extensionAttribute3: firstValue(entry, 'extensionAttribute3'),
    extensionAttribute4: firstValue(entry, 'extensionAttribute4'),
    extensionAttribute5: firstValue(entry, 'extensionAttribute5'),
    extensionAttribute6: firstValue(entry, 'extensionAttribute6'),
    employeeNumber: firstValue(entry, 'employeeNumber'),
    employeeType: firstValue(entry, 'employeeType'),
    accountExpires: firstValue(entry, 'accountExpires'),
    // Foto e binaria (ate dezenas de KB) e a coluna e varchar(500): gravar o
    // conteudo estourava o limite ("String or binary data would be truncated")
    // e, lida como texto, ja chegava corrompida. Mantida vazia.
    thumbnailPhoto: '',
    lastLogon: firstValue(entry, 'lastLogon'),
    pager: firstValue(entry, 'pager'),
    memberOf: allValues(entry, 'memberOf'),
  };
}

function mapGroupEntry(entry) {
  const sid = objectSidOf(entry);
  return {
    sAMAccountName: firstValue(entry, 'sAMAccountName'),
    SID: sid ? sid.hex : '',
    SDDL: sid ? sid.sddl : '',
    distinguishedName: firstValue(entry, 'distinguishedName'),
    mail: firstValue(entry, 'mail'),
    whenCreated: parseAdDate(firstValue(entry, 'whenCreated')),
    whenChanged: parseAdDate(firstValue(entry, 'whenChanged')),
    memberOf: allValues(entry, 'memberOf'),
  };
}

function parseAdDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

// Porta de AD.cs.GetDomainName: extrai o primeiro componente DC= do DN.
function extractDomain(distinguishedName) {
  const match = /DC=([^,]+)/i.exec(distinguishedName || '');
  return match ? match[1] : '';
}

async function withClient(fn) {
  const client = new Client({ url: config.ad.url });
  try {
    await client.bind(config.ad.bindDN, config.ad.bindPassword);
    return await fn(client);
  } finally {
    await client.unbind().catch(() => {});
  }
}

// client.search com { paged: { pageSize } } ja busca todas as paginas
// internamente (fetchAll=true por padrao na lib ldapts) e devolve todas
// as entradas em searchEntries - nao e necessario controlar cookie aqui.
async function searchAll(client, filter, attributes) {
  const { searchEntries } = await client.search(config.ad.baseDN, {
    scope: 'sub',
    filter,
    attributes,
    paged: { pageSize: 500 },
    // objectSid e binario - sem isso o ldapts devolve os bytes decodificados
    // como UTF-8 (corrompendo o SID) em vez do Buffer original.
    explicitBufferAttributes: ['objectSid'],
  });
  return searchEntries;
}

async function findUsers({ login } = {}) {
  if (config.adMock) return mockAd.findUsers({ login });

  const base = '(&(objectCategory=person)(objectClass=user))';
  const filter = login ? `(&${base.slice(2, -1)}(|(sAMAccountName=${escapeLdap(login)})(userPrincipalName=${escapeLdap(login)}*)))` : base;

  return withClient(async (client) => {
    const entries = await searchAll(client, filter, USER_ATTRIBUTES);
    return entries
      .map(mapUserEntry)
      .filter((u) => !u.sAMAccountName.includes('MSOL_'));
  });
}

async function findDisabledUsers() {
  if (config.adMock) return mockAd.findDisabledUsers();

  const filter = '(&(objectCategory=person)(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=2))';
  return withClient(async (client) => {
    const entries = await searchAll(client, filter, USER_ATTRIBUTES);
    return entries.map(mapUserEntry);
  });
}

async function findGroups() {
  if (config.adMock) return mockAd.findGroups();

  return withClient(async (client) => {
    const entries = await searchAll(client, '(objectClass=group)', GROUP_ATTRIBUTES);
    return entries.map(mapGroupEntry);
  });
}

// Escapa caracteres especiais de filtro LDAP (RFC 4515) no valor informado pelo usuario.
function escapeLdap(value) {
  return String(value).replace(/[\\*()\0]/g, (c) => `\\${c.charCodeAt(0).toString(16).padStart(2, '0')}`);
}

module.exports = { findUsers, findDisabledUsers, findGroups };
