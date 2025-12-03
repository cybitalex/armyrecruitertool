import { useEffect, useState } from "react";
import { useAuth, ProtectedRoute } from "../lib/auth-context";
import { stationCommander, recruits as recruitsApi, surveys } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Users,
  TrendingUp,
  Download,
  AlertCircle,
  BarChart3,
  Calendar,
  FileText,
  Star,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import type { Recruit, QrSurveyResponse } from "@shared/schema";

interface RecruiterWithStats {
  id: string;
  email: string;
  fullName: string;
  rank: string | null;
  unit: string | null;
  role: string | null;
  stats: {
    allTime: {
      total: number;
      leads: number;
      prospects: number;
      applicants: number;
      qrCodeScans: number;
      directEntries: number;
      qrScanTracking?: {
        totalScans: number;
        totalSurveyScans: number;
        applicationsFromScans: number;
        surveysFromScans: number;
        totalConverted: number;
        conversionRate: number;
      };
    };
    monthly: {
      total: number;
      leads: number;
      prospects: number;
      applicants: number;
    };
  };
}

interface StationTotals {
  allTime: {
    total: number;
    leads: number;
    prospects: number;
    applicants: number;
  };
  monthly: {
    total: number;
    leads: number;
    prospects: number;
    applicants: number;
  };
}

