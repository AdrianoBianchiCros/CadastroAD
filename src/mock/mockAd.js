// Dados de exemplo usados quando AD_MOCK=true, para validar o painel e o
// pipeline de sincronizacao sem depender de uma rede corporativa real.

const USERS = [
  {
    sAMAccountName: 'jsilva', SID: 'MOCKSID0001', SDDL: 'S-1-5-21-0000000000-0000000000-0000000000-1001',
    domain: 'Tv1', CN: 'Joao Silva', description: '', displayName: 'Joao Silva',
    DN: 'CN=Joao Silva,OU=TI,DC=Tv1,DC=int', givenName: 'Joao', physicalDeliveryOfficeName: 'Matriz',
    SN: 'Silva', userAccountControl: '512', userPrincipalName: 'jsilva@tv1.com.br', mail: 'jsilva@tv1.com.br',
    c: 'BR', company: 'TV1', department: 'Tecnologia', homephone: '', l: 'Sao Paulo', location: '',
    manager: '', mobile: '', postalCode: '', st: 'SP', streetAddress: '', telephoneNumber: '',
    initials: '', employeeID: '1001', division: '', middleName: '', otherMobile: '', title: 'Analista de TI',
    whenCreated: new Date('2021-01-10'), whenChanged: new Date(), usergroup: '', otherTelephone: '',
    wWWHomePage: '', co: 'Brasil', extensionAttribute1: '', extensionAttribute2: 'CC-100',
    extensionAttribute3: '000.000.000-00', extensionAttribute4: '', extensionAttribute5: '',
    extensionAttribute6: '', employeeNumber: '000123', employeeType: 'CLT', accountExpires: '0',
    thumbnailPhoto: '', lastLogon: '', pager: '',
    memberOf: ['CN=TI,OU=Grupos,DC=Tv1,DC=int'],
  },
  {
    sAMAccountName: 'mferreira', SID: 'MOCKSID0002', SDDL: 'S-1-5-21-0000000000-0000000000-0000000000-1002',
    domain: 'Tv1', CN: 'Maria Ferreira', description: '', displayName: 'Maria Ferreira',
    DN: 'CN=Maria Ferreira,OU=RH,DC=Tv1,DC=int', givenName: 'Maria', physicalDeliveryOfficeName: 'Matriz',
    SN: 'Ferreira', userAccountControl: '512', userPrincipalName: 'mferreira@tv1.com.br', mail: 'mferreira@tv1.com.br',
    c: 'BR', company: 'TV1', department: 'Recursos Humanos', homephone: '', l: 'Sao Paulo', location: '',
    manager: '', mobile: '', postalCode: '', st: 'SP', streetAddress: '', telephoneNumber: '',
    initials: '', employeeID: '1002', division: '', middleName: '', otherMobile: '', title: 'Analista de RH',
    whenCreated: new Date('2020-05-20'), whenChanged: new Date(), usergroup: '', otherTelephone: '',
    wWWHomePage: '', co: 'Brasil', extensionAttribute1: '', extensionAttribute2: 'CC-200',
    extensionAttribute3: '111.111.111-11', extensionAttribute4: '', extensionAttribute5: '',
    extensionAttribute6: '', employeeNumber: '000124', employeeType: 'CLT', accountExpires: '0',
    thumbnailPhoto: '', lastLogon: '', pager: '',
    memberOf: ['CN=RH,OU=Grupos,DC=Tv1,DC=int'],
  },
];

const GROUPS = [
  {
    sAMAccountName: 'TI', SID: 'MOCKSIDG0001', SDDL: 'S-1-5-21-0000000000-0000000000-0000000000-2001',
    distinguishedName: 'CN=TI,OU=Grupos,DC=Tv1,DC=int', mail: '',
    whenCreated: new Date('2019-01-01'), whenChanged: new Date(), memberOf: [],
  },
  {
    sAMAccountName: 'RH', SID: 'MOCKSIDG0002', SDDL: 'S-1-5-21-0000000000-0000000000-0000000000-2002',
    distinguishedName: 'CN=RH,OU=Grupos,DC=Tv1,DC=int', mail: '',
    whenCreated: new Date('2019-01-01'), whenChanged: new Date(), memberOf: [],
  },
];

async function findUsers({ login } = {}) {
  if (!login) return USERS;
  const needle = login.toLowerCase();
  return USERS.filter(
    (u) => u.sAMAccountName.toLowerCase().includes(needle) || u.userPrincipalName.toLowerCase().includes(needle)
  );
}

async function findDisabledUsers() {
  return [];
}

async function findGroups() {
  return GROUPS;
}

module.exports = { findUsers, findDisabledUsers, findGroups };
