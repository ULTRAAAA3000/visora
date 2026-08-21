export interface AspectPreset {
  id: string;
  /** Marketplace/platform name shown on the tag. */
  platform: string;
  /** Ratio shown in parentheses, e.g. "1:1". */
  ratioLabel: string;
  width: number;
  height: number;
}

/**
 * One-click render dimensions for common marketplace/social image
 * slots. Pixel values are each platform's commonly recommended size at
 * that ratio (not just the ratio scaled arbitrarily), so the output is
 * usable as-is without the user ever typing a pixel number.
 */
export const ASPECT_RATIO_PRESETS: AspectPreset[] = [
  { id: 'amazon-1-1', platform: 'Amazon', ratioLabel: '1:1', width: 1000, height: 1000 },
  { id: 'etsy-4-3', platform: 'Etsy', ratioLabel: '4:3', width: 1200, height: 900 },
  { id: 'shopify-16-9', platform: 'Shopify', ratioLabel: '16:9', width: 1600, height: 900 },
  { id: 'ig-story-9-16', platform: 'Instagram Story', ratioLabel: '9:16', width: 1080, height: 1920 },
];
