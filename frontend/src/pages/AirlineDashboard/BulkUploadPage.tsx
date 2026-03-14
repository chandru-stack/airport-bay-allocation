import { useMemo, useState, ChangeEvent } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { api } from "../../lib/storage";

/* ========================= */
/* Types */
/* ========================= */

interface NormalizedRow {
  airlineCode: string;
  flightNumber: string;
  movement: string;
  otherAirportIata: string;
  flightDate: string;
  scheduledTime: string | null;
  estimatedTime: string | null;
  aircraftType: string;
  priority: string;
  requestedBay: string;
  reason: string;
}

type GenericRow = Record<string, any>;

/* ========================= */
/* Utility Helpers */
/* ========================= */

function cleanKey(k: any): string {
  return String(k || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function pick(row: GenericRow, keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function toUpper(v: any): string {
  if (v === undefined || v === null) return "";
  return String(v).trim().toUpperCase();
}

function pad2(n: number | string): string {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}

function isValidYMD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

function normalizeDateCell(v: any): string {
  if (!v) return "";

  const s = String(v).trim();
  if (isValidYMD(s)) return s;

  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${v.getFullYear()}-${pad2(v.getMonth() + 1)}-${pad2(v.getDate())}`;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  return "";
}

function normalizeTimeCell(v: any): string {
  if (v === undefined || v === null || String(v).trim() === "") return "";

  const s = String(v).trim();
  const hhmm = s.match(/^(\d{1,2}):(\d{2})/);
  if (hhmm) return `${pad2(hhmm[1])}:${hhmm[2]}`;

  if (typeof v === "number" && isFinite(v)) {
    const totalMinutes = Math.round(v * 24 * 60);
    const hh = Math.floor(totalMinutes / 60) % 24;
    const mm = totalMinutes % 60;
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  return "";
}

function normalizeDateTimeISO({
  flightDate,
  dateTimeOrTime,
}: {
  flightDate: string;
  dateTimeOrTime: any;
}): string | null {
  if (!dateTimeOrTime) return null;
  const raw = String(dateTimeOrTime).trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && /[T\s]\d{1,2}:\d{2}/.test(raw)) {
    return parsed.toISOString();
  }

  const m = raw.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (m) {
    const d = new Date(`${m[1]}T${pad2(m[2])}:${m[3]}:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const t = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (t && flightDate) {
    const d = new Date(`${flightDate}T${pad2(t[1])}:${t[2]}:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  return null;
}

function normalizePriority(v: any): string {
  if (!v) return "P3";
  const s = String(v).trim().toUpperCase();
  if (/^P[0-4]$/.test(s)) return s;
  const n = Number(s);
  if (!Number.isNaN(n) && n >= 0 && n <= 4) return `P${n}`;
  return "P3";
}

function normalizeRow(rawRow: GenericRow): NormalizedRow {
  const row: GenericRow = {};
  for (const [k, v] of Object.entries(rawRow || {})) {
    row[cleanKey(k)] = v;
  }

  const airlineCode = toUpper(pick(row, ["airline_code", "airlinecode", "airline"]));
  const flightNumber = toUpper(pick(row, ["flight_number", "flightnumber", "flight_no"]));
  const movement = toUpper(pick(row, ["movement_type", "movement"])) || "A";
  const otherAirportIata = toUpper(pick(row, ["other_airport_iata", "origin", "destination"])) || "";
  const aircraftType = toUpper(pick(row, ["aircraft_type_code", "aircrafttype"]));

  const flightDate = normalizeDateCell(pick(row, ["flight_date", "date"]));
  const scheduledRaw = pick(row, ["scheduled_time", "scheduled"]);
  const estimatedRaw = pick(row, ["estimated_time", "estimated"]);

  const scheduledISO =
    scheduledRaw instanceof Date
      ? scheduledRaw.toISOString()
      : normalizeDateTimeISO({ flightDate, dateTimeOrTime: scheduledRaw });

  const estimatedISO =
    estimatedRaw instanceof Date
      ? estimatedRaw.toISOString()
      : normalizeDateTimeISO({ flightDate, dateTimeOrTime: estimatedRaw });

  return {
    airlineCode,
    flightNumber,
    movement,
    otherAirportIata,
    flightDate,
    scheduledTime: scheduledISO,
    estimatedTime: estimatedISO,
    aircraftType,
    priority: normalizePriority(pick(row, ["request_priority", "priority"])),
    requestedBay: toUpper(pick(row, ["preferred_bay_id", "requestedbay"])) || "",
    reason: String(pick(row, ["reason"]) || "").trim(),
  };
}

/* ========================= */
/* Component */
/* ========================= */

export default function BulkUploadPage() {
  const systemAirport = api.getSystemAirport();

  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<NormalizedRow[]>([]);
  const [parseError, setParseError] = useState<string>("");
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  const headers = useMemo(() => {
    if (!parsed.length) return [];
    return Object.keys(parsed[0] || {});
  }, [parsed]);

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    setUploadMsg("");
    setParseError("");
    setParsed([]);

    const f = e.target.files?.[0] || null;
    setFile(f);
    if (!f) return;

    try {
      let rawRows: GenericRow[] = [];

      if (f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls")) {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rawRows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as GenericRow[];
      } else {
        const text = await f.text();
        const parsedCsv = Papa.parse(text, { header: true, skipEmptyLines: true });
        rawRows = parsedCsv.data as GenericRow[];
      }

      const normalized = rawRows
        .map(normalizeRow)
        .filter((r) => r.flightNumber && r.scheduledTime && r.aircraftType);

      if (!normalized.length) {
        throw new Error("No valid rows found.");
      }

      setParsed(normalized);
    } catch (err: any) {
      setParseError(err?.message || "Parse error");
    }
  }

  async function upload() {
    if (!file || !parsed.length) return;

    setUploading(true);
    setUploadMsg("");

    try {
      let created = 0;
      let requested = 0;
      let failed = 0;

      for (const r of parsed) {
        try {
          const originIata = r.movement === "D" ? systemAirport : r.otherAirportIata;
          const destinationIata = r.movement === "A" ? systemAirport : r.otherAirportIata;

          const flight = await api.createFlight({
            airlineCode: r.airlineCode || null,
            flightNumber: r.flightNumber,
            movement: r.movement,
            originIata,
            destinationIata,
            scheduledTime: r.scheduledTime,
            estimatedTime: r.estimatedTime,
            aircraftType: r.aircraftType,
            status: "SCHEDULED",
            flightDate: r.flightDate,
          });

          created++;

          if (r.reason) {
            await api.requestBay({
              flightId: flight.id,
              priority: r.priority,
              requestedBay: r.requestedBay || null,
              reason: r.reason,
            });
            requested++;
          }
        } catch {
          failed++;
        }
      }

      setUploadMsg(`✅ Upload complete. Flights created: ${created}. Requests created: ${requested}. Failed: ${failed}.`);
    } catch (err: any) {
      setUploadMsg(`❌ Upload failed: ${err?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="section">
      <Card title="Bulk Upload Flights">
        <div className="space-y-4">
          <input type="file" accept=".csv,.xlsx,.xls" onChange={onPickFile} className="input" />

          {parseError && <div className="text-red-600">{parseError}</div>}
          {uploadMsg && <div className="text-slate-700">{uploadMsg}</div>}

          {!!parsed.length && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 20).map((r, idx) => (
                    <tr key={idx}>
                      {headers.map((h) => (
                        <td key={h} className="td">{String((r as any)[h] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button onClick={upload} disabled={uploading || !parsed.length}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </Card>
    </div>
  );
}