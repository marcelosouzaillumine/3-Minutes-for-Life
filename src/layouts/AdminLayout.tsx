import { useEffect, useState } from 'react';
import { AdminService } from '../services/AdminService';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminDevotionals } from '../pages/admin/AdminDevotionals';
import { AdminTranslations } from '../pages/admin/AdminTranslations';
import { AdminBottomNav } from '../components/AdminBottomNav';
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
      <div className="app-container">
        <main className="content-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="admin-spinner"></div>
          <p style={{ color: 'var(--color-text-light)' }}>Verificando credenciais de acesso...</p>
        </main>
      </div>
    );
  }

  if (!isAdmin) return null; // Redirects before this

  const renderAdminContent = () => {
    if (pathname === '/admin/dashboard' || pathname === '/admin') {
      return <AdminDashboard />;
    }
    
    if (pathname === '/admin/devotionals') {
      return <AdminDevotionals />;
    }

    if (pathname === '/admin/translations') {
      return <AdminTranslations />;
    }
    
    if (pathname === '/admin/testimonials') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Testemunhos</h2>
          <p style={{ color: 'var(--color-text-light)' }}>Em breve: Moderação de Testemunhos</p>
        </div>
      );
    }
    
    if (pathname === '/admin/users') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Comunidade</h2>
          <p style={{ color: 'var(--color-text-light)' }}>Em breve: Diretório de Usuários</p>
        </div>
      );
    }

    return <AdminDashboard />;
  };

  return (
    <div className="app-container">
      <main className="content-area">
        {renderAdminContent()}
      </main>
      <AdminBottomNav />
    </div>
  );
}
