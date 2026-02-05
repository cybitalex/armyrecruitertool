import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth, ProtectedRoute } from "../lib/auth-context";
import { recruits, stats, surveys, qrScanAnalytics } from "../lib/api";
import type { Recruit, QrSurveyResponse, Station } from "@shared/schema";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Users, QrCode, UserPlus, Star, Download, MapPin, BarChart3, X, FileText, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { exportContactsToExcel } from "../lib/exportExcel";

function DashboardContent() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [recruitsList, setRecruitsList] = useState<Recruit[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<QrSurveyResponse[]>([]);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [showQRAnalytics, setShowQRAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Use React Query for stats to auto-update when invalidated
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["/recruiter/stats"],
    queryFn: async () => {
      const response = await stats.getRecruiterStats();
      return {
        totalRecruits: response.totalRecruits || 0,
        qrCodeScans: response.qrCodeScans || 0,
        directEntries: response.directEntries || 0,
        // NEW: QR scan tracking data
        qrScanTracking: response.qrScanTracking || {
          totalScans: 0,
          totalSurveyScans: 0,
          applicationsFromScans: 0,
          surveysFromScans: 0,
          totalConverted: 0,
          conversionRate: 0,
        },
      };
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds for faster updates
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
    refetchOnMount: true, // Always refetch when component mounts
    retry: 1,
  });

  const { data: recruitsData, isLoading: recruitsLoading, error: recruitsError, refetch: refetchRecruits } = useQuery({
    queryKey: ["/api/recruits"],
    queryFn: () => recruits.list(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 1,
  });

  const {
    data: surveyData,
    isLoading: surveyLoading,
    error: surveyError,
    refetch: refetchSurveys,
  } = useQuery({
    queryKey: ["/api/surveys/my"],
    queryFn: () => surveys.getMyResponses(),
    refetchInterval: 60000,
    retry: 1,
  });

  const {
    data: qrAnalyticsData,
    isLoading: qrAnalyticsLoading,
  } = useQuery({
    queryKey: ["/api/qr-scans/analytics"],
    queryFn: () => qrScanAnalytics.getAnalytics(),
    enabled: showQRAnalytics, // Only fetch when dialog is open
    retry: 1,
  });

  useEffect(() => {
    if (recruitsData) {
      setRecruitsList(recruitsData);
    }
  }, [recruitsData]);

  useEffect(() => {
    if (surveyData?.responses) {
      setSurveyResponses(surveyData.responses);
    }
  }, [surveyData]);

  // Load current station information
  useEffect(() => {
    const loadStation = async () => {
      if (user?.stationId) {
        try {
          const response = await fetch(`/api/stations/${user.stationId}`);
          if (response.ok) {
            const station = await response.json();
            setCurrentStation(station);
          }
        } catch (err) {
          console.error("Failed to load station:", err);
        }
      }
    };
    loadStation();
  }, [user?.stationId]);

  const loading = statsLoading || recruitsLoading || surveyLoading;
  const error =
    statsError?.message ||
    recruitsError?.message ||
    (surveyError instanceof Error ? surveyError.message : "");
  
  // Ensure stats refresh when returning to dashboard
  useEffect(() => {
    refetchStats();
    refetchRecruits();
    refetchSurveys();
  }, []);

  // Refetch stats whenever recruits list changes (handles QR code scans from other tabs/devices)
  useEffect(() => {
    if (recruitsList.length > 0) {
      // Small delay to ensure backend has processed the new recruit
      const timer = setTimeout(() => {
        refetchStats();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [recruitsList.length, refetchStats]);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleExportToExcel = () => {
    try {
      exportContactsToExcel(recruitsList, surveyResponses);
    } catch (error) {
      console.error("Failed to export contacts:", error);
      alert("Failed to export contacts. Please try again.");
    }
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-green-800">
                Recruiter Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 break-words">
                Welcome back, {user?.fullName || "Recruiter"}
                {user?.rank && ` (${user.rank})`}
              </p>
            </div>
            {currentStation && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <MapPin className="w-4 h-4 text-green-700 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-green-900 truncate">
                    {currentStation.name}
                  </p>
                  <p className="text-xs text-green-700">
                    <span className="font-mono font-semibold">{currentStation.stationCode}</span>
                    {currentStation.state && ` • ${currentStation.state}`}
                  </p>
                </div>
              </div>
            )}
          </div>
          {user?.role === 'station_commander' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 w-fit">
              <Badge variant="outline" className="text-xs bg-blue-100 border-blue-300">
                Station Commander
              </Badge>
              <span>Viewing all recruiters at your station</span>
            </div>
          )}
          {user?.role === 'admin' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-2 py-1 w-fit">
              <Badge variant="outline" className="text-xs bg-purple-100 border-purple-300">
                Administrator
              </Badge>
              <span>Viewing all data across all stations</span>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate pr-1">
                Total Leads
              </CardTitle>
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-green-800">
                {loading ? "..." : (statsData?.totalRecruits || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">
                All-time referrals
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowQRAnalytics(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate pr-1">
                QR Code Scans
              </CardTitle>
              <QrCode className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {loading ? "..." : (statsData?.qrScanTracking?.totalScans || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {loading ? "..." : (
                  <>
                    {statsData?.qrScanTracking?.totalConverted || 0} converted
                    {(statsData?.qrScanTracking?.conversionRate || 0) > 0 && (
                      <span className="ml-1 text-green-600 font-semibold">
                        ({statsData?.qrScanTracking?.conversionRate}%)
                      </span>
                    )}
                    {(statsData?.qrScanTracking?.surveysFromScans || 0) > 0 && (
                      <span className="block text-[11px] text-gray-500 mt-1">
                        {statsData?.qrScanTracking?.applicationsFromScans || 0} apps • {statsData?.qrScanTracking?.surveysFromScans || 0} surveys
                      </span>
                    )}
                  </>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-1 font-medium">
                Click to view details →
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate pr-1">
                Direct Entries
              </CardTitle>
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {loading ? "..." : (statsData?.directEntries || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">
                In-person submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate pr-1">
                Presentation Feedback
              </CardTitle>
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-yellow-500 flex items-baseline gap-1">
                {loading
                  ? "..."
                  : surveyData && surveyData.total > 0
                  ? surveyData.averageRating.toFixed(1)
                  : "—"}
                {!loading && surveyData && surveyData.total > 0 && (
                  <span className="text-xs text-gray-500">/ 5</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {loading
                  ? ""
                  : `${surveyData?.total || 0} response${
                      (surveyData?.total || 0) === 1 ? "" : "s"
                    }`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            onClick={() => setLocation("/my-qr")}
            className="h-auto py-4 sm:py-5 lg:py-6 bg-green-700 hover:bg-green-800 text-left justify-start"
          >
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="text-left min-w-0">
              <div className="font-semibold text-sm sm:text-base truncate">View My QR Code</div>
              <div className="text-xs opacity-90 truncate">Download and share</div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation("/intake-form")}
            variant="outline"
            className="h-auto py-4 sm:py-5 lg:py-6 border-green-700 text-green-700 hover:bg-green-50 text-left justify-start"
          >
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="text-left min-w-0">
              <div className="font-semibold text-sm sm:text-base truncate">New Lead</div>
              <div className="text-xs opacity-75 truncate">Fill form directly</div>
            </div>
          </Button>

          <Button
            onClick={handleExportToExcel}
            variant="outline"
            className="h-auto py-4 sm:py-5 lg:py-6 border-blue-700 text-blue-700 hover:bg-blue-50 text-left justify-start sm:col-span-2 lg:col-span-1"
            disabled={
              loading ||
              (recruitsList.length === 0 && surveyResponses.length === 0)
            }
          >
            <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="text-left min-w-0">
              <div className="font-semibold text-sm sm:text-base truncate">Export to Excel</div>
              <div className="text-xs opacity-75 truncate">
                Download all contacts
              </div>
            </div>
          </Button>
        </div>

        {/* Tabs for Data Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Recent</span>
            </TabsTrigger>
            <TabsTrigger value="applicants" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">All Leads</span>
              <span className="sm:hidden">Leads</span>
              <span className="ml-1">({recruitsList.length})</span>
            </TabsTrigger>
            <TabsTrigger value="surveys" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">All Surveys</span>
              <span className="sm:hidden">Survey</span>
              <span className="ml-1">({surveyResponses.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Recent Leads and Surveys */}
          <TabsContent value="overview">
            {/* Recent Leads */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>
                  {user?.role === 'station_commander' || user?.role === 'admin' 
                    ? "Latest leads from your station and their status (showing last 10)"
                    : "Your latest referrals and their status (showing last 10)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading leads...
                  </div>
                ) : recruitsList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No leads yet</p>
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
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer gap-2 sm:gap-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {recruit.firstName} {recruit.lastName}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {recruit.email}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate sm:hidden">
                            {recruit.phone}
                          </div>
                          <div className="text-xs text-gray-500 hidden sm:block">
                            {recruit.email} • {recruit.phone}
                          </div>
                          {(user?.role === 'station_commander' || user?.role === 'admin') && (recruit as any).recruiterName && (
                            <div className="text-xs text-blue-600 mt-1 font-medium">
                              Recruiter: {(recruit as any).recruiterName}
                              {(recruit as any).recruiterRank && ` (${(recruit as any).recruiterRank})`}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${recruit.source === "qr_code" ? "bg-blue-50" : "bg-purple-50"}`}
                            >
                              {recruit.source === "qr_code" ? "🎯 QR Code" : "📝 Direct"}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(recruit.status)}`}>
                              {recruit.status}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${(recruit as any).shipDate ? "bg-green-50 text-green-700 border-green-300" : "bg-gray-50 text-gray-600"}`}
                            >
                              {(recruit as any).shipDate ? "🚢 Shipping" : "📋 Not Shipping"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-left sm:text-right text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {recruit.submittedAt && format(new Date(recruit.submittedAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Presentation Feedback */}
            <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle>Recent Presentation Feedback</CardTitle>
            <CardDescription>
              {user?.role === 'station_commander' || user?.role === 'admin'
                ? "Quick survey responses from your station (showing last 5)"
                : "Quick survey responses from your QR code briefings"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {surveyLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading feedback...
              </div>
            ) : surveyResponses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No feedback submitted yet</p>
                <p className="text-sm mt-2">
                  Use your Presentation Survey QR code during briefings to collect quick ratings.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {surveyResponses.slice(0, 5).map((response) => (
                  <div
                    key={response.id}
                    className="p-3 sm:p-4 border rounded-lg bg-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {response.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {response.email}
                          </div>
                          <div className="text-xs text-gray-500 truncate sm:hidden">
                            {response.phone}
                          </div>
                          <div className="text-xs text-gray-500 hidden sm:block truncate">
                            {response.email} • {response.phone}
                          </div>
                          {(user?.role === 'station_commander' || user?.role === 'admin') && (response as any).recruiterName && (
                            <div className="text-xs text-blue-600 mt-1 font-medium">
                              Recruiter: {(response as any).recruiterName}
                              {(response as any).recruiterRank && ` (${(response as any).recruiterRank})`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                response.rating >= star
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {response.feedback && (
                        <p className="text-xs sm:text-sm text-gray-700 mt-2 break-words">
                          {response.feedback}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                      {response.createdAt &&
                        format(new Date(response.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* All Leads Tab */}
          <TabsContent value="applicants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Leads
                </CardTitle>
                <CardDescription>
                  {user?.role === 'station_commander' || user?.role === 'admin'
                    ? `View all leads from your station (${recruitsList.length} total)`
                    : `View all your leads (${recruitsList.length} total)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading leads...
                  </div>
                ) : recruitsList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No leads yet</p>
                    <p className="text-sm mt-2">
                      Share your QR code to start receiving applications
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recruitsList.map((recruit) => (
                      <div
                        key={recruit.id}
                        onClick={() => setLocation(`/recruits/${recruit.id}`)}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer gap-2 sm:gap-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {recruit.firstName} {recruit.lastName}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {recruit.city}, {recruit.state}
                          </div>
                          <div className="text-xs text-gray-500 truncate sm:hidden">
                            {recruit.phone}
                          </div>
                          <div className="text-xs text-gray-500 hidden sm:block">
                            {recruit.email} • {recruit.phone}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${recruit.source === "qr_code" ? "bg-blue-50" : "bg-purple-50"}`}
                            >
                              {recruit.source === "qr_code" ? "🎯 QR Code" : "📝 Direct"}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(recruit.status)}`}>
                              {recruit.status}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${(recruit as any).shipDate ? "bg-green-50 text-green-700 border-green-300" : "bg-gray-50 text-gray-600"}`}
                            >
                              {(recruit as any).shipDate ? "🚢 Shipping" : "📋 Not Shipping"}
                            </Badge>
                            {recruit.preferredMOS && (
                              <Badge variant="outline" className="text-xs bg-green-50">
                                MOS: {recruit.preferredMOS}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {recruit.submittedAt && format(new Date(recruit.submittedAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Surveys Tab */}
          <TabsContent value="surveys">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  All Survey Responses
                </CardTitle>
                <CardDescription>
                  {user?.role === 'station_commander' || user?.role === 'admin'
                    ? `View all survey feedback from your station (${surveyResponses.length} total)`
                    : `View all your survey feedback (${surveyResponses.length} total)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {surveyLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading feedback...
                  </div>
                ) : surveyResponses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No feedback submitted yet</p>
                    <p className="text-sm mt-2">
                      Use your Presentation Survey QR code during briefings to collect quick ratings.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {surveyResponses.map((response) => (
                      <div
                        key={response.id}
                        className="p-3 sm:p-4 border rounded-lg bg-white"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900 text-sm sm:text-base">
                                {response.name}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                      response.rating >= star
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {response.email} • {response.phone}
                            </div>
                            {(user?.role === 'station_commander' || user?.role === 'admin') && (response as any).recruiterName && (
                              <div className="text-xs text-blue-600 mt-1 font-medium">
                                Recruiter: {(response as any).recruiterName}
                                {(response as any).recruiterRank && ` (${(response as any).recruiterRank})`}
                              </div>
                            )}
                            {response.feedback && (
                              <div className="mt-2 text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded break-words">
                                "{response.feedback}"
                              </div>
                            )}
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Source: {response.source}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-left sm:text-right text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                            {response.createdAt && format(new Date(response.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* QR Scan Analytics Dialog */}
        <Dialog open={showQRAnalytics} onOpenChange={setShowQRAnalytics}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full mx-2 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                QR Code Scan Analytics
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Detailed breakdown of QR code scans by location
              </DialogDescription>
            </DialogHeader>
            
            {qrAnalyticsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading analytics...</div>
            ) : qrAnalyticsData ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Overall Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <Card>
                    <CardHeader className="pb-2 px-2 sm:px-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Scans</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6 pb-2 sm:pb-6">
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">
                        {qrAnalyticsData.totalScans}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2 px-2 sm:px-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Converted</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6 pb-2 sm:pb-6">
                      <div className="text-lg sm:text-2xl font-bold text-green-600">
                        {qrAnalyticsData.totalConverted}
                      </div>
                      {qrAnalyticsData.totalConverted > 0 && (
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">
                          Includes applications and surveys
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2 px-2 sm:px-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6 pb-2 sm:pb-6">
                      <div className="text-lg sm:text-2xl font-bold text-purple-600">
                        {qrAnalyticsData.overallConversionRate}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Location Breakdown */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Scans by Location</h3>
                  {qrAnalyticsData.locations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No QR code scans recorded yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">Location</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Scans</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Converted</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {qrAnalyticsData.locations.map((location) => (
                            <TableRow key={location.locationLabel}>
                              <TableCell className="font-medium text-xs sm:text-sm">
                                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                                  {location.locationLabel === 'Default QR' ? (
                                    <QrCode className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{location.locationLabel}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-xs sm:text-sm">
                                {location.totalScans}
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">
                                <span className="text-green-600 font-semibold">
                                  {location.convertedScans}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">
                                <Badge variant={location.conversionRate >= 50 ? "default" : location.conversionRate >= 25 ? "secondary" : "outline"} className="text-[10px] sm:text-xs">
                                  {location.conversionRate}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Recent Scans */}
                {qrAnalyticsData.locations.some(loc => loc.scans.length > 0) && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Scans</h3>
                    <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                      {qrAnalyticsData.locations.flatMap(location =>
                        location.scans.slice(0, 10).map(scan => (
                          <div
                            key={scan.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-gray-50 rounded text-xs sm:text-sm gap-2"
                          >
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="font-medium truncate">{location.locationLabel}</span>
                              <Badge variant="outline" className="text-[10px] sm:text-xs">
                                {scan.scanType}
                              </Badge>
                              {scan.conversionType && (
                                <Badge
                                  variant="default"
                                  className={`text-[10px] sm:text-xs ${scan.conversionType === "survey" ? "bg-blue-600" : "bg-green-600"}`}
                                >
                                  {scan.conversionType === "survey"
                                    ? "Converted (Survey)"
                                    : "Converted (Application)"}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                              {format(new Date(scan.scannedAt), "MMM d, h:mm a")}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No analytics data available</div>
            )}
          </DialogContent>
        </Dialog>
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
