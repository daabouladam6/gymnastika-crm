import { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { getAuthHeaders } from '../lib/auth';
import { TRAINERS, getTrainerName } from '../lib/trainers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Days of the week for selection
const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

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

  // Parse pt_days string to array
  const parsePtDays = (ptDays) => {
    if (!ptDays) return [];
    return ptDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
  };

  // Convert pt_days array to string
  const ptDaysToString = (days) => {
    if (!days || days.length === 0) return null;
    return days.sort((a, b) => a - b).join(',');
  };

  // Get day names from pt_days
  const getDayNames = (ptDays) => {
    if (!ptDays) return '';
    const days = parsePtDays(ptDays);
    return days.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).filter(Boolean).join(', ');
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    setEditData({ 
      ...customer, 
      pt_date: customer.pt_date || '',
      pt_time: customer.pt_time || '',
      trainer_email: customer.trainer_email || '',
      is_recurring: customer.is_recurring === 1 || customer.is_recurring === true,
      recurrence_type: customer.recurrence_type || 'weekly',
      recurrence_interval: customer.recurrence_interval || 7,
      recurrence_end_date: customer.recurrence_end_date || '',
      pt_days: parsePtDays(customer.pt_days)
    });
    setError(null);
  };

  // Toggle a day in pt_days array
  const toggleDay = (dayValue) => {
    const currentDays = editData.pt_days || [];
    if (currentDays.includes(dayValue)) {
      setEditData({ ...editData, pt_days: currentDays.filter(d => d !== dayValue) });
    } else {
      setEditData({ ...editData, pt_days: [...currentDays, dayValue].sort((a, b) => a - b) });
    }
  };

  // Helper to get recurrence description
  const getRecurrenceText = (customer) => {
    if (!customer.is_recurring) return null;
    switch (customer.recurrence_type) {
      case 'daily': return 'Daily';
      case 'weekly': 
        const days = getDayNames(customer.pt_days);
        return days ? `Weekly (${days})` : 'Weekly';
      case 'custom': return `Every ${customer.recurrence_interval} days`;
      default: return 'Recurring';
    }
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
      const submitData = {
        ...editData,
        customer_type: 'pt',
        is_recurring: editData.is_recurring,
        recurrence_type: editData.is_recurring ? editData.recurrence_type : null,
        recurrence_interval: editData.is_recurring && editData.recurrence_type === 'custom' ? editData.recurrence_interval : null,
        recurrence_end_date: editData.is_recurring && editData.recurrence_end_date ? editData.recurrence_end_date : null,
        pt_days: editData.is_recurring && editData.recurrence_type === 'weekly' ? ptDaysToString(editData.pt_days) : null
      };
      await axios.put(
        `${API_URL}/customers/${id}`, 
        submitData,
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
                
                {/* Recurring Options in Edit Form */}
                <div className="form-group" style={{ 
                  backgroundColor: editData.is_recurring ? '#f0f9ff' : '#f9f9f9', 
                  padding: '12px', 
                  borderRadius: '6px',
                  border: editData.is_recurring ? '2px solid #3b82f6' : '1px solid #e0e0e0',
                  marginBottom: '12px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: editData.is_recurring ? '10px' : '0' }}>
                    <input
                      type="checkbox"
                      checked={editData.is_recurring || false}
                      onChange={(e) => setEditData({...editData, is_recurring: e.target.checked})}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontWeight: '600' }}>🔄 Recurring Session</span>
                  </label>
                  
                  {editData.is_recurring && (
                    <>
                      <select
                        value={editData.recurrence_type || 'weekly'}
                        onChange={(e) => setEditData({...editData, recurrence_type: e.target.value})}
                        className="form-input"
                        style={{ marginBottom: '8px' }}
                      >
                        <option value="weekly">Weekly (Select Days)</option>
                        <option value="daily">Daily</option>
                        <option value="custom">Custom Interval</option>
                      </select>

                      {/* Day Selection for Weekly */}
                      {editData.recurrence_type === 'weekly' && (
                        <div style={{ marginBottom: '8px' }}>
                          <small style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Session Days:</small>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {DAYS_OF_WEEK.map((day) => (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(day.value)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  border: editData.pt_days?.includes(day.value) ? '2px solid #3b82f6' : '1px solid #ccc',
                                  backgroundColor: editData.pt_days?.includes(day.value) ? '#3b82f6' : '#fff',
                                  color: editData.pt_days?.includes(day.value) ? '#fff' : '#333',
                                  cursor: 'pointer',
                                  fontWeight: editData.pt_days?.includes(day.value) ? '600' : '400',
                                  fontSize: '12px'
                                }}
                                title={day.fullLabel}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {editData.recurrence_type === 'custom' && (
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={editData.recurrence_interval || 7}
                          onChange={(e) => setEditData({...editData, recurrence_interval: parseInt(e.target.value) || 7})}
                          placeholder="Days between sessions"
                          className="form-input"
                          style={{ marginBottom: '8px' }}
                        />
                      )}
                      
                      <input
                        type="date"
                        value={editData.recurrence_end_date || ''}
                        onChange={(e) => setEditData({...editData, recurrence_end_date: e.target.value})}
                        placeholder="End Date (optional)"
                        className="form-input"
                      />
                      <small style={{ color: '#666', fontSize: '11px' }}>End date (optional)</small>
                    </>
                  )}
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
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <span className="badge badge-success">PT Customer</span>
                    {customer.is_recurring === 1 && (
                      <span className="badge" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                        🔄 {getRecurrenceText(customer)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="customer-details">
                  <p><strong>Phone:</strong> {customer.phone}</p>
                  {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                  {customer.trainer_email && (
                    <p><strong>Trainer:</strong> {getTrainerName(customer.trainer_email)}</p>
                  )}
                  {customer.pt_date && (
                    <p>
                      <strong>{customer.is_recurring ? 'Next Session:' : 'PT Date:'}</strong> {format(new Date(customer.pt_date), 'MMM dd, yyyy')}
                      {customer.pt_time && <span className="pt-time"> at {customer.pt_time}</span>}
                    </p>
                  )}
                  {customer.is_recurring === 1 && customer.pt_days && (
                    <p><strong>Session Days:</strong> {getDayNames(customer.pt_days)}</p>
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
