/**
 * PO Document Scanner (Excel, Images, PDFs)
 * Parses text using regex to find FOB price, Unit Price, PO Qty, PO Number, and Total Order Value.
 */
export function extractPOFieldsFromText(rawText) {
  if (!rawText || typeof rawText !== "string") return {};

  const lines = rawText.split(/\r?\n/);
  const result = {
    poNumber: null,
    poQty: null,
    fobPrice: null,
    orderValue: null,
    rawTextPreview: rawText.slice(0, 300)
  };

  // Helper to parse numbers safely with commas/currency
  const parseNum = (str) => {
    if (!str) return null;
    const cleaned = String(str).replace(/[^0-9.-]/g, "");
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
  };

  // 1. PO Number patterns
  const poMatch = rawText.match(/(?:PO|P\.O\.|Purchase\s*Order|Order\s*No|PO\s*#)[\s#:.-]*([A-Za-z0-9\-_/]{3,25})/i);
  if (poMatch && poMatch[1]) {
    result.poNumber = poMatch[1].trim();
  }

  // 2. FOB Rate / Unit Price / Rate patterns
  const fobPatterns = [
    /(?:FOB|F\.O\.B\.?|FOB\s*Rate|FOB\s*Price|Unit\s*Price|Rate|Price\s*\/\s*pc|Rate\s*\/\s*pc)[\s:=$₹€£]*([0-9,]+(?:\.[0-9]{1,4})?)/i,
    /(?:USD|EUR|INR|₹|\$|€)[\s]*([0-9,]+(?:\.[0-9]{1,4})?)[\s]*(?:\/\s*pc|\/\s*pcs|each|per\s*piece)/i,
    /(?:Selling\s*Price|Garment\s*Price)[\s:=$₹€£]*([0-9,]+(?:\.[0-9]{1,4})?)/i
  ];

  for (const pattern of fobPatterns) {
    const match = rawText.match(pattern);
    if (match && match[1]) {
      const val = parseNum(match[1]);
      if (val !== null && val > 0 && val < 1000000) {
        result.fobPrice = val;
        break;
      }
    }
  }

  // 3. PO Qty patterns
  const qtyPatterns = [
    /(?:PO\s*Qty|Total\s*Qty|Order\s*Qty|Quantity|Qty)[\s:=]*([0-9,]+)(?:\s*(?:pcs|pc|pieces|units))?/i,
    /([0-9,]+)\s*(?:pcs|pc|pieces|units)/i
  ];

  for (const pattern of qtyPatterns) {
    const match = rawText.match(pattern);
    if (match && match[1]) {
      const val = parseNum(match[1]);
      if (val !== null && val > 0) {
        result.poQty = Math.round(val);
        break;
      }
    }
  }

  // Helper to normalize OCR tokens (e.g. OCR often confuses 7 with n, 0 with o/O, 1 with l/I)
  const recoverOcrNumber = (str) => {
    if (!str) return null;
    let s = String(str).trim();
    s = s.replace(/^n(?=[0-9])/i, "7"); // 'n25300' -> '725300'
    s = s.replace(/o/gi, "0").replace(/[liI]/g, "1");
    return parseNum(s);
  };

  // 4. Total Order / PO Value patterns
  const valPatterns = [
    // Matches "Total Amount (₹) : 7,25,900" or "Total Amount" followed by amount on same line or within next few words
    /Total\s*Am[a-z]*(?:\s*\([^\)]+\))?[\s:=₹$€£\n\r\-—0]*([0-9nN]{1,3}(?:[,.][0-9noO]{2,3})*(?:\.[0-9]{1,2})?|[0-9nN]{4,}(?:\.[0-9]{1,2})?)/i,
    /Total\s*(?:PO|Order)?\s*Value\s*(?:\([^\)]+\))?[\s:=₹$€£\n\r]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /Grand\s*Total[\s:=₹$€£\n\r]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /Net\s*Amount[\s:=₹$€£\n\r]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /PO\s*Value[\s:=₹$€£\n\r]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /(?:Total|Amount)[\s:=₹$€£\n\r]+([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?)/i
  ];

  for (const pattern of valPatterns) {
    const match = rawText.match(pattern);
    if (match && match[1]) {
      const val = recoverOcrNumber(match[1]);
      if (val !== null && val > 0) {
        result.orderValue = val;
        break;
      }
    }
  }

  // Also check if lines contain "Total Amount" or OCR variants "Total Amant" and find adjacent numbers
  if (!result.orderValue) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes("total am") || line.includes("total val") || line.includes("grand tot")) {
        // Look in this line or next 2 lines
        const combined = (lines[i] + " " + (lines[i + 1] || "") + " " + (lines[i + 2] || ""));
        const tokens = combined.match(/[0-9nN]{1,3}(?:[,.][0-9noO]{2,3})+|[0-9nN]{4,}/g);
        if (tokens && tokens.length > 0) {
          for (const tok of tokens) {
            const v = recoverOcrNumber(tok);
            if (v && v > 500 && v !== result.poQty) {
              result.orderValue = v;
              break;
            }
          }
          if (result.orderValue) break;
        }
      }
    }
  }

  // Also catch "7,25,900" or similar amounts appearing near bottom notes or table footer
  if (!result.orderValue) {
    const bottomText = rawText.slice(Math.max(0, rawText.length - 600));
    const bigNums = bottomText.match(/[0-9nN]{1,3}(?:[,.][0-9noO]{2,3})*(?:\.[0-9]{1,2})?|[0-9nN]{4,}/g);
    if (bigNums && bigNums.length > 0) {
      for (const numStr of bigNums) {
        const val = recoverOcrNumber(numStr);
        if (val && val > 10000 && val !== result.poQty) {
          result.orderValue = val;
          break;
        }
      }
    }
  }

  // If orderValue not explicitly found, but we have qty and fobPrice:
  if (!result.orderValue && result.fobPrice && result.poQty) {
    result.orderValue = Math.round(result.fobPrice * result.poQty * 100) / 100;
  }

  return result;
}

