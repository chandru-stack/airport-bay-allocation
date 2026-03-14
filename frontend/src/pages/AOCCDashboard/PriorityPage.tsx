import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { useAuth } from "../../auth/authContext";

export default function PriorityPage() {
  const { auth } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ If no token, stop loading instead of freezing
    if (!auth?.token) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/aocc/priority", {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch priority cases");
        return res.json();
      })
      .then(data => {
        setCases(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("PRIORITY FETCH ERROR:", err);
        setCases([]);
        setLoading(false);
      });
  }, [auth?.token]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      MEDICAL: "#dc2626",
      VIP: "#8b5cf6",
      DIVERSION: "#f59e0b",
      WEATHER: "#0ea5e9",
      TECHNICAL: "#f97316"
    };
    return colors[type] || "#6b7280";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "#dc2626",
      RESOLVED: "#10b981",
      MONITORING: "#f59e0b"
    };
    return colors[status] || "#6b7280";
  };

  const groupedCases = {
    MEDICAL: cases.filter(c => c.type === "MEDICAL"),
    VIP: cases.filter(c => c.type === "VIP"),
    DIVERSION: cases.filter(c => c.type === "DIVERSION"),
    WEATHER: cases.filter(c => c.type === "WEATHER"),
    TECHNICAL: cases.filter(c => c.type === "TECHNICAL")
  };

  const renderCaseSection = (type: string, caseList: any[]) => {
    if (caseList.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold" style={{ color: getTypeColor(type) }}>
            {type}
          </h3>
          <Badge
            className="text-xs"
            style={{ backgroundColor: getTypeColor(type), color: "white" }}
          >
            {caseList.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {caseList.map(priorityCase => (
            <div
              key={priorityCase.id}
              className="border rounded-lg p-4"
              style={{
                borderColor: getTypeColor(type),
                borderLeftWidth: "4px",
                backgroundColor:
                  priorityCase.status === "ACTIVE" ? "#fef2f2" : "white"
              }}
            >
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-semibold text-lg">
                    {priorityCase.flight_number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {priorityCase.airline} • {priorityCase.aircraft_type}
                  </div>
                  {priorityCase.bay_id && (
                    <Badge variant="outline" className="mt-1">
                      Bay: {priorityCase.bay_id}
                    </Badge>
                  )}
                </div>

                <div className="text-right">
                  <Badge
                    style={{
                      backgroundColor: getStatusColor(priorityCase.status),
                      color: "white"
                    }}
                  >
                    {priorityCase.status}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {priorityCase.timestamp}
                  </div>
                </div>
              </div>

              <div className="mb-3 p-3 bg-gray-50 rounded">
                <div className="flex gap-2">
                  <AlertCircle
                    size={16}
                    style={{ color: getTypeColor(type) }}
                  />
                  <p className="text-sm">{priorityCase.description}</p>
                </div>
              </div>

              <div className="mb-3 p-3 bg-blue-50 rounded">
                <div className="text-xs font-semibold mb-1">
                  Actions Taken:
                </div>
                <p className="text-sm">{priorityCase.actions}</p>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">
                    Priority Score:
                  </span>
                  <span className="text-sm font-semibold">
                    {priorityCase.priority_score}/100
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${priorityCase.priority_score}%`,
                      backgroundColor:
                        priorityCase.priority_score >= 80
                          ? "#dc2626"
                          : priorityCase.priority_score >= 50
                          ? "#f59e0b"
                          : "#1E88E5"
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-6">Loading priority cases...</div>;

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/aocc" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} style={{ color: "#1E88E5" }} />
        </Link>
        <h1 className="text-2xl font-semibold">
          Priority & Special Conditions Control
        </h1>
      </div>

      {renderCaseSection("MEDICAL", groupedCases.MEDICAL)}
      {renderCaseSection("VIP", groupedCases.VIP)}
      {renderCaseSection("DIVERSION", groupedCases.DIVERSION)}
      {renderCaseSection("WEATHER", groupedCases.WEATHER)}
      {renderCaseSection("TECHNICAL", groupedCases.TECHNICAL)}

      {cases.length === 0 && (
        <div className="text-center py-12 text-gray-500 border rounded-lg">
          <AlertCircle size={48} className="mx-auto mb-3" />
          <p>No priority cases at this time</p>
        </div>
      )}
    </div>
  );
}