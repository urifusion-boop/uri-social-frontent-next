export interface StyleTemplate {
  slug: string;
  name: string;
  description: string;
  industryTags: string[];
  gradient: [string, string]; // placeholder colours until real example images are ready
}

export const STYLES: StyleTemplate[] = [
  // ── Fashion & E-commerce ──────────────────────────────────────────────────
  {
    slug: 'street_editorial',
    name: 'Street Editorial',
    description: 'Urban, edgy, magazine-quality. For brands with attitude.',
    industryTags: ['fashion_ecommerce', 'events_entertainment', 'general_other'],
    gradient: ['#1a1a1a', '#555555'],
  },
  {
    slug: 'clean_luxe',
    name: 'Clean Luxe',
    description: 'Minimalist, premium, lots of breathing room. For high-end brands.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'real_estate', 'general_other'],
    gradient: ['#f5f0eb', '#c8b89a'],
  },
  {
    slug: 'neon_pop',
    name: 'Neon Pop',
    description: 'Electric, vibrant, nightlife energy. For bold brands.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'fitness_gym', 'events_entertainment', 'general_other'],
    gradient: ['#0d0d0d', '#ff1cf7'],
  },
  {
    slug: 'afro_glam',
    name: 'Afro-Glam',
    description: 'Celebration of African culture. Rich textures, warm tones, gold accents.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'events_entertainment', 'general_other'],
    gradient: ['#7b2d00', '#d4a017'],
  },
  {
    slug: 'minimal_studio',
    name: 'Minimal Studio',
    description: 'Product-first. Solid backgrounds. No distractions.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'food_beverage', 'general_other'],
    gradient: ['#e8e4df', '#a8998a'],
  },
  {
    slug: 'bold_loud',
    name: 'Bold & Loud',
    description: 'Maximum energy. Big text. In your face. For brands that shout.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'fitness_gym', 'events_entertainment', 'general_other'],
    gradient: ['#ff2d00', '#ff8c00'],
  },
  {
    slug: 'vintage_film',
    name: 'Vintage Film',
    description: 'Nostalgic, warm, analogue. For brands with a story.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'general_other'],
    gradient: ['#8b6914', '#d4a96a'],
  },
  {
    slug: 'catalogue_clean',
    name: 'Catalogue Clean',
    description: 'Structured, grid-ready, professional. For brands with multiple products.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'general_other'],
    gradient: ['#ffffff', '#cccccc'],
  },
  {
    slug: 'lifestyle_natural',
    name: 'Lifestyle Natural',
    description: 'Candid, authentic, in-context. Products in real life.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'beauty_wellness', 'fitness_gym', 'general_other'],
    gradient: ['#3d6b4f', '#a8c5a0'],
  },
  {
    slug: 'high_contrast_drama',
    name: 'High Contrast Drama',
    description: 'Dark backgrounds, dramatic lighting, theatre-level intensity.',
    industryTags: ['fashion_ecommerce', 'events_entertainment', 'fitness_gym'],
    gradient: ['#000000', '#ffffff'],
  },

  // ── Food & Beverage ───────────────────────────────────────────────────────
  {
    slug: 'overhead_feast',
    name: 'Overhead Feast',
    description: 'Top-down spread. Rustic surface. Abundance.',
    industryTags: ['food_beverage'],
    gradient: ['#8b4513', '#daa520'],
  },
  {
    slug: 'dark_moody_food',
    name: 'Dark & Moody Food',
    description: 'Dramatic. Premium. Chef-quality presentation.',
    industryTags: ['food_beverage'],
    gradient: ['#1c1c1c', '#8b0000'],
  },
  {
    slug: 'bright_fresh',
    name: 'Bright & Fresh',
    description: 'High-key, clean, healthy vibes. Lots of white.',
    industryTags: ['food_beverage', 'beauty_wellness', 'general_other'],
    gradient: ['#ffffff', '#90ee90'],
  },
  {
    slug: 'street_food_energy',
    name: 'Street Food Energy',
    description: 'Handheld, outdoor, messy, real. Authentic energy.',
    industryTags: ['food_beverage', 'events_entertainment'],
    gradient: ['#cc4400', '#ff8c00'],
  },
  {
    slug: 'menu_board',
    name: 'Menu Board',
    description: 'Practical. Prices visible. Clear layout for ordering.',
    industryTags: ['food_beverage'],
    gradient: ['#1a0a00', '#5c3317'],
  },
  {
    slug: 'rustic_warmth',
    name: 'Rustic Warmth',
    description: 'Wooden textures, earthy tones, handcraft feel.',
    industryTags: ['food_beverage', 'general_other'],
    gradient: ['#5c3317', '#c8a06e'],
  },
  {
    slug: 'vibrant_tropical',
    name: 'Vibrant Tropical',
    description: 'Bold colours, tropical ingredients, celebration energy.',
    industryTags: ['food_beverage', 'events_entertainment', 'general_other'],
    gradient: ['#ff6b00', '#00b894'],
  },
  {
    slug: 'minimalist_plating',
    name: 'Minimalist Plating',
    description: 'Fine dining. Single plate. Lots of negative space.',
    industryTags: ['food_beverage'],
    gradient: ['#e0dbd5', '#8c8070'],
  },

  // ── Fintech / SaaS / Tech ─────────────────────────────────────────────────
  {
    slug: 'corporate_gradient',
    name: 'Corporate Gradient',
    description: 'Smooth gradients, professional, trust. The LinkedIn standard.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'general_other'],
    gradient: ['#0d3b8c', '#6a0dad'],
  },
  {
    slug: 'data_visual',
    name: 'Data Visual',
    description: 'Charts and numbers as design. For data-driven brands.',
    industryTags: ['fintech_saas_tech', 'education_consulting'],
    gradient: ['#0a2540', '#00d4ff'],
  },
  {
    slug: 'trust_builder',
    name: 'Trust Builder',
    description: 'Real people, real photography. For brands that need credibility.',
    industryTags: ['fintech_saas_tech', 'real_estate', 'education_consulting', 'general_other'],
    gradient: ['#1a4a6b', '#4a9ebe'],
  },
  {
    slug: 'minimal_tech',
    name: 'Minimal Tech',
    description: 'Apple-inspired. Whitespace. Precision.',
    industryTags: ['fintech_saas_tech', 'education_consulting'],
    gradient: ['#f5f5f7', '#86868b'],
  },
  {
    slug: 'bold_statement',
    name: 'Bold Statement',
    description: 'Text-forward. One big idea. Maximum impact.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'fitness_gym', 'general_other'],
    gradient: ['#1a1a1a', '#cd1b78'],
  },
  {
    slug: 'dark_mode_pro',
    name: 'Dark Mode Pro',
    description: 'Dark backgrounds, glowing accents. For developer-adjacent brands.',
    industryTags: ['fintech_saas_tech'],
    gradient: ['#0d1117', '#00ff88'],
  },
  {
    slug: 'isometric_3d',
    name: 'Isometric 3D',
    description: 'Stylised 3D illustrations. For abstract concepts.',
    industryTags: ['fintech_saas_tech', 'education_consulting'],
    gradient: ['#c8d8f0', '#7eb8ff'],
  },
  {
    slug: 'clean_startup',
    name: 'Clean Startup',
    description: 'Approachable, modern, fresh. For early-stage brands.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'general_other'],
    gradient: ['#f0f4ff', '#6c8ef5'],
  },

  // ── Beauty & Wellness ─────────────────────────────────────────────────────
  {
    slug: 'glow_up',
    name: 'Glow Up',
    description: 'Warm golden lighting, dewy skin, aspirational beauty close-ups.',
    industryTags: ['beauty_wellness'],
    gradient: ['#f5c98a', '#e8854b'],
  },
  {
    slug: 'soft_pastel',
    name: 'Soft Pastel',
    description: 'Delicate pastels, airy gradients, gentle feminine energy.',
    industryTags: ['beauty_wellness', 'general_other'],
    gradient: ['#f8d7e8', '#d4a0c0'],
  },
  {
    slug: 'bold_glam',
    name: 'Bold Glam',
    description: 'High-glamour beauty, full makeup, confident and striking.',
    industryTags: ['beauty_wellness', 'fashion_ecommerce'],
    gradient: ['#3d0014', '#cc0044'],
  },
  {
    slug: 'clean_clinical',
    name: 'Clean Clinical',
    description: 'Medical-aesthetic trust. Ingredient-forward, science-backed.',
    industryTags: ['beauty_wellness'],
    gradient: ['#f8fafc', '#b0c4de'],
  },
  {
    slug: 'natural_organic',
    name: 'Natural Organic',
    description: 'Earth tones, raw ingredients, botanical handcraft feel.',
    industryTags: ['beauty_wellness', 'food_beverage'],
    gradient: ['#8b6914', '#4a7c59'],
  },
  {
    slug: 'editorial_beauty',
    name: 'Editorial Beauty',
    description: 'Avant-garde beauty. Fashion-magazine artistic direction.',
    industryTags: ['beauty_wellness', 'fashion_ecommerce'],
    gradient: ['#2d0042', '#ff6bce'],
  },
  {
    slug: 'before_after',
    name: 'Before & After',
    description: 'Split-screen transformation. Proof-focused and results-driven.',
    industryTags: ['beauty_wellness', 'fitness_gym'],
    gradient: ['#e0e0e0', '#333333'],
  },

  // ── Fitness & Gym ─────────────────────────────────────────────────────────
  {
    slug: 'energy_motion',
    name: 'Energy & Motion',
    description: 'Dynamic action shots, motion blur, sweat and intensity.',
    industryTags: ['fitness_gym'],
    gradient: ['#cc4400', '#ffcc00'],
  },
  {
    slug: 'dark_grit',
    name: 'Dark & Grit',
    description: 'Moody gym photography. Hardcore. No-frills. Raw.',
    industryTags: ['fitness_gym'],
    gradient: ['#111111', '#444444'],
  },
  {
    slug: 'transformation',
    name: 'Transformation',
    description: 'Before/after results. Stats-driven. Proof over aesthetics.',
    industryTags: ['fitness_gym', 'beauty_wellness'],
    gradient: ['#e0e0e0', '#2d2d2d'],
  },
  {
    slug: 'motivational_type',
    name: 'Motivational Type',
    description: 'One powerful phrase. Dark background. Athletic silhouette.',
    industryTags: ['fitness_gym', 'education_consulting', 'general_other'],
    gradient: ['#1a1a1a', '#cd1b78'],
  },
  {
    slug: 'clean_athletic',
    name: 'Clean Athletic',
    description: 'Nike/Adidas-inspired. Premium sportswear feel. Minimal.',
    industryTags: ['fitness_gym', 'fashion_ecommerce'],
    gradient: ['#f8f8f8', '#222222'],
  },

  // ── Real Estate ───────────────────────────────────────────────────────────
  {
    slug: 'property_showcase',
    name: 'Property Showcase',
    description: 'Wide-angle bright interiors. Blue sky, green lawn. HDR clarity.',
    industryTags: ['real_estate'],
    gradient: ['#1a6fa8', '#90c8f0'],
  },
  {
    slug: 'luxury_listing',
    name: 'Luxury Listing',
    description: 'Twilight exteriors. Gold serif type. Exclusivity.',
    industryTags: ['real_estate'],
    gradient: ['#1a1000', '#c8960c'],
  },
  {
    slug: 'neighbourhood_life',
    name: 'Neighbourhood Life',
    description: 'Community and lifestyle. Sell the area, not just the property.',
    industryTags: ['real_estate'],
    gradient: ['#3d6b4f', '#90c8a0'],
  },
  {
    slug: 'blueprint_modern',
    name: 'Blueprint Modern',
    description: 'Architectural line drawings. Technical precision. Modern.',
    industryTags: ['real_estate'],
    gradient: ['#0d2040', '#1a4080'],
  },
  {
    slug: 'aerial_clean',
    name: 'Aerial Clean',
    description: 'Drone-style overhead photography. Wide context. Clean info overlay.',
    industryTags: ['real_estate'],
    gradient: ['#1a6fa8', '#4ab8e0'],
  },

  // ── Education & Consulting ────────────────────────────────────────────────
  {
    slug: 'warm_professional',
    name: 'Warm Professional',
    description: 'Approachable expertise. Warm tones, real people, credibility.',
    industryTags: ['education_consulting', 'general_other'],
    gradient: ['#8b4a00', '#e8a855'],
  },
  {
    slug: 'authority_editorial',
    name: 'Authority Editorial',
    description: 'Magazine-style expert portrait. Gravitas and credibility.',
    industryTags: ['education_consulting'],
    gradient: ['#1a1a2e', '#4a4a8a'],
  },

  // ── Events & Entertainment ────────────────────────────────────────────────
  {
    slug: 'festival_energy',
    name: 'Festival Energy',
    description: 'Concert poster aesthetic. Explosive. Layered. Loud.',
    industryTags: ['events_entertainment'],
    gradient: ['#4a0080', '#ff6b00'],
  },
];

