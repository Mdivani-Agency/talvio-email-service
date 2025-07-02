import type { AWS } from '@serverless/typescript';

import * as functions from './src/functions';

const serverlessConfiguration: AWS = {
  service: 'email-service',
  frameworkVersion: '3',

  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    stage: '${opt:stage, "dev"}',
    region: 'us-west-1',
    environment: {
      SES_FROM_EMAIL: '${ssm:/${self:provider.stage}/ses/ses_from_email}',
    },
    apiGateway: {
      minimumCompressionSize: 1024,
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['ses:SendTemplatedEmail'],
        Resource: '*',
      },
    ],
  },
  functions,
  plugins: [
    'serverless-offline',
    'serverless-export-env',
    'serverless-esbuild',
    'serverless-domain-manager',
    'serverless-certificate-creator',
    'serverless-add-api-key',
  ],
  custom: {
    dev: {
      name: 'dev',
      domainName: 'cohub.click',
    },
    prod: {
      name: 'prod',
      domainName: 'talvio.co',
    },
    customDomain: {
      rest: {
        domainName: 'api.${self:custom.${self:provider.stage}.domainName}',
        certificateName: '${self:custom.${self:provider.stage}.domainName}',
        stage: '${self:provider.stage}',
        basePath: 'email',
        createRoute53Record: true,
      },
    },
    apiKeys: [
      {
        name: '${ssm:/${self:provider.stage}/gw/generic/api-key-name}',
      },
    ],
    esbuild: {
      bundle: true,
      minify: true,
      target: 'node18',
      platform: 'node',
      sourcemap: true,
      external: ['aws-sdk'],
    },
    export: {
      filename: '.env',
    },
  },
  package: {
    individually: true,
  },
};

module.exports = serverlessConfiguration;
