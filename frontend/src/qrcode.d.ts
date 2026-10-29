declare module 'qrcode' {
  export function toDataURL(text: string | Buffer, options?: any): Promise<string>;
  export function toString(text: string | Buffer, options?: any): Promise<string>;
  export function toCanvas(canvasElement: any, text: string, options?: any): Promise<any>;
}
