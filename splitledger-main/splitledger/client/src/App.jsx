import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Expenses from './pages/Expenses';
import Splits from './pages/Splits';
import Insights from './pages/Insights';
import Feed from './pages/Feed';
import Friends from './pages/Friends';
import Auth from './pages/Auth';
import { AuthProvider, AuthContext } from './context/AuthContext';

function AppContent() {
  const { currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/splits" element={<Splits />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
