export const sendEmailHook = {
  handler: 'src/functions/sendEmailHook/handler.main',
  events: [
    {
      http: {
        method: 'post',
        path: 'hooks/send-email',
        private: false,
      },
    },
  ],
};
