import { EventLogEntry } from '../App';
import { Clock } from 'lucide-react';

interface EventLogProps {
  events: EventLogEntry[];
}

export function EventLog({ events }: EventLogProps) {
  return (
    <div className="bg-white border border-gray-300 rounded">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#1E88E5]" />
          <h3 className="text-base text-gray-900">Apron Event Log</h3>
        </div>
      </div>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-sm text-gray-700">Time</th>
              <th className="px-4 py-2 text-left text-sm text-gray-700">Event Type</th>
              <th className="px-4 py-2 text-left text-sm text-gray-700">Flight No.</th>
              <th className="px-4 py-2 text-left text-sm text-gray-700">Bay</th>
              <th className="px-4 py-2 text-left text-sm text-gray-700">Updated By</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <tr
                key={event.id}
                className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="px-4 py-3 text-sm text-gray-900">{event.time}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      event.eventType === 'ON-BLOCK'
                        ? 'bg-blue-100 text-blue-700'
                        : event.eventType === 'OFF-BLOCK'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {event.eventType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {event.flightNumber || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">Bay {event.bayNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{event.updatedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
