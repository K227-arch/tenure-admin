import { NextRequest, NextResponse } from 'next/server';
import { sumsubClient } from '@/lib/sumsub/client';

export async function GET(request: NextRequest) {
  try {
    // Check if credentials are configured
    const appToken = process.env.SUMSUB_APP_TOKEN;
    const secretKey = process.env.SUMSUB_SECRET_KEY;
    
    console.log('Testing Sumsub connection...');
    console.log('App Token:', appToken?.substring(0, 10) + '...');
    console.log('Secret Key:', secretKey ? 'Present' : 'Missing');

    if (!appToken || !secretKey || secretKey.includes('REQUIRED')) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials',
        details: 'Both SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY are required',
        environment: 'sandbox',
        appToken: appToken?.substring(0, 10) + '...',
        credentialsStatus: {
          appToken: appToken ? 'Present' : 'Missing',
          secretKey: secretKey && !secretKey.includes('REQUIRED') ? 'Present' : 'Missing',
        },
        troubleshooting: {
          step1: 'Get your secret key from Sum & Substance dashboard',
          step2: 'Go to Settings → App tokens in your Sumsub dashboard',
          step3: 'Copy the secret key for your app token',
          step4: 'Update SUMSUB_SECRET_KEY in your .env file',
          step5: 'Restart your development server',
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Test 1: Basic connectivity test
    console.log('Test 1: Testing basic connectivity...');
    const connectionTest = await sumsubClient.testConnection();
    
    // Test 2: Get applicants list
    console.log('Test 2: Fetching applicants...');
    const applicants = await sumsubClient.getAllApplicants({
      limit: 5,
      offset: 0,
    });

    // Test 3: Try to generate an access token
    console.log('Test 3: Testing access token generation...');
    let tokenTest = null;
    try {
      tokenTest = await sumsubClient.generateAccessToken(
        `test_connection_${Date.now()}`,
        process.env.SUMSUB_LEVEL_NAME || 'basic-kyc-level',
        60 // 1 minute
      );
    } catch (tokenError) {
      console.log('Token generation failed:', tokenError);
    }

    // Test 4: Get statistics (optional)
    console.log('Test 4: Fetching statistics...');
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let statistics = null;
    try {
      statistics = await sumsubClient.getStatistics({
        from: thirtyDaysAgo,
        to: today,
      });
    } catch (statsError) {
      console.log('Statistics not available:', statsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Sumsub connection successful!',
      environment: 'sandbox',
      appToken: appToken.substring(0, 10) + '...',
      credentialsStatus: {
        appToken: 'Present',
        secretKey: 'Present',
      },
      tests: {
        connection: {
          success: true,
          data: connectionTest,
        },
        applicants: {
          success: true,
          count: applicants?.totalItems || applicants?.items?.length || 0,
          data: applicants,
        },
        accessToken: {
          success: tokenTest !== null,
          data: tokenTest ? { generated: true, userId: tokenTest.userId } : null,
        },
        statistics: {
          success: statistics !== null,
          data: statistics,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sumsub test error:', error);
    
    // Parse error details
    let errorDetails = 'Unknown error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Check for common authentication errors
      if (error.message.includes('401')) {
        errorDetails = 'Authentication failed. Please check your app token and secret key.';
        statusCode = 401;
      } else if (error.message.includes('403')) {
        errorDetails = 'Access forbidden. Please check your app token permissions.';
        statusCode = 403;
      } else if (error.message.includes('404')) {
        errorDetails = 'API endpoint not found. Please check the base URL.';
        statusCode = 404;
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Sumsub connection failed',
      details: errorDetails,
      environment: 'sandbox',
      appToken: process.env.SUMSUB_APP_TOKEN?.substring(0, 10) + '...',
      troubleshooting: {
        checkAppToken: 'Verify your app token is correct',
        checkSecretKey: 'Make sure you have the corresponding secret key',
        checkPermissions: 'Ensure your app token has the required permissions',
        checkEnvironment: 'Confirm you are using sandbox credentials for sandbox environment',
      },
      timestamp: new Date().toISOString(),
    }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json();

    switch (testType) {
      case 'create_test_applicant':
        // Create a test applicant to verify write permissions
        const testExternalUserId = `test_user_${Date.now()}`;
        
        const applicant = await sumsubClient.createApplicant(
          testExternalUserId,
          process.env.SUMSUB_LEVEL_NAME,
          {
            firstName: 'Test',
            lastName: 'User',
            email: `test+${Date.now()}@example.com`,
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Test applicant created successfully',
          data: applicant,
          testType: 'create_test_applicant',
        });

      case 'generate_access_token':
        // Test access token generation
        const tokenExternalUserId = `token_test_${Date.now()}`;
        
        const accessToken = await sumsubClient.generateAccessToken(
          tokenExternalUserId,
          process.env.SUMSUB_LEVEL_NAME,
          600 // 10 minutes
        );

        return NextResponse.json({
          success: true,
          message: 'Access token generated successfully',
          data: {
            token: accessToken.token.substring(0, 20) + '...', // Truncate for security
            userId: accessToken.userId,
            expiresIn: '10 minutes',
          },
          testType: 'generate_access_token',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid test type. Supported: create_test_applicant, generate_access_token' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sumsub POST test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test operation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      testType: 'unknown',
    }, { status: 500 });
  }
}