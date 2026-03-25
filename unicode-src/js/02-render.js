/* ================================================================
   RENDER ENGINE
   Auto-updates whenever the selection or display settings change.
   No "Show" button — the output is always live.
================================================================ */
var currentFontSize = 18;
var renderTimer = null;

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

  /* Build the character list.
     For grid modes: include reserved placeholders (cp, block, reserved flag).
     For table/plain: skip reserved and (optionally) non-visible. */
  var allCP = [];
  var isGridMode = (mode === "grid" || mode === "grid-cp");

  blocks.forEach(function(b) {
    for (var cp = b[1]; cp <= b[2]; cp++) {
      if (cp >= 0xD800 && cp <= 0xDFFF) continue; // never include raw surrogates
      var res = isReserved(cp);
      if (res) {
        if (isGridMode) allCP.push({ cp: cp, block: b[0], reserved: true });
        /* else: skip reserved in table / plain */
        continue;
      }
      if (!includeNV && isNonVisible(cp)) continue;
      allCP.push({ cp: cp, block: b[0], reserved: false });
    }
  });

  var total = allCP.filter(function(x) { return !x.reserved; }).length;
  document.getElementById("stat-chars").textContent =
    total.toLocaleString() + " character" + (total === 1 ? "" : "s");

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
   Reserved code points appear as dashed-outline empty cells.
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
      if (item.reserved) {
        /* Reserved slot: dashed outline, no glyph, no tooltip */
        el.className = (showCP ? "gcc" : "gc") + " reserved";
        if (showCP) {
          var c = document.createElement("span"); c.className = "cp";
          c.textContent = hex4(item.cp);
          el.appendChild(c);
        }
      } else {
        var ch = cpToStr(item.cp);
        el.className = showCP ? "gcc" : "gc";
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
   TABLE RENDERER
   Reserved code points are omitted entirely.
   Name column shows the full Unicode English name from CN/ALGO.
================================================================ */
function renderTable(output, blocks, allCP) {
  var tbl = document.createElement("table");
  tbl.className = "char-table";
  tbl.setAttribute("cellspacing", "0");
  tbl.setAttribute("cellpadding", "0");
  var thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>Code Point</th><th>Ch</th><th>Name</th><th>Block</th></tr>";
  tbl.appendChild(thead);
  var tbody = document.createElement("tbody");
  var byBlock = groupByBlock(allCP);

  blocks.forEach(function(b) {
    var items = byBlock[b[0]]; if (!items || !items.length) return;
    /* All items here already have reserved=false (filtered in renderOutput) */
    var sr = document.createElement("tr"); sr.className = "block-sep";
    var sd = document.createElement("td"); sd.setAttribute("colspan", "4");
    sd.textContent = b[0] + "  (" + cpHex(b[1]) + " \u2013 " + cpHex(b[2]) + ")";
    sr.appendChild(sd); tbody.appendChild(sr);

    items.forEach(function(item) {
      var row = document.createElement("tr");
      var ch = cpToStr(item.cp);
      var tdCp = document.createElement("td"); tdCp.className = "td-cp"; tdCp.textContent = cpHex(item.cp);
      var tdCh = document.createElement("td"); tdCh.className = "td-ch clickable"; tdCh.textContent = ch;
      tdCh.title = "Click to insert into Composition Pad";
      var tdNm = document.createElement("td"); tdNm.className = "td-name"; tdNm.textContent = getCharName(item.cp);
      var tdBl = document.createElement("td"); tdBl.className = "td-block"; tdBl.textContent = item.block;
      /* Click on Ch cell inserts into composition pad */
      (function(ch2) {
        tdCh.addEventListener("click", function() { insertToComposePad(ch2); });
      }(ch));
      row.appendChild(tdCp); row.appendChild(tdCh); row.appendChild(tdNm); row.appendChild(tdBl);
      tbody.appendChild(row);
    });
  });
  tbl.appendChild(tbody);
  output.appendChild(tbl);
}

/* ================================================================
   PLAIN TEXT RENDERER
   Reserved code points are omitted entirely.
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
