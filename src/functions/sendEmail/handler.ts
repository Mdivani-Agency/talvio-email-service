import httpError from 'http-errors';
import { privateValidationMiddleware } from '@lib/middlewares';
import { MiddyApiGWEvent, SendEmailRequest } from '@lib/types';
import { emailService } from '@lib/services';
import { schema } from './schema';

const sendEmail = async (event: MiddyApiGWEvent<SendEmailRequest>) => {
  const { to, template, templateData } = event.body;
  try {
    await emailService.send({ to, template, templateData });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' }),
    };
  } catch (ex) {
    console.error('Failed to send emails', ex);
    throw new httpError.InternalServerError('Failed to send emails');
  }
};

export const main = privateValidationMiddleware(schema, []).handler(sendEmail);
