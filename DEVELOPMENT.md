# Developing TTLock for Homey

This document covers building, running, and publishing this app. If you just want to use the app
on your Homey, see [README.md](README.md) instead.

TTLock for Homey talks to TTLock's cloud API (the same API used by
[hass-ttlock](https://github.com/jbergler/hass-ttlock) for Home Assistant). v1 supports
locking/unlocking and battery level, via polling.

## Maintaining / publishing this app

1. Install dependencies:

   ```bash
   npm install
   ```

2. Register a TTLock cloud application at [open.ttlock.com/manager](https://open.ttlock.com/manager)
   to get a `client_id`/`client_secret` (manual approval, can take a few days). This is a
   **developer application**, registered once by the app maintainer, separate from any end user's
   TTLock mobile app account.
3. Copy `env.json.example` to `env.json` and fill in `TTLOCK_CLIENT_ID`/`TTLOCK_CLIENT_SECRET`
   from step 2. This file is gitignored and never committed — it only needs to exist locally, on
   the machine running the `homey` CLI commands below.
4. Log in to the Homey CLI and start development:

   ```bash
   npx homey login
   npx homey app run
   ```

   `homey app run`/`homey app install` read `env.json` locally and send those values to the target
   Homey for that session/install — they're never written into the app's source files or the
   packaged app bundle.
5. When ready to release, `npx homey app publish` (see [Useful commands](#useful-commands) below)
   again reads `env.json` locally and submits the values alongside the build to Athom, who store
   them securely and inject them into every user's installation of that published version. This is
   the same one-time step for every future version bump — end users never see or configure
   `client_id`/`client_secret` themselves, only their own TTLock login during pairing.

Still using placeholder values from the original template — replace before publishing:

| Placeholder | Location | Replace with |
| --- | --- | --- |
| `homey-app-template` | `package.json` (`name`) | your app's package name |

## Project structure

```
.
├── app.js                  # App entry point
├── app.json                # App manifest (id, name, images, drivers, flow cards, ...)
├── assets/                 # App icon and store images
├── drivers/                # Device drivers (drivers/lock/ is the TTLock lock driver)
├── locales/                # Translations, e.g. locales/en.json
├── .homeychangelog.json    # Per-version changelog shown in the Homey app store
└── env.json.example        # Template for secrets used via Homey.env (copy to env.json)
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
