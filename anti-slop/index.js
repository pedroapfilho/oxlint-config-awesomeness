/* Vendored from https://github.com/dmmulroy/anti-slop (MIT, see ./LICENSE), commit 95a56e5. Bundled with esbuild and leaves @oxlint/plugins external. */

// src/index.ts
import { eslintCompatPlugin } from "@oxlint/plugins";

// src/rules/no-array-filter-map.ts
import { defineRule } from "@oxlint/plugins";

// src/shared/array-method.ts
function unwrapArrayExpression(node) {
  while (node.type === "ParenthesizedExpression" || node.type === "ChainExpression" || node.type === "TSAsExpression" || node.type === "TSTypeAssertion" || node.type === "TSNonNullExpression" || node.type === "TSSatisfiesExpression") {
    node = node.expression;
  }
  return node;
}
function resolveArrayBinding(sourceCode, node) {
  node = unwrapArrayExpression(node);
  if (node.type !== "Identifier") return null;
  let scope = sourceCode.getScope(node);
  while (scope !== null) {
    const variable = scope.set.get(node.name);
    if (variable !== void 0) return variable;
    scope = scope.upper;
  }
  return null;
}
function arrayMethodTarget(node) {
  node = unwrapArrayExpression(node);
  if (node.type !== "MemberExpression") return null;
  const property = node.property;
  if (!node.computed && property.type === "Identifier") {
    return { name: property.name, object: node.object };
  }
  if (node.computed && property.type === "Literal" && typeof property.value === "string") {
    return { name: property.value, object: node.object };
  }
  return null;
}
function isArrayAnnotation(type) {
  if (type.type === "TSArrayType" || type.type === "TSTupleType") return true;
  if (type.type === "TSParenthesizedType") return isArrayAnnotation(type.typeAnnotation);
  if (type.type === "TSTypeOperator" && type.operator === "readonly") {
    return isArrayAnnotation(type.typeAnnotation);
  }
  return type.type === "TSTypeReference" && type.typeName.type === "Identifier" && (type.typeName.name === "Array" || type.typeName.name === "ReadonlyArray");
}
function isKnownArrayExpression(sourceCode, node, visited = /* @__PURE__ */ new Set()) {
  node = unwrapArrayExpression(node);
  if (node.type === "ArrayExpression") return true;
  if (node.type === "CallExpression") {
    const method = arrayMethodTarget(node.callee);
    return method !== null && ["map", "filter", "flatMap", "slice", "concat", "toSorted", "toReversed", "toSpliced"].includes(method.name) && isKnownArrayExpression(sourceCode, method.object, visited);
  }
  if (node.type !== "Identifier") return false;
  const variable = resolveArrayBinding(sourceCode, node);
  if (variable === null || visited.has(variable)) return false;
  visited.add(variable);
  if (variable.references.some((reference) => reference.isWrite() && !reference.init)) return false;
  for (const identifier of variable.identifiers) {
    const annotation = identifier.typeAnnotation?.typeAnnotation;
    if (annotation !== void 0) return isArrayAnnotation(annotation);
  }
  for (const definition of variable.defs) {
    if (definition.type === "Variable" && definition.node.type === "VariableDeclarator" && definition.node.id.type === "Identifier" && definition.node.init !== null && definition.node.parent.type === "VariableDeclaration" && definition.node.parent.kind === "const") {
      return isKnownArrayExpression(sourceCode, definition.node.init, visited);
    }
  }
  return false;
}

// src/rules/no-array-filter-map.ts
var noArrayFilterMapRule = defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Disallow adjacent array filter/map passes in favor of lazy iterator helpers or a single transformation." },
    messages: {
      arrayFilterMap: "Avoid consecutive array `{{first}}` and `{{second}}` passes. Prefer `.values().{{first}}(...).{{second}}(...).toArray()` where iterator helpers are supported, or a single `flatMap`/mutating reducer. Preserve callback ordering, indexes, and filtering semantics."
    }
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const outer = arrayMethodTarget(node.callee);
        if (outer === null || outer.name !== "map" && outer.name !== "filter") return;
        const innerCall = unwrapArrayExpression(outer.object);
        if (innerCall.type !== "CallExpression") return;
        const inner = arrayMethodTarget(innerCall.callee);
        if (inner === null || inner.name !== (outer.name === "map" ? "filter" : "map")) return;
        if (!isKnownArrayExpression(context.sourceCode, inner.object)) return;
        context.report({ node, messageId: "arrayFilterMap", data: { first: inner.name, second: outer.name } });
      }
    };
  }
});

// src/rules/no-reduce-accumulator-copy.ts
import { defineRule as defineRule2 } from "@oxlint/plugins";
function enclosingReducer(node) {
  let parent = node.parent;
  while (parent !== null) {
    if (parent.type === "FunctionDeclaration") return null;
    if (parent.type === "ArrowFunctionExpression" || parent.type === "FunctionExpression") {
      const callback = parent;
      let owner = callback.parent;
      while (owner !== null && unwrapArrayExpression(owner) === callback) owner = owner.parent;
      if (owner?.type !== "CallExpression") return null;
      const method = arrayMethodTarget(owner.callee);
      const firstArgument = owner.arguments[0];
      if (method === null || method.name !== "reduce" && method.name !== "reduceRight" || owner.arguments.length > 2 || firstArgument === void 0 || unwrapArrayExpression(firstArgument) !== callback) return null;
      const firstParameter = callback.params[0];
      const accumulator = firstParameter?.type === "AssignmentPattern" ? firstParameter.left : firstParameter;
      if (accumulator?.type !== "Identifier") return null;
      return { callback, accumulator, initialValue: owner.arguments[1] };
    }
    parent = parent.parent;
  }
  return null;
}
function referencesAccumulator(sourceCode, node, accumulator, visited = /* @__PURE__ */ new Set()) {
  const variable = resolveArrayBinding(sourceCode, node);
  if (variable === null || visited.has(variable)) return false;
  if (variable === accumulator) return true;
  visited.add(variable);
  if (variable.references.some((reference) => reference.isWrite() && !reference.init)) return false;
  for (const definition of variable.defs) {
    if (definition.type === "Variable" && definition.node.type === "VariableDeclarator" && definition.node.id.type === "Identifier" && definition.node.init !== null && definition.node.parent.type === "VariableDeclaration" && definition.node.parent.kind === "const") {
      return referencesAccumulator(sourceCode, definition.node.init, accumulator, visited);
    }
  }
  return false;
}
function isGlobalCopyOwner(sourceCode, node, name) {
  node = unwrapArrayExpression(node);
  if (node.type !== "Identifier" || node.name !== name) return false;
  const variable = resolveArrayBinding(sourceCode, node);
  return variable === null || variable.defs.length === 0;
}
var noReduceAccumulatorCopyRule = defineRule2({
  meta: {
    type: "problem",
    docs: { description: "Disallow copying growing reducer accumulators with Object.assign, Array.from, or array copy methods." },
    messages: {
      accumulatorCopy: "Do not copy the reducer accumulator on every iteration; growing copies can cause quadratic work. Mutate a fresh, locally owned accumulator and return it, or use an iterator pipeline/flatMap."
    }
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const method = arrayMethodTarget(node.callee);
        if (method === null) return;
        const reducer = enclosingReducer(node);
        if (reducer === null) return;
        const accumulator = context.sourceCode.getDeclaredVariables(reducer.callback).find(
          (variable) => variable.identifiers.some((identifier) => identifier.start === reducer.accumulator.start)
        );
        if (accumulator === void 0) return;
        const isAccumulator = (expression) => referencesAccumulator(context.sourceCode, expression, accumulator);
        let copiesAccumulator = false;
        if (method.name === "assign" && isGlobalCopyOwner(context.sourceCode, method.object, "Object")) {
          const target = node.arguments[0];
          copiesAccumulator = target !== void 0 && unwrapArrayExpression(target).type === "ObjectExpression" && node.arguments.slice(1).some(isAccumulator);
        } else if (method.name === "from" && isGlobalCopyOwner(context.sourceCode, method.object, "Array")) {
          const source = node.arguments[0];
          copiesAccumulator = source !== void 0 && isAccumulator(source);
        } else if (["concat", "slice", "toSpliced", "toSorted", "toReversed", "with"].includes(method.name)) {
          const initialValue = reducer.initialValue;
          const arrayAccumulator = initialValue !== void 0 && isKnownArrayExpression(context.sourceCode, initialValue);
          copiesAccumulator = arrayAccumulator && isAccumulator(method.object);
        }
        if (copiesAccumulator) context.report({ node, messageId: "accumulatorCopy" });
      }
    };
  }
});

// src/rules/no-chained-type-assertions.ts
import { defineRule as defineRule3 } from "@oxlint/plugins";
function isTypeAssertionExpression(node) {
  return node.type === "TSAsExpression" || node.type === "TSTypeAssertion";
}
function unwrapParenthesizedExpression(expression) {
  let current = expression;
  while (current.type === "ParenthesizedExpression") {
    current = current.expression;
  }
  return current;
}
function isConstAssertion(node) {
  const { typeAnnotation } = node;
  return typeAnnotation.type === "TSTypeReference" && typeAnnotation.typeName.type === "Identifier" && typeAnnotation.typeName.name === "const";
}
function isOutermostAssertionInChain(node) {
  let current = node;
  let parent = node.parent;
  while (parent.type === "ParenthesizedExpression" && parent.expression === current) {
    current = parent;
    parent = parent.parent;
  }
  return !isTypeAssertionExpression(parent) || parent.expression !== current;
}
function isForbiddenAssertionChain(node) {
  let assertionCount = 0;
  let hasNonConstAssertion = false;
  let current = node;
  while (isTypeAssertionExpression(current)) {
    assertionCount += 1;
    hasNonConstAssertion ||= !isConstAssertion(current);
    current = unwrapParenthesizedExpression(current.expression);
  }
  return assertionCount > 1 && hasNonConstAssertion;
}
var noChainedTypeAssertionsRule = defineRule3({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow chained TypeScript as and angle-bracket assertions, including parenthesized chains."
    },
    messages: {
      chained: "This assertion chain discards type evidence. Keep the original precise type, or parse untrusted input at its boundary before narrowing it."
    }
  },
  createOnce(context) {
    const checkTypeAssertion = (node) => {
      if (!isOutermostAssertionInChain(node) || !isForbiddenAssertionChain(node)) return;
      context.report({ node, messageId: "chained" });
    };
    return {
      TSAsExpression: checkTypeAssertion,
      TSTypeAssertion: checkTypeAssertion
    };
  }
});

