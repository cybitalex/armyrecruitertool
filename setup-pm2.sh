#!/bin/bash

# Army Recruiter Tool - PM2 Auto-Start Setup Script
# This script configures PM2 to automatically start your application on boot

set -e

echo "=================================="
echo "Army Recruiter Tool PM2 Setup"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

echo "Step 1: Installing PM2 globally..."
npm install -g pm2

echo ""
echo "Step 2: Creating logs directory..."
mkdir -p /root/armyrecruitertool/logs
chmod 755 /root/armyrecruitertool/logs

echo ""
echo "Step 3: Installing application dependencies..."
cd /root/armyrecruitertool
npm install

echo ""
echo "Step 4: Building the application..."
npm run build

echo ""
echo "Step 5: Stopping any existing PM2 processes..."
pm2 delete all 2>/dev/null || echo "No existing processes to stop"

echo ""
echo "Step 6: Starting application with PM2..."
pm2 start ecosystem.config.cjs

echo ""
echo "Step 7: Configuring PM2 to start on system boot..."
# This generates a startup script and installs it
pm2 startup systemd -u root --hp /root

echo ""
echo "Step 8: Saving PM2 process list..."
pm2 save

echo ""
echo "Step 9: Enabling PM2 service..."
systemctl enable pm2-root 2>/dev/null || echo "PM2 service will be enabled after startup command"

echo ""
echo "=================================="
echo "✓ PM2 Setup Complete!"
echo "=================================="
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "Application Details:"
pm2 info army-recruiter-tool
echo ""
echo "Your application will now:"
echo "  ✓ Start automatically on boot/reboot"
echo "  ✓ Restart automatically if it crashes"
echo "  ✓ Run on port 5001"
echo "  ✓ Log to /root/armyrecruitertool/logs/"
echo ""
echo "Useful PM2 Commands:"
echo "  View status:     pm2 status"
echo "  View logs:       pm2 logs army-recruiter-tool"
echo "  Restart app:     pm2 restart army-recruiter-tool"
echo "  Stop app:        pm2 stop army-recruiter-tool"
echo "  Start app:       pm2 start army-recruiter-tool"
echo "  Monitor:         pm2 monit"
echo "  View info:       pm2 info army-recruiter-tool"
echo ""
echo "To test auto-start, reboot your server:"
echo "  sudo reboot"
echo ""
echo "After reboot, check with:"
echo "  pm2 status"
echo ""

