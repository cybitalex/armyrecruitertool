import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  QrCode,
  MapPin,
  FileText,
  Users,
  User,
  Settings,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { Calendar, MessageSquare, Download, BarChart3, Filter, Ship, Briefcase, Bell } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  image?: string;
}

interface TutorialContent {
  title: string;
  description: string;
  steps: TutorialStep[];
}

const TUTORIAL_STORAGE_KEY = "army-recruiter-tutorial-completed";
const WELCOME_STORAGE_KEY = "army-recruiter-welcome-shown";

// Tutorial content for different pages
const tutorialContent: Record<string, TutorialContent> = {
  dashboard: {
    title: "Dashboard Overview - Complete Guide",
    description: "Master your dashboard with this comprehensive walkthrough of all features and capabilities",
    steps: [
      {
        title: "Welcome to Your Command Center",
        description:
          "Your dashboard is the heart of your recruiting operations. This is where you'll spend most of your time tracking leads, analyzing performance, and managing your recruits. The dashboard automatically refreshes every 10 seconds to ensure you always have the latest information without needing to manually reload the page.",
        icon: Home,
      },
      {
        title: "Understanding Your Statistics",
        description:
          "At the top of your dashboard, you'll see key performance indicators (KPIs): Total Recruits (all applicants you've submitted), Leads (initial contacts or potential recruits), Surveys (feedback from presentations or events), QR Code Scans (how many times your codes were scanned), and Conversion Rate (percentage of scans that became applications). These numbers help you measure your recruiting effectiveness and identify areas for improvement.",
        icon: BarChart3,
      },
      {
        title: "Recent Recruits List",
        description:
          "Below your stats, you'll see a list of your most recent applicants. Each row shows the recruit's name, contact information, status (New, Contacted, Scheduled, etc.), source (whether they came from a QR code scan or direct entry), and submission date. Click on any recruit's name to open their detailed profile where you can view all information, add notes, update their status, and track their progress through the recruiting pipeline.",
        icon: Users,
      },
      {
        title: "Status Management",
        description:
          "Use the status indicators to track where each recruit is in your pipeline. Available statuses include: New (just submitted), Contacted (initial contact made), Qualified (met basic requirements), Scheduled (appointment set), In Process (working through paperwork), and Completed (successfully enlisted or application closed). Keeping statuses updated helps you stay organized and ensures no leads fall through the cracks.",
        icon: CheckCircle2,
      },
      {
        title: "QR Code Analytics Deep Dive",
        description:
          "The QR Code Analytics section shows how effective your QR codes are. You'll see: Total Scans (how many people scanned any of your codes), Survey Scans (scans that led to survey completions), Application Scans (scans that resulted in full applications), and Conversion Rate (percentage of scans that converted to actions). This data helps you determine which marketing materials and locations are most effective, allowing you to focus your efforts where they'll have the biggest impact.",
        icon: QrCode,
      },
      {
        title: "Filtering and Searching",
        description:
          "Use the search bar to quickly find specific recruits by name, email, or phone number. You can also filter your view to show only certain statuses (e.g., only 'New' recruits that need follow-up) or sort by different criteria like submission date or conversion source. These tools help you focus on what matters most at any given time.",
        icon: Filter,
      },
      {
        title: "Quick Actions and Export",
        description:
          "The Quick Actions menu provides one-click access to common tasks: View My QR Code (download or display your recruiting QR code), Create New Application (manually enter a recruit's information), and Export to Excel (download all your data for offline analysis or reporting to leadership). The Excel export includes all recruit details, timestamps, sources, and current statuses - perfect for weekly or monthly reports.",
        icon: Download,
      },
    ],
  },
  "my-qr": {
    title: "QR Code Management - Complete Guide",
    description: "Master QR code generation, deployment, and tracking to maximize your recruiting reach",
    steps: [
      {
        title: "Understanding QR Code Technology",
        description:
          "QR codes are your digital business card on steroids. Each code is uniquely assigned to you, meaning any application or survey submitted through your codes automatically appears in your dashboard with full attribution. This eliminates manual data entry and ensures you get credit for every lead you generate. The codes work on any smartphone camera app - no special app required. When scanned, prospects are taken directly to a mobile-optimized form that works on any device.",
        icon: QrCode,
      },
      {
        title: "Downloading and Using Your Personal QR Code",
        description:
          "Your personal QR code is available in multiple formats for different use cases. Click 'Download QR Code' to save it as a high-resolution PNG image. Print it on business cards (1-2 inches works well), recruiting flyers, banners, or display it on your tablet/phone screen during presentations. When prospects scan this code, they're taken to the full application form. Best practices: Include a call-to-action like 'Scan to Apply' or 'Interested in Serving? Scan Here'. Place the code at eye level or hand level for easy scanning. Test the code yourself before mass printing to ensure it works correctly.",
        icon: Download,
      },
      {
        title: "Survey QR Codes for Low-Commitment Lead Generation",
        description:
          "Survey codes are perfect for capturing leads from people who aren't ready to commit to a full application. The survey takes only 30-60 seconds to complete and collects: name, phone number, email, presentation rating (1-5 stars), and general interest level. This is ideal for: end-of-presentation feedback, career fair table displays, event booths, or any situation where you want to capture contact info quickly. Many recruiters see 3-5x more responses from survey codes compared to full application codes because the barrier to entry is so low. Follow up with survey respondents later with personalized messages about opportunities that match their interests.",
        icon: MessageSquare,
      },
      {
        title: "Creating Location-Based QR Codes",
        description:
          "Location-specific codes let you track which venues or events generate the most leads. Click 'Generate Location QR Code' and enter a specific location name (e.g., 'Lincoln High School Career Fair' or 'Downtown Fitness Center'). Each location gets a unique code. When someone scans it, the system records that location as the lead source. This granular tracking helps you identify your best prospecting spots. Over time, you'll see patterns: certain schools consistently produce qualified leads, specific gym chains have demographics that align with Army recruiting goals, or certain types of events (sports vs. music) generate more interest. Use this data to prioritize where you spend your time.",
        icon: MapPin,
      },
      {
        title: "QR Code Placement Strategies",
        description:
          "Strategic placement dramatically affects your results. High-traffic areas: gym bulletin boards, coffee shop windows (with permission), community center displays, college student centers. Event usage: display on your phone/tablet during conversations, print on handouts at career fairs, include on presentation slides, place on table tents at your booth. Digital distribution: include in email signatures, share on social media (if allowed by your command), text to prospects after initial conversations. Always include context - a QR code without explanation gets fewer scans. Add text like 'Scan to Learn About Army Opportunities' or 'Scan for More Information' to boost engagement.",
        icon: QrCode,
      },
      {
        title: "Tracking QR Code Performance",
        description:
          "Return to your dashboard to see detailed QR code analytics. Total Scans shows overall interest. Applications from Scans shows successful conversions. Surveys from Scans indicates engagement level. Your conversion rate (applications ÷ scans) reveals effectiveness. Industry benchmarks: 10-20% conversion rate is excellent, 5-10% is good, below 5% suggests room for improvement. Low conversion rates might indicate: unclear call-to-action on marketing materials, QR code placement in low-quality traffic areas, or application form friction. Compare performance across different locations and materials to identify what works best.",
        icon: BarChart3,
      },
      {
        title: "Mobile Display Best Practices",
        description:
          "When displaying your QR code on your phone or tablet during in-person conversations, follow these tips for best results. Set screen brightness to maximum so the code is clearly visible. Disable auto-sleep/auto-lock temporarily so the screen doesn't go dark mid-scan. Use landscape orientation for larger code display. Hold the device steady at chest/waist height - the optimal scanning position. Keep your finger away from the code itself. Tell prospects: 'Go ahead and open your camera app and scan this code - it'll take you right to the application.' Wait for confirmation that the scan worked (they should see a notification or link appear) before moving on.",
        icon: QrCode,
      },
      {
        title: "Print Quality and Testing",
        description:
          "Print quality directly affects scan reliability. Minimum recommended size: 1x1 inch for close-range scanning (business cards), 2x2 inches for arm's length scanning (flyers), 4x4 inches or larger for distance scanning (banners, signs). Print on white or light backgrounds only - dark backgrounds reduce scannability. Use high-quality printers and good paper stock. Always test printed codes before mass production: scan them yourself with multiple phone models and in different lighting conditions. If scans fail, the code may be too small, too blurry, or printed with insufficient contrast. Reprint at larger size or higher quality.",
        icon: CheckCircle2,
      },
      {
        title: "Legal and Ethical Considerations",
        description:
          "Always get permission before placing QR codes in private establishments. Don't place codes on government property without authorization. Follow your command's social media and marketing guidelines - some commands restrict where and how QR codes can be shared digitally. Never misrepresent what the QR code leads to - be clear that it's for Army recruiting. Don't place codes in locations frequented primarily by minors without appropriate disclaimers. When collecting data via surveys, ensure you're complying with privacy regulations and only using the information for its stated purpose (recruiting follow-up). Maintain professionalism in all QR code marketing materials.",
        icon: CheckCircle2,
      },
      {
        title: "Advanced: Multi-Channel QR Strategy",
        description:
          "Top performers use a multi-code strategy. Personal QR code: on your business cards and phone for direct conversations. Survey codes: at events and presentations for low-commitment lead capture. Location codes: unique codes for each high-value prospecting location to track effectiveness. Event codes: specific codes for major events (career fairs, military appreciation nights) to measure ROI. This approach gives you granular data about what's working. Review your analytics monthly and adjust strategy: print more materials for high-performing locations, discontinue placements at low-performing venues, and focus your time where the data shows the best returns.",
        icon: QrCode,
      },
    ],
  },
  prospecting: {
    title: "Prospecting Map - Complete Field Guide",
    description: "Master location-based recruiting with this comprehensive guide to finding, tracking, and maximizing high-value prospecting opportunities",
    steps: [
      {
        title: "Understanding the Prospecting Map",
        description:
          "The Prospecting Map is your intelligence tool for identifying where potential recruits gather. Instead of driving around hoping to find good locations, this map uses real-time data from Google Places and event APIs to show you exactly where to focus your efforts. The map displays schools, gyms, community centers, shopping areas, entertainment venues, and upcoming events - all filtered by your geographic area. Each location includes demographic data, foot traffic estimates, and other intelligence to help you prioritize your time effectively.",
        icon: MapPin,
      },
      {
        title: "Searching for High-Value Locations",
        description:
          "Use the search bar to find specific types of locations. Try searches like: 'high schools near me', 'gyms in [city name]', 'community colleges', 'shopping malls', 'sports venues', or 'community centers'. The system searches within your specified radius (adjustable from 5-50 miles) and returns locations ranked by relevance. Each result shows: business name, address, distance from your current location, rating/reviews, and a prospecting score (if available). The prospecting score considers factors like demographic alignment, foot traffic, and accessibility.",
        icon: MapPin,
      },
      {
        title: "Location Categories and Targeting",
        description:
          "Different location types serve different recruiting strategies. High Schools: great for future soldier programs and junior ROTC connections. Community Colleges: prime for immediate enlistment opportunities, especially students unsure about continuing education. Gyms/Fitness Centers: attract physically active individuals who may align with Army fitness standards. Shopping Malls: high foot traffic for QR code placement and survey distribution. Sports Venues: capture competitive individuals during games and events. Community Centers: access to diverse demographics and community events. Target a mix of location types to diversify your lead sources.",
        icon: Filter,
      },
      {
        title: "Viewing and Analyzing Location Details",
        description:
          "Click any location marker on the map to open its detailed profile. You'll see: full address with directions link, phone number and website, operating hours (plan your visits accordingly), user ratings and reviews (gauge community reputation), photos of the location, demographic information (age ranges, income levels if available), and historical notes from previous visits. This intelligence helps you prepare before visiting: know the best times to visit, understand the audience you'll encounter, and review what worked or didn't work in previous prospecting efforts at this location.",
        icon: FileText,
      },
      {
        title: "Adding Locations to Your Prospecting List",
        description:
          "When you find a promising location, add it to your prospecting list for tracking. Click 'Add to Prospecting List' on any location detail page. Once added, you can: record visit dates and times, add notes about each visit (who you spoke with, materials left, reception quality), set follow-up reminders, track how many leads came from this location, and rate the location's effectiveness over time. Your prospecting list becomes your personalized database of proven and potential recruiting spots, helping you build efficient routes and prioritize high-performing locations.",
        icon: CheckCircle2,
      },
      {
        title: "Event Discovery and Planning",
        description:
          "The map also displays upcoming events pulled from multiple sources: career fairs, job fairs, military appreciation events, sports games, concerts, festivals, and community gatherings. Events are marked with special icons and include: event name and description, date and time, venue location, expected attendance (when available), ticket/admission requirements, and event organizer contact info. Events are goldmine opportunities - you're reaching people who are already out and engaged. Plan your calendar around high-value events, and arrive prepared with QR codes, business cards, and survey materials.",
        icon: Calendar,
      },
      {
        title: "Route Planning and Efficiency",
        description:
          "Use the map to plan efficient prospecting routes. View multiple locations simultaneously to identify clusters of high-value targets in the same area. Plan routes that minimize drive time and maximize face time. For example: visit 3-4 gyms in the same commercial district in one morning, or hit multiple schools in the same neighborhood during lunch hours. The map's distance calculations help you estimate travel time. Export your prospecting list with addresses to your phone's GPS app for turn-by-turn navigation. Efficient routing means more locations visited per day, which translates to more leads generated.",
        icon: MapPin,
      },
      {
        title: "Recording Visit Notes and Outcomes",
        description:
          "After each prospecting visit, immediately record notes while details are fresh. Document: date and time of visit, who you spoke with (manager names, staff members, potential recruits), reception quality (welcomed, neutral, asked to leave), materials left (QR code flyers, business cards, posters), leads generated (immediate applications or contacts collected), and follow-up actions needed (call manager next week, return for specific event, etc.). These notes create institutional knowledge - if you transfer or another recruiter takes over your territory, they'll know exactly what's been done and what works at each location.",
        icon: FileText,
      },
      {
        title: "Analyzing Location Performance",
        description:
          "Regularly review your prospecting list to identify patterns. Sort by: leads generated (which locations produce the most applications), conversion rate (quality of leads from each location), visit frequency (are you over-visiting low-performers?), and last visit date (which locations need attention). This analysis helps you optimize your strategy. If a gym has generated 15 leads over 6 months, prioritize it. If a mall has had 10 visits with zero leads, consider dropping it from your rotation. Data-driven prospecting is far more effective than random or habitual location visits.",
        icon: BarChart3,
      },
      {
        title: "Seasonal and Timing Strategies",
        description:
          "Timing matters significantly in prospecting. Schools: best during lunch hours, after school, or during career days (coordinate with counselors). Gyms: early morning (5-7am) and evening (5-8pm) when most active. Malls: weekends and evenings for foot traffic. Community Centers: check their event calendars for busy times. Events: arrive early to set up, stay through peak attendance. Seasonal considerations: target colleges heavily in spring (graduation approaching) and fall (new semester uncertainty). Adjust your prospecting calendar based on these patterns to maximize face time with potential recruits when they're most receptive.",
        icon: Calendar,
      },
      {
        title: "Building Relationships with Location Managers",
        description:
          "Long-term prospecting success comes from building relationships with location managers and staff. Introduce yourself professionally, explain your role, ask permission before leaving materials, respect their space and rules, and follow through on any commitments. When managers trust you, they'll allow QR code placement, notify you of upcoming events, and sometimes even recommend the Army to visitors. Document these relationships in your location notes: manager names, best contact methods, any agreements made, and relationship quality. These relationships turn one-time visits into ongoing lead generation channels.",
        icon: Users,
      },
    ],
  },
  "station-commander": {
    title: "Station Commander Complete Leadership Guide",
    description: "Comprehensive training on managing your station, analyzing team performance, and maximizing recruiting effectiveness",
    steps: [
      {
        title: "Welcome to Station Commander Dashboard",
        description:
          "As a Station Commander, you have access to a powerful oversight dashboard that provides real-time visibility into every aspect of your station's recruiting operations. This dashboard consolidates data from all recruiters under your command, giving you the insights needed to coach effectively, identify trends, allocate resources, and recognize top performers. The interface automatically refreshes every 30 seconds to ensure you always have current information for decision-making.",
        icon: Users,
      },
      {
        title: "Understanding Station-Wide Statistics",
        description:
          "At the top of your dashboard, you'll see aggregated metrics for your entire station: Total Recruits (all applications submitted by your team), Total Leads (initial contacts), Total Surveys (feedback collected), Total QR Scans (all code scans across your team), and Station-Wide Conversion Rate (percentage of scans that became applications). These numbers give you an instant snapshot of your station's performance. Compare these to previous periods to track improvement, or benchmark against other stations to identify areas for growth.",
        icon: BarChart3,
      },
      {
        title: "Individual Recruiter Performance Cards",
        description:
          "Below station totals, you'll see performance cards for each recruiter on your team. Each card displays the recruiter's full name, rank, and comprehensive statistics: total recruits, leads, surveys completed, QR code scans, applications from scans, surveys from scans, and personal conversion rate. This side-by-side comparison makes it easy to identify your top performers, spot recruiters who might need additional training or support, and recognize trends (e.g., if everyone's numbers drop simultaneously, it might indicate a market-wide challenge rather than individual performance issues).",
        icon: User,
      },
      {
        title: "Sorting and Filtering Your Team",
        description:
          "Use the powerful sorting and filtering tools to analyze your team from different angles. Sort by: Name (alphabetical), Leads (who's generating the most prospects), Surveys (who's most active at events), Total Recruits (overall productivity), or Conversion Rate (who's most efficient at closing). Filter by name to quickly find specific recruiters. These tools help you prepare for one-on-one counseling sessions, identify training opportunities, and recognize excellence. For example, sorting by conversion rate helps you identify your best closers - these recruiters can mentor others on effective follow-up techniques.",
        icon: Filter,
      },
      {
        title: "Deep Dive: The Leads Tab",
        description:
          "Click on the Leads tab to see every single applicant from every recruiter at your station in one consolidated view. Each row shows: recruiter name (who owns this lead), applicant information, contact details, current status, source (QR code, direct entry, or survey), submission timestamp, and location if available. This master list helps you spot trends like common application sources, typical status progression times, or bottlenecks where leads stall. Click any lead to open their full profile in a new tab for detailed review. Use this when investigating issues or conducting quality checks on application data.",
        icon: FileText,
      },
      {
        title: "Analyzing Survey Data",
        description:
          "The Surveys tab consolidates all feedback from prospects who scanned survey QR codes at presentations, career fairs, or other events. You'll see: which recruiter conducted the presentation, the prospect's contact information, their rating (1-5 stars), written comments, interest level, and submission time. This data is goldmine for improving your station's presentation effectiveness. Look for patterns: Are certain recruiters consistently getting high ratings? What do their comments reveal? Low ratings might indicate need for additional presentation training or updated marketing materials. High ratings with strong interest levels are prime leads for immediate follow-up.",
        icon: MessageSquare,
      },
      {
        title: "QR Code Analytics - Measuring Digital Effectiveness",
        description:
          "Each recruiter's performance card includes detailed QR code metrics showing how effectively they're using digital tools. Total Scans shows raw interest - how many people encountered and scanned their codes. Applications from Scans and Surveys from Scans show concrete results. Conversion Rate (applications ÷ scans) reveals effectiveness at converting interest into action. Compare these metrics across your team: If one recruiter has high scans but low conversions, they might be placing QR codes effectively but need better qualifying questions or follow-up strategies. If another has low scans overall, they may need coaching on QR code placement and promotion.",
        icon: QrCode,
      },
      {
        title: "Drilling Down into Performance",
        description:
          "Click on the station totals at the top of the Overview tab to drill down and see exactly which recruiters contributed to specific numbers. For example, clicking on 'Total Surveys: 247' might show that 3 recruiters accounted for 200 of those surveys (very active at events) while others rarely use surveys. This granular insight helps you understand team dynamics, identify specialists (some recruiters excel at events, others at one-on-one), and ensure everyone is leveraging all available tools. Use these insights during counseling sessions to set specific, measurable improvement goals.",
        icon: BarChart3,
      },
      {
        title: "Export and Reporting Capabilities",
        description:
          "Click 'Export Full Report' to download a comprehensive Excel spreadsheet containing every piece of data from your station: all recruits, all surveys, all statistics, complete with recruiter attributions, timestamps, and status information. This export is formatted for professional presentation - perfect for monthly operations reviews, quarterly assessments, or sharing with battalion leadership. The data is already organized and can be easily converted into charts or graphs. You can also filter the view before exporting to create focused reports (e.g., 'Last 30 Days of Activity' or 'Only Qualified Leads').",
        icon: Download,
      },
      {
        title: "Using Data for Coaching and Development",
        description:
          "This dashboard isn't just for reporting - it's a coaching tool. Before one-on-one sessions, review the recruiter's numbers compared to station averages. Low conversion rates? Discuss follow-up techniques. High scans but few results? Review QR code placement strategy and marketing materials. Consistently strong performance? Ask them to mentor others. The data removes guesswork from coaching conversations and helps you provide specific, actionable feedback. Track improvement over time by exporting reports periodically and comparing period-over-period growth.",
        icon: CheckCircle2,
      },
      {
        title: "Identifying Training Opportunities",
        description:
          "Look for patterns across your team that indicate training needs. If everyone has low survey response rates, consider station-wide training on event presentations. If QR code conversion rates are uniformly low, review the application process for friction points or unclear instructions. If certain lead sources consistently outperform others, share those best practices with the entire team. The aggregated view helps you spot systemic issues that individual recruiters might not recognize, and address them proactively with targeted training or updated standard operating procedures.",
        icon: Users,
      },
      {
        title: "Shippers Dashboard - Track Future Soldiers",
        description:
          "The Shippers Dashboard (accessible via the 'Shippers' tab in the header) is your command center for tracking recruits who are preparing to ship to basic training. This feature provides comprehensive oversight of all upcoming shippers across your station, organized by ship date with automatic urgency indicators. Red badges indicate shippers leaving within 3 days (critical timeline), orange badges show those shipping within 7 days (attention needed), and gray badges represent future ships. For each shipper, you'll see their ship date, component (Active Duty or Reserve), assigned MOS with full job details, and which recruiter is responsible for their processing.",
        icon: Ship,
      },
      {
        title: "MOS Information and Tracking",
        description:
          "When viewing shippers, each Military Occupational Specialty (MOS) code is interactive. On desktop, hover your cursor over any MOS code (like '11B' or '68W') to see a tooltip displaying the complete job title, detailed description, and category. On mobile devices, the MOS information displays automatically below each shipper entry in an easy-to-read card format. This helps you quickly understand what role each future soldier will fulfill and ensure proper pipeline management across different job categories. You can update shipping information (ship date, component, or MOS) by clicking 'Edit Info' on any shipper card - useful when dates change or when a recruit's MOS is finalized after MEPS processing.",
        icon: Briefcase,
      },
      {
        title: "Automated Shipper Notifications",
        description:
          "The system automatically monitors all upcoming ship dates and sends notifications 3 days before departure. These alerts are delivered both via email and as in-app notifications (visible via the bell icon in the header). Notifications are sent to you as Station Commander, the assigned recruiter, and any admins. Email notifications include complete shipper details: name, exact ship date with day-of-week, component, MOS, and recruiter name, plus a direct link to the Shippers Dashboard. This automation ensures no shipper falls through the cracks during the critical final days before departure. In-app notifications accumulate in your notification center and show an unread count badge, so you'll never miss time-sensitive shipper updates.",
        icon: Bell,
      },
      {
        title: "Shipper Statistics and Insights",
        description:
          "At the top of the Shippers Dashboard, four key metrics provide instant situational awareness: Total Shippers (everyone with a ship date), Shipping Next 7 Days (immediate attention required), Active Component count, and Reserve Component count. Use these numbers to balance workload across recruiters, identify peak shipping periods, and ensure adequate station manning during high-volume ship weeks. The dashboard automatically refreshes every minute to reflect real-time changes. Sort the shipper list by date to prioritize follow-ups, or filter mentally by recruiter name to see each team member's ship pipeline. This visibility helps you coach recruiters on proper ship preparation timelines and recognize those who consistently get applicants to the finish line.",
        icon: BarChart3,
      },
      {
        title: "Best Practices for Station Commanders",
        description:
          "Daily: Review the Overview tab each morning to check for new activity and ensure no critical leads are aging without follow-up. Check the Shippers Dashboard for any red-badge (≤3 days) departures requiring final coordination. Weekly: Sort recruiters by different metrics to identify coaching opportunities and recognize excellence. Review upcoming shippers for the next 7-14 days and ensure recruiters have completed all pre-ship requirements. Monthly: Export comprehensive reports for higher headquarters. Compare current month to previous periods. Hold team meetings to share best practices from top performers. Analyze ship success rates and identify any patterns in last-minute cancellations. Quarterly: Analyze long-term trends in conversion rates, lead sources, ship rates, and overall productivity. Update station SOPs based on what the data reveals. This consistent, data-driven approach transforms recruiting management from reactive to proactive.",
        icon: CheckCircle2,
      },
    ],
  },
  general: {
    title: "Complete Recruiter Training Guide",
    description: "Master the Army Recruiter Tool with this comprehensive step-by-step guide for regular recruiters",
    steps: [
      {
        title: "Welcome to Your Digital Recruiting Partner",
        description:
          "The Army Recruiter Tool is designed to streamline your recruiting operations and help you track leads more effectively. This platform replaces manual spreadsheets and paper records with a modern, mobile-friendly system that works anywhere you have internet. Everything syncs in real-time, so you can access your data from your office computer, personal phone, or tablet in the field.",
        icon: Home,
      },
      {
        title: "Understanding Your Dashboard",
        description:
          "Your dashboard is mission control for all recruiting activities. It displays real-time statistics including total recruits, leads, survey responses, and QR code analytics. The dashboard auto-refreshes every 10 seconds to keep data current. You'll see your most recent applicants at the top, with quick access to update their status or view full details. Use this as your daily starting point to prioritize follow-ups and track your progress toward monthly goals.",
        icon: BarChart3,
      },
      {
        title: "Setting Up Your QR Code",
        description:
          "Your personal QR code is a game-changer for lead generation. Navigate to 'My QR Code' to download it in various formats. This unique code links directly to you, so any applicant who scans it will automatically be assigned to your profile. Print it on business cards, event flyers, or display it on your phone or tablet at presentations. When prospects scan it, they're taken directly to a mobile-optimized application form. You can also generate location-specific QR codes to track which events or venues generate the most leads.",
        icon: QrCode,
      },
      {
        title: "Creating Survey QR Codes",
        description:
          "Survey QR codes are perfect for presentations, career fairs, or any event where you want quick feedback. When someone scans your survey code, they can rate your presentation, provide contact information, and indicate their interest level - all in about 30 seconds. This low-commitment option captures leads from people who might not be ready to fill out a full application but want to stay in touch. Use these surveys to build your prospect list and follow up with personalized messages later.",
        icon: MessageSquare,
      },
      {
        title: "Prospecting Map - Finding Your Next Recruit",
        description:
          "The Prospecting Map helps you identify high-value locations in your area. Search for schools, gyms, community centers, shopping malls, sports venues, and other places where potential recruits congregate. The map shows detailed information including addresses, operating hours, and demographic data. Add locations to your prospecting list to track visits, record notes about each location, and plan your routes efficiently. The map also displays upcoming events like career fairs, sports games, and concerts - prime opportunities for recruiting.",
        icon: MapPin,
      },
      {
        title: "Managing Leads and Applications",
        description:
          "Every person who scans your QR code or submits an application appears in your dashboard. Click on any recruit to view their complete profile: personal information, contact details, education history, physical stats, interests, and qualifications. Update their status as they progress through your pipeline: New → Contacted → Qualified → Scheduled → In Process → Completed. Add notes after each interaction to track conversations, concerns, or follow-up tasks. This detailed tracking ensures you never lose sight of a potential recruit.",
        icon: Users,
      },
      {
        title: "Manual Application Entry",
        description:
          "Sometimes you'll meet prospects who don't have smartphones or prefer to provide information verbally. Use the 'New Application' feature to manually enter their details. This form includes all necessary fields: personal information, contact details, education, physical qualifications, and interests. The manual entry process takes about 2-3 minutes and ensures you can capture every lead regardless of how you meet them. These manually-entered recruits appear in your dashboard just like QR code applications.",
        icon: FileText,
      },
      {
        title: "Understanding Source Tracking",
        description:
          "The system automatically tracks how each recruit found you. 'QR Code' means they scanned one of your codes and self-submitted. 'Direct Entry' means you manually entered their information. 'Survey' means they filled out a quick survey first. This source tracking helps you identify which methods work best. If most of your successful recruits come from QR codes at gyms, you know to focus more effort there. If manual entries convert better, you might emphasize face-to-face conversations.",
        icon: CheckCircle2,
      },
      {
        title: "Using QR Code Analytics",
        description:
          "Your QR Code Analytics section shows the complete picture of your code's effectiveness. Total Scans shows how many people showed interest by scanning. Survey Scans indicates how many completed feedback forms. Application Scans shows full applications. Your Conversion Rate (applications ÷ total scans) reveals how compelling your pitch is. A low conversion rate might mean you need better qualifying questions or clearer instructions on your marketing materials. Track these metrics weekly to identify trends and optimize your approach.",
        icon: QrCode,
      },
      {
        title: "Exporting Data and Reporting",
        description:
          "Click 'Export to Excel' to download all your recruit data in a spreadsheet format. This is perfect for weekly reports to your station commander, monthly performance reviews, or personal record-keeping. The export includes every detail: names, contact info, submission dates, current status, source, and all application details. You can filter and sort the data before exporting to create focused reports (e.g., 'All New Leads This Week' or 'All Qualified Applicants Needing Scheduling').",
        icon: Download,
      },
      {
        title: "Mobile Access and Field Work",
        description:
          "This tool is fully mobile-responsive, meaning it works perfectly on smartphones and tablets. When you're at a recruiting event, you can show your QR code on your phone for prospects to scan. You can also pull up recruit details during phone calls, update statuses while traveling between appointments, or enter new applications on-the-spot at career fairs. Your data syncs instantly across all devices, so information entered on your phone appears immediately on your office computer.",
        icon: Home,
      },
      {
        title: "Best Practices for Success",
        description:
          "Daily routine: Check your dashboard each morning to review new leads and prioritize follow-ups. Update recruit statuses immediately after each interaction. Weekly: Review your analytics to see what's working. Print fresh QR code materials for upcoming events. Monthly: Export your data for reporting and back up important notes. Always: Keep your QR code accessible on your phone, respond to new leads within 24 hours, and document every significant conversation in the recruit's notes. Consistent use of this system will dramatically improve your tracking, follow-up rates, and ultimately your recruiting numbers.",
        icon: CheckCircle2,
      },
    ],
  },
};

