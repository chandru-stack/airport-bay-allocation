import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

const API_BASE = "http://localhost:5000/api/aocc";

export default function EmergencyControl() {
  const [showModal, setShowModal] = useState(false);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    flightId: "",
    emergencyType: "",
    description: "",
  });

  /* =========================
     FETCH FUNCTIONS
  ========================= */
  const fetchEmergencies = async () => {
    try {
      const res = await fetch(`${API_BASE}/emergency`);
      const data = await res.json();
      setDeclarations(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Emergency fetch error:", err);
      setDeclarations([]);
      setLoading(false);
    }
  };

  const fetchFlights = async () => {
    try {
      const res = await fetch(`${API_BASE}/flights`);
      const data = await res.json();
      setFlights(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Flight fetch error:", err);
    }
  };

  /* =========================
     ACTIVATE EMERGENCY
  ========================= */
  const handleDeclareEmergency = async () => {
    try {
      const response = await fetch(`${API_BASE}/emergency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flight_id: Number(formData.flightId),
          emergency_type: formData.emergencyType,
          activated_by: 1, // replace later with auth user
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message);
        return;
      }

      fetchEmergencies();

      setFormData({
        flightId: "",
        emergencyType: "",
        description: "",
      });

      setShowModal(false);
    } catch (error) {
      console.error("Emergency activation error:", error);
    }
  };

  /* =========================
     REAL-TIME + POLLING
  ========================= */
  useEffect(() => {
    fetchEmergencies();
    fetchFlights();

    const interval = setInterval(fetchEmergencies, 5000);

    const socket = new WebSocket("ws://localhost:5000");

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (
        message?.type === "EMERGENCY_ACTIVATED" ||
        message?.data?.event_type === "EMERGENCY_ACTIVATED"
      ) {
        fetchEmergencies();
      }
    };

    return () => {
      clearInterval(interval);
      socket.close();
    };
  }, []);

  /* =========================
     UI HELPERS
  ========================= */
  const getEmergencyColor = (type: string) => {
    switch (type) {
      case "MAYDAY":
        return "bg-red-100 text-red-800 border-red-300";
      case "PAN":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Medical":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Technical":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return <div className="p-6">Loading emergency data...</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Emergency Control
        </h1>
      </div>

      <div className="mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-6 py-4 bg-red-600 text-white rounded-lg font-semibold text-lg"
        >
          Declare Emergency
        </button>
      </div>

      {/* ACTIVE EMERGENCIES */}
      {declarations.length === 0 ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
          No Active Emergencies
        </div>
      ) : (
        <div className="space-y-4">
          {declarations.map((declaration) => (
            <div
              key={declaration.emergency_id}
              className="border-2 border-red-300 bg-red-50 rounded-lg p-5"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold text-lg">
                    Flight {declaration.flight_number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(
                      declaration.activated_at
                    ).toLocaleTimeString()}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded border font-semibold ${getEmergencyColor(
                    declaration.emergency_type
                  )}`}
                >
                  {declaration.emergency_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              Declare Emergency
            </h3>

            <select
              value={formData.flightId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  flightId: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            >
              <option value="">Select Flight...</option>
              {flights.map((flight) => (
                <option
                  key={flight.flight_id}
                  value={flight.flight_id}
                >
                  {flight.flight_number}
                </option>
              ))}
            </select>

            <select
              value={formData.emergencyType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emergencyType: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            >
              <option value="">Select Type...</option>
              <option value="PAN">PAN</option>
              <option value="MAYDAY">MAYDAY</option>
              <option value="Medical">Medical</option>
              <option value="Technical">Technical</option>
            </select>

            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border rounded p-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclareEmergency}
                disabled={
                  !formData.flightId ||
                  !formData.emergencyType ||
                  !formData.description
                }
                className="flex-1 bg-red-600 text-white rounded p-2 disabled:bg-gray-300"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}