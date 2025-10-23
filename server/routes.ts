import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecruitSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all recruits
  app.get("/api/recruits", async (_req, res) => {
    try {
      const recruits = await storage.getAllRecruits();
      res.json(recruits);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch recruits" 
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
        message: error instanceof Error ? error.message : "Failed to fetch recruit" 
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
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create recruit" 
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
          message: "Invalid status. Must be one of: pending, reviewing, approved, rejected" 
        });
      }

      const recruit = await storage.updateRecruitStatus(req.params.id, status);
      
      if (!recruit) {
        return res.status(404).json({ message: "Recruit not found" });
      }
      
      res.json(recruit);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update recruit status" 
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
        message: error instanceof Error ? error.message : "Failed to delete recruit" 
      });
    }
  });

  // Export recruits as CSV
  app.get("/api/recruits/export/csv", async (_req, res) => {
    try {
      const recruits = await storage.getAllRecruits();
      
      const headers = [
        "ID", "First Name", "Last Name", "Email", "Phone", "City", "State",
        "Education", "Prior Service", "Status", "Submitted Date"
      ];

      const rows = recruits.map(recruit => [
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
        new Date(recruit.submittedAt).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=army-recruits-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to export recruits" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
