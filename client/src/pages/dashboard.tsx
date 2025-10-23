import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Recruit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      const response = await fetch('/api/recruits/export/csv');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `army-recruits-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Recruit data has been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const filteredRecruits = recruits.filter(recruit => {
    const matchesSearch = searchQuery === "" || 
      recruit.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recruit.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recruit.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || recruit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive", label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      reviewing: { variant: "default", label: "In Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
    };

    const config = variants[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Recruitment Dashboard</h1>
              <p className="text-muted-foreground">Manage and review recruit applications</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={exportToCSV} disabled={!filteredRecruits.length} data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => navigate("/intake")} data-testid="button-newApplication">
                <Plus className="w-4 h-4 mr-2" />
                New Application
              </Button>
            </div>
          </div>

          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div data-testid="metric-total">
                <div className="text-2xl font-bold text-foreground" data-testid="count-total">{recruits.length}</div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
              </div>
              <div data-testid="metric-pending">
                <div className="text-2xl font-bold text-foreground" data-testid="count-pending">
                  {recruits.filter(r => r.status === "pending").length}
                </div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </div>
              <div data-testid="metric-approved">
                <div className="text-2xl font-bold text-foreground" data-testid="count-approved">
                  {recruits.filter(r => r.status === "approved").length}
                </div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div data-testid="metric-reviewing">
                <div className="text-2xl font-bold text-foreground" data-testid="count-reviewing">
                  {recruits.filter(r => r.status === "reviewing").length}
                </div>
                <div className="text-sm text-muted-foreground">In Review</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading applications...</div>
          ) : filteredRecruits.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" ? "No applications match your filters" : "No applications yet"}
              </div>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => navigate("/intake")} data-testid="button-createFirst">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Application
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecruits.map((recruit) => (
                    <TableRow key={recruit.id} data-testid={`row-recruit-${recruit.id}`}>
                      <TableCell className="font-medium">
                        {recruit.firstName} {recruit.lastName}
                      </TableCell>
                      <TableCell>{recruit.email}</TableCell>
                      <TableCell>{recruit.phone}</TableCell>
                      <TableCell>
                        {recruit.city}, {recruit.state}
                      </TableCell>
                      <TableCell>{getStatusBadge(recruit.status)}</TableCell>
                      <TableCell>{new Date(recruit.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/recruits/${recruit.id}`)}
                            data-testid={`button-view-${recruit.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(recruit.id)}
                            data-testid={`button-delete-${recruit.id}`}
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
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recruit application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelDelete">Cancel</AlertDialogCancel>
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
    </div>
  );
}
