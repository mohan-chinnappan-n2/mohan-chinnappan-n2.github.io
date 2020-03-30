/* proxy-compat-disable */
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function detect() {
  // Don't apply polyfill when ProxyCompat is enabled.
  if ('getKey' in Proxy) {
    return false;
  }

  const proxy = new Proxy([3, 4], {});
  const res = [1, 2].concat(proxy);
  return res.length !== 4;
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const {
  isConcatSpreadable
} = Symbol;
const {
  isArray
} = Array;
const {
  slice: ArraySlice,
  unshift: ArrayUnshift,
  shift: ArrayShift
} = Array.prototype;

function isObject(O) {
  return typeof O === 'object' ? O !== null : typeof O === 'function';
} // https://www.ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable


function isSpreadable(O) {
  if (!isObject(O)) {
    return false;
  }

  const spreadable = O[isConcatSpreadable];
  return spreadable !== undefined ? Boolean(spreadable) : isArray(O);
} // https://www.ecma-international.org/ecma-262/6.0/#sec-array.prototype.concat


function ArrayConcatPolyfill(..._args) {
  const O = Object(this);
  const A = [];
  let N = 0;
  const items = ArraySlice.call(arguments);
  ArrayUnshift.call(items, O);

  while (items.length) {
    const E = ArrayShift.call(items);

    if (isSpreadable(E)) {
      let k = 0;
      const length = E.length;

      for (k; k < length; k += 1, N += 1) {
        if (k in E) {
          const subElement = E[k];
          A[N] = subElement;
        }
      }
    } else {
      A[N] = E;
      N += 1;
    }
  }

  return A;
}

function apply() {
  Array.prototype.concat = ArrayConcatPolyfill;
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

if (detect()) {
  apply();
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function detect$1(propName) {
  return Object.getOwnPropertyDescriptor(Element.prototype, propName) === undefined;
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const {
  hasAttribute,
  getAttribute,
  setAttribute,
  setAttributeNS,
  removeAttribute,
  removeAttributeNS
} = Element.prototype;

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// that doesn't follow the regular transformation process. e.g.: `aria-labeledby` <=> `ariaLabelBy`

const ARIA_REGEX = /^aria/;
const nodeToAriaPropertyValuesMap = new WeakMap();
const {
  hasOwnProperty
} = Object.prototype;
const {
  replace: StringReplace,
  toLowerCase: StringToLowerCase
} = String.prototype;

function getAriaPropertyMap(elm) {
  let map = nodeToAriaPropertyValuesMap.get(elm);

  if (map === undefined) {
    map = {};
    nodeToAriaPropertyValuesMap.set(elm, map);
  }

  return map;
}

function getNormalizedAriaPropertyValue(value) {
  return value == null ? null : value + '';
}

function createAriaPropertyPropertyDescriptor(propName, attrName) {
  return {
    get() {
      const map = getAriaPropertyMap(this);

      if (hasOwnProperty.call(map, propName)) {
        return map[propName];
      } // otherwise just reflect what's in the attribute


      return hasAttribute.call(this, attrName) ? getAttribute.call(this, attrName) : null;
    },

    set(newValue) {
      const normalizedValue = getNormalizedAriaPropertyValue(newValue);
      const map = getAriaPropertyMap(this);
      map[propName] = normalizedValue; // reflect into the corresponding attribute

      if (newValue === null) {
        removeAttribute.call(this, attrName);
      } else {
        setAttribute.call(this, attrName, newValue);
      }
    },

    configurable: true,
    enumerable: true
  };
}

function patch(propName) {
  // Typescript is inferring the wrong function type for this particular
  // overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
  // @ts-ignore type-mismatch
  const replaced = StringReplace.call(propName, ARIA_REGEX, 'aria-');
  const attrName = StringToLowerCase.call(replaced);
  const descriptor = createAriaPropertyPropertyDescriptor(propName, attrName);
  Object.defineProperty(Element.prototype, propName, descriptor);
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// https://wicg.github.io/aom/spec/aria-reflection.html

const ElementPrototypeAriaPropertyNames = ['ariaAutoComplete', 'ariaChecked', 'ariaCurrent', 'ariaDisabled', 'ariaExpanded', 'ariaHasPopup', 'ariaHidden', 'ariaInvalid', 'ariaLabel', 'ariaLevel', 'ariaMultiLine', 'ariaMultiSelectable', 'ariaOrientation', 'ariaPressed', 'ariaReadOnly', 'ariaRequired', 'ariaSelected', 'ariaSort', 'ariaValueMax', 'ariaValueMin', 'ariaValueNow', 'ariaValueText', 'ariaLive', 'ariaRelevant', 'ariaAtomic', 'ariaBusy', 'ariaActiveDescendant', 'ariaControls', 'ariaDescribedBy', 'ariaFlowTo', 'ariaLabelledBy', 'ariaOwns', 'ariaPosInSet', 'ariaSetSize', 'ariaColCount', 'ariaColIndex', 'ariaDetails', 'ariaErrorMessage', 'ariaKeyShortcuts', 'ariaModal', 'ariaPlaceholder', 'ariaRoleDescription', 'ariaRowCount', 'ariaRowIndex', 'ariaRowSpan', 'ariaColSpan', 'role'];
/**
 * Note: Attributes aria-dropeffect and aria-grabbed were deprecated in
 * ARIA 1.1 and do not have corresponding IDL attributes.
 */

for (let i = 0, len = ElementPrototypeAriaPropertyNames.length; i < len; i += 1) {
  const propName = ElementPrototypeAriaPropertyNames[i];

  if (detect$1(propName)) {
    patch(propName);
  }
}

/**
 * Copyright (C) 2018 salesforce.com, inc.
 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function invariant(value, msg) {
  if (!value) {
    throw new Error(`Invariant Violation: ${msg}`);
  }
}

function isTrue(value, msg) {
  if (!value) {
    throw new Error(`Assert Violation: ${msg}`);
  }
}

function isFalse(value, msg) {
  if (value) {
    throw new Error(`Assert Violation: ${msg}`);
  }
}

function fail(msg) {
  throw new Error(msg);
}

var assert =
/*#__PURE__*/
Object.freeze({
  __proto__: null,
  invariant: invariant,
  isTrue: isTrue,
  isFalse: isFalse,
  fail: fail
});
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const {
  assign,
  create,
  defineProperties,
  defineProperty,
  freeze,
  getOwnPropertyDescriptor,
  getOwnPropertyNames,
  getPrototypeOf,
  hasOwnProperty: hasOwnProperty$1,
  keys,
  seal,
  setPrototypeOf
} = Object;
const {
  isArray: isArray$1
} = Array;
const {
  filter: ArrayFilter,
  find: ArrayFind,
  forEach,
  indexOf: ArrayIndexOf,
  join: ArrayJoin,
  map: ArrayMap,
  push: ArrayPush,
  reduce: ArrayReduce,
  reverse: ArrayReverse,
  slice: ArraySlice$1,
  splice: ArraySplice,
  unshift: ArrayUnshift$1
} = Array.prototype;
const {
  charCodeAt: StringCharCodeAt,
  replace: StringReplace$1,
  slice: StringSlice,
  toLowerCase: StringToLowerCase$1
} = String.prototype;

function isUndefined(obj) {
  return obj === undefined;
}

function isNull(obj) {
  return obj === null;
}

function isTrue$1(obj) {
  return obj === true;
}

function isFalse$1(obj) {
  return obj === false;
}

function isFunction(obj) {
  return typeof obj === 'function';
}

function isObject$1(obj) {
  return typeof obj === 'object';
}

function isString(obj) {
  return typeof obj === 'string';
}

function isNumber(obj) {
  return typeof obj === 'number';
}

const OtS = {}.toString;

function toString(obj) {
  if (obj && obj.toString) {
    // Arrays might hold objects with "null" prototype So using
    // Array.prototype.toString directly will cause an error Iterate through
    // all the items and handle individually.
    if (isArray$1(obj)) {
      return ArrayJoin.call(ArrayMap.call(obj, toString), ',');
    }

    return obj.toString();
  } else if (typeof obj === 'object') {
    return OtS.call(obj);
  } else {
    return obj + emptyString;
  }
}

function getPropertyDescriptor(o, p) {
  do {
    const d = getOwnPropertyDescriptor(o, p);

    if (!isUndefined(d)) {
      return d;
    }

    o = getPrototypeOf(o);
  } while (o !== null);
}

const emptyString = '';
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/*
 * In IE11, symbols are expensive.
 * Due to the nature of the symbol polyfill. This method abstract the
 * creation of symbols, so we can fallback to string when native symbols
 * are not supported. Note that we can't use typeof since it will fail when transpiling.
 */

const hasNativeSymbolsSupport = Symbol('x').toString() === 'Symbol(x)';

function createHiddenField(key, namespace) {
  return hasNativeSymbolsSupport ? Symbol(key) : `$$lwc-${namespace}-${key}$$`;
}

const hiddenFieldsMap = new WeakMap();

function setHiddenField(o, field, value) {
  let valuesByField = hiddenFieldsMap.get(o);

  if (isUndefined(valuesByField)) {
    valuesByField = create(null);
    hiddenFieldsMap.set(o, valuesByField);
  }

  valuesByField[field] = value;
}

function getHiddenField(o, field) {
  const valuesByField = hiddenFieldsMap.get(o);

  if (!isUndefined(valuesByField)) {
    return valuesByField[field];
  }
}
/** version: 1.3.2 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const defaultDefHTMLPropertyNames = ['accessKey', 'dir', 'draggable', 'hidden', 'id', 'lang', 'tabIndex', 'title']; // Few more exceptions that are using the attribute name to match the property in lowercase.
// this list was compiled from https://msdn.microsoft.com/en-us/library/ms533062(v=vs.85).aspx
// and https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
// Note: this list most be in sync with the compiler as well.

const HTMLPropertyNamesWithLowercasedReflectiveAttributes = ['accessKey', 'readOnly', 'tabIndex', 'bgColor', 'colSpan', 'rowSpan', 'contentEditable', 'dateTime', 'formAction', 'isMap', 'maxLength', 'useMap'];

function offsetPropertyErrorMessage(name) {
  return `Using the \`${name}\` property is an anti-pattern because it rounds the value to an integer. Instead, use the \`getBoundingClientRect\` method to obtain fractional values for the size of an element and its position relative to the viewport.`;
} // Global HTML Attributes & Properties
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement


const globalHTMLProperties = assign(create(null), {
  accessKey: {
    attribute: 'accesskey'
  },
  accessKeyLabel: {
    readOnly: true
  },
  className: {
    attribute: 'class',
    error: 'Using the `className` property is an anti-pattern because of slow runtime behavior and potential conflicts with classes provided by the owner element. Use the `classList` API instead.'
  },
  contentEditable: {
    attribute: 'contenteditable'
  },
  dataset: {
    readOnly: true,
    error: "Using the `dataset` property is an anti-pattern because it can't be statically analyzed. Expose each property individually using the `@api` decorator instead."
  },
  dir: {
    attribute: 'dir'
  },
  draggable: {
    attribute: 'draggable'
  },
  dropzone: {
    attribute: 'dropzone',
    readOnly: true
  },
  hidden: {
    attribute: 'hidden'
  },
  id: {
    attribute: 'id'
  },
  inputMode: {
    attribute: 'inputmode'
  },
  lang: {
    attribute: 'lang'
  },
  slot: {
    attribute: 'slot',
    error: 'Using the `slot` property is an anti-pattern.'
  },
  spellcheck: {
    attribute: 'spellcheck'
  },
  style: {
    attribute: 'style'
  },
  tabIndex: {
    attribute: 'tabindex'
  },
  title: {
    attribute: 'title'
  },
  translate: {
    attribute: 'translate'
  },
  // additional "global attributes" that are not present in the link above.
  isContentEditable: {
    readOnly: true
  },
  offsetHeight: {
    readOnly: true,
    error: offsetPropertyErrorMessage('offsetHeight')
  },
  offsetLeft: {
    readOnly: true,
    error: offsetPropertyErrorMessage('offsetLeft')
  },
  offsetParent: {
    readOnly: true
  },
  offsetTop: {
    readOnly: true,
    error: offsetPropertyErrorMessage('offsetTop')
  },
  offsetWidth: {
    readOnly: true,
    error: offsetPropertyErrorMessage('offsetWidth')
  },
  role: {
    attribute: 'role'
  }
});
const AttrNameToPropNameMap = create(null);
const PropNameToAttrNameMap = create(null); // Synthetic creation of all AOM property descriptors for Custom Elements

forEach.call(ElementPrototypeAriaPropertyNames, propName => {
  // Typescript is inferring the wrong function type for this particular
  // overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
  // @ts-ignore type-mismatch
  const attrName = StringToLowerCase$1.call(StringReplace$1.call(propName, /^aria/, 'aria-'));
  AttrNameToPropNameMap[attrName] = propName;
  PropNameToAttrNameMap[propName] = attrName;
});
forEach.call(defaultDefHTMLPropertyNames, propName => {
  const attrName = StringToLowerCase$1.call(propName);
  AttrNameToPropNameMap[attrName] = propName;
  PropNameToAttrNameMap[propName] = attrName;
});
forEach.call(HTMLPropertyNamesWithLowercasedReflectiveAttributes, propName => {
  const attrName = StringToLowerCase$1.call(propName);
  AttrNameToPropNameMap[attrName] = propName;
  PropNameToAttrNameMap[propName] = attrName;
});
const CAMEL_REGEX = /-([a-z])/g;
/**
 * This method maps between attribute names
 * and the corresponding property name.
 */

function getPropNameFromAttrName(attrName) {
  if (isUndefined(AttrNameToPropNameMap[attrName])) {
    AttrNameToPropNameMap[attrName] = StringReplace$1.call(attrName, CAMEL_REGEX, g => g[1].toUpperCase());
  }

  return AttrNameToPropNameMap[attrName];
}
const CAPS_REGEX = /[A-Z]/g;
/**
 * This method maps between property names
 * and the corresponding attribute name.
 */

function getAttrNameFromPropName(propName) {
  if (isUndefined(PropNameToAttrNameMap[propName])) {
    PropNameToAttrNameMap[propName] = StringReplace$1.call(propName, CAPS_REGEX, match => '-' + match.toLowerCase());
  }

  return PropNameToAttrNameMap[propName];
}
let controlledElement = null;
let controlledAttributeName;
function isAttributeLocked(elm, attrName) {
  return elm !== controlledElement || attrName !== controlledAttributeName;
}
function lockAttribute(_elm, _key) {
  controlledElement = null;
  controlledAttributeName = undefined;
}
function unlockAttribute(elm, key) {
  controlledElement = elm;
  controlledAttributeName = key;
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
let nextTickCallbackQueue = [];
const SPACE_CHAR = 32;
const EmptyObject = seal(create(null));
const EmptyArray = seal([]);

function flushCallbackQueue() {
  if (process.env.NODE_ENV !== 'production') {
    if (nextTickCallbackQueue.length === 0) {
      throw new Error(`Internal Error: If callbackQueue is scheduled, it is because there must be at least one callback on this pending queue.`);
    }
  }

  const callbacks = nextTickCallbackQueue;
  nextTickCallbackQueue = []; // reset to a new queue

  for (let i = 0, len = callbacks.length; i < len; i += 1) {
    callbacks[i]();
  }
}

function addCallbackToNextTick(callback) {
  if (process.env.NODE_ENV !== 'production') {
    if (!isFunction(callback)) {
      throw new Error(`Internal Error: addCallbackToNextTick() can only accept a function callback`);
    }
  }

  if (nextTickCallbackQueue.length === 0) {
    Promise.resolve().then(flushCallbackQueue);
  }

  ArrayPush.call(nextTickCallbackQueue, callback);
}
function isCircularModuleDependency(value) {
  return hasOwnProperty$1.call(value, '__circular__');
}
/**
 * When LWC is used in the context of an Aura application, the compiler produces AMD
 * modules, that doesn't resolve properly circular dependencies between modules. In order
 * to circumvent this issue, the module loader returns a factory with a symbol attached
 * to it.
 *
 * This method returns the resolved value if it received a factory as argument. Otherwise
 * it returns the original value.
 */

function resolveCircularModuleDependency(fn) {
  if (process.env.NODE_ENV !== 'production') {
    if (!isFunction(fn)) {
      throw new TypeError(`Circular module dependency must be a function.`);
    }
  }

  return fn();
}
const useSyntheticShadow = hasOwnProperty$1.call(Element.prototype, '$shadowToken$');

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function getComponentTag(vm) {
  // Element.prototype.tagName getter might be poisoned. We need to use a try/catch to protect the
  // engine internal when accessing the tagName property.
  try {
    return `<${StringToLowerCase$1.call(vm.elm.tagName)}>`;
  } catch (error) {
    return '<invalid-tag-name>';
  }
} // TODO [#1695]: Unify getComponentStack and getErrorComponentStack

function getComponentStack(vm) {
  const stack = [];
  let prefix = '';

  while (!isNull(vm.owner)) {
    ArrayPush.call(stack, prefix + getComponentTag(vm));
    vm = vm.owner;
    prefix += '\t';
  }

  return ArrayJoin.call(stack, '\n');
}
function getErrorComponentStack(vm) {
  const wcStack = [];
  let currentVm = vm;

  while (!isNull(currentVm)) {
    ArrayPush.call(wcStack, getComponentTag(currentVm));
    currentVm = currentVm.owner;
  }

  return wcStack.reverse().join('\n\t');
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function logError(message, vm) {
  let msg = `[LWC error]: ${message}`;

  if (!isUndefined(vm)) {
    msg = `${msg}\n${getComponentStack(vm)}`;
  }

  if (process.env.NODE_ENV === 'test') {
    /* eslint-disable-next-line no-console */
    console.error(msg);
    return;
  }

  try {
    throw new Error(msg);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.error(e);
  }
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function handleEvent(event, vnode) {
  const {
    type
  } = event;
  const {
    data: {
      on
    }
  } = vnode;
  const handler = on && on[type]; // call event handler if exists

  if (handler) {
    handler.call(undefined, event);
  }
}

function createListener() {
  return function handler(event) {
    handleEvent(event, handler.vnode);
  };
}

function updateAllEventListeners(oldVnode, vnode) {
  if (isUndefined(oldVnode.listener)) {
    createAllEventListeners(vnode);
  } else {
    vnode.listener = oldVnode.listener;
    vnode.listener.vnode = vnode;
  }
}

function createAllEventListeners(vnode) {
  const {
    data: {
      on
    }
  } = vnode;

  if (isUndefined(on)) {
    return;
  }

  const elm = vnode.elm;
  const listener = vnode.listener = createListener();
  listener.vnode = vnode;
  let name;

  for (name in on) {
    elm.addEventListener(name, listener);
  }
}

var modEvents = {
  update: updateAllEventListeners,
  create: createAllEventListeners
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const ColonCharCode = 58;

function updateAttrs(oldVnode, vnode) {
  const {
    data: {
      attrs
    }
  } = vnode;

  if (isUndefined(attrs)) {
    return;
  }

  let {
    data: {
      attrs: oldAttrs
    }
  } = oldVnode;

  if (oldAttrs === attrs) {
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(isUndefined(oldAttrs) || keys(oldAttrs).join(',') === keys(attrs).join(','), `vnode.data.attrs cannot change shape.`);
  }

  const elm = vnode.elm;
  let key;
  oldAttrs = isUndefined(oldAttrs) ? EmptyObject : oldAttrs; // update modified attributes, add new attributes
  // this routine is only useful for data-* attributes in all kind of elements
  // and aria-* in standard elements (custom elements will use props for these)

  for (key in attrs) {
    const cur = attrs[key];
    const old = oldAttrs[key];

    if (old !== cur) {
      unlockAttribute(elm, key);

      if (StringCharCodeAt.call(key, 3) === ColonCharCode) {
        // Assume xml namespace
        elm.setAttributeNS(xmlNS, key, cur);
      } else if (StringCharCodeAt.call(key, 5) === ColonCharCode) {
        // Assume xlink namespace
        elm.setAttributeNS(xlinkNS, key, cur);
      } else if (isNull(cur)) {
        elm.removeAttribute(key);
      } else {
        elm.setAttribute(key, cur);
      }

      lockAttribute();
    }
  }
}

const emptyVNode = {
  data: {}
};
var modAttrs = {
  create: vnode => updateAttrs(emptyVNode, vnode),
  update: updateAttrs
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function isLiveBindingProp(sel, key) {
  // For properties with live bindings, we read values from the DOM element
  // instead of relying on internally tracked values.
  return sel === 'input' && (key === 'value' || key === 'checked');
}

function update(oldVnode, vnode) {
  const props = vnode.data.props;

  if (isUndefined(props)) {
    return;
  }

  const oldProps = oldVnode.data.props;

  if (oldProps === props) {
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(isUndefined(oldProps) || keys(oldProps).join(',') === keys(props).join(','), 'vnode.data.props cannot change shape.');
  }

  const elm = vnode.elm;
  const isFirstPatch = isUndefined(oldProps);
  const {
    sel
  } = vnode;

  for (const key in props) {
    const cur = props[key];

    if (process.env.NODE_ENV !== 'production') {
      if (!(key in elm)) {
        // TODO [#1297]: Move this validation to the compiler
        assert.fail(`Unknown public property "${key}" of element <${sel}>. This is likely a typo on the corresponding attribute "${getAttrNameFromPropName(key)}".`);
      }
    } // if it is the first time this element is patched, or the current value is different to the previous value...


    if (isFirstPatch || cur !== (isLiveBindingProp(sel, key) ? elm[key] : oldProps[key])) {
      elm[key] = cur;
    }
  }
}

const emptyVNode$1 = {
  data: {}
};
var modProps = {
  create: vnode => update(emptyVNode$1, vnode),
  update
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const classNameToClassMap = create(null);

function getMapFromClassName(className) {
  // Intentionally using == to match undefined and null values from computed style attribute
  if (className == null) {
    return EmptyObject;
  } // computed class names must be string


  className = isString(className) ? className : className + '';
  let map = classNameToClassMap[className];

  if (map) {
    return map;
  }

  map = create(null);
  let start = 0;
  let o;
  const len = className.length;

  for (o = 0; o < len; o++) {
    if (StringCharCodeAt.call(className, o) === SPACE_CHAR) {
      if (o > start) {
        map[StringSlice.call(className, start, o)] = true;
      }

      start = o + 1;
    }
  }

  if (o > start) {
    map[StringSlice.call(className, start, o)] = true;
  }

  classNameToClassMap[className] = map;

  if (process.env.NODE_ENV !== 'production') {
    // just to make sure that this object never changes as part of the diffing algo
    freeze(map);
  }

  return map;
}

function updateClassAttribute(oldVnode, vnode) {
  const {
    elm,
    data: {
      className: newClass
    }
  } = vnode;
  const {
    data: {
      className: oldClass
    }
  } = oldVnode;

  if (oldClass === newClass) {
    return;
  }

  const {
    classList
  } = elm;
  const newClassMap = getMapFromClassName(newClass);
  const oldClassMap = getMapFromClassName(oldClass);
  let name;

  for (name in oldClassMap) {
    // remove only if it is not in the new class collection and it is not set from within the instance
    if (isUndefined(newClassMap[name])) {
      classList.remove(name);
    }
  }

  for (name in newClassMap) {
    if (isUndefined(oldClassMap[name])) {
      classList.add(name);
    }
  }
}

const emptyVNode$2 = {
  data: {}
};
var modComputedClassName = {
  create: vnode => updateClassAttribute(emptyVNode$2, vnode),
  update: updateClassAttribute
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function updateStyleAttribute(oldVnode, vnode) {
  const {
    style: newStyle
  } = vnode.data;

  if (oldVnode.data.style === newStyle) {
    return;
  }

  const elm = vnode.elm;
  const {
    style
  } = elm;

  if (!isString(newStyle) || newStyle === '') {
    removeAttribute.call(elm, 'style');
  } else {
    style.cssText = newStyle;
  }
}

const emptyVNode$3 = {
  data: {}
};
var modComputedStyle = {
  create: vnode => updateStyleAttribute(emptyVNode$3, vnode),
  update: updateStyleAttribute
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// The compiler takes care of transforming the inline classnames into an object. It's faster to set the
// different classnames properties individually instead of via a string.

function createClassAttribute(vnode) {
  const {
    elm,
    data: {
      classMap
    }
  } = vnode;

  if (isUndefined(classMap)) {
    return;
  }

  const {
    classList
  } = elm;

  for (const name in classMap) {
    classList.add(name);
  }
}

var modStaticClassName = {
  create: createClassAttribute
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// The compiler takes care of transforming the inline style into an object. It's faster to set the
// different style properties individually instead of via a string.

function createStyleAttribute(vnode) {
  const {
    elm,
    data: {
      styleMap
    }
  } = vnode;

  if (isUndefined(styleMap)) {
    return;
  }

  const {
    style
  } = elm;

  for (const name in styleMap) {
    style[name] = styleMap[name];
  }
}

var modStaticStyle = {
  create: createStyleAttribute
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function createContext(vnode) {
  const {
    data: {
      context
    }
  } = vnode;

  if (isUndefined(context)) {
    return;
  }

  const elm = vnode.elm;
  const vm = getAssociatedVMIfPresent(elm);

  if (!isUndefined(vm)) {
    assign(vm.context, context);
  }
}

const contextModule = {
  create: createContext
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
@license
Copyright (c) 2015 Simon Friis Vindum.
This code may only be used under the MIT License found at
https://github.com/snabbdom/snabbdom/blob/master/LICENSE
Code distributed by Snabbdom as part of the Snabbdom project at
https://github.com/snabbdom/snabbdom/
*/
function isUndef(s) {
  return s === undefined;
}

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function isVNode(vnode) {
  return vnode != null;
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  const map = {};
  let j, key, ch; // TODO [#1637]: simplify this by assuming that all vnodes has keys

  for (j = beginIdx; j <= endIdx; ++j) {
    ch = children[j];

    if (isVNode(ch)) {
      key = ch.key;

      if (key !== undefined) {
        map[key] = j;
      }
    }
  }

  return map;
}

function addVnodes(parentElm, before, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];

    if (isVNode(ch)) {
      ch.hook.create(ch);
      ch.hook.insert(ch, parentElm, before);
    }
  }
}

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx]; // text nodes do not have logic associated to them

    if (isVNode(ch)) {
      ch.hook.remove(ch, parentElm);
    }
  }
}

function updateDynamicChildren(parentElm, oldCh, newCh) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx;
  let idxInOld;
  let elmToMove;
  let before;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (!isVNode(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
    } else if (!isVNode(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (!isVNode(newStartVnode)) {
      newStartVnode = newCh[++newStartIdx];
    } else if (!isVNode(newEndVnode)) {
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode);
      newEndVnode.hook.move(oldStartVnode, parentElm, oldEndVnode.elm.nextSibling);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode);
      newStartVnode.hook.move(oldEndVnode, parentElm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      }

      idxInOld = oldKeyToIdx[newStartVnode.key];

      if (isUndef(idxInOld)) {
        // New element
        newStartVnode.hook.create(newStartVnode);
        newStartVnode.hook.insert(newStartVnode, parentElm, oldStartVnode.elm);
        newStartVnode = newCh[++newStartIdx];
      } else {
        elmToMove = oldCh[idxInOld];

        if (isVNode(elmToMove)) {
          if (elmToMove.sel !== newStartVnode.sel) {
            // New element
            newStartVnode.hook.create(newStartVnode);
            newStartVnode.hook.insert(newStartVnode, parentElm, oldStartVnode.elm);
          } else {
            patchVnode(elmToMove, newStartVnode);
            oldCh[idxInOld] = undefined;
            newStartVnode.hook.move(elmToMove, parentElm, oldStartVnode.elm);
          }
        }

        newStartVnode = newCh[++newStartIdx];
      }
    }
  }

  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      const n = newCh[newEndIdx + 1];
      before = isVNode(n) ? n.elm : null;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx);
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }
}
function updateStaticChildren(parentElm, oldCh, newCh) {
  const {
    length
  } = newCh;

  if (oldCh.length === 0) {
    // the old list is empty, we can directly insert anything new
    addVnodes(parentElm, null, newCh, 0, length);
    return;
  } // if the old list is not empty, the new list MUST have the same
  // amount of nodes, that's why we call this static children


  let referenceElm = null;

  for (let i = length - 1; i >= 0; i -= 1) {
    const vnode = newCh[i];
    const oldVNode = oldCh[i];

    if (vnode !== oldVNode) {
      if (isVNode(oldVNode)) {
        if (isVNode(vnode)) {
          // both vnodes must be equivalent, and se just need to patch them
          patchVnode(oldVNode, vnode);
          referenceElm = vnode.elm;
        } else {
          // removing the old vnode since the new one is null
          oldVNode.hook.remove(oldVNode, parentElm);
        }
      } else if (isVNode(vnode)) {
        // this condition is unnecessary
        vnode.hook.create(vnode); // insert the new node one since the old one is null

        vnode.hook.insert(vnode, parentElm, referenceElm);
        referenceElm = vnode.elm;
      }
    }
  }
}

function patchVnode(oldVnode, vnode) {
  if (oldVnode !== vnode) {
    vnode.elm = oldVnode.elm;
    vnode.hook.update(oldVnode, vnode);
  }
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function generateDataDescriptor(options) {
  return assign({
    configurable: true,
    enumerable: true,
    writable: true
  }, options);
}

function generateAccessorDescriptor(options) {
  return assign({
    configurable: true,
    enumerable: true
  }, options);
}

let isDomMutationAllowed = false;
function unlockDomMutation() {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  isDomMutationAllowed = true;
}
function lockDomMutation() {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  isDomMutationAllowed = false;
}

function portalRestrictionErrorMessage(name, type) {
  return `The \`${name}\` ${type} is available only on elements that use the \`lwc:dom="manual"\` directive.`;
}

function getNodeRestrictionsDescriptors(node, options) {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  } // getPropertyDescriptor here recursively looks up the prototype chain
  // and returns the first descriptor for the property


  const originalTextContentDescriptor = getPropertyDescriptor(node, 'textContent');
  const originalNodeValueDescriptor = getPropertyDescriptor(node, 'nodeValue');
  const {
    appendChild,
    insertBefore,
    removeChild,
    replaceChild
  } = node;
  return {
    appendChild: generateDataDescriptor({
      value(aChild) {
        if (this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('appendChild', 'method'));
        }

        return appendChild.call(this, aChild);
      }

    }),
    insertBefore: generateDataDescriptor({
      value(newNode, referenceNode) {
        if (!isDomMutationAllowed && this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('insertBefore', 'method'));
        }

        return insertBefore.call(this, newNode, referenceNode);
      }

    }),
    removeChild: generateDataDescriptor({
      value(aChild) {
        if (!isDomMutationAllowed && this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('removeChild', 'method'));
        }

        return removeChild.call(this, aChild);
      }

    }),
    replaceChild: generateDataDescriptor({
      value(newChild, oldChild) {
        if (this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('replaceChild', 'method'));
        }

        return replaceChild.call(this, newChild, oldChild);
      }

    }),
    nodeValue: generateAccessorDescriptor({
      get() {
        return originalNodeValueDescriptor.get.call(this);
      },

      set(value) {
        if (!isDomMutationAllowed && this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('nodeValue', 'property'));
        }

        originalNodeValueDescriptor.set.call(this, value);
      }

    }),
    textContent: generateAccessorDescriptor({
      get() {
        return originalTextContentDescriptor.get.call(this);
      },

      set(value) {
        if (this instanceof Element && isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('textContent', 'property'));
        }

        originalTextContentDescriptor.set.call(this, value);
      }

    })
  };
}

function getElementRestrictionsDescriptors(elm, options) {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  const descriptors = getNodeRestrictionsDescriptors(elm, options);
  const originalInnerHTMLDescriptor = getPropertyDescriptor(elm, 'innerHTML');
  const originalOuterHTMLDescriptor = getPropertyDescriptor(elm, 'outerHTML');
  assign(descriptors, {
    innerHTML: generateAccessorDescriptor({
      get() {
        return originalInnerHTMLDescriptor.get.call(this);
      },

      set(value) {
        if (isFalse$1(options.isPortal)) {
          logError(portalRestrictionErrorMessage('innerHTML', 'property'), getAssociatedVMIfPresent(this));
        }

        return originalInnerHTMLDescriptor.set.call(this, value);
      }

    }),
    outerHTML: generateAccessorDescriptor({
      get() {
        return originalOuterHTMLDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set outerHTML on Element.`);
      }

    })
  });
  return descriptors;
}

function getShadowRootRestrictionsDescriptors(sr, options) {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  } // Disallowing properties in dev mode only to avoid people doing the wrong
  // thing when using the real shadow root, because if that's the case,
  // the component will not work when running with synthetic shadow.


  const originalQuerySelector = sr.querySelector;
  const originalQuerySelectorAll = sr.querySelectorAll;
  const originalAddEventListener = sr.addEventListener;
  const descriptors = getNodeRestrictionsDescriptors(sr, options);
  const originalInnerHTMLDescriptor = getPropertyDescriptor(sr, 'innerHTML');
  const originalTextContentDescriptor = getPropertyDescriptor(sr, 'textContent');
  assign(descriptors, {
    innerHTML: generateAccessorDescriptor({
      get() {
        return originalInnerHTMLDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set innerHTML on ShadowRoot.`);
      }

    }),
    textContent: generateAccessorDescriptor({
      get() {
        return originalTextContentDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set textContent on ShadowRoot.`);
      }

    }),
    addEventListener: generateDataDescriptor({
      value(type, listener, options) {
        const vmBeingRendered = getVMBeingRendered();
        assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${toString(sr)} by adding an event listener for "${type}".`);
        assert.invariant(!isUpdatingTemplate, `Updating the template of ${vmBeingRendered} has side effects on the state of ${toString(sr)} by adding an event listener for "${type}".`); // TODO [#420]: this is triggered when the component author attempts to add a listener
        // programmatically into its Component's shadow root

        if (!isUndefined(options)) {
          logError('The `addEventListener` method in `LightningElement` does not support any options.', getAssociatedVMIfPresent(this));
        } // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch


        return originalAddEventListener.apply(this, arguments);
      }

    }),
    querySelector: generateDataDescriptor({
      value() {
        const vm = getAssociatedVM(this);
        assert.isFalse(isBeingConstructed(vm), `this.template.querySelector() cannot be called during the construction of the` + `custom element for ${vm} because no content has been rendered yet.`); // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch

        return originalQuerySelector.apply(this, arguments);
      }

    }),
    querySelectorAll: generateDataDescriptor({
      value() {
        const vm = getAssociatedVM(this);
        assert.isFalse(isBeingConstructed(vm), `this.template.querySelectorAll() cannot be called during the construction of the` + ` custom element for ${vm} because no content has been rendered yet.`); // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch

        return originalQuerySelectorAll.apply(this, arguments);
      }

    })
  });
  const BlockedShadowRootMethods = {
    cloneNode: 0,
    getElementById: 0,
    getSelection: 0,
    elementsFromPoint: 0,
    dispatchEvent: 0
  };
  forEach.call(getOwnPropertyNames(BlockedShadowRootMethods), methodName => {
    const descriptor = generateAccessorDescriptor({
      get() {
        throw new Error(`Disallowed method "${methodName}" in ShadowRoot.`);
      }

    });
    descriptors[methodName] = descriptor;
  });
  return descriptors;
} // Custom Elements Restrictions:
// -----------------------------


