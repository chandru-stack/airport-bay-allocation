import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { useAuth } from "../../auth/authContext";

const API_BASE = "/api/aocc";

interface TimelineEvent {
  id: number;
  timestamp: string;
  type: string;
  flight?: string;
  bay?: string;
  actor: string;
  source: string;
  isSystem: boolean;
}
export default function TimelinePage() {

  const { token } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filterFlight, setFilterFlight] = useState("");
  const [filterBay, setFilterBay] = useState("");
  const [filterActor, setFilterActor] = useState("");

 useEffect(() => {

  if (!token) return;

  fetch("http://localhost:5000/api/aocc/events", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(data => {

      const mapped = Array.isArray(data)
        ? data.map((row: any) => ({
            id: row.id,
            timestamp: row.timestamp,
            type: row.type,
            flight: row.payload?.flight_number || "-",
            bay: row.payload?.bay_id || "-",
            actor: row.username || "System",
            source: row.payload?.source || "System",
            isSystem: !row.username
          }))
        : [];

      setEvents(mapped);
    })
    .catch(err => {
      console.error("Timeline fetch error:", err);
      setEvents([]);
    });

}, [token]);

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      "ON-BLOCK": "#10b981",
      "OFF-BLOCK": "#6366f1",
      ALLOCATION: "#1E88E5",
      EMERGENCY: "#dc2626",
      REASSIGNMENT: "#f59e0b",
      "BAY-BLOCKED": "#6b7280"
    };
    return colors[type] || "#6b7280";
  };

  const getEventLabel = (type: string) => {
    const labels: Record<string, string> = {
      "ON-BLOCK": "ON-BLOCK",
      "OFF-BLOCK": "OFF-BLOCK",
      ALLOCATION: "Bay Allocation Confirmed",
      EMERGENCY: "Emergency Override Activated",
      REASSIGNMENT: "Bay Reassigned",
      "BAY-BLOCKED": "Bay Blocked for Maintenance"
    };
    return labels[type] || type;
  };

  const filteredEvents = events.filter(event => {
    if (filterFlight && event.flight && !event.flight.includes(filterFlight)) return false;
    if (filterBay && event.bay && !event.bay.includes(filterBay)) return false;
    if (filterActor && !event.actor.toLowerCase().includes(filterActor.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/aocc" className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft size={20} style={{ color: "#1E88E5" }} />
          </Link>
          <h1 className="text-2xl font-semibold" style={{ color: "#1E88E5" }}>
            Event Timeline
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold mb-1 block">Filter by Flight</label>
            <input
              type="text"
              placeholder="Enter flight number"
              className="w-full border rounded px-3 py-2"
              style={{ borderColor: "#1E88E5" }}
              value={filterFlight}
              onChange={(e) => setFilterFlight(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Filter by Bay</label>
            <input
              type="text"
              placeholder="Enter bay ID"
              className="w-full border rounded px-3 py-2"
              style={{ borderColor: "#1E88E5" }}
              value={filterBay}
              onChange={(e) => setFilterBay(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Filter by Actor</label>
            <input
              type="text"
              placeholder="Enter actor name"
              className="w-full border rounded px-3 py-2"
              style={{ borderColor: "#1E88E5" }}
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterFlight("");
                setFilterBay("");
                setFilterActor("");
              }}
              className="w-full px-4 py-2 rounded border"
              style={{ borderColor: "#6b7280", color: "#6b7280" }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Table */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full">
          <thead style={{ backgroundColor: "#1E88E5" }}>
            <tr className="text-white text-left">
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Flight</th>
              <th className="px-4 py-3 font-semibold">Bay</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr
                key={event.id}
                className="border-b hover:bg-gray-50"
                style={{ borderColor: "#e5e7eb" }}
              >
                <td className="px-4 py-3 font-mono text-sm">{event.timestamp}</td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getEventColor(event.type) }}
                    />
                    <span
                      className="font-semibold"
                      style={{ color: getEventColor(event.type) }}
                    >
                      {getEventLabel(event.type)}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3 font-semibold">{event.flight || "—"}</td>

                <td className="px-4 py-3">
                  {event.bay ? (
                    <Badge
                      variant="outline"
                      style={{ borderColor: "#1E88E5", color: "#1E88E5" }}
                    >
                      {event.bay}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{event.actor}</span>
                    {event.isSystem && (
                      <Badge variant="outline" className="text-xs">
                        SYSTEM
                      </Badge>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <Badge
                    style={{
                      backgroundColor:
                        event.source === "System"
                          ? "#6b7280"
                          : event.source === "AOCC"
                          ? "#1E88E5"
                          : "#10b981",
                      color: "white"
                    }}
                  >
                    {event.source}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No events match the current filters
        </div>
      )}

      {/* Timeline Statistics */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="border rounded-lg px-4 py-3 text-center" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-sm text-gray-600 mb-1">Total Events</div>
          <div className="text-2xl font-semibold" style={{ color: "#1E88E5" }}>
            {events.length}
          </div>
        </div>

        <div className="border rounded-lg px-4 py-3 text-center" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-sm text-gray-600 mb-1">System Events</div>
          <div className="text-2xl font-semibold" style={{ color: "#6b7280" }}>
            {events.filter(e => e.isSystem).length}
          </div>
        </div>

        <div className="border rounded-lg px-4 py-3 text-center" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-sm text-gray-600 mb-1">Manual Actions</div>
          <div className="text-2xl font-semibold" style={{ color: "#1E88E5" }}>
            {events.filter(e => !e.isSystem).length}
          </div>
        </div>

        <div className="border rounded-lg px-4 py-3 text-center" style={{ borderColor: "#e5e7eb" }}>
          <div className="text-sm text-gray-600 mb-1">Emergency Events</div>
          <div className="text-2xl font-semibold" style={{ color: "#dc2626" }}>
            {events.filter(e => e.type === "EMERGENCY").length}
          </div>
        </div>
      </div>
    </div>
  );
}