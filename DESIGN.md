---
name: SynergiaX Cinematic Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#ffffff'
  on-tertiary: '#490080'
  tertiary-container: '#f0dbff'
  on-tertiary-container: '#8a33d9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#f0dbff'
  tertiary-fixed-dim: '#ddb7ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#6900b3'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Instrument Serif
    fontSize: 72px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Instrument Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Instrument Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Instrument Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

The brand personality is high-end, mysterious, and technically sophisticated. It aims to evoke a sense of "premium digital craftsmanship," similar to luxury watchmaking or high-fidelity cinematic interfaces. The target audience includes creative professionals, tech enthusiasts, and power users who value an immersive, distraction-free environment.

The design system employs a **Liquid Glass** aesthetic. This style merges minimalism with depth, utilizing hyper-realistic frosted surfaces, "floating" components, and high-contrast typography. The environment is defined by deep obsidian backgrounds that allow content to emerge from the darkness through light-refracting borders and subtle chromatic aberrations.

- **Primary Style:** Liquid Glassmorphism.
- **Mood:** Immersive, focused, avant-garde.
- **Visual Key:** Sharp white typography against infinite black, softened by translucent, blurred glass layers.

## Colors

The palette is fundamentally monochrome, relying on the interplay between `#000000` (Obsidian) and `#FFFFFF` (Stark White). 

- **Background:** A deep, near-pure black (`#050505`) serves as the void.
- **Accents:** Subtle Purple and Indigo are used sparingly for active states or "liquid" highlights, appearing as though light is catching the edge of a glass pane.
- **Glass Surfaces:** Utilizes low-opacity white fills (`rgba(255, 255, 255, 0.03)`) combined with heavy background blurs (30px+) to create the "liquid glass" effect.

## Typography

Typography is used to create dramatic hierarchy. **Instrument Serif** (a refined, high-contrast serif) is reserved for large display text and headlines, providing a literary and cinematic feel. **Inter** handles all functional, body, and UI-related text to ensure maximum legibility within the glass containers.

- **Headlines:** Use tight letter spacing for display sizes to emphasize the elegant curves of the serif.
- **Body Text:** Use Inter with generous line-height to maintain breathing room.
- **Labels:** Uppercase Inter with slight tracking for a technical, "instrument-like" appearance.

## Layout & Spacing

This design system uses a **Fluid Grid** model with extreme margins to emphasize the cinematic widescreen feel.

- **Desktop:** 12-column grid with 64px outer margins. Content is often centered or offset to create dynamic asymmetry.
- **Mobile:** 4-column grid with 20px margins. Glass cards span the full width to maximize internal padding.
- **Rhythm:** An 8px base unit governs all padding and margins. Glass containers should have generous internal padding (32px+) to maintain the "premium" airy feel.

## Elevation & Depth

Depth is not communicated through traditional shadows, but through **Backdrop Refraction** and **Inner Glows**.

1.  **Glass Layers:** Every elevated surface uses a `backdrop-filter: blur(40px)`.
2.  **Border Refraction:** Surfaces feature a 1px solid border at 10% white opacity. On the top and left edges, an additional "inner highlight" (a 1px inset box shadow, white at 20% opacity) simulates light hitting the edge of the glass.
3.  **The Void:** There are no drop shadows on the lowest layer. Elements should feel as if they are floating in deep water or space. 
4.  **Z-Index:** Higher elevation layers increase in background opacity (from 3% to 8%) rather than increasing shadow size.

## Shapes

The shape language is sophisticated and "soft-tech."

- **Primary Radius:** 16px (`rounded-lg`) for main glass containers and cards.
- **Secondary Radius:** 8px (`rounded-md`) for buttons and input fields.
- **Consistency:** Avoid pill-shapes except for status indicators (chips). All structural elements should maintain a consistent corner radius to feel like part of a single machined interface.

## Components

- **Buttons:** 
  - *Primary:* Solid white background with black Inter Bold text. No border.
  - *Secondary:* Glass background (10% white) with 1px white border (20% opacity) and white text.
- **Input Fields:** Completely transparent background with a 1px white bottom border. On focus, the border brightens and a subtle purple glow appears beneath the line.
- **Cards (Glass Panes):** The signature component. Blurred background, 1px subtle border, and generous internal padding. Content inside should be strictly white or high-contrast grey.
- **Chips:** Small, pill-shaped elements with a deep indigo background and white text, used for tags or status.
- **Lists:** Separated by thin 1px lines at 5% white opacity. No visible containers around list items to keep the layout feeling fluid.
- **Navigation:** A floating glass dock at the bottom of the viewport or a minimal top bar with blurred background.