// src/rules/no-conditional-empty-object-spread.ts
import { defineRule as defineRule4 } from "@oxlint/plugins";
function unwrapParentheses(node) {
  let current = node;
  while (current.type === "ParenthesizedExpression") {
    current = current.expression;
  }
  return current;
}
function isEmptyObjectExpression(node) {
  return node.type === "ObjectExpression" && node.properties.length === 0;
}
function isConditionalEmptyObjectSpread(node) {
  const conditional = unwrapParentheses(node);
  return conditional.type === "ConditionalExpression" && (isEmptyObjectExpression(conditional.consequent) || isEmptyObjectExpression(conditional.alternate));
}
var noConditionalEmptyObjectSpreadRule = defineRule4({
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow object spreads that conditionally spread an empty object to omit fields."
    },
    messages: {
      avoid: "This conditional spread hides property omission behind an empty object. Build the object in separate statements and add the property only when present."
    }
  },
  createOnce(context) {
    return {
      SpreadElement(node) {
        if (node.parent.type !== "ObjectExpression") return;
        if (isConditionalEmptyObjectSpread(node.argument)) {
          context.report({ node, messageId: "avoid" });
        }
      }
    };
  }
});

// src/rules/no-known-value-widening.ts
import { defineRule as defineRule5 } from "@oxlint/plugins";

// src/shared/lexical-type-parameters.ts
function isNode(value) {
  return typeof value === "object" && value !== null && "type" in value && typeof value.type === "string";
}
function collectInferTypeParameterNames(node, visitorKeys, names) {
  if (node.type === "TSInferType") names.add(node.typeParameter.name.name);
  const record = node;
  for (const key of visitorKeys[node.type] ?? []) {
    const value = record[key];
    if (isNode(value)) {
      collectInferTypeParameterNames(value, visitorKeys, names);
      continue;
    }
    if (!Array.isArray(value)) continue;
    for (const child of value) {
      if (isNode(child)) collectInferTypeParameterNames(child, visitorKeys, names);
    }
  }
}
function lexicalTypeParameterNames(node, visitorKeys) {
  const names = /* @__PURE__ */ new Set();
  let descendant = node;
  let current = node;
  while (current !== null && current.type !== "Program") {
    if ("typeParameters" in current) {
      for (const parameter of current.typeParameters?.params ?? []) {
        names.add(parameter.name.name);
      }
    }
    if (current.type === "TSMappedType" && (descendant === current.nameType || descendant === current.typeAnnotation)) {
      names.add(current.key.name);
    }
    if (current.type === "TSConditionalType" && descendant === current.trueType) {
      collectInferTypeParameterNames(current.extendsType, visitorKeys, names);
    }
    descendant = current;
    current = current.parent;
  }
  return names;
}

// src/shared/type-alias-resolution.ts
var environmentsByProgram = /* @__PURE__ */ new WeakMap();
function isNode2(value) {
  return typeof value === "object" && value !== null && "type" in value && typeof value.type === "string";
}
function enclosingTypeScope(node) {
  let current = node.parent;
  while (current !== null) {
    if (current.type === "Program" || current.type === "BlockStatement" || current.type === "TSModuleBlock" || current.type === "StaticBlock" || current.type === "SwitchStatement") {
      return current;
    }
    current = current.parent;
  }
  return node;
}
function declaredTypeBinding(node) {
  if (node.type === "TSTypeAliasDeclaration") {
    return { alias: node, name: node.id.name };
  }
  if (node.type === "TSInterfaceDeclaration" || node.type === "TSEnumDeclaration" || node.type === "ClassDeclaration" || node.type === "ClassExpression") {
    return node.id === null ? null : { alias: null, name: node.id.name };
  }
  if (node.type === "ImportSpecifier" || node.type === "ImportDefaultSpecifier" || node.type === "ImportNamespaceSpecifier") {
    return { alias: null, name: node.local.name };
  }
  return null;
}
function collectTypeBindings(node, visitorKeys, bindingsByName, aliases) {
  const declared = declaredTypeBinding(node);
  if (declared !== null) {
    const bindings = bindingsByName.get(declared.name) ?? [];
    bindings.push({ ...declared, scope: enclosingTypeScope(node) });
    bindingsByName.set(declared.name, bindings);
    if (declared.alias !== null) aliases.push(declared.alias);
  }
  const fields = node;
  for (const key of visitorKeys[node.type] ?? []) {
    const value = fields[key];
    if (isNode2(value)) {
      collectTypeBindings(value, visitorKeys, bindingsByName, aliases);
      continue;
    }
    if (!Array.isArray(value)) continue;
    for (const child of value) {
      if (isNode2(child)) {
        collectTypeBindings(child, visitorKeys, bindingsByName, aliases);
      }
    }
  }
}
function createTypeAliasEnvironment(program, visitorKeys) {
  const cached = environmentsByProgram.get(program);
  if (cached !== void 0) return cached;
  const bindingsByName = /* @__PURE__ */ new Map();
  const aliases = [];
  collectTypeBindings(program, visitorKeys, bindingsByName, aliases);
  const environment = { aliases, bindingsByName, visitorKeys };
  environmentsByProgram.set(program, environment);
  return environment;
}
function ancestorDistance(ancestor, node) {
  let current = node;
  let distance = 0;
  while (current !== null) {
    if (current === ancestor) return distance;
    current = current.parent;
    distance += 1;
  }
  return null;
}
function nearestTypeBindings(name, use, environment) {
  const candidates = environment.bindingsByName.get(name) ?? [];
  let nearestDistance = Number.POSITIVE_INFINITY;
  let nearest = [];
  for (const candidate of candidates) {
    const distance = ancestorDistance(candidate.scope, use);
    if (distance === null || distance > nearestDistance) continue;
    if (distance === nearestDistance) {
      nearest.push(candidate);
      continue;
    }
    nearestDistance = distance;
    nearest = [candidate];
  }
  return nearest;
}
function visibleTypeAlias(name, use, environment) {
  if (lexicalTypeParameterNames(use, environment.visitorKeys).has(name)) return null;
  const bindings = nearestTypeBindings(name, use, environment);
  return bindings.length === 1 ? bindings[0]?.alias ?? null : null;
}
function hasVisibleTypeBinding(name, use, environment) {
  return lexicalTypeParameterNames(use, environment.visitorKeys).has(name) || nearestTypeBindings(name, use, environment).length > 0;
}
function typeReferenceName(type) {
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}
function aliasSubstitutions(alias, reference, base) {
  const parameters = alias.typeParameters?.params ?? [];
  const arguments_ = reference.typeArguments?.params ?? [];
  const next = new Map(base);
  for (const [index, parameter] of parameters.entries()) {
    const explicitArgument = arguments_[index];
    const argument = explicitArgument ?? parameter.default;
    if (argument === null || argument === void 0) return null;
    const argumentSubstitutions = explicitArgument === void 0 ? next : base;
    next.set(parameter.name.name, {
      type: argument,
      substitutions: new Map(argumentSubstitutions)
    });
  }
  return next;
}
function resolvedTypeMatches(type, environment, matcher) {
  const evaluate = (current, substitutions, resolvingAliases) => {
    if (current.type === "TSTypeReference") {
      const name = typeReferenceName(current);
      if (name !== null) {
        const substitution = substitutions.get(name);
        if (substitution !== void 0 && !current.typeArguments?.params.length) {
          return evaluate(
            substitution.type,
            substitution.substitutions,
            resolvingAliases
          );
        }
        const alias = visibleTypeAlias(name, current, environment);
        if (alias !== null && !resolvingAliases.has(alias)) {
          const nextSubstitutions = aliasSubstitutions(alias, current, substitutions);
          if (nextSubstitutions !== null) {
            const nextResolving = new Set(resolvingAliases);
            nextResolving.add(alias);
            return evaluate(alias.typeAnnotation, nextSubstitutions, nextResolving);
          }
        }
      }
    }
    return matcher(
      current,
      (child) => evaluate(child, substitutions, resolvingAliases)
    );
  };
  return evaluate(type, /* @__PURE__ */ new Map(), /* @__PURE__ */ new Set());
}

