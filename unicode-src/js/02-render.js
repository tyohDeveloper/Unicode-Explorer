/* ================================================================
   RENDER ENGINE
   Auto-updates whenever the selection or display settings change.
   No "Show" button — the output is always live.
================================================================ */
var currentFontSize = 18;
var renderTimer = null;

/* ================================================================
   TABLE SORT STATE
   col: null = default (block-grouped, code-point order)
        "cp" | "ch" | "name" | "block" = user-selected column
   dir: 1 = ascending, -1 = descending
   Stored separately so column-header clicks can re-sort without
   triggering a full renderOutput() (which would reset the state).
================================================================ */
var tableSortState = { col: null, dir: 1 };
var tableSortAllCP   = [];   // retained for in-place re-sorts
var tableSortBlocks  = [];   // retained for in-place re-sorts

/* Debounced render — batches rapid checkbox clicks */
function scheduleRender() {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(renderOutput, 80);
}

function getSelectedBlocks() {
  var r = [], cks = getAllChecks();
  for (var i = 0; i < cks.length; i++) {
    if (cks[i].checked) r.push(BLOCKS[parseInt(cks[i].dataset.idx, 10)]);
  }
  return r;
}

function getMode() {
  var radios = document.querySelectorAll("input[name=mode]");
  for (var i = 0; i < radios.length; i++) if (radios[i].checked) return radios[i].value;
  return "grid";
}

/* ---- Auto-trigger on mode / nonvis changes ---- */
document.querySelectorAll("input[name=mode]").forEach(function(r) {
  r.addEventListener("change", renderOutput);
});
document.getElementById("chk-nonvis").addEventListener("change", renderOutput);

/* ================================================================
   MAIN RENDER FUNCTION
================================================================ */
function renderOutput() {
  /* Reset table sort state on every full render (block change, mode change, etc.) */
  tableSortState = { col: null, dir: 1 };

  var blocks = getSelectedBlocks();
  var includeNV = document.getElementById("chk-nonvis").checked;
  var mode = getMode();
  var output = document.getElementById("output");

  /* No selection */
  if (blocks.length === 0) {
    output.innerHTML = "";
    var ph = document.createElement("div"); ph.id = "placeholder";
    ph.innerHTML = "<span class=\"big\">&#x2B1B;</span><p>Select one or more Unicode blocks from the sidebar.</p>";
    output.appendChild(ph);
    document.getElementById("stat-chars").textContent = "";
    return;
  }

  /* Build the character list for all renderers.
     Surrogates are always excluded. Non-visible characters are excluded
     unless the user has checked "Include non-visible".
     Reserved (unassigned) code points are included with reserved:true so
     the grid can show their placeholder cell. */
  var allCP = [];

  blocks.forEach(function(b) {
    for (var cp = b[1]; cp <= b[2]; cp++) {
      if (cp >= 0xD800 && cp <= 0xDFFF) continue; // never include raw surrogates
      var reserved = isReserved(cp);
      if (!reserved && !includeNV && isNonVisible(cp)) continue;
      allCP.push({ cp: cp, block: b[0], reserved: reserved });
    }
  });

  var assigned = 0;
  for (var i = 0; i < allCP.length; i++) { if (!allCP[i].reserved) assigned++; }
  document.getElementById("stat-chars").textContent =
    assigned.toLocaleString() + " character" + (assigned === 1 ? "" : "s");

  output.innerHTML = "";
  output.style.fontSize = currentFontSize + "px";

  if (allCP.length === 0) {
    var ph2 = document.createElement("div"); ph2.id = "placeholder";
    ph2.innerHTML = "<span class=\"big\">&#x2205;</span><p>No characters with current settings.</p>";
    output.appendChild(ph2);
    return;
  }

  if      (mode === "grid")    renderGrid(output, blocks, allCP, false);
  else if (mode === "grid-cp") renderGrid(output, blocks, allCP, true);
  else if (mode === "table")   renderTable(output, blocks, allCP);
  else                         renderPlain(output, allCP);
}

