# PowerShell script to fix AdminChat.tsx

$file = "frontend/src/pages/AdminChat.tsx"
$content = Get-Content $file -Raw

# Part 1: Fix chat room states
$content = $content -replace 'const \[expandedChatId, setExpandedChatId\] = useState<number \| null>\(null\);', '// Removed expandedChatId - rooms are now standalone'
$content = $content -replace 'const \[chatRooms, setChatRooms\] = useState<Record<number, any\[\]>>\(\{\}\);', 'const [chatRooms, setChatRooms] = useState<any[]>([]);'

# Part 2: Add resize states after roomMembers state
$resizeStates = @"
  
  // Resizable layout states
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(280);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
"@

$content = $content -replace '(const \[roomMembers, setRoomMembers\] = useState<any\[\]>\(\[\]\);)', "`$1$resizeStates"

# Save the modified content
Set-Content $file -Value $content -NoNewline

Write-Host "Phase 1 complete: States updated"
