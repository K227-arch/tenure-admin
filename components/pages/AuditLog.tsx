'use client'

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

async function fetchAuditLogs(page = 1, search = '', action = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '50',
    ...(search && { search }),
    ...(action && action !== 'all' && { action })
  });
  
  const response = await fetch(`/api/audit-logs?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }
  return response.json();
}
export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', currentPage, searchTerm, actionFilter],
    queryFn: () => fetchAuditLogs(currentPage, searchTerm, actionFilter),
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Realtime: refresh audit logs when user_audit_logs changes
  useEffect(() => {
    const channel = supabase
      .channel('realtime-audit-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_audit_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Audit Log</h1>
          <p className="text-muted-foreground">Loading audit logs from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Audit Log</h1>
          <p className="text-muted-foreground text-red-500">Error loading audit logs. Please check your database connection.</p>
        </div>
      </div>
    );
  }

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "info":
        return "bg-accent";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Audit Log</h1>
        <p className="text-muted-foreground">
          Track all major member status changes and system events.
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="Member Sign-up">Sign-up</SelectItem>
                <SelectItem value="Payment Received">Payment</SelectItem>
                <SelectItem value="Payment Default">Default</SelectItem>
                <SelectItem value="Payout Triggered">Payout</SelectItem>
                <SelectItem value="Member Re-joining">Re-joining</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {logs.length}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {logs.filter((l) => l.status === "success").length}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {logs.filter((l) => l.status === "warning").length}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm">Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {logs.filter((l) => l.status === "info").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Event Log ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.details}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No audit logs found.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
