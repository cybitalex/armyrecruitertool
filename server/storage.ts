import { type Recruit, type InsertRecruit } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getAllRecruits(): Promise<Recruit[]>;
  getRecruit(id: string): Promise<Recruit | undefined>;
  createRecruit(recruit: InsertRecruit): Promise<Recruit>;
  updateRecruitStatus(id: string, status: string): Promise<Recruit | undefined>;
  deleteRecruit(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private recruits: Map<string, Recruit>;

  constructor() {
    this.recruits = new Map();
  }

  async getAllRecruits(): Promise<Recruit[]> {
    return Array.from(this.recruits.values()).sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  async getRecruit(id: string): Promise<Recruit | undefined> {
    return this.recruits.get(id);
  }

  async createRecruit(insertRecruit: InsertRecruit): Promise<Recruit> {
    const id = randomUUID();
    const submittedAt = new Date().toISOString();
    const recruit: Recruit = { 
      ...insertRecruit,
      middleName: insertRecruit.middleName ?? null,
      priorServiceBranch: insertRecruit.priorServiceBranch ?? null,
      priorServiceYears: insertRecruit.priorServiceYears ?? null,
      medicalConditions: insertRecruit.medicalConditions ?? null,
      preferredMOS: insertRecruit.preferredMOS ?? null,
      additionalNotes: insertRecruit.additionalNotes ?? null,
      id,
      submittedAt,
      status: insertRecruit.status || "pending"
    };
    this.recruits.set(id, recruit);
    return recruit;
  }

  async updateRecruitStatus(id: string, status: string): Promise<Recruit | undefined> {
    const recruit = this.recruits.get(id);
    if (!recruit) return undefined;
    
    const updated: Recruit = { ...recruit, status };
    this.recruits.set(id, updated);
    return updated;
  }

  async deleteRecruit(id: string): Promise<boolean> {
    return this.recruits.delete(id);
  }
}

export const storage = new MemStorage();
