
import { Routes, Route, Navigate } from 'react-router';

import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkerSetup from './pages/WorkerSetup';

function App() {
  return (
    <Routes>
      {/* Send users to login when they first visit */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Authentication pages */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Dashboard and worker profile setup */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/worker-setup" element={<WorkerSetup />} />

      {/* Redirect unknown URLs back to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
