import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Clock, AlertTriangle, CheckCircle2, FileCheck, Calendar, MapPin, Send } from 'lucide-react';

export const ColaboradorView = () => {
  const { currentUser, data, realizarRetirada, solicitarExcecao } = useAuth();
  const [selectedEpiForModal, setSelectedEpiForModal] = useState(null);
  const [justificativaText, setJustificativaText] = useState('');

  // 1. Filtrar os EPIs autorizados para o cargo do colaborador (RN-01)
  const permissoesCargo = data.matriz_cargo_epi.filter(m => m.cargo_id === currentUser.cargo_id);
  const episPermitidos = data.epis.filter(epi => 
    permissoesCargo.some(p => p.epi_id === epi.id)
  );

  const cargoDoUsuario = data.cargos.find(c => c.id === currentUser.cargo_id);
  const supervisorDoUsuario = data.usuarios.find(u => u.id === currentUser.supervisor_id);

  // 2. Histórico de retiradas deste colaborador
  const minhasMovimentacoes = data.movimentacoes
    .filter(m => m.usuario_id === currentUser.id)
    .sort((a, b) => new Date(b.data_retirada) - new Date(a.data_retirada));

  // 3. Minhas solicitações de exceção pendentes ou recentes
  const minhasSolicitacoes = data.solicitacoes_excecao
    .filter(s => s.usuario_id === currentUser.id)
    .sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));

  // Função auxiliar para verificar elegibilidade de retirada no prazo (RN-02 e RN-05)
  const getStatusRetiradaEpi = (epi) => {
    const ultimaRetirada = minhasMovimentacoes.find(m => m.epi_id === epi.id);

    if (!ultimaRetirada) {
      return { liberado: true, diasRestantes: 0, mensagem: 'Primeira retirada (Liberado)' };
    }

    const dataProximaTroca = new Date(ultimaRetirada.proxima_troca_prevista);
    const hoje = new Date();
    const diffTime = dataProximaTroca - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { liberado: true, diasRestantes: 0, mensagem: 'Prazo de troca atingido (Liberado)' };
    } else {
      return { 
        liberado: false, 
        diasRestantes: diffDays, 
        mensagem: `Bloqueado: Troca permitida em ${diffDays} dias (${ultimaRetirada.proxima_troca_prevista})`
      };
    }
  };

  const handleOpenExcecaoModal = (epi) => {
    setSelectedEpiForModal(epi);
    setJustificativaText('');
  };

  const handleSubmitExcecao = (e) => {
    e.preventDefault();
    if (!selectedEpiForModal) return;
    const ok = solicitarExcecao(currentUser.id, selectedEpiForModal.id, justificativaText);
    if (ok) {
      setSelectedEpiForModal(null);
      setJustificativaText('');
    }
  };

  return (
    <div>
      {/* Banner do Perfil do Colaborador */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(19, 27, 41, 0.8), rgba(0, 212, 170, 0.05))', borderColor: 'var(--border-highlight)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>Perfil Colaborador</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{currentUser.nome}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Cargo: <strong style={{ color: 'var(--text-primary)' }}>{cargoDoUsuario?.nome || 'N/A'}</strong> | 
              Setor: <strong style={{ color: 'var(--text-primary)' }}>{currentUser.setor}</strong> | 
              Supervisor: <strong style={{ color: 'var(--text-primary)' }}>{supervisorDoUsuario?.nome || 'N/A'}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Matrícula Funcional</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-teal)' }}>{currentUser.matricula}</div>
          </div>
        </div>
      </div>

      {/* Seção 1: Catálogo de EPIs Autorizados para o Cargo (RN-01) */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>EPIs Autorizados para seu Cargo</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Matriz de Permissão: <strong style={{ color: 'var(--accent-teal)' }}>{cargoDoUsuario?.nome}</strong> ({episPermitidos.length} itens cadastrados)
            </p>
          </div>
        </div>

        <div className="grid-cards">
          {episPermitidos.map(epi => {
            const statusRetirada = getStatusRetiradaEpi(epi);
            const temEstoque = epi.estoque_atual > 0;

            return (
              <div key={epi.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* Cabeçalho do Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span className="badge badge-info">{epi.codigo}</span>
                    <span className={`badge ${temEstoque ? (epi.estoque_atual <= epi.estoque_minimo ? 'badge-warning' : 'badge-success') : 'badge-danger'}`}>
                      {temEstoque ? `Estoque: ${epi.estoque_atual} un.` : 'Sem Estoque'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: '1.3' }}>
                    {epi.nome}
                  </h3>

                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileCheck size={15} color="#00d4aa" />
                      <span><strong>C.A. (Certificado):</strong> {epi.ca_numero}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={15} color="#3b82f6" />
                      <span><strong>Periodicidade de Troca:</strong> a cada {epi.intervalo_dias_troca} dias</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="#8b5cf6" />
                      <span><strong>Localização:</strong> {epi.localizacao}</span>
                    </div>
                  </div>

                  {/* Status do Prazo (RN-02 / RN-05) */}
                  <div style={{
                    background: statusRetirada.liberado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: `1px solid ${statusRetirada.liberado ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    marginBottom: '1.25rem'
                  }}>
                    {statusRetirada.liberado ? (
                      <CheckCircle2 size={18} color="#34d399" />
                    ) : (
                      <Clock size={18} color="#fbbf24" />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, color: statusRetirada.liberado ? '#34d399' : '#fbbf24' }}>
                        {statusRetirada.liberado ? 'Retirada Liberada' : 'Bloqueado por Periodicidade'}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {statusRetirada.mensagem}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div>
                  {statusRetirada.liberado ? (
                    <button
                      className={`btn btn-primary ${!temEstoque ? 'btn-disabled' : ''}`}
                      style={{ width: '100%' }}
                      disabled={!temEstoque}
                      onClick={() => realizarRetirada(currentUser.id, epi.id, 1)}
                    >
                      <ShieldCheck size={18} />
                      {temEstoque ? 'Confirmar Retirada' : 'Sem Estoque'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
                      onClick={() => handleOpenExcecaoModal(epi)}
                    >
                      <AlertTriangle size={16} />
                      Solicitar Exceção (Antecipada)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção 2: Minhas Solicitações de Exceção */}
      {minhasSolicitacoes.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Minhas Solicitações de Exceção</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>EPI Solicitado</th>
                  <th>Data Solicitação</th>
                  <th>Justificativa</th>
                  <th>Status</th>
                  <th>Resposta do Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {minhasSolicitacoes.map(sol => {
                  const epi = data.epis.find(e => e.id === sol.epi_id);
                  return (
                    <tr key={sol.id}>
                      <td style={{ fontWeight: 700 }}>{epi?.nome || 'N/A'}</td>
                      <td>{new Date(sol.data_solicitacao).toLocaleString('pt-BR')}</td>
                      <td>{sol.justificativa}</td>
                      <td>
                        <span className={`badge ${
                          sol.status === 'APROVADO' ? 'badge-success' : sol.status === 'REJEITADO' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {sol.status}
                        </span>
                      </td>
                      <td style={{ color: sol.resposta_supervisor ? 'var(--text-primary)' : 'var(--text-muted)', italic: true }}>
                        {sol.resposta_supervisor || 'Aguardando avaliação do supervisor'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seção 3: Histórico Pessoal de Retiradas */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Meu Histórico de Retiradas</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Equipamento (EPI)</th>
                <th>Qtd</th>
                <th>Próxima Troca Prevista</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {minhasMovimentacoes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma retirada registrada ainda.</td>
                </tr>
              ) : (
                minhasMovimentacoes.map(mov => {
                  const epi = data.epis.find(e => e.id === mov.epi_id);
                  return (
                    <tr key={mov.id}>
                      <td>{new Date(mov.data_retirada).toLocaleString('pt-BR')}</td>
                      <td style={{ fontWeight: 600 }}>{epi?.nome}</td>
                      <td>{mov.quantidade}</td>
                      <td>
                        <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>
                          {mov.proxima_troca_prevista}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${mov.tipo === 'EXCECAO_APROVADA' ? 'badge-warning' : 'badge-info'}`}>
                          {mov.tipo}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Solicitação de Exceção (RN-03) */}
      {selectedEpiForModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle color="#fbbf24" size={22} />
                Solicitar Retirada Antecipada
              </h3>
              <button 
                onClick={() => setSelectedEpiForModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Este EPI ainda está dentro do período de validade da sua última retirada. Para solicitar a substituição antecipada, descreva o motivo para aprovação do supervisor <strong style={{ color: 'var(--text-primary)' }}>{supervisorDoUsuario?.nome}</strong>.
            </p>

            <form onSubmit={handleSubmitExcecao}>
              <div className="form-group">
                <label className="form-label">Equipamento Solicitação</label>
                <input className="form-input" value={selectedEpiForModal.nome} disabled readOnly />
              </div>

              <div className="form-group">
                <label className="form-label">Justificativa da Exceção (Obrigatório)</label>
                <textarea 
                  className="form-textarea" 
                  rows={4}
                  placeholder="Ex: Luva rasgou durante o manuseio de peças afiadas na manutenção."
                  value={justificativaText}
                  onChange={(e) => setJustificativaText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedEpiForModal(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={16} />
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
