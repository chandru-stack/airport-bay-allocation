import { useState, useEffect } from "react";
import { BayStatusGrid } from "./components/BayStatusGrid";
import { FlightsPanels } from "./components/FlightsPanels";
import { EventLog } from "./components/EventLog";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { Bell, Plane } from "lucide-react";
import { sendLifecycleEvent, toggleBlockBay } from "../../bayService";
import { useAuth } from "../../auth/authContext";
// Types
export type BayStatus = 'available' | 'reserved' | 'occupied' | 'blocked';

export interface Bay {
  bay_id: string;
  status: BayStatus;
  terminal: string;

  flightNumber?: string;
  aircraftType?: string;

  onBlockTime?: string;
  pushbackReadyTime?: string;
  offBlockTime?: string;

  groundStatus?: string;
  conflictFlag?: boolean;
}


export interface Flight {
  flightNumber: string;
  aircraftType: string;
  eta?: string;
  std?: string;
  assignedBay?: string;
  status: string;
  priority?: boolean;
}

export interface EventLogEntry {
  id: string;
  time: string;
  eventType: string;
  flightNumber?: string;
  bayNumber: string; // ← change number → string
  updatedBy: string;
}


export interface Notification {
  id: string;
  type: 'warning' | 'emergency' | 'info';
  message: string;
  time: string;
}

