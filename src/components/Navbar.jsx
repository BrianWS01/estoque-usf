import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, ShieldAlert, Database, RotateCcw, Award } from 'lucide-react';

export const Navbar = () => {
  const { currentUser, switchProfile, resetarDados, isSupabaseConfigured } = useAuth();

  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">
          <ShieldCheck size={26} />
        </div>
        <div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>ALMOXARIFADO</span>
          <span style={{ color: 'var(--accent-teal)', fontWeight: 700, fontSize: '0.9rem', display: 'block', marginTop: '-4px' }}>EPI INTELIGENTE</span>
        </div>
      </div>

      {/* Indicador de Conexão Supabase / Demo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
        <Database size={14} color={isSupabaseConfigured ? '#00d4aa' : '#f59e0b'} />
        <span style={{ color: isSupabaseConfigured ? '#00d4aa' : '#f59e0b', fontWeight: 600 }}>
          {isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Demo (Local)'}
        </span>
      </div>

      {/* Seletor Rápido de Papéis para Apresentação Acadêmica */}
      <div className="role-switcher">
        <button
          className={`role-btn ${currentUser.papel === 'COLABORADOR' ? 'active' : ''}`}
          onClick={() => switchProfile('COLABORADOR')}
          title="Ver sistema como Funcionário (Ana Beatriz - Eletricista)"
        >
          <User size={15} />
          Colaborador
        </button>
        <button
          className={`role-btn ${currentUser.papel === 'SUPERVISOR' ? 'active' : ''}`}
          onClick={() => switchProfile('SUPERVISOR')}
          title="Ver sistema como Supervisor (Roberto Mendes)"
        >
          <ShieldAlert size={15} />
          Supervisor
        </button>
        <button
          className={`role-btn ${currentUser.papel === 'ADMIN' ? 'active' : ''}`}
          onClick={() => switchProfile('ADMIN')}
          title="Ver sistema como Admin/Almoxarife (Carlos Silva)"
        >
          <Award size={15} />
          Admin / Almoxarife
        </button>
      </div>

      {/* Usuário Atual e Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right', display: 'none', minWidth: '140px' }} className="user-badge-desktop">
          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentUser.nome}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Matrícula: {currentUser.matricula}
          </div>
        </div>

        <button 
          onClick={resetarDados} 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
          title="Restaurar dados originais de teste"
        >
          <RotateCcw size={14} />
          Reset Demo
        </button>
      </div>
    </header>
  );
};
