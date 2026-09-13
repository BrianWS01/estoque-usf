import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('seu-projeto')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// MOCK STATE / IN-MEMORY DB (Fallback para Execução Imediata no Navegador)
// ==============================================================================
export const INITIAL_MOCK_DATA = {
  cargos: [
    { id: 1, nome: 'Eletricista', descricao: 'Manutenção e instalação de redes elétricas' },
    { id: 2, nome: 'Mecânico Industrial', descricao: 'Manutenção preventiva de maquinário' },
    { id: 3, nome: 'Operador de Serviços Gerais', descricao: 'Limpeza e conservação geral' }
  ],
  usuarios: [
    { id: 1, nome: 'Carlos Silva (Admin)', matricula: 'ADM-001', cargo_id: 1, setor: 'Almoxarifado', papel: 'ADMIN' },
    { id: 2, nome: 'Roberto Mendes (Supervisor)', matricula: 'SUP-101', cargo_id: 2, setor: 'Manutenção', papel: 'SUPERVISOR' },
    { id: 3, nome: 'Ana Beatriz (Eletricista)', matricula: 'FUNC-201', cargo_id: 1, supervisor_id: 2, setor: 'Elétrica', papel: 'COLABORADOR' },
    { id: 4, nome: 'Lucas Gabriel (Mecânico)', matricula: 'FUNC-202', cargo_id: 2, supervisor_id: 2, setor: 'Mecânica', papel: 'COLABORADOR' },
    { id: 5, nome: 'Mariana Costa (Operadora)', matricula: 'FUNC-203', cargo_id: 3, supervisor_id: 2, setor: 'Serviços Gerais', papel: 'COLABORADOR' }
  ],
  epis: [
    { id: 1, codigo: 'EPI-001', nome: 'Luva Isolante de Borracha Alta Tensão', ca_numero: 'CA-10293', validade_ca: '2027-12-31', intervalo_dias_troca: 60, estoque_atual: 15, estoque_minimo: 5, localizacao: 'Armário A1' },
    { id: 2, codigo: 'EPI-002', nome: 'Capacete de Segurança com Aba Frontal', ca_numero: 'CA-34821', validade_ca: '2028-06-15', intervalo_dias_troca: 180, estoque_atual: 25, estoque_minimo: 8, localizacao: 'Armário B2' },
    { id: 3, codigo: 'EPI-003', nome: 'Luva de Raspa Couro Canhão', ca_numero: 'CA-18239', validade_ca: '2026-11-20', intervalo_dias_troca: 30, estoque_atual: 4, estoque_minimo: 10, localizacao: 'Armário A2' }, // Alerta estoque baixo
    { id: 4, codigo: 'EPI-004', 'nome': 'Óculos de Proteção Incolor Anti-risco', ca_numero: 'CA-42910', validade_ca: '2027-08-10', intervalo_dias_troca: 90, estoque_atual: 40, estoque_minimo: 10, localizacao: 'Prateleira C' },
    { id: 5, codigo: 'EPI-005', nome: 'Mascara Semifacial Filtrante PFF2', ca_numero: 'CA-38192', validade_ca: '2026-12-01', intervalo_dias_troca: 15, estoque_atual: 60, estoque_minimo: 20, localizacao: 'Gaveteiro D' }
  ],
  matriz_cargo_epi: [
    { id: 1, cargo_id: 1, epi_id: 1, quantidade_maxima: 1 }, // Eletricista -> Luva Isolante
    { id: 2, cargo_id: 1, epi_id: 2, quantidade_maxima: 1 }, // Eletricista -> Capacete
    { id: 3, cargo_id: 1, epi_id: 4, quantidade_maxima: 1 }, // Eletricista -> Óculos
    { id: 4, cargo_id: 2, epi_id: 2, quantidade_maxima: 1 }, // Mecânico -> Capacete
    { id: 5, cargo_id: 2, epi_id: 3, quantidade_maxima: 1 }, // Mecânico -> Luva Raspa
    { id: 6, cargo_id: 2, epi_id: 4, quantidade_maxima: 1 }, // Mecânico -> Óculos
    { id: 7, cargo_id: 3, epi_id: 4, quantidade_maxima: 1 }, // Operador -> Óculos
    { id: 8, cargo_id: 3, epi_id: 5, quantidade_maxima: 2 }  // Operador -> Máscara PFF2
  ],
  movimentacoes: [
    {
      id: 1,
      usuario_id: 3, // Ana Beatriz
      epi_id: 1,     // Luva Isolante
      quantidade: 1,
      data_retirada: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(), // 55 dias atrás
      proxima_troca_prevista: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Faltam 5 dias
      tipo: 'RETIRADA_PADRAO',
      responsavel_entrega_id: 1
    },
    {
      id: 2,
      usuario_id: 4, // Lucas Gabriel
      epi_id: 3,     // Luva de Raspa
      quantidade: 1,
      data_retirada: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dias atrás (intervalo é 30d -> bloqueado)
      proxima_troca_prevista: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tipo: 'RETIRADA_PADRAO',
      responsavel_entrega_id: 1
    }
  ],
  solicitacoes_excecao: [
    {
      id: 1,
      usuario_id: 4,
      epi_id: 3,
      quantidade: 1,
      justificativa: 'Rasgou o par de luvas de raspa durante manutenção na prensa hidráulica.',
      status: 'PENDENTE',
      supervisor_id: 2,
      data_solicitacao: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ],
  logs_auditoria: [
    { id: 1, usuario_id: 1, acao: 'SISTEMA_INICIADO', detalhes: 'Ambiente de almoxarifado ativado com sucesso', created_at: new Date().toISOString() }
  ]
};
