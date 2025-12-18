# Admin Chat UI Fix - Implementation Plan

## Summary
The AdminChat.tsx file needs two major changes:
1. **Remove nested chat rooms from Direct Chats** - rooms should only appear in the standalone "Chat Rooms" section
2. **Add resizable layout** - allow users to drag-resize the left and right sidebars

## Current Issues

### Issue 1: Chat Rooms Nested Under Direct Chats
**Lines affected**: ~458-620
- Each direct chat has an expand/collapse button (▶)
- When expanded, shows nested rooms under that chat
- This clutters the Direct Chats section

**Current state variables**:
```typescript
const [expandedChatId, setExpandedChatId] = useState<number | null>(null);
const [chatRooms, setChatRooms] = useState<Record<number, any[]>>({});
```

### Issue 2: Fixed Layout Widths
**Lines affected**: ~370-380, ~690-700
- Left sidebar: fixed `width: 320`
- Right sidebar: not currently visible but would be fixed
- No resize handles between panels

## Required Changes

### Part 1: Fix Chat Room Placement

#### Step 1: Update State Declarations (Lines ~59-63)
**Remove**:
```typescript
const [expandedChatId, setExpandedChatId] = useState<number | null>(null);
const [chatRooms, setChatRooms] = useState<Record<number, any[]>>({});
```

**Replace with**:
```typescript
const [chatRooms, setChatRooms] = useState<any[]>([]);
```

#### Step 2: Add Resize States (After line ~63)
**Add**:
```typescript
// Resizable layout states
const [leftWidth, setLeftWidth] = useState(320);
const [rightWidth, setRightWidth] = useState(280);
const [isResizingLeft, setIsResizingLeft] = useState(false);
const [isResizingRight, setIsResizingRight] = useState(false);
```

#### Step 3: Remove Nested Room Logic from Direct Chats (Lines ~458-620)
**Current code** has:
```typescript
{directChats.map((c: any, idx: number) => {
  const isExpanded = expandedChatId === c.id;
  const rooms = chatRooms[c.id] || [];
  
  return (
    <div key={c.id}>
      {/* Direct Chat Item */}
      <button ...>...</button>
      
      {/* Expand/Collapse Button */}
      <button onClick={() => setExpandedChatId(...)}>▶</button>
      
      {/* Nested Rooms */}
      {isExpanded && (
        <div>
          {rooms.map(room => ...)}
        </div>
      )}
    </div>
  );
})}
```

**Replace with simple list** (no expand button, no nested rooms):
```typescript
{directChats.map((c: any) => (
  <button
    key={c.id}
    onClick={() => {
      setSelectedConversationId(c.id);
      setSelectedRoomId(null);
      setShowRoomPanel(false);
      setCenterView("chat");
    }}
    style={{...}}
  >
    {/* Avatar, name, preview, time, unread count */}
  </button>
))}
```

#### Step 4: Update Chat Rooms Section (Lines ~630-680)
**Current code**:
```typescript
<div>
  <div>
    <span>Chat Rooms</span>
    <span style={{cursor: "pointer"}}>+</span>
  </div>
  <div>
    {mockRooms.map((r) => (
      <button key={r.id}>{r.name}</button>
    ))}
  </div>
</div>
```

**Replace with**:
```typescript
<div>
  <div>
    <span>Chat Rooms</span>
    <button
      onClick={() => {
        const roomName = prompt("Enter chat room name:");
        if (roomName && roomName.trim()) {
          const newRoom = {
            id: Date.now(),
            name: roomName.trim(),
            member_count: 1,
          };
          setChatRooms((prev) => [...prev, newRoom]);
          setSelectedRoomId(newRoom.id);
          setShowRoomPanel(true);
          setCenterView("chat");
        }
      }}
    >
      +
    </button>
  </div>
  <div>
    {[...mockRooms, ...chatRooms].map((r) => (
      <button
        key={r.id}
        onClick={() => {
          setSelectedRoomId(r.id);
          setSelectedConversationId(null);
          setShowRoomPanel(true);
          setCenterView("chat");
        }}
        style={{
          background: selectedRoomId === r.id ? "#eef2ff" : "#f9fafb",
        }}
      >
        <span>👥</span>
        <div>
          <div>{r.name}</div>
          {r.member_count && <div>{r.member_count} members</div>}
        </div>
      </button>
    ))}
  </div>
</div>
```

