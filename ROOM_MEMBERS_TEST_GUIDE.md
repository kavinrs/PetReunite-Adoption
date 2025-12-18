# Room Members Test Guide

## Quick Test Scenarios

### Test 1: Basic Room Isolation
**Objective**: Verify that each room has its own isolated member list

**Steps**:
1. Open AdminChat
2. Select a direct chat conversation
3. Click "Create Room" and name it "Room A"
4. Click on "Room A" to open it
5. Verify the Room Members sidebar appears on the right
6. Click "Add User from Chat" and add the user
7. Verify the user appears in the "Requested User" section
8. Click "Create Room" again and name it "Room B"
9. Click on "Room B" to open it
10. **VERIFY**: Room B's sidebar shows "No user added yet" (NOT the user from Room A)

**Expected Result**: ✅ Room B starts with empty members, proving isolation

---

### Test 2: Room Switching Persistence
**Objective**: Verify that room member data persists when switching between rooms

**Steps**:
1. Continue from Test 1 (Room A has a Requested User, Room B is empty)
2. In Room B, click "Add Found Pet User"
3. Search for and add a different user as Founded User
4. Verify the Founded User appears in Room B
5. Switch back to Room A
6. **VERIFY**: Room A still shows the original Requested User (no Founded User)
7. Switch back to Room B
8. **VERIFY**: Room B shows the Founded User (no Requested User)

**Expected Result**: ✅ Each room maintains its own member configuration

---

### Test 3: Multiple Admins Across Rooms
**Objective**: Verify that admin assignments are room-specific

**Steps**:
1. Select Room A
2. Click "Add Admin"
3. Add "Admin 1" to Room A
4. Verify Admin 1 appears in the Admins section
5. Switch to Room B
6. **VERIFY**: Room B shows only the default admins (Admin 1 and Admin 2 in the list)
7. Click "Add Admin" in Room B
8. Add "Admin 2" to Room B
9. Switch back to Room A
10. **VERIFY**: Room A shows only Admin 1 (not Admin 2)

**Expected Result**: ✅ Admin assignments are room-specific

---

### Test 4: Sidebar Visibility Control
**Objective**: Verify that the sidebar only appears when a room is selected

**Steps**:
1. Click on a direct chat (not a room)
2. **VERIFY**: No Room Members sidebar appears on the right
3. Click on a room under that chat
4. **VERIFY**: Room Members sidebar appears
5. Click back on the direct chat
6. **VERIFY**: Room Members sidebar disappears

**Expected Result**: ✅ Sidebar only visible for rooms, not direct chats

---

### Test 5: Add Action Button States
**Objective**: Verify that add buttons are properly disabled after adding members

**Steps**:
1. Select a room with no members
2. **VERIFY**: "Add User from Chat" button is enabled
3. Click and add a user as Requested User
4. **VERIFY**: "Add User from Chat" button is now disabled/grayed out
5. **VERIFY**: "Add Found Pet User" button is still enabled
6. Add a Founded User
7. **VERIFY**: "Add Found Pet User" button is now disabled/grayed out
8. Switch to a different room
9. **VERIFY**: Both buttons are enabled again (new room context)

**Expected Result**: ✅ Buttons properly reflect room-specific state

---

### Test 6: Search Filtering in Founded User
**Objective**: Verify that user search excludes already-added members

**Steps**:
1. Select a room
2. Add User A as Requested User
3. Click "Add Found Pet User"
4. **VERIFY**: User A does not appear in the search results
5. Search for User B
6. Add User B as Founded User
7. Create a new room
8. Click "Add Found Pet User" in the new room
9. **VERIFY**: Both User A and User B appear in the search (different room context)

**Expected Result**: ✅ Search filtering is room-specific

---

### Test 7: Room Creation and Auto-Expansion
**Objective**: Verify that creating a room properly initializes it

**Steps**:
1. Select a direct chat
2. Click "Create Room"
3. Enter "Test Room" as the name
4. **VERIFY**: The chat expands to show the new room
5. Click on the new room
6. **VERIFY**: Room Members sidebar appears
7. **VERIFY**: All member sections show "No user added yet"
8. **VERIFY**: Default admins (Admin 1, Admin 2) are shown in the Admins section

**Expected Result**: ✅ New rooms are properly initialized with empty state

---

### Test 8: Rapid Room Switching
**Objective**: Verify that rapid switching doesn't cause state corruption

**Steps**:
1. Create 3 rooms: Room A, Room B, Room C
2. Add different users to each room:
   - Room A: Requested User = User 1
   - Room B: Founded User = User 2
   - Room C: Requested User = User 3, Founded User = User 4
