import {
  SendTemplatedEmailCommandInput,
  SendTemplatedEmailCommand,
  SESClient,
} from '@aws-sdk/client-ses';
import httpError from 'http-errors';
import { EmailTemplate, SendEmailRequest } from '@lib/types';

export const templateMap: Record<EmailTemplate, string> = {
  magic_link: 'magic_link',
  recovery: 'recovery',
  invite: 'invite',
  email_change: 'email_change',
  welcome: 'welcome',
};

export function sesTemplateName(template: string): string {
  if (!(template in templateMap)) {
    throw new httpError.BadRequest(`Unknown email template: ${template}`);
  }
  return templateMap[template as EmailTemplate];
}

class EmailService {
  private readonly ses: SESClient;

  constructor() {
    this.ses = new SESClient({ region: process.env.AWS_REGION || 'us-west-1' });
  }

  async send({ to, template, templateData }: SendEmailRequest) {
    const params: SendTemplatedEmailCommandInput = {
      Source: process.env.SES_FROM_EMAIL || 'no-reply@dev.talvio.co',
      Destination: { ToAddresses: to },
      Template: sesTemplateName(template),
      TemplateData: JSON.stringify(templateData),
    };

    return this.ses.send(new SendTemplatedEmailCommand(params));
  }
}

export const emailService = new EmailService();
