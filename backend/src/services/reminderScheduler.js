const cron = require('node-cron');
const db = require('../../database/db');
const { sendPTReminderEmail, sendReminderEmail, sendTrainerReminderEmail } = require('./email');

/**
 * Check for PT customers with PT dates today and send email reminders
 * Sends to both customer AND trainer
 */
function checkPTReminders() {
  console.log('Checking for PT reminders...');
  
  const query = `
    SELECT id, name, email, phone, pt_date, pt_time, trainer_email 
    FROM customers 
    WHERE customer_type = 'pt' 
      AND pt_date = date('now')
      AND (archived = 0 OR archived IS NULL)
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error checking PT reminders:', err);
      return;
    }
    
    if (rows.length === 0) {
      console.log('No PT sessions scheduled for today.');
      return;
    }
    
    console.log(`Found ${rows.length} PT session(s) today:`);
    rows.forEach(customer => {
      // Send reminder to CUSTOMER (if they have email) - includes trainer name and time
      if (customer.email) {
        console.log(`  Sending PT reminder email to CUSTOMER ${customer.name} (${customer.email})${customer.pt_time ? ' at ' + customer.pt_time : ''}`);
        sendPTReminderEmail(customer.email, customer.name, customer.pt_date, customer.trainer_email, customer.pt_time)
          .then(() => {
            console.log(`  ✓ Reminder sent to customer ${customer.name}`);
          })
          .catch(err => {
            console.error(`  ✗ Failed to send reminder to customer ${customer.name}:`, err.message);
          });
      }
      
      // Send reminder to TRAINER (if assigned) - includes time
      if (customer.trainer_email) {
        console.log(`  Sending PT reminder email to TRAINER (${customer.trainer_email}) about client ${customer.name}${customer.pt_time ? ' at ' + customer.pt_time : ''}`);
        sendTrainerReminderEmail(customer.trainer_email, customer.name, customer.pt_date, customer.email, customer.phone, customer.pt_time)
          .then(() => {
            console.log(`  ✓ Reminder sent to trainer for client ${customer.name}`);
          })
          .catch(err => {
            console.error(`  ✗ Failed to send reminder to trainer for client ${customer.name}:`, err.message);
          });
      }
    });
  });
}

/**
 * Check for due reminders and send email notifications
 * This runs daily at 9 AM to check for reminders due today or overdue
 */
function checkDueReminders() {
  console.log('Checking for due reminders...');
  
  const query = `
    SELECT r.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone 
    FROM reminders r
    JOIN customers c ON r.customer_id = c.id
    WHERE r.reminder_date <= date('now') AND r.completed = 0
    ORDER BY r.reminder_date ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error checking reminders:', err);
      return;
    }
    
    if (rows.length === 0) {
      console.log('No reminders due today.');
      return;
    }
    
    console.log(`Found ${rows.length} reminder(s) due:`);
    rows.forEach(reminder => {
      const dueDate = new Date(reminder.reminder_date);
      const today = new Date();
      const isOverdue = dueDate < today;
      const status = isOverdue ? 'OVERDUE' : 'DUE TODAY';
      
      console.log(`  [${status}] ${reminder.customer_name} - ${reminder.reminder_type} (${reminder.reminder_date})`);
      if (reminder.notes) {
        console.log(`    Notes: ${reminder.notes}`);
      }

      // Send email reminder if customer has email
      if (reminder.customer_email) {
        sendReminderEmail(
          reminder.customer_email,
          reminder.customer_name,
          reminder.reminder_type,
          reminder.reminder_date,
          reminder.notes
        )
          .then(() => {
            console.log(`    ✓ Reminder email sent to ${reminder.customer_name}`);
          })
          .catch(err => {
            console.error(`    ✗ Failed to send reminder email:`, err.message);
          });
      }
    });
  });
}

/**
 * Start the reminder scheduler
 * Runs daily at 9:00 AM
 */
function startReminderScheduler() {
  // Schedule daily check at 9 AM for general reminders
  // Cron format: minute hour day month dayOfWeek
  // '0 9 * * *' means: at 9:00 AM every day
  cron.schedule('0 9 * * *', () => {
    checkDueReminders();
  });
  
  // Schedule PT reminder check daily at 8 AM (before general reminders)
  cron.schedule('0 8 * * *', () => {
    checkPTReminders();
  });
  
  // Also run immediately on startup to check for overdue reminders and today's PT sessions
  checkDueReminders();
  checkPTReminders();
  
  console.log('Reminder scheduler started.');
  console.log('  - PT reminders: Daily at 8:00 AM');
  console.log('  - General reminders: Daily at 9:00 AM');
}

module.exports = { startReminderScheduler, checkDueReminders, checkPTReminders };

