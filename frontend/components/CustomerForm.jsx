import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CustomerForm({ onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    child_name: '',
    referral_source: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setEmailSent(false);

    const hadEmail = !!formData.email;

    try {
      await axios.post(
        `${API_URL}/customers`, 
        { ...formData, customer_type: 'basic' },
        { headers: getAuthHeaders() }
      );
      setFormData({ name: '', phone: '', email: '', child_name: '', referral_source: '', notes: '' });
      setSuccess(true);
      setEmailSent(hadEmail);
      setTimeout(() => setSuccess(false), 3000);
      if (onAdd) onAdd();
    } catch (error) {
      console.error('Error adding customer:', error);
      setError(error.response?.data?.error || 'Error adding customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="customer-form">
      <h2>Add New Customer</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          Customer added successfully! {emailSent ? 'Welcome email has been sent.' : ''}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          placeholder="Customer Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone Number *</label>
        <input
          id="phone"
          type="tel"
          placeholder="+1234567890"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="customer@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="child_name">Child's Name</label>
        <input
          id="child_name"
          type="text"
          placeholder="Child's Name"
          value={formData.child_name}
          onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="referral_source">Referral Source</label>
        <input
          id="referral_source"
          type="text"
          placeholder="Referral Source"
          value={formData.referral_source}
          onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          placeholder="Additional information about the customer..."
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
        {loading ? 'Adding...' : 'Add Customer'}
      </button>
    </form>
  );
}

