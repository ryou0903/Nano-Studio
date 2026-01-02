import JSZip from 'jszip';
import { GeneratedImage } from '../types';

export const downloadImagesAsZip = async (images: GeneratedImage[]) => {
  const zip = new JSZip();
  const folder = zip.folder("nano-studio-images");

  if (!folder) return;

  images.forEach((img, index) => {
    // Remove data URL prefix
    const base64Data = img.base64.split(',')[1];
    const fileName = `image-${img.timestamp}-${index + 1}.png`;
    folder.file(fileName, base64Data, { base64: true });
  });

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `nano-studio-batch-${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadSingleImage = (image: GeneratedImage) => {
  const link = document.createElement('a');
  link.href = image.base64;
  link.download = `nano-studio-${image.timestamp}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};