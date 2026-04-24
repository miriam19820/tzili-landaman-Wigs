import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainNavbar } from './components/Shared/MainNavbar/MainNavbar';
import { WigHistorySearch } from './components/History/WigHistorySearch';
import { ProductionStation } from './components/NewWigs/ProductionStation/ProductionStation';
import { NewOrderForm } from './components/NewWigs/NewOrderForm/NewOrderForm';
import { LoginForm } from './components/Auth/LoginForm/LoginForm';
import { DiagnosisChecklist } from './components/Repairs/DiagnosisChecklist/DiagnosisChecklist';
import { RepairWorkerList } from './components/Repairs/RepairWorkerList/RepairWorkerList';
import { QuickCustomerRegister } from './components/Repairs/QuickCustomerRegister/QuickCustomerRegister';
import { ServiceOrderForm } from './components/ServicesAndQA/ServiceOrderForm/ServiceOrderForm';
import { QADashboard } from './components/ServicesAndQA/QADashboard/QADashboard';
import { MainOverviewTable } from './components/Dashboard/MainOverviewTable/MainOverviewTable';
import { WorkersLoadStatus } from './components/Dashboard/WorkersLoadStatus/WorkersLoadStatus';
import { TeamManagement } from './components/Dashboard/TeamManagement/TeamManagement';

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
      {token && <MainNavbar />}
      <div className="page-container">
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to={user?.role === 'Worker' ? '/repairs/tasks' : '/'} replace /> : <LoginForm />}
          />
          <Route path="/" element={<ProtectedRoute><NewOrderForm /></ProtectedRoute>} />
          <Route path="/production" element={<ProtectedRoute><ProductionStation /></ProtectedRoute>} />
          <Route path="/repairs/new" element={<ProtectedRoute><DiagnosisChecklist /></ProtectedRoute>} />
          <Route path="/repairs/quick-customer" element={<ProtectedRoute><QuickCustomerRegister /></ProtectedRoute>} />
          <Route path="/repairs/tasks" element={<ProtectedRoute><RepairWorkerList workerId={user?.id || user?._id || ''} /></ProtectedRoute>} />
          <Route path="/service/new" element={<ProtectedRoute><ServiceOrderForm /></ProtectedRoute>} />
          <Route path="/qa" element={<ProtectedRoute><QADashboard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><WigHistorySearch /></ProtectedRoute>} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="dashboard-layout">
                <TeamManagement />
                <div className="zili-card"><MainOverviewTable /></div>
                <WorkersLoadStatus />
              </div>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
