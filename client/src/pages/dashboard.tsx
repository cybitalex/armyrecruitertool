import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth, ProtectedRoute } from "../lib/auth-context";
import { recruits, stats } from "../lib/api";
import type { Recruit } from "@shared/schema";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Users, QrCode, UserPlus, TrendingUp, LogOut, Menu } from "lucide-react";
import { format } from "date-fns";

function DashboardContent() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [recruitsList, setRecruitsList] = useState<Recruit[]>([]);

  // Use React Query for stats to auto-update when invalidated
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["/recruiter/stats"],
    queryFn: async () => {
      const response = await stats.getRecruiterStats();
      return {
        totalRecruits: response.totalRecruits || 0,
        qrCodeScans: response.qrCodeScans || 0,
        directEntries: response.directEntries || 0,
      };
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 1,
  });

  const { data: recruitsData, isLoading: recruitsLoading, error: recruitsError, refetch: refetchRecruits } = useQuery({
    queryKey: ["/api/recruits"],
    queryFn: () => recruits.list(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 1,
  });

  useEffect(() => {
    if (recruitsData) {
      setRecruitsList(recruitsData);
    }
  }, [recruitsData]);

  const loading = statsLoading || recruitsLoading;
  const error = statsError?.message || recruitsError?.message || "";
  
  // Ensure stats refresh when returning to dashboard
  useEffect(() => {
    refetchStats();
    refetchRecruits();
  }, []);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "qualified":
        return "bg-green-100 text-green-800";
      case "disqualified":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-green-800">
            Recruiter Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Welcome back, {user?.fullName || "Recruiter"}
            {user?.rank && ` (${user.rank})`}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Applicants
              </CardTitle>
              <Users className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">
                {loading ? "..." : (statsData?.totalRecruits || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All-time referrals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                QR Code Scans
              </CardTitle>
              <QrCode className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? "..." : (statsData?.qrCodeScans || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Via QR code scanning
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Direct Entries
              </CardTitle>
              <UserPlus className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {loading ? "..." : (statsData?.directEntries || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                In-person submissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => setLocation("/my-qr")}
            className="h-auto py-6 bg-green-700 hover:bg-green-800"
          >
            <QrCode className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">View My QR Code</div>
              <div className="text-xs opacity-90">Download and share</div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation("/intake-form")}
            variant="outline"
            className="h-auto py-6 border-green-700 text-green-700 hover:bg-green-50"
          >
            <UserPlus className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">New Applicant (In-Person)</div>
              <div className="text-xs opacity-75">Fill form directly</div>
            </div>
          </Button>
        </div>

        {/* Recent Applicants */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applicants</CardTitle>
            <CardDescription>
              Your latest referrals and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading applicants...
              </div>
            ) : recruitsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No applicants yet</p>
                <p className="text-sm mt-2">
                  Share your QR code to start receiving applications
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recruitsList.slice(0, 10).map((recruit) => (
                  <div
                    key={recruit.id}
                    onClick={() => setLocation(`/recruits/${recruit.id}`)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {recruit.firstName} {recruit.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {recruit.email} • {recruit.phone}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={recruit.source === "qr_code" ? "bg-blue-50" : "bg-purple-50"}
                        >
                          {recruit.source === "qr_code" ? "🎯 QR Code" : "📝 Direct"}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(recruit.status)}>
                          {recruit.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {recruit.submittedAt && format(new Date(recruit.submittedAt), "MMM d, yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
