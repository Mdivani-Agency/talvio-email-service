import {
  buildConfirmationUrl,
  isAuthEmailActionType,
  templateDataForHook,
  templateForAction,
} from './authEmailHook';

describe('authEmailHook', () => {
  it('maps Auth action types to SES templates', () => {
    expect(templateForAction('signup')).toBe('magic_link');
    expect(templateForAction('magiclink')).toBe('magic_link');
    expect(templateForAction('recovery')).toBe('recovery');
    expect(templateForAction('invite')).toBe('invite');
    expect(templateForAction('email_change')).toBe('email_change');
  });

  it('rejects unknown action types', () => {
    expect(isAuthEmailActionType('signup')).toBe(true);
    expect(isAuthEmailActionType('reauthentication')).toBe(false);
    expect(isAuthEmailActionType('')).toBe(false);
  });

  it('builds the Supabase verify URL from email_data', () => {
    expect(
      buildConfirmationUrl({
        site_url: 'https://abcd.supabase.co/',
        token_hash: 'hash123',
        email_action_type: 'magiclink',
        redirect_to: 'https://dev.talvio.co/auth/callback',
      }),
    ).toBe(
      'https://abcd.supabase.co/auth/v1/verify?token=hash123&type=magiclink&redirect_to=https%3A%2F%2Fdev.talvio.co%2Fauth%2Fcallback',
    );
  });

  it('fills template placeholders including email_change fields', () => {
    expect(
      templateDataForHook(
        { email: 'new@talvio.co' },
        {
          token: '111111',
          token_new: '222222',
          token_hash: 'hash',
          email_action_type: 'email_change',
          site_url: 'https://abcd.supabase.co',
          redirect_to: 'https://dev.talvio.co',
          old_email: 'old@talvio.co',
        },
      ),
    ).toEqual({
      token: '111111',
      token_new: '222222',
      confirmation_url:
        'https://abcd.supabase.co/auth/v1/verify?token=hash&type=email_change&redirect_to=https%3A%2F%2Fdev.talvio.co',
      email: 'new@talvio.co',
      old_email: 'old@talvio.co',
      site_url: 'https://abcd.supabase.co',
    });
  });
});
