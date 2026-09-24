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

/** App origin from redirect_to. Magic links are opened on the product host. */
export function appOrigin(redirectTo: string | undefined): string | null {
  if (!redirectTo) return null;
  try {
    return new URL(redirectTo).origin;
  } catch {
    return null;
  }
}

export function buildConfirmationUrl(emailData: AuthEmailData): string {
  const origin = appOrigin(emailData.redirect_to) ?? '';
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
    confirmation_url: buildConfirmationUrl(emailData),
    email: user.email || '',
    old_email: emailData.old_email || user.email || '',
    site_url: appOrigin(emailData.redirect_to) || emailData.site_url || '',
  };
}
