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
