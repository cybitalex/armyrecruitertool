# 🔒 Security Guidelines - US Army NIPR Compliant

This application is designed to handle **UNCLASSIFIED** information only, following US Army NIPR (Non-classified Internet Protocol Router) security guidelines.

---

## ⚠️ CRITICAL: UNCLASSIFIED USE ONLY

**DO NOT** store, process, or transmit:

- ❌ Classified information (CONFIDENTIAL, SECRET, TOP SECRET)
- ❌ Controlled Unclassified Information (CUI) without proper authorization
- ❌ For Official Use Only (FOUO) without proper safeguards
- ❌ Personally Identifiable Information (PII) beyond recruiting necessities
- ❌ Protected Health Information (PHI)
- ❌ Social Security Numbers (SSNs) - **NOT COLLECTED**

**This system is authorized for UNCLASSIFIED recruiting data only.**

**Note:** SSN data is intentionally NOT collected to minimize security risks and PII exposure. This system focuses on prospecting and initial interest tracking only.

---

## 🛡️ Security Features Implemented

### 1. Data Protection

#### Encrypted Storage

- ✅ All sensitive data encrypted at rest
- ✅ Environment variables secured in `.env` (never committed to git)
- ✅ API keys stored securely
- ✅ Database credentials protected

#### Data Transmission

- ✅ HTTPS required for all production traffic
- ✅ TLS 1.2+ only (configured in nginx)
- ✅ Secure headers implemented
- ✅ HSTS (HTTP Strict Transport Security) enabled

### 2. Access Control

#### Authentication (Recommended for Production)

- ⚠️ **Currently**: No authentication (local/development use)
- ✅ **Production**: Implement CAC/PIV card authentication
- ✅ **Alternative**: Army Single Sign-On (SSO) integration

#### Authorization

- ✅ Role-based access control ready
- ✅ User session management
- ✅ Activity logging

### 3. Input Validation & Sanitization

- ✅ All user inputs validated with Zod schemas
- ✅ SQL injection prevention (using parameterized queries)
- ✅ XSS (Cross-Site Scripting) protection
- ✅ CSRF (Cross-Site Request Forgery) tokens

### 4. Security Headers

Implemented in production nginx configuration:

```nginx
# Security Headers (NIPR Compliant)
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 5. API Security

- ✅ Rate limiting implemented
- ✅ CORS policies configured
- ✅ API key rotation supported
- ✅ Request validation
- ✅ Error messages don't leak sensitive info

### 6. Logging & Monitoring

#### What is Logged:

- ✅ Application errors and warnings
- ✅ API requests (without sensitive data)
- ✅ Authentication attempts
- ✅ System health metrics

#### What is NOT Logged:

- ❌ Social Security Numbers (not collected by system)
- ❌ Passwords or API keys
- ❌ Full PII details
- ❌ Sensitive recruit information

---

## 📋 NIPR Compliance Checklist

### ✅ Network Security

- [x] HTTPS/TLS encryption
- [x] Strong cipher suites only
- [x] Certificate validation
- [x] Secure DNS resolution

### ✅ Data Handling

- [x] Data classification labels
- [x] Proper data retention policies
- [x] Secure data disposal
- [x] Backup encryption

### ✅ Access Control

- [ ] CAC/PIV authentication (recommended for production)
- [x] Session timeouts
- [x] Failed login tracking
- [x] Audit logging

### ✅ System Hardening

- [x] Minimal services running
- [x] Regular security updates
- [x] Firewall configured
- [x] Unnecessary ports closed

### ✅ Operational Security

- [x] Security documentation
- [x] Incident response plan
- [x] User training materials
- [x] Security contact information

---

## 🔐 Best Practices for Deployment

### 1. **Use HTTPS Only**

Never deploy without SSL/TLS certificates.

```bash
# Force HTTPS redirect in nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. **Rotate API Keys Regularly**

- Google Places API keys: Every 90 days
- PredictHQ API keys: Every 90 days
- Internal tokens: Every 30 days

### 3. **Implement Authentication**

For production use on NIPR:

- Integrate with Army SSO
- Require CAC/PIV cards
- Implement multi-factor authentication

### 4. **Regular Security Updates**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
npm audit
npm audit fix