/* ================================================================
   COMPOSITION PAD INSERT HELPER
================================================================ */
function insertToComposePad(ch) {
  var ta = document.getElementById("compose-pad");
  if (!ta) return;
  /* Open the pad automatically if it is collapsed */
  var section = document.getElementById("compose-section");
  if (section && !section.className.match(/\bopen\b/)) {
    section.className += " open";
    var icon = document.getElementById("compose-toggle-icon");
    if (icon) icon.textContent = "\u25BC"; /* ▼ */
  }
  var start = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
  var end   = ta.selectionEnd   != null ? ta.selectionEnd   : ta.value.length;
  ta.value = ta.value.slice(0, start) + ch + ta.value.slice(end);
  var newPos = start + ch.length;
  ta.selectionStart = newPos;
  ta.selectionEnd   = newPos;
  ta.focus();
}

/* ================================================================
   HELPERS
================================================================ */
function groupByBlock(allCP) {
  var m = {};
  allCP.forEach(function(item) {
    if (!m[item.block]) m[item.block] = [];
    m[item.block].push(item);
  });
  return m;
}

function makeSepHeading(b) {
  var sep = document.createElement("span");
  sep.className = "block-sep-heading";
  sep.textContent = b[0] + "  (" + cpHex(b[1]) + " \u2013 " + cpHex(b[2]) + ")";
  return sep;
}

/* ================================================================
   GRID RENDERER
================================================================ */
function renderGrid(output, blocks, allCP, showCP) {
  var byBlock = groupByBlock(allCP);
  blocks.forEach(function(b) {
    var items = byBlock[b[0]]; if (!items || !items.length) return;
    output.appendChild(makeSepHeading(b));
    var grid = document.createElement("div");
    grid.className = showCP ? "char-grid-cp" : "char-grid";

    items.forEach(function(item) {
      var el = document.createElement("div");
      var base = showCP ? "gcc" : "gc";
      el.className = item.reserved ? base + " cell-reserved" : base;
      if (item.reserved) {
        el.title = cpHex(item.cp) + "  (reserved / unassigned)";
      } else {
        var ch = cpToStr(item.cp);
        el.title = cpHex(item.cp) + "  " + getCharName(item.cp) + " \u2014 click to insert";
        if (!showCP) {
          el.textContent = ch;
        } else {
          var g = document.createElement("span"); g.className = "glyph"; g.textContent = ch;
          var c2 = document.createElement("span"); c2.className = "cp";
          c2.textContent = hex4(item.cp);
          el.appendChild(g); el.appendChild(c2);
        }
        /* Click inserts into composition pad */
        (function(ch2) {
          el.addEventListener("click", function() { insertToComposePad(ch2); });
        }(ch));
      }
      grid.appendChild(el);
    });
    output.appendChild(grid);
  });
}

/* ================================================================
   TABLE RENDERER — SORT HELPERS
================================================================ */

/* Return a stable-sorted copy of items per tableSortState */
function sortedTableItems(items) {
  if (!tableSortState.col) return items.slice(); // null = natural order

  var col = tableSortState.col;
  var dir = tableSortState.dir;

  /* Tag each item with its original index for stable sort */
  var tagged = items.map(function(item, i) { return { item: item, i: i }; });

  tagged.sort(function(a, b) {
    var cmp = 0;
    if (col === "cp" || col === "ch") {
      cmp = a.item.cp - b.item.cp;
    } else if (col === "name") {
      cmp = getCharName(a.item.cp).localeCompare(getCharName(b.item.cp));
    } else if (col === "block") {
      cmp = a.item.block.localeCompare(b.item.block);
      if (cmp === 0) cmp = a.item.cp - b.item.cp;
    }
    if (cmp === 0) cmp = a.i - b.i; // preserve original order as final tiebreaker
    return cmp * dir;
  });

  return tagged.map(function(t) { return t.item; });
}

/* Build the <thead> row with clickable, sortable column headers */
function buildTableHead() {
  var cols = [
    { key: "cp",    label: "Code Point" },
    { key: "ch",    label: "Ch" },
    { key: "name",  label: "Name" },
    { key: "block", label: "Block" },
  ];

  var thead = document.createElement("thead");
  var tr    = document.createElement("tr");

  cols.forEach(function(c) {
    var th = document.createElement("th");
    th.className = "sortable";
    th.textContent = c.label;

    var indicator = document.createElement("span");
    indicator.className = "sort-indicator";

    if (tableSortState.col === c.key) {
      th.classList.add("sort-active");
      indicator.textContent = tableSortState.dir === 1 ? " \u25B2" : " \u25BC"; /* ▲ / ▼ */
    }
    th.appendChild(indicator);

    (function(key) {
      th.addEventListener("click", function() { applyTableSort(key); });
    }(c.key));

    tr.appendChild(th);
  });

  thead.appendChild(tr);
  return thead;
}

