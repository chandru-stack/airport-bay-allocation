import { useEffect, useState } from "react";

interface Event {
  event_id: number;
  event_time: string;
  event_type: string;
  payload: any;
  flight_number: string | null;
  username: string | null;
}

const API_URL = "http://localhost:5000/api/aocc/events";
// If mounted differently:
// const API_URL = "http://localhost:5000/api/events";

export default function EventTimeline() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH EVENTS FROM DB
  ========================= */
  const fetchEvents = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch events");

      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Event fetch error:", error);
      setEvents([]);
      setLoading(false);
    }
  };

  /* =========================
     INITIAL LOAD + REAL-TIME
  ========================= */
  useEffect(() => {
    fetchEvents();

    // Poll every 5 seconds
    const interval = setInterval(fetchEvents, 5000);

    const socket = new WebSocket("ws://localhost:5000");

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message?.type === "EVENT_CREATED") {
        fetchEvents(); // Always refetch from DB
      }
    };

    return () => {
      clearInterval(interval);
      socket.close();
    };
  }, []);

  /* =========================
     FILTER LOGIC
  ========================= */
  const filteredEvents = events.filter((event) => {
    if (filter === "ALL") return true;

    if (filter === "ATC") {
      return (
        event.event_type.includes("DEPARTURE") ||
        event.event_type.includes("LANDING") ||
        event.event_type.includes("FLIGHT")
      );
    }

    if (filter === "BAY") {
      return event.event_type.includes("BAY");
    }

    if (filter === "EMERGENCY") {
      return event.event_type.includes("EMERGENCY");
    }

    return true;
  });

  /* =========================
     PAYLOAD FORMAT
  ========================= */
  const renderPayload = (event: Event) => {
    if (!event.payload) return "";

    if (event.payload.emergency_type) {
      return `Type: ${event.payload.emergency_type}`;
    }

    if (event.payload.status) {
      return `Status: ${event.payload.status}`;
    }

    if (event.payload.bay_id) {
      return `Bay: ${event.payload.bay_id}`;
    }

    return "";
  };

  const getEventColor = (type: string) => {
    if (type.includes("EMERGENCY"))
      return "border-red-500 bg-red-50";

    if (type.includes("BAY"))
      return "border-amber-500 bg-amber-50";

    if (
      type.includes("DEPARTURE") ||
      type.includes("LANDING")
    )
      return "border-green-500 bg-green-50";

    return "border-sky-500 bg-sky-50";
  };

  if (loading) {
    return <div className="p-6">Loading events...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-sky-700 mb-6 text-center">
        Event Timeline
      </h2>

      {/* FILTER BUTTONS */}
      <div className="flex justify-center gap-3 mb-6">
        {["ALL", "ATC", "BAY", "EMERGENCY"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              filter === type
                ? "bg-sky-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* TIMELINE */}
      <div className="space-y-6 max-h-[600px] overflow-y-auto flex flex-col items-center">
        {filteredEvents.map((event) => (
          <div
            key={event.event_id}
            className={`w-full max-w-5xl rounded-xl border-l-4 px-6 py-4 shadow-sm ${getEventColor(
              event.event_type
            )}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
              <div className="font-mono text-gray-600 min-w-[180px]">
                {new Date(event.event_time).toLocaleString()}
              </div>

              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-white shadow-sm">
                {event.event_type}
              </div>

              <div className="font-medium text-gray-800">
                Flight: {event.flight_number || "-"}
              </div>

              <div className="text-gray-600">
                Actor: {event.username || "-"}
              </div>

              <div className="font-medium text-gray-700">
                {renderPayload(event)}
              </div>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-gray-500 text-center py-10">
            No events available for selected filter.
          </div>
        )}
      </div>
    </div>
  );
}