function getCustomElementRestrictionsDescriptors(elm, options) {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  const descriptors = getNodeRestrictionsDescriptors(elm, options);
  const originalAddEventListener = elm.addEventListener;
  const originalInnerHTMLDescriptor = getPropertyDescriptor(elm, 'innerHTML');
  const originalOuterHTMLDescriptor = getPropertyDescriptor(elm, 'outerHTML');
  const originalTextContentDescriptor = getPropertyDescriptor(elm, 'textContent');
  return assign(descriptors, {
    innerHTML: generateAccessorDescriptor({
      get() {
        return originalInnerHTMLDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set innerHTML on HTMLElement.`);
      }

    }),
    outerHTML: generateAccessorDescriptor({
      get() {
        return originalOuterHTMLDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set outerHTML on HTMLElement.`);
      }

    }),
    textContent: generateAccessorDescriptor({
      get() {
        return originalTextContentDescriptor.get.call(this);
      },

      set(_value) {
        throw new TypeError(`Invalid attempt to set textContent on HTMLElement.`);
      }

    }),
    addEventListener: generateDataDescriptor({
      value(type, listener, options) {
        const vmBeingRendered = getVMBeingRendered();
        assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${toString(this)} by adding an event listener for "${type}".`);
        assert.invariant(!isUpdatingTemplate, `Updating the template of ${vmBeingRendered} has side effects on the state of ${toString(elm)} by adding an event listener for "${type}".`); // TODO [#420]: this is triggered when the component author attempts to add a listener
        // programmatically into a lighting element node

        if (!isUndefined(options)) {
          logError('The `addEventListener` method in `LightningElement` does not support any options.', getAssociatedVMIfPresent(this));
        } // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch


        return originalAddEventListener.apply(this, arguments);
      }

    })
  });
}

function getComponentRestrictionsDescriptors() {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  return {
    tagName: generateAccessorDescriptor({
      get() {
        throw new Error(`Usage of property \`tagName\` is disallowed because the component itself does` + ` not know which tagName will be used to create the element, therefore writing` + ` code that check for that value is error prone.`);
      },

      configurable: true,
      enumerable: false
    })
  };
}

function getLightningElementPrototypeRestrictionsDescriptors(proto) {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  const originalDispatchEvent = proto.dispatchEvent;
  const originalIsConnectedGetter = getOwnPropertyDescriptor(proto, 'isConnected').get;
  const descriptors = {
    dispatchEvent: generateDataDescriptor({
      value(event) {
        const vm = getAssociatedVM(this);
        assert.isFalse(isBeingConstructed(vm), `this.dispatchEvent() should not be called during the construction of the custom` + ` element for ${getComponentTag(vm)} because no one is listening just yet.`);

        if (!isNull(event) && isObject$1(event)) {
          const {
            type
          } = event;

          if (!/^[a-z][a-z0-9_]*$/.test(type)) {
            logError(`Invalid event type "${type}" dispatched in element ${getComponentTag(vm)}.` + ` Event name must start with a lowercase letter and followed only lowercase` + ` letters, numbers, and underscores`, vm);
          }
        } // Typescript does not like it when you treat the `arguments` object as an array
        // @ts-ignore type-mismatch


        return originalDispatchEvent.apply(this, arguments);
      }

    }),
    isConnected: generateAccessorDescriptor({
      get() {
        const vm = getAssociatedVM(this);
        const componentTag = getComponentTag(vm);
        assert.isFalse(isBeingConstructed(vm), `this.isConnected should not be accessed during the construction phase of the custom` + ` element ${componentTag}. The value will always be` + ` false for Lightning Web Components constructed using lwc.createElement().`);
        assert.isFalse(isVMBeingRendered(vm), `this.isConnected should not be accessed during the rendering phase of the custom` + ` element ${componentTag}. The value will always be true.`);
        assert.isFalse(isInvokingRenderedCallback(vm), `this.isConnected should not be accessed during the renderedCallback of the custom` + ` element ${componentTag}. The value will always be true.`);
        return originalIsConnectedGetter.call(this);
      }

    })
  };
  forEach.call(getOwnPropertyNames(globalHTMLProperties), propName => {
    if (propName in proto) {
      return; // no need to redefine something that we are already exposing
    }

    descriptors[propName] = generateAccessorDescriptor({
      get() {
        const {
          error,
          attribute
        } = globalHTMLProperties[propName];
        const msg = [];
        msg.push(`Accessing the global HTML property "${propName}" is disabled.`);

        if (error) {
          msg.push(error);
        } else if (attribute) {
          msg.push(`Instead access it via \`this.getAttribute("${attribute}")\`.`);
        }

        logError(msg.join('\n'), getAssociatedVM(this));
      },

      set() {
        const {
          readOnly
        } = globalHTMLProperties[propName];

        if (readOnly) {
          logError(`The global HTML property \`${propName}\` is read-only.`, getAssociatedVM(this));
        }
      }

    });
  });
  return descriptors;
}

function markNodeFromVNode(node) {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  node.$fromTemplate$ = true;
}
function patchElementWithRestrictions(elm, options) {
  defineProperties(elm, getElementRestrictionsDescriptors(elm, options));
} // This routine will prevent access to certain properties on a shadow root instance to guarantee
// that all components will work fine in IE11 and other browsers without shadow dom support.

