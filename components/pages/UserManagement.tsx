'use client'

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Filter, Eye, Mail, Phone, User, Clock, Download, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { exportToCSV, exportToPDF, formatDataForExport } from "@/lib/utils/export";

async function fetchUsers(page = 1, search = '', status = '', role = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '10',
    ...(search && { search }),
    ...(status && status !== 'all' && { status }),
    ...(role && role !== 'all' && { role })
  });
  
  const response = await fetch(`/api/users?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

// create user removed

async function updateUser(id: string, userData: any) {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
}

async function deleteUser(id: string) {
  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  return response.json();
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
// Dialog states
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'Pending',
    image: '',
    email_verified: false,
    two_factor_enabled: false
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', currentPage, searchTerm, statusFilter, roleFilter],
    queryFn: () => fetchUsers(currentPage, searchTerm, statusFilter, roleFilter),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Realtime: refresh when users table changes
  useEffect(() => {
    const channel = supabase
      .channel('realtime-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Mutations

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      toast.success('User updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete user: ' + error.message);
    },
  });

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      status: 'Pending',
      image: '',
      email_verified: false,
      two_factor_enabled: false
    });
  };



  const handleSuspend = (userId: string) => {
    updateMutation.mutate({ id: userId, data: { status: 'suspended' } });
  };

  const handleBlock = (userId: string) => {
    updateMutation.mutate({ id: userId, data: { status: 'blocked' } });
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      status: user.status || 'Pending',
      image: user.image || '',
      email_verified: user.email_verified || false,
      two_factor_enabled: user.two_factor_enabled || false
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedUser) return;
    updateMutation.mutate({ id: selectedUser.id, data: formData });
  };

  const handleDelete = (userId: string) => {
    deleteMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">Loading users from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground text-red-500">Error loading users. Please check your Supabase connection.</p>
        </div>
      </div>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            User Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all members in your system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const exportData = formatDataForExport(users, ['password', 'hash', 'salt']);
              exportToCSV(exportData, 'users');
              toast.success('Users exported to CSV!');
            }}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              exportToPDF('users-table-container', 'Users Report');
              toast.success('Generating PDF...');
            }}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="w-full md:w-auto">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="shadow-card" id="users-table-container">
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-right">Membership</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? users.map((user) => {
                  // Since we don't have last_active, we'll show status based on recent updates
                  const isRecentlyActive = user.updated_at && 
                    (new Date().getTime() - new Date(user.updated_at).getTime()) < 24 * 60 * 60 * 1000; // 24 hours
                  
                  return (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewUser(user)}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          {isRecentlyActive && (
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.name || 'No Name'}</div>
                          <div className="text-sm text-muted-foreground">{user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className={`text-xs px-2 py-1 rounded ${user.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.email_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "Active" ? "default" : 
                          user.status === "Suspended" ? "destructive" : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                        <div>
                          {isRecentlyActive ? (
                            <span className="text-green-600 font-medium">Recently Active</span>
                          ) : (
                            <span className="text-muted-foreground">
                              Updated: {new Date(user.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {user.two_factor_enabled && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">2FA</span>
                        )}
                        <span className="text-sm">Member</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(user);
                        }}
                      >
                        Edit Status
                      </Button>
                    </TableCell>
                  </TableRow>
                )}) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No users found. Check your database connection or search criteria.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total users)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user status. Only the status field can be modified for security reasons.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                readOnly
                className="col-span-3 bg-muted cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                readOnly
                className="col-span-3 bg-muted cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email_verified" className="text-right">Email Verified</Label>
              <div className="col-span-3">
                <Badge variant={formData.email_verified ? "default" : "secondary"}>
                  {formData.email_verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-two_factor_enabled" className="text-right">2FA Enabled</Label>
              <div className="col-span-3">
                <Badge variant={formData.two_factor_enabled ? "default" : "secondary"}>
                  {formData.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating Status...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser?.image} alt={selectedUser?.name} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{selectedUser?.name || 'Unknown User'}</div>
                <div className="text-sm text-muted-foreground">{selectedUser?.email}</div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Complete user profile and account information
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-sm font-medium">{selectedUser.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                    <p className="text-sm font-mono">{selectedUser.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground border-b pb-2">Account Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={
                      selectedUser.status === "active" ? "default" : 
                      selectedUser.status === "suspended" ? "destructive" : "secondary"
                    }>
                      {selectedUser.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Verified</Label>
                    <Badge variant={selectedUser.email_verified ? "default" : "secondary"}>
                      {selectedUser.email_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Two-Factor Auth</Label>
                    <Badge variant={selectedUser.two_factor_enabled ? "default" : "secondary"}>
                      {selectedUser.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Member Type</Label>
                    <p className="text-sm">{selectedUser.membership_type || 'Standard'}</p>
                  </div>
                </div>
              </div>

              {/* Location & Personal Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground border-b pb-2">Location & Personal Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="text-sm">{selectedUser.address || 'Not provided'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                      <p className="text-sm">{selectedUser.role || 'User'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Auth User ID</Label>
                      <p className="text-sm font-mono text-xs">{selectedUser.auth_user_id || 'Not linked'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground border-b pb-2">Account Timeline</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Joined Date</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Active</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedUser.last_active ? new Date(selectedUser.last_active).toLocaleDateString() : 'Never'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsUserDetailsOpen(false);
              handleEdit(selectedUser);
            }}>
              <Eye className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
