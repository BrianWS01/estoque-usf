import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_MOCK_DATA, isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Estado Global dos Dados do Sistema
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('almoxarifado_data');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_DATA;
  });

  // Autenticação e Usuário ativo
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('almoxarifado_active_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(currentUser));
  const [notification, setNotification] = useState(null);

  // Salvar estado no localStorage
  useEffect(() => {
    localStorage.setItem('almoxarifado_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('almoxarifado_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('almoxarifado_active_user');
    }
  }, [currentUser]);

  // Função Toast
  const showToast = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  // Login via Matrícula
  const loginWithMatricula = (matricula, senha) => {
    const cleanMatricula = matricula.trim().toUpperCase();
    const target = data.usuarios.find(u => u.matricula.toUpperCase() === cleanMatricula);

    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
      showToast(`Bem-vindo, ${target.nome}!`, 'success');
      return true;
    } else {
      return false;
    }
  };

  // Login Rápido de Apresentação
  const selectQuickUser = (usuarioId) => {
    const target = data.usuarios.find(u => u.id === usuarioId);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
      showToast(`Login realizado como: ${target.nome} (${target.papel})`, 'info');
    }
  };

  // Alternar perfil diretamente se logado
  const switchProfile = (roleName) => {
    const target = data.usuarios.find(u => u.papel === roleName);
    if (target) {
      setCurrentUser(target);
      showToast(`Perfil alterado para: ${target.nome} (${target.papel})`, 'info');
    }
  };

  // Sair / Logout
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  // ==============================================================================
  // REGRAS DE NEGÓCIO DA APLICAÇÃO
  // ==============================================================================

  // RN-01 & RN-02 & RN-04 & RN-05: Retirada Padrão de EPI
  const realizarRetirada = (usuarioId, epiId, cantidad = 1) => {
    const epi = data.epis.find(e => e.id === epiId);
    const usuario = data.usuarios.find(u => u.id === usuarioId);

    if (!epi || !usuario) return { success: false, message: 'Dados inválidos.' };

    // RN-07: Verificação de Estoque
    if (epi.estoque_atual < cantidad) {
      showToast(`Estoque insuficiente! Saldo atual: ${epi.estoque_atual}`, 'danger');
      return { success: false, message: 'Estoque insuficiente.' };
    }

    const dataAtual = new Date();
    const dataProximaTroca = new Date(dataAtual.getTime() + epi.intervalo_dias_troca * 24 * 60 * 60 * 1000);
    const dataProximaTrocaStr = dataProximaTroca.toISOString().split('T')[0];

    const novaMovimentacao = {
      id: Date.now(),
      usuario_id: usuarioId,
      epi_id: epiId,
      quantidade: cantidad,
      data_retirada: dataAtual.toISOString(),
      proxima_troca_prevista: dataProximaTrocaStr,
      tipo: 'RETIRADA_PADRAO',
      responsavel_entrega_id: currentUser ? currentUser.id : 1
    };

    setData(prev => {
      const novosEpis = prev.epis.map(e => 
        e.id === epiId ? { ...e, estoque_atual: e.estoque_atual - cantidad } : e
      );

      const novoLog = {
        id: Date.now(),
        usuario_id: usuarioId,
        acao: 'RETIRADA_EPI_PADRAO',
        detalhes: `Retirada realizada por ${usuario.nome}: ${cantidad}x ${epi.nome}`,
        created_at: new Date().toISOString()
      };

      return {
        ...prev,
        epis: novosEpis,
        movimentacoes: [novaMovimentacao, ...prev.movimentacoes],
        logs_auditoria: [novoLog, ...prev.logs_auditoria]
      };
    });

    showToast(`Retirada de "${epi.nome}" concluída com sucesso!`, 'success');
    return { success: true };
  };

  // RN-03: Solicitação de Exceção (Retirada Antecipada)
  const solicitarExcecao = (usuarioId, epiId, justificativa) => {
    const usuario = data.usuarios.find(u => u.id === usuarioId);
    const epi = data.epis.find(e => e.id === epiId);

    if (!justificativa || justificativa.trim().length < 5) {
      showToast('Por favor, informe uma justificativa válida.', 'danger');
      return false;
    }

    const novaSolicitacao = {
      id: Date.now(),
      usuario_id: usuarioId,
      epi_id: epiId,
      quantidade: 1,
      justificativa: justificativa.trim(),
      status: 'PENDENTE',
      supervisor_id: usuario.supervisor_id || 2,
      data_solicitacao: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      solicitacoes_excecao: [novaSolicitacao, ...prev.solicitacoes_excecao],
      logs_auditoria: [{
        id: Date.now(),
        usuario_id: usuarioId,
        acao: 'SOLICITACAO_EXCECAO',
        detalhes: `Solicitação de exceção criada por ${usuario.nome} para ${epi.nome}`,
        created_at: new Date().toISOString()
      }, ...prev.logs_auditoria]
    }));

    showToast('Solicitação de exceção enviada ao supervisor com sucesso!', 'warning');
    return true;
  };

  // Aprovação pelo Supervisor (RN-03 & RN-04)
  const responderSolicitacao = (solicitacaoId, novoStatus, respostaSupervisor = '') => {
    const solicitacao = data.solicitacoes_excecao.find(s => s.id === solicitacaoId);
    if (!solicitacao) return;

    const epi = data.epis.find(e => e.id === solicitacao.epi_id);
    const usuario = data.usuarios.find(u => u.id === solicitacao.usuario_id);

    if (novoStatus === 'APROVADO') {
      if (epi.estoque_atual < solicitacao.quantidade) {
        showToast('Não é possível aprovar: Estoque insuficiente!', 'danger');
        return;
      }

      const dataAtual = new Date();
      const dataProximaTroca = new Date(dataAtual.getTime() + epi.intervalo_dias_troca * 24 * 60 * 60 * 1000);

      const novaMovimentacao = {
        id: Date.now(),
        usuario_id: solicitacao.usuario_id,
        epi_id: solicitacao.epi_id,
        quantidade: solicitacao.quantidade,
        data_retirada: dataAtual.toISOString(),
        proxima_troca_prevista: dataProximaTroca.toISOString().split('T')[0],
        tipo: 'EXCECAO_APROVADA',
        responsavel_entrega_id: currentUser ? currentUser.id : 1,
        observacao: `Aprovado por supervisor: ${respostaSupervisor}`
      };

      setData(prev => ({
        ...prev,
        epis: prev.epis.map(e => e.id === epi.id ? { ...e, estoque_atual: e.estoque_atual - solicitacao.quantidade } : e),
        movimentacoes: [novaMovimentacao, ...prev.movimentacoes],
        solicitacoes_excecao: prev.solicitacoes_excecao.map(s => 
          s.id === solicitacaoId ? { ...s, status: 'APROVADO', resposta_supervisor: respostaSupervisor, data_resposta: new Date().toISOString() } : s
        ),
        logs_auditoria: [{
          id: Date.now(),
          usuario_id: currentUser ? currentUser.id : 1,
          acao: 'SOLICITACAO_APROVADA',
          detalhes: `Exceção aprovada para ${usuario.nome} (${epi.nome})`,
          created_at: new Date().toISOString()
        }, ...prev.logs_auditoria]
      }));

      showToast(`Solicitação de ${usuario.nome} APROVADA com sucesso!`, 'success');
    } else {
      setData(prev => ({
        ...prev,
        solicitacoes_excecao: prev.solicitacoes_excecao.map(s => 
          s.id === solicitacaoId ? { ...s, status: 'REJEITADO', resposta_supervisor: respostaSupervisor, data_resposta: new Date().toISOString() } : s
        ),
        logs_auditoria: [{
          id: Date.now(),
          usuario_id: currentUser ? currentUser.id : 1,
          acao: 'SOLICITACAO_REJEITADA',
          detalhes: `Exceção rejeitada para ${usuario.nome} (${epi.nome})`,
          created_at: new Date().toISOString()
        }, ...prev.logs_auditoria]
      }));

      showToast(`Solicitação de ${usuario.nome} REJEITADA.`, 'danger');
    }
  };

  const salvarEpi = (epiObj) => {
    setData(prev => {
      const exists = prev.epis.some(e => e.id === epiObj.id);
      const novos = exists 
        ? prev.epis.map(e => e.id === epiObj.id ? epiObj : e)
        : [...prev.epis, { ...epiObj, id: Date.now() }];
      return { ...prev, epis: novos };
    });
    showToast('EPI salvo com sucesso!', 'success');
  };

  const salvarMatrizRule = (cargoId, epiId, cantidadMax = 1) => {
    setData(prev => {
      const exists = prev.matriz_cargo_epi.some(m => m.cargo_id === cargoId && m.epi_id === epiId);
      let novaMatriz;
      if (exists) {
        novaMatriz = prev.matriz_cargo_epi.map(m => (m.cargo_id === cargoId && m.epi_id === epiId) ? { ...m, quantidade_maxima: cantidadMax } : m);
      } else {
        novaMatriz = [...prev.matriz_cargo_epi, { id: Date.now(), cargo_id: cargoId, epi_id: epiId, quantidade_maxima: cantidadMax }];
      }
      return { ...prev, matriz_cargo_epi: novaMatriz };
    });
    showToast('Regra de autorização Cargo x EPI atualizada!', 'success');
  };

  const resetarDados = () => {
    localStorage.removeItem('almoxarifado_data');
    localStorage.removeItem('almoxarifado_active_user');
    setData(INITIAL_MOCK_DATA);
    setCurrentUser(null);
    setIsAuthenticated(false);
    showToast('Dados restaurados para os valores originais do teste!', 'info');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      loginWithMatricula,
      selectQuickUser,
      logout,
      switchProfile,
      data,
      notification,
      showToast,
      realizarRetirada,
      solicitarExcecao,
      responderSolicitacao,
      salvarEpi,
      salvarMatrizRule,
      resetarDados,
      isSupabaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
