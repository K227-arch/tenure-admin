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
  FileText,
  Calendar,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// KYC Data interface
interface KYCData {
  id: string;
  userId: string;
  userName: string;
  email: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  documents: string[];
  riskLevel: string;
  notes: string;
  rejectionReason?: string;
  reviewer?: {
    id: number;
    name: string;
    email: string;
  };
}

interface KYCStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  underReview: number;
}

// Fetch KYC data from API
async function fetchKYCData(filters?: { status?: string; limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const response = await fetch(`/api/kyc?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch KYC data');
  }
  return response.json();
}

// Update KYC status
async function updateKYCStatus(kycId: string, status: string, notes?: string, rejectionReason?: string) {
  const response = await fetch('/api/kyc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update_status',
      kycId,
      status,
      notes,
      rejectionReason,
      reviewerId: 1, // TODO: Get actual admin ID from session
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update KYC status');
  }
  return response.json();
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle className="h-4 w-4" />;
    case 'rejected': return <XCircle className="h-4 w-4" />;
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'under_review': return <AlertTriangle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function KYCManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kycData, setKycData] = useState<KYCData[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);
  const [stats, setStats] = useState<KYCStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    underReview: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup KYC tables and sample data
  const setupKYCData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/kyc/setup', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        loadKYCData(); // Reload data after setup
      } else {
        toast.error(result.message || 'Setup failed');
      }
    } catch (err) {
      toast.error('Failed to setup KYC data');
    } finally {
      setLoading(false);
    }
  };

  // Load available statuses from lookup table
  const loadAvailableStatuses = async () => {
    try {
      const response = await fetch('/api/kyc/statuses');
      const result = await response.json();
      if (result.success) {
        setAvailableStatuses(result.data);
      }
    } catch (err) {
      console.error('Failed to load KYC statuses:', err);
    }
  };

  // Load KYC data
  const loadKYCData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchKYCData({ status: statusFilter });
      
      if (!response.success && response.error) {
        setError(response.error);
        setKycData([]);
        setStats({ total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 });
        return;
      }
      
      setKycData(response.data || []);
      setStats(response.stats || { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KYC data');
      toast.error('Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when status filter changes
  useEffect(() => {
    loadAvailableStatuses();
    loadKYCData();
  }, [statusFilter]);

  // Handle status update
  const handleStatusUpdate = async (kycId: string, newStatus: string) => {
    try {
      await updateKYCStatus(kycId, newStatus);
      toast.success(`KYC status updated to ${newStatus}`);
      loadKYCData(); // Reload data
    } catch (err) {
      toast.error('Failed to update KYC status');
    }
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
            <div className="flex gap-2 justify-center">
              <Button onClick={loadKYCData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>

            </div>
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

          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={async () => {
              try {
                const response = await fetch('/api/kyc/check-schema');
                const result = await response.json();
                console.log('Database Schema:', result);
                toast.success('Check console for database schema info');
              } catch (err) {
                toast.error('Failed to check schema');
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Check DB Schema
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
              Approved
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
              Under Review
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
              {availableStatuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name.charAt(0).toUpperCase() + status.name.slice(1)}
                </option>
              ))}
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
                  <th className="text-left py-3 px-4 font-medium">Documents</th>
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
                      <code className="text-sm bg-muted px-2 py-1 rounded">{item.id}</code>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${getStatusColor(item.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(item.status)}
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${getRiskLevelColor(item.riskLevel)} w-fit`}>
                        {item.riskLevel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.documents.map((doc, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {doc.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {item.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleStatusUpdate(item.id, 'approved')}
                              disabled={loading}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleStatusUpdate(item.id, 'rejected')}
                              disabled={loading}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}