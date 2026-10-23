-- Tabela nova usada pelo painel web para exibir o historico de execucoes
-- de sincronizacao. As demais tabelas (dcUsuario, dcGrupo,
-- dcUsuariosXGrupos, dcGruposXGrupos, tv1UsuarioPermissao) ja existem no
-- banco GrupoTv1_Seguranca e sao reaproveitadas sem alteracao de schema.
--
-- Se a tabela dcGruposXGrupos ainda nao existir (o C# original nunca
-- chegou a gravar nela), crie-a tambem com o script equivalente abaixo,
-- comentado por seguranca (execute apenas apos confirmar que nao existe).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'dcSyncLog')
BEGIN
    CREATE TABLE dbo.dcSyncLog (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        inicio DATETIME NOT NULL,
        fim DATETIME NULL,
        status VARCHAR(20) NOT NULL,
        mensagem VARCHAR(MAX) NULL,
        detalhes VARCHAR(MAX) NULL
    );
END

-- IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'dcGruposXGrupos')
-- BEGIN
--     CREATE TABLE dbo.dcGruposXGrupos (
--         idGrupo DECIMAL(18,0) NOT NULL,
--         idGrupoMembro DECIMAL(18,0) NOT NULL,
--         CONSTRAINT PK_dcGruposXGrupos PRIMARY KEY (idGrupo, idGrupoMembro)
--     );
-- END
