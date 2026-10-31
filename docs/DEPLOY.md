# Hosted deployment

The hosted copy is a Cloudflare Workers static-assets site. It is published by the `deploy` job
in `.github/workflows/release.yml` after the `assets` job has built and attached a release. Nothing
deploys from a laptop, Replit, or an agent session: pushing an app tag (`*-app`) is the only
trigger. This file is the template for the other tyoh.app projects.

## What is published

| Path | Source |
|---|---|
| `/` | `Unicode.html` copied as `index.html` |
| `/Unicode.html` | `Unicode.html` (redirects to `/Unicode` under Cloudflare's default HTML handling) |
| `/unicode-fonts/` | sidecar packs from `npm run build:packs`, loaded on demand by Complete |

Cloudflare limits each static file to 25 MiB. Packs are capped at 8 MiB and `Unicode.html` is
about 3.3 MB, so both fit. The edition zips stay on GitHub Releases and are not published.

## One-time setup

1. In Cloudflare, create an API token from the **Edit Cloudflare Workers** template, scoped to
   the account.
2. In this repository's **Settings → Secrets and variables → Actions**:
   - secret `CLOUDFLARE_API_TOKEN`: the token;
   - variable `CLOUDFLARE_ACCOUNT_ID`: the account ID from the Cloudflare dashboard.
3. Tag a release as usual. The deploy job is skipped while `CLOUDFLARE_ACCOUNT_ID` is unset, so
   the release workflow stays green before setup.

The first deploy creates the Worker `unicode-explorer` and serves it at
`unicode-explorer.<account-subdomain>.workers.dev`.

## Custom domain

`unicode.tyoh.app` can only be attached once the `tyoh.app` zone is on Cloudflare DNS. Then
uncomment the `routes` entry in `wrangler.jsonc` and tag the next release; Wrangler creates the DNS
record and certificate. The `workers.dev` address can be turned off afterwards by setting
`"workers_dev": false`.

## Routine operations

| Task | How |
|---|---|
| Publish a release | Push the app tag; `release` builds, attaches assets, then deploys |
| Redeploy the same release | Actions → the tag's `release` run → re-run the `deploy` job only (artifact kept 7 days) |
| Roll back | Cloudflare dashboard → Workers → `unicode-explorer` → Deployments → roll back, or re-run an older tag's `deploy` job within 7 days |
| Pause deploys | Delete or empty the `CLOUDFLARE_ACCOUNT_ID` variable |

## Adapting this for another app

Copy `wrangler.jsonc` and the `deploy` job. Change the Worker `name`, the staged files in the
`Stage the hosted site` step, and the custom-domain pattern. Server apps add a `main` entry or a
container to `wrangler.jsonc`; the deploy job and secrets stay the same.
