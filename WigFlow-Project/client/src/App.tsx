import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

// ייבוא הקומפוננטות של פאות חדשות
import { ProductionStation } from './components/NewWigs/ProductionStation/ProductionStation';
import { NewOrderForm } from './components/NewWigs/NewOrderForm/NewOrderForm';
import { LoginForm } from './components/Auth/LoginForm/LoginForm';

// ייבוא קומפוננטות התיקונים
import { DiagnosisChecklist } from './components/Repairs/DiagnosisChecklist/DiagnosisChecklist';
import { RepairWorkerList } from './components/Repairs/RepairWorkerList/RepairWorkerList';

// === כאן החזרתי את הייבוא שחסר לך ===
import { QuickCustomerRegister } from './components/Repairs/QuickCustomerRegister';

// ייבוא קומפוננטות שירות ובקרת איכות
import { ServiceOrderForm } from './components/ServicesAndQA/ServiceOrderForm/ServiceOrderForm';
import { QADashboard } from './components/ServicesAndQA/QADashboard/QADashboard';

// ייבוא קומפוננטות הדאשבורד
import { MainOverviewTable } from './components/Dashboard/MainOverviewTable';
import { WorkersLoadStatus } from './components/Dashboard/WorkersLoadStatus/WorkersLoadStatus';

const Navigation = () => {
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const linkStyle = (path: string) => ({
    padding: '10px 20px', 
    color: 'white', 
    border: 'none', 
    borderRadius: '5px', 
    textDecoration: 'none',
    backgroundColor: location.pathname === path ? '#6f42c1' : '#6c757d',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  });

  return (
    <nav style={{ padding: '20px', backgroundColor: '#f5f5f5', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {(user?.role === 'Admin' || user?.role === 'Secretary') && (
          <>
            <Link to="/" style={linkStyle('/')}>הזמנת פאה חדשה</Link>
            <Link to="/repairs/new" style={linkStyle('/repairs/new')}>קבלת פאה לתיקון</Link>
            <Link to="/service/new" style={linkStyle('/service/new')}>הזמנת שירות</Link>
            <Link to="/dashboard" style={linkStyle('/dashboard')}>דאשבורד עומס</Link>
          </>
        )}
        <Link to="/production" style={linkStyle('/production')}>תחנת ייצור</Link>
        <Link to="/repairs/tasks" style={linkStyle('/repairs/tasks')}>תחנת תיקונים</Link>
        {(user?.role === 'Admin' || user?.role === 'Inspector') && (
          <Link to="/qa" style={linkStyle('/qa')}>בקרת איכות (QA)</Link>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontWeight: 'bold' }}>שלום, {user?.username}</span>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>התנתק</button>
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  return (
    <Router>
      <div className="App" dir="rtl" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
        {token && <h1 style={{ textAlign: 'center', color: '#6f42c1', marginTop: '20px' }}>מערכת WigFlow ✂️</h1>}
        {token && <Navigation />}
        <div style={{ padding: '0 20px' }}>
          <Routes>
            <Route path="/login" element={token ? <Navigate to={user?.role === 'Worker' ? "/repairs/tasks" : "/"} replace /> : <LoginForm />} />
            <Route path="/" element={<ProtectedRoute><NewOrderForm /></ProtectedRoute>} />
            <Route path="/production" element={<ProtectedRoute><ProductionStation /></ProtectedRoute>} />
            <Route path="/repairs/new" element={<ProtectedRoute><DiagnosisChecklist /></ProtectedRoute>} />
            
            {/* === כאן החזרתי את הנתיב שחסר לך === */}
            <Route path="/repairs/quick-customer" element={<ProtectedRoute><QuickCustomerRegister /></ProtectedRoute>} />
            
            <Route path="/repairs/tasks" element={<ProtectedRoute><RepairWorkerList workerId={user?.id || user?._id || ''} /></ProtectedRoute>} />
            <Route path="/service/new" element={<ProtectedRoute><ServiceOrderForm /></ProtectedRoute>} />
            <Route path="/qa" element={<ProtectedRoute><QADashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><div><MainOverviewTable /><WorkersLoadStatus /></div></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;