# ADSync Web

Reescrita em Node.js + painel web (HTML/CSS/JS puro) do sincronizador
Active Directory -> SQL Server originalmente implementado em C#
(`2_Projeto/Service`, projeto `ADSync`).

Sincroniza usuarios e grupos do dominio `Tv1.int` para o banco SQL Server
`GrupoTv1_Seguranca`, concede permissoes padrao para usuarios novos, e
mantem o status de contas desabilitadas no AD. Inclui um painel web com
login para disparar sincronizacoes manuais e acompanhar o historico.

## ⚠️ Antes de usar em produção

O projeto C# original tinha a senha da conta de serviço do AD
(`tv1\adsync`) e a senha do usuário SQL (`GrupoTv1_Seguranca`) gravadas em
texto plano no código-fonte e no `App.config`, já expostas no histórico do
git. **Rotacione as duas senhas** antes (ou logo depois) de colocar esta
versão em produção, e informe as novas apenas via `.env` (nunca no
código).

## Requisitos

- Node.js 18+
- Rede com acesso LDAP (porta 389/636) ao domínio `Tv1.int`
- Rede com acesso ao SQL Server `srvw-sqlpr01\WEB` (ou onde o banco estiver)

## Instalação

```bash
cd 3_ProjetoWeb
npm install
cp .env.example .env
```

Edite `.env` com as credenciais reais (AD, SQL Server, sessão, admin do
painel). Gere o hash da senha do admin do painel com:

```bash
node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA', 10))"
```

Execute o script `sql/001_create_synclog_table.sql` no banco
`GrupoTv1_Seguranca` para criar a tabela de histórico de execuções
(`dcSyncLog`). As demais tabelas (`dcUsuario`, `dcGrupo`,
`dcUsuariosXGrupos`, `dcGruposXGrupos`, `tv1UsuarioPermissao`) já existem e
são reaproveitadas sem alteração de schema.

## Rodando

```bash
npm start
```

Acesse `http://localhost:3000` (ou a porta definida em `PORT`).

### Modo mock (sem AD/SQL Server reais)

Para validar o painel e o fluxo de sincronização sem precisar estar na
rede corporativa, defina no `.env`:

```
AD_MOCK=true
DB_MOCK=true
```

Nesse modo o backend usa dados de exemplo (`src/mock/mockAd.js`) e um
"banco" em memória (`src/mock/mockDb.js`) que reseta a cada reinício do
processo — útil para demonstração e testes de interface, não substitui a
validação contra o ambiente real.

## Estrutura

```
src/
  server.js            Bootstrap do Express
  config.js             Variaveis de ambiente
  db.js                  Pool de conexao SQL Server (mssql)
  ad/client.js            Busca no AD via LDAP (ldapts)
  ad/sid.js                Conversao de SID binario -> string/SDDL
  services/syncService.js   Logica de sincronizacao (equivalente ao AD.cs)
  repositories/              Acesso a dados (usuario, grupo, permissao, membership, log)
  scheduler.js               Job diario (node-cron), equivalente ao Sync.cs
  auth/, middleware/, routes/  Login e API REST
public/                 Painel web (HTML/CSS/JS puro, sem framework)
sql/                    Scripts de schema
test/                   Testes (node --test)
```

## Diferenças em relação ao C# original

- `insertPermissions` agora é idempotente (não duplica permissões a cada
  execução).
- Nenhuma credencial hardcoded — tudo via `.env`.
- Queries sempre parametrizadas (sem concatenação de string).
- `dcGruposXGrupos` é populado de fato (no C# original o código que faria
  isso estava comentado/nunca rodava).
- Não portado (já estavam inertes no C# atual): escrita de volta no AD
  (`UpdUsuarios`) e envio de e-mail.

## Limitações conhecidas / o que falta validar

Este projeto foi desenvolvido e testado (rotas, login, telas, testes
unitários de conversão de SID) em um ambiente **sem acesso à rede
corporativa da TV1**. Ou seja:

- A integração real com o LDAP do domínio `Tv1.int` e com o SQL Server
  `srvw-sqlpr01\WEB` **não foi exercitada de ponta a ponta** — só o modo
  mock foi validado.
- Antes de ir para produção, rode `npm start` com `AD_MOCK=false` e
  `DB_MOCK=false` dentro da rede da TV1, e confira o histórico de
  execuções no dashboard para validar que os dados batem com os do C#
  atual.
