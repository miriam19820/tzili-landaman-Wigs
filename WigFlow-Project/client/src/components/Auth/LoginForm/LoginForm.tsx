import React, { useState } from 'react';
import axios from 'axios';
import './LoginForm.css';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/users/login', {
        username,
        password
      });

      // 1. שמירת הטוקן ופרטי המשתמש בדפדפן (localStorage)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // 2. ניתוב חכם לפי תפקיד (Role)
      const role = response.data.user.role;
      if (role === 'Admin' || role === 'Secretary') {
        window.location.href = '/'; // המזכירה הולכת למסך הראשי
      } else if (role === 'Worker') {
        window.location.href = '/production'; // עובדת הולכת לפס הייצור
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'שם משתמש או סיסמה שגויים. אנא נסי שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" dir="rtl">
      <div className="login-box">
        <h2>WigFlow</h2>
        <p>התחברות למערכת ניהול הסלון</p>
        
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <label>שם משתמש:</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="הזיני שם משתמש"
              required 
            />
          </div>

          <div className="input-group">
            <label>סיסמה:</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="הזיני סיסמה"
              required 
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'מתחבר...' : 'כניסה למערכת'}
          </button>
        </form>
      </div>
    </div>
  );
};