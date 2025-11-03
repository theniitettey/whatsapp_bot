#!/bin/bash
# deploy_whatsapp_bot.sh
# This script builds and restarts the WhatsApp bot service

cd /var/www/whatsapp_bot || { echo "Directory not found!"; exit 1; }

echo "Running build..."
npm run build

echo "Restarting PM2 services..."
pm2 restart all

echo "Deployment completed successfully!"