export const INDUSTRY_STYLE_MAP: Record<string, string[]> = {
  fashion_ecommerce: [
    'street_editorial',
    'clean_luxe',
    'neon_pop',
    'afro_glam',
    'minimal_studio',
    'bold_loud',
    'vintage_film',
    'catalogue_clean',
    'lifestyle_natural',
    'high_contrast_drama',
  ],
  food_beverage: [
    'overhead_feast',
    'dark_moody_food',
    'bright_fresh',
    'street_food_energy',
    'menu_board',
    'rustic_warmth',
    'bold_loud',
    'vibrant_tropical',
    'minimalist_plating',
  ],
  fintech_saas_tech: [
    'corporate_gradient',
    'data_visual',
    'trust_builder',
    'minimal_tech',
    'bold_statement',
    'dark_mode_pro',
    'isometric_3d',
    'clean_startup',
  ],
  beauty_wellness: [
    'glow_up',
    'soft_pastel',
    'bold_glam',
    'clean_clinical',
    'natural_organic',
    'editorial_beauty',
    'neon_pop',
    'lifestyle_natural',
    'before_after',
  ],
  real_estate: [
    'property_showcase',
    'luxury_listing',
    'neighbourhood_life',
    'blueprint_modern',
    'aerial_clean',
    'trust_builder',
    'bold_statement',
  ],
  fitness_gym: [
    'energy_motion',
    'dark_grit',
    'bold_loud',
    'transformation',
    'clean_athletic',
    'neon_pop',
    'motivational_type',
    'lifestyle_natural',
  ],
  education_consulting: [
    'trust_builder',
    'clean_startup',
    'bold_statement',
    'data_visual',
    'warm_professional',
    'minimal_tech',
    'authority_editorial',
  ],
  events_entertainment: [
    'neon_pop',
    'bold_loud',
    'high_contrast_drama',
    'afro_glam',
    'vibrant_tropical',
    'street_food_energy',
    'festival_energy',
  ],
  general_other: [
    'bold_loud',
    'clean_startup',
    'lifestyle_natural',
    'minimal_studio',
    'trust_builder',
    'vibrant_tropical',
    'warm_professional',
    'afro_glam',
    'bright_fresh',
    'corporate_gradient',
  ],
};

