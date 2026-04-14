/* ================================================================
   ALGORITHMIC NAME RANGES
   Pure data table describing which code point ranges have names
   that can be derived algorithmically (per Unicode §4.8).
   Used by getAlgoName() in data/charnames.js.
================================================================ */
var ALGO_RANGES = [
  [0x3400,  0x4DBF,  "CJK UNIFIED IDEOGRAPH-"],
  [0x4E00,  0x9FFF,  "CJK UNIFIED IDEOGRAPH-"],
  [0x20000, 0x2A6DF, "CJK UNIFIED IDEOGRAPH-"],
  [0x2A700, 0x2B73F, "CJK UNIFIED IDEOGRAPH-"],
  [0x2B740, 0x2B81F, "CJK UNIFIED IDEOGRAPH-"],
  [0x2B820, 0x2CEAF, "CJK UNIFIED IDEOGRAPH-"],
  [0x2CEB0, 0x2EBEF, "CJK UNIFIED IDEOGRAPH-"],
  [0x30000, 0x3134F, "CJK UNIFIED IDEOGRAPH-"],
  [0x31350, 0x323AF, "CJK UNIFIED IDEOGRAPH-"],
  [0x323B0, 0x3347F, "CJK UNIFIED IDEOGRAPH-"],
  [0x2EBF0, 0x2EE5F, "CJK UNIFIED IDEOGRAPH-"],
  [0xF900,  0xFAFF,  "CJK COMPATIBILITY IDEOGRAPH-"],
  [0x2F800, 0x2FA1F, "CJK COMPATIBILITY IDEOGRAPH-"],
  [0x17000, 0x187FF, "TANGUT IDEOGRAPH-"],
  [0x18D00, 0x18D7F, "TANGUT IDEOGRAPH-"],
  [0x1B170, 0x1B2FF, "NUSHU CHARACTER-"],
  [0x18B00, 0x18CFF, "KHITAN SMALL SCRIPT CHARACTER-"]
];

function hangulName(cp) {
  var L = ["G","GG","N","D","DD","R","M","B","BB","S","SS","","J","JJ","C","K","T","P","H"];
  var V = ["A","AE","YA","YAE","EO","E","YEO","YE","O","WA","WAE","OE","YO","U","WEO","WE","WI","YU","EU","YI","I"];
  var T = ["","G","GG","GS","N","NJ","NH","D","L","LG","LM","LB","LS","LT","LP","LH","M","B","BS","S","SS","NG","J","C","K","T","P","H"];
  var si = cp - 0xAC00;
  return L[Math.floor(si / (21*28))] + V[Math.floor((si % (21*28)) / 28)] + T[si % 28];
}