interface TutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: string;
}

export function Tutorial({ open, onOpenChange, page = "general" }: TutorialProps) {
  const { user } = useAuth();
  const [currentStepRecruiter, setCurrentStepRecruiter] = useState(0);
  const [currentStepSC, setCurrentStepSC] = useState(0);
  const [activeTab, setActiveTab] = useState<"recruiter" | "sc">("recruiter");
  
  // Check if user is a station commander
  const isStationCommander = user?.role === 'station_commander' || user?.role === 'admin';
  
  // If station commander and on general page, show both tutorials with tabs
  const shouldShowBothTutorials = isStationCommander && page === 'general';
  
  // Get content based on current page or active tab
  // For regular recruiters, NEVER show station-commander content
  let content;
  if (page === 'station-commander' && !isStationCommander) {
    // Regular recruiter trying to access SC tutorial - redirect to general
    content = tutorialContent.general;
  } else {
    content = tutorialContent[page] || tutorialContent.general;
  }
  
  let currentStep = currentStepRecruiter;
  let setCurrentStep = setCurrentStepRecruiter;
  
  // If showing both tutorials, use tab-specific content and state
  if (shouldShowBothTutorials) {
    if (activeTab === "sc") {
      content = tutorialContent["station-commander"];
      currentStep = currentStepSC;
      setCurrentStep = setCurrentStepSC;
    } else {
      content = tutorialContent.general;
      currentStep = currentStepRecruiter;
      setCurrentStep = setCurrentStepRecruiter;
    }
  }
  
  const totalSteps = content.steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark tutorial as completed
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
      onOpenChange(false);
      setCurrentStepRecruiter(0);
      setCurrentStepSC(0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    onOpenChange(false);
    setCurrentStepRecruiter(0);
    setCurrentStepSC(0);
  };

  const step = content.steps[currentStep];
  const StepIcon = step.icon || FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] w-[95vw] sm:w-full overflow-hidden bg-army-black border-army-field01 p-0 flex flex-col [&>button]:text-army-gold [&>button]:bg-army-green/50 [&>button]:hover:bg-army-gold [&>button]:hover:text-army-black [&>button]:border [&>button]:border-army-gold [&>button]:opacity-100">
        <div className="p-4 sm:p-6 border-b border-army-field01 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-army-gold text-xl sm:text-2xl break-words">
              {shouldShowBothTutorials ? "Complete Training Guide" : content.title}
            </DialogTitle>
            <DialogDescription className="text-army-tan mt-2 text-sm sm:text-base">
              {shouldShowBothTutorials 
                ? "Choose between Recruiter and Station Commander tutorials using the tabs below"
                : content.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

        {shouldShowBothTutorials ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "recruiter" | "sc")} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-army-green">
              <TabsTrigger 
                value="recruiter" 
                className="data-[state=active]:bg-army-gold data-[state=active]:text-army-black text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Recruiter Guide</span>
                <span className="sm:hidden">Recruiter</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sc"
                className="data-[state=active]:bg-army-gold data-[state=active]:text-army-black text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Station Commander Guide</span>
                <span className="sm:hidden">Station Cmd</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recruiter" className="mt-4 flex-1 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-army-gold text-lg sm:text-xl font-semibold break-words">{tutorialContent.general.title}</h3>
                <p className="text-army-tan text-xs sm:text-sm mt-1">{tutorialContent.general.description}</p>
              </div>
              {renderTutorialContent(tutorialContent.general, currentStepRecruiter, setCurrentStepRecruiter)}
            </TabsContent>
            
            <TabsContent value="sc" className="mt-4 flex-1 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-army-gold text-lg sm:text-xl font-semibold break-words">{tutorialContent["station-commander"].title}</h3>
                <p className="text-army-tan text-xs sm:text-sm mt-1">{tutorialContent["station-commander"].description}</p>
              </div>
              {renderTutorialContent(tutorialContent["station-commander"], currentStepSC, setCurrentStepSC)}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-full overflow-y-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex gap-1 sm:gap-2">
                {content.steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 sm:h-2 flex-1 rounded ${
                      index <= currentStep
                        ? "bg-army-gold"
                        : "bg-army-field01"
                    }`}
                  />
                ))}
              </div>
            </div>
            <Badge className="bg-army-green text-army-tan text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
              {currentStep + 1}/{totalSteps}
            </Badge>
          </div>

          {/* Step content */}
          <Card className="bg-army-green border-army-field01">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-lg bg-army-gold/20 flex-shrink-0">
                  <StepIcon className="h-4 w-4 sm:h-6 sm:w-6 text-army-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-army-gold text-base sm:text-lg break-words">
                    {step.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <CardDescription className="text-army-tan text-sm sm:text-base leading-relaxed break-words">
                {step.description}
              </CardDescription>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-2 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="border-army-field01 text-army-tan hover:bg-army-green hover:text-army-gold disabled:opacity-50 text-sm sm:text-base px-3 sm:px-4"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Prev</span>
            </Button>

            <Button
              onClick={handleNext}
              className="bg-army-gold text-army-black hover:bg-army-gold/90 text-sm sm:text-base px-3 sm:px-4"
            >
              {currentStep === totalSteps - 1 ? (
                <>
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                </>
              )}
            </Button>
          </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Helper function to render tutorial content for tabs
  function renderTutorialContent(content: TutorialContent, stepIndex: number, setStepIndex: (index: number) => void) {
    const step = content.steps[stepIndex];
    const StepIcon = step.icon || FileText;
    const totalSteps = content.steps.length;

    return (
      <>
        {/* Progress indicator */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex gap-1 sm:gap-2">
              {content.steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 sm:h-2 flex-1 rounded ${
                    index <= stepIndex
                      ? "bg-army-gold"
                      : "bg-army-field01"
                  }`}
                />
              ))}
            </div>
          </div>
          <Badge className="bg-army-green text-army-tan text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
            {stepIndex + 1}/{totalSteps}
          </Badge>
        </div>

        {/* Step content */}
        <Card className="bg-army-green border-army-field01">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-army-gold/20 flex-shrink-0">
                <StepIcon className="h-4 w-4 sm:h-6 sm:w-6 text-army-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-army-gold text-base sm:text-lg break-words">
                  {step.title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <CardDescription className="text-army-tan text-sm sm:text-base leading-relaxed break-words">
              {step.description}
            </CardDescription>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2 mt-4 sm:mt-6">
          <Button
            variant="outline"
            onClick={() => stepIndex > 0 && setStepIndex(stepIndex - 1)}
            disabled={stepIndex === 0}
            className="border-army-field01 text-army-tan hover:bg-army-green hover:text-army-gold disabled:opacity-50 text-sm sm:text-base px-3 sm:px-4"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden">Prev</span>
          </Button>

          <Button
            onClick={() => {
              if (stepIndex < totalSteps - 1) {
                setStepIndex(stepIndex + 1);
              } else {
                localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
                onOpenChange(false);
                setCurrentStepRecruiter(0);
                setCurrentStepSC(0);
              }
            }}
            className="bg-army-gold text-army-black hover:bg-army-gold/90 text-sm sm:text-base px-3 sm:px-4"
          >
            {stepIndex === totalSteps - 1 ? (
              <>
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Finish
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              </>
            )}
          </Button>
        </div>
      </>
    );
  }
}