// src/shared/dictionary-types.ts
var BUILT_INS = /* @__PURE__ */ new Set([
  "Record",
  "Readonly",
  "Partial",
  "Required",
  "Pick",
  "Omit",
  "PropertyKey",
  "NonNullable"
]);
var TRANSPARENT_WRAPPERS = /* @__PURE__ */ new Set(["Readonly", "Partial", "Required", "NonNullable"]);
function declaredStatement(statement) {
  return statement.type === "ExportNamedDeclaration" || statement.type === "ExportDefaultDeclaration" ? statement.declaration ?? null : statement;
}
function createTypeEnvironment(program, visitorKeys) {
  const interfaces = /* @__PURE__ */ new Map();
  for (const statement of program.body) {
    const declaration = declaredStatement(statement);
    if (declaration?.type !== "TSInterfaceDeclaration") continue;
    const declarations = interfaces.get(declaration.id.name) ?? [];
    declarations.push(declaration);
    interfaces.set(declaration.id.name, declarations);
  }
  return {
    interfaces,
    typeAliases: createTypeAliasEnvironment(program, visitorKeys)
  };
}
function typeReferenceName2(type) {
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}
function isBuiltIn(name, use, environment) {
  return BUILT_INS.has(name) && !hasVisibleTypeBinding(name, use, environment.typeAliases);
}
function isUnappliedReferenceTo(type, name) {
  const unwrapped = unwrapTransparentType(type);
  return unwrapped.type === "TSTypeReference" && typeReferenceName2(unwrapped) === name && (unwrapped.typeArguments === null || unwrapped.typeArguments === void 0 || unwrapped.typeArguments.params.length === 0);
}
function unwrapTransparentType(type) {
  let current = type;
  while (current.type === "TSParenthesizedType" || current.type === "TSTypeOperator" && current.operator === "readonly") {
    current = current.typeAnnotation;
  }
  return current;
}
function isNeverType(type) {
  return unwrapTransparentType(type).type === "TSNeverKeyword";
}
function isEffectivelyEmptyMember(member) {
  return member.type === "TSPropertySignature" && member.optional === true && member.typeAnnotation !== null && member.typeAnnotation !== void 0 && isNeverType(member.typeAnnotation.typeAnnotation);
}
function isEffectivelyEmptyTypeLiteral(type) {
  return type.members.length === 0 || type.members.every(isEffectivelyEmptyMember);
}
function isEffectivelyEmptyInterface(declarations) {
  if (declarations.length !== 1) return false;
  const [type] = declarations;
  return type !== void 0 && type.extends.length === 0 && (type.body.body.length === 0 || type.body.body.every(isEffectivelyEmptyMember));
}
function resolvedSubstitutionArgument(type, base, resolving = /* @__PURE__ */ new Set()) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type !== "TSTypeReference") return type;
  const name = typeReferenceName2(unwrapped);
  if (name === null || resolving.has(name)) return type;
  const substitution = base.get(name);
  if (substitution === void 0) return type;
  const nextResolving = new Set(resolving);
  nextResolving.add(name);
  return resolvedSubstitutionArgument(substitution, base, nextResolving);
}
function aliasSubstitution(alias, type, base) {
  const parameters = alias.typeParameters?.params ?? [];
  const arguments_ = type.typeArguments?.params ?? [];
  const next = new Map(base);
  for (const [index, parameter] of parameters.entries()) {
    const argument = arguments_[index] ?? parameter.default;
    if (argument === null || argument === void 0) return null;
    next.set(parameter.name.name, resolvedSubstitutionArgument(argument, next));
  }
  return next;
}
function unsafeDirectValue(type, environment, substitutions, resolvingAliases) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type === "TSUnknownKeyword") return "unknown";
  if (unwrapped.type === "TSAnyKeyword") return "any";
  if (unwrapped.type === "TSObjectKeyword") return "object";
  if (unwrapped.type === "TSTypeLiteral" && isEffectivelyEmptyTypeLiteral(unwrapped))
    return "empty-object";
  if (unwrapped.type === "TSUnionType") {
    return unwrapped.types.some(
      (member) => unsafeDirectValue(member, environment, substitutions, resolvingAliases) !== null
    ) ? "union" : null;
  }
  if (unwrapped.type === "TSIntersectionType") {
    const unsafeMembers = unwrapped.types.map(
      (member) => unsafeDirectValue(member, environment, substitutions, resolvingAliases)
    );
    if (unsafeMembers.includes("any")) return "any";
    return unsafeMembers.length > 0 && unsafeMembers.every((member) => member !== null) ? unsafeMembers[0] : null;
  }
  if (unwrapped.type !== "TSTypeReference") return null;
  const name = typeReferenceName2(unwrapped);
  if (name === null) return null;
  if (TRANSPARENT_WRAPPERS.has(name) && isBuiltIn(name, unwrapped, environment)) {
    const wrapped = unwrapped.typeArguments?.params[0];
    return wrapped === void 0 ? null : unsafeDirectValue(wrapped, environment, substitutions, resolvingAliases);
  }
  const substitution = substitutions.get(name);
  if (substitution !== void 0) {
    return isUnappliedReferenceTo(substitution, name) ? null : unsafeDirectValue(substitution, environment, substitutions, resolvingAliases);
  }
  const interfaceDeclarations = environment.interfaces.get(name);
  if (interfaceDeclarations !== void 0) {
    return isEffectivelyEmptyInterface(interfaceDeclarations) ? "empty-object" : null;
  }
  const alias = visibleTypeAlias(name, unwrapped, environment.typeAliases);
  if (alias === null || resolvingAliases.has(name)) return null;
  const nextSubstitutions = aliasSubstitution(alias, unwrapped, substitutions);
  if (nextSubstitutions === null) return null;
  const nextResolving = new Set(resolvingAliases);
  nextResolving.add(name);
  return unsafeDirectValue(alias.typeAnnotation, environment, nextSubstitutions, nextResolving);
}
function dictionaryValueTypes(type, environment, substitutions, resolvingAliases) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.flatMap(
      (member) => member.type === "TSIndexSignature" && member.typeAnnotation !== null ? [{ type: member.typeAnnotation.typeAnnotation, substitutions }] : []
    );
  }
  if (unwrapped.type === "TSMappedType") {
    return unwrapped.typeAnnotation === null ? [] : [{ type: unwrapped.typeAnnotation, substitutions }];
  }
  if (unwrapped.type !== "TSTypeReference") return [];
  const name = typeReferenceName2(unwrapped);
  if (name === null) return [];
  const substitution = substitutions.get(name);
  if (substitution !== void 0) {
    return isUnappliedReferenceTo(substitution, name) ? [] : dictionaryValueTypes(substitution, environment, substitutions, resolvingAliases);
  }
  if (TRANSPARENT_WRAPPERS.has(name) && isBuiltIn(name, unwrapped, environment)) {
    const wrapped = unwrapped.typeArguments?.params[0];
    return wrapped === void 0 ? [] : dictionaryValueTypes(wrapped, environment, substitutions, resolvingAliases);
  }
  if (name === "Record" && isBuiltIn(name, unwrapped, environment)) {
    const value = unwrapped.typeArguments?.params[1] ?? null;
    return value === null ? [] : [{ type: value, substitutions }];
  }
  if ((name === "Pick" || name === "Omit") && isBuiltIn(name, unwrapped, environment)) {
    const source = unwrapped.typeArguments?.params[0];
    return source === void 0 ? [] : dictionaryValueTypes(source, environment, substitutions, resolvingAliases);
  }
  const alias = visibleTypeAlias(name, unwrapped, environment.typeAliases);
  if (alias === null || resolvingAliases.has(name)) return [];
  const nextSubstitutions = aliasSubstitution(alias, unwrapped, substitutions);
  if (nextSubstitutions === null) return [];
  const nextResolving = new Set(resolvingAliases);
  nextResolving.add(name);
  return dictionaryValueTypes(alias.typeAnnotation, environment, nextSubstitutions, nextResolving);
}
function classifyUnsafeDictionaryValue(valueType, environment) {
  const unsafeValue = unsafeDirectValue(valueType, environment, /* @__PURE__ */ new Map(), /* @__PURE__ */ new Set());
  return unsafeValue === null ? null : { kind: "unsafe-dictionary", unsafeValue };
}
function classifyUnsafeDictionary(type, environment) {
  for (const valueType of dictionaryValueTypes(type, environment, /* @__PURE__ */ new Map(), /* @__PURE__ */ new Set())) {
    const unsafeValue = unsafeDirectValue(
      valueType.type,
      environment,
      valueType.substitutions,
      /* @__PURE__ */ new Set()
    );
    if (unsafeValue !== null) return { kind: "unsafe-dictionary", unsafeValue };
  }
  return null;
}
function classifyWideningTarget(type, environment) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type === "TSUnknownKeyword") return { kind: "unknown" };
  if (unwrapped.type === "TSObjectKeyword") return { kind: "object" };
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.some((member) => member.type === "TSIndexSignature") ? { kind: "open dictionary" } : unwrapped.members.length > 0 ? { kind: "anonymous object" } : null;
  }
  if (unwrapped.type === "TSMappedType") return { kind: "open dictionary" };
  if (unwrapped.type !== "TSTypeReference") return null;
  const name = typeReferenceName2(unwrapped);
  if (name === null) return null;
  if (TRANSPARENT_WRAPPERS.has(name) && isBuiltIn(name, unwrapped, environment)) {
    const wrapped = unwrapped.typeArguments?.params[0];
    return wrapped === void 0 ? null : classifyWideningTarget(wrapped, environment);
  }
  if (name === "Record" && isBuiltIn(name, unwrapped, environment)) {
    return hasBroadRecordKey(unwrapped, environment, /* @__PURE__ */ new Map()) ? { kind: "open dictionary" } : null;
  }
  const alias = visibleTypeAlias(name, unwrapped, environment.typeAliases);
  if (alias === null) return null;
  if ((alias.typeParameters?.params.length ?? 0) > 0) {
    const substitutions2 = aliasSubstitution(alias, unwrapped, /* @__PURE__ */ new Map());
    const resolved2 = substitutions2 === null ? null : classifyAliasBroadTarget(
      alias.typeAnnotation,
      environment,
      substitutions2,
      /* @__PURE__ */ new Set([name])
    );
    return resolved2?.kind === "open dictionary" ? { kind: "generic container" } : null;
  }
  const substitutions = aliasSubstitution(alias, unwrapped, /* @__PURE__ */ new Map());
  if (substitutions === null) return null;
  const resolved = classifyAliasBroadTarget(
    alias.typeAnnotation,
    environment,
    substitutions,
    /* @__PURE__ */ new Set([name])
  );
  return resolved;
}
function hasBroadRecordKey(type, environment, substitutions) {
  const key = type.typeArguments?.params[0];
  return key === void 0 || isBroadMappedKey(key, environment, substitutions);
}
function isBroadMappedKey(type, environment, substitutions, visitedAliases = /* @__PURE__ */ new Set()) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type === "TSStringKeyword" || unwrapped.type === "TSNumberKeyword" || unwrapped.type === "TSSymbolKeyword") {
    return true;
  }
  if (unwrapped.type === "TSUnionType") {
    return unwrapped.types.some(
      (member) => isBroadMappedKey(member, environment, substitutions, visitedAliases)
    );
  }
  if (unwrapped.type !== "TSTypeReference") return false;
  const name = typeReferenceName2(unwrapped);
  if (name === null) return false;
  const substitution = substitutions.get(name);
  if (substitution !== void 0 && !isUnappliedReferenceTo(substitution, name)) {
    return isBroadMappedKey(substitution, environment, substitutions, visitedAliases);
  }
  if (name === "PropertyKey" && isBuiltIn(name, unwrapped, environment)) return true;
  const alias = visibleTypeAlias(name, unwrapped, environment.typeAliases);
  if (alias === null || (alias.typeParameters?.params.length ?? 0) > 0 || visitedAliases.has(name)) {
    return false;
  }
  const nextVisited = new Set(visitedAliases);
  nextVisited.add(name);
  return isBroadMappedKey(alias.typeAnnotation, environment, substitutions, nextVisited);
}
function classifyAliasBroadTarget(type, environment, substitutions, resolvingAliases) {
  const unwrapped = unwrapTransparentType(type);
  if (unwrapped.type === "TSUnknownKeyword") return { kind: "unknown" };
  if (unwrapped.type === "TSObjectKeyword") return { kind: "object" };
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.some((member) => member.type === "TSIndexSignature") ? { kind: "open dictionary" } : null;
  }
  if (unwrapped.type === "TSMappedType") {
    return isBroadMappedKey(unwrapped.constraint, environment, substitutions) ? { kind: "open dictionary" } : null;
  }
  if (unwrapped.type !== "TSTypeReference") return null;
  const name = typeReferenceName2(unwrapped);
  if (name === null) return null;
  const substitution = substitutions.get(name);
  if (substitution !== void 0) {
    return isUnappliedReferenceTo(substitution, name) ? null : classifyAliasBroadTarget(
      substitution,
      environment,
      substitutions,
      resolvingAliases
    );
  }
  if (TRANSPARENT_WRAPPERS.has(name) && isBuiltIn(name, unwrapped, environment)) {
    const wrapped = unwrapped.typeArguments?.params[0];
    return wrapped === void 0 ? null : classifyAliasBroadTarget(wrapped, environment, substitutions, resolvingAliases);
  }
  if (name === "Record" && isBuiltIn(name, unwrapped, environment)) {
    return hasBroadRecordKey(unwrapped, environment, substitutions) ? { kind: "open dictionary" } : null;
  }
  const alias = visibleTypeAlias(name, unwrapped, environment.typeAliases);
  if (alias === null || resolvingAliases.has(name)) return null;
  const nextSubstitutions = aliasSubstitution(alias, unwrapped, substitutions);
  if (nextSubstitutions === null) return null;
  const nextResolving = new Set(resolvingAliases);
  nextResolving.add(name);
  return classifyAliasBroadTarget(
    alias.typeAnnotation,
    environment,
    nextSubstitutions,
    nextResolving
  );
}
function isKnownEvidenceExpression(expression) {
  let current = expression;
  while (current.type === "ParenthesizedExpression" || current.type === "TSAsExpression" || current.type === "TSTypeAssertion" || current.type === "TSNonNullExpression" || current.type === "TSSatisfiesExpression") {
    current = current.expression;
  }
  if (current.type === "ObjectExpression") return true;
  return current.type === "ArrayExpression" || current.type === "ArrowFunctionExpression" || current.type === "ClassExpression" || current.type === "FunctionExpression" || current.type === "NewExpression" || current.type === "Literal" || current.type === "TemplateLiteral" || current.type === "UnaryExpression";
}

