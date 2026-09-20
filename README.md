# talvio-email-service

Sole sender for Talvio mail (D5). App-triggered `welcome` stays on the API-key route. Supabase Auth OTP / magic link / recovery / invite / email change go through the public Standard Webhooks hook.

Linear: [MDI-186](https://linear.app/mdivani/issue/MDI-186)

## Routes

| Route | Auth | Body |
| --- | --- | --- |
| `POST https://api.dev.talvio.co/email/hooks/send-email` | Standard Webhooks (`webhook-id`, `webhook-timestamp`, `webhook-signature`). **No** `X-API-KEY`. | Supabase Auth [send_email hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook) payload |
| `POST https://api.dev.talvio.co/email/private/v1/send` | API Gateway API key (`X-API-KEY`) | `{ to, template, templateData }` |

Prod host is `api.talvio.co` (`domainName = talvio.co`).

### Public hook

1. Reject non-POST (405).
2. Verify the **raw body** with `standardwebhooks`. Secret comes from `SEND_EMAIL_HOOK_SECRET` or SSM `/${stage}/email/hook-secret`. Strip `v1,` then `whsec_` (library also accepts `whsec_…`). Invalid signature → **401** `{ error: { message } }`.
3. Map `email_data.email_action_type` → SES template. Unknown type → **400**, no SES call.
4. `ses:SendTemplatedEmail` from `SES_FROM_EMAIL` (`no-reply@dev.talvio.co` in dev).
5. Success → **200** `{}`.

Do not send Auth mail through `private/v1/send`. The hook body is not `{ to, template, templateData }`.

### Private send (welcome)

```json
{
  "to": ["user@example.com"],
  "template": "welcome",
  "templateData": { "name": "Ada", "email": "user@example.com", "site_url": "https://dev.talvio.co" }
}
```

`template` may also be an Auth template name for manual tests (`magic_link`, `recovery`, `invite`, `email_change`). Unknown template → 400.

## SES templates

| `email_action_type` / app | SES template | Placeholders |
| --- | --- | --- |
| `signup`, `magiclink` | `magic_link` | `token`, `confirmation_url`, `email`, `site_url` |
| `recovery` | `recovery` | same |
| `invite` | `invite` | same |
| `email_change` | `email_change` | `token`, `token_new`, `confirmation_url`, `old_email`, `email`, `site_url` |
| `POST private/v1/send` | `welcome` | `name`, `email`, `site_url` |

`confirmation_url` is built in the hook:

```
{site_url}/auth/v1/verify?token={token_hash}&type={email_action_type}&redirect_to={redirect_to}
```

Templates themselves live in `talvio-terraform-iac` (`variables/templates/`).

## Stage / SSM

| Stage | Domain | Custom domain |
| --- | --- | --- |
| `dev` | `dev.talvio.co` | `api.dev.talvio.co/email` |
| `prod` | `talvio.co` | `api.talvio.co/email` |

| Path | Use |
| --- | --- |
| `/${stage}/ses/ses_from_email` | From address |
| `/${stage}/gw/generic/api-key-name` | Private route API key |
| `/${stage}/gw/generic/usageplan-name` | Usage plan |
| `/${stage}/ssl/arn/${domain}` | Existing us-east-1 ACM cert (edge custom domain) |
| `/${stage}/email/hook-secret` | Standard Webhooks secret (`v1,whsec_…`) |
| `/${stage}/ci/deploy-role-arn` | GitHub Actions OIDC role |

## Local

```bash
cp .env.example .env
corepack enable
yarn install
yarn lint
yarn test:coverage
yarn start   # serverless-offline → http://localhost:3000
```

Hook (offline): `POST http://localhost:3000/hooks/send-email`

Local Supabase (`talvio-web-app/supabase/config.toml`):

```toml
[auth.hook.send_email]
enabled = true
uri = "http://host.docker.internal:3000/hooks/send-email"
secrets = "env(SEND_EMAIL_HOOK_SECRET)"
```

Use the same `SEND_EMAIL_HOOK_SECRET` as `.env.example` (or your generated `v1,whsec_…` value).

## GitHub Actions

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

| Event | What runs |
| --- | --- |
| Pull request | lint + test |
| Push to `development`, or `workflow_dispatch` stage=`dev` | `sls deploy --stage dev` (Environment `dev`) |
| `workflow_dispatch` stage=`prod` | `sls deploy --stage prod` (Environment `prod`) |

OIDC role is `talvio-gha-deploy-<env>` from `talvio-terraform-iac` bootstrap. Set Environment variable `AWS_DEPLOY_ROLE_ARN` (value is also in SSM `/${env}/ci/deploy-role-arn`). The workflow needs `id-token: write`.

Default branch is `development`. Email-service is trusted on `development` and GitHub Environments `dev` / `prod`.
