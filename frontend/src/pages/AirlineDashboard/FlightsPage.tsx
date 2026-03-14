import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { api, fmtDT, toLocalDT } from "../../lib/storage";
/* ================= TYPES ================= */

type MovementType = "A" | "D" | "ALL";

interface Filters {
  from: string;
  to: string;
  movement: MovementType;
  flight: string;
}

interface Notice {
  type: "success" | "error";
  msg: string;
}

interface Flight {
  id: string;
  airlineCode?: string;
  flightNumber?: string;
  originIata?: string;
  destinationIata?: string;
  movement?: "A" | "D";
  aircraftType?: string;
  scheduledTime?: string | null;
  estimatedTime?: string | null;
  flightDate?: string;
  status?: string;
  bay?: string | null;
}

interface BayRequest {
  requestId: string;
  flightId: string;
  priorityLevel?: number;
  requestedBay?: string | null;
  reason?: string;
  status?: string;
  createdAt?: string;
}

interface Priority {
  priority_level?: number;
  level?: number;
  priorityLevel?: number;
  priority_name?: string;
  name?: string;
  label?: string;
  priority_code?: string;
  code?: string;
}

interface AircraftType {
  aircraft_type_code: string;
  aircraft_name?: string;
  icao_category?: string;
}

interface Bay {
  bay_id: string;
  bay_name?: string;
  bay_type?: string;
}

function isoFromDateAndTime(dateStr: string, timeStr: string): string | null {
  if (!dateStr || !timeStr) return null;
  // Interpret as local time; convert to ISO for API.
  const d = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}


// Compatibility-only bays list (no availability window)
const COMPAT_START = "1970-01-01T00:00:00.000Z";
const COMPAT_END = "1970-01-01T00:01:00.000Z";


function getPriorityLabel(priorities: Priority[], level?: number) {
  const lvl = Number(level);
  const found = (priorities || []).find(
    (p) => Number(p.priority_level ?? p.level ?? p.priorityLevel) === lvl
  );
  const name =
    found?.priority_name ||
    found?.name ||
    found?.label ||
    found?.priority_code ||
    found?.code;
  return name ? `${name}` : `P${lvl}`;
}

