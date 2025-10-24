# Army Recruiting Tool

A comprehensive web application for Army recruiters to manage recruit applications, track prospecting locations, and identify recruiting opportunities.

## ⚡ New Features

### 🤖 AI Recruiting Assistant (FREE!)

- **Powered by Hugging Face 🤗** - Easiest free LLM, no credit card required
- Ask questions about prospecting strategies
- Get location recommendations based on your area
- Identify target demographics and best times to visit
- 24/7 recruiting advisor at your fingertips
- **Setup in 1 minute** - See [HUGGINGFACE_SETUP.md](./HUGGINGFACE_SETUP.md)

### 📍 Geolocation Integration

- Automatically centers map on your current location
- Real-time GPS positioning
- Location-aware AI suggestions

## Features

### 📋 Recruit Management

- **Intake Form** - Comprehensive application form for potential recruits
- **Dashboard** - View and manage all recruit applications
- **Status Tracking** - Track application status (pending, reviewing, approved, rejected)
- **Search & Filter** - Find recruits by name, email, or status
- **Detailed Views** - View complete recruit profiles
- **CSV Export** - Export recruit data for reporting

### 🗺️ Prospecting Map

- **Interactive Map** - Visual representation of recruiting locations and events
- **Your Location** - Automatically centered on your GPS coordinates
- **Location Tracking** - Track schools, gyms, malls, and community centers
- **Event Management** - Manage career fairs, sports events, and community events
- **Prospecting Scores** - Identify high-value recruiting locations (0-100 scale)
- **Search & Filter** - Find locations by name, type, or city
- **Demographics Data** - View target audience information for each location
- **Event Calendar** - Track upcoming recruiting opportunities
- **AI Assistant** 🤖 - Get instant help with prospecting strategies

See [PROSPECTING_GUIDE.md](./PROSPECTING_GUIDE.md) for detailed prospecting documentation.  
See [AI_SETUP.md](./AI_SETUP.md) for AI assistant setup (takes 2 minutes!).

## Technology Stack

### Frontend

- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Leaflet** - Interactive maps
- **React-Leaflet** - React components for Leaflet

### Backend

- **Express** - Web server framework
- **TypeScript** - Type-safe backend
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Database (or in-memory storage for development)
- **Zod** - Runtime validation
- **Hugging Face** - Free AI integration (no credit card!)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (optional - in-memory storage available for development)

### Production Deployment with HTTPS

For production deployment with SSL (NIPR-compatible):

- **🚀 Complete Guide**: [COMPLETE_DEPLOYMENT.md](./COMPLETE_DEPLOYMENT.md) - Full deployment workflow
- **⚡ Quick Start**: [QUICK_SETUP.md](./QUICK_SETUP.md) - 3-step setup guide
- **📖 Reverse Proxy**: [REVERSE_PROXY_SETUP.md](./REVERSE_PROXY_SETUP.md) - Nginx & SSL details
- **⚙️ PM2 Setup**: [PM2_SETUP.md](./PM2_SETUP.md) - Auto-start configuration
- **✅ Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment checklist

**Two-command deployment:**
```bash
sudo ./setup-reverse-proxy.sh    # Setup HTTPS
sudo ./setup-pm2.sh               # Setup auto-start
```

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ArmyRecruitTool
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your settings (optional but recommended for AI assistant)
```

4. (Optional but Recommended) Get a free Hugging Face token for AI assistant:

   - Visit https://huggingface.co/join (takes 1 minute!)
   - Sign up (just email, no credit card)
   - Go to Settings → Access Tokens → Create new token
   - Add it to `.env`: `HUGGINGFACE_API_KEY=hf_your_token_here`
   - See [HUGGINGFACE_SETUP.md](./HUGGINGFACE_SETUP.md) for details

5. Start the development server:

```bash
npm run dev
```

6. Open your browser to `http://localhost:5001`

## Project Structure

```
ArmyRecruitTool/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # Radix UI components
│   │   │   └── header.tsx
│   │   ├── pages/        # Page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── intake-form.tsx
│   │   │   ├── recruit-detail.tsx
│   │   │   └── prospecting-map.tsx  # NEW: Prospecting map page
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and clients
│   │   └── App.tsx       # Main app component
│   └── index.html        # HTML entry point
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage layer
│   └── vite.ts           # Vite integration
├── shared/               # Shared code between client/server
│   └── schema.ts         # Database schema and types
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── README.md             # This file
└── PROSPECTING_GUIDE.md  # Detailed prospecting feature guide
```

