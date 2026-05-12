export interface StyleTemplate {
  slug: string;
  name: string;
  description: string;
  industryTags: string[];
  gradient: [string, string];
  image: string;
  promptFragment: string;
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
    image: U('1526045612212-70caf35c14df'),
    promptFragment:
      'Soft glowing beauty photography. Close-up portrait with warm golden-hour backlighting creating a luminous halo effect. Skin appears naturally dewy and radiant with smooth, even texture. Soft bokeh background in warm amber or blush tones. Thin serif or script typography in gold or champagne. Aspirational but achievable beauty ideal. Beauty editorial quality without heavy retouching.',
  },
  {
    slug: 'soft_pastel',
    name: 'Soft Pastel',
    description: 'Delicate pastels, airy gradients, gentle feminine energy.',
    industryTags: ['beauty_wellness', 'general_other'],
    gradient: ['#f8d7e8', '#d4a0c0'],
    image: U('1556228852-6d35a585d566'),
    promptFragment:
      'Soft pastel colour palette: blush pink, lavender, mint, baby blue, and ivory. Gentle gradient backgrounds blending two pastel tones. Airy, light-filled composition with minimal shadows. Delicate serif or thin script typography. Floral or botanical accent elements at low opacity. Beauty brand lookbook quality. Feminine, soft, and approachable without being saccharine.',
  },
  {
    slug: 'bold_glam',
    name: 'Bold Glam',
    description: 'High-glamour beauty, full makeup, confident and striking.',
    industryTags: ['beauty_wellness', 'fashion_ecommerce'],
    gradient: ['#3d0014', '#cc0044'],
    image: U('1503951914875-452162b0f3f1'),
    promptFragment:
      'High-glamour beauty photography. Bold full-coverage makeup with saturated lip colours and dramatic eye looks. Dramatic studio lighting with strong catchlights. Rich jewel-tone or deep neutral backgrounds. Confident, direct gaze at camera. Magazine cover quality. Typography in thick serif or metallic sans-serif. Striking, powerful, unapologetically glamorous.',
  },
  {
    slug: 'clean_clinical',
    name: 'Clean Clinical',
    description: 'Medical-aesthetic trust. Ingredient-forward, science-backed.',
    industryTags: ['beauty_wellness'],
    gradient: ['#f8fafc', '#b0c4de'],
    image: U('1620916297397-a4a5402a3c6c'),
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
    image: U('1571019614242-c5c5dee9f50b'),
    promptFragment:
      "Results-focused fitness transformation layout. Split panel showing clear physical change. Same pose, same angle, different body composition. Stats prominently displayed: weight lost, weeks taken, percentage improvement. Clean divider line with 'Week 1' / 'Week 12' labels. Neutral background keeping focus on the subject. Credibility and proof are the design goal.",
  },
  {
    slug: 'motivational_type',
    name: 'Motivational Type',
    description: 'One powerful phrase. Dark background. Athletic silhouette.',
    industryTags: ['fitness_gym', 'education_consulting', 'general_other'],
    gradient: ['#1a1a1a', '#cd1b78'],
    image: U('1526506118085-60ce8714f8c5'),
    promptFragment:
      'Large motivational quote or phrase as the visual centrepiece. Dark gradient or textured background (concrete, smoke, dark gradient). Single powerful phrase in massive bold uppercase condensed sans-serif typography. Athletic silhouette or action shot used as very low opacity background texture. Minimal colour: monochrome with one strong accent. TED-talk-slide meets gym locker-room poster.',
  },
  {
    slug: 'clean_athletic',
    name: 'Clean Athletic',
    description: 'Nike/Adidas-inspired. Premium sportswear feel. Minimal.',
    industryTags: ['fitness_gym', 'fashion_ecommerce'],
    gradient: ['#f8f8f8', '#222222'],
    image: U('1542291026-7eec264c27ff'),
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
    image: U('1564013799919-ab600027ffc6'),
    promptFragment:
      'Professional real estate photography. Wide-angle interior or exterior shot with HDR-style clarity and brightness. Deep blue sky, well-manicured lawn, clean architectural lines. Interior shots show warm inviting lighting with natural light flooding through windows. Clean info bar at the bottom: bedroom count, bathrooms, price, and neighbourhood. Sans-serif typography in dark overlay bar. The property looks its absolute best.',
  },
  {
    slug: 'luxury_listing',
    name: 'Luxury Listing',
    description: 'Twilight exteriors. Gold serif type. Exclusivity.',
    industryTags: ['real_estate'],
    gradient: ['#1a1000', '#c8960c'],
    image: U('1512917774080-9991f1c4c750'),
    promptFragment:
      "Luxury property listing aesthetic. Twilight exterior photography: warm interior lights glowing against deep blue dusk sky. Gold or champagne serif typography for property name and key details. Dark overlay at bottom for text readability. Premium finishes highlighted in close-up detail shots. Exclusivity, aspiration, and discretion in every element. Sotheby's-level presentation.",
  },
  {
    slug: 'neighbourhood_life',
    name: 'Neighbourhood Life',
    description: 'Community and lifestyle. Sell the area, not just the property.',
    industryTags: ['real_estate'],
    gradient: ['#3d6b4f', '#90c8a0'],
    image: U('1598928506311-c55ded91a20c'),
    promptFragment:
      'Community lifestyle photography emphasising neighbourhood quality of life. Families walking, children playing, cafés and parks, tree-lined streets. Warm natural golden-hour lighting. Candid, authentic, unposed moments. Sans-serif caption text in clean overlay. The message is: this is where you want to live. Human connection and community belonging as the primary visual story.',
  },
  {
    slug: 'blueprint_modern',
    name: 'Blueprint Modern',
    description: 'Architectural line drawings. Technical precision. Modern.',
    industryTags: ['real_estate'],
    gradient: ['#0d2040', '#1a4080'],
    image: U('1503387762-592deb58ef4e'),
    promptFragment:
      'Architectural blueprint aesthetic. Deep navy or dark slate background with white technical line drawings. Floor plan outlines, elevation sketches, and site layouts as decorative graphic elements. Clean technical sans-serif typography with precise grid-based layout. Property dimensions or room labels incorporated as design elements. Modern, precise, and developer-grade professional presentation.',
  },
  {
    slug: 'aerial_clean',
    name: 'Aerial Clean',
    description: 'Drone-style overhead photography. Wide context. Clean info overlay.',
    industryTags: ['real_estate'],
    gradient: ['#1a6fa8', '#4ab8e0'],
    image: U('1477959858617-67f85cf4f1df'),
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
