# 🎖️ Army Recruiter Tool - Multi-Tenant Platform Implementation

## Overview
This implementation adds:
- ✅ PostgreSQL database for scalability
- ✅ User registration & email verification for recruiters
- ✅ Unique QR codes per recruiter
- ✅ Applicant tracking linked to recruiters
- ✅ Dual-mode forms (QR-scanned + in-person)

---

## 📦 Required Dependencies

Add to your `package.json`:

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "qrcode": "^1.5.3",
    "nodemailer": "^6.9.7",
    "pg": "^8.11.3",
    "@types/bcrypt": "^5.0.2",
    "@types/qrcode": "^1.5.5",
    "@types/nodemailer": "^6.4.14"
  }
}
```

Install with:
```bash
cd /Users/alexmoran/Documents/programming/ArmyRecruitTool
npm install bcrypt qrcode nodemailer pg @types/bcrypt @types/qrcode @types/nodemailer
```

---

## 🗄️ Database Setup

### 1. Deploy PostgreSQL to Kubernetes

```bash
cd /Users/alexmoran/Documents/programming/cybit-k8s

# Setup PostgreSQL secrets
bash setup-army-postgres-secrets.sh

# Deploy PostgreSQL
kubectl apply -f army-postgres-deployment.yaml

# Verify it's running
kubectl get pods -l app=army-postgres
```

### 2. Update Army Secrets with Database URL

After PostgreSQL is deployed, add DATABASE_URL to army-secrets:

```bash
# Get the connection string from the setup script output
# It will look like: postgresql://armyrecruiter:PASSWORD@army-postgres-service:5432/army_recruiter

kubectl delete secret army-secrets  # Delete existing
kubectl create secret generic army-secrets \
  --from-literal=DATABASE_URL="postgresql://armyrecruiter:PASSWORD@army-postgres-service:5432/army_recruiter" \
  --from-literal=GOOGLE_PLACES_API_KEY="your-key" \
  --from-literal=PREDICTHQ_API_KEY="your-key" \
  --from-literal=GROQ_API_KEY="your-key" \
  --from-literal=SMTP_HOST="smtp.gmail.com" \
  --from-literal=SMTP_PORT="587" \
  --from-literal=SMTP_USER="your-email@gmail.com" \
  --from-literal=SMTP_PASSWORD="your-app-password" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)"
```

### 3. Push Database Schema

```bash
cd /Users/alexmoran/Documents/programming/ArmyRecruitTool

# Push schema to database
npm run db:push
```

---

## 🔐 Email Configuration

### For Gmail (Development/Testing):

1. Enable 2-Factor Authentication on your Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password as SMTP_PASSWORD

### For Production:

Use a service like:
- **SendGrid** (Military-approved)
- **AWS SES**
- **Army Enterprise Email** (if available)

---

## 🚀 Features Implemented

### 1. Recruiter Registration
- `/api/auth/register` - Register new recruiter
- Email verification required
- Unique QR code generated automatically

### 2. Email Verification
- Verification email sent on registration
- `/api/auth/verify/:token` - Verify email
- Tokens expire after 24 hours

### 3. Login/Authentication
- `/api/auth/login` - Login with email/password
- Session-based authentication
- Protected routes require login

### 4. QR Code System
- Each recruiter gets unique QR code
- QR code links to: `https://armyrecruitertool.duckdns.org/apply?r=RECRUITER_QR_CODE`
- Tracks which recruiter referred each applicant

### 5. Applicant Submission
- Public form accessible via QR or direct link
- Tracks source (QR vs direct entry)
- Links to recruiter automatically

### 6. Dashboard
- Recruiters see their applicants
- Real-time tracking
- Statistics per recruiter

