# Developing TTLock for Homey

This document covers building, running, and publishing this app. If you just want to use the app
on your Homey, see [README.md](README.md) instead.

TTLock for Homey talks to TTLock's cloud API (the same API used by
[hass-ttlock](https://github.com/jbergler/hass-ttlock) for Home Assistant): locking/unlocking,
battery, gateway signal, door sensor, auto-lock, lock sound, and passage mode, via a 5-minute poll
plus a TTLock webhook for near-instant updates.

## Maintaining / publishing this app

1. Install dependencies:

   ```bash
   npm install
   ```

2. Register your own TTLock cloud application at
   [open.ttlock.com/manager](https://open.ttlock.com/manager) to get a `client_id`/`client_secret`
   (manual approval, can take a few days). Unlike a typical OAuth2 integration, this app does
   **not** ship with a maintainer-registered client shared by every user — TTLock's Open Platform
   application is per-developer, and each Homey user registers their own and enters it into the
   app's Settings (see [README.md](README.md#creating-a-ttlock-oauth-app)) before pairing a lock.
   For local development you need one too, for testing.
3. Register a webhook for this app at
   [tools.developer.homey.app/webhooks](https://tools.developer.homey.app/webhooks) to get a
   `WEBHOOK_ID`/`WEBHOOK_SECRET` pair. Unlike the TTLock client ID/secret above, this **is**
   maintainer-owned and shared across every install — it's Homey's own routing plumbing (it tells
   Homey's webhook relay which app a callback belongs to) and grants no access to anyone's TTLock
   account, so there's no per-user privacy concern in keeping this one centralized.
4. Copy `env.json.example` to `env.json` and fill in `WEBHOOK_ID`/`WEBHOOK_SECRET` from step 3.
   This file is gitignored and never committed — it only needs to exist locally, on the machine
   running the `homey` CLI commands below. Without it the app still runs fine, just without
   webhook support (falls back to polling only).
5. Log in to the Homey CLI and start development:

   ```bash
   npx homey login
   npx homey app run
   ```

6. Once the app is running, open its Settings in the Homey app and enter your TTLock Client
   ID/Secret from step 2, then pair a lock as any user would. Real webhook delivery can't be
   tested via `homey app run` — it needs a physically installed app (`homey app install`) and the
   webhook URL (shown in that same Settings page) pasted into open.ttlock.com/manager.
7. When ready to release, `npx homey app publish` reads `env.json` locally and submits
   `WEBHOOK_ID`/`WEBHOOK_SECRET` alongside the build to Athom, same as any other app secret — this
   is a one-time step per version bump, not something end users configure.

## Project structure

```
.
├── app.js                  # App entry point; also registers/dispatches the TTLock webhook
├── app.json                # App manifest (id, name, images, drivers, flow cards, ...)
├── api.js                  # Custom API endpoint used by settings/index.html
├── assets/                 # App icon and store images
├── drivers/                # Device drivers (drivers/lock/ is the TTLock lock driver)
├── lib/                    # TTLock API client, OAuth2 token, webhook event descriptions
├── locales/                # Translations, e.g. locales/en.json
├── settings/               # Custom app Settings page (Client ID/Secret, webhook URL)
├── env.json.example        # Template for WEBHOOK_ID/WEBHOOK_SECRET (copy to env.json)
└── .homeychangelog.json    # Per-version changelog shown in the Homey app store
```

## Adding a driver

This app is in "flat" (non-Homey-Compose) mode: each driver's `id`/`name`/`class`/`capabilities`/
`pair` live directly in the root `app.json` (see the `lock` entry in `drivers`) rather than in a
per-driver `driver.compose.json`. `npx homey app driver create` will offer to migrate the project
to Homey Compose first — only do that intentionally, as it restructures how `app.json` is
maintained. To add a driver by hand instead, copy `drivers/lock/` as a starting point: a
`driver.js`/`device.js` pair extending `homey-oauth2app`'s `OAuth2Driver`/`OAuth2Device` (see
`lib/TTLockOAuth2Client.js` for the shared API client), plus an `assets/` folder with `icon.svg`
and generated `images/{small,large,xlarge}.png`, and a matching entry added to `app.json`'s
`drivers` array. See the [SDK guide on drivers](https://apps.developer.homey.app/wireless/overview)
for Zigbee/Z-Wave devices, or the [Devices guide](https://apps.developer.homey.app/the-basics/devices)
for cloud/API-based devices.

## Useful commands

| Command | Description |
| --- | --- |
| `npx homey app validate` | Validate the app structure (use `--level publish` before releasing) |
| `npx homey app run` | Run the app on a Homey for local development, with live reload |
| `npx homey app install` | Build and install the app on a Homey |
| `npx homey app version` | Bump the version and add a changelog entry |
| `npx homey app publish` | Publish a new build to the Homey App Store |
| `npm run lint` | Lint the code with the [Athom ESLint config](https://github.com/athombv/node-eslint-config-athom) |

## CI

`.github/workflows/validate.yml` lints and validates the app on every push and pull request
against `main`.

## Resources

- [Homey Apps SDK documentation](https://apps.developer.homey.app/)
- [Homey Apps SDK API reference](https://apps-sdk-v3.developer.homey.app/)
- [Homey Community Forum](https://community.homey.app/c/apps/17)
