// The backend stores and sends UTC, and a timestamp it sends often has no zone suffix
// ("2026-11-05T14:05:00"). new Date() reads such a value as the viewer's own local time, which shows the
// UTC clock time as if it were local (a post scheduled for 4:05 PM showed as 2:05 PM) and shifts every
// comparison with "now". A date-time with no zone is UTC; anything else is read as it is.
export function parseApiDate(raw: string): Date {
  const hasTime = /T\d{2}:\d{2}/.test(raw);
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);
  return new Date(hasTime && !hasZone ? `${raw}Z` : raw);
}
