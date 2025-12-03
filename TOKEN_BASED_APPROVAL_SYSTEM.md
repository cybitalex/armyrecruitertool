# Token-Based Approval System

## 🎯 Overview

Instead of requiring admin login to approve/deny station commander requests, the system now uses **secure, expiring email links**. This is more convenient and secure.

## 📧 How It Works

### 1. User Requests Station Commander Access
- User registers and selects "Station Commander" as account type
- Provides justification for the request
- Account is created with `role = 'pending_station_commander'`

### 2. You Receive Email Notification
- Email sent to: **alex.cybitdevs@gmail.com**
- Contains:
  - User's name, email, rank, unit
  - Their justification
  - **Two buttons: Approve ✅ and Deny ❌**
  - Expiration notice (7 days)

### 3. You Click a Button
- Click **Approve** → User becomes station commander
- Click **Deny** → User becomes regular recruiter
- **No login required!** Just click the link in the email

### 4. User Gets Notified
- Automatic email sent to the user
- If approved: Welcome email with station commander access info
- If denied: Polite notification, account works as regular recruiter

### 5. Link Expires After 7 Days
- Security feature to prevent old links from being used
- If expired, user needs to request again

## 🔐 Security Features

1. **Unique Tokens**: Each request has a unique, random 64-character token
2. **Expiration**: Links automatically expire after 7 days
3. **One-Time Use**: Once processed (approved/denied), link can't be reused
4. **No Auth Required**: No need to share admin passwords
5. **Direct Database Lookup**: Token is verified against database

## 🎯 Your Admin Account

- **Email**: moran.alex@icloud.com (your existing account)
- **Role**: admin
- **Access**: Both admin dashboard and station commander features
- **Login**: Use your existing password

## 📬 Email Flow

```
User Registers → Email to alex.cybitdevs@gmail.com
                 ↓
         You Click Approve/Deny
                 ↓
         System Updates Database
                 ↓
         User Receives Notification
```

## 🚀 Quick Deploy

The updated system is ready to deploy:

```bash
cd /Users/alexmoran/Documents/programming/cybit-k8s
./deploy-station-commander-feature.sh
```

This will:
1. Run migration 002 (add tables, role columns)
2. Run migration 003 (add approval tokens)
3. Set moran.alex@icloud.com as admin
4. Deploy the application
5. Configure email to alex.cybitdevs@gmail.com

## 📋 What Changed

### Database:
- Added `approval_token` column (unique 64-char string)
- Added `token_expires` column (timestamp)
- Added index for fast token lookups

### Email Template:
- Now includes approve/deny buttons
- Shows expiration warning
- Explains the process

### New Endpoint:
- `GET /api/approve-request?token=xxx&action=approve` (public, no auth)
- `GET /api/approve-request?token=xxx&action=deny` (public, no auth)

### New Page:
- `/approval-success` - Shows confirmation after clicking approve/deny

### Admin Dashboard:
- Still available at `/admin/requests` for manual review
- Both token-based and dashboard methods work

## 🧪 Testing

1. **Test Registration**:
   ```
   - Go to /register
   - Select "Station Commander"
   - Fill form and submit
   ```

2. **Check Email**:
   ```
   - Check alex.cybitdevs@gmail.com
   - Should receive email with approve/deny buttons
   ```

3. **Click Approve**:
   ```
   - Click green "Approve" button
   - Should see success page
   - User receives approval email
   ```

4. **Verify Access**:
   ```
   - Login as the approved user
   - Should see "Station Overview" in menu
   - Can access station commander dashboard
   ```

## 💡 Benefits Over Login-Required System

1. ✅ **No Password Sharing**: Don't need to give out admin credentials
2. ✅ **Mobile Friendly**: Can approve from phone email
3. ✅ **Faster**: One click vs login + navigate + approve
4. ✅ **More Secure**: Unique, expiring tokens
5. ✅ **Audit Trail**: All approvals tracked in database
6. ✅ **Flexible**: Can still use admin dashboard if preferred

## 🔧 Configuration

All configuration is automatic, but you can customize:

**Email Settings** (in Kubernetes secrets):
- `SMTP_HOST`: smtp.gmail.com
- `SMTP_USER`: Your Gmail address
- `SMTP_PASSWORD`: Your Gmail app password

**Token Expiration** (in code):
- Default: 7 days
- Change in `server/auth.ts` line: `tokenExpires.setDate(tokenExpires.getDate() + 7);`

**Notification Email** (in code):
- Currently: alex.cybitdevs@gmail.com
- Change in `server/auth.ts`: `const adminEmail = 'your-email@example.com';`

## 📊 Database Schema

```sql
station_commander_requests:
  - id (UUID)
  - user_id (UUID) → links to users table
  - justification (TEXT)
  - status (TEXT: pending/approved/denied)
  - approval_token (TEXT, unique) ← NEW
  - token_expires (TIMESTAMP) ← NEW
  - reviewed_at (TIMESTAMP)
  - created_at (TIMESTAMP)
```

## 🆘 Troubleshooting

### Email not received?
- Check spam folder
- Verify SMTP settings in Kubernetes secrets
- Check application logs: `kubectl logs -f deployment/army-recruiter`

### Link says "expired"?
- Request was created more than 7 days ago
- User needs to register again

### Link says "already processed"?
- The request was already approved or denied
- Each link can only be used once

### Want to use admin dashboard instead?
- Login as moran.alex@icloud.com
- Navigate to "Admin Requests" in menu
- Approve/deny from there

## 📚 Files Changed

1. **Database Migrations**:
   - `migrations/002_add_station_commander_features.sql` - Base tables
   - `migrations/003_add_approval_tokens.sql` - Token system

2. **Backend**:
   - `server/auth.ts` - Token generation, email templates
   - `server/routes.ts` - Token-based approval endpoint

3. **Frontend**:
   - `pages/approval-success.tsx` - Success confirmation page
   - `App.tsx` - Added route for approval success

4. **Deployment**:
   - `deploy-station-commander-feature.sh` - Updated for both migrations

---

**Ready to deploy?** Run:
```bash
cd /Users/alexmoran/Documents/programming/cybit-k8s
./deploy-station-commander-feature.sh
```

