import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Lock, LogIn, Award, ShieldAlert, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

export const LoginView = () => {
  const { loginWithMatricula, data, selectQuickUser } = useAuth();
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const success = loginWithMatricula(matricula, senha);
    if (!success) {
      setErrorMsg('Matrícula não encontrada. Tente "FUNC-201", "SUP-101" ou "ADM-001".');
    }
  };

  const handleQuickLogin = (usuarioId) => {
    selectQuickUser(usuarioId);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '960px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'center' }}>
        
        {/* Lado Esquerdo: Apresentação da Atividade Extensionista */}
        <div>
          <div className="badge badge-info" style={{ marginBottom: '1rem', gap: '0.4rem' }}>
            <Building2 size={14} /> Atividade Extensionista - USF
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: '1.2', marginBottom: '1rem', background: 'linear-gradient(135deg, #fff, var(--accent-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Automação Inteligente no Almoxarifado
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Sistema digital para controle, distribuição e rastreabilidade de Equipamentos de Proteção Individual (EPIs).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 color="#00d4aa" size={18} />
              <span>Controle rigoroso por cargo e matriz de acesso</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 color="#00d4aa" size={18} />
              <span>Bloqueio automático de retiradas antecipadas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 color="#00d4aa" size={18} />
              <span>Gestão de estoque mínimo e logs de auditoria</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário de Login */}
        <div className="card" style={{ padding: '2.25rem', background: 'var(--bg-secondary)', borderColor: 'var(--border-highlight)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="brand-icon" style={{ width: '42px', height: '42px' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Acesso ao Sistema</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Digite suas credenciais corporativas</p>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} /> Matrícula do Colaborador
              </label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Ex: FUNC-201 ou ADM-001"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} /> Senha de Acesso
              </label>
              <input 
                type="password" 
                className="form-input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
              <LogIn size={18} />
              Entrar no Almoxarifado
            </button>
          </form>

          {/* Atalho de Demonstração Rápida para Apresentação */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              <Sparkles size={14} color="#00d4aa" /> ACESSO RÁPIDO PARA APRESENTAÇÃO
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => handleQuickLogin(3)}
              >
                <User size={14} color="#00d4aa" />
                <span><strong>Ana Beatriz</strong> (Eletricista - FUNC-201)</span>
              </button>

              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => handleQuickLogin(2)}
              >
                <ShieldAlert size={14} color="#fbbf24" />
                <span><strong>Roberto Mendes</strong> (Supervisor - SUP-101)</span>
              </button>

              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => handleQuickLogin(1)}
              >
                <Award size={14} color="#c084fc" />
                <span><strong>Carlos Silva</strong> (Admin / Almoxarife - ADM-001)</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