function patchShadowRootWithRestrictions(sr, options) {
  defineProperties(sr, getShadowRootRestrictionsDescriptors(sr, options));
}
function patchCustomElementWithRestrictions(elm, options) {
  const restrictionsDescriptors = getCustomElementRestrictionsDescriptors(elm, options);
  const elmProto = getPrototypeOf(elm);
  setPrototypeOf(elm, create(elmProto, restrictionsDescriptors));
}
function patchComponentWithRestrictions(cmp) {
  defineProperties(cmp, getComponentRestrictionsDescriptors());
}
function patchLightningElementPrototypeWithRestrictions(proto) {
  defineProperties(proto, getLightningElementPrototypeRestrictionsDescriptors(proto));
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const noop = () => void 0;

function observeElementChildNodes(elm) {
  elm.$domManual$ = true;
}

function setElementShadowToken(elm, token) {
  elm.$shadowToken$ = token;
}

function updateNodeHook(oldVnode, vnode) {
  const {
    text
  } = vnode;

  if (oldVnode.text !== text) {
    if (process.env.NODE_ENV !== 'production') {
      unlockDomMutation();
    }
    /**
     * Compiler will never produce a text property that is not string
     */


    vnode.elm.nodeValue = text;

    if (process.env.NODE_ENV !== 'production') {
      lockDomMutation();
    }
  }
}
function insertNodeHook(vnode, parentNode, referenceNode) {
  if (process.env.NODE_ENV !== 'production') {
    unlockDomMutation();
  }

  parentNode.insertBefore(vnode.elm, referenceNode);

  if (process.env.NODE_ENV !== 'production') {
    lockDomMutation();
  }
}
function removeNodeHook(vnode, parentNode) {
  if (process.env.NODE_ENV !== 'production') {
    unlockDomMutation();
  }

  parentNode.removeChild(vnode.elm);

  if (process.env.NODE_ENV !== 'production') {
    lockDomMutation();
  }
}
function createElmHook(vnode) {
  modEvents.create(vnode); // Attrs need to be applied to element before props
  // IE11 will wipe out value on radio inputs if value
  // is set before type=radio.

  modAttrs.create(vnode);
  modProps.create(vnode);
  modStaticClassName.create(vnode);
  modStaticStyle.create(vnode);
  modComputedClassName.create(vnode);
  modComputedStyle.create(vnode);
  contextModule.create(vnode);
}
var LWCDOMMode;

(function (LWCDOMMode) {
  LWCDOMMode["manual"] = "manual";
})(LWCDOMMode || (LWCDOMMode = {}));

function fallbackElmHook(vnode) {
  const {
    owner
  } = vnode;
  const elm = vnode.elm;

  if (isTrue$1(useSyntheticShadow)) {
    const {
      data: {
        context
      }
    } = vnode;
    const {
      shadowAttribute
    } = owner.context;

    if (!isUndefined(context) && !isUndefined(context.lwc) && context.lwc.dom === LWCDOMMode.manual) {
      // this element will now accept any manual content inserted into it
      observeElementChildNodes(elm);
    } // when running in synthetic shadow mode, we need to set the shadowToken value
    // into each element from the template, so they can be styled accordingly.


    setElementShadowToken(elm, shadowAttribute);
  }

  if (process.env.NODE_ENV !== 'production') {
    const {
      data: {
        context
      }
    } = vnode;
    const isPortal = !isUndefined(context) && !isUndefined(context.lwc) && context.lwc.dom === LWCDOMMode.manual;
    patchElementWithRestrictions(elm, {
      isPortal
    });
  }
}
function updateElmHook(oldVnode, vnode) {
  // Attrs need to be applied to element before props
  // IE11 will wipe out value on radio inputs if value
  // is set before type=radio.
  modAttrs.update(oldVnode, vnode);
  modProps.update(oldVnode, vnode);
  modComputedClassName.update(oldVnode, vnode);
  modComputedStyle.update(oldVnode, vnode);
}
function insertCustomElmHook(vnode) {
  const vm = getAssociatedVM(vnode.elm);
  appendVM(vm);
}
function updateChildrenHook(oldVnode, vnode) {
  const {
    children,
    owner
  } = vnode;
  const fn = hasDynamicChildren(children) ? updateDynamicChildren : updateStaticChildren;
  runWithBoundaryProtection(owner, owner.owner, noop, () => {
    fn(vnode.elm, oldVnode.children, children);
  }, noop);
}
function allocateChildrenHook(vnode) {
  const vm = getAssociatedVM(vnode.elm);
  const {
    children
  } = vnode;
  vm.aChildren = children;

  if (isTrue$1(useSyntheticShadow)) {
    // slow path
    allocateInSlot(vm, children); // every child vnode is now allocated, and the host should receive none directly, it receives them via the shadow!

    vnode.children = EmptyArray;
  }
}
function createViewModelHook(vnode) {
  const elm = vnode.elm;

  if (!isUndefined(getAssociatedVMIfPresent(elm))) {
    // There is a possibility that a custom element is registered under tagName,
    // in which case, the initialization is already carry on, and there is nothing else
    // to do here since this hook is called right after invoking `document.createElement`.
    return;
  }

  const {
    mode,
    ctor,
    owner
  } = vnode;
  const def = getComponentDef(ctor);
  setElementProto(elm, def);

  if (isTrue$1(useSyntheticShadow)) {
    const {
      shadowAttribute
    } = owner.context; // when running in synthetic shadow mode, we need to set the shadowToken value
    // into each element from the template, so they can be styled accordingly.

    setElementShadowToken(elm, shadowAttribute);
  }

  createVM(elm, ctor, {
    mode,
    owner
  });

  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isArray$1(vnode.children), `Invalid vnode for a custom element, it must have children defined.`);
  }

  if (process.env.NODE_ENV !== 'production') {
    patchCustomElementWithRestrictions(elm, EmptyObject);
  }
}
function createCustomElmHook(vnode) {
  modEvents.create(vnode); // Attrs need to be applied to element before props
  // IE11 will wipe out value on radio inputs if value
  // is set before type=radio.

  modAttrs.create(vnode);
  modProps.create(vnode);
  modStaticClassName.create(vnode);
  modStaticStyle.create(vnode);
  modComputedClassName.create(vnode);
  modComputedStyle.create(vnode);
  contextModule.create(vnode);
}
function createChildrenHook(vnode) {
  const {
    elm,
    children
  } = vnode;

  for (let j = 0; j < children.length; ++j) {
    const ch = children[j];

    if (ch != null) {
      ch.hook.create(ch);
      ch.hook.insert(ch, elm, null);
    }
  }
}
function rerenderCustomElmHook(vnode) {
  const vm = getAssociatedVM(vnode.elm);

  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isArray$1(vnode.children), `Invalid vnode for a custom element, it must have children defined.`);
  }

  rerenderVM(vm);
}
function updateCustomElmHook(oldVnode, vnode) {
  // Attrs need to be applied to element before props
  // IE11 will wipe out value on radio inputs if value
  // is set before type=radio.
  modAttrs.update(oldVnode, vnode);
  modProps.update(oldVnode, vnode);
  modComputedClassName.update(oldVnode, vnode);
  modComputedStyle.update(oldVnode, vnode);
}
function removeElmHook(vnode) {
  // this method only needs to search on child vnodes from template
  // to trigger the remove hook just in case some of those children
  // are custom elements.
  const {
    children,
    elm
  } = vnode;

  for (let j = 0, len = children.length; j < len; ++j) {
    const ch = children[j];

    if (!isNull(ch)) {
      ch.hook.remove(ch, elm);
    }
  }
}
function removeCustomElmHook(vnode) {
  // for custom elements we don't have to go recursively because the removeVM routine
  // will take care of disconnecting any child VM attached to its shadow as well.
  removeVM(getAssociatedVM(vnode.elm));
} // Using a WeakMap instead of a WeakSet because this one works in IE11 :(

const FromIteration = new WeakMap(); // dynamic children means it was generated by an iteration
// in a template, and will require a more complex diffing algo.

function markAsDynamicChildren(children) {
  FromIteration.set(children, 1);
}
function hasDynamicChildren(children) {
  return FromIteration.has(children);
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const Services = create(null);
const hooks = ['wiring', 'locator', 'rendered', 'connected', 'disconnected'];
/**
 * EXPERIMENTAL: This function allows for the registration of "services"
 * in LWC by exposing hooks into the component life-cycle. This API is
 * subject to change or being removed.
 */

function register(service) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isObject$1(service), `Invalid service declaration, ${service}: service must be an object`);
  }

  for (let i = 0; i < hooks.length; ++i) {
    const hookName = hooks[i];

    if (hookName in service) {
      let l = Services[hookName];

      if (isUndefined(l)) {
        Services[hookName] = l = [];
      }

      ArrayPush.call(l, service[hookName]);
    }
  }
}
function invokeServiceHook(vm, cbs) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isArray$1(cbs) && cbs.length > 0, `Optimize invokeServiceHook() to be invoked only when needed`);
  }

  const {
    component,
    data,
    def,
    context
  } = vm;

  for (let i = 0, len = cbs.length; i < len; ++i) {
    cbs[i].call(undefined, component, data, def, context);
  }
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const CHAR_S = 115;
const CHAR_V = 118;
const CHAR_G = 103;
const NamespaceAttributeForSVG = 'http://www.w3.org/2000/svg';
const SymbolIterator = Symbol.iterator;
const TextHook = {
  create: vnode => {
    vnode.elm = document.createTextNode(vnode.text);
    linkNodeToShadow(vnode);

    if (process.env.NODE_ENV !== 'production') {
      markNodeFromVNode(vnode.elm);
    }
  },
  update: updateNodeHook,
  insert: insertNodeHook,
  move: insertNodeHook,
  remove: removeNodeHook
};
const CommentHook = {
  create: vnode => {
    vnode.elm = document.createComment(vnode.text);
    linkNodeToShadow(vnode);

    if (process.env.NODE_ENV !== 'production') {
      markNodeFromVNode(vnode.elm);
    }
  },
  update: updateNodeHook,
  insert: insertNodeHook,
  move: insertNodeHook,
  remove: removeNodeHook
}; // insert is called after update, which is used somewhere else (via a module)
// to mark the vm as inserted, that means we cannot use update as the main channel
// to rehydrate when dirty, because sometimes the element is not inserted just yet,
// which breaks some invariants. For that reason, we have the following for any
// Custom Element that is inserted via a template.

const ElementHook = {
  create: vnode => {
    const {
      data,
      sel,
      clonedElement
    } = vnode;
    const {
      ns
    } = data; // TODO [#1364]: supporting the ability to inject a cloned StyleElement via a vnode this is
    // used for style tags for native shadow

    if (isUndefined(clonedElement)) {
      vnode.elm = isUndefined(ns) ? document.createElement(sel) : document.createElementNS(ns, sel);
    } else {
      vnode.elm = clonedElement;
    }

    linkNodeToShadow(vnode);

    if (process.env.NODE_ENV !== 'production') {
      markNodeFromVNode(vnode.elm);
    }

    fallbackElmHook(vnode);
    createElmHook(vnode);
  },
  update: (oldVnode, vnode) => {
    updateElmHook(oldVnode, vnode);
    updateChildrenHook(oldVnode, vnode);
  },
  insert: (vnode, parentNode, referenceNode) => {
    insertNodeHook(vnode, parentNode, referenceNode);
    createChildrenHook(vnode);
  },
  move: (vnode, parentNode, referenceNode) => {
    insertNodeHook(vnode, parentNode, referenceNode);
  },
  remove: (vnode, parentNode) => {
    removeNodeHook(vnode, parentNode);
    removeElmHook(vnode);
  }
};
const CustomElementHook = {
  create: vnode => {
    const {
      sel
    } = vnode;
    vnode.elm = document.createElement(sel);
    linkNodeToShadow(vnode);

    if (process.env.NODE_ENV !== 'production') {
      markNodeFromVNode(vnode.elm);
    }

    createViewModelHook(vnode);
    allocateChildrenHook(vnode);
    createCustomElmHook(vnode);
  },
  update: (oldVnode, vnode) => {
    updateCustomElmHook(oldVnode, vnode); // in fallback mode, the allocation will always set children to
    // empty and delegate the real allocation to the slot elements

    allocateChildrenHook(vnode); // in fallback mode, the children will be always empty, so, nothing
    // will happen, but in native, it does allocate the light dom

    updateChildrenHook(oldVnode, vnode); // this will update the shadowRoot

    rerenderCustomElmHook(vnode);
  },
  insert: (vnode, parentNode, referenceNode) => {
    insertNodeHook(vnode, parentNode, referenceNode);
    const vm = getAssociatedVM(vnode.elm);

    if (process.env.NODE_ENV !== 'production') {
      assert.isTrue(vm.state === VMState.created, `${vm} cannot be recycled.`);
    }

    runConnectedCallback(vm);
    createChildrenHook(vnode);
    insertCustomElmHook(vnode);
  },
  move: (vnode, parentNode, referenceNode) => {
    insertNodeHook(vnode, parentNode, referenceNode);
  },
  remove: (vnode, parentNode) => {
    removeNodeHook(vnode, parentNode);
    removeCustomElmHook(vnode);
  }
};

function linkNodeToShadow(vnode) {
  // TODO [#1164]: this should eventually be done by the polyfill directly
  vnode.elm.$shadowResolver$ = vnode.owner.cmpRoot.$shadowResolver$;
} // TODO [#1136]: this should be done by the compiler, adding ns to every sub-element


function addNS(vnode) {
  const {
    data,
    children,
    sel
  } = vnode;
  data.ns = NamespaceAttributeForSVG; // TODO [#1275]: review why `sel` equal `foreignObject` should get this `ns`

  if (isArray$1(children) && sel !== 'foreignObject') {
    for (let j = 0, n = children.length; j < n; ++j) {
      const childNode = children[j];

      if (childNode != null && childNode.hook === ElementHook) {
        addNS(childNode);
      }
    }
  }
}

function addVNodeToChildLWC(vnode) {
  ArrayPush.call(getVMBeingRendered().velements, vnode);
} // [h]tml node


function h(sel, data, children) {
  const vmBeingRendered = getVMBeingRendered();

  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isString(sel), `h() 1st argument sel must be a string.`);
    assert.isTrue(isObject$1(data), `h() 2nd argument data must be an object.`);
    assert.isTrue(isArray$1(children), `h() 3rd argument children must be an array.`);
    assert.isTrue('key' in data, ` <${sel}> "key" attribute is invalid or missing for ${vmBeingRendered}. Key inside iterator is either undefined or null.`); // checking reserved internal data properties

    assert.isFalse(data.className && data.classMap, `vnode.data.className and vnode.data.classMap ambiguous declaration.`);
    assert.isFalse(data.styleMap && data.style, `vnode.data.styleMap and vnode.data.style ambiguous declaration.`);

    if (data.style && !isString(data.style)) {
      logError(`Invalid 'style' attribute passed to <${sel}> is ignored. This attribute must be a string value.`, vmBeingRendered);
    }

    forEach.call(children, childVnode => {
      if (childVnode != null) {
        assert.isTrue(childVnode && 'sel' in childVnode && 'data' in childVnode && 'children' in childVnode && 'text' in childVnode && 'elm' in childVnode && 'key' in childVnode, `${childVnode} is not a vnode.`);
      }
    });
  }

  const {
    key
  } = data;
  let text, elm;
  const vnode = {
    sel,
    data,
    children,
    text,
    elm,
    key,
    hook: ElementHook,
    owner: vmBeingRendered
  };

  if (sel.length === 3 && StringCharCodeAt.call(sel, 0) === CHAR_S && StringCharCodeAt.call(sel, 1) === CHAR_V && StringCharCodeAt.call(sel, 2) === CHAR_G) {
    addNS(vnode);
  }

  return vnode;
} // [t]ab[i]ndex function

function ti(value) {
  // if value is greater than 0, we normalize to 0
  // If value is an invalid tabIndex value (null, undefined, string, etc), we let that value pass through
  // If value is less than -1, we don't care
  const shouldNormalize = value > 0 && !(isTrue$1(value) || isFalse$1(value));

  if (process.env.NODE_ENV !== 'production') {
    const vmBeingRendered = getVMBeingRendered();

    if (shouldNormalize) {
      logError(`Invalid tabindex value \`${toString(value)}\` in template for ${vmBeingRendered}. This attribute must be set to 0 or -1.`, vmBeingRendered);
    }
  }

  return shouldNormalize ? 0 : value;
} // [s]lot element node

function s(slotName, data, children, slotset) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isString(slotName), `s() 1st argument slotName must be a string.`);
    assert.isTrue(isObject$1(data), `s() 2nd argument data must be an object.`);
    assert.isTrue(isArray$1(children), `h() 3rd argument children must be an array.`);
  }

  if (!isUndefined(slotset) && !isUndefined(slotset[slotName]) && slotset[slotName].length !== 0) {
    children = slotset[slotName];
  }

  const vnode = h('slot', data, children);

  if (useSyntheticShadow) {
    // TODO [#1276]: compiler should give us some sort of indicator when a vnodes collection is dynamic
    sc(children);
  }

  return vnode;
} // [c]ustom element node

function c(sel, Ctor, data, children = EmptyArray) {
  if (isCircularModuleDependency(Ctor)) {
    Ctor = resolveCircularModuleDependency(Ctor);
  }

  const vmBeingRendered = getVMBeingRendered();

  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isString(sel), `c() 1st argument sel must be a string.`);
    assert.isTrue(isFunction(Ctor), `c() 2nd argument Ctor must be a function.`);
    assert.isTrue(isObject$1(data), `c() 3nd argument data must be an object.`);
    assert.isTrue(arguments.length === 3 || isArray$1(children), `c() 4nd argument data must be an array.`); // checking reserved internal data properties

    assert.isFalse(data.className && data.classMap, `vnode.data.className and vnode.data.classMap ambiguous declaration.`);
    assert.isFalse(data.styleMap && data.style, `vnode.data.styleMap and vnode.data.style ambiguous declaration.`);

    if (data.style && !isString(data.style)) {
      logError(`Invalid 'style' attribute passed to <${sel}> is ignored. This attribute must be a string value.`, vmBeingRendered);
    }

    if (arguments.length === 4) {
      forEach.call(children, childVnode => {
        if (childVnode != null) {
          assert.isTrue(childVnode && 'sel' in childVnode && 'data' in childVnode && 'children' in childVnode && 'text' in childVnode && 'elm' in childVnode && 'key' in childVnode, `${childVnode} is not a vnode.`);
        }
      });
    }
  }

  const {
    key
  } = data;
  let text, elm;
  const vnode = {
    sel,
    data,
    children,
    text,
    elm,
    key,
    hook: CustomElementHook,
    ctor: Ctor,
    owner: vmBeingRendered,
    mode: 'open'
  };
  addVNodeToChildLWC(vnode);
  return vnode;
} // [i]terable node

function i(iterable, factory) {
  const list = []; // TODO [#1276]: compiler should give us some sort of indicator when a vnodes collection is dynamic

  sc(list);
  const vmBeingRendered = getVMBeingRendered();

  if (isUndefined(iterable) || iterable === null) {
    if (process.env.NODE_ENV !== 'production') {
      logError(`Invalid template iteration for value "${toString(iterable)}" in ${vmBeingRendered}. It must be an Array or an iterable Object.`, vmBeingRendered);
    }

    return list;
  }

  if (process.env.NODE_ENV !== 'production') {
    assert.isFalse(isUndefined(iterable[SymbolIterator]), `Invalid template iteration for value \`${toString(iterable)}\` in ${vmBeingRendered}. It must be an array-like object and not \`null\` nor \`undefined\`.`);
  }

  const iterator = iterable[SymbolIterator]();

  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(iterator && isFunction(iterator.next), `Invalid iterator function for "${toString(iterable)}" in ${vmBeingRendered}.`);
  }

  let next = iterator.next();
  let j = 0;
  let {
    value,
    done: last
  } = next;
  let keyMap;
  let iterationError;

  if (process.env.NODE_ENV !== 'production') {
    keyMap = create(null);
  }

  while (last === false) {
    // implementing a look-back-approach because we need to know if the element is the last
    next = iterator.next();
    last = next.done; // template factory logic based on the previous collected value

    const vnode = factory(value, j, j === 0, last);

    if (isArray$1(vnode)) {
      ArrayPush.apply(list, vnode);
    } else {
      ArrayPush.call(list, vnode);
    }

    if (process.env.NODE_ENV !== 'production') {
      const vnodes = isArray$1(vnode) ? vnode : [vnode];
      forEach.call(vnodes, childVnode => {
        if (!isNull(childVnode) && isObject$1(childVnode) && !isUndefined(childVnode.sel)) {
          const {
            key
          } = childVnode;

          if (isString(key) || isNumber(key)) {
            if (keyMap[key] === 1 && isUndefined(iterationError)) {
              iterationError = `Duplicated "key" attribute value for "<${childVnode.sel}>" in ${vmBeingRendered} for item number ${j}. A key with value "${childVnode.key}" appears more than once in the iteration. Key values must be unique numbers or strings.`;
            }

            keyMap[key] = 1;
          } else if (isUndefined(iterationError)) {
            iterationError = `Invalid "key" attribute value in "<${childVnode.sel}>" in ${vmBeingRendered} for item number ${j}. Set a unique "key" value on all iterated child elements.`;
          }
        }
      });
    } // preparing next value


    j += 1;
    value = next.value;
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!isUndefined(iterationError)) {
      logError(iterationError, vmBeingRendered);
    }
  }

  return list;
}
/**
 * [f]lattening
 */

function f(items) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isArray$1(items), 'flattening api can only work with arrays.');
  }

  const len = items.length;
  const flattened = []; // TODO [#1276]: compiler should give us some sort of indicator when a vnodes collection is dynamic

  sc(flattened);

  for (let j = 0; j < len; j += 1) {
    const item = items[j];

    if (isArray$1(item)) {
      ArrayPush.apply(flattened, item);
    } else {
      ArrayPush.call(flattened, item);
    }
  }

  return flattened;
} // [t]ext node

function t(text) {
  const data = EmptyObject;
  let sel, children, key, elm;
  return {
    sel,
    data,
    children,
    text,
    elm,
    key,
    hook: TextHook,
    owner: getVMBeingRendered()
  };
} // comment node

function p(text) {
  const data = EmptyObject;
  const sel = '!';
  let children, key, elm;
  return {
    sel,
    data,
    children,
    text,
    elm,
    key,
    hook: CommentHook,
    owner: getVMBeingRendered()
  };
} // [d]ynamic value to produce a text vnode

function d(value) {
  if (value == null) {
    return null;
  }

  return t(value);
} // [b]ind function

function b(fn) {
  const vmBeingRendered = getVMBeingRendered();

  if (isNull(vmBeingRendered)) {
    throw new Error();
  }

  const vm = vmBeingRendered;
  return function (event) {
    invokeEventListener(vm, fn, vm.component, event);
  };
} // [f]unction_[b]ind

function fb(fn) {
  const vmBeingRendered = getVMBeingRendered();

  if (isNull(vmBeingRendered)) {
    throw new Error();
  }

  const vm = vmBeingRendered;
  return function () {
    return invokeComponentCallback(vm, fn, ArraySlice$1.call(arguments));
  };
} // [l]ocator_[l]istener function

function ll(originalHandler, id, context) {
  const vm = getVMBeingRendered();

  if (isNull(vm)) {
    throw new Error();
  } // bind the original handler with b() so we can call it
  // after resolving the locator


  const eventListener = b(originalHandler); // create a wrapping handler to resolve locator, and
  // then invoke the original handler.

  return function (event) {
    // located service for the locator metadata
    const {
      context: {
        locator
      }
    } = vm;

    if (!isUndefined(locator)) {
      const {
        locator: locatorService
      } = Services;

      if (locatorService) {
        locator.resolved = {
          target: id,
          host: locator.id,
          targetContext: isFunction(context) && context(),
          hostContext: isFunction(locator.context) && locator.context()
        }; // a registered `locator` service will be invoked with
        // access to the context.locator.resolved, which will contain:
        // outer id, outer context, inner id, and inner context

        invokeServiceHook(vm, locatorService);
      }
    } // invoke original event listener via b()


    eventListener(event);
  };
} // [k]ey function

