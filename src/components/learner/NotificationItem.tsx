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
    if (!notification.is_read) {
      onRead(notification.id);
    }
    
    // Handle navigation if action link is present
    const actionLink = notification.action_link || notification.actionLink;
    if (actionLink) {
      // Use proper routing here
      window.location.href = actionLink;
    }
  };

  // Determine notification icon/color based on type (if available)
  let typeClass = 'bg-blue-50';
  if (notification.type) {
    switch(notification.type) {
      case 'deadline':
        typeClass = 'bg-yellow-50';
        break;
      case 'intervention':
        typeClass = 'bg-red-50';
        break;
      case 'status_change':
        typeClass = 'bg-purple-50';
        break;
      case 'feedback_request':
        typeClass = 'bg-green-50';
        break;
      default:
        typeClass = 'bg-blue-50';
    }
  }

  return (
    <div 
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
        notification.is_read ? 'bg-white' : typeClass
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between">
        <h4 className="font-medium text-sm">{notification.title}</h4>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
    </div>
  );
};

export default NotificationItem; 