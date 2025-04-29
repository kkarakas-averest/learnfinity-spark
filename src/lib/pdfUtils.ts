import * as PDFJS from 'pdfjs-dist/build/pdf';

PDFJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';  // Ensure this path matches your asset setup in Vite 