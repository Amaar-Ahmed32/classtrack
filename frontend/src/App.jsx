// Routes: /login is public; everything else requires a logged-in teacher.
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Nav from './components/Nav';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Attendance from './pages/Attendance';
import Register from './pages/Register';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-6 text-center text-gray-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/classes" element={<Protected><Classes /></Protected>} />
        <Route path="/attendance" element={<Protected><Attendance /></Protected>} />
        <Route path="/register" element={<Protected><Register /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
