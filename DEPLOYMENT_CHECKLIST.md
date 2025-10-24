# Reverse Proxy Deployment Checklist

Follow this checklist to deploy your Army Recruiter Tool with HTTPS and NIPR compatibility.

## Pre-Deployment Checklist

### ☐ 1. Domain Configuration
- [ ] Visit https://www.duckdns.org/
- [ ] Log in to your DuckDNS account
- [ ] Set `armyrecruitertool.duckdns.org` to point to your server's public IP
- [ ] Verify DNS propagation: `nslookup armyrecruitertool.duckdns.org`
- [ ] Wait 5-10 minutes if DNS hasn't propagated yet

### ☐ 2. Server Firewall Configuration
```bash
# Open required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### ☐ 3. Application Setup
- [ ] Ensure your application is installed: `cd /root/armyrecruitertool && npm install`
- [ ] Configure environment variables if needed (`.env` file)
- [ ] Test application locally: `npm run dev`
- [ ] Verify it runs on port 5001: `lsof -i:5001` or `netstat -tuln | grep 5001`

### ☐ 4. Router/Cloud Configuration (if applicable)
- [ ] If behind a router, configure port forwarding:
  - Forward external port 80 → internal IP:80
  - Forward external port 443 → internal IP:443
- [ ] If using cloud provider (AWS, Azure, GCP):
  - Open ports 80 and 443 in security groups/firewall rules

## Deployment Steps

### ☐ 5. Run Setup Script
```bash
cd /root/armyrecruitertool
sudo ./setup-reverse-proxy.sh
```

When prompted:
- [ ] Enter your email address (for SSL certificate notifications)
- [ ] Review configuration
- [ ] Confirm to proceed

The script will:
- ✓ Install Nginx
- ✓ Install Certbot
- ✓ Configure reverse proxy
- ✓ Obtain SSL certificate
- ✓ Set up auto-renewal
- ✓ Start services

### ☐ 6. Start Your Application

Option A - Using PM2 (RECOMMENDED - Auto-starts on boot):
```bash
cd /root/armyrecruitertool
sudo ./setup-pm2.sh
```

Option B - Run in background:
```bash
cd /root/armyrecruitertool
npm run build  # Build for production
nohup npm start > app.log 2>&1 &
```

Option C - Development mode (for testing):
```bash
cd /root/armyrecruitertool
npm run dev
```

**For production, use PM2!** See [PM2_SETUP.md](./PM2_SETUP.md) for details.

### ☐ 7. Verify Deployment

#### Test from server:
```bash
# Test HTTP redirect
curl -I http://armyrecruitertool.duckdns.org

# Test HTTPS
curl -I https://armyrecruitertool.duckdns.org

# Check if you get a 200 or 301 response
```

#### Test from browser:
- [ ] Open: http://armyrecruitertool.duckdns.org (should redirect to HTTPS)
- [ ] Open: https://armyrecruitertool.duckdns.org (should show your app)
- [ ] Check SSL certificate (click padlock icon in browser)
- [ ] Verify it shows "Secure" or "Connection is secure"

#### Test SSL configuration:
- [ ] Visit: https://www.ssllabs.com/ssltest/analyze.html?d=armyrecruitertool.duckdns.org
- [ ] Wait for scan to complete
- [ ] Verify Grade A or B (acceptable for NIPR)

### ☐ 8. NIPR Compatibility Testing

If you have access to a NIPR computer:
- [ ] Access https://armyrecruitertool.duckdns.org from NIPR
- [ ] Verify no certificate warnings
- [ ] Test all functionality
- [ ] Check page loads and navigation
- [ ] Verify no blocked resources

## Post-Deployment

### ☐ 9. Service Management (PM2 Auto-Start)

If you used PM2 in step 6, verify auto-start:
```bash
# Check PM2 status
pm2 status

# Verify systemd service
sudo systemctl status pm2-root