function k(compilerKey, obj) {
  switch (typeof obj) {
    case 'number':
    case 'string':
      return compilerKey + ':' + obj;

    case 'object':
      if (process.env.NODE_ENV !== 'production') {
        assert.fail(`Invalid key value "${obj}" in ${getVMBeingRendered()}. Key must be a string or number.`);
      }

  }
} // [g]lobal [id] function

function gid(id) {
  const vmBeingRendered = getVMBeingRendered();

  if (isUndefined(id) || id === '') {
    if (process.env.NODE_ENV !== 'production') {
      logError(`Invalid id value "${id}". The id attribute must contain a non-empty string.`, vmBeingRendered);
    }

    return id;
  } // We remove attributes when they are assigned a value of null


  if (isNull(id)) {
    return null;
  }

  return `${id}-${vmBeingRendered.idx}`;
} // [f]ragment [id] function

function fid(url) {
  const vmBeingRendered = getVMBeingRendered();

  if (isUndefined(url) || url === '') {
    if (process.env.NODE_ENV !== 'production') {
      if (isUndefined(url)) {
        logError(`Undefined url value for "href" or "xlink:href" attribute. Expected a non-empty string.`, vmBeingRendered);
      }
    }

    return url;
  } // We remove attributes when they are assigned a value of null


  if (isNull(url)) {
    return null;
  } // Apply transformation only for fragment-only-urls


  if (/^#/.test(url)) {
    return `${url}-${vmBeingRendered.idx}`;
  }

  return url;
}
/**
 * Map to store an index value assigned to any dynamic component reference ingested
 * by dc() api. This allows us to generate a unique unique per template per dynamic
 * component reference to avoid diffing algo mismatches.
 */

const DynamicImportedComponentMap = new Map();
let dynamicImportedComponentCounter = 0;
/**
 * create a dynamic component via `<x-foo lwc:dynamic={Ctor}>`
 */

function dc(sel, Ctor, data, children) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isString(sel), `dc() 1st argument sel must be a string.`);
    assert.isTrue(isObject$1(data), `dc() 3nd argument data must be an object.`);
    assert.isTrue(arguments.length === 3 || isArray$1(children), `dc() 4nd argument data must be an array.`);
  } // null or undefined values should produce a null value in the VNodes


  if (Ctor == null) {
    return null;
  }

  if (!isComponentConstructor(Ctor)) {
    throw new Error(`Invalid LWC Constructor ${toString(Ctor)} for custom element <${sel}>.`);
  }

  let idx = DynamicImportedComponentMap.get(Ctor);

  if (isUndefined(idx)) {
    idx = dynamicImportedComponentCounter++;
    DynamicImportedComponentMap.set(Ctor, idx);
  } // the new vnode key is a mix of idx and compiler key, this is required by the diffing algo
  // to identify different constructors as vnodes with different keys to avoid reusing the
  // element used for previous constructors.


  data.key = `dc:${idx}:${data.key}`;
  return c(sel, Ctor, data, children);
}
/**
 * slow children collection marking mechanism. this API allows the compiler to signal
 * to the engine that a particular collection of children must be diffed using the slow
 * algo based on keys due to the nature of the list. E.g.:
 *
 *   - slot element's children: the content of the slot has to be dynamic when in synthetic
 *                              shadow mode because the `vnode.children` might be the slotted
 *                              content vs default content, in which case the size and the
 *                              keys are not matching.
 *   - children that contain dynamic components
 *   - children that are produced by iteration
 *
 */

function sc(vnodes) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isArray$1(vnodes), 'sc() api can only work with arrays.');
  } // We have to mark the vnodes collection as dynamic so we can later on
  // choose to use the snabbdom virtual dom diffing algo instead of our
  // static dummy algo.


  markAsDynamicChildren(vnodes);
  return vnodes;
}

var api = /*#__PURE__*/Object.freeze({
    __proto__: null,
    h: h,
    ti: ti,
    s: s,
    c: c,
    i: i,
    f: f,
    t: t,
    p: p,
    d: d,
    b: b,
    fb: fb,
    ll: ll,
    k: k,
    gid: gid,
    fid: fid,
    dc: dc,
    sc: sc
});

const signedTemplateSet = new Set();
function defaultEmptyTemplate() {
  return [];
}
signedTemplateSet.add(defaultEmptyTemplate);
function isTemplateRegistered(tpl) {
  return signedTemplateSet.has(tpl);
}
/**
 * INTERNAL: This function can only be invoked by compiled code. The compiler
 * will prevent this function from being imported by userland code.
 */

function registerTemplate(tpl) {
  signedTemplateSet.add(tpl); // chaining this method as a way to wrap existing
  // assignment of templates easily, without too much transformation

  return tpl;
}
/**
 * EXPERIMENTAL: This function acts like a hook for Lightning Locker
 * Service and other similar libraries to sanitize vulnerable attributes.
 * This API is subject to change or being removed.
 */

function sanitizeAttribute(tagName, namespaceUri, attrName, attrValue) {
  // locker-service patches this function during runtime to sanitize vulnerable attributes.
  // when ran off-core this function becomes a noop and returns the user authored value.
  return attrValue;
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const CachedStyleFragments = create(null);

function createStyleElement(styleContent) {
  const elm = document.createElement('style');
  elm.type = 'text/css';
  elm.textContent = styleContent;
  return elm;
}

function getCachedStyleElement(styleContent) {
  let fragment = CachedStyleFragments[styleContent];

  if (isUndefined(fragment)) {
    fragment = document.createDocumentFragment();
    const styleElm = createStyleElement(styleContent);
    fragment.appendChild(styleElm);
    CachedStyleFragments[styleContent] = fragment;
  }

  return fragment.cloneNode(true).firstChild;
}

const globalStyleParent = document.head || document.body || document;
const InsertedGlobalStyleContent = create(null);

function insertGlobalStyle(styleContent) {
  // inserts the global style when needed, otherwise does nothing
  if (isUndefined(InsertedGlobalStyleContent[styleContent])) {
    InsertedGlobalStyleContent[styleContent] = true;
    const elm = createStyleElement(styleContent);
    globalStyleParent.appendChild(elm);
  }
}

function createStyleVNode(elm) {
  const vnode = h('style', {
    key: 'style'
  }, EmptyArray); // TODO [#1364]: supporting the ability to inject a cloned StyleElement
  // forcing the diffing algo to use the cloned style for native shadow

  vnode.clonedElement = elm;
  return vnode;
}
/**
 * Reset the styling token applied to the host element.
 */


function resetStyleAttributes(vm) {
  const {
    context,
    elm
  } = vm; // Remove the style attribute currently applied to the host element.

  const oldHostAttribute = context.hostAttribute;

  if (!isUndefined(oldHostAttribute)) {
    removeAttribute.call(elm, oldHostAttribute);
  } // Reset the scoping attributes associated to the context.


  context.hostAttribute = context.shadowAttribute = undefined;
}
/**
 * Apply/Update the styling token applied to the host element.
 */

function applyStyleAttributes(vm, hostAttribute, shadowAttribute) {
  const {
    context,
    elm
  } = vm; // Remove the style attribute currently applied to the host element.

  setAttribute.call(elm, hostAttribute, '');
  context.hostAttribute = hostAttribute;
  context.shadowAttribute = shadowAttribute;
}

function collectStylesheets(stylesheets, hostSelector, shadowSelector, isNative, aggregatorFn) {
  forEach.call(stylesheets, sheet => {
    if (isArray$1(sheet)) {
      collectStylesheets(sheet, hostSelector, shadowSelector, isNative, aggregatorFn);
    } else {
      aggregatorFn(sheet(hostSelector, shadowSelector, isNative));
    }
  });
}

function evaluateCSS(stylesheets, hostAttribute, shadowAttribute) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isArray$1(stylesheets), `Invalid stylesheets.`);
  }

  if (useSyntheticShadow) {
    const hostSelector = `[${hostAttribute}]`;
    const shadowSelector = `[${shadowAttribute}]`;
    collectStylesheets(stylesheets, hostSelector, shadowSelector, false, textContent => {
      insertGlobalStyle(textContent);
    });
    return null;
  } else {
    // Native shadow in place, we need to act accordingly by using the `:host` selector, and an
    // empty shadow selector since it is not really needed.
    let buffer = '';
    collectStylesheets(stylesheets, emptyString, emptyString, true, textContent => {
      buffer += textContent;
    });
    return createStyleVNode(getCachedStyleElement(buffer));
  }
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
var GlobalMeasurementPhase;

(function (GlobalMeasurementPhase) {
  GlobalMeasurementPhase["REHYDRATE"] = "lwc-rehydrate";
  GlobalMeasurementPhase["HYDRATE"] = "lwc-hydrate";
})(GlobalMeasurementPhase || (GlobalMeasurementPhase = {})); // Even if all the browser the engine supports implements the UserTiming API, we need to guard the measure APIs.
// JSDom (used in Jest) for example doesn't implement the UserTiming APIs.


const isUserTimingSupported = typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.clearMarks === 'function' && typeof performance.measure === 'function' && typeof performance.clearMeasures === 'function';

function getMarkName(phase, vm) {
  // Adding the VM idx to the mark name creates a unique mark name component instance. This is necessary to produce
  // the right measures for components that are recursive.
  return `${getComponentTag(vm)} - ${phase} - ${vm.idx}`;
}

function getMeasureName(phase, vm) {
  return `${getComponentTag(vm)} - ${phase}`;
}

function start(markName) {
  performance.mark(markName);
}

function end(measureName, markName) {
  performance.measure(measureName, markName); // Clear the created marks and measure to avoid filling the performance entries buffer.
  // Note: Even if the entries get deleted, existing PerformanceObservers preserve a copy of those entries.

  performance.clearMarks(markName);
  performance.clearMarks(measureName);
}

function noop$1() {
  /* do nothing */
}

