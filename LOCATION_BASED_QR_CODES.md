# Location-Based QR Codes Feature

## Overview

This feature allows users to generate location-labeled QR codes on-demand for tracking where applications and surveys are being scanned. Each location QR code is unique and tracks scans separately from the default QR code.

## Database Changes

### New Table: `qr_code_locations`
- Stores location-based QR codes with custom labels
- Links to recruiter who created it
- Supports both 'application' and 'survey' QR types

### Updated Table: `qr_scans`
- Added `location_qr_code_id` column to track which QR was scanned
- If NULL, it's the default QR code
- If set, it's a location-based QR code

## API Endpoints

### POST `/api/qr-codes/location`
Create a new location-based QR code
- Body: `{ locationLabel: string, qrType: 'application' | 'survey' }`
- Returns: QR code details with image

### GET `/api/qr-codes/location`
Get all location-based QR codes for current user
- Returns: Array of location QR codes

### GET `/api/qr-codes/location/:id/image`
Get QR code image for a specific location QR
- Returns: Base64 QR code image

### DELETE `/api/qr-codes/location/:id`
Delete a location-based QR code

## Updated Endpoints

### POST `/api/qr-scan`
- Now checks for location QR codes first
- Records `location_qr_code_id` if scanned from location QR
- Returns `locationLabel` in response

### GET `/api/recruiter/by-qr/:qrCode`
- Now handles both default and location QR codes
- Returns `locationLabel` if from location QR

### POST `/api/recruits`
- Updated to handle location QR codes when creating recruits

## UI Components (To Be Implemented)

1. **Location QR Code Generator** (in my-qr page)
   - Form to create new location QR codes
   - Input for location label
   - Select for QR type (application/survey)
   - Display generated QR codes with labels

2. **QR Scan Analytics View**
   - Popup/dialog showing scan details
   - Breakdown by location
   - Default QR vs location QR scans
   - Conversion rates by location

3. **Dashboard Updates**
   - QR counter shows location breakdown
   - Click to view detailed analytics

4. **Excel Export Updates**
   - Add "Scan Location" column
   - Shows location label or "Default QR"

## Migration

Run migration: `009_add_location_based_qr_codes.sql`

## Status

- ✅ Database schema
- ✅ API endpoints
- ✅ QR scan tracking
- ✅ UI components (my-qr page with location QR generator)
- ✅ Excel export updates (scan location column)
- ✅ Analytics view (dashboard popup with location breakdown)
- ✅ Dashboard QR counter (clickable with location details)

## Features Implemented

1. **Location QR Code Generation**
   - Users can create QR codes with custom location labels
   - Supports both application and survey QR types
   - Each location QR code is unique and trackable

2. **Scan Location Tracking**
   - All QR scans record which QR code was used (default or location)
   - Scans are linked to applications when converted
   - Location information is preserved throughout the flow

3. **Excel Export Enhancement**
   - Added "Scan Location" column to exports
   - Shows location label or "Default QR" or "Direct Entry"
   - Available in both station commander and individual exports

4. **Analytics Dashboard**
   - Click on "QR Code Scans" card to view detailed analytics
   - Shows breakdown by location
   - Displays conversion rates per location
   - Shows recent scans with location labels

5. **Backend Updates**
   - All recruit creation endpoints handle location QR codes
   - QR scan tracking automatically detects location QR codes
   - Analytics endpoint provides comprehensive location breakdown

## Deployment

Run the deployment script:
```bash
./cybit-k8s/deploy-location-qr-codes.sh
```

This will:
1. Apply database migration (009_add_location_based_qr_codes.sql)
2. Build and push Docker image
3. Restart the deployment

