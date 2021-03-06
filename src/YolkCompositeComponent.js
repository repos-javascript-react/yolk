const Rx = require(`rx`)
const create = require(`yolk-virtual-dom/create-element`)
const wrapObject = require(`./wrapObject`)
const YolkCompositeFunctionWrapper = require(`./YolkCompositeFunctionWrapper`)


function YolkCompositeComponent (fn, props, children) {
  const _props = {...props}
  const _children = children || []

  if (_props.key) {
    this.key = _props.key.toString()
    delete _props.key
  }

  this.name = `YolkCompositeComponent_${fn.name}`
  this.id = fn.name
  this._fn = fn
  this._props = _props
  this._children = _children
  this._component = null
}

YolkCompositeComponent.prototype = {
  type: `Widget`,

  init () {
    const keys = Object.keys(this._props)
    const length = keys.length
    const propsSubject = {}
    let i = -1

    this._propSubject = {}

    while (++i < length) {
      const key = keys[i]
      const value = this._props[key]
      this._propSubject[key] = new Rx.BehaviorSubject(value)
      propsSubject[key] = this._propSubject[key].flatMapLatest(wrapObject)
    }

    this._childSubject = new Rx.BehaviorSubject(this._children)

    const propObservable = propsSubject
    const childObservable = this._childSubject.asObservable()

    const fn = this._fn
    this._component = YolkCompositeFunctionWrapper.create(fn, propObservable, childObservable)

    const node = create(this._component._result)
    return node
  },

  update (previous) {
    this._propSubject = previous._propSubject
    this._childSubject = previous._childSubject
    this._component = previous._component
    this._childSubject.onNext(this._children)

    const keys = Object.keys(this._props)
    const length = keys.length
    let i = -1

    while (++i < length) {
      const key = keys[i]
      const value = this._props[key]
      this._propSubject[key].onNext(value || null)
    }
  },

  destroy () {
    this._component.destroy()

    const children = this._children
    const length = children.length
    let i = -1

    while (++i < length) {
      const child = children[i]
      isFunction(child.destroy) && child.destroy()
    }
  },
}

module.exports = YolkCompositeComponent
