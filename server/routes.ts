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

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Create new recruit application
  app.post("/api/recruits", async (req, res) => {
    try {
      const validatedData = insertRecruitSchema.parse(req.body);
      const recruit = await storage.createRecruit(validatedData);

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

  // Search for nearby locations using OpenStreetMap
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
        message: `Found ${locations.length} locations within ${
          radiusMeters / 1000
        }km`,
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

  // Search for nearby events using Eventbrite
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
            : "No Eventbrite API key configured. Add EVENTBRITE_API_KEY to .env to discover events.",
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

  const httpServer = createServer(app);

  return httpServer;
}
