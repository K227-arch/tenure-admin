import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const config = {
            appToken: process.env.SUMSUB_APP_TOKEN,
            secretKey: process.env.SUMSUB_SECRET_KEY,
            baseUrl: process.env.SUMSUB_BASE_URL,
            webhookSecret: process.env.SUMSUB_WEBHOOK_SECRET,
        };

        return NextResponse.json({
            success: true,
            config: {
                appToken: config.appToken ? `${config.appToken.substring(0, 10)}...` : 'Missing',
                secretKey: config.secretKey ? 'Present' : 'Missing',
                baseUrl: config.baseUrl || 'Default',
                webhookSecret: config.webhookSecret ? 'Present' : 'Missing',
            },
            environment: config.appToken?.includes('sbx') ? 'sandbox' : 'production',
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('Error checking Sumsub config:', error);
        return NextResponse.json(
            {
                error: 'Failed to check Sumsub configuration',
                details: error?.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}