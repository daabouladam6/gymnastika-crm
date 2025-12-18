import { useState, useMemo } from 'react';
import axios from 'axios';
import { format, isPast, parseISO, isToday } from 'date-fns';
import { getAuthHeaders } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ReminderList({ pendingReminders = [], completedReminders = [], onUpdate }) {
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today');

  // Filter reminders due today
  const todayReminders = useMemo(() => {
    return pendingReminders.filter(reminder => {
      const reminderDate = parseISO(reminder.reminder_date);
      return isToday(reminderDate);
    });
  }, [pendingReminders]);

  const handleComplete = async (id) => {
    setLoading({ ...loading, [id]: true });
    setError(null);

    try {
      await axios.put(`${API_URL}/reminders/${id}/complete`, {}, { headers: getAuthHeaders() });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error completing reminder:', error);
      setError(error.response?.data?.error || 'Error completing reminder');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading({ ...loading, [id]: false });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return;
    }
    
    setLoading({ ...loading, [id]: true });
    setError(null);

    try {
      await axios.delete(`${API_URL}/reminders/${id}`, { headers: getAuthHeaders() });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setError(error.response?.data?.error || 'Error deleting reminder');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading({ ...loading, [id]: false });
    }
  };

  const renderReminderCard = (reminder, isCompleted = false) => {
    const reminderDate = parseISO(reminder.reminder_date);
    const isOverdue = !isCompleted && isPast(reminderDate) && format(reminderDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
    
    return (
      <div 
        key={reminder.id} 
        className={`reminder-card ${isOverdue ? 'reminder-overdue' : ''} ${isCompleted ? 'reminder-completed' : ''}`}
      >
        <div className="reminder-header">
          <h3>{reminder.customer_name}</h3>
          {isOverdue && (
            <span className="badge badge-danger">OVERDUE</span>
          )}
          {isCompleted && (
            <span className="badge badge-success">COMPLETED</span>
          )}
        </div>
        
        <div className="reminder-details">
          <p><strong>Phone:</strong> {reminder.customer_phone}</p>
          <p><strong>Type:</strong> {reminder.reminder_type.replace(/_/g, ' ').toUpperCase()}</p>
          <p><strong>{isCompleted ? 'Date:' : 'Due Date:'}</strong> {format(reminderDate, 'MMM dd, yyyy')}</p>
          {reminder.notes && (
            <p><strong>Notes:</strong> {reminder.notes}</p>
          )}
        </div>

        <div className="reminder-actions">
          {!isCompleted ? (
            <button 
              onClick={() => handleComplete(reminder.id)} 
              className="btn btn-success"
              disabled={loading[reminder.id]}
            >
              {loading[reminder.id] ? 'Completing...' : '✓ Mark as Completed'}
            </button>
          ) : (
            <button 
              onClick={() => handleDelete(reminder.id)} 
              className="btn btn-danger btn-sm"
              disabled={loading[reminder.id]}
            >
              {loading[reminder.id] ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="reminder-list">
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Toggle buttons */}
      <div className="reminder-tabs">
        <button 
          className={`reminder-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today ({todayReminders.length})
        </button>
        <button 
          className={`reminder-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingReminders.length})
        </button>
        <button 
          className={`reminder-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedReminders.length})
        </button>
      </div>

      {/* Today's Reminders */}
      {activeTab === 'today' && (
        <>
          <h2>Today's Reminders ({todayReminders.length})</h2>
          {todayReminders.length === 0 ? (
            <div className="empty-state">
              <p>No reminders due today! 🎉</p>
            </div>
          ) : (
            <div className="reminder-grid">
              {todayReminders.map(reminder => renderReminderCard(reminder, false))}
            </div>
          )}
        </>
      )}

      {/* Pending Reminders */}
      {activeTab === 'pending' && (
        <>
          <h2>All Pending Reminders ({pendingReminders.length})</h2>
          {pendingReminders.length === 0 ? (
            <div className="empty-state">
              <p>No pending reminders! 🎉</p>
            </div>
          ) : (
            <div className="reminder-grid">
              {pendingReminders.map(reminder => renderReminderCard(reminder, false))}
            </div>
          )}
        </>
      )}

      {/* Completed Reminders */}
      {activeTab === 'completed' && (
        <>
          <h2>Completed Reminders ({completedReminders.length})</h2>
          {completedReminders.length === 0 ? (
            <div className="empty-state">
              <p>No completed reminders yet.</p>
            </div>
          ) : (
            <div className="reminder-grid">
              {completedReminders.map(reminder => renderReminderCard(reminder, true))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
