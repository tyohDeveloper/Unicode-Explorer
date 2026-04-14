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
    row.className = "tr-clickable";
    row.title = "Click to insert into Composition Pad";
    var tdCh2 = document.createElement("td"); tdCh2.className = "td-ch clickable"; tdCh2.textContent = ch;
    var tdNm2 = document.createElement("td"); tdNm2.className = "td-name"; tdNm2.textContent = getCharName(item.cp);
    (function(ch2) {
      row.addEventListener("click", function() { insertToComposePad(ch2); });
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