// Welcome modal for first-time users
interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Partial<UserType> | null;
}

export function WelcomeModal({ open, onOpenChange, user }: WelcomeModalProps) {
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    onOpenChange(false);
  };

  const handleTakeTutorial = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    onOpenChange(false);
    // Open tutorial after a brief delay
    setTimeout(() => {
      const event = new CustomEvent("open-tutorial", { detail: { page: "general" } });
      window.dispatchEvent(event);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-army-black border-army-field01">
        <DialogHeader>
          <DialogTitle className="text-army-gold text-2xl text-center">
            Welcome to Army Recruiter Tool!
          </DialogTitle>
          <DialogDescription className="text-army-tan text-center mt-2">
            {user?.fullName ? `Welcome, ${user.fullName}!` : "Welcome!"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <Card className="bg-army-green border-army-field01">
            <CardContent className="pt-6">
              <div className="space-y-3 text-army-tan">
                <div className="flex items-start gap-3">
                  <QrCode className="h-5 w-5 text-army-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Get Your QR Code</p>
                    <p className="text-sm text-army-tan/80">
                      Download your personal QR code to share with potential recruits
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-army-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Track Prospecting</p>
                    <p className="text-sm text-army-tan/80">
                      Find and manage high-value locations and events
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-army-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Manage Recruits</p>
                    <p className="text-sm text-army-tan/80">
                      View and track all your applicants in one place
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleGetStarted}
              className="flex-1 border-army-field01 text-army-tan hover:bg-army-green hover:text-army-gold"
            >
              Get Started
            </Button>
            <Button
              onClick={handleTakeTutorial}
              className="flex-1 bg-army-gold text-army-black hover:bg-army-gold/90"
            >
              Take Tutorial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if user should see welcome modal
export function useWelcomeModal() {
  const [showWelcome, setShowWelcome] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (!hasSeenWelcome && user) {
      setShowWelcome(true);
    }
  }, [user]);

  return { showWelcome, setShowWelcome };
}

// Helper to get current page for tutorial
export function getTutorialPage(path: string): string {
  if (path === "/" || path === "/dashboard") return "dashboard";
  if (path === "/my-qr") return "my-qr";
  if (path === "/prospecting") return "prospecting";
  if (path === "/station-commander") return "station-commander";
  return "general";
}

