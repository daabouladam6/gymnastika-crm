# WhatsApp Integration Setup Guide (Meta Cloud API)

This guide explains how to set up WhatsApp integration for the Gymnastika CRM using Meta's official WhatsApp Cloud API.

## Why Meta Cloud API?

✅ **Lowest cost** - Only pay Meta's fees, no middleman markup  
✅ **1,000 free service conversations/month**  
✅ **Official & reliable** - Direct integration with Meta  
✅ **Full compliance** - No risk of account bans  

---

## Step 1: Create a Meta Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Click "Create Account"
3. Fill in your business information
4. Verify your business (may take 1-2 days)

---

## Step 2: Create a WhatsApp Business App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Enter your app name (e.g., "Gymnastika CRM")
5. Select your Business Account
6. Click "Create App"

---

## Step 3: Add WhatsApp to Your App

1. In your app dashboard, scroll to "Add Products"
2. Find "WhatsApp" and click "Set Up"
3. Follow the guided setup

---

## Step 4: Get Your Credentials

### From the WhatsApp Setup Page:

1. **Phone Number ID**: Found under "API Setup" → "Phone Number ID"
2. **WhatsApp Business Account ID**: Found in the URL or settings
3. **Temporary Access Token**: Click "Generate Access Token" (expires in 24h)

### For Production (Permanent Token):

1. Go to "Business Settings" → "System Users"
2. Create a System User with "Admin" role
3. Generate a permanent access token with these permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`

---

## Step 5: Configure Your .env File

Add these variables to your backend `.env` file:

```env
# WhatsApp Meta Cloud API
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_WEBHOOK_VERIFY_TOKEN=gymnastika_webhook_token
```

---

## Step 6: Add a Phone Number

### Option A: Use Test Number (Free)
- Meta provides a test phone number for development
- You can send to up to 5 verified numbers
- Go to "API Setup" → "Add phone number" → Use test number

### Option B: Add Your Business Number
1. Go to "Phone Numbers" → "Add Phone Number"
2. Enter your WhatsApp Business number
3. Verify via SMS or Voice call
4. Wait for approval (usually instant)

---

## Step 7: Set Up Webhook (For Receiving Messages)

1. In your app, go to "WhatsApp" → "Configuration"
2. Click "Edit" next to Webhook
3. Enter:
   - **Callback URL**: `https://your-domain.com/api/whatsapp/webhook`
   - **Verify Token**: `gymnastika_webhook_token` (or your custom token)
4. Click "Verify and Save"
5. Subscribe to these webhook fields:
   - `messages`
   - `message_deliveries` (optional)
   - `message_reads` (optional)

---

## API Endpoints

### Check WhatsApp Status

```bash
GET /api/whatsapp/status
```

Response:
```json
{
  "success": true,
  "available": true,
  "provider": "meta-cloud-api",
  "configured": true
}
```

### Send Test Message

```bash
GET /api/whatsapp/test/+96170123456
```

### Send Custom Message

```bash
POST /api/whatsapp/send
Content-Type: application/json

{
  "phone": "+96170123456",
  "message": "Hello from Gymnastika!"
}
```

### Send Template Message

```bash
POST /api/whatsapp/send-template
Content-Type: application/json

{
  "phone": "+96170123456",
  "templateName": "hello_world",
  "languageCode": "en"
}
```

### Send to Customer by ID

```bash
POST /api/whatsapp/send-to-customer/123
Content-Type: application/json

{
  "message": "Hi {name}, your session is confirmed!"
}
```

### Broadcast to Multiple Customers

```bash
POST /api/whatsapp/broadcast
Content-Type: application/json

{
  "customerType": "pt",
  "message": "Hi {name}, reminder about your upcoming session!"
}
```

---

## Automatic Notifications

The CRM automatically sends WhatsApp messages for:

| Event | Recipient | Message |
|-------|-----------|---------|
| New Customer | Customer | Welcome message |
| PT Booked | Customer + Trainer | Confirmation |
| Session Today | Customer + Trainer | Day-of reminder |
| Date Changed | Customer + Trainer | Reschedule notice |
| Cancelled | Customer + Trainer | Cancellation notice |

### Scheduled Reminders
- 🕗 **8:00 AM** - PT session reminders for today
- 🕘 **9:00 AM** - General reminders

---

## Pricing

### Free Tier
- **1,000 free service conversations/month**
- Service = Customer-initiated within 24h

### Paid Conversations (after free tier)
Prices vary by country. For Lebanon:

| Type | Description | Approx. Cost |
|------|-------------|--------------|
| Utility | Transactional (confirmations, reminders) | ~$0.004/msg |
| Authentication | OTP, verification | ~$0.003/msg |
| Marketing | Promotional messages | ~$0.025/msg |
| Service | Customer-initiated replies | Free (1000/mo) |

### Cost Example
Sending 1,000 PT confirmations/month: ~$4

---

## Phone Number Format

The system automatically formats Lebanese numbers:

| Input | Formatted Output |
|-------|-----------------|
| `70123456` | `96170123456` |
| `03123456` | `9613123456` |
| `+96170123456` | `96170123456` |

Default country code: **+961** (Lebanon)

---

## Message Templates (For Marketing)

For business-initiated messages outside the 24h window, you need approved templates:

1. Go to "WhatsApp Manager" → "Message Templates"
2. Click "Create Template"
3. Choose category (Utility, Authentication, or Marketing)
4. Create your template with variables: `{{1}}`, `{{2}}`, etc.
5. Submit for approval (usually 24-48 hours)

Example template:
```
Hello {{1}}! Your PT session with {{2}} is confirmed for {{3}}.
```

---

## Troubleshooting

### "Message failed to send"
- Check phone number format includes country code
- Verify the recipient has WhatsApp
- Check your access token hasn't expired

### "Not configured" error
- Verify all environment variables are set
- Restart the server after changing `.env`

### Webhook not receiving messages
- Verify your server is accessible from the internet
- Check the webhook URL is correct
- Verify the webhook token matches

### Rate Limits
- 80 messages per second (text messages)
- 1,000 template messages per phone number per day
- Use delays between bulk messages

---

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use permanent tokens** for production (not temporary)
3. **Validate webhook signatures** in production
4. **Limit webhook endpoint** to Meta's IP ranges
5. **Monitor usage** in Meta Business Suite

---

## Quick Start Checklist

- [ ] Create Meta Business Account
- [ ] Create Developer App
- [ ] Add WhatsApp product
- [ ] Get Phone Number ID
- [ ] Generate Access Token
- [ ] Add to `.env` file
- [ ] Restart server
- [ ] Test with `/api/whatsapp/test/:phone`
- [ ] (Optional) Set up webhook for replies
