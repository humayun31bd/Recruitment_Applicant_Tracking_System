// @ts-ignore
import * as QRCode from 'qrcode';

export async function generateQrDataUrl(text: string, options?: { width?: number; margin?: number; dark?: string; light?: string }): Promise<string> {
  if (!text) return '';
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 180,
      margin: options?.margin !== undefined ? options.margin : 1,
      color: {
        dark: options?.dark || '#0f172a', // Deep slate for crisp printing
        light: options?.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}
