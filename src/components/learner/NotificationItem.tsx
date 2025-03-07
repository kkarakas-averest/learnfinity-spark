import React from "@/lib/react-helpers";
import { Notification } from "@/types/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onRead 
}) => {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    
    // Handle navigation if action link is present
    if (notification.actionLink) {
      // Use proper routing here
      window.location.href = notification.actionLink;
    }
  };

  return (
    <div 
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
        notification.isRead ? 'bg-white' : 'bg-blue-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between">
        <h4 className="font-medium text-sm">{notification.title}</h4>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
    </div>
  );
};

export default NotificationItem; 