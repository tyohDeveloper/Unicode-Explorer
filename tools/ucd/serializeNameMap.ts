/**
 * Compress the delta-encoded name map with LZString (build time) and emit the
 * CN initialiser that decompresses it at page load. LZString is the one
 * third-party runtime component (THIRD_PARTY_LICENSES.md); Phase 3 replaces it
 * with DecompressionStream.
 */
import LZString from "lz-string";
import { encodeNameMap } from "./encodeNameMap.js";

export function serializeNameMap(nameMap: Map<number, string>): string {
  const compressed = LZString.compressToBase64(encodeNameMap(nameMap));
  const json = JSON.stringify(compressed);
  return (
    `var CN=(function(){` +
    `var T={};` +
    `var d=LZString.decompressFromBase64(${json});` +
    `var p="";` +
    `d.split("\\n").forEach(function(l){` +
    `if(!l)return;` +
    `var a=l.indexOf("|"),b=l.indexOf("|",a+1);` +
    `var s=parseInt(l.slice(0,a),36);` +
    `p=p.slice(0,s)+l.slice(a+1,b);` +
    `T[parseInt(l.slice(b+1),16)]=p;` +
    `});` +
    `return T;` +
    `})()`
  );
}
