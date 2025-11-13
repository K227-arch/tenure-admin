/**
 * Test script to verify email sending functionality
 * Run with: npx ts-node scripts/test-email.ts
 */

import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmail() {
  console.log('🔧 Testing email configuration...\n');

  // Check environment variables
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.log('\nPlease add these to your .env.local file:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your_email@gmail.com');
    console.log('SMTP_PASSWORD=your_app_password');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log('');

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Test connection
  console.log('🔌 Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    process.exit(1);
  }

  // Send test email
  console.log('📧 Sending test email...');
  const testCode = '12345';
  
  try {
    const info = await transporter.sendMail({
      from: `"Home Solutions Admin" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Test: 2FA Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .code { font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; letter-spacing: 8px; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Home Solutions Admin</h1>
              </div>
              <div class="content">
                <h2>Test Verification Code</h2>
                <p>This is a test email. Your verification code is:</p>
                <div class="code">${testCode}</div>
                <p>This is a test email to verify your SMTP configuration.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Home Solutions. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${process.env.SMTP_USER}`);
    console.log('\n✨ Email configuration is working correctly!');
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    process.exit(1);
  }
}

testEmail().catch(console.error);
