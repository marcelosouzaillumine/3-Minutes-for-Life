import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AdminService } from '../services/AdminService';

export function AdminBottomNav() {

  const { pathname } = useLocation();
  const [isFullAdmin, setIsFullAdmin] = useState(false);

  useEffect(() => {
    AdminService.isFullAdmin().then(setIsFullAdmin).catch(() => setIsFullAdmin(false));
  }, []);

  return (
    <nav className="bottom-nav">

      {/* =================================================
                VOLTAR PARA O APP
            ================================================= */}

      <Link
        to="/app"
        className="nav-item"
        style={{
          textDecoration: 'none',
        }}
      >

        <svg
          className="nav-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>

        Voltar

      </Link>

      {/* =================================================
                DASHBOARD
            ================================================= */}

      <Link
        to="/admin/dashboard"
        className={`nav-item ${pathname.includes('/dashboard') ||
            pathname === '/admin'
            ? 'active'
            : ''
          }`}
        style={{
          textDecoration: 'none',
        }}
      >

        <svg
          className="nav-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>

        Dashboard

      </Link>

      {/* =================================================
                CONTEÚDO
            ================================================= */}

      <Link
        to="/admin/devotionals"
        className={`nav-item ${pathname.includes('/devotionals')
            ? 'active'
            : ''
          }`}
        style={{
          textDecoration: 'none',
        }}
      >

        <svg
          className="nav-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>

        Conteúdo

      </Link>

      {/* =================================================
                RELACIONAMENTO
            ================================================= */}

      <Link
        to="/admin/relationship"
        className={`nav-item ${pathname.includes('/relationship') ||
            pathname.includes('/testimonials')
            ? 'active'
            : ''
          }`}
        style={{
          textDecoration: 'none',
        }}
      >

        <svg
          className="nav-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>

        Pastoral

      </Link>

      {/* =================================================
                COMUNICAÇÃO
            ================================================= */}

      <Link
        to="/admin/communication"
        className={`nav-item ${pathname.includes('/communication')
            ? 'active'
            : ''
          }`}
        style={{
          textDecoration: 'none',
        }}
      >

        <svg
          className="nav-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 014 11.5a8.5 8.5 0 0114.9-5.6A8.38 8.38 0 0121 11.5z"
          />
        </svg>

        Comunicação

      </Link>

      {/* =================================================
                USUÁRIOS
            ================================================= */}

      <Link
        to="/admin/users"
        className={`nav-item ${pathname.includes('/users')
            ? 'active'
            : ''
          }`}
        style={{
          textDecoration: 'none',
        }}
      >

        <svg
          className="nav-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        Usuários

      </Link>

      {/* =================================================
                APOIADORES
            ================================================= */}

      <Link
        to="/admin/supporters"
        className={`nav-item ${pathname.includes('/supporters')
            ? 'active'
            : ''
          }`}
        style={{
          textDecoration: 'none',
        }}
      >

        <svg
          className="nav-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm-7 5h14M5 12a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>

        Apoiadores

      </Link>

      <Link
        to="/admin/kids"
        className={`nav-item ${pathname.includes('/kids') ? 'active' : ''}`}
        style={{ textDecoration: 'none' }}
      >
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>

        Planos
      </Link>

      {/* =================================================
                MÍDIA (só administradores)
            ================================================= */}

      {isFullAdmin && (
        <Link
          to="/admin/media"
          className={`nav-item ${pathname.includes('/media') ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          Mídia
        </Link>
      )}

    </nav>
  );
}