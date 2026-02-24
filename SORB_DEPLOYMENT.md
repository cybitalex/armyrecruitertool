# SORB (Special Operations Recruiting Battalion) Deployment

This branch deploys the SORB version of the Army Recruiter Tool at **sorbarmyrecruitertool.duckdns.org**.

## Overview

SORB focuses on recruiting soldiers already in the Army to special operations, rather than recruiting civilians. The dashboard includes:

- **SORB Prospecting Funnel** – analytics for Qualified Military to Special Operations pipeline
- **Filters**: Station (e.g., TM Bragg), SORB CO (A Co, B Co, etc.), Log Attempt (Email, Text, Phone, Face To Face), GT Score (ASVAB)
- **ARSOF branding** – ARSOF_RGB.png logo next to USAREC badge in header

## Data Source

`TEST DATA.xlsx` in the project root provides dummy data. Columns:

- RANK, LAST NAME, GT, MOS, POST, PHONE, UNIT, Log Attempt, Contacted, SORB CO

## Build & Run

```bash
# Build for SORB (enables SORB UI, ARSOF branding, analytics as default)
npm run build:sorb

# Start (same as main app)

npm start
```

## Domain Setup

1. **DuckDNS**: Add subdomain `sorbarmyrecruitertool.duckdns.org` pointing to your server IP.

2. **Nginx**: Include the SORB config:
   ```bash
   sudo cp nginx/sorb.armyrecruitertool.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/sorb.armyrecruitertool.conf /etc/nginx/sites-enabled/
   ```

3. **SSL** (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d sorbarmyrecruitertool.duckdns.org
   ```

4. **Single process**: Both main and SORB domains can proxy to the same backend (port 5001). The app detects SORB mode via `window.location.hostname.includes('sorb')` and shows the SORB UI. No separate build needed if you deploy the same build to both domains.

## SORB Mode Detection

- **Build-time**: `VITE_SORB_MODE=true` when building for SORB-only deployment
- **Runtime**: `window.location.hostname.includes('sorb')` – when visiting sorbarmyrecruitertool.duckdns.org, SORB UI is shown automatically

## API Endpoints

- `GET /api/sorb/analytics?station=...&sorbCo=...&logAttempt=...&gtMin=...&gtMax=...`
- `GET /api/sorb/leads?station=...&sorbCo=...&logAttempt=...&gtMin=...&gtMax=...`
