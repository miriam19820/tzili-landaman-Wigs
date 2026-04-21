import React, { useState } from 'react';
import axios from 'axios';
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

      if (user.role === 'Admin') {
        window.location.href = '/'; 
      } else if (user.role === 'Worker') {
        window.location.href = '/repairs/tasks'; 
      } else if (user.role === 'QC' || user.role === 'Inspector') {
        window.location.href = '/qa'; 
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
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזיני סיסמה"
                required 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'מתחבר...' : 'כניסה למערכת'}
          </button>
        </form>
      </div>
    </div>
  );
};