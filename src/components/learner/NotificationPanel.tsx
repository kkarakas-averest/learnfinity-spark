import React from "@/lib/react-helpers";
import { Notification } from "@/types/notifications";
import NotificationItem from "./NotificationItem";
import { X } from "lucide-react";

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onReadNotification: (id: string) => void;
  onClearAll: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  notifications, 
  onClose, 
  onReadNotification,
  onClearAll
}) => {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 overflow-hidden max-h-[600px] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-xs text-gray-500">{unreadCount} unread</p>
        </div>
        <div className="flex space-x-2">
          {notifications.length > 0 && (
            <button 
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={onClearAll}
            >
              Mark all as read
            </button>
          )}
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onRead={onReadNotification} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel; 