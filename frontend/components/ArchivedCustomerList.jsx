import { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { getAuthHeaders } from '../lib/auth';
import { getTrainerName } from '../lib/trainers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ArchivedCustomerList({ customers, onUpdate }) {
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  const handleRestore = async (id, name) => {
    if (!confirm(`Are you sure you want to restore ${name}?`)) {
      return;
    }

    setLoading({ ...loading, [id]: 'restore' });
    setError(null);

    try {
      await axios.put(`${API_URL}/customers/${id}/restore`, {}, { headers: getAuthHeaders() });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error restoring customer:', error);
      setError(error.response?.data?.error || 'Error restoring customer');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading({ ...loading, [id]: null });
    }
  };

  const handlePermanentDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete ${name}? This cannot be undone!`)) {
      return;
    }

    setLoading({ ...loading, [id]: 'delete' });
    setError(null);

    try {
      await axios.delete(`${API_URL}/customers/${id}/permanent`, { headers: getAuthHeaders() });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error permanently deleting customer:', error);
      setError(error.response?.data?.error || 'Error permanently deleting customer');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading({ ...loading, [id]: null });
    }
  };

  // Sort customers based on sortOrder
  const sortedCustomers = [...customers].sort((a, b) => {
    const dateA = new Date(a.archived_at || a.created_at);
    const dateB = new Date(b.archived_at || b.created_at);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (customers.length === 0) {
    return (
      <div className="archived-section">
        <div className="archived-header">
          <h2>Archived Customers (0)</h2>
        </div>
        <div className="empty-state">
          <p>No archived customers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="archived-section">
      <div className="archived-header">
        <h2>Archived Customers ({customers.length})</h2>
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by: </label>
          <select
            id="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Most Recent</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="customer-grid">
        {sortedCustomers.map(customer => (
          <div key={customer.id} className="customer-card archived-card">
            <div className="customer-header">
              <h3>{customer.name}</h3>
              <div className="badge-group">
                <span className="badge badge-secondary">Archived</span>
                {customer.customer_type === 'pt' && (
                  <span className="badge badge-info">PT</span>
                )}
              </div>
            </div>
            
            <div className="customer-details">
              <p><strong>Phone:</strong> {customer.phone}</p>
              {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
              {customer.customer_type === 'pt' && customer.trainer_email && (
                <p><strong>Trainer:</strong> {getTrainerName(customer.trainer_email)}</p>
              )}
              {customer.customer_type === 'pt' && customer.pt_date && (
                <p><strong>PT Date:</strong> {format(new Date(customer.pt_date), 'MMM dd, yyyy')}</p>
              )}
              {customer.child_name && <p><strong>Child's Name:</strong> {customer.child_name}</p>}
              {customer.referral_source && <p><strong>Referral Source:</strong> {customer.referral_source}</p>}
              {customer.notes && <p><strong>Notes:</strong> {customer.notes}</p>}
              <p className="customer-meta">
                Added: {format(new Date(customer.created_at), 'MMM dd, yyyy')}
              </p>
              {customer.archived_at && (
                <p className="customer-meta archived-date">
                  Archived: {format(new Date(customer.archived_at), 'MMM dd, yyyy HH:mm')}
                </p>
              )}
            </div>

            <div className="customer-actions">
              <button 
                onClick={() => handleRestore(customer.id, customer.name)}
                className="btn btn-success btn-sm"
                disabled={loading[customer.id]}
              >
                {loading[customer.id] === 'restore' ? 'Restoring...' : '↩ Restore'}
              </button>
              <button 
                onClick={() => handlePermanentDelete(customer.id, customer.name)}
                className="btn btn-danger btn-sm"
                disabled={loading[customer.id]}
              >
                {loading[customer.id] === 'delete' ? 'Deleting...' : '🗑 Delete Forever'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

