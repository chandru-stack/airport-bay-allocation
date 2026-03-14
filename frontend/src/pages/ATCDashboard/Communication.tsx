import { useState, useEffect } from "react";
import { MessageSquare, Check } from "lucide-react";

const ROLE_ID_ATC = 3; // ⚠ set correct role_id from DB

export default function Communication() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/aocc/messages?role_id=${ROLE_ID_ATC}`
      );

      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Message fetch error:", err);
      setMessages([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const interval = setInterval(fetchMessages, 5000);

    const socket = new WebSocket("ws://localhost:5000");

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (
        message?.type === "NEW_MESSAGE" ||
        message?.type === "MESSAGE_READ"
      ) {
        fetchMessages();
      }
    };

    return () => {
      clearInterval(interval);
      socket.close();
    };
  }, []);

  const handleAcknowledge = async (id: number) => {
    try {
      await fetch(
        `http://localhost:5000/api/aocc/messages/${id}/read`,
        {
          method: "PATCH",
        }
      );

      fetchMessages();
    } catch (error) {
      console.error("Acknowledge error:", error);
    }
  };

  if (loading) return <div className="p-6">Loading messages...</div>;

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Communication
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Messages from AOCC and Apron Control
        </p>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.message_id}
            className={`border-2 rounded-lg p-5 ${
              message.is_read
                ? "bg-gray-50 border-gray-200"
                : "bg-sky-50 border-sky-300"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                <MessageSquare className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      {message.sender_name}
                    </span>
                    <span className="text-sm font-mono text-gray-600">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  {message.is_read ? (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">Acknowledged</span>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleAcknowledge(message.message_id)
                      }
                      className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>

                <div className="text-sm font-semibold mb-1">
                  {message.message_type}
                </div>

                <p className="text-gray-900">
                  {message.message_text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-600 font-semibold text-lg mb-2">
            No Messages
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Total: {messages.length} | Unread:{" "}
        {messages.filter((m) => !m.is_read).length}
      </div>
    </div>
  );
}