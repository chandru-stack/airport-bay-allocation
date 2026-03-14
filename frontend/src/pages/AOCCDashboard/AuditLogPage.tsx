import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { useAuth } from "../../auth/authContext";

const API_BASE = "http://localhost:5000/api/aocc";

interface AuditEntry {
  id: number;
  timestamp: string;
  action: string;
  flight?: string;
  previousState: string;
  newState: string;
  user: string;
  role: string;
}

export default function AuditLogPage() {

  const { token } = useAuth();

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");

  // ✅ CORRECT FETCH WITH TOKEN
  useEffect(() => {

    if (!token) return;

    fetch(`${API_BASE}/audit-log`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(data => {
        const mapped = Array.isArray(data)
          ? data.map((row: any) => ({
              id: row.id,
              timestamp: row.timestamp,
              action: row.action,
              flight: row.flight,
              previousState: row.previous_state || "-",
              newState: row.new_state || "-",
              user: row.user_name || "System",
              role: row.role_name || "System"
            }))
          : [];

        setEntries(mapped);
      })
      .catch(err => {
        console.error("Audit fetch error:", err);
        setEntries([]);
      });

  }, [token]);

  const filteredEntries = entries.filter(entry => {
    if (filterUser && !entry.user.toLowerCase().includes(filterUser.toLowerCase())) return false;
    if (filterAction && !entry.action.toLowerCase().includes(filterAction.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/aocc" className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft size={20} style={{ color: "#1E88E5" }} />
          </Link>
          <h1 className="text-2xl font-semibold" style={{ color: "#1E88E5" }}>
            System Audit Log
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
        <h3 className="text-sm font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold mb-1 block">Filter by User</label>
            <input
              type="text"
              placeholder="Enter user name"
              className="w-full border rounded px-3 py-2"
              style={{ borderColor: "#1E88E5" }}
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Filter by Action</label>
            <input
              type="text"
              placeholder="Enter action type"
              className="w-full border rounded px-3 py-2"
              style={{ borderColor: "#1E88E5" }}
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterUser("");
                setFilterAction("");
              }}
              className="w-full px-4 py-2 rounded border"
              style={{ borderColor: "#6b7280", color: "#6b7280" }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full">
          <thead style={{ backgroundColor: "#1E88E5" }}>
            <tr className="text-white text-left">
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Flight</th>
              <th className="px-4 py-3 font-semibold">Previous State</th>
              <th className="px-4 py-3 font-semibold">New State</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b hover:bg-gray-50"
                style={{
                  borderColor: "#e5e7eb",
                  backgroundColor: entry.action.includes("Emergency") ? "#fee" : undefined
                }}
              >
                <td className="px-4 py-3 font-mono text-sm">{entry.timestamp}</td>
                <td className="px-4 py-3 font-semibold">
                  {entry.action.includes("Emergency") && (
                    <Badge className="bg-red-600 text-white mr-2">!</Badge>
                  )}
                  {entry.action}
                </td>
                <td className="px-4 py-3">{entry.flight || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{entry.previousState}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: "#1E88E5" }}>
                  {entry.newState}
                </td>
                <td className="px-4 py-3">{entry.user}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: entry.role === "System" ? "#6b7280" : "#1E88E5",
                      color: entry.role === "System" ? "#6b7280" : "#1E88E5"
                    }}
                  >
                    {entry.role}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No audit entries match the current filters
        </div>
      )}
    </div>
  );
}