/**
 * Minimal strict-XML well-formedness check for the built artifact (docs/ARCHITECTURE.md §8).
 * Scope: one document, UTF-8, the HTML5 doctype, the five XML entities plus numeric
 * references, CDATA-wrapped script/style bodies. Not a general parser; it only needs to
 * reject what browsers would reject under XHTML.
 */
const NAMED = new Set(["lt", "gt", "amp", "quot", "apos"]);
const ATTR_RE = /\s+([A-Za-z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*')/g;
const CDATA_BODY = /^\/\*<!\[CDATA\[\*\/[\s\S]*\/\*\]\]>\*\/$/;

export class DOMParser {
  parse(text) {
    this.text = text;
    this.i = text.startsWith("<!DOCTYPE html>") ? 15 : 0;
    this.stack = [];
    while (this.i < text.length) this.step();
    if (this.stack.length) this.err(`unclosed <${this.stack.at(-1)}>`);
    return true;
  }

  err(msg) { throw new Error(`${msg} at offset ${this.i}`); }

  step() {
    const { text, i } = this;
    if (text.startsWith("<![CDATA[", i)) return this.skipTo("]]>", "unterminated CDATA");
    if (text.startsWith("<!--", i)) return this.skipTo("-->", "unterminated comment");
    if (text[i] === "<") return this.tag();
    const next = text.indexOf("<", i);
    const end = next < 0 ? text.length : next;
    if (this.stack.length) this.checkText(text.slice(i, end));
    this.i = end;
  }

  skipTo(marker, msg) {
    const e = this.text.indexOf(marker, this.i);
    if (e < 0) this.err(msg);
    this.i = e + marker.length;
  }

  checkText(s) {
    for (const m of s.matchAll(/&([^;&\s<]*);?/g)) {
      if (!m[0].endsWith(";")) this.err("bare '&' in text");
      if (!(NAMED.has(m[1]) || /^#(\d+|x[0-9a-fA-F]+)$/.test(m[1]))) this.err(`undefined entity &${m[1]};`);
    }
    if (s.includes("<")) this.err("'<' in text");
  }

  tag() {
    const close = this.text.indexOf(">", this.i);
    if (close < 0) this.err("unterminated tag");
    const raw = this.text.slice(this.i + 1, close);
    this.i = close + 1;
    if (raw.startsWith("/")) return this.closeTag(raw.slice(1).trim());
    const selfClosing = raw.endsWith("/");
    const name = this.openTag(selfClosing ? raw.slice(0, -1) : raw);
    if (selfClosing) return;
    this.stack.push(name);
    if (name === "script" || name === "style") this.rawBody(name);
  }

  closeTag(name) {
    if (this.stack.pop() !== name) this.err(`mismatched </${name}>`);
  }

  openTag(tag) {
    const name = tag.match(/^[A-Za-z][\w:-]*/)?.[0];
    if (!name) this.err("bad tag name");
    const attrs = tag.slice(name.length);
    const rest = attrs.replace(ATTR_RE, "").trim();
    if (rest) this.err(`malformed attributes in <${name}>: ${rest.slice(0, 40)}`);
    for (const m of attrs.matchAll(ATTR_RE)) this.checkText(m[2].slice(1, -1));
    return name;
  }

  rawBody(name) {
    const end = this.text.indexOf(`</${name}>`, this.i);
    if (end < 0) this.err(`unterminated <${name}>`);
    const body = this.text.slice(this.i, end).trim();
    if (body && !CDATA_BODY.test(body)) this.err(`<${name}> body not CDATA-wrapped`);
    if (body.slice(13, -7).includes("]]>")) this.err(`']]>' inside <${name}> body`);
    this.stack.pop();
    this.i = end + name.length + 3;
  }
}
