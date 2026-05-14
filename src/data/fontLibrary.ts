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
  {
    slug: 'street_block',
    name: 'Street Block',
    description: 'Urban, industrial, stencil-cut. Military-inspired block letters.',
    googleFont: 'Teko',
    fontFamily: "'Teko', 'Bebas Neue', 'Arial Narrow', sans-serif",
    previewText: 'AA — URBAN EDGE',
    promptFragment:
      'Typography style: bold block letters with a stencil-cut or military-industrial feel. Uppercase only. ' +
      'Letters have breaks or gaps as if cut from a stencil. Flat, heavy, no curves — all straight lines and sharp angles. ' +
      'The text looks spray-painted or stamped on concrete. Urban, raw, aggressive.',
  },
  {
    slug: 'handwritten_casual',
    name: 'Handwritten Casual',
    description: 'Personal, authentic, marker-pen feel. Like handwriting on a whiteboard.',
    googleFont: 'Permanent Marker',
    fontFamily: "'Permanent Marker', 'Caveat', 'Patrick Hand', cursive",
    previewText: 'Aa — Real & Raw',
    promptFragment:
      'Typography style: casual handwritten text that looks like it was written with a thick marker pen on a whiteboard or paper. ' +
      'Slightly uneven baseline, imperfect letter sizing, natural pen-pressure variation. Not calligraphy — casual handwriting. ' +
      'Friendly, authentic, human. The text looks like a real person wrote it, not a font.',
  },
  {
    slug: 'afro_display',
    name: 'Afro Display',
    description: 'African-inspired, cultural, bold. Geometric patterns meet modern typography.',
    googleFont: 'Saira Condensed',
    fontFamily: "'Saira Condensed', 'Montserrat', sans-serif",
    previewText: 'Aa — Bold Culture',
    promptFragment:
      'Typography style: bold decorative display font with African-inspired geometric patterns and cultural motifs integrated into the letterforms. ' +
      'The letters have angular, tribal-influenced shapes with strong lines and cultural character. ' +
      'Modern Pan-African design — not stereotypical, but proudly African and contemporary. Bold, unapologetic, rooted in culture.',
  },
  {
    slug: 'tech_mono',
    name: 'Tech Mono',
    description: 'Code, data, digital precision. Every character occupies the same width.',
    googleFont: 'JetBrains Mono',
    fontFamily: "'JetBrains Mono', 'IBM Plex Mono', 'Courier New', monospace",
    previewText: 'Aa — Code & Data',
    promptFragment:
      'Typography style: monospace (fixed-width) font where every character occupies exactly the same horizontal space. ' +
      'Clean, precise, technical. The text looks like code on a terminal screen or data on a dashboard. ' +
      'Digital, mechanical, engineered. Often used with a code-editor-style dark background.',
  },
  {
    slug: 'rounded_friendly',
    name: 'Rounded Friendly',
    description: 'Approachable, warm, child-friendly. Rounded terminals and soft corners.',
    googleFont: 'Nunito',
    fontFamily: "'Nunito', 'Quicksand', 'Varela Round', sans-serif",
    previewText: 'Aa — Warm & Kind',
    promptFragment:
      'Typography style: rounded sans-serif with soft, circular letter terminals and no sharp corners. ' +
      'Every endpoint of every stroke is rounded. The text feels warm, approachable, safe, and friendly. ' +
      'Medium weight. The text smiles at you. Non-threatening, inclusive, welcoming.',
  },
  {
    slug: 'art_deco',
    name: 'Art Deco',
    description: 'Gatsby-era luxury. Geometric, symmetric, vintage glamour.',
    googleFont: 'Poiret One',
    fontFamily: "'Poiret One', 'Cinzel', Georgia, serif",
    previewText: 'Aa — Jazz Age',
    promptFragment:
      'Typography style: Art Deco display font with strong geometric shapes, symmetric letterforms, and decorative inline details. ' +
      'Tall, narrow letterforms with geometric serifs and sometimes decorative lines within the strokes. ' +
      'Gatsby-era glamour. Jazz age. Old Hollywood. The text looks like it belongs on a luxury hotel entrance or a vintage champagne label.',
  },
  {
    slug: 'brush_raw',
    name: 'Brush Raw',
    description: 'Raw energy, painted, imperfect power. Thick brush strokes with visible texture.',
    googleFont: 'Bungee Shade',
    fontFamily: "'Bungee Shade', 'Alfa Slab One', Impact, sans-serif",
    previewText: 'AA — RAW POWER',
    promptFragment:
      'Typography style: raw brush script with thick, textured strokes that show the bristle marks of a real paint brush. ' +
      'Aggressive, energetic, imperfect. The text looks painted by hand with a large brush — not delicate calligraphy but bold, physical mark-making. ' +
      'Drips and splatter optional. The imperfection IS the beauty.',
  },
  {
    slug: 'luxury_hairline',
    name: 'Luxury Hairline',
    description: 'Whisper-thin, haute couture, Vogue. The thinnest possible serif.',
    googleFont: 'Cormorant Garamond',
    fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    previewText: 'Aa — Haute Couture',
    promptFragment:
      'Typography style: ultra-thin serif with hairline strokes throughout — both the thick and thin strokes are extremely delicate. ' +
      'Wide letter-spacing. Uppercase for maximum effect. The text is barely there, like it was etched with a needle. ' +
      'Haute couture fashion energy. Vogue cover. The luxury of absence — the text says everything by almost not being there.',
  },
];

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  'family=Playfair+Display:wght@700&' +
  'family=Inter:wght@700&' +
  'family=Bebas+Neue&' +
  'family=Great+Vibes&' +
  'family=Montserrat:wght@800&' +
  'family=Roboto+Slab:wght@700&' +
  'family=Abril+Fatface&' +
  'family=Cormorant:wght@300&' +
  'family=Teko:wght@700&' +
  'family=Permanent+Marker&' +
  'family=Saira+Condensed:wght@700&' +
  'family=JetBrains+Mono:wght@400;700&' +
  'family=Nunito:wght@600&' +
  'family=Poiret+One&' +
  'family=Bungee+Shade&' +
  'family=Cormorant+Garamond:wght@300&' +
  'display=swap';

export function getFont(slug: string): FontStyle | undefined {
  return FONT_STYLES.find((f) => f.slug === slug);
}