const startMeasure = !isUserTimingSupported ? noop$1 : function (phase, vm) {
  const markName = getMarkName(phase, vm);
  start(markName);
};
const endMeasure = !isUserTimingSupported ? noop$1 : function (phase, vm) {
  const markName = getMarkName(phase, vm);
  const measureName = getMeasureName(phase, vm);
  end(measureName, markName);
};
const startGlobalMeasure = !isUserTimingSupported ? noop$1 : function (phase, vm) {
  const markName = isUndefined(vm) ? phase : getMarkName(phase, vm);
  start(markName);
};
const endGlobalMeasure = !isUserTimingSupported ? noop$1 : function (phase, vm) {
  const markName = isUndefined(vm) ? phase : getMarkName(phase, vm);
  end(phase, markName);
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
let isUpdatingTemplate = false;
let vmBeingRendered = null;
function getVMBeingRendered() {
  return vmBeingRendered;
}
function setVMBeingRendered(vm) {
  vmBeingRendered = vm;
}
function isVMBeingRendered(vm) {
  return vm === vmBeingRendered;
}
const EmptySlots = create(null);

function validateSlots(vm, html) {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  const {
    cmpSlots = EmptySlots
  } = vm;
  const {
    slots = EmptyArray
  } = html;

  for (const slotName in cmpSlots) {
    // eslint-disable-next-line lwc-internal/no-production-assert
    assert.isTrue(isArray$1(cmpSlots[slotName]), `Slots can only be set to an array, instead received ${toString(cmpSlots[slotName])} for slot "${slotName}" in ${vm}.`);

    if (slotName !== '' && ArrayIndexOf.call(slots, slotName) === -1) {
      // TODO [#1297]: this should never really happen because the compiler should always validate
      // eslint-disable-next-line lwc-internal/no-production-assert
      logError(`Ignoring unknown provided slot name "${slotName}" in ${vm}. Check for a typo on the slot attribute.`, vm);
    }
  }
}

function validateFields(vm, html) {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  const {
    component
  } = vm; // validating identifiers used by template that should be provided by the component

  const {
    ids = []
  } = html;
  forEach.call(ids, propName => {
    if (!(propName in component)) {
      // eslint-disable-next-line lwc-internal/no-production-assert
      logError(`The template rendered by ${vm} references \`this.${propName}\`, which is not declared. Check for a typo in the template.`, vm);
    }
  });
}

function evaluateTemplate(vm, html) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(isFunction(html), `evaluateTemplate() second argument must be an imported template instead of ${toString(html)}`);
  }

  const isUpdatingTemplateInception = isUpdatingTemplate;
  const vmOfTemplateBeingUpdatedInception = vmBeingRendered;
  let vnodes = [];
  runWithBoundaryProtection(vm, vm.owner, () => {
    // pre
    vmBeingRendered = vm;

    if (process.env.NODE_ENV !== 'production') {
      startMeasure('render', vm);
    }
  }, () => {
    // job
    const {
      component,
      context,
      cmpSlots,
      cmpTemplate,
      tro
    } = vm;
    tro.observe(() => {
      // reset the cache memoizer for template when needed
      if (html !== cmpTemplate) {
        // perf opt: do not reset the shadow root during the first rendering (there is nothing to reset)
        if (!isUndefined(cmpTemplate)) {
          // It is important to reset the content to avoid reusing similar elements generated from a different
          // template, because they could have similar IDs, and snabbdom just rely on the IDs.
          resetShadowRoot(vm);
        } // Check that the template was built by the compiler


        if (isUndefined(html) || !isTemplateRegistered(html)) {
          throw new TypeError(`Invalid template returned by the render() method on ${vm}. It must return an imported template (e.g.: \`import html from "./${vm.def.name}.html"\`), instead, it has returned: ${toString(html)}.`);
        }

        vm.cmpTemplate = html; // Populate context with template information

        context.tplCache = create(null);
        resetStyleAttributes(vm);
        const {
          stylesheets,
          stylesheetTokens
        } = html;

        if (isUndefined(stylesheets) || stylesheets.length === 0) {
          context.styleVNode = null;
        } else if (!isUndefined(stylesheetTokens)) {
          const {
            hostAttribute,
            shadowAttribute
          } = stylesheetTokens;
          applyStyleAttributes(vm, hostAttribute, shadowAttribute); // Caching style vnode so it can be reused on every render

          context.styleVNode = evaluateCSS(stylesheets, hostAttribute, shadowAttribute);
        }

        if (process.env.NODE_ENV !== 'production') {
          // one time operation for any new template returned by render()
          // so we can warn if the template is attempting to use a binding
          // that is not provided by the component instance.
          validateFields(vm, html);
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        assert.isTrue(isObject$1(context.tplCache), `vm.context.tplCache must be an object associated to ${cmpTemplate}.`); // validating slots in every rendering since the allocated content might change over time

        validateSlots(vm, html);
      } // right before producing the vnodes, we clear up all internal references
      // to custom elements from the template.


      vm.velements = []; // Set the global flag that template is being updated

      isUpdatingTemplate = true;
      vnodes = html.call(undefined, api, component, cmpSlots, context.tplCache);
      const {
        styleVNode
      } = context;

      if (!isNull(styleVNode)) {
        ArrayUnshift$1.call(vnodes, styleVNode);
      }
    });
  }, () => {
    // post
    isUpdatingTemplate = isUpdatingTemplateInception;
    vmBeingRendered = vmOfTemplateBeingUpdatedInception;

    if (process.env.NODE_ENV !== 'production') {
      endMeasure('render', vm);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(isArray$1(vnodes), `Compiler should produce html functions that always return an array.`);
  }

  return vnodes;
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
let isInvokingRender = false;
let vmBeingConstructed = null;
function isBeingConstructed(vm) {
  return vmBeingConstructed === vm;
}
let vmInvokingRenderedCallback = null;
function isInvokingRenderedCallback(vm) {
  return vmInvokingRenderedCallback === vm;
}

const noop$2 = () => void 0;

function invokeComponentCallback(vm, fn, args) {
  const {
    component,
    callHook,
    owner
  } = vm;
  let result;
  runWithBoundaryProtection(vm, owner, noop$2, () => {
    // job
    result = callHook(component, fn, args);
  }, noop$2);
  return result;
}
function invokeComponentConstructor(vm, Ctor) {
  const vmBeingConstructedInception = vmBeingConstructed;
  let error;

  if (process.env.NODE_ENV !== 'production') {
    startMeasure('constructor', vm);
  }

  vmBeingConstructed = vm;
  /**
   * Constructors don't need to be wrapped with a boundary because for root elements
   * it should throw, while elements from template are already wrapped by a boundary
   * associated to the diffing algo.
   */

  try {
    // job
    const result = new Ctor(); // Check indirectly if the constructor result is an instance of LightningElement. Using
    // the "instanceof" operator would not work here since Locker Service provides its own
    // implementation of LightningElement, so we indirectly check if the base constructor is
    // invoked by accessing the component on the vm.

    if (vmBeingConstructed.component !== result) {
      throw new TypeError('Invalid component constructor, the class should extend LightningElement.');
    }
  } catch (e) {
    error = Object(e);
  } finally {
    if (process.env.NODE_ENV !== 'production') {
      endMeasure('constructor', vm);
    }

    vmBeingConstructed = vmBeingConstructedInception;

    if (!isUndefined(error)) {
      error.wcStack = getErrorComponentStack(vm); // re-throwing the original error annotated after restoring the context

      throw error; // eslint-disable-line no-unsafe-finally
    }
  }
}
function invokeComponentRenderMethod(vm) {
  const {
    def: {
      render
    },
    callHook,
    component,
    owner
  } = vm;
  const isRenderBeingInvokedInception = isInvokingRender;
  const vmBeingRenderedInception = getVMBeingRendered();
  let html;
  let renderInvocationSuccessful = false;
  runWithBoundaryProtection(vm, owner, () => {
    // pre
    isInvokingRender = true;
    setVMBeingRendered(vm);
  }, () => {
    // job
    vm.tro.observe(() => {
      html = callHook(component, render);
      renderInvocationSuccessful = true;
    });
  }, () => {
    // post
    isInvokingRender = isRenderBeingInvokedInception;
    setVMBeingRendered(vmBeingRenderedInception);
  }); // If render() invocation failed, process errorCallback in boundary and return an empty template

  return renderInvocationSuccessful ? evaluateTemplate(vm, html) : [];
}
function invokeComponentRenderedCallback(vm) {
  const {
    def: {
      renderedCallback
    },
    component,
    callHook,
    owner
  } = vm;

  if (!isUndefined(renderedCallback)) {
    const vmInvokingRenderedCallbackInception = vmInvokingRenderedCallback;
    runWithBoundaryProtection(vm, owner, () => {
      vmInvokingRenderedCallback = vm; // pre

      if (process.env.NODE_ENV !== 'production') {
        startMeasure('renderedCallback', vm);
      }
    }, () => {
      // job
      callHook(component, renderedCallback);
    }, () => {
      // post
      if (process.env.NODE_ENV !== 'production') {
        endMeasure('renderedCallback', vm);
      }

      vmInvokingRenderedCallback = vmInvokingRenderedCallbackInception;
    });
  }
}
function invokeEventListener(vm, fn, thisValue, event) {
  const {
    callHook,
    owner
  } = vm;
  runWithBoundaryProtection(vm, owner, noop$2, () => {
    // job
    if (process.env.NODE_ENV !== 'production') {
      assert.isTrue(isFunction(fn), `Invalid event handler for event '${event.type}' on ${vm}.`);
    }

    callHook(thisValue, fn, [event]);
  }, noop$2);
}

/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const {
  create: create$1
} = Object;
const {
  splice: ArraySplice$1,
  indexOf: ArrayIndexOf$1,
  push: ArrayPush$1
} = Array.prototype;
const TargetToReactiveRecordMap = new WeakMap();

function isUndefined$1(obj) {
  return obj === undefined;
}

function getReactiveRecord(target) {
  let reactiveRecord = TargetToReactiveRecordMap.get(target);

  if (isUndefined$1(reactiveRecord)) {
    const newRecord = create$1(null);
    reactiveRecord = newRecord;
    TargetToReactiveRecordMap.set(target, newRecord);
  }

  return reactiveRecord;
}

let currentReactiveObserver = null;
function valueMutated(target, key) {
  const reactiveRecord = TargetToReactiveRecordMap.get(target);

  if (!isUndefined$1(reactiveRecord)) {
    const reactiveObservers = reactiveRecord[key];

    if (!isUndefined$1(reactiveObservers)) {
      for (let i = 0, len = reactiveObservers.length; i < len; i += 1) {
        const ro = reactiveObservers[i];
        ro.notify();
      }
    }
  }
}
function valueObserved(target, key) {
  // We should determine if an active Observing Record is present to track mutations.
  if (currentReactiveObserver === null) {
    return;
  }

  const ro = currentReactiveObserver;
  const reactiveRecord = getReactiveRecord(target);
  let reactiveObservers = reactiveRecord[key];

  if (isUndefined$1(reactiveObservers)) {
    reactiveObservers = [];
    reactiveRecord[key] = reactiveObservers;
  } else if (reactiveObservers[0] === ro) {
    return; // perf optimization considering that most subscriptions will come from the same record
  }

  if (ArrayIndexOf$1.call(reactiveObservers, ro) === -1) {
    ro.link(reactiveObservers);
  }
}
class ReactiveObserver {
  constructor(callback) {
    this.listeners = [];
    this.callback = callback;
  }

  observe(job) {
    const inceptionReactiveRecord = currentReactiveObserver;
    currentReactiveObserver = this;
    let error;

    try {
      job();
    } catch (e) {
      error = Object(e);
    } finally {
      currentReactiveObserver = inceptionReactiveRecord;

      if (error !== undefined) {
        throw error; // eslint-disable-line no-unsafe-finally
      }
    }
  }
  /**
   * This method is responsible for disconnecting the Reactive Observer
   * from any Reactive Record that has a reference to it, to prevent future
   * notifications about previously recorded access.
   */


  reset() {
    const {
      listeners
    } = this;
    const len = listeners.length;

    if (len > 0) {
      for (let i = 0; i < len; i += 1) {
        const set = listeners[i];
        const pos = ArrayIndexOf$1.call(listeners[i], this);
        ArraySplice$1.call(set, pos, 1);
      }

      listeners.length = 0;
    }
  } // friend methods


  notify() {
    this.callback.call(undefined, this);
  }

  link(reactiveObservers) {
    ArrayPush$1.call(reactiveObservers, this); // we keep track of observing records where the observing record was added to so we can do some clean up later on

    ArrayPush$1.call(this.listeners, reactiveObservers);
  }

}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const signedComponentToMetaMap = new Map();
/**
 * INTERNAL: This function can only be invoked by compiled code. The compiler
 * will prevent this function from being imported by userland code.
 */

function registerComponent(Ctor, {
  name,
  tmpl: template
}) {
  signedComponentToMetaMap.set(Ctor, {
    name,
    template
  }); // chaining this method as a way to wrap existing
  // assignment of component constructor easily, without too much transformation

  return Ctor;
}
function getComponentRegisteredMeta(Ctor) {
  return signedComponentToMetaMap.get(Ctor);
}
function createComponent(uninitializedVm, Ctor) {
  // create the component instance
  invokeComponentConstructor(uninitializedVm, Ctor);
  const initializedVm = uninitializedVm;

  if (isUndefined(initializedVm.component)) {
    throw new ReferenceError(`Invalid construction for ${Ctor}, you must extend LightningElement.`);
  }
}
function linkComponent(vm) {
  const {
    def: {
      wire
    }
  } = vm;

  if (!isUndefined(wire)) {
    const {
      wiring
    } = Services;

    if (wiring) {
      invokeServiceHook(vm, wiring);
    }
  }
}
function getTemplateReactiveObserver(vm) {
  return new ReactiveObserver(() => {
    if (process.env.NODE_ENV !== 'production') {
      assert.invariant(!isInvokingRender, `Mutating property is not allowed during the rendering life-cycle of ${getVMBeingRendered()}.`);
      assert.invariant(!isUpdatingTemplate, `Mutating property is not allowed while updating template of ${getVMBeingRendered()}.`);
    }

    const {
      isDirty
    } = vm;

    if (isFalse$1(isDirty)) {
      markComponentAsDirty(vm);
      scheduleRehydration(vm);
    }
  });
}
function renderComponent(vm) {
  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(vm.isDirty, `${vm} is not dirty.`);
  }

  vm.tro.reset();
  const vnodes = invokeComponentRenderMethod(vm);
  vm.isDirty = false;
  vm.isScheduled = false;

  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(isArray$1(vnodes), `${vm}.render() should always return an array of vnodes instead of ${vnodes}`);
  }

  return vnodes;
}
function markComponentAsDirty(vm) {
  if (process.env.NODE_ENV !== 'production') {
    const vmBeingRendered = getVMBeingRendered();
    assert.isFalse(vm.isDirty, `markComponentAsDirty() for ${vm} should not be called when the component is already dirty.`);
    assert.isFalse(isInvokingRender, `markComponentAsDirty() for ${vm} cannot be called during rendering of ${vmBeingRendered}.`);
    assert.isFalse(isUpdatingTemplate, `markComponentAsDirty() for ${vm} cannot be called while updating template of ${vmBeingRendered}.`);
  }

  vm.isDirty = true;
}
const cmpEventListenerMap = new WeakMap();
function getWrappedComponentsListener(vm, listener) {
  if (!isFunction(listener)) {
    throw new TypeError(); // avoiding problems with non-valid listeners
  }

  let wrappedListener = cmpEventListenerMap.get(listener);

  if (isUndefined(wrappedListener)) {
    wrappedListener = function (event) {
      invokeEventListener(vm, listener, undefined, event);
    };

    cmpEventListenerMap.set(listener, wrappedListener);
  }

  return wrappedListener;
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function createObservedFieldsDescriptorMap(fields) {
  return ArrayReduce.call(fields, (acc, field) => {
    acc[field] = createObservedFieldPropertyDescriptor(field);
    return acc;
  }, {});
}

function createObservedFieldPropertyDescriptor(key) {
  return {
    get() {
      const vm = getAssociatedVM(this);
      valueObserved(this, key);
      return vm.cmpTrack[key];
    },

    set(newValue) {
      const vm = getAssociatedVM(this);

      if (newValue !== vm.cmpTrack[key]) {
        vm.cmpTrack[key] = newValue;

        if (isFalse$1(vm.isDirty)) {
          valueMutated(this, key);
        }
      }
    },

    enumerable: true,
    configurable: true
  };
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * This is a descriptor map that contains
 * all standard properties that a Custom Element can support (including AOM properties), which
 * determines what kind of capabilities the Base HTML Element and
 * Base Lightning Element should support.
 */

const HTMLElementOriginalDescriptors = create(null);
forEach.call(ElementPrototypeAriaPropertyNames, propName => {
  // Note: intentionally using our in-house getPropertyDescriptor instead of getOwnPropertyDescriptor here because
  // in IE11, some properties are on Element.prototype instead of HTMLElement, just to be sure.
  const descriptor = getPropertyDescriptor(HTMLElement.prototype, propName);

  if (!isUndefined(descriptor)) {
    HTMLElementOriginalDescriptors[propName] = descriptor;
  }
});
forEach.call(defaultDefHTMLPropertyNames, propName => {
  // Note: intentionally using our in-house getPropertyDescriptor instead of getOwnPropertyDescriptor here because
  // in IE11, id property is on Element.prototype instead of HTMLElement, and we suspect that more will fall into
  // this category, so, better to be sure.
  const descriptor = getPropertyDescriptor(HTMLElement.prototype, propName);

  if (!isUndefined(descriptor)) {
    HTMLElementOriginalDescriptors[propName] = descriptor;
  }
});

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const ShadowRootInnerHTMLSetter = getOwnPropertyDescriptor(ShadowRoot.prototype, 'innerHTML').set;
const dispatchEvent = 'EventTarget' in window ? EventTarget.prototype.dispatchEvent : Node.prototype.dispatchEvent; // IE11

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * This operation is called with a descriptor of an standard html property
 * that a Custom Element can support (including AOM properties), which
 * determines what kind of capabilities the Base Lightning Element should support. When producing the new descriptors
 * for the Base Lightning Element, it also include the reactivity bit, so the standard property is reactive.
 */

function createBridgeToElementDescriptor(propName, descriptor) {
  const {
    get,
    set,
    enumerable,
    configurable
  } = descriptor;

  if (!isFunction(get)) {
    if (process.env.NODE_ENV !== 'production') {
      assert.fail(`Detected invalid public property descriptor for HTMLElement.prototype.${propName} definition. Missing the standard getter.`);
    }

    throw new TypeError();
  }

  if (!isFunction(set)) {
    if (process.env.NODE_ENV !== 'production') {
      assert.fail(`Detected invalid public property descriptor for HTMLElement.prototype.${propName} definition. Missing the standard setter.`);
    }

    throw new TypeError();
  }

  return {
    enumerable,
    configurable,

    get() {
      const vm = getAssociatedVM(this);

      if (isBeingConstructed(vm)) {
        if (process.env.NODE_ENV !== 'production') {
          const name = vm.elm.constructor.name;
          logError(`\`${name}\` constructor can't read the value of property \`${propName}\` because the owner component hasn't set the value yet. Instead, use the \`${name}\` constructor to set a default value for the property.`, vm);
        }

        return;
      }

      valueObserved(this, propName);
      return get.call(vm.elm);
    },

    set(newValue) {
      const vm = getAssociatedVM(this);

      if (process.env.NODE_ENV !== 'production') {
        const vmBeingRendered = getVMBeingRendered();
        assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${vm}.${propName}`);
        assert.invariant(!isUpdatingTemplate, `When updating the template of ${vmBeingRendered}, one of the accessors used by the template has side effects on the state of ${vm}.${propName}`);
        assert.isFalse(isBeingConstructed(vm), `Failed to construct '${getComponentTag(vm)}': The result must not have attributes.`);
        assert.invariant(!isObject$1(newValue) || isNull(newValue), `Invalid value "${newValue}" for "${propName}" of ${vm}. Value cannot be an object, must be a primitive value.`);
      }

      if (newValue !== vm.cmpProps[propName]) {
        vm.cmpProps[propName] = newValue;

        if (isFalse$1(vm.isDirty)) {
          // perf optimization to skip this step if not in the DOM
          valueMutated(this, propName);
        }
      }

      return set.call(vm.elm, newValue);
    }

  };
}

function getLinkedElement(cmp) {
  return getAssociatedVM(cmp).elm;
}
/**
 * This class is the base class for any LWC element.
 * Some elements directly extends this class, others implement it via inheritance.
 **/


function BaseLightningElementConstructor() {
  // This should be as performant as possible, while any initialization should be done lazily
  if (isNull(vmBeingConstructed)) {
    throw new ReferenceError('Illegal constructor');
  }

  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(vmBeingConstructed.elm instanceof HTMLElement, `Component creation requires a DOM element to be associated to ${vmBeingConstructed}.`);
  }

  const vm = vmBeingConstructed;
  const {
    elm,
    mode,
    def: {
      ctor
    }
  } = vm;
  const component = this;
  vm.component = component;
  vm.tro = getTemplateReactiveObserver(vm);
  vm.oar = create(null); // interaction hooks
  // We are intentionally hiding this argument from the formal API of LWCElement because
  // we don't want folks to know about it just yet.

  if (arguments.length === 1) {
    const {
      callHook,
      setHook,
      getHook
    } = arguments[0];
    vm.callHook = callHook;
    vm.setHook = setHook;
    vm.getHook = getHook;
  } // attaching the shadowRoot


  const shadowRootOptions = {
    mode,
    delegatesFocus: !!ctor.delegatesFocus,
    '$$lwc-synthetic-mode$$': true
  };
  const cmpRoot = elm.attachShadow(shadowRootOptions); // linking elm, shadow root and component with the VM

  associateVM(component, vm);
  associateVM(cmpRoot, vm);
  associateVM(elm, vm); // VM is now initialized

  vm.cmpRoot = cmpRoot;

  if (process.env.NODE_ENV !== 'production') {
    patchComponentWithRestrictions(component);
    patchShadowRootWithRestrictions(cmpRoot, EmptyObject);
  }

  return this;
} // HTML Element - The Good Parts


BaseLightningElementConstructor.prototype = {
  constructor: BaseLightningElementConstructor,

  dispatchEvent(_event) {
    const elm = getLinkedElement(this); // Typescript does not like it when you treat the `arguments` object as an array
    // @ts-ignore type-mismatch;

    return dispatchEvent.apply(elm, arguments);
  },

  addEventListener(type, listener, options) {
    const vm = getAssociatedVM(this);

    if (process.env.NODE_ENV !== 'production') {
      const vmBeingRendered = getVMBeingRendered();
      assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${vm} by adding an event listener for "${type}".`);
      assert.invariant(!isUpdatingTemplate, `Updating the template of ${vmBeingRendered} has side effects on the state of ${vm} by adding an event listener for "${type}".`);
      assert.invariant(isFunction(listener), `Invalid second argument for this.addEventListener() in ${vm} for event "${type}". Expected an EventListener but received ${listener}.`);
    }

    const wrappedListener = getWrappedComponentsListener(vm, listener);
    vm.elm.addEventListener(type, wrappedListener, options);
  },

  removeEventListener(type, listener, options) {
    const vm = getAssociatedVM(this);
    const wrappedListener = getWrappedComponentsListener(vm, listener);
    vm.elm.removeEventListener(type, wrappedListener, options);
  },

  setAttributeNS(ns, attrName, _value) {
    const elm = getLinkedElement(this);

    if (process.env.NODE_ENV !== 'production') {
      const vm = getAssociatedVM(this);
      assert.isFalse(isBeingConstructed(vm), `Failed to construct '${getComponentTag(vm)}': The result must not have attributes.`);
    }

    unlockAttribute(elm, attrName); // Typescript does not like it when you treat the `arguments` object as an array
    // @ts-ignore type-mismatch

    elm.setAttributeNS.apply(elm, arguments);
    lockAttribute();
  },

  removeAttributeNS(ns, attrName) {
    const elm = getLinkedElement(this);
    unlockAttribute(elm, attrName); // Typescript does not like it when you treat the `arguments` object as an array
    // @ts-ignore type-mismatch

    elm.removeAttributeNS.apply(elm, arguments);
    lockAttribute();
  },

  removeAttribute(attrName) {
    const elm = getLinkedElement(this);
    unlockAttribute(elm, attrName); // Typescript does not like it when you treat the `arguments` object as an array
    // @ts-ignore type-mismatch

    elm.removeAttribute.apply(elm, arguments);
    lockAttribute();
  },

  setAttribute(attrName, _value) {
    const elm = getLinkedElement(this);

    if (process.env.NODE_ENV !== 'production') {
      const vm = getAssociatedVM(this);
      assert.isFalse(isBeingConstructed(vm), `Failed to construct '${getComponentTag(vm)}': The result must not have attributes.`);
    }

    unlockAttribute(elm, attrName); // Typescript does not like it when you treat the `arguments` object as an array
    // @ts-ignore type-mismatch

    elm.setAttribute.apply(elm, arguments);
    lockAttribute();
  },

  getAttribute(attrName) {
    const elm = getLinkedElement(this);
    unlockAttribute(elm, attrName); // Typescript does not like it when you treat the `arguments` object as an array
    // @ts-ignore type-mismatch

    const value = elm.getAttribute.apply(elm, arguments);
    lockAttribute();
    return value;
  },

  getAttributeNS(ns, attrName) {
    const elm = getLinkedElement(this);
    unlockAttribute(elm, attrName); // Typescript does not like it when you treat the `arguments` object as an array
    // @ts-ignore type-mismatch

    const value = elm.getAttributeNS.apply(elm, arguments);
    lockAttribute();
    return value;
  },

  getBoundingClientRect() {
    const elm = getLinkedElement(this);

    if (process.env.NODE_ENV !== 'production') {
      const vm = getAssociatedVM(this);
      assert.isFalse(isBeingConstructed(vm), `this.getBoundingClientRect() should not be called during the construction of the custom element for ${getComponentTag(vm)} because the element is not yet in the DOM, instead, you can use it in one of the available life-cycle hooks.`);
    }

    return elm.getBoundingClientRect();
  },

  /**
   * Returns the first element that is a descendant of node that
   * matches selectors.
   */
  // querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
  // querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null;
  querySelector(selectors) {
    const vm = getAssociatedVM(this);

    if (process.env.NODE_ENV !== 'production') {
      assert.isFalse(isBeingConstructed(vm), `this.querySelector() cannot be called during the construction of the custom element for ${getComponentTag(vm)} because no children has been added to this element yet.`);
    }

    const {
      elm
    } = vm;
    return elm.querySelector(selectors);
  },

  /**
   * Returns all element descendants of node that
   * match selectors.
   */
  // querySelectorAll<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>,
  // querySelectorAll<K extends keyof SVGElementTagNameMap>(selectors: K): NodeListOf<SVGElementTagNameMap[K]>,
  querySelectorAll(selectors) {
    const vm = getAssociatedVM(this);

    if (process.env.NODE_ENV !== 'production') {
      assert.isFalse(isBeingConstructed(vm), `this.querySelectorAll() cannot be called during the construction of the custom element for ${getComponentTag(vm)} because no children has been added to this element yet.`);
    }

    const {
      elm
    } = vm;
    return elm.querySelectorAll(selectors);
  },

  /**
   * Returns all element descendants of node that
   * match the provided tagName.
   */
  getElementsByTagName(tagNameOrWildCard) {
    const vm = getAssociatedVM(this);

    if (process.env.NODE_ENV !== 'production') {
      assert.isFalse(isBeingConstructed(vm), `this.getElementsByTagName() cannot be called during the construction of the custom element for ${getComponentTag(vm)} because no children has been added to this element yet.`);
    }

    const {
      elm
    } = vm;
    return elm.getElementsByTagName(tagNameOrWildCard);
  },

  /**
   * Returns all element descendants of node that
   * match the provide classnames.
   */
  getElementsByClassName(names) {
    const vm = getAssociatedVM(this);

    if (process.env.NODE_ENV !== 'production') {
      assert.isFalse(isBeingConstructed(vm), `this.getElementsByClassName() cannot be called during the construction of the custom element for ${getComponentTag(vm)} because no children has been added to this element yet.`);
    }

    const {
      elm
    } = vm;
    return elm.getElementsByClassName(names);
  },

  get isConnected() {
    const vm = getAssociatedVM(this);
    const {
      elm
    } = vm;
    return elm.isConnected;
  },

  get classList() {
    if (process.env.NODE_ENV !== 'production') {
      const vm = getAssociatedVM(this); // TODO [#1290]: this still fails in dev but works in production, eventually, we should just throw in all modes

      assert.isFalse(isBeingConstructed(vm), `Failed to construct ${vm}: The result must not have attributes. Adding or tampering with classname in constructor is not allowed in a web component, use connectedCallback() instead.`);
    }

    return getLinkedElement(this).classList;
  },

  get template() {
    const vm = getAssociatedVM(this);
    return vm.cmpRoot;
  },

  get shadowRoot() {
    // From within the component instance, the shadowRoot is always
    // reported as "closed". Authors should rely on this.template instead.
    return null;
  },

  render() {
    const vm = getAssociatedVM(this);
    return vm.def.template;
  },

  toString() {
    const vm = getAssociatedVM(this);
    return `[object ${vm.def.name}]`;
  }

}; // Typescript is inferring the wrong function type for this particular
// overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
// @ts-ignore type-mismatch

const baseDescriptors = ArrayReduce.call(getOwnPropertyNames(HTMLElementOriginalDescriptors), (descriptors, propName) => {
  descriptors[propName] = createBridgeToElementDescriptor(propName, HTMLElementOriginalDescriptors[propName]);
  return descriptors;
}, create(null));
defineProperties(BaseLightningElementConstructor.prototype, baseDescriptors);

if (process.env.NODE_ENV !== 'production') {
  patchLightningElementPrototypeWithRestrictions(BaseLightningElementConstructor.prototype);
}

freeze(BaseLightningElementConstructor);
seal(BaseLightningElementConstructor.prototype); // @ts-ignore

const BaseLightningElement = BaseLightningElementConstructor;

/**
 * Copyright (C) 2017 salesforce.com, inc.
 */
const {
  isArray: isArray$2
} = Array;
const {
  getPrototypeOf: getPrototypeOf$1,
  create: ObjectCreate,
  defineProperty: ObjectDefineProperty,
  defineProperties: ObjectDefineProperties,
  isExtensible,
  getOwnPropertyDescriptor: getOwnPropertyDescriptor$1,
  getOwnPropertyNames: getOwnPropertyNames$1,
  getOwnPropertySymbols,
  preventExtensions,
  hasOwnProperty: hasOwnProperty$2
} = Object;
const {
  push: ArrayPush$2,
  concat: ArrayConcat,
  map: ArrayMap$1
} = Array.prototype;
const OtS$1 = {}.toString;

function toString$1(obj) {
  if (obj && obj.toString) {
    return obj.toString();
  } else if (typeof obj === 'object') {
    return OtS$1.call(obj);
  } else {
    return obj + '';
  }
}

function isUndefined$2(obj) {
  return obj === undefined;
}

function isFunction$1(obj) {
  return typeof obj === 'function';
}

function isObject$2(obj) {
  return typeof obj === 'object';
}

const proxyToValueMap = new WeakMap();

function registerProxy(proxy, value) {
  proxyToValueMap.set(proxy, value);
}

const unwrap = replicaOrAny => proxyToValueMap.get(replicaOrAny) || replicaOrAny;

function wrapValue(membrane, value) {
  return membrane.valueIsObservable(value) ? membrane.getProxy(value) : value;
}
/**
 * Unwrap property descriptors will set value on original descriptor
 * We only need to unwrap if value is specified
 * @param descriptor external descrpitor provided to define new property on original value
 */


function unwrapDescriptor(descriptor) {
  if (hasOwnProperty$2.call(descriptor, 'value')) {
    descriptor.value = unwrap(descriptor.value);
  }

  return descriptor;
}

function lockShadowTarget(membrane, shadowTarget, originalTarget) {
  const targetKeys = ArrayConcat.call(getOwnPropertyNames$1(originalTarget), getOwnPropertySymbols(originalTarget));
  targetKeys.forEach(key => {
    let descriptor = getOwnPropertyDescriptor$1(originalTarget, key); // We do not need to wrap the descriptor if configurable
    // Because we can deal with wrapping it when user goes through
    // Get own property descriptor. There is also a chance that this descriptor
    // could change sometime in the future, so we can defer wrapping
    // until we need to

    if (!descriptor.configurable) {
      descriptor = wrapDescriptor(membrane, descriptor, wrapValue);
    }

    ObjectDefineProperty(shadowTarget, key, descriptor);
  });
  preventExtensions(shadowTarget);
}

class ReactiveProxyHandler {
  constructor(membrane, value) {
    this.originalTarget = value;
    this.membrane = membrane;
  }

  get(shadowTarget, key) {
    const {
      originalTarget,
      membrane
    } = this;
    const value = originalTarget[key];
    const {
      valueObserved
    } = membrane;
    valueObserved(originalTarget, key);
    return membrane.getProxy(value);
  }

  set(shadowTarget, key, value) {
    const {
      originalTarget,
      membrane: {
        valueMutated
      }
    } = this;
    const oldValue = originalTarget[key];

    if (oldValue !== value) {
      originalTarget[key] = value;
      valueMutated(originalTarget, key);
    } else if (key === 'length' && isArray$2(originalTarget)) {
      // fix for issue #236: push will add the new index, and by the time length
      // is updated, the internal length is already equal to the new length value
      // therefore, the oldValue is equal to the value. This is the forking logic
      // to support this use case.
      valueMutated(originalTarget, key);
    }

    return true;
  }

  deleteProperty(shadowTarget, key) {
    const {
      originalTarget,
      membrane: {
        valueMutated
      }
    } = this;
    delete originalTarget[key];
    valueMutated(originalTarget, key);
    return true;
  }

  apply(shadowTarget, thisArg, argArray) {
    /* No op */
  }

  construct(target, argArray, newTarget) {
    /* No op */
  }

  has(shadowTarget, key) {
    const {
      originalTarget,
      membrane: {
        valueObserved
      }
    } = this;
    valueObserved(originalTarget, key);
    return key in originalTarget;
  }

  ownKeys(shadowTarget) {
    const {
      originalTarget
    } = this;
    return ArrayConcat.call(getOwnPropertyNames$1(originalTarget), getOwnPropertySymbols(originalTarget));
  }

  isExtensible(shadowTarget) {
    const shadowIsExtensible = isExtensible(shadowTarget);

    if (!shadowIsExtensible) {
      return shadowIsExtensible;
    }

    const {
      originalTarget,
      membrane
    } = this;
    const targetIsExtensible = isExtensible(originalTarget);

    if (!targetIsExtensible) {
      lockShadowTarget(membrane, shadowTarget, originalTarget);
    }

    return targetIsExtensible;
  }

  setPrototypeOf(shadowTarget, prototype) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Invalid setPrototypeOf invocation for reactive proxy ${toString$1(this.originalTarget)}. Prototype of reactive objects cannot be changed.`);
    }
  }

  getPrototypeOf(shadowTarget) {
    const {
      originalTarget
    } = this;
    return getPrototypeOf$1(originalTarget);
  }

  getOwnPropertyDescriptor(shadowTarget, key) {
    const {
      originalTarget,
      membrane
    } = this;
    const {
      valueObserved
    } = this.membrane; // keys looked up via hasOwnProperty need to be reactive

    valueObserved(originalTarget, key);
    let desc = getOwnPropertyDescriptor$1(originalTarget, key);

    if (isUndefined$2(desc)) {
      return desc;
    }

    const shadowDescriptor = getOwnPropertyDescriptor$1(shadowTarget, key);

    if (!isUndefined$2(shadowDescriptor)) {
      return shadowDescriptor;
    } // Note: by accessing the descriptor, the key is marked as observed
    // but access to the value, setter or getter (if available) cannot observe
    // mutations, just like regular methods, in which case we just do nothing.


    desc = wrapDescriptor(membrane, desc, wrapValue);

    if (!desc.configurable) {
      // If descriptor from original target is not configurable,
      // We must copy the wrapped descriptor over to the shadow target.
      // Otherwise, proxy will throw an invariant error.
      // This is our last chance to lock the value.
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor#Invariants
      ObjectDefineProperty(shadowTarget, key, desc);
    }

    return desc;
  }

  preventExtensions(shadowTarget) {
    const {
      originalTarget,
      membrane
    } = this;
    lockShadowTarget(membrane, shadowTarget, originalTarget);
    preventExtensions(originalTarget);
    return true;
  }

  defineProperty(shadowTarget, key, descriptor) {
    const {
      originalTarget,
      membrane
    } = this;
    const {
      valueMutated
    } = membrane;
    const {
      configurable
    } = descriptor; // We have to check for value in descriptor
    // because Object.freeze(proxy) calls this method
    // with only { configurable: false, writeable: false }
    // Additionally, method will only be called with writeable:false
    // if the descriptor has a value, as opposed to getter/setter
    // So we can just check if writable is present and then see if
    // value is present. This eliminates getter and setter descriptors

    if (hasOwnProperty$2.call(descriptor, 'writable') && !hasOwnProperty$2.call(descriptor, 'value')) {
      const originalDescriptor = getOwnPropertyDescriptor$1(originalTarget, key);
      descriptor.value = originalDescriptor.value;
    }

    ObjectDefineProperty(originalTarget, key, unwrapDescriptor(descriptor));

    if (configurable === false) {
      ObjectDefineProperty(shadowTarget, key, wrapDescriptor(membrane, descriptor, wrapValue));
    }

    valueMutated(originalTarget, key);
    return true;
  }

}

function wrapReadOnlyValue(membrane, value) {
  return membrane.valueIsObservable(value) ? membrane.getReadOnlyProxy(value) : value;
}

class ReadOnlyHandler {
  constructor(membrane, value) {
    this.originalTarget = value;
    this.membrane = membrane;
  }

  get(shadowTarget, key) {
    const {
      membrane,
      originalTarget
    } = this;
    const value = originalTarget[key];
    const {
      valueObserved
    } = membrane;
    valueObserved(originalTarget, key);
    return membrane.getReadOnlyProxy(value);
  }

  set(shadowTarget, key, value) {
    if (process.env.NODE_ENV !== 'production') {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid mutation: Cannot set "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`);
    }

    return false;
  }

  deleteProperty(shadowTarget, key) {
    if (process.env.NODE_ENV !== 'production') {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid mutation: Cannot delete "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`);
    }

    return false;
  }

  apply(shadowTarget, thisArg, argArray) {
    /* No op */
  }

  construct(target, argArray, newTarget) {
    /* No op */
  }

  has(shadowTarget, key) {
    const {
      originalTarget,
      membrane: {
        valueObserved
      }
    } = this;
    valueObserved(originalTarget, key);
    return key in originalTarget;
  }

  ownKeys(shadowTarget) {
    const {
      originalTarget
    } = this;
    return ArrayConcat.call(getOwnPropertyNames$1(originalTarget), getOwnPropertySymbols(originalTarget));
  }

  setPrototypeOf(shadowTarget, prototype) {
    if (process.env.NODE_ENV !== 'production') {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid prototype mutation: Cannot set prototype on "${originalTarget}". "${originalTarget}" prototype is read-only.`);
    }
  }

  getOwnPropertyDescriptor(shadowTarget, key) {
    const {
      originalTarget,
      membrane
    } = this;
    const {
      valueObserved
    } = membrane; // keys looked up via hasOwnProperty need to be reactive

    valueObserved(originalTarget, key);
    let desc = getOwnPropertyDescriptor$1(originalTarget, key);

    if (isUndefined$2(desc)) {
      return desc;
    }

    const shadowDescriptor = getOwnPropertyDescriptor$1(shadowTarget, key);

    if (!isUndefined$2(shadowDescriptor)) {
      return shadowDescriptor;
    } // Note: by accessing the descriptor, the key is marked as observed
    // but access to the value or getter (if available) cannot be observed,
    // just like regular methods, in which case we just do nothing.


    desc = wrapDescriptor(membrane, desc, wrapReadOnlyValue);

    if (hasOwnProperty$2.call(desc, 'set')) {
      desc.set = undefined; // readOnly membrane does not allow setters
    }

    if (!desc.configurable) {
      // If descriptor from original target is not configurable,
      // We must copy the wrapped descriptor over to the shadow target.
      // Otherwise, proxy will throw an invariant error.
      // This is our last chance to lock the value.
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor#Invariants
      ObjectDefineProperty(shadowTarget, key, desc);
    }

    return desc;
  }

  preventExtensions(shadowTarget) {
    if (process.env.NODE_ENV !== 'production') {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid mutation: Cannot preventExtensions on ${originalTarget}". "${originalTarget} is read-only.`);
    }

    return false;
  }

  defineProperty(shadowTarget, key, descriptor) {
    if (process.env.NODE_ENV !== 'production') {
      const {
        originalTarget
      } = this;
      throw new Error(`Invalid mutation: Cannot defineProperty "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`);
    }

    return false;
  }

}

