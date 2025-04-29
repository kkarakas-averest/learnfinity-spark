declare module 'pdfjs-dist' {
  export const version: string;
  
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }
  
  export interface PDFPageProxy {
    getTextContent(options?: any): Promise<TextContent>;
  }
  
  export interface TextContent {
    items: TextItem[];
    styles: any;
  }
  
  export interface TextItem {
    str: string;
    dir: string;
    transform: number[];
    width: number;
    height: number;
    fontName: string;
  }

  export interface GlobalWorkerOptions {
    workerSrc: string;
  }

  export const GlobalWorkerOptions: GlobalWorkerOptions;
  
  export function getDocument(
    source: {
      url?: string;
      data?: Uint8Array | ArrayBuffer | Buffer;
      cMapUrl?: string;
      cMapPacked?: boolean;
      length?: number;
    }
  ): PDFDocumentLoadingTask;
  
  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
    destroy(): void;
  }
} 