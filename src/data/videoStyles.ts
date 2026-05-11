export interface VideoStyle {
  slug: string;
  name: string;
  vibe: string;
  pacing: string;
  camera: string;
  best_for: string;
  directive: string;
}

export const VIDEO_STYLES: VideoStyle[] = [
  {
    slug: 'clean_commercial',
    name: 'Clean Commercial',
    vibe: 'Polished & professional',
    pacing: 'Steady, measured',
    camera: 'Smooth glides, locked-off product shots',
    best_for: 'Product launches, brand awareness',
    directive: `VIDEO STYLE — CLEAN COMMERCIAL:
Apply a polished, professional brand commercial aesthetic throughout.
• Camera: smooth dolly/slider moves, locked-off product beauty shots, subtle push-ins on hero product.
• Pacing: steady 3–5 second scenes with clean cuts on beats; no jump cuts.
• Color grading: bright, high-key lighting; pure whites, neutral backgrounds; brand colors as accents only.
• Composition: product centered with generous negative space; rule-of-thirds for lifestyle shots.
• Text overlays: clean sans-serif, minimal — tagline on final scene only.
• Transitions: cut or subtle cross-dissolve only; no wipes or zoom transitions.
• Energy: confident and calm — trust-building, not hype.`,
  },
  {
    slug: 'luxury_slow_burn',
    name: 'Luxury Slow Burn',
    vibe: 'Premium & cinematic',
    pacing: 'Slow, deliberate',
    camera: 'Macro close-ups, slow push-in, rack focus',
    best_for: 'High-end fashion, beauty, hospitality',
    directive: `VIDEO STYLE — LUXURY SLOW BURN:
Apply a cinematic, high-fashion luxury aesthetic throughout.
• Camera: extreme macro close-ups on product texture and detail; slow push-ins (0.2× speed); deliberate rack-focus between foreground and background; shallow depth-of-field.
• Pacing: long 5–8 second scenes; let moments breathe; no rush between cuts.
• Color grading: deep shadows, rich mid-tones; desaturated except brand color accents; warm gold or cool silver tones depending on brand palette.
• Lighting: dramatic side-lighting, rim lighting on product; intentional lens flare.
• Text overlays: sparse — one word or short phrase maximum; elegant serif or ultra-thin typeface.
• Transitions: smooth fades, slow dissolves — never hard cuts.
• Energy: aspirational tension — make the viewer crave the product.`,
  },
  {
    slug: 'viral_fast_cut',
    name: 'Viral Fast Cut',
    vibe: 'High-energy & trending',
    pacing: 'Rapid — 0.5–1s per cut',
    camera: 'Dynamic handheld, quick zooms, whip pans',
    best_for: 'Gen Z brands, lifestyle, food & drink',
    directive: `VIDEO STYLE — VIRAL FAST CUT:
Apply a high-energy, social-native fast-cut aesthetic throughout.
• Camera: handheld energy, quick zoom-ins, snap pans, 360° spins around product; unpredictable angles keep it fresh.
• Pacing: cut every 0.5–1.5 seconds; match cuts to a strong beat; first 2 seconds must hook immediately.
• Color grading: saturated, punchy, high contrast; brand colors popped to maximum vibrancy.
• Composition: product fills the frame; tight crops; exaggerated close-ups.
• Text overlays: bold, large, center-frame; 1–3 words per scene; animated (pop-on or slide-in).
• Transitions: whip pans, zoom transitions, glitch cuts — high kinetic energy.
• Energy: chaotic-fun — surprise the viewer in every scene.`,
  },
  {
    slug: 'ingredient_reveal',
    name: 'Ingredient Reveal',
    vibe: 'Sensory & tactile',
    pacing: 'Rhythmic, reveal-driven',
    camera: 'Extreme close-up, pour shots, overhead flat-lay',
    best_for: 'Food, beauty, supplements, handcrafted goods',
    directive: `VIDEO STYLE — INGREDIENT REVEAL:
Build the video as a progressive sensory reveal of raw materials and process.
• Camera: extreme macro close-ups on textures (grain, liquid, powder); slow overhead pours and sprinkles; sequential flat-lay reveals with items entering frame one by one.
• Pacing: each scene introduces one new element; build anticipation then cut to hero product.
• Color grading: warm, natural tones; enhance material colors without oversaturation; clean white or natural wood backgrounds.
• Sound design direction: layers of tactile SFX (drizzle, crunch, fizz) implied by scene descriptions.
• Text overlays: ingredient name on each reveal scene in a minimal label style.
• Transitions: quick cuts on textural peak moments; overhead-to-product cut at the end.
• Energy: curiosity and appetite-driven — make each ingredient irresistible.`,
  },
  {
    slug: 'street_style',
    name: 'Street Style',
    vibe: 'Authentic & urban',
    pacing: 'Organic, documentary-feel',
    camera: 'Handheld, following shots, street-level angles',
    best_for: 'Fashion, streetwear, lifestyle, events',
    directive: `VIDEO STYLE — STREET STYLE:
Apply an authentic urban documentary aesthetic throughout.
• Camera: handheld with intentional natural shake; following shots behind talent; low street-level angles looking up; candid-feel framing.
• Pacing: natural rhythm — not every cut is on a beat; let real-life moments dictate timing.
• Color grading: gritty, slightly desaturated; pushed blacks; urban color palette (concrete, neon accents); film-grain texture.
• Composition: environment tells the story — include urban context, not just product.
• Text overlays: minimal; street-sign aesthetic or no-frills bold text if used.
• Transitions: hard cuts, match cuts on movement — never fancy effects.
• Energy: real and unfiltered — authenticity over perfection.`,
  },
  {
    slug: 'unboxing_drama',
    name: 'Unboxing Drama',
    vibe: 'Theatrical & anticipatory',
    pacing: 'Build-up → reveal → payoff',
    camera: 'Close-up on hands, slow lift reveal, reaction angle',
    best_for: 'E-commerce, subscription boxes, premium gifts',
    directive: `VIDEO STYLE — UNBOXING DRAMA:
Structure every scene as a theatrical build-up and reveal sequence.
• Camera: tight close-up on hands interacting with packaging; slow controlled lift reveals; cutaway to product face-on at reveal; reaction-style angle on the "wow" moment.
• Pacing: deliberate slow build (3–4s) → snappy reveal cut → linger on hero product (2–3s).
• Color grading: slightly dark and moody during anticipation; brightness increases sharply at reveal.
• Lighting: spotlight-style on packaging and product; dark background to focus attention.
• Text overlays: "What's inside?" style teaser text; product name on reveal; value proposition on final scene.
• Transitions: hard cut on reveal moment for maximum impact.
• Energy: mount tension then release it — make the reveal unforgettable.`,
  },
  {
    slug: 'before_after',
    name: 'Before / After',
    vibe: 'Transformative & persuasive',
    pacing: 'Two-act: problem → solution',
    camera: 'Matching angles for before and after comparison',
    best_for: 'Beauty, cleaning products, fitness, home improvement',
    directive: `VIDEO STYLE — BEFORE / AFTER:
Build the video as a clear transformation narrative — problem then solution.
• Camera: mirror the exact same angle and framing for "before" and "after" shots so the transformation is unmistakable; dolly in on the "after" to signal improvement.
• Pacing: first half shows the problem (slightly slower, muted energy); second half shows the result (brighter, faster energy).
• Color grading: desaturated/cooler tones for "before" scenes; warm, saturated, vibrant tones for "after" scenes.
• Composition: side-by-side split frame or sequential cut at the midpoint; clear visual contrast.
• Text overlays: "Before" label (simple, lower-third) and "After" label at transformation moment; result stat or claim on final scene.
• Transitions: dramatic wipe or flash-cut between before and after.
• Energy: shift from tension to satisfaction — resolution is the emotional payoff.`,
  },
  {
    slug: 'mood_film',
    name: 'Mood Film',
    vibe: 'Atmospheric & emotional',
    pacing: 'Slow, immersive',
    camera: 'Wide establishing shots, slow float, golden-hour lighting',
    best_for: 'Lifestyle brands, wellness, travel, premium food & drink',
    directive: `VIDEO STYLE — MOOD FILM:
Prioritise atmosphere and emotional resonance over product information.
• Camera: wide establishing shots to set mood; slow floating moves (drone-style or slider); golden-hour and blue-hour lighting; silhouette moments; reflections and natural light play.
• Pacing: long unhurried scenes (4–6s); silence and space are assets; let the emotion arrive slowly.
• Color grading: rich, cinematic LUT-style; warm amber and rose for golden-hour scenes; deep teals in shadows; anamorphic lens flare where appropriate.
• Composition: negative space is intentional; talent or product is small against a large beautiful environment.
• Text overlays: one evocative word or brand tagline only; fade in gently.
• Transitions: slow cross-dissolves; long fades to black between major moments.
• Energy: contemplative and aspirational — sell a feeling, not a feature.`,
  },
  {
    slug: 'product_explosion',
    name: 'Product Explosion',
    vibe: 'Dynamic & spectacular',
    pacing: 'Fast, with dramatic pauses',
    camera: 'Orbiting 360°, extreme close-ups, flying-through angles',
    best_for: 'Tech, sports, energy drinks, creative brands',
    directive: `VIDEO STYLE — PRODUCT EXPLOSION:
Use dynamic, physics-defying visuals to make the product look spectacular.
• Camera: orbiting 360° rotation around the hero product; extreme close-up fly-throughs along product surface; dramatic upward reveal from below; slow-motion splashes or bursts of brand-colored particles.
• Pacing: fast movement with sudden freeze-frames on the most dramatic angles.
• Color grading: high contrast, deep blacks, hyper-saturated brand colors; light trails and glow effects.
• Composition: product isolated against solid dark or gradient backgrounds; multiple product angles layered.
• Text overlays: product name in bold as a climactic reveal; key feature callouts with short animated labels.
• Transitions: instant cut at peak energy moments; burst/flash transitions.
• Energy: maximum visual spectacle — this product deserves to be shown off.`,
  },
  {
    slug: 'testimonial_style',
    name: 'Testimonial Style',
    vibe: 'Authentic & trust-building',
    pacing: 'Conversational, natural',
    camera: 'Talking-head framing, subtle reframe, natural setting',
    best_for: 'SaaS, wellness, consumer services, coaching',
    directive: `VIDEO STYLE — TESTIMONIAL STYLE:
Create the feel of an authentic user-generated or interview-style testimonial.
• Camera: talking-head framing (person at slight angle, not dead-center); subtle natural reframe mid-scene; background shows real-life context relevant to the product.
• Pacing: conversational rhythm — let spoken cadence guide cuts; natural pauses are okay.
• Color grading: warm, natural, slightly faded — feels real not over-produced; avoid heavy LUTs.
• Lighting: natural window light or simple ring-light feel; imperfect is fine.
• Composition: person occupies 60% of frame; product visible but not forced into foreground.
• Text overlays: quote highlights as bold lower-thirds; result stat or name/title for social proof.
• Transitions: jump cuts (intentionally casual) or simple cross-dissolve.
• Energy: honest and relatable — the viewer should think "that could be me."`,
  },
  {
    slug: 'menu_showcase',
    name: 'Menu Showcase',
    vibe: 'Appetizing & indulgent',
    pacing: 'Sensory-paced, linger on the good bits',
    camera: 'Overhead flat-lay, 45° glamour shot, slow pour/drizzle',
    best_for: 'Restaurants, food delivery, cafés, FMCG food brands',
    directive: `VIDEO STYLE — MENU SHOWCASE:
Make every scene look so good the viewer gets hungry.
• Camera: overhead flat-lay for composition shots; 45° "glamour angle" for plated dishes; slow close-up pull-back revealing the full dish; extreme macro on textures (sauce drizzle, cheese pull, steam rising).
• Pacing: linger 2–3s on the most appetizing textures; quick cut away just before it becomes static.
• Color grading: warm, saturated food tones — enhance reds and ambers; clean white plates; lush green garnishes.
• Lighting: soft overhead with subtle rim light; use steam and condensation as visual elements.
• Composition: food fills 80% of the frame; minimal props; negative space only if brand-minimal style.
• Text overlays: dish name in an elegant script or bold sans; price optional; "Order now" CTA on final scene.
• Transitions: match cut from raw ingredient to finished dish; wipe on a plating action.
• Energy: indulgent and irresistible — trigger appetite, then provide the CTA.`,
  },
  {
    slug: 'countdown_hype',
    name: 'Countdown Hype',
    vibe: 'Urgent & exciting',
    pacing: 'Escalating — faster with each scene',
    camera: 'Quick cuts, zooming in, tightening angles',
    best_for: 'Product launches, flash sales, events, limited editions',
    directive: `VIDEO STYLE — COUNTDOWN HYPE:
Build urgency and excitement that escalates scene by scene.
• Camera: each scene zooms in slightly tighter than the last — start wide, end extreme close-up on product; quick snap zooms on key moments.
• Pacing: deliberately increase cut speed across scenes (scene 1: 4s, scene 2: 3s, scene 3: 2s, final: 1s flash); final scene holds on product.
• Color grading: pumped saturation; brand colors pushed to max; subtle red/warm vignette to signal urgency.
• Composition: countdown number or timer element visible in corner; product dominant in frame.
• Text overlays: bold countdown numbers each scene ("3…", "2…", "1…"); CTA on final frame ("Available now", "Limited drop", "Shop today").
• Transitions: fast whip cuts, flash frames between countdown moments.
• Energy: builds to a peak — the viewer must feel compelled to act immediately.`,
  },
];

export const DEFAULT_STYLE_SLUG = 'clean_commercial';

export function getStyleBySlug(slug: string): VideoStyle | undefined {
  return VIDEO_STYLES.find((s) => s.slug === slug);
}