export default function FlightsPage() {
  const [filters, setFilters] = useState<Filters>({
    from: "",
    to: "",
    movement: "ALL",
    flight: "",
  });

  const [applied, setApplied] = useState<Filters>({
    from: "",
    to: "",
    movement: "ALL",
    flight: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bayReqByFlight, setBayReqByFlight] = useState<Record<string, BayRequest>>({});
  const [priorities, setPriorities] = useState<Priority[]>([]);

  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Flight | null>(null);


  const [notice, setNotice] = useState<Notice | null>(null); // { type: "success" | "error", msg: string }

  // ✅ Removed 'bay' from editForm (no allocated bay in modal)
  const [editForm, setEditForm] = useState<{
  flightDate: string;
  movement: "A" | "D";
  aircraftType: string;
  status: string;
  scheduledTime: string;
  estimatedTime: string;
}>({
  flightDate: "",
  movement: "A",
  aircraftType: "",
  status: "SCHEDULED",
  scheduledTime: "",
  estimatedTime: "",
});

  const [aircraftTypes, setAircraftTypes] = useState<AircraftType[]>([]);
  const [availableBays, setAvailableBays] = useState<Bay[]>([]);

  const [reqId, setReqId] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState({
    priorityLevel: 3,
    requestedBay: "",
    reason: "",
  });

  // Load aircraft types from DB (same source as CreateFlightPage)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ats = await api.getAircraftTypes();
        if (!alive) return;
        setAircraftTypes(Array.isArray(ats) ? ats : []);
      } catch (e) {
        console.error("Aircraft types load error:", e);
        setAircraftTypes([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load COMPATIBLE bays for the selected aircraft type (AOC will validate availability)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!editOpen || !reqId) {
          if (alive) setAvailableBays([]);
          return;
        }
        if (!editForm.aircraftType) {
          if (alive) setAvailableBays([]);
          return;
        }

        // We reuse /api/bays/available because backend exposes compatibility logic there.
        // We pass a "neutral" time window to avoid filtering by allocations; AOC will handle final availability.
        const bays = await api.getAvailableBays({
          aircraftType: editForm.aircraftType,
          start: COMPAT_START,
          end: COMPAT_END,
        });

        if (!alive) return;
        const arr = Array.isArray(bays) ? bays : [];
        setAvailableBays(arr);

        // If currently selected preferred bay isn't compatible, clear it
        if (reqForm.requestedBay && !arr.some((b) => b.bay_id === reqForm.requestedBay)) {
          setReqForm((p) => ({ ...p, requestedBay: "" }));
        }
      } catch (e) {
        console.error("Compatible bays load error:", e);
        if (alive) setAvailableBays([]);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen, reqId, editForm.aircraftType]);


  async function refresh(useFilters: Filters = applied) {
    setLoading(true);
    try {
      const [fl, reqs] = await Promise.all([
  api.listFlights({
    from: useFilters.from,
    to: useFilters.to,
    movement: useFilters.movement,
  }) as Promise<Flight[]>,
  api.listBayRequests() as Promise<BayRequest[]>,
]);

      const map: Record<string, BayRequest> = {};
      for (const r of reqs) {
        const prev = map[r.flightId];
        if (!prev || (prev.createdAt || "") < (r.createdAt || "")) map[r.flightId] = r;
      }

      setFlights(Array.isArray(fl) ? fl : []);
      setBayReqByFlight(map);
    } catch (e) {
      console.error("Flights load error:", e);
      alert(e?.message || "Failed to load flights");
      setFlights([]);
      setBayReqByFlight({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied.from, applied.to, applied.movement, applied.flight]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const prs = await api.getPriorities();
        if (!alive) return;
        setPriorities(Array.isArray(prs) ? prs : []);
      } catch {
        if (alive) setPriorities([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function openEditAll(f: Flight) {
    setEditing(f);

    const schedLocal = toLocalDT(f.scheduledTime ?? undefined);
const estLocal = toLocalDT(f.estimatedTime ?? undefined);
    const derivedDate = (schedLocal || "").slice(0, 10) || (f.flightDate || "").slice(0, 10);

    setEditForm({
      flightDate: derivedDate,
      movement: f.movement || "A",
      aircraftType: f.aircraftType || "",
      status: (f.status || "SCHEDULED"),
      scheduledTime: (schedLocal || "").slice(11, 16),
      estimatedTime: (estLocal || "").slice(11, 16),
    });

    const r = bayReqByFlight[f.id];
    if (r) {
      setReqId(r.requestId);
      setReqForm({
        priorityLevel: Number(r.priorityLevel ?? 3),
        requestedBay: r.requestedBay || "",
        reason: r.reason || "",
      });
    } else {
      setReqId(null);
      setReqForm({
        priorityLevel: 3,
        requestedBay: "",
        reason: "",
      });
    }

    setEditOpen(true);
  }

  async function saveEditAll() {
    try {
      if (!editing?.id) return;

      if (!editForm.flightDate) return alert("Flight date is required");
      if (!editForm.scheduledTime) return alert("Scheduled time is required");

      const scheduledISO = isoFromDateAndTime(editForm.flightDate, editForm.scheduledTime);
      if (!scheduledISO) return alert("Invalid scheduled date/time");

      const estimatedISO = editForm.estimatedTime
        ? isoFromDateAndTime(editForm.flightDate, editForm.estimatedTime)
        : null;
      if (editForm.estimatedTime && !estimatedISO) return alert("Invalid estimated date/time");

      // ✅ update flight
      await api.updateFlight(editing.id, {
        flight_date: editForm.flightDate,
        movement_type: editForm.movement,
        aircraft_type_code: editForm.aircraftType,
        operational_status: editForm.status,
        scheduled_time: scheduledISO,
        estimated_time: estimatedISO,
      });

      // ✅ update request if exists
      if (reqId) {
        if (!reqForm.reason?.trim()) return alert("Reason is required for Bay Request");
        await api.updateBayRequest(reqId, {
          priorityLevel: Number(reqForm.priorityLevel),
          requestedBay: reqForm.requestedBay?.trim() ? reqForm.requestedBay.trim() : null,
          reason: reqForm.reason,
        });
      }

      setEditOpen(false);
      setEditing(null);
      setReqId(null);

      await refresh();
      setNotice({ type: "success", msg: "Updated successfully." });
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e) {
      const msg = e?.message || "Failed to update";
      setNotice({ type: "error", msg });
      window.setTimeout(() => setNotice(null), 3500);
    }
  }

  async function deleteFlight() {
    try {
      if (!editing?.id) return;
      const ok = window.confirm(
        `Delete flight ${editing.airlineCode || ""}-${editing.flightNumber || ""}? This cannot be undone.`
      );
      if (!ok) return;

      await api.deleteFlight(editing.id);

      setEditOpen(false);
      setEditing(null);
      setReqId(null);

      await refresh();
      setNotice({ type: "success", msg: "Flight deleted successfully." });
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e) {
      const msg = e?.message || "Failed to delete flight";
      setNotice({ type: "error", msg });
      window.setTimeout(() => setNotice(null), 3500);
    }
  }

  function displayDate(f: Flight) {
    const fromSched = toLocalDT(f.scheduledTime);
    const d = (fromSched || "").slice(0, 10) || (f.flightDate || "").slice(0, 10);
    return d || "-";
  }

const rows = useMemo(() => {
    const base = flights || [];
    const q = (applied.flight || "").trim().toUpperCase();
    if (!q) return base;

    return base.filter((f) => {
      const flightNo = `${f.airlineCode || ""}${f.flightNumber || ""}`.toUpperCase();
      const flightNoDash = `${f.airlineCode || ""}-${f.flightNumber || ""}`.toUpperCase();
      const onlyNum = `${f.flightNumber || ""}`.toUpperCase();
      return flightNo.includes(q) || flightNoDash.includes(q) || onlyNum.includes(q);
    });
  }, [flights, applied.flight]);

  return (
    <div className="section">
      {notice && (
        <div
          className={`mb-4 rounded-xl border p-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
          role="status"
          aria-live="polite"
        >
          {notice.msg}
        </div>
      )}
      <Card
        title="Flights"
        subtitle="Filter flights and update schedules, aircraft, requests and allocations"
        right={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setApplied({ ...filters })}>
              Search
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                const reset: Filters = { from: "", to: "", movement: "ALL", flight: "" };
                setFilters(reset);
                setApplied(reset);
              }}
            >
              Reset
            </Button>

            <Button variant="ghost" onClick={() => refresh()}>
              Refresh
            </Button>
          </div>
        }
      >
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <div className="label mb-2">From (Origin IATA)</div>
            <input
              className="input"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value.toUpperCase() }))}
              placeholder="e.g. IXM"
            />
          </div>

          <div>
            <div className="label mb-2">To (Destination IATA)</div>
            <input
              className="input"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value.toUpperCase() }))}
              placeholder="e.g. DEL"
            />
          </div>

          <div>
            <div className="label mb-2">Movement</div>
            <select
              className="select"
              value={filters.movement}
              onChange={(e) =>
  setFilters((p) => ({
    ...p,
    movement: e.target.value as MovementType,
  }))
}
            >
              <option value="ALL">All</option>
              <option value="A">Arrival</option>
              <option value="D">Departure</option>
            </select>
          </div>

          <div>
            <div className="label mb-2">Flight Number</div>
            <input
              className="input"
              value={filters.flight}
              onChange={(e) => setFilters((p) => ({ ...p, flight: e.target.value.toUpperCase() }))}
              placeholder="e.g. AI-340 or 340"
            />
            <div className="mt-2 text-xs text-slate-500">
              Applied: <b>{applied.from || "-"}</b> → <b>{applied.to || "-"}</b> ({applied.movement})
              {" • "}
              Flight: <b>{applied.flight || "-"}</b>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Flight</th>
                <th className="th">Date</th>
                <th className="th">Movement</th>
                <th className="th">Aircraft</th>
                <th className="th">Scheduled</th>
                <th className="th">Estimated</th>
                <th className="th">Bay Request</th>
                <th className="th">Allocated Bay</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="td text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="td text-center text-slate-500">
                    No flights found.
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((f) => {
                  const r = bayReqByFlight[f.id];
                  const date = displayDate(f);
                  const movementLabel =
                    f.movement === "A" ? "Arrival" : f.movement === "D" ? "Departure" : f.movement;

                  return (
                    <tr key={f.id} className="tr">
                      <td className="td">
                        <div className="font-semibold text-slate-900">
                          {f.airlineCode}-{f.flightNumber}
                        </div>
                        <div className="text-xs text-slate-500">
                          {f.originIata} → {f.destinationIata}
                        </div>
                      </td>

                      <td className="td">{date}</td>

                      <td className="td">
                        <Badge tone={f.movement === "A" ? "ARRIVED" : "DEPARTED"}>
                          {movementLabel}
                        </Badge>
                      </td>

                      <td className="td">
                        {f.aircraftType || <span className="text-slate-400">—</span>}
                      </td>

                      <td className="td">{fmtDT(f.scheduledTime)}</td>
                      <td className="td">{fmtDT(f.estimatedTime)}</td>

                      <td className="td">
                        {!r ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge tone={r.status}>{r.status}</Badge>
                              <Badge tone={`P${Number(r.priorityLevel ?? 3)}`}>
                                {getPriorityLabel(priorities, r.priorityLevel)}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-600">
                              {r.requestedBay ? `Preferred: ${r.requestedBay}` : "Preferred: Any"}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="td">
                        {f.bay ? (
                          <span className="font-semibold text-slate-900">{f.bay}</span>
                        ) : (
                          <span className="text-slate-400">Not allocated</span>
                        )}
                      </td>

                      <td className="td text-right">
                        <Button variant="secondary" onClick={() => openEditAll(f)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ✅ Modal (NO Allocated Bay input) + ✅ Flight Number shown like AI-340 */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
          setReqId(null);
        }}
        title={editing ? `Edit • ${editing.airlineCode}-${editing.flightNumber}` : "Edit"}
        size="md"
        footer={
          <>
            <Button variant="danger" onClick={deleteFlight}>
              Delete
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
                setReqId(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEditAll}>Save Changes</Button>
          </>
        }
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 6 }}>
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3 text-sm text-slate-700">
              <b>Flight:</b> Update flight date, movement, aircraft, schedule.
            </div>

            {/* ✅ Add Flight Number field like AI-340 */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-3">
                <div className="label mb-1">Flight Number</div>
                <input
                  className="input"
                  value={
                    editing ? `${editing.airlineCode || ""}-${editing.flightNumber || ""}` : ""
                  }
                  disabled
                />
              </div>

              <div>
                <div className="label mb-1">Flight Date</div>
                <input
                  className="input"
                  type="date"
                  value={editForm.flightDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, flightDate: e.target.value }))}
                />
              </div>

              <div>
                <div className="label mb-1">Movement</div>
                <select
                  className="select"
                  value={editForm.movement}
                  onChange={(e) =>
  setEditForm((p) => ({
    ...p,
    movement: e.target.value as "A" | "D",
  }))
}
                >
                  <option value="A">Arrival</option>
                  <option value="D">Departure</option>
                </select>
              </div>

              
              <div>
                <div className="label mb-1">Status</div>
                <select
                  className="select"
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="DIVERTED">Diverted</option>
                  <option value="ARRIVED">Arrived</option>
                  <option value="DEPARTED">Departed</option>
                </select>
              </div>

<div>
                <div className="label mb-1">Aircraft Type</div>
                <select
                  className="select"
                  value={editForm.aircraftType}
                  onChange={(e) => setEditForm((p) => ({ ...p, aircraftType: e.target.value }))}
                >
                  <option value="">Select aircraft type</option>
                  {aircraftTypes.map((t) => (
                    <option key={t.aircraft_type_code} value={t.aircraft_type_code}>
                      {t.aircraft_type_code}
                      {t.aircraft_name ? ` - ${t.aircraft_name}` : ""}
                      {t.icao_category ? ` (Cat ${t.icao_category})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label mb-1">Scheduled Time *</div>
                <input
                  className="input"
                  type="time"
                  value={editForm.scheduledTime}
                  onChange={(e) => setEditForm((p) => ({ ...p, scheduledTime: e.target.value }))}/>
              </div>

              <div>
                <div className="label mb-1">Estimated Time</div>
                <input
                  className="input"
                  type="time"
                  value={editForm.estimatedTime}
                  onChange={(e) => setEditForm((p) => ({ ...p, estimatedTime: e.target.value }))}/>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <b>Bay Request:</b>{" "}
              {reqId
                ? "Edit priority, preferred bay and reason."
                : "No request exists for this flight."}
            </div>

            <div className={`grid grid-cols-1 gap-3 md:grid-cols-3 ${!reqId ? "opacity-60" : ""}`}>
              <div>
                <div className="label mb-1">Priority</div>
                <select
                  className="select"
                  value={reqForm.priorityLevel}
                  onChange={(e) =>
                    setReqForm((p) => ({ ...p, priorityLevel: Number(e.target.value) }))
                  }
                  disabled={!reqId}
                >
                  <option value={0}>P0</option>
                  <option value={1}>P1</option>
                  <option value={2}>P2</option>
                  <option value={3}>P3</option>
                  <option value={4}>P4</option>
                </select>
              </div>

              <div>
                <div className="label mb-1">Preferred Bay (compatible)</div>
                <select
                  className="select"
                  value={reqForm.requestedBay}
                  onChange={(e) => setReqForm((p) => ({ ...p, requestedBay: e.target.value }))}
                  disabled={!reqId}
                >
                  <option value="">Any available bay</option>
                  {availableBays.map((b) => (
                    <option key={b.bay_id} value={b.bay_id}>
                      {b.bay_id}{b.bay_name ? ` - ${b.bay_name}` : ""} ({b.bay_type})
                    </option>
                  ))}
                </select>
                {!reqId ? null : (
                  <div className="mt-1 text-xs text-slate-500">
                    Bays shown are filtered by aircraft type (compatibility).
                  </div>
                )}
              </div>
              <div className="md:col-span-3">
                <div className="label mb-1">Reason *</div>
                <textarea
                  className="input"
                  style={{ minHeight: 72 }}
                  value={reqForm.reason}
                  onChange={(e) => setReqForm((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Explain why bay is needed / priority reason"
                  disabled={!reqId}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}


