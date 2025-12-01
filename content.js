(function () {
  'use strict';

  const REQUIRED_MINUTES = 495;
  const UPDATE_INTERVAL = 10000;
  console.log("KEKA TRACKER: Loaded");

  function todayLabel() {
    const d = new Date();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const day = d.getDate().toString().padStart(2, '0');
    return `${days[d.getDay()]}, ${day} ${months[d.getMonth()]}`;
  }

  function parseSwipeTime(t) {
    if (!t || t === "MISSING") return null;
    const d = new Date();
    return new Date(`${d.toDateString()} ${t}`).getTime();
  }

  function calculateWorked(swipes) {
    let total = 0;
    const nowMs = Date.now();

    for (let i = 0; i < swipes.length; i += 2) {
      const IN = parseSwipeTime(swipes[i]);
      const OUT = parseSwipeTime(swipes[i + 1]);

      if (IN && OUT) total += (OUT - IN);
      else if (IN && !OUT) total += (nowMs - IN);
    }

    return Math.floor(total / 60000);
  }

  function openTodayRow() {
    const label = todayLabel();
    console.log("KEKA TRACKER: Searching for row:", label);

    const rows = document.querySelectorAll('.attendance-logs-row');

    for (const row of rows) {
      const dateEl = row.querySelector('.w-250 span');
      if (!dateEl) continue;

      if (dateEl.textContent.trim() === label) {
        console.log("KEKA TRACKER: Found today's row");

        if (row.classList.contains('open')) {
          console.log("KEKA TRACKER: Already open");
          return row;
        }

        const toggle = row.querySelector('[dropdowntoggle]');
        if (toggle) {
          console.log("KEKA TRACKER: Clicking to open");
          toggle.click();
          return row;
        }
      }
    }
    return null;
  }

  function extractSwipes(row) {
    if (!row) return [];

    const menu = row.parentElement.querySelector('.dropdown-menu.show');
    console.log("MENU FOUND:", menu);

    if (!menu) return [];

    const headLabel = menu.querySelector('label.font-weight-bold');
    if (!headLabel || headLabel.textContent.trim() !== "HEAD OFFICE") return [];

    const container = headLabel.nextElementSibling;
    if (!container) return [];

    const swipeRows = container.querySelectorAll('.d-flex.mt-10.ng-star-inserted');
    const swipes = [];

    swipeRows.forEach(r => {
      const spans = r.querySelectorAll('span.ng-star-inserted');
      spans.forEach(s => {
        const t = s.textContent.trim();
        if (t && t !== "MISSING") swipes.push(t);
      });
    });

    return swipes;
  }


  function createUI(info) {
    let box = document.getElementById("today-tracker-box");

    if (!box) {
      box = document.createElement("div");
      box.id = "today-tracker-box";

      Object.assign(box.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#fff",
        padding: "15px",
        width: "220px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        zIndex: 999999,
        fontFamily: "Inter, sans-serif",
        boxShadow: "0 2px 7px rgba(0,0,0,0.2)",
        cursor: "move"
      });

      document.body.appendChild(box);

      // =============== DRAGGABLE FEATURE HERE ===============
      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;

      box.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - box.getBoundingClientRect().left;
        offsetY = e.clientY - box.getBoundingClientRect().top;
      });

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        box.style.left = (e.clientX - offsetX) + "px";
        box.style.top = (e.clientY - offsetY) + "px";
        box.style.right = "unset";
        box.style.bottom = "unset";
      });

      document.addEventListener("mouseup", () => {
        isDragging = false;
      });
      // =======================================================
    }

    const worked = info.worked;
    const remaining = REQUIRED_MINUTES - worked;
    const outTime = new Date(Date.now() + remaining * 60000)
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    box.innerHTML = `
      <div style="font-weight:700; margin-bottom:8px; font-size:15px;">Today Summary</div>

      <div><b>In Time:</b> ${info.inTime}</div>
      <div><b>Worked:</b> ${Math.floor(worked / 60)}h ${worked % 60}m</div>
      <div><b>Remaining:</b> ${remaining > 0 ? Math.floor(remaining / 60) + "h " + (remaining % 60) + "m" : "0m"}</div>
      <div><b>Logout:</b> ${outTime}</div>
    `;
  }

  function update() {
    console.log("KEKA TRACKER: Updating…");

    const row = openTodayRow();
    if (!row) return;

    setTimeout(() => {
      const swipes = extractSwipes(row);
      console.log("SWIPES:", swipes);

      if (swipes.length === 0) return;

      const worked = calculateWorked(swipes);
      createUI({ inTime: swipes[0], worked });

    }, 600);
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

})();