function StationCommanderDashboardContent() {
  const { user } = useAuth();
  const [recruiters, setRecruiters] = useState<RecruiterWithStats[]>([]);
  const [stationTotals, setStationTotals] = useState<StationTotals | null>(null);
  const [recruitsList, setRecruitsList] = useState<Recruit[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<QrSurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [recruitsLoading, setRecruitsLoading] = useState(false);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "applicants" && recruitsList.length === 0) {
      loadRecruits();
    } else if (activeTab === "surveys" && surveyResponses.length === 0) {
      loadSurveys();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await stationCommander.getRecruitersWithStats();
      setRecruiters(data.recruiters);
      setStationTotals(data.stationTotals);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadRecruits = async () => {
    try {
      setRecruitsLoading(true);
      const data = await recruitsApi.list();
      setRecruitsList(data);
    } catch (err) {
      console.error("Failed to load recruits:", err);
    } finally {
      setRecruitsLoading(false);
    }
  };

  const loadSurveys = async () => {
    try {
      setSurveysLoading(true);
      const data = await surveys.getMyResponses();
      setSurveyResponses(data.responses || []);
    } catch (err) {
      console.error("Failed to load surveys:", err);
    } finally {
      setSurveysLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      const data = await stationCommander.getRecruitsForExport();

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Station Summary
      const summaryData = [
        ["Station Commander Report"],
        ["Generated:", new Date().toLocaleString()],
        ["Station Commander:", user?.fullName || ""],
        [],
        ["STATION TOTALS - ALL TIME"],
        ["Total Recruits:", stationTotals?.allTime.total || 0],
        ["Leads:", stationTotals?.allTime.leads || 0],
        ["Prospects:", stationTotals?.allTime.prospects || 0],
        ["Applicants:", stationTotals?.allTime.applicants || 0],
        [],
        ["STATION TOTALS - THIS MONTH"],
        ["Total Recruits:", stationTotals?.monthly.total || 0],
        ["Leads:", stationTotals?.monthly.leads || 0],
        ["Prospects:", stationTotals?.monthly.prospects || 0],
        ["Applicants:", stationTotals?.monthly.applicants || 0],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Sheet 2: Recruiter Stats (including station commander)
      const recruiterStatsData = [
        [
          "Recruiter Name",
          "Role",
          "Rank",
          "Unit",
          "Email",
          "Total (All Time)",
          "Leads (All Time)",
          "Prospects (All Time)",
          "Applicants (All Time)",
          "QR Scans",
          "Direct Entries",
          "Total (This Month)",
          "Leads (Monthly)",
          "Prospects (Monthly)",
          "Applicants (Monthly)",
        ],
        ...recruiters.map((r) => [
          r.fullName,
          r.role === "station_commander" ? "Station Commander" : "Recruiter",
          r.rank || "",
          r.unit || "",
          r.email,
          r.stats.allTime.total,
          r.stats.allTime.leads,
          r.stats.allTime.prospects,
          r.stats.allTime.applicants,
          r.stats.allTime.qrCodeScans,
          r.stats.allTime.directEntries,
          r.stats.monthly.total,
          r.stats.monthly.leads,
          r.stats.monthly.prospects,
          r.stats.monthly.applicants,
        ]),
      ];
      const recruiterStatsSheet = XLSX.utils.aoa_to_sheet(recruiterStatsData);
      XLSX.utils.book_append_sheet(wb, recruiterStatsSheet, "Recruiter Stats");

      // Sheet 3: All Recruits Details
      const recruitsData = [
        [
          "Recruiter",
          "Rank",
          "First Name",
          "Last Name",
          "Email",
          "Phone",
          "City",
          "State",
          "Status",
          "Source",
          "Submitted Date",
        ],
        ...data.recruits.map((r) => [
          r.recruiterName,
          r.recruiterRank,
          r.firstName,
          r.lastName,
          r.email,
          r.phone,
          r.city,
          r.state,
          r.status,
          r.source === "qr_code" ? "QR Code" : "Direct Entry",
          new Date(r.submittedAt).toLocaleDateString(),
        ]),
      ];
      const recruitsSheet = XLSX.utils.aoa_to_sheet(recruitsData);
      XLSX.utils.book_append_sheet(wb, recruitsSheet, "All Recruits");

      // Generate filename with current date
      const filename = `Station_Report_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  // Check if user is station commander or admin
  if (!user || (user.role !== 'station_commander' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. Station Commander access is required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "lead":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "prospect":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "applicant":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-green-800">
            Station Commander Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Welcome back, {user?.fullName || "Commander"} {user?.rank && `(${user.rank})`}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Export Button */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={handleExportReport}
            disabled={exporting || loading}
            className="bg-blue-700 hover:bg-blue-800"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? "Exporting..." : "Export Full Report"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="applicants" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Applicants ({recruitsList.length})
            </TabsTrigger>
            <TabsTrigger value="surveys" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Survey Responses ({surveyResponses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">

        {/* Station Totals */}
        {stationTotals && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Station Totals - {currentMonth}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {stationTotals.monthly.total}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Leads (Monthly)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stationTotals.monthly.leads}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Prospects (Monthly)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stationTotals.monthly.prospects}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Applicants (Monthly)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stationTotals.monthly.applicants}
                  </div>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All-Time Station Totals
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total All-Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-700">
                    {stationTotals.allTime.total}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Leads (All-Time)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-700">
                    {stationTotals.allTime.leads}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Prospects (All-Time)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-700">
                    {stationTotals.allTime.prospects}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Applicants (All-Time)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-700">
                    {stationTotals.allTime.applicants}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

            {/* Recruiter Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recruiter Performance
                </CardTitle>
                <CardDescription>
                  Individual statistics for each recruiter at your station • {recruiters.length} Total Recruiters
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading recruiter data...
                  </div>
                ) : recruiters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No recruiters found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recruiters.map((recruiter) => (
                      <div
                        key={recruiter.id}
                        className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {recruiter.fullName}
                                {recruiter.id === user?.id && (
                                  <span className="text-sm text-green-600 ml-2">(You)</span>
                                )}
                              </h3>
                              {recruiter.rank && (
                                <Badge variant="outline" className="text-xs">
                                  {recruiter.rank}
                                </Badge>
                              )}
                              {recruiter.role === "station_commander" && (
                                <Badge className="text-xs bg-blue-600">
                                  Station Commander
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {/* Monthly Stats */}
                              <div className="bg-green-50 p-3 rounded">
                                <div className="text-xs text-gray-600 mb-1">This Month</div>
                                <div className="text-2xl font-bold text-green-700">
                                  {recruiter.stats.monthly.total}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {recruiter.stats.monthly.leads}L / {recruiter.stats.monthly.prospects}P
                                  / {recruiter.stats.monthly.applicants}A
                                </div>
                              </div>

                              {/* All-Time Stats */}
                              <div className="bg-blue-50 p-3 rounded">
                                <div className="text-xs text-gray-600 mb-1">All-Time</div>
                                <div className="text-2xl font-bold text-blue-700">
                                  {recruiter.stats.allTime.total}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {recruiter.stats.allTime.qrScanTracking ? (
                                    <div className="space-y-0.5">
                                      <p>
                                        {recruiter.stats.allTime.qrScanTracking.totalScans} scans → {recruiter.stats.allTime.qrScanTracking.totalConverted} conversions
                                        {recruiter.stats.allTime.qrScanTracking.conversionRate > 0 && (
                                          <span className="ml-1 text-green-600 font-semibold">
                                            ({recruiter.stats.allTime.qrScanTracking.conversionRate}%)
                                          </span>
                                        )}
                                      </p>
                                      {(recruiter.stats.allTime.qrScanTracking.applicationsFromScans > 0 ||
                                        recruiter.stats.allTime.qrScanTracking.surveysFromScans > 0) && (
                                        <p className="text-[11px] text-gray-500">
                                          {recruiter.stats.allTime.qrScanTracking.applicationsFromScans} apps •{" "}
                                          {recruiter.stats.allTime.qrScanTracking.surveysFromScans} surveys
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <>
                                      {recruiter.stats.allTime.qrCodeScans} QR /{" "}
                                      {recruiter.stats.allTime.directEntries} Direct
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Breakdown */}
                              <div className="bg-gray-50 p-3 rounded">
                                <div className="text-xs text-gray-600 mb-1">Leads</div>
                                <div className="text-xl font-bold text-yellow-600">
                                  {recruiter.stats.allTime.leads}
                                </div>
                              </div>

                              <div className="bg-gray-50 p-3 rounded">
                                <div className="text-xs text-gray-600 mb-1">Applicants</div>
                                <div className="text-xl font-bold text-purple-600">
                                  {recruiter.stats.allTime.applicants}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applicants Tab */}
          <TabsContent value="applicants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Applicants
                </CardTitle>
                <CardDescription>
                  View all applicants from your station
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recruitsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading applicants...
                  </div>
                ) : recruitsList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No applicants found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recruitsList.map((recruit) => (
                      <div
                        key={recruit.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => window.open(`/recruits/${recruit.id}`, '_blank')}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-base">
                            {recruit.firstName} {recruit.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {recruit.email} • {recruit.phone}
                          </div>
                          <div className="text-sm text-gray-500">
                            {recruit.city}, {recruit.state}
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
                            {recruit.preferredMOS && (
                              <Badge variant="outline" className="text-xs bg-green-50">
                                MOS: {recruit.preferredMOS}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500 whitespace-nowrap mt-2 sm:mt-0">
                          {recruit.submittedAt && format(new Date(recruit.submittedAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Survey Responses Tab */}
          <TabsContent value="surveys">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Survey Responses
                </CardTitle>
                <CardDescription>
                  View all survey responses from your station
                </CardDescription>
              </CardHeader>
              <CardContent>
                {surveysLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading survey responses...
                  </div>
                ) : surveyResponses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No survey responses found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {surveyResponses.map((response) => (
                      <div
                        key={response.id}
                        className="p-4 border rounded-lg bg-white"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900">
                                {response.name}
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      response.rating >= star
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {response.email} • {response.phone}
                            </div>
                            {response.feedback && (
                              <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                "{response.feedback}"
                              </div>
                            )}
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Source: {response.source}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500 whitespace-nowrap">
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
      </main>
    </div>
  );
}

export default function StationCommanderDashboard() {
  return (
    <ProtectedRoute>
      <StationCommanderDashboardContent />
    </ProtectedRoute>
  );
}

