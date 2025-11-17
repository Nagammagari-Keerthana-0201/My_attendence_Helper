// Debugging Helper for Keka Hours Tracker
// Paste this in the browser console on the Keka attendance page to diagnose issues

console.log(`%c=== KEKA TRACKER DEBUGGER ===`, 'color: blue; font-size: 16px; font-weight: bold;');

// Check if page is correct
if (window.location.href.includes('attendance/logs')) {
  console.log('%c Page: Correct URL (attendance/logs)', 'color: green;');
} else {
  console.log('%c Page: Wrong URL - should be attendance/logs', 'color: red;');
  console.log('Current URL:', window.location.href);
}

// Try different selectors
const selectors = [
  'table tbody tr',
  'div[data-cy="attendance-log-row"]',
  '.attendance-table tbody tr',
  '[class*="attendance"] tbody tr',
  'tr[data-test-id*="attendance"]',
  'div[class*="LogRow"]',
  'div[class*="log-row"]'
];

console.log('%c\nTrying Selectors:', 'color: purple; font-weight: bold;');
selectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  const status = elements.length > 0 ? '✅' : '❌';
  console.log(`${status} "${selector}" - Found ${elements.length} elements`);
  
  // Show first element structure for successful selectors
  if (elements.length > 0) {
    console.log(`   First element:`, elements[0].outerHTML.substring(0, 200) + '...');
  }
});

// Look for effective hours pattern
console.log('%c\nSearching for Time Patterns:', 'color: purple; font-weight: bold;');
const timePattern = /(\d+)h\s*(\d+)m|(\d+)h|(\d+)m/gi;
const pageText = document.body.innerText;
const matches = pageText.match(timePattern);
if (matches) {
  console.log(` Found ${matches.length} time patterns:`, [...new Set(matches)].slice(0, 10));
} else {
  console.log(' No time patterns found');
}

// Look for table structure
console.log('%c\nTable Structure Analysis:', 'color: purple; font-weight: bold;');
const tables = document.querySelectorAll('table');
console.log(`Found ${tables.length} tables`);

tables.forEach((table, idx) => {
  const rows = table.querySelectorAll('tbody tr');
  console.log(`  Table ${idx}: ${rows.length} rows`);
  
  if (rows.length > 0) {
    const firstRow = rows[0];
    const cells = firstRow.querySelectorAll('td, th');
    console.log(`    First row has ${cells.length} cells:`);
    cells.forEach((cell, cellIdx) => {
      console.log(`      Cell ${cellIdx}: "${cell.textContent.trim().substring(0, 50)}"`);
    });
  }
});

// Check extension presence
console.log('%c\nExtension Status:', 'color: purple; font-weight: bold;');
const overlay = document.getElementById('keka-hours-overlay');
if (overlay) {
  console.log(' Extension overlay found!');
  console.log('   Content:', overlay.innerText);
} else {
  console.log(' Extension overlay NOT found - extension may not be loaded');
}

// Look for date indicators
console.log('%c\nDate/Time Indicators:', 'color: purple; font-weight: bold;');
const dateElements = document.querySelectorAll('[class*="date"], [class*="Date"]');
console.log(`Found ${dateElements.length} date-related elements`);

console.log('%c\n=== END DEBUG INFO ===', 'color: blue; font-size: 16px; font-weight: bold;');
console.log('%c Tip: Copy any element info above to debug further', 'color: orange;');
