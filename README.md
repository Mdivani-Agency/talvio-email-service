# Rest Api Template

## Email Sending Lambda

### Endpoint

`POST /send-email`

#### Request Body
```
{
  "emails": ["user1@example.com", "user2@example.com"],
  "template": "magic_link" | "welcome",
  "templateData": { "key": "value" }
}
```
- `emails`: Array of recipient email addresses
- `template`: Either `magic_link` or `welcome`
- `templateData`: Key-value pairs for template variables

#### Response
- `200 OK` on success
- `500 InternalServerError` on failure

### Environment Variables
- `SES_FROM_EMAIL`: The verified SES sender email address
- `AWS_REGION`: AWS region (default: us-west-1)

### Email Service
The `emailService` in `src/lib/emailService.ts` is a wrapper over AWS SES. It uses the `send` function to send templated emails.

#### Example Usage
```
await emailService.send({
  to: ['user@example.com'],
  template: 'magic_link',
  templateData: { link: 'https://example.com/magic' }
});
```

#### SES Templates
- Update `templateMap` in `emailService.ts` to match your SES template names for `magic_link` and `welcome`.
