import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ReminderForm({ customers, onAdd }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    reminder_date: '',
    reminder_type: 'follow_up_call',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.reminder_date) {
      setError('Please select a customer and set a reminder date');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post(`${API_URL}/reminders`, formData, { headers: getAuthHeaders() });
      setFormData({ customer_id: '', reminder_date: '', reminder_type: 'follow_up_call', notes: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      if (onAdd) onAdd();
    } catch (error) {
      console.error('Error creating reminder:', error);
      setError(error.response?.data?.error || 'Error creating reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="reminder-form">
      <h2>Create Reminder</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          Reminder created successfully!
        </div>
      )}

      <div className="form-group">
        <label htmlFor="customer_id">Customer *</label>
        <select
          id="customer_id"
          value={formData.customer_id}
          onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
          required
          disabled={loading || customers.length === 0}
        >
          <option value="">Select a customer...</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.name} - {customer.phone}
            </option>
          ))}
        </select>
        {customers.length === 0 && (
          <small className="form-hint">No customers available. Add a customer first.</small>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="reminder_date">Reminder Date *</label>
        <input
          id="reminder_date"
          type="date"
          value={formData.reminder_date}
          onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
          min={today}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="reminder_type">Reminder Type</label>
        <select
          id="reminder_type"
          value={formData.reminder_type}
          onChange={(e) => setFormData({ ...formData, reminder_type: e.target.value })}
          disabled={loading}
        >
          <option value="follow_up_call">Follow Up Call</option>
          <option value="why_did_they_leave_call">Why Did They Leave Call</option>
          <option value="informational_call">Informational Call</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          placeholder="Reminder notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={loading}
          rows="4"
        />
      </div>

      <button 
        type="submit" 
        className="btn btn-warning"
        disabled={loading || customers.length === 0}
      >
        {loading ? 'Creating...' : 'Create Reminder'}
      </button>
    </form>
  );
}

