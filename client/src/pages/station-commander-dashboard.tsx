import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, ProtectedRoute } from "../lib/auth-context";
import { stationCommander, recruits as recruitsApi, surveys } from "../lib/api";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
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
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
      surveys: number;
      prospects: number;
      leads: number;
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
      surveys: number;
      prospects: number;
      leads: number;
    };
  };
}

interface StationTotals {
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
}

function StationCommanderDashboardContent() {
  const { user } = useAuth();
  const [recruitsList, setRecruitsList] = useState<Recruit[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<QrSurveyResponse[]>([]);
  const [recruitsLoading, setRecruitsLoading] = useState(false);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Recruiter data for station totals dialog
  const [recruiterLeads, setRecruiterLeads] = useState<Record<string, Recruit[]>>({});
  const [recruiterSurveys, setRecruiterSurveys] = useState<Record<string, QrSurveyResponse[]>>({});
  const [loadingLeads, setLoadingLeads] = useState<Record<string, boolean>>({});
  const [loadingSurveys, setLoadingSurveys] = useState<Record<string, boolean>>({});
  const [expandedRecruitersInDialog, setExpandedRecruitersInDialog] = useState<Set<string>>(new Set());
  
  // Filter state
  const [filterRecruiter, setFilterRecruiter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<'name' | 'leads' | 'surveys' | 'total'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Station totals popup state
  const [totalsDialogOpen, setTotalsDialogOpen] = useState(false);
  const [totalsDialogType, setTotalsDialogType] = useState<'surveys' | 'leads' | null>(null);
  const [totalsDialogPeriod, setTotalsDialogPeriod] = useState<'monthly' | 'allTime'>('monthly');
  const [focusedRecruiterId, setFocusedRecruiterId] = useState<string | null>(null); // For filtering dialog to one recruiter
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'allTime' | 'thisMonth' | 'lastMonth' | string>('thisMonth');
  
  // Selected recruit for detail dialog
  const [selectedRecruit, setSelectedRecruit] = useState<Recruit | null>(null);
  const [recruitDetailDialogOpen, setRecruitDetailDialogOpen] = useState(false);
  
  // Notes state
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use React Query for optimized data fetching with caching
  const { 
    data: recruitersData, 
    isLoading: loading, 
    error: queryError,
    refetch: refetchRecruiters 
  } = useQuery({
    queryKey: ["/station-commander/recruiters"],
    queryFn: async () => {
      const data = await stationCommander.getRecruitersWithStats();
      return data;
    },
    staleTime: 15 * 1000, // Data fresh for 15 seconds
    gcTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const recruiters = recruitersData?.recruiters || [];
  const stationTotals = recruitersData?.stationTotals || null;
  const error = queryError?.message || "";

  // Mutation for adding notes
  const addNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      return await apiRequest("PATCH", `/api/recruits/${id}/notes`, {
        additionalNotes: note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/station-commander/recruiters"] });
      // Update the selected recruit with new notes
      if (selectedRecruit) {
        setSelectedRecruit({
          ...selectedRecruit,
          additionalNotes: newNote,
        });
      }
      setIsAddingNote(false);
      setNewNote("");
      toast({
        title: "Note Added",
        description: "Your note has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add Note",
        description: "There was an error saving your note.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (activeTab === "applicants" && recruitsList.length === 0) {
      loadRecruits();
    } else if (activeTab === "surveys" && surveyResponses.length === 0) {
      loadSurveys();
    }
  }, [activeTab]);

  // Load data for all recruiters when totals dialog opens
  useEffect(() => {
    if (totalsDialogOpen && totalsDialogType) {
      recruiters.forEach(async (recruiter) => {
        if (totalsDialogType === 'leads' && !recruiterLeads[recruiter.id]) {
          setLoadingLeads(prev => ({ ...prev, [recruiter.id]: true }));
          try {
            const data = await stationCommander.getRecruiterLeads(recruiter.id);
            setRecruiterLeads(prev => ({ ...prev, [recruiter.id]: data.leads }));
          } catch (err) {
            console.error("Failed to load leads:", err);
          } finally {
            setLoadingLeads(prev => ({ ...prev, [recruiter.id]: false }));
          }
        } else if (totalsDialogType === 'surveys' && !recruiterSurveys[recruiter.id]) {
          setLoadingSurveys(prev => ({ ...prev, [recruiter.id]: true }));
          try {
            const data = await stationCommander.getRecruiterSurveys(recruiter.id);
            setRecruiterSurveys(prev => ({ ...prev, [recruiter.id]: data.surveys }));
          } catch (err) {
            console.error("Failed to load surveys:", err);
          } finally {
            setLoadingSurveys(prev => ({ ...prev, [recruiter.id]: false }));
          }
        }
      });
    }
  }, [totalsDialogOpen, totalsDialogType]);

  // Removed loadData - now using React Query

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

  const toggleRecruiterExpandedInDialog = async (recruiterId: string, type: 'leads' | 'surveys') => {
    const key = `${recruiterId}-${type}`;
    const isExpanded = expandedRecruitersInDialog.has(key);
    
    if (isExpanded) {
      // Collapse
      const newExpanded = new Set(expandedRecruitersInDialog);
      newExpanded.delete(key);
      setExpandedRecruitersInDialog(newExpanded);
    } else {
      // Expand - load data if not already loaded
      setExpandedRecruitersInDialog(new Set([...expandedRecruitersInDialog, key]));
      
      if (type === 'leads' && !recruiterLeads[recruiterId]) {
        setLoadingLeads(prev => ({ ...prev, [recruiterId]: true }));
        try {
          const data = await stationCommander.getRecruiterLeads(recruiterId);
          setRecruiterLeads(prev => ({ ...prev, [recruiterId]: data.leads }));
        } catch (err) {
          console.error("Failed to load leads:", err);
        } finally {
          setLoadingLeads(prev => ({ ...prev, [recruiterId]: false }));
        }
      } else if (type === 'surveys' && !recruiterSurveys[recruiterId]) {
        setLoadingSurveys(prev => ({ ...prev, [recruiterId]: true }));
        try {
          const data = await stationCommander.getRecruiterSurveys(recruiterId);
          setRecruiterSurveys(prev => ({ ...prev, [recruiterId]: data.surveys }));
        } catch (err) {
          console.error("Failed to load surveys:", err);
        } finally {
          setLoadingSurveys(prev => ({ ...prev, [recruiterId]: false }));
        }
      }
    }
  };

  // Helper function to filter items by date
  const filterByDate = <T extends { createdAt?: Date | string }>(items: T[]): T[] => {
    if (dateFilter === 'allTime') return items;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // End of current month
    
    if (dateFilter === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateFilter === 'lastMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else {
      // Custom month in format yyyy-MM
      const [year, month] = dateFilter.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    }
    
    return items.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };
  
  // Get period label for display
  const getPeriodLabel = (): string => {
    if (dateFilter === 'allTime') return 'All Time';
    if (dateFilter === 'thisMonth') return format(new Date(), 'MMMM yyyy');
    if (dateFilter === 'lastMonth') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return format(lastMonth, 'MMMM yyyy');
    }
    const [year, month] = dateFilter.split('-').map(Number);
    return format(new Date(year, month - 1), 'MMMM yyyy');
  };
  
  // Filter recruits and surveys by date
  const filteredRecruitsList = filterByDate(recruitsList);
  const filteredSurveyResponses = filterByDate(surveyResponses);

  // Filter and sort recruiters
  const filteredAndSortedRecruiters = (() => {
    let filtered = filterRecruiter === "all" 
      ? recruiters 
      : recruiters.filter(r => r.id === filterRecruiter);
    
    // Sort recruiters
    filtered = [...filtered].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortBy) {
        case 'leads':
          aValue = a.stats.allTime.leads || 0;
          bValue = b.stats.allTime.leads || 0;
          break;
        case 'surveys':
          aValue = a.stats.allTime.surveys || 0;
          bValue = b.stats.allTime.surveys || 0;
          break;
        case 'total':
          aValue = a.stats.allTime.total || 0;
          bValue = b.stats.allTime.total || 0;
          break;
        case 'name':
        default:
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });
    
    return filtered;
  })();

  const handleExportReport = async () => {
    try {
      setExporting(true);
      const data = await stationCommander.getRecruitsForExport();
      
      // Filter recruits by selected date range
      const filteredRecruitsForExport = filterByDate(data.recruits);
      const periodLabel = getPeriodLabel();

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Station Summary (filtered)
      const summaryData = [
        ["Station Commander Report"],
        ["Generated:", new Date().toLocaleString()],
        ["Station Commander:", user?.fullName || ""],
        ["Period:", periodLabel],
        [],
        ["FILTERED DATA - " + periodLabel.toUpperCase()],
        ["Total Recruits:", filteredRecruitsForExport.length],
        ["Surveys:", filteredRecruitsForExport.filter(r => r.status === 'survey').length],
        ["Prospects:", filteredRecruitsForExport.filter(r => r.status === 'prospect').length],
        ["Leads:", filteredRecruitsForExport.filter(r => r.status === 'lead').length],
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
          "Surveys (All Time)",
          "Prospects (All Time)",
          "Leads (All Time)",
          "QR Scans",
          "Direct Entries",
          "Total (This Month)",
          "Surveys (Monthly)",
          "Prospects (Monthly)",
          "Leads (Monthly)",
        ],
        ...recruiters.map((r) => [
          r.fullName,
          r.role === "station_commander" ? "Station Commander" : "Recruiter",
          r.rank || "",
          r.unit || "",
          r.email,
          r.stats.allTime.total,
          r.stats.allTime.surveys,
          r.stats.allTime.prospects,
          r.stats.allTime.leads,
          r.stats.allTime.qrCodeScans,
          r.stats.allTime.directEntries,
          r.stats.monthly.total,
          r.stats.monthly.surveys,
          r.stats.monthly.prospects,
          r.stats.monthly.leads,
        ]),
      ];
      const recruiterStatsSheet = XLSX.utils.aoa_to_sheet(recruiterStatsData);
      XLSX.utils.book_append_sheet(wb, recruiterStatsSheet, "Recruiter Stats");

      // Sheet 3: Filtered Recruits Details
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
        ...filteredRecruitsForExport.map((r) => [
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
      XLSX.utils.book_append_sheet(wb, recruitsSheet, "Filtered Recruits");

      // Generate filename with current date and period
      const periodSlug = dateFilter === 'allTime' ? 'AllTime' : dateFilter === 'thisMonth' ? 'ThisMonth' : dateFilter === 'lastMonth' ? 'LastMonth' : dateFilter;
      const filename = `Station_Report_${periodSlug}_${new Date().toISOString().split("T")[0]}.xlsx`;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "survey":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "prospect":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "lead":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "contacted":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "qualified":
        return "bg-green-100 text-green-800 border-green-300";
      case "disqualified":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-green-800">
            Station Commander Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Welcome back, {user?.fullName || "Commander"} {user?.rank && `(${user.rank})`}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Date Filter and Export */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[200px] h-8 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="allTime">All Time</SelectItem>
                {/* Generate last 12 months */}
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i - 2); // Start from 2 months ago
                  const monthValue = format(date, 'yyyy-MM');
                  const monthLabel = format(date, 'MMMM yyyy');
                  return (
                    <SelectItem key={monthValue} value={monthValue}>
                      {monthLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleExportReport}
            disabled={exporting || loading}
            className="bg-blue-700 hover:bg-blue-800 text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export Filtered Report"}</span>
            <span className="sm:hidden">{exporting ? "..." : "Export"}</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="applicants" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Leads ({filteredRecruitsList.length})</span>
              <span className="sm:hidden">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="surveys" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Surveys ({filteredSurveyResponses.length})</span>
              <span className="sm:hidden">Surveys</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">

        {/* Station Totals */}
        {stationTotals && (
          <>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Station Totals - {getPeriodLabel()}</span>
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
              <Card>
                <CardHeader className="pb-2 px-2 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    Total This Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-green-800">
                    {stationTotals.monthly.total}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setFocusedRecruiterId(null); // Show all recruiters
                  setTotalsDialogType('surveys');
                  setTotalsDialogPeriod('monthly');
                  setTotalsDialogOpen(true);
                }}
              >
                <CardHeader className="pb-2 px-2 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    Survey Responses
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {stationTotals.monthly.surveys}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Feedback surveys only</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setFocusedRecruiterId(null); // Show all recruiters
                  setTotalsDialogType('leads');
                  setTotalsDialogPeriod('monthly');
                  setTotalsDialogOpen(true);
                }}
              >
                <CardHeader className="pb-2 px-2 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    Application Leads
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">
                    {stationTotals.monthly.total}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Recruit applications</p>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">All-Time Station Totals</span>
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
              <Card>
                <CardHeader className="pb-2 px-2 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    Total All-Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-gray-700">
                    {stationTotals.allTime.total}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setFocusedRecruiterId(null); // Show all recruiters
                  setTotalsDialogType('surveys');
                  setTotalsDialogPeriod('allTime');
                  setTotalsDialogOpen(true);
                }}
              >
                <CardHeader className="pb-2 px-2 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    Survey Responses
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-gray-700">
                    {stationTotals.allTime.surveys}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Feedback surveys only</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setFocusedRecruiterId(null); // Show all recruiters
                  setTotalsDialogType('leads');
                  setTotalsDialogPeriod('allTime');
                  setTotalsDialogOpen(true);
                }}
              >
                <CardHeader className="pb-2 px-2 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    Application Leads
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-gray-700">
                    {stationTotals.allTime.total}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Recruit applications</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

            {/* Recruiter Stats */}
            <Card>
              <CardHeader className="px-3 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      Recruiter Performance
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Individual statistics for each recruiter at your station • {recruiters.length} Total Recruiters
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
                  >
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                    Filter
                  </Button>
                </div>
                {showFilters && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Filter by Recruiter</label>
                        <Select value={filterRecruiter} onValueChange={setFilterRecruiter}>
                          <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="All Recruiters" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Recruiters</SelectItem>
                            {recruiters.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.fullName} {r.id === user?.id && "(You)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'leads' | 'surveys' | 'total')}>
                          <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="leads">Leads (All-Time)</SelectItem>
                            <SelectItem value="surveys">Surveys (All-Time)</SelectItem>
                            <SelectItem value="total">Total (All-Time)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Order</label>
                        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                          <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">
                              {sortBy === 'name' ? 'A-Z' : 'Least to Most'}
                            </SelectItem>
                            <SelectItem value="desc">
                              {sortBy === 'name' ? 'Z-A' : 'Most to Least'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilterRecruiter("all");
                          setSortBy("name");
                          setSortOrder("asc");
                          setShowFilters(false);
                        }}
                        className="flex items-center gap-2 text-xs sm:text-sm h-8 sm:h-9"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
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
                  <div className="space-y-3 sm:space-y-4">
                    {filteredAndSortedRecruiters.map((recruiter) => (
                      <div
                        key={recruiter.id}
                        className="border rounded-lg p-3 sm:p-4 bg-white hover:bg-gray-50 transition"
                      >
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                {recruiter.fullName}
                                {recruiter.id === user?.id && (
                                  <span className="text-xs sm:text-sm text-green-600 ml-2">(You)</span>
                                )}
                              </h3>
                              {recruiter.rank && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs">
                                  {recruiter.rank}
                                </Badge>
                              )}
                              {recruiter.role === "station_commander" && (
                                <Badge className="text-[10px] sm:text-xs bg-blue-600">
                                  Station Commander
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                              {/* Monthly Stats */}
                              <div className="bg-green-50 p-2 sm:p-3 rounded">
                                <div className="text-[10px] sm:text-xs text-gray-600 mb-1">This Month</div>
                                <div className="text-lg sm:text-2xl font-bold text-green-700">
                                  {recruiter.stats.monthly.total}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-600 mt-1">
                                  {recruiter.stats.monthly.surveys || 0} S / {recruiter.stats.monthly.leads || 0} L
                                </div>
                              </div>

                              {/* All-Time Stats */}
                              <div className="bg-blue-50 p-2 sm:p-3 rounded">
                                <div className="text-[10px] sm:text-xs text-gray-600 mb-1">All-Time</div>
                                <div className="text-lg sm:text-2xl font-bold text-blue-700">
                                  {recruiter.stats.allTime.total}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-600 mt-1">
                                  {recruiter.stats.allTime.qrScanTracking ? (
                                    <div className="space-y-0.5">
                                      <p className="leading-tight">
                                        {recruiter.stats.allTime.qrScanTracking.totalScans} scans → {recruiter.stats.allTime.qrScanTracking.totalConverted} conv
                                        {recruiter.stats.allTime.qrScanTracking.conversionRate > 0 && (
                                          <span className="ml-1 text-green-600 font-semibold">
                                            ({recruiter.stats.allTime.qrScanTracking.conversionRate}%)
                                          </span>
                                        )}
                                      </p>
                                      {(recruiter.stats.allTime.qrScanTracking.applicationsFromScans > 0 ||
                                        recruiter.stats.allTime.qrScanTracking.surveysFromScans > 0) && (
                                        <p className="text-[9px] sm:text-[11px] text-gray-500">
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

                              {/* Breakdown - Surveys */}
                              <div className="bg-gray-50 p-2 sm:p-3 rounded">
                                <div className="text-[10px] sm:text-xs text-gray-600 mb-1">Surveys</div>
                                <div className="text-lg sm:text-xl font-bold text-yellow-600">
                                  {recruiter.stats.allTime.surveys || 0}
                                </div>
                              </div>

                              {/* Breakdown - Leads */}
                              <div className="bg-gray-50 p-2 sm:p-3 rounded">
                                <div className="text-[10px] sm:text-xs text-gray-600 mb-1">Leads</div>
                                <div className="text-lg sm:text-xl font-bold text-purple-600">
                                  {recruiter.stats.allTime.leads || 0}
                                </div>
                              </div>
                            </div>
                            
                            {/* View Details Section */}
                            <div className="mt-3 space-y-2">
                              {recruiter.stats.allTime.qrScanTracking && recruiter.stats.allTime.qrScanTracking.totalConverted > 0 && (
                                <div className="text-[10px] sm:text-xs text-gray-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                  <span className="font-medium text-green-700">
                                    {recruiter.stats.allTime.qrScanTracking.totalConverted} Total Conversions:
                                  </span>{" "}
                                  {recruiter.stats.allTime.qrScanTracking.applicationsFromScans} Applications + {recruiter.stats.allTime.qrScanTracking.surveysFromScans} Survey Responses
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setFocusedRecruiterId(recruiter.id); // Focus on this specific recruiter
                                    setTotalsDialogType('leads');
                                    setTotalsDialogPeriod('allTime');
                                    setTotalsDialogOpen(true);
                                    // Load this recruiter's leads
                                    if (!recruiterLeads[recruiter.id]) {
                                      setLoadingLeads(prev => ({ ...prev, [recruiter.id]: true }));
                                      try {
                                        const data = await stationCommander.getRecruiterLeads(recruiter.id);
                                        setRecruiterLeads(prev => ({ ...prev, [recruiter.id]: data.leads }));
                                        setExpandedRecruitersInDialog(new Set([`${recruiter.id}-leads`]));
                                      } catch (err) {
                                        console.error("Failed to load leads:", err);
                                      } finally {
                                        setLoadingLeads(prev => ({ ...prev, [recruiter.id]: false }));
                                      }
                                    } else {
                                      setExpandedRecruitersInDialog(new Set([`${recruiter.id}-leads`]));
                                    }
                                  }}
                                  className="flex-1 text-xs sm:text-sm"
                                  title="View application leads only"
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  Applications ({recruiter.stats.allTime.total || 0})
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setFocusedRecruiterId(recruiter.id); // Focus on this specific recruiter
                                    setTotalsDialogType('surveys');
                                    setTotalsDialogPeriod('allTime');
                                    setTotalsDialogOpen(true);
                                    // Load this recruiter's surveys
                                    if (!recruiterSurveys[recruiter.id]) {
                                      setLoadingSurveys(prev => ({ ...prev, [recruiter.id]: true }));
                                      try {
                                        const data = await stationCommander.getRecruiterSurveys(recruiter.id);
                                        setRecruiterSurveys(prev => ({ ...prev, [recruiter.id]: data.surveys }));
                                        setExpandedRecruitersInDialog(new Set([`${recruiter.id}-surveys`]));
                                      } catch (err) {
                                        console.error("Failed to load surveys:", err);
                                      } finally {
                                        setLoadingSurveys(prev => ({ ...prev, [recruiter.id]: false }));
                                      }
                                    } else {
                                      setExpandedRecruitersInDialog(new Set([`${recruiter.id}-surveys`]));
                                    }
                                  }}
                                  className="flex-1 text-xs sm:text-sm"
                                  title="View survey responses only"
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Surveys ({recruiter.stats.allTime.surveys || 0})
                                </Button>
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

          {/* Leads Tab */}
          <TabsContent value="applicants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Leads
                </CardTitle>
                <CardDescription>
                  View all leads from your station
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recruitsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading leads...
                  </div>
                ) : filteredRecruitsList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No leads found for {getPeriodLabel()}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRecruitsList.map((recruit) => (
                      <div
                        key={recruit.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => {
                          setSelectedRecruit(recruit);
                          setRecruitDetailDialogOpen(true);
                          setIsAddingNote(false);
                          setNewNote("");
                        }}
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
                ) : filteredSurveyResponses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No survey responses found for {getPeriodLabel()}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSurveyResponses.map((response) => (
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

      {/* Station Totals Dialog */}
      <Dialog open={totalsDialogOpen} onOpenChange={setTotalsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {totalsDialogType === 'surveys' ? (
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className="text-sm sm:text-base">
                {totalsDialogType === 'surveys' ? 'Survey Responses' : 'Application Leads'} - {totalsDialogPeriod === 'monthly' ? getPeriodLabel() : 'All-Time'}
                {focusedRecruiterId && (() => {
                  const focusedRecruiter = recruiters.find(r => r.id === focusedRecruiterId);
                  return focusedRecruiter ? ` - ${focusedRecruiter.fullName}` : '';
                })()}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {focusedRecruiterId ? (
                `Showing ${totalsDialogType === 'surveys' ? 'survey responses' : 'application leads'} for this recruiter only`
              ) : (
                totalsDialogType === 'surveys' 
                  ? 'Survey feedback responses collected from QR code scans'
                  : 'Recruit application leads (excludes survey-only responses)'
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            {recruiters.map((recruiter) => {
              // Filter to show only focused recruiter if one is selected
              if (focusedRecruiterId && recruiter.id !== focusedRecruiterId) return null;
              
              const count = totalsDialogPeriod === 'monthly' 
                ? (totalsDialogType === 'surveys' ? recruiter.stats.monthly.surveys : recruiter.stats.monthly.total)
                : (totalsDialogType === 'surveys' ? recruiter.stats.allTime.surveys : recruiter.stats.allTime.total);
              
              if (count === 0) return null;
              
              const isExpanded = expandedRecruitersInDialog.has(`${recruiter.id}-${totalsDialogType}`);
              
              return (
                <Card key={recruiter.id} className="border">
                  <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                        <CardTitle className="text-sm sm:text-base">
                          {recruiter.fullName}
                          {recruiter.id === user?.id && (
                            <span className="text-xs sm:text-sm text-green-600 ml-1 sm:ml-2">(You)</span>
                          )}
                        </CardTitle>
                        {recruiter.rank && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {recruiter.rank}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs sm:text-sm bg-purple-600">
                          {count} {totalsDialogType === 'surveys' ? 'Surveys' : 'Leads'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRecruiterExpandedInDialog(recruiter.id, totalsDialogType || 'leads')}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                      {isExpanded && (
                    <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                      {totalsDialogType === 'surveys' ? (
                        <>
                          {loadingSurveys[recruiter.id] ? (
                            <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">Loading surveys...</div>
                          ) : (() => {
                            const allSurveys = recruiterSurveys[recruiter.id] || [];
                            const now = new Date();
                            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                            const filteredSurveys = totalsDialogPeriod === 'monthly'
                              ? allSurveys.filter(s => new Date(s.createdAt) >= monthStart)
                              : allSurveys;
                            
                            return filteredSurveys.length === 0 ? (
                              <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">No surveys found</div>
                            ) : (
                              <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                                {filteredSurveys.map((survey) => (
                                <div
                                  key={survey.id}
                                  className="p-2 sm:p-3 border rounded-lg bg-white"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                                    <div className="font-medium text-xs sm:text-sm">{survey.name}</div>
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                                            survey.rating >= star
                                              ? "text-yellow-500 fill-yellow-500"
                                              : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 break-words">{survey.email} • {survey.phone}</div>
                                  {survey.feedback && (
                                    <div className="mt-2 text-[10px] sm:text-xs text-gray-700 bg-gray-50 p-2 rounded break-words">
                                      "{survey.feedback}"
                                    </div>
                                  )}
                                  {survey.createdAt && (
                                    <div className="text-[10px] sm:text-xs text-gray-500 mt-2">
                                      {format(new Date(survey.createdAt), "MMM d, yyyy")}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          {loadingLeads[recruiter.id] ? (
                            <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">Loading leads...</div>
                          ) : (() => {
                            const allLeads = recruiterLeads[recruiter.id] || [];
                            const now = new Date();
                            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                            const filteredLeads = totalsDialogPeriod === 'monthly'
                              ? allLeads.filter(l => new Date(l.submittedAt) >= monthStart)
                              : allLeads;
                            
                            return filteredLeads.length === 0 ? (
                              <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">No leads found</div>
                            ) : (
                              <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                                {filteredLeads.map((lead) => (
                                <div
                                  key={lead.id}
                                  className="p-2 sm:p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setSelectedRecruit(lead);
                                    setRecruitDetailDialogOpen(true);
                                    setIsAddingNote(false);
                                    setNewNote("");
                                  }}
                                >
                                  <div className="font-medium text-xs sm:text-sm">{lead.firstName} {lead.lastName}</div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 break-words">{lead.email} • {lead.phone}</div>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <Badge variant="outline" className={`text-[10px] sm:text-xs ${getStatusColor(lead.status)}`}>
                                      {lead.status}
                                    </Badge>
                                    {lead.submittedAt && (
                                      <span className="text-[10px] sm:text-xs text-gray-500">
                                        {format(new Date(lead.submittedAt), "MMM d, yyyy")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            );
                          })()}
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
            {recruiters.filter(r => {
              const count = totalsDialogPeriod === 'monthly' 
                ? (totalsDialogType === 'surveys' ? r.stats.monthly.surveys : r.stats.monthly.total)
                : (totalsDialogType === 'surveys' ? r.stats.allTime.surveys : r.stats.allTime.total);
              return count === 0;
            }).length > 0 && (
              <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                {recruiters.filter(r => {
                  const count = totalsDialogPeriod === 'monthly' 
                    ? (totalsDialogType === 'surveys' ? r.stats.monthly.surveys : r.stats.monthly.total)
                    : (totalsDialogType === 'surveys' ? r.stats.allTime.surveys : r.stats.allTime.total);
                  return count === 0;
                }).length} recruiter{recruiters.filter(r => {
                  const count = totalsDialogPeriod === 'monthly' 
                    ? (totalsDialogType === 'surveys' ? r.stats.monthly.surveys : r.stats.monthly.total)
                    : (totalsDialogType === 'surveys' ? r.stats.allTime.surveys : r.stats.allTime.total);
                  return count === 0;
                }).length !== 1 ? 's' : ''} with no {totalsDialogType === 'surveys' ? 'surveys' : 'applications'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recruit Detail Dialog */}
      <Dialog open={recruitDetailDialogOpen} onOpenChange={setRecruitDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecruit && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedRecruit.firstName} {selectedRecruit.lastName}
                </DialogTitle>
                <DialogDescription>
                  Application submitted on {selectedRecruit.submittedAt && format(new Date(selectedRecruit.submittedAt), "MMMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Status Badge */}
                <div className="flex gap-2">
                  <Badge variant="outline" className={`${getStatusColor(selectedRecruit.status)}`}>
                    {selectedRecruit.status}
                  </Badge>
                  <Badge variant="outline" className={selectedRecruit.source === "qr_code" ? "bg-blue-50" : "bg-purple-50"}>
                    {selectedRecruit.source === "qr_code" ? "🎯 QR Code" : "📝 Direct Entry"}
                  </Badge>
                </div>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <a href={`mailto:${selectedRecruit.email}`} className="text-blue-600 hover:underline">
                        {selectedRecruit.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <a href={`tel:${selectedRecruit.phone}`} className="text-blue-600 hover:underline">
                        {selectedRecruit.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{selectedRecruit.address}, {selectedRecruit.city}, {selectedRecruit.state} {selectedRecruit.zipCode}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Additional Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedRecruit.dateOfBirth && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-gray-700">Date of Birth:</span>
                        <span className="text-sm">{new Date(selectedRecruit.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedRecruit.educationLevel && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-gray-700">Education:</span>
                        <span className="text-sm capitalize">{selectedRecruit.educationLevel.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {selectedRecruit.hasDriversLicense && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-gray-700">Driver's License:</span>
                        <span className="text-sm">{selectedRecruit.hasDriversLicense === 'yes' ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                    {selectedRecruit.hasPriorService && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-gray-700">Prior Service:</span>
                        <span className="text-sm">{selectedRecruit.hasPriorService === 'yes' ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                    {selectedRecruit.priorServiceBranch && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-gray-700">Branch:</span>
                        <span className="text-sm">{selectedRecruit.priorServiceBranch}</span>
                      </div>
                    )}
                    {selectedRecruit.preferredMOS && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-gray-700">Preferred MOS:</span>
                        <span className="text-sm">{selectedRecruit.preferredMOS}</span>
                      </div>
                    )}
                    {selectedRecruit.availability && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm font-medium text-gray-700">Availability:</span>
                        <span className="text-sm capitalize">{selectedRecruit.availability.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes Section */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-lg">Recruiter Notes History</CardTitle>
                    <Button
                      variant={isAddingNote ? "outline" : "default"}
                      size="sm"
                      onClick={() => setIsAddingNote(!isAddingNote)}
                    >
                      {isAddingNote ? "Cancel" : "Add Note"}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isAddingNote && (
                      <div className="mb-4 space-y-2">
                        <Textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a new note about your interaction with this recruit (phone calls, meetings, concerns, follow-up tasks, etc.)"
                          className="min-h-[100px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewNote("");
                              setIsAddingNote(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => addNoteMutation.mutate({ id: selectedRecruit.id, note: newNote })}
                            disabled={!newNote.trim() || addNoteMutation.isPending}
                          >
                            Save Note
                          </Button>
                        </div>
                      </div>
                    )}

                    {(() => {
                      // Parse notes history
                      let notesHistory: Array<{ note: string; authorName: string; timestamp: string }> = [];
                      try {
                        if (selectedRecruit.additionalNotes) {
                          const parsed = JSON.parse(selectedRecruit.additionalNotes);
                          notesHistory = Array.isArray(parsed) ? parsed : [];
                        }
                      } catch (e) {
                        // Old format - single note
                        if (selectedRecruit.additionalNotes && selectedRecruit.additionalNotes.trim()) {
                          notesHistory = [{
                            note: selectedRecruit.additionalNotes,
                            authorName: "Unknown",
                            timestamp: new Date().toISOString()
                          }];
                        }
                      }

                      return (
                        <div className="space-y-3">
                          {notesHistory.length > 0 ? (
                            [...notesHistory].reverse().map((entry, index) => (
                              <div key={index} className="border-l-2 border-blue-500 pl-3 py-1">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <span className="text-xs font-medium text-blue-600">
                                    {entry.authorName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {entry.note}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No notes yet. Click "Add Note" to add notes about your interactions with this recruit.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Close Button */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setRecruitDetailDialogOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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

