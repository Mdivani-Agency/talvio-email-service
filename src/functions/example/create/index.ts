export const addVote = {
  handler: 'src/functions/example/create/handler.main',
  events: [
    {
      http: {
        method: 'post',
        path: 'example',
        cors: true,
      },
    },
  ],
};
