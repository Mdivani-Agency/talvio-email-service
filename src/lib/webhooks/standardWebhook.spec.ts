import { Webhook } from 'standardwebhooks';
import {
  headerValue,
  normalizeWebhookSecret,
  rawBody,
  verifyStandardWebhook,
} from './standardWebhook';

const SECRET = 'dGVzdC1sb2NhbC1ob29rLXNlY3JldC0zMi1ieXRlcw';
const PAYLOAD = '{"ok":true}';

const signedHeaders = () => {
  const webhook = new Webhook(SECRET);
  const id = 'msg_test_1';
  const timestamp = new Date();
  return {
    'webhook-id': id,
    'webhook-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
    'webhook-signature': webhook.sign(id, timestamp, PAYLOAD),
  };
};

describe('standardWebhook', () => {
  it('strips v1, and whsec_ prefixes', () => {
    expect(normalizeWebhookSecret(`v1,whsec_${SECRET}`)).toBe(SECRET);
    expect(normalizeWebhookSecret(`whsec_${SECRET}`)).toBe(SECRET);
    expect(normalizeWebhookSecret(SECRET)).toBe(SECRET);
  });

  it('reads headers case-insensitively', () => {
    expect(headerValue({ 'Webhook-Id': 'abc' }, 'webhook-id')).toBe('abc');
    expect(headerValue(null, 'webhook-id')).toBe('');
  });

  it('decodes a base64 API Gateway body', () => {
    expect(rawBody(Buffer.from(PAYLOAD).toString('base64'), true)).toBe(PAYLOAD);
    expect(rawBody(PAYLOAD, false)).toBe(PAYLOAD);
    expect(rawBody(null)).toBe('');
  });

  it('accepts a valid Standard Webhooks signature', () => {
    expect(
      verifyStandardWebhook({
        secret: `v1,whsec_${SECRET}`,
        body: PAYLOAD,
        headers: signedHeaders(),
      }),
    ).toEqual({ ok: true });
  });

  it('rejects a tampered body', () => {
    expect(() =>
      verifyStandardWebhook({
        secret: `v1,whsec_${SECRET}`,
        body: '{"ok":false}',
        headers: signedHeaders(),
      }),
    ).toThrow();
  });
});