export default function ApronDashboard() {
    const { token } = useAuth();
  /* ========== BAYS (REAL IDS) ========== */
  const [bays, setBays] = useState<Bay[]>([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  type View =
  | "LIVE"
  | "FLIGHTS"
  | "EVENTS"
  | "PLANNING";
const [activeView, setActiveView] = useState<View>("LIVE");

const fetchBays = async () => {
  try {
    

const res = await fetch("http://localhost:5000/api/apron/bays", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

    if (!res.ok) {
      throw new Error("Failed to fetch bays");
    }

    const data = await res.json();

    const formatted: Bay[] = data.map((b: any) => ({
  bay_id: b.bay_id,

  status: b.status as BayStatus,

  terminal: b.terminal_name ?? "Unknown",

  flightNumber: b.flightNumber ?? undefined,
  aircraftType: b.aircraftType ?? undefined,

  onBlockTime: b.onBlockTime ?? undefined,
  pushbackReadyTime: b.pushbackReadyTime ?? undefined,
  offBlockTime: b.offBlockTime ?? undefined,

  groundStatus: undefined,
  conflictFlag: false,
}));

    setBays(formatted);

  } catch (error) {
    console.error("Failed to fetch bays:", error);
  }
};

const handleLifecycle = async (
  bayId: string,
  flightNumber: string | undefined,
  event: 'ON_BLOCK' | 'PUSHBACK_READY' | 'OFF_BLOCK'
) => {
  try {
    await sendLifecycleEvent(bayId, flightNumber, event);

    const newEvent = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      eventType: event.replace("_", "-"),
      flightNumber,
      bayNumber: bayId,
      updatedBy: "APR-CTRL-01",
    };

    setEventLog(prev => [newEvent, ...prev]);

    await fetchBays();
  } catch (err: any) {
  alert(err.message);
  console.error("Lifecycle failed", err);
}
};

const handleBlockToggle = async (bayId: string, block: boolean) => {
  try {
    await toggleBlockBay(bayId, block);

    const newEvent = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      eventType: block ? "BAY-BLOCKED" : "BAY-UNBLOCKED",
      bayNumber: bayId,
      updatedBy: "APR-CTRL-01",
    };

    setEventLog(prev => [newEvent, ...prev]);

    await fetchBays();
  } catch (err) {
    console.error("Block toggle failed", err);
  }
};
  const fetchAllocations = async () => {
  try {
    const params = new URLSearchParams();

    if (filterDate) params.append("date", filterDate);
    if (filterFlight) params.append("flight", filterFlight);
    if (filterBay) params.append("bay", filterBay);

   const res = await fetch(
  `http://localhost:5000/api/apron/core/allocations?${params.toString()}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    const data = await res.json();

    console.log("Allocations response:", data);

    setAllocations(data);

  } catch (err) {
    console.error("Failed to fetch allocations", err);
  }
};

  const [arrivingFlights, setArrivingFlights] = useState<Flight[]>([]);


  const [departingFlights, setDepartingFlights] = useState<Flight[]>([]);
  useEffect(() => {
  if (token) {
    fetchBays();
  }
}, [token]);
// useEffect(() => {
//   const interval = setInterval(() => {
//     fetchBays();
//   }, 5000); // refresh every 5 seconds

//   return () => clearInterval(interval);
// }, []);

  useEffect(() => {
  if (!token) return;

  const fetchFlights = async () => {
    try {
   

const arrivalsRes = await fetch(
  "http://localhost:5000/api/apron/flights/arrivals",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
      const arrivalsData = await arrivalsRes.json();
const departuresRes = await fetch(
  "http://localhost:5000/api/apron/flights/departures",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
      const departuresData = await departuresRes.json();

      setArrivingFlights(
        arrivalsData.map((f: any) => ({
          flightNumber: f.flight_number,
          aircraftType: f.aircraft_type_code,
          eta: new Date(f.scheduled_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          status: f.operational_status,
        }))
      );

      setDepartingFlights(
        departuresData.map((f: any) => ({
          flightNumber: f.flight_number,
          aircraftType: f.aircraft_type_code,
          std: new Date(f.scheduled_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          status: f.operational_status,
        }))
      );

    } catch (err) {
      console.error("Failed to fetch flights", err);
    }
  };

   fetchFlights();
}, [token]);
const [allocations, setAllocations] = useState<any[]>([]);
const [filterDate, setFilterDate] = useState("");
const [filterFlight, setFilterFlight] = useState("");
const [filterBay, setFilterBay] = useState("");


  const [eventLog, setEventLog] = useState<EventLogEntry[]>(() => {
  const saved = localStorage.getItem("apronEventLog");
  return saved ? JSON.parse(saved) : [];
});

useEffect(() => {
  localStorage.setItem("apronEventLog", JSON.stringify(eventLog));
}, [eventLog]);

  const [notifications] = useState<Notification[]>([
    { id: '1', type: 'warning', message: 'Bay 4 maintenance extended by 30 minutes', time: '09:15' },
    { id: '2', type: 'info', message: 'Flight UK956 requesting priority bay assignment', time: '09:28' },
  ]);
  

  // Live clock
  useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  return () => clearInterval(timer);
}, []);


  // Get shift based on time
  const getShift = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 14) return 'Morning';
    if (hour >= 14 && hour < 22) return 'Evening';
    return 'Night';
  };

  // Calculate summary stats
  const totalBays = bays.length;
  const availableBays = bays.filter(b => b.status === 'available').length;
  const occupiedBays = bays.filter(b => b.status === 'occupied').length;
  const blockedBays = bays.filter(b => b.status === 'blocked').length;
  const activeFlights = bays.filter(
  b => b.status === 'occupied' && !b.offBlockTime
).length;
  // Split bays into groups
  const terminal1Bays = bays.filter(b => b.terminal === "Terminal 1");
const terminal2Bays = bays.filter(b => b.terminal === "Terminal 2");
const remoteBays = bays.filter(b => b.terminal === "Remote");



  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <Plane className="w-7 h-7 text-[#1E88E5]" />
              <span className="text-lg text-[#1E88E5]">Airport Operations System</span>
            </div>
            
            {/* Center: Title */}
            <h1 className="text-xl text-[#1E88E5]">Apron Control Dashboard</h1>
            
            {/* Right: Time, Shift, User, Notifications */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-base text-gray-900">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-lg text-[#1E88E5]">
                  {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                </div>
              </div>
              <div className="h-10 w-px bg-gray-300"></div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Shift: {getShift()}</div>
                <div className="text-sm text-gray-900">Apron Controller</div>
              </div>
              <div className="flex items-center gap-3">

</div>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Status Strip */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex gap-4 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded">
            <span className="text-sm text-gray-600">Total Bays:</span>
            <span className="text-lg text-gray-900">{totalBays}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-green-500 rounded">
            <span className="text-sm text-gray-600">Available:</span>
            <span className="text-lg text-green-600">{availableBays}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#1E88E5] rounded">
            <span className="text-sm text-gray-600">Occupied:</span>
            <span className="text-lg text-[#1E88E5]">{occupiedBays}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-orange-500 rounded">
            <span className="text-sm text-gray-600">Blocked:</span>
            <span className="text-lg text-orange-600">{blockedBays}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded">
            <span className="text-sm text-gray-600">Active Flights:</span>
            <span className="text-lg text-gray-900">{activeFlights}</span>
          </div>
          <div className="flex gap-3 ml-6">

  <button
    onClick={() => setActiveView("LIVE")}
    className="px-4 py-2 bg-[#1E88E5] text-white rounded hover:bg-blue-700 transition"
  >
    Live
  </button>

  <button
    onClick={() => setActiveView("FLIGHTS")}
    className="px-4 py-2 bg-[#1E88E5] text-white rounded hover:bg-blue-700 transition"
  >
    Flights
  </button>

  <button
    onClick={() => setActiveView("EVENTS")}
    className="px-4 py-2 bg-[#1E88E5] text-white rounded hover:bg-blue-700 transition"
  >
    Event Log
  </button>

  <button
    onClick={() => setActiveView("PLANNING")}
    className="px-4 py-2 bg-[#1E88E5] text-white rounded hover:bg-blue-700 transition"
  >
    Allocation
  </button>

</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">

  {/* ================= LIVE VIEW ================= */}
  {activeView === "LIVE" && (
    <>
      <h2 className="text-lg text-gray-900 mb-3">Terminal 1 Bay Status</h2>
      <BayStatusGrid
        bays={terminal1Bays}
        onLifecycleEvent={handleLifecycle}
        onBlockToggle={handleBlockToggle}
      />

      <h2 className="text-lg text-gray-900 mt-8 mb-3">Terminal 2 Bay Status</h2>
      <BayStatusGrid
        bays={terminal2Bays}
        onLifecycleEvent={handleLifecycle}
        onBlockToggle={handleBlockToggle}
      />

      <h2 className="text-lg text-gray-900 mt-8 mb-3">Remote Bays</h2>
      <BayStatusGrid
        bays={remoteBays}
        onLifecycleEvent={handleLifecycle}
        onBlockToggle={handleBlockToggle}
      />
    </>
  )}

  {/* ================= FLIGHTS ================= */}
{activeView === "FLIGHTS" && (
  <div className="bg-white border rounded p-6">
    <h2 className="text-xl mb-4">Arriving & Departing Flights</h2>
    <FlightsPanels
      arrivingFlights={arrivingFlights}
      departingFlights={departingFlights}
    />
  </div>
)}

  {/* ================= EVENTS ================= */}
  {activeView === "EVENTS" && (
    <div className="bg-white border rounded p-6">
      <h2 className="text-xl mb-4">Apron Event Log</h2>
      <EventLog events={eventLog} />
    </div>
  )}

  {/* ================= PLANNING ================= */}
{activeView === "PLANNING" && (
  <div className="bg-white border rounded p-6">

    <h2 className="text-xl mb-6">Bay Allocation Planning</h2>

    {/* FILTER SECTION */}
    <div className="flex gap-4 mb-6">

      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        className="border px-3 py-2 rounded"
      />

      <input
        type="text"
        placeholder="Flight Number"
        value={filterFlight}
        onChange={(e) => setFilterFlight(e.target.value)}
        className="border px-3 py-2 rounded"
      />

      <select
        value={filterBay}
        onChange={(e) => setFilterBay(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option value="">All Bays</option>
        {bays.map((b) => (
          <option key={b.bay_id} value={b.bay_id}>
            {b.bay_id}
          </option>
        ))}
      </select>

      <button
        onClick={fetchAllocations}
        className="px-4 py-2 bg-[#1E88E5] text-white rounded hover:bg-blue-700"
      >
        Search
      </button>

    </div>

    {/* RESULT TABLE */}
    <div className="overflow-x-auto">
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Flight</th>
            <th className="px-4 py-2 border">Aircraft</th>
            <th className="px-4 py-2 border">Scheduled Time</th>
            <th className="px-4 py-2 border">Bay</th>
            <th className="px-4 py-2 border">Allocation State</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2 border">{a.flight_number}</td>
              <td className="px-4 py-2 border">{a.aircraft_type_code}</td>
              <td className="px-4 py-2 border">
                {new Date(a.scheduled_time).toLocaleString()}
              </td>
              <td className="px-4 py-2 border">{a.bay_id}</td>
              <td className="px-4 py-2 border">{a.allocation_state}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

  </div>
)}

</div>

      {/* Update Bay Modal */}
      
    </div>
  );
}
