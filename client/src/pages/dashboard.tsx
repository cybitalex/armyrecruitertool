import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Recruit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Eye, Filter, Plus, Search, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Footer } from "@/components/footer";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Prevent body scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const { data: recruits = [], isLoading } = useQuery<Recruit[]>({
    queryKey: ["/api/recruits"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/recruits/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruits"] });
      toast({
        title: "Application Deleted",
        description: "The recruit application has been removed.",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportToCSV = async () => {
    if (!recruits.length) return;

    try {
      const response = await fetch("/api/recruits/export/csv");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `army-recruits-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Recruit data has been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const filteredRecruits = recruits.filter((recruit) => {
    const matchesSearch =
      searchQuery === "" ||
      recruit.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recruit.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recruit.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || recruit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "outline" | "destructive";
        label: string;
      }
    > = {
      pending: { variant: "secondary", label: "Pending" },
      reviewing: { variant: "default", label: "In Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
    };

    const config = variants[status] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <div className="h-screen bg-army-green flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="max-w-7xl mx-auto w-full px-4 py-4 flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Header Section - Fixed */}
            <div className="shrink-0 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-army-gold mb-1">
                    Recruitment Dashboard
                  </h1>
                  <p className="text-sm text-army-tan">
                    Manage and review recruit applications
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    disabled={!filteredRecruits.length}
                    data-testid="button-export"
                    className="border-army-gold text-army-gold hover:bg-army-gold hover:text-army-black"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={() => navigate("/intake")}
                    data-testid="button-newApplication"
                    className="bg-army-gold text-army-black hover:bg-army-gold/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Application
                  </Button>
                </div>
              </div>

              <Card className="p-4 md:p-6 bg-army-black border-army-field01">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div data-testid="metric-total">
                    <div
                      className="text-xl md:text-2xl font-bold text-army-gold"
                      data-testid="count-total"
                    >
                      {recruits.length}
                    </div>
                    <div className="text-xs md:text-sm text-army-tan">
                      Total Applications
                    </div>
                  </div>
                  <div data-testid="metric-pending">
                    <div
                      className="text-xl md:text-2xl font-bold text-army-gold"
                      data-testid="count-pending"
                    >
                      {recruits.filter((r) => r.status === "pending").length}
                    </div>
                    <div className="text-xs md:text-sm text-army-tan">
                      Pending Review
                    </div>
                  </div>
                  <div data-testid="metric-approved">
                    <div
                      className="text-xl md:text-2xl font-bold text-army-gold"
                      data-testid="count-approved"
                    >
                      {recruits.filter((r) => r.status === "approved").length}
                    </div>
                    <div className="text-xs md:text-sm text-army-tan">
                      Approved
                    </div>
                  </div>
                  <div data-testid="metric-reviewing">
                    <div
                      className="text-xl md:text-2xl font-bold text-army-gold"
                      data-testid="count-reviewing"
                    >
                      {recruits.filter((r) => r.status === "reviewing").length}
                    </div>
                    <div className="text-xs md:text-sm text-army-tan">
                      In Review
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Table Section - Scrollable */}
            <Card className="flex-1 min-h-0 flex flex-col bg-army-black border-army-field01 overflow-hidden">
              <div className="p-4 md:p-6 shrink-0">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                  <div className="w-[180px]">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger data-testid="select-statusFilter">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">In Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-4 md:px-6 pb-4 md:pb-6">
                {isLoading ? (
                  <div className="text-center py-12 text-army-tan">
                    Loading applications...
                  </div>
                ) : filteredRecruits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-army-tan mb-4">
                      {searchQuery || statusFilter !== "all"
                        ? "No applications match your filters"
                        : "No applications yet"}
                    </div>
                    {!searchQuery && statusFilter === "all" && (
                      <Button
                        onClick={() => navigate("/intake")}
                        data-testid="button-createFirst"
                        className="bg-army-gold text-army-black hover:bg-army-gold/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Application
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-army-field01 hover:bg-army-field01/20">
                          <TableHead className="text-army-gold">Name</TableHead>
                          <TableHead className="text-army-gold">
                            Email
                          </TableHead>
                          <TableHead className="text-army-gold">
                            Phone
                          </TableHead>
                          <TableHead className="text-army-gold">
                            Location
                          </TableHead>
                          <TableHead className="text-army-gold">
                            Status
                          </TableHead>
                          <TableHead className="text-army-gold">
                            Submitted
                          </TableHead>
                          <TableHead className="text-right text-army-gold">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecruits.map((recruit) => (
                          <TableRow
                            key={recruit.id}
                            data-testid={`row-recruit-${recruit.id}`}
                            className="border-army-field01 hover:bg-army-field01/10"
                          >
                            <TableCell className="font-medium text-army-tan">
                              {recruit.firstName} {recruit.lastName}
                            </TableCell>
                            <TableCell className="text-army-tan">
                              {recruit.email}
                            </TableCell>
                            <TableCell className="text-army-tan">
                              {recruit.phone}
                            </TableCell>
                            <TableCell className="text-army-tan">
                              {recruit.city}, {recruit.state}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(recruit.status)}
                            </TableCell>
                            <TableCell className="text-army-tan">
                              {new Date(
                                recruit.submittedAt
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    navigate(`/recruits/${recruit.id}`)
                                  }
                                  data-testid={`button-view-${recruit.id}`}
                                  className="text-army-gold hover:bg-army-field01/20"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteId(recruit.id)}
                                  data-testid={`button-delete-${recruit.id}`}
                                  className="text-army-gold hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="shrink-0">
          <Footer />
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-army-black border-army-field01">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-army-gold">
              Delete Application
            </AlertDialogTitle>
            <AlertDialogDescription className="text-army-tan">
              Are you sure you want to delete this recruit application? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-testid="button-cancelDelete"
              className="border-army-field01 text-army-tan hover:bg-army-field01/20"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmDelete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
