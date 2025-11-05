'use client'

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

async function fetchTransactions(page = 1, search = '', status = '', type = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
  });
  
  if (search) params.append('search', search);
  if (status && status !== 'all') params.append('status', status);
  if (type && type !== 'all') params.append('type', type);
  
  const response = await fetch(`/api/transactions?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
}

async function fetchTransactionStats() {
  const response = await fetch('/api/analytics/financial');
  if (!response.ok) {
    throw new Error('Failed to fetch transaction stats');
  }
  return response.json();
}

export default function TransactionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: transactionData, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', currentPage, searchTerm, statusFilter, typeFilter],
    queryFn: () => fetchTransactions(currentPage, searchTerm, statusFilter, typeFilter),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const { data: statsData } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: fetchTransactionStats,
    refetchInterval: 60000, // Refetch every minute
  });

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Transactions refreshed!");
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon!");
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Transaction Management</h1>
          <p className="text-muted-foreground">Loading real-time transaction data from Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Transaction Management</h1>
          <p className="text-muted-foreground text-red-500">Error loading transactions. Please check your database connection.</p>
        </div>
      </div>
    );
  }

  const transactions = transactionData?.transactions || [];
  const pagination = transactionData?.pagination || { page: 1, pages: 1, total: 0 };
  
  // Calculate stats from current data
  const totalAmount = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const failedTransactions = transactions.filter(t => t.status === 'failed').length;

  const stats = [
    {
      title: "Total Transactions",
      value: pagination.total.toLocaleString(),
      change: `${transactions.length} on this page`,
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Total Amount",
      value: `$${totalAmount.toLocaleString()}`,
      change: "Current page total",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Completed",
      value: completedTransactions.toString(),
      change: `${((completedTransactions / transactions.length) * 100).toFixed(1)}% success rate`,
      trend: "up",
      icon: CheckCircle,
    },
    {
      title: "Pending/Failed",
      value: (pendingTransactions + failedTransactions).toString(),
      change: `${pendingTransactions} pending, ${failedTransactions} failed`,
      trend: failedTransactions > 0 ? "down" : "up",
      icon: failedTransactions > 0 ? XCircle : Clock,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Transaction Management
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage all financial transactions in real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="shadow-card hover:shadow-elevated transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="flex items-center mt-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-success mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                )}
                <span
                  className={`text-sm ${
                    stat.trend === "up" ? "text-success" : "text-destructive"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> 
     {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name, email, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="payout">Payout</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="w-full md:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Transactions</span>
            <Badge variant="secondary" className="ml-2">
              {pagination.total} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {transaction.users?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {transaction.users?.name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.users?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {transaction.type || 'payment'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {transaction.currency || '$'} {parseFloat(transaction.amount || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "completed" ? "default" : 
                          transaction.status === "failed" ? "destructive" : 
                          transaction.status === "pending" ? "secondary" : "outline"
                        }
                        className={
                          transaction.status === "completed" ? "bg-success text-success-foreground" :
                          transaction.status === "failed" ? "bg-destructive" :
                          transaction.status === "pending" ? "bg-warning text-warning-foreground" : ""
                        }
                      >
                        {transaction.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {transaction.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                        {transaction.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {transaction.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {transaction.description || 'No description'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(transaction.created_at).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info(`Transaction ID: ${transaction.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No transactions found.</p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search filters or check back later.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total transactions)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}