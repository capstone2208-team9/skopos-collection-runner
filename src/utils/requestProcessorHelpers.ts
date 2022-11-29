export async function invokeParseRequest(request) {
  try {
    let { url, headers, body } = request
    headers = headers ? headers : ''
    body = body ? body : ''
    let variables = []
  
    const regexp = /(@{{[^}]*}})/g
    const regexpHeaders = /(@{{[^}]*}})/gi
    let urlMatches = [...url.matchAll(regexp)].map(subarr => subarr[1])
    let bodyMatches = [...body.matchAll(regexp)].map(subarr => subarr[1])
    let headerMatches = [...JSON.stringify(headers).matchAll(regexpHeaders)].map(subarr => subarr[1])

    variables = [...urlMatches, ...bodyMatches, ...headerMatches]
  
    const variablesPathsArray = variables.map(item => [item, undefined])
  
    for (let variableSubArr of variablesPathsArray) {
      let pathVariables = variableSubArr[0]
        .match(/@\{\{([^}]*)\}\}/)[1]
        .split(/\.|\[|\]/).filter((path) => path !== "")
      pathVariables[0] = Number(pathVariables[0].match(/\d+/)[0]) - 1
  
      variableSubArr[1] = pathVariables
    }

    return variablesPathsArray
  } catch(err) {
    console.log(err)
  }

}

export async function invokeSearchReferencedValues(responses, variablesPathsArray) {
  for (let subarr of variablesPathsArray) {
    let path = subarr[1]
    const isHeaders = path[1] === 'headers'
    let targetItem = responses[path.shift()];

    while (path.length !== 0) {
      let value = path.shift()
      if (isHeaders) value = value.toLowerCase()
      targetItem = targetItem[value];

      if (targetItem === undefined) throw "the path does not exist";
    }

    subarr[1] = targetItem
  }
  return variablesPathsArray
}

export async function invokeInterpolateVariables(request, variablesPathsArray) {
  let jsonRequest = JSON.stringify(request)
  for (let [variable, value] of variablesPathsArray) {
    jsonRequest = jsonRequest.replace(variable, value)
  }

  return JSON.parse(jsonRequest)
}