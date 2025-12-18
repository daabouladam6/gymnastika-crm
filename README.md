# Customer CRM Application

A full-stack customer relationship management application with employee authentication, customer tracking, PT management, and automatic email reminders for personal training businesses.

## Features

- ✅ **Employee Authentication**: Secure login system for employees
- ✅ **Customer Management**: Add, edit, and delete customers with full contact information
- ✅ **Basic & PT Customers**: Separate sections for basic customers and PT (Personal Training) customers
- ✅ **Automatic Email Reminders**: Send automatic email reminders on PT dates
- ✅ **Reminder System**: Create and manage follow-up reminders
- ✅ **Daily Reminder Checks**: Automated daily checks for due reminders (runs at 9 AM)
- ✅ **PT Email Reminders**: Automatic emails sent on PT session dates (runs at 8 AM)
- ✅ **Modern UI**: Clean, responsive interface built with Next.js and React

## Tech Stack

### Backend
- Node.js + Express
- SQLite database
- JWT authentication
- Nodemailer for email sending
- Node-cron for scheduled tasks
- bcryptjs for password hashing

### Frontend
- Next.js 14
- React 18
- Axios for API calls
- date-fns for date formatting
- JWT token-based authentication

## Project Structure

```
customer-crm/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express server
│   │   ├── routes/
│   │   │   ├── customers.js        # Customer CRUD endpoints
│   │   │   ├── reminders.js        # Reminder endpoints
│   │   │   └── auth.js              # Authentication endpoints
│   │   ├── services/
│   │   │   ├── email.js            # Email sending service
│   │   │   └── reminderScheduler.js # Cron scheduler
│   │   ├── middleware/
│   │   │   ├── auth.js              # Authentication middleware
│   │   │   └── errorHandler.js     # Error handling
│   │   └── scripts/
│   │       └── create-user.js       # Script to create employee accounts
│   ├── database/
│   │   ├── db.js                   # Database connection
│   │   └── customers.db            # SQLite database (auto-created)
│   └── package.json
├── frontend/
│   ├── pages/
│   │   ├── index.jsx               # Main dashboard
│   │   ├── login.jsx               # Login page
│   │   └── _app.js                 # App wrapper
│   ├── components/
│   │   ├── CustomerForm.jsx        # Basic customer form
│   │   ├── CustomerList.jsx        # Basic customer list
│   │   ├── PTCustomerForm.jsx      # PT customer form
│   │   ├── PTCustomerList.jsx      # PT customer list
│   │   ├── ReminderForm.jsx        # Reminder form
│   │   └── ReminderList.jsx        # Reminder list
│   ├── lib/
│   │   └── auth.js                 # Auth utility functions
│   ├── styles/
│   │   └── globals.css
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Email account for SMTP (Gmail, Outlook, etc.)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd customer-crm/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=3001
   JWT_SECRET=your-secret-key-change-this-in-production
   
   # Email Configuration (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=your-email@gmail.com
   SMTP_FROM_NAME=Customer CRM
   ```

   **For Gmail:**
   - Use an App Password (not your regular password)
   - Enable 2-factor authentication
   - Generate App Password: https://myaccount.google.com/apppasswords

4. **Create first employee account:**
   ```bash
   node scripts/create-user.js
   ```
   Follow the prompts to create your first employee account.

5. **Start the backend server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```
   
   The server will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd customer-crm/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL (optional):**
   
   If your backend runs on a different port or URL, create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The app will run on `http://localhost:3000`

## Usage

### Login

1. Open http://localhost:3000 in your browser
2. You'll be redirected to the login page
3. Enter your employee username/email and password
4. After login, you'll see the dashboard

### Adding Basic Customers

1. Go to the "Basic Customers" tab
2. Fill in the customer form:
   - Name (required)
   - Phone Number (required)
   - Email (optional)
   - Child's Name (optional)
   - Referral Source (optional)
   - Notes (optional)
3. Click "Add Customer"

### Adding PT Customers

1. Go to the "PT Customers" tab
2. Fill in the PT customer form:
   - Name (required)
   - Phone Number (required)
   - Email (required) - for automatic reminders
   - PT Date (required) - email will be sent automatically on this date
   - Child's Name (optional)
   - Referral Source (optional)
   - Notes (optional)
