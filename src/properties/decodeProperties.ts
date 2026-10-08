import { decodeRuns, type DecodedRuns } from "./decodeRuns.js";

export interface PropertyTable {
  gc: { values: string[]; names: string[]; runs: number[] };
  sc: { values: string[]; runs: number[] };
  age: { values: string[]; runs: number[] };
  dm: (number | string)[];
}

export interface Properties {
  gc: DecodedRuns & { values: string[]; names: string[] };
  sc: DecodedRuns & { values: string[] };
  age: DecodedRuns & { values: string[] };
  decomposition: Map<number, string>;
}

/** Turn the generated property table (tools/ucd/buildProperties.ts) into lookup structures. */
export function decodeProperties(table: PropertyTable): Properties {
  const decomposition = new Map<number, string>();
  let cp = 0;
  for (let i = 0; i + 1 < table.dm.length; i += 2) { cp += table.dm[i] as number; decomposition.set(cp, table.dm[i + 1] as string); }
  return {
    gc: { ...decodeRuns(table.gc.runs), values: table.gc.values, names: table.gc.names },
    sc: { ...decodeRuns(table.sc.runs), values: table.sc.values },
    age: { ...decodeRuns(table.age.runs), values: table.age.values },
    decomposition,
  };
}
