
import os

file_path = 'pixelium_v11_STABLE.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
found_start = False

# Marker to start deleting
start_marker = '// --- PRODUCT MANAGER LOGIC (SEPARATE SYSTEM) ---'
# Marker to stop deleting (Where renderAdminProductList starts)
end_marker = 'function renderAdminProductList() {'

for line in lines:
    if start_marker in line:
        skip = True
        found_start = True
    
    if skip and end_marker in line:
        skip = False
        new_lines.append(r'    // --- LOGIC: ADMIN LIST (KEPT) ---' + '\n')
    
    if not skip:
        new_lines.append(line)

if found_start:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Successfully removed duplicate block.")
else:
    print("Could not find start marker for duplicate block.")
