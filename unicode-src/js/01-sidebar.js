/* ================================================================
   SIDEBAR — COLLAPSIBLE BLOCK LIST
   Builds the category/block tree with click-to-expand sections.
   Block items use two independent visibility classes:
     .search-hidden  — set by the search filter
     .cat-hidden     — set when the parent category is collapsed
================================================================ */
var blockList = document.getElementById("block-list");
var catCollapseState = {}; // category name -> bool (true = collapsed)
var catCheckboxes = {};    // category name -> category checkbox element

(function buildSidebar() {
  var cats = [], catMap = {};
  BLOCKS.forEach(function(b, idx) {
    var cat = b[3];
    if (!catMap[cat]) { catMap[cat] = []; cats.push(cat); }
    catMap[cat].push(idx);
  });

  cats.forEach(function(cat) {
    /* ---- Category header ---- */
    var hdr = document.createElement("li");
    hdr.className = "cat-header";
    hdr.dataset.cat = cat;

    /* Category select-all checkbox (must stop propagation to avoid
       triggering the collapse handler on the parent <li>) */
    var catCb = document.createElement("input");
    catCb.type = "checkbox";
    catCb.className = "cat-check";
    catCb.title = "Select / deselect all blocks in " + cat;
    catCheckboxes[cat] = catCb;

    catCb.addEventListener("click", function(ev) {
      ev.stopPropagation();
      catCb.indeterminate = false;
      var checkAll = catCb.checked;
      var items = blockList.querySelectorAll("li.block-item[data-cat=\"" + cat + "\"]");
      for (var i = 0; i < items.length; i++) {
        var blkCb = items[i].querySelector("input.blk-check");
        if (blkCb) blkCb.checked = checkAll;
      }
      scheduleRender();
      updateStatus();
    });

    var toggle = document.createElement("span");
    toggle.className = "cat-toggle";
    toggle.textContent = "\u25BC"; // ▼

    hdr.appendChild(catCb);
    hdr.appendChild(toggle);
    hdr.appendChild(document.createTextNode(cat));
    blockList.appendChild(hdr);

    /* ---- Block items ---- */
    catMap[cat].forEach(function(idx) {
      var b = BLOCKS[idx];
      var li = document.createElement("li");
      li.className = "block-item";
      li.dataset.idx = String(idx);
      li.dataset.cat = cat;

      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "blk-check";      /* IMPORTANT: keeps cat-checks out of getAllChecks() */
      cb.id = "blk-" + idx;
      cb.dataset.idx = String(idx);

      var nm = document.createElement("span");
      nm.className = "block-name";
      nm.textContent = b[0];

      var rng = document.createElement("span");
      rng.className = "block-range";
      var s = hex4(b[1]).toUpperCase(), e = hex4(b[2]).toUpperCase();
      rng.textContent = s + "\u2013" + e;

      li.appendChild(cb);
      li.appendChild(nm);
      li.appendChild(rng);

      /* Clicking the row (not the checkbox itself) toggles the checkbox */
      li.addEventListener("click", function(ev) {
        if (ev.target !== cb) { cb.checked = !cb.checked; }
        syncCatCheck(cat);
        scheduleRender();
        updateStatus();
      });

      blockList.appendChild(li);
    });

    /* ---- Collapse / expand on header click ---- */
    hdr.addEventListener("click", function(ev) {
      /* Ignore clicks on the cat-check checkbox (already handled above) */
      if (ev.target === catCb) return;
      var collapsed = !catCollapseState[cat];
      catCollapseState[cat] = collapsed;
      hdr.classList.toggle("collapsed", collapsed);
      var items = blockList.querySelectorAll("li.block-item[data-cat=\"" + cat + "\"]");
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle("cat-hidden", collapsed);
      }
    });
  });
})();

/* ================================================================
   CATEGORY CHECKBOX SYNC
   Sets a category checkbox to checked / unchecked / indeterminate
   based on the current state of its block checkboxes.
================================================================ */
function syncCatCheck(cat) {
  var catCb = catCheckboxes[cat];
  if (!catCb) return;
  var items = blockList.querySelectorAll("li.block-item[data-cat=\"" + cat + "\"]");
  var total = 0, chk = 0;
  for (var i = 0; i < items.length; i++) {
    var cb = items[i].querySelector("input.blk-check");
    if (!cb) continue;
    total++;
    if (cb.checked) chk++;
  }
  catCb.indeterminate = false;
  if (total === 0 || chk === 0) {
    catCb.checked = false;
  } else if (chk === total) {
    catCb.checked = true;
  } else {
    catCb.checked = false;
    catCb.indeterminate = true;
  }
}

function syncAllCatChecks() {
  for (var cat in catCheckboxes) { syncCatCheck(cat); }
}

/* ================================================================
   SIDEBAR CONTROLS — All / None / Search
================================================================ */
function getAllChecks() {
  return blockList.querySelectorAll("input.blk-check");
}

document.getElementById("btn-all").addEventListener("click", function() {
  var cks = getAllChecks();
  for (var i = 0; i < cks.length; i++) {
    /* Only check visible (not search-hidden) items */
    var li = cks[i].parentElement;
    if (!li.classList.contains("search-hidden")) cks[i].checked = true;
  }
  syncAllCatChecks();
  scheduleRender();
  updateStatus();
});

document.getElementById("btn-none").addEventListener("click", function() {
  var cks = getAllChecks();
  for (var i = 0; i < cks.length; i++) cks[i].checked = false;
  syncAllCatChecks();
  scheduleRender();
  updateStatus();
});

document.getElementById("block-search").addEventListener("input", function() {
  var q = this.value.toLowerCase();
  var items = blockList.querySelectorAll("li.block-item");
  items.forEach(function(li) {
    var nm = li.querySelector(".block-name");
    if (!nm) return;
    var match = (q === "") || (nm.textContent.toLowerCase().indexOf(q) !== -1);
    li.classList.toggle("search-hidden", !match);
  });

  /* Show/hide category headers; auto-expand categories with matches */
  var headers = blockList.querySelectorAll("li.cat-header");
  headers.forEach(function(hdr) {
    var cat = hdr.dataset.cat;
    var siblings = blockList.querySelectorAll("li.block-item[data-cat=\"" + cat + "\"]");
    var anyVisible = false;
    for (var i = 0; i < siblings.length; i++) {
      if (!siblings[i].classList.contains("search-hidden")) { anyVisible = true; break; }
    }
    hdr.classList.toggle("search-hidden", !anyVisible);
    /* Auto-expand the section when search reveals results */
    if (anyVisible && q !== "" && catCollapseState[cat]) {
      catCollapseState[cat] = false;
      hdr.classList.remove("collapsed");
      for (var j = 0; j < siblings.length; j++) {
        siblings[j].classList.remove("cat-hidden");
      }
    }
  });

  syncAllCatChecks();
});

/* ================================================================
   STATUS BAR
================================================================ */
function updateStatus() {
  var sel = 0, cks = getAllChecks();
  for (var i = 0; i < cks.length; i++) if (cks[i].checked) sel++;
  document.getElementById("stat-blocks").textContent =
    sel + " block" + (sel === 1 ? "" : "s") + " selected";
}
updateStatus();
