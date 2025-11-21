import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertRecruitSchema,
  insertLocationSchema,
  insertEventSchema,
  insertQrSurveyResponseSchema,
  qrSurveyResponses,
} from "@shared/schema";
import { z } from "zod";
import { askAI, createProspectingSystemPrompt, type AIMessage } from "./llm";
import { searchNearbyLocations, searchNearbyEvents, geocodeZipCode } from "./places";
import {
  registerUser,
  verifyEmail,
  loginUser,
  createSession,
  destroySession,
  generateQRCodeImage,
  generateSurveyQRCodeImage,
  requestPasswordReset,
  resetPassword as resetPasswordHandler,
  sendApplicantConfirmationEmail,
  sendSurveyConfirmationEmail,
  sendRecruiterSurveyNotification,
  sendRecruiterApplicationNotification,
} from "./auth";
import { db } from "./database";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

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

  // Get recruiter's QR code (application form)
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

  // Get recruiter's survey QR code (presentation feedback form)
  app.get("/api/auth/qr-code-survey", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user || !user.qrCode) {
        return res.status(404).json({ error: "QR code not found" });
      }

      const qrCodeImage = await generateSurveyQRCodeImage(user.qrCode);
      res.json({ qrCode: qrCodeImage });
    } catch (error) {
      console.error("❌ Failed to generate survey QR code:", error);
      res.status(500).json({ error: "Failed to fetch survey QR code" });
    }
  });

  // Update recruiter profile
  app.put("/api/profile", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { fullName, rank, unit, phoneNumber, profilePicture } = req.body;

      // Update user profile
      const [updatedUser] = await db
        .update(users)
        .set({
          fullName: fullName || undefined,
          rank: rank || null,
          unit: unit || null,
          phoneNumber: phoneNumber || null,
          profilePicture: profilePicture || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      console.log(`✅ Updated profile for user ${userId}`);

      // Return user data without sensitive fields
      const { passwordHash, verificationToken, resetPasswordToken, ...userData } = updatedUser;
      res.json({ user: userData });
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Get/Update recruiter zip code
  app.get("/api/recruiter/zip-code", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ zipCode: user.zipCode || null });
    } catch (error) {
      console.error('❌ Failed to get zip code:', error);
      res.status(500).json({ error: "Failed to fetch zip code" });
    }
  });

  app.put("/api/recruiter/zip-code", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { zipCode } = req.body;

      if (!zipCode) {
        return res.status(400).json({ error: "Zip code is required" });
      }

      // Validate zip code format (5 digits)
      const cleanZip = zipCode.replace(/\D/g, '');
      if (cleanZip.length !== 5) {
        return res.status(400).json({ error: "Invalid zip code format. Must be 5 digits." });
      }

      // Update user's zip code
      const [updatedUser] = await db
        .update(users)
        .set({ zipCode: cleanZip, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      console.log(`✅ Updated zip code for user ${userId}: ${cleanZip}`);

      res.json({ zipCode: updatedUser.zipCode });
    } catch (error) {
      console.error('❌ Failed to update zip code:', error);
      res.status(500).json({ error: "Failed to update zip code" });
    }
  });

  // Get recruiter stats - OPTIMIZED with database queries
  app.get("/api/recruiter/stats", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // OPTIMIZED: Query database directly with WHERE clause instead of loading all recruits
      // This scales much better as data grows
      const recruiterRecruits = await storage.getRecruitsByRecruiter(userId);
      
      console.log(`📊 Stats request for userId: ${userId}`);
      console.log(`📊 Recruits matching recruiterId: ${recruiterRecruits.length}`);
      
      // Calculate stats using database-filtered results (much faster)
      const totalRecruits = recruiterRecruits.length;
      const qrCodeScans = recruiterRecruits.filter(r => r.source === "qr_code").length;
      const directEntries = recruiterRecruits.filter(r => r.source === "direct").length;
      
      console.log(`📊 Stats: total=${totalRecruits}, qrCode=${qrCodeScans}, direct=${directEntries}`);
      
      // Get recent recruits (already sorted by database query, just take first 10)
      const recentRecruits = recruiterRecruits.slice(0, 10);

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
      
      console.log(`🔍 Source determination - recruiterCode: ${body.recruiterCode || 'NULL'}, userId: ${userId || 'NULL'}`);
      
      if (body.recruiterCode && !userId) {
        // QR code scan (public form with recruiter code)
        console.log(`🔍 QR code scan detected (public form) - recruiterCode: ${body.recruiterCode}`);
        const [recruiter] = await db.select().from(users).where(eq(users.qrCode, body.recruiterCode));
        if (recruiter) {
          recruiterId = recruiter.id;
          source = "qr_code";
          console.log(`✅ QR code recruiter found - recruiterId: ${recruiterId}, source set to: qr_code`);
        } else {
          console.log(`⚠️ QR code provided but recruiter not found - recruiterCode: ${body.recruiterCode}`);
        }
      } else if (userId && !body.recruiterCode) {
        // Logged in recruiter filling intake form directly
        console.log(`🔍 Direct entry detected (logged in recruiter, no QR code)`);
        recruiterId = userId;
        source = "direct";
      } else if (userId && body.recruiterCode) {
        // Logged in recruiter but also has code - use the code's recruiter
        console.log(`🔍 Both userId and recruiterCode provided - checking QR code`);
        const [recruiter] = await db.select().from(users).where(eq(users.qrCode, body.recruiterCode));
        if (recruiter) {
          recruiterId = recruiter.id;
          source = "qr_code";
          console.log(`✅ QR code recruiter found - recruiterId: ${recruiterId}, source set to: qr_code`);
        } else {
          recruiterId = userId;
          source = "direct";
          console.log(`⚠️ QR code not found, using logged-in userId, source: direct`);
        }
      } else {
        console.log(`⚠️ No recruiterCode and no userId - public submission without recruiter, source: direct`);
      }
      
      console.log(`📊 Final source determination - recruiterId: ${recruiterId || 'NULL'}, source: ${source}`);
      
      // Remove recruiterCode from body and use recruiterId
      const { recruiterCode, ...recruitData } = body;
      
      console.log(`📝 Creating recruit - recruiterId: ${recruiterId || 'NULL'}, source: ${source}, userId from session: ${userId || 'NULL'}`);
      
      // Ensure source is explicitly set
      const recruitToCreate = {
        ...recruitData,
        recruiterId: recruiterId || null, // Use null instead of undefined for database
        source: source || "direct", // Explicitly ensure source is set
      };
      
      console.log(`📝 Recruit data before validation - source: ${recruitToCreate.source}, recruiterId: ${recruitToCreate.recruiterId}`);
      
      const validatedData = insertRecruitSchema.parse(recruitToCreate);
      
      // Double-check source is still set after validation
      if (!validatedData.source) {
        validatedData.source = source || "direct";
        console.log(`⚠️ Source was missing after validation, setting to: ${validatedData.source}`);
      }
      
      console.log(`📝 Validated data - source: ${validatedData.source}, recruiterId: ${validatedData.recruiterId}`);
      
      const recruit = await storage.createRecruit(validatedData);

      console.log(`✅ Created recruit: id=${recruit.id}, recruiterId=${recruit.recruiterId || 'NULL'} (type: ${typeof recruit.recruiterId}), source=${recruit.source || 'MISSING'}`);

      // Send confirmation email to applicant
      try {
        await sendApplicantConfirmationEmail(recruit.email, recruit.firstName, recruit.lastName, recruiterId);
      } catch (emailError) {
        console.error('⚠️ Failed to send applicant confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      // Send notification to recruiter if this application is assigned to them
      if (recruiterId) {
        try {
          const [recruiter] = await db.select().from(users).where(eq(users.id, recruiterId));
          if (recruiter) {
            await sendRecruiterApplicationNotification(
              recruiter.email,
              recruiter.fullName,
              recruit.firstName,
              recruit.lastName,
              recruit.email,
              recruit.phone,
              source
            );
          }
        } catch (emailError) {
          console.error('⚠️ Failed to send recruiter application notification:', emailError);
          // Don't fail the request if email fails
        }
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

  // QR SURVEY ENDPOINTS

  // Public endpoint: submit quick survey / presentation feedback
  app.post("/api/surveys", async (req, res) => {
    try {
      const { recruiterCode, ...body } = req.body;

      if (!recruiterCode || typeof recruiterCode !== "string") {
        return res.status(400).json({ error: "Recruiter QR code is required" });
      }

      // Find recruiter by QR code identifier
      const [recruiter] = await db
        .select()
        .from(users)
        .where(eq(users.qrCode, recruiterCode));

      if (!recruiter) {
        return res.status(404).json({ error: "Recruiter not found" });
      }

      // Attach recruiterId and capture IP
      const ipAddress =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        null;

      const validated = insertQrSurveyResponseSchema.parse({
        ...body,
        recruiterId: recruiter.id,
        ipAddress,
      });

      const [created] = await db
        .insert(qrSurveyResponses)
        .values(validated)
        .returning();

      // Send confirmation email to the person who submitted feedback
      try {
        await sendSurveyConfirmationEmail(
          created.email,
          created.name,
          created.rating,
          recruiter.id
        );
      } catch (emailError) {
        console.error('⚠️ Failed to send survey confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      // Send notification to the recruiter about the new survey response
      try {
        await sendRecruiterSurveyNotification(
          recruiter.email,
          recruiter.fullName,
          created.name,
          created.rating
        );
      } catch (emailError) {
        console.error('⚠️ Failed to send recruiter survey notification:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      console.error("❌ Failed to submit survey response:", error);
      res.status(500).json({ error: "Failed to submit survey response" });
    }
  });

  // Authenticated recruiter: get my survey responses + summary
  app.get("/api/surveys/my", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const responses = await db
        .select()
        .from(qrSurveyResponses)
        .where(eq(qrSurveyResponses.recruiterId, userId))
        .orderBy(sql`${qrSurveyResponses.createdAt} DESC`);

      const total = responses.length;
      const averageRating =
        total > 0
          ? responses.reduce((sum, r) => sum + (r.rating || 0), 0) / total
          : 0;

      res.json({
        total,
        averageRating,
        responses,
      });
    } catch (error) {
      console.error("❌ Failed to fetch survey responses:", error);
      res.status(500).json({ error: "Failed to fetch survey responses" });
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

  // Batch create locations (to avoid rate limiting)
  app.post("/api/locations/batch", async (req, res) => {
    try {
      const { locations } = req.body;
      
      if (!Array.isArray(locations)) {
        return res.status(400).json({
          message: "Locations must be an array",
        });
      }

      const createdLocations = [];
      const errors = [];

      // Process locations in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < locations.length; i += batchSize) {
        const batch = locations.slice(i, i + batchSize);
        
        for (const locationData of batch) {
          try {
            const validatedData = insertLocationSchema.parse(locationData);
            const location = await storage.createLocation(validatedData);
            createdLocations.push(location);
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push({
                location: locationData.name || "Unknown",
                error: "Validation failed",
                details: error.errors,
              });
            } else {
              errors.push({
                location: locationData.name || "Unknown",
                error: error instanceof Error ? error.message : "Failed to create location",
              });
            }
          }
        }

        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < locations.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      res.status(201).json({
        created: createdLocations.length,
        total: locations.length,
        locations: createdLocations,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create locations",
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

  // Clear all locations (for logout) - must come before /api/locations/:id
  app.delete("/api/locations", async (_req, res) => {
    try {
      await storage.clearAllLocations();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to clear locations",
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

  // Clear all events (for logout) - must come before /api/events/:id
  app.delete("/api/events", async (_req, res) => {
    try {
      await storage.clearAllEvents();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to clear events",
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

  // Geocode zip code to coordinates
  app.post("/api/places/geocode-zip", async (req, res) => {
    try {
      const { zipCode } = req.body;
      
      if (!zipCode) {
        return res.status(400).json({ message: "Zip code is required" });
      }

      const coords = await geocodeZipCode(zipCode);
      
      if (!coords) {
        return res.status(404).json({ 
          message: `Could not find coordinates for zip code ${zipCode}. Please check the zip code and try again.` 
        });
      }

      res.json({
        latitude: coords.latitude,
        longitude: coords.longitude,
        zipCode,
      });
    } catch (error) {
      console.error("Error geocoding zip code:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to geocode zip code",
      });
    }
  });

  // Search for nearby locations using Google Places API
  app.post("/api/places/search", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      let { latitude, longitude, radius, useZipCode } = req.body;

      // If recruiter is logged in and useZipCode is true, use their zip code instead of provided coordinates
      if (userId && useZipCode === true) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        
        if (user?.zipCode) {
          console.log(`📍 Using recruiter zip code: ${user.zipCode}`);
          const coords = await geocodeZipCode(user.zipCode);
          
          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
            console.log(`📍 Geocoded to: ${latitude}, ${longitude}`);
          } else {
            console.warn(`⚠️ Failed to geocode zip code ${user.zipCode}, using provided coordinates`);
            useZipCode = false; // Fall back to provided coordinates
          }
        } else {
          console.warn(`⚠️ User has no zip code set, using provided coordinates`);
          useZipCode = false;
        }
      }

      if (!latitude || !longitude) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude are required" });
      }

      // Increased radius for both current location and zip code searches
      const isCurrentLocation = !userId || useZipCode === false;
      const radiusMeters = radius || 5000; // 5km for both current location and zip code

      console.log(`🔍 Searching locations: ${latitude}, ${longitude}, radius: ${radiusMeters}m (${isCurrentLocation ? 'current location' : 'zip code'})`);

      let locations = await searchNearbyLocations(
        latitude,
        longitude,
        radiusMeters
      );

      // If using zip code, filter to only include locations within that zip code
      // Check both the user's saved zip code and the zip code passed in the request
      if (useZipCode) {
        let targetZipCode: string | undefined;
        
        if (userId) {
          const [user] = await db.select().from(users).where(eq(users.id, userId));
          targetZipCode = user?.zipCode;
        }
        
        // Also check if zip code was passed directly in the request
        if (req.body.zipCode) {
          targetZipCode = req.body.zipCode;
        }
        
        if (targetZipCode) {
          const beforeFilter = locations.length;
          locations = locations.filter(loc => {
            // Check if location's zip code matches the target zip code
            return loc.zipCode === targetZipCode;
          });
          console.log(`📍 Filtered locations by zip code ${targetZipCode}: ${beforeFilter} → ${locations.length}`);
        }
      }

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
      const userId = (req as any).session?.userId;
      let { latitude, longitude, radius, useZipCode } = req.body;

      // If recruiter is logged in and useZipCode is true, use their zip code instead of provided coordinates
      if (userId && useZipCode === true) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        
        if (user?.zipCode) {
          console.log(`📍 Using recruiter zip code for events: ${user.zipCode}`);
          const coords = await geocodeZipCode(user.zipCode);
          
          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
            console.log(`📍 Geocoded to: ${latitude}, ${longitude}`);
          } else {
            console.warn(`⚠️ Failed to geocode zip code ${user.zipCode}, using provided coordinates`);
            useZipCode = false; // Fall back to provided coordinates
          }
        } else {
          console.warn(`⚠️ User has no zip code set, using provided coordinates`);
          useZipCode = false;
        }
      }

      if (!latitude || !longitude) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude are required" });
      }

      // Radius for event searches
      const isCurrentLocation = !userId || useZipCode === false;
      const radiusMiles = radius || 5; // 5 miles for both current location and zip code

      console.log(`🔍 Searching events: ${latitude}, ${longitude}, radius: ${radiusMiles}mi (${isCurrentLocation ? 'current location' : 'zip code'})`);

      let events = await searchNearbyEvents(latitude, longitude, radiusMiles);

      // If using zip code, filter to only include events within that zip code
      // Check both the user's saved zip code and the zip code passed in the request
      if (useZipCode) {
        let targetZipCode: string | undefined;
        
        if (userId) {
          const [user] = await db.select().from(users).where(eq(users.id, userId));
          targetZipCode = user?.zipCode;
        }
        
        // Also check if zip code was passed directly in the request
        if (req.body.zipCode) {
          targetZipCode = req.body.zipCode;
        }
        
        if (targetZipCode) {
          const beforeFilter = events.length;
          events = events.filter(evt => {
            // Check if event's zip code matches the target zip code
            return evt.zipCode === targetZipCode;
          });
          console.log(`📍 Filtered events by zip code ${targetZipCode}: ${beforeFilter} → ${events.length}`);
        }
      }

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
      const { message, userLocation, zipCode } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      const systemPrompt = createProspectingSystemPrompt(userLocation, zipCode);

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
