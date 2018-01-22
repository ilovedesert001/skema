import {error} from './error'

// data = {a: {b: 1}}
// 1. value: data, key: null, parent: null, path: []
// 2. descend 'a': value: {b: 1}, key: 'a', parent: data, path: ['a']
// 3. descend 'b': value: 1, key: 'b', parent: {b: 1}, path: ['a', 'b']
export class Context {
  constructor (
    value,
    key = null,
    parent = null,
    path = []
  ) {
    this.value = value
    this.context = {
      parent,
      key,
      path
    }
  }

  descend (key): Context {
    const path = this.context.path.concat(key)
    const parent = this.value
    const value = this.value[key]

    return new Context(value, key, parent, path)
  }

  error (code, ...args): Error {
    const err = code instanceof Error
      ? code
      : error(code, ...args)

    Object.assign(err, this.context)
    err.args = args
    err.value = value
    return err
  }
}
