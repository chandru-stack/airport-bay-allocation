import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/atc/alerts";
const WS_URL = "ws://localhost:5000";

export default function AlertsSafety() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     SEVERITY ICON
  =============================== */
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "High":
        return <AlertTriangle className="w-5 h-5" />;
      case "Medium":
        return <AlertCircle className="w-5 h-5" />;
      case "Low":
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  /* ===============================
     SEVERITY COLOR
  =============================== */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-50 border-red-300 text-red-900";
      case "Medium":
        return "bg-amber-50 border-amber-300 text-amber-900";
      case "Low":
        return "bg-blue-50 border-blue-300 text-blue-900";
      default:
        return "bg-gray-50 border-gray-300 text-gray-900";
    }
  };

  /* ===============================
     TYPE COLOR
  =============================== */
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Runway Congestion":
        return "bg-sky-100 text-sky-800";
      case "Apron Not Ready":
        return "bg-red-100 text-red-800";
      case "Bay Conflict":
        return "bg-amber-100 text-amber-800";
      case "Emergency Active":
        return "bg-red-100 text-red-800";
      case "Delay Ripple":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /* ===============================
     FETCH ALERTS
  =============================== */
  const fetchAlerts = () => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch alerts");
        return res.json();
      })
      .then(data => {
        setAlerts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Alert fetch error:", err);
        setAlerts([]);
        setLoading(false);
      });
  };

  /* ===============================
     EFFECT (FETCH + WS + AUTO REFRESH)
  =============================== */
  useEffect(() => {
    fetchAlerts();

    // Polling fallback (every 5 seconds)
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);

    // WebSocket
    const socket = new WebSocket(WS_URL);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "EVENT_CREATED") {
        fetchAlerts();
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      clearInterval(interval);
      socket.close();
    };
  }, []);

  if (loading) {
    return <div className="p-6">Loading alerts...</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Alerts & Safety Notifications
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time safety alerts and operational notifications – Read-only view
        </p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-2 rounded-lg p-5 ${getSeverityColor(
              alert.severity
            )}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={
                  alert.severity === "High"
                    ? "text-red-600"
                    : alert.severity === "Medium"
                    ? "text-amber-600"
                    : "text-blue-600"
                }
              >
                {getSeverityIcon(alert.severity)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(
                      alert.type
                    )}`}
                  >
                    {alert.type}
                  </span>

                  <span className="text-sm font-mono text-gray-600">
                    {alert.time}
                  </span>

                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      alert.severity === "High"
                        ? "bg-red-600 text-white"
                        : alert.severity === "Medium"
                        ? "bg-amber-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {alert.severity} Priority
                  </span>
                </div>

                <p className="text-gray-900 font-medium">
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-700 font-semibold text-lg mb-2">
            No Active Alerts
          </div>
          <p className="text-green-600">
            All systems operating normally
          </p>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
        <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
        <span>
          Active Alerts: {alerts.length} | Last updated:{" "}
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}