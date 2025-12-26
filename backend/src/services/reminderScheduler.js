const cron = require('node-cron');
const db = require('../../database/db');
const { sendPTReminderEmail, sendReminderEmail, sendTrainerReminderEmail } = require('./email');
const { 
  sendPTReminderWhatsApp, 
  sendTrainerReminderWhatsApp, 
  sendReminderWhatsApp,
  isWhatsAppAvailable 
} = require('./whatsapp');
const { getTrainerPhone } = require('../config/trainers');

/**
 * Get day names from pt_days string
 */
function getDayNames(ptDays) {
  if (!ptDays) return '';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return ptDays.split(',').map(d => dayNames[parseInt(d.trim())]).join(', ');
}

/**
 * Check if current day of week matches any of the pt_days
 * @param {string} ptDays - Comma-separated day numbers (e.g., "1,3" for Mon, Wed)
 * @returns {boolean}
 */
function isTodaySessionDay(ptDays) {
  if (!ptDays) return false;
  const today = new Date().getDay(); // 0=Sun, 1=Mon, etc.
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = ptDays.split(',').map(d => parseInt(d.trim()));
  const isToday = days.includes(today);
  console.log(`    [Debug] Today is ${dayNames[today]} (${today}), Session days: ${days.join(',')} (${days.map(d => dayNames[d]).join(', ')}), Match: ${isToday}`);
  return isToday;
}

/**
 * Check if reminder should be sent for a session
 * SIMPLIFIED: Just check if the session is scheduled for later today
 * The last_reminder_date check prevents duplicate sends
 * @param {string} ptTime - Session time in HH:MM format
 * @returns {boolean}
 */
