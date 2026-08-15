export function followUpsFor(question = "", intent = ""): string[] {
  const value = `${question} ${intent}`.toLowerCase();
  if (value.includes("depend"))
    return [
      "Which dependencies are blocking?",
      "Show the dependency graph",
      "What should we fix first?",
    ];
  if (value.includes("architect") || value.includes("structure"))
    return [
      "Show the main request flow",
      "Which components are highest risk?",
      "Show implementation evidence",
    ];
  if (value.includes("risk") || value.includes("missing") || value.includes("not implemented"))
    return [
      "What should we fix first?",
      "Which release items are affected?",
      "Show supporting evidence",
    ];
  if (value.includes("function") || value.includes("capabil"))
    return [
      "Explain the architecture",
      "Show related Features",
      "Which capabilities are not implemented?",
    ];
  if (value.includes("summary") || value.includes("backlog"))
    return [
      "Show critical gaps",
      "Compare plan vs implementation",
      "Give me release readiness",
    ];
  return [
    "What should we investigate next?",
    "Show related project evidence",
    "What are the biggest risks?",
  ];
}