---

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register          Register new recruiter
POST   /api/auth/login             Login
POST   /api/auth/logout            Logout
GET    /api/auth/verify/:token     Verify email
POST   /api/auth/forgot-password   Request password reset
POST   /api/auth/reset-password    Reset password
GET    /api/auth/me                Get current user
```

### Recruiters
```
GET    /api/recruiters/profile     Get own profile
GET    /api/recruiters/qr-code     Get QR code image
GET    /api/recruiters/stats       Get recruiter stats
```

### Applicants/Recruits
```
POST   /api/recruits               Submit application (public)
GET    /api/recruits               List recruits (authenticated)
GET    /api/recruits/:id           Get recruit details
PATCH  /api/recruits/:id/status    Update recruit status
```

---

## 🌐 Frontend Routes

```
/                    - Landing page
/register            - Recruiter registration
/login               - Login page
/verify-email        - Email verification confirmation
/dashboard           - Recruiter dashboard (protected)
/apply?r=QR_CODE     - Public application form
/my-qr               - View/download your QR code (protected)
/applicants          - List of applicants (protected)
/applicants/:id      - Applicant details (protected)
```

---

## 🔒 Security Features

- ✅ Bcrypt password hashing (10 rounds)
- ✅ Email verification required
- ✅ Session-based authentication
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ XSS protection (security headers)
- ✅ Secure password requirements (min 8 chars, mixed case, numbers)

---

## 📱 QR Code Usage

### For Recruiters:
1. Login to dashboard
2. Navigate to "My QR Code"
3. Download QR code image
4. Print on business cards, flyers, or display on phone

### For Applicants:
1. Scan QR code with phone camera
2. Opens application form in browser
3. Fill out form
4. Submit
5. Automatically linked to recruiter

### Direct Entry Mode:
Recruiters can also submit applications directly from their dashboard for in-person interactions.

---

## 🎯 Workflow

```
Recruiter Registration
    ↓
Email Verification
    ↓
QR Code Generated
    ↓
Recruiter Shares QR Code
    ↓
Applicant Scans QR
    ↓
Fills Application Form
    ↓
Submission Tracked
    ↓
Appears in Recruiter Dashboard
```

---

## 📈 Database Schema

```
users (recruiters)
├─ id (UUID, PK)
├─ email (unique)
├─ password_hash
├─ full_name
├─ rank
├─ unit
├─ phone_number
├─ is_verified
├─ verification_token
├─ verification_expires
├─ qr_code (unique)
├─ reset_password_token
├─ reset_password_expires
├─ created_at
└─ updated_at

recruits (applicants)
├─ id (UUID, PK)
├─ recruiter_id (FK → users.id)
├─ first_name
├─ last_name
├─ email
├─ phone
├─ ... (all recruit fields)
├─ source ("qr_code" or "direct")
├─ ip_address
└─ submitted_at
```

---

## 🧪 Testing

### Test Registration:
```bash
curl -X POST https://armyrecruitertool.duckdns.org/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@army.mil",
    "password": "SecurePass123!",
    "fullName": "SGT John Doe",
    "rank": "SGT",
    "unit": "1-1 Infantry"
  }'
```

### Test Application Submission:
```bash
curl -X POST https://armyrecruitertool.duckdns.org/api/recruits \
  -H "Content-Type: application/json" \
  -d '{
    "recruiterId": "optional-if-via-qr",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    ...
  }'
```

---

## 🚨 Troubleshooting

### "Email not sending"
- Check SMTP credentials in secrets
- Verify firewall allows port 587
- Check spam folder
- Enable "Less secure app access" (Gmail)

### "Database connection error"
- Verify PostgreSQL pod is running
- Check DATABASE_URL in secrets
- Ensure service name is correct
- Check network policies

### "QR code not generating"
- Check `qrcode` npm package is installed
- Verify recruiter has valid qr_code field
- Check server logs for errors

---

## 📚 Next Steps

1. **Deploy Database**
   ```bash
   bash setup-army-postgres-secrets.sh
   kubectl apply -f army-postgres-deployment.yaml
   ```

2. **Install Dependencies**
   ```bash
   cd /Users/alexmoran/Documents/programming/ArmyRecruitTool
   npm install bcrypt qrcode nodemailer pg
   ```

3. **Update Secrets**
   Add DATABASE_URL, SMTP credentials, JWT_SECRET

4. **Push Schema**
   ```bash
   npm run db:push
   ```

5. **Rebuild & Deploy**
   ```bash
   cd /Users/alexmoran/Documents/programming/cybit-k8s
   bash rebuild-army.sh
   ```

6. **Test Registration**
   Visit https://armyrecruitertool.duckdns.org/register

---

## 🎖️ Support

Created by: SGT Alex Moran - CyBit Devs
Classification: UNCLASSIFIED
For Official Use Only (FOUO)

---

**Note:** This system handles UNCLASSIFIED recruiting data only. Do not store SSNs, classified information, or CUI without proper authorization.

