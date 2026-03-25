/* ================================================================
   FONT SIZE SLIDER
================================================================ */
var slider = document.getElementById("font-size-slider");
var sizeVal = document.getElementById("font-size-val");
currentFontSize = parseInt(slider.value, 10);

slider.addEventListener("input", function() {
  currentFontSize = parseInt(this.value, 10);
  sizeVal.textContent = currentFontSize + "px";
  var out = document.getElementById("output");
  if (out) out.style.fontSize = currentFontSize + "px";
});

/* ================================================================
   FONT SELECTOR
   Updates the CSS variable — no re-render needed (pure CSS change).
================================================================ */
(function() {
  var radios = document.querySelectorAll("input[name=gfont]");
  function applyFont(val) {
    document.documentElement.style.setProperty("--glyph-font", val);
  }
  for (var i = 0; i < radios.length; i++) {
    radios[i].addEventListener("change", function() {
      if (this.checked) applyFont(this.value);
    });
  }
})();

/* ================================================================
   COPY OUTPUT
================================================================ */
document.getElementById("btn-copy").addEventListener("click", function() {
  var text = (document.getElementById("output").innerText || "").trim();
  if (!text) { alert("Nothing to copy \u2014 select some blocks first."); return; }
  function done() {
    var btn = document.getElementById("btn-copy");
    var orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(function() { btn.textContent = orig; }, 1500);
  }
  try {
    navigator.clipboard.writeText(text).then(done).catch(function() { fallback(text); done(); });
  } catch(e) { fallback(text); done(); }
});

function fallback(text) {
  var ta = document.createElement("textarea");
  ta.value = text; ta.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch(e) {}
  document.body.removeChild(ta);
}

/* ================================================================
   COMPOSITION PAD CONTROLS
================================================================ */
(function() {
  var section = document.getElementById("compose-section");
  var header  = document.getElementById("compose-header");
  var pad     = document.getElementById("compose-pad");
  var btnClr  = document.getElementById("btn-compose-clear");
  var btnCpy  = document.getElementById("btn-compose-copy");

  var toggleIcon = document.getElementById("compose-toggle-icon");

  function setOpen(open) {
    if (open) {
      section.className = section.className.match(/\bopen\b/) ? section.className : section.className + " open";
      toggleIcon.textContent = "\u25BC"; /* ▼ */
    } else {
      section.className = section.className.replace(/\s*\bopen\b/g, "");
      toggleIcon.textContent = "\u25B6"; /* ▶ */
    }
  }

  /* Toggle collapse on header click (but not on button clicks) */
  header.addEventListener("click", function(ev) {
    var t = ev.target;
    /* Walk up to see if a button was clicked */
    while (t && t !== header) {
      if (t.tagName && t.tagName.toLowerCase() === "button") return;
      t = t.parentNode;
    }
    setOpen(!section.className.match(/\bopen\b/));
  });

  /* Clear */
  btnClr.addEventListener("click", function(ev) {
    ev.stopPropagation();
    pad.value = "";
    pad.focus();
  });

  /* Copy */
  btnCpy.addEventListener("click", function(ev) {
    ev.stopPropagation();
    var text = pad.value;
    var btn = btnCpy;
    function flash() {
      var orig = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(function() { btn.textContent = orig; }, 1500);
    }
    if (!text) { pad.focus(); return; }
    try {
      navigator.clipboard.writeText(text).then(flash).catch(function() { fallback(text); flash(); });
    } catch(e) { fallback(text); flash(); }
  });
})();
