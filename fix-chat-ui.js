const fs = require('fs');

const file = 'frontend/src/pages/AdminChat.tsx';
let content = fs.readFileSync(file, 'utf8');

// Step 1: Replace state declarations
const oldStates = `  // Chat room management states
  const [expandedChatId, setExpandedChatId] = useState<number | null>(null);
  const [chatRooms, setChatRooms] = useState<Record<number, any[]>>({});
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);`;

const newStates = `  // Chat room management states - rooms are now standalone, not nested under chats
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  
  // Resizable layout states
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(280);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);`;

if (content.includes(oldStates)) {
  content = content.replace(oldStates, newStates);
  console.log('✓ Step 1: Updated state declarations');
} else {
  console.log('✗ Step 1: Could not find old states');
}

// Step 2: Add resize effect before return statement
const resizeEffect = `
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

  return (`;

const beforeReturn = `  return (`;
if (content.includes(beforeReturn)) {
  content = content.replace(beforeReturn, resizeEffect);
  console.log('✓ Step 2: Added resize effect');
} else {
  console.log('✗ Step 2: Could not find return statement');
}

// Step 3: Update left sidebar width
content = content.replace(
  /width: 320,\s*borderRight:/,
  `width: leftWidth,\n          flexShrink: 0,\n          borderRight:`
);
console.log('✓ Step 3: Updated left sidebar width');

// Save the file
fs.writeFileSync(file, content, 'utf8');
console.log('\n✅ Phase 1 complete: States and resize logic added');
console.log('Next: Manual updates needed for Direct Chats and Chat Rooms sections');