# Test reboot (optional)
sudo reboot
# After reboot: pm2 status
```

#### Alternative: Create systemd service manually (if not using PM2)

Only needed if you're NOT using PM2:
```bash
sudo nano /etc/systemd/system/army-recruiter-tool.service
```

Add this content:
```ini
[Unit]
Description=Army Recruiter Tool
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/armyrecruitertool
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable army-recruiter-tool
sudo systemctl start army-recruiter-tool
sudo systemctl status army-recruiter-tool
```

### ☐ 10. Monitoring Setup

- [ ] Set up log monitoring:
```bash
# View Nginx logs
sudo tail -f /var/log/nginx/armyrecruitertool-access.log
sudo tail -f /var/log/nginx/armyrecruitertool-error.log

# View application logs (if using PM2)
pm2 logs army-recruiter-tool

# View application logs (if using systemd)
sudo journalctl -u army-recruiter-tool -f
```

- [ ] Test certificate auto-renewal:
```bash
sudo certbot renew --dry-run
```

- [ ] Verify auto-renewal timer is active:
```bash
sudo systemctl status certbot.timer
```

### ☐ 11. Security Hardening (Optional)

- [ ] Set up fail2ban for brute-force protection:
```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

- [ ] Configure IP whitelisting (if required):
  - Edit `/etc/nginx/sites-available/armyrecruitertool.conf`
  - Add allowed IP ranges
  - Reload Nginx: `sudo systemctl reload nginx`

- [ ] Set up monitoring alerts
- [ ] Configure automated backups
- [ ] Document access procedures

### ☐ 12. Documentation

- [ ] Document server IP address
- [ ] Save SSL certificate renewal email
- [ ] Document any custom configurations
- [ ] Share access instructions with team
- [ ] Update security documentation

## Maintenance Schedule

### Daily
- [ ] Check application is running
- [ ] Review error logs for issues

### Weekly
- [ ] Review access logs
- [ ] Check disk space
- [ ] Verify SSL certificate is valid

### Monthly
- [ ] Test certificate renewal: `sudo certbot renew --dry-run`
- [ ] Review security updates: `sudo apt update && sudo apt list --upgradable`
- [ ] Check Nginx version for updates

### As Needed
- [ ] Apply security patches
- [ ] Update application code
- [ ] Adjust firewall rules

## Troubleshooting Quick Reference

### Application won't start
```bash
# Check if port 5001 is in use
lsof -i:5001

# Kill process on port 5001 if needed
sudo kill $(lsof -t -i:5001)

# Restart application
cd /root/armyrecruitertool
npm start
```

### Nginx issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -50 /var/log/nginx/error.log
```

### SSL certificate issues
```bash
# Check certificates
sudo certbot certificates

# Manual renewal
sudo certbot renew --force-renewal

# Check renewal timer
sudo systemctl status certbot.timer
```

### 502 Bad Gateway
- Application not running on port 5001
- Check: `lsof -i:5001` or `netstat -tuln | grep 5001`
- Start application: `cd /root/armyrecruitertool && npm start`

### Cannot obtain SSL certificate
- DNS not configured correctly
- Ports 80/443 not open
- Nginx not running
- Domain doesn't point to correct IP

## Emergency Contacts

- **DuckDNS Support**: https://www.duckdns.org/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **Nginx Documentation**: https://nginx.org/en/docs/

## Rollback Procedure

If you need to rollback:

```bash
# Stop Nginx
sudo systemctl stop nginx

# Remove configuration
sudo rm /etc/nginx/sites-enabled/armyrecruitertool.conf

# Restart Nginx with default config
sudo systemctl start nginx

# Application will still be accessible on localhost:5001
```

---

## Success Criteria

✅ **Deployment is successful when:**
- Application accessible via https://armyrecruitertool.duckdns.org
- SSL certificate shows as valid in browser
- HTTP automatically redirects to HTTPS
- No certificate warnings
- Application functions correctly
- SSL Labs test shows Grade A or B
- Accessible from NIPR computers (if applicable)
- Auto-renewal configured and tested

---

**Last Updated**: October 24, 2025

