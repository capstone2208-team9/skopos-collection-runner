import {isPassing} from './assertionRunnerHelpers'

describe('parseBody', () => {
  it('should pass smoke test', function () {
    expect(true).toBe(true)
  })
})

describe('isAssertionPassing', () => {
  it('should return true for 200 is equal to 200', function () {
    const expected = '200'
    const actual = expected
    const operator = 'is equal to'
    expect(isPassing(actual, operator, expected)).toBe(true)
  })
})

describe('assertionFailed', () => {
  
})