const INDUSTRY_ALIASES: Record<string, string> = {
  fashion: 'fashion_ecommerce',
  ecommerce: 'fashion_ecommerce',
  'e-commerce': 'fashion_ecommerce',
  food: 'food_beverage',
  beverage: 'food_beverage',
  restaurant: 'food_beverage',
  fintech: 'fintech_saas_tech',
  saas: 'fintech_saas_tech',
  tech: 'fintech_saas_tech',
  technology: 'fintech_saas_tech',
  beauty: 'beauty_wellness',
  wellness: 'beauty_wellness',
  health: 'beauty_wellness',
  'real estate': 'real_estate',
  property: 'real_estate',
  fitness: 'fitness_gym',
  gym: 'fitness_gym',
  sport: 'fitness_gym',
  sports: 'fitness_gym',
  education: 'education_consulting',
  consulting: 'education_consulting',
  coaching: 'education_consulting',
  events: 'events_entertainment',
  entertainment: 'events_entertainment',
  event: 'events_entertainment',
};

export function getStylesForIndustry(industry: string): StyleTemplate[] {
  const key = industry.toLowerCase().trim();
  const canonical = INDUSTRY_STYLE_MAP[key] ? key : (INDUSTRY_ALIASES[key] ?? 'general_other');
  const slugs = INDUSTRY_STYLE_MAP[canonical] ?? INDUSTRY_STYLE_MAP['general_other'];
  const bySlug = Object.fromEntries(STYLES.map((s) => [s.slug, s]));
  return slugs.map((s) => bySlug[s]).filter(Boolean);
}

export function getStyle(slug: string): StyleTemplate | undefined {
  return STYLES.find((s) => s.slug === slug);
}
