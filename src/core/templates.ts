export type FiguralLogFile = {
  schema_version: string;
  decisions: unknown[];
};

export function getEmptyLog(): FiguralLogFile {
  return {
    schema_version: "1.0",
    decisions: []
  };
}

export function getSpecpackTemplate(): Record<string, unknown> {
  return {
    schema_version: "1.0",
    product_name: "",
    decision: "",
    rationale: "",
    confidence: 0.7,
    in_scope: [],
    out_of_scope: [],
    constraints: [],
    edge_cases: [],
    acceptance_tests: [],
    evidence_refs: []
  };
}

