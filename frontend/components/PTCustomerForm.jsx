import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../lib/auth';
import { TRAINERS } from '../lib/trainers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function PTCustomerForm({ onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    child_name: '',
    referral_source: '',
    pt_date: '',
    pt_time: '',
    notes: '',
    trainer_email: '',
    is_recurring: false,
    recurrence_type: 'weekly',
    recurrence_interval: 7,
    recurrence_end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.pt_date) {
      setError('PT date is required');
      setLoading(false);
      return;
    }

    if (!formData.trainer_email) {
      setError('Please select a trainer');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        customer_type: 'pt',
        wants_pt: 1,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        recurrence_interval: formData.is_recurring && formData.recurrence_type === 'custom' ? formData.recurrence_interval : null,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null
      };
      await axios.post(
        `${API_URL}/customers`, 
        submitData,
        { headers: getAuthHeaders() }
      );
      setFormData({ 
        name: '', phone: '', email: '', child_name: '', 
        referral_source: '', pt_date: '', pt_time: '', notes: '', trainer_email: '',
        is_recurring: false, recurrence_type: 'weekly', recurrence_interval: 7, recurrence_end_date: ''
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      if (onAdd) onAdd();
    } catch (error) {
      console.error('Error adding PT customer:', error);
      setError(error.response?.data?.error || 'Error adding PT customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Get selected trainer name for display
  const selectedTrainer = TRAINERS.find(t => t.email === formData.trainer_email);

  return (
    <form onSubmit={handleSubmit} className="customer-form pt-form">
      <h2>Add New PT Customer</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          PT customer added successfully! Confirmation and reminder emails have been sent to both the customer and the trainer.
        </div>
      )}

      <div className="form-group">
        <label htmlFor="pt_name">Name *</label>
        <input
          id="pt_name"
          type="text"
          placeholder="Customer Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="pt_phone">Phone Number *</label>
        <input
          id="pt_phone"
          type="tel"
          placeholder="+1234567890"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="pt_email">Customer Email *</label>
        <input
          id="pt_email"
          type="email"
          placeholder="customer@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={loading}
        />
        <small className="form-hint">Customer will receive confirmation and reminder emails</small>
      </div>

      <div className="form-group">
        <label htmlFor="trainer_select">Assigned Trainer *</label>
        <select
          id="trainer_select"
          value={formData.trainer_email}
          onChange={(e) => setFormData({ ...formData, trainer_email: e.target.value })}
          required
          disabled={loading}
        >
          <option value="">Select a trainer...</option>
          {TRAINERS.map((trainer) => (
            <option key={trainer.email} value={trainer.email}>
              {trainer.name}
            </option>
          ))}
        </select>
        <small className="form-hint">Trainer will also receive the session emails</small>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="pt_date">PT Date *</label>
          <input
            id="pt_date"
            type="date"
            value={formData.pt_date}
            onChange={(e) => setFormData({ ...formData, pt_date: e.target.value })}
            min={today}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="pt_time">PT Time</label>
          <input
            id="pt_time"
            type="time"
            value={formData.pt_time}
            onChange={(e) => setFormData({ ...formData, pt_time: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>
      <small className="form-hint" style={{ marginTop: '-10px', marginBottom: '15px', display: 'block' }}>Reminder emails will be sent on this date with the specified time</small>

      {/* Recurring Session Options */}
      <div className="form-group recurring-section" style={{ 
        backgroundColor: formData.is_recurring ? '#f0f9ff' : '#f9f9f9', 
        padding: '15px', 
        borderRadius: '8px',
        border: formData.is_recurring ? '2px solid #3b82f6' : '1px solid #e0e0e0',
        marginBottom: '20px'
      }}>
        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: formData.is_recurring ? '15px' : '0' }}>
          <input
            type="checkbox"
            checked={formData.is_recurring}
            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
            disabled={loading}
            style={{ marginRight: '10px', width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: '600', fontSize: '15px' }}>
            🔄 Recurring Session
          </span>
        </label>
        
        {formData.is_recurring && (
          <>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="recurrence_type">Repeat</label>
              <select
                id="recurrence_type"
                value={formData.recurrence_type}
                onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
                disabled={loading}
                style={{ width: '100%' }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Every 7 days)</option>
                <option value="custom">Custom Interval</option>
              </select>
            </div>
            
            {formData.recurrence_type === 'custom' && (
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="recurrence_interval">Repeat Every (days)</label>
                <input
                  id="recurrence_interval"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.recurrence_interval}
                  onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || 7 })}
                  disabled={loading}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label htmlFor="recurrence_end_date">End Date (Optional)</label>
              <input
                id="recurrence_end_date"
                type="date"
                value={formData.recurrence_end_date}
                onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                min={formData.pt_date || today}
                disabled={loading}
                style={{ width: '100%' }}
              />
              <small className="form-hint">Leave empty for ongoing recurring sessions</small>
            </div>
          </>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="pt_child_name">Child's Name</label>
        <input
          id="pt_child_name"
          type="text"
          placeholder="Child's Name"
          value={formData.child_name}
          onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="pt_referral_source">Referral Source</label>
        <input
          id="pt_referral_source"
          type="text"
          placeholder="Referral Source"
          value={formData.referral_source}
          onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="pt_notes">Notes</label>
        <textarea
          id="pt_notes"
          placeholder="Additional information..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={loading}
          rows="4"
        />
      </div>

      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Adding...' : 'Add PT Customer'}
      </button>
    </form>
  );
}
