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

