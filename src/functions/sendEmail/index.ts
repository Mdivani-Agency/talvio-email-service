export const sendEmailPrivate = {
    handler: 'src/functions/sendEmail/handler.main',
    events: [
      {
        http: {
          method: 'post',
          path: 'private/v1/send',
          private: true,
        },
      },
    ],
}
