# Sum & Substance KYC Integration Guide

This guide explains how to set up and use the Sum & Substance KYC integration in your admin system.

## Prerequisites

1. **Sum & Substance Account**: You need an active Sum & Substance account
2. **API Credentials**: App Token and Secret Key from Sum & Substance dashboard
3. **Webhook Configuration**: Set up webhooks in Sum & Substance dashboard

## Setup Steps

### 1. Configure Environment Variables

Add the following variables to your `.env` file:

```env
# Sum & Substance KYC Configuration
SUMSUB_APP_TOKEN=your_sumsub_app_token_here
SUMSUB_SECRET_KEY=your_sumsub_secret_key_here
SUMSUB_BASE_URL=https://api.sumsub.com
SUMSUB_LEVEL_NAME=basic-kyc-level
SUMSUB_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Get Sum & Substance Credentials

1. Log in to your Sum & Substance dashboard
2. Go to **Settings** → **App tokens**
3. Create a new app token with the following permissions:
   - `applicants.read`
   - `applicants.write`
   - `inspections.read`
   - `resources.read`
4. Copy the **App Token** and **Secret Key**
5. Update your `.env` file with these credentials

### 3. Configure Webhook

1. In Sum & Substance dashboard, go to **Dev Space** → **Webhooks**
2. Create a new webhook with the following settings:
   - **URL**: `https://yourdomain.com/api/kyc/sumsub/webhook`
   - **Events**: Select all applicant-related events
   - **Secret**: Generate a secret and add it to your `.env` as `SUMSUB_WEBHOOK_SECRET`

### 4. Run Database Migration

Execute the migration to add Sum & Substance fields:

```bash
# If using Drizzle
npx drizzle-kit push:pg

# Or run the SQL directly
psql -d your_database -f drizzle/migrations/add_sumsub_fields.sql
```

### 5. Configure KYC Level

1. In Sum & Substance dashboard, go to **Levels**
2. Create or configure a KYC level (e.g., "basic-kyc-level")
3. Set up the required documents and verification steps
4. Update `SUMSUB_LEVEL_NAME` in your `.env` file

## Usage

### Admin Interface

The KYC Management page now includes Sum & Substance integration:

1. **View KYC Status**: See real-time status from Sum & Substance
2. **Risk Scores**: View calculated risk scores
3. **Sumsub Dashboard**: Direct links to Sum & Substance dashboard
4. **Reset KYC**: Reset rejected applications for resubmission

### API Endpoints

#### Initiate KYC Process
```http
POST /api/kyc/sumsub/initiate
Content-Type: application/json

{
  "userId": "user-uuid",
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "country": "US"
  }
}
```

#### Get KYC Status
```http
GET /api/kyc/sumsub/initiate?userId=user-uuid
```

#### Reset KYC
```http
POST /api/kyc/sumsub/reset
Content-Type: application/json

{
  "userId": "user-uuid"
}
```

### WebSDK Integration

Use the `SumsubWebSDK` component for user-facing KYC:

```tsx
import SumsubWebSDK from '@/components/kyc/SumsubWebSDK';

function UserKYCPage({ userId }: { userId: string }) {
  return (
    <SumsubWebSDK
      userId={userId}
      onComplete={(result) => {
        console.log('KYC completed:', result);
      }}
      onError={(error) => {
        console.error('KYC error:', error);
      }}
    />
  );
}
```

## Webhook Events

The system handles the following Sum & Substance webhook events:

- `applicantReviewed`: Final review completed
- `applicantPending`: Under review
- `applicantOnHold`: Additional information needed
- `applicantCreated`: New applicant created
- `applicantActionPending`: Action required from user
- `applicantActionReviewed`: Action completed and reviewed

## Status Mapping

| Sum & Substance Status | Internal Status | Description |
|----------------------|----------------|-------------|
| `init` | `pending` | Initial state |
| `pending` | `under_review` | Under review |
| `queued` | `under_review` | Queued for review |
| `completed` | `approved` | Approved |
| `onHold` | `action_required` | Additional info needed |
| `rejected` | `rejected` | Rejected |

## Security Considerations

1. **Webhook Verification**: All webhooks are verified using HMAC signatures
2. **Access Tokens**: Tokens are time-limited and automatically refreshed
3. **Data Encryption**: Sensitive data is stored encrypted in the database
4. **API Rate Limits**: Respect Sum & Substance API rate limits

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your app token and secret key
2. **Webhook Not Received**: Verify webhook URL and secret
3. **WebSDK Not Loading**: Check if the CDN is accessible
4. **Token Expired**: Tokens expire after 10 minutes by default

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

### Support

For Sum & Substance specific issues:
- Documentation: https://docs.sumsub.com
- Support: https://sumsub.com/support

## Best Practices

1. **Test in Sandbox**: Always test in Sum & Substance sandbox first
2. **Handle Errors**: Implement proper error handling for all API calls
3. **Monitor Webhooks**: Set up monitoring for webhook delivery
4. **Regular Updates**: Keep the WebSDK version updated
5. **Compliance**: Ensure your KYC level meets regulatory requirements

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Webhook endpoint accessible
- [ ] SSL certificate valid
- [ ] KYC level configured
- [ ] Test user verification flow
- [ ] Monitor webhook delivery
- [ ] Set up error alerting