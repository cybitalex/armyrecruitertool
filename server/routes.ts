import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertRecruitSchema,
  insertLocationSchema,
  insertEventSchema,
  insertQrSurveyResponseSchema,
  qrSurveyResponses,
  stationCommanderRequests,
  recruits,
  stations,
  stationChangeRequests,
} from "@shared/schema";
import { z } from "zod";
import { askAI, createProspectingSystemPrompt, type AIMessage } from "./llm";
import {
  searchNearbyLocations,
  searchNearbyEvents,
  geocodeZipCode,
} from "./places";
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
  sendStationCommanderApprovalEmail,
  sendStationCommanderDenialEmail,
  generateApprovalToken,
  sendStationCommanderRequestNotification,
  sendStationChangeRequestNotification,
} from "./auth";
import { db } from "./database";
import { users, qrScans, qrCodeLocations } from "@shared/schema";
import { eq, sql, and, desc, inArray } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // AUTHENTICATION ENDPOINTS

  // Register new recruiter
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("📝 Registration attempt for:", req.body.email);
      const result = await registerUser(req.body);
      console.log("✅ Registration successful for:", req.body.email);
      res.status(201).json(result);
    } catch (error) {
      console.error("❌ Registration error:", error);
      const message =
        error instanceof Error ? error.message : "Registration failed";
      const status = message.includes("already exists") ? 409 : 400;
      res.status(status).json({ error: message });
    }
  });

  // Verify email
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        return res
          .status(400)
          .json({ error: "Verification token is required" });
      }

      const result = await verifyEmail(token);

      // Redirect to login with success message
      res.redirect(`/login?verified=true`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification failed";
      res.status(400).json({ error: message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const user = await loginUser(email, password);

      // Create session
      await createSession(req, user.id);

      // Verify session was created
      console.log(
        "✅ Session created for user:",
        user.id,
        "Session ID:",
        req.sessionID
      );
      console.log("📝 Session data:", JSON.stringify(req.session));

      // Return user data (without sensitive fields)
      const {
        passwordHash,
        verificationToken,
        resetPasswordToken,
        ...userData
      } = user;

      // Ensure session is fully saved before sending response
      await new Promise<void>((resolve) => {
        req.session.save((err) => {
          if (err) {
            console.error("❌ Error saving session before response:", err);
          } else {
            console.log("✅ Session fully saved, sending response");
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
      console.log("🔍 Auth check - Session ID:", req.sessionID);
      console.log("🔍 Auth check - Session data:", JSON.stringify(req.session));
      console.log("🔍 Auth check - Cookies:", req.headers.cookie);

      const userId = (req as any).session?.userId;

      if (!userId) {
        console.log("❌ No userId in session");
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const {
        passwordHash,
        verificationToken,
        resetPasswordToken,
        ...userData
      } = user;
      console.log("✅ User authenticated:", userData.email);
      res.json({ user: userData });
    } catch (error) {
      console.error("❌ Auth check error:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // STATION ENDPOINTS

  // Get all stations (public endpoint for registration)
  app.get("/api/stations", async (req, res) => {
    try {
      const allStations = await db
        .select()
        .from(stations)
        .orderBy(stations.state);
      res.json(allStations);
    } catch (error) {
      console.error("❌ Failed to fetch stations:", error);
      res.status(500).json({ error: "Failed to fetch stations" });
    }
  });

  // Get a single station by ID
  app.get("/api/stations/:id", async (req, res) => {
    try {
      const [station] = await db
        .select()
        .from(stations)
        .where(eq(stations.id, req.params.id));

      if (!station) {
        return res.status(404).json({ error: "Station not found" });
      }

      res.json(station);
    } catch (error) {
      console.error("❌ Failed to fetch station:", error);
      res.status(500).json({ error: "Failed to fetch station" });
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
      const message =
        error instanceof Error
          ? error.message
          : "Failed to process password reset request";
      res.status(400).json({ error: message });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res
          .status(400)
          .json({ error: "Token and password are required" });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters long" });
      }

      const result = await resetPasswordHandler(token, password);
      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset password";
      res.status(400).json({ error: message });
    }
  });

  // TOKEN-BASED APPROVAL ENDPOINT (No authentication required - uses token)
  app.get("/api/approve-request", async (req, res) => {
    try {
      const { token, action } = req.query;

      if (!token || !action) {
        return res.status(400).json({ error: "Missing token or action" });
      }

      if (action !== "approve" && action !== "deny") {
        return res.status(400).json({ error: "Invalid action" });
      }

      // Find request by token
      const [request] = await db
        .select()
        .from(stationCommanderRequests)
        .where(eq(stationCommanderRequests.approvalToken, token as string));

      if (!request) {
        return res
          .status(404)
          .json({ error: "Request not found or token invalid" });
      }

      // Check if already processed
      if (request.status !== "pending") {
        return res.status(400).json({
          error: "Request already processed",
          status: request.status,
        });
      }

      // Check if token expired
      if (request.tokenExpires && new Date() > new Date(request.tokenExpires)) {
        return res.status(400).json({ error: "Approval link has expired" });
      }

      // Process the request
      if (action === "approve") {
        // Update request status
        await db
          .update(stationCommanderRequests)
          .set({
            status: "approved",
            reviewedAt: new Date(),
          })
          .where(eq(stationCommanderRequests.id, request.id));

        // Update user role
        await db
          .update(users)
          .set({ role: "station_commander" })
          .where(eq(users.id, request.userId));

        // Get user info for email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.userId));

        if (user) {
          try {
            await sendStationCommanderApprovalEmail(user.email, user.fullName);
          } catch (emailError) {
            console.error("Failed to send approval email:", emailError);
          }
        }

        // Redirect to frontend approval success page
        const appUrl = process.env.APP_URL || "http://localhost:5001";
        res.redirect(`${appUrl}/approval-success?status=approved`);
      } else {
        // Deny request
        await db
          .update(stationCommanderRequests)
          .set({
            status: "denied",
            reviewedAt: new Date(),
          })
          .where(eq(stationCommanderRequests.id, request.id));

        // Update user role to regular recruiter
        await db
          .update(users)
          .set({ role: "recruiter" })
          .where(eq(users.id, request.userId));

        // Get user info for email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.userId));

        if (user) {
          try {
            await sendStationCommanderDenialEmail(user.email, user.fullName);
          } catch (emailError) {
            console.error("Failed to send denial email:", emailError);
          }
        }

        // Redirect to frontend approval success page
        const appUrl = process.env.APP_URL || "http://localhost:5001";
        res.redirect(`${appUrl}/approval-success?status=denied`);
      }
    } catch (error) {
      console.error("Error processing approval:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  // ADMIN ENDPOINTS - Station Commander Requests Management

  // Middleware to check if user is admin
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization check failed" });
    }
  };

  // Get pending request counts (admin only)
  app.get(
    "/api/admin/pending-request-counts",
    requireAdmin,
    async (req, res) => {
      try {
        // Use subqueries to get counts
        const commanderCountResult = await db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(stationCommanderRequests)
          .where(eq(stationCommanderRequests.status, "pending"));

        const stationChangeCountResult = await db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(stationChangeRequests)
          .where(eq(stationChangeRequests.status, "pending"));

        const commanderCount = Number(commanderCountResult[0]?.count || 0);
        const stationChangeCount = Number(
          stationChangeCountResult[0]?.count || 0
        );
        const totalCount = commanderCount + stationChangeCount;

        console.log(
          `📊 Pending request counts - Commander: ${commanderCount}, Station Change: ${stationChangeCount}, Total: ${totalCount}`
        );

        res.json({
          stationCommanderRequests: commanderCount,
          stationChangeRequests: stationChangeCount,
          total: totalCount,
        });
      } catch (error) {
        console.error("Error fetching pending request counts:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch pending request counts" });
      }
    }
  );

  // Get all pending station commander requests (admin only)
  app.get(
    "/api/admin/station-commander-requests",
    requireAdmin,
    async (req, res) => {
      try {
        const requests = await db
          .select({
            id: stationCommanderRequests.id,
            userId: stationCommanderRequests.userId,
            requestedStationId: stationCommanderRequests.requestedStationId,
            justification: stationCommanderRequests.justification,
            status: stationCommanderRequests.status,
            createdAt: stationCommanderRequests.createdAt,
            userName: users.fullName,
            userEmail: users.email,
            userRank: users.rank,
            userUnit: users.unit,
          })
          .from(stationCommanderRequests)
          .leftJoin(users, eq(stationCommanderRequests.userId, users.id))
          .where(eq(stationCommanderRequests.status, "pending"))
          .orderBy(sql`${stationCommanderRequests.createdAt} DESC`);

        // Fetch station details for each request
        const requestsWithStations = await Promise.all(
          requests.map(async (request) => {
            if (request.requestedStationId) {
              const [station] = await db
                .select()
                .from(stations)
                .where(eq(stations.id, request.requestedStationId));
              return {
                ...request,
                requestedStation: station || null,
              };
            }
            return {
              ...request,
              requestedStation: null,
            };
          })
        );

        res.json({ requests: requestsWithStations });
      } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ error: "Failed to fetch requests" });
      }
    }
  );

  // Approve station commander request (admin only)
  app.post(
    "/api/admin/station-commander-requests/:requestId/approve",
    requireAdmin,
    async (req, res) => {
      try {
        const { requestId } = req.params;
        const { stationId } = req.body;

        // Get the request
        const [request] = await db
          .select()
          .from(stationCommanderRequests)
          .where(eq(stationCommanderRequests.id, requestId));

        if (!request) {
          return res.status(404).json({ error: "Request not found" });
        }

        if (request.status !== "pending") {
          return res.status(400).json({ error: "Request already processed" });
        }

        // Update request status
        await db
          .update(stationCommanderRequests)
          .set({
            status: "approved",
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
          })
          .where(eq(stationCommanderRequests.id, requestId));

        // Update user role
        await db
          .update(users)
          .set({
            role: "station_commander",
            stationId: stationId || null,
          })
          .where(eq(users.id, request.userId));

        // Get user info for email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.userId));

        if (user) {
          try {
            await sendStationCommanderApprovalEmail(user.email, user.fullName);
          } catch (emailError) {
            console.error("Failed to send approval email:", emailError);
          }
        }

        res.json({ message: "Request approved successfully" });
      } catch (error) {
        console.error("Error approving request:", error);
        res.status(500).json({ error: "Failed to approve request" });
      }
    }
  );

  // Deny station commander request (admin only)
  app.post(
    "/api/admin/station-commander-requests/:requestId/deny",
    requireAdmin,
    async (req, res) => {
      try {
        const { requestId } = req.params;
        const { reason } = req.body;

        // Get the request
        const [request] = await db
          .select()
          .from(stationCommanderRequests)
          .where(eq(stationCommanderRequests.id, requestId));

        if (!request) {
          return res.status(404).json({ error: "Request not found" });
        }

        if (request.status !== "pending") {
          return res.status(400).json({ error: "Request already processed" });
        }

        // Update request status
        await db
          .update(stationCommanderRequests)
          .set({
            status: "denied",
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            reviewNotes: reason,
          })
          .where(eq(stationCommanderRequests.id, requestId));

        // Update user role to regular recruiter
        await db
          .update(users)
          .set({ role: "recruiter" })
          .where(eq(users.id, request.userId));

        // Get user info for email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.userId));

        if (user) {
          try {
            await sendStationCommanderDenialEmail(
              user.email,
              user.fullName,
              reason
            );
          } catch (emailError) {
            console.error("Failed to send denial email:", emailError);
          }
        }

        res.json({ message: "Request denied successfully" });
      } catch (error) {
        console.error("Error denying request:", error);
        res.status(500).json({ error: "Failed to deny request" });
      }
    }
  );

  // STATION CHANGE REQUEST ENDPOINTS

  // Create station change request
  app.post("/api/station-change-requests", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { requestedStationId, reason } = req.body;

      if (!requestedStationId || !reason) {
        return res
          .status(400)
          .json({ error: "Requested station and reason are required" });
      }

      // Get current user
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Admins can change their station directly without a request
      if (user.role === "admin") {
        await db
          .update(users)
          .set({ stationId: requestedStationId })
          .where(eq(users.id, userId));

        return res.json({
          message: "Station updated successfully (admin privilege)",
        });
      }

      // Check if user already has a pending request
      const [existingRequest] = await db
        .select()
        .from(stationChangeRequests)
        .where(eq(stationChangeRequests.userId, userId))
        .where(eq(stationChangeRequests.status, "pending"));

      if (existingRequest) {
        return res
          .status(400)
          .json({ error: "You already have a pending station change request" });
      }

      // Get station details
      const [currentStation] = user.stationId
        ? await db
            .select()
            .from(stations)
            .where(eq(stations.id, user.stationId))
        : [null];
      const [requestedStation] = await db
        .select()
        .from(stations)
        .where(eq(stations.id, requestedStationId));

      // Create the request
      await db.insert(stationChangeRequests).values({
        userId,
        currentStationId: user.stationId,
        requestedStationId,
        reason,
        status: "pending",
      });

      // Send email notification to admin
      try {
        console.log(
          `📧 Sending station change request notification to admin for ${user.email}`
        );
        await sendStationChangeRequestNotification(
          user.email,
          user.fullName,
          user.rank,
          currentStation
            ? `${currentStation.name} (${currentStation.stationCode})`
            : null,
          requestedStation
            ? `${requestedStation.name} (${requestedStation.stationCode})`
            : "Unknown Station",
          reason
        );
        console.log(`✅ Station change request notification sent successfully`);
      } catch (emailError) {
        console.error(
          "❌ Failed to send station change request notification:",
          emailError
        );
        // Don't fail the request if email fails
      }

      res
        .status(201)
        .json({ message: "Station change request submitted successfully" });
    } catch (error) {
      console.error("Error creating station change request:", error);
      res
        .status(500)
        .json({ error: "Failed to submit station change request" });
    }
  });

  // Get user's pending station change request
  app.get("/api/station-change-requests/my-request", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [request] = await db
        .select()
        .from(stationChangeRequests)
        .where(eq(stationChangeRequests.userId, userId))
        .where(eq(stationChangeRequests.status, "pending"));

      res.json({ request: request || null });
    } catch (error) {
      console.error("Error fetching station change request:", error);
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  // Get all pending station change requests (admin only)
  app.get(
    "/api/admin/station-change-requests",
    requireAdmin,
    async (req, res) => {
      try {
        const requests = await db
          .select({
            id: stationChangeRequests.id,
            userId: stationChangeRequests.userId,
            userName: users.fullName,
            userEmail: users.email,
            currentStationId: stationChangeRequests.currentStationId,
            requestedStationId: stationChangeRequests.requestedStationId,
            reason: stationChangeRequests.reason,
            status: stationChangeRequests.status,
            createdAt: stationChangeRequests.createdAt,
          })
          .from(stationChangeRequests)
          .leftJoin(users, eq(stationChangeRequests.userId, users.id))
          .where(eq(stationChangeRequests.status, "pending"))
          .orderBy(stationChangeRequests.createdAt);

        // Get station details for each request
        const requestsWithStations = await Promise.all(
          requests.map(async (request) => {
            const [currentStation] = request.currentStationId
              ? await db
                  .select()
                  .from(stations)
                  .where(eq(stations.id, request.currentStationId))
              : [null];

            const [requestedStation] = await db
              .select()
              .from(stations)
              .where(eq(stations.id, request.requestedStationId));

            return {
              ...request,
              currentStation,
              requestedStation,
            };
          })
        );

        res.json(requestsWithStations);
      } catch (error) {
        console.error("Error fetching station change requests:", error);
        res.status(500).json({ error: "Failed to fetch requests" });
      }
    }
  );

  // Approve station change request (admin only)
  app.post(
    "/api/admin/station-change-requests/:requestId/approve",
    requireAdmin,
    async (req, res) => {
      try {
        const { requestId } = req.params;

        // Get the request
        const [request] = await db
          .select()
          .from(stationChangeRequests)
          .where(eq(stationChangeRequests.id, requestId));

        if (!request) {
          return res.status(404).json({ error: "Request not found" });
        }

        if (request.status !== "pending") {
          return res.status(400).json({ error: "Request already processed" });
        }

        // Get the user to check their current role
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.userId));

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Update request status
        await db
          .update(stationChangeRequests)
          .set({
            status: "approved",
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
          })
          .where(eq(stationChangeRequests.id, requestId));

        // Update user's station and demote if they're a station commander
        // Station commanders should not automatically be commanders at their new station
        const updateData: any = { stationId: request.requestedStationId };

        if (user.role === "station_commander") {
          updateData.role = "recruiter"; // Demote to regular recruiter
          console.log(
            `🔽 Demoting station commander ${user.email} to recruiter due to station transfer`
          );
        }

        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, request.userId));

        const message =
          user.role === "station_commander"
            ? "Station change approved. User has been transferred and demoted to recruiter (must request station commander access at new station)."
            : "Station change request approved successfully";

        res.json({ message });
      } catch (error) {
        console.error("Error approving station change request:", error);
        res.status(500).json({ error: "Failed to approve request" });
      }
    }
  );

  // Deny station change request (admin only)
  app.post(
    "/api/admin/station-change-requests/:requestId/deny",
    requireAdmin,
    async (req, res) => {
      try {
        const { requestId } = req.params;
        const { reason } = req.body;

        // Get the request
        const [request] = await db
          .select()
          .from(stationChangeRequests)
          .where(eq(stationChangeRequests.id, requestId));

        if (!request) {
          return res.status(404).json({ error: "Request not found" });
        }

        if (request.status !== "pending") {
          return res.status(400).json({ error: "Request already processed" });
        }

        // Update request status
        await db
          .update(stationChangeRequests)
          .set({
            status: "denied",
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            reviewNotes: reason,
          })
          .where(eq(stationChangeRequests.id, requestId));

        res.json({ message: "Station change request denied successfully" });
      } catch (error) {
        console.error("Error denying station change request:", error);
        res.status(500).json({ error: "Failed to deny request" });
      }
    }
  );

  // STATION COMMANDER ENDPOINTS

  // Submit station commander request (for existing users from profile page)
  app.post("/api/station-commander/request", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { justification } = req.body;

      if (!justification || justification.trim().length === 0) {
        return res.status(400).json({ error: "Justification is required" });
      }

      // Get user info
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has station commander access
      if (user.role === "station_commander" || user.role === "admin") {
        return res
          .status(400)
          .json({ error: "You already have station commander access" });
      }

      // Check if there's already a pending request
      const [existingRequest] = await db
        .select()
        .from(stationCommanderRequests)
        .where(eq(stationCommanderRequests.userId, userId))
        .where(eq(stationCommanderRequests.status, "pending"));

      if (existingRequest) {
        return res
          .status(400)
          .json({ error: "You already have a pending request" });
      }

      // Generate approval token and expiration (7 days)
      const approvalToken = generateApprovalToken();
      const tokenExpires = new Date();
      tokenExpires.setDate(tokenExpires.getDate() + 7);

      // Create the request - tie it to their current station
      const [request] = await db
        .insert(stationCommanderRequests)
        .values({
          userId,
          requestedStationId: user.stationId, // Request is for their current station
          justification,
          status: "pending",
          approvalToken,
          tokenExpires,
        })
        .returning();

      // Update user role to pending
      await db
        .update(users)
        .set({ role: "pending_station_commander" })
        .where(eq(users.id, userId));

      // Send notification email to admin with approval link
      try {
        console.log(
          `📧 Sending station commander request notification to admin for ${user.email}`
        );
        await sendStationCommanderRequestNotification(
          user.email,
          user.fullName,
          justification,
          request.id,
          approvalToken
        );
        console.log(
          `✅ Station commander request notification sent successfully`
        );
      } catch (error) {
        console.error("❌ Failed to send admin notification:", error);
        // Don't fail the request if email fails, but log it
      }

      res.json({
        message: "Station commander request submitted successfully",
        requestId: request.id,
      });
    } catch (error) {
      console.error("Error submitting station commander request:", error);
      res.status(500).json({ error: "Failed to submit request" });
    }
  });

  // Get user's own station commander request status
  app.get("/api/station-commander/my-request", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get the most recent request for this user
      const [request] = await db
        .select()
        .from(stationCommanderRequests)
        .where(eq(stationCommanderRequests.userId, userId))
        .orderBy(sql`${stationCommanderRequests.createdAt} DESC`)
        .limit(1);

      if (!request) {
        return res.json({ request: null });
      }

      res.json({ request });
    } catch (error) {
      console.error("Error fetching station commander request:", error);
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  // Middleware to check if user is station commander
  const requireStationCommander = async (req: any, res: any, next: any) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (
        !user ||
        (user.role !== "station_commander" && user.role !== "admin")
      ) {
        return res
          .status(403)
          .json({ error: "Station commander access required" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization check failed" });
    }
  };

  // Get all recruiters at station commander's station with their stats
  app.get(
    "/api/station-commander/recruiters",
    requireStationCommander,
    async (req, res) => {
      try {
        const stationId = req.user.stationId;

        // Get all recruiters at this station (or all if admin)
        // IMPORTANT: Include the station commander themselves since they're also a recruiter
        let recruitersAtStation;
        if (req.user.role === "admin") {
          // Admin can see all recruiters AND station commanders AND admins (they recruit too!)
          recruitersAtStation = await db
            .select()
            .from(users)
            .where(
              sql`${users.role} IN ('recruiter', 'station_commander', 'admin')`
            );
        } else if (stationId) {
          // Station commander sees their station + themselves
          recruitersAtStation = await db
            .select()
            .from(users)
            .where(
              sql`${users.stationId} = ${stationId} OR ${users.id} = ${req.user.id}`
            );
        } else {
          // Station commander without station sees themselves + any recruiters without station
          recruitersAtStation = await db
            .select()
            .from(users)
            .where(
              sql`${users.role} IN ('recruiter', 'station_commander') AND (${users.stationId} IS NULL OR ${users.id} = ${req.user.id})`
            );
        }

        // Get stats for each recruiter using optimized database aggregations
        const recruitersWithStats = await Promise.all(
          recruitersAtStation.map(async (recruiter) => {
            // Use optimized aggregation method instead of loading all data
            const stats = await storage.getRecruiterStatsAggregated(recruiter.id);

            const {
              passwordHash,
              verificationToken,
              resetPasswordToken,
              ...safeRecruiter
            } = recruiter;

            return {
              ...safeRecruiter,
              stats: {
                allTime: {
                  ...stats.allTime,
                  qrScanTracking: stats.qrScanTracking,
                },
                monthly: stats.monthly,
              },
            };
          })
        );

        // Calculate station totals
        const stationTotals = {
          allTime: {
            total: recruitersWithStats.reduce(
              (sum, r) => sum + r.stats.allTime.total,
              0
            ),
            surveys: recruitersWithStats.reduce(
              (sum, r) => sum + r.stats.allTime.surveys,
              0
            ),
            prospects: recruitersWithStats.reduce(
              (sum, r) => sum + r.stats.allTime.prospects,
              0
            ),
            leads: recruitersWithStats.reduce(
              (sum, r) => sum + r.stats.allTime.leads,
              0
            ),
          },
          monthly: {
            total: recruitersWithStats.reduce(
              (sum, r) => sum + r.stats.monthly.total,
              0
            ),
            surveys: recruitersWithStats.reduce(
              (sum, r) => sum + r.stats.monthly.surveys,
              0
            ),
            prospects: recruitersWithStats.reduce(
              (sum, r) => sum + r.stats.monthly.prospects,
              0
            ),
            leads: recruitersWithStats.reduce(
              (sum, r) => sum + r.stats.monthly.leads,
              0
            ),
          },
        };

        res.json({
          recruiters: recruitersWithStats,
          stationTotals,
        });
      } catch (error) {
        console.error("Error fetching station recruiter stats:", error);
        res.status(500).json({ error: "Failed to fetch recruiter stats" });
      }
    }
  );

  // Get leads for a specific recruiter (station commander only)
  app.get(
    "/api/station-commander/recruiter/:recruiterId/leads",
    requireStationCommander,
    async (req, res) => {
      try {
        const { recruiterId } = req.params;
        const stationId = req.user.stationId;

        // Verify the recruiter belongs to the station commander's station
        const [recruiter] = await db
          .select()
          .from(users)
          .where(eq(users.id, recruiterId));

        if (!recruiter) {
          return res.status(404).json({ error: "Recruiter not found" });
        }

        // Check if station commander has permission to view this recruiter's data
        if (req.user.role !== "admin") {
          if (
            stationId &&
            recruiter.stationId !== stationId &&
            recruiter.id !== req.user.id
          ) {
            return res.status(403).json({ error: "Permission denied" });
          }
        }

        const leads = await storage.getRecruitsByRecruiter(recruiterId);

        res.json({ leads });
      } catch (error) {
        console.error("Error fetching recruiter leads:", error);
        res.status(500).json({ error: "Failed to fetch leads" });
      }
    }
  );

  // Get surveys for a specific recruiter (station commander only)
  app.get(
    "/api/station-commander/recruiter/:recruiterId/surveys",
    requireStationCommander,
    async (req, res) => {
      try {
        const { recruiterId } = req.params;
        const stationId = req.user.stationId;

        // Verify the recruiter belongs to the station commander's station
        const [recruiter] = await db
          .select()
          .from(users)
          .where(eq(users.id, recruiterId));

        if (!recruiter) {
          return res.status(404).json({ error: "Recruiter not found" });
        }

        // Check if station commander has permission to view this recruiter's data
        if (req.user.role !== "admin") {
          if (
            stationId &&
            recruiter.stationId !== stationId &&
            recruiter.id !== req.user.id
          ) {
            return res.status(403).json({ error: "Permission denied" });
          }
        }

        const surveys = await db
          .select()
          .from(qrSurveyResponses)
          .where(eq(qrSurveyResponses.recruiterId, recruiterId))
          .orderBy(desc(qrSurveyResponses.createdAt));

        res.json({ surveys });
      } catch (error) {
        console.error("Error fetching recruiter surveys:", error);
        res.status(500).json({ error: "Failed to fetch surveys" });
      }
    }
  );

  // Get detailed recruit data for export (station commander only)
  app.get(
    "/api/station-commander/recruits/export",
    requireStationCommander,
    async (req, res) => {
      try {
        const stationId = req.user.stationId;

        // Get all recruiters at this station INCLUDING the station commander themselves
        let recruitersAtStation;
        if (req.user.role === "admin") {
          // Admin sees all recruiters AND station commanders AND admins (they recruit too!)
          recruitersAtStation = await db
            .select()
            .from(users)
            .where(
              sql`${users.role} IN ('recruiter', 'station_commander', 'admin')`
            );
        } else if (stationId) {
          // Station commander sees their station + themselves
          recruitersAtStation = await db
            .select()
            .from(users)
            .where(
              sql`${users.stationId} = ${stationId} OR ${users.id} = ${req.user.id}`
            );
        } else {
          // Station commander without station sees themselves + recruiters without station
          recruitersAtStation = await db
            .select()
            .from(users)
            .where(
              sql`${users.role} IN ('recruiter', 'station_commander') AND (${users.stationId} IS NULL OR ${users.id} = ${req.user.id})`
            );
        }

        const recruiterIds = recruitersAtStation.map((r) => r.id);

        // Get all recruits for these recruiters
        const allRecruits = await Promise.all(
          recruiterIds.map((id) => storage.getRecruitsByRecruiter(id))
        );

        const flatRecruits = allRecruits.flat();

        // Get scan locations for all recruits
        const recruitIds = flatRecruits.map((r) => r.id);
        const scansWithLocations =
          recruitIds.length > 0
            ? await db
                .select({
                  applicationId: qrScans.applicationId,
                  locationLabel: qrCodeLocations.locationLabel,
                })
                .from(qrScans)
                .leftJoin(
                  qrCodeLocations,
                  eq(qrScans.locationQrCodeId, qrCodeLocations.id)
                )
                .where(inArray(qrScans.applicationId, recruitIds))
            : [];

        const scanLocationMap = new Map<string, string>();
        scansWithLocations.forEach((scan) => {
          if (scan.applicationId) {
            scanLocationMap.set(
              scan.applicationId,
              scan.locationLabel || "Default QR"
            );
          }
        });

        // Add recruiter name and scan location to each recruit
        const recruitsWithRecruiterName = flatRecruits.map((recruit) => {
          const recruiter = recruitersAtStation.find(
            (r) => r.id === recruit.recruiterId
          );
          const scanLocation =
            scanLocationMap.get(recruit.id) ||
            (recruit.source === "qr_code" ? "Default QR" : "Direct Entry");
          return {
            ...recruit,
            recruiterName: recruiter?.fullName || "Unknown",
            recruiterRank: recruiter?.rank || "",
            scanLocation: scanLocation,
          };
        });

        res.json({ recruits: recruitsWithRecruiterName });
      } catch (error) {
        console.error("Error fetching recruits for export:", error);
        res.status(500).json({ error: "Failed to fetch recruits" });
      }
    }
  );

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
      console.error("❌ Failed to generate QR code:", error);
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

  // Create a location-based QR code
  app.post("/api/qr-codes/location", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { locationLabel, qrType = "application" } = req.body;

      if (!locationLabel || locationLabel.trim().length === 0) {
        return res.status(400).json({ error: "Location label is required" });
      }

      if (!["application", "survey"].includes(qrType)) {
        return res
          .status(400)
          .json({ error: "QR type must be 'application' or 'survey'" });
      }

      // Generate unique QR code identifier
      const { generateQRCode } = await import("./auth");
      const qrCodeId = generateQRCode();

      // Create location-based QR code
      const [locationQR] = await db
        .insert(qrCodeLocations)
        .values({
          recruiterId: userId,
          locationLabel: locationLabel.trim(),
          qrCode: qrCodeId,
          qrType: qrType,
        })
        .returning();

      // Generate QR code image
      const qrCodeImage =
        qrType === "application"
          ? await generateQRCodeImage(qrCodeId)
          : await generateSurveyQRCodeImage(qrCodeId);

      res.json({
        id: locationQR.id,
        locationLabel: locationQR.locationLabel,
        qrCode: qrCodeId,
        qrType: locationQR.qrType,
        qrCodeImage: qrCodeImage,
        createdAt: locationQR.createdAt,
      });
    } catch (error) {
      console.error("❌ Failed to create location QR code:", error);
      res.status(500).json({ error: "Failed to create location QR code" });
    }
  });

  // Get all location-based QR codes for the current user
  app.get("/api/qr-codes/location", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const locationQRs = await db
        .select()
        .from(qrCodeLocations)
        .where(eq(qrCodeLocations.recruiterId, userId))
        .orderBy(sql`${qrCodeLocations.createdAt} DESC`);

      res.json(locationQRs);
    } catch (error) {
      console.error("❌ Failed to fetch location QR codes:", error);
      res.status(500).json({ error: "Failed to fetch location QR codes" });
    }
  });

  // Get a specific location-based QR code image
  app.get("/api/qr-codes/location/:id/image", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [locationQR] = await db
        .select()
        .from(qrCodeLocations)
        .where(eq(qrCodeLocations.id, id));

      if (!locationQR) {
        return res.status(404).json({ error: "Location QR code not found" });
      }

      if (locationQR.recruiterId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Generate QR code image
      const qrCodeImage =
        locationQR.qrType === "application"
          ? await generateQRCodeImage(locationQR.qrCode)
          : await generateSurveyQRCodeImage(locationQR.qrCode);

      res.json({ qrCode: qrCodeImage });
    } catch (error) {
      console.error("❌ Failed to generate location QR code image:", error);
      res.status(500).json({ error: "Failed to generate QR code image" });
    }
  });

  // Delete a location-based QR code
  app.delete("/api/qr-codes/location/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [locationQR] = await db
        .select()
        .from(qrCodeLocations)
        .where(eq(qrCodeLocations.id, id));

      if (!locationQR) {
        return res.status(404).json({ error: "Location QR code not found" });
      }

      if (locationQR.recruiterId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await db.delete(qrCodeLocations).where(eq(qrCodeLocations.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("❌ Failed to delete location QR code:", error);
      res.status(500).json({ error: "Failed to delete location QR code" });
    }
  });

  // Get QR scan analytics with location breakdown
  app.get("/api/qr-scans/analytics", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get user to check their role
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get all scans for this user (or station if station commander/admin)
      let allScans;
      if (user.role === "admin") {
        allScans = await db.select().from(qrScans);
      } else if (user.role === "station_commander" && user.stationId) {
        const stationRecruiters = await db
          .select()
          .from(users)
          .where(eq(users.stationId, user.stationId));
        const recruiterIds = stationRecruiters.map((r) => r.id);
        allScans =
          recruiterIds.length > 0
            ? await db
                .select()
                .from(qrScans)
                .where(inArray(qrScans.recruiterId, recruiterIds))
            : [];
      } else {
        allScans = await db
          .select()
          .from(qrScans)
          .where(eq(qrScans.recruiterId, userId));
      }

      // Get location QR codes for labeling
      const locationQRs = await db.select().from(qrCodeLocations);
      const locationQRMap = new Map(
        locationQRs.map((qr) => [qr.id, qr.locationLabel])
      );

      // Group scans by location
      const scansByLocation: Record<
        string,
        {
          locationLabel: string;
          totalScans: number;
          convertedScans: number;
          conversionRate: number;
          scans: Array<{
            id: string;
            scanType: string;
            scannedAt: Date;
            converted: boolean;
            conversionType: string | null;
            ipAddress: string | null;
          }>;
        }
      > = {};

      // Add default QR category
      scansByLocation["default"] = {
        locationLabel: "Default QR",
        totalScans: 0,
        convertedScans: 0,
        conversionRate: 0,
        scans: [],
      };

      allScans.forEach((scan) => {
        const locationKey = scan.locationQrCodeId || "default";
        const locationLabel = scan.locationQrCodeId
          ? locationQRMap.get(scan.locationQrCodeId) || "Unknown Location"
          : "Default QR";

        if (!scansByLocation[locationKey]) {
          scansByLocation[locationKey] = {
            locationLabel,
            totalScans: 0,
            convertedScans: 0,
            conversionRate: 0,
            scans: [],
          };
        }

        scansByLocation[locationKey].totalScans++;
        const converted =
          scan.scanType === "survey"
            ? scan.convertedToSurvey || false
            : scan.convertedToApplication || false;

        if (converted) {
          scansByLocation[locationKey].convertedScans++;
        }

        scansByLocation[locationKey].scans.push({
          id: scan.id,
          scanType: scan.scanType,
          scannedAt: scan.scannedAt,
          converted,
          conversionType: converted
            ? scan.scanType === "survey"
              ? "survey"
              : "application"
            : null,
          ipAddress: scan.ipAddress,
        });
      });

      // Calculate conversion rates
      Object.values(scansByLocation).forEach((location) => {
        if (location.totalScans > 0) {
          location.conversionRate = Math.round(
            (location.convertedScans / location.totalScans) * 100
          );
        }
      });

      // Sort by total scans (descending)
      const locations = Object.values(scansByLocation).sort(
        (a, b) => b.totalScans - a.totalScans
      );

      res.json({
        locations,
        totalScans: allScans.length,
        totalConverted: allScans.filter((s) =>
          s.scanType === "survey"
            ? s.convertedToSurvey
            : s.convertedToApplication
        ).length,
        overallConversionRate:
          allScans.length > 0
            ? Math.round(
                (allScans.filter((s) =>
                  s.scanType === "survey"
                    ? s.convertedToSurvey
                    : s.convertedToApplication
                ).length /
                  allScans.length) *
                  100
              )
            : 0,
      });
    } catch (error) {
      console.error("❌ Failed to get QR scan analytics:", error);
      res.status(500).json({ error: "Failed to fetch QR scan analytics" });
    }
  });

  // Update recruiter profile
  app.put("/api/profile", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get current user to check role
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { fullName, rank, unit, phoneNumber, profilePicture, stationId } =
        req.body;

      // Build update object
      const updateData: any = {
        fullName: fullName || undefined,
        rank: rank || null,
        unit: unit || null,
        phoneNumber: phoneNumber || null,
        profilePicture: profilePicture || null,
        updatedAt: new Date(),
      };

      // Only admins can directly change their station
      if (stationId !== undefined) {
        if (currentUser.role === "admin") {
          updateData.stationId = stationId;
          console.log(
            `👑 Admin ${currentUser.email} changing station to ${stationId}`
          );
        } else {
          return res.status(403).json({
            error:
              "Only administrators can directly change their station. Please submit a station change request.",
          });
        }
      }

      // Update user profile
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      console.log(`✅ Updated profile for user ${userId}`);

      // Get station info if stationId exists
      let stationInfo = null;
      if (updatedUser.stationId) {
        const [station] = await db
          .select()
          .from(stations)
          .where(eq(stations.id, updatedUser.stationId));
        if (station) {
          stationInfo = {
            stationId: station.id,
            stationCode: station.stationCode,
            stationName: station.name,
            stationCity: station.city,
            stationState: station.state,
          };
        }
      }

      // Return user data without sensitive fields
      const {
        passwordHash,
        verificationToken,
        resetPasswordToken,
        ...userData
      } = updatedUser;
      res.json({ user: { ...userData, ...stationInfo } });
    } catch (error) {
      console.error("❌ Failed to update profile:", error);
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
      console.error("❌ Failed to get zip code:", error);
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
      const cleanZip = zipCode.replace(/\D/g, "");
      if (cleanZip.length !== 5) {
        return res
          .status(400)
          .json({ error: "Invalid zip code format. Must be 5 digits." });
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
      console.error("❌ Failed to update zip code:", error);
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

      // Get user to check their role
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Use optimized aggregation for stats instead of loading all recruits
      let stats;
      let recruiterRecruits: any[] = [];

      if (user.role === "admin") {
        // For admin, we still need to load recent recruits for display
        // But use aggregation for stats if possible
        recruiterRecruits = await storage.getAllRecruits();
        // Calculate stats from loaded data (admin sees all, so aggregation would be complex)
        const totalRecruits = recruiterRecruits.length;
        const applicationsFromQR = recruiterRecruits.filter(
          (r) => r.source === "qr_code"
        ).length;
        const directEntries = recruiterRecruits.filter(
          (r) => r.source === "direct"
        ).length;

        // Get QR scan tracking data
        const allQrScans = await db.select().from(qrScans);
        const totalQrScans = allQrScans.length;
        const totalSurveyScans = allQrScans.filter(
          (s) => s.scanType === "survey"
        ).length;
        const applicationScanConversions = allQrScans.filter(
          (s) => s.scanType === "application" && s.convertedToApplication
        ).length;
        const surveyScanConversions = allQrScans.filter(
          (s) => s.scanType === "survey" && s.convertedToSurvey
        ).length;
        const totalConvertedScans = applicationScanConversions + surveyScanConversions;
        const qrConversionRate =
          totalQrScans > 0
            ? Math.round((totalConvertedScans / totalQrScans) * 100)
            : 0;

        stats = {
          totalRecruits,
          qrCodeScans: applicationsFromQR,
          directEntries,
          qrScanTracking: {
            totalScans: totalQrScans,
            totalSurveyScans,
            applicationsFromScans: applicationScanConversions,
            surveysFromScans: surveyScanConversions,
            totalConverted: totalConvertedScans,
            conversionRate: qrConversionRate,
          },
        };
      } else if (user.role === "station_commander" && user.stationId) {
        // Station commander: aggregate stats for all recruiters at station
        const stationRecruiters = await db
          .select()
          .from(users)
          .where(eq(users.stationId, user.stationId));

        const recruiterIds = stationRecruiters.map((r) => r.id);
        
        // Get aggregated stats for all recruiters in parallel
        const allStats = await Promise.all(
          recruiterIds.map((id) => storage.getRecruiterStatsAggregated(id))
        );

        // Sum up all stats
        const aggregated = allStats.reduce(
          (acc, s) => ({
            totalRecruits: acc.totalRecruits + s.allTime.total,
            qrCodeScans: acc.qrCodeScans + s.allTime.qrCodeScans,
            directEntries: acc.directEntries + s.allTime.directEntries,
            totalQrScans: acc.totalQrScans + s.qrScanTracking.totalScans,
            totalSurveyScans: acc.totalSurveyScans + s.qrScanTracking.totalSurveyScans,
            applicationsFromScans: acc.applicationsFromScans + s.qrScanTracking.applicationsFromScans,
            surveysFromScans: acc.surveysFromScans + s.qrScanTracking.surveysFromScans,
            totalConverted: acc.totalConverted + s.qrScanTracking.totalConverted,
          }),
          {
            totalRecruits: 0,
            qrCodeScans: 0,
            directEntries: 0,
            totalQrScans: 0,
            totalSurveyScans: 0,
            applicationsFromScans: 0,
            surveysFromScans: 0,
            totalConverted: 0,
          }
        );

        const qrConversionRate =
          aggregated.totalQrScans > 0
            ? Math.round((aggregated.totalConverted / aggregated.totalQrScans) * 100)
            : 0;

        stats = {
          totalRecruits: aggregated.totalRecruits,
          qrCodeScans: aggregated.qrCodeScans,
          directEntries: aggregated.directEntries,
          qrScanTracking: {
            totalScans: aggregated.totalQrScans,
            totalSurveyScans: aggregated.totalSurveyScans,
            applicationsFromScans: aggregated.applicationsFromScans,
            surveysFromScans: aggregated.surveysFromScans,
            totalConverted: aggregated.totalConverted,
            conversionRate: qrConversionRate,
          },
        };

        // Still load recent recruits for display
        const allRecruits = await Promise.all(
          recruiterIds.map((id) => storage.getRecruitsByRecruiter(id))
        );
        recruiterRecruits = allRecruits.flat();
      } else {
        // Regular recruiter - use optimized aggregation
        stats = await storage.getRecruiterStatsAggregated(userId);
        const statsForResponse = {
          totalRecruits: stats.allTime.total,
          qrCodeScans: stats.allTime.qrCodeScans,
          directEntries: stats.allTime.directEntries,
          qrScanTracking: stats.qrScanTracking,
        };
        stats = statsForResponse;
        
        // Load recent recruits for display
        recruiterRecruits = await storage.getRecruitsByRecruiter(userId);
      }

      console.log(
        `📊 Stats request for userId: ${userId} (role: ${user.role})`
      );
      console.log(`📊 Recruits accessible: ${recruiterRecruits.length}`);

      // Get recent recruits (already sorted by database query, just take first 10)
      const recentRecruits = recruiterRecruits.slice(0, 10);

      res.json({
        ...stats,
        recentRecruits,
      });
    } catch (error) {
      console.error("❌ Failed to get recruiter stats:", error);
      res.status(500).json({ error: "Failed to fetch recruiter stats" });
    }
  });

  // RECRUITS ENDPOINTS (with recruiter filtering)
  // Get all recruits for the logged-in user only
  app.get("/api/recruits", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get user to check their role
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Regular recruiters and pending station commanders see only their own recruits
      // Station commanders and admins see all recruits at their station
      let userRecruits;
      let includeRecruiterInfo = false;

      if (user.role === "admin") {
        // Admin sees all recruits
        userRecruits = await storage.getAllRecruits();
        includeRecruiterInfo = true;
      } else if (user.role === "station_commander" && user.stationId) {
        // Station commander sees recruits from all recruiters at their station
        const stationRecruiters = await db
          .select()
          .from(users)
          .where(eq(users.stationId, user.stationId));

        const recruiterIds = stationRecruiters.map((r) => r.id);
        const allRecruits = await Promise.all(
          recruiterIds.map((id) => storage.getRecruitsByRecruiter(id))
        );
        userRecruits = allRecruits.flat();
        includeRecruiterInfo = true;
      } else {
        // Regular recruiter or pending station commander - see only their own recruits
        userRecruits = await storage.getRecruitsByRecruiter(userId);
        includeRecruiterInfo = false;
      }

      // If station commander or admin, add recruiter information to each recruit
      if (includeRecruiterInfo && userRecruits.length > 0) {
        const recruiterIds = [
          ...new Set(userRecruits.map((r) => r.recruiterId).filter(Boolean)),
        ];
        const recruitersMap = new Map();

        if (recruiterIds.length > 0) {
          const recruitersList = await db
            .select({
              id: users.id,
              fullName: users.fullName,
              rank: users.rank,
            })
            .from(users)
            .where(inArray(users.id, recruiterIds));

          recruitersList.forEach((recruiter) => {
            recruitersMap.set(recruiter.id, recruiter);
          });
        }

        const recruitsWithRecruiter = userRecruits.map((recruit) => ({
          ...recruit,
          recruiterName: recruit.recruiterId
            ? recruitersMap.get(recruit.recruiterId)?.fullName || "Unknown"
            : null,
          recruiterRank: recruit.recruiterId
            ? recruitersMap.get(recruit.recruiterId)?.rank || null
            : null,
        }));

        res.json(recruitsWithRecruiter);
      } else {
        res.json(userRecruits);
      }
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch recruits",
      });
    }
  });

  // Get single recruit by ID (with authorization check)
  app.get("/api/recruits/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const recruit = await storage.getRecruit(req.params.id);

      if (!recruit) {
        return res.status(404).json({ message: "Recruit not found" });
      }

      // Get user to check their role
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify user has permission to view this recruit
      if (user.role === "admin") {
        // Admin can see all recruits
        res.json(recruit);
      } else if (user.role === "station_commander" && user.stationId) {
        // Station commander can see recruits from their station
        const recruiter = await db
          .select()
          .from(users)
          .where(eq(users.id, recruit.recruiterId || ""));
        if (recruiter.length > 0 && recruiter[0].stationId === user.stationId) {
          res.json(recruit);
        } else {
          res
            .status(403)
            .json({ error: "You don't have permission to view this recruit" });
        }
      } else if (recruit.recruiterId === userId) {
        // Regular recruiter can only see their own recruits
        res.json(recruit);
      } else {
        res
          .status(403)
          .json({ error: "You don't have permission to view this recruit" });
      }
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch recruit",
      });
    }
  });

  // Get recruiter by QR code (handles both default and location-based QR codes)
  app.get("/api/recruiter/by-qr/:qrCode", async (req, res) => {
    try {
      const { qrCode } = req.params;

      // First check if this is a location-based QR code
      const [locationQR] = await db
        .select()
        .from(qrCodeLocations)
        .where(eq(qrCodeLocations.qrCode, qrCode));

      let recruiter;
      if (locationQR) {
        // This is a location-based QR code
        recruiter = await db.query.users.findFirst({
          where: eq(users.id, locationQR.recruiterId),
        });
      } else {
        // This is the default user QR code
        [recruiter] = await db
          .select()
          .from(users)
          .where(eq(users.qrCode, qrCode));
      }

      if (!recruiter) {
        return res.status(404).json({ error: "Recruiter not found" });
      }

      // Return public recruiter info (no sensitive data)
      const {
        passwordHash,
        verificationToken,
        resetPasswordToken,
        qrCode: _qrCode,
        ...recruiterInfo
      } = recruiter;
      res.json({
        recruiter: recruiterInfo,
        locationLabel: locationQR?.locationLabel || null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recruiter information" });
    }
  });

  // Track QR code scan (when page is loaded, not when application is submitted)
  app.post("/api/qr-scan", async (req, res) => {
    try {
      const { qrCode, scanType = "application" } = req.body;

      if (!qrCode) {
        return res.status(400).json({ error: "QR code is required" });
      }

      // First check if this is a location-based QR code
      const [locationQR] = await db
        .select()
        .from(qrCodeLocations)
        .where(eq(qrCodeLocations.qrCode, qrCode));

      let recruiter;
      let locationQrCodeId = null;

      if (locationQR) {
        // This is a location-based QR code
        recruiter = await db.query.users.findFirst({
          where: eq(users.id, locationQR.recruiterId),
        });
        locationQrCodeId = locationQR.id;
        console.log(
          `📍 Location QR scan detected - Label: ${locationQR.locationLabel}, Type: ${locationQR.qrType}`
        );
      } else {
        // This is the default user QR code
        [recruiter] = await db
          .select()
          .from(users)
          .where(eq(users.qrCode, qrCode));
      }

      if (!recruiter) {
        // QR code not found - might be invalid or from a deleted account
        console.warn(`⚠️ QR scan attempted with unknown QR code: ${qrCode}`);
        return res
          .status(200)
          .json({ success: false, error: "QR code not found" });
      }

      // Capture request metadata
      const ipAddress =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        null;
      const userAgent = req.headers["user-agent"] || null;
      const referrer =
        req.headers["referer"] || req.headers["referrer"] || null;

      // Record the scan
      const [scan] = await db
        .insert(qrScans)
        .values({
          recruiterId: recruiter.id,
          qrCode: qrCode,
          locationQrCodeId: locationQrCodeId,
          scanType: scanType,
          ipAddress: ipAddress,
          userAgent: userAgent,
          referrer: referrer,
          convertedToApplication: false, // Will be updated if they submit
        })
        .returning();

      const scanLocation = locationQR
        ? ` at "${locationQR.locationLabel}"`
        : " (default QR)";
      console.log(
        `📱 QR Scan tracked - Recruiter: ${recruiter.fullName}, Type: ${scanType}${scanLocation}, Scan ID: ${scan.id}`
      );

      res.json({
        success: true,
        scanId: scan.id,
        locationLabel: locationQR?.locationLabel || null,
        message: "Scan tracked successfully",
      });
    } catch (error) {
      console.error("❌ Failed to track QR scan:", error);
      // Don't fail the page load if tracking fails
      res.status(200).json({ success: false, error: "Failed to track scan" });
    }
  });

  // Create new recruit application
  app.post("/api/recruits", async (req, res) => {
    try {
      const body = req.body;
      const userId = (req as any).session?.userId; // Logged in recruiter ID
      const recruiterCode = body.recruiterCode; // Extract recruiterCode from body first

      console.log(
        `📝 POST /api/recruits - Session userId: ${
          userId || "NULL"
        }, recruiterCode: ${recruiterCode || "NULL"}`
      );
      console.log(
        `📝 Session data:`,
        JSON.stringify((req as any).session || {})
      );

      // Determine source and recruiterId:
      // - If recruiterCode (QR code) is provided, it's from QR scan
      // - If user is logged in and no recruiterCode, it's direct entry from intake form
      // - Otherwise, it's a public submission without recruiter
      let recruiterId: string | undefined = undefined;
      let source = "direct";

      console.log(
        `🔍 Source determination - recruiterCode: ${
          recruiterCode || "NULL"
        }, userId: ${userId || "NULL"}`
      );

      if (recruiterCode && !userId) {
        // QR code scan (public form with recruiter code)
        console.log(
          `🔍 QR code scan detected (public form) - recruiterCode: ${recruiterCode}`
        );

        // Check if this is a location-based QR code
        const [locationQR] = await db
          .select()
          .from(qrCodeLocations)
          .where(eq(qrCodeLocations.qrCode, recruiterCode));

        let recruiter;
        if (locationQR) {
          // This is a location-based QR code
          recruiter = await db.query.users.findFirst({
            where: eq(users.id, locationQR.recruiterId),
          });
          console.log(
            `📍 Location QR code detected - Label: ${locationQR.locationLabel}`
          );
        } else {
          // This is the default user QR code
          [recruiter] = await db
            .select()
            .from(users)
            .where(eq(users.qrCode, recruiterCode));
        }

        if (recruiter) {
          recruiterId = recruiter.id;
          source = "qr_code";
          console.log(
            `✅ QR code recruiter found - recruiterId: ${recruiterId}, source set to: qr_code`
          );
        } else {
          console.log(
            `⚠️ QR code provided but recruiter not found - recruiterCode: ${recruiterCode}`
          );
        }
      } else if (userId && !recruiterCode) {
        // Logged in recruiter filling intake form directly
        console.log(
          `🔍 Direct entry detected (logged in recruiter, no QR code)`
        );
        recruiterId = userId;
        source = "direct";
      } else if (userId && recruiterCode) {
        // Logged in recruiter but also has code - use the code's recruiter
        console.log(
          `🔍 Both userId and recruiterCode provided - checking QR code`
        );
        const [recruiter] = await db
          .select()
          .from(users)
          .where(eq(users.qrCode, recruiterCode));
        if (recruiter) {
          recruiterId = recruiter.id;
          source = "qr_code";
          console.log(
            `✅ QR code recruiter found - recruiterId: ${recruiterId}, source set to: qr_code`
          );
        } else {
          recruiterId = userId;
          source = "direct";
          console.log(
            `⚠️ QR code not found, using logged-in userId, source: direct`
          );
        }
      } else {
        console.log(
          `⚠️ No recruiterCode and no userId - public submission without recruiter, source: direct`
        );
      }

      console.log(
        `📊 Final source determination - recruiterId: ${
          recruiterId || "NULL"
        }, source: ${source}`
      );

      // Remove recruiterCode from body and use recruiterId
      const { recruiterCode: _, ...recruitData } = body;

      console.log(
        `📝 Creating recruit - recruiterId: ${
          recruiterId || "NULL"
        }, source: ${source}, userId from session: ${userId || "NULL"}`
      );

      // Ensure source is explicitly set
      const recruitToCreate = {
        ...recruitData,
        recruiterId: recruiterId || null, // Use null instead of undefined for database
        source: source || "direct", // Explicitly ensure source is set
      };

      console.log(
        `📝 Recruit data before validation - source: ${recruitToCreate.source}, recruiterId: ${recruitToCreate.recruiterId}`
      );

      const validatedData = insertRecruitSchema.parse(recruitToCreate);

      // Double-check source is still set after validation
      if (!validatedData.source) {
        validatedData.source = source || "direct";
        console.log(
          `⚠️ Source was missing after validation, setting to: ${validatedData.source}`
        );
      }

      console.log(
        `📝 Validated data - source: ${validatedData.source}, recruiterId: ${validatedData.recruiterId}`
      );

      const recruit = await storage.createRecruit(validatedData);

      console.log(
        `✅ Created recruit: id=${recruit.id}, recruiterId=${
          recruit.recruiterId || "NULL"
        } (type: ${typeof recruit.recruiterId}), source=${
          recruit.source || "MISSING"
        }`
      );

      // If this recruit came from a QR code scan, update the scan record to mark it as converted
      if (source === "qr_code" && recruiterCode) {
        try {
          const [latestScan] = await db
            .select()
            .from(qrScans)
            .where(
              and(
                eq(qrScans.qrCode, recruiterCode),
                eq(qrScans.scanType, "application"),
                eq(qrScans.convertedToApplication, false)
              )
            )
            .orderBy(desc(qrScans.scannedAt))
            .limit(1);

          if (latestScan) {
            await db
              .update(qrScans)
              .set({
                convertedToApplication: true,
                applicationId: recruit.id,
              })
              .where(eq(qrScans.id, latestScan.id));
            console.log(
              `✅ Updated QR scan record for QR code: ${recruiterCode} (scan ID: ${latestScan.id})`
            );
          } else {
            console.warn(
              `⚠️ No matching QR scan found to update for code: ${recruiterCode}`
            );
          }
        } catch (scanUpdateError) {
          console.error(
            "⚠️ Failed to update QR scan record (non-critical):",
            scanUpdateError
          );
          // Don't fail the recruit creation if scan update fails
        }
      }

      // Send confirmation email to applicant
      try {
        await sendApplicantConfirmationEmail(
          recruit.email,
          recruit.firstName,
          recruit.lastName,
          recruiterId
        );
      } catch (emailError) {
        console.error(
          "⚠️ Failed to send applicant confirmation email:",
          emailError
        );
        // Don't fail the request if email fails
      }

      // Send notification to recruiter if this application is assigned to them
      if (recruiterId) {
        try {
          const [recruiter] = await db
            .select()
            .from(users)
            .where(eq(users.id, recruiterId));
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
          console.error(
            "⚠️ Failed to send recruiter application notification:",
            emailError
          );
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

      // Check if this is a location-based QR code
      const [locationQR] = await db
        .select()
        .from(qrCodeLocations)
        .where(eq(qrCodeLocations.qrCode, recruiterCode));

      let recruiter;
      if (locationQR) {
        // This is a location-based QR code
        recruiter = await db.query.users.findFirst({
          where: eq(users.id, locationQR.recruiterId),
        });
        console.log(
          `📍 Location QR code detected for survey - Label: ${locationQR.locationLabel}`
        );
      } else {
        // This is the default user QR code
        [recruiter] = await db
          .select()
          .from(users)
          .where(eq(users.qrCode, recruiterCode));
      }

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

      // Update the QR scan record to mark as converted for surveys
      try {
        const [latestSurveyScan] = await db
          .select()
          .from(qrScans)
          .where(
            and(
              eq(qrScans.qrCode, recruiterCode),
              eq(qrScans.scanType, "survey"),
              eq(qrScans.convertedToSurvey, false)
            )
          )
          .orderBy(desc(qrScans.scannedAt))
          .limit(1);

        if (latestSurveyScan) {
          await db
            .update(qrScans)
            .set({
              convertedToSurvey: true,
              surveyResponseId: created.id,
            })
            .where(eq(qrScans.id, latestSurveyScan.id));
          console.log(
            `✅ Updated survey scan record for QR code: ${recruiterCode} (scan ID: ${latestSurveyScan.id})`
          );
        } else {
          console.warn(
            `⚠️ No matching survey QR scan found to update for code: ${recruiterCode}`
          );
        }
      } catch (scanUpdateError) {
        console.error(
          "⚠️ Failed to update survey QR scan record (non-critical):",
          scanUpdateError
        );
      }

      // Send confirmation email to the person who submitted feedback
      try {
        await sendSurveyConfirmationEmail(
          created.email,
          created.name,
          created.rating,
          recruiter.id
        );
      } catch (emailError) {
        console.error(
          "⚠️ Failed to send survey confirmation email:",
          emailError
        );
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
        console.error(
          "⚠️ Failed to send recruiter survey notification:",
          emailError
        );
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

      // Get user to check their role and station
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let responses;
      let includeRecruiterInfo = false;

      if (user.role === "admin") {
        // Admin sees all survey responses
        responses = await db
          .select()
          .from(qrSurveyResponses)
          .orderBy(sql`${qrSurveyResponses.createdAt} DESC`);
        includeRecruiterInfo = true;
      } else if (user.role === "station_commander" && user.stationId) {
        // Station commander sees responses from all recruiters at their station
        const stationRecruiters = await db
          .select()
          .from(users)
          .where(eq(users.stationId, user.stationId));

        const recruiterIds = stationRecruiters.map((r) => r.id);
        responses = await db
          .select()
          .from(qrSurveyResponses)
          .where(
            sql`${qrSurveyResponses.recruiterId} IN (${sql.join(
              recruiterIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
          .orderBy(sql`${qrSurveyResponses.createdAt} DESC`);
        includeRecruiterInfo = true;
      } else {
        // Regular recruiter sees only their own responses
        responses = await db
          .select()
          .from(qrSurveyResponses)
          .where(eq(qrSurveyResponses.recruiterId, userId))
          .orderBy(sql`${qrSurveyResponses.createdAt} DESC`);
        includeRecruiterInfo = false;
      }

      // If station commander or admin, add recruiter information to each response
      if (includeRecruiterInfo && responses.length > 0) {
        const recruiterIds = [
          ...new Set(responses.map((r) => r.recruiterId).filter(Boolean)),
        ];
        const recruitersMap = new Map();

        if (recruiterIds.length > 0) {
          const recruitersList = await db
            .select({
              id: users.id,
              fullName: users.fullName,
              rank: users.rank,
            })
            .from(users)
            .where(inArray(users.id, recruiterIds));

          recruitersList.forEach((recruiter) => {
            recruitersMap.set(recruiter.id, recruiter);
          });
        }

        const responsesWithRecruiter = responses.map((response) => ({
          ...response,
          recruiterName: response.recruiterId
            ? recruitersMap.get(response.recruiterId)?.fullName || "Unknown"
            : null,
          recruiterRank: response.recruiterId
            ? recruitersMap.get(response.recruiterId)?.rank || null
            : null,
        }));

        const total = responsesWithRecruiter.length;
        const averageRating =
          total > 0
            ? responsesWithRecruiter.reduce(
                (sum, r) => sum + (r.rating || 0),
                0
              ) / total
            : 0;

        res.json({
          total,
          averageRating,
          responses: responsesWithRecruiter,
        });
      } else {
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
      }
    } catch (error) {
      console.error("❌ Failed to fetch survey responses:", error);
      res.status(500).json({ error: "Failed to fetch survey responses" });
    }
  });

  // Update recruit notes
  app.patch("/api/recruits/:id/notes", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { additionalNotes } = req.body;

      // Get the recruit
      const [recruit] = await db
        .select()
        .from(recruits)
        .where(eq(recruits.id, req.params.id));

      if (!recruit) {
        return res.status(404).json({ error: "Recruit not found" });
      }

      // Get user to check their role and station
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Authorization check:
      // 1. User owns the recruit, OR
      // 2. User is station commander/admin at the same station as the recruit's owner
      // 3. Admin can edit any recruit
      const isOwner = recruit.recruiterId === userId;
      let isAuthorized = isOwner;

      console.log('📝 Notes authorization check:', {
        userId,
        recruitId: recruit.id,
        recruiterId: recruit.recruiterId,
        isOwner,
        userRole: user.role,
        userStationId: user.stationId
      });

      // Admins can edit any recruit
      if (user.role === 'admin') {
        isAuthorized = true;
        console.log('✅ Admin access granted');
      } else if (!isOwner && user.role === 'station_commander') {
        // Station commanders can edit recruits from their station
        if (!recruit.recruiterId) {
          console.log('⚠️ Recruit has no recruiterId');
          isAuthorized = false;
        } else {
          const [recruitOwner] = await db
            .select()
            .from(users)
            .where(eq(users.id, recruit.recruiterId));

          console.log('👤 Recruit owner:', {
            ownerId: recruitOwner?.id,
            ownerStationId: recruitOwner?.stationId,
            match: recruitOwner?.stationId === user.stationId
          });

          if (recruitOwner && user.stationId && recruitOwner.stationId === user.stationId) {
            isAuthorized = true;
            console.log('✅ Station commander access granted');
          }
        }
      }

      if (!isAuthorized) {
        console.log('❌ Authorization failed');
        return res.status(403).json({ error: "Not authorized to update this recruit" });
      }

      // Get existing notes history
      let notesHistory: Array<{
        note: string;
        author: string;
        authorName: string;
        timestamp: string;
      }> = [];

      try {
        if (recruit.additionalNotes) {
          // Try to parse as JSON array (new format)
          notesHistory = JSON.parse(recruit.additionalNotes);
        }
      } catch (e) {
        // If it's not JSON, it's old format - convert it
        if (recruit.additionalNotes && recruit.additionalNotes.trim()) {
          notesHistory = [{
            note: recruit.additionalNotes,
            author: recruit.recruiterId,
            authorName: "Unknown",
            timestamp: new Date().toISOString()
          }];
        }
      }

      // Add new note to history
      if (additionalNotes && additionalNotes.trim()) {
        notesHistory.push({
          note: additionalNotes.trim(),
          author: userId,
          authorName: user.fullName,
          timestamp: new Date().toISOString()
        });
      }

      // Save as JSON
      const notesJson = JSON.stringify(notesHistory);

      // Update notes
      await db
        .update(recruits)
        .set({
          additionalNotes: notesJson,
        })
        .where(eq(recruits.id, req.params.id));

      console.log('✅ Notes updated successfully');
      res.json({ success: true, message: "Notes updated successfully" });
    } catch (error) {
      console.error("❌ Failed to update recruit notes:", error);
      res.status(500).json({ error: "Failed to update recruit notes" });
    }
  });

  // Update recruit status
  app.patch("/api/recruits/:id/status", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { status } = req.body;

      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = [
        "pending",
        "contacted",
        "qualified",
        "disqualified",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid status. Must be one of: pending, contacted, qualified, disqualified",
        });
      }

      // Get the recruit first to check ownership
      const existingRecruit = await storage.getRecruit(req.params.id);

      if (!existingRecruit) {
        return res.status(404).json({ message: "Recruit not found" });
      }

      // Get user to check their role
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify user has permission to update this recruit
      let hasPermission = false;

      if (user.role === "admin") {
        hasPermission = true;
      } else if (user.role === "station_commander" && user.stationId) {
        // Station commander can update recruits from their station
        const recruiter = await db
          .select()
          .from(users)
          .where(eq(users.id, existingRecruit.recruiterId || ""));
        if (recruiter.length > 0 && recruiter[0].stationId === user.stationId) {
          hasPermission = true;
        }
      } else if (existingRecruit.recruiterId === userId) {
        // Regular recruiter can only update their own recruits
        hasPermission = true;
      }

      if (!hasPermission) {
        return res
          .status(403)
          .json({ error: "You don't have permission to update this recruit" });
      }

      const recruit = await storage.updateRecruitStatus(req.params.id, status);

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
  app.get("/api/recruits/export/csv", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get user to check their role
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get recruits based on user role (same logic as /api/recruits)
      let recruits;

      if (user.role === "admin") {
        recruits = await storage.getAllRecruits();
      } else if (user.role === "station_commander" && user.stationId) {
        const stationRecruiters = await db
          .select()
          .from(users)
          .where(eq(users.stationId, user.stationId));

        const recruiterIds = stationRecruiters.map((r) => r.id);
        const allRecruits = await Promise.all(
          recruiterIds.map((id) => storage.getRecruitsByRecruiter(id))
        );
        recruits = allRecruits.flat();
      } else {
        recruits = await storage.getRecruitsByRecruiter(userId);
      }

      // Get scan locations for all recruits
      const recruitIds = recruits.map((r) => r.id);
      const scansWithLocations =
        recruitIds.length > 0
          ? await db
              .select({
                applicationId: qrScans.applicationId,
                locationLabel: qrCodeLocations.locationLabel,
              })
              .from(qrScans)
              .leftJoin(
                qrCodeLocations,
                eq(qrScans.locationQrCodeId, qrCodeLocations.id)
              )
              .where(inArray(qrScans.applicationId, recruitIds))
          : [];

      const scanLocationMap = new Map<string, string>();
      scansWithLocations.forEach((scan) => {
        if (scan.applicationId) {
          scanLocationMap.set(
            scan.applicationId,
            scan.locationLabel || "Default QR"
          );
        }
      });

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
        "Source",
        "Scan Location",
        "Submitted Date",
      ];

      const rows = recruits.map((recruit) => {
        const scanLocation =
          scanLocationMap.get(recruit.id) ||
          (recruit.source === "qr_code" ? "Default QR" : "Direct Entry");
        return [
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
          recruit.source === "qr_code" ? "QR Code" : "Direct",
          scanLocation,
          new Date(recruit.submittedAt).toLocaleDateString(),
        ];
      });

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
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create location",
              });
            }
          }
        }

        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < locations.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
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
          message: `Could not find coordinates for zip code ${zipCode}. Please check the zip code and try again.`,
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
        message:
          error instanceof Error ? error.message : "Failed to geocode zip code",
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
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (user?.zipCode) {
          console.log(`📍 Using recruiter zip code: ${user.zipCode}`);
          const coords = await geocodeZipCode(user.zipCode);

          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
            console.log(`📍 Geocoded to: ${latitude}, ${longitude}`);
          } else {
            console.warn(
              `⚠️ Failed to geocode zip code ${user.zipCode}, using provided coordinates`
            );
            useZipCode = false; // Fall back to provided coordinates
          }
        } else {
          console.warn(
            `⚠️ User has no zip code set, using provided coordinates`
          );
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

      console.log(
        `🔍 Searching locations: ${latitude}, ${longitude}, radius: ${radiusMeters}m (${
          isCurrentLocation ? "current location" : "zip code"
        })`
      );

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
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId));
          targetZipCode = user?.zipCode;
        }

        // Also check if zip code was passed directly in the request
        if (req.body.zipCode) {
          targetZipCode = req.body.zipCode;
        }

        if (targetZipCode) {
          const beforeFilter = locations.length;
          locations = locations.filter((loc) => {
            // Check if location's zip code matches the target zip code
            return loc.zipCode === targetZipCode;
          });
          console.log(
            `📍 Filtered locations by zip code ${targetZipCode}: ${beforeFilter} → ${locations.length}`
          );
        }
      }

      res.json({
        count: locations.length,
        locations,
        message:
          locations.length > 0
            ? `Found ${locations.length} locations within ${
                radiusMeters / 1000
              }km`
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

  // Search for nearby events using Ticketmaster API
  app.post("/api/places/search-events", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      let { latitude, longitude, radius, useZipCode } = req.body;

      // If recruiter is logged in and useZipCode is true, use their zip code instead of provided coordinates
      if (userId && useZipCode === true) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (user?.zipCode) {
          console.log(
            `📍 Using recruiter zip code for events: ${user.zipCode}`
          );
          const coords = await geocodeZipCode(user.zipCode);

          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
            console.log(`📍 Geocoded to: ${latitude}, ${longitude}`);
          } else {
            console.warn(
              `⚠️ Failed to geocode zip code ${user.zipCode}, using provided coordinates`
            );
            useZipCode = false; // Fall back to provided coordinates
          }
        } else {
          console.warn(
            `⚠️ User has no zip code set, using provided coordinates`
          );
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

      console.log(
        `🔍 Searching events: ${latitude}, ${longitude}, radius: ${radiusMiles}mi (${
          isCurrentLocation ? "current location" : "zip code"
        })`
      );

      let events = await searchNearbyEvents(latitude, longitude, radiusMiles);

      // If using zip code, filter to only include events within that zip code
      // Check both the user's saved zip code and the zip code passed in the request
      if (useZipCode) {
        let targetZipCode: string | undefined;

        if (userId) {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId));
          targetZipCode = user?.zipCode;
        }

        // Also check if zip code was passed directly in the request
        if (req.body.zipCode) {
          targetZipCode = req.body.zipCode;
        }

        if (targetZipCode) {
          const beforeFilter = events.length;
          events = events.filter((evt) => {
            // Check if event's zip code matches the target zip code
            return evt.zipCode === targetZipCode;
          });
          console.log(
            `📍 Filtered events by zip code ${targetZipCode}: ${beforeFilter} → ${events.length}`
          );
        }
      }

      // Check if API key exists to provide better error message
      const hasApiKey = !!process.env.TICKETMASTER_API_KEY;

      res.json({
        count: events.length,
        events,
        message:
          events.length > 0
            ? `Found ${events.length} events within ${radiusMiles} miles`
            : hasApiKey
            ? `No events found within ${radiusMiles} miles. Try expanding your search radius or searching in a different location.`
            : "No Ticketmaster API key configured. Add TICKETMASTER_API_KEY to .env to discover events.",
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
      res
        .status(200)
        .json({ status: "ready", timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(503).json({
        status: "not ready",
        error: error instanceof Error ? error.message : "Database check failed",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
