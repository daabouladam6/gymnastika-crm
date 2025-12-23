const cron = require('node-cron');
const db = require('../../database/db');
const { sendPTReminderEmail, sendReminderEmail, sendTrainerReminderEmail, sendPTConfirmationEmail, sendTrainerConfirmationEmail } = require('./email');
const { 
  sendPTReminderWhatsApp, 
  sendTrainerReminderWhatsApp, 
  sendReminderWhatsApp,
  sendPTConfirmationWhatsApp,
  sendTrainerConfirmationWhatsApp,
  isWhatsAppAvailable 
} = require('./whatsapp');
const { getTrainerPhone } = require('../config/trainers');

/**
 * Calculate next session date based on recurrence type
 * @param {string} currentDate - Current PT date (YYYY-MM-DD)
 * @param {string} recurrenceType - 'daily', 'weekly', or 'custom'
 * @param {number} interval - Custom interval in days (only for 'custom' type)
 * @returns {string} - Next session date (YYYY-MM-DD)
 */
function calculateNextSessionDate(currentDate, recurrenceType, interval = null) {
  const date = new Date(currentDate);
  
  switch (recurrenceType) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'custom':
      date.setDate(date.getDate() + (interval || 7));
      break;
    default:
      date.setDate(date.getDate() + 7); // Default to weekly
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Check if a recurring session should continue (hasn't reached end date)
 * @param {string} nextDate - Next calculated session date
 * @param {string} endDate - Recurrence end date (can be null for no end)
 * @returns {boolean}
 */
function shouldContinueRecurrence(nextDate, endDate) {
  if (!endDate) return true; // No end date means it continues forever
  return new Date(nextDate) <= new Date(endDate);
}

/**
 * Process recurring sessions - update past session dates to next occurrence
 * This runs after PT reminders to auto-advance recurring sessions
 */
function processRecurringSessions() {
  console.log('🔄 Processing recurring sessions...');
  
  // Find recurring PT sessions where the pt_date is in the past (yesterday or earlier)
  const query = `
    SELECT id, name, email, phone, pt_date, pt_time, trainer_email, 
           is_recurring, recurrence_type, recurrence_interval, recurrence_end_date
    FROM customers 
    WHERE customer_type = 'pt' 
      AND is_recurring = 1
      AND pt_date < date('now')
      AND (archived = 0 OR archived IS NULL)
  `;
  
  db.all(query, async (err, rows) => {
    if (err) {
      console.error('Error checking recurring sessions:', err);
      return;
    }
    
    if (rows.length === 0) {
      console.log('  No recurring sessions to update.');
      return;
    }
    
    console.log(`  Found ${rows.length} recurring session(s) to process.`);
    const whatsappEnabled = isWhatsAppAvailable();
    
    for (const customer of rows) {
      const nextDate = calculateNextSessionDate(
        customer.pt_date, 
        customer.recurrence_type, 
        customer.recurrence_interval
      );
      
      // Check if we should continue the recurrence
      if (!shouldContinueRecurrence(nextDate, customer.recurrence_end_date)) {
        console.log(`\n  ⏹️ ${customer.name}: Recurring session ended (reached end date)`);
        // Stop the recurrence by setting is_recurring to 0
        db.run('UPDATE customers SET is_recurring = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [customer.id]);
        continue;
      }
      
      console.log(`\n  🔄 ${customer.name}: Advancing to next session ${nextDate}`);
      
      // Update the pt_date to the next occurrence
      db.run(
        'UPDATE customers SET pt_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nextDate, customer.id],
        async function(updateErr) {
          if (updateErr) {
            console.error(`    ✗ Failed to update: ${updateErr.message}`);
            return;
          }
          
          console.log(`    ✓ Updated to ${nextDate}`);
          
          // Send confirmation for the next session
          const customerData = { name: customer.name, email: customer.email, phone: customer.phone };
          
          // Send confirmation to customer about next session
          if (customer.email) {
            try {
              await sendPTConfirmationEmail(customer.email, customer.name, nextDate, customer.trainer_email, customer.pt_time);
              console.log(`    ✓ Next session email sent to customer`);
            } catch (err) {
              console.error(`    ✗ Customer email failed: ${err.message}`);
            }
          }
          
          if (customer.phone && whatsappEnabled) {
            try {
              await sendPTConfirmationWhatsApp(customer.phone, customer.name, nextDate, customer.trainer_email, customer.pt_time);
              console.log(`    ✓ Next session WhatsApp sent to customer`);
            } catch (err) {
              console.error(`    ✗ Customer WhatsApp failed: ${err.message}`);
            }
          }
          
          // Send confirmation to trainer about next session
          if (customer.trainer_email) {
            try {
              await sendTrainerConfirmationEmail(customer.trainer_email, customer.name, nextDate, customer.email, customer.phone, customer.pt_time);
              console.log(`    ✓ Next session email sent to trainer`);
            } catch (err) {
              console.error(`    ✗ Trainer email failed: ${err.message}`);
            }
            
            const trainerPhone = getTrainerPhone(customer.trainer_email);
            if (trainerPhone && whatsappEnabled) {
              try {
                await sendTrainerConfirmationWhatsApp(trainerPhone, customer.name, nextDate, customer.email, customer.phone, customer.pt_time);
                console.log(`    ✓ Next session WhatsApp sent to trainer`);
              } catch (err) {
                console.error(`    ✗ Trainer WhatsApp failed: ${err.message}`);
              }
            }
          }
        }
      );
    }
  });
}

/**
 * Check for PT customers with PT dates today and send reminders
 * Sends to both customer AND trainer via email AND WhatsApp
 */
function checkPTReminders() {
  console.log('🔔 Checking for PT reminders...');
  
  const query = `
    SELECT id, name, email, phone, pt_date, pt_time, trainer_email, is_recurring, recurrence_type
    FROM customers 
    WHERE customer_type = 'pt' 
      AND pt_date = date('now')
      AND (archived = 0 OR archived IS NULL)
  `;
  
  db.all(query, async (err, rows) => {
    if (err) {
      console.error('Error checking PT reminders:', err);
      return;
    }
    
    if (rows.length === 0) {
      console.log('  No PT sessions scheduled for today.');
      return;
    }
    
    const whatsappEnabled = isWhatsAppAvailable();
    console.log(`  Found ${rows.length} PT session(s) today.`);
    console.log(`  WhatsApp: ${whatsappEnabled ? '✅ Available' : '⚠️ Not configured'}`);
    
    for (const customer of rows) {
      const timeStr = customer.pt_time ? ` at ${customer.pt_time}` : '';
      const recurringStr = customer.is_recurring ? ' 🔄' : '';
      
      // ====== SEND TO CUSTOMER ======
      console.log(`\n  📧 Customer: ${customer.name}${timeStr}${recurringStr}`);
      
      // Email reminder to customer
      if (customer.email) {
        try {
          await sendPTReminderEmail(customer.email, customer.name, customer.pt_date, customer.trainer_email, customer.pt_time);
          console.log(`    ✓ Email sent to ${customer.email}`);
        } catch (err) {
          console.error(`    ✗ Email failed: ${err.message}`);
        }
      }
      
      // WhatsApp reminder to customer
      if (customer.phone && whatsappEnabled) {
        try {
          await sendPTReminderWhatsApp(customer.phone, customer.name, customer.pt_date, customer.trainer_email, customer.pt_time);
          console.log(`    ✓ WhatsApp sent to ${customer.phone}`);
        } catch (err) {
          console.error(`    ✗ WhatsApp failed: ${err.message}`);
        }
      }
      
      // ====== SEND TO TRAINER ======
      if (customer.trainer_email) {
        console.log(`  📧 Trainer: ${customer.trainer_email}`);
        
        // Email reminder to trainer
        try {
          await sendTrainerReminderEmail(customer.trainer_email, customer.name, customer.pt_date, customer.email, customer.phone, customer.pt_time);
          console.log(`    ✓ Email sent to trainer`);
        } catch (err) {
          console.error(`    ✗ Email failed: ${err.message}`);
        }
        
        // WhatsApp reminder to trainer (if trainer phone is configured)
        const trainerPhone = getTrainerPhone(customer.trainer_email);
        if (trainerPhone && whatsappEnabled) {
          try {
            await sendTrainerReminderWhatsApp(trainerPhone, customer.name, customer.pt_date, customer.email, customer.phone, customer.pt_time);
            console.log(`    ✓ WhatsApp sent to trainer (${trainerPhone})`);
          } catch (err) {
            console.error(`    ✗ Trainer WhatsApp failed: ${err.message}`);
          }
        }
      }
    }
  });
}

/**
 * Check for due reminders and send notifications
 * This runs daily at 9 AM to check for reminders due today or overdue
 */
function checkDueReminders() {
  console.log('🔔 Checking for due reminders...');
  
  const query = `
    SELECT r.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone 
    FROM reminders r
    JOIN customers c ON r.customer_id = c.id
    WHERE r.reminder_date <= date('now') AND r.completed = 0
    ORDER BY r.reminder_date ASC
  `;
  
  db.all(query, async (err, rows) => {
    if (err) {
      console.error('Error checking reminders:', err);
      return;
    }
    
    if (rows.length === 0) {
      console.log('  No reminders due today.');
      return;
    }
    
    const whatsappEnabled = isWhatsAppAvailable();
    console.log(`  Found ${rows.length} reminder(s) due.`);
    console.log(`  WhatsApp: ${whatsappEnabled ? '✅ Available' : '⚠️ Not configured'}`);
    
    for (const reminder of rows) {
      const dueDate = new Date(reminder.reminder_date);
      const today = new Date();
      const isOverdue = dueDate < today;
      const status = isOverdue ? '⚠️ OVERDUE' : '📌 DUE TODAY';
      
      console.log(`\n  ${status}: ${reminder.customer_name} - ${reminder.reminder_type}`);
      
      // Send email reminder
      if (reminder.customer_email) {
        try {
          await sendReminderEmail(
            reminder.customer_email,
            reminder.customer_name,
            reminder.reminder_type,
            reminder.reminder_date,
            reminder.notes
          );
          console.log(`    ✓ Email sent to ${reminder.customer_email}`);
        } catch (err) {
          console.error(`    ✗ Email failed: ${err.message}`);
        }
      }
      
      // Send WhatsApp reminder
      if (reminder.customer_phone && whatsappEnabled) {
        try {
          await sendReminderWhatsApp(
            reminder.customer_phone,
            reminder.customer_name,
            reminder.reminder_type,
            reminder.reminder_date,
            reminder.notes
          );
          console.log(`    ✓ WhatsApp sent to ${reminder.customer_phone}`);
        } catch (err) {
          console.error(`    ✗ WhatsApp failed: ${err.message}`);
        }
      }
    }
  });
}

/**
 * Start the reminder scheduler
 * Runs daily at 8 AM (PT reminders), 9 AM (general reminders), and 10 PM (recurring session advancement)
 */
function startReminderScheduler() {
  // Schedule PT reminder check daily at 8 AM
  cron.schedule('0 8 * * *', () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Scheduled PT Reminder Check (8:00 AM)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    checkPTReminders();
  });
  
  // Schedule general reminder check daily at 9 AM
  cron.schedule('0 9 * * *', () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Scheduled Reminder Check (9:00 AM)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    checkDueReminders();
  });
  
  // Schedule recurring session advancement daily at 10 PM (after the day's sessions)
  cron.schedule('0 22 * * *', () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Processing Recurring Sessions (10:00 PM)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    processRecurringSessions();
  });
  
  // Also run at 1 AM to catch any missed sessions from the previous day
  cron.schedule('0 1 * * *', () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Recurring Sessions Catch-up (1:00 AM)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    processRecurringSessions();
  });
  
  // Run immediately on startup to check for overdue reminders, today's PT sessions, and advance recurring sessions
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Startup Reminder Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  checkDueReminders();
  checkPTReminders();
  processRecurringSessions();
  
  console.log('\n✅ Reminder scheduler started.');
  console.log('  📅 PT reminders: Daily at 8:00 AM');
  console.log('  📅 General reminders: Daily at 9:00 AM');
  console.log('  🔄 Recurring session advancement: Daily at 10:00 PM & 1:00 AM');
}

module.exports = { startReminderScheduler, checkDueReminders, checkPTReminders, processRecurringSessions };
