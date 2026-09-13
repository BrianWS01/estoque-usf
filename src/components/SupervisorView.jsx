import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, CheckCircle, XCircle, Clock, UserCheck, MessageSquare, AlertCircle } from 'lucide-react';

export const SupervisorView = () => {
  const { currentUser, data, responderSolicitacao } = useAuth();
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [respostaTexto, setRespostaTexto] = useState('');
  const [modalAcao, setModalAcao] = useState(null); // 'APROVAR' ou 'REJEITAR'

  // Minhas solicitações a gerenciar (supervisionadas por este usuário)
  const pendentes = data.solicitacoes_excecao.filter(s => s.status === 'PENDENTE');
  const historico = data.solicitacoes_excecao.filter(s => s.status !== 'PENDENTE');

  const handleOpenModal = (solicitacao, acao) => {
    setSelectedSolicitacao(solicitacao);
    setModalAcao(acao);
    setRespostaTexto(acao === 'APROVAR' ? 'Aprovado conforme justificativa operacional.' : 'Rejeitado por ultrapassar cota.');
  };

  const handleConfirmarDecisao = (e) => {
    e.preventDefault();
    if (!selectedSolicitacao || !modalAcao) return;

    responderSolicitacao(
      selectedSolicitacao.id,
      modalAcao === 'APROVAR' ? 'APROVADO' : 'REJEITADO',
      respostaTexto
    );

    setSelectedSolicitacao(null);
    setModalAcao(null);
    setRespostaTexto('');
  };

  return (
    <div>
      {/* Banner do Supervisor */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(19, 27, 41, 0.8), rgba(245, 158, 11, 0.08))', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>Painel do Supervisor</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{currentUser.nome}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Gestão de Exceções & Retiradas Antecipadas de EPI (Setor: <strong>{currentUser.setor}</strong>)
            </p>
          </div>
          <div>
            <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
              {pendentes.length} Pendências de Aprovação
            </span>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid-stats">
        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#fbbf24' }}>{pendentes.length}</div>
            <div className="stat-label">Solicitações Pendentes</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#34d399' }}>
              {data.solicitacoes_excecao.filter(s => s.status === 'APROVADO').length}
            </div>
            <div className="stat-label">Exceções Aprovadas</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#f87171' }}>
              {data.solicitacoes_excecao.filter(s => s.status === 'REJEITADO').length}
            </div>
            <div className="stat-label">Exceções Rejeitadas</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#60a5fa' }}>
              {data.usuarios.filter(u => u.papel === 'COLABORADOR').length}
            </div>
            <div className="stat-label">Liderados na Equipe</div>
          </div>
        </div>
      </div>

      {/* Fila de Solicitações Pendentes (RN-03) */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle color="#fbbf24" size={22} />
          Solicitações Antecipadas Aguardando Avaliação (RN-03)
        </h2>

        {pendentes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <CheckCircle size={48} color="#34d399" style={{ margin: '0 auto 1rem', display: 'block' }} />
            <h3>Nenhuma solicitação de exceção pendente no momento!</h3>
            <p style={{ fontSize: '0.875rem' }}>Todas as retiradas no almoxarifado estão seguindo o fluxo padrão dentro do prazo.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {pendentes.map(sol => {
              const funcionario = data.usuarios.find(u => u.id === sol.usuario_id);
              const epi = data.epis.find(e => e.id === sol.epi_id);
              const cargo = data.cargos.find(c => c.id === funcionario?.cargo_id);

              return (
                <div key={sol.id} className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className="badge badge-warning">Aprovação Necessária</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(sol.data_solicitacao).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{funcionario?.nome}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: 600, marginBottom: '1rem' }}>
                      Cargo: {cargo?.nome}
                    </p>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.9rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Equipamento Solicitado</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{epi?.nome}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>C.A.: {epi?.ca_numero} | Saldo em Estoque: {epi?.estoque_atual} un.</div>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Justificativa do Colaborador:
                      </div>
                      <p style={{ fontSize: '0.875rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                        "{sol.justificativa}"
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      className="btn btn-success" 
                      style={{ flex: 1 }}
                      onClick={() => handleOpenModal(sol, 'APROVAR')}
                    >
                      <CheckCircle size={16} />
                      Aprovar
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ flex: 1 }}
                      onClick={() => handleOpenModal(sol, 'REJEITAR')}
                    >
                      <XCircle size={16} />
                      Rejeitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Histórico de Decisões do Supervisor */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Histórico de Avaliações Concluídas</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Colaborador</th>
                <th>EPI Solicitado</th>
                <th>Justificativa Original</th>
                <th>Resultado</th>
                <th>Parecer do Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {historico.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma avaliação gravada ainda.</td>
                </tr>
              ) : (
                historico.map(sol => {
                  const funcionario = data.usuarios.find(u => u.id === sol.usuario_id);
                  const epi = data.epis.find(e => e.id === sol.epi_id);
                  return (
                    <tr key={sol.id}>
                      <td>{new Date(sol.data_resposta || sol.data_solicitacao).toLocaleString('pt-BR')}</td>
                      <td style={{ fontWeight: 600 }}>{funcionario?.nome}</td>
                      <td>{epi?.nome}</td>
                      <td style={{ fontSize: '0.85rem' }}>{sol.justificativa}</td>
                      <td>
                        <span className={`badge ${sol.status === 'APROVADO' ? 'badge-success' : 'badge-danger'}`}>
                          {sol.status}
                        </span>
                      </td>
                      <td style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>{sol.resposta_supervisor}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Avaliação do Supervisor */}
      {selectedSolicitacao && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalAcao === 'APROVAR' ? 'Aprovar Retirada de Exceção' : 'Rejeitar Solicitação'}
              </h3>
              <button 
                onClick={() => setSelectedSolicitacao(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmarDecisao}>
              <div className="form-group">
                <label className="form-label">Parecer / Observação do Supervisor</label>
                <textarea 
                  className="form-textarea" 
                  rows={3}
                  value={respostaTexto}
                  onChange={(e) => setRespostaTexto(e.target.value)}
                  placeholder="Escreva uma observação para registro no log de auditoria..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedSolicitacao(null)}>
                  Cancelar
                </button>
                <button type="submit" className={`btn ${modalAcao === 'APROVAR' ? 'btn-success' : 'btn-danger'}`}>
                  Confirmar {modalAcao === 'APROVAR' ? 'Aprovação' : 'Rejeição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
