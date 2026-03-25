/* ================================================================
   SIDEBAR — COLLAPSIBLE BLOCK LIST
   Builds the category/block tree with click-to-expand sections.
   Block items use two independent visibility classes:
     .search-hidden  — set by the search filter
     .cat-hidden     — set when the parent category is collapsed
================================================================ */
var blockList = document.getElementById("block-list");
var catCollapseState = {}; // category name -> bool (true = collapsed)

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

    var toggle = document.createElement("span");
    toggle.className = "cat-toggle";
    toggle.textContent = "\u25BC"; // ▼

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
        scheduleRender();
        updateStatus();
      });

      blockList.appendChild(li);
    });

    /* ---- Collapse / expand on header click ---- */
    hdr.addEventListener("click", function() {
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
   SIDEBAR CONTROLS — All / None / Search
================================================================ */
function getAllChecks() {
  return blockList.querySelectorAll("input[type=checkbox]");
}

document.getElementById("btn-all").addEventListener("click", function() {
  var cks = getAllChecks();
  for (var i = 0; i < cks.length; i++) {
    /* Only check visible (not search-hidden) items */
    var li = cks[i].parentElement;
    if (!li.classList.contains("search-hidden")) cks[i].checked = true;
  }
  scheduleRender();
  updateStatus();
});

document.getElementById("btn-none").addEventListener("click", function() {
  var cks = getAllChecks();
  for (var i = 0; i < cks.length; i++) cks[i].checked = false;
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
