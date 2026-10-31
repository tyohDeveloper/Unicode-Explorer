# Hosted deployment

The hosted copy is a Cloudflare Workers static-assets site, published by
`.github/workflows/deploy.yml`. The site is rebuilt from a published GitHub release rather than
from a build in the same run, so every release that has a complete-hieroglyphs zip can be
deployed at any time, and rolling back is just deploying an older tag.

Nothing deploys from a laptop, Replit, or an agent session. The two triggers are:

| Trigger | When |
|---|---|
| App tag (`*-app`) | `release.yml` builds and attaches the release, then calls `deploy.yml` with that tag |
| Manual | Actions → **deploy** → **Run workflow**, with a tag or blank for the latest release |

This file and `deploy.yml` are the template for the other tyoh.app projects.

## What is published

`deploy.yml` downloads `unicode-explorer-complete-hieroglyphs-<version>.zip` from the release and
unpacks it as the site, then copies `Unicode.html` to `index.html`.

| Path | Content |
|---|---|
| `/` | `Unicode.html`, served as `index.html` |
| `/Unicode.html` | Same file; Cloudflare's default HTML handling redirects it to `/Unicode`, keeping the query and `#` state |
| `/unicode-fonts/` | Every sidecar pack, the edition's `manifest.js`, `README.txt`, and `LICENSES/` for the packed fonts |

The job fails before deploying if `Unicode.html`, `unicode-fonts/manifest.js` or
`unicode-fonts/LICENSES/` is missing. Cloudflare limits each static file to 25 MiB; packs are
capped at 8 MiB and `Unicode.html` is about 3.3 MB. Assets are served with
`Cache-Control: public, max-age=0, must-revalidate`, so browsers revalidate unhashed pack names
after each deploy.

## One-time setup

1. In Cloudflare, create an API token from the **Edit Cloudflare Workers** template, scoped to
   the account.
2. In this repository's **Settings → Secrets and variables → Actions**, add both:
   - secret `CLOUDFLARE_API_TOKEN`: the token;
   - variable `CLOUDFLARE_ACCOUNT_ID`: the account ID from the Cloudflare dashboard.
3. Run Actions → **deploy** → **Run workflow** with the tag blank to publish the latest release.

Until `CLOUDFLARE_ACCOUNT_ID` is set, tag releases skip the deploy and stay green. A manual run
without both settings fails with a message naming the missing one.

The first deploy creates the Worker `unicode-explorer` and serves it at
`unicode-explorer.<account-subdomain>.workers.dev`.

## Custom domain

`unicode.tyoh.app` can only be attached once the `tyoh.app` zone is on Cloudflare DNS. Then
uncomment the `routes` entry in `wrangler.jsonc`, merge, and run a manual deploy; Wrangler creates
the DNS record and certificate. The token may need extra zone permissions for this step. The
`workers.dev` address can be turned off afterwards with `"workers_dev": false`.

## Routine operations

| Task | How |
|---|---|
| Publish a release | Push the app tag |
| Redeploy the current release | Actions → deploy → Run workflow, tag blank |
| Roll back | Actions → deploy → Run workflow with the older tag, or Cloudflare dashboard → Workers → `unicode-explorer` → Deployments |
| Pause automatic deploys | Delete the `CLOUDFLARE_ACCOUNT_ID` variable |
| Require approval | Settings → Environments → `production` → add yourself as a required reviewer |

Manual runs use `wrangler.jsonc` from the branch the run is started on (`main` by default), so a
Cloudflare setting changed on `main` applies even when an older release is deployed. The **Run
workflow** button appears once `deploy.yml` is on `main`.

## Adapting this for another app

Copy `deploy.yml`, `wrangler.jsonc` and the `deploy` job in `release.yml`. Change the Worker
`name`, the release asset pattern and the checks in **Stage the hosted site from the release**,
the tag pattern if it differs, and the custom-domain route. Server apps add a `main` entry or a
container to `wrangler.jsonc`; the trigger, secrets and environment stay the same.
