# Chatroom Access Approval Flow - Implementation Plan

## Overview
Complete Admin-controlled approval system for Requested Users joining chatrooms with notifications, access control, and audit logging.

## Architecture

### Database Models Required

#### 1. ChatroomAccessRequest Model
```python
class ChatroomAccessRequest(models.Model):
    chatroom = models.ForeignKey('Chatroom', on_delete=models.CASCADE)
    pet = models.ForeignKey('Pet', on_delete=models.CASCADE)
    requested_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatroom_requests')
    added_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatroom_invitations')
    role = models.CharField(max_length=50, default='requested_user')
    request_type = models.CharField(max_length=100, default='chatroom_join_request')
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['chatroom', 'requested_user']
```

#### 2. ChatroomParticipant Model (if not exists)
```python
class ChatroomParticipant(models.Model):
    chatroom = models.ForeignKey('Chatroom', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=50)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
```

### API Endpoints Required

#### Backend Endpoints
1. `POST /api/pets/chatrooms/{id}/invite-user/` - Admin invites user
2. `GET /api/pets/chatroom-access-requests/` - User's pending requests
3. `POST /api/pets/chatroom-access-requests/{id}/accept/` - Accept request
4. `POST /api/pets/chatroom-access-requests/{id}/reject/` - Reject request
5. `GET /api/pets/chatrooms/my-chatrooms/` - User's accessible chatrooms
6. `GET /api/pets/admin/chatrooms/{id}/participants/` - Admin view participants

#### Frontend API Functions
```typescript
export async function inviteUserToChatroom(chatroomId: number, userId: number): Promise<ApiResult>
export async function fetchChatroomAccessRequests(): Promise<ApiResult>
export async function acceptChatroomRequest(requestId: number): Promise<ApiResult>
export async function rejectChatroomRequest(requestId: number): Promise<ApiResult>
export async function fetchMyChatrooms(): Promise<ApiResult>
```

## Implementation Steps

### Phase 1: Backend - Database & Models
- [ ] Create ChatroomAccessRequest model
- [ ] Create ChatroomParticipant model (if needed)
- [ ] Run migrations
- [ ] Add model admin interfaces

### Phase 2: Backend - API Views
- [ ] Create invite user endpoint
- [ ] Create fetch requests endpoint
- [ ] Create accept request endpoint
- [ ] Create reject request endpoint
- [ ] Add permission checks
- [ ] Add validation logic

### Phase 3: Backend - Notifications
- [ ] Create notification on request creation
- [ ] Create notification on acceptance (to admin)
- [ ] Create notification on rejection (to admin)
- [ ] Add system messages to chat

### Phase 4: Backend - Access Control
- [ ] Add chatroom visibility filter
- [ ] Prevent unauthorized message viewing
- [ ] Prevent unauthorized message sending
- [ ] Add participant status checks

### Phase 5: Frontend - API Integration
- [ ] Add API functions to api.ts
- [ ] Add TypeScript types
- [ ] Add error handling

### Phase 6: Frontend - Admin UI
- [ ] Add "Invite User" button in Room Members
- [ ] Show participant status (Pending/Accepted/Rejected)
- [ ] Show timestamps
- [ ] Update UI after invitation

### Phase 7: Frontend - User Notifications
- [ ] Display notification bell badge
- [ ] Show invitation notification
- [ ] Link to My Activity → Requests

### Phase 8: Frontend - My Activity → Requests
- [ ] Display chatroom access requests
- [ ] Show pet details
- [ ] Add Accept/Reject buttons
- [ ] Update status after action

### Phase 9: Frontend - Chat List Filtering
- [ ] Filter chatrooms by acceptance status
- [ ] Hide pending/rejected chatrooms
- [ ] Show only accepted chatrooms

### Phase 10: Testing & Validation
- [ ] Test complete flow end-to-end
- [ ] Test access restrictions
- [ ] Test duplicate prevention
- [ ] Test notification delivery
- [ ] Test audit logging

## Security Rules

