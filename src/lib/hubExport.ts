import * as XLSX from "xlsx";
import JSZip from "jszip";

/** GET `/api/v2/hub/export/datasets/` → `data` payload */
export type HubExportBundle = {
  exported_at: string;
  spaces: Record<string, unknown>[];
  registrations: Record<string, unknown>[];
  check_ins: Record<string, unknown>[];
  blocked_date_ranges: Record<string, unknown>[];
};

const SPACE_KEYS = [
  "id",
  "name",
  "total_capacity",
  "current_occupancy",
  "is_active",
  "created_at",
  "updated_at",
] as const;

const REGISTRATION_KEYS = [
  "id",
  "name",
  "email",
  "phone_number",
  "location",
  "reason",
  "role",
  "contribution",
  "status",
  "notes",
  "preferred_date",
  "preferred_time",
  "expected_duration_hours",
  "created_at",
  "updated_at",
] as const;

const CHECK_IN_KEYS = [
  "id",
  "registration_id",
  "registration_name",
  "registration_email",
  "registration_phone",
  "space_id",
  "space_name",
  "status",
  "check_in_time",
  "check_out_time",
  "purpose",
  "notes",
  "created_at",
  "updated_at",
] as const;

const BLOCKED_KEYS = [
  "id",
  "start_date",
  "end_date",
  "reason",
  "is_active",
  "created_at",
  "updated_at",
] as const;

function authHeaders(token: string): HeadersInit {
  return { Authorization: token };
}

export class HubExportError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NETWORK"
      | "UNAUTHORIZED"
      | "INVALID_JSON"
      | "INVALID_RESPONSE"
      | "HTTP"
  ) {
    super(message);
    this.name = "HubExportError";
  }
}

export async function fetchHubExportBundle(
  token: string,
  baseUrl: string
): Promise<HubExportBundle> {
  const base = baseUrl.replace(/\/$/, "");
  const url = `${base}/hub/export/datasets/`;

  let res: Response;
  try {
    res = await fetch(url, { headers: authHeaders(token) });
  } catch {
    throw new HubExportError("Network error while exporting.", "NETWORK");
  }

  const text = await res.text();
  let body: { success?: boolean; data?: HubExportBundle; message?: string };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    if (res.status === 401 || res.status === 403) {
      throw new HubExportError("Not authorized to export hub data.", "UNAUTHORIZED");
    }
    if (!res.ok) {
      throw new HubExportError(`Export failed (${res.status}).`, "HTTP");
    }
    throw new HubExportError("Server returned non-JSON response.", "INVALID_JSON");
  }

  if (res.status === 401 || res.status === 403) {
    throw new HubExportError(
      body.message || "Not authorized to export hub data.",
      "UNAUTHORIZED"
    );
  }

  if (!res.ok) {
    throw new HubExportError(
      body.message || `Export failed (${res.status}).`,
      "HTTP"
    );
  }

  if (!body.success || !body.data) {
    throw new HubExportError(
      body.message || "Invalid export response from server.",
      "INVALID_RESPONSE"
    );
  }

  const d = body.data;
  return {
    exported_at: d.exported_at,
    spaces: Array.isArray(d.spaces) ? d.spaces : [],
    registrations: Array.isArray(d.registrations) ? d.registrations : [],
    check_ins: Array.isArray(d.check_ins) ? d.check_ins : [],
    blocked_date_ranges: Array.isArray(d.blocked_date_ranges)
      ? d.blocked_date_ranges
      : [],
  };
}

function csvEscape(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normalizeRow(
  row: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of keys) {
    o[k] = row[k] ?? "";
  }
  return o;
}

function rowsToCsv(
  rows: Record<string, unknown>[],
  keys: readonly string[]
): string {
  const normalized = rows.map((r) => normalizeRow(r, keys));
  const header = keys.map((k) => csvEscape(k)).join(",");
  if (normalized.length === 0) {
    return header;
  }
  const body = normalized
    .map((r) => keys.map((k) => csvEscape(r[k])).join(","))
    .join("\n");
  return [header, body].join("\n");
}

