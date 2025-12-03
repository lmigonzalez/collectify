import { CSVPreviewData } from "../types/upload";

export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
    i++;
  }

  result.push(current);
  return result;
};

// Map common header variations to standard field names
const normalizeHeader = (header: string): string => {
  const normalized = header.trim().toLowerCase().replace(/"/g, "");
  
  // Map common variations
  const headerMap: Record<string, string> = {
    "description": "descriptionhtml",
    "seo title": "seotitle",
    "seo description": "seodescription",
  };
  
  return headerMap[normalized] || normalized;
};

export const parseCSVForPreview = (csvContent: string): CSVPreviewData => {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      validRows: 0,
      errors: ["CSV file must have at least a header row and one data row"],
    };
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const normalizedHeaders = headers.map(normalizeHeader);
  const rows: string[][] = [];
  const errors: string[] = [];
  let validRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      errors.push(
        `Row ${i + 1}: Column count mismatch (expected ${
          headers.length
        }, got ${values.length})`
      );
      continue;
    }

    rows.push(values);

    // Basic validation - find title field (case-insensitive)
    const titleIndex = normalizedHeaders.indexOf("title");
    const title = titleIndex >= 0 ? values[titleIndex]?.replace(/"/g, "") || "" : "";
    if (!title.trim()) {
      errors.push(`Row ${i + 1}: Title is required`);
    } else {
      validRows++;
    }
  }

  return {
    headers,
    rows,
    totalRows: rows.length,
    validRows,
    errors,
  };
};
