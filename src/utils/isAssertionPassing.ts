import { isPassing } from "./isPassing";

export function isAssertionPassing(
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
