/** Shrink a photo before saving so the system stays fast (max 1400px, JPEG). */
export function resizeImage(file: File, max = 1400, quality = 0.76): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', quality)); };
    img.onerror = reject; img.src = url;
  });
}
