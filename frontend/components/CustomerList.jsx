import { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { getAuthHeaders } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CustomerList({ customers, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.child_name?.toLowerCase().includes(search)
    );
  });

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all associated reminders.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/customers/${id}`, { headers: getAuthHeaders() });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError(error.response?.data?.error || 'Error deleting customer');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    setEditData({ 
      ...customer, 
      wants_pt: customer.wants_pt === 1,
      child_name: customer.child_name || '',
      referral_source: customer.referral_source || ''
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setError(null);
  };

  const saveEdit = async (id) => {
    setLoading(true);
    setError(null);

    try {
      await axios.put(
        `${API_URL}/customers/${id}`, 
        { ...editData, customer_type: 'basic' },
        { headers: getAuthHeaders() }
      );
      setEditingId(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating customer:', error);
      setError(error.response?.data?.error || 'Error updating customer');
    } finally {
      setLoading(false);
    }
  };

  if (customers.length === 0) {
    return (
      <div className="empty-state">
        <p>No customers yet. Add your first customer above!</p>
      </div>
    );
  }

  return (
    <div className="customer-list">
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Customers ({filteredCustomers.length}{searchTerm ? ` of ${customers.length}` : ''})</h2>
        <div className="search-box" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Search by name, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              paddingRight: '30px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              width: '250px',
              fontSize: '14px'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#999'
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {filteredCustomers.length === 0 && searchTerm && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <p>No customers found matching "{searchTerm}"</p>
        </div>
      )}

      <div className="customer-grid">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="customer-card">
            {editingId === customer.id ? (
              <div className="edit-form">
                <div className="form-group">
                  <input 
                    value={editData.name} 
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    placeholder="Name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input 
                    value={editData.phone} 
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    placeholder="Phone"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input 
                    value={editData.email || ''} 
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    placeholder="Email"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input 
                    value={editData.child_name || ''} 
                    onChange={(e) => setEditData({...editData, child_name: e.target.value})}
                    placeholder="Child's Name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input 
                    value={editData.referral_source || ''} 
                    onChange={(e) => setEditData({...editData, referral_source: e.target.value})}
                    placeholder="Referral Source"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <textarea 
                    value={editData.notes || ''} 
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    placeholder="Notes"
                    className="form-input"
                    rows="3"
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editData.wants_pt}
                      onChange={(e) => setEditData({...editData, wants_pt: e.target.checked})}
                    />
                    <span>Interested in PT</span>
                  </label>
                </div>
                <div className="button-group">
                  <button 
                    onClick={() => saveEdit(customer.id)}
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={cancelEdit}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="customer-header">
                  <h3>{customer.name}</h3>
                  {customer.wants_pt === 1 && (
                    <span className="badge badge-success">
                      PT Interest {customer.pt_message_sent === 1 && '✓'}
                    </span>
                  )}
                </div>
                
                <div className="customer-details">
                  <p><strong>Phone:</strong> {customer.phone}</p>
                  {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                  {customer.child_name && <p><strong>Child's Name:</strong> {customer.child_name}</p>}
                  {customer.referral_source && <p><strong>Referral Source:</strong> {customer.referral_source}</p>}
                  {customer.notes && <p><strong>Notes:</strong> {customer.notes}</p>}
                  <p className="customer-meta">
                    Added: {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>

                <div className="customer-actions">
                  <button 
                    onClick={() => startEdit(customer)}
                    className="btn btn-primary btn-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    className="btn btn-danger btn-sm"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

