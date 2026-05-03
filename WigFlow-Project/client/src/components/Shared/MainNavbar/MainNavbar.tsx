import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../../assets/images/zili-logo.png';
import './MainNavbar.css';

export const MainNavbar: React.FC = () => {
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isActive = (path: string) =>
    location.pathname === path ? 'nav-link active' : 'nav-link';

  const isAdmin = user?.role === 'Admin' || user?.role === 'Secretary';
  
  const isQAWorker = user?.role === 'QC' || user?.role === 'Inspector' || 
                     user?.specialty?.includes('בקר') || user?.specialty?.includes('איכות');
  
  const isRegularWorker = user?.role === 'Worker' && !isQAWorker;

  const roleLabel: Record<string, string> = {
    Admin: 'מנהלת',
    Worker: 'עובדת',
    Secretary: 'מזכירה',
    QC: 'בקרת איכות',
    Inspector: 'מבקרת'
  };

  return (
    <nav className="zili-navbar" dir="rtl">
      <Link to="/" className="navbar-brand">
        <img src={logo} alt="zili" className="navbar-logo-img" />
      </Link>

      <div className="navbar-links">
        
        {/* תפריט מנהלת - כולל הכל */}
        {isAdmin && (
          <>
            <Link to="/" className={isActive('/')}>הזמנת פאה</Link>
            <Link to="/repairs/new" className={isActive('/repairs/new')}>קבלת תיקון</Link>
            <Link to="/service/new" className={isActive('/service/new')}>הזמנת שירות</Link>
            <Link to="/dashboard" className={isActive('/dashboard')}>דאשבורד</Link>
            <Link to="/history" className={isActive('/history')}>היסטוריה</Link>
            <Link to="/production" className={isActive('/production')}>תחנת עבודה</Link>
            <Link to="/qa" className={isActive('/qa')}>בקרת איכות</Link>
          </>
        )}
        
        {/* תפריט עובדת ייצור/תיקונים - רק תחנת עבודה מאוחדת */}
        {isRegularWorker && !isAdmin && (
          <>
            <Link to="/production" className={isActive('/production')}>תחנת עבודה</Link>
          </>
        )}

        {/* תפריט מבקרת (כמו רחלי) - רק בקרת איכות */}
        {isQAWorker && !isAdmin && (
          <Link to="/qa" className={isActive('/qa')}>בקרת איכות</Link>
        )}

      </div>

      <div className="navbar-user">
        <div className="navbar-user-info">
          <div className="navbar-user-name">{user?.username}</div>
          <div className="navbar-user-role">{roleLabel[user?.role] || user?.role}</div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>יציאה</button>
      </div>
    </nav>
  );
};