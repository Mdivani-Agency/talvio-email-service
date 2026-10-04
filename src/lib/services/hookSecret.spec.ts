import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { getHookSecret, resetHookSecretCache } from './hookSecret';

jest.mock('@aws-sdk/client-ssm', () => {
  const send = jest.fn();
  return {
    SSMClient: jest.fn(() => ({ send })),
    GetParameterCommand: jest.fn((input) => input),
  };
});

describe('getHookSecret', () => {
  const original = process.env.SEND_EMAIL_HOOK_SECRET;

  afterEach(() => {
    process.env.SEND_EMAIL_HOOK_SECRET = original;
    resetHookSecretCache();
    jest.clearAllMocks();
  });

  it('prefers SEND_EMAIL_HOOK_SECRET', async () => {
    process.env.SEND_EMAIL_HOOK_SECRET = 'v1,whsec_from_env';
    await expect(getHookSecret()).resolves.toBe('v1,whsec_from_env');
    expect(SSMClient).not.toHaveBeenCalled();
  });

  it('reads SSM /${stage}/email/hook-secret when env is unset', async () => {
    delete process.env.SEND_EMAIL_HOOK_SECRET;
    const mockSend = jest.fn().mockResolvedValue({
      Parameter: { Value: 'v1,whsec_from_ssm' },
    });
    (SSMClient as unknown as jest.Mock).mockImplementation(() => ({ send: mockSend }));

    await expect(getHookSecret()).resolves.toBe('v1,whsec_from_ssm');
    expect(GetParameterCommand).toHaveBeenCalledWith({
      Name: '/dev/email/hook-secret',
      WithDecryption: true,
    });
    await expect(getHookSecret()).resolves.toBe('v1,whsec_from_ssm');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
