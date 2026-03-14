import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { useAuth } from "../../auth/authContext";

interface ATCMessage {
  id: number;
  from: string;
  subject: string;
  content: string;
  severity: "INFO" | "URGENT" | "CRITICAL";
  timestamp: string;
  isRead: boolean;
  requiresResponse: boolean;
}

export default function ATCPage() {
  const [messages, setMessages] = useState<ATCMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ATCMessage | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const { token } = useAuth();

  // ✅ Fetch from backend
  useEffect(() => {

  if (!token) return;

  fetch("/api/aocc/atc-messages", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => setMessages(Array.isArray(data) ? data : []))
    .catch(err => console.error("ATC fetch error:", err));

}, [token]);
  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      INFO: "#6b7280",
      URGENT: "#f59e0b",
      CRITICAL: "#dc2626"
    };
    return colors[severity] || "#6b7280";
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await fetch("/api/aocc/atc/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    subject: "AOCC Message",
    content: newMessage,
    severity: "INFO"
  })
});

      const res = await fetch("http://localhost:5000/api/aocc/atc-messages");
      const updated = await res.json();
      setMessages(updated);

      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const handleSendResponse = async () => {
    if (!responseMessage.trim() || !selectedMessage) return;

    try {
      await fetch("/api/aocc/acknowledge-atc", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    messageId: selectedMessage.id,
    response: responseMessage
  })
});

      const res = await fetch("/api/aocc/atc-messages", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
      const updated = await res.json();
      setMessages(updated);

      setResponseMessage("");
    } catch (err) {
      console.error("Response error:", err);
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/aocc" className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft size={20} style={{ color: "#1E88E5" }} />
          </Link>
          <h1 className="text-2xl font-semibold" style={{ color: "#1E88E5" }}>
            ATC Communication Panel
          </h1>
        </div>

        <Badge
          style={{
            backgroundColor: unreadCount > 0 ? "#dc2626" : "#10b981",
            color: "white"
          }}
        >
          {unreadCount} Unread
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Message List */}
        <div className="col-span-1 border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="p-4 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#1E88E5" }}>
            <h3 className="font-semibold text-white">ATC Message Feed</h3>
          </div>

          <div className="divide-y">
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-4 cursor-pointer hover:bg-blue-50 ${
                  selectedMessage?.id === msg.id ? "bg-blue-100" : ""
                } ${!msg.isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-sm">{msg.from}</span>
                  {!msg.isRead && (
                    <Badge className="text-xs px-1 py-0" style={{ backgroundColor: "#1E88E5", color: "white" }}>
                      NEW
                    </Badge>
                  )}
                </div>

                <div className="text-sm font-medium mb-2">{msg.subject}</div>

                <div className="flex items-center gap-2">
                  <Badge
                    className="text-xs"
                    style={{
                      backgroundColor: getSeverityColor(msg.severity),
                      color: "white"
                    }}
                  >
                    {msg.severity}
                  </Badge>
                  <span className="text-xs text-gray-500">{msg.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Detail */}
        <div className="col-span-2 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
          {selectedMessage ? (
            <>
              <div className="p-4 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold text-lg">{selectedMessage.subject}</h3>
                  <Badge
                    style={{
                      backgroundColor: getSeverityColor(selectedMessage.severity),
                      color: "white"
                    }}
                  >
                    {selectedMessage.severity}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  From: {selectedMessage.from} | {selectedMessage.timestamp}
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                <div className="border rounded-lg p-4" style={{ borderColor: "#1E88E5" }}>
                  <h4 className="font-semibold mb-3" style={{ color: "#1E88E5" }}>
                    Send Operational Response
                  </h4>

                  <textarea
                    className="w-full border rounded px-3 py-2 mb-3 resize-none"
                    style={{ borderColor: "#1E88E5" }}
                    rows={4}
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                  />

                  <button
                    onClick={handleSendResponse}
                    className="px-4 py-2 rounded text-white font-semibold flex items-center gap-2"
                    style={{ backgroundColor: "#1E88E5" }}
                  >
                    <Send size={16} />
                    Send Response
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a message to view details and respond
            </div>
          )}
        </div>
      </div>
    </div>
  );
}