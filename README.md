# Homey App Template

A starter template for building [Homey](https://homey.app) apps with the
[Homey Apps SDK v3](https://apps.developer.homey.app/).

Click **Use this template** on GitHub to create a new repository from this one.

## Getting started

1. Create a new repo from this template and clone it.
2. Install the Homey CLI dependencies:

   ```bash
   npm install
   ```

3. Rename the app: search the project for the placeholders below and replace them with your own values.

   | Placeholder | Location | Replace with |
   |---|---|---|
   | `com.yourname.appname` | `app.json` (`id`) | your app's unique ID (reverse domain notation) |
   | `App Name` | `app.json` (`name.en`) | your app's display name |
   | `Your Name` / `you@example.com` | `app.json` (`author`) | your name and email |
   | `yourname/yourapp` | `app.json` (`bugs`, `source`, `support`) | your GitHub repo path |
   | `homey-app-template` | `package.json` (`name`) | your app's package name |

4. Replace `assets/icon.svg` and the generated images in `assets/images/` with your own app icon
   (run `homey app build` after changing the SVG to regenerate the PNGs).
5. Log in to the Homey CLI and start development:

   ```bash
   npx homey login
   npx homey app run
   ```

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
