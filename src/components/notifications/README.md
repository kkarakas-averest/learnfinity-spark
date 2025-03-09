# LearnFinity Notification System

This directory contains components for LearnFinity's notification system, which enables real-time and in-app notifications for users.

## Components

### NotificationBadge

A small badge component that displays the count of unread notifications. It automatically fetches and updates the count.

```tsx
<NotificationBadge 
  userId="user-123"
  onClick={() => openNotifications()} 
  hideWhenZero={true}
/>
```

### NotificationCard 

Displays a single notification with proper formatting based on notification type and priority.

```tsx
<NotificationCard
  notification={notificationObject}
  onClose={() => handleRemove(notificationId)}
/>
```

### NotificationPanel

A slide-out panel that displays a list of notifications, with tabs for filtering different types.

```tsx
<NotificationPanel
  userId="user-123"
  isOpen={isPanelOpen}
  onClose={() => setIsPanelOpen(false)}
/>
```

### NotificationExample

A demonstration component showing how to use the notification system, with a form to create test notifications.

```tsx
<NotificationExample userId="user-123" />
```

## Backend Services

The notification system uses `NotificationService` to handle all notification operations:

- Fetching notifications
- Marking notifications as read
- Creating new notifications
- Managing notification preferences

## Database Schema

The system uses three primary tables:

1. `notifications` - Stores all notification data
2. `notification_preferences` - User preferences for notifications
3. `notification_templates` - Templates for generating consistent notifications

See `/src/db/notifications-schema.sql` for the complete database schema.

## Usage Example

```tsx
import { NotificationService } from '@/services/notification.service';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import NotificationPanel from '@/components/notifications/NotificationPanel';

const Header = ({ userId }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationService = NotificationService.getInstance();
  
  // To create a notification programmatically:
  const sendNotification = async () => {
    await notificationService.createNotification({
      recipientId: userId,
      senderId: null, // System-generated
      title: "New Assignment",
      message: "You have been assigned a new training module",
      type: "assignment",
      priority: "medium"
    });
  };
  
  return (
    <header>
      <div className="notifications">
        <button onClick={() => setNotificationsOpen(true)}>
          <Bell />
          <NotificationBadge userId={userId} hideWhenZero />
        </button>
      </div>
      
      <NotificationPanel
        userId={userId}
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </header>
  );
};
```

## Best Practices

1. Create system notifications with `senderId: null`
2. Use appropriate notification types and priorities
3. Include action links when relevant
4. Clean up expired notifications regularly 
5. Respect user notification preferences 