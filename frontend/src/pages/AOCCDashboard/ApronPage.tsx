import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { useAuth } from "../../auth/authContext";

export default function ApronPage() {
  const { auth } = useAuth();

  const [message, setMessage] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.token) return;

    fetch("/api/aocc/events", {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch events");
        return res.json();
      })
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("EVENT FETCH ERROR:", err);
        setEvents([]);
        setLoading(false);
      });
  }, [auth?.token]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PUSHBACK: "#8b5cf6",
      EQUIPMENT: "#f59e0b",
      FUELING: "#0ea5e9",
      CONFIRMATION: "#10b981"
    };
    return colors[type] || "#6b7280";
  };

  const handleSend = () => {
    if (!message.trim()) return;

    fetch("/api/aocc/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth?.token}`
      },
      body: JSON.stringify({ message })
    })
      .then(res => res.json())
      .then(() => {
        setMessage("");
      })
      .catch(err => console.error("SEND ERROR:", err));
  };

  const countByType = (type: string) =>
    events.filter(e => e.type === type).length;

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/aocc" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} style={{ color: "#1E88E5" }} />
        </Link>
        <h1 className="text-2xl font-semibold" style={{ color: "#1E88E5" }}>
          Apron Coordination
        </h1>
      </div>

      {/* STATUS COUNTS */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {["PUSHBACK", "EQUIPMENT", "FUELING", "CONFIRMATION"].map(type => (
          <div
            key={type}
            className="border rounded-lg px-4 py-3 text-center"
            style={{ borderColor: getTypeColor(type) }}
          >
            <div className="text-sm text-gray-600 mb-1">{type}</div>
            <div
              className="text-2xl font-semibold"
              style={{ color: getTypeColor(type) }}
            >
              {countByType(type)}
            </div>
          </div>
        ))}
      </div>

      {/* EVENTS LIST */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#1E88E5" }}>
          Ground Operations Events
        </h2>

        {loading ? (
          <div>Loading events...</div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <div
                key={event.id}
                className="border rounded-lg p-4"
                style={{
                  borderColor:
                    event.priority === "HIGH" ? "#f59e0b" : "#e5e7eb"
                }}
              >
                <div className="flex justify-between mb-2">
                  <div className="flex gap-2">
                    <Badge
                      style={{
                        backgroundColor: getTypeColor(event.type),
                        color: "white"
                      }}
                    >
                      {event.type}
                    </Badge>

                    {event.priority === "HIGH" && (
                      <Badge className="bg-amber-500 text-white">
                        HIGH
                      </Badge>
                    )}
                  </div>

                  <span className="text-sm text-gray-500">
                    {event.timestamp}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Flight:</span>
                    <div className="font-semibold">
                      {event.flight_number}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Bay:</span>
                    <div className="font-semibold">{event.bay_id}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="font-semibold">{event.status}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Equipment:</span>
                    <div className="font-semibold">
                      {event.equipment || "-"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEND MESSAGE */}
      <div className="border rounded-lg p-4" style={{ borderColor: "#1E88E5" }}>
        <h3 className="font-semibold mb-3" style={{ color: "#1E88E5" }}>
          Send Coordination Update
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter coordination message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
          />

          <button
            onClick={handleSend}
            className="px-6 py-2 rounded text-white flex items-center gap-2"
            style={{ backgroundColor: "#1E88E5" }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}