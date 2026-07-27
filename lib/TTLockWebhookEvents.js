'use strict';

// Maps TTLock's numeric `recordType` (as sent in webhook records, see
// https://euopen.ttlock.com/document) to a human-readable description and the
// lock action it represents. Ported from hass-ttlock's `Event.EVENTS` table
// (custom_components/ttlock/models.py) so descriptions match what TTLock/HA users
// already see.

const ACTION_LOCK = 'lock';
const ACTION_UNLOCK = 'unlock';
const ACTION_UNKNOWN = 'unknown';

const EVENTS = {
  1: { action: ACTION_UNLOCK, description: 'unlock by app' },
  4: { action: ACTION_UNLOCK, description: 'unlock by passcode' },
  7: { action: ACTION_UNLOCK, description: 'unlock by IC card' },
  8: { action: ACTION_UNLOCK, description: 'unlock by fingerprint' },
  9: { action: ACTION_UNLOCK, description: 'unlock by wrist strap' },
  10: { action: ACTION_UNLOCK, description: 'unlock by mechanical key' },
  11: { action: ACTION_LOCK, description: 'lock by app' },
  12: { action: ACTION_UNLOCK, description: 'unlock by gateway' },
  29: { action: ACTION_UNKNOWN, description: 'apply some force on the lock' },
  30: { action: ACTION_UNKNOWN, description: 'door sensor closed' },
  31: { action: ACTION_UNKNOWN, description: 'door sensor open' },
  32: { action: ACTION_UNKNOWN, description: 'open from inside' },
  33: { action: ACTION_LOCK, description: 'lock by fingerprint' },
  34: { action: ACTION_LOCK, description: 'lock by passcode' },
  35: { action: ACTION_LOCK, description: 'lock by IC card' },
  36: { action: ACTION_LOCK, description: 'lock by mechanical key' },
  37: { action: ACTION_UNKNOWN, description: 'remote control' },
  42: { action: ACTION_UNKNOWN, description: 'received new local mail' },
  43: { action: ACTION_UNKNOWN, description: "received new other cities' mail" },
  44: { action: ACTION_UNKNOWN, description: 'tamper alert' },
  45: { action: ACTION_LOCK, description: 'auto lock' },
  46: { action: ACTION_UNLOCK, description: 'unlock by unlock key' },
  47: { action: ACTION_LOCK, description: 'lock by lock key' },
  48: { action: ACTION_UNKNOWN, description: 'system locked (too many invalid attempts)' },
  49: { action: ACTION_UNLOCK, description: 'unlock by hotel card' },
  50: { action: ACTION_UNLOCK, description: 'unlocked due to high temperature' },
  51: { action: ACTION_UNKNOWN, description: 'tried to unlock with a deleted card' },
  52: { action: ACTION_UNKNOWN, description: 'dead lock with app' },
  53: { action: ACTION_UNKNOWN, description: 'dead lock with passcode' },
  54: { action: ACTION_UNKNOWN, description: 'the car left (for parking lock)' },
  55: { action: ACTION_UNLOCK, description: 'unlock with key fob' },
  57: { action: ACTION_UNLOCK, description: 'unlock with QR code success' },
  58: { action: ACTION_UNKNOWN, description: "unlock with QR code failed, it's expired" },
  59: { action: ACTION_UNKNOWN, description: 'double locked' },
  60: { action: ACTION_UNKNOWN, description: 'cancel double lock' },
  61: { action: ACTION_LOCK, description: 'lock with QR code success' },
  62: { action: ACTION_UNKNOWN, description: 'lock with QR code failed, the lock is double locked' },
  63: { action: ACTION_UNLOCK, description: 'auto unlock at passage mode' },
  67: { action: ACTION_UNLOCK, description: '3D face unlock success' },
  68: { action: ACTION_UNKNOWN, description: '3D face unlock failed (locked)' },
  69: { action: ACTION_LOCK, description: 'locked via 3D face' },
  71: { action: ACTION_UNKNOWN, description: '3D face recognition failed (expired)' },
};

function describe(recordType) {
  return EVENTS[recordType] || { action: ACTION_UNKNOWN, description: 'unknown' };
}

module.exports = {
  describe, ACTION_LOCK, ACTION_UNLOCK, ACTION_UNKNOWN,
};
