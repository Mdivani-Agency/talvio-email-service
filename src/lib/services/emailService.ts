import {
  SendTemplatedEmailCommandInput,
  SendTemplatedEmailCommand,
  SESClient,
} from '@aws-sdk/client-ses';
import { EmailTemplate, SendEmailRequest } from '@lib/types';

const templateMap: Record<EmailTemplate, string> = {
  magic_link: 'magic_link',
  welcome: 'welcome',
};

class EmailService {
  private readonly ses: SESClient;

  constructor() {
    this.ses = new SESClient({ region: process.env.AWS_REGION || 'us-west-1' });
  }

  async send({ to, template, templateData }: SendEmailRequest) {
    const params: SendTemplatedEmailCommandInput = {
      Source: process.env.SES_FROM_EMAIL || 'no-reply@example.com',
      Destination: { ToAddresses: to },
      Template: templateMap[template],
      TemplateData: JSON.stringify(templateData),
    };

    return this.ses.send(new SendTemplatedEmailCommand(params));
  }
}

export const emailService = new EmailService();