1. **Authorization Checks**
   - Only admins can invite users
   - Only invited users can accept/reject
   - No bypass mechanisms

2. **Duplicate Prevention**
   - One active request per user per chatroom
   - Accepted users cannot receive duplicates
   - Rejected users need new invitation

3. **Access Control**
   - Chatroom hidden until acceptance
   - No read-only access
   - No message viewing before acceptance

4. **Audit Logging**
   - Log all invitation actions
   - Log all acceptance/rejection actions
   - Track timestamps

## Data Flow

### Admin Invites User
```
Admin clicks "Add Requested User" 
  → Select user from list
  → POST /api/pets/chatrooms/{id}/invite-user/
  → Backend creates ChatroomAccessRequest (status=pending)
  → Backend creates Notification for user
  → Backend returns success
  → Admin UI shows "Pending" status
```

### User Receives Notification
```
Notification created
  → User sees notification bell badge
  → User clicks notification
  → Redirects to My Activity → Requests
  → Shows chatroom access request with Accept/Reject buttons
```

### User Accepts Request
```
User clicks "Accept"
  → POST /api/pets/chatroom-access-requests/{id}/accept/
  → Backend updates status to "accepted"
  → Backend adds user to ChatroomParticipant
  → Backend creates system message in chat
  → Backend creates notification for admin
  → Frontend refreshes chat list
  → Chatroom now visible in user's chat list
```

### User Rejects Request
```
User clicks "Reject"
  → POST /api/pets/chatroom-access-requests/{id}/reject/
  → Backend updates status to "rejected"
  → Backend creates notification for admin
  → Frontend removes request from list
  → Chatroom remains hidden
```

## UI Components

### Admin Panel - Room Members
```
┌─────────────────────────────────┐
│ Room Members                    │
├─────────────────────────────────┤
│ REQUESTED USER                  │
│ ┌─────────────────────────────┐ │
│ │ John Doe                    │ │
│ │ Status: Pending ⏳          │ │
│ │ Invited: 2 mins ago         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### User - My Activity → Requests
```
┌─────────────────────────────────┐
│ Chatroom Access Requests        │
├─────────────────────────────────┤
│ [Pet Image]                     │
│ Golden Retriever - Max          │
│ Purpose: Lost Pet Reunite       │
│ Added by: Admin                 │
│ Status: Pending                 │
│                                 │
│ [Accept] [Reject]               │
└─────────────────────────────────┘
```

### User - Chat List (After Acceptance)
```
┌─────────────────────────────────┐
│ My Chats                        │
├─────────────────────────────────┤
│ [Pet Image] Golden Retriever    │
│ Lost Pet Case - Active          │
│ Last: "Thank you for helping"   │
└─────────────────────────────────┘
```

## Files to Create/Modify

### Backend
- `Backend/Pets/models.py` - Add ChatroomAccessRequest model
- `Backend/Pets/views.py` - Add API views
- `Backend/Pets/serializers.py` - Add serializers
- `Backend/Pets/urls.py` - Add URL patterns
- `Backend/Pets/permissions.py` - Add permission classes
- `Backend/Pets/signals.py` - Add notification signals

### Frontend
- `frontend/src/services/api.ts` - Add API functions
- `frontend/src/pages/AdminChat.tsx` - Update Room Members UI
- `frontend/src/pages/MyAdoptionRequests.tsx` - Add chatroom requests
- `frontend/src/pages/UserHome.tsx` - Filter chat list
- `frontend/src/types/chatroom.ts` - Add TypeScript types

## Success Criteria

✅ Admin can invite Requested User to chatroom
✅ User receives notification immediately
✅ Request appears in My Activity → Requests
✅ Chatroom is completely hidden before acceptance
✅ User can accept request
✅ Chatroom appears in chat list after acceptance
✅ User can reject request
✅ Admin sees participant status
✅ No duplicate requests allowed
✅ All actions are audit logged
✅ No unauthorized access possible

## Next Steps

Start with Phase 1: Backend implementation
