import { transpileSchema } from '@middy/validator/transpile';

export const schema = {
  eventSchema: transpileSchema({
    type: 'object',
    required: ['body'],
    properties: {
      body: {
        required: ['userId', 'profileId'],
        type: 'object',
        properties: {
          userId: {
            type: 'string',
          },
          profileId: {
            type: 'string',
          },
        },
      },
    },
  }),
};
