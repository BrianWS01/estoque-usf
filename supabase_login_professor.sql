-- ==============================================================================
-- LOGIN DO PROFESSOR (avaliação do projeto)
-- Matrícula: PROFESSOR  |  Senha: usfsenha123
-- Rodar no Supabase: SQL Editor > New query > colar tudo > Run
-- Pré-requisito: supabase_schema.sql já executado (tabelas cargos e usuarios)
-- ==============================================================================

-- 1. Extensão para gerar/verificar hash de senha (bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Coluna de senha (guarda só o hash, nunca a senha em texto)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash TEXT;

-- 3. Usuário do professor com perfil ADMIN (acesso a todas as telas)
INSERT INTO usuarios (nome, matricula, email, cargo_id, supervisor_id, setor, papel, senha_hash)
VALUES (
    'Professor (Avaliador)',
    'PROFESSOR',
    'professor@usf.edu.br',
    NULL,
    NULL,
    'Avaliação Acadêmica',
    'ADMIN',
    extensions.crypt('usfsenha123', extensions.gen_salt('bf'))
)
ON CONFLICT (matricula) DO UPDATE
SET senha_hash = EXCLUDED.senha_hash,
    papel      = EXCLUDED.papel,
    ativo      = TRUE;

-- O seed original insere usuários com id fixo; ajusta a sequência para não colidir
SELECT setval(pg_get_serial_sequence('usuarios', 'id'), (SELECT MAX(id) FROM usuarios));

-- 4. Função de login: confere matrícula + senha e devolve o usuário (sem o hash)
--    SECURITY DEFINER: o front-end chama com a chave anon sem precisar ler a tabela
CREATE OR REPLACE FUNCTION login_usuario(p_matricula TEXT, p_senha TEXT)
RETURNS TABLE (
    id INT,
    nome VARCHAR,
    matricula VARCHAR,
    email VARCHAR,
    cargo_id INT,
    supervisor_id INT,
    setor VARCHAR,
    papel papel_usuario
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT u.id, u.nome, u.matricula, u.email, u.cargo_id, u.supervisor_id, u.setor, u.papel
    FROM usuarios u
    WHERE UPPER(u.matricula) = UPPER(TRIM(p_matricula))
      AND u.ativo = TRUE
      AND u.senha_hash IS NOT NULL
      AND u.senha_hash = crypt(p_senha, u.senha_hash);
$$;

REVOKE ALL ON FUNCTION login_usuario(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION login_usuario(TEXT, TEXT) TO anon, authenticated;

-- 5. Teste rápido (deve retornar 1 linha com o professor)
SELECT * FROM login_usuario('professor', 'usfsenha123');
