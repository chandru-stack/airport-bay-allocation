import { Bay } from '../App';
import { Plane, AlertCircle, CheckCircle } from 'lucide-react';

interface BayStatusGridProps {
  bays: Bay[];
  onLifecycleEvent: (
    bayId: string,
    flightNumber: string | undefined,
    event: 'ON_BLOCK' | 'PUSHBACK_READY' | 'OFF_BLOCK'
  ) => void;
  onBlockToggle: (bayId: string, block: boolean) => void;
}

export function BayStatusGrid({
  bays,
  onLifecycleEvent,
  onBlockToggle,
}: BayStatusGridProps) {

  const getStatusColor = (status: Bay['status']) => {
    switch (status) {
      case 'available': return 'border-green-500';
      case 'reserved': return 'border-yellow-500';
      case 'occupied': return 'border-[#1E88E5]';
      case 'blocked': return 'border-orange-500';
      default: return 'border-gray-300';
    }
  };

  const getStatusIcon = (status: Bay['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'reserved':
      case 'occupied':
        return <Plane className="w-5 h-5 text-[#1E88E5]" />;
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-4 gap-4">
        {bays.map((bay) => {

          const isReserved = bay.status === 'reserved';
const isOccupied = bay.status === 'occupied';
const showFlightInfo = isReserved || isOccupied;

          return (
            <div
              key={bay.bay_id}
              className={`bg-white border-2 ${getStatusColor(bay.status ?? 'available')} rounded p-4 shadow-sm`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-medium text-gray-900">
                  {bay.bay_id}
                </span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(bay.status ?? 'available')}
                  <span className="text-sm text-gray-700">
                    {(bay.status ?? 'available').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Flight Info */}
              {showFlightInfo && (
                <div className="space-y-1 text-sm mb-3">
                  <div><strong>Flight:</strong> {bay.flightNumber}</div>
                  <div><strong>Aircraft:</strong> {bay.aircraftType || '-'}</div>
                  {bay.onBlockTime && <div><strong>ON-BLOCK:</strong> {bay.onBlockTime}</div>}
                  {bay.pushbackReadyTime && <div><strong>READY:</strong> {bay.pushbackReadyTime}</div>}
                  {bay.offBlockTime && <div><strong>OFF-BLOCK:</strong> {bay.offBlockTime}</div>}
                </div>
              )}

              {/* ===== LIFECYCLE FLOW ===== */}

              {/* RESERVED → ON BLOCK */}
{isReserved && (
  <button
    onClick={() =>
      onLifecycleEvent(bay.bay_id, bay.flightNumber, 'ON_BLOCK')
    }
    className="w-full mb-2 px-3 py-2 bg-blue-600 text-white text-sm rounded cursor-pointer hover:bg-blue-700 active:scale-95 transition-all duration-150"
  >
    Confirm ON-BLOCK
  </button>
)}

{/* OCCUPIED → PUSHBACK READY */}
{isOccupied &&
  bay.onBlockTime &&
  !bay.pushbackReadyTime &&
  !bay.offBlockTime && (
    <button
      onClick={() =>
        onLifecycleEvent(bay.bay_id, bay.flightNumber, 'PUSHBACK_READY')
      }
      className="w-full mb-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded cursor-pointer hover:bg-indigo-700 active:scale-95 transition-all duration-150"
    >
      Pushback Ready
    </button>
)}

{/* AFTER PUSHBACK → OFF BLOCK */}
{isOccupied &&
  bay.pushbackReadyTime &&
  !bay.offBlockTime && (
    <button
      onClick={() =>
        onLifecycleEvent(bay.bay_id, bay.flightNumber, 'OFF_BLOCK')
      }
      className="w-full mb-2 px-3 py-2 bg-green-600 text-white text-sm rounded cursor-pointer hover:bg-green-700 active:scale-95 transition-all duration-150"
    >
      Confirm OFF-BLOCK
    </button>
)}

              

              {/* ===== MANUAL BLOCK / UNBLOCK ===== */}

              {!showFlightInfo && bay.status !== 'blocked' && (
                <button
                  onClick={() => onBlockToggle(bay.bay_id, true)}
                  className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded cursor-pointer hover:bg-orange-700 active:scale-95 transition-all duration-150"
                >
                  Block Bay
                </button>
              )}

              {bay.status === 'blocked' && (
                <button
                  onClick={() => onBlockToggle(bay.bay_id, false)}
                  className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded cursor-pointer hover:bg-gray-700 active:scale-95 transition-all duration-150"
                >
                  Unblock Bay
                </button>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}