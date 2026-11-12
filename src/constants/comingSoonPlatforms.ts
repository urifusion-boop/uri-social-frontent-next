/**
 * Platforms shown in the content pickers but not offered yet: greyed out with
 * "Coming soon", can't be selected, and dropped from any pre-selection (e.g. a
 * Brand Playbook that lists them as target platforms), so nothing is generated for
 * them. Connected Accounts already shows X as Coming soon on its own.
 */
export const COMING_SOON_PLATFORMS = new Set<string>(['twitter', 'x']);

export const isComingSoonPlatform = (key: string): boolean => COMING_SOON_PLATFORMS.has(key);

export const withoutComingSoon = (keys: string[]): string[] => keys.filter((k) => !isComingSoonPlatform(k));
