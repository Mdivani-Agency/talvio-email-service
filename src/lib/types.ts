import { APIGatewayEvent } from 'aws-lambda';

export type MiddyApiGWEvent<TBody = null, TPath = null, TQuery = null> = Omit<
  APIGatewayEvent,
  'body' | 'pathParameters' | 'queryStringParameters'
> & { body: TBody; pathParameters: TPath; queryStringParameters: TQuery };

// Example
export type ExampleRequest = { profileId?: string; userId?: string };

export type ExampleParams = Required<ExampleRequest>;
