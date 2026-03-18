import './styles/index.css';
import './styles/layout.css';
import './styles/buttons.css';
import './styles/cards.css';
import './styles/forms.css';
import './styles/tables.css';
import './styles/utils.css';
import './styles/animations.css';
import './styles/onboarding.css';
import './styles/auth.css';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './contexts/AuthProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PublicRoute from './components/layout/PublicRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmailVerification from './pages/EmailVerification';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import History from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<Signup />} />
              <Route path='/verify-email' element={<EmailVerification />} />
              <Route path='/onboarding' element={<Onboarding />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/settings' element={<Settings />} />
                <Route path='/history' element={<History />} />
                {/* Default redirect */}
                <Route
                  path='/'
                  element={<Navigate to='/dashboard' replace />}
                />
              </Route>
            </Route>

            {/* Catch all */}
            <Route path='*' element={<Navigate to='/login' replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
