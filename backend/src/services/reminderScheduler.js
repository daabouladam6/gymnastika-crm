const cron = require('node-cron');
const db = require('../../database/db');
const { sendPTReminderEmail, sendReminderEmail, sendTrainerReminderEmail } = require('./email');
const { 
  sendPTReminderWhatsApp, 
  sendTrainerReminderWhatsApp, 
  sendReminderWhatsApp,
  isWhatsAppAvailable 
} = require('./whatsapp');

/**
 * Check for PT customers with PT dates today and send reminders
 * Sends to both customer AND trainer via email AND WhatsApp
 */
function checkPTReminders() {
  console.log('🔔 Checking for PT reminders...');
  
  const query = `
    SELECT id, name, email, phone, pt_date, pt_time, trainer_email, child_name 
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
      
      // ====== SEND TO CUSTOMER ======
      console.log(`\n  📧 Customer: ${customer.name}${timeStr}`);
      
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
        console.log(`  📧 Trainer: ${customer.trainer_email}${customer.child_name ? ` (Child: ${customer.child_name})` : ''}`);
        
        // Email reminder to trainer
        try {
          await sendTrainerReminderEmail(customer.trainer_email, customer.name, customer.pt_date, customer.email, customer.phone, customer.pt_time, customer.child_name);
          console.log(`    ✓ Email sent to trainer`);
        } catch (err) {
          console.error(`    ✗ Email failed: ${err.message}`);
        }
        
        // WhatsApp reminder to trainer (if trainer phone is configured)
        // Note: Would need to add trainer phone to the trainers config
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
 * Runs daily at 8 AM (PT reminders) and 9 AM (general reminders)
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
  
  // Run immediately on startup to check for overdue reminders and today's PT sessions
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Startup Reminder Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  checkDueReminders();
  checkPTReminders();
  
  console.log('\n✅ Reminder scheduler started.');
  console.log('  📅 PT reminders: Daily at 8:00 AM');
  console.log('  📅 General reminders: Daily at 9:00 AM');
}

module.exports = { startReminderScheduler, checkDueReminders, checkPTReminders };