/* Build the <tbody>; when a user sort is active use a flat list (no block seps) */
function buildTableBody(allCP, blocks) {
  var tbody = document.createElement("tbody");

  if (!tableSortState.col) {
    /* Default: block-grouped with separator rows */
    var byBlock = groupByBlock(allCP);
    blocks.forEach(function(b) {
      var items = byBlock[b[0]]; if (!items || !items.length) return;
      var sr = document.createElement("tr"); sr.className = "block-sep";
      var sd = document.createElement("td"); sd.setAttribute("colspan", "4");
      sd.textContent = b[0] + "  (" + cpHex(b[1]) + " \u2013 " + cpHex(b[2]) + ")";
      sr.appendChild(sd); tbody.appendChild(sr);
      items.forEach(function(item) { tbody.appendChild(makeTableRow(item)); });
    });
  } else {
    /* User sort: flat list, no block separators */
    var sorted = sortedTableItems(allCP);
    sorted.forEach(function(item) { tbody.appendChild(makeTableRow(item)); });
  }

  return tbody;
}

/* Build a single table data row */
function makeTableRow(item) {
  var row = document.createElement("tr");
  var tdCp = document.createElement("td"); tdCp.className = "td-cp"; tdCp.textContent = cpHex(item.cp);
  var tdBl = document.createElement("td"); tdBl.className = "td-block"; tdBl.textContent = item.block;

  if (item.reserved) {
    row.className = "tr-reserved";
    var tdCh = document.createElement("td"); tdCh.className = "td-ch";
    var tdNm = document.createElement("td"); tdNm.className = "td-name td-reserved-label";
    tdNm.textContent = "(reserved / unassigned)";
    row.appendChild(tdCp); row.appendChild(tdCh); row.appendChild(tdNm); row.appendChild(tdBl);
  } else {
    var ch = cpToStr(item.cp);
    var tdCh2 = document.createElement("td"); tdCh2.className = "td-ch clickable"; tdCh2.textContent = ch;
    tdCh2.title = "Click to insert into Composition Pad";
    var tdNm2 = document.createElement("td"); tdNm2.className = "td-name"; tdNm2.textContent = getCharName(item.cp);
    (function(ch2) {
      tdCh2.addEventListener("click", function() { insertToComposePad(ch2); });
    }(ch));
    row.appendChild(tdCp); row.appendChild(tdCh2); row.appendChild(tdNm2); row.appendChild(tdBl);
  }
  return row;
}

/* Handle a column header click — update state, swap thead + tbody in place */
function applyTableSort(col) {
  if (tableSortState.col === col) {
    tableSortState.dir = -tableSortState.dir;
  } else {
    tableSortState.col = col;
    tableSortState.dir = 1;
  }

  var output = document.getElementById("output");
  var tbl    = output ? output.querySelector("table.char-table") : null;
  if (!tbl) return;

  /* Replace thead (to refresh sort indicators) and tbody (new order) */
  tbl.replaceChild(buildTableHead(),                           tbl.querySelector("thead"));
  tbl.replaceChild(buildTableBody(tableSortAllCP, tableSortBlocks), tbl.querySelector("tbody"));
}

/* ================================================================
   TABLE RENDERER
   Name column shows the full Unicode English name from CN/ALGO.
================================================================ */
function renderTable(output, blocks, allCP) {
  /* Store for in-place re-sorts triggered by header clicks */
  tableSortBlocks = blocks;
  tableSortAllCP  = allCP;

  var tbl = document.createElement("table");
  tbl.className = "char-table";
  tbl.setAttribute("cellspacing", "0");
  tbl.setAttribute("cellpadding", "0");
  tbl.appendChild(buildTableHead());
  tbl.appendChild(buildTableBody(allCP, blocks));
  output.appendChild(tbl);
}

/* ================================================================
   PLAIN TEXT RENDERER
================================================================ */
function renderPlain(output, allCP) {
  var div = document.createElement("div");
  div.id = "plain-text-out";
  var parts = [];
  allCP.forEach(function(item) {
    if (!item.reserved) parts.push(cpToStr(item.cp));
  });
  div.textContent = parts.join(" ");
  output.appendChild(div);
}
