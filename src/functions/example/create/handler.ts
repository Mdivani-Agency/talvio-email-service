import httpError from 'http-errors';

import { publicValidationMiddleware } from '@lib/middlewares';
import { ExampleParams, MiddyApiGWEvent } from '@lib/types';
import { schema } from './schema';

const example = async (event: MiddyApiGWEvent<ExampleParams>) => {
  const { body } = event;

  try {
    return {
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (ex) {
    console.error('failed to vote on profile', ex);
    throw new httpError.InternalServerError('Failed to vote on profile');
  }
};

export const main = publicValidationMiddleware(schema, []).handler(example);
