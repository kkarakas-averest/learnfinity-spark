declare module 'pdf-parse' {
  import { Buffer } from 'buffer';

  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsEncrypted?: boolean;
    IsSignaturesPresent?: boolean;
    IsXFAPresent?: boolean;
  }

  interface PDFMetadata {
    [key: string]: unknown;
  }

  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata;
    version: string;
    text: string;
  }

  interface PDFOptions {
    max?: number;
  }

  function pdfParse(buffer: Buffer, options?: PDFOptions): Promise<PDFParseResult>;
  export = pdfParse;
} 