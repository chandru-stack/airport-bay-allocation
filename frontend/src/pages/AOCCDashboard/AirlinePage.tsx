import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Badge } from "./components/ui/badge";

interface Message {
  id: number;
  content: string;
  timestamp: string;
  direction: "SENT" | "RECEIVED";
}

interface AirlineCommunication {
  id: number;
  flightNumber: string;
  airline: string;
  aircraft: string;
  movement: "ARRIVAL" | "DEPARTURE";
  assignedBay: string;
  icaoCategory: string;
  operationalStatus: string;
  specialConditions?: string;
  messages: Message[];
}

export default function AirlinePage() {
  const [data, setData] = useState<AirlineCommunication[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<AirlineCommunication | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // ✅ FETCH FROM BACKEND
  useEffect(() => {
    fetch("http://localhost:5000/api/aocc/airline-communications")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
      })
      .catch((err) => console.error("Failed to fetch airline data:", err));
  }, []);

  const handleSend = async () => {
    if (newMessage.trim() && selectedFlight) {
      try {
        await fetch(
          `http://localhost:5000/api/aocc/airline-communications/${selectedFlight.id}/message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: newMessage,
              direction: "SENT",
            }),
          }
        );

        // Refresh messages after send
        const res = await fetch("http://localhost:5000/api/aocc/airline-communications");
        const updated = await res.json();
        setData(updated);

        const refreshedFlight = updated.find((f: AirlineCommunication) => f.id === selectedFlight.id);
        setSelectedFlight(refreshedFlight || null);

        setNewMessage("");
      } catch (err) {
        console.error("Send failed:", err);
      }
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/aocc" className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft size={20} style={{ color: "#1E88E5" }} />
          </Link>
          <h1 className="text-2xl font-semibold" style={{ color: "#1E88E5" }}>
            Airline Communication
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Flight List */}
        <div className="col-span-1 border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="p-4 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#1E88E5" }}>
            <h3 className="font-semibold text-white">Active Flights</h3>
          </div>

          <div className="divide-y" style={{ borderColor: "#e5e7eb" }}>
            {data.map((comm) => (
              <div
                key={comm.id}
                onClick={() => setSelectedFlight(comm)}
                className={`p-4 cursor-pointer hover:bg-blue-50 ${
                  selectedFlight?.id === comm.id ? "bg-blue-100" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{comm.flightNumber}</span>
                  <Badge
                    style={{
                      backgroundColor: comm.movement === "ARRIVAL" ? "#10b981" : "#8b5cf6",
                      color: "white",
                    }}
                  >
                    {comm.movement}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div>{comm.airline}</div>
                  <div>{comm.aircraft}</div>
                  <div className="font-medium" style={{ color: "#1E88E5" }}>
                    Bay: {comm.assignedBay}
                  </div>
                </div>

                {comm.specialConditions && (
                  <Badge className="mt-2 text-xs bg-amber-500 text-white">
                    {comm.specialConditions}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Flight Details */}
        <div className="col-span-2 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
          {selectedFlight ? (
            <>
              <div className="p-4 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Flight Number</div>
                    <div className="font-semibold">{selectedFlight.flightNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Airline</div>
                    <div className="font-semibold">{selectedFlight.airline}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Aircraft</div>
                    <div className="font-semibold">{selectedFlight.aircraft}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">ICAO Category</div>
                    <Badge variant="outline" style={{ borderColor: "#1E88E5", color: "#1E88E5" }}>
                      {selectedFlight.icaoCategory}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Assigned Bay</div>
                    <div className="font-semibold" style={{ color: "#1E88E5" }}>
                      {selectedFlight.assignedBay}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <Badge style={{ backgroundColor: "#10b981", color: "white" }}>
                      {selectedFlight.operationalStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {selectedFlight.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "SENT" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg p-3 ${
                        msg.direction === "SENT" ? "text-white" : "bg-gray-100"
                      }`}
                      style={{
                        backgroundColor: msg.direction === "SENT" ? "#1E88E5" : undefined,
                      }}
                    >
                      <div className="text-sm mb-1">{msg.content}</div>
                      <div className="text-xs text-gray-500">{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Send */}
              <div className="p-4 border-t" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded"
                    style={{ borderColor: "#1E88E5" }}
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
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a flight to view communication details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}