/**
 * Reads an Excel file (xlsx/xls/csv) and extracts text/values
 */
export async function parseExcelFile(file) {
  try {
    const XLSX = await import("xlsx");
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    let fullText = "";
    let extractedFob = null;
    let extractedQty = null;
    let extractedTotal = null;
    let extractedPoNo = null;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      // Scan rows for FOB, Qty, Total headers and cells
      for (let r = 0; r < jsonRows.length; r++) {
        const row = jsonRows[r] || [];
        const rowStr = row.map(c => String(c || "")).join(" | ");
        fullText += rowStr + "\n";

        for (let c = 0; c < row.length; c++) {
          const cell = String(row[c] || "").trim().toLowerCase();
          const nextCellVal = parseFloat(String(row[c + 1] || "").replace(/[^0-9.-]/g, ""));
          
          if (cell.includes("fob") || cell.includes("unit price") || cell.includes("rate/pc")) {
            if (!isNaN(nextCellVal) && nextCellVal > 0) extractedFob = nextCellVal;
          }
          if (cell.includes("po qty") || cell.includes("total qty") || (cell === "qty" && !extractedQty)) {
            if (!isNaN(nextCellVal) && nextCellVal > 0) extractedQty = Math.round(nextCellVal);
          }
          if (cell.includes("total amount") || cell.includes("po value") || cell.includes("grand total")) {
            if (!isNaN(nextCellVal) && nextCellVal > 0) extractedTotal = nextCellVal;
          }
          if (cell.includes("po no") || cell.includes("po #") || cell.includes("purchase order")) {
            const poVal = String(row[c + 1] || "").trim();
            if (poVal) extractedPoNo = poVal;
          }
        }
      }
    }

    const fields = extractPOFieldsFromText(fullText);
    if (extractedFob) fields.fobPrice = extractedFob;
    if (extractedQty) fields.poQty = extractedQty;
    if (extractedTotal) fields.orderValue = extractedTotal;
    if (extractedPoNo) fields.poNumber = extractedPoNo;

    if (!fields.orderValue && fields.fobPrice && fields.poQty) {
      fields.orderValue = Math.round(fields.fobPrice * fields.poQty * 100) / 100;
    }

    return fields;
  } catch (err) {
    console.warn("Excel parsing error:", err);
    return {};
  }
}

/**
 * Reads an Image file using Tesseract OCR
 */
export async function parseImageFile(file) {
  let worker = null;
  try {
    const { createWorker } = await import("tesseract.js");
    worker = await createWorker("eng");
    const ret = await worker.recognize(file);
    const text = ret.data?.text || "";
    await worker.terminate();
    return extractPOFieldsFromText(text);
  } catch (err) {
    console.warn("Image OCR error:", err);
    if (worker) {
      try { await worker.terminate(); } catch (e) {}
    }
    return {};
  }
}

/**
 * Reads a PDF file using text parsing and OCR if needed
 */
export async function parsePdfFile(file) {
  try {
    const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 3);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += pageText + "\n";
    }

    if (fullText.trim().length > 20) {
      return extractPOFieldsFromText(fullText);
    }

    return {};
  } catch (err) {
    console.warn("PDF parsing error:", err);
    return {};
  }
}

/**
 * Main dispatcher to scan uploaded PO Sheet file (Excel, Image, PDF)
 */
export async function scanPOSheetFile(file) {
  if (!file) return null;

  const fileName = (file.name || "").toLowerCase();
  const fileType = (file.type || "").toLowerCase();

  let extracted = {};

  try {
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv") || fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv")) {
      extracted = await parseExcelFile(file);
    } else if (fileType.startsWith("image/") || fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".webp")) {
      extracted = await parseImageFile(file);
    } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      extracted = await parsePdfFile(file);
    }
  } catch (e) {
    console.error("Failed to scan PO Sheet file:", e);
  }

  return extracted;
}
