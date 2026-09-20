import { SESClient } from '@aws-sdk/client-ses';
import { emailService, sesTemplateName } from './emailService';

jest.mock('@aws-sdk/client-ses', () => {
  const send = jest.fn().mockResolvedValue({ MessageId: 'msg-1' });
  return {
    SESClient: jest.fn(() => ({ send })),
    SendTemplatedEmailCommand: jest.fn((input) => input),
  };
});

describe('emailService', () => {
  it('maps known templates and rejects unknown ones before SES', () => {
    expect(sesTemplateName('welcome')).toBe('welcome');
    expect(sesTemplateName('recovery')).toBe('recovery');
    expect(() => sesTemplateName('does_not_exist')).toThrow('Unknown email template');
  });

  it('sends a templated email through SES', async () => {
    await emailService.send({
      to: ['user@example.com'],
      template: 'welcome',
      templateData: { name: 'Ada', email: 'user@example.com', site_url: 'https://dev.talvio.co' },
    });

    const instance = (SESClient as unknown as jest.Mock).mock.results[0].value;
    expect(instance.send).toHaveBeenCalledWith(
      expect.objectContaining({
        Source: 'no-reply@dev.talvio.co',
        Destination: { ToAddresses: ['user@example.com'] },
        Template: 'welcome',
      }),
    );
  });
});