// src/shared/function-parameters.ts
function containsUnknownType(type) {
  if (type.type === "TSUnknownKeyword") return true;
  if (type.type === "TSParenthesizedType") return containsUnknownType(type.typeAnnotation);
  return type.type === "TSUnionType" && type.types.some(containsUnknownType);
}
function functionParameterTypeAnnotation(parameter) {
  if (parameter.type === "TSParameterProperty") {
    return functionParameterTypeAnnotation(parameter.parameter);
  }
  if (parameter.type === "RestElement") {
    return parameter.typeAnnotation ?? functionParameterTypeAnnotation(parameter.argument);
  }
  if (parameter.type === "AssignmentPattern") {
    return parameter.typeAnnotation ?? functionParameterTypeAnnotation(parameter.left);
  }
  return parameter.typeAnnotation;
}
function functionParameterBindingName(parameter, sourceCode) {
  if (parameter.type === "TSParameterProperty") {
    return functionParameterBindingName(parameter.parameter, sourceCode);
  }
  if (parameter.type === "AssignmentPattern") {
    return functionParameterBindingName(parameter.left, sourceCode);
  }
  if (parameter.type === "RestElement") {
    return functionParameterBindingName(parameter.argument, sourceCode);
  }
  if (parameter.type === "Identifier") return parameter.name;
  const sourceText = sourceCode.getText(parameter);
  const annotationStart = parameter.typeAnnotation?.start;
  return annotationStart === void 0 ? sourceText : sourceText.slice(0, annotationStart - parameter.start).trimEnd();
}