function stampFrom(iso: string): string {
  try {
    return iso.slice(0, 19).replace(/[:T]/g, "-");
  } catch {
    return String(Date.now());
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadHubJson(bundle: HubExportBundle) {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const stamp = stampFrom(bundle.exported_at);
  downloadBlob(blob, `hub-export-${stamp}.json`);
}

export async function downloadHubCsvZip(bundle: HubExportBundle) {
  const zip = new JSZip();
  const bom = "\uFEFF";

  zip.file(
    "spaces.csv",
    bom + rowsToCsv(bundle.spaces, SPACE_KEYS as unknown as string[])
  );
  zip.file(
    "registrations.csv",
    bom + rowsToCsv(bundle.registrations, REGISTRATION_KEYS as unknown as string[])
  );
  zip.file(
    "check_ins.csv",
    bom + rowsToCsv(bundle.check_ins, CHECK_IN_KEYS as unknown as string[])
  );
  zip.file(
    "blocked_date_ranges.csv",
    bom +
      rowsToCsv(
        bundle.blocked_date_ranges,
        BLOCKED_KEYS as unknown as string[]
      )
  );

  const stamp = stampFrom(bundle.exported_at);
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `hub-export-${stamp}.zip`);
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((wch) => ({ wch }));
}

function sheetFromKeys(
  rows: Record<string, unknown>[],
  keys: readonly string[],
  emptyLabel: string
) {
  const normalized = rows.map((r) => normalizeRow(r, keys));
  if (normalized.length === 0) {
    return XLSX.utils.json_to_sheet([{ info: emptyLabel }]);
  }
  return XLSX.utils.json_to_sheet(normalized);
}

export function downloadHubSpreadsheet(bundle: HubExportBundle) {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Ethereum Hub export",
    Subject: "Hub datasets export",
    CreatedDate: new Date(bundle.exported_at),
  };

  const wsInfo = XLSX.utils.json_to_sheet([
    { field: "exported_at", value: bundle.exported_at },
  ]);
  setColWidths(wsInfo, [16, 36]);
  XLSX.utils.book_append_sheet(wb, wsInfo, "Export info");

  const wsReg = sheetFromKeys(
    bundle.registrations,
    REGISTRATION_KEYS,
    "No registrations"
  );
  setColWidths(wsReg, [6, 20, 28, 14, 24, 32, 12, 20, 12, 24, 14, 12, 10, 20, 20]);
  XLSX.utils.book_append_sheet(wb, wsReg, "Registrations");

  const wsCi = sheetFromKeys(bundle.check_ins, CHECK_IN_KEYS, "No check-ins");
  setColWidths(wsCi, [6, 14, 20, 28, 14, 8, 18, 12, 20, 20, 24, 24, 20, 20]);
  XLSX.utils.book_append_sheet(wb, wsCi, "Check-ins");

  const wsSp = sheetFromKeys(bundle.spaces, SPACE_KEYS, "No spaces");
  setColWidths(wsSp, [6, 24, 14, 16, 12, 20, 20]);
  XLSX.utils.book_append_sheet(wb, wsSp, "Spaces");

  const wsBd = sheetFromKeys(
    bundle.blocked_date_ranges,
    BLOCKED_KEYS,
    "No blocked ranges"
  );
  setColWidths(wsBd, [6, 14, 14, 36, 12, 20, 20]);
  XLSX.utils.book_append_sheet(wb, wsBd, "Blocked dates");

  const stamp = stampFrom(bundle.exported_at);
  XLSX.writeFile(wb, `hub-export-${stamp}.xlsx`);
}

export function hubExportToastMessage(err: unknown): string {
  if (err instanceof HubExportError) {
    if (err.code === "UNAUTHORIZED") {
      return "You don't have permission to export hub data.";
    }
    if (err.code === "NETWORK") {
      return "Network error. Check your connection and try again.";
    }
    if (err.code === "INVALID_JSON") {
      return "Unexpected response from server.";
    }
    return err.message;
  }
  return "Could not export hub data. Try again.";
}
