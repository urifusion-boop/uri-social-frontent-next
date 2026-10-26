// No NEXT_PUBLIC_ENV var is actually set in any of the .env.* files, so
// environment can't be read directly — the API base URL is the one value
// that's reliably different per environment (dev: api-social-dev, staging:
// api-staging, production: the bare api.urisocial.com domain), so it's
// used here as the signal instead.
export const IS_PRODUCTION = process.env.NEXT_PUBLIC_URI_API_BASE_URL === 'https://api.urisocial.com';
