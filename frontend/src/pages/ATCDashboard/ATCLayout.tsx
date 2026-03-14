import { Outlet, Link, useLocation } from "react-router-dom";
import { Bell, Plane } from "lucide-react";
import { useEffect, useState } from "react";

export default function ATCLayout() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUTC = (date: Date) =>
    date.toUTCString().split(" ")[4];

  const formatLocal = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour12: false });

  const sections = [
    { path: "arrivals", label: "Arrival Monitoring" },
    { path: "departures", label: "Departure Monitoring" },
    { path: "bays", label: "Bay Visibility" },
    { path: "alerts", label: "Alerts & Safety" },
    { path: "timeline", label: "Event Timeline" },
    { path: "communication", label: "Communication" },
    { path: "emergency", label: "Emergency Control" },
    { path: "aocc", label: "AOCC Coordination" },
  ];

  const isActive = (path: string) =>
    location.pathname === `/atc/${path}`;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <Plane className="w-8 h-8 text-sky-600" />
            <div>
              <div className="font-semibold text-gray-900">
                Airport Operations System
              </div>
              <div className="text-xs text-gray-500">
                Air Traffic Control
              </div>
            </div>
          </div>

          <div className="text-xl font-semibold text-sky-700">
            ATC Operations Dashboard
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div>
              <div className="text-xs text-gray-500">UTC</div>
              <div className="font-mono font-semibold">
                {formatUTC(currentTime)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Local</div>
              <div className="font-mono font-semibold">
                {formatLocal(currentTime)}
              </div>
            </div>
            <button className="relative p-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <nav className="flex gap-2">
            {sections.map((section) => (
              <Link
                key={section.path}
                to={`/atc/${section.path}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isActive(section.path)
                    ? "bg-sky-600 text-white"
                    : "bg-white border border-gray-200 hover:bg-sky-50"
                }`}
              >
                {section.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}