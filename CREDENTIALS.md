# EDDIE CRM - Login Credentials

## Default Admin Account

**Email:** `admin@eddiecrm.com`  
**Password:** `admin123`  
**Role:** ADMIN

## Access URLs

- **Home Page:** http://localhost:3001/
- **Login Page:** http://localhost:3001/login
- **Register Page:** http://localhost:3001/register
- **Dashboard:** http://localhost:3001/dashboard

## Creating Additional Users

### Option 1: Public Registration
Users can create their own accounts at: http://localhost:3001/register
- New users are created with `AGENT` role by default
- Admins can be created via script (see below)

### Option 2: Create Admin via Script
```bash
npm run create-admin [email] [password] [name]
```

Example:
```bash
npm run create-admin admin2@eddiecrm.com securepass123 "Admin User 2"
```

## JotForm Webhook Setup

**Webhook URL:** `http://localhost:3001/api/webhooks/jotform`

**Test Endpoint:** `http://localhost:3001/api/webhooks/jotform/test`

After configuring JotForm to send webhooks to this URL, contacts will automatically appear on the dashboard when forms are submitted.

## Task Creation

Tasks can be created from the Tasks page:
1. Navigate to: http://localhost:3001/tasks
2. Click the "New Task" button
3. Fill in the form and click "Create Task"

## Notes

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Sessions are stored in secure HTTP-only cookies
- The server runs on port 3001 by default

