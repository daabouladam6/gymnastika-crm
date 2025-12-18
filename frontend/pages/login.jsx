import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.jsx:component-mount',message:'Login page mounted',data:{apiUrl:API_URL,hasRouter:!!router},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, []);
  // #endregion

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.jsx:handleSubmit-entry',message:'Login form submitted',data:{username:formData.username,apiUrl:API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.jsx:before-api-call',message:'About to call login API',data:{url:`${API_URL}/auth/login`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      const response = await axios.post(`${API_URL}/auth/login`, formData);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.jsx:api-success',message:'Login API call successful',data:{hasToken:!!response.data.token,hasUser:!!response.data.user,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      const { token, user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.jsx:before-redirect',message:'Token stored, about to redirect',data:{tokenLength:token.length,username:user.username,storedToken:localStorage.getItem('authToken')?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.jsx:api-error',message:'Login API call failed',data:{errorMessage:error.message,statusCode:error.response?.status,responseData:error.response?.data,url:`${API_URL}/auth/login`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Customer CRM</h1>
        <p className="subtitle">Employee Login</p>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

