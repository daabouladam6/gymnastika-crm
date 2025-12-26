import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../lib/auth';
import { TRAINERS } from '../lib/trainers';

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
    pt_days: [] // Array of day numbers (0-6)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // For selecting existing customers
  const [customerMode, setCustomerMode] = useState('new'); // 'new' or 'existing'
  const [basicCustomers, setBasicCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Fetch basic customers when component mounts or when mode changes to 'existing'
  useEffect(() => {
    if (customerMode === 'existing') {
      fetchBasicCustomers();
    }
  }, [customerMode]);

  const fetchBasicCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await axios.get(`${API_URL}/customers/basic`, { headers: getAuthHeaders() });
      setBasicCustomers(response.data || []);
    } catch (err) {
      console.error('Error fetching basic customers:', err);
      setBasicCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Handle selecting an existing customer
  const handleSelectCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    if (customerId) {
      const customer = basicCustomers.find(c => c.id === parseInt(customerId));
      if (customer) {
        setFormData({
          ...formData,
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          child_name: customer.child_name || '',
          referral_source: customer.referral_source || '',
          notes: customer.notes || ''
        });
      }
    } else {
      // Clear the form if no customer selected
      setFormData({
        ...formData,
        name: '',
        phone: '',
        email: '',
        child_name: '',
        referral_source: '',
        notes: ''
      });
    }
  };

  // Handle switching between new and existing customer mode
  const handleModeChange = (mode) => {
    setCustomerMode(mode);
    setSelectedCustomerId('');
    // Reset customer fields when switching modes
    setFormData({
      ...formData,
      name: '',
      phone: '',
      email: '',
      child_name: '',
      referral_source: '',
      notes: ''
    });
  };

  // Toggle a day in pt_days array
  const toggleDay = (dayValue) => {
    const currentDays = formData.pt_days || [];
    if (currentDays.includes(dayValue)) {
      setFormData({ ...formData, pt_days: currentDays.filter(d => d !== dayValue) });
    } else {
      setFormData({ ...formData, pt_days: [...currentDays, dayValue].sort((a, b) => a - b) });
    }
  };

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

    // Validate recurring sessions need at least one day selected and time
    if (formData.is_recurring) {
      if (!formData.pt_days || formData.pt_days.length === 0) {
        setError('Please select at least one day for recurring sessions');
        setLoading(false);
        return;
      }
      if (!formData.pt_time) {
        setError('Session time is required for recurring sessions (reminders are sent 7 hours before)');
        setLoading(false);
        return;
      }
    }

    try {
      const submitData = {
        ...formData,
        customer_type: 'pt',
        wants_pt: 1,
        is_recurring: formData.is_recurring,
        pt_days: formData.is_recurring ? formData.pt_days.join(',') : null
      };

      if (customerMode === 'existing' && selectedCustomerId) {
        // Update existing customer to become a PT customer
        await axios.put(
          `${API_URL}/customers/${selectedCustomerId}`, 
          submitData,
          { headers: getAuthHeaders() }
        );
      } else {
        // Create new customer
        await axios.post(
          `${API_URL}/customers`, 
          submitData,
          { headers: getAuthHeaders() }
        );
      }

      // Reset form
      setFormData({ 
        name: '', phone: '', email: '', child_name: '', 
        referral_source: '', pt_date: '', pt_time: '', notes: '', trainer_email: '',
        is_recurring: false, pt_days: []
      });
      setSelectedCustomerId('');
      setCustomerMode('new');
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

  // Get selected days display text
  const getSelectedDaysText = () => {
    if (!formData.pt_days || formData.pt_days.length === 0) return 'No days selected';
    return formData.pt_days.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.fullLabel).join(', ');
  };

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

      {/* Customer Mode Toggle */}
      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label style={{ marginBottom: '10px', display: 'block' }}>Customer Type</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleModeChange('new')}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '6px',
              border: customerMode === 'new' ? '2px solid #10b981' : '1px solid #ccc',
              backgroundColor: customerMode === 'new' ? '#ecfdf5' : '#fff',
              color: customerMode === 'new' ? '#059669' : '#666',
              cursor: 'pointer',
              fontWeight: customerMode === 'new' ? '600' : '400',
              transition: 'all 0.2s ease'
            }}
          >
            ➕ New Customer
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('existing')}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '6px',
              border: customerMode === 'existing' ? '2px solid #3b82f6' : '1px solid #ccc',
              backgroundColor: customerMode === 'existing' ? '#eff6ff' : '#fff',
              color: customerMode === 'existing' ? '#2563eb' : '#666',
              cursor: 'pointer',
              fontWeight: customerMode === 'existing' ? '600' : '400',
              transition: 'all 0.2s ease'
            }}
          >
            👤 Existing Customer
          </button>
        </div>
      </div>

      {/* Existing Customer Dropdown */}
      {customerMode === 'existing' && (
        <div className="form-group" style={{ 
          backgroundColor: '#eff6ff', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
          marginBottom: '20px'
        }}>
          <label htmlFor="existing_customer">Select Basic Customer *</label>
          <select
            id="existing_customer"
            value={selectedCustomerId}
            onChange={(e) => handleSelectCustomer(e.target.value)}
            disabled={loading || loadingCustomers}
            style={{ width: '100%' }}
          >
            <option value="">
              {loadingCustomers ? 'Loading customers...' : 'Choose a customer to upgrade to PT...'}
            </option>
            {basicCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone} {customer.email ? `(${customer.email})` : ''}
              </option>
            ))}
          </select>
          {basicCustomers.length === 0 && !loadingCustomers && (
            <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
              No basic customers found. Switch to "New Customer" to create one.
            </small>
          )}
          {selectedCustomerId && (
            <small style={{ color: '#059669', marginTop: '8px', display: 'block' }}>
              ✓ Customer selected - their info has been pre-filled below
            </small>
          )}
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
          disabled={loading || (customerMode === 'existing' && selectedCustomerId)}
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
          disabled={loading || (customerMode === 'existing' && selectedCustomerId)}
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
          disabled={loading || (customerMode === 'existing' && selectedCustomerId)}
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
          <label htmlFor="pt_time">
            Session Time {formData.is_recurring ? '*' : ''}
          </label>
          <input
            id="pt_time"
            type="time"
            value={formData.pt_time}
            onChange={(e) => setFormData({ ...formData, pt_time: e.target.value })}
            disabled={loading}
            required={formData.is_recurring}
          />
        </div>
      </div>
      <small className="form-hint" style={{ marginTop: '-10px', marginBottom: '15px', display: 'block' }}>
        {formData.is_recurring 
          ? 'First session date. Reminders sent 7 hours before each session.' 
          : 'Confirmation and reminder emails will be sent'}
      </small>

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
            🔄 Weekly Recurring Session
          </span>
        </label>
        
        {formData.is_recurring && (
          <>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px', marginTop: '0' }}>
              📅 Select the days when sessions happen. Reminders will be sent to both the customer and trainer 7 hours before each session.
            </p>
            
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Session Days *</label>
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                flexWrap: 'wrap',
                marginTop: '8px'
              }}>
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    disabled={loading}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: formData.pt_days?.includes(day.value) ? '2px solid #3b82f6' : '1px solid #ccc',
                      backgroundColor: formData.pt_days?.includes(day.value) ? '#3b82f6' : '#fff',
                      color: formData.pt_days?.includes(day.value) ? '#fff' : '#333',
                      cursor: 'pointer',
                      fontWeight: formData.pt_days?.includes(day.value) ? '600' : '400',
                      transition: 'all 0.2s ease',
                      minWidth: '50px'
                    }}
                    title={day.fullLabel}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <small className="form-hint" style={{ marginTop: '8px', display: 'block' }}>
                Selected: {getSelectedDaysText()}
              </small>
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
        disabled={loading || (customerMode === 'existing' && !selectedCustomerId)}
      >
        {loading 
          ? 'Processing...' 
          : customerMode === 'existing' && selectedCustomerId
            ? 'Upgrade to PT Customer'
            : 'Add PT Customer'
        }
      </button>
    </form>
  );
}
