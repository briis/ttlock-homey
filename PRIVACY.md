# Privacy & Data Use — TTLock for Homey

This document describes what the TTLock app for Homey does with data,
in plain terms.

## What the app stores

The app stores the following on your Homey only (never sent anywhere
except as described below):

- The Client ID and Client Secret of your own TTLock OAuth app, which
  you register yourself at open.ttlock.com/manager and enter in this
  app's Settings (see the README) — this app has no client credentials
  of its own, and doesn't share yours with anyone else
- An OAuth2 access token and refresh token for your TTLock account,
  obtained during pairing
- The lock ID and name/alias you selected while pairing
- The current lock state (locked/unlocked) and battery percentage, shown
  as the device's capability values, refreshed every 60 seconds

Your TTLock username and password are used once, during pairing, to
obtain the OAuth2 token described above (see next section) — they are
not stored by the app afterwards. Only the resulting token is kept, the
same way a browser keeps a login session rather than your password.

## What the app sends, and to whom

During pairing, your TTLock username and password (hashed, never sent
in plain text) are sent once to TTLock's cloud API
(`https://euapi.ttlock.com`) to obtain an OAuth2 token.

After pairing, the app talks to that same TTLock cloud API to:

- Poll each paired lock's state and battery level, once every 60 seconds
- Send lock/unlock commands when triggered from the Homey app, a flow,
  or a connected voice assistant

Every request carries your personal access token plus the `client_id`/
`client_secret` of your own TTLock OAuth app, entered in this app's
Settings — and nothing else: no other Homey identifiers, no location
data, no analytics payload.

The app makes no other outbound requests. It doesn't use analytics,
crash reporting, or any third-party tracking service, and it doesn't
share data with any party other than the TTLock cloud API calls above,
which are required for the app to function at all.

## Data retention

Capability values (lock state, battery level) are overwritten on every
poll — there's no history kept beyond what Homey's own Insights feature
stores, which is standard Homey behaviour applying equally to every
app's capabilities and is controlled by your own Homey/Insights
settings, not by this app.

Removing a lock from Homey deletes its stored access/refresh token and
capability history from your Homey. It does not affect the lock's
registration in your TTLock account — you can still manage it from the
TTLock mobile app afterwards. Your Client ID/Secret stay in the app's
Settings until you clear them yourself or uninstall the app.

## Contact

Questions about this app's data handling: bjarne@briis.com
