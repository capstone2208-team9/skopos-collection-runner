export function isPassing(leftOperand, operator, rightoperand) {
    switch (operator) {
        case "is equal to":
            return leftOperand === rightoperand;
        case "is greater than":
            return leftOperand > rightoperand;
        case "is less than":
            return leftOperand < rightoperand;
        case "includes":
            return leftOperand.includes(rightoperand);
    }
}
console.log(isPassing(5, "is equal", 5) === true);
//# sourceMappingURL=testAssertions.js.map