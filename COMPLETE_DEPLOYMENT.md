# Complete Deployment Guide - Army Recruiter Tool

This is your complete guide to deploy the Army Recruiter Tool with HTTPS, SSL, and auto-start on boot.

## 📋 Prerequisites (5 minutes)

### 1. Configure DuckDNS
```bash
# Visit: https://www.duckdns.org/
# Point armyrecruitertool.duckdns.org to your server IP
# Verify:
nslookup armyrecruitertool.duckdns.org
```

### 2. Open Firewall Ports
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5001/tcp
sudo ufw enable
sudo ufw status
```

### 3. Install Dependencies
```bash
cd /root/armyrecruitertool
npm install
```

## 🚀 Deployment (2 Commands)

### Step 1: Setup Reverse Proxy with SSL (5 minutes)
```bash
sudo ./setup-reverse-proxy.sh
```

This will:
- ✓ Install Nginx
- ✓ Install Certbot
- ✓ Obtain SSL certificate
- ✓ Configure HTTPS reverse proxy
- ✓ Setup auto-renewal

### Step 2: Setup Auto-Start with PM2 (2 minutes)
```bash
sudo ./setup-pm2.sh
```

This will:
- ✓ Install PM2
- ✓ Build application
- ✓ Start application
- ✓ Configure auto-start on boot
- ✓ Setup auto-restart on crash

## ✅ Verification

### Check Everything is Running
```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Test HTTPS endpoint
curl -I https://armyrecruitertool.duckdns.org

# Should return: HTTP/2 200
```

### Open in Browser
```
https://armyrecruitertool.duckdns.org
```

You should see:
- ✓ Secure padlock icon (SSL valid)
- ✓ Application loads correctly
- ✓ No certificate warnings

## 📊 Essential Commands

### PM2 Commands
```bash
pm2 status                          # View status
pm2 logs army-recruiter-tool        # View logs
pm2 restart army-recruiter-tool     # Restart app
pm2 stop army-recruiter-tool        # Stop app
pm2 start army-recruiter-tool       # Start app
pm2 monit                           # Monitor resources
```

### Nginx Commands
```bash
sudo systemctl status nginx         # Check status
sudo systemctl restart nginx        # Restart Nginx
sudo nginx -t                       # Test config
sudo systemctl reload nginx         # Reload config
```

### SSL Commands
```bash
sudo certbot certificates           # View certificates
sudo certbot renew                  # Renew certificates
sudo certbot renew --dry-run        # Test renewal
```

### View Logs
```bash
# Application logs (PM2)
pm2 logs army-recruiter-tool

# Nginx access logs
sudo tail -f /var/log/nginx/armyrecruitertool-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/armyrecruitertool-error.log

# All PM2 logs
tail -f /root/armyrecruitertool/logs/pm2-combined.log
```

## 🔄 Updating Your Application

When you push new code:

```bash
cd /root/armyrecruitertool

# Pull latest changes (if using git)
git pull

# Install new dependencies
npm install

# Build application
npm run build

# Restart with zero downtime
pm2 reload army-recruiter-tool
```

## 🧪 Testing Auto-Start

Test that everything starts on reboot:

```bash
# Reboot server
sudo reboot

# After reboot, SSH back in and check:
pm2 status
sudo systemctl status nginx
curl -I https://armyrecruitertool.duckdns.org
```

Everything should start automatically!

## 🎯 What You Now Have

### Infrastructure
- ✅ **Nginx** - Reverse proxy on ports 80/443
- ✅ **SSL/TLS** - Free Let's Encrypt certificate
- ✅ **Auto-renewal** - Certificates renew automatically
- ✅ **PM2** - Process manager with auto-restart
- ✅ **Auto-start** - Starts on boot/reboot

### Application
- ✅ Runs on `localhost:5001` (not exposed)
- ✅ Accessible via `https://armyrecruitertool.duckdns.org`
- ✅ NIPR-compatible SSL configuration
- ✅ Auto-restarts if crashes
- ✅ Logging enabled

### Security
- ✅ HTTPS enforced (HTTP redirects to HTTPS)
- ✅ TLS 1.2/1.3 protocols
- ✅ Strong cipher suites
- ✅ Security headers enabled
- ✅ Only secure port 443 exposed

## 🔒 NIPR Access

Your application is now accessible from NIPR computers:

1. **Domain**: https://armyrecruitertool.duckdns.org
2. **Port**: 443 (HTTPS) - typically allowed through military firewalls
3. **SSL**: Let's Encrypt (widely trusted)
4. **TLS**: 1.2/1.3 (DoD approved)
5. **Ciphers**: Strong, DoD-compatible

## 📚 Documentation Reference

- **QUICK_SETUP.md** - Quick 3-step setup guide
- **REVERSE_PROXY_SETUP.md** - Detailed reverse proxy guide
- **PM2_SETUP.md** - Complete PM2 documentation
- **DEPLOYMENT_CHECKLIST.md** - Detailed deployment checklist
- **README.md** - Main project documentation

## 🆘 Troubleshooting

### Application Not Running
```bash
# Check PM2 status
pm2 status

# If stopped, start it
pm2 start army-recruiter-tool

# If not in PM2, run setup again
sudo ./setup-pm2.sh
```

### 502 Bad Gateway
```bash
# Application isn't running on port 5001
pm2 restart army-recruiter-tool

# Or check if something else is on port 5001
sudo lsof -i:5001
```

### SSL Certificate Error
```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Application Not Starting on Boot
```bash
# Check PM2 service
sudo systemctl status pm2-root

# If not enabled, run:
pm2 startup systemd -u root --hp /root
pm2 save
```

### DNS Not Resolving
```bash
# Check DNS
nslookup armyrecruitertool.duckdns.org

# Update DuckDNS with correct IP
# Wait 5-10 minutes for propagation
```

## 📞 Quick Help

### Restart Everything
```bash
pm2 restart army-recruiter-tool
sudo systemctl restart nginx
```

### Stop Everything
```bash
pm2 stop army-recruiter-tool
sudo systemctl stop nginx
```

### View All Logs
```bash
# Application
pm2 logs army-recruiter-tool --lines 100

# Nginx access
sudo tail -50 /var/log/nginx/armyrecruitertool-access.log

# Nginx errors
sudo tail -50 /var/log/nginx/armyrecruitertool-error.log
```

### Check All Services
```bash
# PM2
pm2 status

# Nginx
sudo systemctl status nginx

# SSL
sudo certbot certificates

# Firewall
sudo ufw status
```

## 🎉 Success Checklist

Your deployment is complete when:
- ✅ `pm2 status` shows app as "online"
- ✅ `sudo systemctl status nginx` shows "active (running)"
- ✅ `https://armyrecruitertool.duckdns.org` loads in browser
- ✅ SSL certificate shows as valid (padlock icon)
- ✅ After reboot, everything starts automatically
- ✅ Application accessible from NIPR (if testing from NIPR computer)

## 🚀 You're Live!

Your Army Recruiter Tool is now:
- 🌐 Live at **https://armyrecruitertool.duckdns.org**
- 🔒 SSL secured
- 🔄 Auto-starting on boot
- 💪 Auto-restarting on crashes
- 📊 Fully monitored and logged
- 🎖️ NIPR-compatible

---

**Questions?** Check the detailed documentation or run:
```bash
pm2 logs army-recruiter-tool  # See what's happening
```

**Need to update?** Just run:
```bash
npm run build && pm2 reload army-recruiter-tool
```

**Everything working?** You're all set! 🎉