// src/rules/no-known-value-widening.ts
function unwrapExpression(expression) {
  let current = expression;
  while (current.type === "ParenthesizedExpression" || current.type === "TSAsExpression" || current.type === "TSSatisfiesExpression" || current.type === "TSTypeAssertion" || current.type === "TSNonNullExpression") {
    current = current.expression;
  }
  return current;
}
function resolveVariable(sourceCode, identifier) {
  let scope = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== void 0) return variable;
    scope = scope.upper;
  }
  return null;
}
function variableDeclarator(variable) {
  if (variable.defs.length !== 1) return null;
  const [definition] = variable.defs;
  return definition?.type === "Variable" && definition.node.type === "VariableDeclarator" ? definition.node : null;
}
function isStableConstVariable(variable, declarator) {
  return declarator.parent.type === "VariableDeclaration" && declarator.parent.kind === "const" && variable.references.every((reference) => reference.init || !reference.isWrite());
}
function hasKnownEvidence(sourceCode, expression, visitedVariables = /* @__PURE__ */ new Set()) {
  if (isKnownEvidenceExpression(expression)) return true;
  const unwrapped = unwrapExpression(expression);
  if (unwrapped.type !== "Identifier") return false;
  const variable = resolveVariable(sourceCode, unwrapped);
  if (variable === null || visitedVariables.has(variable)) return false;
  const declarator = variableDeclarator(variable);
  if (declarator === null || declarator.init === null || !isStableConstVariable(variable, declarator)) {
    return false;
  }
  visitedVariables.add(variable);
  return hasKnownEvidence(sourceCode, declarator.init, visitedVariables);
}
function isFunctionExpression(node) {
  return node.type === "ArrowFunctionExpression" || node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "TSDeclareFunction" || node.type === "TSEmptyBodyFunctionExpression";
}
function localFunctionForCall(sourceCode, callee) {
  const unwrapped = unwrapExpression(callee);
  if (isFunctionExpression(unwrapped)) return unwrapped;
  if (unwrapped.type !== "Identifier") return null;
  const variable = resolveVariable(sourceCode, unwrapped);
  if (variable === null || variable.defs.length !== 1) return null;
  const [definition] = variable.defs;
  if (definition === void 0) return null;
  if (definition.type === "FunctionName" && isFunctionExpression(definition.node)) {
    return definition.node;
  }
  if (definition.type !== "Variable" || definition.node.type !== "VariableDeclarator") {
    return null;
  }
  const initializer = definition.node.init;
  if (initializer === null) return null;
  const unwrappedInitializer = unwrapExpression(initializer);
  return isFunctionExpression(unwrappedInitializer) ? unwrappedInitializer : null;
}
function variableTypeAnnotation(sourceCode, variable) {
  if (variable.defs.length !== 1) return null;
  const [definition] = variable.defs;
  if (definition === void 0) return null;
  if (definition.type === "Variable" && definition.node.type === "VariableDeclarator" && definition.node.id.type === "Identifier") {
    return definition.node.id.typeAnnotation ?? null;
  }
  if (definition.type !== "Parameter" || !isFunctionExpression(definition.node)) {
    return null;
  }
  const parameter = definition.node.params.find(
    (candidate) => functionParameterBindingName(candidate, sourceCode) === variable.name
  );
  return parameter === void 0 ? null : functionParameterTypeAnnotation(parameter) ?? null;
}
function hasInformativeType(type, environment) {
  return classifyUnsafeDictionaryValue(type, environment) === null;
}
function hasKnownCallArgumentEvidence(sourceCode, expression, environment, visitedVariables = /* @__PURE__ */ new Set()) {
  if (expression.type === "ParenthesizedExpression" || expression.type === "TSNonNullExpression") {
    return hasKnownCallArgumentEvidence(
      sourceCode,
      expression.expression,
      environment,
      visitedVariables
    );
  }
  if (expression.type === "TSAsExpression" || expression.type === "TSTypeAssertion") {
    return hasInformativeType(expression.typeAnnotation, environment);
  }
  if (expression.type === "TSSatisfiesExpression") {
    return hasKnownCallArgumentEvidence(
      sourceCode,
      expression.expression,
      environment,
      visitedVariables
    );
  }
  if (expression.type === "CallExpression") {
    const owner = localFunctionForCall(sourceCode, expression.callee);
    const returnType = owner?.returnType?.typeAnnotation;
    return returnType !== void 0 && hasInformativeType(returnType, environment);
  }
  if (expression.type !== "Identifier") return isKnownEvidenceExpression(expression);
  const variable = resolveVariable(sourceCode, expression);
  if (variable === null || visitedVariables.has(variable)) return false;
  const annotation = variableTypeAnnotation(sourceCode, variable);
  if (annotation !== null) {
    return hasInformativeType(annotation.typeAnnotation, environment);
  }
  const declarator = variableDeclarator(variable);
  if (declarator === null || declarator.init === null || !isStableConstVariable(variable, declarator)) {
    return false;
  }
  visitedVariables.add(variable);
  return hasKnownCallArgumentEvidence(
    sourceCode,
    declarator.init,
    environment,
    visitedVariables
  );
}
function typePredicateSubjectIndex(sourceCode, owner) {
  const predicate = owner.returnType?.typeAnnotation;
  if (predicate?.type !== "TSTypePredicate" || predicate.parameterName.type !== "Identifier") {
    return null;
  }
  const predicateParameterName = predicate.parameterName.name;
  const index = owner.params.findIndex(
    (parameter) => functionParameterBindingName(parameter, sourceCode) === predicateParameterName
  );
  return index === -1 ? null : index;
}
function annotationTarget(annotation, environment) {
  return annotation === null || annotation === void 0 ? null : classifyWideningTarget(annotation.typeAnnotation, environment);
}
function enclosingFunction(node) {
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (current.type === "ArrowFunctionExpression" || current.type === "FunctionDeclaration" || current.type === "FunctionExpression") {
      return current;
    }
    current = current.parent;
  }
  return null;
}
function sourceKeyName(sourceCode, key) {
  if (key.type === "Identifier" || key.type === "PrivateIdentifier") return key.name;
  if (key.type === "Literal") return String(key.value);
  return sourceCode.getText(key);
}
function functionName(sourceCode, owner) {
  if (owner === null) return "anonymous function";
  if (owner.id !== null) return owner.id.name;
  const parent = owner.parent;
  if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier")
    return parent.id.name;
  if (parent.type === "MethodDefinition") return sourceKeyName(sourceCode, parent.key);
  return "anonymous function";
}
function isEmptyObjectExpression2(expression) {
  const unwrapped = unwrapExpression(expression);
  return unwrapped.type === "ObjectExpression" && unwrapped.properties.length === 0;
}
function isDictionaryAccumulatorTarget(destination) {
  return destination.kind === "open dictionary" || destination.kind === "generic container";
}
function hasParentAssertion(node) {
  return node.parent?.type === "TSAsExpression" || node.parent?.type === "TSTypeAssertion";
}
var noKnownValueWideningRule = defineRule5({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow syntactically established values from flowing into explicitly broad or anonymous target types that discard useful evidence."
    },
    messages: {
      widening: "The explicit {{target}} type on {{subject}} discards known type evidence. Keep inference, validate with `satisfies`, or use a named owner contract."
    }
  },
  createOnce(context) {
    let environment = null;
    const reportFlow = (expression, destination, subject) => {
      if (destination === null) return;
      if (isDictionaryAccumulatorTarget(destination) && isEmptyObjectExpression2(expression)) {
        return;
      }
      if (!hasKnownEvidence(context.sourceCode, expression)) return;
      context.report({
        node: expression,
        messageId: "widening",
        data: { subject, target: destination.kind }
      });
    };
    const targetFromAnnotation = (annotation) => environment === null ? null : annotationTarget(annotation, environment);
    return {
      Program(node) {
        environment = createTypeEnvironment(
          node,
          context.sourceCode.visitorKeys
        );
      },
      VariableDeclarator(node) {
        if (node.init === null || node.id.type !== "Identifier") return;
        reportFlow(
          node.init,
          targetFromAnnotation(node.id.typeAnnotation),
          `binding \`${node.id.name}\``
        );
      },
      PropertyDefinition(node) {
        if (node.value === null) return;
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``
        );
      },
      AccessorProperty(node) {
        if (node.value === null) return;
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``
        );
      },
      AssignmentExpression(node) {
        if (node.operator !== "=" || node.left.type !== "Identifier") return;
        const variable = resolveVariable(context.sourceCode, node.left);
        if (variable === null) return;
        const declarator = variableDeclarator(variable);
        if (declarator === null || declarator.id.type !== "Identifier") return;
        reportFlow(
          node.right,
          targetFromAnnotation(declarator.id.typeAnnotation),
          `binding \`${declarator.id.name}\``
        );
      },
      CallExpression(node) {
        if (environment === null) return;
        const owner = localFunctionForCall(context.sourceCode, node.callee);
        if (owner === null) return;
        const parameterIndex = typePredicateSubjectIndex(context.sourceCode, owner);
        if (parameterIndex === null) return;
        const parameter = owner.params[parameterIndex];
        const argument = node.arguments[parameterIndex];
        if (parameter === void 0 || argument === void 0 || argument.type === "SpreadElement") {
          return;
        }
        const parameterAnnotation = functionParameterTypeAnnotation(parameter);
        if (parameterAnnotation === null || parameterAnnotation === void 0 || !containsUnknownType(parameterAnnotation.typeAnnotation)) {
          return;
        }
        if (!hasKnownCallArgumentEvidence(
          context.sourceCode,
          argument,
          environment
        )) {
          return;
        }
        context.report({
          node: argument,
          messageId: "widening",
          data: {
            subject: `argument for parameter \`${functionParameterBindingName(parameter, context.sourceCode)}\` of \`${functionName(context.sourceCode, owner)}\``,
            target: "unknown"
          }
        });
      },
      ReturnStatement(node) {
        if (node.argument === null) return;
        const owner = enclosingFunction(node);
        reportFlow(
          node.argument,
          targetFromAnnotation(owner?.returnType),
          `return value of \`${functionName(context.sourceCode, owner)}\``
        );
      },
      ArrowFunctionExpression(node) {
        if (node.body.type === "BlockStatement") return;
        reportFlow(
          node.body,
          targetFromAnnotation(node.returnType),
          `return value of \`${functionName(context.sourceCode, node)}\``
        );
      },
      TSAsExpression(node) {
        if (environment === null || hasParentAssertion(node)) return;
        reportFlow(
          node.expression,
          classifyWideningTarget(node.typeAnnotation, environment),
          "assertion"
        );
      },
      TSTypeAssertion(node) {
        if (environment === null || hasParentAssertion(node)) return;
        reportFlow(
          node.expression,
          classifyWideningTarget(node.typeAnnotation, environment),
          "assertion"
        );
      }
    };
  }
});

// src/rules/no-module-mocking.ts
import { defineRule as defineRule6 } from "@oxlint/plugins";
var moduleMockMethods = /* @__PURE__ */ new Set(["doMock", "mock", "unstable_mockModule"]);
function resolveVariable2(sourceCode, identifier) {
  let scope = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== void 0) return variable;
    scope = scope.upper;
  }
  return null;
}
function importedName(node) {
  if (node.type !== "ImportSpecifier") return null;
  return node.imported.type === "Identifier" ? node.imported.name : node.imported.value;
}
function isTestFrameworkObject(sourceCode, expression) {
  if (expression.type !== "Identifier") return false;
  if ((expression.name === "vi" || expression.name === "jest") && sourceCode.isGlobalReference(expression)) {
    return true;
  }
  const variable = resolveVariable2(sourceCode, expression);
  if (variable === null || variable.defs.length === 0) {
    return expression.name === "vi" || expression.name === "jest";
  }
  return variable.defs.some((definition) => {
    if (definition.type !== "ImportBinding" || definition.parent?.type !== "ImportDeclaration") {
      return false;
    }
    const source = definition.parent.source.value;
    const name = importedName(definition.node);
    return source === "vitest" && name === "vi" || source === "@jest/globals" && name === "jest";
  });
}
function moduleMockCall(sourceCode, callee) {
  if (!("property" in callee) || !("object" in callee) || !("computed" in callee)) return false;
  if (!isTestFrameworkObject(sourceCode, callee.object)) return false;
  const property = callee.property;
  const method = callee.computed ? property.type === "Literal" && (property.value === "doMock" || property.value === "mock" || property.value === "unstable_mockModule") ? property.value : null : property.type === "Identifier" ? property.name : null;
  return method !== null && moduleMockMethods.has(method);
}
var noModuleMockingRule = defineRule6({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Vitest and Jest module mocking; tests must replace dependencies through real interfaces."
    },
    messages: {
      moduleMock: "Replace module mocking with dependency injection through a real interface, service layer, or faithful test implementation."
    }
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === "Super" || node.callee.type === "V8IntrinsicExpression") return;
        if (moduleMockCall(context.sourceCode, node.callee)) {
          context.report({ node, messageId: "moduleMock" });
        }
      }
    };
  }
});

// src/rules/no-object-parameters.ts
import { defineRule as defineRule7 } from "@oxlint/plugins";
var noObjectParametersRule = defineRule7({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow object function parameters; inputs must use an owner-provided type and be parsed at their boundary."
    },
    messages: {
      objectParameter: "Parameter `{{parameter}}` uses the broad `object` type. Accept a named owner type; parse external input at its boundary before calling this function."
    }
  },
  createOnce(context) {
    let environment = null;
    const resolvesToObject = (type) => environment !== null && resolvedTypeMatches(type, environment, (resolved, matches) => {
      if (resolved.type === "TSObjectKeyword") return true;
      if (resolved.type === "TSParenthesizedType") {
        return matches(resolved.typeAnnotation);
      }
      return resolved.type === "TSUnionType" && resolved.types.some(matches);
    });
    const checkParameters = (node) => {
      for (const parameter of node.params) {
        const annotation = functionParameterTypeAnnotation(parameter);
        if (annotation === null || annotation === void 0) continue;
        if (!resolvesToObject(annotation.typeAnnotation)) continue;
        context.report({
          node: annotation.typeAnnotation,
          messageId: "objectParameter",
          data: { parameter: functionParameterBindingName(parameter, context.sourceCode) }
        });
      }
    };
    return {
      Program(node) {
        environment = createTypeAliasEnvironment(
          node,
          context.sourceCode.visitorKeys
        );
      },
      ArrowFunctionExpression: checkParameters,
      FunctionDeclaration: checkParameters,
      FunctionExpression: checkParameters,
      TSCallSignatureDeclaration: checkParameters,
      TSConstructSignatureDeclaration: checkParameters,
      TSConstructorType: checkParameters,
      TSDeclareFunction: checkParameters,
      TSEmptyBodyFunctionExpression: checkParameters,
      TSFunctionType: checkParameters,
      TSMethodSignature: checkParameters
    };
  }
});

