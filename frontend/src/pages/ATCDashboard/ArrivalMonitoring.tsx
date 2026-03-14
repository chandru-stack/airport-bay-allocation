import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/atc/arrivals";

export default function ArrivalMonitoring() {
  const [arrivalFlights, setArrivalFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     STATUS COLOR
  =============================== */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "text-gray-700 bg-gray-50";
      case "ENROUTE":
        return "text-sky-700 bg-sky-50";
      case "HOLDING":
        return "text-amber-700 bg-amber-50";
      case "CLEARED_TO_LAND":
        return "text-green-700 bg-green-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  /* ===============================
     BAY READINESS COLOR
  =============================== */
  const getReadinessColor = (state: string) => {
    switch (state) {
      case "CONFIRMED":
        return "text-green-700 bg-green-50";
      case "ACTIVE":
        return "text-sky-700 bg-sky-50";
      default:
        return "text-red-700 bg-red-50";
    }
  };

  /* ===============================
     FETCH ARRIVALS FROM DB
  =============================== */
  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch arrivals");
        return res.json();
      })
      .then(data => {
        setArrivalFlights(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Arrival fetch error:", err);
        setArrivalFlights([]);
        setLoading(false);
      });
  }, []);

  /* ===============================
     UTC → IST FORMATTER
  =============================== */
  const formatToIST = (utcString: string) => {
    if (!utcString) return "-";

    const date = new Date(utcString);

    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  if (loading) {
    return <div className="p-6">Loading arrival flights...</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Arrival Monitoring
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time monitoring of inbound aircraft – Read-only view
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Flight Number
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Airline
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Aircraft Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Origin
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  ETA (IST)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Assigned Bay
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Allocation State
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {arrivalFlights.map((flight) => (
                <tr
                  key={flight.flight_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-sky-700">
                    {flight.flight_number}
                  </td>

                  <td className="px-6 py-4 text-gray-900">
                    {flight.airline_code}
                  </td>

                  <td className="px-6 py-4 font-mono text-sm text-gray-700">
                    {flight.aircraft_type_code}
                  </td>

                  <td className="px-6 py-4 font-mono text-sm text-gray-700">
                    {flight.origin_airport_code}
                  </td>

                  <td className="px-6 py-4 font-mono text-sm text-gray-900">
                    {formatToIST(
                      flight.estimated_time || flight.scheduled_time
                    )}
                  </td>

                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {flight.bay_name || "Pending"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getReadinessColor(
                        flight.allocation_state
                      )}`}
                    >
                      {flight.allocation_state || "Not Allocated"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        flight.operational_status
                      )}`}
                    >
                      {flight.operational_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
        <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
        <span>
          Displaying {arrivalFlights.length} inbound flights | Last updated:{" "}
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}