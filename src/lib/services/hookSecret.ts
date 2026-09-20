import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

let cachedSecret: string | undefined;

export function resetHookSecretCache(): void {
  cachedSecret = undefined;
}

export async function getHookSecret(): Promise<string> {
  if (process.env.SEND_EMAIL_HOOK_SECRET) {
    return process.env.SEND_EMAIL_HOOK_SECRET;
  }
  if (cachedSecret !== undefined) {
    return cachedSecret;
  }

  const stage = process.env.STAGE || 'dev';
  const client = new SSMClient({ region: process.env.AWS_REGION || 'us-west-1' });
  const result = await client.send(
    new GetParameterCommand({
      Name: `/${stage}/email/hook-secret`,
      WithDecryption: true,
    }),
  );

  cachedSecret = result.Parameter?.Value || '';
  return cachedSecret;
}
