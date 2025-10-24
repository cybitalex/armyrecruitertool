# PM2 Auto-Start Setup Guide

This guide will help you set up PM2 to automatically start your Army Recruiter Tool application on boot/reboot.

## 🚀 Quick Setup

### One-Command Setup (Recommended)

```bash
cd /root/armyrecruitertool
sudo chmod +x setup-pm2.sh
sudo ./setup-pm2.sh
```

This will:
- ✓ Install PM2 globally
- ✓ Build your application
- ✓ Start the application with PM2
- ✓ Configure auto-start on boot
- ✓ Save PM2 configuration

## 📋 Manual Setup

If you prefer to set up manually:

### 1. Install PM2

```bash
sudo npm install -g pm2
```

### 2. Build Your Application

```bash
cd /root/armyrecruitertool
npm run build
```

### 3. Start Application with PM2

Using the ecosystem config file:
```bash
pm2 start ecosystem.config.js
```

Or manually:
```bash
pm2 start npm --name "army-recruiter-tool" -- start
```

### 4. Configure Auto-Start on Boot

```bash
pm2 startup systemd -u root --hp /root
```

This command will output a systemd command. Run that command (it will start with `sudo env`).

### 5. Save PM2 Process List

```bash
pm2 save
```

### 6. Enable PM2 Service

```bash
sudo systemctl enable pm2-root
```

## 🎯 PM2 Ecosystem Configuration

The `ecosystem.config.js` file provides advanced configuration:

```javascript
{
  name: 'army-recruiter-tool',
  script: 'npm',
  args: 'start',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  env: {
    NODE_ENV: 'production',
    PORT: 5001
  },
  // Automatic restart if crashes
  min_uptime: '10s',
  max_restarts: 10,
  restart_delay: 4000
}
```

## 📊 PM2 Commands Reference

### Process Management

```bash
# View all processes
pm2 status

# View detailed info
pm2 info army-recruiter-tool

# Restart application
pm2 restart army-recruiter-tool

# Stop application
pm2 stop army-recruiter-tool

# Start application
pm2 start army-recruiter-tool

# Delete from PM2
pm2 delete army-recruiter-tool

# Restart all processes
pm2 restart all
```

### Monitoring & Logs

```bash
# View logs (real-time)
pm2 logs army-recruiter-tool

# View last 100 lines
pm2 logs army-recruiter-tool --lines 100

# View only error logs
pm2 logs army-recruiter-tool --err

# Clear logs
pm2 flush

# Monitor CPU and Memory
pm2 monit
```

### Configuration Management

```bash
# Save current process list
pm2 save

# Resurrect saved processes
pm2 resurrect

# List saved processes
pm2 list

# Update PM2
pm2 update
```

## 📁 Log Files

Logs are stored in:
```
/root/armyrecruitertool/logs/
├── pm2-error.log      # Error logs
├── pm2-out.log        # Standard output logs
└── pm2-combined.log   # Combined logs
```

View logs:
```bash
# Real-time logs
tail -f /root/armyrecruitertool/logs/pm2-combined.log

# Error logs only
tail -f /root/armyrecruitertool/logs/pm2-error.log

# Using PM2
pm2 logs army-recruiter-tool
```

## ✅ Verification

### Test Auto-Start

1. Check current status:
```bash
pm2 status
```

2. Reboot server:
```bash
sudo reboot
```

3. After reboot, verify app is running:
```bash
pm2 status
```

4. Check if accessible:
```bash
curl -I https://armyrecruitertool.duckdns.org
```

### Verify Systemd Integration

```bash
# Check PM2 service status
sudo systemctl status pm2-root

# Check if enabled on boot
sudo systemctl is-enabled pm2-root
```

## 🔧 Troubleshooting

### Application Not Starting After Reboot

**Check PM2 service:**
```bash
sudo systemctl status pm2-root
```

**Check startup configuration:**
```bash
pm2 startup
```

**Manually start:**
```bash
pm2 resurrect
```

### Application Keeps Crashing

**View logs:**
```bash
pm2 logs army-recruiter-tool --err --lines 50
```

**Check application status:**
```bash
pm2 info army-recruiter-tool
```

**Increase max restarts:**
Edit `ecosystem.config.js`:
```javascript
max_restarts: 20,  // Increase from 10
restart_delay: 5000  // Increase delay
```

