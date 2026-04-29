export interface FontStyle {
  slug: string;
  name: string;
  description: string;
  googleFont: string; // font family name for CSS
  fontFamily: string; // full CSS font-family stack
  previewText: string;
  promptFragment: string; // injected into image generation prompt
}

export const FONT_STYLES: FontStyle[] = [
  {
    slug: 'serif_elegance',
    name: 'Serif Elegance',
    description: 'Editorial, refined, high-end. Classic stroke contrast.',
    googleFont: 'Playfair Display',
    fontFamily: "'Playfair Display', Georgia, serif",
    previewText: 'Aa — Bold & Beautiful',
    promptFragment:
      'All text in classic high-contrast serif typeface (Playfair Display, Didot, or Garamond style). ' +
      'Letterforms have elegant thin-to-thick stroke contrast. Editorial, refined, and premium feeling.',
  },
  {
    slug: 'modern_sans',
    name: 'Modern Sans',
    description: 'Clean, contemporary, minimal. The standard for modern brands.',
    googleFont: 'Inter',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    previewText: 'Aa — Clean & Clear',
    promptFragment:
      'All text in clean geometric sans-serif typeface (Inter, Helvetica Neue, or Aktiv Grotesk style). ' +
      'Even stroke weight, precise letterforms, generous tracking. Contemporary and minimal.',
  },
  {
    slug: 'bold_condensed',
    name: 'Bold Condensed',
    description: 'Maximum impact. Loud, compressed, fills the frame.',
    googleFont: 'Bebas Neue',
    fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
    previewText: 'AA — LOUD & PROUD',
    promptFragment:
      'All text in massive bold condensed sans-serif (Bebas Neue, Impact, or Anton style). ' +
      'Zero tracking, characters packed tight, text fills maximum frame width. Commanding and high-energy.',
  },
  {
    slug: 'script_flow',
    name: 'Script & Flow',
    description: 'Flowing, elegant, personal. Cursive with calligraphic character.',
    googleFont: 'Great Vibes',
    fontFamily: "'Great Vibes', 'Dancing Script', cursive",
    previewText: 'Aa — Flow & Grace',
    promptFragment:
      'All text in flowing elegant script typeface (Great Vibes, Pinyon Script, or Pacifico style). ' +
      'Cursive, connected letterforms with natural calligraphic stroke variation. Personal and artisanal.',
  },
  {
    slug: 'geometric_bold',
    name: 'Geometric Bold',
    description: 'Structured, circular letterforms. Strong modern personality.',
    googleFont: 'Montserrat',
    fontFamily: "'Montserrat', 'Futura', 'Century Gothic', sans-serif",
    previewText: 'Aa — Form & Force',
    promptFragment:
      'All text in bold geometric sans-serif (Montserrat ExtraBold, Futura, or Circular style). ' +
      'Perfectly circular letterforms, strong visual weight, structured and commanding.',
  },
  {
    slug: 'slab_serif',
    name: 'Slab Serif',
    description: 'Sturdy, reliable, editorial weight. Bold with thick serifs.',
    googleFont: 'Roboto Slab',
    fontFamily: "'Roboto Slab', 'Rockwell', 'Courier New', serif",
    previewText: 'Aa — Solid & Strong',
    promptFragment:
      'All text in bold slab serif typeface (Roboto Slab, Rockwell, or Clarendon style). ' +
      'Thick uniform serifs, sturdy and reliable letterforms. Editorial weight with approachable character.',
  },
  {
    slug: 'display_expressive',
    name: 'Display Expressive',
    description: 'Ultra-bold with extreme contrast. Text becomes a graphic element.',
    googleFont: 'Abril Fatface',
    fontFamily: "'Abril Fatface', 'Bodoni MT', serif",
    previewText: 'Aa — Drama & Depth',
    promptFragment:
      'All text in heavy display serif (Abril Fatface or Bodoni Poster style). ' +
      'Ultra-bold letterforms with extreme stroke contrast — hairline thins against massive thick strokes. ' +
      'Typography itself becomes a visual centrepiece.',
  },
  {
    slug: 'minimal_light',
    name: 'Minimal Light',
    description: 'Ultra-thin, airy, luxury through restraint. Whisper-thin letterforms.',
    googleFont: 'Cormorant',
    fontFamily: "'Cormorant', 'Bodoni 72', Georgia, serif",
    previewText: 'Aa — Light & Air',
    promptFragment:
      'All text in ultra-light thin-weight serif (Cormorant, Bodoni 72, or Raleway Thin style). ' +
      'Whisper-thin letterforms with generous tracking and vast negative space. ' +
      'Luxury and sophistication conveyed through restraint.',
  },
];

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@700&family=Bebas+Neue&family=Great+Vibes&family=Montserrat:wght@800&family=Roboto+Slab:wght@700&family=Abril+Fatface&family=Cormorant:wght@300&display=swap';

export function getFont(slug: string): FontStyle | undefined {
  return FONT_STYLES.find((f) => f.slug === slug);
}
