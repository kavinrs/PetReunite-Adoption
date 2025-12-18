# Notification Navigation Fix

## Issue
When clicking on a "New Chat Request" notification, it was navigating to the chat conversation view instead of the requests page.

## Solution
Updated the notification click handler to distinguish between different types of chat notifications and navigate accordingly.

## Changes Made

### 1. AdminHome.tsx - Notification Feed Structure
- Added `notificationType` field to notification items
- This field stores the original notification type (e.g., "chat_request", "chat_message")

### 2. AdminHome.tsx - Notification Click Handler
Updated the click handler to check notification type:
```typescript
if (n.tab === "chat") {
  setTab("chat");
  // If it's a chat request notification, show the requests view
  if (n.notificationType === "chat_request") {
    navigate(`/admin?tab=chat&view=requests`, { replace: true });
  } else {
    // For chat messages, show the chat view
    navigate(`/admin?tab=chat`, { replace: true });
  }
}
```

### 3. AdminChat.tsx - URL Parameter Handling
- Added `useLocation` import
- Added useEffect to read `view` parameter from URL
- When `view=requests` is present, sets `centerView` to "requests"

```typescript
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const viewParam = params.get('view');
  if (viewParam === 'requests') {
    setCenterView('requests');
  }
}, [location.search]);
```

## Behavior

### Chat Request Notifications
- **Context**: "New Chat Request"
- **Click Action**: Navigates to `/admin?tab=chat&view=requests`
- **Result**: Shows the Requests page with pending chat requests

### Chat Message Notifications
- **Context**: "New Chat Message"
- **Click Action**: Navigates to `/admin?tab=chat`
- **Result**: Shows the chat conversation view

## Testing
1. User creates a chat request from user side
2. Admin receives "New Chat Request" notification
3. Admin clicks the notification
4. ✅ Should navigate to Requests page (not chat conversation)
5. Admin can see the pending request and click "View details"

## Files Modified
- ✅ frontend/src/pages/AdminHome.tsx
- ✅ frontend/src/pages/AdminChat.tsx
