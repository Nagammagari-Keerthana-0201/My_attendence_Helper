(function () {
  'use strict';

  const REQUIRED_MINUTES = 495;
  console.log("KEKA TRACKER: Content script loaded");
  const COUNT_TO_END_OF_DAY = true;

  let clickLock = false;

  const DROPDOWN_SELECTOR = `
    .attendance-detail-container,
    .attendance-details-pane,
    .details-panel,
    .attendance-log-details,
    [role="tooltip"],
    [role="dialog"],
    .popover-content,
    .popover,
    .ng-trigger-fadeIn,
    .info-container,
    .attendance-info,
    .head-office
  `;
  const DROPDOWN_MENU_SELECTOR = '.dropdown.attendance-logs-row .dropdown-menu.dropdown-menu-logs';

  function todayLabel() {
    try {
      return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (e) {
      const d = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    }
  }

  function parseSwipeTime(t) {
    if (!t || t === "MISSING") return null;
    const d = new Date();
    return new Date(`${d.toDateString()} ${t}`).getTime();
  }

  // swipes: array of time strings (paired IN/OUT). options: { isTodayMenu: boolean }
  function calculateWorked(swipes, options = {}) {
    let total = 0;
    const nowMs = Date.now();
    // End of today cap (23:59:59.999)
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayMs = endOfDay.getTime();
    const capNow = Math.min(nowMs, endOfDayMs);

    for (let i = 0; i < swipes.length; i += 2) {
      const IN = parseSwipeTime(swipes[i]);
      const OUT = parseSwipeTime(swipes[i + 1]);

      if (IN && OUT) {
        total += (OUT - IN);
      } else if (IN && !OUT) {
        // If this is today's menu we cap ongoing time to end of day so we don't count beyond 23:59:59
        const endMs = options.isTodayMenu ? capNow : nowMs;
        total += (endMs - IN);
      }
    }

    return Math.floor(total / 60000);
  }

  function extractToday(menuEl) {
    const dropdown = menuEl || document.querySelector(DROPDOWN_MENU_SELECTOR) || document.querySelector(DROPDOWN_SELECTOR);

    if (!dropdown) {
      console.log("KEKA TRACKER: Dropdown not detected yet");
      return null;
    }

    console.log("KEKA TRACKER: Dropdown detected", dropdown);

    let shiftText = '';
    const shiftP = dropdown.querySelector('.shift-item .time-range') || dropdown.querySelector('.data-block p') || dropdown.querySelector('p');
    if (shiftP) shiftText = shiftP.textContent.trim();
    let inTime = shiftText.split("-")[0]?.trim() || "N/A";
    const timePattern = /\d{1,2}:\d{2}:\d{2}\s*(AM|PM)?|MISSING/gi;
    const textCandidates = Array.from(dropdown.querySelectorAll('span, div, p, label'));
    const swipes = [];

    const headIndex = textCandidates.findIndex(n => (n.textContent || '').toUpperCase().includes('HEAD OFFICE'));
    if (headIndex !== -1) {
      for (let i = headIndex + 1; i < textCandidates.length; i++) {
        const nodeText = (textCandidates[i].textContent || '').trim();
        if (!nodeText) continue;
        const m = nodeText.match(timePattern);
        if (m) {
          const candidate = m.map(x => x.trim()).find(x => !/MISSING/i.test(x));
          if (candidate) {
            inTime = candidate;
            break;
          }
        }
      }
    }
    for (const el of textCandidates) {
      const t = (el.textContent || '').trim();
      if (!t) continue;
      const matches = t.match(timePattern);
      if (matches) {
        matches.forEach(m => swipes.push(m.trim()));
      }
    }
    const missingIndex = swipes.findIndex(s => /MISSING/i.test(s));
    const isTodayMenu = menuEl && (menuEl.closest('.dropdown.attendance-logs-row')?.textContent || '').includes(todayLabel());
    if (missingIndex !== -1) {
      console.log('KEKA TRACKER: Found MISSING at index', missingIndex, ' — trimming swipes to before MISSING');
      swipes.splice(missingIndex);
      if (isTodayMenu) {
        console.log('KEKA TRACKER: MISSING found for today — will treat trailing IN as ongoing (count until now)');
      }
    }
    if (swipes.length % 2 === 1 && !(missingIndex !== -1 && isTodayMenu && COUNT_TO_END_OF_DAY)) {
      console.log('KEKA TRACKER: Odd number of swipe entries after trimming — removing trailing unmatched entry', swipes[swipes.length - 1]);
      swipes.pop();
    }

    console.log("KEKA TRACKER: Swipes collected (trimmed, pairs only)", swipes);

    const worked = calculateWorked(swipes, { isTodayMenu });
    const remaining = Math.max(0, REQUIRED_MINUTES - worked);

    const end = new Date(Date.now() + remaining * 60000)
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return { inTime, worked, remaining, end };
  }

  function createUI(info) {
    const old = document.getElementById("today-tracker-box");
    if (old) old.remove();

    const box = document.createElement("div");
    box.id = "today-tracker-box";

    // UNIVERSAL THEME (works for black + white)
    Object.assign(box.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "230px",
      background: "#f8f9fb",
      color: "#1a1a1a",
      border: "1px solid #d0d0d0",
      borderRadius: "10px",
      padding: "14px 16px",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      zIndex: 999999
    });

    function formatMinutes(totalMinutes) {
      if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) return '-';
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    const w = info?.worked !== undefined ? formatMinutes(info.worked) : "-";
    const r = info?.remaining !== undefined ? formatMinutes(info.remaining) : "-";

    box.innerHTML = `
    <div style="font-weight:700; 
                margin-bottom:12px; 
                text-align:center; 
                font-size:15px;
                color:#1a1a1a;">
      Today Summary
    </div>

    <div style="margin-bottom:10px;">
      <div style="color:#555;">In Time</div>
      <div style="font-weight:600; color:#111;">${info?.inTime || 'N/A'}</div>
    </div>

    <div style="margin-bottom:10px;">
      <div style="color:#555;">Worked</div>
      <div style="font-weight:600; color:#111;">${w}</div>
    </div>

    <div style="margin-bottom:10px;">
      <div style="color:#555;">Remaining</div>
      <div style="font-weight:600; color:#111;">${r}</div>
    </div>

    <div>
      <div style="color:#555;">Est. Logout</div>
      <div style="font-weight:600; color:#111;">${info.end}</div>
    </div>
  `;

    document.body.appendChild(box);
  }
  function openTodayRow() {
    const label = todayLabel();
    console.log('KEKA TRACKER: Looking for today row matching:', label);

    const candidates = document.querySelectorAll('.d-flex.align-items-center.px-16.py-12.on-hover.border-bottom');
    if (!candidates || candidates.length === 0) {
      console.log('KEKA TRACKER: No candidate rows found');
      return false;
    }

    for (const el of candidates) {
      const text = (el.textContent || '').trim();
      if (text.includes(label)) {
        const dropdownParent = el.closest('.dropdown.attendance-logs-row') || el.parentElement;
        const expanded = el.getAttribute('aria-expanded') === 'true' || (dropdownParent && dropdownParent.classList.contains('open'));

        if (expanded) {
          console.log('KEKA TRACKER: Today row already expanded, skipping click');
          return true;
        }

        if (clickLock) {
          console.log('KEKA TRACKER: click locked, skipping programmatic click');
          return false;
        }

        try {
          console.log('KEKA TRACKER: Clicking today row to open dropdown');
          el.click();
          clickLock = true;
          setTimeout(() => { clickLock = false; console.log('KEKA TRACKER: clickLock released'); }, 4000);
          return true;
        } catch (err) {
          console.error('KEKA TRACKER: Error clicking today row', err);
          return false;
        }
      }
    }

    console.log('KEKA TRACKER: No matching today row found');
    return false;
  }

  function update() {
    console.log("KEKA TRACKER: Update running");
    const label = todayLabel();
    let info = null;
    const rows = document.querySelectorAll('.dropdown.attendance-logs-row');
    let todayMenu = null;
    for (const r of rows) {
      if ((r.textContent || '').includes(label)) {
        todayMenu = r.querySelector('.dropdown-menu.dropdown-menu-logs.show') || r.querySelector('.dropdown-menu');
        break;
      }
    }

    if (!todayMenu) {
      console.log('KEKA TRACKER: Dropdown for today not open, attempting to open today row');
      if (!openTodayRow()) return;
      return setTimeout(update, 1200);
    }
    info = extractToday(todayMenu);
    if (info) {
      console.log("KEKA TRACKER: Info extracted", info);
      createUI(info);
    } else {
      console.log("KEKA TRACKER: Info null - no swipe data found in dropdown");
      createUI({ inTime: 'N/A', worked: 0, remaining: REQUIRED_MINUTES, end: '-' });
    }
  }

  function init() {
    console.log("KEKA TRACKER: Initializing");

    if (!location.href.includes("attendance/logs"))
      return console.log("KEKA TRACKER: Page not attendance logs, stopping");

    setTimeout(update, 1500);
    setInterval(update, 30000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
