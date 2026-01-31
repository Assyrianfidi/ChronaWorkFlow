/**
 * Condition Evaluation Engine
 * 
 * Evaluates automation conditions with AND/OR logic
 */

import {
  AutomationCondition,
  ConditionGroup,
  ConditionOperator,
  LogicOperator,
  ConditionEvaluationResult,
} from './types';

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: AutomationCondition,
  context: Record<string, any>
): ConditionEvaluationResult {
  const actualValue = getNestedValue(context, condition.field);
  const expectedValue = condition.value;

  let met = false;
  let explanation = '';

  switch (condition.operator) {
    case ConditionOperator.EQUALS:
      met = actualValue === expectedValue;
      explanation = `${condition.field} (${actualValue}) ${met ? '==' : '!='} ${expectedValue}`;
      break;

    case ConditionOperator.NOT_EQUALS:
      met = actualValue !== expectedValue;
      explanation = `${condition.field} (${actualValue}) ${met ? '!=' : '=='} ${expectedValue}`;
      break;

    case ConditionOperator.GREATER_THAN:
      met = Number(actualValue) > Number(expectedValue);
      explanation = `${condition.field} (${actualValue}) ${met ? '>' : '<='} ${expectedValue}`;
      break;

    case ConditionOperator.LESS_THAN:
      met = Number(actualValue) < Number(expectedValue);
      explanation = `${condition.field} (${actualValue}) ${met ? '<' : '>='} ${expectedValue}`;
      break;

    case ConditionOperator.GREATER_THAN_OR_EQUAL:
      met = Number(actualValue) >= Number(expectedValue);
      explanation = `${condition.field} (${actualValue}) ${met ? '>=' : '<'} ${expectedValue}`;
      break;

    case ConditionOperator.LESS_THAN_OR_EQUAL:
      met = Number(actualValue) <= Number(expectedValue);
      explanation = `${condition.field} (${actualValue}) ${met ? '<=' : '>'} ${expectedValue}`;
      break;

    case ConditionOperator.CONTAINS:
      met = String(actualValue).includes(String(expectedValue));
      explanation = `${condition.field} (${actualValue}) ${met ? 'contains' : 'does not contain'} "${expectedValue}"`;
      break;

    case ConditionOperator.NOT_CONTAINS:
      met = !String(actualValue).includes(String(expectedValue));
      explanation = `${condition.field} (${actualValue}) ${met ? 'does not contain' : 'contains'} "${expectedValue}"`;
      break;

    case ConditionOperator.IN:
      met = Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      explanation = `${condition.field} (${actualValue}) ${met ? 'is in' : 'is not in'} [${expectedValue}]`;
      break;

    case ConditionOperator.NOT_IN:
      met = Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
      explanation = `${condition.field} (${actualValue}) ${met ? 'is not in' : 'is in'} [${expectedValue}]`;
      break;

    case ConditionOperator.BETWEEN:
      if (Array.isArray(expectedValue) && expectedValue.length === 2) {
        const [min, max] = expectedValue;
        met = Number(actualValue) >= Number(min) && Number(actualValue) <= Number(max);
        explanation = `${condition.field} (${actualValue}) ${met ? 'is between' : 'is not between'} ${min} and ${max}`;
      } else {
        met = false;
        explanation = `Invalid BETWEEN values: expected [min, max]`;
      }
      break;

    case ConditionOperator.IS_NULL:
      met = actualValue === null || actualValue === undefined;
      explanation = `${condition.field} ${met ? 'is' : 'is not'} null`;
      break;

    case ConditionOperator.IS_NOT_NULL:
      met = actualValue !== null && actualValue !== undefined;
      explanation = `${condition.field} ${met ? 'is not' : 'is'} null`;
      break;

    default:
      met = false;
      explanation = `Unknown operator: ${condition.operator}`;
  }

  return {
    condition,
    met,
    actualValue,
    expectedValue,
    explanation,
  };
}

/**
 * Evaluate multiple conditions with AND/OR logic
 */
export function evaluateConditions(
  conditions: AutomationCondition[],
  context: Record<string, any>
): { met: boolean; results: ConditionEvaluationResult[] } {
  if (conditions.length === 0) {
    return { met: true, results: [] };
  }

  const results: ConditionEvaluationResult[] = [];
  let currentResult = true;
  let currentOperator: LogicOperator = LogicOperator.AND;

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const result = evaluateCondition(condition, context);
    results.push(result);

    // Apply logic operator
    if (i === 0) {
      currentResult = result.met;
    } else {
      if (currentOperator === LogicOperator.AND) {
        currentResult = currentResult && result.met;
      } else {
        currentResult = currentResult || result.met;
      }
    }

    // Get next operator (if exists)
    if (condition.logicOperator) {
      currentOperator = condition.logicOperator;
    }
  }

  return { met: currentResult, results };
}

/**
 * Evaluate condition groups (nested AND/OR logic)
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  context: Record<string, any>
): { met: boolean; results: ConditionEvaluationResult[] } {
  const allResults: ConditionEvaluationResult[] = [];

  // Evaluate direct conditions
  const { met: conditionsMet, results: conditionResults } = evaluateConditions(
    group.conditions,
    context
  );
  allResults.push(...conditionResults);

  // Evaluate nested groups
  const groupResults: boolean[] = [conditionsMet];

  if (group.groups && group.groups.length > 0) {
    for (const nestedGroup of group.groups) {
      const { met: groupMet, results: nestedResults } = evaluateConditionGroup(
        nestedGroup,
        context
      );
      groupResults.push(groupMet);
      allResults.push(...nestedResults);
    }
  }

  // Combine results based on logic operator
  let finalResult: boolean;
  if (group.logicOperator === LogicOperator.AND) {
    finalResult = groupResults.every((r) => r);
  } else {
    finalResult = groupResults.some((r) => r);
  }

  return { met: finalResult, results: allResults };
}

/**
 * Get nested value from object using dot notation
 * e.g., "invoice.amount" from { invoice: { amount: 100 } }
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let value: any = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }

  return value;
}

/**
 * Build human-readable explanation of condition evaluation
 */
export function buildConditionExplanation(
  results: ConditionEvaluationResult[]
): string {
  if (results.length === 0) {
    return 'No conditions to evaluate';
  }

  const explanations = results.map((r, i) => {
    const prefix = i === 0 ? '' : r.condition.logicOperator === LogicOperator.AND ? 'AND ' : 'OR ';
    const status = r.met ? '✓' : '✗';
    return `${prefix}${status} ${r.explanation}`;
  });

  return explanations.join('\n');
}
