# Quick Setup Guide - Station Commander Feature

## ⚡ Quick Start (5 minutes)

### Step 1: Run Database Migration
```bash
cd /Users/alexmoran/Documents/programming/ArmyRecruitTool

# Connect to your database and run the migration
psql -U your_username -d your_database -f migrations/002_add_station_commander_features.sql
```

Or if you're using a different database client, execute the SQL file manually.

### Step 2: Make Yourself an Admin
```sql
-- Connect to your database and run:
UPDATE users 
SET role = 'admin' 
WHERE email = 'alex.cybitdevs@gmail.com';
-- Replace with your actual email if different
```

### Step 3: Restart Your Application
```bash
# If using PM2:
pm2 restart all

# Or if running dev server:
npm run dev
```

### Step 4: Test It Out!

#### A. Test Station Commander Request
1. Open a new incognito browser window
2. Go to `/register`
3. Select **"Station Commander"** as account type
4. Fill in the form with justification
5. Submit registration
6. Check admin email (alex.cybitdevs@gmail.com) for notification

#### B. Test Admin Approval
1. Login with your admin account
2. Click **"Admin Requests"** in the navigation menu
3. You should see the pending request
4. Click **"Approve"** or **"Deny"**
5. User receives email notification

#### C. Test Station Commander Dashboard
1. Login as the approved station commander
2. Click **"Station Overview"** in navigation
3. View all recruiter stats
4. Click **"Export Full Report"** to test Excel export

## 🎯 Quick Role Assignment

### Make an Existing User a Station Commander (Skip Request Process)
```sql
-- Directly assign station commander role
UPDATE users 
SET role = 'station_commander' 
WHERE email = 'user@example.com';
```

### Make an Existing User an Admin
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

### Reset a User to Regular Recruiter
```sql
UPDATE users 
SET role = 'recruiter' 
WHERE email = 'user@example.com';
```

## 📊 Verify Installation

### Check Tables Were Created
```sql
-- Should return table info
SELECT * FROM stations LIMIT 1;
SELECT * FROM station_commander_requests LIMIT 1;

-- Check users table has new columns
SELECT id, email, role, station_id FROM users LIMIT 5;
```

### Check Sample Data
```sql
-- Should show a default station was created
SELECT * FROM stations WHERE station_code = 'DEFAULT-001';
```

## 🔧 Environment Variables Check

Make sure these are set in your `.env` file:
```bash
# Required for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## 📱 Access URLs

Once running:
- **Admin Dashboard:** `http://localhost:5000/admin/requests`
- **Station Commander Dashboard:** `http://localhost:5000/station-commander`
- **Registration (with new options):** `http://localhost:5000/register`

## ⚠️ Troubleshooting

### Issue: "Table already exists" error
**Solution:** Skip the migration, tables are already created. Just verify with:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';
```

### Issue: Can't see admin menu
**Solution:** 
```sql
-- Verify you're actually an admin
SELECT email, role FROM users WHERE email = 'your_email@example.com';
-- If role is not 'admin', run the UPDATE command from Step 2
```

### Issue: Email notifications not working
**Solution:** Check your SMTP settings and make sure Gmail allows "Less secure app access" or use an App Password.

### Issue: TypeScript errors
**Solution:** 
```bash
npm install
npm install xlsx  # For Excel export functionality
```

## 🎉 Success Checklist

- [ ] Database migration completed
- [ ] Your account is set to admin role
- [ ] Can access `/admin/requests` page
- [ ] Can see "Admin Requests" in navigation menu
- [ ] Registration form shows account type selection
- [ ] Can create a test station commander request
- [ ] Receive admin notification email
- [ ] Can approve/deny requests
- [ ] Station commander can access dashboard
- [ ] Excel export works

## 📚 Next Steps

Once setup is complete:
1. Read the full implementation guide: `STATION_COMMANDER_IMPLEMENTATION.md`
2. Assign existing users to appropriate roles
3. Create actual recruiting stations in the database (optional)
4. Test the complete workflow with real users

## 🆘 Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check server logs for backend errors
3. Verify database connection
4. Ensure all npm packages are installed
5. Contact: alex.cybitdevs@gmail.com

---

**Setup Time:** ~5 minutes  
**Difficulty:** Easy  
**Prerequisites:** Running application, database access