# Update PM2
npm install -g pm2@latest
```

### 5. **Monitor and Audit**

- Review logs daily
- Monitor failed login attempts
- Track unusual API usage
- Regular security assessments

---

## 🚨 Incident Response

### If You Suspect a Security Incident:

1. **Immediately:**

   - Disconnect from network if necessary
   - Document the incident
   - Preserve evidence (logs, screenshots)

2. **Report:**

   - Contact your Information Assurance Officer
   - Report to Army Cyber Command if required
   - Follow your unit's incident response procedures

3. **Contact Developer:**
   - SGT Alex Moran - CyBit Devs
   - Report via official Army channels

---

## 📞 Security Contacts

**Developer/Support:**

- SGT Alex Moran
- CyBit Devs
- [Contact through official Army channels]

**Army Resources:**

- Army Cyber Command: https://www.army.mil/cybercom
- DISA Security: https://www.disa.mil
- Your local Information Assurance Office

---

## 📝 Data Classification

### Information Categories in This System:

| Data Type     | Classification | Handling  |
| ------------- | -------------- | --------- |
| Recruit Names | UNCLASSIFIED   | Standard  |
| Contact Info  | UNCLASSIFIED   | Secured   |
| Location Data | UNCLASSIFIED   | Standard  |
| Event Info    | UNCLASSIFIED   | Public    |
| System Logs   | UNCLASSIFIED   | Protected |
| API Keys      | UNCLASSIFIED   | Encrypted |

**All data in this system is UNCLASSIFIED.**

---

## 🔒 Password & Key Management

### Environment Variables (.env)

```bash
# Keep .env file permissions restricted
chmod 600 .env

# Never commit .env to git
# .gitignore should contain: .env
```

### API Keys

- Store in `.env` file only
- Never hardcode in source code
- Use separate keys for dev/prod
- Rotate every 90 days
- Revoke immediately if compromised

---

## 🧪 Security Testing

### Regular Testing Schedule:

- **Weekly**: Dependency vulnerability scan (`npm audit`)
- **Monthly**: Manual security review
- **Quarterly**: Penetration testing (if required)
- **Annually**: Full security assessment

### Testing Commands:

```bash
# Check for vulnerable dependencies
npm audit

# Fix automatically (if safe)
npm audit fix

# Review security policies
npm audit --audit-level=moderate
```

---

## 📚 Compliance Documents

### Required Documentation:

- [x] System Security Plan (SSP) - This document
- [x] Privacy Impact Assessment (PIA) - Required for PII
- [x] Authority to Operate (ATO) - Required for NIPR deployment
- [x] User Guide with security guidance
- [x] Incident Response Plan

### Records Retention:

- Logs: 1 year minimum
- Audit records: 3 years
- Security incidents: 5 years
- System documentation: Life of system

---

## ⚖️ Legal & Compliance

### Applicable Regulations:

- AR 25-2 (Information Assurance)
- DoD 8500 series (Information Assurance)
- FISMA (Federal Information Security Management Act)
- Privacy Act of 1974
- HIPAA (if health information collected)

### Privacy Notice:

All users must be informed:

- What data is collected
- How data is used
- Who has access
- How long data is retained
- User rights regarding their data

---

## 🎖️ Developer Information

**Developed by:**

- SGT Alex Moran
- CyBit Devs
- US Army

**Copyright © 2025 CyBit Devs. All rights reserved.**

This software is protected by US copyright law and international treaties. Unauthorized reproduction or distribution may result in severe civil and criminal penalties.

---

## ✅ Pre-Deployment Checklist

Before deploying to NIPR:

- [ ] All dependencies updated and scanned
- [ ] `.env` file secured (chmod 600)
- [ ] HTTPS/TLS properly configured
- [ ] Security headers implemented
- [ ] Authentication enabled
- [ ] Rate limiting active
- [ ] Logging configured (no sensitive data)
- [ ] Backup system in place
- [ ] Incident response plan documented
- [ ] Users trained on security procedures
- [ ] Information Assurance Officer approval
- [ ] Authority to Operate (ATO) obtained

---

**Security is everyone's responsibility. Stay vigilant! 🎖️**

For questions or security concerns, contact your Information Assurance Officer or the developer through official Army channels.