// src/rules/no-reflect-apply.ts
import { defineRule as defineRule8 } from "@oxlint/plugins";

// src/shared/reflect-method.ts
function resolveVariable3(sourceCode, identifier) {
  let scope = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== void 0) return variable;
    scope = scope.upper;
  }
  return null;
}
function isGlobalReflect(sourceCode, expression) {
  if (expression.type !== "Identifier" || expression.name !== "Reflect") return false;
  if (sourceCode.isGlobalReference(expression)) return true;
  const variable = resolveVariable3(sourceCode, expression);
  return variable === null || variable.defs.length === 0;
}
function isGlobalReflectMethodCall(sourceCode, callee, methodName) {
  if (!("property" in callee) || !("object" in callee) || !("computed" in callee)) return false;
  if (!isGlobalReflect(sourceCode, callee.object)) return false;
  const property = callee.property;
  return callee.computed ? property.type === "Literal" && property.value === methodName : property.type === "Identifier" && property.name === methodName;
}

// src/rules/no-reflect-apply.ts
var noReflectApplyRule = defineRule8({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Reflect.apply; call typed functions directly or model dynamic dispatch behind an interface."
    },
    messages: {
      reflectApply: "Replace `Reflect.apply` with a typed function call. Model dynamic dispatch behind a named interface."
    }
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === "Super" || node.callee.type === "V8IntrinsicExpression") return;
        if (isGlobalReflectMethodCall(context.sourceCode, node.callee, "apply")) {
          context.report({ node, messageId: "reflectApply" });
        }
      }
    };
  }
});

// src/rules/no-reflect-get.ts
import { defineRule as defineRule9 } from "@oxlint/plugins";
var noReflectGetRule = defineRule9({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Reflect.get; use typed property access or parse dynamic input into a domain type."
    },
    messages: {
      reflectGet: "Replace `Reflect.get` with typed property access. Parse dynamic input into a named domain type before reading it."
    }
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === "Super" || node.callee.type === "V8IntrinsicExpression") return;
        if (isGlobalReflectMethodCall(context.sourceCode, node.callee, "get")) {
          context.report({ node, messageId: "reflectGet" });
        }
      }
    };
  }
});

// src/rules/no-runtime-typeof.ts
import { defineRule as defineRule10 } from "@oxlint/plugins";
function isRuntimeFunction(node) {
  return node.type === "ArrowFunctionExpression" || node.type === "FunctionDeclaration" || node.type === "FunctionExpression";
}
function isInsideTypeGuard(node) {
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (isRuntimeFunction(current)) {
      return current.returnType?.typeAnnotation.type === "TSTypePredicate";
    }
    current = current.parent;
  }
  return false;
}
function isExistenceProbe(node) {
  const parent = node.parent;
  if (parent.type !== "BinaryExpression") return false;
  if (!["===", "!==", "==", "!="].includes(parent.operator)) return false;
  const other = parent.left === node ? parent.right : parent.left;
  return other.type === "Literal" && other.value === "undefined";
}
var noRuntimeTypeofRule = defineRule10({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow runtime typeof checks; external values must be decoded into meaningful types at their I/O boundary."
    },
    messages: {
      runtimeTypeof: "A `typeof` check narrows a representation without establishing its contract. Parse input at its I/O boundary, then branch on the domain value."
    },
    schema: [
      {
        type: "object",
        properties: {
          allowInTypeGuards: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    defaultOptions: [{ allowInTypeGuards: false }]
  },
  createOnce(context) {
    return {
      UnaryExpression(node) {
        const option = context.options?.[0];
        const allowInTypeGuards = typeof option === "object" && option !== null && !Array.isArray(option) && option.allowInTypeGuards === true;
        if (node.operator === "typeof" && !isExistenceProbe(node) && (!allowInTypeGuards || !isInsideTypeGuard(node))) {
          context.report({ node, messageId: "runtimeTypeof" });
        }
      }
    };
  }
});

// src/rules/no-shape-in-symbol-names.ts
import { defineRule as defineRule11 } from "@oxlint/plugins";
var FORBIDDEN_SYMBOL_NAME = "shape";
function containsForbiddenSymbolName(name) {
  return name.toLowerCase().includes(FORBIDDEN_SYMBOL_NAME);
}
function isBorrowedMemberName(node) {
  const parent = node.parent;
  if (parent === null || parent.type !== "MemberExpression") return false;
  return parent.property === node && parent.computed === false;
}
var noForbiddenTermInSymbolNamesRule = defineRule11({
  meta: {
    type: "problem",
    docs: {
      description: 'Disallow the case-insensitive substring "shape" in JavaScript, TypeScript, private, and JSX symbol names.'
    },
    messages: {
      forbiddenSymbolName: 'Rename symbol "{{name}}" for its domain role; "shape" describes structure rather than ownership.'
    }
  },
  createOnce(context) {
    const reportForbiddenSymbolName = (node) => {
      if (!containsForbiddenSymbolName(node.name) || isBorrowedMemberName(node)) return;
      context.report({
        node,
        messageId: "forbiddenSymbolName",
        data: { name: node.name }
      });
    };
    return {
      Identifier: reportForbiddenSymbolName,
      PrivateIdentifier: reportForbiddenSymbolName,
      JSXIdentifier: reportForbiddenSymbolName
    };
  }
});

// src/rules/no-unknown-parameters.ts
import { defineRule as defineRule12 } from "@oxlint/plugins";
function isTypePredicateSubject(owner, parameterName) {
  const predicate = owner.returnType?.typeAnnotation;
  return predicate?.type === "TSTypePredicate" && predicate.parameterName.type === "Identifier" && predicate.parameterName.name === parameterName;
}
var noUnknownParametersRule = defineRule12({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow explicitly unknown function parameters except `cause` and type-predicate subjects; decode unknown input at its I/O boundary instead."
    },
    messages: {
      unknownParameter: "Parameter `{{parameter}}` leaves input unparsed. Accept a named domain type; run the expected schema or parser at the I/O boundary before calling this function."
    }
  },
  createOnce(context) {
    const checkParameters = (node) => {
      for (const parameter of node.params) {
        const annotation = functionParameterTypeAnnotation(parameter);
        if (annotation === null || annotation === void 0) continue;
        if (!containsUnknownType(annotation.typeAnnotation)) continue;
        const name = functionParameterBindingName(parameter, context.sourceCode);
        if (name === "cause" || isTypePredicateSubject(node, name)) continue;
        context.report({
          node: annotation.typeAnnotation,
          messageId: "unknownParameter",
          data: { parameter: name }
        });
      }
    };
    return {
      ArrowFunctionExpression: checkParameters,
      FunctionDeclaration: checkParameters,
      FunctionExpression: checkParameters,
      TSCallSignatureDeclaration: checkParameters,
      TSConstructSignatureDeclaration: checkParameters,
      TSConstructorType: checkParameters,
      TSDeclareFunction: checkParameters,
      TSEmptyBodyFunctionExpression: checkParameters,
      TSFunctionType: checkParameters,
      TSMethodSignature: checkParameters
    };
  }
});

// src/rules/no-unknown-returns.ts
import { defineRule as defineRule13 } from "@oxlint/plugins";
var noUnknownReturnsRule = defineRule13({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow functions whose explicit return contract is unknown or Promise<unknown>."
    },
    messages: {
      unknownReturn: "This function exposes `unknown` to its caller. Parse the value at its boundary and return a named domain type."
    }
  },
  createOnce(context) {
    let environment = null;
    const resolvesToUnknown = (type) => environment !== null && resolvedTypeMatches(type, environment, (resolved, matches) => {
      if (resolved.type === "TSUnknownKeyword") return true;
      if (resolved.type === "TSParenthesizedType") {
        return matches(resolved.typeAnnotation);
      }
      if (resolved.type === "TSUnionType") return resolved.types.some(matches);
      if (resolved.type !== "TSTypeReference" || resolved.typeName.type !== "Identifier" || resolved.typeName.name !== "Promise" && resolved.typeName.name !== "PromiseLike") {
        return false;
      }
      const value = resolved.typeArguments?.params[0];
      return value !== void 0 && matches(value);
    });
    const checkReturnType = (node) => {
      const annotation = node.returnType;
      if (annotation === null || annotation === void 0) return;
      if (!resolvesToUnknown(annotation.typeAnnotation)) return;
      context.report({ node: annotation.typeAnnotation, messageId: "unknownReturn" });
    };
    return {
      Program(node) {
        environment = createTypeAliasEnvironment(
          node,
          context.sourceCode.visitorKeys
        );
      },
      ArrowFunctionExpression: checkReturnType,
      FunctionDeclaration: checkReturnType,
      FunctionExpression: checkReturnType,
      TSCallSignatureDeclaration: checkReturnType,
      TSConstructSignatureDeclaration: checkReturnType,
      TSConstructorType: checkReturnType,
      TSDeclareFunction: checkReturnType,
      TSEmptyBodyFunctionExpression: checkReturnType,
      TSFunctionType: checkReturnType,
      TSMethodSignature: checkReturnType
    };
  }
});

