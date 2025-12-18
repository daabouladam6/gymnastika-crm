import { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { getAuthHeaders } from '../lib/auth';
import { TRAINERS, getTrainerName } from '../lib/trainers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function PTCustomerList({ customers, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this PT customer?')) {
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
      pt_date: customer.pt_date || '',
      pt_time: customer.pt_time || '',
      trainer_email: customer.trainer_email || ''
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
        { ...editData, customer_type: 'pt' },
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
        <p>No PT customers yet. Add your first PT customer above!</p>
      </div>
    );
  }

  return (
    <div className="customer-list">
      <h2>PT Customers ({customers.length})</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="customer-grid">
        {customers.map(customer => (
          <div key={customer.id} className="customer-card pt-card">
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
                  <label>Assigned Trainer</label>
                  <select
                    value={editData.trainer_email || ''}
                    onChange={(e) => setEditData({...editData, trainer_email: e.target.value})}
                    className="form-input"
                  >
                    <option value="">Select a trainer...</option>
                    {TRAINERS.map((trainer) => (
                      <option key={trainer.email} value={trainer.email}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>PT Date</label>
                    <input 
                      type="date"
                      value={editData.pt_date || ''} 
                      onChange={(e) => setEditData({...editData, pt_date: e.target.value})}
                      placeholder="PT Date"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>PT Time</label>
                    <input 
                      type="time"
                      value={editData.pt_time || ''} 
                      onChange={(e) => setEditData({...editData, pt_time: e.target.value})}
                      placeholder="PT Time"
                      className="form-input"
                    />
                  </div>
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
                  <span className="badge badge-success">PT Customer</span>
                </div>
                
                <div className="customer-details">
                  <p><strong>Phone:</strong> {customer.phone}</p>
                  {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                  {customer.trainer_email && (
                    <p><strong>Trainer:</strong> {getTrainerName(customer.trainer_email)}</p>
                  )}
                  {customer.pt_date && (
                    <p>
                      <strong>PT Date:</strong> {format(new Date(customer.pt_date), 'MMM dd, yyyy')}
                      {customer.pt_time && <span className="pt-time"> at {customer.pt_time}</span>}
                    </p>
                  )}
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
