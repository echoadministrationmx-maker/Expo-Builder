/**
 * Semantic design tokens for the Echo resident portal.
 *
 * Brand palette:
 *   Echo Blue   #1847CC  — primary action color
 *   Echo Ink    #0C1320  — primary text / dark surfaces
 *   Echo Accent #7BA8FF  — secondary accents, active icons
 *   Echo Silver #F2F4F8  — light backgrounds
 *   Echo Mid    #E0E6F5  — borders, dividers, subtle fills
 *
 * Semantic colors (success / warning) are intentionally left unchanged
 * so that status indicators (paid = green, pending = orange) keep their
 * universal meaning independent of brand palette.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#0C1320',
    tint: '#1847CC',

    // Core surfaces
    background: '#F2F4F8',       // Echo Silver
    foreground: '#0C1320',       // Echo Ink  (also the dark balance card bg)

    // Cards / elevated surfaces
    card: '#FFFFFF',             // white cards on Echo Silver background
    cardForeground: '#0C1320',   // Echo Ink

    // Primary action color (buttons, links, tab active, active states)
    primary: '#1847CC',          // Echo Blue
    primaryForeground: '#FFFFFF', // white text on Echo Blue

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E0E6F5',        // Echo Mid — icon chip backgrounds, row fills
    secondaryForeground: '#0C1320',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#E0E6F5',            // Echo Mid
    mutedForeground: '#5A6A85',  // blue-toned neutral, readable on Silver & white

    // Accent highlights (badges, selected items, maintenance icon bg)
    accent: '#D4E0FF',           // soft Echo Blue tint
    accentForeground: '#1847CC', // Echo Blue icon/text on the tint

    // Destructive actions — kept unchanged (semantic meaning)
    destructive: '#C84D4D',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E0E6F5',           // Echo Mid
    input: '#C8D3E8',            // slightly deeper for input outlines
  },

  // Border radius (px). Applies to cards, buttons, inputs, modals.
  radius: 18,
};

export default colors;
