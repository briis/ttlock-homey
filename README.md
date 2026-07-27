# TTLock for Homey

![TTLock smart lock on a front door at dusk](assets/images/xlarge.png)

> ⚠️ **Still in development.** This app is not yet published to the Homey App Store and isn't
> ready for general use. Everything below describes the intended experience once it's released.

Control your [TTLock](https://www.ttlock.com/) smart locks straight from Homey. Lock and unlock
your door, keep an eye on the battery level, and bring your existing TTLock locks into your Homey
flows — no extra hardware, no hub, just your existing TTLock account.

## Features

- 🔒 **Lock & unlock** your TTLock door locks from the Homey app, Homey flows, or voice assistants
  connected to Homey.
- 🔋 **Battery monitoring**, so you always know when it's time to change the batteries.
- 👪 **Uses your own TTLock account** — no separate registration, no extra app. If it works in the
  TTLock app, it'll show up here.
- ☁️ Works over the cloud via the official TTLock API, the same connection used by TTLock's own
  app, so there's nothing extra to install on your TTLock hardware.

## Getting started

1. Install **TTLock** from the [Homey App Store](https://homey.app).
2. In the Homey app, add a new device and choose **TTLock**.
3. Log in with your TTLock account — the same username and password you use in the TTLock mobile
   app.
4. Pick the lock(s) you want to add and finish the pairing wizard. That's it — your locks are now
   ready to use in Homey, including in flows.

**Requirements:** a TTLock smart lock connected to a TTLock Gateway (Wi-Fi or Ethernet), and a
TTLock account with that lock already added in the TTLock app.

## Getting help

Found a bug or have a feature request? Please open an issue on the
[GitHub issue tracker](https://github.com/briis/ttlock-homey/issues).

## Want to contribute or build this app yourself?

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup, project structure, and the publishing workflow.

## License

[MIT](LICENSE)
