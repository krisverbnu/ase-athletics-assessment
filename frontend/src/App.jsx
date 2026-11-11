// The route map: which URL shows which page
import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import PlayerDetail from './pages/PlayerDetail';
import PlayerForm from './pages/PlayerForm';
import Players from './pages/Players';
import Register from './pages/Register';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Logged-in only: everything inside shares the sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ComingSoon title="Dashboard" />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/new" element={<PlayerForm />} />
          <Route path="/players/:id" element={<PlayerDetail />} />
          <Route path="/players/:id/edit" element={<PlayerForm />} />
          <Route path="/compare" element={<ComingSoon title="Compare players" />} />
          <Route path="/reports" element={<ComingSoon title="Scouting reports" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
