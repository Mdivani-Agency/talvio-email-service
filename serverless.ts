import type { AWS } from '@serverless/typescript';

import * as functions from './src/functions';

const serverlessConfiguration: AWS = {
  service: '${self:custom.${self:provider.stage}.name}-rest-template',
  frameworkVersion: '3',

  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    stage: '${opt:stage, "dev"}',
    region: 'us-west-1',
    environment: {},
    apiGateway: {
      minimumCompressionSize: 1024,
    },
    iamRoleStatements: [],
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
    },
    prod: {
      name: 'prod',
    },
    customCertificate: {
      certificateName: '',
      hostedZoneIds: '',
      rewriteRecords: true,
    },
    customDomain: {
      rest: {
        domainName: '',
        stage: '${self:provider.stage}',
        basePath: 'v1',
        createRoute53Record: true,
      },
    },
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
