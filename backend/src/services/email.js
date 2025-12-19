require('dotenv').config();
const nodemailer = require('nodemailer');
const { getTrainerName } = require('../config/trainers');

// Create reusable transporter object using SMTP transport
let transporter = null;

// Initialize email transporter
function initializeEmailTransporter() {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  };

  // Only create transporter if credentials are provided
  if (emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransport(emailConfig);
    
    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email server is ready to send messages');
      }
    });
  } else {
    console.log('Email not configured. Set SMTP_USER and SMTP_PASSWORD in .env');
  }
}

/**
 * Send email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @param {string} text - Plain text email body (optional)
 * @returns {Promise} - Email result
 */
async function sendEmail(to, subject, html, text = null) {
  if (!transporter) {
    console.log('Email not configured. Email would be sent to:', to);
    console.log('Subject:', subject);
    console.log('Body:', text || html);
    return Promise.resolve({ status: 'not_sent', reason: 'email_not_configured' });
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'Gymnastika.lb@gmail.com';
  const fromName = process.env.SMTP_FROM_NAME || 'Gymnastika';

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: to,
    subject: subject,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    html: html
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send welcome email to new customer
 * @param {string} to - Customer email address
 * @param {string} customerName - Customer name
 * @returns {Promise} - Email result
 */
async function sendWelcomeEmail(to, customerName) {
  const subject = 'Welcome to Gymnastika!';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Gymnastika!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Thank you for your interest in Gymnastika! We're excited to have you as part of our community.</p>
          <p>We're here to help you achieve your fitness goals and provide you with the best training experience possible.</p>
          <p>If you have any questions or need assistance, please don't hesitate to reach out to us.</p>
          <p>Best regards,<br>The Gymnastika Team</p>
        </div>
        <div class="footer">
          <p>This is an automated welcome email from Gymnastika.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${customerName},\n\nThank you for your interest in Gymnastika! We're excited to have you as part of our community.\n\nWe're here to help you achieve your fitness goals and provide you with the best training experience possible.\n\nIf you have any questions or need assistance, please don't hesitate to reach out to us.\n\nBest regards,\nThe Gymnastika Team`;

  return sendEmail(to, subject, html, text);
}

/**
 * Send PT confirmation email to new PT customer
 * @param {string} to - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} ptDate - PT session date
 * @param {string} trainerEmail - Trainer email (to look up name)
 * @param {string} ptTime - PT session time (optional)
 * @returns {Promise} - Email result
 */
async function sendPTConfirmationEmail(to, customerName, ptDate, trainerEmail = null, ptTime = null) {
  const trainerName = trainerEmail ? getTrainerName(trainerEmail) : 'Your Coach';
  const dateTimeDisplay = ptTime ? `${ptDate} at ${ptTime}` : ptDate;
  const subject = `Your Private Session at Gymnastika - ${dateTimeDisplay}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .session-box { background-color: #fff; padding: 20px; border-left: 5px solid #28a745; margin: 25px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .session-box h2 { color: #28a745; margin: 0 0 10px 0; font-size: 18px; }
        .session-date { font-size: 24px; font-weight: bold; color: #333; }
        .session-time { font-size: 20px; font-weight: bold; color: #007bff; margin-top: 5px; }
        .coach-name { font-size: 18px; color: #6f42c1; font-weight: bold; margin-top: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Gymnastika!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Thank you for booking a private session with us at Gymnastika!</p>
          
          <div class="session-box">
            <h2>Your Private Session is Scheduled</h2>
            <p class="session-date">📅 ${ptDate}</p>
            ${ptTime ? `<p class="session-time">🕐 Time: ${ptTime}</p>` : ''}
            <p class="coach-name">🏋️ Coach: ${trainerName}</p>
          </div>
          
          <p>We're excited to work with you and help you achieve your fitness goals through personalized training with <strong>${trainerName}</strong>.</p>
          
          <p><strong>What to bring:</strong></p>
          <ul>
            <li>Comfortable workout clothes</li>
            <li>Water bottle</li>
            <li>Positive attitude!</li>
          </ul>
          
          <p>Please arrive a few minutes early so we can get started on time. If you need to reschedule, please contact us as soon as possible.</p>
          
          <p>We look forward to seeing you!</p>
          
          <p>Best regards,<br><strong>The Gymnastika Team</strong></p>
        </div>
        <div class="footer">
          <p>Gymnastika - Your Fitness Journey Starts Here</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${customerName},\n\nThank you for booking a private session with us at Gymnastika!\n\nYOUR PRIVATE SESSION IS SCHEDULED:\nDate: ${ptDate}${ptTime ? `\nTime: ${ptTime}` : ''}\nCoach: ${trainerName}\n\nWe're excited to work with you and help you achieve your fitness goals through personalized training with ${trainerName}.\n\nWhat to bring:\n- Comfortable workout clothes\n- Water bottle\n- Positive attitude!\n\nPlease arrive a few minutes early so we can get started on time. If you need to reschedule, please contact us as soon as possible.\n\nWe look forward to seeing you!\n\nBest regards,\nThe Gymnastika Team`;

  return sendEmail(to, subject, html, text);
}

/**
 * Send PT reminder email on the day of the session
 * @param {string} to - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} ptDate - PT date
 * @param {string} trainerEmail - Trainer email (to look up name)
 * @param {string} ptTime - PT session time (optional)
 * @returns {Promise} - Email result
 */
async function sendPTReminderEmail(to, customerName, ptDate, trainerEmail = null, ptTime = null) {
  const trainerName = trainerEmail ? getTrainerName(trainerEmail) : 'Your Coach';
  const timeDisplay = ptTime ? ` at ${ptTime}` : '';
  const subject = `TODAY${timeDisplay}: Your Private Session with ${trainerName} at Gymnastika!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ff6b35; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .today-box { background-color: #fff; padding: 25px; border: 3px solid #ff6b35; border-radius: 8px; margin: 25px 0; text-align: center; }
        .today-box h2 { color: #ff6b35; margin: 0 0 10px 0; font-size: 22px; }
        .today-box .date { font-size: 20px; font-weight: bold; color: #333; }
        .today-box .time { font-size: 22px; font-weight: bold; color: #007bff; margin-top: 5px; }
        .today-box .coach { font-size: 18px; color: #6f42c1; font-weight: bold; margin-top: 10px; }
        .checklist { background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .checklist h3 { color: #28a745; margin: 0 0 15px 0; }
        .checklist ul { margin: 0; padding-left: 20px; }
        .checklist li { margin-bottom: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Session is TODAY!</h1>
          <p>Get ready for your private training with ${trainerName}${timeDisplay}</p>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Just a friendly reminder that your <strong>private session</strong> with <strong>${trainerName}</strong> at Gymnastika is scheduled for <strong>today${timeDisplay}</strong>!</p>
          
          <div class="today-box">
            <h2>📅 Session Date</h2>
            <p class="date">${ptDate}</p>
            ${ptTime ? `<p class="time">🕐 Time: ${ptTime}</p>` : ''}
            <p class="coach">🏋️ Coach: ${trainerName}</p>
          </div>
          
          <div class="checklist">
            <h3>✓ Quick Checklist</h3>
            <ul>
              <li>Comfortable workout clothes</li>
              <li>Water bottle</li>
              <li>Arrive a few minutes early</li>
            </ul>
          </div>
          
          <p>We're excited to see you and help you crush your fitness goals today with ${trainerName}!</p>
          
          <p>See you soon!</p>
          
          <p>Best regards,<br><strong>The Gymnastika Team</strong></p>
        </div>
        <div class="footer">
          <p>Gymnastika - Your Fitness Journey Starts Here</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${customerName},\n\nJust a friendly reminder that your PRIVATE SESSION with ${trainerName} at Gymnastika is scheduled for TODAY!\n\nSession Date: ${ptDate}${ptTime ? `\nTime: ${ptTime}` : ''}\nCoach: ${trainerName}\n\nQUICK CHECKLIST:\n- Comfortable workout clothes\n- Water bottle\n- Arrive a few minutes early\n\nWe're excited to see you and help you crush your fitness goals today with ${trainerName}!\n\nSee you soon!\n\nBest regards,\nThe Gymnastika Team`;

  return sendEmail(to, subject, html, text);
}

/**
 * Send general reminder email
 * @param {string} to - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} reminderType - Type of reminder
 * @param {string} reminderDate - Reminder date
 * @param {string} notes - Additional notes
 * @returns {Promise} - Email result
 */
async function sendReminderEmail(to, customerName, reminderType, reminderDate, notes = '') {
  const subject = `Reminder: ${reminderType.replace('_', ' ').toUpperCase()} - ${reminderDate}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>This is a reminder for: <strong>${reminderType.replace('_', ' ').toUpperCase()}</strong></p>
          <p>Date: <strong>${reminderDate}</strong></p>
          ${notes ? `<p>Notes: ${notes}</p>` : ''}
          <p>Best regards,<br>Your Team</p>
        </div>
        <div class="footer">
          <p>This is an automated reminder email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${customerName},\n\nThis is a reminder for: ${reminderType.replace('_', ' ').toUpperCase()}\nDate: ${reminderDate}${notes ? `\nNotes: ${notes}` : ''}\n\nBest regards,\nYour Team`;

  return sendEmail(to, subject, html, text);
}

/**
 * Send PT confirmation email to TRAINER about a new client session
 * @param {string} to - Trainer email address
 * @param {string} clientName - Client name
 * @param {string} ptDate - PT session date
 * @param {string} clientEmail - Client email (optional)
 * @param {string} clientPhone - Client phone
 * @param {string} ptTime - PT session time (optional)
 * @returns {Promise} - Email result
 */
async function sendTrainerConfirmationEmail(to, clientName, ptDate, clientEmail, clientPhone, ptTime = null) {
  const dateTimeDisplay = ptTime ? `${ptDate} at ${ptTime}` : ptDate;
  const subject = `New Client Session Scheduled - ${clientName} on ${dateTimeDisplay}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6f42c1; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .client-box { background-color: #fff; padding: 20px; border-left: 5px solid #6f42c1; border-radius: 4px; margin: 25px 0; }
        .client-box h2 { color: #6f42c1; margin: 0 0 15px 0; font-size: 18px; }
        .client-info { margin: 10px 0; }
        .client-info strong { color: #333; }
        .session-time { color: #007bff; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Session Scheduled</h1>
        </div>
        <div class="content">
          <p>Hi,</p>
          <p>A new private session has been scheduled for you at Gymnastika!</p>
          
          <div class="client-box">
            <h2>📋 Client Details</h2>
            <p class="client-info"><strong>Client Name:</strong> ${clientName}</p>
            <p class="client-info"><strong>Session Date:</strong> ${ptDate}</p>
            ${ptTime ? `<p class="client-info"><strong>🕐 Session Time:</strong> <span class="session-time">${ptTime}</span></p>` : ''}
            <p class="client-info"><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
            ${clientEmail ? `<p class="client-info"><strong>Email:</strong> ${clientEmail}</p>` : ''}
          </div>
          
          <p>Please make sure to prepare for this session and contact the client if needed.</p>
          
          <p>Best regards,<br><strong>Gymnastika</strong></p>
        </div>
        <div class="footer">
          <p>Gymnastika - Trainer Notification</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi,\n\nA new private session has been scheduled for you at Gymnastika!\n\nCLIENT DETAILS:\nClient Name: ${clientName}\nSession Date: ${ptDate}${ptTime ? `\nSession Time: ${ptTime}` : ''}\nPhone: ${clientPhone || 'Not provided'}${clientEmail ? `\nEmail: ${clientEmail}` : ''}\n\nPlease make sure to prepare for this session and contact the client if needed.\n\nBest regards,\nGymnastika`;

  return sendEmail(to, subject, html, text);
}

/**
 * Send PT reminder email to TRAINER on the day of the session
 * @param {string} to - Trainer email address
 * @param {string} clientName - Client name
 * @param {string} ptDate - PT session date
 * @param {string} clientEmail - Client email (optional)
 * @param {string} clientPhone - Client phone
 * @param {string} ptTime - PT session time (optional)
 * @returns {Promise} - Email result
 */
async function sendTrainerReminderEmail(to, clientName, ptDate, clientEmail, clientPhone, ptTime = null) {
  const timeDisplay = ptTime ? ` at ${ptTime}` : '';
  const subject = `TODAY${timeDisplay}: Session with ${clientName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ff6b35; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .today-box { background-color: #fff; padding: 25px; border: 3px solid #ff6b35; border-radius: 8px; margin: 25px 0; }
        .today-box h2 { color: #ff6b35; margin: 0 0 15px 0; font-size: 20px; }
        .client-info { margin: 10px 0; font-size: 16px; }
        .client-info strong { color: #333; }
        .session-time { color: #007bff; font-weight: bold; font-size: 18px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Session TODAY${timeDisplay}!</h1>
          <p>Don't forget your client session</p>
        </div>
        <div class="content">
          <p>Hi,</p>
          <p>Just a reminder that you have a <strong>private session TODAY${timeDisplay}</strong>!</p>
          
          <div class="today-box">
            <h2>📅 Today's Session</h2>
            <p class="client-info"><strong>Client:</strong> ${clientName}</p>
            <p class="client-info"><strong>Date:</strong> ${ptDate}</p>
            ${ptTime ? `<p class="client-info"><strong>🕐 Time:</strong> <span class="session-time">${ptTime}</span></p>` : ''}
            <p class="client-info"><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
            ${clientEmail ? `<p class="client-info"><strong>Email:</strong> ${clientEmail}</p>` : ''}
          </div>
          
          <p>Make sure you're prepared and have everything ready for the session!</p>
          
          <p>Have a great session!</p>
          
          <p>Best regards,<br><strong>Gymnastika</strong></p>
        </div>
        <div class="footer">
          <p>Gymnastika - Trainer Reminder</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi,\n\nJust a reminder that you have a PRIVATE SESSION TODAY${timeDisplay}!\n\nTODAY'S SESSION:\nClient: ${clientName}\nDate: ${ptDate}${ptTime ? `\nTime: ${ptTime}` : ''}\nPhone: ${clientPhone || 'Not provided'}${clientEmail ? `\nEmail: ${clientEmail}` : ''}\n\nMake sure you're prepared and have everything ready for the session!\n\nHave a great session!\n\nBest regards,\nGymnastika`;

  return sendEmail(to, subject, html, text);
}

/**
 * Send PT date change email to CUSTOMER
 * @param {string} to - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} oldDate - Old PT session date
 * @param {string} newDate - New PT session date
 * @param {string} trainerEmail - Trainer email (to look up name)
 * @returns {Promise} - Email result
 */
async function sendPTDateChangeEmail(to, customerName, oldDate, newDate, trainerEmail = null) {
  const trainerName = trainerEmail ? getTrainerName(trainerEmail) : 'Your Coach';
  const subject = `Session Date Changed - New Date: ${newDate}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ffc107; color: #333; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .date-change { background-color: #fff; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .old-date { color: #dc3545; text-decoration: line-through; font-size: 18px; }
        .new-date { color: #28a745; font-size: 24px; font-weight: bold; }
        .coach-name { color: #6f42c1; font-weight: bold; font-size: 16px; margin-top: 15px; }
        .arrow { font-size: 24px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Session Date Changed</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Your private session with <strong>${trainerName}</strong> at Gymnastika has been rescheduled.</p>
          
          <div class="date-change" style="text-align: center;">
            <p class="old-date">${oldDate}</p>
            <p class="arrow">↓</p>
            <p class="new-date">${newDate}</p>
            <p class="coach-name">🏋️ Coach: ${trainerName}</p>
          </div>
          
          <p>Please make note of your new session date. If you have any questions or need to make further changes, please contact us.</p>
          
          <p>We look forward to seeing you!</p>
          
          <p>Best regards,<br><strong>The Gymnastika Team</strong></p>
        </div>
        <div class="footer">
          <p>Gymnastika - Your Fitness Journey Starts Here</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${customerName},\n\nYour private session with ${trainerName} at Gymnastika has been rescheduled.\n\nOLD DATE: ${oldDate}\nNEW DATE: ${newDate}\nCoach: ${trainerName}\n\nPlease make note of your new session date. If you have any questions or need to make further changes, please contact us.\n\nWe look forward to seeing you!\n\nBest regards,\nThe Gymnastika Team`;

  return sendEmail(to, subject, html, text);
}

/**
 * Send PT date change email to TRAINER
 * @param {string} to - Trainer email address
 * @param {string} clientName - Client name
 * @param {string} oldDate - Old PT session date
 * @param {string} newDate - New PT session date
 * @param {string} clientEmail - Client email (optional)
 * @param {string} clientPhone - Client phone
 * @returns {Promise} - Email result
 */
async function sendTrainerDateChangeEmail(to, clientName, oldDate, newDate, clientEmail, clientPhone) {
  const subject = `Session Date Changed - ${clientName}: ${newDate}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ffc107; color: #333; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .change-box { background-color: #fff; padding: 20px; border-left: 5px solid #ffc107; border-radius: 4px; margin: 25px 0; }
        .change-box h2 { color: #333; margin: 0 0 15px 0; font-size: 18px; }
        .old-date { color: #dc3545; text-decoration: line-through; }
        .new-date { color: #28a745; font-weight: bold; font-size: 18px; }
        .client-info { margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Client Session Rescheduled</h1>
        </div>
        <div class="content">
          <p>Hi,</p>
          <p>A client's session date has been changed.</p>
          
          <div class="change-box">
            <h2>📋 Updated Session Details</h2>
            <p class="client-info"><strong>Client:</strong> ${clientName}</p>
            <p class="client-info"><strong>Old Date:</strong> <span class="old-date">${oldDate}</span></p>
            <p class="client-info"><strong>New Date:</strong> <span class="new-date">${newDate}</span></p>
            <p class="client-info"><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
            ${clientEmail ? `<p class="client-info"><strong>Email:</strong> ${clientEmail}</p>` : ''}
          </div>
          
          <p>Please update your schedule accordingly.</p>
          
          <p>Best regards,<br><strong>Gymnastika</strong></p>
        </div>
        <div class="footer">
          <p>Gymnastika - Trainer Notification</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi,\n\nA client's session date has been changed.\n\nUPDATED SESSION DETAILS:\nClient: ${clientName}\nOld Date: ${oldDate}\nNew Date: ${newDate}\nPhone: ${clientPhone || 'Not provided'}${clientEmail ? `\nEmail: ${clientEmail}` : ''}\n\nPlease update your schedule accordingly.\n\nBest regards,\nGymnastika`;

  return sendEmail(to, subject, html, text);
}

/**
 * Send PT cancellation email to CUSTOMER
 * @param {string} to - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} ptDate - PT session date that was cancelled
 * @param {string} trainerEmail - Trainer email (to look up name)
 * @returns {Promise} - Email result
 */
async function sendPTCancellationEmail(to, customerName, ptDate, trainerEmail = null) {
  const trainerName = trainerEmail ? getTrainerName(trainerEmail) : 'Your Coach';
  const subject = `Session Cancelled - ${ptDate}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .cancel-box { background-color: #fff; padding: 20px; border-left: 5px solid #dc3545; border-radius: 4px; margin: 25px 0; text-align: center; }
        .cancelled-date { color: #dc3545; text-decoration: line-through; font-size: 20px; font-weight: bold; }
        .coach-name { color: #6f42c1; font-weight: bold; font-size: 16px; margin-top: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Session Cancelled</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>We're writing to inform you that your private session with <strong>${trainerName}</strong> at Gymnastika has been <strong>cancelled</strong>.</p>
          
          <div class="cancel-box">
            <p>Cancelled Session:</p>
            <p class="cancelled-date">${ptDate}</p>
            <p class="coach-name">🏋️ Coach: ${trainerName}</p>
          </div>
          
          <p>If you did not request this cancellation or would like to reschedule, please contact us as soon as possible.</p>
          
          <p>We apologize for any inconvenience and hope to see you again soon!</p>
          
          <p>Best regards,<br><strong>The Gymnastika Team</strong></p>
        </div>
        <div class="footer">
          <p>Gymnastika - Your Fitness Journey Starts Here</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${customerName},\n\nWe're writing to inform you that your private session with ${trainerName} at Gymnastika has been CANCELLED.\n\nCancelled Session: ${ptDate}\nCoach: ${trainerName}\n\nIf you did not request this cancellation or would like to reschedule, please contact us as soon as possible.\n\nWe apologize for any inconvenience and hope to see you again soon!\n\nBest regards,\nThe Gymnastika Team`;

  return sendEmail(to, subject, html, text);
}

/**
 * Send PT cancellation email to TRAINER
 * @param {string} to - Trainer email address
 * @param {string} clientName - Client name
 * @param {string} ptDate - PT session date that was cancelled
 * @param {string} clientEmail - Client email (optional)
 * @param {string} clientPhone - Client phone
 * @returns {Promise} - Email result
 */
async function sendTrainerCancellationEmail(to, clientName, ptDate, clientEmail, clientPhone) {
  const subject = `Session Cancelled - ${clientName} (${ptDate})`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .cancel-box { background-color: #fff; padding: 20px; border-left: 5px solid #dc3545; border-radius: 4px; margin: 25px 0; }
        .cancel-box h2 { color: #dc3545; margin: 0 0 15px 0; font-size: 18px; }
        .cancelled-date { color: #dc3545; text-decoration: line-through; font-weight: bold; }
        .client-info { margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Client Session Cancelled</h1>
        </div>
        <div class="content">
          <p>Hi,</p>
          <p>A client's session has been <strong>cancelled</strong>.</p>
          
          <div class="cancel-box">
            <h2>Cancelled Session Details</h2>
            <p class="client-info"><strong>Client:</strong> ${clientName}</p>
            <p class="client-info"><strong>Cancelled Date:</strong> <span class="cancelled-date">${ptDate}</span></p>
            <p class="client-info"><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
            ${clientEmail ? `<p class="client-info"><strong>Email:</strong> ${clientEmail}</p>` : ''}
          </div>
          
          <p>Please update your schedule accordingly. This time slot is now available.</p>
          
          <p>Best regards,<br><strong>Gymnastika</strong></p>
        </div>
        <div class="footer">
          <p>Gymnastika - Trainer Notification</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi,\n\nA client's session has been CANCELLED.\n\nCANCELLED SESSION DETAILS:\nClient: ${clientName}\nCancelled Date: ${ptDate}\nPhone: ${clientPhone || 'Not provided'}${clientEmail ? `\nEmail: ${clientEmail}` : ''}\n\nPlease update your schedule accordingly. This time slot is now available.\n\nBest regards,\nGymnastika`;

  return sendEmail(to, subject, html, text);
}

// Initialize email transporter on module load
initializeEmailTransporter();

module.exports = { 
  sendEmail, 
  sendWelcomeEmail,
  sendPTConfirmationEmail,
  sendPTReminderEmail, 
  sendReminderEmail,
  sendTrainerConfirmationEmail,
  sendTrainerReminderEmail,
  sendPTDateChangeEmail,
  sendTrainerDateChangeEmail,
  sendPTCancellationEmail,
  sendTrainerCancellationEmail,
  initializeEmailTransporter
};

