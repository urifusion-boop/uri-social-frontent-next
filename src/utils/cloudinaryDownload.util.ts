// Chrome's native <video controls> download button (and its right-click "Download"
// context-menu item) just fetches the raw src URL — so whatever filename lives on
// our CDN leaks straight through, e.g. a Cloudinary public_id like
// "submagic-mixed-eb198feb6217.mp4", exposing an internal service name. The HTML
// `download` attribute can't fix this on its own: it's ignored for cross-origin URLs,
// and ignored entirely by the browser's own native video-controls/context-menu
// download affordances either way — only a server-driven Content-Disposition header
// actually controls the filename in those cases. Cloudinary's fl_attachment flag
// gives us exactly that.
//
// Also disable the native download affordances everywhere this is used
// (controlsList="nodownload" on the <video>) and offer an explicit download
// link built from this instead — the native ones can't be renamed, only hidden.
export function downloadUrlFor(url: string, label: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '');
  return url.replace('/upload/', `/upload/fl_attachment:Uri-${safeLabel}/`);
}
