import type { AWS } from '@serverless/typescript';

import * as functions from './src/functions';

// serverless-offline@12 is ESM + top-level await. Serverless v3 loads plugins
// with require(), which Node 22+ rejects. Only attach it for local offline.
const runningOffline = process.argv.some((arg) => arg === 'offline' || arg === 'start');

const serverlessConfiguration: AWS = {
  service: 'email-service',
  frameworkVersion: '3',

  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    stage: '${opt:stage, "dev"}',
    region: 'us-west-1',
    environment: {
      STAGE: '${self:provider.stage}',
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
      {
        Effect: 'Allow',
        Action: ['ssm:GetParameter'],
        Resource: [
          'arn:aws:ssm:${self:provider.region}:*:parameter/${self:provider.stage}/email/hook-secret',
        ],
      },
    ],
  },
  functions,
  plugins: [
    ...(runningOffline ? ['serverless-offline'] : []),
    'serverless-export-env',
    'serverless-esbuild',
    'serverless-domain-manager',
    'serverless-add-api-key',
  ],
  custom: {
    dev: {
      name: 'dev',
      domainName: 'dev.talvio.co',
    },
    prod: {
      name: 'prod',
      domainName: 'talvio.co',
    },
    customDomain: {
      rest: {
        domainName: 'api.${self:custom.${self:provider.stage}.domainName}',
        certificateArn:
          '${ssm:/${self:provider.stage}/ssl/arn/${self:custom.${self:provider.stage}.domainName}}',
        stage: '${self:provider.stage}',
        basePath: 'email',
        endpointType: 'edge',
        securityPolicy: 'tls_1_2',
        createRoute53Record: true,
      },
    },
    apiKeys: [
      {
        name: '${ssm:/${self:provider.stage}/gw/generic/api-key-name}',
        usagePlan: {
          name: '${ssm:/${self:provider.stage}/gw/generic/usageplan-name}',
        },
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
