import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import axios from 'axios';
import CustomerForm from '../components/CustomerForm';
import CustomerList from '../components/CustomerList';
import PTCustomerForm from '../components/PTCustomerForm';
import PTCustomerList from '../components/PTCustomerList';
import ReminderForm from '../components/ReminderForm';
import ReminderList from '../components/ReminderList';
import ArchivedCustomerList from '../components/ArchivedCustomerList';
import { isAuthenticated, getUser, clearAuth, getAuthHeaders } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function Home() {
  const router = useRouter();
  const [basicCustomers, setBasicCustomers] = useState([]);
  const [ptCustomers, setPTCustomers] = useState([]);
  const [pendingReminders, setPendingReminders] = useState([]);
  const [completedReminders, setCompletedReminders] = useState([]);
  const [archivedCustomers, setArchivedCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set mounted flag to prevent hydration mismatch
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:mounted-set',message:'Setting mounted and isClient to true',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    setIsClient(true);
    setMounted(true);
  }, []);

  // Check authentication on mount (only on client)
  useEffect(() => {
    if (!mounted) return;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:auth-check-entry',message:'Checking authentication on mount',data:{apiUrl:API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const authStatus = isAuthenticated();
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:auth-check-result',message:'Authentication check result',data:{isAuthenticated:authStatus,hasToken:!!token,tokenPreview:token?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!authStatus) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:redirect-to-login',message:'Not authenticated, redirecting to login',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      router.push('/login');
      return;
    }
    const userData = getUser();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:user-set',message:'User data retrieved',data:{hasUser:!!userData,username:userData?.username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    setUser(userData);
  }, [router, mounted]);

  const fetchBasicCustomers = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:fetchBasicCustomers-entry',message:'Fetching basic customers',data:{url:`${API_URL}/customers/basic`,headers:getAuthHeaders()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const res = await axios.get(`${API_URL}/customers/basic`, { headers: getAuthHeaders() });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:fetchBasicCustomers-success',message:'Basic customers fetched',data:{count:res.data.length,status:res.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setBasicCustomers(res.data);
      setError(null);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:fetchBasicCustomers-error',message:'Error fetching basic customers',data:{error:error.message,status:error.response?.status,url:`${API_URL}/customers/basic`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.error('Error fetching basic customers:', error);
      if (error.response?.status === 401) {
        clearAuth();
        router.push('/login');
      } else {
        setError('Failed to load customers. Make sure the backend server is running.');
      }
    }
  };

  const fetchPTCustomers = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:fetchPTCustomers-entry',message:'Fetching PT customers',data:{url:`${API_URL}/customers/pt`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const res = await axios.get(`${API_URL}/customers/pt`, { headers: getAuthHeaders() });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:fetchPTCustomers-success',message:'PT customers fetched',data:{count:res.data.length,status:res.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setPTCustomers(res.data);
      setError(null);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:fetchPTCustomers-error',message:'Error fetching PT customers',data:{error:error.message,status:error.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.error('Error fetching PT customers:', error);
      if (error.response?.status === 401) {
        clearAuth();
        router.push('/login');
      } else {
        setError('Failed to load PT customers. Make sure the backend server is running.');
      }
    }
  };

  const fetchPendingReminders = async () => {
    try {
      const res = await axios.get(`${API_URL}/reminders/pending`, { headers: getAuthHeaders() });
      setPendingReminders(res.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching pending reminders:', error);
      if (error.response?.status === 401) {
        clearAuth();
        router.push('/login');
      } else {
        setError('Failed to load reminders. Make sure the backend server is running.');
      }
    }
  };

  const fetchCompletedReminders = async () => {
    try {
      const res = await axios.get(`${API_URL}/reminders/completed`, { headers: getAuthHeaders() });
      setCompletedReminders(res.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching completed reminders:', error);
      if (error.response?.status === 401) {
        clearAuth();
        router.push('/login');
      } else {
        setError('Failed to load completed reminders. Make sure the backend server is running.');
      }
    }
  };

  const fetchArchivedCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/customers/archived`, { headers: getAuthHeaders() });
      setArchivedCustomers(res.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching archived customers:', error);
      if (error.response?.status === 401) {
        clearAuth();
        router.push('/login');
      } else {
        setError('Failed to load archived customers. Make sure the backend server is running.');
      }
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:data-load-entry',message:'Starting data load',data:{isAuth:isAuthenticated(),apiUrl:API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    if (!isAuthenticated()) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchBasicCustomers(), fetchPTCustomers(), fetchPendingReminders(), fetchCompletedReminders(), fetchArchivedCustomers()]);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:data-load-success',message:'Data loaded successfully',data:{basicCount:basicCustomers.length,ptCount:ptCustomers.length,pendingCount:pendingReminders.length,completedCount:completedReminders.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:data-load-error',message:'Data load failed',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } finally {
        setLoading(false);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:loading-set-false',message:'Loading set to false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      }
    };
    loadData();
  }, [mounted]);

  const handleBasicCustomerUpdate = () => {
    fetchBasicCustomers();
    fetchArchivedCustomers();
  };

  const handlePTCustomerUpdate = () => {
    fetchPTCustomers();
    fetchArchivedCustomers();
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const handleReminderUpdate = () => {
    fetchPendingReminders();
    fetchCompletedReminders();
    fetchBasicCustomers();
    fetchPTCustomers();
  };

  const handleArchivedUpdate = () => {
    fetchArchivedCustomers();
    fetchBasicCustomers();
    fetchPTCustomers();
  };

  // Prevent hydration mismatch - return null on server, loading on client until mounted
  // This ensures server and client render the same thing initially (nothing)
  if (!isClient) {
    return null;
  }

  if (!mounted) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:render-not-mounted',message:'Not mounted yet, returning loading',data:{mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return (
      <div className="container">
        <div className="loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Only check authentication after component is mounted (client-side only)
  if (!isAuthenticated()) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:render-check',message:'Not authenticated in render, returning null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return null; // Will redirect to login
  }

  if (loading) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:render-loading',message:'Rendering loading state',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return (
      <div className="container" suppressHydrationWarning>
        <div className="loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const allCustomers = [...basicCustomers, ...ptCustomers];

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/18f6da49-6ee8-4649-abc9-c0e542b9745c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.jsx:render-main',message:'Rendering main dashboard',data:{basicCount:basicCustomers.length,ptCount:ptCustomers.length,pendingCount:pendingReminders.length,completedCount:completedReminders.length,activeTab,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

  return (
    <div className="container" suppressHydrationWarning>
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Customer CRM</h1>
            <p className="subtitle">Manage your customers and track follow-ups</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ marginBottom: '5px' }}>Welcome, {user?.full_name || user?.username}</p>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          Basic Customers
        </button>
        <button 
          className={`tab ${activeTab === 'pt' ? 'active' : ''}`}
          onClick={() => setActiveTab('pt')}
        >
          PT Customers
        </button>
        <button 
          className={`tab ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          Reminders 
          {pendingReminders.length > 0 && (
            <span className="badge badge-warning">{pendingReminders.length}</span>
          )}
        </button>
        <button 
          className={`tab ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived
          {archivedCustomers.length > 0 && (
            <span className="badge badge-secondary">{archivedCustomers.length}</span>
          )}
        </button>
      </div>

      <main className="main-content">
        {activeTab === 'basic' && (
          <>
            <CustomerForm onAdd={handleBasicCustomerUpdate} />
            <CustomerList customers={basicCustomers} onUpdate={handleBasicCustomerUpdate} />
          </>
        )}

        {activeTab === 'pt' && (
          <>
            <PTCustomerForm onAdd={handlePTCustomerUpdate} />
            <PTCustomerList customers={ptCustomers} onUpdate={handlePTCustomerUpdate} />
          </>
        )}

        {activeTab === 'reminders' && (
          <>
            <ReminderForm customers={allCustomers} onAdd={handleReminderUpdate} />
            <ReminderList 
              pendingReminders={pendingReminders} 
              completedReminders={completedReminders} 
              onUpdate={handleReminderUpdate} 
            />
          </>
        )}

        {activeTab === 'archived' && (
          <ArchivedCustomerList 
            customers={archivedCustomers} 
            onUpdate={handleArchivedUpdate} 
          />
        )}
      </main>
    </div>
  );
}

// Disable SSR to prevent hydration errors with localStorage
// Use a loading component that matches what we render when not mounted
const LoadingPlaceholder = () => (
  <div className="container">
    <div className="loading">
      <p>Loading...</p>
    </div>
  </div>
);

export default dynamic(() => Promise.resolve(Home), { 
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

