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

function renderGridName(output, blocks, allCP) {
  var byBlock = groupByBlock(allCP);
  blocks.forEach(function(b) {
    var items = byBlock[b[0]]; if (!items || !items.length) return;
    output.appendChild(makeSepHeading(b));
    var grid = document.createElement("div");
    grid.className = "char-grid-name";

    items.forEach(function(item) {
      var el = document.createElement("div");
      if (item.reserved) {
        el.className = "gcn cell-reserved";
        el.title = cpHex(item.cp) + "  (reserved / unassigned)";
        var c2 = document.createElement("span"); c2.className = "cp";
        c2.textContent = "U+" + hex4(item.cp);
        var nm = document.createElement("span"); nm.className = "cname";
        nm.textContent = "(reserved)";
        el.appendChild(c2); el.appendChild(nm);
      } else {
        el.className = "gcn";
        var ch = cpToStr(item.cp);
        var name = getCharName(item.cp);
        el.title = cpHex(item.cp) + "  " + name + " \u2014 click to insert";
        var g = document.createElement("span"); g.className = "glyph"; g.textContent = ch;
        var c2 = document.createElement("span"); c2.className = "cp";
        c2.textContent = "U+" + hex4(item.cp);
        var nm = document.createElement("span"); nm.className = "cname";
        nm.textContent = name;
        el.appendChild(g); el.appendChild(c2); el.appendChild(nm);
        (function(ch2) {
          el.addEventListener("click", function() { insertToComposePad(ch2); });
        }(ch));
      }
      grid.appendChild(el);
    });
    output.appendChild(grid);
  });
}
