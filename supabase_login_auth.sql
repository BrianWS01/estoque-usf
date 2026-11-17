-- ==============================================================================
-- LOGIN PELO SUPABASE AUTH (e-mail + senha)
-- 1. Crie o usuário em Authentication > Users (ex.: professorusf@gmail.com)
-- 2. Rode este SQL: ele liga o e-mail a um funcionário da tabela usuarios
--    (é isso que define o perfil: ADMIN, SUPERVISOR ou COLABORADOR)
-- Pré-requisito: supabase_schema.sql já executado
-- ==============================================================================

-- O seed insere usuários com id fixo sem avançar a sequência; ajusta antes do insert
SELECT setval(pg_get_serial_sequence('usuarios', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM usuarios), false);

-- Funcionário do professor, ligado ao e-mail do Auth, com perfil ADMIN
INSERT INTO usuarios (nome, matricula, email, cargo_id, supervisor_id, setor, papel)
VALUES ('Professor (Avaliador)', 'PROFESSOR', 'professorusf@gmail.com', NULL, NULL, 'Avaliação Acadêmica', 'ADMIN')
ON CONFLICT (matricula) DO UPDATE
SET email = EXCLUDED.email,
    papel = EXCLUDED.papel,
    ativo = TRUE;

-- Devolve o funcionário ligado ao e-mail de quem está logado no Supabase Auth
-- SECURITY DEFINER: lê a tabela sem expor os outros usuários
CREATE OR REPLACE FUNCTION meu_perfil()
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
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT u.id, u.nome, u.matricula, u.email, u.cargo_id, u.supervisor_id, u.setor, u.papel
    FROM usuarios u
    WHERE LOWER(u.email) = LOWER(auth.jwt() ->> 'email')
      AND u.ativo = TRUE
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION meu_perfil() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION meu_perfil() TO authenticated;

-- Conferência: deve mostrar o professor com o e-mail e papel ADMIN
SELECT id, nome, matricula, email, papel FROM usuarios WHERE matricula = 'PROFESSOR';