#### Step 5: Remove "Create Room" from Chat Header (Lines ~1130-1160)
**Remove** the "Create Room" button that adds rooms to `chatRooms[conversationId]`
**Keep** only the status dropdown and "Delete chat" button

### Part 2: Add Resizable Layout

#### Step 6: Add Resize Effect (After useEffect blocks, before return)
**Add**:
```typescript
// Resize handlers
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = Math.max(240, Math.min(500, e.clientX));
      setLeftWidth(newWidth);
    }
    if (isResizingRight) {
      const newWidth = Math.max(200, Math.min(400, window.innerWidth - e.clientX));
      setRightWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  };

  if (isResizingLeft || isResizingRight) {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };
}, [isResizingLeft, isResizingRight]);
```

#### Step 7: Update Left Sidebar Width (Line ~370)
**Change**:
```typescript
width: 320,
```

**To**:
```typescript
width: leftWidth,
flexShrink: 0,
```

#### Step 8: Add Left Resize Handle (After left sidebar div, before center panel)
**Add**:
```typescript
{/* Left resize handle */}
<div
  onMouseDown={() => setIsResizingLeft(true)}
  style={{
    width: 4,
    cursor: "col-resize",
    background: "transparent",
    flexShrink: 0,
    position: "relative",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "#cbd5e1";
  }}
  onMouseLeave={(e) => {
    if (!isResizingLeft) {
      e.currentTarget.style.background = "transparent";
    }
  }}
/>
```

#### Step 9: Update Center Panel (Line ~690)
**Add** to style:
```typescript
minWidth: 0,  // Allow flex shrinking
```

#### Step 10: Add Right Resize Handle and Right Sidebar
**Add after center panel** (if showRoomPanel is true):
```typescript
{showRoomPanel && (
  <>
    {/* Right resize handle */}
    <div
      onMouseDown={() => setIsResizingRight(true)}
      style={{
        width: 4,
        cursor: "col-resize",
        background: "transparent",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#cbd5e1";
      }}
      onMouseLeave={(e) => {
        if (!isResizingRight) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    />

    {/* Right sidebar: Room Members */}
    <div
      style={{
        width: rightWidth,
        borderLeft: "1px solid #e5e7eb",
        background: "#f9fafb",
        padding: 16,
        boxSizing: "border-box",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
        Room Members
      </div>
      <div style={{ fontSize: 13, color: "#64748b" }}>
        {roomMembers.length === 0 ? "No members yet" : `${roomMembers.length} members`}
      </div>
      {/* Add member list UI here */}
    </div>
  </>
)}
```

## Testing Checklist

After implementation:
- [ ] Direct Chats show only conversations (no expand buttons)
- [ ] Chat Rooms section shows all rooms (mock + created)
- [ ] Clicking + in Chat Rooms creates a new room
- [ ] New rooms appear in Chat Rooms section only
- [ ] Selecting a room highlights it and shows room panel
- [ ] Left sidebar can be resized by dragging
- [ ] Right sidebar appears when room is selected
- [ ] Right sidebar can be resized by dragging
- [ ] Center panel adjusts smoothly
- [ ] No TypeScript errors
- [ ] Existing chat functionality unchanged

## Files to Modify
1. `frontend/src/pages/AdminChat.tsx` - Main changes

## Estimated Lines Changed
- ~150 lines modified
- ~50 lines added
- ~100 lines removed
- Net: Similar file size, cleaner structure
