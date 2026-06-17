import React, { useState } from 'react';
import axios from 'axios';
import logo from '../../../assets/images/zili-logo.png';
import './LoginForm.css';

axios.defaults.baseURL = 'http://localhost:5000/api';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/users/login', {
        username,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // הניתוב החכם אחרי ההתחברות
      if (user.role === 'Admin') {
        window.location.href = '/'; 
      } else if (user.role === 'Worker') {
        // אם מדובר ברחלי או כל עובדת בקרה - ניתוב ישיר ללוח הבקרה
        if (user.specialty?.includes('בקר') || user.specialty?.includes('איכות')) {
           window.location.href = '/qa';
        } else {
           window.location.href = '/repairs/tasks'; 
        }
      } else if (user.role === 'QC' || user.role === 'Inspector') {
        window.location.href = '/qa'; 
      } else {
        window.location.href = '/';
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בהתחברות.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" dir="rtl">
      <div className="login-box">
        <div className="login-brand">
          <img src={logo} alt="zili" className="login-logo-img" />
          <span className="login-subtitle">מערכת ניהול סלון פאות</span>
          <div className="login-divider" />
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>שם משתמש</label>
            <input
              className="zili-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="הקלידי שם משתמש"
              required
            />
          </div>

          <div className="form-group">
            <label>סיסמה</label>
            <div className="password-field">
              <input
                className="zili-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הקלידי סיסמה"
                required
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'מתחבר...' : 'כניסה למערכת'}
          </button>
        </form>
      </div>
    </div>
  );
};