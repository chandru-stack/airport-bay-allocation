import { useState, useEffect } from "react";

import { Send, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function AOCCCoordination() {
  const [requests, setRequests] = useState<any[]>([]);
const ATC_USER_ID = 1;
const AO_USER_ID = 2;


  const [newIntent, setNewIntent] = useState({
    flightNumber: "",
    eta: "",
    runway: "",
  });

  const [flights, setFlights] = useState<any[]>([]);
const [selectedFlight, setSelectedFlight] = useState<any>(null);


  const fetchRequests = () => {
  fetch("http://localhost:5000/api/aocc/atc/coordination")
    .then(res => res.json())
    .then(data => setRequests(data))
    .catch(err => console.error("Fetch error:", err));

    fetch("http://localhost:5000/api/aocc/atc/flights/inbound")
  .then(res => res.json())
  .then(data => setFlights(data))
  .catch(err => console.error("Flights fetch error:", err));

};

  useEffect(() => {
  fetchRequests();

  const socket = new WebSocket("ws://localhost:5000");

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (
  message?.type === "EVENT_CREATED" &&
  (
    message?.data?.event_type === "BAY_REQUEST_APPROVED" ||
    message?.data?.event_type === "BAY_REQUEST_REJECTED" ||
    message?.data?.event_type === "BAY_REQUEST_CREATED"
  )
) {
      fetchRequests();
    }
  };

  return () => socket.close();
}, []);


  const handleSendIntent = async () => {
  if (!selectedFlight) return;

 await fetch("http://localhost:5000/api/aocc/atc/coordination/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    flight_id: selectedFlight.flight_id,
    message_type: "LANDING_INTENT",
    message_text: `Aircraft ${selectedFlight.flight_number} landing shortly. Confirm bay readiness.`
  })
});

  setSelectedFlight(null);
  fetchRequests();
};


  const getStatusIcon = (status: string) => {
  switch (status) {
    case "APPROVED":
      return <CheckCircle className="w-5 h-5 text-green-700" />;
    case "REJECTED":
      return <AlertCircle className="w-5 h-5 text-red-700" />;
    default:
      return <Clock className="w-5 h-5 text-amber-700" />;
  }
};


 const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-50 border-green-300 text-green-900";
    case "REJECTED":
      return "bg-red-50 border-red-300 text-red-900";
    default:
      return "bg-amber-50 border-amber-300 text-amber-900";
  }
};


  const approveRequest = async (request_id: number) => {
  await fetch("http://localhost:5000/api/aocc/atc/coordination/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id,
      ao_user_id: AO_USER_ID
    })
  });

  fetchRequests();
};

const rejectRequest = async (request_id: number) => {
  await fetch("http://localhost:5000/api/aocc/atc/coordination/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id,
      ao_user_id: AO_USER_ID
    })
  });

  fetchRequests();
};


  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">AOCC Coordination</h1>
        <p className="text-sm text-gray-500 mt-1">
          Communicate landing intent and confirm bay readiness with AOCC
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column: Landing Intent Form */}
        <div>
          <div className="bg-white border-2 border-sky-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-600" />
              Send Landing Intent
            </h2>

            <div className="space-y-4">
              {/* Flight Selection */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Select Inbound Flight
  </label>

  <select
    value={selectedFlight?.flight_id || ""}
    onChange={(e) => {
  const flight = flights.find(
  (f) => f.flight_id === Number(e.target.value)
);
  setSelectedFlight(flight || null);
}}

    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
  >
    <option value="">Choose flight...</option>

    {flights.map((flight) => (
      <option key={flight.flight_id} value={flight.flight_id}>
        {flight.flight_number} | RWY {flight.assigned_runway} | STD {new Date(flight.scheduled_time).toLocaleTimeString()}
      </option>
    ))}
  </select>
</div>

{/* Auto-filled ETA */}
{selectedFlight && (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      ETA
    </label>
    <input
      type="text"
      value={new Date(selectedFlight.scheduled_time).toLocaleTimeString()}
      readOnly
      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
    />
  </div>
)}

{/* Auto-filled Runway */}
{selectedFlight && (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Assigned Runway
    </label>
    <input
      type="text"
      value={selectedFlight.assigned_runway || "Not Assigned"}
      readOnly
      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
    />
  </div>
)}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-900">
                  <div className="font-semibold mb-1">Message to AOCC:</div>
                  <p className="italic">"Aircraft landing shortly. Confirm bay readiness."</p>
                </div>
              </div>

              <button
                onClick={handleSendIntent}
                disabled={!selectedFlight}
                className="w-full px-4 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send to AOCC
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AOCC Responses */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AOCC Response Panel</h2>

          <div className="space-y-4">
            {requests.map((req) => (

              <div
                key={req.request_id}
                className={`border-2 rounded-lg p-5 ${getStatusColor(req.request_status)}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg text-sky-700">
                        {req.flight_number}
                      </span>
                      <span className="text-sm text-gray-600">
                      
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">Sent: {req.requested_at}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(req.request_status)}
                    <span className="font-semibold text-sm">{req.request_status}</span>
                  </div>
                </div>

                {req.request_status === "PENDING" && (
  <div className="flex gap-3 mt-4">
    <button
      onClick={() => approveRequest(req.request_id)}
      className="px-4 py-2 bg-green-600 text-white rounded-lg"
    >
      Approve
    </button>

    <button
      onClick={() => rejectRequest(req.request_id)}
      className="px-4 py-2 bg-red-600 text-white rounded-lg"
    >
      Reject
    </button>
  </div>
)}


                {/* Response Details */}
                {req.request_status !== "PENDING" && (
                  <div className="space-y-3 pt-3 border-t border-current border-opacity-20">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">
                          Assigned Bay
                        </div>
                        <div className="font-semibold text-gray-900">
                          {req.bay_name || "Pending"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">
                          Bay Status
                        </div>
                        <div className="font-semibold text-gray-900">
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        Readiness Confirmation
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          req.request_status === "APPROVED"
                            ? "text-green-900"
                            : "text-red-900"
                        }`}
                      >
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        Notes from AOCC
                      </div>
                      <div className="text-sm text-gray-800">{req.reason}</div>
                    </div>
                  </div>
                )}

                {req.request_status === "PENDING" && (
                  <div className="pt-3 border-t border-amber-300">
                    <p className="text-sm text-amber-800 italic">
                      Awaiting response from AOCC...
                    </p>
                  </div>
                )}
              </div>
            ))}

            {requests.length === 0 && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
                <div className="text-gray-600 font-semibold text-lg mb-2">
                  No Landing Intents
                </div>
                <p className="text-gray-500">
                  Send a landing intent to coordinate with AOCC
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Send className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <div className="font-semibold mb-1">Coordination Guidelines</div>
            <p>
              Use this section to notify AOCC of incoming aircraft and request bay readiness
              confirmation. AOCC will respond with bay assignment, status, and any operational
              notes. This ensures smooth coordination between ATC and ground operations.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
        <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
        <span>
          Total Requests: {requests.length} | Approved:{" "}
{requests.filter((r) => r.request_status === "APPROVED").length} | Pending:{" "}
{requests.filter((r) => r.request_status === "PENDING").length} | Rejected:{" "}
{requests.filter((r) => r.request_status === "REJECTED").length} | Last updated:{" "}
{new Date().toLocaleTimeString()}

        </span>
      </div>
    </div>
  );
}


