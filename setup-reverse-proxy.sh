#!/bin/bash

# Army Recruiter Tool - Reverse Proxy Setup Script
# This script sets up Nginx as a reverse proxy with SSL via certbot

set -e

echo "=================================="
echo "Army Recruiter Tool Reverse Proxy Setup"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

# Variables
DOMAIN="armyrecruitertool.duckdns.org"
APP_PORT="5001"
EMAIL=""

# Get email for SSL certificate
echo "Enter your email address for SSL certificate notifications:"
read -r EMAIL

if [ -z "$EMAIL" ]; then
    echo "Error: Email address is required"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  Domain: $DOMAIN"
echo "  Application Port: $APP_PORT"
echo "  Email: $EMAIL"
echo ""
read -p "Continue with this configuration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled"
    exit 1
fi

echo ""
echo "Step 1: Updating system packages..."
apt-get update

echo ""
echo "Step 2: Installing Nginx..."
apt-get install -y nginx

echo ""
echo "Step 3: Installing Certbot and Nginx plugin..."
apt-get install -y certbot python3-certbot-nginx

echo ""
echo "Step 4: Installing net-tools for diagnostics..."
apt-get install -y net-tools lsof

echo ""
echo "Step 5: Checking if application is running on port $APP_PORT..."
if lsof -i:$APP_PORT > /dev/null 2>&1; then
    echo "✓ Application is running on port $APP_PORT"
else
    echo "⚠ Warning: No application appears to be running on port $APP_PORT"
    echo "  You can continue with setup and start the application later"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Start your application first with: cd /root/armyrecruitertool && npm start"
        exit 1
    fi
fi

echo ""
echo "Step 6: Stopping Nginx temporarily..."
systemctl stop nginx || true

echo ""
echo "Step 7: Copying initial Nginx configuration (HTTP only)..."
cp /root/armyrecruitertool/nginx/armyrecruitertool-initial.conf /etc/nginx/sites-available/armyrecruitertool.conf

# Remove default site if it exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    echo "Removing default Nginx site..."
    rm /etc/nginx/sites-enabled/default
fi

# Create symlink
ln -sf /etc/nginx/sites-available/armyrecruitertool.conf /etc/nginx/sites-enabled/armyrecruitertool.conf

echo ""
echo "Step 8: Testing initial Nginx configuration..."
nginx -t

echo ""
echo "Step 9: Starting Nginx..."
systemctl start nginx
systemctl enable nginx

echo ""
echo "Step 10: Verifying DNS configuration..."
RESOLVED_IP=$(dig +short $DOMAIN | tail -n1)
if [ -z "$RESOLVED_IP" ]; then
    echo "⚠ Warning: Cannot resolve $DOMAIN"
    echo "  Make sure your DuckDNS domain points to this server's IP address"
    echo "  Visit: https://www.duckdns.org/"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Configure your domain first."
        exit 1
    fi
else
    echo "✓ Domain $DOMAIN resolves to: $RESOLVED_IP"
fi

echo ""
echo "Step 11: Obtaining SSL certificate from Let's Encrypt..."
echo "Note: This will take a moment..."
echo ""

# Try to get certificate
if certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect; then
    echo "✓ SSL certificate obtained successfully"
else
    echo "✗ Failed to obtain SSL certificate"
    echo ""
    echo "Common issues:"
    echo "  1. Domain doesn't point to this server's IP"
    echo "  2. Ports 80/443 are blocked by firewall"
    echo "  3. DNS hasn't propagated yet (wait 5-10 minutes)"
    echo ""
    echo "You can run certbot manually later with:"
    echo "  sudo certbot --nginx -d $DOMAIN"
    exit 1
fi

echo ""
echo "Step 12: Copying final Nginx configuration with SSL..."
cp /root/armyrecruitertool/nginx/armyrecruitertool.conf /etc/nginx/sites-available/armyrecruitertool.conf

echo ""
echo "Step 13: Testing final Nginx configuration..."
nginx -t

echo ""
echo "Step 14: Reloading Nginx with SSL configuration..."
systemctl reload nginx

echo ""
echo "Step 15: Setting up automatic certificate renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Test renewal
echo ""
echo "Step 16: Testing certificate renewal (dry run)..."
if certbot renew --dry-run; then
    echo "✓ Certificate auto-renewal is configured correctly"
else
    echo "⚠ Warning: Certificate renewal test had issues"
    echo "  Certificates may not auto-renew. Check manually with: sudo certbot renew"
fi

echo ""
echo "=================================="
echo "✓ Setup Complete!"
echo "=================================="
echo ""
echo "Your application is now accessible at:"
echo "  🌐 https://$DOMAIN"
echo ""
echo "SSL Certificate Information:"
certbot certificates | grep -A 3 "Certificate Name: $DOMAIN" || echo "  Certificate installed successfully"
echo ""
echo "Next Steps:"
echo "  1. Make sure your application is running:"
echo "     cd /root/armyrecruitertool"
echo "     npm run build"
echo "     npm start"
echo ""
echo "  2. Test access:"
echo "     curl -I https://$DOMAIN"
echo "     Or open in browser: https://$DOMAIN"
echo ""
echo "  3. Test SSL grade:"
echo "     https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo "Useful Commands:"
echo "  View access logs:  tail -f /var/log/nginx/armyrecruitertool-access.log"
echo "  View error logs:   tail -f /var/log/nginx/armyrecruitertool-error.log"
echo "  Restart Nginx:     sudo systemctl restart nginx"
echo "  Check SSL:         sudo certbot certificates"
echo "  Renew SSL:         sudo certbot renew"
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager -l | head -n 10
echo ""
