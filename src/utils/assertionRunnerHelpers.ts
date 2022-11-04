import { gqlMutateCreateAssertionResults } from '../services/queries.js'

function isPassing(
  actual: any,
  operator: string,
  expected: any
): boolean {
  if (typeof actual === 'number') {
    expected = Number(expected)
  }

  switch (operator) {
    case "is equal to":
      return actual === expected;
    case "is greater than":
      return actual > expected;
    case "is less than":
      return actual < expected;
    case "includes":
      return actual.includes(expected);
  }
}

function isAssertionPassing(
  leftOperand: any,
  operator: string,
  rightoperand: any
): boolean {
  if (operator.match(/null/)) {
    rightoperand = null;
    operator.replace("null", "equal to");
  }

  if (operator.match(/not/)) {
    operator = operator.replace("not", "");
    operator = operator.replace(/\s{1,}/, " ");
    return !isPassing(leftOperand, operator, rightoperand);
  }

  return isPassing(leftOperand, operator, rightoperand);
}

const parseBody = (identifier: string, response: any): any => {
  let path = identifier.split(/\.|\[|\]/).filter((item) => item !== "");
  let currentElement = response;

  for (let step of path) {
    if (!currentElement[step]) {
      return undefined
    }
    currentElement = currentElement[step];
  }

  return currentElement;
};


export const interpolateReferences = (listOfAssertions: any[], response): any[] => {
  const interpolateBodyReference = (assertion) => {
    let property = assertion.property

    if (property.includes('body')) {
      property = parseBody(property, response)
    }

    return {
      ...assertion,
      property
    }
  }

  return listOfAssertions.map(interpolateBodyReference)
}

export const invokeCheckAssertions = async (
  response
): Promise<any[]> => {
  let assertionResults = [];

  const assertionVerdict = (response) => {
    const listOfAssertions = response.request.assertions;
    listOfAssertions.forEach((assertion) => {
      const {
        property,
        comparison,
        expected,
        id,
      } = assertion;
      let actual = parseBody(property, response);
      let pass = isAssertionPassing(actual, comparison, expected);
      assertionResults.push({
        responseId: response.id,
        pass,
        actual,
        assertionId: id
      });
    });
  };

  assertionVerdict(response)
  return assertionResults;
};

export const invokeSaveAssertionResults = async (listOfAssertionResults) => {
  return await gqlMutateCreateAssertionResults(listOfAssertionResults)
}

export const assertionFailed = (context, event) => {
  for (let i = 0, len = context.assertionResults.length; i < len; i += 1) {
    if (context.assertionResults[i]['pass'] === false) return true;
  }
  return false;
}