// src/rules/no-unknown-type-aliases.ts
import { defineRule as defineRule14 } from "@oxlint/plugins";
var noUnknownTypeAliasesRule = defineRule14({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow type aliases whose resolved type is unknown; unknown must remain visible at an allowed boundary."
    },
    messages: {
      unknownAlias: "Type alias `{{alias}}` hides `unknown`. Keep `unknown` explicit at the parsing boundary or on an allowed `cause` field; otherwise use the parsed owner type."
    }
  },
  createOnce(context) {
    let environment = null;
    const resolvesToUnknown = (type) => environment !== null && resolvedTypeMatches(type, environment, (resolved, matches) => {
      if (resolved.type === "TSUnknownKeyword") return true;
      if (resolved.type === "TSParenthesizedType") {
        return matches(resolved.typeAnnotation);
      }
      return resolved.type === "TSUnionType" && resolved.types.some(matches);
    });
    return {
      Program(node) {
        environment = createTypeAliasEnvironment(
          node,
          context.sourceCode.visitorKeys
        );
      },
      TSTypeAliasDeclaration(node) {
        if (!resolvesToUnknown(node.typeAnnotation)) return;
        context.report({
          node: node.id,
          messageId: "unknownAlias",
          data: { alias: node.id.name }
        });
      }
    };
  }
});

// src/rules/no-unsafe-dictionary-type.ts
import { defineRule as defineRule15 } from "@oxlint/plugins";
var typeNodeKinds = /* @__PURE__ */ new Set([
  "JSDocNonNullableType",
  "JSDocNullableType",
  "JSDocUnknownType",
  "TSAnyKeyword",
  "TSArrayType",
  "TSBigIntKeyword",
  "TSBooleanKeyword",
  "TSConditionalType",
  "TSConstructorType",
  "TSFunctionType",
  "TSImportType",
  "TSIndexedAccessType",
  "TSInferType",
  "TSIntersectionType",
  "TSIntrinsicKeyword",
  "TSLiteralType",
  "TSMappedType",
  "TSNamedTupleMember",
  "TSNeverKeyword",
  "TSNullKeyword",
  "TSNumberKeyword",
  "TSObjectKeyword",
  "TSParenthesizedType",
  "TSStringKeyword",
  "TSSymbolKeyword",
  "TSTemplateLiteralType",
  "TSThisType",
  "TSTupleType",
  "TSTypeLiteral",
  "TSTypeOperator",
  "TSTypePredicate",
  "TSTypeQuery",
  "TSTypeReference",
  "TSUndefinedKeyword",
  "TSUnionType",
  "TSUnknownKeyword",
  "TSVoidKeyword"
]);
function isTypeNode(node) {
  return typeNodeKinds.has(node.type);
}
function typeReferenceName3(type) {
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}
function isInsideTypeAliasDeclaration(node) {
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (current.type === "TSTypeAliasDeclaration") return true;
    current = current.parent;
  }
  return false;
}
function isPlainAliasConsumerUse(node, environment) {
  if (node.type !== "TSTypeReference" || node.typeArguments?.params.length) return false;
  const name = typeReferenceName3(node);
  return name !== null && visibleTypeAlias(name, node, environment.typeAliases) !== null && !isInsideTypeAliasDeclaration(node);
}
function isInsideTypeParameterConstraint(node) {
  let child = node;
  let parent = child.parent;
  while (parent !== null && parent.type !== "Program") {
    if (parent.type === "TSTypeParameter" && parent.constraint === child) return true;
    child = parent;
    parent = child.parent;
  }
  return false;
}
function shouldReportType(node, environment) {
  if (isInsideTypeParameterConstraint(node)) return false;
  if (isPlainAliasConsumerUse(node, environment)) return false;
  if (classifyUnsafeDictionary(node, environment) === null) return false;
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (isTypeNode(current) && classifyUnsafeDictionary(current, environment) !== null)
      return false;
    current = current.parent;
  }
  return true;
}
var noUnsafeDictionaryTypeRule = defineRule15({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow object-dictionary contracts whose direct value type is unknown, any, object, {}, or a union/alias containing one of those escape hatches."
    },
    messages: {
      unsafeDictionary: "This dictionary's {{value}} value type gives callers no concrete value contract. Use an owner/schema-derived value type; parse external payloads before insertion."
    }
  },
  createOnce(context) {
    let environment = null;
    const report = (node, value) => {
      context.report({ node, messageId: "unsafeDictionary", data: { value } });
    };
    const reportIfUnsafe = (node) => {
      if (environment === null || !shouldReportType(node, environment)) return;
      const unsafe = classifyUnsafeDictionary(node, environment);
      if (unsafe === null) return;
      report(node, unsafe.unsafeValue);
    };
    return {
      Program(node) {
        environment = createTypeEnvironment(
          node,
          context.sourceCode.visitorKeys
        );
      },
      TSTypeReference: reportIfUnsafe,
      TSTypeLiteral: reportIfUnsafe,
      TSMappedType: reportIfUnsafe,
      TSIndexSignature(node) {
        if (environment === null || node.typeAnnotation === null || node.parent.type === "TSTypeLiteral")
          return;
        const unsafe = classifyUnsafeDictionaryValue(
          node.typeAnnotation.typeAnnotation,
          environment
        );
        if (unsafe !== null) report(node, unsafe.unsafeValue);
      }
    };
  }
});

