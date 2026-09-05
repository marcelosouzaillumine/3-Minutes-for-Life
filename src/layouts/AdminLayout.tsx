import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AdminService } from '../services/AdminService';

// Lazy-loaded: the admin section (TipTap editor, recharts, the 2900-line
// campaign editor, etc.) is a large chunk of the app's JS that only admins
// ever need. Splitting it out of the main bundle keeps the public-facing
// app light for everyone else.
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminDevotionals = lazy(() => import('../pages/admin/AdminDevotionals').then(m => ({ default: m.AdminDevotionals })));
const AdminTranslations = lazy(() => import('../pages/admin/AdminTranslations').then(m => ({ default: m.AdminTranslations })));
const AdminIdentity = lazy(() => import('../pages/admin/AdminIdentity').then(m => ({ default: m.AdminIdentity })));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminSupporters = lazy(() => import('../pages/admin/AdminSupporters').then(m => ({ default: m.AdminSupporters })));

const RelationshipOverview = lazy(() => import('../pages/admin/relationship/RelationshipOverview').then(m => ({ default: m.RelationshipOverview })));
const RelationshipTestimonials = lazy(() => import('../pages/admin/relationship/RelationshipTestimonials').then(m => ({ default: m.RelationshipTestimonials })));
const RelationshipPrayerRequests = lazy(() => import('../pages/admin/relationship/RelationshipPrayerRequests').then(m => ({ default: m.RelationshipPrayerRequests })));

const CommunicationCenter = lazy(() => import('../components/admin/communication/CommunicationCenter'));

import { AdminBottomNav } from '../components/AdminBottomNav';

import '../styles/admin.css';

export function AdminLayout() {

  const [isChecking, setIsChecking] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  // =========================================================
  // ADMIN ACCESS
  // =========================================================

  useEffect(() => {

    const checkRole = async () => {

      const authorized =
        await AdminService.checkAdminRole();

      if (!authorized) {

        navigate('/app', { replace: true });

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

      return <AdminUsers />;

    }

    // -----------------------------------------------------
    // SUPPORTERS
    // -----------------------------------------------------

    if (
      pathname === '/admin/supporters'
    ) {

      return <AdminSupporters />;

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
    <div className="app-container admin-layout">

      <main className="content-area">
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
              }}
            >
              <div className="admin-spinner"></div>
            </div>
          }
        >
          {renderAdminContent()}
        </Suspense>
      </main>

      <AdminBottomNav />

    </div>
  );
}