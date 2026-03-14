import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { api, fmtDT } from "../../lib/storage";

/* ========================= */
/* Types */
/* ========================= */

interface Flight {
  id: string;
  airlineCode?: string;
  flightNumber?: string;
  movement?: string;
  originIata?: string;
  destinationIata?: string;
  scheduledTime?: string;
  estimatedTime?: string;
  aircraftType?: string;
  status?: string;
  operationalStatus?: string;
  operational_status?: string;
  bay?: string | null;
}

interface BayRequest {
  flightId?: string;
  createdAt?: string;
  status?: string;
  priorityLevel?: number;
  requestedBay?: string;
}

interface KPIState {
  totalFlights: number;
  delayed: number;
  pendingBayRequests: number;
  p1Requests: number;
}

/* ========================= */
/* Helpers */
/* ========================= */

function isDelayed(f: Flight): boolean {
  const s = String(
    f?.status || f?.operationalStatus || f?.operational_status || ""
  ).toUpperCase();

  if (s === "DELAYED") return true;

  try {
    if (f?.scheduledTime && f?.estimatedTime) {
      return (
        new Date(f.estimatedTime).getTime() >
        new Date(f.scheduledTime).getTime()
      );
    }
  } catch {}

  return false;
}

function buildLatestReqMap(reqs: BayRequest[]): Record<string, BayRequest> {
  const map: Record<string, BayRequest> = {};

  for (const r of reqs || []) {
    const fid = r.flightId;
    if (!fid) continue;

    const prev = map[fid];
    const prevTs = prev?.createdAt
      ? new Date(prev.createdAt).getTime()
      : 0;
    const curTs = r?.createdAt
      ? new Date(r.createdAt).getTime()
      : Date.now();

    if (!prev || curTs >= prevTs) map[fid] = r;
  }

  return map;
}

/* ========================= */
/* Component */
/* ========================= */

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIState>({
    totalFlights: 0,
    delayed: 0,
    pendingBayRequests: 0,
    p1Requests: 0,
  });

  const [flights, setFlights] = useState<Flight[]>([]);
  const [reqByFlight, setReqByFlight] = useState<Record<string, BayRequest>>(
    {}
  );

  const [filters, setFilters] = useState({
    movement: "ALL",
    flight: "",
  });

  const [applied, setApplied] = useState({
    movement: "ALL",
    flight: "",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);

        const [fl, reqs] = await Promise.all([
          api.listFlights({ from: "", to: "", movement: "ALL" }),
          api.listBayRequests(),
        ]);

        if (!alive) return;

        setFlights(fl || []);
        setReqByFlight(buildLatestReqMap(reqs || []));

        const totalFlights = Array.isArray(fl) ? fl.length : 0;
        const delayed = (fl || []).filter(isDelayed).length;

        const pendingBayRequests = (reqs || []).filter(
          (r: BayRequest) =>
            String(r?.status || "").toUpperCase() === "PENDING"
        ).length;

        const p1Requests = (reqs || []).filter(
          (r: BayRequest) => Number(r?.priorityLevel) === 1
        ).length;

        setKpis({
          totalFlights,
          delayed,
          pendingBayRequests,
          p1Requests,
        });
      } catch (e: any) {
        console.error("Dashboard load error:", e);
        setError(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();

    const t = setInterval(load, 20000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const rows = useMemo(() => {
    const base = flights || [];
    const q = (applied.flight || "").trim().toUpperCase();
    const mv = applied.movement || "ALL";

    return base.filter((f) => {
      if (
        mv !== "ALL" &&
        String(f?.movement || "").toUpperCase() !== mv
      )
        return false;

      if (!q) return true;

      const flightNo = `${f.airlineCode || ""}${
        f.flightNumber || ""
      }`.toUpperCase();

      const flightNoDash = `${f.airlineCode || ""}-${
        f.flightNumber || ""
      }`.toUpperCase();

      return (
        flightNo.includes(q) ||
        flightNoDash.includes(q) ||
        String(f.flightNumber || "")
          .toUpperCase()
          .includes(q)
      );
    });
  }, [flights, applied]);

  return (
    <div className="w-full space-y-8">
      {/* KPI CARDS */}
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Flights">
          <div className="text-4xl font-extrabold">
            {kpis.totalFlights}
          </div>
        </Card>

        <Card title="Delayed">
          <div className="text-4xl font-extrabold text-amber-600">
            {kpis.delayed}
          </div>
        </Card>

        <Card title="Pending Bay Requests">
          <div className="text-4xl font-extrabold">
            {kpis.pendingBayRequests}
          </div>
        </Card>

        <Card title="P1 Requests">
          <div className="text-4xl font-extrabold text-red-600">
            {kpis.p1Requests}
          </div>
        </Card>
      </div>

      {/* LIVE FLIGHTS */}
      <Card
        title="Live Flights"
        subtitle="Latest flight movements in the system"
        className="w-full"
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Flight</th>
                <th className="th">A/D</th>
                <th className="th">Origin</th>
                <th className="th">Destination</th>
                <th className="th">Scheduled</th>
                <th className="th">Estimated</th>
                <th className="th">Aircraft</th>
                <th className="th">Status</th>
                <th className="th">Bay Assigned</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="td text-center">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((f) => (
                  <tr key={f.id}>
                    <td className="td font-bold">
                      {f.airlineCode}-{f.flightNumber}
                    </td>
                    <td className="td">{f.movement}</td>
                    <td className="td">{f.originIata}</td>
                    <td className="td">{f.destinationIata}</td>
                    <td className="td">
                      {fmtDT(f.scheduledTime)}
                    </td>
                    <td className="td">
                      {fmtDT(f.estimatedTime)}
                    </td>
                    <td className="td">{f.aircraftType}</td>
                    <td className="td">
                      <Badge tone={f.status || "-"}>
                        {f.status || "-"}
                      </Badge>
                    </td>
                    <td className="td">
                      {f.bay || "Not Assigned"}
                    </td>
                  </tr>
                ))}

              {!loading && !rows.length && (
                <tr>
                  <td colSpan={9} className="td text-center">
                    No flights found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {error && (
        <div className="text-red-600 font-medium">{error}</div>
      )}
    </div>
  );
}