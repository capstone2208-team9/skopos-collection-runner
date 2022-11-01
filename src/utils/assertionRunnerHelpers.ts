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

/*
console.log(isAssertionPassing(5, "is null", undefined) === false);
console.log(isAssertionPassing(null, "is null", undefined) === true);
console.log(isAssertionPassing(5, "is equal to", 5) === true);
console.log(isAssertionPassing(5, "is not less than", 5) === true);
console.log(isAssertionPassing(6, "is greater than", 5) === true);
console.log(isAssertionPassing([1, 2, 3], "includes", 5) === false);
console.log(isAssertionPassing([1, 2, 3], "includes", 2) === true);
*/

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
  listOfResponses
): Promise<any[]> => {
  let assertionResults = [];

  const assertionVerdict = (response) => {
    const listOfAssertions = response.Request.assertions;
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

  listOfResponses.forEach(assertionVerdict);
  console.log(assertionResults, "assertionResults")
  return assertionResults;
};

//this function is for processing the data received from query
export const organizeResponseAssertions = (listOfResponses: any[]) => {
  // [ {response: {}}, {}]; take out assertions from each: { response: {}, assertions: []}

  return listOfResponses.map(res => {
    return {
      response: { ...res },
      assertions: res.request.assertions
    }

    let assertions = res.request.assertions

    assertions = assertions.map((assertion: any) => ({ ...assertion, responseId: res.id }))

    return {
      data: {
        responses: [{
          ...res
        }],
        assertions
      }
    }
  })
}