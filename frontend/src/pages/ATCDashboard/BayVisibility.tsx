import { useEffect, useState } from "react";

interface Bay {
  bay_id: number;
  bay_name: string;
  bay_type: string;
  bay_status: string;
  is_emergency_capable: boolean;
  allocation_state: string | null;
  conflict_flag: boolean | null;
  flight_number: string | null;
  movement_type: string | null;
  operational_status: string | null;
  on_block_time?: string | null;
  off_block_time?: string | null;
  terminal_name?: string;
}

const API_URL = "http://localhost:5000/api/aocc/bays"; 
// ⚠ If mounted under ATC instead, change to:
// const API_URL = "http://localhost:5000/api/atc/bays";

export default function BayVisibility() {
  const [bays, setBays] = useState<Bay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBays = () => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch bays");
        return res.json();
      })
      .then((data) => {
        setBays(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Bay fetch error:", err);
        setBays([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBays();

    // Poll every 5 seconds (fallback)
    const interval = setInterval(() => {
      fetchBays();
    }, 5000);

    // WebSocket real-time updates
    const socket = new WebSocket("ws://localhost:5000");

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (
        message?.type === "EVENT_CREATED" &&
        (
          message?.data?.event_type === "BAY_STATUS_CHANGED" ||
          message?.data?.event_type === "BAY_REQUEST_APPROVED" ||
          message?.data?.event_type === "ARRIVAL_STATUS_UPDATED"
        )
      ) {
        fetchBays();
      }
    };

    return () => {
      clearInterval(interval);
      socket.close();
    };
  }, []);

  const groupedBays = {
    "Terminal 1": bays.filter((b) => b.terminal_name === "Terminal 1"),
    "Terminal 2": bays.filter((b) => b.terminal_name === "Terminal 2"),
    Remote: bays.filter((b) => b.terminal_name === "Remote"),
  };

  const getStatusStyles = (bay: Bay) => {
    if (bay.bay_status === "BLOCKED")
      return "border-red-500 bg-red-50 text-red-700";

    if (bay.on_block_time && !bay.off_block_time)
      return "border-blue-500 bg-blue-50 text-blue-700";

    if (bay.allocation_state === "CONFIRMED")
      return "border-yellow-500 bg-yellow-50 text-yellow-700";

    return "border-green-500 bg-green-50 text-green-700";
  };

  const getDisplayStatus = (bay: Bay) => {
    if (bay.bay_status === "BLOCKED") return "Blocked";
    if (bay.on_block_time && !bay.off_block_time) return "Occupied";
    if (bay.allocation_state === "CONFIRMED") return "Allocated";
    return "Available";
  };

  if (loading) {
    return <div className="p-6">Loading bay visibility...</div>;
  }

  return (
    <div className="space-y-10">
      {Object.entries(groupedBays).map(([terminal, terminalBays]) => (
        <div
          key={terminal}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-sky-700">
              {terminal} Bays
            </h2>
          </div>

          {terminalBays.length === 0 ? (
            <p className="text-gray-500 text-sm">No bays found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {terminalBays.map((bay) => (
                <div
                  key={bay.bay_id}
                  className={`p-4 rounded-lg border-2 transition-colors ${getStatusStyles(
                    bay
                  )}`}
                >
                  <div className="flex justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">
                      {bay.bay_name}
                    </h3>
                    <span className="text-xs font-medium px-2 py-1 rounded">
                      {getDisplayStatus(bay)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flight:</span>
                      <span className="font-medium text-sky-700">
                        {bay.bay_status === "BLOCKED"
                          ? "-"
                          : bay.on_block_time && !bay.off_block_time
                          ? bay.flight_number
                          : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Movement:</span>
                      <span>
                        {bay.bay_status === "BLOCKED"
                          ? "-"
                          : bay.movement_type === "A"
                          ? "Arrival"
                          : bay.movement_type === "D"
                          ? "Departure"
                          : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Flight Status:</span>
                      <span>
                        {bay.bay_status === "BLOCKED"
                          ? "-"
                          : bay.operational_status || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Allocation:</span>
                      <span>
                        {bay.bay_status === "BLOCKED"
                          ? "-"
                          : bay.allocation_state || "Not Assigned"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Emergency Capable:
                      </span>
                      <span>
                        {bay.is_emergency_capable ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}