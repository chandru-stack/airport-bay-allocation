import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import {
  Building2,
  Clock,
  FileText,
  Radio,
  Truck,
  Plane,
  AlertTriangle
} from "lucide-react";
import { Badge } from "./components/ui/badge";

export default function Dashboard() {

  const [activeTab, setActiveTab] =
    useState<"arrivals" | "departures" | "all">("all");

  const [flights, setFlights] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [atcUnread, setAtcUnread] = useState(0);
  const [priorityCount, setPriorityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

useEffect(() => {

  if (!token) return; // 🚨 Prevent fetch if token not ready

  // ✅ FLIGHTS
  fetch("http://localhost:5000/api/aocc/flights", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then((data) => {
      setFlights(Array.isArray(data) ? data : []);
      setLoading(false);
    })
    .catch((err) => {
      console.error("FLIGHT FETCH ERROR:", err);
      setFlights([]);
      setLoading(false);
    });

  // ✅ ALERTS (events)
  fetch("http://localhost:5000/api/aocc/events", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => setAlerts(data || []))
    .catch(() => setAlerts([]));

  // ✅ ATC UNREAD COUNT
  fetch("http://localhost:5000/api/aocc/atc-messages", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      const unread = Array.isArray(data)
        ? data.filter((m: any) => !m.is_read).length
        : 0;
      setAtcUnread(unread);
    })
    .catch(() => setAtcUnread(0));

  // ✅ PRIORITY COUNT
  fetch("http://localhost:5000/api/aocc/flights", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      const priority = Array.isArray(data)
        ? data.filter((f: any) => f.priority_score > 0).length
        : 0;
      setPriorityCount(priority);
    })
    .catch(() => setPriorityCount(0));

}, [token]);
  const mappedFlights = Array.isArray(flights)
  ? flights.map((f: any) => ({
      id: f.flight_id,
      flightNumber: f.flight_number,
      airline: f.airline_code,
      aircraft: f.aircraft_type_code,
      origin: f.origin_airport_code,
      destination: f.destination_airport_code,
      scheduled: f.scheduled_time,
      estimated: f.estimated_time || "-",
      bay: f.bay_id,
      status: f.operational_status,
      icaoCategory: f.aircraft_type_code,
      type: f.movement_type === "A" ? "arrival" : "departure",
      priority: f.priority_score > 0
    }))
  : [];

  const filteredFlights =
    activeTab === "arrivals"
      ? mappedFlights.filter(f => f.type === "arrival")
      : activeTab === "departures"
      ? mappedFlights.filter(f => f.type === "departure")
      : mappedFlights;

  return (
    <div className="px-6 py-4">

      {/* Control Panels */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">
          AOCC Control Panels
        </h3>

        <div className="grid grid-cols-7 gap-3">

          <Link to="/aocc/bay-management"
            className="border rounded-lg px-4 py-3 text-center hover:bg-blue-50"
            style={{ borderColor: "#1E88E5" }}>
            <Building2 size={24} className="mx-auto mb-2"
              style={{ color: "#1E88E5" }} />
            <div className="text-sm font-semibold"
              style={{ color: "#1E88E5" }}>
              Bay Overview
            </div>
          </Link>

          <Link to="/aocc/timeline"
            className="border rounded-lg px-4 py-3 text-center hover:bg-blue-50"
            style={{ borderColor: "#1E88E5" }}>
            <Clock size={24} className="mx-auto mb-2"
              style={{ color: "#1E88E5" }} />
            <div className="text-sm font-semibold"
              style={{ color: "#1E88E5" }}>
              Event Timeline
            </div>
          </Link>

          <Link to="/aocc/audit-log"
            className="border rounded-lg px-4 py-3 text-center hover:bg-blue-50"
            style={{ borderColor: "#1E88E5" }}>
            <FileText size={24} className="mx-auto mb-2"
              style={{ color: "#1E88E5" }} />
            <div className="text-sm font-semibold"
              style={{ color: "#1E88E5" }}>
              Audit Log
            </div>
          </Link>

          <Link to="/aocc/atc"
            className="border rounded-lg px-4 py-3 text-center hover:bg-blue-50 relative"
            style={{ borderColor: "#1E88E5" }}>
            <Radio size={24} className="mx-auto mb-2"
              style={{ color: "#1E88E5" }} />
            <div className="text-sm font-semibold"
              style={{ color: "#1E88E5" }}>
              ATC Communication
            </div>
            {atcUnread > 0 && (
              <Badge className="absolute top-2 right-2 bg-red-600 text-white text-xs px-1">
                {atcUnread}
              </Badge>
            )}
          </Link>

          <Link to="/aocc/apron"
            className="border rounded-lg px-4 py-3 text-center hover:bg-blue-50"
            style={{ borderColor: "#1E88E5" }}>
            <Truck size={24} className="mx-auto mb-2"
              style={{ color: "#1E88E5" }} />
            <div className="text-sm font-semibold"
              style={{ color: "#1E88E5" }}>
              Apron Coordination
            </div>
          </Link>

          <Link to="/aocc/priority"
            className="border rounded-lg px-4 py-3 text-center hover:bg-blue-50 relative"
            style={{ borderColor: "#1E88E5" }}>
            <AlertTriangle size={24} className="mx-auto mb-2"
              style={{ color: "#1E88E5" }} />
            <div className="text-sm font-semibold"
              style={{ color: "#1E88E5" }}>
              Priority Control
            </div>
            {priorityCount > 0 && (
              <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-1">
                {priorityCount}
              </Badge>
            )}
          </Link>

        </div>
      </div>

      {/* Flight Schedule & Planning */}
      <div className="mb-6">

        <h2 className="text-lg font-semibold mb-4"
          style={{ color: "#1E88E5" }}>
          Flight Schedule & Planning
        </h2>
        <div className="flex gap-2 mb-4">
  <button
    onClick={() => setActiveTab("arrivals")}
    className={`px-4 py-2 rounded transition-colors ${
      activeTab === "arrivals"
        ? "text-white"
        : "border text-gray-700 hover:bg-blue-50"
    }`}
    style={{
      backgroundColor: activeTab === "arrivals" ? "#1E88E5" : undefined,
      borderColor: activeTab === "arrivals" ? undefined : "#1E88E5"
    }}
  >
    Arrivals
  </button>

  <button
    onClick={() => setActiveTab("departures")}
    className={`px-4 py-2 rounded transition-colors ${
      activeTab === "departures"
        ? "text-white"
        : "border text-gray-700 hover:bg-blue-50"
    }`}
    style={{
      backgroundColor: activeTab === "departures" ? "#1E88E5" : undefined,
      borderColor: activeTab === "departures" ? undefined : "#1E88E5"
    }}
  >
    Departures
  </button>

  <button
    onClick={() => setActiveTab("all")}
    className={`px-4 py-2 rounded transition-colors ${
      activeTab === "all"
        ? "text-white"
        : "border text-gray-700 hover:bg-blue-50"
    }`}
    style={{
      backgroundColor: activeTab === "all" ? "#1E88E5" : undefined,
      borderColor: activeTab === "all" ? undefined : "#1E88E5"
    }}
  >
    All Flights
  </button>
</div>

        {loading ? (
          <div>Loading flights...</div>
        ) : (
          <div className="border rounded-lg overflow-hidden"
            style={{ borderColor: "#e5e7eb" }}>
            <table className="w-full">
              <thead style={{ backgroundColor: "#1E88E5" }}>
                <tr className="text-white text-left">
                  <th className="px-4 py-3">Flight</th>
                  <th className="px-4 py-3">Airline</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Bay</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlights.map(flight => (
                  <tr key={flight.id}
                    className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">
                      {flight.flightNumber}
                    </td>
                    <td className="px-4 py-3">
                      {flight.airline}
                    </td>
                    <td className="px-4 py-3">
                      {flight.origin} → {flight.destination}
                    </td>
                    <td className="px-4 py-3">
                      {flight.scheduled}
                    </td>
                    <td className="px-4 py-3">
                      {flight.bay || "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-blue-600 text-white">
                        {flight.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}

