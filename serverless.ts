import type { AWS } from '@serverless/typescript';

import * as functions from './src/functions';

type ServerlessV4 = AWS & {
  build?: {
    esbuild?: {
      bundle?: boolean;
      minify?: boolean;
      sourcemap?: boolean;
      exclude?: string[];
    };
  };
};

const serverlessConfiguration: ServerlessV4 = {
  service: 'email-service',
  frameworkVersion: '4',

  provider: {
    name: 'aws',
    runtime: 'nodejs22.x',
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
    'serverless-offline',
    'serverless-export-env',
    'serverless-domain-manager',
    'serverless-add-api-key',
  ],
  build: {
    esbuild: {
      bundle: true,
      minify: true,
      sourcemap: true,
      // Bundle pinned AWS SDK clients instead of the Lambda runtime SDK.
      exclude: ['!@aws-sdk/*'],
    },
  },
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
    export: {
      filename: '.env',
    },
  },
  package: {
    individually: true,
  },
};

module.exports = serverlessConfiguration;
