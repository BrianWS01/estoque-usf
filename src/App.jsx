import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { ColaboradorView } from './components/ColaboradorView';
import { SupervisorView } from './components/SupervisorView';
import { AdminView } from './components/AdminView';

const MainLayout = () => {
  const { currentUser, isAuthenticated, notification } = useAuth();

  return (
    <div className="app-container">
      <Navbar />

      {/* Banner de Notificação Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: notification.type === 'danger' ? '#ef4444' : notification.type === 'success' ? '#10b981' : notification.type === 'warning' ? '#f59e0b' : '#3b82f6',
          color: '#000',
          padding: '0.9rem 1.4rem',
          borderRadius: 'var(--radius-md)',
          fontWeight: 700,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <span>{notification.type === 'danger' ? '❌' : notification.type === 'success' ? '✅' : 'ℹ️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Renderização Condicional: Login ou Visão por Papel RBAC */}
      <main className="main-content">
        {!isAuthenticated || !currentUser ? (
          <LoginView />
        ) : (
          <>
            {currentUser.papel === 'COLABORADOR' && <ColaboradorView />}
            {currentUser.papel === 'SUPERVISOR' && <SupervisorView />}
            {currentUser.papel === 'ADMIN' && <AdminView />}
          </>
        )}
      </main>

      {/* Rodapé Acadêmico Personalizado - USF */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        fontSize: '0.825rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-glass)'
      }}>
        Projeto Acadêmico - Automação Inteligente no Almoxarifado (EPIs) &copy; 2026 | ATIVIDADE EXTENSIONISTA - USF
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