Then restart:
```bash
pm2 reload ecosystem.config.js
```

### Port Already in Use

**Find process using port 5001:**
```bash
sudo lsof -i:5001
```

**Kill the process:**
```bash
sudo kill $(lsof -t -i:5001)
```

**Restart PM2 application:**
```bash
pm2 restart army-recruiter-tool
```

### PM2 Not Found After Reboot

**Reinstall PM2 globally:**
```bash
sudo npm install -g pm2
```

**Reconfigure startup:**
```bash
pm2 startup systemd -u root --hp /root
pm2 save
```

## 🔄 Updating Your Application

When you update your code:

```bash
cd /root/armyrecruitertool

# Pull latest changes (if using git)
git pull

# Install dependencies (if package.json changed)
npm install

# Build application
npm run build

# Restart with zero downtime
pm2 reload army-recruiter-tool

# Or full restart
pm2 restart army-recruiter-tool
```

## 🎨 Advanced Configuration

### Run Multiple Instances (Cluster Mode)

Edit `ecosystem.config.js`:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

Reload:
```bash
pm2 reload ecosystem.config.js
```

### Memory-Based Auto-Restart

Already configured in `ecosystem.config.js`:
```javascript
max_memory_restart: '1G'  // Restart if memory exceeds 1GB
```

### Custom Environment Variables

Edit `ecosystem.config.js`:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 5001,
  DATABASE_URL: 'your-database-url',
  HUGGINGFACE_API_KEY: 'your-api-key'
}
```

### Scheduled Restarts

Restart every day at 3 AM:
```bash
pm2 start ecosystem.config.js --cron-restart="0 3 * * *"
```

## 📱 PM2 Plus (Optional)

For advanced monitoring and management:

1. Sign up at https://pm2.io/
2. Link your server:
```bash
pm2 link <secret> <public>
```

Features:
- Web dashboard
- Real-time monitoring
- Email/Slack alerts
- Historical metrics
- Exception tracking

## 🛡️ Security Considerations

### Running as Root

Currently configured to run as root. For better security, consider running as a dedicated user:

```bash
# Create dedicated user
sudo adduser --system --group armyrecruiter

# Change ownership
sudo chown -R armyrecruiter:armyrecruiter /root/armyrecruitertool

# Configure PM2 for that user
sudo su - armyrecruiter
pm2 startup systemd -u armyrecruiter
pm2 start /root/armyrecruitertool/ecosystem.config.js
pm2 save
```

### Log Rotation

PM2 includes built-in log rotation:

```bash
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 📊 Monitoring Script

Create a monitoring script:

```bash
#!/bin/bash
# Save as monitor.sh

STATUS=$(pm2 jlist army-recruiter-tool | jq -r '.[0].pm2_env.status')

if [ "$STATUS" != "online" ]; then
    echo "Application is $STATUS. Restarting..."
    pm2 restart army-recruiter-tool
    echo "Alert: Application was restarted at $(date)" >> /root/armyrecruitertool/logs/restart-alerts.log
fi
```

Add to crontab (check every 5 minutes):
```bash
*/5 * * * * /root/armyrecruitertool/monitor.sh
```

## 🎯 Best Practices

1. **Always build before starting:**
   ```bash
   npm run build && pm2 restart army-recruiter-tool
   ```

2. **Use `pm2 reload` instead of `pm2 restart` for zero-downtime:**
   ```bash
   pm2 reload army-recruiter-tool
   ```

3. **Regularly check logs:**
   ```bash
   pm2 logs --lines 100
   ```

4. **Monitor resource usage:**
   ```bash
   pm2 monit
   ```

5. **Keep PM2 updated:**
   ```bash
   npm install -g pm2@latest
   pm2 update
   ```

6. **Save after any changes:**
   ```bash
   pm2 save
   ```

## 📞 Support

For PM2 issues:
- Documentation: https://pm2.keymetrics.io/docs/
- GitHub: https://github.com/Unitech/pm2
- Community: https://pm2.io/

---

**Next Steps:**
1. Run: `sudo ./setup-pm2.sh`
2. Test: `pm2 status`
3. Reboot and verify: `sudo reboot`
4. Monitor: `pm2 logs army-recruiter-tool`


