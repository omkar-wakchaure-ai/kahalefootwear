const cleanImages = (images) => images
  .filter((image) => typeof image === 'string' && image.trim())
  .map((image) => image.trim());

export function getProductImages(product) {
  const images = Array.isArray(product?.images) ? cleanImages(product.images) : [];
  if (images.length > 0) {
    return [...new Set(images)];
  }

  const legacyImages = [product?.image, product?.imageUrl];
  return [...new Set(cleanImages(legacyImages))];
}

export function getPrimaryProductImage(product) {
  return getProductImages(product)[0] || '';
}
