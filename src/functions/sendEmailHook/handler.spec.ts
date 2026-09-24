import { APIGatewayEvent } from 'aws-lambda';
import { Webhook } from 'standardwebhooks';
import { emailService } from '@lib/services';
import { sendEmailHook } from './handler';

jest.mock('@lib/services', () => ({
  emailService: {
    send: jest.fn().mockResolvedValue({ MessageId: 'msg-1' }),
  },
}));

const SECRET = 'dGVzdC1sb2NhbC1ob29rLXNlY3JldC0zMi1ieXRlcw';

const payload = {
  user: { email: 'ada@talvio.co' },
  email_data: {
    token: '123456',
    token_hash: 'hash123',
    redirect_to: 'https://dev.talvio.co/auth/callback',
    email_action_type: 'magiclink',
    site_url: 'https://abcd.supabase.co',
    token_new: '',
    token_hash_new: '',
  },
};

const signedEvent = (
  overrides: Partial<APIGatewayEvent> = {},
  body = JSON.stringify(payload),
): APIGatewayEvent => {
  const webhook = new Webhook(SECRET);
  const id = 'msg_hook_1';
  const timestamp = new Date();
  return {
    httpMethod: 'POST',
    body,
    isBase64Encoded: false,
    headers: {
      'webhook-id': id,
      'webhook-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
      'webhook-signature': webhook.sign(id, timestamp, body),
    },
    ...overrides,
  } as APIGatewayEvent;
};

describe('sendEmailHook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SEND_EMAIL_HOOK_SECRET = `v1,whsec_${SECRET}`;
  });

  it('rejects non-POST', async () => {
    const res = await sendEmailHook(signedEvent({ httpMethod: 'GET' }));
    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body)).toEqual({ error: { message: 'Method not allowed' } });
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('returns 401 for an unsigned request', async () => {
    const res = await sendEmailHook({
      httpMethod: 'POST',
      body: JSON.stringify(payload),
      isBase64Encoded: false,
      headers: {},
    } as APIGatewayEvent);
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error.message).toBeTruthy();
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('returns 400 for an unknown email_action_type without calling SES', async () => {
    const unknown = {
      ...payload,
      email_data: { ...payload.email_data, email_action_type: 'reauthentication' },
    };
    const res = await sendEmailHook(signedEvent({}, JSON.stringify(unknown)));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      error: { message: 'Unknown email_action_type: reauthentication' },
    });
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('returns 400 when user.email is missing', async () => {
    const missingEmail = { ...payload, user: {} };
    const res = await sendEmailHook(signedEvent({}, JSON.stringify(missingEmail)));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ error: { message: 'Missing user.email' } });
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('sends a magic_link template and returns 200 {}', async () => {
    const res = await sendEmailHook(signedEvent());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({});
    expect(emailService.send).toHaveBeenCalledWith({
      to: ['ada@talvio.co'],
      template: 'magic_link',
      templateData: expect.objectContaining({
        token: '123456',
        email: 'ada@talvio.co',
        confirmation_url:
          'https://dev.talvio.co/auth/v1/verify?token=hash123&type=magiclink&redirect_to=https%3A%2F%2Fdev.talvio.co%2Fauth%2Fcallback',
      }),
    });
  });
});
