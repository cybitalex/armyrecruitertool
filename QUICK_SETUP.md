# Quick Setup Guide - Army Recruiter Tool HTTPS

## 🚀 3-Step Setup

### Step 1: Configure DuckDNS (2 minutes)
1. Go to https://www.duckdns.org/
2. Sign in and find `armyrecruitertool`
3. Update the IP address to your server's public IP
4. Click "update ip"
5. Wait 2-5 minutes for DNS to propagate

**Verify DNS:**
```bash
nslookup armyrecruitertool.duckdns.org
```

### Step 2: Open Firewall Ports (1 minute)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Step 3: Run Setup Script (5 minutes)
```bash
cd /root/armyrecruitertool
sudo ./setup-reverse-proxy.sh
```

When prompted:
- Enter your email address
- Type `y` to confirm

**That's it!** The script handles everything:
- ✓ Installs Nginx
- ✓ Installs Certbot
- ✓ Obtains SSL certificate
- ✓ Configures reverse proxy
- ✓ Sets up auto-renewal

## 🎯 After Setup

### Start Your Application with PM2 (Recommended)

**One command - auto-starts on boot:**
```bash
cd /root/armyrecruitertool
sudo ./setup-pm2.sh
```

This configures the app to:
- ✓ Start automatically on boot/reboot
- ✓ Restart automatically if it crashes
- ✓ Run reliably 24/7

See [PM2_SETUP.md](./PM2_SETUP.md) for all PM2 commands.

### Or Start Manually (Not recommended)
```bash
cd /root/armyrecruitertool
npm run build
npm start
```

### Access Your Application
Open in browser: **https://armyrecruitertool.duckdns.org**

### Essential PM2 Commands
```bash
pm2 status                          # Check if app is running
pm2 logs army-recruiter-tool        # View logs
pm2 restart army-recruiter-tool     # Restart app
pm2 monit                           # Monitor CPU/memory
```

## ✅ Verify Everything Works

```bash
# Test HTTPS
curl -I https://armyrecruitertool.duckdns.org

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# View logs
tail -f /var/log/nginx/armyrecruitertool-access.log
```

## 🔧 Common Issues

### "Cannot resolve domain"
- Wait 5-10 minutes for DNS propagation
- Verify your DuckDNS IP is correct
- Test: `nslookup armyrecruitertool.duckdns.org`

### "502 Bad Gateway"
- Your application isn't running
- Start it: `cd /root/armyrecruitertool && npm start`
- Check: `lsof -i:5001`

### "Firewall blocking"
- Open ports: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`
- Check cloud provider security groups if using AWS/Azure/GCP

## 📱 What Changed

The updated script now:
- ✓ Creates HTTP-only config first
- ✓ Obtains SSL certificates
- ✓ Then applies full SSL config
- ✓ Fixes deprecated http2 directive
- ✓ Better error messages
- ✓ Installs missing tools (net-tools)

## 📞 Need Help?

See detailed docs:
- **REVERSE_PROXY_SETUP.md** - Complete guide
- **DEPLOYMENT_CHECKLIST.md** - Step-by-step checklist

---

**Ready?** Just run: `sudo ./setup-reverse-proxy.sh`

