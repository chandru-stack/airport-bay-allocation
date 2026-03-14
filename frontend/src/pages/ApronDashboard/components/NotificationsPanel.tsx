import { Notification } from '../App';
import { AlertTriangle, Info, AlertOctagon } from 'lucide-react';

interface NotificationsPanelProps {
  notifications: Notification[];
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-[#1E88E5]" />;
    }
  };

  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-50 border-red-300';
      case 'warning':
        return 'bg-amber-50 border-amber-300';
      case 'info':
        return 'bg-blue-50 border-blue-300';
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-base text-gray-900">Notifications</h3>
      </div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No active notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border rounded ${getNotificationStyle(notification.type)}`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{notification.time}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
