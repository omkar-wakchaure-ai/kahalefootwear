export const PRODUCT_COLORS = [
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Black', hex: '#000000' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Navy Blue', hex: '#000080' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Purple', hex: '#7E22CE' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Grape', hex: '#6F2DA8' },
  { name: 'White', hex: '#FFFFFF' },
];

export const COLOR_HEX = PRODUCT_COLORS.reduce((acc, color) => {
  acc[color.name] = color.hex;
  return acc;
}, {});

export const getColorHex = (name) => COLOR_HEX[name] || '#D1D5DB';

export function getProductColors(product) {
  const rawColors = Array.isArray(product?.colors)
    ? product.colors
    : Array.isArray(product?.availableColors)
      ? product.availableColors
      : [];

  return [...new Set(rawColors
    .filter((color) => typeof color === 'string' && color.trim())
    .map((color) => color.trim()))];
}
