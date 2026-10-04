import httpError from 'http-errors';
import { emailService } from '@lib/services';
import { MiddyApiGWEvent, SendEmailRequest } from '@lib/types';
import { sendEmail } from './handler';

jest.mock('@lib/services', () => ({
  emailService: {
    send: jest.fn().mockResolvedValue({ MessageId: 'msg-1' }),
  },
}));

const event = {
  body: {
    to: ['user@example.com'],
    template: 'welcome',
    templateData: { name: 'Ada', email: 'user@example.com', site_url: 'https://dev.talvio.co' },
  },
} as unknown as MiddyApiGWEvent<SendEmailRequest>;

describe('sendEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends welcome mail and returns 200', async () => {
    await expect(sendEmail(event)).resolves.toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' }),
    });
    expect(emailService.send).toHaveBeenCalledWith(event.body);
  });

  it('rethrows 4xx from emailService so unknown templates stay 400', async () => {
    (emailService.send as jest.Mock).mockRejectedValueOnce(
      new httpError.BadRequest('Unknown email template: does_not_exist'),
    );
    await expect(sendEmail(event)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Unknown email template: does_not_exist',
    });
  });

  it('wraps unexpected errors as 500', async () => {
    (emailService.send as jest.Mock).mockRejectedValueOnce(new Error('SES down'));
    await expect(sendEmail(event)).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to send emails',
    });
  });
});