// src/rules/no-widen-then-assert.ts
import { defineRule as defineRule16 } from "@oxlint/plugins";
var functionBoundaryTypes = /* @__PURE__ */ new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
  "TSDeclareFunction",
  "TSEmptyBodyFunctionExpression"
]);
function unwrapExpressionParentheses(expression) {
  let current = expression;
  while (current.type === "ParenthesizedExpression") current = current.expression;
  return current;
}
function unwrapTypeParentheses(type) {
  let current = type;
  while (current.type === "TSParenthesizedType") current = current.typeAnnotation;
  return current;
}
function typeReferenceName4(type) {
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}
function isUnknownOrAnyType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  return unwrapped.type === "TSUnknownKeyword" || unwrapped.type === "TSAnyKeyword";
}
function isBroadRecordKeyType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSStringKeyword" || unwrapped.type === "TSNumberKeyword" || unwrapped.type === "TSSymbolKeyword") {
    return true;
  }
  if (unwrapped.type === "TSUnionType") return unwrapped.types.every(isBroadRecordKeyType);
  return unwrapped.type === "TSTypeReference" && typeReferenceName4(unwrapped) === "PropertyKey";
}
function isBroadRecordType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSTypeReference") {
    if (typeReferenceName4(unwrapped) === "Readonly") {
      const [inner] = unwrapped.typeArguments?.params ?? [];
      return inner !== void 0 && isBroadRecordType(inner);
    }
    if (typeReferenceName4(unwrapped) !== "Record") return false;
    const parameters = unwrapped.typeArguments?.params ?? [];
    return parameters.length === 2 && parameters[0] !== void 0 && parameters[1] !== void 0 && isBroadRecordKeyType(parameters[0]) && isUnknownOrAnyType(parameters[1]);
  }
  if (unwrapped.type !== "TSTypeLiteral" || unwrapped.members.length !== 1) return false;
  const [member] = unwrapped.members;
  const [parameter] = member?.type === "TSIndexSignature" ? member.parameters : [];
  return member?.type === "TSIndexSignature" && member.parameters.length === 1 && parameter !== void 0 && isBroadRecordKeyType(parameter.typeAnnotation.typeAnnotation) && isUnknownOrAnyType(member.typeAnnotation.typeAnnotation);
}
function broadTypeKind(type) {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSUnknownKeyword" || unwrapped.type === "TSAnyKeyword") return "top";
  if (unwrapped.type === "TSObjectKeyword") return "object";
  return isBroadRecordType(unwrapped) ? "record" : null;
}
function assertedExpression(node) {
  return unwrapExpressionParentheses(node.expression);
}
function assertionFromExpression(expression) {
  const unwrapped = unwrapExpressionParentheses(expression);
  return unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion" ? unwrapped : null;
}
function normalizedTypeText(sourceText, type) {
  return sourceText.slice(type.start, type.end).replaceAll(/\s+/gu, "");
}
function typesHaveSameSyntax(sourceText, left, right) {
  return left !== null && normalizedTypeText(sourceText, unwrapTypeParentheses(left)) === normalizedTypeText(sourceText, unwrapTypeParentheses(right));
}
function isDefinitelyObjectType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  switch (unwrapped.type) {
    case "TSArrayType":
    case "TSConstructorType":
    case "TSFunctionType":
    case "TSMappedType":
    case "TSObjectKeyword":
    case "TSTupleType":
      return true;
    case "TSTypeLiteral":
      return unwrapped.members.length > 0;
    case "TSIntersectionType":
      return unwrapped.types.every(isDefinitelyObjectType);
    case "TSTypeOperator":
      return unwrapped.operator === "readonly" && isDefinitelyObjectType(unwrapped.typeAnnotation);
    default:
      return false;
  }
}
function isDefinitelyNarrowerRecordType(type) {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.some((member) => member.type !== "TSIndexSignature");
  }
  if (unwrapped.type !== "TSTypeReference") return false;
  if (typeReferenceName4(unwrapped) === "Readonly") {
    const [inner] = unwrapped.typeArguments?.params ?? [];
    return inner !== void 0 && isDefinitelyNarrowerRecordType(inner);
  }
  if (typeReferenceName4(unwrapped) !== "Record") return false;
  const parameters = unwrapped.typeArguments?.params ?? [];
  return parameters.length === 2 && parameters[1] !== void 0 && !isUnknownOrAnyType(parameters[1]);
}
function functionBoundary(node) {
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (functionBoundaryTypes.has(current.type)) return current;
    current = current.parent;
  }
  return null;
}
function resolvedVariableForIdentifier(scopes, identifier) {
  for (const scope of scopes) {
    const reference = scope.references.find(
      (candidate) => candidate.identifier.start === identifier.start && candidate.identifier.end === identifier.end
    );
    if (reference !== void 0) return reference.resolved;
  }
  return null;
}
function variableDeclarator2(variable) {
  for (const definition of variable.defs) {
    if (definition.type === "Variable" && definition.node.type === "VariableDeclarator") {
      return definition.node;
    }
  }
  return null;
}
function knownValueEvidence(expression, scopes, boundary, visitedVariables) {
  const unwrapped = unwrapExpressionParentheses(expression);
  if (unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion") {
    if (broadTypeKind(unwrapped.typeAnnotation) !== null) return null;
    return { type: unwrapped.typeAnnotation };
  }
  if (unwrapped.type === "Literal" || unwrapped.type === "TemplateLiteral") {
    return { type: null };
  }
  if (unwrapped.type === "ArrayExpression" || unwrapped.type === "ArrowFunctionExpression" || unwrapped.type === "ClassExpression" || unwrapped.type === "FunctionExpression" || unwrapped.type === "NewExpression" || unwrapped.type === "ObjectExpression") {
    return { type: null };
  }
  if (unwrapped.type !== "Identifier") return null;
  const variable = resolvedVariableForIdentifier(scopes, unwrapped);
  if (variable === null || visitedVariables.has(variable)) return null;
  const annotatedIdentifier = variable.identifiers.find(
    (identifier) => identifier.typeAnnotation !== null && identifier.typeAnnotation !== void 0
  );
  const annotation = annotatedIdentifier?.typeAnnotation?.typeAnnotation;
  if (annotation !== void 0 && annotatedIdentifier !== void 0) {
    if (functionBoundary(annotatedIdentifier) !== boundary || broadTypeKind(annotation) !== null) {
      return null;
    }
    return { type: annotation };
  }
  const declarator = variableDeclarator2(variable);
  if (declarator === null || declarator.parent.type !== "VariableDeclaration" || declarator.parent.kind !== "const" || declarator.init === null || variable.references.some((reference) => reference.isWrite() && !reference.init) || functionBoundary(declarator) !== boundary) {
    return null;
  }
  return knownValueEvidence(
    declarator.init,
    scopes,
    boundary,
    /* @__PURE__ */ new Set([...visitedVariables, variable])
  );
}
function widenedBinding(variable, scopes) {
  const declarator = variableDeclarator2(variable);
  if (declarator === null || declarator.parent.type !== "VariableDeclaration" || declarator.parent.kind !== "const" || declarator.id.type !== "Identifier" || declarator.init === null || variable.references.some((reference) => reference.isWrite() && !reference.init)) {
    return null;
  }
  const boundary = functionBoundary(declarator);
  const declaredType = declarator.id.typeAnnotation?.typeAnnotation;
  const initializerAssertion = assertionFromExpression(declarator.init);
  const initializerBroadKind = initializerAssertion === null ? null : broadTypeKind(initializerAssertion.typeAnnotation);
  const declaredBroadKind = declaredType === void 0 ? null : broadTypeKind(declaredType);
  const broadKind = declaredBroadKind ?? initializerBroadKind;
  if (broadKind === null) return null;
  const originalExpression = initializerAssertion !== null && initializerBroadKind !== null ? assertedExpression(initializerAssertion) : declarator.init;
  const evidence = knownValueEvidence(originalExpression, scopes, boundary, /* @__PURE__ */ new Set([variable]));
  return evidence === null ? null : { broadKind, evidence, declaredAt: declarator.end, boundary };
}
function assertionIsNarrower(sourceText, broadKind, evidence, assertedType) {
  if (broadTypeKind(assertedType) !== null) return false;
  if (broadKind === "top") return true;
  if (typesHaveSameSyntax(sourceText, evidence.type, assertedType)) return true;
  if (broadKind === "object") return isDefinitelyObjectType(assertedType);
  return isDefinitelyNarrowerRecordType(assertedType);
}
var noWidenThenAssertRule = defineRule16({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow local const flows that explicitly widen a known value before asserting the widened binding to a narrower type."
    },
    messages: {
      widenThenAssert: 'Binding "{{name}}" discards type evidence and later recreates it with an assertion. Keep the precise type from initialization through use; parse boundary input once.'
    }
  },
  createOnce(context) {
    let scopes = [];
    const checkAssertion = (node) => {
      const expression = assertedExpression(node);
      if (expression.type !== "Identifier") return;
      const variable = resolvedVariableForIdentifier(scopes, expression);
      if (variable === null) return;
      const widened = widenedBinding(variable, scopes);
      if (widened === null || node.start <= widened.declaredAt || functionBoundary(node) !== widened.boundary || !assertionIsNarrower(
        context.sourceCode.text,
        widened.broadKind,
        widened.evidence,
        node.typeAnnotation
      )) {
        return;
      }
      context.report({
        node,
        messageId: "widenThenAssert",
        data: { name: expression.name }
      });
    };
    return {
      Program() {
        scopes = context.sourceCode.scopeManager.scopes;
      },
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion
    };
  }
});

// src/rules/require-safety-comment-for-type-assertion.ts
import { defineRule as defineRule17 } from "@oxlint/plugins";
var DEFAULT_SAFETY_MARKERS = ["SAFETY"];
var commentOwnerKinds = /* @__PURE__ */ new Set([
  "ExpressionStatement",
  "PropertyDefinition",
  "ReturnStatement",
  "ThrowStatement",
  "VariableDeclaration"
]);
function isConstAssertion2(node) {
  return node.typeAnnotation.type === "TSTypeReference" && node.typeAnnotation.typeName.type === "Identifier" && node.typeAnnotation.typeName.name === "const";
}
function configuredSafetyMarkers(option) {
  if (typeof option !== "object" || option === null || !("markers" in option)) {
    return DEFAULT_SAFETY_MARKERS;
  }
  const configured = option.markers;
  if (!Array.isArray(configured)) return DEFAULT_SAFETY_MARKERS;
  const markers = configured.flatMap(
    (marker) => typeof marker === "string" && marker.trim().length > 0 ? [marker.trim()] : []
  );
  return markers.length > 0 ? markers : DEFAULT_SAFETY_MARKERS;
}
function markerPattern(markers) {
  const alternation = markers.map((marker) => marker.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`)).join("|");
  return new RegExp(
    String.raw`(?:^|[^\p{L}\p{N}_])(?:${alternation})\s*:\s*\S`,
    "u"
  );
}
function hasSafetyJustificationBefore(sourceCode, owner, assertion, pattern) {
  return sourceCode.getCommentsBefore(owner).some(
    (comment) => comment.end <= assertion.start && pattern.test(comment.value)
  );
}
function hasSafetyComment(sourceCode, node, pattern) {
  let current = node;
  while (true) {
    if (hasSafetyJustificationBefore(sourceCode, current, node, pattern)) return true;
    if (commentOwnerKinds.has(current.type)) {
      const exportDeclaration = current.parent;
      return exportDeclaration.type === "ExportNamedDeclaration" && exportDeclaration.declaration === current && hasSafetyJustificationBefore(sourceCode, exportDeclaration, node, pattern);
    }
    if (current.parent.type === "Program") return false;
    current = current.parent;
  }
}
var requireSafetyCommentForTypeAssertionRule = defineRule17({
  meta: {
    type: "problem",
    docs: {
      description: "Require a nearby SAFETY comment for every TypeScript type assertion except const assertions."
    },
    messages: {
      missingSafetyComment: "This type assertion has no `{{marker}}:` justification. State the checked invariant immediately before the assertion or its containing statement."
    },
    schema: [
      {
        type: "object",
        properties: {
          markers: {
            type: "array",
            items: { type: "string", minLength: 1 },
            minItems: 1,
            uniqueItems: true
          }
        },
        additionalProperties: false
      }
    ],
    defaultOptions: [{ markers: ["SAFETY"] }]
  },
  createOnce(context) {
    const patterns = /* @__PURE__ */ new Map();
    const checkAssertion = (node) => {
      if (isConstAssertion2(node)) return;
      const markers = configuredSafetyMarkers(context.options?.[0]);
      const patternKey = markers.join("\0");
      const pattern = patterns.get(patternKey) ?? markerPattern(markers);
      patterns.set(patternKey, pattern);
      if (hasSafetyComment(context.sourceCode, node, pattern)) return;
      context.report({
        node,
        messageId: "missingSafetyComment",
        data: { marker: markers[0] ?? DEFAULT_SAFETY_MARKERS[0] }
      });
    };
    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion
    };
  }
});

// src/index.ts
var antiSlopPlugin = eslintCompatPlugin({
  meta: { name: "anti-slop" },
  rules: {
    "no-array-filter-map": noArrayFilterMapRule,
    "no-reduce-accumulator-copy": noReduceAccumulatorCopyRule,
    "no-chained-type-assertions": noChainedTypeAssertionsRule,
    "no-conditional-empty-object-spread": noConditionalEmptyObjectSpreadRule,
    "no-known-value-widening": noKnownValueWideningRule,
    "no-module-mocking": noModuleMockingRule,
    "no-object-parameters": noObjectParametersRule,
    "no-reflect-apply": noReflectApplyRule,
    "no-reflect-get": noReflectGetRule,
    "no-runtime-typeof": noRuntimeTypeofRule,
    "no-unsafe-dictionary-type": noUnsafeDictionaryTypeRule,
    "no-shape-in-symbol-names": noForbiddenTermInSymbolNamesRule,
    "no-unknown-parameters": noUnknownParametersRule,
    "no-unknown-returns": noUnknownReturnsRule,
    "no-unknown-type-aliases": noUnknownTypeAliasesRule,
    "no-widen-then-assert": noWidenThenAssertRule,
    "require-safety-comment-for-type-assertion": requireSafetyCommentForTypeAssertionRule
  }
});
var index_default = antiSlopPlugin;
export {
  index_default as default
};
