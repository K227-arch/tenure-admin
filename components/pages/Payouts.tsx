'use client'

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Trophy, CheckCircle, XCircle, AlertCircle, Play } from "lucide-react";
import { toast } from "sonner";

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

  const { data, isLoading, error } = useQuery({
    queryKey: ['payout-data'],
    queryFn: fetchPayoutData,
    refetchInterval: 60000, // Refetch every minute
  });

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
              Total Payout Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$42,000</div>
            <p className="text-sm text-muted-foreground mt-1">
              Available for distribution
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
            <div className="text-3xl font-bold text-foreground">3</div>
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
            <div className="text-3xl font-bold text-foreground">Jan 2026</div>
            <p className="text-sm text-muted-foreground mt-1">4 months away</p>
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
                    <p className="font-semibold text-foreground">
                      {member.users?.name || member.user_name || member.name || 'Unknown Member'}
                    </p>
                    <Badge variant="secondary">#{member.queue_position || member.id}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Queue Position: {member.queue_position} | Status: {member.status || 'Active'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">
                      $300 Pre-payment
                    </p>
                    {member.prepaymentStatus === "completed" ? (
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
                  <Button variant="outline" size="sm">
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
                  <p className="font-semibold text-foreground">{payout.winner || payout.user_name || 'Unknown Winner'}</p>
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
    </div>
  );
}
