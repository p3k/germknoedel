// A date of birth or expiry is a calendar date, not an instant: it has no
// time of day and no timezone. Both formats below force UTC explicitly via
// Intl/getUTC*, so there is nowhere left in this codebase to reach for a
// local-time accessor by mistake.

const displayFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  timeZone: 'UTC'
});

// The compact form embedded in the code itself, e.g. "700101".
export const toCodeDate = (date: Date | string | number): string => {
  date = new Date(date);

  return [
    String(date.getUTCFullYear()).substr(2),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('');
};

// The human-readable form shown to the user, e.g. "Thu Jan 01 1970" – the same
// shape as Date.prototype.toDateString(), but anchored in UTC instead of
// local time.
export const toDisplayDate = (date: Date | string | number): string =>
  displayFormat.format(new Date(date)).replace(/,/g, '');