function extract(objectOrArray) {
  if (isArray$2(objectOrArray)) {
    return objectOrArray.map(item => {
      const original = unwrap(item);

      if (original !== item) {
        return extract(original);
      }

      return item;
    });
  }

  const obj = ObjectCreate(getPrototypeOf$1(objectOrArray));
  const names = getOwnPropertyNames$1(objectOrArray);
  return ArrayConcat.call(names, getOwnPropertySymbols(objectOrArray)).reduce((seed, key) => {
    const item = objectOrArray[key];
    const original = unwrap(item);

    if (original !== item) {
      seed[key] = extract(original);
    } else {
      seed[key] = item;
    }

    return seed;
  }, obj);
}

const formatter = {
  header: plainOrProxy => {
    const originalTarget = unwrap(plainOrProxy); // if originalTarget is falsy or not unwrappable, exit

    if (!originalTarget || originalTarget === plainOrProxy) {
      return null;
    }

    const obj = extract(plainOrProxy);
    return ['object', {
      object: obj
    }];
  },
  hasBody: () => {
    return false;
  },
  body: () => {
    return null;
  }
}; // Inspired from paulmillr/es6-shim
// https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js#L176-L185

function getGlobal() {
  // the only reliable means to get the global object is `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }

  if (typeof self !== 'undefined') {
    return self;
  }

  if (typeof window !== 'undefined') {
    return window;
  }

  if (typeof global !== 'undefined') {
    return global;
  } // Gracefully degrade if not able to locate the global object


  return {};
}

function init() {
  if (process.env.NODE_ENV === 'production') {
    // this method should never leak to prod
    throw new ReferenceError();
  }

  const global = getGlobal(); // Custom Formatter for Dev Tools. To enable this, open Chrome Dev Tools
  //  - Go to Settings,
  //  - Under console, select "Enable custom formatters"
  // For more information, https://docs.google.com/document/d/1FTascZXT9cxfetuPRT2eXPQKXui4nWFivUnS_335T3U/preview

  const devtoolsFormatters = global.devtoolsFormatters || [];
  ArrayPush$2.call(devtoolsFormatters, formatter);
  global.devtoolsFormatters = devtoolsFormatters;
}

if (process.env.NODE_ENV !== 'production') {
  init();
}

function createShadowTarget(value) {
  let shadowTarget = undefined;

  if (isArray$2(value)) {
    shadowTarget = [];
  } else if (isObject$2(value)) {
    shadowTarget = {};
  }

  return shadowTarget;
}

const ObjectDotPrototype = Object.prototype;

function defaultValueIsObservable(value) {
  // intentionally checking for null
  if (value === null) {
    return false;
  } // treat all non-object types, including undefined, as non-observable values


  if (typeof value !== 'object') {
    return false;
  }

  if (isArray$2(value)) {
    return true;
  }

  const proto = getPrototypeOf$1(value);
  return proto === ObjectDotPrototype || proto === null || getPrototypeOf$1(proto) === null;
}

const defaultValueObserved = (obj, key) => {
  /* do nothing */
};

const defaultValueMutated = (obj, key) => {
  /* do nothing */
};

const defaultValueDistortion = value => value;

function wrapDescriptor(membrane, descriptor, getValue) {
  const {
    set,
    get
  } = descriptor;

  if (hasOwnProperty$2.call(descriptor, 'value')) {
    descriptor.value = getValue(membrane, descriptor.value);
  } else {
    if (!isUndefined$2(get)) {
      descriptor.get = function () {
        // invoking the original getter with the original target
        return getValue(membrane, get.call(unwrap(this)));
      };
    }

    if (!isUndefined$2(set)) {
      descriptor.set = function (value) {
        // At this point we don't have a clear indication of whether
        // or not a valid mutation will occur, we don't have the key,
        // and we are not sure why and how they are invoking this setter.
        // Nevertheless we preserve the original semantics by invoking the
        // original setter with the original target and the unwrapped value
        set.call(unwrap(this), membrane.unwrapProxy(value));
      };
    }
  }

  return descriptor;
}

class ReactiveMembrane {
  constructor(options) {
    this.valueDistortion = defaultValueDistortion;
    this.valueMutated = defaultValueMutated;
    this.valueObserved = defaultValueObserved;
    this.valueIsObservable = defaultValueIsObservable;
    this.objectGraph = new WeakMap();

    if (!isUndefined$2(options)) {
      const {
        valueDistortion,
        valueMutated,
        valueObserved,
        valueIsObservable
      } = options;
      this.valueDistortion = isFunction$1(valueDistortion) ? valueDistortion : defaultValueDistortion;
      this.valueMutated = isFunction$1(valueMutated) ? valueMutated : defaultValueMutated;
      this.valueObserved = isFunction$1(valueObserved) ? valueObserved : defaultValueObserved;
      this.valueIsObservable = isFunction$1(valueIsObservable) ? valueIsObservable : defaultValueIsObservable;
    }
  }

  getProxy(value) {
    const unwrappedValue = unwrap(value);
    const distorted = this.valueDistortion(unwrappedValue);

    if (this.valueIsObservable(distorted)) {
      const o = this.getReactiveState(unwrappedValue, distorted); // when trying to extract the writable version of a readonly
      // we return the readonly.

      return o.readOnly === value ? value : o.reactive;
    }

    return distorted;
  }

  getReadOnlyProxy(value) {
    value = unwrap(value);
    const distorted = this.valueDistortion(value);

    if (this.valueIsObservable(distorted)) {
      return this.getReactiveState(value, distorted).readOnly;
    }

    return distorted;
  }

  unwrapProxy(p) {
    return unwrap(p);
  }

  getReactiveState(value, distortedValue) {
    const {
      objectGraph
    } = this;
    let reactiveState = objectGraph.get(distortedValue);

    if (reactiveState) {
      return reactiveState;
    }

    const membrane = this;
    reactiveState = {
      get reactive() {
        const reactiveHandler = new ReactiveProxyHandler(membrane, distortedValue); // caching the reactive proxy after the first time it is accessed

        const proxy = new Proxy(createShadowTarget(distortedValue), reactiveHandler);
        registerProxy(proxy, value);
        ObjectDefineProperty(this, 'reactive', {
          value: proxy
        });
        return proxy;
      },

      get readOnly() {
        const readOnlyHandler = new ReadOnlyHandler(membrane, distortedValue); // caching the readOnly proxy after the first time it is accessed

        const proxy = new Proxy(createShadowTarget(distortedValue), readOnlyHandler);
        registerProxy(proxy, value);
        ObjectDefineProperty(this, 'readOnly', {
          value: proxy
        });
        return proxy;
      }

    };
    objectGraph.set(distortedValue, reactiveState);
    return reactiveState;
  }

}
/** version: 0.26.0 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function valueDistortion(value) {
  return value;
}

const reactiveMembrane = new ReactiveMembrane({
  valueObserved,
  valueMutated,
  valueDistortion
});
/**
 * EXPERIMENTAL: This function implements an unwrap mechanism that
 * works for observable membrane objects. This API is subject to
 * change or being removed.
 */

const unwrap$1 = function (value) {
  const unwrapped = reactiveMembrane.unwrapProxy(value);

  if (unwrapped !== value) {
    // if value is a proxy, unwrap to access original value and apply distortion
    return valueDistortion(unwrapped);
  }

  return value;
};

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// from the element instance, and get the value or set a new value on the component.
// This means that across different elements, similar names can get the exact same
// descriptor, so we can cache them:

const cachedGetterByKey = create(null);
const cachedSetterByKey = create(null);

function createGetter(key) {
  let fn = cachedGetterByKey[key];

  if (isUndefined(fn)) {
    fn = cachedGetterByKey[key] = function () {
      const vm = getAssociatedVM(this);
      const {
        getHook
      } = vm;
      return getHook(vm.component, key);
    };
  }

  return fn;
}

function createSetter(key) {
  let fn = cachedSetterByKey[key];

  if (isUndefined(fn)) {
    fn = cachedSetterByKey[key] = function (newValue) {
      const vm = getAssociatedVM(this);
      const {
        setHook
      } = vm;
      newValue = reactiveMembrane.getReadOnlyProxy(newValue);
      setHook(vm.component, key, newValue);
    };
  }

  return fn;
}

function createMethodCaller(methodName) {
  return function () {
    const vm = getAssociatedVM(this);
    const {
      callHook,
      component
    } = vm;
    const fn = component[methodName];
    return callHook(vm.component, fn, ArraySlice$1.call(arguments));
  };
}

