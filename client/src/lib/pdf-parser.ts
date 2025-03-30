import * as pdfjsLib from 'pdfjs-dist';

// Initialize pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js';

/**
 * Extracts text content from a PDF file
 * @param file PDF file to extract content from
 * @returns Promise<string> of text content
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n';
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

/**
 * Converts a PDF file to a base64 string
 * @param file PDF file to convert
 * @returns Promise<string> of base64 encoded content
 */
export async function pdfToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URI prefix (e.g., 'data:application/pdf;base64,')
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('FileReader did not return a string'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Processes a PDF file for financial data extraction
 * @param file PDF file to process
 * @returns Promise<{ base64: string, text: string }> containing both base64 and extracted text
 */
export async function processPdfFile(file: File): Promise<{ base64: string, text: string }> {
  const [base64, text] = await Promise.all([
    pdfToBase64(file),
    extractTextFromPdf(file)
  ]);
  
  return { base64, text };
}
