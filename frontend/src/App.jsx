import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { applyEnergyTheme } from './lib/theme';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import PlannerPage from './pages/PlannerPage';
import AnalysisPage from './pages/AnalysisPage';
import FocusPage from './pages/FocusPage';
import TaskPage from './pages/TaskPage';
import ExamPage from './pages/ExamPage';
import { useBrowserNotifications } from './lib/useBrowserNotifications';

function NotificationWatcher() {
  useBrowserNotifications();
  return null;
}

// Sync ambient energy accents to the student's cognitive battery.
function EnergyThemeSync() {
  const { energyCheckins } = useApp();
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const check = energyCheckins.find((c) => c.created_at && c.created_at.slice(0, 10) === today);
    const level = !check ? 'med' : check.energy_level >= 7 ? 'high' : check.energy_level <= 3 ? 'low' : 'med';
    applyEnergyTheme(level);
  }, [energyCheckins]);
  return null;
}

function PrivateRoute({ children }) {
  const { loadingAuth, session } = useApp();
  if (loadingAuth) return <LoadingScreen />;
  return session ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { loadingAuth, session } = useApp();
  if (loadingAuth) return <LoadingScreen />;
  return session ? <Navigate to="/" replace /> : children;
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-ink">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-lighter border-t-transparent" />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NotificationWatcher />
      <EnergyThemeSync />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/task/:id"
            element={
              <PrivateRoute>
                <TaskPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/exam/:id?"
            element={
              <PrivateRoute>
                <ExamPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <PrivateRoute>
                <CalendarPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <PrivateRoute>
                <PlannerPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <PrivateRoute>
                <AnalysisPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/focus"
            element={
              <PrivateRoute>
                <FocusPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <PrivateRoute>
                <StatsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}