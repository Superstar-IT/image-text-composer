import { FontOption } from '@/types';

export const GOOGLE_FONTS: FontOption[] = [
  {
    family: 'Inter',
    displayName: 'Inter',
    weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  {
    family: 'Roboto',
    displayName: 'Roboto',
    weights: ['100', '300', '400', '500', '700', '900']
  },
  {
    family: 'Open Sans',
    displayName: 'Open Sans',
    weights: ['300', '400', '500', '600', '700', '800']
  },
  {
    family: 'Lato',
    displayName: 'Lato',
    weights: ['100', '300', '400', '700', '900']
  },
  {
    family: 'Poppins',
    displayName: 'Poppins',
    weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  {
    family: 'Montserrat',
    displayName: 'Montserrat',
    weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  {
    family: 'Source Sans Pro',
    displayName: 'Source Sans Pro',
    weights: ['200', '300', '400', '600', '700', '900']
  },
  {
    family: 'Ubuntu',
    displayName: 'Ubuntu',
    weights: ['300', '400', '500', '700']
  },
  {
    family: 'Playfair Display',
    displayName: 'Playfair Display',
    weights: ['400', '500', '600', '700', '800', '900']
  },
  {
    family: 'Merriweather',
    displayName: 'Merriweather',
    weights: ['300', '400', '700', '900']
  },
  {
    family: 'PT Sans',
    displayName: 'PT Sans',
    weights: ['400', '700']
  },
  {
    family: 'Noto Sans',
    displayName: 'Noto Sans',
    weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  {
    family: 'Oswald',
    displayName: 'Oswald',
    weights: ['200', '300', '400', '500', '600', '700']
  },
  {
    family: 'Roboto Condensed',
    displayName: 'Roboto Condensed',
    weights: ['300', '400', '700']
  },
  {
    family: 'Roboto Slab',
    displayName: 'Roboto Slab',
    weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  {
    family: 'Source Code Pro',
    displayName: 'Source Code Pro',
    weights: ['200', '300', '400', '500', '600', '700', '800', '900']
  },
  {
    family: 'Inconsolata',
    displayName: 'Inconsolata',
    weights: ['200', '300', '400', '500', '600', '700', '800', '900']
  },
  {
    family: 'Space Mono',
    displayName: 'Space Mono',
    weights: ['400', '700']
  },
  {
    family: 'Work Sans',
    displayName: 'Work Sans',
    weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  {
    family: 'Quicksand',
    displayName: 'Quicksand',
    weights: ['300', '400', '500', '600', '700']
  },
  {
    family: 'Josefin Sans',
    displayName: 'Josefin Sans',
    weights: ['100', '200', '300', '400', '500', '600', '700']
  },
  {
    family: 'Comfortaa',
    displayName: 'Comfortaa',
    weights: ['300', '400', '500', '600', '700']
  },
  {
    family: 'Lobster',
    displayName: 'Lobster',
    weights: ['400']
  },
  {
    family: 'Pacifico',
    displayName: 'Pacifico',
    weights: ['400']
  },
  {
    family: 'Permanent Marker',
    displayName: 'Permanent Marker',
    weights: ['400']
  },
  {
    family: 'Righteous',
    displayName: 'Righteous',
    weights: ['400']
  },
  {
    family: 'Satisfy',
    displayName: 'Satisfy',
    weights: ['400']
  },
  {
    family: 'Shadows Into Light',
    displayName: 'Shadows Into Light',
    weights: ['400']
  },
  {
    family: 'Special Elite',
    displayName: 'Special Elite',
    weights: ['400']
  }
];

// Normalize a fontFamily string coming back from Fabric/canvas
// It may include quotes and fallbacks like "Inter", sans-serif — return the bare family
export const normalizeFontFamilyFromCanvas = (value?: string): string => {
  if (!value) return 'Inter';
  const first = value.split(',')[0].trim();
  return first.replace(/^['"]|['"]$/g, '');
};