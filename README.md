# TTLock for Homey

A [Homey](https://homey.app) app for [TTLock](https://www.ttlock.com/) smart locks, talking to
TTLock's cloud API (the same API used by [hass-ttlock](https://github.com/jbergler/hass-ttlock)
for Home Assistant). v1 supports locking/unlocking and battery level, via polling.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Register a TTLock cloud application at [open.ttlock.com/manager](https://open.ttlock.com/manager)
   to get a `client_id`/`client_secret` (manual approval, can take a few days). This is a
   **developer application**, separate from your TTLock mobile app account.
3. Copy `env.json.example` to `env.json` and fill in `TTLOCK_CLIENT_ID`/`TTLOCK_CLIENT_SECRET`
   from step 2.
4. Log in to the Homey CLI and start development:

   ```bash
   npx homey login
   npx homey app run
   ```

5. Add a "Lock" device in the Homey app/companion. When pairing, log in with your **TTLock mobile
   app account** username/password (not the open.ttlock.com developer account) — the app fetches
   the list of locks on that account via `lock/list`.

Still using placeholder values from the original template — replace before publishing:

| Placeholder | Location | Replace with |
|---|---|---|
| `com.yourname.appname` | `app.json` (`id`) | your app's unique ID (reverse domain notation) |
| `Your Name` / `you@example.com` | `app.json` (`author`) | your name and email |
| `yourname/yourapp` | `app.json` (`bugs`, `source`, `support`) | your GitHub repo path |
| `homey-app-template` | `package.json` (`name`) | your app's package name |
| `assets/icon.svg`, `drivers/lock/assets/icon.svg` and their generated `images/` | app/driver icon | your own artwork (run `homey app build` after changing an SVG to regenerate the PNGs) |

## Project structure

```
.
├── app.js                  # App entry point
├── app.json                # App manifest (id, name, images, drivers, flow cards, ...)
├── assets/                 # App icon and store images
├── drivers/                # Device drivers (empty by default — see below)
├── locales/                # Translations, e.g. locales/en.json
├── .homeychangelog.json    # Per-version changelog shown in the Homey app store
└── env.json.example        # Template for secrets used via Homey.env (copy to env.json)
```

## Adding a driver

Drivers represent the devices your app supports. Scaffold one with:

```bash
npx homey app driver create
```

This adds a `drivers/<driver-id>/` folder with `driver.js`, `device.js`, `driver.compose.json`
and `assets/images/`. See the [SDK guide on drivers](https://apps.developer.homey.app/wireless/overview)
for Zigbee/Z-Wave devices, or the [Devices guide](https://apps.developer.homey.app/the-basics/devices)
for cloud/API-based devices.

## Useful commands

| Command | Description |
|---|---|
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

## License

[MIT](LICENSE)
