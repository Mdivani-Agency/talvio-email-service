import { Webhook } from 'standardwebhooks';
import { APIGatewayProxyEventHeaders } from 'aws-lambda';

export function normalizeWebhookSecret(secret: string): string {
  return secret.replace(/^v1,/, '').replace(/^whsec_/, '');
}

export function headerValue(
  headers: APIGatewayProxyEventHeaders | null | undefined,
  name: string,
): string {
  if (!headers) return '';
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target && value) return value;
  }
  return '';
}

export function rawBody(body: string | null, isBase64Encoded?: boolean): string {
  if (!body) return '';
  return isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
}

export function verifyStandardWebhook(params: {
  secret: string;
  body: string;
  headers: APIGatewayProxyEventHeaders | null | undefined;
}): unknown {
  const webhook = new Webhook(normalizeWebhookSecret(params.secret));
  return webhook.verify(params.body, {
    'webhook-id': headerValue(params.headers, 'webhook-id'),
    'webhook-timestamp': headerValue(params.headers, 'webhook-timestamp'),
    'webhook-signature': headerValue(params.headers, 'webhook-signature'),
  });
}