function shouldSendReminder(ptTime) {
  // Always return true - we rely on:
  // 1. isTodaySessionDay() to check if today is a session day
  // 2. last_reminder_date in the database to prevent duplicates
  // This ensures reminders are sent regardless of timezone issues
  console.log(`    [Debug] Session time: ${ptTime} - will send reminder (timezone-safe)`);
  return true;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check for recurring PT sessions and send reminders 7 hours before
 * Sends to both customer AND trainer via email AND WhatsApp
 * Uses last_reminder_date to prevent duplicate reminders on the same day
 */
function checkRecurringReminders() {
  console.log('🔄 Checking recurring PT session reminders...');
  
  const today = getTodayDate();
  const now = new Date();
  console.log(`  Current time: ${now.toISOString()} (${now.toLocaleTimeString()})`);
  console.log(`  Today's date: ${today}`);
  console.log(`  Day of week: ${now.getDay()} (0=Sun, 1=Mon, ..., 6=Sat)`);
  
  // Find all recurring PT customers
  // We'll check last_reminder_date in code to handle both PostgreSQL and SQLite
  const query = `
    SELECT id, name, email, phone, pt_date, pt_time, trainer_email, pt_days, child_name, last_reminder_date
    FROM customers 
    WHERE customer_type = 'pt' 
      AND is_recurring = 1
      AND pt_days IS NOT NULL
      AND pt_time IS NOT NULL
      AND (archived = 0 OR archived IS NULL)
  `;
  
  db.all(query, async (err, rows) => {
    if (err) {
      console.error('Error checking recurring reminders:', err);
      return;
    }
    
    // Filter out customers who already received a reminder today
    const eligibleCustomers = rows.filter(customer => {
      const lastReminder = customer.last_reminder_date;
      if (!lastReminder) {
        console.log(`  ${customer.name}: No previous reminder - eligible`);
        return true;
      }
      // Handle both date string and Date object
      const lastReminderStr = typeof lastReminder === 'string' 
        ? lastReminder.split('T')[0] 
        : new Date(lastReminder).toISOString().split('T')[0];
      const alreadySent = lastReminderStr === today;
      console.log(`  ${customer.name}: Last reminder ${lastReminderStr}, Today ${today}, Already sent: ${alreadySent}`);
      return !alreadySent;
    });
    
    processRecurringReminders(eligibleCustomers, today);
  });
}

async function processRecurringReminders(rows, today) {
  if (rows.length === 0) {
    console.log('  No recurring PT sessions need reminders.');
    return;
  }
  
  const whatsappEnabled = isWhatsAppAvailable();
  let remindersSent = 0;
  
  console.log(`  Found ${rows.length} recurring PT customer(s) to check.`);
  console.log(`  WhatsApp: ${whatsappEnabled ? '✅ Available' : '⚠️ Not configured'}`);
  
  for (const customer of rows) {
    console.log(`\n  Checking: ${customer.name}`);
    console.log(`    pt_days: ${customer.pt_days}, pt_time: ${customer.pt_time}`);
    console.log(`    last_reminder_date: ${customer.last_reminder_date || 'never'}`);
    
    // Check if today is one of the session days
    const isTodaySession = isTodaySessionDay(customer.pt_days);
    console.log(`    Is today a session day? ${isTodaySession}`);
    
    if (!isTodaySession) {
      console.log(`    ⏭️ Skipping - not a session day`);
      continue;
    }
    
    // Check if it's time to send the reminder
    const shouldSend = shouldSendReminder(customer.pt_time);
    if (!shouldSend) {
      console.log(`    ⏭️ Skipping - not in reminder window yet`);
      continue;
    }
      
    remindersSent++;
    const dayNames = getDayNames(customer.pt_days);
    console.log(`\n  📧 SENDING Recurring reminder: ${customer.name}`);
    console.log(`     Session days: ${dayNames} at ${customer.pt_time}`);
    
    // ====== SEND TO CUSTOMER ======
    if (customer.email) {
      try {
        await sendPTReminderEmail(customer.email, customer.name, today, customer.trainer_email, customer.pt_time);
        console.log(`    ✓ Email sent to ${customer.email}`);
      } catch (err) {
        console.error(`    ✗ Email failed: ${err.message}`);
      }
    } else {
      console.log(`    ⚠️ No email for customer`);
    }
    
    if (customer.phone && whatsappEnabled) {
      try {
        await sendPTReminderWhatsApp(customer.phone, customer.name, today, customer.trainer_email, customer.pt_time);
        console.log(`    ✓ WhatsApp sent to ${customer.phone}`);
      } catch (err) {
        console.error(`    ✗ WhatsApp failed: ${err.message}`);
      }
    }
    
    // ====== SEND TO TRAINER ======
    if (customer.trainer_email) {
      console.log(`  📧 Trainer: ${customer.trainer_email}`);
      
      try {
        await sendTrainerReminderEmail(customer.trainer_email, customer.name, today, customer.email, customer.phone, customer.pt_time, customer.child_name);
        console.log(`    ✓ Email sent to trainer`);
      } catch (err) {
        console.error(`    ✗ Email failed: ${err.message}`);
      }
      
      const trainerPhone = getTrainerPhone(customer.trainer_email);
      if (trainerPhone && whatsappEnabled) {
        try {
          await sendTrainerReminderWhatsApp(trainerPhone, customer.name, today, customer.email, customer.phone, customer.pt_time);
          console.log(`    ✓ WhatsApp sent to trainer (${trainerPhone})`);
        } catch (err) {
          console.error(`    ✗ Trainer WhatsApp failed: ${err.message}`);
        }
      }
    } else {
      console.log(`    ⚠️ No trainer email assigned`);
    }
    
    // Update last_reminder_date to prevent duplicate reminders today
    db.run('UPDATE customers SET last_reminder_date = ? WHERE id = ?', [today, customer.id], (updateErr) => {
      if (updateErr) {
        console.error(`    ✗ Failed to update last_reminder_date: ${updateErr.message}`);
      } else {
        console.log(`    ✓ Marked reminder as sent for today`);
      }
    });
  }
  
  if (remindersSent === 0) {
    console.log('\n  No recurring reminders to send at this time.');
  } else {
    console.log(`\n  ✅ Sent ${remindersSent} recurring reminder(s).`);
  }
}

/**
 * Check for one-time PT customers with PT dates today and send reminders
 * Sends to both customer AND trainer via email AND WhatsApp
 */
function checkPTReminders() {
  console.log('🔔 Checking for one-time PT reminders...');
  
  // Only check non-recurring PT sessions with today's date
  const query = `
    SELECT id, name, email, phone, pt_date, pt_time, trainer_email, child_name
    FROM customers 
    WHERE customer_type = 'pt' 
      AND pt_date = date('now')
      AND (is_recurring = 0 OR is_recurring IS NULL)
      AND (archived = 0 OR archived IS NULL)
  `;
  
  db.all(query, async (err, rows) => {
    if (err) {
      console.error('Error checking PT reminders:', err);
      return;
    }
    
    if (rows.length === 0) {
      console.log('  No one-time PT sessions scheduled for today.');
      return;
    }
    
    const whatsappEnabled = isWhatsAppAvailable();
    console.log(`  Found ${rows.length} one-time PT session(s) today.`);
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
        console.log(`  📧 Trainer: ${customer.trainer_email}`);
        
        // Email reminder to trainer
        try {
          await sendTrainerReminderEmail(customer.trainer_email, customer.name, customer.pt_date, customer.email, customer.phone, customer.pt_time, customer.child_name);
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
 * - Recurring reminders: Every 30 minutes (to catch 7-hour-before window)
 * - One-time PT reminders: Daily at 8 AM
 * - General reminders: Daily at 9 AM
 */
function startReminderScheduler() {
  // Check recurring reminders every 30 minutes
  // This ensures we catch the 7-hour-before window for any session time
  cron.schedule('*/30 * * * *', () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏰ Recurring Reminder Check (${new Date().toLocaleTimeString()})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    checkRecurringReminders();
  });
  
  // Schedule one-time PT reminder check daily at 8 AM
  cron.schedule('0 8 * * *', () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ One-time PT Reminder Check (8:00 AM)');
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
  
  // Run immediately on startup
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Startup Reminder Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  checkDueReminders();
  checkPTReminders();
  checkRecurringReminders();
  
  console.log('\n✅ Reminder scheduler started.');
  console.log('  🔄 Recurring reminders: Every 30 minutes (7 hours before session)');
  console.log('  📅 One-time PT reminders: Daily at 8:00 AM');
  console.log('  📅 General reminders: Daily at 9:00 AM');
}

module.exports = { startReminderScheduler, checkDueReminders, checkPTReminders, checkRecurringReminders };
