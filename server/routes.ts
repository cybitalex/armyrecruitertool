import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertRecruitSchema,
  insertLocationSchema,
  insertEventSchema,
} from "@shared/schema";
import { z } from "zod";
import { askAI, createProspectingSystemPrompt, type AIMessage } from "./llm";
import { searchNearbyLocations, searchNearbyEvents } from "./places";
import { 
  registerUser, 
  verifyEmail, 
  loginUser, 
  createSession, 
  destroySession,
  generateQRCodeImage,
  requestPasswordReset,
  resetPassword as resetPasswordHandler,
  sendApplicantConfirmationEmail
} from "./auth";
import { db } from "./database";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // AUTHENTICATION ENDPOINTS
  
  // Register new recruiter
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log('📝 Registration attempt for:', req.body.email);
      const result = await registerUser(req.body);
      console.log('✅ Registration successful for:', req.body.email);
      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Registration error:', error);
      const message = error instanceof Error ? error.message : "Registration failed";
      const status = message.includes("already exists") ? 409 : 400;
      res.status(status).json({ error: message });
    }
  });

  // Verify email
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
      }

      const result = await verifyEmail(token);
      
      // Redirect to login with success message
      res.redirect(`/login?verified=true`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed";
      res.status(400).json({ error: message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await loginUser(email, password);
      
      // Create session
      await createSession(req, user.id);
      
      // Verify session was created
      console.log('✅ Session created for user:', user.id, 'Session ID:', req.sessionID);
      console.log('📝 Session data:', JSON.stringify(req.session));
      
      // Return user data (without sensitive fields)
      const { passwordHash, verificationToken, resetPasswordToken, ...userData } = user;
      
      // Ensure session is fully saved before sending response
      await new Promise<void>((resolve) => {
        req.session.save((err) => {
          if (err) {
            console.error('❌ Error saving session before response:', err);
          } else {
            console.log('✅ Session fully saved, sending response');
          }
          resolve();
        });
      });
      
      // Send response after session is saved
      res.json({ message: "Login successful", user: userData });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      res.status(401).json({ error: message });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      await destroySession(req);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      console.log('🔍 Auth check - Session ID:', req.sessionID);
      console.log('🔍 Auth check - Session data:', JSON.stringify(req.session));
      console.log('🔍 Auth check - Cookies:', req.headers.cookie);
      
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        console.log('❌ No userId in session');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { passwordHash, verificationToken, resetPasswordToken, ...userData } = user;
      console.log('✅ User authenticated:', userData.email);
      res.json({ user: userData });
    } catch (error) {
      console.error('❌ Auth check error:', error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Forgot password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const result = await requestPasswordReset(email);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process password reset request";
      res.status(400).json({ error: message });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }

      const result = await resetPasswordHandler(token, password);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      res.status(400).json({ error: message });
    }
  });

  // Get recruiter's QR code
  app.get("/api/auth/qr-code", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || !user.qrCode) {
        return res.status(404).json({ error: "QR code not found" });
      }

      // Generate QR code image on demand from the stored identifier
      const qrCodeImage = await generateQRCodeImage(user.qrCode);
      res.json({ qrCode: qrCodeImage });
    } catch (error) {
      console.error('❌ Failed to generate QR code:', error);
      res.status(500).json({ error: "Failed to fetch QR code" });
    }
  });

  // Get recruiter stats
  app.get("/api/recruiter/stats", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get all recruits
      const allRecruits = await storage.getAllRecruits();
      
      console.log(`📊 Stats request for userId: ${userId} (type: ${typeof userId})`);
      console.log(`📊 Total recruits in system: ${allRecruits.length}`);
      if (allRecruits.length > 0) {
        allRecruits.forEach((r, idx) => {
          console.log(`📊 Recruit ${idx + 1}: id=${r.id}, recruiterId=${r.recruiterId || 'NULL'} (type: ${typeof r.recruiterId}), source=${r.source || 'NULL'}`);
        });
      }
      
      // Filter recruits for this recruiter (if recruiterId is set)
      // Handle null/undefined recruiterId and convert both to strings for comparison
      const recruiterRecruits = allRecruits.filter(r => {
        if (!r.recruiterId) {
          return false; // Skip recruits without a recruiterId
        }
        const match = String(r.recruiterId) === String(userId);
        if (!match) {
          console.log(`📊 Mismatch: recruit recruiterId "${r.recruiterId}" !== userId "${userId}"`);
        }
        return match;
      });
      
      console.log(`📊 Recruits matching recruiterId ${userId}: ${recruiterRecruits.length}`);
      
      // Calculate stats
      const totalRecruits = recruiterRecruits.length;
      const qrCodeScans = recruiterRecruits.filter(r => r.source === "qr_code").length;
      const directEntries = recruiterRecruits.filter(r => r.source === "direct").length;
      
      console.log(`📊 Stats: total=${totalRecruits}, qrCode=${qrCodeScans}, direct=${directEntries}`);
      
      // Get recent recruits (last 10)
      const recentRecruits = recruiterRecruits
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 10);

      res.json({
        totalRecruits,
        qrCodeScans,
        directEntries,
        recentRecruits,
      });
    } catch (error) {
      console.error('❌ Failed to get recruiter stats:', error);
      res.status(500).json({ error: "Failed to fetch recruiter stats" });
    }
  });

  // RECRUITS ENDPOINTS (with recruiter filtering)
  // Get all recruits
  app.get("/api/recruits", async (_req, res) => {
    try {
      const recruits = await storage.getAllRecruits();
      res.json(recruits);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch recruits",
      });
    }
  });

  // Get single recruit by ID
  app.get("/api/recruits/:id", async (req, res) => {
    try {
      const recruit = await storage.getRecruit(req.params.id);

      if (!recruit) {
        return res.status(404).json({ message: "Recruit not found" });
      }

      res.json(recruit);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch recruit",
      });
    }
  });

  // Get recruiter by QR code
  app.get("/api/recruiter/by-qr/:qrCode", async (req, res) => {
    try {
      const { qrCode } = req.params;
      
      const [recruiter] = await db.select().from(users).where(eq(users.qrCode, qrCode));
      
      if (!recruiter) {
        return res.status(404).json({ error: "Recruiter not found" });
      }

      // Return public recruiter info (no sensitive data)
      const { passwordHash, verificationToken, resetPasswordToken, qrCode: _qrCode, ...recruiterInfo } = recruiter;
      res.json({ recruiter: recruiterInfo });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recruiter information" });
    }
  });

  // Create new recruit application
  app.post("/api/recruits", async (req, res) => {
    try {
      const body = req.body;
      const userId = (req as any).session?.userId; // Logged in recruiter ID
      
      console.log(`📝 POST /api/recruits - Session userId: ${userId || 'NULL'}, recruiterCode: ${body.recruiterCode || 'NULL'}`);
      console.log(`📝 Session data:`, JSON.stringify((req as any).session || {}));
      
      // Determine source and recruiterId:
      // - If recruiterCode (QR code) is provided, it's from QR scan
      // - If user is logged in and no recruiterCode, it's direct entry from intake form
      // - Otherwise, it's a public submission without recruiter
      let recruiterId: string | undefined = undefined;
      let source = "direct";
      
      if (body.recruiterCode && !userId) {
        // QR code scan (public form with recruiter code)
        const [recruiter] = await db.select().from(users).where(eq(users.qrCode, body.recruiterCode));
        if (recruiter) {
          recruiterId = recruiter.id;
          source = "qr_code";
        }
      } else if (userId && !body.recruiterCode) {
        // Logged in recruiter filling intake form directly
        recruiterId = userId;
        source = "direct";
      } else if (userId && body.recruiterCode) {
        // Logged in recruiter but also has code - use the code's recruiter
        const [recruiter] = await db.select().from(users).where(eq(users.qrCode, body.recruiterCode));
        if (recruiter) {
          recruiterId = recruiter.id;
          source = "qr_code";
        } else {
          recruiterId = userId;
          source = "direct";
        }
      }
      
      // Remove recruiterCode from body and use recruiterId
      const { recruiterCode, ...recruitData } = body;
      
      console.log(`📝 Creating recruit - recruiterId: ${recruiterId || 'NULL'}, source: ${source}, userId from session: ${userId || 'NULL'}`);
      
      const validatedData = insertRecruitSchema.parse({
        ...recruitData,
        recruiterId: recruiterId || null, // Use null instead of undefined for database
        source,
      });
      
      const recruit = await storage.createRecruit(validatedData);

      console.log(`✅ Created recruit: ${recruit.id}, recruiterId: ${recruit.recruiterId || 'NULL'} (type: ${typeof recruit.recruiterId}), source: ${recruit.source}`);

      // Send confirmation email to applicant
      try {
        await sendApplicantConfirmationEmail(recruit.email, recruit.firstName, recruit.lastName, recruiterId);
      } catch (emailError) {
        console.error('⚠️ Failed to send applicant confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json(recruit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }

      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create recruit",
      });
    }
  });

  // Update recruit status
  app.patch("/api/recruits/:id/status", async (req, res) => {
    try {
      const { status } = req.body;

      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = ["pending", "reviewing", "approved", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid status. Must be one of: pending, reviewing, approved, rejected",
        });
      }

      const recruit = await storage.updateRecruitStatus(req.params.id, status);

      if (!recruit) {
        return res.status(404).json({ message: "Recruit not found" });
      }

      res.json(recruit);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to update recruit status",
      });
    }
  });

  // Delete recruit
  app.delete("/api/recruits/:id", async (req, res) => {
    try {
      const success = await storage.deleteRecruit(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Recruit not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to delete recruit",
      });
    }
  });

  // Export recruits as CSV
  app.get("/api/recruits/export/csv", async (_req, res) => {
    try {
      const recruits = await storage.getAllRecruits();

      const headers = [
        "ID",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "City",
        "State",
        "Education",
        "Prior Service",
        "Status",
        "Submitted Date",
      ];

      const rows = recruits.map((recruit) => [
        recruit.id,
        recruit.firstName,
        recruit.lastName,
        recruit.email,
        recruit.phone,
        recruit.city,
        recruit.state,
        recruit.educationLevel,
        recruit.hasPriorService,
        recruit.status,
        new Date(recruit.submittedAt).toLocaleDateString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=army-recruits-${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to export recruits",
      });
    }
  });

  // LOCATION ENDPOINTS

  // Get all locations
  app.get("/api/locations", async (_req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch locations",
      });
    }
  });

  // Get single location by ID
  app.get("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.getLocation(req.params.id);

      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      res.json(location);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch location",
      });
    }
  });

  // Create new location
  app.post("/api/locations", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validatedData);

      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }

      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create location",
      });
    }
  });

  // Update location
  app.patch("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.updateLocation(req.params.id, req.body);

      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      res.json(location);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to update location",
      });
    }
  });

  // Delete location
  app.delete("/api/locations/:id", async (req, res) => {
    try {
      const success = await storage.deleteLocation(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Location not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to delete location",
      });
    }
  });

  // EVENT ENDPOINTS

  // Get all events
  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch events",
      });
    }
  });

  // Get single event by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch event",
      });
    }
  });

  // Create new event
  app.post("/api/events", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);

      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }

      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create event",
      });
    }
  });

  // Update event
  app.patch("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to update event",
      });
    }
  });

  // Delete event
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to delete event",
      });
    }
  });

  // PLACES SEARCH ENDPOINT

  // Search for nearby locations using Google Places API
  app.post("/api/places/search", async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.body;

      if (!latitude || !longitude) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude are required" });
      }

      const radiusMeters = radius || 5000; // Default 5km

      const locations = await searchNearbyLocations(
        latitude,
        longitude,
        radiusMeters
      );

      res.json({
        count: locations.length,
        locations,
        message:
          locations.length > 0
            ? `Found ${locations.length} locations within ${radiusMeters / 1000}km`
            : "No Google Places API key configured. Add GOOGLE_PLACES_API_KEY to .env to discover locations.",
      });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to search nearby locations",
      });
    }
  });

  // Search for nearby events using PredictHQ API
  app.post("/api/places/search-events", async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.body;

      if (!latitude || !longitude) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude are required" });
      }

      const radiusMiles = radius || 25; // Default 25 miles

      const events = await searchNearbyEvents(latitude, longitude, radiusMiles);

      res.json({
        count: events.length,
        events,
        message:
          events.length > 0
            ? `Found ${events.length} events within ${radiusMiles} miles`
            : "No PredictHQ API key configured. Add PREDICTHQ_API_KEY to .env to discover events.",
      });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to search nearby events",
      });
    }
  });

  // AI ASSISTANT ENDPOINT

  // Ask AI for prospecting help
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { message, userLocation } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      const systemPrompt = createProspectingSystemPrompt(userLocation);

      const messages: AIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ];

      const response = await askAI(messages);

      res.json({ response });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to get AI response",
      });
    }
  });

  // HEALTH CHECK ENDPOINTS (for Kubernetes)
  
  // Liveness probe
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Readiness probe
  app.get("/ready", async (_req, res) => {
    try {
      // Check database connectivity
      await db.select().from(users).limit(1);
      res.status(200).json({ status: "ready", timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(503).json({ 
        status: "not ready", 
        error: error instanceof Error ? error.message : "Database check failed" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
