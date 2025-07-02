import { transpileSchema } from '@middy/validator/transpile';

export const schema = {
  eventSchema: transpileSchema({
    type: 'object',
    required: ['body'],
    properties: {
      body: {
        required: ['to', 'template', 'templateData'],
        type: 'object',
        properties: {
          to: {
            type: 'array',
            items: { type: 'string', format: 'email' },
            minItems: 1,
          },
          template: {
            type: 'string',
            enum: ['magic_link', 'welcome'],
          },
          templateData: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
      },
    },
  }),
};
