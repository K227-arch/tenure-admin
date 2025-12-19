'use client'

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SumsubWebSDKProps {
  userId: string;
  onComplete?: (result: any) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    snsWebSdk: any;
  }
}

export default function SumsubWebSDK({ userId, onComplete, onError }: SumsubWebSDKProps) {
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const sdkContainerRef = useRef<HTMLDivElement>(null);
  const sdkInstanceRef = useRef<any>(null);

  // Load Sumsub WebSDK script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.sumsub.com/websdk/2.0/sns-websdk.js';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => {
      setError('Failed to load Sumsub WebSDK');
      toast.error('Failed to load KYC verification system');
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Initialize KYC process
  const initializeKYC = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/kyc/sumsub/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize KYC');
      }

      setAccessToken(result.accessToken);
      await loadKYCStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize KYC';
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  // Load current KYC status
  const loadKYCStatus = async () => {
    try {
      const response = await fetch(`/api/kyc/sumsub/initiate?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setKycStatus(result.data);
      }
    } catch (err) {
      console.error('Failed to load KYC status:', err);
    }
  };

  // Launch Sumsub WebSDK
  const launchWebSDK = () => {
    if (!sdkLoaded || !accessToken || !window.snsWebSdk) {
      toast.error('WebSDK not ready');
      return;
    }

    try {
      // Destroy existing instance
      if (sdkInstanceRef.current) {
        sdkInstanceRef.current.destroy();
      }

      const config = {
        accessToken,
        expirationHandler: () => {
          toast.error('Session expired. Please refresh and try again.');
          initializeKYC();
        },
        onMessage: (type: string, payload: any) => {
          console.log('WebSDK message:', type, payload);
          
          switch (type) {
            case 'idCheck.onStepCompleted':
              toast.success('Step completed successfully');
              break;
            case 'idCheck.onError':
              toast.error('Verification error occurred');
              onError?.(payload);
              break;
            case 'idCheck.applicantLoaded':
              console.log('Applicant loaded:', payload);
              break;
            case 'idCheck.onApplicantSubmitted':
              toast.success('Documents submitted for review');
              onComplete?.(payload);
              loadKYCStatus();
              break;
          }
        },
        onError: (error: any) => {
          console.error('WebSDK error:', error);
          toast.error('KYC verification error');
          onError?.(error);
        },
      };

      // Initialize WebSDK
      sdkInstanceRef.current = window.snsWebSdk.init(
        config,
        sdkContainerRef.current
      );

    } catch (err) {
      console.error('WebSDK launch error:', err);
      toast.error('Failed to launch KYC verification');
      onError?.(err);
    }
  };

  // Reset KYC process
  const resetKYC = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/kyc/sumsub/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reset KYC');
      }

      toast.success('KYC process reset successfully');
      await initializeKYC();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset KYC';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-4 w-4 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Under Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status || 'Not Started'}
          </Badge>
        );
    }
  };

  // Load KYC status on component mount
  useEffect(() => {
    loadKYCStatus();
  }, [userId]);

  // Launch WebSDK when ready
  useEffect(() => {
    if (sdkLoaded && accessToken) {
      launchWebSDK();
    }
  }, [sdkLoaded, accessToken]);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>KYC Verification Status</span>
            {kycStatus && getStatusBadge(kycStatus.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kycStatus && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <span className="ml-2">{kycStatus.status || 'Not Started'}</span>
                </div>
                <div>
                  <span className="font-medium">Risk Level:</span>
                  <span className="ml-2">{kycStatus.riskLevel || 'N/A'}</span>
                </div>
                {kycStatus.submittedAt && (
                  <div>
                    <span className="font-medium">Submitted:</span>
                    <span className="ml-2">
                      {new Date(kycStatus.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {kycStatus.reviewedAt && (
                  <div>
                    <span className="font-medium">Reviewed:</span>
                    <span className="ml-2">
                      {new Date(kycStatus.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {!accessToken && (
                <Button 
                  onClick={initializeKYC} 
                  disabled={loading || !sdkLoaded}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    'Start KYC Verification'
                  )}
                </Button>
              )}

              {kycStatus?.status === 'rejected' && (
                <Button 
                  onClick={resetKYC} 
                  disabled={loading}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset & Retry
                    </>
                  )}
                </Button>
              )}

              <Button 
                onClick={loadKYCStatus} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-800">
              <XCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WebSDK Container */}
      {accessToken && (
        <Card>
          <CardHeader>
            <CardTitle>Identity Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={sdkContainerRef} 
              className="min-h-[600px] w-full"
              style={{ minHeight: '600px' }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}