## API Endpoints

### Recruits

- `GET /api/recruits` - Get all recruits
- `GET /api/recruits/:id` - Get single recruit
- `POST /api/recruits` - Create new recruit
- `PATCH /api/recruits/:id/status` - Update recruit status
- `DELETE /api/recruits/:id` - Delete recruit
- `GET /api/recruits/export/csv` - Export recruits to CSV

### Locations (Prospecting)

- `GET /api/locations` - Get all locations
- `GET /api/locations/:id` - Get single location
- `POST /api/locations` - Create new location
- `PATCH /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Events (Prospecting)

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create new event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## Database Schema

### Recruits Table

Stores information about potential recruits including personal information, physical measurements, education, prior service, and application status.

### Locations Table

Stores prospecting locations with:

- Basic info (name, type, address)
- Coordinates (latitude, longitude)
- Prospecting score (0-100)
- Foot traffic level
- Demographics data
- Notes and last visited date

### Events Table

Stores recruiting events with:

- Event details (name, type, date, time)
- Location and coordinates
- Expected attendance
- Target audience
- Contact information
- Registration and cost details
- Status tracking

## Development

### Running in Development Mode

```bash
npm run dev
```

This starts both the frontend (Vite) and backend (Express) servers with hot reload.

### Building for Production

```bash
npm run build
```

This builds the frontend and backend for production deployment.

### Starting Production Server

#### Option 1: PM2 (Recommended - Auto-starts on boot)

```bash
sudo ./setup-pm2.sh
```

See [PM2_SETUP.md](./PM2_SETUP.md) for complete PM2 documentation.

#### Option 2: Direct Start

```bash
npm start
```

### Type Checking

```bash
npm run check
```

### Database Migrations

```bash
npm run db:push
```

## Usage

### Managing Recruits

1. **Create Application**

   - Click "New Application" in the header
   - Fill out the comprehensive intake form
   - Submit to create a new recruit record

2. **View Dashboard**

   - Navigate to the dashboard (home page)
   - See statistics and all applications
   - Search and filter as needed

3. **Update Status**

   - Click "View" on any recruit
   - Update status (pending → reviewing → approved/rejected)
   - View complete recruit profile

4. **Export Data**
   - Click "Export CSV" on the dashboard
   - Download recruit data for reporting

### Using Prospecting Map

1. **Navigate to Prospecting**

   - Click "Prospecting" in the header
   - View the interactive map with locations and events

2. **Find Locations**

   - Browse the map or list view
   - Filter by location type (schools, gyms, etc.)
   - Check prospecting scores and demographics

3. **Plan Events**

   - Switch to "Events" tab
   - View upcoming recruiting opportunities
   - Note contact information and requirements

4. **Search & Filter**
   - Use the search bar to find specific places
   - Toggle location/event visibility
   - Click markers or list items for details

For detailed prospecting documentation, see [PROSPECTING_GUIDE.md](./PROSPECTING_GUIDE.md).

## Configuration

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (optional)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)

### In-Memory Storage

For development without PostgreSQL, the app uses in-memory storage with sample data pre-loaded:

- Sample recruits
- Sample locations (Portland area)
- Sample events

## Security Considerations

- All recruit data includes sensitive information (SSN, DOB)
- Implement proper authentication in production
- Use HTTPS for all connections
- Encrypt sensitive data at rest
- Follow Army regulations for data handling
- Regular security audits recommended

## Future Enhancements

### Planned Features

- User authentication and authorization
- Role-based access control (recruiters, admins)
- Real-time notifications
- Mobile app (iOS/Android)
- Advanced analytics and reporting
- Integration with Army systems
- Automated geocoding for locations
- Route planning for site visits
- Heat maps for prospecting density
- Calendar integration for events

### Prospecting Enhancements

- Geocoding API integration
- Directions and routing
- Marker clustering for performance
- Location analytics and tracking
- Team collaboration features
- Mobile-optimized map view

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions, issues, or feature requests:

- Check the [PROSPECTING_GUIDE.md](./PROSPECTING_GUIDE.md) for prospecting features
- Review the code documentation
- Open an issue on the repository

## Acknowledgments

- Built with modern web technologies
- Designed for Army recruiters
- Sample data based on Portland, OR area
- OpenStreetMap for map tiles

---

**Note:** This is a demonstration application. Ensure compliance with Army regulations and security requirements before deploying to production.
