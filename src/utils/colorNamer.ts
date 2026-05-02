/**
 * Converts hex color codes to user-friendly color names
 */

interface ColorName {
  name: string;
  hex: string;
}

// Common color names with their hex values
const COLOR_NAMES: ColorName[] = [
  // Reds & Pinks
  { name: 'Red', hex: '#FF0000' },
  { name: 'Dark Red', hex: '#8B0000' },
  { name: 'Crimson', hex: '#DC143C' },
  { name: 'Deep Pink', hex: '#FF1493' },
  { name: 'Hot Pink', hex: '#FF69B4' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Light Pink', hex: '#FFB6C1' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Deep Magenta', hex: '#C41E3A' },
  { name: 'Rose', hex: '#FF007F' },

  // Oranges
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Dark Orange', hex: '#FF8C00' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Tomato', hex: '#FF6347' },
  { name: 'Peach', hex: '#FFDAB9' },

  // Yellows
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Light Yellow', hex: '#FFFFE0' },
  { name: 'Khaki', hex: '#F0E68C' },

  // Greens
  { name: 'Green', hex: '#008000' },
  { name: 'Dark Green', hex: '#006400' },
  { name: 'Lime', hex: '#00FF00' },
  { name: 'Lime Green', hex: '#32CD32' },
  { name: 'Spring Green', hex: '#00FF7F' },
  { name: 'Mint', hex: '#98FF98' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Olive', hex: '#808000' },

  // Blues
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Dark Blue', hex: '#00008B' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Light Blue', hex: '#ADD8E6' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Turquoise', hex: '#40E0D0' },

  // Purples
  { name: 'Purple', hex: '#800080' },
  { name: 'Dark Purple', hex: '#4B0082' },
  { name: 'Indigo', hex: '#4B0082' },
  { name: 'Violet', hex: '#EE82EE' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Plum', hex: '#DDA0DD' },

  // Browns & Neutrals
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Cream', hex: '#FFFDD0' },

  // Grays & Blacks
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Ivory', hex: '#FFFEF2' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Light Gray', hex: '#D3D3D3' },
  { name: 'Dark Gray', hex: '#A9A9A9' },
  { name: 'Silver', hex: '#C0C0C0' },
];

/**
 * Calculate color distance using RGB values
 */
function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return Infinity;

  return Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2));
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) return null;

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert hex color to friendly name
 * @param hex - Hex color code (e.g., "#C41E3A" or "C41E3A")
 * @returns User-friendly color name (e.g., "Deep Magenta")
 */
export function hexToColorName(hex: string): string {
  if (!hex) return 'Unknown Color';

  // Normalize hex
  hex = hex.toUpperCase().replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const normalizedHex = `#${hex}`;

  // Find exact match first
  const exactMatch = COLOR_NAMES.find((c) => c.hex.toUpperCase() === normalizedHex);
  if (exactMatch) return exactMatch.name;

  // Find closest color by distance
  let closestColor = COLOR_NAMES[0];
  let minDistance = Infinity;

  for (const color of COLOR_NAMES) {
    const distance = colorDistance(normalizedHex, color.hex);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor.name;
}

/**
 * Convert array of hex colors to friendly names
 */
export function hexArrayToColorNames(hexColors: string[]): string[] {
  return hexColors.map(hexToColorName);
}

/**
 * Get a friendly description of multiple colors
 * @param hexColors - Array of hex colors
 * @returns Formatted string like "Deep Magenta, Ivory, and Black"
 */
export function getColorDescription(hexColors: string[]): string {
  if (!hexColors || hexColors.length === 0) return 'No colors';

  const names = hexArrayToColorNames(hexColors);

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  const allButLast = names.slice(0, -1).join(', ');
  return `${allButLast}, and ${names[names.length - 1]}`;
}