3. Rapidly click between rooms: A → B → C → A → C → B
4. **VERIFY**: Each room consistently shows its own members
5. **VERIFY**: No members from other rooms appear
6. **VERIFY**: No "flashing" or temporary display of wrong members

**Expected Result**: ✅ State remains consistent during rapid switching

---

### Test 9: Panel Reset on Room Switch
**Objective**: Verify that add action panels close when switching rooms

**Steps**:
1. Select Room A
2. Click "Add Found Pet User" to open the search panel
3. Type a search query
4. Switch to Room B (without adding a user)
5. **VERIFY**: The search panel is closed in Room B
6. **VERIFY**: The search query is cleared
7. Click "Add Found Pet User" in Room B
8. **VERIFY**: Search starts fresh (no previous query)

**Expected Result**: ✅ UI panels reset cleanly on room switch

---

### Test 10: Direct Chat vs Room Context
**Objective**: Verify that direct chats and rooms are properly distinguished

**Steps**:
1. Select a direct chat conversation
2. Send a message in the direct chat
3. **VERIFY**: No Room Members sidebar appears
4. Create a room for this conversation
5. Click on the room
6. **VERIFY**: Room Members sidebar appears
7. Add members to the room
8. Click back on the direct chat (not the room)
9. **VERIFY**: Room Members sidebar disappears
10. Click on the room again
11. **VERIFY**: Room Members sidebar reappears with the same members

**Expected Result**: ✅ Direct chats and rooms maintain separate contexts

---

## Visual Verification Checklist

When testing, visually confirm:

- [ ] Room Members sidebar only appears when `selectedRoomId` is set
- [ ] Sidebar header shows "Room Members"
- [ ] Three sections are always visible: Requested User, Founded User, Admins
- [ ] Empty sections show "No user added yet" placeholder
- [ ] Filled sections show user avatar, name, and role badge
- [ ] Add buttons are disabled (grayed out) when role is filled
- [ ] Add buttons are enabled when role is empty
- [ ] Search panel appears/disappears correctly
- [ ] Room switching is instant (no loading delay)
- [ ] No visual glitches or flashing content

---

## Console Verification

Open browser DevTools and check:

1. **No errors in console** when switching rooms
2. **No warnings about missing keys** in React components
3. **State updates are batched** (no excessive re-renders)

---

## Edge Cases to Test

### Edge Case 1: Switching Before Add Completes
1. Click "Add Found Pet User"
2. Start typing a search
3. Immediately switch to another room
4. **VERIFY**: No errors occur
5. **VERIFY**: Search panel closes cleanly

### Edge Case 2: Deleting a Room (Future)
1. Add members to a room
2. Delete the room (when implemented)
3. **VERIFY**: Room member data is cleaned up
4. **VERIFY**: No orphaned data in state

### Edge Case 3: Same User in Multiple Rooms
1. Add User A as Requested User in Room 1
2. Add User A as Founded User in Room 2
3. **VERIFY**: Both rooms show User A in their respective roles
4. **VERIFY**: No conflicts or errors

---

## Performance Testing

### Test: Many Rooms
1. Create 10+ rooms
2. Add different members to each room
3. Rapidly switch between all rooms
4. **VERIFY**: No performance degradation
5. **VERIFY**: Sidebar updates remain instant

---

## Regression Testing

After any code changes, re-run:
- Test 1 (Basic Isolation)
- Test 2 (Persistence)
- Test 8 (Rapid Switching)

These three tests cover the core functionality and will catch most regressions.

---

## Success Criteria

All tests must pass with:
- ✅ No console errors
- ✅ No visual glitches
- ✅ Instant room switching
- ✅ Correct member display per room
- ✅ No data leakage between rooms
- ✅ Proper UI state management

---

## Troubleshooting

If tests fail:

1. **Members appear in wrong room**:
   - Check that `selectedRoomId` is being used correctly
   - Verify `roomMembersData[selectedRoomId]` is being accessed
   - Ensure no global state variables are being used

2. **Sidebar doesn't update on room switch**:
   - Check that `useEffect` with `[selectedRoomId]` dependency is running
   - Verify `currentRoomMembers` is being recomputed

3. **Add buttons don't disable**:
   - Check that `requestedUser` and `foundedUser` are room-scoped
   - Verify button `disabled` prop uses room-scoped values

4. **Search shows wrong users**:
   - Check that exclusion logic uses room-scoped member data
   - Verify `requestedUser`, `foundedUser`, `admins` are from current room

---

## Automated Testing (Future)

Consider adding:
- Unit tests for room member state management
- Integration tests for room switching
- E2E tests for complete user flows
