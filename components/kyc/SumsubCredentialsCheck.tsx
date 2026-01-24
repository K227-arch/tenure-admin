'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Key, CheckCircle, XCircle } from "lucide-react";

interface SumsubCredentialsCheckProps {
  testResult?: any;
}

export default function SumsubCredentialsCheck({ testResult }: SumsubCredentialsCheckProps) {
  if (!testResult) return null;

  const isCredentialsMissing = testResult.error === 'Missing credentials';

  return (
    <Card className={`${isCredentialsMissing ? 'border-yellow-200 bg-yellow-50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Sum & Substance Credentials
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCredentialsMissing ? (
          <div className="space-y-4">
            <div className="flex items-center text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="font-medium">Missing Secret Key</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <span className="font-medium">App Token:</span>
                <Badge className="ml-2 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Present
                </Badge>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Secret Key:</span>
                <Badge className="ml-2 bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  Missing
                </Badge>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-2">How to get your Secret Key:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to your Sum & Substance dashboard</li>
                <li>Navigate to <strong>Settings → App tokens</strong></li>
                <li>Find your app token: <code className="bg-gray-100 px-1 rounded">{testResult.appToken}</code></li>
                <li>Copy the <strong>Secret Key</strong> (shown only once when created)</li>
                <li>Update <code className="bg-gray-100 px-1 rounded">SUMSUB_SECRET_KEY</code> in your .env file</li>
                <li>Restart your development server</li>
              </ol>
            </div>

            <div className="text-xs text-muted-foreground">
              <strong>Note:</strong> If you don&apos;t have the secret key, you may need to create a new app token.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Credentials Configured</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <span className="font-medium">App Token:</span>
                <Badge className="ml-2 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Present
                </Badge>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Secret Key:</span>
                <Badge className="ml-2 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Present
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}