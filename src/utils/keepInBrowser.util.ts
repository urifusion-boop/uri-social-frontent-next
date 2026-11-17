// On Android, every facebook.com address belongs to the Facebook app, so tapping
// Connect hands Facebook's sign-in to the app — which opens its feed and forgets
// the sign-in, and the person never gets back to URI. Instagram's sign-in runs
// through facebook.com too.
//
// Chrome keeps a navigation in the browser, through every redirect, when it was
// opened as an intent aimed at the browser itself (Chromium
// components/external_intents/README.md: "If an intent explicitly targeted the
// Chrome package, it should stay in Chrome even through redirects"). So on
// Android Chrome and Samsung Internet the connect link is sent that way. Anywhere
// else (iPhone, desktop, other browsers, in-app browsers) the link is unchanged.

const BROWSERS: { ua: RegExp; pkg: string }[] = [
  { ua: /SamsungBrowser\//, pkg: 'com.sec.android.app.sbrowser' },
  { ua: /Chrome\/\d/, pkg: 'com.android.chrome' },
];

// Browsers that also say "Chrome/" in their user agent but are a different app,
// and in-app browsers (Facebook, Instagram, WebView) where the person isn't signed
// in to URI in Chrome, so sending them there would lose their session.
const NOT_CHROME =
  /; wv\)|FBAN|FBAV|FB_IAB|Instagram|EdgA\/|OPR\/|OPT\/|Firefox|YaBrowser|UCBrowser|MiuiBrowser|HuaweiBrowser|HeyTapBrowser|VivoBrowser|DuckDuckGo|Brave/i;

export function keepInBrowser(url: string): string {
  if (typeof navigator === 'undefined') return url;
  const ua = navigator.userAgent || '';
  if (!/Android/i.test(ua) || NOT_CHROME.test(ua)) return url;
  const browser = BROWSERS.find((b) => b.ua.test(ua));
  if (!browser) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== 'https:') return url;
  return (
    `intent://${parsed.host}${parsed.pathname}${parsed.search}` +
    `#Intent;scheme=https;package=${browser.pkg};` +
    `S.browser_fallback_url=${encodeURIComponent(url)};end`
  );
}
