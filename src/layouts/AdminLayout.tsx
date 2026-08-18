import { useEffect, useState } from 'react';
import { AdminService } from '../services/AdminService';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import '../styles/admin.css';

export function AdminLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = window.location.pathname;

  useEffect(() => {
    const checkRole = async () => {
      const authorized = await AdminService.checkAdminRole();
      if (!authorized) {
        window.location.href = '/app';
      } else {
        setIsAdmin(true);
      }
      setIsChecking(false);
    };
    checkRole();
  }, []);

  if (isChecking) {
    return (
      <div className="admin-loading-state">
        <div className="admin-spinner"></div>
        <p>Verificando credenciais de acesso...</p>
      </div>
    );
  }

  if (!isAdmin) return null; // Redirects before this

  const renderAdminContent = () => {
    if (pathname === '/admin/dashboard' || pathname === '/admin') {
      return <AdminDashboard />;
    }
    
    // Future routes
    if (pathname === '/admin/devotionals') {
      return <div className="admin-empty-state">Em breve: Gestão de Conteúdo</div>;
    }
    
    if (pathname === '/admin/testimonials') {
      return <div className="admin-empty-state">Em breve: Moderação de Testemunhos</div>;
    }
    
    if (pathname === '/admin/users') {
      return <div className="admin-empty-state">Em breve: Diretório de Usuários</div>;
    }

    return <AdminDashboard />;
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>3M Admin</h2>
          <span className="admin-badge">Intelligence</span>
        </div>
        
        <nav className="admin-nav">
          <a href="/admin/dashboard" className={`admin-nav-item ${pathname.includes('/dashboard') || pathname === '/admin' ? 'active' : ''}`}>
            Dashboard
          </a>
          <a href="/admin/devotionals" className={`admin-nav-item ${pathname.includes('/devotionals') ? 'active' : ''}`}>
            Conteúdo
          </a>
          <a href="/admin/testimonials" className={`admin-nav-item ${pathname.includes('/testimonials') ? 'active' : ''}`}>
            Testemunhos
          </a>
          <a href="/admin/users" className={`admin-nav-item ${pathname.includes('/users') ? 'active' : ''}`}>
            Comunidade
          </a>
        </nav>

        <div className="admin-nav-footer">
          <a href="/app" className="admin-nav-item">← Voltar ao App</a>
        </div>
      </aside>

      <main className="admin-main">
        {renderAdminContent()}
      </main>
    </div>
  );
}