function HTMLBridgeElementFactory(SuperClass, props, methods) {
  let HTMLBridgeElement;
  /**
   * Modern browsers will have all Native Constructors as regular Classes
   * and must be instantiated with the new keyword. In older browsers,
   * specifically IE11, those are objects with a prototype property defined,
   * since they are not supposed to be extended or instantiated with the
   * new keyword. This forking logic supports both cases, specifically because
   * wc.ts relies on the construction path of the bridges to create new
   * fully qualifying web components.
   */

  if (isFunction(SuperClass)) {
    HTMLBridgeElement = class extends SuperClass {};
  } else {
    HTMLBridgeElement = function () {
      // Bridge classes are not supposed to be instantiated directly in
      // browsers that do not support web components.
      throw new TypeError('Illegal constructor');
    }; // prototype inheritance dance


    setPrototypeOf(HTMLBridgeElement, SuperClass);
    setPrototypeOf(HTMLBridgeElement.prototype, SuperClass.prototype);
    defineProperty(HTMLBridgeElement.prototype, 'constructor', {
      writable: true,
      configurable: true,
      value: HTMLBridgeElement
    });
  }

  const descriptors = create(null); // expose getters and setters for each public props on the new Element Bridge

  for (let i = 0, len = props.length; i < len; i += 1) {
    const propName = props[i];
    descriptors[propName] = {
      get: createGetter(propName),
      set: createSetter(propName),
      enumerable: true,
      configurable: true
    };
  } // expose public methods as props on the new Element Bridge


  for (let i = 0, len = methods.length; i < len; i += 1) {
    const methodName = methods[i];
    descriptors[methodName] = {
      value: createMethodCaller(methodName),
      writable: true,
      configurable: true
    };
  }

  defineProperties(HTMLBridgeElement.prototype, descriptors);
  return HTMLBridgeElement;
}
const BaseBridgeElement = HTMLBridgeElementFactory(HTMLElement, getOwnPropertyNames(HTMLElementOriginalDescriptors), []);
freeze(BaseBridgeElement);
seal(BaseBridgeElement.prototype);

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function track(target, prop, descriptor) {
  if (arguments.length === 1) {
    return reactiveMembrane.getProxy(target);
  }

  if (process.env.NODE_ENV !== 'production') {
    if (arguments.length !== 3) {
      assert.fail(`@track decorator can only be used with one argument to return a trackable object, or as a decorator function.`);
    }

    if (!isUndefined(descriptor)) {
      const {
        get,
        set,
        configurable,
        writable
      } = descriptor;
      assert.isTrue(!get && !set, `Compiler Error: A @track decorator can only be applied to a public field.`);
      assert.isTrue(configurable !== false, `Compiler Error: A @track decorator can only be applied to a configurable property.`);
      assert.isTrue(writable !== false, `Compiler Error: A @track decorator can only be applied to a writable property.`);
    }
  }

  return createTrackedPropertyDescriptor(target, prop, isUndefined(descriptor) ? true : descriptor.enumerable === true);
}
function createTrackedPropertyDescriptor(Ctor, key, enumerable) {
  return {
    get() {
      const vm = getAssociatedVM(this);
      valueObserved(this, key);
      return vm.cmpTrack[key];
    },

    set(newValue) {
      const vm = getAssociatedVM(this);

      if (process.env.NODE_ENV !== 'production') {
        const vmBeingRendered = getVMBeingRendered();
        assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${vm}.${toString(key)}`);
        assert.invariant(!isUpdatingTemplate, `Updating the template of ${vmBeingRendered} has side effects on the state of ${vm}.${toString(key)}`);
      }

      const reactiveOrAnyValue = reactiveMembrane.getProxy(newValue);

      if (reactiveOrAnyValue !== vm.cmpTrack[key]) {
        vm.cmpTrack[key] = reactiveOrAnyValue;

        if (isFalse$1(vm.isDirty)) {
          // perf optimization to skip this step if the track property is on a component that is already dirty
          valueMutated(this, key);
        }
      }
    },

    enumerable,
    configurable: true
  };
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function wireDecorator(target, prop, descriptor) {
  if (process.env.NODE_ENV !== 'production') {
    if (!isUndefined(descriptor)) {
      const {
        get,
        set,
        configurable,
        writable
      } = descriptor;
      assert.isTrue(!get && !set, `Compiler Error: A @wire decorator can only be applied to a public field.`);
      assert.isTrue(configurable !== false, `Compiler Error: A @wire decorator can only be applied to a configurable property.`);
      assert.isTrue(writable !== false, `Compiler Error: A @wire decorator can only be applied to a writable property.`);
    }
  }

  return createTrackedPropertyDescriptor(target, prop, isObject$1(descriptor) ? descriptor.enumerable === true : true);
}
/**
 * @wire decorator to wire fields and methods to a wire adapter in
 * LWC Components. This function implements the internals of this
 * decorator.
 */


function wire(_adapter, _config) {
  const len = arguments.length;

  if (len > 0 && len < 3) {
    return wireDecorator;
  } else {
    if (process.env.NODE_ENV !== 'production') {
      assert.fail('@wire(adapter, config?) may only be used as a decorator.');
    }

    throw new TypeError();
  }
}

/**
 * Copyright (C) 2018 salesforce.com, inc.
 */

/**
 * Copyright (C) 2018 salesforce.com, inc.
 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const {
  assign: assign$1,
  create: create$2,
  defineProperties: defineProperties$1,
  defineProperty: defineProperty$1,
  freeze: freeze$1,
  getOwnPropertyDescriptor: getOwnPropertyDescriptor$2,
  getOwnPropertyNames: getOwnPropertyNames$2,
  getPrototypeOf: getPrototypeOf$2,
  hasOwnProperty: hasOwnProperty$3,
  keys: keys$1,
  seal: seal$1,
  setPrototypeOf: setPrototypeOf$1
} = Object;

function isUndefined$3(obj) {
  return obj === undefined;
}

function isTrue$1$1(obj) {
  return obj === true;
}

function isFalse$1$1(obj) {
  return obj === false;
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/*
 * In IE11, symbols are expensive.
 * Due to the nature of the symbol polyfill. This method abstract the
 * creation of symbols, so we can fallback to string when native symbols
 * are not supported. Note that we can't use typeof since it will fail when transpiling.
 */


const hasNativeSymbolsSupport$1 = Symbol('x').toString() === 'Symbol(x)';
/** version: 1.3.2 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
// Cached reference to globalThis

let _globalThis;

if (typeof globalThis === 'object') {
  _globalThis = globalThis;
}

function getGlobalThis() {
  if (typeof _globalThis === 'object') {
    return _globalThis;
  }

  try {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Object.prototype, '__magic__', {
      get: function () {
        return this;
      },
      configurable: true
    }); // @ts-ignore
    // __magic__ is undefined in Safari 10 and IE10 and older.
    // eslint-disable-next-line no-undef

    _globalThis = __magic__; // @ts-ignore

    delete Object.prototype.__magic__;
  } catch (ex) {// In IE8, Object.defineProperty only works on DOM objects.
  } finally {
    // If the magic above fails for some reason we assume that we are in a
    // legacy browser. Assume `window` exists in this case.
    if (typeof _globalThis === 'undefined') {
      _globalThis = window;
    }
  }

  return _globalThis;
}
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */


const _globalThis$1 = getGlobalThis();

if (!_globalThis$1.lwcRuntimeFlags) {
  Object.defineProperty(_globalThis$1, 'lwcRuntimeFlags', {
    value: create$2(null)
  });
}

const runtimeFlags = _globalThis$1.lwcRuntimeFlags; // This function is not supported for use within components and is meant for
// configuring runtime feature flags during app initialization.

function setFeatureFlag(name, value) {
  const isBoolean = isTrue$1$1(value) || isFalse$1$1(value);

  if (!isBoolean) {
    const message = `Failed to set the value "${value}" for the runtime feature flag "${name}". Runtime feature flags can only be set to a boolean value.`;

    if (process.env.NODE_ENV !== 'production') {
      throw new TypeError(message);
    } else {
      // eslint-disable-next-line no-console
      console.error(message);
      return;
    }
  }

  if (isUndefined$3(featureFlagLookup[name])) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to set the value "${value}" for the runtime feature flag "${name}" because it is undefined. Possible reasons are that 1) it was misspelled or 2) it was removed from the @lwc/features package.`);
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    // Allow the same flag to be set more than once outside of production to enable testing
    runtimeFlags[name] = value;
  } else {
    // Disallow the same flag to be set more than once in production
    const runtimeValue = runtimeFlags[name];

    if (!isUndefined$3(runtimeValue)) {
      // eslint-disable-next-line no-console
      console.error(`Failed to set the value "${value}" for the runtime feature flag "${name}". "${name}" has already been set with the value "${runtimeValue}".`);
      return;
    }

    Object.defineProperty(runtimeFlags, name, {
      value
    });
  }
} // This function is exposed to components to facilitate testing so we add a
// check to make sure it is not invoked in production.


function setFeatureFlagForTest(name, value) {
  if (process.env.NODE_ENV !== 'production') {
    return setFeatureFlag(name, value);
  }
}

const featureFlagLookup = {
  ENABLE_REACTIVE_SETTER: null,
  // Flags to toggle on/off the enforcement of shadow dom semantic in element/node outside lwc boundary when using synthetic shadow.
  ENABLE_ELEMENT_PATCH: null,
  ENABLE_NODE_LIST_PATCH: null,
  ENABLE_HTML_COLLECTIONS_PATCH: null,
  ENABLE_NODE_PATCH: null
};
/** version: 1.3.2 */

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * @api decorator to mark public fields and public methods in
 * LWC Components. This function implements the internals of this
 * decorator.
 */

function api$1(target, propName, descriptor) {
  if (process.env.NODE_ENV !== 'production') {
    if (arguments.length !== 3) {
      assert.fail(`@api decorator can only be used as a decorator function.`);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(!descriptor || isFunction(descriptor.get) || isFunction(descriptor.set), `Invalid property ${toString(propName)} definition in ${target}, it cannot be a prototype definition if it is a public property. Instead use the constructor to define it.`);

    if (isObject$1(descriptor) && isFunction(descriptor.set)) {
      assert.isTrue(isObject$1(descriptor) && isFunction(descriptor.get), `Missing getter for property ${toString(propName)} decorated with @api in ${target}. You cannot have a setter without the corresponding getter.`);
    }
  }

  const meta = getDecoratorsRegisteredMeta(target); // initializing getters and setters for each public prop on the target prototype

  if (isObject$1(descriptor) && (isFunction(descriptor.get) || isFunction(descriptor.set))) {
    // if it is configured as an accessor it must have a descriptor
    // @ts-ignore it must always be set before calling this method
    meta.props[propName].config = isFunction(descriptor.set) ? 3 : 1;
    return createPublicAccessorDescriptor(target, propName, descriptor);
  } else {
    // @ts-ignore it must always be set before calling this method
    meta.props[propName].config = 0;
    return createPublicPropertyDescriptor(target, propName, descriptor);
  }
}

function createPublicPropertyDescriptor(proto, key, descriptor) {
  return {
    get() {
      const vm = getAssociatedVM(this);

      if (isBeingConstructed(vm)) {
        if (process.env.NODE_ENV !== 'production') {
          const name = vm.elm.constructor.name;
          logError(`\`${name}\` constructor can’t read the value of property \`${toString(key)}\` because the owner component hasn’t set the value yet. Instead, use the \`${name}\` constructor to set a default value for the property.`, vm);
        }

        return;
      }

      valueObserved(this, key);
      return vm.cmpProps[key];
    },

    set(newValue) {
      const vm = getAssociatedVM(this);

      if (process.env.NODE_ENV !== 'production') {
        const vmBeingRendered = getVMBeingRendered();
        assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${vm}.${toString(key)}`);
        assert.invariant(!isUpdatingTemplate, `Updating the template of ${vmBeingRendered} has side effects on the state of ${vm}.${toString(key)}`);
      }

      vm.cmpProps[key] = newValue; // avoid notification of observability if the instance is already dirty

      if (isFalse$1(vm.isDirty)) {
        // perf optimization to skip this step if the component is dirty already.
        valueMutated(this, key);
      }
    },

    enumerable: isUndefined(descriptor) ? true : descriptor.enumerable
  };
}

class AccessorReactiveObserver extends ReactiveObserver {
  constructor(vm, set) {
    super(() => {
      if (isFalse$1(this.debouncing)) {
        this.debouncing = true;
        addCallbackToNextTick(() => {
          if (isTrue$1(this.debouncing)) {
            const {
              value
            } = this;
            const {
              isDirty: dirtyStateBeforeSetterCall,
              component,
              idx
            } = vm;
            set.call(component, value); // de-bouncing after the call to the original setter to prevent
            // infinity loop if the setter itself is mutating things that
            // were accessed during the previous invocation.

            this.debouncing = false;

            if (isTrue$1(vm.isDirty) && isFalse$1(dirtyStateBeforeSetterCall) && idx > 0) {
              // immediate rehydration due to a setter driven mutation, otherwise
              // the component will get rendered on the second tick, which it is not
              // desirable.
              rerenderVM(vm);
            }
          }
        });
      }
    });
    this.debouncing = false;
  }

  reset(value) {
    super.reset();
    this.debouncing = false;

    if (arguments.length > 0) {
      this.value = value;
    }
  }

}

function createPublicAccessorDescriptor(Ctor, key, descriptor) {
  const {
    get,
    set,
    enumerable
  } = descriptor;

  if (!isFunction(get)) {
    if (process.env.NODE_ENV !== 'production') {
      assert.fail(`Invalid attempt to create public property descriptor ${toString(key)} in ${Ctor}. It is missing the getter declaration with @api get ${toString(key)}() {} syntax.`);
    }

    throw new TypeError();
  }

  return {
    get() {
      if (process.env.NODE_ENV !== 'production') {
        // Assert that the this value is an actual Component with an associated VM.
        getAssociatedVM(this);
      }

      return get.call(this);
    },

    set(newValue) {
      const vm = getAssociatedVM(this);

      if (process.env.NODE_ENV !== 'production') {
        const vmBeingRendered = getVMBeingRendered();
        assert.invariant(!isInvokingRender, `${vmBeingRendered}.render() method has side effects on the state of ${vm}.${toString(key)}`);
        assert.invariant(!isUpdatingTemplate, `Updating the template of ${vmBeingRendered} has side effects on the state of ${vm}.${toString(key)}`);
      }

      if (set) {
        if (runtimeFlags.ENABLE_REACTIVE_SETTER) {
          let ro = vm.oar[key];

          if (isUndefined(ro)) {
            ro = vm.oar[key] = new AccessorReactiveObserver(vm, set);
          } // every time we invoke this setter from outside (through this wrapper setter)
          // we should reset the value and then debounce just in case there is a pending
          // invocation the next tick that is not longer relevant since the value is changing
          // from outside.


          ro.reset(newValue);
          ro.observe(() => {
            set.call(this, newValue);
          });
        } else {
          set.call(this, newValue);
        }
      } else if (process.env.NODE_ENV !== 'production') {
        assert.fail(`Invalid attempt to set a new value for property ${toString(key)} of ${vm} that does not has a setter decorated with @api.`);
      }
    },

    enumerable
  };
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * EXPERIMENTAL: This function allows for the registration of "services" in
 * LWC by exposing hooks into the component life-cycle. This API is subject
 * to change or being removed.
 */

function decorate(Ctor, decorators) {
  // intentionally comparing decorators with null and undefined
  if (!isFunction(Ctor) || decorators == null) {
    throw new TypeError();
  }

  const props = getOwnPropertyNames(decorators); // intentionally allowing decoration of classes only for now

  const target = Ctor.prototype;

  for (let i = 0, len = props.length; i < len; i += 1) {
    const propName = props[i];
    const decorator = decorators[propName];

    if (!isFunction(decorator)) {
      throw new TypeError();
    }

    const originalDescriptor = getOwnPropertyDescriptor(target, propName);
    const descriptor = decorator(Ctor, propName, originalDescriptor);

    if (!isUndefined(descriptor)) {
      defineProperty(target, propName, descriptor);
    }
  }

  return Ctor; // chaining
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const signedDecoratorToMetaMap = new Map();
/**
 * INTERNAL: This function can only be invoked by compiled code. The compiler
 * will prevent this function from being imported by userland code.
 */

function registerDecorators(Ctor, meta) {
  const decoratorMap = create(null);
  const props = getPublicPropertiesHash(Ctor, meta.publicProps);
  const methods = getPublicMethodsHash(Ctor, meta.publicMethods);
  const wire$1 = getWireHash(Ctor, meta.wire);
  const track$1 = getTrackHash(Ctor, meta.track);
  const fields = meta.fields;
  signedDecoratorToMetaMap.set(Ctor, {
    props,
    methods,
    wire: wire$1,
    track: track$1,
    fields
  });

  for (const propName in props) {
    decoratorMap[propName] = api$1;
  }

  if (wire$1) {
    for (const propName in wire$1) {
      const wireDef = wire$1[propName];

      if (wireDef.method) {
        // for decorated methods we need to do nothing
        continue;
      }

      decoratorMap[propName] = wire(wireDef.adapter, wireDef.params);
    }
  }

  if (track$1) {
    for (const propName in track$1) {
      decoratorMap[propName] = track;
    }
  }

  decorate(Ctor, decoratorMap);
  return Ctor;
}
function getDecoratorsRegisteredMeta(Ctor) {
  return signedDecoratorToMetaMap.get(Ctor);
}

function getTrackHash(target, track) {
  if (isUndefined(track) || getOwnPropertyNames(track).length === 0) {
    return EmptyObject;
  } // TODO [#1302]: check that anything in `track` is correctly defined in the prototype


  return assign(create(null), track);
}

function getWireHash(target, wire) {
  if (isUndefined(wire) || getOwnPropertyNames(wire).length === 0) {
    return;
  } // TODO [#1302]: check that anything in `wire` is correctly defined in the prototype


  return assign(create(null), wire);
}

function getPublicPropertiesHash(target, props) {
  if (isUndefined(props) || getOwnPropertyNames(props).length === 0) {
    return EmptyObject;
  }

  return getOwnPropertyNames(props).reduce((propsHash, propName) => {
    const attr = getAttrNameFromPropName(propName);
    propsHash[propName] = assign({
      config: 0,
      type: 'any',
      attr
    }, props[propName]);
    return propsHash;
  }, create(null));
}

function getPublicMethodsHash(target, publicMethods) {
  if (isUndefined(publicMethods) || publicMethods.length === 0) {
    return EmptyObject;
  }

  return publicMethods.reduce((methodsHash, methodName) => {
    if (process.env.NODE_ENV !== 'production') {
      assert.isTrue(isFunction(target.prototype[methodName]), `Component "${target.name}" should have a method \`${methodName}\` instead of ${target.prototype[methodName]}.`);
    }

    methodsHash[methodName] = target.prototype[methodName];
    return methodsHash;
  }, create(null));
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const CtorToDefMap = new WeakMap();

function getCtorProto(Ctor, subclassComponentName) {
  let proto = getPrototypeOf(Ctor);

  if (isNull(proto)) {
    throw new ReferenceError(`Invalid prototype chain for ${subclassComponentName}, you must extend LightningElement.`);
  } // covering the cases where the ref is circular in AMD


  if (isCircularModuleDependency(proto)) {
    const p = resolveCircularModuleDependency(proto);

    if (process.env.NODE_ENV !== 'production') {
      if (isNull(p)) {
        throw new ReferenceError(`Circular module dependency for ${subclassComponentName}, must resolve to a constructor that extends LightningElement.`);
      }
    } // escape hatch for Locker and other abstractions to provide their own base class instead
    // of our Base class without having to leak it to user-land. If the circular function returns
    // itself, that's the signal that we have hit the end of the proto chain, which must always
    // be base.


    proto = p === proto ? BaseLightningElement : p;
  }

  return proto;
}

function createComponentDef(Ctor, meta, subclassComponentName) {
  if (process.env.NODE_ENV !== 'production') {
    // local to dev block
    const ctorName = Ctor.name; // Removing the following assert until https://bugs.webkit.org/show_bug.cgi?id=190140 is fixed.
    // assert.isTrue(ctorName && isString(ctorName), `${toString(Ctor)} should have a "name" property with string value, but found ${ctorName}.`);

    assert.isTrue(Ctor.constructor, `Missing ${ctorName}.constructor, ${ctorName} should have a "constructor" property.`);
  }

  const {
    name
  } = meta;
  let {
    template
  } = meta;
  const decoratorsMeta = getDecoratorsRegisteredMeta(Ctor);
  let props = {};
  let methods = {};
  let wire;
  let track = {};
  let fields;

  if (!isUndefined(decoratorsMeta)) {
    props = decoratorsMeta.props;
    methods = decoratorsMeta.methods;
    wire = decoratorsMeta.wire;
    track = decoratorsMeta.track;
    fields = decoratorsMeta.fields;
  }

  const proto = Ctor.prototype;
  let {
    connectedCallback,
    disconnectedCallback,
    renderedCallback,
    errorCallback,
    render
  } = proto;
  const superProto = getCtorProto(Ctor, subclassComponentName);
  const superDef = superProto !== BaseLightningElement ? getComponentDef(superProto, subclassComponentName) : null;
  const SuperBridge = isNull(superDef) ? BaseBridgeElement : superDef.bridge;
  const bridge = HTMLBridgeElementFactory(SuperBridge, getOwnPropertyNames(props), getOwnPropertyNames(methods));

  if (!isNull(superDef)) {
    props = assign(create(null), superDef.props, props);
    methods = assign(create(null), superDef.methods, methods);
    wire = superDef.wire || wire ? assign(create(null), superDef.wire, wire) : undefined;
    track = assign(create(null), superDef.track, track);
    connectedCallback = connectedCallback || superDef.connectedCallback;
    disconnectedCallback = disconnectedCallback || superDef.disconnectedCallback;
    renderedCallback = renderedCallback || superDef.renderedCallback;
    errorCallback = errorCallback || superDef.errorCallback;
    render = render || superDef.render;
    template = template || superDef.template;
  }

  props = assign(create(null), HTML_PROPS, props);

  if (!isUndefined(fields)) {
    defineProperties(proto, createObservedFieldsDescriptorMap(fields));
  }

  if (isUndefined(template)) {
    // default template
    template = defaultEmptyTemplate;
  }

  const def = {
    ctor: Ctor,
    name,
    wire,
    track,
    props,
    methods,
    bridge,
    template,
    connectedCallback,
    disconnectedCallback,
    renderedCallback,
    errorCallback,
    render
  };

  if (process.env.NODE_ENV !== 'production') {
    freeze(Ctor.prototype);
  }

  return def;
}
/**
 * EXPERIMENTAL: This function allows for the identification of LWC
 * constructors. This API is subject to change or being removed.
 */


function isComponentConstructor(ctor) {
  if (!isFunction(ctor)) {
    return false;
  } // Fast path: LightningElement is part of the prototype chain of the constructor.


  if (ctor.prototype instanceof BaseLightningElement) {
    return true;
  } // Slow path: LightningElement is not part of the prototype chain of the constructor, we need
  // climb up the constructor prototype chain to check in case there are circular dependencies
  // to resolve.


  let current = ctor;

  do {
    if (isCircularModuleDependency(current)) {
      const circularResolved = resolveCircularModuleDependency(current); // If the circular function returns itself, that's the signal that we have hit the end of the proto chain,
      // which must always be a valid base constructor.

      if (circularResolved === current) {
        return true;
      }

      current = circularResolved;
    }

    if (current === BaseLightningElement) {
      return true;
    }
  } while (!isNull(current) && (current = getPrototypeOf(current))); // Finally return false if the LightningElement is not part of the prototype chain.


  return false;
}
/**
 * EXPERIMENTAL: This function allows for the collection of internal
 * component metadata. This API is subject to change or being removed.
 */

function getComponentDef(Ctor, subclassComponentName) {
  let def = CtorToDefMap.get(Ctor);

  if (isUndefined(def)) {
    if (!isComponentConstructor(Ctor)) {
      throw new TypeError(`${Ctor} is not a valid component, or does not extends LightningElement from "lwc". You probably forgot to add the extend clause on the class declaration.`);
    }

    let meta = getComponentRegisteredMeta(Ctor);

    if (isUndefined(meta)) {
      // TODO [#1295]: remove this workaround after refactoring tests
      meta = {
        template: undefined,
        name: Ctor.name
      };
    }

    def = createComponentDef(Ctor, meta, subclassComponentName || Ctor.name);
    CtorToDefMap.set(Ctor, def);
  }

  return def;
}
/**
 * EXPERIMENTAL: This function provides access to the component constructor,
 * given an HTMLElement. This API is subject to change or being removed.
 */

function getComponentConstructor(elm) {
  let ctor = null;

  if (elm instanceof HTMLElement) {
    const vm = getAssociatedVMIfPresent(elm);

    if (!isUndefined(vm)) {
      ctor = vm.def.ctor;
    }
  }

  return ctor;
} // Only set prototype for public methods and properties
// No DOM Patching occurs here

function setElementProto(elm, def) {
  setPrototypeOf(elm, def.bridge.prototype);
} // Typescript is inferring the wrong function type for this particular
// overloaded method: https://github.com/Microsoft/TypeScript/issues/27972
// @ts-ignore type-mismatch

const HTML_PROPS = ArrayReduce.call(getOwnPropertyNames(HTMLElementOriginalDescriptors), (props, propName) => {
  const attrName = getAttrNameFromPropName(propName);
  props[propName] = {
    config: 3,
    type: 'any',
    attr: attrName
  };
  return props;
}, create(null));

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
var VMState;

(function (VMState) {
  VMState[VMState["created"] = 0] = "created";
  VMState[VMState["connected"] = 1] = "connected";
  VMState[VMState["disconnected"] = 2] = "disconnected";
})(VMState || (VMState = {}));

let idx = 0;
/** The internal slot used to associate different objects the engine manipulates with the VM */

const ViewModelReflection = createHiddenField('ViewModel', 'engine');

function callHook(cmp, fn, args = []) {
  return fn.apply(cmp, args);
}

function setHook(cmp, prop, newValue) {
  cmp[prop] = newValue;
}

function getHook(cmp, prop) {
  return cmp[prop];
}

function rerenderVM(vm) {
  rehydrate(vm);
}
function appendRootVM(vm) {
  runConnectedCallback(vm);
  rehydrate(vm);
}
function appendVM(vm) {
  rehydrate(vm);
} // just in case the component comes back, with this we guarantee re-rendering it
// while preventing any attempt to rehydration until after reinsertion.

function resetComponentStateWhenRemoved(vm) {
  const {
    state
  } = vm;

  if (state !== VMState.disconnected) {
    const {
      oar,
      tro
    } = vm; // Making sure that any observing record will not trigger the rehydrated on this vm

    tro.reset(); // Making sure that any observing accessor record will not trigger the setter to be reinvoked

    for (const key in oar) {
      oar[key].reset();
    }

    runDisconnectedCallback(vm); // Spec: https://dom.spec.whatwg.org/#concept-node-remove (step 14-15)

    runShadowChildNodesDisconnectedCallback(vm);
    runLightChildNodesDisconnectedCallback(vm);
  }
} // this method is triggered by the diffing algo only when a vnode from the
// old vnode.children is removed from the DOM.


function removeVM(vm) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(vm.state === VMState.connected || vm.state === VMState.disconnected, `${vm} must have been connected.`);
  }

  resetComponentStateWhenRemoved(vm);
} // this method is triggered by the removal of a root element from the DOM.

