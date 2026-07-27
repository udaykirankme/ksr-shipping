# Hostinger VPS — first-time server setup (run once on Ubuntu as root/sudo)

set -euo pipefail

echo "==> Updating system packages..."
apt update && apt upgrade -y

echo "==> Installing Git, Nginx, PostgreSQL, Certbot..."
apt install -y git nginx postgresql postgresql-contrib certbot python3-certbot-nginx curl

echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "==> Installing PM2..."
npm install -g pm2

echo "==> Creating app directory..."
mkdir -p /var/www/ksr-shipping
chown -R "$SUDO_USER:$SUDO_USER" /var/www 2>/dev/null || true

echo "==> Setup complete."
echo ""
echo "Next steps:"
echo "  1. Create PostgreSQL database and user"
echo "  2. Clone repo:  git clone https://github.com/udaykirankme/ksr-shipping.git /var/www/ksr-shipping"
echo "  3. Copy .env:  cp .env.example .env  (then edit DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_SITE_URL)"
echo "  4. Run deploy: bash deploy/hostinger/deploy.sh"
echo "  5. Configure Nginx using deploy/hostinger/nginx.conf.example"
echo "  6. Enable SSL:  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
