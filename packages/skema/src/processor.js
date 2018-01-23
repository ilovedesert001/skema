// Processor to run the flow async or sync
///////////////////////////////////////////////////////////
import {Options} from './options'
import {UNDEFINED, defineProperty, getKey} from './util'

export class Processor {
  constructor (options) {
    Object.assign(this, options)

    const {
      key,
      parent
    } = this.context.context
    this._isDefault = !(key in parent)
  }

  process () {
    return this.options.promise.resolve()
    .then(() => this.shouldSkip())
    .then(skip => {
      if (skip) {
        return
      }

      const {value} = this.context
      return this.skema.from(value, this.args, this.context, this.options)
      .then(value => {
        this.context.value = value
      })
      .then(() => this.processDone())
    })
  }

  // Returns whether we should skip checking
  shouldSkip () {
    const {skema} = this

    if (!skema.hasWhen()) {
      return this._shouldSkip()
    }

    return skema.when(
      this.args, this.context, this.options)
    .then(hit => {
      if (!hit) {
        // Skip
        return true
      }

      return this._shouldSkip()
    })
  }

  _shouldSkip () {
    const {skema} = this

    // has the key
    if (!this._isDefault) {
      // not skip
      return false
    }

    // If the key is required,
    // optional and default are mutual exclusive,
    // so we simply check optional first.
    if (!skema.isOptional()) {
      throw this.context.errorByCode(
        'NOT_OPTIONAL', this.context.context.key)
    }

    if (!skema.hasDefault()) {
      // skip
      return true
    }

    return skema.default(
      this.args, this.context, this.options)
    .then(value => {
      this.context.value = value
      return false
    })
  }

  processDone () {
    const {
      values,
      skema
    } = this

    const {value} = this.context
    const {key} = this.context.context

    const config = Object.create(null)
    configure(config, 'configurable', skema)
    configure(config, 'enumerable', skema)
    configure(config, 'writable', skema)

    defineProperty(this.values, key, value, config)
  }
}

function configure (config, name, skema) {
  const value = skema[getKey(name, 'is')]()
  if (value !== UNDEFINED) {
    config[name] = value
    return
  }

  // default to true
  config[name] = true
}