3. Click "Add PT Customer"
4. An email reminder will be automatically sent on the PT date

### Creating Reminders

1. Go to the "Reminders" tab
2. Select a customer from the dropdown
3. Choose a reminder date
4. Select reminder type (Follow Up Call, Check In, Appointment, Other)
5. Add optional notes
6. Click "Create Reminder"
7. Email reminders will be sent automatically when due

### Viewing Due Reminders

- The "Reminders" tab shows all reminders due today or overdue
- Overdue reminders are highlighted in orange
- Click "Mark as Completed" when you've followed up

### Automatic Email Reminders

- **PT Reminders**: Sent automatically at 8:00 AM on the PT date
- **General Reminders**: Sent automatically at 9:00 AM when due
- Emails are sent to the customer's email address
- Check backend console logs to see email sending status

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new employee (admin only in production)
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout (client-side token removal)

### Customers

- `GET /api/customers` - List all customers (query: `?type=basic` or `?type=pt`)
- `GET /api/customers/basic` - List basic customers only
- `GET /api/customers/pt` - List PT customers only
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer (requires auth)
- `PUT /api/customers/:id` - Update customer (requires auth)
- `DELETE /api/customers/:id` - Delete customer (requires auth)

### Reminders

- `GET /api/reminders` - List all reminders
- `GET /api/reminders/due` - Get due reminders
- `GET /api/reminders/customer/:customerId` - Get reminders for a customer
- `POST /api/reminders` - Create reminder (requires auth)
- `PUT /api/reminders/:id` - Update reminder (requires auth)
- `PUT /api/reminders/:id/complete` - Mark reminder as completed (requires auth)
- `DELETE /api/reminders/:id` - Delete reminder (requires auth)

### Health Check

- `GET /api/health` - Server health status

## Database Schema

### users table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - Hashed password
- `full_name` - Employee full name
- `role` - Role (employee/admin)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### customers table
- `id` - Primary key
- `name` - Customer name
- `phone` - Phone number
- `email` - Email address
- `child_name` - Child's name
- `referral_source` - Referral source
- `notes` - Additional notes
- `customer_type` - 'basic' or 'pt'
- `pt_date` - PT session date (for PT customers)
- `wants_pt` - PT interest flag (legacy)
- `pt_message_sent` - Message sent flag (legacy)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### reminders table
- `id` - Primary key
- `customer_id` - Foreign key to customers
- `reminder_date` - Date of reminder
- `reminder_type` - Type of reminder (follow_up, check_in, appointment, other)
- `completed` - Completion flag (0 or 1)
- `notes` - Reminder notes
- `created_at` - Creation timestamp

## Environment Variables

### Backend `.env` file:
```env
PORT=3001
JWT_SECRET=your-secret-key-change-this-in-production

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=Customer CRM
```

## Creating Employee Accounts

### Using the Script (Recommended)

```bash
cd backend
node scripts/create-user.js
```

Follow the prompts to create an employee account.

### Using the API

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "employee1",
    "email": "employee@example.com",
    "password": "securepassword",
    "full_name": "John Doe",
    "role": "employee"
  }'
```

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify all dependencies are installed (`npm install`)
- Check `.env` file exists and has correct format

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env.local` if using custom URL
- Verify CORS is enabled in backend (it is by default)

### Email not sending
- Verify SMTP credentials in `.env` file
- For Gmail, use App Password (not regular password)
- Check server logs for email errors
- Verify email address is correct in customer record

### Authentication errors
- Make sure JWT_SECRET is set in `.env`
- Check that token is being sent in Authorization header
- Verify user account exists in database

### Database errors
- Ensure SQLite is installed (comes with Node.js)
- Check file permissions for `database/customers.db`
- Database is created automatically on first run

## Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
npm start
```

## Security Notes

- Change `JWT_SECRET` in production
- Use strong passwords for employee accounts
- Enable HTTPS in production
- Regularly update dependencies
- Keep email credentials secure

## License

ISC

## Support

For issues or questions, please check the troubleshooting section or review the code comments for implementation details.
