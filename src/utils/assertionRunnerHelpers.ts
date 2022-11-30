import { gqlMutateCreateAssertionResults } from "../services/queries";

export type BasicValue = string | number | undefined;
export type Assertion = {
  property: BasicValue;
  comparison: string;
  expected: BasicValue;
  id: number;
};

export type Response = {
  request: {
    assertions: Assertion[];
  };
  status: number;
  latency: number;
  body: any;
  headers: Record<string, any>;
  id: number;
};

export type AssertionResult = {
  responseId: number;
  pass: boolean;
  actual: BasicValue;
  assertionId: number;
};

// type guard
function isString(value: BasicValue): value is string {
  return typeof value === 'string'
}

function isNumber(value: BasicValue): value is number {
  return typeof value === 'number'
}

export function isPassing(
  actual: BasicValue,
  operator: string,
  expected: BasicValue
): boolean {
  if (isNumber(actual)) {
    expected = Number(expected);
  } else {
    //if not number, the undefined value should be converted to string for comparison
    actual = String(actual);
  }

  switch (operator) {
    case "is equal to":
      return actual === expected;
    case "is greater than":
      return actual > expected;
    case "is less than":
      return actual < expected;
    case "includes":
      if (typeof actual === 'string' && typeof expected === 'string')
          return actual.includes(expected);

      return false
    case "does not include":
      if (isString(actual) && isString(expected))
        return !actual.includes(expected);

      return false
    default:
      return false;
  }
}

export function isAssertionPassing(
  leftOperand: BasicValue,
  operator: string,
  rightoperand: BasicValue
): boolean {
  if (operator.match(/null/)) {
    //bc for something to be null means that the key is not present in the object
    //hence, getting the value for that key returns undefined
    rightoperand = undefined;
    operator.replace("null", "equal to");
  }

  if (operator.match(/not/)) {
    operator = operator.replace("not", "");
    operator = operator.replace(/\s{1,}/, " ");
    return !isPassing(leftOperand, operator, rightoperand);
  }

  return isPassing(leftOperand, operator, rightoperand);
}

const parseResponse = (identifier: string, response: Response): BasicValue => {
  let path = identifier.split(/\.|\[|\]/).filter((item) => item !== "");
  let currentElement: any = response;

  const [el] = path
  for (let step of path) {
    if (currentElement === undefined) return undefined
    // headers are coming back lowercase in responses so allow case-insensitive comparison
    if (el === 'headers' && currentElement[step.toLowerCase()]) {
      currentElement = currentElement[step.toLowerCase()]
    } else {
      currentElement = currentElement[step]
    }
  }
  return currentElement;
};

export const interpolateReferences = (
  listOfAssertions: Assertion[],
  response: Response
): Assertion[] => {
  const interpolateResponseReference = (assertion: Assertion) => {
    let property = assertion.property;
    let identifier: string = String(property);
    // TODO: this variable is not used?
    let optionToParse: BasicValue[] = ["body", "headers"];

    if (['body', 'headers'].includes(identifier)) {
      property = parseResponse(identifier, response);
    } else {
      property = response[property];
    }

    return {
      ...assertion,
      property,
    };
  };

  return listOfAssertions.map(interpolateResponseReference);
};

export const invokeCheckAssertions = async (response: Response): Promise<any[]> => {
  const listOfAssertions = interpolateReferences(
    response.request.assertions,
    response
  );

  const assertionToAssertionResult = (assertion: Assertion) => {
    const { property, comparison, expected, id } = assertion;
    let actual = property;
    let pass = isAssertionPassing(actual, comparison, expected);

    return {
      responseId: response.id,
      pass,
      actual,
      assertionId: id,
    };
  };

  return listOfAssertions.map(assertionToAssertionResult);
};

export const invokeSaveAssertionResults = async (
  listOfAssertionResults: AssertionResult[]
) => {
  return await gqlMutateCreateAssertionResults(listOfAssertionResults);
};

export const assertionFailed = (context) => {
  // if one of the assertions failed return true
  return context.assertionResults.some(result => !result.pass)
};
