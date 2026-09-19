import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { LoginPage } from '../pages/login-page';
import { RegisterPage } from '../pages/register-page';
import { Home } from '../pages/home';
import { useAuthStore } from '../store/auth.store';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage
              onNavigateToRegister={() => navigate('/register')}
              onLoginSuccess={() => navigate('/')}
            />
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <RegisterPage onNavigateToLogin={() => navigate('/login')} />
          )
        }
      />

      <Route
        path="/"
        element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const refreshAuth = useAuthStore((state) => state.refreshAuth);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        await refreshAuth();
      } catch {
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, [refreshAuth]);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-600 dark:text-neutral-400" />
          <p className="text-sm font-medium text-neutral-500">
            Đang khôi phục phiên làm việc...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
