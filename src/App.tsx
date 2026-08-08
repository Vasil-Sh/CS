import { lazy, Suspense, type ComponentType } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Eagerly loaded (small / critical path)
import Landing from "@/pages/Landing";
import LoginPage from "@/pages/LoginPage";

// ── Safe lazy wrapper — catches module import errors and shows which
//     component failed instead of crashing with "object to primitive".
function safeLazy(
  name: string,
  importFn: () => Promise<{ default: ComponentType<unknown> }>,
) {
  return lazy(() =>
    importFn().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err ?? "");
      console.error(`[lazy] Failed to import ${name}:`, msg);
      return {
        default: (() => (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-8 bg-white rounded-2xl border border-red-200 shadow-sm max-w-md">
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Не вдалося завантажити: {name}
              </h3>
              <p className="text-sm text-gray-500 mb-4 font-mono break-all">
                {msg}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
              >
                Оновити сторінку
              </button>
            </div>
          </div>
        )) as unknown as ComponentType<unknown>,
      };
    }),
  );
}

// Lazy-loaded with safe wrapper (shows which module fails)
const Layout = safeLazy("Layout", () => import("@/components/Layout"));
const Analytics = safeLazy("Analytics", () => import("@/pages/Analytics"));
const Matches = safeLazy("Matches", () => import("@/pages/Matches"));
const Profile = safeLazy("Profile", () => import("@/pages/Profile"));
const MyBets = safeLazy("MyBets", () => import("@/pages/MyBets"));
const Strategy = safeLazy("Strategy", () => import("@/pages/Strategy"));
const RiskyTeams = safeLazy("RiskyTeams", () => import("@/pages/RiskyTeams"));
const TelegramPage = safeLazy("TelegramPage", () => import("@/pages/Telegram"));
const NotFound = safeLazy("NotFound", () => import("@/pages/NotFound"));
const PublicProfile = safeLazy(
  "PublicProfile",
  () => import("@/pages/PublicProfile"),
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <Landing />
              </ErrorBoundary>
            }
          />
          <Route
            path="/login"
            element={
              <ErrorBoundary>
                <LoginPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/login-digesto-demo"
            element={
              <ErrorBoundary>
                <LoginPage demo />
              </ErrorBoundary>
            }
          />

          {/* Public profile — shareable stats */}
          <Route
            path="/user/:username"
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <PublicProfile />
                </Suspense>
              </ErrorBoundary>
            }
          />

          {/* Protected routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <Layout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Navigate to="/app/matches" replace />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="analytics"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Analytics />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="matches"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Matches />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="profile"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Profile />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="my-bets"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <MyBets />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="strategy"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Strategy />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="risky-teams"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <RiskyTeams />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="telegram"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <TelegramPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
          </Route>

          {/* 404 catch-all */}
          <Route
            path="*"
            element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              </ErrorBoundary>
            }
          />
        </Routes>
        <Toaster position="top-center" richColors closeButton duration={4000} />
      </Router>
    </HelmetProvider>
  );
}
