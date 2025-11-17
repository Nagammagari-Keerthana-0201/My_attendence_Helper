#  Testing & Debugging Guide for Keka Hours Tracker

## Current Date: November 14, 2025 

---

##  Testing Checklist

### Step 1: Load the Extension
- [ ] Open `chrome://extensions/`
- [ ] Click "Load unpacked"
- [ ] Select `/home/keerthana/Desktop/keka-hours-tracker`
- [ ] Extension appears in list with icon
- [ ] No red errors in extension card

### Step 2: Navigate to Keka Page
- [ ] Go to: `https://niruthi.keka.com/#/me/attendance/logs`
- [ ] Page loads completely
- [ ] Can see "Last 30 Days" table with attendance data

### Step 3: Check Extension Overlay
- [ ] Look in **bottom-right corner** of page
- [ ] Should see purple floating card with title " Working Hours Summary"
- [ ] If not visible: try scrolling or dragging from different areas

### Step 4: Verify Data Extraction
- [ ] Card shows "Total Hours" (not 0h)
- [ ] Card shows "Average/Day"
- [ ] Card shows "Under-time Days" count
- [ ] Card shows "Overtime Days" count
- [ ] Footer shows working days analyzed

---

##  Debugging Steps If Not Working

### Problem: Overlay Not Appearing

**Action 1: Check Console Logs**
1. Press **F12** on the Keka page
2. Go to **Console** tab
3. Look for logs starting with `[Keka Tracker]`
4. Note any error messages

**Action 2: Run Debugging Script**
1. Open Console (F12)
2. Copy contents of `DEBUG_CONSOLE.js`
3. Paste in console and press Enter
4. Check which selectors work (green checkmarks)

**Action 3: Wait Longer**
- Extension waits 2 seconds for page to load
- Try refreshing page (F5) and wait 3-5 seconds
- Sometimes Keka takes longer to render

### Problem: Overlay Shows 0h For All Stats

**Likely Causes:**
1. Table selectors don't match current Keka DOM
2. Time pattern not matching format used by Keka
3. All rows marked as skip (holidays/weekends)

**Debug Steps:**
1. Run `DEBUG_CONSOLE.js` script
2. Check "Trying Selectors" section - see which find rows
3. Check "Searching for Time Patterns" - verify format
4. Report findings below

### Problem: Only Showing Data for Some Days

1. This might be correct if some days are holidays/weekends
2. Check if skipped rows have keywords: `holiday, weekly-off, leave, absent`
3. Look at console logs to see what's skipped

---

##  Expected Output Example

```
 Last 30 Days Attendance:
- Fri, 14 Nov: 2h 59m (working)
- Thu, 13 Nov: 8h 40m (working)
- Wed, 12 Nov: 8h 4m (working)
- Tue, 11 Nov: 8h 40m (working)
- Mon, 10 Nov: 8h 22m (working)
- Sun, 09 Nov: Full day Weekly-off (skipped)
- Sat, 08 Nov: Full day Weekly-off (skipped)
...

 Summary Should Show:
- Total Hours: ~42h (example)
- Average/Day: ~8h 24m (example)
- Under-time Days: 1 (less than 8h)
- Overtime Days: 2 (more than 9h)
- Working Days: 5
```

---

##  Common Fixes

### Fix 1: Reload Extension
1. Go to `chrome://extensions/`
2. Click refresh icon on Keka Hours Tracker
3. Reload Keka page (F5)
4. Wait 3 seconds for overlay

### Fix 2: Check Manifest.json
```bash
cd /home/keerthana/Desktop/keka-hours-tracker
# Verify JSON is valid
python3 -c "import json; json.load(open('manifest.json'))" && echo " Valid"
```

### Fix 3: Update Selectors (Advanced)
1. Run `DEBUG_CONSOLE.js`
2. Note which selector finds rows
3. Edit `content.js` line 6-13
4. Replace with working selector
5. Reload extension

### Fix 4: Check Browser Compatibility
-  Chrome 90+
-  Edge 90+
-  Firefox (needs WebExtensions adaptation)
-  Safari (needs different setup)

---

##  Console Logs Reference

| Log | Meaning | Action |
|-----|---------|--------|
| `[Keka Tracker] Initializing...` | Extension starting | Normal |
| `Not on attendance logs page` | Wrong URL | Navigate to correct URL |
| `Found X rows using selector` | Data found |  Good |
| `No attendance rows found` | Table not found | Run debug script |
| `Extracted: DATE - TIME` | Row processed |  Good |
| `Skipping row: KEYWORD` | Holiday/leave | Normal |
| `Overlay created successfully` | UI shown |  Success |

---

##  Quick Test Procedure

1. **Activate venv:**
   ```bash
   cd /home/keerthana/Desktop/keka-hours-tracker
   source venv/bin/activate
   ```

2. **Verify setup:**
   ```bash
   python3 -c "from PIL import Image; print(' Ready')"
   ```

3. **Load extension in Chrome:**
   - `chrome://extensions/`
   - Load unpacked → Select folder

4. **Test on Keka page:**
   - Navigate to attendance/logs
   - Wait 3 seconds
   - Check bottom-right corner
   - Press F12 and check Console

5. **If issues, run debug:**
   - Copy `DEBUG_CONSOLE.js` content
   - Paste in browser console (F12)
   - Screenshot and report findings

---

##  Troubleshooting Checklist

- [ ] Extension loaded in Chrome (appears in list)
- [ ] On correct Keka URL (attendance/logs)
- [ ] Waiting at least 2-3 seconds
- [ ] Checked console for errors (F12 → Console)
- [ ] Tried refreshing page (F5)
- [ ] Tried refreshing extension (chrome://extensions/)
- [ ] Icons generated (check /icons/ folder)
- [ ] manifest.json is valid JSON

---

##  Success Indicators

 Extension icon appears in Chrome toolbar  
 Console shows `[Keka Tracker] Initializing...`  
 Overlay appears in bottom-right corner  
 Data shows correct hours (not all 0h)  
 Refresh button works  
 Can drag overlay around  

---

##  Report Issue

If extension isn't working, provide:
1. Console logs (screenshot)
2. Debug script output
3. Browser version
4. Keka page URL
5. Expected vs actual data

