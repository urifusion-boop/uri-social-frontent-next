export interface StyleTemplate {
  slug: string;
  name: string;
  description: string;
  industryTags: string[];
  gradient: [string, string];
  image: string;
  promptFragment: string;
  styleType?: string; // 'marketing_template' for AI Marketing Templates
  templateCategory?: string; // 'editorial', 'beverage', 'food', 'ecommerce'
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&h=300&fit=crop&auto=format&q=80`;

export const STYLES: StyleTemplate[] = [
  // ── Fashion & E-commerce ──────────────────────────────────────────────────
  {
    slug: 'street_editorial',
    name: 'Street Editorial',
    description: 'Urban, edgy, magazine-quality. For brands with attitude.',
    industryTags: ['fashion_ecommerce', 'events_entertainment', 'general_other'],
    gradient: ['#1a1a1a', '#555555'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/street-editorial.jpg',
    promptFragment:
      'High-fashion street photography style. Urban environment backdrop with intentional bokeh. Subject centered with confident pose. Dramatic side lighting creating strong shadows. Bold condensed sans-serif typography overlaid in white or neon accent colour. Slightly desaturated colour grading with lifted blacks. Gritty texture overlay at 5% opacity. Cinematic 2.39:1 crop feel even in square format. Magazine editorial quality.',
  },
  {
    slug: 'clean_luxe',
    name: 'Clean Luxe',
    description: 'Minimalist, premium, lots of breathing room. For high-end brands.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'real_estate', 'general_other'],
    gradient: ['#f5f0eb', '#c8b89a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/clean-luxe.jpg',
    promptFragment:
      'Luxury minimalist product photography. Pure white or soft cream background with subtle shadow. Product centered with generous negative space on all sides. Soft even lighting with no harsh shadows. Thin elegant serif typography in black or dark grey, positioned with mathematical precision. No decorative elements. Premium feel through restraint and whitespace. Colour palette limited to neutrals plus one brand accent colour.',
  },
  {
    slug: 'neon_pop',
    name: 'Neon Pop',
    description: 'Electric, vibrant, nightlife energy. For bold brands.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'fitness_gym', 'events_entertainment', 'general_other'],
    gradient: ['#0d0d0d', '#ff1cf7'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/neon-pop.jpg',
    promptFragment:
      'Vivid neon-lit photography style. Dark or black background with strong neon colour accents in pink, electric blue, or purple. Dramatic coloured lighting casting coloured shadows. Bold heavy sans-serif typography with glow or neon tube effect. High saturation, high contrast. Club/nightlife energy. Lens flare effects subtle but present. Cyberpunk-adjacent aesthetic.',
  },
  {
    slug: 'afro_glam',
    name: 'Afro-Glam',
    description: 'Celebration of African culture. Rich textures, warm tones, gold accents.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'events_entertainment', 'general_other'],
    gradient: ['#7b2d00', '#d4a017'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/afro-glam.jpg',
    promptFragment:
      'African-inspired luxury aesthetic. Rich warm colour palette: deep oranges, golds, burgundy, and dark green. Ankara or kente textile patterns as subtle background textures at low opacity. Gold foil accent elements on typography. Bold display typography mixing serif and hand-lettered styles. Warm directional lighting emphasising skin tones beautifully. Cultural pride aesthetic. Ornate but not cluttered.',
  },
  {
    slug: 'minimal_studio',
    name: 'Minimal Studio',
    description: 'Product-first. Solid backgrounds. No distractions.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'food_beverage', 'general_other'],
    gradient: ['#e8e4df', '#a8998a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/minimal-studio.png',
    promptFragment:
      'Professional product photography on solid colour backdrop. Colours: soft grey, muted blush, sage green, or cream. Single product hero shot with perfect lighting from 45 degrees above. No text overlay unless specifically requested. Clean drop shadow or gentle reflection on surface. Focus on product details, texture, and craftsmanship. E-commerce catalogue quality.',
  },
  {
    slug: 'bold_loud',
    name: 'Bold & Loud',
    description: 'Maximum energy. Big text. In your face. For brands that shout.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'fitness_gym', 'events_entertainment', 'general_other'],
    gradient: ['#ff2d00', '#ff8c00'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/bold-loud.jpg',
    promptFragment:
      'High-energy promotional graphic. Full-bleed bold background colour from brand palette. Massive condensed sans-serif typography filling 60%+ of the frame. Text stacked vertically or at slight angle for dynamism. Minimal photography, used as small cutout or background texture only. Starburst, arrow, or badge elements for emphasis. Reminiscent of sale flyers and event posters. Nothing subtle.',
  },
  {
    slug: 'vintage_film',
    name: 'Vintage Film',
    description: 'Nostalgic, warm, analogue. For brands with a story.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'general_other'],
    gradient: ['#8b6914', '#d4a96a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/vintage-film.jpg',
    promptFragment:
      'Analogue film photography aesthetic. Warm colour cast with slight orange/amber tone shift. Visible film grain at medium intensity. Slightly faded highlights and lifted shadows. Soft focus edges with sharp centre. Vintage serif or typewriter-style typography. Light leak effects in corners. 35mm candid photography feel. Nostalgic warmth.',
  },
  {
    slug: 'catalogue_clean',
    name: 'Catalogue Clean',
    description: 'Structured, grid-ready, professional. For brands with multiple products.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'general_other'],
    gradient: ['#ffffff', '#cccccc'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/catalogue-clean.jpg',
    promptFragment:
      'Clean catalogue-style product layout. White or light grey background. Product arranged in a structured grid or neatly laid out flat-lay composition. Even shadowless lighting. Small clean sans-serif labels for product name and price. Professional but approachable. Suitable for multi-product carousel slides. Consistent spacing and alignment.',
  },
  {
    slug: 'lifestyle_natural',
    name: 'Lifestyle Natural',
    description: 'Candid, authentic, in-context. Products in real life.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'beauty_wellness', 'fitness_gym', 'general_other'],
    gradient: ['#3d6b4f', '#a8c5a0'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/lifestyle-natural.jpg',
    promptFragment:
      'Lifestyle photography in natural settings. Product shown in use or in an authentic real-life context. Natural daylight, preferably golden hour or soft window light. Shallow depth of field with subject in focus, background softly blurred. Warm natural colour grading. No heavy text overlay. Candid, unposed feel. The product is part of a moment, not the centre of a studio.',
  },
  {
    slug: 'high_contrast_drama',
    name: 'High Contrast Drama',
    description: 'Dark backgrounds, dramatic lighting, theatre-level intensity.',
    industryTags: ['fashion_ecommerce', 'events_entertainment', 'fitness_gym'],
    gradient: ['#000000', '#ffffff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fashion/high-contrast-drama.png',
    promptFragment:
      'Dramatic chiaroscuro photography. Very dark or black background. Single strong directional light source creating deep shadows and bright highlights. High contrast, low key lighting. Subject emerges from darkness. Typography in white or single bright accent colour. Theatrical and cinematic. Fine art photography quality.',
  },

  // ── Food & Beverage ───────────────────────────────────────────────────────
  {
    slug: 'overhead_feast',
    name: 'Overhead Feast',
    description: 'Top-down spread. Rustic surface. Abundance.',
    industryTags: ['food_beverage'],
    gradient: ['#8b4513', '#daa520'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/food/overhead-feast.jpg',
    promptFragment:
      'Overhead flat-lay food photography. Shot directly from above. Rustic wooden table or marble surface as base. Multiple dishes, ingredients, and utensils arranged artfully with intentional negative space. Warm natural lighting from north-facing window. Rich saturated food colours. Herbs, spices, and scattered ingredients as styling elements. Convivial, abundant, sharing-focused.',
  },
  {
    slug: 'dark_moody_food',
    name: 'Dark & Moody Food',
    description: 'Dramatic. Premium. Chef-quality presentation.',
    industryTags: ['food_beverage'],
    gradient: ['#1c1c1c', '#8b0000'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/food/dark-moody.jpg',
    promptFragment:
      'Dark food photography style. Deep charcoal, slate, or black background and surfaces. Single dish as hero, styled with precision. Dramatic side lighting with visible light falloff. Rich deep colours: mahogany sauces, deep greens, burnished golds. Minimal props. Typography in thin gold or cream serif font. Fine dining and premium brand feel.',
  },
  {
    slug: 'bright_fresh',
    name: 'Bright & Fresh',
    description: 'High-key, clean, healthy vibes. Lots of white.',
    industryTags: ['food_beverage', 'beauty_wellness', 'general_other'],
    gradient: ['#ffffff', '#90ee90'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/food/bright-fresh.jpg',
    promptFragment:
      'High-key bright food photography. White or very light backgrounds and surfaces. Abundant natural light with minimal shadows. Vibrant food colours pop against the clean background. Fresh ingredients: greens, citrus, herbs prominently visible. Clean sans-serif typography. Healthy, fresh, approachable energy. Brunch-menu aesthetic.',
  },
  {
    slug: 'street_food_energy',
    name: 'Street Food Energy',
    description: 'Handheld, outdoor, messy, real. Authentic energy.',
    industryTags: ['food_beverage', 'events_entertainment'],
    gradient: ['#cc4400', '#ff8c00'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/food/street-food-energy.jpg',
    promptFragment:
      'Street food documentary-style photography. Food held in hand or shown being prepared at a stall. Outdoor natural light, possibly harsh midday sun with real shadows. Slightly messy, unpolished plating. Smoke, steam, or motion blur for dynamism. Bold chunky sans-serif typography. Saturated warm colours. Authentic, not styled. The anti-studio look.',
  },
  {
    slug: 'menu_board',
    name: 'Menu Board',
    description: 'Practical. Prices visible. Clear layout for ordering.',
    industryTags: ['food_beverage'],
    gradient: ['#1a0a00', '#5c3317'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/food/menu-board.jpg',
    promptFragment:
      'Restaurant menu board style layout. Structured grid with clear sections. Each item has: photo (small, square), name (bold), description (small), and price (prominent). Dark background with cream or white text for readability. Subtle food photography as background at very low opacity. Practical, scannable, designed for someone deciding what to order.',
  },
  {
    slug: 'rustic_warmth',
    name: 'Rustic Warmth',
    description: 'Wooden textures, earthy tones, handcraft feel.',
    industryTags: ['food_beverage', 'general_other'],
    gradient: ['#5c3317', '#c8a06e'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/food/rustic-warmth.jpg',
    promptFragment:
      'Rustic artisanal food photography. Warm earth-tone colour palette: browns, ambers, creams, forest greens. Textured surfaces: reclaimed wood, linen cloth, terracotta. Soft warm lighting with gentle shadows. Hand-lettered or rough serif typography evoking chalkboard or hand-painted signs. Artisan, homemade, craft-focused aesthetic. Farm-to-table energy.',
  },
  {
    slug: 'vibrant_tropical',
    name: 'Vibrant Tropical',
    description: 'Bold colours, tropical ingredients, celebration energy.',
    industryTags: ['food_beverage', 'events_entertainment', 'general_other'],
    gradient: ['#ff6b00', '#00b894'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/food/vibrant-tropical.jpg',
    promptFragment:
      'Vibrant tropical colour palette. Bright saturated colours: mango orange, lime green, hibiscus pink, ocean blue. Bold graphic elements: colour blocks, geometric shapes, tropical leaf patterns. Playful rounded sans-serif typography. Energetic composition with elements breaking the frame. Carnival, celebration, summer-party energy. Maximalist but organised.',
  },
  {
    slug: 'minimalist_plating',
    name: 'Minimalist Plating',
    description: 'Fine dining. Single plate. Lots of negative space.',
    industryTags: ['food_beverage'],
    gradient: ['#e0dbd5', '#8c8070'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/food/minimalist-plating.jpg',
    promptFragment:
      'Fine dining plating photography. Single plate or bowl as sole subject, centered with vast negative space. Neutral background: warm grey, soft linen, or brushed concrete. Overhead or 45-degree angle. Minimal garnish placed with tweezers-level precision. Soft diffused lighting. No text overlay unless explicitly requested. The food speaks for itself.',
  },

  // ── Fintech / SaaS / Tech ─────────────────────────────────────────────────
  {
    slug: 'corporate_gradient',
    name: 'Corporate Gradient',
    description: 'Smooth gradients, professional, trust. The LinkedIn standard.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'general_other'],
    gradient: ['#0d3b8c', '#6a0dad'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/tech/corporate-gradient.jpg',
    promptFragment:
      'Professional corporate graphic with smooth gradient background. Gradient colours: deep blue to purple, teal to blue, or dark navy to medium blue. Clean sans-serif typography in white, centered or left-aligned. Subtle geometric shapes (circles, lines, grids) as decorative elements at low opacity. Device mockups or abstract data visualisation elements. Enterprise-grade, trustworthy, modern. No playfulness.',
  },
  {
    slug: 'data_visual',
    name: 'Data Visual',
    description: 'Charts and numbers as design. For data-driven brands.',
    industryTags: ['fintech_saas_tech', 'education_consulting'],
    gradient: ['#0a2540', '#00d4ff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/tech/data-visual.jpg',
    promptFragment:
      'Data-driven infographic style. Key metric or statistic displayed as the hero element: large bold number with unit. Supporting mini-charts, progress bars, or comparison graphics. Clean grid-based layout. Monochrome base with one accent colour for data highlights. Sans-serif typography only. Dashboard aesthetic. The data IS the design.',
  },
  {
    slug: 'trust_builder',
    name: 'Trust Builder',
    description: 'Real people, real photography. For brands that need credibility.',
    industryTags: ['fintech_saas_tech', 'real_estate', 'education_consulting', 'general_other'],
    gradient: ['#1a4a6b', '#4a9ebe'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/tech/trust-builder.jpg',
    promptFragment:
      'Professional corporate photography. Real people in business settings: meetings, handshakes, collaborative work, presentations. Diverse representation. Warm but professional lighting. Slightly warm colour grading. Clean sans-serif typography overlaid with semi-transparent dark bar for readability. Trust, competence, human connection. Not stock-photo generic - authentic and specific.',
  },
  {
    slug: 'minimal_tech',
    name: 'Minimal Tech',
    description: 'Apple-inspired. Whitespace. Precision.',
    industryTags: ['fintech_saas_tech', 'education_consulting'],
    gradient: ['#f5f5f7', '#86868b'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/tech/minimal-tech.png',
    promptFragment:
      'Ultra-minimal tech aesthetic inspired by Apple design language. Vast white or very light grey space. Thin light-weight sans-serif typography. Single product or concept as the focal point with extreme negative space. Subtle shadows and gradients. No decorative elements. Precision, restraint, sophistication. Every element earns its place.',
  },
  {
    slug: 'bold_statement',
    name: 'Bold Statement',
    description: 'Text-forward. One big idea. Maximum impact.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'fitness_gym', 'general_other'],
    gradient: ['#1a1a1a', '#cd1b78'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/tech/bold-statement.jpg',
    promptFragment:
      'Text-dominant motivational or statement graphic. Large bold statement or quote as the entire design. Background: solid colour, subtle gradient, or dark texture. Typography fills 70%+ of the frame. Mixed weights (one word bold, rest light) for emphasis hierarchy. Minimal or no imagery. The words ARE the visual. TED-talk-slide aesthetic.',
  },
  {
    slug: 'dark_mode_pro',
    name: 'Dark Mode Pro',
    description: 'Dark backgrounds, glowing accents. For developer-adjacent brands.',
    industryTags: ['fintech_saas_tech'],
    gradient: ['#0d1117', '#00ff88'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/tech/dark-mode-pro.jpg',
    promptFragment:
      'Dark mode UI-inspired aesthetic. Near-black (#0D1117 or #1A1A2E) background. Subtle glowing accent elements in electric blue, cyan, or green. Code-editor-inspired monospace typography for data points. Thin neon borders and divider lines. Glassmorphism elements with frosted transparency. Developer, hacker, cutting-edge tech aesthetic.',
  },
  {
    slug: 'isometric_3d',
    name: 'Isometric 3D',
    description: 'Stylised 3D illustrations. For abstract concepts.',
    industryTags: ['fintech_saas_tech', 'education_consulting'],
    gradient: ['#c8d8f0', '#7eb8ff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/tech/isometric-3d.jpg',
    promptFragment:
      'Isometric 3D illustration style. Clean geometric shapes rendered in a consistent isometric perspective. Soft shadows and gradients giving depth. Pastel or muted colour palette with one vibrant accent. Objects representing abstract concepts: buildings for growth, gears for process, graphs for data. Clean sans-serif labels. Friendly and explanatory.',
  },
  {
    slug: 'clean_startup',
    name: 'Clean Startup',
    description: 'Approachable, modern, fresh. For early-stage brands.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'general_other'],
    gradient: ['#f0f4ff', '#6c8ef5'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/tech/clean-startup.jpg',
    promptFragment:
      'Modern startup aesthetic. Light backgrounds with a single accent colour from brand palette. Rounded UI elements and card-based layouts. Friendly sans-serif typography (Inter, Poppins, Urbanist style). Abstract blob shapes or wavy lines as subtle decorative elements. Screenshots or device mockups showing the product. Approachable, optimistic, forward-looking.',
  },

  // ── Beauty & Wellness ─────────────────────────────────────────────────────
  {
    slug: 'glow_up',
    name: 'Glow Up',
    description: 'Warm golden lighting, dewy skin, aspirational beauty close-ups.',
    industryTags: ['beauty_wellness'],
    gradient: ['#f5c98a', '#e8854b'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/beauty/glow_up.jpg',
    promptFragment:
      'Soft glowing beauty photography. Close-up portrait with warm golden-hour backlighting creating a luminous halo effect. Skin appears naturally dewy and radiant with smooth, even texture. Soft bokeh background in warm amber or blush tones. Thin serif or script typography in gold or champagne. Aspirational but achievable beauty ideal. Beauty editorial quality without heavy retouching.',
  },
  {
    slug: 'soft_pastel',
    name: 'Soft Pastel',
    description: 'Delicate pastels, airy gradients, gentle feminine energy.',
    industryTags: ['beauty_wellness', 'general_other'],
    gradient: ['#f8d7e8', '#d4a0c0'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/beauty/soft_pastel.jpg',
    promptFragment:
      'Soft pastel colour palette: blush pink, lavender, mint, baby blue, and ivory. Gentle gradient backgrounds blending two pastel tones. Airy, light-filled composition with minimal shadows. Delicate serif or thin script typography. Floral or botanical accent elements at low opacity. Beauty brand lookbook quality. Feminine, soft, and approachable without being saccharine.',
  },
  {
    slug: 'bold_glam',
    name: 'Bold Glam',
    description: 'High-glamour beauty, full makeup, confident and striking.',
    industryTags: ['beauty_wellness', 'fashion_ecommerce'],
    gradient: ['#3d0014', '#cc0044'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/beauty/bold_glam.jpg',
    promptFragment:
      'High-glamour beauty photography. Bold full-coverage makeup with saturated lip colours and dramatic eye looks. Dramatic studio lighting with strong catchlights. Rich jewel-tone or deep neutral backgrounds. Confident, direct gaze at camera. Magazine cover quality. Typography in thick serif or metallic sans-serif. Striking, powerful, unapologetically glamorous.',
  },
  {
    slug: 'clean_clinical',
    name: 'Clean Clinical',
    description: 'Medical-aesthetic trust. Ingredient-forward, science-backed.',
    industryTags: ['beauty_wellness'],
    gradient: ['#f8fafc', '#b0c4de'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/beauty/clean_clinical.jpg',
    promptFragment:
      'Medical-aesthetic clinic style. Pure white and light grey colour palette with one soft accent colour. Clean laboratory-quality lighting with no harsh shadows. Product displayed with clinical precision alongside key ingredient visuals (molecular diagrams, botanical extracts, droplets). Thin clean sans-serif typography. Trust, expertise, and ingredient transparency are the message.',
  },
  {
    slug: 'natural_organic',
    name: 'Natural Organic',
    description: 'Earth tones, raw ingredients, botanical handcraft feel.',
    industryTags: ['beauty_wellness', 'food_beverage'],
    gradient: ['#8b6914', '#4a7c59'],
    image: U('1498557850523-fd3d118b962e'),
    promptFragment:
      'Earth-toned natural beauty aesthetic. Warm organic palette: terracotta, cream, sage green, and honey. Raw natural ingredients as props: honey dripping, aloe leaves, coconut halves, dried botanicals. Linen cloth and wood textures as surfaces. Soft diffused natural light. Handwritten or rough serif typography evoking artisan labels. Farm-sourced, botanical, zero-waste energy.',
  },
  {
    slug: 'editorial_beauty',
    name: 'Editorial Beauty',
    description: 'Avant-garde beauty. Fashion-magazine artistic direction.',
    industryTags: ['beauty_wellness', 'fashion_ecommerce'],
    gradient: ['#2d0042', '#ff6bce'],
    image: U('1502823403499-6ccfcf4fb453'),
    promptFragment:
      'High-fashion editorial beauty photography. Artistic, conceptual composition that prioritises visual impact over product clarity. Unexpected colour combinations and dramatic lighting contrasts. Model as art subject, not just product vehicle. Typography minimal or absent - the image carries the story alone. Vogue or i-D magazine aesthetic. Bold, experimental, designed to stop the scroll.',
  },
  {
    slug: 'before_after',
    name: 'Before & After',
    description: 'Split-screen transformation. Proof-focused and results-driven.',
    industryTags: ['beauty_wellness', 'fitness_gym'],
    gradient: ['#e0e0e0', '#333333'],
    image: U('1571019613454-1cb2f99b2d8b'),
    promptFragment:
      "Clean split-screen before-and-after layout. Vertical or horizontal divider line splitting the frame precisely in half. Left side labelled 'Before' in small sans-serif, right side 'After'. Consistent lighting and framing between both sides. Result difference is the clear visual hero. Stats or timeline text overlaid in clean sans-serif at bottom. Clinical, credible, and conversion-focused.",
  },

  // ── Fitness & Gym ─────────────────────────────────────────────────────────
  {
    slug: 'energy_motion',
    name: 'Energy & Motion',
    description: 'Dynamic action shots, motion blur, sweat and intensity.',
    industryTags: ['fitness_gym'],
    gradient: ['#cc4400', '#ffcc00'],
    image: U('1517963879433-6ad2b056d712'),
    promptFragment:
      'Dynamic sports action photography. Athlete caught mid-movement with motion blur on extremities emphasising speed and power. Bright saturated colours: electric orange, vivid yellow, or lime green. Strong directional lighting creating muscle definition. Bold angled typography at 10–15 degree tilt. Sweat, dust, or water droplets visible for authenticity. Maximum energy and movement in every frame.',
  },
  {
    slug: 'dark_grit',
    name: 'Dark & Grit',
    description: 'Moody gym photography. Hardcore. No-frills. Raw.',
    industryTags: ['fitness_gym'],
    gradient: ['#111111', '#444444'],
    image: U('1534438327276-14e5300c3a48'),
    promptFragment:
      "Dark hardcore gym photography. Moody low-key lighting from a single industrial source. Concrete walls, metal equipment, chalk dust visible in the air. Desaturated colour grading with heavy contrast. Distressed or stencil-style typography. Subject shown mid-exertion with visible effort. Raw, unfiltered, no glamour. The aesthetic of serious athletes who don't care about aesthetics.",
  },
  {
    slug: 'transformation',
    name: 'Transformation',
    description: 'Before/after results. Stats-driven. Proof over aesthetics.',
    industryTags: ['fitness_gym', 'beauty_wellness'],
    gradient: ['#e0e0e0', '#2d2d2d'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fitness/transformation.jpg',
    promptFragment:
      "Results-focused fitness transformation layout. Split panel showing clear physical change. Same pose, same angle, different body composition. Stats prominently displayed: weight lost, weeks taken, percentage improvement. Clean divider line with 'Week 1' / 'Week 12' labels. Neutral background keeping focus on the subject. Credibility and proof are the design goal.",
  },
  {
    slug: 'motivational_type',
    name: 'Motivational Type',
    description: 'One powerful phrase. Dark background. Athletic silhouette.',
    industryTags: ['fitness_gym', 'education_consulting', 'general_other'],
    gradient: ['#1a1a1a', '#cd1b78'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fitness/motivational_type.png',
    promptFragment:
      'Large motivational quote or phrase as the visual centrepiece. Dark gradient or textured background (concrete, smoke, dark gradient). Single powerful phrase in massive bold uppercase condensed sans-serif typography. Athletic silhouette or action shot used as very low opacity background texture. Minimal colour: monochrome with one strong accent. TED-talk-slide meets gym locker-room poster.',
  },
  {
    slug: 'clean_athletic',
    name: 'Clean Athletic',
    description: 'Nike/Adidas-inspired. Premium sportswear feel. Minimal.',
    industryTags: ['fitness_gym', 'fashion_ecommerce'],
    gradient: ['#f8f8f8', '#222222'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/fitness/clean_athletic.jpg',
    promptFragment:
      'Premium sportswear aesthetic inspired by Nike and Adidas campaigns. Clean white or light grey background with athlete or product as the sole focus. Perfect studio lighting revealing fabric texture and product quality. Minimal typography: one word or tagline in bold sans-serif. No decorative elements. The product and athlete speak for themselves. Aspirational and premium.',
  },

  // ── Real Estate ───────────────────────────────────────────────────────────
  {
    slug: 'property_showcase',
    name: 'Property Showcase',
    description: 'Wide-angle bright interiors. Blue sky, green lawn. HDR clarity.',
    industryTags: ['real_estate'],
    gradient: ['#1a6fa8', '#90c8f0'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/real-estate/property_showcase.jpg',
    promptFragment:
      'Professional real estate photography. Wide-angle interior or exterior shot with HDR-style clarity and brightness. Deep blue sky, well-manicured lawn, clean architectural lines. Interior shots show warm inviting lighting with natural light flooding through windows. Clean info bar at the bottom: bedroom count, bathrooms, price, and neighbourhood. Sans-serif typography in dark overlay bar. The property looks its absolute best.',
  },
  {
    slug: 'luxury_listing',
    name: 'Luxury Listing',
    description: 'Twilight exteriors. Gold serif type. Exclusivity.',
    industryTags: ['real_estate'],
    gradient: ['#1a1000', '#c8960c'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/real-estate/luxury_listing.jpg',
    promptFragment:
      "Luxury property listing aesthetic. Twilight exterior photography: warm interior lights glowing against deep blue dusk sky. Gold or champagne serif typography for property name and key details. Dark overlay at bottom for text readability. Premium finishes highlighted in close-up detail shots. Exclusivity, aspiration, and discretion in every element. Sotheby's-level presentation.",
  },
  {
    slug: 'neighbourhood_life',
    name: 'Neighbourhood Life',
    description: 'Community and lifestyle. Sell the area, not just the property.',
    industryTags: ['real_estate'],
    gradient: ['#3d6b4f', '#90c8a0'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/real-estate/neighbourhood_life.jpg',
    promptFragment:
      'Community lifestyle photography emphasising neighbourhood quality of life. Families walking, children playing, cafés and parks, tree-lined streets. Warm natural golden-hour lighting. Candid, authentic, unposed moments. Sans-serif caption text in clean overlay. The message is: this is where you want to live. Human connection and community belonging as the primary visual story.',
  },
  {
    slug: 'blueprint_modern',
    name: 'Blueprint Modern',
    description: 'Architectural line drawings. Technical precision. Modern.',
    industryTags: ['real_estate'],
    gradient: ['#0d2040', '#1a4080'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/real-estate/blueprint_modern.jpg',
    promptFragment:
      'Architectural blueprint aesthetic. Deep navy or dark slate background with white technical line drawings. Floor plan outlines, elevation sketches, and site layouts as decorative graphic elements. Clean technical sans-serif typography with precise grid-based layout. Property dimensions or room labels incorporated as design elements. Modern, precise, and developer-grade professional presentation.',
  },
  {
    slug: 'aerial_clean',
    name: 'Aerial Clean',
    description: 'Drone-style overhead photography. Wide context. Clean info overlay.',
    industryTags: ['real_estate'],
    gradient: ['#1a6fa8', '#4ab8e0'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/real-estate/aerial_clean.jpg',
    promptFragment:
      'Drone-style aerial or high-angle photography of property and surroundings. Wide contextual view showing the property within its neighbourhood, proximity to landmarks, roads, and green spaces. Clear blue sky, sharp shadow detail from above. Clean white semi-transparent overlay at bottom with property details in dark sans-serif. Conveys location value and neighbourhood context clearly.',
  },

  // ── Education & Consulting ────────────────────────────────────────────────
  {
    slug: 'warm_professional',
    name: 'Warm Professional',
    description: 'Approachable expertise. Warm tones, real people, credibility.',
    industryTags: ['education_consulting', 'general_other'],
    gradient: ['#8b4a00', '#e8a855'],
    image: U('1517048676732-d65bc937f952'),
    promptFragment:
      'Warm professional photography blending credibility with approachability. Expert or educator photographed in a natural work setting: desk, whiteboard, or classroom. Warm amber-toned lighting creating an inviting, trustworthy atmosphere. Slight smile, engaged body language. Clean sans-serif typography on semi-transparent warm overlay. The visual says: this person is accomplished AND easy to work with.',
  },
  {
    slug: 'authority_editorial',
    name: 'Authority Editorial',
    description: 'Magazine-style expert portrait. Gravitas and credibility.',
    industryTags: ['education_consulting'],
    gradient: ['#1a1a2e', '#4a4a8a'],
    image: U('1560250097-0b93528c311a'),
    promptFragment:
      'Business authority editorial photography. Executive or thought-leader portrait in dramatic studio lighting. Strong three-point lighting creating depth and gravitas. Neutral or dark background. Subject in business formal attire with confident, direct gaze. Typography in bold serif or heavy sans-serif conveying weight and authority. Harvard Business Review or Forbes contributor aesthetic.',
  },

  // ── Events & Entertainment ────────────────────────────────────────────────
  {
    slug: 'festival_energy',
    name: 'Festival Energy',
    description: 'Concert poster aesthetic. Explosive. Layered. Loud.',
    industryTags: ['events_entertainment'],
    gradient: ['#4a0080', '#ff6b00'],
    image: U('1470229722913-7c0e2dbbafd3'),
    promptFragment:
      'Concert and festival poster aesthetic. Multiple layered elements: artist photo cutouts, abstract geometric shapes, texture overlays. Explosive typographic hierarchy with headline act massive, supporting acts smaller. Date, venue, and ticket info prominently placed. Neon, metallic, or gradient colour palette. High energy. Reminiscent of Coachella, Afropunk, or Felabration poster design.',
  },

  // ── SaaS / Tech / Fintech (Expanded 2026) ────────────────────────────────
  {
    slug: 'saas_dashboard_hero',
    name: 'Dashboard Hero',
    description: 'Your product IS the visual. Clean UI screenshots as the centrepiece.',
    industryTags: ['fintech_saas_tech', 'general_other'],
    gradient: ['#0d3b8c', '#6a0dad'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/dashboard-hero.jpg',
    promptFragment:
      "Professional product screenshot showcase on a clean gradient background. The hero element is a device mockup (laptop, phone, or tablet) displaying the product's actual UI or a stylised representation of it. Subtle shadow beneath the device for depth. Clean sans-serif typography above or below the device in white or dark text. Background gradient uses brand primary and secondary colours blending smoothly. No decorative clutter. The product screenshot is the entire visual story. Apple-keynote-presentation quality.",
  },
  {
    slug: 'saas_metric_spotlight',
    name: 'Metric Spotlight',
    description: 'One big number tells the whole story. Data as design.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'general_other'],
    gradient: ['#0a2540', '#00d4ff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/metric-spotlight.jpg',
    promptFragment:
      'Data-forward graphic with a single large metric as the hero element: big bold number (72pt+) in brand accent colour, centered vertically. Unit or label directly below in smaller text. Supporting context in 1–2 lines of small text at the bottom. Background: solid dark colour or very subtle gradient. No imagery - the number IS the image. Inspired by investor pitch decks and annual report covers. The typography should be monospaced or geometric sans-serif for the number, clean sans-serif for labels.',
  },
  {
    slug: 'saas_comparison_grid',
    name: 'Comparison Grid',
    description: 'Side-by-side visual proof. Before/after, us vs. them.',
    industryTags: ['fintech_saas_tech', 'general_other'],
    gradient: ['#1a4a6b', '#4a9ebe'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/comparison-grid.jpg',
    promptFragment:
      "Clean two-column or split-screen comparison layout. Left side labelled 'Before' or 'Other tools' with muted/desaturated colours and a subtle red or grey tint. Right side labelled 'After' or 'With [Brand]' with vibrant, saturated brand colours and a green checkmark or glow. Clear divider line (solid or dashed) separating the halves. Clean sans-serif labels. Each side shows either a UI screenshot, a metric, or an icon-based feature list. The visual bias should obviously favour the right side.",
  },
  {
    slug: 'saas_blog_header',
    name: 'Blog Header',
    description: 'Clean editorial imagery for thought leadership content.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'general_other'],
    gradient: ['#f5f5f7', '#86868b'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/blog-header.jpg',
    promptFragment:
      'Wide-format editorial blog header image. Left-aligned bold headline text (2–4 words max) with a complementary abstract illustration or subtle photography on the right. Brand primary colour as an accent bar or background block on one side. Clean whitespace separating text from imagery. Typography: bold geometric sans-serif for the headline, thin sans-serif for any subtitle. Feels like a premium tech publication cover: The Verge, TechCrunch, or Wired. No stock photography - abstract shapes, gradients, or stylised icons preferred.',
  },
  {
    slug: 'saas_feature_card',
    name: 'Feature Card',
    description: 'One feature, one icon, one message. Modular and clean.',
    industryTags: ['fintech_saas_tech', 'general_other'],
    gradient: ['#c8d8f0', '#7eb8ff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/feature-card.jpg',
    promptFragment:
      'Single-feature spotlight card on a clean background. Large custom icon or illustration (line-art style, 2px stroke, brand accent colour) centered or left-aligned. Feature name in bold sans-serif below the icon. One-line description in lighter weight text beneath. Background: soft gradient, solid light colour, or white with a subtle brand-coloured border. Rounded corners (16px) on the overall card shape. Designed to work as a standalone post or as one slide in a carousel where each slide highlights a different feature.',
  },
  {
    slug: 'saas_abstract_gradient',
    name: 'Abstract Gradient',
    description: "Ambient, atmospheric, modern. When you don't need a screenshot.",
    industryTags: ['fintech_saas_tech', 'beauty_wellness', 'general_other'],
    gradient: ['#667eea', '#764ba2'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/abstract-gradient.jpg',
    promptFragment:
      "Full-bleed abstract gradient background with smooth colour transitions using brand palette colours. Organic flowing shapes: blurred orbs, mesh gradients, or aurora-like colour waves. Typography floats on the gradient: large bold statement text in white or very light colour with subtle text shadow for legibility. No imagery, no icons, no screenshots. The mood is ambient, premium, and contemplative. Inspired by Stripe's and Linear's marketing visuals. The gradient itself IS the design.",
  },
  {
    slug: 'saas_code_snippet',
    name: 'Code Snippet',
    description: 'Developer-facing. Dark mode. Technical credibility.',
    industryTags: ['fintech_saas_tech'],
    gradient: ['#0d1117', '#00ff88'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/code-snippet.jpg',
    promptFragment:
      'Dark code editor aesthetic (#0D1117 or #1E1E1E background). Featured code snippet rendered in monospace font (Fira Code or JetBrains Mono style) with syntax highlighting: strings in green, keywords in purple/blue, comments in grey. Line numbers visible on the left margin. Terminal-style header bar with coloured dots (red/yellow/green) at the top. Brand logo or product name in small text at the bottom. Below or beside the code: a one-line plain-language explanation in clean sans-serif. Appeals to developers and technical audiences.',
  },
  {
    slug: 'saas_testimonial_card',
    name: 'Testimonial Card',
    description: 'Social proof that looks designed, not screenshotted.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'general_other'],
    gradient: ['#f5f0eb', '#c8b89a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/testimonial-card.jpg',
    promptFragment:
      'Professional testimonial card with large quotation marks ("") as decorative elements in brand accent colour at 15% opacity behind the text. Customer quote in medium-weight serif or sans-serif, centered. Customer name and title below the quote in bold, with company logo (small, greyscale) beneath. Background: soft brand colour tint or clean white with a subtle coloured border. Optional: small 5-star rating above the quote. Avatar circle photo of the customer in top-centre or left-aligned. Premium, not templated.',
  },
  {
    slug: 'saas_changelog_card',
    name: 'Changelog Card',
    description: 'Ship fast, show fast. Clean update announcements.',
    industryTags: ['fintech_saas_tech'],
    gradient: ['#f0f4ff', '#6c8ef5'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/changelog-card.jpg',
    promptFragment:
      "Clean update announcement card with a coloured category badge at the top: 'NEW' in green, 'IMPROVED' in blue, 'FIXED' in yellow. Feature name as bold headline below the badge. One-line description. Optional: small product UI screenshot showing the change, displayed in a subtle device frame or browser window. Background: white or very light grey with a thin brand-coloured top border. Version number or date in small grey text at the bottom. Developer changelog aesthetic.",
  },
  {
    slug: 'saas_infographic_flow',
    name: 'Infographic Flow',
    description: 'Process visualisation. Steps and flows made visual.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'general_other'],
    gradient: ['#c8d8f0', '#7eb8ff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/infographic-flow.jpg',
    promptFragment:
      'Clean infographic-style process diagram. 3–5 numbered steps arranged vertically or horizontally, connected by arrows or dotted lines. Each step has a circular icon (line-art, brand accent colour) and a short label (2–4 words). The flow direction is clear and visual. Background: white or very light brand tint. Typography: clean geometric sans-serif. Colours: primary brand colour for the step numbers/icons, grey for the connecting lines, dark text for labels. Educational and structural. Think process.st or Notion-style diagrams.',
  },
  {
    slug: 'saas_dark_announcement',
    name: 'Dark Mode Announcement',
    description: 'Premium dark background. For important news that demands attention.',
    industryTags: ['fintech_saas_tech', 'events_entertainment', 'general_other'],
    gradient: ['#0a0a0a', '#1a1a2e'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/dark-announcement.jpg',
    promptFragment:
      "Full dark background (#0A0A0A or #111827) with a single dramatic element: either a glowing product icon, a large embossed number, or a bold text statement. Subtle animated-looking light effects: a soft glow, lens flare, or spotlight illuminating the text from behind. Typography: large, bold, white or light brand colour. Minimal supporting text. No images or screenshots. The darkness creates weight and importance. Inspired by Apple event invitations and Linear's launch pages. Reserve for major announcements.",
  },
  {
    slug: 'saas_social_proof_wall',
    name: 'Social Proof Wall',
    description: 'Logo grids and numbers. Trust at scale.',
    industryTags: ['fintech_saas_tech', 'education_consulting', 'general_other'],
    gradient: ['#ffffff', '#f0f4ff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/saas/social-proof-wall.jpg',
    promptFragment:
      "Clean grid of customer logos arranged in a 3×4 or 4×3 matrix on a white or very light background. All logos rendered in greyscale for visual consistency. Above the grid: a bold headline like 'Trusted by 500+ companies' in dark text. Below the grid: a key metric or social proof number (e.g., '$2.4B processed'). The logos should feel deliberately curated, not crammed. Generous spacing between logos. Optional: a subtle brand-coloured underline beneath the headline.",
  },

  // ── Product-Based Business (Expanded 2026) ───────────────────────────────
  {
    slug: 'prod_hero_pedestal',
    name: 'Hero Pedestal',
    description: 'Product on a stage. Elevated. Premium. The Apple approach.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#f5f0eb', '#c8b89a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/hero-pedestal.jpg',
    promptFragment:
      'Single product centered on a clean surface or floating against a solid-colour background. Dramatic studio lighting from above-left creating a defined shadow beneath. The product occupies 40–60% of the frame with generous negative space. No text unless explicitly needed - the product IS the message. Background colour pulled from brand palette (muted version). Subtle gradient on the surface beneath the product suggesting a platform or pedestal. Shot at slight low angle for a heroic perspective. Luxury product photography quality.',
  },
  {
    slug: 'prod_flat_lay_curated',
    name: 'Curated Flat-Lay',
    description: 'Top-down arrangement. Intentional, styled, Instagram-perfect.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'food_beverage', 'general_other'],
    gradient: ['#e8e4df', '#a8998a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/flat-lay.jpg',
    promptFragment:
      "Overhead flat-lay photography of product arranged with complementary lifestyle props on a textured surface (marble, linen, wood, or concrete). The product is the dominant element, surrounded by 3–5 smaller styling props that create context: coffee cup, plant sprig, fabric swatch, tool, or ingredient. Everything arranged with geometric precision and intentional negative space. Soft even lighting with minimal shadows. Warm natural colour grading. The arrangement tells a story about the product's lifestyle context without words.",
  },
  {
    slug: 'prod_unboxing_reveal',
    name: 'Unboxing Reveal',
    description: 'The packaging IS the experience. Premium unboxing energy.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#8b6914', '#d4a96a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/unboxing.jpg',
    promptFragment:
      "Unboxing-style product photography showing the product emerging from or arranged with its packaging. Box slightly open with tissue paper or branded wrapping visible. The product partially revealed, creating anticipation. Dramatic lighting highlighting the packaging materials and brand details. Dark or brand-coloured background for contrast. Optional: hands pulling the product from the box for human context. The feeling should be 'this is a gift worth opening.' Focus on packaging quality, materials, and the tactile experience.",
  },
  {
    slug: 'prod_ingredient_exploded',
    name: 'Ingredient Exploded',
    description: "Show what it's made of. Transparency builds trust.",
    industryTags: ['beauty_wellness', 'food_beverage', 'general_other'],
    gradient: ['#ffffff', '#90ee90'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/ingredient-exploded.jpg',
    promptFragment:
      "Exploded/deconstructed view showing the product's key ingredients or components arranged around it. Product centered, with raw materials, ingredients, or parts floating or arranged in a circle/arc around it. Clean background (white or light). Each ingredient may have a small label or line pointing to it. Bright, clinical lighting that makes every element look fresh and identifiable. Inspired by cosmetics and food brands that show 'what's inside.' Scientific yet approachable. Transparency and quality as the message.",
  },
  {
    slug: 'prod_lifestyle_in_use',
    name: 'Lifestyle In-Use',
    description: 'Product in its natural habitat. Real context, real life.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'fitness_gym', 'general_other'],
    gradient: ['#3d6b4f', '#a8c5a0'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/lifestyle-in-use.jpg',
    promptFragment:
      "Environmental product photography showing the product being used or displayed in a real-life context. A skincare bottle on a bathroom counter, a tool in a workshop, food on a dining table, electronics on a desk. Natural daylight or warm interior lighting. Shallow depth of field with the product in sharp focus and background softly blurred. Warm, inviting colour grading. No text overlay. Candid and aspirational simultaneously. The viewer should think 'I want my life to look like this' with the product naturally part of that scene.",
  },
  {
    slug: 'prod_colour_swatch',
    name: 'Colour Swatch',
    description: 'Show the range. Multiple variants, one clean layout.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#ffffff', '#cccccc'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/colour-swatch.jpg',
    promptFragment:
      'Clean product variant display showing multiple colourways, sizes, or flavours of the same product arranged in a satisfying grid, row, or gradient sequence. Each variant gets equal visual weight. Background: pure white or light grey for maximum colour accuracy. Even studio lighting with no colour cast. Small clean labels beneath each variant (colour name, flavour, size). The visual rhythm of the arrangement should be satisfying and orderly. Inspired by Pantone swatches and paint chip displays. Perfect for product lines with variety.',
  },
  {
    slug: 'prod_scale_context',
    name: 'Scale Context',
    description: 'How big is it actually? Show it next to something familiar.',
    industryTags: ['fashion_ecommerce', 'general_other'],
    gradient: ['#e8e4df', '#a8998a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/scale-context.jpg',
    promptFragment:
      "Product photographed next to a common object for scale reference: a hand, a coin, a phone, a ruler, a cup. Clean background, even lighting. The scale relationship should be immediately obvious. Clean informational typography showing dimensions if relevant. Not artistic - practical and informative. The viewer's primary question ('how big is this?') is answered instantly. Useful for online sellers where size is a common purchase barrier. E-commerce practical, not editorial.",
  },
  {
    slug: 'prod_process_bts',
    name: 'Process / Behind the Scenes',
    description: "How it's made. Craft and care visible.",
    industryTags: ['fashion_ecommerce', 'food_beverage', 'beauty_wellness', 'general_other'],
    gradient: ['#5c3317', '#c8a06e'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/process-bts.jpg',
    promptFragment:
      "Behind-the-scenes manufacturing or crafting photography. Raw materials being transformed into finished product. Workshop, kitchen, factory, or studio environment. Warm directional lighting. Visible hands at work. Slightly gritty, authentic feel - not over-polished. Subtle film grain at low opacity for an artisanal feel. Text overlay (if any) uses hand-lettered or typewriter-style font. The story is 'real people make this with care.' Builds trust through transparency and craftsmanship. Documentary style.",
  },
  {
    slug: 'prod_seasonal_collection',
    name: 'Seasonal Collection Grid',
    description: 'Multiple products in a thematic arrangement. Holiday or season-specific.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'beauty_wellness', 'general_other'],
    gradient: ['#8b4513', '#d2691e'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/seasonal-collection.jpg',
    promptFragment:
      "Multiple products arranged in a seasonal or thematic grid. 3–6 items evenly spaced. Seasonal props (e.g., autumn leaves, snow, beach sand, flowers) scattered around. Warm or cool color grading depending on season. Soft natural light. Typography uses seasonal script or serif font. The visual says 'new drop' or 'limited time.' Common for holiday campaigns, product launches, or capsule collections. Celebratory and abundant feel.",
  },
  {
    slug: 'prod_comparison_duo',
    name: 'Comparison Duo (Before/After)',
    description: 'Two products or states side-by-side. Clear contrast.',
    industryTags: ['beauty_wellness', 'fashion_ecommerce', 'general_other'],
    gradient: ['#4a5568', '#cbd5e0'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/comparison-duo.jpg',
    promptFragment:
      "Two products side-by-side in a split composition. Left vs. right. Same lighting, same angle, identical framing for fairness. A thin vertical divider line (optional). Text labels: 'Before/After', 'Option A / Option B', 'Old / New', or similar. Clean sans-serif labels. Neutral background (white, grey, or soft gradient). The point: objective comparison. Used for skincare results, product upgrades, or A/B showcases. Minimal distractions - the difference is the hero.",
  },
  {
    slug: 'prod_360_angles',
    name: 'Multi-Angle / 360° Grid',
    description: 'Same product from every angle. Comprehensive view.',
    industryTags: ['fashion_ecommerce', 'general_other'],
    gradient: ['#2d3748', '#718096'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/360-angles.jpg',
    promptFragment:
      "4–6 images of the same product arranged in a clean grid. Each image shows a different angle: front, back, side, top, bottom, detail close-up. Consistent lighting and background across all frames. White or light grey studio backdrop. Small text labels ('Front', 'Back', 'Detail') if helpful. The message: 'we have nothing to hide - see it all.' E-commerce trust-builder. Clean, informational, catalogue-style professionalism.",
  },
  {
    slug: 'prod_bundle_stack',
    name: 'Bundle / Kit Stack',
    description: 'Multiple products grouped as a set. Value and completeness.',
    industryTags: ['beauty_wellness', 'food_beverage', 'general_other'],
    gradient: ['#744210', '#c97d3a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/bundle-stack.jpg',
    promptFragment:
      "Multiple products arranged together as a kit or bundle. Organized in a visually pleasing stack, fan, or cluster. Clean studio background or rustic surface (wood, marble). Each product clearly visible. Soft directional light with gentle shadows. Typography: 'Complete Set', 'Starter Kit', 'Bundle & Save', etc. The visual suggests value, convenience, and thoughtful curation. Used for gift sets, skincare routines, meal kits, or subscription boxes. Abundant without being cluttered.",
  },
  {
    slug: 'prod_customer_photo_frame',
    name: 'Customer Photo Feature',
    description: 'Real customer images framed and showcased. Social proof.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#4c1d95', '#7c3aed'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/customer-photo-frame.jpg',
    promptFragment:
      "User-generated content (UGC) style: real customer photos displayed in polaroid-style frames, phone mockups, or pinboard layout. 2–4 images arranged casually. Each frame slightly rotated for authenticity. Subtle shadows for depth. Text overlay: 'Our customers', 'Real results', '@username'. Background: neutral or branded gradient. The goal: trust and relatability. People trust other people more than brands. Works for fashion, beauty, fitness, food - anything visual and social. Casual, authentic, community-driven.",
  },
  {
    slug: 'prod_price_tag',
    name: 'Price / Promo Tag Pop',
    description: 'Bold price or offer highlighted. Urgency and clarity.',
    industryTags: ['fashion_ecommerce', 'food_beverage', 'beauty_wellness', 'general_other'],
    gradient: ['#dc2626', '#fca5a5'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/product/price-tag.jpg',
    promptFragment:
      "Product image with a bold, eye-catching price or discount tag overlay. Large sans-serif or stencil font. Bright accent color (red, yellow, green). Tag styled as: sticker, badge, ribbon, or stamped label. The product is secondary - the offer is the hero. Text examples: '50% OFF', '₦5,000', 'Flash Sale', 'Limited Time'. High contrast for immediate readability. Background slightly blurred or desaturated to make the tag pop. Pure conversion focus - urgency and value at a glance. Retail advertising DNA.",
  },

  // ==========================================
  // SERVICE-BASED BUSINESS STYLES (14)
  // ==========================================

  {
    slug: 'svc_authority_quote',
    name: 'Authority Quote Card',
    description: 'Your words. Bold typography. Thought leadership.',
    industryTags: ['education_consulting', 'general_other'],
    gradient: ['#1e3a8a', '#3b82f6'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/authority-quote.jpg',
    promptFragment:
      'Text-dominant design with a bold, thought-provoking quote centered on a solid or gradient background. Large serif or bold sans-serif font. Minimal design - no distracting imagery. Optional: small headshot or logo in the corner. Color scheme: dark background with white/gold text, or light background with dark text. Quotation marks stylized as design elements. Footer: your name and title in smaller text. The aesthetic: TED Talk slide, LinkedIn carousel authority, keynote speaker energy. Positioning you as the expert.',
  },
  {
    slug: 'svc_tip_carousel',
    name: 'Tip Carousel Slide',
    description: 'Swipeable educational content. Value-first marketing.',
    industryTags: ['education_consulting', 'fitness_gym', 'beauty_wellness', 'general_other'],
    gradient: ['#0f766e', '#14b8a6'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/tip-carousel.jpg',
    promptFragment:
      "Clean, minimalist slide designed for multi-image carousel posts. One tip per slide. Bold headline at top (e.g., 'Tip #3: Use power words'). 2–3 lines of body text. Lots of white space for readability. Branded accent color (border, header bar, or icon). Optional: small icon or illustration. Footer: consistent branding (logo, page number like '3/7'). The format: educational, scroll-stopping, highly shareable. Common for coaches, consultants, and educators. Instagram carousel gold.",
  },
  {
    slug: 'svc_case_study_result',
    name: 'Case Study / Result Card',
    description: 'Client success story. Numbers and outcomes highlighted.',
    industryTags: ['education_consulting', 'fitness_gym', 'real_estate', 'general_other'],
    gradient: ['#713f12', '#d97706'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/case-study-result.jpg',
    promptFragment:
      "Before/after metrics or client transformation story. Bold, oversized numbers (e.g., '+300%', '₦12M revenue', '6 weeks'). Clean layout with clear hierarchy. Client name or industry (anonymized if needed). Small testimonial quote. Icon or illustration representing the outcome (graph arrow, trophy, checkmark). Background: gradient or photo with overlay. The goal: proof of results. Used by agencies, consultants, coaches, trainers. Data-driven storytelling. Trust-building through evidence.",
  },
  {
    slug: 'svc_framework_diagram',
    name: 'Framework / Process Diagram',
    description: 'Your methodology visualized. Steps, pillars, or systems.',
    industryTags: ['education_consulting', 'general_other'],
    gradient: ['#4c1d95', '#a78bfa'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/framework-diagram.jpg',
    promptFragment:
      "Visual diagram or flowchart showing your signature process, framework, or system. 3–5 steps/pillars arranged in a path, cycle, pyramid, or column layout. Each step labeled with an icon and short text. Arrows or connecting lines between steps. Branded color scheme. Clean, professional, slightly corporate. The message: 'I have a proven system.' Used by consultants, coaches, course creators to show their unique methodology. Infographic-style clarity. Establishes intellectual property and structure.",
  },
  {
    slug: 'svc_headshot_branded',
    name: 'Branded Headshot / Personal Brand',
    description: 'You are the brand. Professional portrait with identity elements.',
    industryTags: ['education_consulting', 'real_estate', 'events_entertainment', 'general_other'],
    gradient: ['#1f2937', '#6b7280'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/headshot-branded.jpg',
    promptFragment:
      'High-quality professional headshot on a branded background (solid color, gradient, or subtle pattern). You looking confident, approachable, and polished. Clean studio lighting. Optional text overlay: your name, title, tagline, or value proposition. Logo placement subtle but present. The portrait should feel premium - not a selfie. Wardrobe: aligned with your industry (suit for corporate, casual for creative). For personal brands, consultants, coaches, speakers, realtors. First-impression content.',
  },
  {
    slug: 'svc_stat_grid',
    name: 'Stat / Metric Grid',
    description: 'Multiple data points in a clean layout. Authority through numbers.',
    industryTags: ['education_consulting', 'fitness_gym', 'real_estate', 'general_other'],
    gradient: ['#065f46', '#10b981'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/stat-grid.jpg',
    promptFragment:
      "2x2 or 3x3 grid showing key business metrics or achievements. Each cell contains: a large number, a label, and optionally an icon. Examples: '500+ Clients', '15 Years', '98% Success Rate', '₦50M+ Revenue'. Consistent typography and spacing. Background: solid color or soft gradient. The aesthetic: minimal, data-forward, credible. Used in year-in-review posts, About pages, pitch decks. Builds authority and trust through quantifiable proof.",
  },
  {
    slug: 'svc_event_speaker',
    name: 'Event / Speaking Engagement',
    description: 'You on stage or at an event. Credibility and visibility.',
    industryTags: ['education_consulting', 'events_entertainment', 'general_other'],
    gradient: ['#7c2d12', '#ea580c'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/event-speaker.jpg',
    promptFragment:
      "Photo of you speaking at an event, on stage, or leading a workshop. Audience visible in foreground (blurred). Professional event lighting. You mid-gesture or mid-speech - active and engaged. Text overlay: event name, topic, or date. Slight vignette or color grading for cinematic feel. The message: 'I'm in demand. I'm a thought leader.' Used by consultants, coaches, trainers to showcase credibility. Social proof through public presence.",
  },
  {
    slug: 'svc_newsletter_teaser',
    name: 'Newsletter / Content Teaser',
    description: 'Drive traffic to your newsletter, blog, or long-form content.',
    industryTags: ['education_consulting', 'general_other'],
    gradient: ['#1e1b4b', '#4f46e5'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/newsletter-teaser.jpg',
    promptFragment:
      "Graphic promoting your newsletter, article, or downloadable resource. Bold headline (the hook). 1–2 lines of subtext. Clear CTA: 'Read now', 'Subscribe', 'Download free guide'. Mockup of a document, email inbox, or browser window (optional). Branded colors. Clean, editorial layout. The goal: clickthrough. Builds your email list or drives blog traffic. Used by writers, consultants, educators, content creators. Lead generation focus.",
  },
  {
    slug: 'svc_checklist_graphic',
    name: 'Checklist / How-To Graphic',
    description: 'Actionable steps in a scannable format. Practical value.',
    industryTags: ['education_consulting', 'fitness_gym', 'beauty_wellness', 'general_other'],
    gradient: ['#166534', '#22c55e'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/checklist-graphic.jpg',
    promptFragment:
      "Numbered or bulleted checklist on a clean background. 3–7 items. Each item with a checkmark or icon. Clear, bold typography. Title at top (e.g., '5 Steps to Better Sleep'). Footer: your branding. Color scheme: professional and friendly. The format is instantly recognizable and shareable. High engagement. Used by coaches, trainers, consultants, educators. Delivers immediate, practical value. Positions you as helpful and generous with expertise.",
  },
  {
    slug: 'svc_before_after_text',
    name: 'Before/After Text Contrast',
    description: 'Transformation shown in words. Emotional contrast.',
    industryTags: ['education_consulting', 'fitness_gym', 'beauty_wellness', 'general_other'],
    gradient: ['#7f1d1d', '#ef4444'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/before-after-text.jpg',
    promptFragment:
      "Split design: left side labeled 'Before', right side labeled 'After'. Each side contains a short list of pain points (before) vs. outcomes (after). Example: 'Before: confused, broke, overwhelmed' → 'After: clear, profitable, confident'. Text-only or with subtle background gradient. Arrow or divider between the two sides. The aesthetic: direct, relatable, transformation-focused. Common in coaching, consulting, course sales. Taps into desire and aspiration.",
  },
  {
    slug: 'svc_question_hook',
    name: 'Question Hook Card',
    description: 'Provocative question to stop the scroll. Engagement bait.',
    industryTags: ['education_consulting', 'fitness_gym', 'general_other'],
    gradient: ['#831843', '#db2777'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/question-hook.jpg',
    promptFragment:
      "Bold, oversized question text centered on a solid or gradient background. Example: 'Are you leaving money on the table?', 'What if you could 10x your leads?'. Large serif or bold sans-serif font. No imagery - just text. Optional: small subtext or CTA at bottom. High contrast for readability. The goal: stop the scroll, provoke curiosity, drive engagement (comments, clicks). Classic social media hook strategy. Used across all service industries.",
  },
  {
    slug: 'svc_client_logo_showcase',
    name: 'Client Logo Showcase',
    description: "Brands you've worked with. Trust by association.",
    industryTags: ['education_consulting', 'events_entertainment', 'general_other'],
    gradient: ['#1e293b', '#475569'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/client-logo-showcase.jpg',
    promptFragment:
      "Grid or scattered arrangement of client logos (greyscale or monochrome for consistency). 6–12 logos. Title text: 'Trusted by', 'Our clients', 'We've worked with'. Clean, corporate aesthetic. Minimal background (white, grey, or subtle gradient). The message: credibility through association. Used by agencies, consultants, freelancers. Social proof at scale. If you've worked with recognizable brands, flaunt it. B2B trust-builder.",
  },
  {
    slug: 'svc_hiring_card',
    name: "We're Hiring / Team Card",
    description: 'Recruitment or team culture showcase.',
    industryTags: ['education_consulting', 'events_entertainment', 'general_other'],
    gradient: ['#0c4a6e', '#0284c7'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/service/hiring-card.jpg',
    promptFragment:
      "Bold text: 'We're Hiring!' or 'Join Our Team' on a branded background. Optional: team photo (diverse, happy, collaborative vibe). Clean typography. Small bullet points: perks, roles, or values. CTA: 'Apply now', 'Link in bio'. The aesthetic: welcoming, professional, growth-focused. Used for recruitment marketing, employer branding, culture showcases. Attracts talent and signals that your business is thriving. Modern, people-first design.",
  },

  // ── Perfume & Fragrance (2026 Visual Style Guide) ──────────────────────────

  {
    slug: 'perf_editorial_ingredient',
    name: 'Editorial Ingredient',
    description: 'Clean, premium, ingredient-forward. For hero shots and launches.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#f5f0eb', '#c8b89a'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/editorial-ingredient.jpg',
    promptFragment: `Create a premium minimalist product poster. Vertical 4:5 format, ultra-realistic product photography. Main composition: the perfume bottle is placed slightly off-center (left or right), standing upright on the surface. The product label and brand name on the bottle must be clearly visible and readable. The bottle is the hero element occupying 40-50% of the frame. Foreground styling: surround the bottle with raw fragrance ingredients that reflect its scent notes. Arrange them in a clean, intentional, editorial style - not cluttered. Examples: rose petals scattered, vanilla pods, citrus slices, coffee beans, sandalwood pieces, oud chips, lavender sprigs. Each ingredient should be identifiable and beautifully lit. Surface: natural premium surface - marble slab, raw stone, light wood tray, or linen cloth. The surface grounds the product and adds tactile texture. Background: clean minimal background with generous negative space on one side for text placement. Neutral tone: warm cream, soft grey, or brand-complementary colour. No distracting patterns. Lighting: soft diffused studio lighting. Natural highlights on the glass bottle showing transparency and liquid colour. Gentle shadows beneath the bottle and ingredients. Clean commercial fragrance aesthetic. Typography layout (placed in the negative space, not over the product): large headline text in elegant serif or thin sans-serif font, smaller subtext below, CTA line at the bottom with arrow. Colour palette: neutral base (cream/grey/stone) with accent colours drawn from the ingredients and the liquid colour inside the bottle. Mood: fresh, premium, editorial, clean, brand-focused. Quality: 4K, ultra-detailed, sharp focus on product, soft background, commercial-ready.`,
  },
  {
    slug: 'perf_noir_luxe',
    name: 'Noir Luxe',
    description: 'Dark, seductive, mysterious. For evening fragrances.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#0A0A0A', '#d4a017'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/noir-luxe.jpg',
    promptFragment: `Ultra-luxurious dark fragrance photography. Near-black background (#0A0A0A) with dramatic chiaroscuro lighting. Single strong directional light source from the upper left, creating deep shadows and brilliant highlights on the glass bottle surface. The perfume bottle is centered or slightly left, standing on a reflective black surface that creates a mirror reflection beneath it. The glass catches light like jewellery - sharp reflections, visible liquid inside with a warm amber or deep ruby tone. Brand name on the bottle is illuminated by the directional light and clearly legible. Atmosphere: wisps of dark smoke or mist curling behind and around the bottle at low opacity. The smoke adds mystery without obscuring the product. Optional: a few dark rose petals, black orchid, or gold leaf flakes scattered on the reflective surface. No bright colours. The entire palette is: black, deep gold, warm amber, and one accent from the fragrance notes (burgundy for oud, deep purple for iris, warm bronze for vanilla). The bottle is the only illuminated element - everything else falls into shadow. Typography: thin elegant serif font in gold or warm white. Positioned in the dark negative space. Minimal text - the fragrance name and one evocative word or phrase. No busy layouts. Mood: seductive, mysterious, nocturnal, exclusive, high-end. The viewer should feel like they're looking at a fragrance that costs more than they think. Quality: 4K, cinematic lighting, editorial perfumery photography, luxury magazine advertisement quality.`,
  },
  {
    slug: 'perf_golden_hour_romance',
    name: 'Golden Hour Romance',
    description: 'Warm, romantic, dreamy. Golden light and soft petals.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#d4a96a', '#f0c674'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/golden-hour-romance.jpg',
    promptFragment: `Romantic fragrance photography bathed in golden hour sunlight. Warm amber and honey-toned colour grading throughout the entire image. The light comes from behind and to the side of the bottle, creating a warm backlit glow through the glass and illuminating the liquid inside. The perfume bottle sits on a soft surface - rumpled silk fabric in blush pink, champagne gold, or ivory. Scattered around the bottle: fresh flower petals (rose, peony, or jasmine) in soft focus, some catching the golden light. A few petals appear to be floating or just fallen. Background: soft, warm, out-of-focus bokeh in golden tones. Could suggest a sunset garden, a bedroom window at golden hour, or a sunlit vanity. The background is never sharp - always dreamy and blurred. The bottle is the only element in sharp focus. The bottle's glass catches and refracts the warm light, creating small rainbow prisms on the silk surface. The liquid inside glows amber or rose-gold. Typography: elegant script or thin serif font in warm white or soft gold. Positioned in the upper portion of the image or to the side. Romantic, not corporate. No cool tones. No blue. No harsh lighting. Everything is warm, soft, and glowing. Mood: romantic, intimate, feminine, golden, dreamy. The viewer should feel warmth and desire. Quality: 4K, shallow depth of field, cinematic golden hour lighting, luxury perfume editorial.`,
  },
  {
    slug: 'perf_wet_glass_drama',
    name: 'Wet Glass Drama',
    description: 'Fresh, clean, water-inspired. Droplets and cool tones.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#4dd0e1', '#ffffff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/wet-glass-drama.jpg',
    promptFragment: `Fresh aquatic fragrance photography. The perfume bottle is covered in realistic water droplets - beaded condensation on the glass surface as if it was just pulled from cold water. Each droplet catches light individually, creating micro-reflections. The bottle stands on a wet surface - either a shallow pool of water (1-2mm deep) creating perfect reflections, or a wet stone/marble slab with visible water sheen. Small water splashes frozen in mid-air around the base of the bottle add dynamic energy. Background: gradient from cool aqua blue at the top to near-white at the bottom. Clean, fresh, minimal. Optional: a single green leaf or citrus slice partially submerged in the water at the base, suggesting freshness. Lighting: bright, clean, high-key with a slight cool tone. Strong specular highlights on the water droplets and the wet glass surface. The bottle is brilliantly lit - the liquid inside is visible and appears fresh, possibly light blue, green, or crystal clear. Colour palette: cool blues, aqua, silver, white, crystal clear. One warm accent only if the fragrance has a warm note (bergamot gold, grapefruit pink). Typography: clean modern sans-serif in white or silver. Crisp, precise, minimal. Positioned in the clean upper portion of the image. Mood: fresh, clean, invigorating, aquatic, crisp, modern. Like the first breath of cold air. Quality: 4K, ultra-sharp focus on water droplets, macro-photography detail on the glass surface.`,
  },
  {
    slug: 'perf_smoke_amber',
    name: 'Smoke & Amber',
    description: 'Smoky, warm, oriental. Incense and richness.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#5d4037', '#d4a017'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/smoke-amber.jpg',
    promptFragment: `Warm smoky fragrance photography inspired by Arabian perfumery and oriental scent traditions. The perfume bottle is placed on a dark wooden surface or ornate metal tray with Middle Eastern-inspired geometric patterns. Visible incense smoke rising behind and around the bottle - thick enough to create atmosphere but not obscure the product. The smoke catches warm side-lighting, creating golden-amber streaks through the air. The smoke is the key atmospheric element. Surrounding the bottle: raw amber resin chunks, cinnamon sticks, star anise, dried dark roses, oud wood chips, and/or saffron threads. Arranged intentionally, not scattered randomly. Each ingredient is a deliberate styling choice that tells the scent story. Lighting: warm amber/golden directional light from one side. The opposite side falls into rich shadow. The glass bottle catches warm reflections. The liquid inside appears deep amber, dark gold, or rich mahogany. Background: deep charcoal or dark burgundy with subtle texture (could suggest dark fabric, aged leather, or ornate wall). Not pure black - there should be warmth even in the shadows. Typography: gold serif or Arabic-inspired display font. Positioned in the darker areas. Minimal text. The atmosphere does the selling. Colour palette: deep amber, warm gold, dark burgundy, charcoal, cinnamon brown. No cool tones. Mood: warm, exotic, rich, ceremonial, ancient luxury. The viewer should almost smell the incense. Quality: 4K, atmospheric lighting, visible smoke particles, luxury oriental perfumery aesthetic.`,
  },
  {
    slug: 'perf_botanical_garden',
    name: 'Botanical Garden',
    description: 'Natural, green, organic. Garden-fresh and alive.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#558b2f', '#a8c5a0'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/botanical-garden.jpg',
    promptFragment: `Natural botanical fragrance photography. The perfume bottle is placed among fresh, living greenery - as if discovered in a garden. Surrounding elements: fresh leaves (monstera, fern fronds, eucalyptus), small wildflowers, herb sprigs (rosemary, mint, thyme), moss, and small stones. The arrangement feels organic and slightly wild - not a sterile studio flat-lay but a curated-natural composition. Some leaves overlap the base of the bottle naturally. A sprig of herb might lean against the glass. Surface: natural earth-toned surface - raw terracotta, weathered wood, natural stone, or actual garden soil with moss. Textured and organic. Lighting: dappled natural sunlight, as if filtering through tree canopy. Warm but not hot - fresh morning light quality. Soft leaf shadows falling across the surface and the bottle. The glass bottle catches green reflections from surrounding foliage. Background: soft out-of-focus greenery (bokeh) suggesting a garden environment. Greens range from deep forest to bright lime, with occasional flower colour accents (white, pale purple, soft yellow). Typography: clean sans-serif or gentle serif in dark green or earthy brown. Positioned in a naturally clear area of the composition. Organic feel. Colour palette: greens (multiple shades), earth browns, cream, white flower accents. Natural and unprocessed. Mood: fresh, natural, alive, botanical, organic, garden-morning. The viewer should feel outdoors. Quality: 4K, natural daylight photography, sharp focus on bottle with soft bokeh background, editorial nature photography aesthetic.`,
  },
  {
    slug: 'perf_street_luxe',
    name: 'Street Luxe',
    description: 'Urban, bold, youthful. Concrete and confidence.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#424242', '#00e5ff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/street-luxe.jpg',
    promptFragment: `Urban street-style fragrance photography. The perfume bottle sits on raw concrete, asphalt, or a graffiti-tagged surface. The environment is urban: think rooftop, parking garage, wet city street at night, or a brutalist concrete wall as background. The bottle is shot at a low angle (looking slightly upward) giving it a heroic, dominant presence. It owns the space. The brand label faces the camera directly and is fully legible. Atmosphere: urban night or blue-hour lighting. Neon colour accents reflecting off the concrete and the glass bottle - electric blue, hot pink, or acid green from nearby signage (implied, not directly visible). Rain-wet surfaces reflecting the neon glow. No flowers. No silk. No softness. Props (if any) are urban: a chrome chain, a matte black lighter, a pair of dark sunglasses, or nothing at all - just the bottle against the city. Typography: bold condensed sans-serif or block capitals. White or neon accent colour. Positioned with intentional grit - slight rotation, tight kerning, urban poster energy. Not centred and polite - slightly aggressive and confident. Colour palette: concrete grey, wet black, neon accent (one colour only), chrome/silver from the bottle cap. Mood: confident, urban, young, unisex, nightlife, streetwear. The viewer should feel the city and the attitude. Quality: 4K, cinematic urban photography, shallow depth of field, neon reflections on wet surfaces.`,
  },
  {
    slug: 'perf_crystal_minimal',
    name: 'Crystal Minimal',
    description: 'Ultra-clean, transparent, modern. Nothing unnecessary.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#ffffff', '#e0e0e0'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/crystal-minimal.jpg',
    promptFragment: `Ultra-minimalist fragrance photography on a pure white or very light grey background. The perfume bottle is perfectly centred with extreme negative space on all sides - at least 40% of the image is empty space. The bottle is the only element in the frame. No props. No ingredients. No styling. Just the bottle, the light, and the space. The liquid inside the bottle is visible and its colour is the only colour accent in the entire image. Lighting: perfectly even, soft, shadowless illumination. The bottle appears to float - either on an invisible white surface with no visible shadow, or with only the faintest shadow directly beneath it. Studio infinity cove lighting quality. Every detail of the bottle design is visible: the cap texture, the label typography, the glass thickness, the liquid level. The bottle's transparency is the visual story. Light passes through the glass and liquid, creating subtle colour refractions on the white surface. If the liquid is amber, there's a faint amber glow beneath. If it's clear, the refraction is prismatic. Typography: extremely thin, light-weight sans-serif. Small. Precise. Positioned with mathematical precision in the negative space. The text whispers - it doesn't shout. Maximum 10 words total. Colour palette: white, off-white, and the single colour of the liquid inside the bottle. That's it. Mood: clean, modern, precise, transparent, honest, Scandinavian-minimalist. The viewer should feel clarity and intention. Quality: 4K, studio product photography, absolutely sharp focus, zero distraction, Glossier/Aesop/Byredo energy.`,
  },
  {
    slug: 'perf_velvet_night',
    name: 'Velvet Night',
    description: 'Rich, textured, intimate. Fabric and depth.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#4a148c', '#d4a017'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/velvet-night.jpg',
    promptFragment: `Intimate textured fragrance photography. The perfume bottle rests on crushed velvet fabric - deep burgundy, midnight blue, or forest green. The velvet's texture is visible and tactile, with folds and light catching the nap of the fabric. The bottle sits in a slight depression in the velvet, as if just placed there. Soft warm side-lighting creates rich shadows in the fabric folds and warm highlights on the glass. The liquid inside the bottle glows with warm ambient light. Surrounding elements (minimal): a single dark jewel-toned flower (dark red rose, deep purple iris, or black dahlia), a small piece of raw amber or a vanilla pod. Maximum 2 props. The velvet and the bottle do most of the work. Background: soft gradient from the velvet colour into deeper darkness. Intimate, close, like a private vanity or jewellery box. Lighting: warm, intimate, slightly low-key. One soft light source from the side. The glass bottle's edges catch rim light, defining its silhouette against the dark background. The velvet absorbs light beautifully, creating rich depth. Typography: elegant serif with slight warmth. Gold, cream, or the accent colour of the velvet. Small, refined, positioned in the darker upper portion. Colour palette: deep jewel tones (burgundy, navy, emerald), warm gold highlights, cream for text. Rich and saturated. Mood: intimate, luxurious, tactile, close, evening, indulgent. The viewer should want to touch the velvet and the bottle. Quality: 4K, close-up textured photography, visible fabric grain, warm intimate lighting, luxury editorial.`,
  },
  {
    slug: 'perf_citrus_burst',
    name: 'Citrus Burst',
    description: 'Bright, energetic, explosive. Summer in a bottle.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#fdd835', '#ff6f00'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/citrus-burst.jpg',
    promptFragment: `High-energy citrus fragrance photography. Bright, saturated, dynamic. The perfume bottle is surrounded by an explosion of fresh citrus: lemon slices, orange wedges, lime halves, grapefruit segments, bergamot - arranged in a dynamic arc or scattered with intentional energy, as if just sliced and tossed. Juice droplets and citrus spray visible in the air around the bottle, frozen mid-splash. Small water droplets on the citrus surfaces and the glass bottle. The liquid inside the bottle is visible - bright yellow, golden, or pale green. Surface: wet white marble or glossy white surface with citrus juice pooling slightly. Clean and bright. Lighting: bright, high-key, slightly warm. Strong highlights on the wet surfaces and the citrus flesh. The colours are saturated and punchy - vivid yellows, bright oranges, electric greens. The bottle gleams. Background: clean gradient from bright white to very pale citrus tone (lemon yellow or lime green at 5% opacity). Bright and airy. No darkness anywhere. Typography: bold modern sans-serif in white, bright yellow, or vivid orange. Energetic positioning - can be slightly angled for dynamism. Fun but not childish. Colour palette: vivid citrus colours (yellow, orange, lime green, grapefruit pink), bright white, glass transparency. Mood: fresh, energetic, joyful, summer, daytime, alive. The viewer should feel refreshed and awake. Quality: 4K, high-speed photography feel (frozen droplets), ultra-saturated colour, commercial beverage/fragrance hybrid energy.`,
  },
  {
    slug: 'perf_heritage_editorial',
    name: 'Heritage Editorial',
    description: 'Classic, timeless, sophisticated. Old-world luxury.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#8b6914', '#d4a96a'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/heritage-editorial.jpg',
    promptFragment: `Classic editorial fragrance photography inspired by vintage luxury advertising. The perfume bottle sits on an antique surface: aged mahogany desk, vintage leather-bound book, ornate silver tray, or an old marble mantelpiece. The composition references old-world luxury: a vintage mirror reflecting the bottle, an antique clock or compass nearby, aged parchment paper, a silk pocket square, or a single long-stemmed flower in a small crystal vase. Every prop feels like it belongs in a 1940s Parisian apartment. Lighting: warm, painterly, Rembrandt-inspired. Dominant warm light from one side with the other falling into rich shadow. The lighting feels old-world - like candlelight or soft lamp light, not modern studio. The glass bottle glows warmly. Colour grading: warm sepia undertone across the entire image. Slightly desaturated but rich. Aged, golden, warm. The image could almost be a painting. Typography: classic serif with small caps and generous letter-spacing. Gold, cream, or deep burgundy. Positioned with classical balance - centred or symmetrical. Timeless, not trendy. Colour palette: aged gold, warm mahogany, cream, burgundy, antique silver. Warm and rich throughout. No cool or modern tones. Mood: timeless, sophisticated, established, heritage, old-money luxury. The viewer should feel that this fragrance has existed for generations, even if it launched yesterday. Quality: 4K, painterly lighting, art-directed still-life photography, Vogue editorial from the golden era.`,
  },
  {
    slug: 'perf_floating_surreal',
    name: 'Floating Surreal',
    description: 'Artistic, dreamlike, gravity-defying. The scent visualised.',
    industryTags: ['perfume_fragrance'],
    gradient: ['#4a148c', '#00bcd4'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/perfume/floating-surreal.jpg',
    promptFragment: `Surrealist art-directed fragrance photography. The perfume bottle floats in mid-air - no visible surface, no support. It hovers in a dreamlike environment where the fragrance notes are visualised as floating elements around it. Surrounding the floating bottle: the scent notes materialised as physical objects suspended in zero gravity. Rose petals drifting upward. Vanilla pods tumbling slowly. Wisps of golden smoke curling in impossible directions. Water droplets frozen mid-air. Spice particles catching light. Each element represents a fragrance note. Background: soft gradient or atmospheric colour that represents the fragrance's mood. Warm amber gradient for oriental scents. Cool blue mist for fresh scents. Deep purple nebula for evening scents. The background is the scent's emotional colour made visible. Lighting: dramatic and directional. The bottle is the brightest element - lit as if from within or with a strong spotlight. Floating ingredients are lit to varying degrees, some catching bright light, others in softer illumination. Light rays or god-rays optional for added drama. The composition breaks physical rules intentionally. Nothing touches the ground. Shadows fall upward or in unexpected directions. The image feels like a dream or a moment frozen in time. Typography: modern display font with character. Can be bold or delicate depending on the fragrance. Positioned floating within the composition, not anchored to top or bottom. The text is part of the surreal scene. Colour palette: determined by the fragrance's emotional colour. Monochromatic with one or two accent colours from the floating ingredients. Mood: dreamlike, artistic, surreal, otherworldly, conceptual. The viewer should feel transported. This is perfume as art, not commerce. Quality: 4K, CGI-quality photography, gravity-defying composition, high-fashion editorial, avant-garde commercial.`,
  },

  // ── ART-PIECE POSTER STYLES (9:16 Mobile Wallpaper Format) ────────────────
  {
    slug: 'art_luxury_showroom',
    name: 'Luxury Showroom',
    description: 'Premium interior. Architectural, warm, aspirational.',
    industryTags: ['real_estate', 'home_garden', 'fashion_ecommerce', 'general_other'],
    gradient: ['#c8b89a', '#f5f0eb'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/luxury-showroom.jpg',
    promptFragment: `Create a premium art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product is displayed in a luxury architectural interior. Premium materials surround it — polished marble, warm wood panelling, soft leather, brass fixtures. The setting feels like a high-end boutique, a luxury home, or an upscale gallery. Natural light streams through tall windows or skylights. The space is minimal but rich. PRODUCT PLACEMENT: The product is the central hero. It sits on a pedestal, a surface, or floats slightly above the ground (levitation effect). It is lit beautifully — warm spotlighting or natural sunlight highlighting its details. The product takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed prominently at the top third or top centre of the poster. Logo size: large and clear. Tagline is positioned just below the logo or near the product in elegant serif or sans-serif font. Feature badges (e.g., 'Premium Quality', 'Limited Edition', 'Handcrafted') are placed near the bottom or flanking the product in gold or white frames. LAYOUT & COMPOSITION: 9:16 vertical format. Product in lower-middle area. Logo at top. Tagline and badges integrated naturally into the scene. Negative space is used intentionally for elegance. The composition is balanced, sophisticated, and aspirational. LIGHTING: Warm, natural, architectural. Soft shadows. Sunbeams or diffused window light. Gold hour glow optional. COLOR PALETTE: Warm neutrals — cream, beige, caramel, gold, soft white. Accent colours from the product itself. MOOD: Aspirational, premium, sophisticated, architectural, warm. QUALITY: 4K, ultra-realistic CGI, professional product photography, architectural digest style.`,
  },
  {
    slug: 'art_nature_immersion',
    name: 'Nature Immersion',
    description: 'Product surrounded by natural beauty. Organic, refreshing, eco-premium.',
    industryTags: ['beauty_wellness', 'perfume_fragrance', 'food_beverage', 'health_fitness', 'home_garden'],
    gradient: ['#3d6b4f', '#a8c5a0'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/nature-immersion.jpg',
    promptFragment: `Create a nature-immersive art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product is placed within a lush natural setting — surrounded by tropical leaves, ferns, moss, flowers, stones, water, or forest elements. The nature is hyper-real and abundant. Green dominates. The product sits on a natural surface (wooden stump, mossy rock, shallow water) or floats slightly above it. PRODUCT PLACEMENT: The product is the clear focal point. It is nestled into the natural scene but stands out through lighting and contrast. Nature frames the product but does not overwhelm it. Product takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre or top left in a clean modern font (white or earthy green). Tagline is positioned below the logo or near the product in a complementary font. Feature badges (e.g., 'Organic', 'Eco-Friendly', '100% Natural') are placed near the bottom in subtle white or green frames. LAYOUT & COMPOSITION: 9:16 vertical format. Nature fills the background and mid-ground. Product in the lower-middle or centre. Logo at top. Badges at bottom. The composition is lush, immersive, and balanced. LIGHTING: Natural, soft, organic. Dappled sunlight through leaves. Morning dew sparkle. Subtle mist or haze optional. COLOR PALETTE: Rich greens, earthy browns, soft creams, white, gold accents. Product colours pop against the green backdrop. MOOD: Refreshing, organic, premium-natural, immersive, eco-luxury. QUALITY: 4K, ultra-realistic, botanical photography style, National Geographic quality.`,
  },
  {
    slug: 'art_ingredient_explosion',
    name: 'Ingredient Explosion',
    description: 'Product surrounded by ingredients mid-flight. Dynamic, fresh, transparent.',
    industryTags: ['food_beverage', 'beauty_wellness', 'health_fitness'],
    gradient: ['#ff8c00', '#ffd700'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/ingredient-explosion.jpg',
    promptFragment: `Create an ingredient-explosion art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: Clean white or soft gradient background. The product is the anchor in the centre or lower-centre of the frame. Around it, ingredients are suspended mid-air in an explosive, dynamic arrangement — fresh fruits, vegetables, herbs, spices, liquids, powders, or natural extracts. Everything is frozen in motion as if captured at the peak of an explosion. PRODUCT PLACEMENT: The product sits calmly in the centre while chaos swirls around it. It is the stable focal point. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in bold, modern font (black or brand colour). Tagline is positioned below the logo or near the product in clean sans-serif font. Feature badges (e.g., 'Fresh Ingredients', 'No Additives', 'Real Food') are placed near the bottom in white or coloured frames. LAYOUT & COMPOSITION: 9:16 vertical format. Ingredients explode radially from behind or around the product. Logo at top. Badges at bottom. The composition is dynamic, energetic, and visually exciting. LIGHTING: Bright, clean, commercial. Ingredients are lit to show freshness — water droplets sparkle, colours pop, textures are sharp. COLOR PALETTE: White or soft gradient background. Vibrant ingredient colours (greens, reds, yellows, oranges). Product colours stand out. MOOD: Fresh, dynamic, transparent, energetic, appetising, premium-commercial. QUALITY: 4K, ultra-realistic, high-speed photography style, professional commercial shot.`,
  },
  {
    slug: 'art_neon_underground',
    name: 'Neon Underground',
    description: 'Dark, edgy, neon-lit. Cyberpunk meets street culture.',
    industryTags: ['fashion_ecommerce', 'events_entertainment', 'fintech_saas_tech', 'general_other'],
    gradient: ['#0d0d0d', '#ff1cf7'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/neon-underground.jpg',
    promptFragment: `Create a neon-underground art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: Dark, gritty, urban setting — underground tunnel, alleyway, neon-lit room, or cyberpunk street. Neon lights (pink, blue, purple, cyan) cast dramatic coloured lighting on the product. Wet pavement reflects the neon glow. Concrete, metal, graffiti, and industrial textures dominate. PRODUCT PLACEMENT: The product is the hero, lit by neon lights from the sides or behind. It stands out against the dark background through bright neon rim lighting or spotlighting. Product takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top in bold, modern, or futuristic font (neon colour or white with glow effect). Tagline is positioned below the logo or near the product in a glowing neon-style font. Feature badges (e.g., 'Limited Drop', 'Exclusive', 'Underground') are placed near the bottom in neon-framed boxes. LAYOUT & COMPOSITION: 9:16 vertical format. Dark background fills most of the frame. Neon lights create visual interest. Product in lower-middle or centre. Logo at top with glow. Badges at bottom. The composition is edgy, moody, and cinematic. LIGHTING: Neon lighting (pink, blue, purple, cyan). Rim lighting on product. Dark shadows. High contrast. Cinematic and dramatic. COLOR PALETTE: Dark blacks and greys. Neon pinks, blues, purples, cyans. Product colours pop against darkness. MOOD: Edgy, underground, cyberpunk, cinematic, bold, rebellious. QUALITY: 4K, ultra-realistic, cinematic cyberpunk style, Blade Runner aesthetic.`,
  },
  {
    slug: 'art_golden_throne',
    name: 'Golden Throne',
    description: 'Product on a golden pedestal. Regal, premium, crown-jewel treatment.',
    industryTags: ['fashion_ecommerce', 'perfume_fragrance', 'jewellery_watches', 'general_other'],
    gradient: ['#7b2d00', '#d4a017'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/golden-throne.jpg',
    promptFragment: `Create a golden-throne art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product sits on or is surrounded by golden elements — a golden pedestal, throne, platform, or gilded frame. Background is rich and luxurious — deep velvet (burgundy, emerald, navy), gold-leafed walls, or soft gradient with gold particles floating. The setting feels regal, premium, and exclusive. PRODUCT PLACEMENT: The product is the crown jewel. It sits on the golden pedestal or throne, elevated and highlighted. It is lit with warm, golden light. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in an elegant serif or luxury sans-serif font (gold or white). Tagline is positioned below the logo or near the product in a complementary elegant font. Feature badges (e.g., 'Premium', 'Luxury', 'Exclusive') are placed near the bottom in gold-framed boxes. LAYOUT & COMPOSITION: 9:16 vertical format. Golden pedestal or throne in lower-middle area. Product on top. Logo at top. Badges at bottom. The composition is regal, symmetrical, and luxurious. LIGHTING: Warm golden light. Spotlighting on product. Soft glow around pedestal. Dramatic shadows optional. COLOR PALETTE: Rich gold, deep jewel tones (burgundy, emerald, navy), black, cream. Product colours stand out against luxury backdrop. MOOD: Regal, premium, exclusive, luxurious, crown-jewel, aspirational. QUALITY: 4K, ultra-realistic, luxury commercial photography, high-end editorial.`,
  },
  {
    slug: 'art_frozen_impact',
    name: 'Frozen Impact',
    description: 'Product surrounded by frozen splash. Dynamic freeze-frame.',
    industryTags: ['food_beverage', 'beauty_wellness', 'health_fitness', 'sports_fitness'],
    gradient: ['#00bcd4', '#ffffff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/frozen-impact.jpg',
    promptFragment: `Create a frozen-impact art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: Clean white or soft gradient background. The product is the anchor in the centre. Around it, a liquid (water, milk, juice, cream, paint) is frozen mid-splash in a dynamic, sculptural shape. The splash is perfectly frozen — droplets suspended in air, liquid ribbons curling, impact crown forming. High-speed photography aesthetic. PRODUCT PLACEMENT: The product sits calmly at the centre while the frozen splash surrounds or impacts it. The product is stable; the splash is dynamic. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in bold, modern font (black or brand colour). Tagline is positioned below the logo or near the product in clean sans-serif font. Feature badges (e.g., 'Hydrating', 'Refreshing', 'Pure') are placed near the bottom in white or coloured frames. LAYOUT & COMPOSITION: 9:16 vertical format. Frozen splash fills mid-ground. Product in centre. Logo at top. Badges at bottom. The composition is dynamic, clean, and visually striking. LIGHTING: Bright, clean, commercial. Liquid is backlit or side-lit to show transparency and sparkle. Product is front-lit. COLOR PALETTE: White or soft gradient background. Transparent or coloured liquid (clear water, white milk, orange juice, etc.). Product colours pop. MOOD: Dynamic, fresh, clean, energetic, refreshing, premium-commercial. QUALITY: 4K, ultra-realistic, high-speed photography, commercial product shot.`,
  },
  {
    slug: 'art_botanical_garden',
    name: 'Botanical Garden',
    description: 'Product in curated botanical scene. Elegant, scientific, natural luxury.',
    industryTags: ['beauty_wellness', 'perfume_fragrance', 'home_garden', 'health_fitness'],
    gradient: ['#556b2f', '#90ee90'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/botanical-garden.jpg',
    promptFragment: `Create a botanical-garden art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product is placed within a carefully curated botanical scene — elegant glass greenhouse, botanical garden display, or minimalist natural setup. Plants are arranged intentionally — ferns, eucalyptus, dried flowers, botanical specimens in glass jars, or terrariums. The aesthetic is scientific meets luxury — think apothecary meets modern botanical art. PRODUCT PLACEMENT: The product is the focal point, placed on a natural surface (wooden table, stone slab, glass shelf) and framed by botanical elements. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in an elegant serif or modern sans-serif font (deep green or black). Tagline is positioned below the logo or near the product in a complementary font. Feature badges (e.g., 'Botanical', 'Plant-Based', 'Natural') are placed near the bottom in subtle green or white frames. LAYOUT & COMPOSITION: 9:16 vertical format. Botanical elements fill the background and frame the product. Product in lower-middle area. Logo at top. Badges at bottom. The composition is elegant, balanced, and scientific. LIGHTING: Soft, natural, diffused. Greenhouse light quality. Subtle shadows. Clean and bright. COLOR PALETTE: Soft greens, creams, whites, natural wood tones, glass transparency. Product colours stand out against botanical backdrop. MOOD: Elegant, scientific, natural-luxury, apothecary, botanical-art. QUALITY: 4K, ultra-realistic, botanical photography, Kinfolk magazine aesthetic.`,
  },
  {
    slug: 'art_fire_smoke',
    name: 'Fire & Smoke',
    description: 'Product surrounded by flames or smoke. Intense, bold, powerful.',
    industryTags: ['food_beverage', 'fashion_ecommerce', 'sports_fitness', 'general_other'],
    gradient: ['#000000', '#ff4500'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/fire-smoke.jpg',
    promptFragment: `Create a fire-and-smoke art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: Dark background (black or deep charcoal). The product is surrounded by fire, flames, smoke, or heat distortion. Flames lick upward around the product. Smoke swirls dramatically. Embers float in the air. The scene is intense, bold, and cinematic. PRODUCT PLACEMENT: The product sits calmly at the centre while fire and smoke surround it. The product is untouched by the flames but framed by them. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in bold, modern font (white or fiery orange with glow effect). Tagline is positioned below the logo or near the product in a complementary bold font. Feature badges (e.g., 'Bold', 'Intense', 'Powerful') are placed near the bottom in white or fiery orange frames. LAYOUT & COMPOSITION: 9:16 vertical format. Flames and smoke fill the mid-ground and background. Product in centre. Logo at top. Badges at bottom. The composition is intense, dramatic, and cinematic. LIGHTING: Dramatic fire lighting. Orange, red, yellow glow. Strong contrast. Dark shadows. Cinematic and powerful. COLOR PALETTE: Dark blacks. Fiery oranges, reds, yellows. Smoke greys. Product colours pop against dark fiery backdrop. MOOD: Intense, bold, powerful, cinematic, dramatic, energetic. QUALITY: 4K, ultra-realistic, cinematic fire photography, high-end commercial.`,
  },
  {
    slug: 'art_crystal_cave',
    name: 'Crystal Cave',
    description: 'Product in crystal or gemstone cave. Mystical, luxurious, ethereal.',
    industryTags: ['beauty_wellness', 'perfume_fragrance', 'jewellery_watches', 'general_other'],
    gradient: ['#4a148c', '#ba68c8'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/crystal-cave.jpg',
    promptFragment: `Create a crystal-cave art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product is placed inside or in front of a crystal cave — surrounded by large quartz crystals, amethyst geodes, or gemstone formations. Crystals catch and refract light, creating colourful sparkles and glows. The cave is mystical, luxurious, and otherworldly. PRODUCT PLACEMENT: The product sits on a natural crystal platform or floats slightly above it. It is framed by crystals but remains the focal point. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in an elegant serif or luxury sans-serif font (white or crystal colour). Tagline is positioned below the logo or near the product in a complementary elegant font. Feature badges (e.g., 'Pure', 'Precious', 'Radiant') are placed near the bottom in white or crystal-coloured frames. LAYOUT & COMPOSITION: 9:16 vertical format. Crystals fill the background and mid-ground. Product in lower-middle area. Logo at top. Badges at bottom. The composition is mystical, balanced, and luxurious. LIGHTING: Ethereal, magical. Crystals catch light and create sparkles. Soft coloured glows (purple, blue, pink). Mystical and enchanting. COLOR PALETTE: Deep purples, blues, pinks, whites, crystal transparency. Product colours stand out against mystical crystal backdrop. MOOD: Mystical, luxurious, ethereal, enchanting, precious, otherworldly. QUALITY: 4K, ultra-realistic, fantasy photography, mystical commercial aesthetic.`,
  },
  {
    slug: 'art_ocean_surface',
    name: 'Ocean Surface',
    description: 'Product floating on or under water. Refreshing, clean, serene.',
    industryTags: ['beauty_wellness', 'food_beverage', 'health_fitness', 'perfume_fragrance'],
    gradient: ['#006994', '#00bcd4'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/ocean-surface.jpg',
    promptFragment: `Create an ocean-surface art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product is placed on, in, or under clear blue water. Shot from above or at water level. Water is crystal clear — you can see ripples, reflections, light rays penetrating the surface, and subtle underwater distortion. The scene is refreshing, clean, and serene. Optional: floating flowers, leaves, or bubbles. PRODUCT PLACEMENT: The product floats on the water surface or sits just beneath it. Water ripples around it. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in clean, modern font (white or aqua blue). Tagline is positioned below the logo or near the product in a complementary font. Feature badges (e.g., 'Hydrating', 'Pure', 'Refreshing') are placed near the bottom in white or aqua blue frames. LAYOUT & COMPOSITION: 9:16 vertical format. Water fills the frame. Product in lower-middle or centre. Logo at top. Badges at bottom. The composition is clean, serene, and refreshing. LIGHTING: Natural, bright, clean. Sunlight penetrates the water, creating light rays and sparkles. Underwater glow. COLOR PALETTE: Clear blues, aqua, turquoise, white, crystal transparency. Product colours pop against clean water backdrop. MOOD: Refreshing, clean, serene, pure, hydrating, natural. QUALITY: 4K, ultra-realistic, underwater photography, clean commercial aesthetic.`,
  },
  {
    slug: 'art_workshop_craft',
    name: 'Workshop Craft',
    description: 'Product in workshop or craft studio. Handmade, artisan, authentic.',
    industryTags: ['fashion_ecommerce', 'home_garden', 'food_beverage', 'general_other'],
    gradient: ['#5d4037', '#8d6e63'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/workshop-craft.jpg',
    promptFragment: `Create a workshop-craft art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product is displayed in a workshop or craft studio — surrounded by artisan tools, raw materials, workbenches, and handmade textures. Leather, wood, metal, fabric, or clay tools are visible. The aesthetic is authentic, rugged, and artisan. PRODUCT PLACEMENT: The product sits on a workbench or natural surface, surrounded by craft tools and materials. It is the finished masterpiece among the raw materials. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in a bold, artisan-style font (black or craft colour). Tagline is positioned below the logo or near the product in a complementary handcrafted font. Feature badges (e.g., 'Handmade', 'Artisan', 'Crafted') are placed near the bottom in rustic frames. LAYOUT & COMPOSITION: 9:16 vertical format. Workshop tools and materials fill the background. Product in lower-middle area. Logo at top. Badges at bottom. The composition is authentic, rugged, and artisan. LIGHTING: Natural workshop light. Warm, directional, with visible texture and shadows. Authentic and real. COLOR PALETTE: Earthy browns, blacks, wood tones, leather, metal greys. Product colours stand out against workshop backdrop. MOOD: Authentic, artisan, handmade, rugged, craft, heritage. QUALITY: 4K, ultra-realistic, artisan photography, heritage brand aesthetic.`,
  },
  {
    slug: 'art_velvet_stage',
    name: 'Velvet Stage',
    description: 'Product on velvet-draped stage. Theatrical, elegant, spotlight moment.',
    industryTags: ['events_entertainment', 'fashion_ecommerce', 'perfume_fragrance', 'general_other'],
    gradient: ['#1a0000', '#8b0000'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/velvet-stage.jpg',
    promptFragment: `Create a velvet-stage art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product is placed on or in front of a velvet-draped stage — rich velvet curtains (burgundy, emerald, navy, black) frame the scene. A single spotlight illuminates the product from above. The background is dark, theatrical, and elegant. Optional: subtle stage smoke or haze. PRODUCT PLACEMENT: The product sits centre stage, lit by a dramatic spotlight. It is the star of the show. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in an elegant serif or theatrical font (gold or white). Tagline is positioned below the logo or near the product in a complementary elegant font. Feature badges (e.g., 'Limited Edition', 'Exclusive', 'Premiere') are placed near the bottom in gold or white frames. LAYOUT & COMPOSITION: 9:16 vertical format. Velvet curtains frame the sides and background. Product in centre. Spotlight from above. Logo at top. Badges at bottom. The composition is theatrical, elegant, and dramatic. LIGHTING: Single spotlight from above. Dramatic shadows. Optional stage smoke diffusing light. Theatrical and cinematic. COLOR PALETTE: Rich velvet colours (burgundy, emerald, navy, black), gold accents, white spotlight glow. Product colours pop under spotlight. MOOD: Theatrical, elegant, dramatic, spotlight moment, premiere, exclusive. QUALITY: 4K, ultra-realistic, theatrical photography, high-end commercial.`,
  },
  {
    slug: 'art_tech_orbit',
    name: 'Tech Orbit',
    description: 'Product floating in futuristic tech environment. Digital, modern, innovative.',
    industryTags: ['fintech_saas_tech', 'electronics_gadgets', 'general_other'],
    gradient: ['#000033', '#00ffff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/tech-orbit.jpg',
    promptFragment: `Create a tech-orbit art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product floats in a futuristic tech environment — surrounded by holographic rings, digital particles, circuit patterns, or glowing tech elements. Background is dark or deep gradient (black to blue, black to purple). The aesthetic is digital, modern, and innovative. PRODUCT PLACEMENT: The product floats in the centre, surrounded by orbiting tech elements (rings, particles, holograms). It is the core of the digital system. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in a modern, futuristic font (white or neon colour with glow). Tagline is positioned below the logo or near the product in a complementary tech-style font. Feature badges (e.g., 'Innovative', 'Smart', 'Digital') are placed near the bottom in glowing tech frames. LAYOUT & COMPOSITION: 9:16 vertical format. Tech elements orbit around product in centre. Logo at top. Badges at bottom. The composition is futuristic, dynamic, and digital. LIGHTING: Digital glow. Neon rim lighting on product. Holographic light effects. Futuristic and glowing. COLOR PALETTE: Dark blacks, deep blues, purples, neon cyans, whites. Product colours pop against digital backdrop. MOOD: Futuristic, innovative, digital, modern, tech-forward, dynamic. QUALITY: 4K, ultra-realistic, sci-fi commercial, tech product photography.`,
  },
  {
    slug: 'art_sunset_canvas',
    name: 'Sunset Canvas',
    description: 'Product silhouetted or featured in golden sunset. Warm, dreamy, aspirational.',
    industryTags: ['travel_hospitality', 'fashion_ecommerce', 'events_entertainment', 'general_other'],
    gradient: ['#ff6b35', '#f7931e'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/sunset-canvas.jpg',
    promptFragment: `Create a sunset-canvas art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product is featured against or within a stunning sunset scene — golden hour sky, warm orange and pink gradients, silhouetted landscape (mountains, ocean, city skyline). The scene is dreamy, warm, and aspirational. The product can be silhouetted or lit with warm golden light. PRODUCT PLACEMENT: The product is placed in the lower-middle area, either silhouetted against the sunset or lit with golden light. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in a bold, elegant font (white or warm gold). Tagline is positioned below the logo or near the product in a complementary font. Feature badges (e.g., 'Premium', 'Exclusive', 'Limited') are placed near the bottom in white or warm gold frames. LAYOUT & COMPOSITION: 9:16 vertical format. Sunset sky fills the upper two-thirds. Product in lower-middle area. Logo at top. Badges at bottom. The composition is warm, dreamy, and aspirational. LIGHTING: Golden hour lighting. Warm orange, pink, purple sunset glow. Silhouette or warm rim lighting on product. COLOR PALETTE: Warm oranges, pinks, purples, golds, silhouette blacks. Product colours (if lit) pop against sunset backdrop. MOOD: Warm, dreamy, aspirational, golden hour, premium, lifestyle. QUALITY: 4K, ultra-realistic, golden hour photography, cinematic commercial.`,
  },
  {
    slug: 'art_street_market',
    name: 'Street Market',
    description: 'Product in vibrant street market scene. Authentic, colourful, community-focused.',
    industryTags: ['food_beverage', 'fashion_ecommerce', 'home_garden', 'general_other'],
    gradient: ['#ff6347', '#ffa500'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/style-library/art-piece/street-market.jpg',
    promptFragment: `Create a street-market art-piece product poster in 9:16 mobile wallpaper format (1080x1920). Advanced design level. Ultra-realistic. ENVIRONMENT: The product is displayed in a vibrant street market scene — colourful market stalls, fresh produce, handmade goods, bustling energy. Background shows market life — crates, baskets, textiles, natural textures. The aesthetic is authentic, colourful, and community-focused. PRODUCT PLACEMENT: The product sits prominently on a market table or stand, surrounded by market elements but clearly the hero of the scene. Takes up 20-30% of the frame. BRANDING INTEGRATION: Brand logo is placed at the top centre in a bold, friendly font (black or market colour). Tagline is positioned below the logo or near the product in a complementary handcrafted font. Feature badges (e.g., 'Fresh', 'Local', 'Handmade') are placed near the bottom in colourful frames. LAYOUT & COMPOSITION: 9:16 vertical format. Market scene fills the background. Product in lower-middle area on market stand. Logo at top. Badges at bottom. The composition is vibrant, authentic, and community-focused. LIGHTING: Natural daylight. Bright, colourful, authentic. Slight shadows from market canopy. COLOR PALETTE: Vibrant market colours — reds, yellows, greens, oranges, natural wood tones. Product colours pop against colourful market backdrop. MOOD: Authentic, vibrant, community, fresh, local, colourful, energetic. QUALITY: 4K, ultra-realistic, street photography, authentic commercial aesthetic.`,
  },

  // ══════════════════════════════════════════════════════════════
  // AI MARKETING TEMPLATES (Professional Prompt-Engineered Templates)
  // ══════════════════════════════════════════════════════════════

  {
    slug: 'modern_doodle_collage',
    name: 'Modern Doodle Collage',
    description: 'Editorial fashion poster with playful doodle graphics and minimalist product focus',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#f5e6d3', '#ff6b9d'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/marketing-templates/modern-doodle-collage.jpg',
    styleType: 'marketing_template',
    templateCategory: 'editorial',
    promptFragment: `FORMAT:\nSquare or 4:5 social media poster. Minimalist editorial composition with a human model in a dynamic fashion pose interacting with [PRODUCT_NAME]. The layout is split into three visual zones: top (playful doodle graphics), middle (human model + product), bottom (clean text space).\n\nSTYLE:\nModern editorial fashion meets playful collage. The aesthetic blends minimalist product photography with hand-drawn doodle overlays — think illustrated stars, arrows, squiggles, and abstract shapes floating around the model and product. The doodles add personality without overwhelming the composition.\n\nCOMPOSITION:\n• Top 25%: Abstract doodle elements (stars, arrows, circles) in accent colors — playful but not chaotic\n• Middle 50%: Human model in a confident, natural pose holding or wearing [PRODUCT_NAME]. The model should look editorial but relatable. Product is clearly visible and well-lit. Background is a solid soft color (cream, light grey, or pastel)\n• Bottom 25%: Clean text space with plenty of breathing room. Simple bold typography for headline or tagline\n\nMODEL:\nA diverse, fashionable human model in casual-chic attire (neutral tones to not compete with product). Natural, confident expression. The model is interacting with [PRODUCT_NAME] — holding it, wearing it, or showcasing it in a lifestyle context. Pose is dynamic but not overly stylized.\n\nTYPOGRAPHY:\nBold sans-serif headline at the bottom in a single accent color (pulled from product or doodles). Text is large, legible, and has space around it. Optional: Small subtext in lighter weight.\n\nCOLOR PALETTE:\nBase: Soft neutral background (cream, off-white, light grey, blush pink)\nAccent: 1-2 vibrant colors for doodles and text (coral, teal, mustard yellow, or bold red)\nProduct colors should pop against the neutral base\n\nLIGHTING:\nSoft, even editorial lighting. No harsh shadows. The model and product should be well-lit with a slight halo effect to make them stand out from the background.\n\nMOOD:\nFresh, approachable, editorial, playful, confident. It feels like a high-end fashion campaign but with personality and warmth.\n\nQUALITY:\nHigh-resolution, clean lines, polished but not overly retouched. Doodles should look intentional and hand-drawn (not clipart).\n\nFINAL RENDER:\nA balanced composition where the human model and [PRODUCT_NAME] are the clear heroes, framed by playful doodle accents and clean typography. The result is scroll-stopping, shareable, and perfectly suited for Instagram feed or stories.`,
  },

  {
    slug: 'minimalist_editorial',
    name: 'Minimalist Editorial',
    description: 'Clean luxury aesthetic with bold typography and sophisticated product showcase',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#f5f5f5', '#8b7d6b'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/marketing-templates/minimalist-editorial.jpg',
    styleType: 'marketing_template',
    templateCategory: 'editorial',
    promptFragment: `FORMAT:\nSquare or 4:5 Instagram post. High-end editorial layout with extreme minimalism. The focus is on [PRODUCT_NAME] as the singular hero, supported by bold typography and abundant negative space.\n\nSTYLE:\nUltra-minimalist luxury editorial. Think high-fashion magazine spreads — clean, sophisticated, with an almost architectural precision. Every element is intentional. The aesthetic is expensive, refined, and confidence-inducing.\n\nCOMPOSITION:\n• Top 30%: Bold, oversized typography (brand name or product headline) in a modern serif or sans-serif. Text is aligned left or centered with lots of breathing room\n• Middle 40%: [PRODUCT_NAME] shot in pristine detail against a solid background (pure white, soft grey, or muted pastel). The product is lit dramatically to create subtle shadows and depth. It sits slightly off-center for visual interest\n• Bottom 30%: Clean space with optional tagline in small, refined type. Minimal text — let the product speak\n\nMODEL:\nNo human model. This is pure product-focused editorial. [PRODUCT_NAME] is the star, captured in sharp detail with perfect lighting and angles.\n\nTYPOGRAPHY:\nBold, oversized headline in a luxury typeface (modern serif like Playfair Display or clean sans like Helvetica Neue). Text is large, confident, and takes up significant visual space. Color is typically black, charcoal, or a muted accent color.\n\nCOLOR PALETTE:\nMonochromatic or duo-tone:\n• Background: Pure white, soft grey, cream, or muted pastel (blush, sage, powder blue)\n• Product: Natural product colors, but overall palette is restrained and cohesive\n• Typography: Black, charcoal, or a single muted accent color\n\nLIGHTING:\nStudio lighting with dramatic contrast. The product should have defined shadows that add depth without being harsh. Think luxury product photography — clean, controlled, with a sense of dimension.\n\nMOOD:\nLuxurious, confident, sophisticated, expensive, editorial, aspirational. This is for brands that want to feel premium and high-end.\n\nQUALITY:\nUltra-high resolution. Razor-sharp product detail. Flawless execution. Every pixel is intentional.\n\nFINAL RENDER:\nA striking, museum-quality image where [PRODUCT_NAME] is elevated to art. Bold typography commands attention, while negative space creates breathing room. The result is unmistakably premium and scroll-stopping.`,
  },

  {
    slug: 'drink_splash',
    name: 'Drink Splash',
    description: 'High-energy beverage photography with dramatic liquid motion and vibrant colors',
    industryTags: ['food_beverage', 'general_other'],
    gradient: ['#00d4ff', '#ff6b35'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/marketing-templates/drink-splash.jpg',
    styleType: 'marketing_template',
    templateCategory: 'beverage',
    promptFragment: `FORMAT:\nSquare or 4:5 social media post. High-energy commercial product shot optimized for beverage brands. The composition is centered, dynamic, and designed to stop the scroll.\n\nSTYLE:\nHigh-energy commercial beverage photography. Think Red Bull, Coca-Cola, or craft beer campaigns — vibrant, fresh, and full of motion. The aesthetic is polished but energetic, with a focus on freshness, flavor, and movement.\n\nCOMPOSITION:\n• Center: [PRODUCT_NAME] (bottle, can, or glass) is the clear hero, positioned dead center or slightly off-center for dynamic tension\n• Foreground: Dramatic liquid splash frozen mid-motion — droplets flying, liquid arcing through the air. The splash should feel powerful but not chaotic. It frames the product without obscuring it\n• Background: Solid vibrant color or gradient that complements the drink (electric blue, citrus orange, lime green, deep red). The background is clean and allows the product and splash to pop\n• Optional garnish: Fresh fruit slices (lemon, lime, orange, berries) floating near the splash or at the base of the product\n\nMODEL:\nNo human model. This is pure product and motion. [PRODUCT_NAME] is the star, supported by the liquid splash and color.\n\nTYPOGRAPHY:\nOptional: Bold product name or tagline at the top or bottom in a modern, punchy typeface. Text should be minimal and not compete with the splash. Color is typically white or a bright accent that contrasts with the background.\n\nCOLOR PALETTE:\nVibrant and high-contrast:\n• Background: Bold, saturated color (electric blue, bright orange, lime green, deep magenta, or gradient)\n• Product: Natural product colors (label, liquid color)\n• Splash: Clear or tinted to match the drink (water, juice, soda bubbles)\n• Garnish: Natural fruit colors for added freshness\n\nLIGHTING:\nHigh-speed studio lighting to freeze the splash in perfect detail. Dramatic backlighting or side lighting creates highlights on the droplets and product. The lighting should make the liquid glisten and the product label sharp and readable.\n\nMOOD:\nEnergetic, refreshing, bold, dynamic, thirst-quenching. This is for brands that want to convey freshness, flavor, and excitement.\n\nQUALITY:\nUltra-high resolution. Razor-sharp details on droplets, splash motion, and product label. High-speed capture aesthetic — every droplet is crisp.\n\nFINAL RENDER:\nA jaw-dropping action shot where [PRODUCT_NAME] is surrounded by a dramatic liquid splash that feels alive. Vibrant colors, sharp details, and dynamic motion create an image that screams refreshment and energy. Perfect for social feeds, ads, or hero banners.`,
  },

  {
    slug: 'food_trust_builder',
    name: 'Food Trust Builder',
    description: 'Authentic farm-to-table aesthetic with natural ingredients and transparent sourcing story',
    industryTags: ['food_beverage', 'health_wellness', 'general_other'],
    gradient: ['#d4a574', '#5d7a3f'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/marketing-templates/food-trust-builder.jpg',
    styleType: 'marketing_template',
    templateCategory: 'food',
    promptFragment: `FORMAT:\n4:5 or square Instagram post. Authentic, trust-building food photography designed for brands that prioritize transparency, quality ingredients, and ethical sourcing. The composition tells a story of craftsmanship and care.\n\nSTYLE:\nFarm-to-table meets artisanal food photography. The aesthetic is warm, natural, and honest — think farmers market, rustic kitchens, and handcrafted food. It feels real, not overly styled. The goal is to build trust and convey quality.\n\nCOMPOSITION:\n• Center: [PRODUCT_NAME] (packaged food product or prepared dish) is the hero, placed on a natural surface (wood table, marble counter, linen cloth)\n• Surrounding context: Raw ingredients that go into the product are arranged around it — fresh vegetables, grains, herbs, spices. These ingredients tell the sourcing story and emphasize quality\n• Props: Natural, minimal props — wooden bowls, ceramic dishes, fresh herbs, burlap, twine. Props should support, not distract\n• Layout: Flat lay or 45-degree angle. Ingredients are arranged in a natural, unforced way with space between elements\n\nMODEL:\nOptional: Human hands in the frame — preparing food, holding ingredients, or arranging the product. Hands should look real and diverse (not stock photo perfect). If no hands, the composition is purely product + ingredients.\n\nTYPOGRAPHY:\nOptional: Small, handwritten-style text overlay with key messaging — 'Made with [ingredient]', 'Farm Fresh', 'No Preservatives', '100% Organic'. Text is subtle, transparent, and placed in negative space. Typically white or soft black.\n\nCOLOR PALETTE:\nWarm, natural, earthy:\n• Base: Natural wood tones, cream, linen whites, soft greys\n• Ingredients: Vibrant natural colors — greens (herbs, vegetables), reds (tomatoes, peppers), golden yellows (grains, oils)\n• Product: Natural packaging colors (kraft paper, earth tones, or brand colors that feel organic)\n\nLIGHTING:\nSoft natural window light from the side or above. Gentle shadows that add depth without being harsh. The lighting should feel like morning sunlight in a kitchen — warm, inviting, and honest.\n\nMOOD:\nTrustworthy, authentic, wholesome, transparent, artisanal, farm-fresh, honest. This is for brands that want to emphasize quality, sourcing, and care.\n\nQUALITY:\nHigh resolution but not overly polished. Textures should be visible — wood grain, fabric weave, herb details. The aesthetic is 'real food, real ingredients'.\n\nFINAL RENDER:\nA warm, inviting image where [PRODUCT_NAME] is surrounded by the raw ingredients and context that tell its story. The viewer immediately understands the quality, sourcing, and care behind the product. Perfect for organic brands, artisanal food companies, and transparency-focused marketing.`,
  },

  {
    slug: 'hyperpop_perspective',
    name: 'Hyperpop Perspective',
    description: 'Bold ultra-saturated aesthetic with dramatic angles and Gen-Z energy',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'tech_innovation', 'general_other'],
    gradient: ['#ff0080', '#00ffff'],
    image: 'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/marketing-templates/hyperpop-perspective.jpg',
    styleType: 'marketing_template',
    templateCategory: 'ecommerce',
    promptFragment: `FORMAT:\n4:5 or 9:16 vertical social post. Ultra-modern, hyper-saturated product photography designed for Gen-Z and bold brands. The composition is dramatic, colorful, and unmistakably attention-grabbing.\n\nSTYLE:\nHyperpop meets maximalist product photography. Think neon-soaked, high-contrast, ultra-vibrant aesthetics inspired by cyberpunk, Y2K nostalgia, and digital art. The vibe is bold, confident, and designed to stop thumbs mid-scroll.\n\nCOMPOSITION:\n• Center-stage: [PRODUCT_NAME] is shot from a dramatic low angle or tilted perspective (Dutch angle). The product feels larger-than-life and powerful\n• Background: Vibrant gradient or solid neon color (electric pink, cyan blue, acid green, sunset orange). Background can include subtle geometric shapes, gradients, or light streaks for added energy\n• Lighting effects: Neon glows, lens flares, light streaks, or holographic reflections around the product. These effects add dimension and futuristic energy\n• Foreground elements: Optional floating geometric shapes (spheres, cubes, rings) in complementary neon colors to frame the product\n\nMODEL:\nOptional: If human presence is needed, include a Gen-Z model with bold style (colorful hair, statement makeup, futuristic accessories). Model is secondary to the product and shot from dramatic angles. If no model, the product is the sole hero.\n\nTYPOGRAPHY:\nBold, futuristic typeface (think techno, cyberpunk, or ultra-bold sans). Text is large, layered, and colorful — often with gradient fills, glows, or 3D effects. Headline sits at top or bottom with high contrast against the background.\n\nCOLOR PALETTE:\nUltra-saturated and high-contrast:\n• Background: Neon gradients (pink-to-blue, orange-to-purple, green-to-cyan) or solid neon colors\n• Product: Natural product colors, but the lighting and effects make it pop with neon highlights\n• Accents: Electric blue, hot pink, acid green, cyber yellow, magenta, holographic reflections\n\nLIGHTING:\nDramatic, high-contrast lighting with neon accent lights. The product is backlit or side-lit to create glowing edges (rim lighting). Lens flares, light leaks, and glows are intentional and add to the futuristic aesthetic.\n\nMOOD:\nBold, energetic, futuristic, confident, rebellious, hyper-modern. This is for brands targeting Gen-Z, gaming culture, or anyone wanting to make a loud statement.\n\nQUALITY:\nUltra-high resolution with intentional digital effects. Colors are pumped to maximum saturation. Details are sharp, but the aesthetic embraces digital maximalism.\n\nFINAL RENDER:\nA visually explosive image where [PRODUCT_NAME] dominates the frame with dramatic angles, neon colors, and futuristic energy. The result is impossible to ignore — perfect for bold brands, hype drops, and Gen-Z-focused campaigns.`,
  },

  // ══════════════════════════════════════════════════════════════
  // VISUAL STYLE GUIDES 2026 (28 Professional Styles)
  // ══════════════════════════════════════════════════════════════

  // ── STARTUP / SAAS VISUAL STYLES (13 styles) ──────────────────

  {
    slug: 'strategic_collage_editorial',
    name: 'Strategic Collage Editorial',
    description: 'Premium startup-editorial with modern strategic collage aesthetic and paper textures.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#1a1a2e', '#6a5acd'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/strategic-collage-editorial.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create a premium startup-editorial campaign visual in a modern "strategic collage" aesthetic.

STYLE:
• Clean SaaS branding blended with magazine editorial design and subtle handcrafted paper textures.

LAYOUT:
• Asymmetrical split-screen composition.
• Left section: Strategic collage arrangement featuring paper torn-edge elements layered tastefully—never messy.
• Right section: Clean, editorial-style hero photograph or bold product/interface screenshot.

COMPOSITION:
• Collage elements: white or off-white paper shapes with natural torn edges, layered with subtle shadows (depth without chaos).
• Include minimal accent marks: delicate pencil sketch lines, faint dotted Bézier curves, or small geometric shapes.
• Paper stack depth: 2–3 layers maximum; must appear planned and strategic, not cluttered.
• Balance: left side is textural and artistic; right side is bold, clean, professional.

SUBJECT:
• Right-side visual: Founder portrait, clean interface mockup, or strategic brand imagery (e.g., laptop, charts, typography lockup).
• If showing interface: crisply rendered UI with soft gradients or modern SaaS brand colors (blues, purples, warm neutrals).

TYPOGRAPHY:
• Include minimal editorial-style text overlay: subheadline or tagline in a refined sans-serif or slim serif typeface.
• Text positioned with breathing room—never crowding elements.
• Acceptable tone: professional, strategic, aspirational, human.

LIGHTING:
• Natural editorial lighting: soft directional shadows creating gentle dimension.
• Collage elements: subtle drop shadows to lift layers.
• Right-side imagery: natural or softly lit studio quality.

TEXTURE:
• Visible paper grain and hand-torn edge texture on collage pieces—realistic but not overly rough.
• Clean sections remain crisp and polished.

COLOR SYSTEM:
• Collage base: white, ivory, soft cream, pale grey.
• Accent colors from brand (subtle blues, lilac, warm beige, muted coral).
• Right-side image: full-color brand visuals or muted editorial tones.

MOOD:
• Strategic, editorial, thoughtfully composed, modern, human-centered, refined.
• Feels premium without feeling cold; creative without being chaotic.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic torn paper texture and shadow rendering.
• Balanced composition where collage and editorial photography integrate seamlessly.`,
  },

  {
    slug: 'premium_utility_minimalism',
    name: 'Premium Utility Minimalism',
    description: 'Brutalist-functional minimalism with industrial elegance and high-contrast lighting.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#0a0a0a', '#d4d4d8'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/premium-utility-minimalism.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create a brutalist-functional minimalist campaign visual with industrial elegance and precision engineering.

STYLE:
• Modern utility meets premium craftsmanship. Think Apple's industrial design language meets architectural brutalism.

LAYOUT:
• Clean centered composition or asymmetric left/right hero product split.
• Generous negative space on all sides—breathing room is essential.

COMPOSITION:
• Monochromatic or near-monochromatic base palette: blacks, greys, whites, metallics.
• Product or subject rendered with ultra-clean lines and functional design language.
• Optional subtle grid or geometric guide overlay—minimal, not decorative.

SUBJECT:
• Premium product, device, or interface mockup floating or placed on industrial surface (brushed metal, concrete, black glass).
• If showing interface: ultra-refined UI in high contrast, with crisp shadows and modern functional design.
• If showing physical product: precision-machined aesthetic, premium materials visible.

TYPOGRAPHY:
• Minimal sans-serif—Helvetica Neue, Euclid, Inter, or similar functional typeface.
• Single headline or tagline, small and restrained—never overpowering the product.
• Optional: small technical annotation labels in light grey for added context.

LIGHTING:
• High-contrast studio lighting with dramatic shadows.
• Single directional key light creating sharp definition and clean shadow falloff.
• Subtle rim lighting on product edges for premium dimensionality.

TEXTURE:
• Visible premium material textures: brushed aluminum, anodized black, matte concrete, leather grain.
• Surfaces should feel expensive and functional.

COLOR SYSTEM:
• Base: pure black, charcoal grey, white, cool greys.
• Accents: single brand color if needed (muted blue, steel teal, or warm copper).
• Metallics allowed as material finishes (silver, gunmetal, brushed gold).

MOOD:
• Functional, precise, premium, confident, architectural, brutalist elegance.
• Feels expensive and intentional—nothing superfluous.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic material rendering and lighting.
• Geometric precision and mathematical balance.`,
  },

  {
    slug: 'neo_brutalist_startup',
    name: 'Neo-Brutalist Startup',
    description: 'Bold geometries, raw unfinished aesthetic, high-contrast brand statements.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#000000', '#ff6b35'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/neo-brutalist-startup.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create a neo-brutalist startup campaign visual with bold geometries and raw unfinished aesthetic.

STYLE:
• Brutalism meets modern digital design—raw, geometric, unapologetic, high-impact.

LAYOUT:
• Grid-based or asymmetric geometric block layout.
• Hard edges, no rounded corners—everything angular and structural.
• Large bold shapes divided into clear visual zones.

COMPOSITION:
• High-contrast geometric shapes: thick borders, solid color blocks, overlapping rectangles.
• Optional: exposed grid lines, visible structural guides, or faint blueprint-style annotations.
• Typography integrated as bold structural elements—text as architecture.

SUBJECT:
• Product, interface mockup, or abstract brand representation.
• Interface: high-contrast UI with bold geometric containers and thick borders.
• Physical products: shown against stark geometric backgrounds or framed by bold shapes.

TYPOGRAPHY:
• Ultra-bold sans-serif headlines (Druk, Neue Haas Grotesk Bold, or similar).
• Large, structural, and confident—text occupies significant visual weight.
• Optional small utility text in lighter weight for balance.

LIGHTING:
• Flat or slightly directional lighting—no soft gradients.
• High-contrast shadows—sharp and geometric, not soft.
• Optional harsh rim lighting for added drama.

TEXTURE:
• Raw concrete, exposed industrial surfaces, matte blacks, unfinished materials.
• Surfaces feel solid and functional.

COLOR SYSTEM:
• Base: black, white, grey, raw concrete tones.
• Bold accent: single high-impact brand color (electric orange, vivid red, cobalt blue, neon yellow).
• Limited palette—high contrast.

MOOD:
• Bold, unapologetic, structural, raw, confident, architectural.
• Feels powerful and intentional—design as statement.

QUALITY:
• Ultra-high resolution (8K).
• Crisp geometric rendering and strong visual hierarchy.
• Photorealistic material textures.`,
  },

  {
    slug: 'cinematic_startup_realism',
    name: 'Cinematic Startup Realism',
    description: 'Founder-focused cinematic storytelling with film-grade depth and warm natural light.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#2d1b00', '#f5a962'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/cinematic-startup-realism.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create a cinematic startup campaign visual with founder-focused storytelling and film-grade realism.

STYLE:
• Cinematic documentary aesthetic—natural, human, authentic, with shallow depth of field.

LAYOUT:
• Rule of thirds composition with intentional negative space.
• Subject positioned naturally, not centered—feels candid but intentional.

COMPOSITION:
• Shallow depth of field (f/1.4–f/2.8 aesthetic)—subject in sharp focus, background softly blurred.
• Natural framing: use architectural elements, windows, or doorways to frame subject.
• Foreground elements: subtle bokeh or out-of-focus objects add cinematic layering.

SUBJECT:
• Founder or team member in real workspace environment—office, café, studio, or urban setting.
• Natural candid pose—working, thinking, conversing—not overly staged.
• Professional attire appropriate to brand (casual-professional, tailored, modern).

WARDROBE:
• Modern professional: neutral tones (black, navy, grey, white) with subtle brand color accents.
• Refined but approachable—no overly formal suits unless brand-appropriate.

ENVIRONMENT:
• Real-world workspace: modern office, open studio, urban café, or architectural backdrop.
• Natural materials: wood, brick, concrete, glass—feels real and grounded.
• Soft ambient light from windows or natural sources.

TYPOGRAPHY:
• Minimal serif or clean sans-serif subheadline or tagline.
• Small, tasteful, positioned with breathing room—never competing with photography.

LIGHTING:
• Soft natural light from windows or ambient sources—golden hour or diffused daylight preferred.
• Gentle shadows and highlights—natural human skin tones.
• Optional subtle practical lights in background (desk lamps, monitors) for depth.

TEXTURE:
• Natural materials: wood grain, fabric weave, concrete texture.
• Realistic human skin tones and fabric rendering.

COLOR SYSTEM:
• Warm natural tones: golden hour warmth, amber accents, soft shadows.
• Muted brand colors integrated subtly (in clothing, environment, or light accents).
• Natural color grading—slightly desaturated with warm lift.

MOOD:
• Authentic, human, cinematic, aspirational, grounded, founder-focused.
• Feels real and relatable—not overly polished or corporate.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic with cinematic depth of field.
• Film-grade color grading and natural lighting.`,
  },

  {
    slug: 'futuristic_enterprise_glow',
    name: 'Futuristic Enterprise Glow',
    description: 'Tech-forward holographic UI with glowing interfaces and cyberpunk-lite aesthetics.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#0a0a1a', '#00d4ff'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/futuristic-enterprise-glow.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create a futuristic enterprise campaign visual with holographic UI and glowing interfaces.

STYLE:
• Tech-forward sci-fi aesthetic—glowing interfaces, holographic projections, cyberpunk-lite elegance.

LAYOUT:
• Layered interface composition with glowing UI elements floating in 3D space.
• Central hero interface or dashboard with supporting holographic data panels.

COMPOSITION:
• Holographic UI panels: transparent glowing interfaces with neon edge highlights.
• Depth layering: multiple interface panels at varying z-depths creating dimensional space.
• Subtle grid or wireframe elements in background for sci-fi context.

SUBJECT:
• Futuristic dashboard, interface mockup, or data visualization.
• Interface elements: charts, graphs, data panels, code snippets—all rendered with glowing edges.
• Optional: sleek device or screen displaying interface.

TYPOGRAPHY:
• Futuristic sans-serif typeface (Orbitron, Exo, Rajdhani, or similar).
• Glowing text with subtle neon edge glow—blues, cyans, purples.
• Data labels and UI annotations integrated into interface panels.

LIGHTING:
• Glowing neon lighting from interface elements—primary light source.
• Dark ambient environment with interface glow illuminating surroundings.
• Subtle rim lighting on any physical elements (devices, hands).

TEXTURE:
• Glowing glass-like transparency on holographic panels.
• Subtle scan lines or digital noise for sci-fi authenticity.
• Reflective surfaces on devices or environment.

COLOR SYSTEM:
• Base: deep blacks, dark navy, charcoal greys.
• Glow colors: electric cyan, neon blue, bright purple, teal green.
• Accents: white UI text and high-contrast data visualizations.

MOOD:
• Futuristic, intelligent, enterprise-grade, tech-forward, glowing elegance.
• Feels advanced and cutting-edge—not overly cyberpunk, still professional.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic glowing effects and holographic transparency.
• Dimensional depth and layering.`,
  },

  {
    slug: 'quiet_luxury_saas',
    name: 'Quiet Luxury SaaS',
    description: 'Old-money sophistication meets modern tech—muted tones and premium material details.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#3e3e3e', '#c5b8a5'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/quiet-luxury-saas.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create a quiet luxury SaaS campaign visual with old-money sophistication and premium materials.

STYLE:
• Quiet luxury aesthetic—understated elegance, premium materials, muted sophistication.

LAYOUT:
• Centered or asymmetric minimal composition with generous negative space.
• Hero product or interface displayed with restrained confidence.

COMPOSITION:
• Premium material surfaces: leather, marble, brushed metal, fine fabric.
• Product or interface placed on luxury surface or integrated into refined environment.
• Minimal decorative elements—luxury through restraint.

SUBJECT:
• Premium device, refined interface mockup, or elegant brand representation.
• Interface: clean UI with muted brand colors and sophisticated typography.
• Physical products: high-end materials and craftsmanship visible.

TYPOGRAPHY:
• Elegant serif or refined sans-serif (Canela, Freight, Graphik, or similar).
• Small, understated, perfectly kerned—never loud.
• Optional tasteful monogram or minimal brand lockup.

LIGHTING:
• Soft directional lighting creating gentle shadows.
• Natural window light or diffused studio light—never harsh.
• Subtle highlights on premium material textures.

TEXTURE:
• Visible premium material details: leather grain, marble veining, fabric weave, wood grain.
• Surfaces feel expensive and tactile.

COLOR SYSTEM:
• Base: warm neutrals—cream, taupe, soft grey, charcoal, ivory.
• Accent: muted brand colors (sage green, dusty blue, warm terracotta, forest green).
• Metallics: brushed gold, rose gold, champagne bronze—subtle and refined.

MOOD:
• Sophisticated, understated, premium, timeless, quietly confident.
• Luxury through restraint—feels expensive without shouting.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic material rendering and natural lighting.
• Impeccable composition and balance.`,
  },

  {
    slug: 'kinetic_startup_energy',
    name: 'Kinetic Startup Energy',
    description: 'High-motion blur, speed lines, dynamic action—capturing momentum and velocity.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#1a1a1a', '#ff4500'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/kinetic-startup-energy.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create a kinetic startup campaign visual with high-motion blur and dynamic action.

STYLE:
• Kinetic energy aesthetic—motion blur, speed lines, dynamic movement, velocity.

LAYOUT:
• Diagonal or off-axis composition suggesting forward momentum.
• Subject positioned with directional flow—left to right or bottom to top.

COMPOSITION:
• Motion blur: directional blur trails suggesting speed and movement.
• Speed lines: subtle geometric lines or streaks reinforcing direction.
• Foreground and background elements: blurred with subject in partial focus.

SUBJECT:
• Founder in motion (walking, running, gesturing dynamically).
• Device or product captured mid-action (spinning, flying, launching).
• Interface: animated UI elements with motion trails or dynamic transitions.

TYPOGRAPHY:
• Bold dynamic typeface with motion-inspired design (italicized, skewed, or with speed lines).
• Text positioned with directional energy—never static.

LIGHTING:
• Dynamic lighting with motion blur creating light trails.
• High-contrast lighting emphasizing speed and action.
• Optional light streaks or lens flares for kinetic energy.

TEXTURE:
• Motion blur creating soft texture in blurred areas.
• Sharp details in focal point contrasting with blurred surroundings.

COLOR SYSTEM:
• Base: blacks, greys, deep blues.
• Energy accents: bright orange, electric red, neon yellow, vivid magenta.
• Gradient transitions suggesting movement and speed.

MOOD:
• Energetic, dynamic, fast-paced, momentum-driven, action-oriented.
• Feels like movement and progress—never static.

QUALITY:
• Ultra-high resolution (8K).
• Realistic motion blur and kinetic effects.
• Sharp focal details with dynamic surrounding blur.`,
  },

  {
    slug: 'afro_futurist_enterprise',
    name: 'Afro-Futurist Enterprise',
    description: 'African cultural patterns meet sci-fi tech—bold colors and futuristic optimism.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#1a0f00', '#ffb700'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/afro-futurist-enterprise.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create an Afro-futurist enterprise campaign visual with African cultural patterns and sci-fi tech.

STYLE:
• Afro-futurism aesthetic—African cultural heritage meets futuristic technology and optimism.

LAYOUT:
• Centered hero composition or dynamic asymmetric layout.
• African-inspired geometric patterns integrated as background or framing elements.

COMPOSITION:
• Geometric patterns: Kente, Adinkra, or abstract African-inspired designs—subtle and modern.
• Futuristic elements: holographic overlays, glowing interfaces, tech elements.
• Layered depth: cultural patterns in background, tech elements in foreground.

SUBJECT:
• Founder, team member, or model of African descent in modern-futuristic setting.
• Interface or product with Afro-futuristic design language.
• Optional: traditional African textiles or artifacts integrated with modern tech.

WARDROBE:
• Modern professional attire with African-inspired prints, colors, or accessories.
• Futuristic styling: sleek tailoring with cultural accents.

ENVIRONMENT:
• Futuristic setting with cultural warmth—modern office, tech lab, or urban backdrop.
• African-inspired architectural elements or patterns integrated subtly.

TYPOGRAPHY:
• Bold modern typeface with geometric African pattern accents.
• Text positioned with cultural and futuristic balance.

LIGHTING:
• Warm golden lighting mixed with cool futuristic glows.
• Dramatic lighting emphasizing subject with cultural warmth.
• Optional holographic glow effects for futuristic touch.

TEXTURE:
• African textile patterns: visible fabric weave or geometric pattern details.
• Futuristic surfaces: glowing interfaces, metallic finishes.

COLOR SYSTEM:
• Base: deep blacks, warm browns, rich golds.
• Cultural accents: bright yellows, oranges, reds, greens—African palette.
• Futuristic accents: electric blues, cyans, neon purples.

MOOD:
• Optimistic, futuristic, culturally proud, tech-forward, warm.
• Celebrates African heritage while embracing future innovation.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic with cultural and futuristic elements balanced.
• Vibrant colors and dynamic composition.`,
  },

  {
    slug: 'founder_documentary',
    name: 'Founder Documentary',
    description: 'Raw candid storytelling—black and white or muted tones with authentic human moments.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#1a1a1a', '#8a8a8a'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/founder-documentary.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create a founder documentary campaign visual with raw candid storytelling and authentic human moments.

STYLE:
• Documentary photography aesthetic—black and white or muted tones, candid, authentic.

LAYOUT:
• Natural candid composition following documentary photography rules.
• Subject positioned naturally—rule of thirds or centered with intention.

COMPOSITION:
• Shallow depth of field creating cinematic focus on subject.
• Natural framing using environment (doorways, windows, architecture).
• Foreground elements for layering and depth.

SUBJECT:
• Founder or team member in authentic moment—working, thinking, conversing.
• Real environment—office, home workspace, café, urban setting.
• Natural expression and body language—not posed or staged.

WARDROBE:
• Authentic personal style—casual, professional, or creative depending on brand.
• No overly formal attire unless genuinely representative.

ENVIRONMENT:
• Real-world workspace with authentic details and imperfections.
• Natural materials and lived-in spaces—feels honest and human.

TYPOGRAPHY:
• Minimal—small caption-style text if any.
• Typewriter or documentary-style typeface—understated and authentic.

LIGHTING:
• Natural available light—window light, ambient indoor light, golden hour outdoor.
• Soft shadows and natural skin tones.
• No artificial studio lighting—documentary realism.

TEXTURE:
• Visible film grain or subtle texture for documentary aesthetic.
• Natural material textures in environment.

COLOR SYSTEM:
• Black and white with rich tonal range (preferred).
• Alternative: muted desaturated color with warm or cool grade.
• Natural human skin tones and environmental colors.

MOOD:
• Authentic, human, vulnerable, honest, documentary, intimate.
• Feels real and unfiltered—storytelling through genuine moments.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic with documentary-style rendering.
• Natural lighting and candid composition.`,
  },

  {
    slug: 'intelligent_interface_surrealism',
    name: 'Intelligent Interface Surrealism',
    description: 'AI-inspired dreamlike interfaces with floating elements and soft gradients.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#1a0033', '#b366ff'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/intelligent-interface-surrealism.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create an intelligent interface surrealism campaign visual with AI-inspired dreamlike elements.

STYLE:
• Surreal tech aesthetic—AI-inspired, dreamlike, floating interfaces, soft gradients, intelligent beauty.

LAYOUT:
• Floating interface elements in three-dimensional dreamlike space.
• Central hero interface with supporting elements suspended around it.

COMPOSITION:
• Floating UI panels: transparent, glowing, softly rendered interfaces.
• Abstract AI-inspired shapes: neural network patterns, flowing data streams, geometric AI symbols.
• Soft depth of field: foreground sharp, background elements softly blurred.

SUBJECT:
• Futuristic AI-powered interface or intelligent dashboard.
• Floating data visualizations, neural network diagrams, or abstract AI representations.
• Optional: human hand interacting with floating interface.

TYPOGRAPHY:
• Elegant futuristic sans-serif with soft glow.
• Text integrated into floating interface elements.
• AI-inspired data labels and intelligent annotations.

LIGHTING:
• Soft ambient glow from interface elements.
• Dreamlike diffused lighting—no harsh shadows.
• Gradient lighting transitions creating surreal depth.

TEXTURE:
• Soft glowing transparency on UI elements.
• Subtle particle effects or light dust for dreamlike atmosphere.
• Smooth gradient surfaces.

COLOR SYSTEM:
• Base: soft blacks, deep purples, midnight blues.
• Glow colors: soft purples, electric violets, gentle cyan, warm pinks.
• Gradient transitions: smooth blends creating dreamlike atmosphere.

MOOD:
• Intelligent, dreamlike, surreal, AI-powered, elegant, futuristic.
• Feels advanced and beautiful—AI aesthetics meet surreal art.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic glowing effects and soft rendering.
• Dreamlike depth and floating composition.`,
  },

  {
    slug: 'tactical_workspace_realism',
    name: 'Tactical Workspace Realism',
    description: 'Overhead tactical workspace—organized tools, devices, and work materials.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#2d2d2d', '#7a7a7a'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/tactical-workspace-realism.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create a tactical workspace realism campaign visual with overhead organized tools and devices.

STYLE:
• Overhead flat-lay workspace aesthetic—organized, tactical, professional toolkit.

LAYOUT:
• Overhead bird's-eye view composition.
• Grid-organized or knolling-style arrangement of tools and devices.

COMPOSITION:
• Organized workspace items: laptop, notebook, pen, coffee, device, cables, accessories.
• Knolling arrangement: items aligned at right angles creating visual order.
• Generous negative space on clean surface (wood desk, concrete, matte black).

SUBJECT:
• Professional workspace tools and devices.
• Laptop or tablet displaying interface or brand content.
• Work essentials: notebook, coffee, phone, headphones, minimal accessories.

TYPOGRAPHY:
• Minimal—small branded labels or interface text visible on screens.
• Optional small tagline positioned with breathing room.

LIGHTING:
• Soft directional overhead lighting.
• Gentle shadows defining object edges and creating depth.
• Natural light aesthetic—window light preferred.

TEXTURE:
• Visible material textures: wood grain, metal finish, leather, fabric.
• Realistic object rendering with tactile details.

COLOR SYSTEM:
• Base: natural wood tones, matte black, grey, white.
• Accents: minimal brand colors in screen displays or small accessories.
• Muted professional palette—never overly colorful.

MOOD:
• Organized, tactical, professional, minimalist, workspace-focused.
• Feels productive and intentional—everything has its place.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic with detailed material rendering.
• Precise alignment and composition.`,
  },

  {
    slug: 'internet_culture_maximalism',
    name: 'Internet Culture Maximalism',
    description: 'Meme-adjacent maximalist chaos—stickers, emoji, bold text, Gen-Z internet energy.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#ff00ff', '#00ffff'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/internet-culture-maximalism.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create an internet culture maximalism campaign visual with meme-adjacent chaos and Gen-Z energy.

STYLE:
• Internet culture maximalism—stickers, emoji, bold text, chaotic energy, meme-adjacent.

LAYOUT:
• Dense layered composition with multiple overlapping elements.
• Controlled chaos—busy but intentionally designed.

COMPOSITION:
• Layered elements: stickers, emoji, text blocks, product cutouts, graphic shapes.
• Overlapping layers creating visual density.
• Bold colorful borders, shapes, and graphic elements.

SUBJECT:
• Product, interface mockup, or founder cutout.
• Surrounded by internet culture elements: emoji reactions, chat bubbles, stickers.
• Optional: meme-inspired visual references (without being actual memes).

TYPOGRAPHY:
• Bold ultra-condensed headlines in bright colors.
• Multiple text layers with different sizes and colors.
• Internet slang or conversational tone—authentic Gen-Z voice.

LIGHTING:
• Bright flat lighting—no dramatic shadows.
• High saturation and high contrast.
• Optional: digital glow effects on text or elements.

TEXTURE:
• Digital sticker textures, flat graphic elements.
• Optional subtle scan lines or digital noise.

COLOR SYSTEM:
• Vibrant maximalist palette: hot pink, electric cyan, bright yellow, neon green, vivid purple.
• High saturation and high contrast—nothing muted.
• RGB aesthetic—digital-first colors.

MOOD:
• Chaotic, energetic, internet-native, Gen-Z, meme-adjacent, fun.
• Feels like digital culture and online community—never boring.

QUALITY:
• Ultra-high resolution (8K).
• Crisp graphic elements and vibrant colors.
• Controlled maximalist composition.`,
  },

  {
    slug: 'optimistic_human_future',
    name: 'Optimistic Human Future',
    description: 'Warm human-tech harmony—soft pastels, people-first, hopeful future vision.',
    industryTags: ['fintech_saas_tech', 'professional_services', 'general_other'],
    gradient: ['#ffe0b2', '#80deea'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/optimistic-human-future.jpg',
    styleType: 'marketing_template',
    templateCategory: 'saas',
    promptFragment: `Create an optimistic human future campaign visual with warm human-tech harmony and hopeful vision.

STYLE:
• Optimistic futurism aesthetic—human-centered, warm, soft pastels, hopeful future.

LAYOUT:
• Balanced human and tech composition.
• Subject positioned naturally with tech elements integrated softly.

COMPOSITION:
• Human subject: founder, team member, or diverse individuals.
• Tech elements: soft glowing interfaces, gentle holographic overlays, subtle data visualizations.
• Integration: tech enhances human presence without dominating.

SUBJECT:
• People interacting naturally with technology.
• Diverse representation—gender, ethnicity, age.
• Natural expressions—smiling, collaborative, engaged.

WARDROBE:
• Modern casual-professional attire in soft colors.
• Comfortable and approachable—not corporate or overly formal.

ENVIRONMENT:
• Bright airy spaces—natural light, open interiors, or outdoor settings.
• Natural elements: plants, wood, natural materials mixed with modern tech.

TYPOGRAPHY:
• Friendly rounded sans-serif or warm humanist typeface.
• Optimistic messaging—hopeful and human-centered.

LIGHTING:
• Soft natural lighting—window light or golden hour outdoor.
• Gentle highlights and warm skin tones.
• Optional soft tech glow—never harsh.

TEXTURE:
• Natural materials: fabric, wood, organic surfaces.
• Soft tech surfaces—glowing interfaces with gentle transparency.

COLOR SYSTEM:
• Base: soft pastels—peach, sky blue, lavender, mint green, warm cream.
• Accent: gentle brand colors—muted but optimistic.
• Warm and cool balance—never cold or sterile.

MOOD:
• Optimistic, human-centered, warm, hopeful, collaborative, future-positive.
• Technology serves humanity—people first.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic with warm natural rendering.
• Soft lighting and hopeful composition.`,
  },

  // ── FASHION VISUAL STYLES (10 styles) ─────────────────────────

  {
    slug: 'neo_luxury_street',
    name: 'Neo-Luxury Street',
    description: 'High-fashion streetwear meets luxury editorial—bold contrast and urban elegance.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#000000', '#ffd700'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/neo-luxury-street.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create a neo-luxury streetwear campaign visual with high-fashion editorial meets urban elegance.

STYLE:
• Luxury streetwear aesthetic—high-fashion editorial meets street culture.

LAYOUT:
• Centered or rule-of-thirds fashion portrait composition.
• Subject positioned with confident urban stance.

COMPOSITION:
• Full-body or upper-body fashion portrait.
• Urban backdrop: concrete walls, city architecture, minimalist urban setting.
• Bold contrast between luxury styling and raw urban environment.

SUBJECT:
• Fashion model in luxury streetwear styling.
• Confident pose—editorial stance with street attitude.
• Direct gaze or candid editorial expression.

WARDROBE:
• Luxury streetwear: designer hoodies, tailored outerwear, premium sneakers, statement accessories.
• Monochromatic or bold color-blocked outfits.
• Mix of high-fashion and street culture elements.

ENVIRONMENT:
• Urban settings: concrete walls, city streets, minimalist architecture.
• Industrial backdrops: warehouses, parking structures, urban landscapes.

TYPOGRAPHY:
• Bold sans-serif headlines—luxury brand style.
• Minimal text—brand name or bold statement.

LIGHTING:
• High-contrast dramatic lighting.
• Strong directional light creating sharp shadows.
• Urban natural light or dramatic studio lighting.

TEXTURE:
• Luxury fabric details visible—leather, premium cotton, designer materials.
• Urban textures: concrete, metal, weathered surfaces.

COLOR SYSTEM:
• Base: black, white, grey, concrete tones.
• Luxury accents: gold, metallics, bold brand colors (red, electric blue).

MOOD:
• Confident, luxury, urban, editorial, bold.
• High-fashion meets street culture.

QUALITY:
• Ultra-high resolution (8K).
• Editorial fashion photography quality.
• Sharp details and dramatic lighting.`,
  },

  {
    slug: 'afro_cinematic_fashion',
    name: 'Afro-Cinematic Fashion',
    description: 'Cinematic African fashion portraiture—rich fabrics, cultural pride, warm cinematic tones.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#4a2c2a', '#d4a574'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/afro-cinematic-fashion.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create an Afro-cinematic fashion campaign visual with rich fabrics and cultural pride.

STYLE:
• Cinematic African fashion aesthetic—rich fabrics, cultural pride, warm tones.

LAYOUT:
• Centered or dynamic fashion portrait composition.
• Subject positioned with regal confidence.

COMPOSITION:
• Full-body or upper-body fashion portrait.
• African-inspired backdrop or warm neutral setting.
• Shallow depth of field emphasizing subject and fabric details.

SUBJECT:
• Model of African descent in African-inspired fashion.
• Confident regal pose—cultural pride and elegance.
• Natural hair styling or traditional African hairstyles.

WARDROBE:
• African-inspired fashion: Ankara prints, kente cloth, modern African designers.
• Rich fabrics: silk, cotton, traditional textiles with bold patterns.
• Mix of traditional and contemporary African fashion.
• Gold jewelry and cultural accessories.

ENVIRONMENT:
• Warm neutral backdrop or African-inspired architectural setting.
• Natural materials: warm earth tones, wooden elements, textured fabrics.

TYPOGRAPHY:
• Elegant serif or bold display typeface.
• Minimal text—brand name or cultural statement.

LIGHTING:
• Warm cinematic lighting—golden hour aesthetic.
• Soft directional light creating gentle shadows.
• Warm skin tones and rich fabric colors enhanced.

TEXTURE:
• Visible fabric patterns and textile details.
• Rich material textures—silk sheen, cotton weave.

COLOR SYSTEM:
• Base: warm browns, rich golds, deep oranges, burgundy.
• Pattern colors: bright yellows, reds, greens, blues (African palette).
• Warm cinematic grading.

MOOD:
• Regal, confident, culturally proud, cinematic, elegant.
• Celebrates African fashion and heritage.

QUALITY:
• Ultra-high resolution (8K).
• Cinematic fashion photography quality.
• Rich colors and fabric details.`,
  },

  {
    slug: 'hyper_minimal_fashion',
    name: 'Hyper-Minimal Fashion',
    description: 'Ultra-minimal fashion sculpture—monochrome neutrals and architectural simplicity.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#f5f5f5', '#a0a0a0'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/hyper-minimal-fashion.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create a hyper-minimal fashion campaign visual with monochrome neutrals and architectural simplicity.

STYLE:
• Hyper-minimalist fashion aesthetic—monochrome, architectural, sculptural simplicity.

LAYOUT:
• Centered or asymmetric minimal composition.
• Generous negative space surrounding subject.

COMPOSITION:
• Fashion portrait with architectural precision.
• Pure white or neutral backdrop—absolutely minimal.
• Subject positioned with geometric precision.

SUBJECT:
• Model in minimal fashion styling.
• Sculptural pose—architectural body language.
• Neutral expression—no emotion, pure form.

WARDROBE:
• Minimal monochrome fashion: all-white, all-black, or neutral tones.
• Architectural silhouettes: clean lines, structured tailoring, minimal details.
• Premium fabrics: linen, cotton, wool—visible quality.

ENVIRONMENT:
• Pure white studio or minimal architectural setting.
• No visible props or distractions—subject and negative space only.

TYPOGRAPHY:
• Minimal sans-serif typeface—small and restrained.
• Single word or short phrase—positioned with mathematical precision.

LIGHTING:
• Soft even lighting—no harsh shadows.
• Gentle directional light creating subtle dimension.
• High-key lighting preferred.

TEXTURE:
• Visible premium fabric textures—linen weave, wool texture.
• Subtle material details creating tactile interest.

COLOR SYSTEM:
• Monochrome: pure white, soft cream, light grey, black.
• No color—only neutrals and natural tones.

MOOD:
• Minimal, architectural, sculptural, refined, quiet luxury.
• Fashion as art and form.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic with minimal aesthetic.
• Perfect lighting and composition.`,
  },

  {
    slug: 'raw_youth_culture',
    name: 'Raw Youth Culture',
    description: 'Unpolished youth energy—grainy film texture and candid street moments.',
    industryTags: ['fashion_ecommerce', 'events_entertainment', 'general_other'],
    gradient: ['#2d2d2d', '#ff4500'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/raw-youth-culture.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create a raw youth culture campaign visual with unpolished energy and candid street moments.

STYLE:
• Raw youth culture aesthetic—grainy film texture, candid street photography, unpolished energy.

LAYOUT:
• Natural candid composition—rule of thirds or centered spontaneity.
• Subject captured in authentic moment.

COMPOSITION:
• Candid street photography style.
• Urban environment: city streets, skateparks, youth hangout spots.
• Natural framing using environment.

SUBJECT:
• Young model or group in authentic youth culture moment.
• Candid poses—moving, laughing, skating, hanging out.
• Real energy—not overly posed.

WARDROBE:
• Youth streetwear: hoodies, baggy jeans, sneakers, caps, vintage tees.
• Authentic youth fashion—not styled for perfection.
• Layered casual styling.

ENVIRONMENT:
• Urban youth settings: skate spots, street corners, city backdrops, graffiti walls.
• Real locations—not studio sets.

TYPOGRAPHY:
• Bold grungy or hand-drawn typeface.
• Minimal text—youth slang or brand tag.

LIGHTING:
• Natural street lighting—no studio setup.
• Available light: daytime urban light or streetlights.
• Harsh shadows and real lighting imperfections.

TEXTURE:
• Heavy film grain or digital noise.
• Gritty texture overlay for raw aesthetic.
• Fabric textures and urban surface details.

COLOR SYSTEM:
• Desaturated with lifted shadows—film-like grading.
• Urban colors: greys, blacks, faded denim blues, rust reds.
• Optional color pop on key fashion item.

MOOD:
• Raw, authentic, youthful, energetic, unpolished, street culture.
• Real moments—not manufactured perfection.

QUALITY:
• High resolution with intentional grain and grit.
• Candid photography aesthetic.
• Authentic street energy.`,
  },

  {
    slug: 'dreamlike_fashion_surrealism',
    name: 'Dreamlike Fashion Surrealism',
    description: 'Surreal fashion fantasy—soft focus dreamscapes and ethereal floating elements.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#e0b3ff', '#ffd6f5'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/dreamlike-fashion-surrealism.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create a dreamlike fashion surrealism campaign visual with soft focus dreamscapes and ethereal elements.

STYLE:
• Surreal fashion aesthetic—dreamlike, soft focus, ethereal, fantasy elements.

LAYOUT:
• Centered or floating composition in dreamlike space.
• Subject suspended in surreal environment.

COMPOSITION:
• Surreal setting: floating fabrics, suspended elements, dreamlike backdrops.
• Soft focus surrounding subject with sharp center focus.
• Ethereal layering creating dreamlike depth.

SUBJECT:
• Model in flowing ethereal fashion.
• Floating or suspended pose—defying gravity.
• Serene or distant expression—dreamlike presence.

WARDROBE:
• Flowing ethereal fabrics: silk, chiffon, organza, tulle.
• Soft colors: pastels, whites, pale pinks, lavender, soft blues.
• Romantic silhouettes with movement.

ENVIRONMENT:
• Dreamlike surreal setting: soft clouds, abstract gradients, floating elements.
• Optional natural elements: flowers, water, light particles.

TYPOGRAPHY:
• Elegant flowing typeface—script or soft serif.
• Minimal text—poetic or dreamlike messaging.

LIGHTING:
• Soft diffused lighting—no harsh shadows.
• Gentle glow creating ethereal atmosphere.
• Backlit or softly lit from above.

TEXTURE:
• Soft fabric movement and flow.
• Ethereal transparency and layering.
• Subtle light particles or soft glow.

COLOR SYSTEM:
• Base: soft pastels—pale pink, lavender, mint, peach, ivory.
• Dreamy gradients—soft transitions.
• Warm or cool ethereal tones.

MOOD:
• Dreamlike, ethereal, surreal, romantic, fantasy, soft.
• Fashion as art and dream.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic with surreal composition.
• Soft focus and ethereal rendering.`,
  },

  {
    slug: 'coastal_luxury_escape',
    name: 'Coastal Luxury Escape',
    description: 'Beach resort luxury—linen fashion and golden hour coastal elegance.',
    industryTags: ['fashion_ecommerce', 'travel_hospitality', 'beauty_wellness', 'general_other'],
    gradient: ['#f5e6d3', '#4a90a4'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/coastal-luxury-escape.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create a coastal luxury escape campaign visual with beach resort elegance and linen fashion.

STYLE:
• Coastal luxury aesthetic—beach resort elegance, linen fashion, golden hour warmth.

LAYOUT:
• Rule-of-thirds beach composition.
• Subject positioned with coastal backdrop.

COMPOSITION:
• Beach or coastal setting: ocean, sand, resort architecture.
• Golden hour lighting creating warm coastal atmosphere.
• Natural elements: palm trees, ocean waves, coastal landscape.

SUBJECT:
• Model in luxury resort fashion.
• Relaxed elegant pose—beach resort confidence.
• Natural wind-swept hair and relaxed styling.

WARDROBE:
• Coastal luxury fashion: linen clothing, flowing dresses, resort wear, straw hats.
• Neutral tones: whites, beiges, soft blues, natural linen colors.
• Lightweight premium fabrics.

ENVIRONMENT:
• Beach resort settings: sandy beaches, coastal villas, poolside luxury.
• Natural coastal elements: ocean, palm trees, resort architecture.

TYPOGRAPHY:
• Elegant serif or refined sans-serif.
• Minimal text—resort lifestyle messaging.

LIGHTING:
• Golden hour coastal lighting—warm and soft.
• Natural sunlight creating gentle shadows.
• Warm skin tones and coastal glow.

TEXTURE:
• Linen fabric texture visible.
• Sand, water, and natural coastal textures.

COLOR SYSTEM:
• Base: warm neutrals—ivory, sand beige, soft whites.
• Coastal accents: ocean blues, aqua, soft turquoise.
• Golden hour warmth throughout.

MOOD:
• Luxury resort, coastal elegance, relaxed sophistication, escape, warmth.
• High-end vacation lifestyle.

QUALITY:
• Ultra-high resolution (8K).
• Natural coastal lighting and atmosphere.
• Luxury resort fashion photography quality.`,
  },

  {
    slug: 'performance_futurism',
    name: 'Performance Futurism',
    description: 'Technical sportswear meets sci-fi—bold geometric designs and athletic innovation.',
    industryTags: ['fashion_ecommerce', 'fitness_gym', 'sports_fitness', 'general_other'],
    gradient: ['#0a0a1a', '#00ff88'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/performance-futurism.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create a performance futurism campaign visual with technical sportswear and sci-fi aesthetics.

STYLE:
• Performance futurism aesthetic—technical sportswear meets sci-fi innovation.

LAYOUT:
• Dynamic athletic composition with futuristic elements.
• Subject positioned in action-ready or athletic pose.

COMPOSITION:
• Athletic subject in performance wear.
• Futuristic backdrop: geometric shapes, tech elements, neon accents.
• Dynamic lines or motion elements suggesting performance.

SUBJECT:
• Athletic model in technical performance wear.
• Athletic pose—ready for action or mid-movement.
• Strong confident expression.

WARDROBE:
• Technical sportswear: athletic fits, performance fabrics, futuristic athleisure.
• Bold geometric patterns or color-blocking.
• Modern athletic silhouettes with tech details.

ENVIRONMENT:
• Futuristic athletic setting: tech gym, geometric backdrop, or abstract sci-fi environment.
• Optional: holographic elements or tech overlays.

TYPOGRAPHY:
• Bold tech-inspired typeface—angular and modern.
• Performance-focused messaging—innovation and capability.

LIGHTING:
• High-contrast dramatic lighting.
• Neon accent lights in brand colors.
• Strong shadows creating athletic drama.

TEXTURE:
• Technical fabric details visible—moisture-wicking, mesh, compression.
• Futuristic surface textures—metallic, matte tech finishes.

COLOR SYSTEM:
• Base: blacks, greys, tech whites.
• Neon accents: electric green, cyan blue, bright orange, vivid magenta.
• High-tech color palette.

MOOD:
• Athletic, futuristic, innovative, powerful, tech-forward.
• Performance meets future innovation.

QUALITY:
• Ultra-high resolution (8K).
• Sharp athletic details and futuristic elements.
• Dynamic composition and lighting.`,
  },

  {
    slug: 'vintage_luxury_revival',
    name: 'Vintage Luxury Revival',
    description: 'Old-world fashion elegance—vintage textures and timeless luxury aesthetics.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'perfume_fragrance', 'general_other'],
    gradient: ['#5d4037', '#d7ccc8'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/vintage-luxury-revival.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create a vintage luxury revival campaign visual with old-world elegance and timeless aesthetics.

STYLE:
• Vintage luxury aesthetic—old-world fashion elegance, timeless luxury, heritage styling.

LAYOUT:
• Classic fashion portrait composition.
• Subject positioned with timeless elegance.

COMPOSITION:
• Heritage fashion portrait.
• Vintage-inspired backdrop: classic interiors, antique furnishings, timeless settings.
• Film photography aesthetic with vintage color grading.

SUBJECT:
• Model in vintage-inspired luxury fashion.
• Classic elegant pose—timeless fashion portraiture.
• Refined expression and styling.

WARDROBE:
• Vintage-inspired luxury fashion: tailored suits, classic silhouettes, heritage brands.
• Rich fabrics: velvet, silk, wool, leather.
• Timeless colors: burgundy, forest green, navy, camel, black.

ENVIRONMENT:
• Classic vintage settings: heritage interiors, antique furniture, luxury estates.
• Old-world architecture and timeless backdrops.

TYPOGRAPHY:
• Classic serif typeface—timeless elegance.
• Minimal text—heritage brand style.

LIGHTING:
• Soft vintage-style lighting.
• Warm film-like color temperature.
• Gentle shadows creating dimension.

TEXTURE:
• Vintage film grain texture.
• Rich fabric textures—velvet sheen, leather patina, silk drape.
• Aged patina on surroundings.

COLOR SYSTEM:
• Base: warm vintage tones—sepia, warm browns, muted golds.
• Luxury colors: burgundy, forest green, navy, rich blacks.
• Vintage film color grading—warm with lifted shadows.

MOOD:
• Timeless, elegant, heritage luxury, vintage sophistication, old-world charm.
• Classic fashion with modern quality.

QUALITY:
• Ultra-high resolution (8K).
• Vintage film aesthetic with modern clarity.
• Rich colors and timeless composition.`,
  },

  {
    slug: 'hyper_commercial_fashion',
    name: 'Hyper-Commercial Fashion',
    description: 'High-energy fast-fashion campaign—bold colors and youthful commercial energy.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'general_other'],
    gradient: ['#ff0050', '#ffcc00'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/hyper-commercial-fashion.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create a hyper-commercial fashion campaign visual with high-energy and bold colors.

STYLE:
• Hyper-commercial fashion aesthetic—high-energy, bold colors, youthful commercial energy.

LAYOUT:
• Dynamic energetic composition.
• Subject positioned with commercial confidence.

COMPOSITION:
• Fashion portrait with commercial energy.
• Bold colorful backdrop—vibrant solids or gradients.
• Multiple looks or dynamic poses for commercial versatility.

SUBJECT:
• Model in trendy commercial fashion.
• Energetic pose—jumping, laughing, dynamic movement.
• Confident youthful expression.

WARDROBE:
• On-trend fast fashion: bold colors, trendy silhouettes, accessible styles.
• Color-blocked outfits or coordinated bold looks.
• Youthful commercial styling.

ENVIRONMENT:
• Studio with bold colorful backdrops.
• Solid color walls or gradient backgrounds.
• Clean commercial setting.

TYPOGRAPHY:
• Bold sans-serif headlines—commercial impact.
• Sale messaging or bold brand statements.

LIGHTING:
• Bright flat commercial lighting.
• High-key lighting—minimal shadows.
• Even illumination for commercial clarity.

TEXTURE:
• Fashion fabric details clearly visible.
• Clean commercial rendering—no heavy grading.

COLOR SYSTEM:
• Bold vibrant colors: hot pink, electric blue, sunny yellow, bright red, vivid orange.
• High saturation—commercial impact.
• Color-coordinated outfits and backdrops.

MOOD:
• Energetic, youthful, commercial, accessible, bold, fun.
• Fast fashion energy—trendy and immediate.

QUALITY:
• Ultra-high resolution (8K).
• Commercial photography quality.
• Bold colors and energetic composition.`,
  },

  {
    slug: 'romantic_noir_fashion',
    name: 'Romantic Noir Fashion',
    description: 'Dark romantic elegance—moody low-key lighting and dramatic fashion storytelling.',
    industryTags: ['fashion_ecommerce', 'beauty_wellness', 'perfume_fragrance', 'general_other'],
    gradient: ['#1a1a1a', '#8b4789'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/romantic-noir-fashion.jpg',
    styleType: 'marketing_template',
    templateCategory: 'fashion',
    promptFragment: `Create a romantic noir fashion campaign visual with dark elegance and dramatic storytelling.

STYLE:
• Romantic noir aesthetic—dark elegance, moody low-key lighting, dramatic fashion.

LAYOUT:
• Centered or rule-of-thirds dramatic composition.
• Subject positioned in moody cinematic setting.

COMPOSITION:
• Low-key dramatic fashion portrait.
• Dark moody backdrop with selective lighting.
• Shallow depth of field creating cinematic focus.

SUBJECT:
• Model in elegant dark fashion.
• Dramatic pose—mysterious and romantic.
• Intense or distant expression—storytelling through emotion.

WARDROBE:
• Dark romantic fashion: flowing blacks, deep burgundy, midnight blue, dark florals.
• Luxe fabrics: silk, velvet, lace, leather.
• Romantic silhouettes with dramatic details.

ENVIRONMENT:
• Moody interior settings: candlelit rooms, dark architectural spaces, dramatic backdrops.
• Minimal visible environment—darkness with selective reveals.

TYPOGRAPHY:
• Elegant serif or script typeface.
• Minimal text—poetic or mysterious messaging.

LIGHTING:
• Low-key dramatic lighting—mostly shadows with selective highlights.
• Single light source creating strong contrast.
• Candlelight or dramatic side lighting aesthetic.

TEXTURE:
• Rich fabric textures visible in highlights—velvet depth, silk sheen, lace details.
• Dramatic shadow textures creating depth.

COLOR SYSTEM:
• Base: deep blacks, charcoal, midnight tones.
• Romantic accents: deep burgundy, dark purple, forest green, gold highlights.
• Low-key moody color grading.

MOOD:
• Mysterious, romantic, dramatic, elegant, noir, cinematic.
• Dark luxury and emotional storytelling.

QUALITY:
• Ultra-high resolution (8K).
• Cinematic low-key lighting and atmosphere.
• Dramatic fashion photography quality.`,
  },

  // ── PRODUCT VISUAL STYLES (5 styles) ──────────────────────────

  {
    slug: 'elemental_explosion_realism',
    name: 'Elemental Explosion Realism',
    description: 'Hyper-realistic product explosions with fruits, liquids, or ingredients mid-air.',
    industryTags: ['food_beverage', 'beauty_wellness', 'general_other'],
    gradient: ['#ff6b35', '#ffd60a'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/elemental-explosion-realism.jpg',
    styleType: 'marketing_template',
    templateCategory: 'product',
    promptFragment: `Create a hyper-realistic product explosion visual with ingredients mid-air.

STYLE:
• Hyper-realistic explosion photography—ingredients frozen mid-air with dynamic energy.

LAYOUT:
• Centered product with explosive elements surrounding it.
• Radial composition emanating from product center.

COMPOSITION:
• Product hero positioned center.
• Ingredients exploding outward—fruits, liquids, powders, elements.
• Dynamic frozen-motion capture—ingredients suspended in air.
• Liquid splashes, fruit slices, powder clouds captured mid-explosion.

SUBJECT:
• Product bottle, package, or container as hero center.
• Ingredients or elements that represent product contents exploding around it.
• High-speed photography capturing moment of impact.

TYPOGRAPHY:
• Bold product name or tagline—positioned clear of explosion elements.
• Optional ingredient callouts or benefit text.

LIGHTING:
• High-speed studio lighting freezing motion.
• Dramatic lighting emphasizing flying elements and liquid splashes.
• Backlit or side-lit for dimensional depth.

TEXTURE:
• Hyper-realistic texture details—water droplets, fruit flesh, powder particles.
• Product packaging details clearly rendered.
• Material transparency and reflections.

COLOR SYSTEM:
• Base: clean white or gradient backdrop.
• Vibrant ingredient colors—natural fruit colors, liquid hues, powder tones.
• Product brand colors prominently featured.

MOOD:
• Dynamic, explosive, fresh, energetic, ingredient-focused.
• Captures freshness and natural ingredients.

QUALITY:
• Ultra-high resolution (8K).
• High-speed photography realism.
• Photorealistic ingredients and liquid physics.`,
  },

  {
    slug: 'monumental_product_worship',
    name: 'Monumental Product Worship',
    description: 'Product as monument—low-angle hero worship with dramatic scale and grandeur.',
    industryTags: ['food_beverage', 'beauty_wellness', 'fashion_ecommerce', 'general_other'],
    gradient: ['#1a1a2e', '#6a5acd'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/monumental-product-worship.jpg',
    styleType: 'marketing_template',
    templateCategory: 'product',
    promptFragment: `Create a monumental product worship visual with low-angle hero worship and dramatic scale.

STYLE:
• Monumental product photography—low-angle dramatic perspective making product feel massive and heroic.

LAYOUT:
• Low-angle looking-up composition.
• Product positioned as towering monument.

COMPOSITION:
• Product shot from low angle creating monumental scale.
• Dramatic perspective making product appear larger-than-life.
• Sky or gradient backdrop creating epic scale.
• Optional: clouds, light rays, or atmospheric elements adding grandeur.

SUBJECT:
• Product bottle, package, or item positioned as heroic monument.
• Dramatic low-angle perspective emphasizing scale and importance.

TYPOGRAPHY:
• Bold epic typeface—monumental brand statement.
• Text positioned to emphasize scale and importance.

LIGHTING:
• Dramatic cinematic lighting—backlit or side-lit.
• God rays or light beams adding epic atmosphere.
• Strong contrast creating heroic drama.

TEXTURE:
• Product material details highly visible—glass reflections, metallic finishes, label details.
• Atmospheric texture—clouds, light rays, environmental atmosphere.

COLOR SYSTEM:
• Base: dramatic skies—sunset gradients, storm clouds, epic backdrops.
• Product colors stand bold against dramatic background.
• Cinematic color grading—epic and dramatic.

MOOD:
• Monumental, heroic, epic, powerful, worship-worthy, dramatic.
• Product as hero and centerpiece.

QUALITY:
• Ultra-high resolution (8K).
• Cinematic product photography.
• Dramatic perspective and lighting.`,
  },

  {
    slug: 'ingredient_world_immersion',
    name: 'Ingredient World Immersion',
    description: 'Product immersed in its ingredient world—surrounded by natural source materials.',
    industryTags: ['food_beverage', 'beauty_wellness', 'general_other'],
    gradient: ['#2d5016', '#a8c256'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/ingredient-world-immersion.jpg',
    styleType: 'marketing_template',
    templateCategory: 'product',
    promptFragment: `Create an ingredient world immersion visual with product surrounded by natural source materials.

STYLE:
• Ingredient immersion aesthetic—product literally immersed in or surrounded by its natural ingredients.

LAYOUT:
• Centered product with ingredient environment surrounding it.
• Product hero within ingredient ecosystem.

COMPOSITION:
• Product positioned within dense ingredient environment.
• Ingredients arranged naturally around and behind product.
• Depth layering—foreground ingredients, product hero, background ingredients.
• Natural organic arrangement—not overly staged.

SUBJECT:
• Product bottle, package, or container.
• Natural ingredients that source the product—fruits, vegetables, herbs, botanicals, grains.
• Ingredients arranged creating immersive natural world.

TYPOGRAPHY:
• Natural organic typeface—handwritten or botanical style.
• Minimal text—ingredient focus or benefit callout.

LIGHTING:
• Natural soft lighting—window light or diffused studio light.
• Gentle shadows creating depth without harshness.
• Ingredients beautifully lit showing natural textures.

TEXTURE:
• Visible natural ingredient textures—fruit skin, leaf veins, grain details.
• Product packaging materials clearly rendered.
• Organic surface textures.

COLOR SYSTEM:
• Natural ingredient colors—greens, earth tones, natural fruit colors.
• Product brand colors integrated naturally.
• Organic color palette—never artificial.

MOOD:
• Natural, organic, ingredient-focused, fresh, wholesome, immersive.
• Transparency and natural sourcing.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic ingredient details.
• Natural lighting and organic composition.`,
  },

  {
    slug: 'atmospheric_luxury_suspension',
    name: 'Atmospheric Luxury Suspension',
    description: 'Product floating in atmospheric dreamscape—luxury beauty photography with ethereal atmosphere.',
    industryTags: ['beauty_wellness', 'perfume_fragrance', 'fashion_ecommerce', 'general_other'],
    gradient: ['#e8d5c4', '#c19a6b'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/atmospheric-luxury-suspension.jpg',
    styleType: 'marketing_template',
    templateCategory: 'product',
    promptFragment: `Create an atmospheric luxury suspension visual with product floating in ethereal dreamscape.

STYLE:
• Luxury beauty suspension aesthetic—product floating in atmospheric dreamscape with ethereal elegance.

LAYOUT:
• Centered floating product composition.
• Product suspended in ethereal space.

COMPOSITION:
• Product floating or suspended mid-air.
• Atmospheric elements—soft clouds, gentle mist, light particles, ethereal glow.
• Dreamy gradient backdrop creating luxury atmosphere.
• Optional: delicate floating elements (petals, light particles, subtle geometric shapes).

SUBJECT:
• Luxury product—perfume bottle, beauty product, premium packaging.
• Product floating gracefully with elegant suspension.

TYPOGRAPHY:
• Elegant serif or refined script typeface.
• Minimal text—luxury brand name or elegant tagline.

LIGHTING:
• Soft diffused luxury lighting.
• Gentle highlights on product creating premium glow.
• Atmospheric backlighting creating ethereal depth.

TEXTURE:
• Premium product materials—glass reflections, metallic accents, luxury packaging.
• Soft atmospheric textures—mist, light particles, gentle gradients.

COLOR SYSTEM:
• Base: soft luxury tones—champagne, rose gold, soft pink, ivory, pale blue.
• Dreamy gradients—smooth transitions creating atmospheric depth.
• Metallic accents—gold, rose gold, silver.

MOOD:
• Luxurious, ethereal, dreamy, elegant, atmospheric, premium.
• Beauty as art and luxury.

QUALITY:
• Ultra-high resolution (8K).
• Photorealistic with dreamlike atmosphere.
• Luxury product photography quality.`,
  },

  {
    slug: 'cinematic_narrative_product_scene',
    name: 'Cinematic Narrative Product Scene',
    description: 'Product placed in cinematic lifestyle scene—storytelling through environment and context.',
    industryTags: ['food_beverage', 'beauty_wellness', 'fashion_ecommerce', 'general_other'],
    gradient: ['#3e2723', '#8d6e63'],
    image:
      'https://res.cloudinary.com/df8ckaeam/image/upload/uri-social/visual-style-guides-2026/cinematic-narrative-product-scene.jpg',
    styleType: 'marketing_template',
    templateCategory: 'product',
    promptFragment: `Create a cinematic narrative product scene with storytelling through environment and context.

STYLE:
• Cinematic product storytelling—product placed in lifestyle scene with narrative depth.

LAYOUT:
• Rule-of-thirds cinematic composition.
• Product integrated naturally into lifestyle scene.

COMPOSITION:
• Product placed in realistic lifestyle environment.
• Scene tells story of product usage or lifestyle context.
• Shallow depth of field—product in focus, environment softly blurred.
• Natural props and environmental elements creating narrative.

SUBJECT:
• Product naturally integrated into lifestyle scene.
• Scene context: morning routine, dining experience, beauty ritual, work environment.
• Optional: hands interacting with product or environmental storytelling.

ENVIRONMENT:
• Lifestyle settings: kitchen table, bathroom counter, workspace, outdoor picnic, café.
• Natural materials and real-world context.
• Authentic lived-in spaces—not overly staged.

TYPOGRAPHY:
• Minimal cinematic typeface—small and tasteful.
• Optional caption or narrative text.

LIGHTING:
• Natural cinematic lighting—window light, golden hour, ambient indoor light.
• Soft shadows creating depth and realism.
• Film-like color grading.

TEXTURE:
• Natural material textures—wood grain, fabric, stone, ceramic.
• Product details clearly visible.
• Environmental texture creating realism.

COLOR SYSTEM:
• Natural lifestyle colors—warm wood tones, neutral fabrics, natural materials.
• Product brand colors integrated naturally.
• Cinematic color grading—slightly desaturated with warm or cool tones.

MOOD:
• Cinematic, narrative, lifestyle, authentic, relatable, storytelling.
• Product in real life context.

QUALITY:
• Ultra-high resolution (8K).
• Cinematic lifestyle photography.
• Photorealistic with narrative depth.`,
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
    'prod_hero_pedestal',
    'prod_curated_flatlay',
    'prod_unboxing_reveal',
    'prod_lifestyle_inuse',
    'prod_colour_swatch',
    'prod_360_angles',
    'prod_seasonal_collection',
    'prod_comparison_duo',
    'prod_customer_photo_frame',
    'prod_price_tag',
    // Art-Piece Poster Styles (9:16)
    'art_luxury_showroom',
    'art_neon_underground',
    'art_golden_throne',
    'art_fire_smoke',
    'art_workshop_craft',
    'art_velvet_stage',
    'art_sunset_canvas',
    'art_street_market',
    // Fashion Visual Style Guides 2026 (10 styles)
    'neo_luxury_street',
    'afro_cinematic_fashion',
    'hyper_minimal_fashion',
    'raw_youth_culture',
    'dreamlike_fashion_surrealism',
    'coastal_luxury_escape',
    'performance_futurism',
    'vintage_luxury_revival',
    'hyper_commercial_fashion',
    'romantic_noir_fashion',
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
    'prod_curated_flatlay',
    'prod_ingredient_exploded',
    'prod_lifestyle_inuse',
    'prod_scale_context',
    'prod_process_bts',
    'prod_seasonal_collection',
    'prod_bundle_stack',
    'prod_price_tag',
    // Art-Piece Poster Styles (9:16)
    'art_nature_immersion',
    'art_ingredient_explosion',
    'art_frozen_impact',
    'art_fire_smoke',
    'art_ocean_surface',
    'art_workshop_craft',
    'art_street_market',
    // Product Visual Style Guides 2026 (5 styles)
    'elemental_explosion_realism',
    'monumental_product_worship',
    'ingredient_world_immersion',
    'atmospheric_luxury_suspension',
    'cinematic_narrative_product_scene',
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
    'saas_dashboard_hero',
    'saas_metric_spotlight',
    'saas_comparison_grid',
    'saas_blog_header',
    'saas_feature_card',
    'saas_abstract_gradient',
    'saas_code_snippet',
    'saas_testimonial_card',
    'saas_changelog_card',
    'saas_infographic_flow',
    'saas_dark_announcement',
    'saas_social_proof_wall',
    // Art-Piece Poster Styles (9:16)
    'art_neon_underground',
    'art_tech_orbit',
    // Startup/SaaS Visual Style Guides 2026 (13 styles)
    'strategic_collage_editorial',
    'premium_utility_minimalism',
    'neo_brutalist_startup',
    'cinematic_startup_realism',
    'futuristic_enterprise_glow',
    'quiet_luxury_saas',
    'kinetic_startup_energy',
    'afro_futurist_enterprise',
    'founder_documentary',
    'intelligent_interface_surrealism',
    'tactical_workspace_realism',
    'internet_culture_maximalism',
    'optimistic_human_future',
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
    'prod_hero_pedestal',
    'prod_curated_flatlay',
    'prod_ingredient_exploded',
    'prod_lifestyle_inuse',
    'prod_process_bts',
    'prod_comparison_duo',
    'prod_bundle_stack',
    'prod_customer_photo_frame',
    'svc_tip_carousel',
    'svc_before_after_text',
    'svc_checklist_graphic',
    // Art-Piece Poster Styles (9:16)
    'art_nature_immersion',
    'art_ingredient_explosion',
    'art_frozen_impact',
    'art_botanical_garden',
    'art_crystal_cave',
    'art_ocean_surface',
    // Product Visual Style Guides 2026 (5 styles)
    'elemental_explosion_realism',
    'monumental_product_worship',
    'ingredient_world_immersion',
    'atmospheric_luxury_suspension',
    'cinematic_narrative_product_scene',
  ],
  real_estate: [
    'property_showcase',
    'luxury_listing',
    'neighbourhood_life',
    'blueprint_modern',
    'aerial_clean',
    'trust_builder',
    'bold_statement',
    'svc_headshot_branded',
    'svc_case_study_result',
    'svc_stat_grid',
    // Art-Piece Poster Styles (9:16)
    'art_luxury_showroom',
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
    'svc_tip_carousel',
    'svc_case_study_result',
    'svc_stat_grid',
    'svc_before_after_text',
    'svc_checklist_graphic',
    'svc_question_hook',
    // Art-Piece Poster Styles (9:16)
    'art_frozen_impact',
    'art_fire_smoke',
  ],
  education_consulting: [
    'trust_builder',
    'clean_startup',
    'bold_statement',
    'data_visual',
    'warm_professional',
    'minimal_tech',
    'authority_editorial',
    'svc_authority_quote',
    'svc_tip_carousel',
    'svc_case_study_result',
    'svc_framework_diagram',
    'svc_headshot_branded',
    'svc_stat_grid',
    'svc_event_speaker',
    'svc_newsletter_teaser',
    'svc_checklist_graphic',
    'svc_before_after_text',
    'svc_question_hook',
    'svc_client_logo_showcase',
    'svc_hiring_card',
  ],
  events_entertainment: [
    'neon_pop',
    'bold_loud',
    'high_contrast_drama',
    'afro_glam',
    'vibrant_tropical',
    'street_food_energy',
    'festival_energy',
    'svc_event_speaker',
    'svc_headshot_branded',
    'svc_client_logo_showcase',
    'svc_hiring_card',
    // Art-Piece Poster Styles (9:16)
    'art_neon_underground',
    'art_velvet_stage',
    'art_sunset_canvas',
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
    'saas_dashboard_hero',
    'saas_feature_card',
    'prod_hero_pedestal',
    'prod_curated_flatlay',
    'prod_lifestyle_inuse',
    'prod_price_tag',
    'svc_authority_quote',
    'svc_tip_carousel',
    'svc_case_study_result',
    'svc_checklist_graphic',
    // Art-Piece Poster Styles (9:16)
    'art_luxury_showroom',
    'art_neon_underground',
    'art_golden_throne',
    'art_fire_smoke',
    'art_crystal_cave',
    'art_workshop_craft',
    'art_velvet_stage',
    'art_tech_orbit',
    'art_sunset_canvas',
    'art_street_market',
    // Visual Style Guides 2026 (Representative selection)
    'strategic_collage_editorial',
    'premium_utility_minimalism',
    'cinematic_startup_realism',
    'neo_luxury_street',
    'afro_cinematic_fashion',
    'hyper_minimal_fashion',
    'elemental_explosion_realism',
    'monumental_product_worship',
    'atmospheric_luxury_suspension',
  ],
  perfume_fragrance: [
    'perf_editorial_ingredient',
    'perf_noir_luxe',
    'perf_golden_hour_romance',
    'perf_wet_glass_drama',
    'perf_smoke_amber',
    'perf_botanical_garden',
    'perf_street_luxe',
    'perf_crystal_minimal',
    'perf_velvet_night',
    'perf_citrus_burst',
    'perf_heritage_editorial',
    'perf_floating_surreal',
    // Art-Piece Poster Styles (9:16)
    'art_nature_immersion',
    'art_golden_throne',
    'art_botanical_garden',
    'art_crystal_cave',
    'art_ocean_surface',
    'art_velvet_stage',
  ],
  home_garden: [
    'lifestyle_natural',
    'rustic_warmth',
    'bright_fresh',
    'clean_luxe',
    // Art-Piece Poster Styles (9:16)
    'art_luxury_showroom',
    'art_nature_immersion',
    'art_botanical_garden',
    'art_workshop_craft',
    'art_street_market',
  ],
  health_fitness: [
    'clean_athletic',
    'bright_fresh',
    'natural_organic',
    'lifestyle_natural',
    // Art-Piece Poster Styles (9:16)
    'art_nature_immersion',
    'art_ingredient_explosion',
    'art_frozen_impact',
    'art_botanical_garden',
    'art_ocean_surface',
  ],
  jewellery_watches: [
    'clean_luxe',
    'minimal_studio',
    'high_contrast_drama',
    // Art-Piece Poster Styles (9:16)
    'art_golden_throne',
    'art_crystal_cave',
  ],
  travel_hospitality: [
    'lifestyle_natural',
    'bright_fresh',
    'vibrant_tropical',
    // Art-Piece Poster Styles (9:16)
    'art_sunset_canvas',
  ],
  electronics_gadgets: [
    'minimal_tech',
    'dark_mode_pro',
    'clean_startup',
    // Art-Piece Poster Styles (9:16)
    'art_tech_orbit',
  ],
  sports_fitness: [
    'energy_motion',
    'dark_grit',
    'bold_loud',
    'clean_athletic',
    // Art-Piece Poster Styles (9:16)
    'art_frozen_impact',
    'art_fire_smoke',
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
  perfume: 'perfume_fragrance',
  fragrance: 'perfume_fragrance',
  cologne: 'perfume_fragrance',
  scent: 'perfume_fragrance',
  perfumery: 'perfume_fragrance',
};

function _canonicalIndustry(industry: string): string {
  const key = industry.toLowerCase().trim();
  // Exact match against canonical keys
  if (INDUSTRY_STYLE_MAP[key]) return key;
  // Exact match against aliases
  if (INDUSTRY_ALIASES[key]) return INDUSTRY_ALIASES[key];
  // Partial keyword match - handles compound values like "Tech & SaaS", "Food & Beverage"
  for (const [alias, canonical] of Object.entries(INDUSTRY_ALIASES)) {
    if (key.includes(alias)) return canonical;
  }
  return 'general_other';
}

export function getStylesForIndustry(industry: string): StyleTemplate[] {
  const canonical = _canonicalIndustry(industry);
  const slugs = INDUSTRY_STYLE_MAP[canonical] ?? INDUSTRY_STYLE_MAP['general_other'];
  const bySlug = Object.fromEntries(STYLES.map((s) => [s.slug, s]));
  return slugs.map((s) => bySlug[s]).filter(Boolean);
}

export function getStyle(slug: string): StyleTemplate | undefined {
  return STYLES.find((s) => s.slug === slug);
}
