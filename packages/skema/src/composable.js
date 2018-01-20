import {simpleClone} from './util'
import {Processor} from './processor'

export const SHAPE = 'SHAPE'
export const TYPE_OBJECT = 'TYPE_OBJECT'
export const TYPE_ARRAY = 'TYPE_ARRAY'

class Composable {
  constructor (rule) {
    this._rule = rule
  }

  from (context: Context, options: Options, args) {
    const values = this._create(context, options)
    const tasks = this._tasks(context).map(([context, skema]) =>
      new Processor({
        options,
        skema,
        args,
        context,
        values
      })
      .process()
    )

    return options.promise.all(tasks)
    .then(() => values)
  }
}

export class ShapeComposable extends Composable {
  _create (context, options) {
    return options.clean
      ? Object.create(null)
      : simpleClone(context.value)
  }

  _tasks (context) {
    const shape = this._rule
    return Object.keys(shape)
    .map(key => [context.descend(key), shape[key]])
  }
}

export class TypeObjectComposable extends Composable {
  _create () {
    return Object.create(null)
  }

  _tasks (context) {
    return Object.keys(context.value)
    .map(key => [context.descend(key), this._rule])
  }
}

export class TypeArrayComposable extends Composable {
  _create () {
    return []
  }

  _tasks (context) {
    const tasks = []
    const {value} = context
    const {length} = value
    let i = 0

    // Iterate every array item
    for (; i < length; i ++) {
      tasks.push([context.descend(i), this._rule])
    }

    return tasks
  }
}