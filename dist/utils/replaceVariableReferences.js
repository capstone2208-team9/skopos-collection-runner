function replaceVariableReferences(interpolatedString, result) {
    const replaced = interpolatedString.replace(/@{{(.*)}}/gi, (match, p1) => {
        const paths = p1.split(/\.|\[|\]/).filter((path) => path !== "");
        const rootItem = result[paths.shift()];
        let targetItem = rootItem;
        while (paths.length !== 0) {
            targetItem = targetItem[paths.shift()];
            if (targetItem === undefined)
                throw "the path does not exist";
        }
        return targetItem;
    });
    console.log(replaced);
    return replaced;
}
const result = {
    "1": {
        msg: ["hello", "good morning"],
    },
};
replaceVariableReferences("asdgfhl@{{1.msg[1]}}dsadsa", result);
replaceVariableReferences("nothing to change", result);
export default replaceVariableReferences;
//# sourceMappingURL=replaceVariableReferences.js.map