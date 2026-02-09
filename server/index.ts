/**
 * Army Recruiter Tool - Server Entry Point
 * 
 * Copyright © 2025 Alex Moran. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * This software is the exclusive property of Alex Moran and is protected by
 * copyright law. Unauthorized copying, distribution, modification, or use of
 * this software, via any medium, is strictly prohibited without express
 * written permission from the copyright holder.
 * 
 * For licensing inquiries: moran.alex@icloud.com
 */

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkUpcomingShippers } from "./shipper-notifications";

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security Headers Middleware (NIPR Compliant)
app.use((req, res, next) => {
  // Prevent clickjacking attacks
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://www.eventbriteapi.com https://maps.googleapis.com https://overpass-api.de https://api.groq.com https://plausible.io;"
  );

  // Add security attribution
  res.setHeader("X-Developed-By", "SGT Alex Moran - CyBit Devs");
  res.setHeader("X-System-Classification", "UNCLASSIFIED");

  next();
});

// Rate limiting for API routes (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

app.use("/api/*", (req, res, next) => {
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let clientData = requestCounts.get(clientIp);

  if (!clientData || now > clientData.resetTime) {
    clientData = { count: 0, resetTime: now + RATE_WINDOW };
    requestCounts.set(clientIp, clientData);
  }

  clientData.count++;

  if (clientData.count > RATE_LIMIT) {
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    });
  }

  next();
});

app.use(
  express.json({
    limit: '10mb', // Increased limit for profile pictures (base64 encoded)
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session management
// Trust proxy for secure cookies behind reverse proxy
app.set('trust proxy', 1);

app.use(
  session({
    secret: process.env.JWT_SECRET || 'army-recruiter-secret-change-in-production',
    resave: true, // Force save session even if not modified
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true, // Always secure for HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/', // Ensure cookie is available for all paths
    },
    name: 'army-recruiter-session', // Custom session name
  })
);

// Session inactivity timeout middleware (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

app.use((req, res, next) => {
  // Skip for public routes
  const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/apply', '/survey'];
  const isPublic = publicPaths.some(path => req.path.startsWith(path));
  
  if (isPublic || !req.session || !(req as any).session?.userId) {
    return next();
  }

  const now = Date.now();
  const lastActivity = (req.session as any).lastActivity;

  if (lastActivity && (now - lastActivity > INACTIVITY_TIMEOUT)) {
    // Session expired due to inactivity
    console.log('⏰ Session expired due to inactivity');
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.status(401).json({ error: 'Session expired due to inactivity' });
    });
    return;
  }

  // Update last activity timestamp
  (req.session as any).lastActivity = now;
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5001 if not specified (5000 used by macOS AirPlay).
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      
      // Start shipper notification scheduler (runs daily at 8 AM)
      const scheduleShipperNotifications = () => {
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(8, 0, 0, 0); // 8 AM
        
        // If it's already past 8 AM today, schedule for tomorrow
        if (now > scheduledTime) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const timeUntilRun = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
          checkUpcomingShippers().catch((error) => {
            console.error('❌ Error in shipper notification check:', error);
          });
          
          // Reschedule for next day
          setInterval(() => {
            checkUpcomingShippers().catch((error) => {
              console.error('❌ Error in shipper notification check:', error);
            });
          }, 24 * 60 * 60 * 1000); // Run every 24 hours
        }, timeUntilRun);
        
        log(`📅 Shipper notifications scheduled for ${scheduledTime.toLocaleString()}`);
      };
      
      scheduleShipperNotifications();
    }
  );
})();
