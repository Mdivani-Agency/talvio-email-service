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

  it('builds the verify URL on the app host from redirect_to', () => {
    expect(
      buildConfirmationUrl({
        site_url: 'https://abcd.supabase.co/auth/v1',
        token_hash: 'hash123',
        email_action_type: 'magiclink',
        redirect_to: 'https://dev.talvio.co/auth/callback',
      }),
    ).toBe(
      'https://dev.talvio.co/auth/v1/verify?token=hash123&type=magiclink&redirect_to=https%3A%2F%2Fdev.talvio.co%2Fauth%2Fcallback',
    );
  });

  it('keeps the app host when redirect_to includes a next path', () => {
    expect(
      buildConfirmationUrl({
        site_url: 'https://abcd.supabase.co/auth/v1',
        token_hash: 'pkce_hash',
        email_action_type: 'signup',
        redirect_to: 'https://dev.talvio.co/auth/callback?next=%2Faccount',
      }),
    ).toBe(
      'https://dev.talvio.co/auth/v1/verify?token=pkce_hash&type=signup&redirect_to=https%3A%2F%2Fdev.talvio.co%2Fauth%2Fcallback%3Fnext%3D%252Faccount',
    );
  });

  it('falls back to site_url when redirect_to is missing or not http(s)', () => {
    expect(
      buildConfirmationUrl({
        site_url: 'https://abcd.supabase.co/auth/v1/',
        token_hash: 'hash',
        email_action_type: 'magiclink',
      }),
    ).toBe('https://abcd.supabase.co/auth/v1/verify?token=hash&type=magiclink&redirect_to=');

    expect(
      buildConfirmationUrl({
        site_url: 'https://abcd.supabase.co',
        token_hash: 'hash',
        email_action_type: 'recovery',
        redirect_to: 'talvio://auth/callback',
      }),
    ).toBe(
      'https://abcd.supabase.co/auth/v1/verify?token=hash&type=recovery&redirect_to=talvio%3A%2F%2Fauth%2Fcallback',
    );
  });

  it('returns null when neither redirect_to nor site_url is an http(s) origin', () => {
    expect(buildConfirmationUrl({ redirect_to: 'not a url', site_url: 'talvio://app' })).toBeNull();
    expect(buildConfirmationUrl({})).toBeNull();
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
        'https://dev.talvio.co/auth/v1/verify?token=hash&type=email_change&redirect_to=https%3A%2F%2Fdev.talvio.co',
      email: 'new@talvio.co',
      old_email: 'old@talvio.co',
      site_url: 'https://dev.talvio.co',
    });
  });
});
