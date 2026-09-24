import { EmailTemplate } from '@lib/types';

export type AuthEmailActionType = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change';

export type AuthEmailData = {
  token?: string;
  token_hash?: string;
  redirect_to?: string;
  email_action_type?: string;
  site_url?: string;
  token_new?: string;
  token_hash_new?: string;
  old_email?: string;
};

export type AuthHookUser = {
  email?: string;
};

export type AuthHookPayload = {
  user?: AuthHookUser;
  email_data?: AuthEmailData;
};

const ACTION_TEMPLATE: Record<AuthEmailActionType, EmailTemplate> = {
  signup: 'magic_link',
  magiclink: 'magic_link',
  recovery: 'recovery',
  invite: 'invite',
  email_change: 'email_change',
};

export function isAuthEmailActionType(value: string): value is AuthEmailActionType {
  return value in ACTION_TEMPLATE;
}

export function templateForAction(actionType: AuthEmailActionType): EmailTemplate {
  return ACTION_TEMPLATE[actionType];
}

/** HTTP(S) origin. Custom schemes and malformed values are rejected. */
export function httpOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.host || url.origin === 'null') return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Auth API origin. Hosted hooks send site_url with a trailing /auth/v1. */
export function authApiOrigin(siteUrl: string | undefined): string | null {
  if (!siteUrl) return null;
  return httpOrigin(siteUrl.replace(/\/+$/, '').replace(/\/auth\/v1$/, ''));
}

/** Product host from redirect_to, otherwise the Auth API origin. */
export function confirmationOrigin(emailData: AuthEmailData): string | null {
  return httpOrigin(emailData.redirect_to) ?? authApiOrigin(emailData.site_url);
}

export function buildConfirmationUrl(emailData: AuthEmailData): string | null {
  const origin = confirmationOrigin(emailData);
  if (!origin) return null;
  const params = new URLSearchParams({
    token: emailData.token_hash || '',
    type: emailData.email_action_type || '',
    redirect_to: emailData.redirect_to || '',
  });
  return `${origin}/auth/v1/verify?${params.toString()}`;
}

export function templateDataForHook(
  user: AuthHookUser,
  emailData: AuthEmailData,
): Record<string, string> {
  return {
    token: emailData.token || '',
    token_new: emailData.token_new || '',
    confirmation_url: buildConfirmationUrl(emailData) || '',
    email: user.email || '',
    old_email: emailData.old_email || user.email || '',
    site_url: confirmationOrigin(emailData) || '',
  };
}
