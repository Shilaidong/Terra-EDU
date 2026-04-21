import * as XLSX from "xlsx";

export function readWorkbook(file: File, buffer: ArrayBuffer) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    const csvText = decodeCsvText(buffer);
    return XLSX.read(csvText, { type: "string" });
  }

  return XLSX.read(buffer, { type: "array" });
}

export function readFirstSheetRows(workbook: XLSX.WorkBook) {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
}

export function asString(value?: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : "";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

export function asNumber(value?: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function decodeCsvText(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("gb18030").decode(bytes);
  }
}
