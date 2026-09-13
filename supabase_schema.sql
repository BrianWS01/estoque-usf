-- ==============================================================================
-- AUTOMAÇÃO INTELIGENTE NO ALMOXARIFADO DE EPIs
-- Script de Criação do Banco de Dados PostgreSQL (Supabase)
-- Versão 1.0 - Projeto Acadêmico
-- ==============================================================================

-- 1. EXTENSÕES & TIPOS ENUM
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE papel_usuario AS ENUM ('COLABORADOR', 'SUPERVISOR', 'ADMIN');
CREATE TYPE status_solicitacao AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- 2. TABELA DE CARGOS
CREATE TABLE IF NOT EXISTS cargos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE USUÁRIOS / FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    cargo_id INT REFERENCES cargos(id) ON DELETE SET NULL,
    supervisor_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    setor VARCHAR(100) NOT NULL,
    papel papel_usuario DEFAULT 'COLABORADOR',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE EPIs
CREATE TABLE IF NOT EXISTS epis (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    ca_numero VARCHAR(50), -- Certificado de Aprovação (Ministério do Trabalho)
    validade_ca DATE,
    intervalo_dias_troca INT NOT NULL DEFAULT 30, -- Periodicidade da regra de troca
    estoque_atual INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 5,
    localizacao VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. MATRIZ CARGO X EPI (REGRAS DE PERMISSÃO)
CREATE TABLE IF NOT EXISTS matriz_cargo_epi (
    id SERIAL PRIMARY KEY,
    cargo_id INT NOT NULL REFERENCES cargos(id) ON DELETE CASCADE,
    epi_id INT NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
    quantidade_maxima INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cargo_id, epi_id)
);

-- 6. TABELA DE MOVIMENTAÇÕES / RETIRADAS
CREATE TABLE IF NOT EXISTS movimentacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    epi_id INT NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
    quantidade INT NOT NULL DEFAULT 1,
    data_retirada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    proxima_troca_prevista DATE NOT NULL,
    responsavel_entrega_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo VARCHAR(50) DEFAULT 'RETIRADA_PADRAO', -- RETIRADA_PADRAO, EXCECAO_APROVADA
    observacao TEXT
);

-- 7. TABELA DE SOLICITAÇÕES DE EXCEÇÃO (RETIRADA ANTECIPADA)
CREATE TABLE IF NOT EXISTS solicitacoes_excecao (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    epi_id INT NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
    quantidade INT NOT NULL DEFAULT 1,
    justificativa TEXT NOT NULL,
    status status_solicitacao DEFAULT 'PENDENTE',
    supervisor_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    resposta_supervisor TEXT,
    data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_resposta TIMESTAMP WITH TIME ZONE
);

-- 8. TABELA DE LOGS DE AUDITORIA (RN-08)
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    detalhes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- TRIGGERS E FUNÇÕES AUTOMÁTICAS
-- ==============================================================================

-- Trigger para atualizar estoque ao registrar movimentação
CREATE OR REPLACE FUNCTION atualizar_estoque_apos_retirada()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE epis
    SET estoque_atual = estoque_atual - NEW.quantidade
    WHERE id = NEW.epi_id;

    -- Registrar Log de Auditoria
    INSERT INTO logs_auditoria (usuario_id, acao, detalhes)
    VALUES (NEW.usuario_id, 'RETIRADA_EPI', 'Retirada realizada: EPI ID ' || NEW.epi_id || ' | Quantidade: ' || NEW.quantidade);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_estoque
AFTER INSERT ON movimentacoes
FOR EACH ROW
EXECUTE FUNCTION atualizar_estoque_apos_retirada();

-- ==============================================================================
-- CARGA DE DADOS INICIAIS (SEED DATA)
-- ==============================================================================

-- Insert Cargos
INSERT INTO cargos (id, nome, descricao) VALUES
(1, 'Eletricista', 'Manutenção e instalação de redes elétricas de alta e baixa tensão'),
(2, 'Mecânico Industrial', 'Manutenção preventiva e corretiva de maquinários pesados'),
(3, 'Operador de Serviços Gerais', 'Limpeza, organização e manuseio de produtos químicos básicos')
ON CONFLICT (id) DO NOTHING;

-- Insert Usuários (Supervisores e Colaboradores)
INSERT INTO usuarios (id, nome, matricula, email, cargo_id, supervisor_id, setor, papel) VALUES
(1, 'Carlos Silva (Admin)', 'ADM-001', 'admin@almoxarifado.com', 1, NULL, 'Almoxarifado / TI', 'ADMIN'),
(2, 'Roberto Mendes (Supervisor)', 'SUP-101', 'roberto.mendes@empresa.com', 2, NULL, 'Manutenção', 'SUPERVISOR'),
(3, 'Ana Beatriz (Eletricista)', 'FUNC-201', 'ana.beatriz@empresa.com', 1, 2, 'Elétrica', 'COLABORADOR'),
(4, 'Lucas Gabriel (Mecânico)', 'FUNC-202', 'lucas.gabriel@empresa.com', 2, 2, 'Mecânica', 'COLABORADOR'),
(5, 'Mariana Costa (Operadora)', 'FUNC-203', 'mariana.costa@empresa.com', 3, 2, 'Serviços Gerais', 'COLABORADOR')
ON CONFLICT (id) DO NOTHING;

-- Insert EPIs
INSERT INTO epis (id, codigo, nome, ca_numero, validade_ca, intervalo_dias_troca, estoque_atual, estoque_minimo, localizacao) VALUES
(1, 'EPI-001', 'Luva Isolante de Borracha Alta Tensão', 'CA-10293', '2027-12-31', 60, 15, 5, 'Armário A1 - Prateleira 2'),
(2, 'EPI-002', 'Capacete de Segurança com Aba Frontal', 'CA-34821', '2028-06-15', 180, 25, 8, 'Armário B2 - Prateleira 1'),
(3, 'EPI-003', 'Luva de Raspa Couro Canhão', 'CA-18239', '2026-11-20', 30, 8, 10, 'Armário A2 - Prateleira 3'),
(4, 'EPI-004', 'Óculos de Proteção Incolor Anti-risco', 'CA-42910', '2027-08-10', 90, 40, 10, 'Prateleira Central C'),
(5, 'EPI-005', 'Mascara Semifacial Filtrante PFF2', 'CA-38192', '2026-12-01', 15, 60, 20, 'Gaveteiro D')
ON CONFLICT (id) DO NOTHING;

-- Insert Matriz Cargo x EPI
INSERT INTO matriz_cargo_epi (cargo_id, epi_id, quantidade_maxima) VALUES
(1, 1, 1), -- Eletricista -> Luva Isolante
(1, 2, 1), -- Eletricista -> Capacete
(1, 4, 1), -- Eletricista -> Óculos
(2, 2, 1), -- Mecânico -> Capacete
(2, 3, 1), -- Mecânico -> Luva de Raspa
(2, 4, 1), -- Mecânico -> Óculos
(3, 4, 1), -- Operador -> Óculos
(3, 5, 2)  -- Operador -> Máscara PFF2
ON CONFLICT (cargo_id, epi_id) DO NOTHING;

-- Insert Solicitacao de Exceção Inicial (Pendente de teste)
INSERT INTO solicitacoes_excecao (usuario_id, epi_id, quantidade, justificativa, status, supervisor_id) VALUES
(4, 3, 1, 'Rasgou a luva durante a manutenção corretiva da prensa hidráulica', 'PENDENTE', 2);
