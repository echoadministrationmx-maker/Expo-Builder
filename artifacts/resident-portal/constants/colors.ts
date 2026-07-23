/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#132238',
    tint: '#e56b52',

    // Core surfaces
    background: '#f7f4ef',
    foreground: '#132238',

    // Cards / elevated surfaces
    card: '#fffdf9',
    cardForeground: '#132238',

    // Primary action color (buttons, links, active states)
    primary: '#e56b52',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e9eef1',
    secondaryForeground: '#294154',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#e9e5de',
    mutedForeground: '#6e7c86',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#f4d8c9',
    accentForeground: '#8f4338',

    // Destructive actions (delete, error states)
    destructive: '#c84d4d',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#dedbd3',
    input: '#d2d8d9',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
