import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/atc/departures";

export default function DepartureMonitoring() {
  const [departureFlights, setDepartureFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     STATUS COLOR
  =============================== */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "text-gray-700 bg-gray-50";
      case "READY_FOR_DEPARTURE":
        return "text-sky-700 bg-sky-50";
      case "CLEARED_FOR_TAKEOFF":
        return "text-green-700 bg-green-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  /* ===============================
     PUSHBACK READINESS COLOR
  =============================== */
  const getReadinessColor = (pushbackReady: boolean) => {
    return pushbackReady
      ? "text-green-700 bg-green-50"
      : "text-amber-700 bg-amber-50";
  };

  /* ===============================
     FETCH FUNCTION
  =============================== */
  const fetchDepartures = () => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch departures");
        return res.json();
      })
      .then(data => {
        setDepartureFlights(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Departure fetch error:", err);
        setDepartureFlights([]);
        setLoading(false);
      });
  };

  /* ===============================
     AUTO REFRESH EVERY 5 SECONDS
  =============================== */
  useEffect(() => {
    fetchDepartures();

    const interval = setInterval(() => {
      fetchDepartures();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /* ===============================
     UTC → IST FORMAT
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
    return <div className="p-6">Loading departure flights...</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Departure Monitoring
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time monitoring of outbound aircraft – Read-only view
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
                  Destination
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  STD (IST)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  ETD (IST)
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Assigned Bay
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Pushback Readiness
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {departureFlights.map((flight) => (
                <tr
                  key={flight.flight_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-sky-700">
                    {flight.flight_number}
                  </td>

                  <td className="px-6 py-4 text-gray-900">
                    {flight.airline_code || "-"}
                  </td>

                  <td className="px-6 py-4 font-mono text-sm text-gray-700">
                    {flight.aircraft_type_code || "-"}
                  </td>

                  <td className="px-6 py-4 font-mono text-sm text-gray-700">
                    {flight.destination_airport_code}
                  </td>

                  <td className="px-6 py-4 font-mono text-sm text-gray-900">
                    {formatToIST(flight.scheduled_time)}
                  </td>

                  <td className="px-6 py-4 font-mono text-sm text-gray-900">
                    {formatToIST(
                      flight.estimated_time || flight.scheduled_time
                    )}
                  </td>

                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {flight.bay_name || "Not Assigned"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getReadinessColor(
                        !!flight.pushback_ready_time
                      )}`}
                    >
                      {flight.pushback_ready_time ? "Ready" : "Pending"}
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
          Displaying {departureFlights.length} outbound flights | Last updated:{" "}
          {new Date().toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}
        </span>
      </div>
    </div>
  );
}