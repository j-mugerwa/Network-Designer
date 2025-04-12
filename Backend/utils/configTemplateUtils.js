// Validate that all template variables are defined
exports.validateTemplateVariables = (template, variables) => {
  if (!template || !variables) return false;

  const variableMatches = template.match(/\{\{([^}]+)\}\}/g) || [];
  const definedVars = variables.map((v) => v.name);

  return variableMatches.every((match) => {
    const varName = match.replace(/\{\{|\}\}/g, "");
    return definedVars.includes(varName);
  });
};

// Helper to extract variables from template
exports.extractVariables = (template) => {
  const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
};
