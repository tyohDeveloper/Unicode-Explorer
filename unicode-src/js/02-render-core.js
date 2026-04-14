/* ================================================================
   RENDER ENGINE — CORE
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
  output.className = (mode === "grid" || mode === "grid-cp" || mode === "grid-name") ? "grid-mode" : "";
  output.style.fontSize = currentFontSize + "px";

  if (allCP.length === 0) {
    var ph2 = document.createElement("div"); ph2.id = "placeholder";
    ph2.innerHTML = "<span class=\"big\">&#x2205;</span><p>No characters with current settings.</p>";
    output.appendChild(ph2);
    return;
  }

  if      (mode === "grid")      renderGrid(output, blocks, allCP, false);
  else if (mode === "grid-cp")   renderGrid(output, blocks, allCP, true);
  else if (mode === "grid-name") renderGridName(output, blocks, allCP);
  else if (mode === "table")     renderTable(output, blocks, allCP);
  else                           renderPlain(output, allCP);
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
