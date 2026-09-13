import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Users, Shield, AlertTriangle, Plus, Edit3, FileSpreadsheet, Activity, CheckCircle, Database } from 'lucide-react';

export const AdminView = () => {
  const { currentUser, data, salvarEpi, salvarMatrizRule, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('estoque');

  // Estado para Modal de Novo/Editar EPI
  const [isEpiModalOpen, setIsEpiModalOpen] = useState(false);
  const [epiFormData, setEpiFormData] = useState({
    id: null,
    codigo: '',
    nome: '',
    ca_numero: '',
    validade_ca: '',
    intervalo_dias_troca: 30,
    estoque_atual: 10,
    estoque_minimo: 5,
    localizacao: ''
  });

  // Estado para vincular nova regra Matriz Cargo x EPI
  const [selectedCargoId, setSelectedCargoId] = useState(data.cargos[0]?.id || 1);
  const [selectedEpiId, setSelectedEpiId] = useState(data.epis[0]?.id || 1);

  // Cálculos de Alertas
  const episEstoqueBaixo = data.epis.filter(e => e.estoque_atual <= e.estoque_minimo);

  const handleOpenEpiModal = (epi = null) => {
    if (epi) {
      setEpiFormData(epi);
    } else {
      setEpiFormData({
        id: Date.now(),
        codigo: `EPI-00${data.epis.length + 1}`,
        nome: '',
        ca_numero: 'CA-',
        validade_ca: '2028-12-31',
        intervalo_dias_troca: 30,
        estoque_atual: 20,
        estoque_minimo: 5,
        localizacao: 'Armário Novo'
      });
    }
    setIsEpiModalOpen(true);
  };

  const handleSaveEpiSubmit = (e) => {
    e.preventDefault();
    if (!epiFormData.nome || !epiFormData.codigo) return;
    salvarEpi(epiFormData);
    setIsEpiModalOpen(false);
  };

  const handleAdicionarRegraMatriz = (e) => {
    e.preventDefault();
    salvarMatrizRule(Number(selectedCargoId), Number(selectedEpiId), 1);
  };

  const handleExportarRelatorio = (formato) => {
    showToast(`Gerando relatório de almoxarifado em formato ${formato}... Download iniciado!`, 'success');
  };

  return (
    <div>
      {/* Banner do Admin / Almoxarife */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(19, 27, 41, 0.9), rgba(59, 130, 246, 0.08))', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>Painel do Almoxarife / Admin</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{currentUser.nome}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Gestão de Estoque, Parametrização da Matriz Cargo x EPI e Auditoria Geral
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => handleExportarRelatorio('PDF')}>
              <FileSpreadsheet size={16} /> Exportar PDF
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenEpiModal()}>
              <Plus size={16} /> Cadastrar Novo EPI
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Gerais */}
      <div className="grid-stats">
        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(0, 212, 170, 0.15)', color: '#00d4aa' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#00d4aa' }}>{data.epis.length}</div>
            <div className="stat-label">EPIs Cadastrados</div>
          </div>
        </div>

        <div className="stat-box" style={{ borderColor: episEstoqueBaixo.length > 0 ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-color)' }}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: episEstoqueBaixo.length > 0 ? '#f87171' : 'var(--text-primary)' }}>
              {episEstoqueBaixo.length}
            </div>
            <div className="stat-label">EPIs em Estoque Crítico (RN-07)</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#60a5fa' }}>{data.usuarios.length}</div>
            <div className="stat-label">Funcionários Ativos</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
            <Activity size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#c084fc' }}>{data.movimentacoes.length}</div>
            <div className="stat-label">Retiradas Registradas</div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'estoque' ? 'active' : ''}`}
          onClick={() => setActiveTab('estoque')}
        >
          📦 Gestão de Estoque ({data.epis.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'matriz' ? 'active' : ''}`}
          onClick={() => setActiveTab('matriz')}
        >
          🔐 Matriz Cargo x EPI (RN-01)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          👥 Funcionários & Cargos ({data.usuarios.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'auditoria' ? 'active' : ''}`}
          onClick={() => setActiveTab('auditoria')}
        >
          📜 Log de Auditoria & Relatórios (RN-08)
        </button>
      </div>

      {/* ABA 1: GESTÃO DE ESTOQUE & EPIS */}
      {activeTab === 'estoque' && (
        <div>
          {episEstoqueBaixo.length > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle color="#f87171" size={22} />
              <div>
                <strong style={{ color: '#f87171' }}>Atenção: {episEstoqueBaixo.length} equipamento(s) abaixo do nível mínimo de estoque!</strong>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Itens críticos: {episEstoqueBaixo.map(e => e.nome).join(', ')}
                </div>
              </div>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome do Equipamento (EPI)</th>
                  <th>C.A.</th>
                  <th>Troca Padrão</th>
                  <th>Saldo Atual</th>
                  <th>Estoque Mín.</th>
                  <th>Localização</th>
                  <th>Status RN-07</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.epis.map(epi => {
                  const isCritico = epi.estoque_atual <= epi.estoque_minimo;
                  return (
                    <tr key={epi.id}>
                      <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{epi.codigo}</td>
                      <td style={{ fontWeight: 600 }}>{epi.nome}</td>
                      <td>{epi.ca_numero}</td>
                      <td>{epi.intervalo_dias_troca} dias</td>
                      <td style={{ fontSize: '1.05rem', fontWeight: 800, color: isCritico ? '#f87171' : '#34d399' }}>
                        {epi.estoque_atual} un.
                      </td>
                      <td>{epi.estoque_minimo} un.</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{epi.localizacao}</td>
                      <td>
                        <span className={`badge ${isCritico ? 'badge-danger' : 'badge-success'}`}>
                          {isCritico ? 'Reposição Necessária' : 'Normal'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleOpenEpiModal(epi)}
                        >
                          <Edit3 size={14} /> Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: MATRIZ CARGO X EPI */}
      {activeTab === 'matriz' && (
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Adicionar Autorização na Matriz</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Define quais EPIs são permitidos para retirada por cada função profissional (Regra RN-01).
            </p>

            <form onSubmit={handleAdicionarRegraMatriz} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Selecione o Cargo</label>
                <select className="form-select" value={selectedCargoId} onChange={(e) => setSelectedCargoId(e.target.value)}>
                  {data.cargos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Selecione o EPI Permitido</label>
                <select className="form-select" value={selectedEpiId} onChange={(e) => setSelectedEpiId(e.target.value)}>
                  {data.epis.map(e => (
                    <option key={e.id} value={e.id}>{e.codigo} - {e.nome}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                <Plus size={16} /> Vincular Autorização
              </button>
            </form>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Matriz de Autorizações Ativa</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cargo / Função</th>
                  <th>EPI Liberado para Retirada</th>
                  <th>Periodicidade Mínima</th>
                  <th>Cota Máxima</th>
                </tr>
              </thead>
              <tbody>
                {data.matriz_cargo_epi.map(mat => {
                  const cargo = data.cargos.find(c => c.id === mat.cargo_id);
                  const epi = data.epis.find(e => e.id === mat.epi_id);
                  return (
                    <tr key={mat.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cargo?.nome}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{epi?.nome} ({epi?.codigo})</td>
                      <td>A cada {epi?.intervalo_dias_troca} dias</td>
                      <td>{mat.quantidade_maxima} unidade(s) por retirada</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: FUNCIONÁRIOS */}
      {activeTab === 'usuarios' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nome Completo</th>
                <th>Cargo / Função</th>
                <th>Setor</th>
                <th>Supervisor Responsável</th>
                <th>Perfil de Acesso</th>
              </tr>
            </thead>
            <tbody>
              {data.usuarios.map(u => {
                const cargo = data.cargos.find(c => c.id === u.cargo_id);
                const supervisor = data.usuarios.find(sup => sup.id === u.supervisor_id);
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{u.matricula}</td>
                    <td style={{ fontWeight: 600 }}>{u.nome}</td>
                    <td>{cargo?.nome || 'N/A'}</td>
                    <td>{u.setor}</td>
                    <td>{supervisor?.nome || '— (Sem Supervisor)'}</td>
                    <td>
                      <span className={`badge ${u.papel === 'ADMIN' ? 'badge-danger' : u.papel === 'SUPERVISOR' ? 'badge-warning' : 'badge-info'}`}>
                        {u.papel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA 4: LOGS DE AUDITORIA (RN-08) */}
      {activeTab === 'auditoria' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Usuário Responsável</th>
                <th>Ação Auditada</th>
                <th>Detalhes da Operação</th>
              </tr>
            </thead>
            <tbody>
              {data.logs_auditoria.map(log => {
                const usuario = data.usuarios.find(u => u.id === log.usuario_id);
                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ fontWeight: 600 }}>{usuario?.nome || 'Sistema (Automático)'}</td>
                    <td>
                      <span className="badge badge-info">{log.acao}</span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{log.detalhes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para Cadastro/Edição de EPI */}
      {isEpiModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar / Editar Equipamento (EPI)</h3>
              <button 
                onClick={() => setIsEpiModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEpiSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Código Interno</label>
                  <input 
                    className="form-input" 
                    value={epiFormData.codigo}
                    onChange={(e) => setEpiFormData({ ...epiFormData, codigo: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nº do C.A. (Certificado)</label>
                  <input 
                    className="form-input" 
                    value={epiFormData.ca_numero}
                    onChange={(e) => setEpiFormData({ ...epiFormData, ca_numero: e.target.value })}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nome do Equipamento</label>
                <input 
                  className="form-input" 
                  value={epiFormData.nome}
                  onChange={(e) => setEpiFormData({ ...epiFormData, nome: e.target.value })}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Troca (Dias)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={epiFormData.intervalo_dias_troca}
                    onChange={(e) => setEpiFormData({ ...epiFormData, intervalo_dias_troca: Number(e.target.value) })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estoque Atual</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={epiFormData.estoque_atual}
                    onChange={(e) => setEpiFormData({ ...epiFormData, estoque_atual: Number(e.target.value) })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estoque Mínimo</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={epiFormData.estoque_minimo}
                    onChange={(e) => setEpiFormData({ ...epiFormData, estoque_minimo: Number(e.target.value) })}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Localização no Almoxarifado</label>
                <input 
                  className="form-input" 
                  value={epiFormData.localizacao}
                  onChange={(e) => setEpiFormData({ ...epiFormData, localizacao: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEpiModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar EPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
