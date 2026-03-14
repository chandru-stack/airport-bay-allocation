import { Flight } from '../App';
import { PlaneLanding, PlaneTakeoff } from 'lucide-react';

interface FlightsPanelsProps {
  arrivingFlights: Flight[];
  departingFlights: Flight[];
}

export function FlightsPanels({ arrivingFlights, departingFlights }: FlightsPanelsProps) {
  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      
      {/* Arriving Flights Panel */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <PlaneLanding className="w-5 h-5 text-[#1E88E5]" />
            <h3 className="text-base text-gray-900">Arriving Flights</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-sm text-gray-700">Flight No.</th>
                <th className="px-4 py-2 text-left text-sm text-gray-700">Aircraft</th>
                <th className="px-4 py-2 text-left text-sm text-gray-700">ETA</th>
                <th className="px-4 py-2 text-left text-sm text-gray-700">Bay</th>
                <th className="px-4 py-2 text-left text-sm text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {arrivingFlights.map((flight, index) => (
                <tr
                  key={`${flight.flightNumber}-arr-${index}`}
                  className={`border-b border-gray-100 ${
                    flight.priority
                      ? 'bg-amber-50'
                      : index % 2 === 0
                      ? 'bg-white'
                      : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {flight.flightNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {flight.aircraftType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {flight.eta}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {flight.assignedBay ? `Bay ${flight.assignedBay}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`${
                        flight.priority
                          ? 'text-amber-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {flight.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Departing Flights Panel */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="w-5 h-5 text-[#1E88E5]" />
            <h3 className="text-base text-gray-900">Departing Flights</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-sm text-gray-700">Flight No.</th>
                <th className="px-4 py-2 text-left text-sm text-gray-700">Aircraft</th>
                <th className="px-4 py-2 text-left text-sm text-gray-700">STD</th>
                <th className="px-4 py-2 text-left text-sm text-gray-700">Bay</th>
                <th className="px-4 py-2 text-left text-sm text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {departingFlights.map((flight, index) => (
                <tr
                  key={`${flight.flightNumber}-dep-${index}`}
                  className={`border-b border-gray-100 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {flight.flightNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {flight.aircraftType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {flight.std}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {flight.assignedBay ? `Bay ${flight.assignedBay}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {flight.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}