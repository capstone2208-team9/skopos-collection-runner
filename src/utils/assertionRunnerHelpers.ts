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

export function isPassing(
  actual: BasicValue,
  operator: string,
  expected: BasicValue
): boolean {
  if (typeof actual === "number") {
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

  console.log("path", path);
  for (let step of path) {
    if (!currentElement[step]) {
      return undefined;
    }
    console.log("current element", currentElement);
    currentElement = currentElement[step];
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
    let optionToParse: BasicValue[] = ["body", "headers"];

    if (identifier.includes("body") || identifier.includes("headers")) {
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

export const invokeCheckAssertions = async (
  response: Response
): Promise<any[]> => {
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

export const assertionFailed = (context, event) => {
  for (let i = 0, len = context.assertionResults.length; i < len; i += 1) {
    if (context.assertionResults[i]["pass"] === false) return true;
  }
  return false;
};
