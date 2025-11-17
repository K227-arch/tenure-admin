'use client'

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trophy, CheckCircle, XCircle, AlertCircle, Play, User, Mail, Phone, Calendar, CreditCard } from "lucide-react";
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
            Manage 12-month tenure payouts and winner selection.
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
            <p className="text-sm text-muted-foreground mt-1">
              Completed 12 months
            </p>
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
          <CardTitle>Eligible Members for Current Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eligibleMembers.map((member) => (
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
              Complete information about the eligible member
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              {/* User Profile */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.users?.image || selectedMember.user_image} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedMember.full_name || selectedMember.users?.name || selectedMember.user_name || selectedMember.name || `${selectedMember.first_name || ''} ${selectedMember.last_name || ''}`.trim() || 'No Name'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Queue Position #{selectedMember.queue_position || selectedMember.id}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedMember.users?.email || selectedMember.user_email || selectedMember.email || 'No email'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedMember.users?.phone || selectedMember.phone || 'No phone'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Membership Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Membership Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="default" className="mt-1">
                      {selectedMember.status || 'Active'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Queue Position</p>
                    <p className="text-sm font-semibold mt-1">#{selectedMember.queue_position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Join Date</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm">
                        {selectedMember.created_at ? new Date(selectedMember.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="text-xs font-mono mt-1 truncate">
                      {selectedMember.user_id || selectedMember.users?.id || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Payment Information</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
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
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
