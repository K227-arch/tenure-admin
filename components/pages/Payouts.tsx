'use client'

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trophy, CheckCircle, XCircle, AlertCircle, Play, User, Mail, Phone, Calendar, CreditCard, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

async function fetchPayoutData() {
  const [payoutsRes, queueRes] = await Promise.allSettled([
    fetch('/api/payouts'),
    fetch('/api/membership-queue')
  ]);

  return {
    payouts: payoutsRes.status === 'fulfilled' ? await payoutsRes.value.json() : { payouts: [] },
    queue: queueRes.status === 'fulfilled' ? await queueRes.value.json() : { members: [] },
  };
}

export default function Payouts() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [tenureFilter, setTenureFilter] = useState<'all' | 'monthly' | 'yearly'>('all');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['payout-data'],
    queryFn: fetchPayoutData,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  // Real-time subscription for membership queue and payment changes
  useEffect(() => {
    const channel = supabase
      .channel('payout-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'membership_queue' },
        (payload) => {
          console.log('Membership queue change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['payout-data'] });
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_payments' },
        (payload) => {
          console.log('Payment change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['payout-data'] });
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payout_management' },
        (payload) => {
          console.log('Payout management change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['payout-data'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleTriggerPayout = () => {
    setIsProcessing(true);
    // Simulate payout processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Payout calculation completed successfully!");
    }, 2000);
  };

  // Extract eligible members from queue data
  const eligibleMembers = data?.queue?.members || [];
  const payoutHistory = data?.payouts?.payouts || [];
  
  // Calculate monthly and yearly eligible members
  const monthlyEligible = eligibleMembers.filter(m => 
    m.tenure_type === 'monthly' || m.billing_cycle?.toLowerCase() === 'monthly'
  );
  const yearlyEligible = eligibleMembers.filter(m => 
    m.tenure_type === 'yearly' || m.billing_cycle?.toLowerCase() === 'yearly' || m.months_completed >= 12
  );
  
  // Extract stats from API
  const totalPayoutPool = data?.payouts?.stats?.totalPayoutPool || 0;
  const nextPayoutDate = data?.payouts?.stats?.nextPayoutDate || 'TBD';
  const monthsUntilPayout = data?.payouts?.stats?.monthsUntilPayout || 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Payout Management</h1>
          <p className="text-muted-foreground">Loading payout data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Payout Management</h1>
          <p className="text-muted-foreground text-red-500">Error loading payout data. Please check your database connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Payout Management
          </h1>
          <p className="text-muted-foreground">
            Manage monthly and yearly (12-month) tenure payouts and winner selection.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" className="bg-gradient-primary">
              <Play className="h-5 w-5 mr-2" />
              Trigger Payout Calculation
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Payout Calculation</AlertDialogTitle>
              <AlertDialogDescription>
                This will calculate the 12-month payout based on total revenue
                collected and select eligible winner(s). Are you sure you want to
                proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleTriggerPayout}>
                {isProcessing ? "Processing..." : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Current Cycle Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Total Revenue Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ${totalPayoutPool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time revenue tracking
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Eligible Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{eligibleMembers.length}</div>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-sm text-muted-foreground">Monthly: {monthlyEligible.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Yearly: {yearlyEligible.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Next Payout Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{nextPayoutDate}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {monthsUntilPayout === 0 ? 'This month' : `${monthsUntilPayout} month${monthsUntilPayout !== 1 ? 's' : ''} away`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Eligible Members */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Eligible Members for Current Cycle</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={tenureFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTenureFilter('all')}
              >
                All
              </Button>
              <Button
                variant={tenureFilter === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTenureFilter('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={tenureFilter === 'yearly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTenureFilter('yearly')}
              >
                Yearly (12 Months)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eligibleMembers
              .filter((member) => {
                if (tenureFilter === 'all') return true;
                if (tenureFilter === 'monthly') return member.tenure_type === 'monthly' || member.billing_cycle?.toLowerCase() === 'monthly';
                if (tenureFilter === 'yearly') return member.tenure_type === 'yearly' || member.billing_cycle?.toLowerCase() === 'yearly' || member.months_completed >= 12;
                return true;
              })
              .map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {member.full_name || member.users?.name || member.user_name || member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'No Name'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        User ID: {member.user_id || member.users?.id || 'N/A'}
                      </p>
                    </div>
                    <Badge variant="secondary">#{member.queue_position || member.id}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {member.email || member.users?.email || 'No email'} | Queue Position: {member.queue_position} | Status: {member.status || member.verification_status || 'Active'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">
                      ${member.prepayment_amount || member.amount || 300} Pre-payment
                    </p>
                    {member.prepayment_status === "completed" || member.prepaymentStatus === "completed" || member.payment_status === "completed" ? (
                      <Badge variant="default" className="bg-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedMember(member);
                      setIsDetailsOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payoutHistory.length > 0 ? payoutHistory.map((payout, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {payout.users?.name || payout.winner || payout.user_name || payout.full_name || `${payout.first_name || ''} ${payout.last_name || ''}`.trim() || 'No Name'}
                  </p>
                  <p className="text-sm text-muted-foreground">{payout.date || payout.created_at || 'Unknown Date'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ${(payout.amount || 0).toLocaleString()}
                    </p>
                    <Badge variant="default" className="bg-success">
                      {payout.status || 'Completed'}
                    </Badge>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payout history available.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedMember?.users?.image || selectedMember?.user_image} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">
                  {selectedMember?.full_name || selectedMember?.users?.name || selectedMember?.user_name || selectedMember?.name || `${selectedMember?.first_name || ''} ${selectedMember?.last_name || ''}`.trim() || 'Unknown Member'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedMember?.users?.email || selectedMember?.user_email || selectedMember?.email}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Complete member profile and account information
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-sm font-medium">
                      {selectedMember.full_name || selectedMember.users?.name || selectedMember.user_name || selectedMember.name || `${selectedMember.first_name || ''} ${selectedMember.last_name || ''}`.trim() || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                    <p className="text-sm font-mono truncate">
                      {selectedMember.user_id || selectedMember.users?.id || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm truncate">
                        {selectedMember.users?.email || selectedMember.user_email || selectedMember.email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        {selectedMember.users?.phone || selectedMember.phone || selectedMember.phone_number || 'Not provided'}
                      </p>
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
                      selectedMember.status === "active" || selectedMember.status === "Active" ? "default" : 
                      selectedMember.status === "suspended" || selectedMember.status === "Suspended" ? "destructive" : "secondary"
                    }>
                      {selectedMember.status || selectedMember.verification_status || 'Active'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Verified</Label>
                    <Badge variant={selectedMember.users?.email_verified || selectedMember.email_verified ? "default" : "secondary"}>
                      {selectedMember.users?.email_verified || selectedMember.email_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Location & Personal Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground border-b pb-2">Location & Personal Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="text-sm">
                      {selectedMember.users?.address || selectedMember.address || selectedMember.street_address || 'Not provided'}
                    </p>
                  </div>
                  {(selectedMember.city || selectedMember.state || selectedMember.postal_code) && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">City, State & Postal Code</Label>
                      <p className="text-sm">
                        {[selectedMember.city, selectedMember.state, selectedMember.postal_code].filter(Boolean).join(', ') || 'Not provided'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Membership Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground border-b pb-2">Membership Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Queue Position</Label>
                    <Badge variant="secondary" className="text-lg mt-1">
                      #{selectedMember.queue_position || selectedMember.position || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tenure Type</Label>
                    <Badge variant="outline" className="mt-1">
                      {selectedMember.tenure_type || selectedMember.billing_cycle || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Join Date</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm">
                        {selectedMember.created_at || selectedMember.joined_at ? new Date(selectedMember.created_at || selectedMember.joined_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Months Completed</Label>
                    <p className="text-sm font-semibold mt-1">
                      {selectedMember.months_completed || 0} months
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground border-b pb-2">Payment Information</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pre-payment Amount</span>
                    <span className="font-semibold">
                      ${selectedMember.prepayment_amount || selectedMember.amount || 300}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment Status</span>
                    {selectedMember.prepayment_status === "completed" || 
                     selectedMember.prepaymentStatus === "completed" || 
                     selectedMember.payment_status === "completed" ? (
                      <Badge variant="default" className="bg-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  {selectedMember.payment_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payment Date</span>
                      <span className="text-sm">
                        {new Date(selectedMember.payment_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {selectedMember.payment_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payment Type</span>
                      <Badge variant="outline">{selectedMember.payment_type}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Timeline */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground border-b pb-2">Account Timeline</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Joined Date</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        {selectedMember.created_at || selectedMember.joined_at ? new Date(selectedMember.created_at || selectedMember.joined_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        {selectedMember.updated_at ? new Date(selectedMember.updated_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
