# TTLock for Homey

![TTLock smart lock on a front door at dusk](assets/images/xlarge.png)

**Control and monitor your TTLock smart locks.**

Lock and unlock your door from Homey, keep an eye on the battery, and see who opened it and how —
no extra hardware, no hub, just your existing [TTLock](https://www.ttlock.com/) account. If it
works in the TTLock app, it shows up here.

Build flows around your door: turn on the hallway light when someone unlocks it with a fingerprint,
get a notification when the lock raises a tamper alert, or lock up automatically when everyone has
left. It works over TTLock's official cloud API, so there's nothing to install on your lock.

## Supported devices

TTLock smart door locks connected to a TTLock Gateway (Wi-Fi or Ethernet), added to your TTLock
account in the TTLock app.

| Capability | Details |
| --- | --- |
| 🔒 Lock / unlock | From the Homey app, flows, or voice assistants connected to Homey |
| 🔋 Battery | Level and low-battery alarm |
| 📶 Gateway signal | Signal strength, to spot a lock drifting out of range |
| 🚪 Door sensor | Open/closed, for locks that have one |
| 🔁 Auto Lock, Lock Sound | Toggles; plus a read-only Passage Mode indicator |
| 👤 Last operator & trigger | Who last locked/unlocked and how (needs the webhook) |

## Flow cards

The three triggers — *Lock was…*, *Tamper alert* and *Too many invalid
attempts* — only fire when the [TTLock webhook](#getting-near-instant-updates-optional) is set up.

**When…**

<p>
<img src="assets/flow/when-01.svg" width="280" alt="Locked">
<img src="assets/flow/when-02.svg" width="280" alt="Unlocked">
<img src="assets/flow/when-03.svg" width="280" alt="Lock was …">
<img src="assets/flow/when-04.svg" width="280" alt="Tamper alert">
<img src="assets/flow/when-05.svg" width="280" alt="Too many invalid attempts">
<img src="assets/flow/when-06.svg" width="280" alt="Battery alarm turned on">
<img src="assets/flow/when-07.svg" width="280" alt="Battery alarm turned off">
<img src="assets/flow/when-08.svg" width="280" alt="Battery level changed">
<img src="assets/flow/when-09.svg" width="280" alt="Battery became greater than % %">
<img src="assets/flow/when-10.svg" width="280" alt="Battery became less than % %">
<img src="assets/flow/when-11.svg" width="280" alt="Signal strength changed">
<img src="assets/flow/when-12.svg" width="280" alt="Signal strength became greater than dB dB">
<img src="assets/flow/when-13.svg" width="280" alt="Signal strength became less than dB dB">
<img src="assets/flow/when-14.svg" width="280" alt="Locked for Duration …">
<img src="assets/flow/when-15.svg" width="280" alt="Unlocked for Duration …">
<img src="assets/flow/when-16.svg" width="280" alt="Battery alarm turned on for Duration …">
<img src="assets/flow/when-17.svg" width="280" alt="Battery alarm turned off for Duration …">
<img src="assets/flow/when-18.svg" width="280" alt="Battery greater than % % for Duration">
<img src="assets/flow/when-19.svg" width="280" alt="Battery less than % % for Duration">
<img src="assets/flow/when-20.svg" width="280" alt="Signal greater than dB dB for Duration">
<img src="assets/flow/when-21.svg" width="280" alt="Signal less than dB dB for Duration">
</p>

**And…**

<p>
<img src="assets/flow/and-01.svg" width="280" alt="A lock has been locked">
<img src="assets/flow/and-02.svg" width="280" alt="Battery alarm is on">
<img src="assets/flow/and-03.svg" width="280" alt="Battery is exactly Value">
<img src="assets/flow/and-04.svg" width="280" alt="Battery is less than Number">
<img src="assets/flow/and-05.svg" width="280" alt="Battery is greater than Number">
<img src="assets/flow/and-06.svg" width="280" alt="Signal strength is exactly Value">
<img src="assets/flow/and-07.svg" width="280" alt="Signal strength is less than Number">
<img src="assets/flow/and-08.svg" width="280" alt="Signal strength is greater than Number">
</p>

**Then…**

<p>
<img src="assets/flow/then-01.svg" width="280" alt="Unlock">
<img src="assets/flow/then-02.svg" width="280" alt="Lock">
</p>

## Creating a TTLock OAuth app

TTLock requires every app that talks to their cloud API to have its own registered OAuth
application — this one isn't shared between users, so you'll need to create your own once (the
same requirement applies to [hass-ttlock](https://github.com/jbergler/hass-ttlock), the equivalent
Home Assistant integration, if you've set that up before):

1. Go to [open.ttlock.com/manager](https://open.ttlock.com/manager) and create an account.
2. Register an application. This takes a few days to get approved by TTLock.
3. Once approved, note down its **Client ID** and **Client Secret**.

## Getting started

1. Install **TTLock** from the [Homey App Store](https://homey.app).
2. Open the app's Settings in Homey and enter the Client ID/Secret from the previous section.
3. In the Homey app, add a new device and choose **TTLock**.
4. Log in with your TTLock account — the same username and password you use in the TTLock mobile
   app.
5. Pick the lock(s) you want to add and finish the pairing wizard. That's it — your locks are now
   ready to use in Homey, including in flows.
6. *(Optional)* To lock and unlock by tapping the device tile, open the lock's settings in Homey
   and set **Quick Action** to **Locked**. Homey doesn't preselect one for locks, so by default
   the tile does nothing when tapped.

**Requirements:** a TTLock smart lock connected to a TTLock Gateway (Wi-Fi or Ethernet), a TTLock
account with that lock already added in the TTLock app, and your own TTLock OAuth app (see above).

## Getting near-instant updates (optional)

By default the app re-checks lock state every 30 minutes (battery and other settings every 6 hours;
both adjustable in the device settings) to stay within TTLock's free API quota, so changes can
take a while to show up in Homey. For near-instant updates instead, wire up TTLock's webhook:

1. Open the app's Settings in Homey — under "Real-time updates" you'll find your webhook URL.
2. Go back to [open.ttlock.com/manager](https://open.ttlock.com/manager), open your application,
   and paste that URL into its callback URL field.
3. Lock or unlock the door (from the TTLock app, a keypad, fingerprint, etc.) and the lock's state,
   "Last Operator", and "Last Trigger" should update in Homey within a couple of seconds.

Without this step everything still works, just on the slower poll.

## Support

Found a bug or have a feature request? Please open an issue on the
[GitHub issue tracker](https://github.com/briis/ttlock-homey/issues).

## Want to contribute or build this app yourself?

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup, project structure, and the publishing workflow.

## Privacy

See [PRIVACY.md](PRIVACY.md) for what this app stores and sends, and to whom.

## License

[MIT](LICENSE)
