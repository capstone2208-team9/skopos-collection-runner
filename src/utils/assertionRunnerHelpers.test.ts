import {
  isAssertionPassing,
  interpolateReferences,
  Response,
  Assertion,
  AssertionResult,
  invokeCheckAssertions,
} from "./assertionRunnerHelpers";

function mockValues() {
  const assertions: Assertion[] = [
    {
      property: "body.country[1].name",
      comparison: "is equal to",
      expected: "United States of America",
      id: 4,
    },
    {
      property: "body.country[1].name",
      comparison: "is equal to",
      expected: "Australia",
      id: 4,
    },
    {
      property: "headers.Content-Type",
      comparison: "is equal to",
      expected: "application/json",
      id: 4,
    },
    {
      property: "latency",
      comparison: "is less than",
      expected: 458,
      id: 4,
    },
  ];

  const response: Response = {
    id: 1,
    status: 200,
    body: {
      country: [
        { country_id: "AU", name: "Australia" },
        { country_id: "US", name: "United States of America" },
      ],
    },
    headers: {
      "Content-Type": "application/json",
    },
    latency: 352,
    request: {
      assertions,
    },
  };

  const interpolatedAssertions: Assertion[] = [
    {
      property: "United States of America",
      comparison: "is equal to",
      expected: "United States of America",
      id: 4,
    },
    {
      property: "United States of America",
      comparison: "is equal to",
      expected: "Australia",
      id: 4,
    },
    {
      property: "application/json",
      comparison: "is equal to",
      expected: "application/json",
      id: 4,
    },
    {
      property: 352,
      comparison: "is less than",
      expected: 458,
      id: 4,
    },
  ];

  const assertionResults = [
    {
      responseId: 1,
      pass: true,
      actual: "United States of America",
      assertionId: 4,
    },
    {
      responseId: 1,
      pass: false,
      actual: "United States of America",
      assertionId: 4,
    },
    {
      responseId: 1,
      pass: true,
      actual: "application/json",
      assertionId: 4,
    },
    {
      responseId: 1,
      pass: true,
      actual: 352,
      assertionId: 4,
    },
  ];

  return { assertions, response, interpolatedAssertions, assertionResults };
}

describe("isAssertionPassing function returns correct boolean", () => {
  it("should pass smoke test", function () {
    expect(true).toBe(true);
  });

  it("should return true for 200 is equal to 200", function () {
    const expected = "200";
    const actual = expected;
    const operator = "is equal to";
    expect(isAssertionPassing(actual, operator, expected)).toBe(true);
  });

  it("should return false for 200 is equal to 202", function () {
    const expected = "200";
    const actual = 202;
    const operator = "is equal to";
    expect(isAssertionPassing(actual, operator, expected)).toBe(false);
  });

  it("should return true for 300 is less than 400", function () {
    const expected = "400";
    const actual = 300;
    const operator = "is less than";
    expect(isAssertionPassing(actual, operator, expected)).toBe(true);
  });

  it("should return false for 600 is less than 400", function () {
    const expected = "400";
    const actual = 600;
    const operator = "is less than";
    expect(isAssertionPassing(actual, operator, expected)).toBe(false);
  });

  it("should return false for 600 is greater than 400", function () {
    const expected = "400";
    const actual = 600;
    const operator = "is greater than";
    expect(isAssertionPassing(actual, operator, expected)).toBe(true);
  });

  it("should return true for undefined is equal to undefined", function () {
    const expected = "undefined";
    const actual = undefined;
    const operator = "is equal to";
    expect(isAssertionPassing(actual, operator, expected)).toBe(true);
  });
});

describe("interpolate values from responses", () => {
  const { assertions, response, interpolatedAssertions } = mockValues();
  it("should interpolate response", function () {
    expect(interpolateReferences(assertions, response)).toEqual(
      interpolatedAssertions
    );
  });
});

describe("assertion results are correct for a response", () => {
  const { response, assertionResults } = mockValues();
  it("should interpolate response", function () {
    expect(invokeCheckAssertions(response)).toEqual(assertionResults);
  });
});
