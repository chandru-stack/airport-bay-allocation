// airport-bay-ui/src/lib/storage.js
const BASE = "/api";
const SYSTEM_AIRPORT = "IXM";
const STORAGE_KEY = "aba_auth";

function getToken() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

// ---------- helpers ----------
async function jsonFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 160)}`);
  }

  if (!res.ok || (data && data.ok === false)) {
    const msg =
      (data && (data.error || data.message)) ||
      (res.status === 404
        ? "Route not found (check backend route mounting)"
        : `HTTP ${res.status}`);
    throw new Error(msg);
  }

  return data;
}

function normalizeList(resp, key) {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp[key])) return resp[key];
  if (resp && Array.isArray(resp.data)) return resp.data;
  if (resp && Array.isArray(resp.rows)) return resp.rows;
  return [];
}

export function fmtDT(val) {
  return val ? new Date(val).toLocaleString() : "-";
}

export function toLocalDT(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function mapFlight(r) {
  return {
    id: r.id ?? r.flight_id ?? r.flightId,
    airlineCode: r.airlineCode ?? r.airline_code,
    flightNumber: r.flightNumber ?? r.flight_number,
    movement: r.movement ?? r.movement_type,
    originIata: r.originIata ?? r.origin_airport_code,
    destinationIata: r.destinationIata ?? r.destination_airport_code,
    flightDate: r.flightDate ?? r.flight_date ?? null,
    scheduledTime: r.scheduledTime ?? r.scheduled_time,
    estimatedTime: r.estimatedTime ?? r.estimated_time,
    actualTime: r.actualTime ?? r.actual_time,
    aircraftType: r.aircraftType ?? r.aircraft_type_code,
    status: r.status ?? r.operational_status,
    priorityScore: r.priorityScore ?? r.priority_score ?? 0,
    bay: r.bay ?? r.bay_id ?? null,
  };
}

function mapRequest(r) {
  return {
    requestId: r.requestId ?? r.request_id,
    flightId: r.flightId ?? r.flight_id,
    requestedBay:
      r.requestedBay ?? r.requested_bay ?? r.preferred_bay_id ?? null,
    reason: r.reason ?? "",
    status: r.status ?? r.request_status ?? "PENDING",
    createdAt: r.createdAt ?? r.created_at,
    updatedAt: r.updatedAt ?? r.updated_at,
    priorityLevel: Number(r.priorityLevel ?? r.requested_priority_level ?? 3),
  };
}

function priorityToLevel(value) {
  const n = Number(value);
  if ([0, 1, 2, 3, 4].includes(n)) return n;

  const p = String(value || "P3").toUpperCase();
  if (p === "P0") return 0;
  if (p === "P1") return 1;
  if (p === "P2") return 2;
  if (p === "P4") return 4;
  return 3;
}

// ---------- API ----------
export const api = {
  getSystemAirport() {
    return SYSTEM_AIRPORT;
  },

  async getAirports(q = "") {
    const params = new URLSearchParams();
    if (q) params.set("q", q);

    const resp = await jsonFetch(
      `${BASE}/airports${params.toString() ? `?${params}` : ""}`
    );
    const rows = normalizeList(resp, "airports");

    return rows.map((a) => ({
      iata: a.iata || a.airport_code || a.code || a.airportCode,
      name: a.name || a.airport_name || a.airportName || "",
      city: a.city || "",
      country: a.country || "",
    }));
  },

  async getAirlines() {
    const resp = await jsonFetch(`${BASE}/airlines`);
    return normalizeList(resp, "airlines");
  },

  async getAircraftTypes() {
    const resp = await jsonFetch(`${BASE}/aircraft-types`);
    return normalizeList(resp, "aircraftTypes");
  },

  async getBayTypes() {
    const resp = await jsonFetch(`${BASE}/bays/types`);
    return Array.isArray(resp) ? resp : [];
  },

  async getPriorities() {
    const resp = await jsonFetch(`${BASE}/reference/priorities`);
    return Array.isArray(resp) ? resp : normalizeList(resp, "priorities");
  },

  async getAvailableBays({ aircraftType, start, end, bayType } = {}) {
    const params = new URLSearchParams();
    params.set("aircraftType", aircraftType);
    params.set("start", start);
    params.set("end", end);
    if (bayType) params.set("bayType", bayType);

    const resp = await jsonFetch(`${BASE}/bays/available?${params.toString()}`);
    return normalizeList(resp, "bays");
  },

  async listFlights({ from = "", to = "", movement = "ALL" } = {}) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (movement && movement !== "ALL") params.set("movement_type", movement);

    const resp = await jsonFetch(
      `${BASE}/flights${params.toString() ? `?${params}` : ""}`
    );
    const rows = normalizeList(resp, "flights");
    return rows.map(mapFlight);
  },

  async createFlight(payload) {
    const body = {
      airline_code: payload.airlineCode, // backend will override for AIRLINE role
      flight_number: payload.flightNumber,
      movement_type: payload.movement,
      flight_date:
        payload.flightDate ||
        new Date(payload.scheduledTime).toISOString().slice(0, 10),
      scheduled_time: payload.scheduledTime,
      estimated_time: payload.estimatedTime ?? null,
      aircraft_type_code: payload.aircraftType,
      origin_airport_code: payload.originIata,
      destination_airport_code: payload.destinationIata,
      operational_status: payload.status || "SCHEDULED",
      ...(payload.priorityScore !== undefined
        ? { priority_score: payload.priorityScore }
        : {}),
    };

    const resp = await jsonFetch(`${BASE}/flights`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return mapFlight(resp.flight || resp);
  },

  async updateFlight(flightId, patch) {
    const resp = await jsonFetch(`${BASE}/flights/${flightId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return mapFlight(resp.flight || resp);
  },

  async deleteFlight(flightId) {
    return jsonFetch(`${BASE}/flights/${flightId}`, { method: "DELETE" });
  },

  async listBayRequests() {
    const resp = await jsonFetch(`${BASE}/flight-requests`);
    const rows = normalizeList(resp, "requests");
    return rows.map(mapRequest);
  },

  async requestBay(payload) {
    const priorityInput =
      payload.priorityLevel !== undefined ? payload.priorityLevel : payload.priority;

    const body = {
      flight_id: payload.flightId,
      preferred_bay_id: payload.requestedBay ?? null,
      requested_extra_minutes: 0,
      requested_priority_level: priorityToLevel(priorityInput),
      reason: payload.reason || "",
    };

    const resp = await jsonFetch(`${BASE}/flight-requests`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return mapRequest(resp.request || resp);
  },

  async updateBayRequest(requestId, patch) {
    const body = {
      preferred_bay_id: patch.requestedBay ?? null,
      requested_priority_level: priorityToLevel(patch.priorityLevel),
      reason: patch.reason || "",
    };

    const resp = await jsonFetch(`${BASE}/flight-requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    return mapRequest(resp.request || resp);
  },
};