function removeRootVM(vm) {
  resetComponentStateWhenRemoved(vm);
}
function createVM(elm, Ctor, options) {
  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(elm instanceof HTMLElement, `VM creation requires a DOM element instead of ${elm}.`);
  }

  const def = getComponentDef(Ctor);
  const {
    isRoot,
    mode,
    owner
  } = options;
  idx += 1;
  const uninitializedVm = {
    // component creation index is defined once, and never reset, it can
    // be preserved from one insertion to another without any issue
    idx,
    state: VMState.created,
    isScheduled: false,
    isDirty: true,
    isRoot: isTrue$1(isRoot),
    mode,
    def,
    owner,
    elm,
    data: EmptyObject,
    context: create(null),
    cmpProps: create(null),
    cmpTrack: create(null),
    cmpSlots: useSyntheticShadow ? create(null) : undefined,
    callHook,
    setHook,
    getHook,
    children: EmptyArray,
    aChildren: EmptyArray,
    velements: EmptyArray,
    // Perf optimization to preserve the shape of this obj
    cmpTemplate: undefined,
    component: undefined,
    cmpRoot: undefined,
    tro: undefined,
    oar: undefined
  };

  if (process.env.NODE_ENV !== 'production') {
    uninitializedVm.toString = () => {
      return `[object:vm ${def.name} (${uninitializedVm.idx})]`;
    };
  } // create component instance associated to the vm and the element


  createComponent(uninitializedVm, Ctor); // link component to the wire service

  const initializedVm = uninitializedVm;
  linkComponent(initializedVm);
}

function assertIsVM(obj) {
  if (isNull(obj) || !isObject$1(obj) || !('cmpRoot' in obj)) {
    throw new TypeError(`${obj} is not a VM.`);
  }
}

function associateVM(obj, vm) {
  setHiddenField(obj, ViewModelReflection, vm);
}
function getAssociatedVM(obj) {
  const vm = getHiddenField(obj, ViewModelReflection);

  if (process.env.NODE_ENV !== 'production') {
    assertIsVM(vm);
  }

  return vm;
}
function getAssociatedVMIfPresent(obj) {
  const maybeVm = getHiddenField(obj, ViewModelReflection);

  if (process.env.NODE_ENV !== 'production') {
    if (!isUndefined(maybeVm)) {
      assertIsVM(maybeVm);
    }
  }

  return maybeVm;
}

function rehydrate(vm) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(vm.elm instanceof HTMLElement, `rehydration can only happen after ${vm} was patched the first time.`);
  }

  if (isTrue$1(vm.isDirty)) {
    const children = renderComponent(vm);
    patchShadowRoot(vm, children);
  }
}

function patchShadowRoot(vm, newCh) {
  const {
    cmpRoot,
    children: oldCh
  } = vm;
  vm.children = newCh; // caching the new children collection

  if (newCh.length > 0 || oldCh.length > 0) {
    // patch function mutates vnodes by adding the element reference,
    // however, if patching fails it contains partial changes.
    if (oldCh !== newCh) {
      const fn = hasDynamicChildren(newCh) ? updateDynamicChildren : updateStaticChildren;
      runWithBoundaryProtection(vm, vm, () => {
        // pre
        if (process.env.NODE_ENV !== 'production') {
          startMeasure('patch', vm);
        }
      }, () => {
        // job
        fn(cmpRoot, oldCh, newCh);
      }, () => {
        // post
        if (process.env.NODE_ENV !== 'production') {
          endMeasure('patch', vm);
        }
      });
    }
  }

  if (vm.state === VMState.connected) {
    // If the element is connected, that means connectedCallback was already issued, and
    // any successive rendering should finish with the call to renderedCallback, otherwise
    // the connectedCallback will take care of calling it in the right order at the end of
    // the current rehydration process.
    runRenderedCallback(vm);
  }
}

function runRenderedCallback(vm) {
  const {
    rendered
  } = Services;

  if (rendered) {
    invokeServiceHook(vm, rendered);
  }

  invokeComponentRenderedCallback(vm);
}

let rehydrateQueue = [];

function flushRehydrationQueue() {
  startGlobalMeasure(GlobalMeasurementPhase.REHYDRATE);

  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(rehydrateQueue.length, `If rehydrateQueue was scheduled, it is because there must be at least one VM on this pending queue instead of ${rehydrateQueue}.`);
  }

  const vms = rehydrateQueue.sort((a, b) => a.idx - b.idx);
  rehydrateQueue = []; // reset to a new queue

  for (let i = 0, len = vms.length; i < len; i += 1) {
    const vm = vms[i];

    try {
      rehydrate(vm);
    } catch (error) {
      if (i + 1 < len) {
        // pieces of the queue are still pending to be rehydrated, those should have priority
        if (rehydrateQueue.length === 0) {
          addCallbackToNextTick(flushRehydrationQueue);
        }

        ArrayUnshift$1.apply(rehydrateQueue, ArraySlice$1.call(vms, i + 1));
      } // we need to end the measure before throwing.


      endGlobalMeasure(GlobalMeasurementPhase.REHYDRATE); // re-throwing the original error will break the current tick, but since the next tick is
      // already scheduled, it should continue patching the rest.

      throw error; // eslint-disable-line no-unsafe-finally
    }
  }

  endGlobalMeasure(GlobalMeasurementPhase.REHYDRATE);
}

function runConnectedCallback(vm) {
  const {
    state
  } = vm;

  if (state === VMState.connected) {
    return; // nothing to do since it was already connected
  }

  vm.state = VMState.connected; // reporting connection

  const {
    connected
  } = Services;

  if (connected) {
    invokeServiceHook(vm, connected);
  }

  const {
    connectedCallback
  } = vm.def;

  if (!isUndefined(connectedCallback)) {
    if (process.env.NODE_ENV !== 'production') {
      startMeasure('connectedCallback', vm);
    }

    invokeComponentCallback(vm, connectedCallback);

    if (process.env.NODE_ENV !== 'production') {
      endMeasure('connectedCallback', vm);
    }
  }
}

function runDisconnectedCallback(vm) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(vm.state !== VMState.disconnected, `${vm} must be inserted.`);
  }

  if (isFalse$1(vm.isDirty)) {
    // this guarantees that if the component is reused/reinserted,
    // it will be re-rendered because we are disconnecting the reactivity
    // linking, so mutations are not automatically reflected on the state
    // of disconnected components.
    vm.isDirty = true;
  }

  vm.state = VMState.disconnected; // reporting disconnection

  const {
    disconnected
  } = Services;

  if (disconnected) {
    invokeServiceHook(vm, disconnected);
  }

  const {
    disconnectedCallback
  } = vm.def;

  if (!isUndefined(disconnectedCallback)) {
    if (process.env.NODE_ENV !== 'production') {
      startMeasure('disconnectedCallback', vm);
    }

    invokeComponentCallback(vm, disconnectedCallback);

    if (process.env.NODE_ENV !== 'production') {
      endMeasure('disconnectedCallback', vm);
    }
  }
}

function runShadowChildNodesDisconnectedCallback(vm) {
  const {
    velements: vCustomElementCollection
  } = vm; // reporting disconnection for every child in inverse order since they are inserted in reserved order

  for (let i = vCustomElementCollection.length - 1; i >= 0; i -= 1) {
    const elm = vCustomElementCollection[i].elm; // There are two cases where the element could be undefined:
    // * when there is an error during the construction phase, and an
    //   error boundary picks it, there is a possibility that the VCustomElement
    //   is not properly initialized, and therefore is should be ignored.
    // * when slotted custom element is not used by the element where it is slotted
    //   into it, as a result, the custom element was never initialized.

    if (!isUndefined(elm)) {
      const childVM = getAssociatedVM(elm);
      resetComponentStateWhenRemoved(childVM);
    }
  }
}

function runLightChildNodesDisconnectedCallback(vm) {
  const {
    aChildren: adoptedChildren
  } = vm;
  recursivelyDisconnectChildren(adoptedChildren);
}
/**
 * The recursion doesn't need to be a complete traversal of the vnode graph,
 * instead it can be partial, when a custom element vnode is found, we don't
 * need to continue into its children because by attempting to disconnect the
 * custom element itself will trigger the removal of anything slotted or anything
 * defined on its shadow.
 */


function recursivelyDisconnectChildren(vnodes) {
  for (let i = 0, len = vnodes.length; i < len; i += 1) {
    const vnode = vnodes[i];

    if (!isNull(vnode) && isArray$1(vnode.children) && !isUndefined(vnode.elm)) {
      // vnode is a VElement with children
      if (isUndefined(vnode.ctor)) {
        // it is a VElement, just keep looking (recursively)
        recursivelyDisconnectChildren(vnode.children);
      } else {
        // it is a VCustomElement, disconnect it and ignore its children
        resetComponentStateWhenRemoved(getAssociatedVM(vnode.elm));
      }
    }
  }
} // This is a super optimized mechanism to remove the content of the shadowRoot
// without having to go into snabbdom. Especially useful when the reset is a consequence
// of an error, in which case the children VNodes might not be representing the current
// state of the DOM


function resetShadowRoot(vm) {
  vm.children = EmptyArray;
  ShadowRootInnerHTMLSetter.call(vm.cmpRoot, ''); // disconnecting any known custom element inside the shadow of the this vm

  runShadowChildNodesDisconnectedCallback(vm);
}
function scheduleRehydration(vm) {
  if (!vm.isScheduled) {
    vm.isScheduled = true;

    if (rehydrateQueue.length === 0) {
      addCallbackToNextTick(flushRehydrationQueue);
    }

    ArrayPush.call(rehydrateQueue, vm);
  }
}

function getErrorBoundaryVM(vm) {
  let currentVm = vm;

  while (!isNull(currentVm)) {
    if (!isUndefined(currentVm.def.errorCallback)) {
      return currentVm;
    }

    currentVm = currentVm.owner;
  }
}
/**
 * EXPERIMENTAL: This function detects whether or not a Node is
 * controlled by a LWC template. This API is subject to
 * change or being removed.
 */


function isNodeFromTemplate(node) {
  if (isFalse$1(node instanceof Node)) {
    return false;
  } // TODO [#1250]: skipping the shadowRoot instances itself makes no sense, we need to revisit this with locker


  if (node instanceof ShadowRoot) {
    return false;
  }

  if (useSyntheticShadow) {
    // TODO [#1252]: old behavior that is still used by some pieces of the platform, specifically, nodes inserted
    // manually on places where `lwc:dom="manual"` directive is not used, will be considered global elements.
    if (isUndefined(node.$shadowResolver$)) {
      return false;
    }
  }

  const root = node.getRootNode();
  return root instanceof ShadowRoot;
} // slow path routine
// NOTE: we should probably more this routine to the synthetic shadow folder
// and get the allocation to be cached by in the elm instead of in the VM

function allocateInSlot(vm, children) {
  if (process.env.NODE_ENV !== 'production') {
    assert.invariant(isObject$1(vm.cmpSlots), `When doing manual allocation, there must be a cmpSlots object available.`);
  }

  const {
    cmpSlots: oldSlots
  } = vm;
  const cmpSlots = vm.cmpSlots = create(null);

  for (let i = 0, len = children.length; i < len; i += 1) {
    const vnode = children[i];

    if (isNull(vnode)) {
      continue;
    }

    const {
      data
    } = vnode;
    const slotName = data.attrs && data.attrs.slot || '';
    const vnodes = cmpSlots[slotName] = cmpSlots[slotName] || []; // re-keying the vnodes is necessary to avoid conflicts with default content for the slot
    // which might have similar keys. Each vnode will always have a key that
    // starts with a numeric character from compiler. In this case, we add a unique
    // notation for slotted vnodes keys, e.g.: `@foo:1:1`

    vnode.key = `@${slotName}:${vnode.key}`;
    ArrayPush.call(vnodes, vnode);
  }

  if (isFalse$1(vm.isDirty)) {
    // We need to determine if the old allocation is really different from the new one
    // and mark the vm as dirty
    const oldKeys = keys(oldSlots);

    if (oldKeys.length !== keys(cmpSlots).length) {
      markComponentAsDirty(vm);
      return;
    }

    for (let i = 0, len = oldKeys.length; i < len; i += 1) {
      const key = oldKeys[i];

      if (isUndefined(cmpSlots[key]) || oldSlots[key].length !== cmpSlots[key].length) {
        markComponentAsDirty(vm);
        return;
      }

      const oldVNodes = oldSlots[key];
      const vnodes = cmpSlots[key];

      for (let j = 0, a = cmpSlots[key].length; j < a; j += 1) {
        if (oldVNodes[j] !== vnodes[j]) {
          markComponentAsDirty(vm);
          return;
        }
      }
    }
  }
}
function runWithBoundaryProtection(vm, owner, pre, job, post) {
  let error;
  pre();

  try {
    job();
  } catch (e) {
    error = Object(e);
  } finally {
    post();

    if (!isUndefined(error)) {
      error.wcStack = error.wcStack || getErrorComponentStack(vm);
      const errorBoundaryVm = isNull(owner) ? undefined : getErrorBoundaryVM(owner);

      if (isUndefined(errorBoundaryVm)) {
        throw error; // eslint-disable-line no-unsafe-finally
      }

      resetShadowRoot(vm); // remove offenders

      if (process.env.NODE_ENV !== 'production') {
        startMeasure('errorCallback', errorBoundaryVm);
      } // error boundaries must have an ErrorCallback


      const errorCallback = errorBoundaryVm.def.errorCallback;
      invokeComponentCallback(errorBoundaryVm, errorCallback, [error, error.wcStack]);

      if (process.env.NODE_ENV !== 'production') {
        endMeasure('errorCallback', errorBoundaryVm);
      }
    }
  }
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const {
  appendChild,
  insertBefore,
  removeChild,
  replaceChild
} = Node.prototype;

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const ConnectingSlot = createHiddenField('connecting', 'engine');
const DisconnectingSlot = createHiddenField('disconnecting', 'engine');

function callNodeSlot(node, slot) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isTrue(node, `callNodeSlot() should not be called for a non-object`);
  }

  const fn = getHiddenField(node, slot);

  if (!isUndefined(fn)) {
    fn();
  }

  return node; // for convenience
} // monkey patching Node methods to be able to detect the insertions and removal of
// root elements created via createElement.


assign(Node.prototype, {
  appendChild(newChild) {
    const appendedNode = appendChild.call(this, newChild);
    return callNodeSlot(appendedNode, ConnectingSlot);
  },

  insertBefore(newChild, referenceNode) {
    const insertedNode = insertBefore.call(this, newChild, referenceNode);
    return callNodeSlot(insertedNode, ConnectingSlot);
  },

  removeChild(oldChild) {
    const removedNode = removeChild.call(this, oldChild);
    return callNodeSlot(removedNode, DisconnectingSlot);
  },

  replaceChild(newChild, oldChild) {
    const replacedNode = replaceChild.call(this, newChild, oldChild);
    callNodeSlot(replacedNode, DisconnectingSlot);
    callNodeSlot(newChild, ConnectingSlot);
    return replacedNode;
  }

});
/**
 * EXPERIMENTAL: This function is almost identical to document.createElement
 * (https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement)
 * with the slightly difference that in the options, you can pass the `is`
 * property set to a Constructor instead of just a string value. The intent
 * is to allow the creation of an element controlled by LWC without having
 * to register the element as a custom element. E.g.:
 *
 * const el = createElement('x-foo', { is: FooCtor });
 *
 * If the value of `is` attribute is not a constructor,
 * then it throws a TypeError.
 */

function createElement(sel, options) {
  if (!isObject$1(options) || isNull(options)) {
    throw new TypeError(`"createElement" function expects an object as second parameter but received "${toString(options)}".`);
  }

  let Ctor = options.is;

  if (!isFunction(Ctor)) {
    throw new TypeError(`"createElement" function expects a "is" option with a valid component constructor.`);
  }

  const mode = options.mode !== 'closed' ? 'open' : 'closed'; // Create element with correct tagName

  const element = document.createElement(sel);

  if (!isUndefined(getAssociatedVMIfPresent(element))) {
    // There is a possibility that a custom element is registered under tagName,
    // in which case, the initialization is already carry on, and there is nothing else
    // to do here.
    return element;
  }

  if (isCircularModuleDependency(Ctor)) {
    Ctor = resolveCircularModuleDependency(Ctor);
  }

  const def = getComponentDef(Ctor);
  setElementProto(element, def);

  if (process.env.NODE_ENV !== 'production') {
    patchCustomElementWithRestrictions(element, EmptyObject);
  } // In case the element is not initialized already, we need to carry on the manual creation


  createVM(element, Ctor, {
    mode,
    isRoot: true,
    owner: null
  }); // Handle insertion and removal from the DOM manually

  setHiddenField(element, ConnectingSlot, () => {
    const vm = getAssociatedVM(element);
    startGlobalMeasure(GlobalMeasurementPhase.HYDRATE, vm);

    if (vm.state === VMState.connected) {
      // usually means moving the element from one place to another, which is observable via life-cycle hooks
      removeRootVM(vm);
    }

    appendRootVM(vm);
    endGlobalMeasure(GlobalMeasurementPhase.HYDRATE, vm);
  });
  setHiddenField(element, DisconnectingSlot, () => {
    const vm = getAssociatedVM(element);
    removeRootVM(vm);
  });
  return element;
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * EXPERIMENTAL: This function allows you to create a reactive readonly
 * membrane around any object value. This API is subject to change or
 * being removed.
 */

function readonly(obj) {
  if (process.env.NODE_ENV !== 'production') {
    // TODO [#1292]: Remove the readonly decorator
    if (arguments.length !== 1) {
      assert.fail('@readonly cannot be used as a decorator just yet, use it as a function with one argument to produce a readonly version of the provided value.');
    }
  }

  return reactiveMembrane.getReadOnlyProxy(obj);
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * This function builds a Web Component class from a LWC constructor
 * so it can be registered as a new element via customElements.define()
 * at any given time. E.g.:
 *
 *      import { buildCustomElementConstructor } from 'lwc';
 *      import Foo from 'ns/foo';
 *      const WC = buildCustomElementConstructor(Foo);
 *      customElements.define('x-foo', WC);
 *      const elm = document.createElement('x-foo');
 *
 */

function buildCustomElementConstructor(Ctor, options) {
  var _a;

  const {
    props,
    bridge: BaseElement
  } = getComponentDef(Ctor);
  const normalizedOptions = {
    mode: 'open',
    isRoot: true,
    owner: null
  };

  if (isObject$1(options) && !isNull(options)) {
    const {
      mode
    } = options;

    if (mode === 'closed') {
      normalizedOptions.mode = mode;
    }
  }

  return _a = class extends BaseElement {
    constructor() {
      super();
      createVM(this, Ctor, normalizedOptions);

      if (process.env.NODE_ENV !== 'production') {
        patchCustomElementWithRestrictions(this, EmptyObject);
      }
    }

    connectedCallback() {
      const vm = getAssociatedVM(this);
      appendRootVM(vm);
    }

    disconnectedCallback() {
      const vm = getAssociatedVM(this);
      removeRootVM(vm);
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
      if (oldValue === newValue) {
        // ignoring similar values for better perf
        return;
      }

      const propName = getPropNameFromAttrName(attrName);

      if (isUndefined(props[propName])) {
        // ignoring unknown attributes
        return;
      }

      if (!isAttributeLocked(this, attrName)) {
        // ignoring changes triggered by the engine itself during:
        // * diffing when public props are attempting to reflect to the DOM
        // * component via `this.setAttribute()`, should never update the prop.
        // Both cases, the the setAttribute call is always wrap by the unlocking
        // of the attribute to be changed
        return;
      } // reflect attribute change to the corresponding props when changed
      // from outside.


      this[propName] = newValue;
    }

  }, // collecting all attribute names from all public props to apply
  // the reflection from attributes to props via attributeChangedCallback.
  _a.observedAttributes = ArrayMap.call(getOwnPropertyNames(props), propName => props[propName].attr), _a;
}

export { BaseLightningElement as LightningElement, api$1 as api, buildCustomElementConstructor, createElement, decorate, getComponentConstructor, getComponentDef, isComponentConstructor, isNodeFromTemplate, readonly, register, registerComponent, registerDecorators, registerTemplate, sanitizeAttribute, setFeatureFlag, setFeatureFlagForTest, track, unwrap$1 as unwrap, wire };
/** version: 1.3.2 */
