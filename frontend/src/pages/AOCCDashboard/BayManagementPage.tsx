import { useState, useEffect } from "react";
const API_BASE = "http://localhost:5000/api/aocc";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { useAuth } from "../../auth/authContext";

export default function BayManagementPage() {
  
  const [selectedFlight, setSelectedFlight] = useState("");
  const [selectedBay, setSelectedBay] = useState("");
  const [priorityOverride, setPriorityOverride] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [bays, setBays] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {
  if (!token) return;

  fetchFlights();
  fetchBays();

  const interval = setInterval(() => {
    fetchFlights();
    fetchBays();
  }, 5000);

  return () => clearInterval(interval);
}, [token]);

async function fetchFlights() {
  const res = await fetch(`${API_BASE}/flights`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  setFlights(Array.isArray(data) ? data : []);
}

async function fetchBays() {
  const res = await fetch(`${API_BASE}/bays`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  setBays(Array.isArray(data) ? data : []);
}

const totalBays = bays.length;

const freeBays = bays.filter(b => b.status === "available").length;
const occupiedBays = bays.filter(b => b.status === "occupied").length;
const blockedBays = bays.filter(b => b.status === "blocked").length;

const emergencyCapableBays = bays.filter(b => b.is_emergency_capable).length;

const unassignedFlights = flights.filter(
  f => f.movement_type === "A" && !f.bay_id
);

const selectedFlightData = flights.find(
  f => f.flight_id === Number(selectedFlight)
);

const compatibleBays = selectedFlightData
  ? bays.filter(b =>
      b.status === "available" &&
      b.max_icao_category >= selectedFlightData.icao_category
    )
  : [];

  function getDisplayState(state: string) {
  if (state === "PRE_ALLOCATED") return "reserved";
  return state;
}

  const renderBayGrid = (bayList: any[], title: string) => (
  <div className="mb-6">
    <h3 className="text-lg mb-3 font-semibold" style={{ color: "#1E88E5" }}>
      {title}
    </h3>

    <div className="grid grid-cols-4 gap-3">
      {bayList.map((bay) => (
        <div
          key={bay.bay_id}
          className="border rounded-lg p-4 relative cursor-pointer hover:shadow-md transition-shadow"
          style={{
            borderColor:
  bay.status === "occupied"
                ? "#1E88E5"
                : bay.status === "blocked"
                ? "#6b7280"
                : "#e5e7eb",
           backgroundColor:
  bay.status === "occupied"
    ? "#1E88E5"
    : bay.status === "blocked"
    ? "#6b7280"
    : "#10b981",
                
          }}
          onClick={() =>
  bay.status === "available" &&
  setSelectedBay(bay.bay_id)
}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="font-semibold text-lg">
              {bay.bay_id}
            </div>

            {bay.is_emergency_capable && (
              <Badge className="bg-red-600 text-white text-xs px-1 py-0">
                EMR
              </Badge>
            )}
          </div>

          <Badge
            style={{
              backgroundColor:
                
  bay.status === "occupied"
    ? "#1E88E5"
    : bay.status === "blocked"
    ? "#6b7280"
    : "#10b981",
              color: "white",
            }}
          >
            {getDisplayState(bay.status)}
          </Badge>
        </div>
      ))}
    </div>
  </div>
);

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={20} style={{ color: "#1E88E5" }} />
          </Link>
          <h1 className="text-2xl font-semibold" style={{ color: "#1E88E5" }}>Bay Management & Allocation</h1>
        </div>
      </div>

      {/* Bay Capacity Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: "#1E88E5" }}>Bay Capacity Summary</h2>
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="border rounded-lg px-4 py-3 text-center" style={{ borderColor: "#1E88E5" }}>
            <div className="text-sm text-gray-600 mb-1">Total Bays</div>
            <div className="text-3xl font-semibold" style={{ color: "#1E88E5" }}>{totalBays}</div>
          </div>
          <div className="border rounded-lg px-4 py-3 text-center" style={{ borderColor: "#10b981" }}>
            <div className="text-sm text-gray-600 mb-1">Free Bays</div>
            <div className="text-3xl font-semibold" style={{ color: "#10b981" }}>{freeBays}</div>
          </div>
          <div className="border rounded-lg px-4 py-3 text-center" style={{ borderColor: "#1E88E5" }}>
            <div className="text-sm text-gray-600 mb-1">Occupied Bays</div>
            <div className="text-3xl font-semibold" style={{ color: "#1E88E5" }}>{occupiedBays}</div>
          </div>
          <div className="border rounded-lg px-4 py-3 text-center" style={{ borderColor: "#6b7280" }}>
            <div className="text-sm text-gray-600 mb-1">Blocked Bays</div>
            <div className="text-3xl font-semibold" style={{ color: "#6b7280" }}>{blockedBays}</div>
          </div>
          <div className="border rounded-lg px-4 py-3 text-center" style={{ borderColor: "#dc2626" }}>
            <div className="text-sm text-gray-600 mb-1">Emergency Capable</div>
            <div className="text-3xl font-semibold" style={{ color: "#dc2626" }}>{emergencyCapableBays}</div>
          </div>
        </div>
        
        {/* Visual Capacity Meter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Bay Utilization</span>
            <span className="text-sm text-gray-600">{occupiedBays}/{totalBays} (
{totalBays > 0 ? Math.round((occupiedBays / totalBays) * 100) : 0}%)</span>
          </div>
          <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full flex"
              style={{ width: "100%" }}
            >
              <div
                style={{
                  width: `${totalBays > 0 ? (occupiedBays / totalBays) * 100 : 0}%`,
                  backgroundColor: "#1E88E5"
                }}
              />
              <div
                style={{
                  width: `${totalBays > 0 ? (blockedBays / totalBays) * 100 : 0}%`,
                  backgroundColor: "#6b7280"
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#1E88E5" }} />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "#6b7280" }} />
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-200" />
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* AOCC Bay Assignment Panel */}
        <div className="col-span-1 border rounded-lg p-4" style={{ borderColor: "#1E88E5" }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "#1E88E5" }}>AOCC Bay Assignment</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Select Flight</label>
              <select
                className="w-full border rounded px-3 py-2"
                style={{ borderColor: "#1E88E5" }}
                value={selectedFlight}
                onChange={(e) => setSelectedFlight(e.target.value)}
              >
                <option value="">-- Select Flight --</option>
                {unassignedFlights.map(f => (
  <option key={f.flight_id} value={f.flight_id}>
    {f.flight_number} ({f.aircraft_type_code})
  </option>
))}
              </select>
            </div>

            {selectedFlightData && (
              <>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Aircraft Type</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-50"
                    value={selectedFlightData.aircraft_type_code}
                    readOnly
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">ICAO Category</label>
                  <Badge style={{ backgroundColor: "#1E88E5", color: "white" }}>
  {selectedFlightData.icao_category}
</Badge>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Suggested Free Bays</label>
                  <div className="border rounded p-3 bg-gray-50 max-h-32 overflow-y-auto">
                    {compatibleBays.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {compatibleBays.map(b => (
                          <Badge
                            key={b.bay_id}
                            className="cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: selectedBay === b.bay_id ? "#1E88E5" : "#10b981",
                              color: "white"
                            }}
                            onClick={() => setSelectedBay(b.bay_id)}
                          >
                            {b.bay_id}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No compatible bays available</p>
                    )}
                  </div>
                </div>

                {selectedBay && (
                  <div className="p-3 rounded" style={{ backgroundColor: "#eff6ff" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                      <span className="text-sm font-semibold">ICAO Compatibility: Confirmed</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Bay {selectedBay} is compatible with {selectedFlightData.aircraft_type_code} (ICAO {selectedFlightData.icao_category})
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="priority-override"
                    checked={priorityOverride}
                    onChange={(e) => setPriorityOverride(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="priority-override" className="text-sm">Priority Override</label>
                </div>

                <div className="space-y-2">
                  <button
  className="w-full px-4 py-2 rounded text-white font-semibold disabled:opacity-50"
  style={{ backgroundColor: "#1E88E5" }}
  disabled={!selectedBay}
  onClick={async () => {
    if (!selectedFlight || !selectedBay) return;

    await fetch(`${API_BASE}/allocate-bay`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
      body: JSON.stringify({
        flight_id: selectedFlight,
        bay_id: selectedBay
      })
    });

    setSelectedBay("");
    fetchFlights();
    fetchBays();
  }}
>
  Allocate Bay
</button>
                  <button
                    className="w-full px-4 py-2 rounded border font-semibold"
                    style={{ borderColor: "#1E88E5", color: "#1E88E5" }}
                  >
                    Reassign Bay
                  </button>
                  <button
                    className="w-full px-4 py-2 rounded border font-semibold"
                    style={{ borderColor: "#6b7280", color: "#6b7280" }}
                  >
                    Block Bay
                  </button>
                </div>

                <div className="pt-3 border-t text-xs text-gray-600">
                  <div>Last Allocated By: J. Martinez</div>
                  <div>Allocation Timestamp: 16:28 UTC</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ATC Landing Request Panel */}
        <div className="col-span-2 border rounded-lg p-4" style={{ borderColor: "#1E88E5", backgroundColor: "#fffbeb" }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} style={{ color: "#f59e0b" }} />
            <h3 className="text-lg font-semibold" style={{ color: "#f59e0b" }}>ATC Landing Request</h3>
          </div>

          <div className="p-4 bg-white rounded border mb-4" style={{ borderColor: "#f59e0b" }}>
            <div className="text-sm mb-4">
              <span className="font-semibold">ATC Message:</span> "Tower requesting bay confirmation for incoming flight QR570. ETA 16:45 UTC. Require bay assignment for B777-300ER (ICAO Category H)."
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Incoming Flight</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                  value="QR570 - Qatar Airways"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Estimated Landing Time</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                  value="16:45 UTC"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Aircraft Type</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                  value="B777-300ER"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">ICAO Category</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                  value="H (Heavy)"
                  readOnly
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-semibold mb-2 block">Available Compatible Bays</label>
              <div className="grid grid-cols-4 gap-2">
  {bays
    .filter(
      (b) =>
        b.status === "available" &&
        selectedFlightData &&
        b.max_icao_category >= selectedFlightData.icao_category
    )
    .map((bay) => (
      <div
        key={bay.bay_id}
        className="border rounded p-3 text-center cursor-pointer hover:bg-blue-50"
        style={{ borderColor: "#10b981" }}
        onClick={() => setSelectedBay(bay.bay_id)}
      >
        <div className="font-semibold mb-1">
          {bay.bay_id}
        </div>

        <Badge
          style={{
            backgroundColor: "#10b981",
            color: "white",
            fontSize: "10px",
          }}
        >
          AVAILABLE
        </Badge>

        {bay.is_emergency_capable && (
          <div className="mt-1">
            <Badge className="bg-red-600 text-white text-xs">
              EMR
            </Badge>
          </div>
        )}
      </div>
    ))}
</div>
            </div>

            <div className="flex gap-3">
              <button
  className="flex-1 px-4 py-2 rounded text-white font-semibold"
  style={{ backgroundColor: "#10b981" }}
  onClick={async () => {
    if (!selectedFlight) return;

    await fetch(`${API_BASE}/confirm-allocation`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
      body: JSON.stringify({
        flight_id: selectedFlight
      })
    });

    fetchFlights();
    fetchBays();
  }}
>
  Confirm Bay Allocation
</button>
              <button
                className="flex-1 px-4 py-2 rounded border font-semibold"
                style={{ borderColor: "#f59e0b", color: "#f59e0b" }}
              >
                Suggest Alternate Bay
              </button>
              <button
                className="flex-1 px-4 py-2 rounded border font-semibold"
                style={{ borderColor: "#6b7280", color: "#6b7280" }}
              >
                Hold Allocation
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-600 italic">
            This panel simulates real-time ATC coordination workflow where AOCC responds to bay allocation requests.
          </div>
        </div>
      </div>

      {/* Terminal Bay Grids */}
      {renderBayGrid(
  bays.filter(b => b.terminal_name === "Terminal 1"),
  "Terminal 1 Bays"
)}
{renderBayGrid(
  bays.filter(b => b.terminal_name === "Terminal 2"),
  "Terminal 2 Bays"
)}
{renderBayGrid(
  bays.filter(b => b.terminal_name === "Remote"),
  "Remote Bays"
)}
    </div>
  );
}


