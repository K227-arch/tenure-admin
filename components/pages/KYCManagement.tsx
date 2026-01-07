'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Download,
  Eye,
  AlertTriangle,
  Users,
  Calendar,
  RefreshCw,
  Database
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// KYC Data interface
interface KYCData {
  id: string;
  userId: string;
  userName: string;
  email: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  documents: any;
  riskLevel: string;
  notes: string | null;
  rejectionReason?: string | null;
  reviewer?: {
    id: number;
    name: string;
    email: string;
  };
  sumsubApplicantId?: string | null;
  sumsubScore?: number | null;
}

interface KYCStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  underReview: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Fetch KYC data from database only
async function fetchKYCData(filters?: { status?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`/api/kyc?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch KYC data');
  }
  return response.json();
}

// Fetch real-time KYC stats from database
async function fetchKYCStats() {
  const response = await fetch('/api/kyc?stats_only=true');
  if (!response.ok) {
    throw new Error('Failed to fetch KYC stats');
  }
  return response.json();
}

const getStatusColor = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'verified': 
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in review':
    case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'verified':
    case 'approved': return <CheckCircle className="h-4 w-4" />;
    case 'rejected': return <XCircle className="h-4 w-4" />;
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'in review':
    case 'under_review': return <AlertTriangle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getStatusDisplayText = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'verified':
    case 'approved': return 'verified';
    case 'in review':
    case 'under_review': return 'in review';
    default: return status.replace('_', ' ').toLowerCase();
  }
};

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function KYCManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [kycData, setKycData] = useState<KYCData[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [stats, setStats] = useState<KYCStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    underReview: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<KYCData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load KYC data from database
  const loadKYCData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both data and real-time stats
      const [dataResponse, statsResponse] = await Promise.all([
        fetchKYCData({ status: statusFilter, page: currentPage, limit: pageSize }),
        fetchKYCStats()
      ]);
      
      if (!dataResponse.success) {
        setError(dataResponse.error || 'Failed to load KYC data');
        setKycData([]);
        setPagination({
          page: 1,
          limit: pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        setStats({ total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 });
        return;
      }
      
      // Transform the data to match our interface
      const transformedData = dataResponse.data.map((record: any) => ({
        id: record.id,
        userId: record.userId,
        userName: record.userName || 'Unknown',
        email: record.email || 'Unknown',
        status: record.status,
        submittedAt: record.submittedAt,
        reviewedAt: record.reviewedAt,
        documents: record.documents || [],
        riskLevel: record.riskLevel || 'low',
        notes: record.notes,
        rejectionReason: record.rejectionReason,
        reviewer: record.reviewer,
        sumsubApplicantId: record.sumsub?.applicantId,
        sumsubScore: record.sumsub?.score,
      }));
      
      setKycData(transformedData);
      setPagination(dataResponse.pagination || {
        page: 1,
        limit: pageSize,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      
      // Use real-time stats from the dedicated stats endpoint
      if (statsResponse.success) {
        setStats(statsResponse.stats || { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 });
      } else {
        // Fallback to stats from data response
        setStats(dataResponse.stats || { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KYC data');
      toast.error('Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadKYCData();
  }, [statusFilter, currentPage, pageSize]);

  // Reset to first page when status filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // View KYC details
  const viewKycDetails = (kyc: KYCData) => {
    setSelectedKyc(kyc);
    setShowDetailsModal(true);
  };

  // Filter data based on search term
  const filteredData = kycData.filter(item => {
    const matchesSearch = item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading && kycData.length === 0) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading KYC data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadKYCData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            KYC Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage customer identity verification and compliance requirements
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={loadKYCData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              In Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or KYC ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              disabled={loading}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* KYC Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            KYC Submissions ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">KYC ID</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Risk Level</th>
                  <th className="text-left py-3 px-4 font-medium">Submitted</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{item.userName}</div>
                        <div className="text-sm text-muted-foreground">{item.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">{item.id}</code>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${getStatusColor(item.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(item.status)}
                        {getStatusDisplayText(item.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getRiskLevelColor(item.riskLevel)}>
                        {item.riskLevel.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => viewKycDetails(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No KYC records found</p>
                {searchTerm && (
                  <p className="text-sm">Try adjusting your search criteria</p>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-input bg-background rounded text-sm"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={!pagination.hasPreviousPage}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                  >
                    Previous
                  </Button>
                  
                  <span className="px-3 py-1 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={!pagination.hasNextPage}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>KYC Details</DialogTitle>
          </DialogHeader>
          {selectedKyc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">User</label>
                  <p className="text-sm text-muted-foreground">{selectedKyc.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedKyc.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedKyc.status)}>
                      {getStatusDisplayText(selectedKyc.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Risk Level</label>
                  <div className="mt-1">
                    <Badge className={getRiskLevelColor(selectedKyc.riskLevel)}>
                      {selectedKyc.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Submitted</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedKyc.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedKyc.documents && (
                <div>
                  <label className="text-sm font-medium">Documents</label>
                  <div className="mt-1">
                    <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(selectedKyc.documents, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedKyc.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {selectedKyc.notes}
                  </p>
                </div>
              )}

              {selectedKyc.rejectionReason && (
                <div>
                  <label className="text-sm font-medium">Rejection Reason</label>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {selectedKyc.rejectionReason}
                  </p>
                </div>
              )}

              {selectedKyc.reviewer && (
                <div>
                  <label className="text-sm font-medium">Reviewed By</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedKyc.reviewer.name} ({selectedKyc.reviewer.email})
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}