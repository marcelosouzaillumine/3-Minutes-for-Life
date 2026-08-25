import { useEffect, useState } from 'react';

import { AdminService } from '../services/AdminService';

import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminDevotionals } from '../pages/admin/AdminDevotionals';
import { AdminTranslations } from '../pages/admin/AdminTranslations';
import { AdminIdentity } from '../pages/admin/AdminIdentity';

import { RelationshipOverview } from '../pages/admin/relationship/RelationshipOverview';
import { RelationshipTestimonials } from '../pages/admin/relationship/RelationshipTestimonials';
import { RelationshipPrayerRequests } from '../pages/admin/relationship/RelationshipPrayerRequests';

import CommunicationCenter from '../components/admin/communication/CommunicationCenter';

import { AdminBottomNav } from '../components/AdminBottomNav';

import '../styles/admin.css';

export function AdminLayout() {

  const [isChecking, setIsChecking] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const pathname =
    window.location.pathname;

  // =========================================================
  // ADMIN ACCESS
  // =========================================================

  useEffect(() => {

    const checkRole = async () => {

      const authorized =
        await AdminService.checkAdminRole();

      if (!authorized) {

        window.location.href =
          '/app';

      } else {

        setIsAdmin(true);

      }

      setIsChecking(false);
    };

    checkRole();

  }, []);

  // =========================================================
  // LOADING
  // =========================================================

  if (isChecking) {

    return (
      <div className="app-container">

        <main
          className="content-area"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >

          <div className="admin-spinner"></div>

          <p
            style={{
              color:
                'var(--color-text-light)',
            }}
          >
            Verificando credenciais
            de acesso...
          </p>

        </main>

      </div>
    );
  }

  // =========================================================
  // UNAUTHORIZED
  // =========================================================

  if (!isAdmin) {
    return null;
  }

  // =========================================================
  // ADMIN CONTENT
  // =========================================================

  const renderAdminContent = () => {

    // -----------------------------------------------------
    // DASHBOARD
    // -----------------------------------------------------

    if (
      pathname === '/admin/dashboard' ||
      pathname === '/admin'
    ) {

      return <AdminDashboard />;

    }

    // -----------------------------------------------------
    // DEVOTIONALS
    // -----------------------------------------------------

    if (
      pathname === '/admin/devotionals'
    ) {

      return <AdminDevotionals />;

    }

    // -----------------------------------------------------
    // TRANSLATIONS
    // -----------------------------------------------------

    if (
      pathname === '/admin/translations'
    ) {

      return <AdminTranslations />;

    }

    // -----------------------------------------------------
    // COMMUNICATION
    // -----------------------------------------------------

    if (
      pathname === '/admin/communication'
    ) {

      return <CommunicationCenter />;

    }

    // -----------------------------------------------------
    // RELATIONSHIP — OVERVIEW
    // -----------------------------------------------------

    if (
      pathname === '/admin/relationship' ||
      pathname === '/admin/relationship/overview'
    ) {

      return <RelationshipOverview />;

    }

    // -----------------------------------------------------
    // RELATIONSHIP — TESTIMONIALS
    // -----------------------------------------------------

    if (
      pathname === '/admin/relationship/testimonials' ||
      pathname === '/admin/testimonials'
    ) {

      return <RelationshipTestimonials />;

    }

    // -----------------------------------------------------
    // RELATIONSHIP — PRAYER REQUESTS
    // -----------------------------------------------------

    if (
      pathname === '/admin/relationship/prayer-requests'
    ) {

      return <RelationshipPrayerRequests />;

    }

    // -----------------------------------------------------
    // IDENTITY / TELEMETRY
    // -----------------------------------------------------

    if (
      pathname === '/admin/identity' ||
      pathname === '/admin/telemetry'
    ) {

      return <AdminIdentity />;

    }

    // -----------------------------------------------------
    // USERS
    // -----------------------------------------------------

    if (
      pathname === '/admin/users'
    ) {

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >

          <h2
            style={{
              fontSize: '1.5rem',
              marginBottom: '8px',
            }}
          >
            Comunidade
          </h2>

          <p
            style={{
              color:
                'var(--color-text-light)',
            }}
          >
            Em breve: Diretório de
            Usuários
          </p>

        </div>
      );

    }

    // -----------------------------------------------------
    // FALLBACK
    // -----------------------------------------------------

    return <AdminDashboard />;
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="app-container">

      <main className="content-area">
        {renderAdminContent()}
      </main>

      <AdminBottomNav />

    </div>
  );
}