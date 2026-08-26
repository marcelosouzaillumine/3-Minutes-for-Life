export function AdminBottomNav() {

  const pathname =
    window.location.pathname;

  return (
    <nav className="bottom-nav">

      {/* =================================================
                VOLTAR PARA O APP
            ================================================= */}

      <a
        href="/app"
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

      </a>

      {/* =================================================
                DASHBOARD
            ================================================= */}

      <a
        href="/admin/dashboard"
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

      </a>

      {/* =================================================
                CONTEÚDO
            ================================================= */}

      <a
        href="/admin/devotionals"
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

      </a>

      {/* =================================================
                TRADUÇÕES
            ================================================= */}

      <a
        href="/admin/translations"
        className={`nav-item ${pathname.includes('/translations')
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
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>

        Traduções

      </a>

      {/* =================================================
                RELACIONAMENTO
            ================================================= */}

      <a
        href="/admin/relationship"
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

        Relacionamento

      </a>

      {/* =================================================
                COMUNICAÇÃO
            ================================================= */}

      <a
        href="/admin/communication"
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

      </a>

      {/* =================================================
                USUÁRIOS
            ================================================= */}

      <a
        href="/admin/users"
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

      </a>

      {/* =================================================
                APOIADORES
            ================================================= */}

      <a
        href="/admin/supporters"
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

      </a>

      {/* =================================================
                IDENTIDADE
            ================================================= */}

      <a
        href="/admin/identity"
        className={`nav-item ${pathname.includes('/identity')
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
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>

        Identidade

      </a>

    </nav>
  );
}