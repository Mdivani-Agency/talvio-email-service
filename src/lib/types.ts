import { APIGatewayEvent } from 'aws-lambda';

export type MiddyApiGWEvent<TBody = null, TPath = null, TQuery = null> = Omit<
  APIGatewayEvent,
  'body' | 'pathParameters' | 'queryStringParameters'
> & { body: TBody; pathParameters: TPath; queryStringParameters: TQuery };

export type EmailTemplate = 'magic_link' | 'welcome';

export type SendEmailRequest = {
  to: string[];
  template: EmailTemplate;
  templateData: Record<string, string>;
};
