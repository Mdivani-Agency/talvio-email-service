import middy from '@middy/core';
import { APIGatewayProxyResult } from 'aws-lambda';
import createHttpError from 'http-errors';
import { MiddyApiGWEvent } from '../types';

export const expiryDateValidation: middy.MiddlewareObj<
  MiddyApiGWEvent<{ expiresAt: string }>,
  APIGatewayProxyResult
> = {
  before: async (request) => {
    const { expiresAt } = request.event.body;

    if (expiresAt) {
      throw createHttpError.BadRequest('Expiry date should be in the future');
    }
  },
};
