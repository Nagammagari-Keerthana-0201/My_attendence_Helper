(function () {
  'use strict';

  const REQUIRED_EFFECTIVE_MINUTES = 495; // 8h 15m 
  const REQUIRED_GROSS_MINUTES = 540;     // 9h 

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

  function todayParts() {
    try {
      const d = new Date();
      return {
        day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        date: String(d.getDate())
      };
    } catch (e) {
      const d = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        day: days[d.getDay()],
        date: String(d.getDate())
      };
    }
  }

  // Calculate gross hours with break time following Keka rules
  function calculateGrossHours(effectiveMinutes, breakTakenMinutes) {
    const BREAK_CAP = 45;
    const allowedBreak = Math.min(breakTakenMinutes, BREAK_CAP);
    const Worked_Gross = effectiveMinutes + allowedBreak;
    const extraBreak = Math.max(0, breakTakenMinutes - BREAK_CAP);

    return {
      gross: Worked_Gross,
      allowedBreak: allowedBreak,
      extraBreak: extraBreak
    };
  }

  function parseSwipeTime(t) {
    if (!t || t === "MISSING") return null;
    const d = new Date();
    return new Date(`${d.toDateString()} ${t}`).getTime();
  }

  // swipes: array of time strings (paired IN/OUT). options: { isTodayMenu: boolean }
  // Returns: { effectiveMinutes, breakMinutes, allBreaksMinutes }
  function calculateWorked(swipes, options = {}) {
    let effectiveTotal = 0;
    let breakTotal = 0;
    let allBreaks = [];

    const nowMs = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayMs = endOfDay.getTime();
    const capNow = Math.min(nowMs, endOfDayMs);

    // Calculate effective work time and breaks
    for (let i = 0; i < swipes.length; i += 2) {
      const IN = parseSwipeTime(swipes[i]);
      const OUT = parseSwipeTime(swipes[i + 1]);

      if (IN && OUT) {
        effectiveTotal += (OUT - IN);

        // Calculate break: time between OUT and next IN
        if (i + 2 < swipes.length) {
          const nextIN = parseSwipeTime(swipes[i + 2]);
          if (nextIN) {
            const breakMs = nextIN - OUT;
            const breakMins = Math.floor(breakMs / 60000);
            breakTotal += breakMins;
            allBreaks.push(breakMins);
          }
        }
      } else if (IN && !OUT) {
        // Ongoing session
        const endMs = options.isTodayMenu ? capNow : nowMs;
        effectiveTotal += (endMs - IN);
      }
    }

    const effectiveMinutes = Math.floor(effectiveTotal / 60000);

    return {
      effectiveMinutes,
      breakMinutes: breakTotal,
      allBreaks
    };
  }

  function extractToday(menuEl) {
    const dropdown =
      menuEl ||
      document.querySelector(DROPDOWN_MENU_SELECTOR) ||
      document.querySelector(DROPDOWN_SELECTOR);

    if (!dropdown) {
      console.log("KEKA TRACKER: Dropdown not detected yet");
      return null;
    }

    console.log("KEKA TRACKER: Dropdown detected", dropdown);

    const rowText =
      menuEl?.closest(".dropdown.attendance-logs-row")?.textContent || "";

    const { day, date } = todayParts();
    const isTodayMenu = rowText.includes(day) && rowText.includes(date);

    let shiftText = "";
    const shiftP =
      dropdown.querySelector(".shift-item .time-range") ||
      dropdown.querySelector(".data-block p") ||
      dropdown.querySelector("p");

    if (shiftP) shiftText = shiftP.textContent.trim();

    const timePattern = /\d{1,2}:\d{2}:\d{2}\s*(AM|PM)?|MISSING/gi;
    const textCandidates = Array.from(
      dropdown.querySelectorAll("span, div, p, label")
    );
    const swipes = [];

    for (const el of textCandidates) {
      const t = (el.textContent || "").trim();
      if (!t) continue;
      const matches = t.match(timePattern);
      if (matches) matches.forEach((m) => swipes.push(m.trim()));
    }

    const missingIndex = swipes.findIndex((s) => /MISSING/i.test(s));

    if (missingIndex !== -1) {
      console.log(
        "KEKA TRACKER: Found MISSING at index",
        missingIndex,
        "— trimming swipes to before MISSING"
      );
      swipes.splice(missingIndex);
    }

    //  MAIN FIX — ongoing session handling
    if (swipes.length % 2 === 1) {
      if (!(isTodayMenu && missingIndex !== -1)) {
        console.log(
          "KEKA TRACKER: Removing unmatched swipe entry",
          swipes[swipes.length - 1]
        );
        swipes.pop();
      } else {
        console.log(
          "KEKA TRACKER: Keeping last IN as ongoing session for today"
        );
      }
    }

    console.log("KEKA TRACKER: Swipes collected", swipes);
    let inTime = swipes.length > 0 ? swipes[0] : "N/A";

    const { effectiveMinutes, breakMinutes } = calculateWorked(swipes, {
      isTodayMenu
    });

    const { gross, allowedBreak, extraBreak } =
      calculateGrossHours(effectiveMinutes, breakMinutes);

    // Remaining based ONLY on gross
    const remainingGross = Math.max(
      0,
      REQUIRED_GROSS_MINUTES - gross
    );

    // Logout time
    const totalRemainingMs = (remainingGross + extraBreak) * 60000;

    const end = new Date(Date.now() + totalRemainingMs)
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
      inTime,
      effectiveMinutes,
      breakMinutes,
      allowedBreak,
      gross,
      remaining: remainingGross,
      extraBreak,
      end
    };
  }



  function createUI(info) {
    let box = document.getElementById("today-tracker-box");

    if (!box) {
      box = document.createElement("div");
      box.id = "today-tracker-box";

      // Base styles
      box.style.position = "fixed";
      box.style.bottom = "20px";
      box.style.right = "20px";
      box.style.width = "260px";
      box.style.padding = "8px 10px";
      box.style.borderRadius = "10px";
      box.style.fontFamily = "Inter, Arial, sans-serif";
      box.style.fontSize = "12px";
      box.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      box.style.zIndex = 999999;
      box.style.cursor = "move";
      box.style.opacity = "0";
      box.style.transform = "translateY(16px)";
      box.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      box.style.backdropFilter = "blur(8px)";

      // 🌗 Theme handling
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        box.style.background = "rgba(28,28,30,0.95)";
        box.style.color = "#f5f5f5";
        box.style.border = "1px solid rgba(255,255,255,0.15)";
      } else {
        box.style.background = "rgba(255,255,255,0.9)";
        box.style.color = "#111";
        box.style.border = "1px solid rgba(0,0,0,0.15)";
      }

      function formatMinutes(totalMinutes) {
        if (typeof totalMinutes !== "number" || isNaN(totalMinutes)) return "-";
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      }

      const eff = formatMinutes(info?.effectiveMinutes);
      const brk = formatMinutes(info?.breakMinutes);
      const g = formatMinutes(info?.gross);
      const r = formatMinutes(info?.remaining);
      const extra = info?.extraBreak > 0 ? formatMinutes(info.extraBreak) : null;

      box.innerHTML = `
  <div style="font-weight:700; font-size:13px; text-align:center; margin-bottom:8px;">
    Today
  </div>

  <div style="display:grid; grid-template-columns: 1fr 1fr; row-gap:6px; column-gap:10px;">

    <div style="opacity:0.7;">In</div>
    <div style="font-weight:600; text-align:right;">${info?.inTime || "N/A"}</div>

    <div style="opacity:0.7;">Effective</div>
    <div style="font-weight:600; text-align:right;">${eff}</div>

    <div style="opacity:0.7;">Break</div>
    <div style="font-weight:600; text-align:right;">${brk}</div>

    <div style="opacity:0.7;">Gross</div>
    <div style="font-weight:600; text-align:right;">${g}</div>

    <div style="opacity:0.7;">Remaining</div>
    <div style="font-weight:600; text-align:right;">${r}</div>

    <div style="opacity:0.7;">Logout</div>
    <div style="font-weight:600; text-align:right;">${info?.end || "-"}</div>
  </div>

  ${extra ? `
    <div style="
      margin-top:8px;
      padding:6px;
      font-size:11px;
      border-radius:6px;
      background: ${isDark ? "rgba(255,193,7,0.15)" : "#fff3cd"};
      color: ${isDark ? "#ffd666" : "#856404"};
      border-left: 3px solid #ffc107;
    ">
      Extra Break: ${extra}
    </div>
  ` : ""}
`;


      // 🖱 Drag support
      let offsetX = 0, offsetY = 0, isDragging = false;

      box.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - box.getBoundingClientRect().left;
        offsetY = e.clientY - box.getBoundingClientRect().top;
        box.style.transition = "none";
      });

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        box.style.left = e.clientX - offsetX + "px";
        box.style.top = e.clientY - offsetY + "px";
        box.style.right = "auto";
        box.style.bottom = "auto";
      });

      document.addEventListener("mouseup", () => {
        isDragging = false;
        box.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      });

      document.body.appendChild(box);
      requestAnimationFrame(() => {
        box.style.opacity = "1";
        box.style.transform = "translateY(0)";
      });
    }

    function openTodayRow() {
      const { day, date } = todayParts();
      console.log('KEKA TRACKER: Looking for today row matching: day=' + day + ', date=' + date);

      const candidates = document.querySelectorAll('.d-flex.align-items-center.px-16.py-12.on-hover.border-bottom');
      console.log('KEKA TRACKER: Candidate rows found:', candidates.length);
      if (!candidates || candidates.length === 0) {
        console.log('KEKA TRACKER: No candidate rows found');
        return false;
      }

      for (const el of candidates) {
        const text = (el.textContent || '').trim();
        if (text.includes(day) && text.includes(date)) {
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
      const { day, date } = todayParts();
      let info = null;
      const rows = document.querySelectorAll('.dropdown.attendance-logs-row');
      let todayMenu = null;
      for (const r of rows) {
        if ((r.textContent || '').includes(day) && (r.textContent || '').includes(date)) {
          todayMenu = r.querySelector('.dropdown-menu.dropdown-menu-logs.show') || r.querySelector('.dropdown-menu.dropdown-menu-logs');
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
        createUI({ inTime: 'N/A', effectiveMinutes: 0, breakMinutes: 0, allowedBreak: 0, gross: 0, remaining: REQUIRED_MINUTES, extraBreak: 0, end: '-' });
      }
    }

    function init() {
      if (!location.href.includes("attendance/logs")) {
        console.log("KEKA TRACKER: Not on attendance page, stopping");
        return;
      }

      console.log("KEKA TRACKER: Initializing");
      setTimeout(update, 2000);
      setInterval(update, UPDATE_INTERVAL);
    }

    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", init)
      : init();

  }
})
