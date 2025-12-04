import type { User, Recruit, QrSurveyResponse } from "@shared/schema";

const API_BASE = "/api";

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // Important for session cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const auth = {
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    rank?: string;
    unit?: string;
    phoneNumber?: string;
    accountType?: string;
    justification?: string;
    stationCode?: string;
  }) => {
    return apiCall<{ message: string; userId: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login: async (email: string, password: string) => {
    return apiCall<{ message: string; user: Partial<User> }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    return apiCall<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },

  verifyEmail: async (token: string) => {
    return apiCall<{ message: string }>(`/auth/verify/${token}`);
  },

  getCurrentUser: async () => {
    try {
      return await apiCall<{ user: Partial<User> }>("/auth/me");
    } catch (error) {
      // 401 errors are expected when not logged in, suppress console noise
      if (error instanceof Error && error.message.includes("401")) {
        throw error; // Still throw to handle in auth context, just don't log
      }
      throw error;
    }
  },

  getQRCode: async () => {
    return apiCall<{ qrCode: string }>("/auth/qr-code");
  },

  getSurveyQRCode: async () => {
    return apiCall<{ qrCode: string }>("/auth/qr-code-survey");
  },

  forgotPassword: async (email: string) => {
    return apiCall<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string) => {
    return apiCall<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },
};

// Recruits API
export const recruits = {
  create: async (data: Partial<Recruit>) => {
    return apiCall<Recruit>("/recruits", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async () => {
    return apiCall<Recruit[]>("/recruits");
  },

  getById: async (id: string) => {
    return apiCall<Recruit>(`/recruits/${id}`);
  },

  updateStatus: async (id: string, status: string) => {
    return apiCall<Recruit>(`/recruits/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

// Recruiter API
export const recruiter = {
  getByQRCode: async (qrCode: string) => {
    return apiCall<{ recruiter: Partial<User> }>(`/recruiter/by-qr/${qrCode}`);
  },
  
  getZipCode: async () => {
    return apiCall<{ zipCode: string | null }>("/recruiter/zip-code");
  },
  
  updateZipCode: async (zipCode: string) => {
    return apiCall<{ zipCode: string }>("/recruiter/zip-code", {
      method: "PUT",
      body: JSON.stringify({ zipCode }),
    });
  },
};

// Stats API
export const stats = {
  getRecruiterStats: async () => {
    return apiCall<{
      totalRecruits: number;
      qrCodeScans: number;
      directEntries: number;
      recentRecruits: Recruit[];
    }>("/recruiter/stats");
  },
};

// QR Survey API
export const surveys = {
  submit: async (data: {
    recruiterCode: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
    feedback?: string;
    source?: string;
  }) => {
    return apiCall<QrSurveyResponse>("/surveys", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyResponses: async () => {
    return apiCall<{
      total: number;
      averageRating: number;
      responses: QrSurveyResponse[];
    }>("/surveys/my");
  },
};

// Admin API
export const admin = {
  getStationCommanderRequests: async () => {
    return apiCall<{
      requests: Array<{
        id: string;
        userId: string;
        userName: string;
        userEmail: string;
        userRank: string | null;
        userUnit: string | null;
        justification: string | null;
        status: string;
        createdAt: Date;
      }>;
    }>("/admin/station-commander-requests");
  },

  approveStationCommanderRequest: async (requestId: string, stationId?: string) => {
    return apiCall<{ message: string }>(`/admin/station-commander-requests/${requestId}/approve`, {
      method: "POST",
      body: JSON.stringify({ stationId }),
    });
  },

  denyStationCommanderRequest: async (requestId: string, reason?: string) => {
    return apiCall<{ message: string }>(`/admin/station-commander-requests/${requestId}/deny`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
};

// Station Commander API
export const stationCommander = {
  getRecruitersWithStats: async () => {
    return apiCall<{
      recruiters: Array<Partial<User> & {
        stats: {
          allTime: {
            total: number;
            surveys: number;
            prospects: number;
            leads: number;
            qrCodeScans: number;
            directEntries: number;
          };
          monthly: {
            total: number;
            surveys: number;
            prospects: number;
            leads: number;
          };
        };
      }>;
      stationTotals: {
        allTime: {
          total: number;
          surveys: number;
          prospects: number;
          leads: number;
        };
        monthly: {
          total: number;
          surveys: number;
          prospects: number;
          leads: number;
        };
      };
    }>("/station-commander/recruiters");
  },

  getRecruitsForExport: async () => {
    return apiCall<{
      recruits: Array<Recruit & {
        recruiterName: string;
        recruiterRank: string;
      }>;
    }>("/station-commander/recruits/export");
  },

  getRecruiterLeads: async (recruiterId: string) => {
    return apiCall<{ leads: Recruit[] }>(`/station-commander/recruiter/${recruiterId}/leads`);
  },

  getRecruiterSurveys: async (recruiterId: string) => {
    return apiCall<{ surveys: QrSurveyResponse[] }>(`/station-commander/recruiter/${recruiterId}/surveys`);
  },
};

// Location QR Codes API
export const locationQRCodes = {
  create: async (data: { locationLabel: string; qrType: 'application' | 'survey' }) => {
    return apiCall<{
      id: string;
      locationLabel: string;
      qrCode: string;
      qrType: string;
      qrCodeImage: string;
      createdAt: Date;
    }>("/qr-codes/location", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async () => {
    return apiCall<Array<{
      id: string;
      recruiterId: string;
      locationLabel: string;
      qrCode: string;
      qrType: string;
      createdAt: Date;
      updatedAt: Date;
    }>>("/qr-codes/location");
  },

  getImage: async (id: string) => {
    return apiCall<{ qrCode: string }>(`/qr-codes/location/${id}/image`);
  },

  delete: async (id: string) => {
    return apiCall<{ success: boolean }>(`/qr-codes/location/${id}`, {
      method: "DELETE",
    });
  },
};

// QR Scan Analytics API
export const qrScanAnalytics = {
  getAnalytics: async () => {
    return apiCall<{
      locations: Array<{
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
      }>;
      totalScans: number;
      totalConverted: number;
      overallConversionRate: number;
    }>("/qr-scans/analytics");
  },
};

