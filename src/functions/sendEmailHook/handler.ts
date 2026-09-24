import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import httpError from 'http-errors';
import { emailService } from '@lib/services';
import { getHookSecret } from '@lib/services/hookSecret';
import {
  AuthHookPayload,
  buildConfirmationUrl,
  isAuthEmailActionType,
  templateDataForHook,
  templateForAction,
} from '@lib/services/authEmailHook';
import { rawBody, verifyStandardWebhook } from '@lib/webhooks/standardWebhook';

const json = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const hookError = (statusCode: number, message: string): APIGatewayProxyResult =>
  json(statusCode, { error: { message } });

export const sendEmailHook = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return hookError(405, 'Method not allowed');
  }

  const body = rawBody(event.body, event.isBase64Encoded);
  let secret: string;
  try {
    secret = await getHookSecret();
  } catch (ex) {
    console.error('Failed to load send_email hook secret', ex);
    return hookError(500, 'Hook secret is unavailable');
  }

  if (!secret) {
    return hookError(500, 'Hook secret is unavailable');
  }

  try {
    verifyStandardWebhook({ secret, body, headers: event.headers });
  } catch (ex) {
    console.error('Invalid send_email webhook signature', ex);
    return hookError(401, ex instanceof Error ? ex.message : 'Invalid webhook signature');
  }

  let payload: AuthHookPayload;
  try {
    payload = JSON.parse(body) as AuthHookPayload;
  } catch {
    return hookError(400, 'Invalid JSON payload');
  }

  const user = payload.user || {};
  const emailData = payload.email_data || {};
  const actionType = emailData.email_action_type || '';

  if (!user.email) {
    return hookError(400, 'Missing user.email');
  }

  if (!isAuthEmailActionType(actionType)) {
    return hookError(400, `Unknown email_action_type: ${actionType || '(empty)'}`);
  }

  if (!buildConfirmationUrl(emailData)) {
    return hookError(400, 'Missing usable redirect_to or site_url');
  }

  try {
    await emailService.send({
      to: [user.email],
      template: templateForAction(actionType),
      templateData: templateDataForHook(user, emailData),
    });
  } catch (ex) {
    if (httpError.isHttpError(ex) && ex.statusCode < 500) {
      return hookError(ex.statusCode, ex.message);
    }
    console.error('Failed to send auth email', ex);
    return hookError(500, 'Failed to send email');
  }

  return json(200, {});
};

export const main = sendEmailHook;
