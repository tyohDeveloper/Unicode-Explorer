/**
 * Minimal strict-XML well-formedness check for the built artifact (docs/ARCHITECTURE.md §8).
 * Scope: one document, UTF-8, no DTD processing beyond the HTML5 doctype, no
 * entity expansion beyond the five XML entities and numeric references. Not a
 * general parser; it only needs to reject what browsers would reject under XHTML.
 */
export class DOMParser {
  parse(text) {
    let i = 0;
    const stack = [];
    const err = (msg) => { throw new Error(`${msg} at offset ${i}`); };
    const named = new Set(["lt", "gt", "amp", "quot", "apos"]);
    const checkText = (s) => {
      for (const m of s.matchAll(/&([^;&\s<]*);?/g)) {
        const body = m[1];
        if (!m[0].endsWith(";")) err(`bare '&' in text`);
        if (!(named.has(body) || /^#(\d+|x[0-9a-fA-F]+)$/.test(body))) err(`undefined entity &${body};`);
      }
      if (s.includes("<")) err("'<' in text");
    };
    if (text.startsWith("<!DOCTYPE html>")) i = 15;
    while (i < text.length) {
      if (text.startsWith("<![CDATA[", i)) { const e = text.indexOf("]]>", i); if (e < 0) err("unterminated CDATA"); i = e + 3; continue; }
      if (text.startsWith("<!--", i)) { const e = text.indexOf("-->", i); if (e < 0) err("unterminated comment"); i = e + 3; continue; }
      if (text[i] === "<") {
        const close = text.indexOf(">", i);
        if (close < 0) err("unterminated tag");
        let tag = text.slice(i + 1, close);
        if (tag.startsWith("/")) {
          const name = tag.slice(1).trim();
          if (stack.pop() !== name) err(`mismatched </${name}>`);
          i = close + 1; continue;
        }
        const selfClosing = tag.endsWith("/");
        if (selfClosing) tag = tag.slice(0, -1);
        const name = tag.match(/^[A-Za-z][\w:-]*/)?.[0];
        if (!name) err("bad tag name");
        const attrs = tag.slice(name.length);
        const re = /\s+([A-Za-z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*')/g;
        let rest = attrs.replace(re, "");
        if (rest.trim()) err(`malformed attributes in <${name}>: ${rest.trim().slice(0, 40)}`);
        for (const m of attrs.matchAll(re)) checkText(m[2].slice(1, -1));
        if (!selfClosing) stack.push(name);
        i = close + 1;
        if (!selfClosing && (name === "script" || name === "style")) {
          const end = text.indexOf(`</${name}>`, i);
          if (end < 0) err(`unterminated <${name}>`);
          const body = text.slice(i, end).trim();
          if (body && !/^\/\*<!\[CDATA\[\*\/[\s\S]*\/\*\]\]>\*\/$/.test(body)) err(`<${name}> body not CDATA-wrapped`);
          if (body.slice(13, -7).includes("]]>")) err(`']]>' inside <${name}> body`);
          stack.pop();
          i = end + name.length + 3;
        }
        continue;
      }
      const next = text.indexOf("<", i);
      const seg = text.slice(i, next < 0 ? text.length : next);
      if (stack.length) checkText(seg);
      i = next < 0 ? text.length : next;
    }
    if (stack.length) err(`unclosed <${stack[stack.length - 1]}>`);
    return true;
  }
}
