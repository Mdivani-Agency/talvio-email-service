export const mockLambdaEvent = (
  params: {
    body?: Record<string, any>;
    queryStringParameters?: Record<string, string> | null;
    pathParameters?: Record<string, string>;
  },
) => ({
  body: params.body && JSON.stringify(params.body),
  ...params,
});
