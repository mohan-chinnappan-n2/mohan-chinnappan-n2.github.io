(function (lwc) {
    'use strict';

    /**
     * Copyright (C) 2018 salesforce.com, inc.
     */

    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */
    var assert = {
      isTrue(value, msg) {
        if (!value) {
          throw new Error(`Assert Violation: ${msg}`);
        }
      },

      isFalse(value, msg) {
        if (value) {
          throw new Error(`Assert Violation: ${msg}`);
        }
      }

    };
    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */
    // key in engine service context for wire service context

    const CONTEXT_ID = '@wire'; // key in wire service context for updated listener metadata

    const CONTEXT_UPDATED = 'updated'; // key in wire service context for connected listener metadata

    const CONTEXT_CONNECTED = 'connected'; // key in wire service context for disconnected listener metadata

    const CONTEXT_DISCONNECTED = 'disconnected'; // wire event target life cycle connectedCallback hook event type

    const CONNECT = 'connect'; // wire event target life cycle disconnectedCallback hook event type

    const DISCONNECT = 'disconnect'; // wire event target life cycle config changed hook event type

    const CONFIG = 'config';
    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */

    /*
     * Detects property changes by installing setter/getter overrides on the component
     * instance.
     *
     * TODO - in 216 engine will expose an 'updated' callback for services that is invoked
     * once after all property changes occur in the event loop.
     */

    /**
     * Invokes the provided change listeners with the resolved component properties.
     * @param configListenerMetadatas List of config listener metadata (config listeners and their context)
     * @param paramValues Values for all wire adapter config params
     */

    function invokeConfigListeners(configListenerMetadatas, paramValues) {
      configListenerMetadatas.forEach(metadata => {
        const {
          listener,
          statics,
          reactives
        } = metadata;
        const reactiveValues = Object.create(null);

        if (reactives) {
          const keys = Object.keys(reactives);

          for (let j = 0, jlen = keys.length; j < jlen; j++) {
            const key = keys[j];
            const value = paramValues[reactives[key]];
            reactiveValues[key] = value;
          }
        } // TODO - consider read-only membrane to enforce invariant of immutable config


        const config = Object.assign({}, statics, reactiveValues);
        listener.call(undefined, config);
      });
    }
    /**
     * Marks a reactive parameter as having changed.
     * @param cmp The component
     * @param reactiveParameter Reactive parameter that has changed
     * @param configContext The service context
     */


    function updated(cmp, reactiveParameter, configContext) {
      if (!configContext.mutated) {
        configContext.mutated = new Set(); // collect all prop changes via a microtask

        Promise.resolve().then(updatedFuture.bind(undefined, cmp, configContext));
      }

      configContext.mutated.add(reactiveParameter);
    }

    function updatedFuture(cmp, configContext) {
      const uniqueListeners = new Set(); // configContext.mutated must be set prior to invoking this function

      const mutated = configContext.mutated;
      delete configContext.mutated; // pull this variable out of scope to workaround babel minify issue - https://github.com/babel/minify/issues/877

      let listeners;
      mutated.forEach(reactiveParameter => {
        const value = getReactiveParameterValue(cmp, reactiveParameter);

        if (configContext.values[reactiveParameter.reference] === value) {
          return;
        }

        configContext.values[reactiveParameter.reference] = value;
        listeners = configContext.listeners[reactiveParameter.head];

        for (let i = 0, len = listeners.length; i < len; i++) {
          uniqueListeners.add(listeners[i]);
        }
      });
      invokeConfigListeners(uniqueListeners, configContext.values);
    }
    /**
     * Gets the value of an @wire reactive parameter.
     * @param cmp The component
     * @param reactiveParameter The parameter to get
     */


    function getReactiveParameterValue(cmp, reactiveParameter) {
      let value = cmp[reactiveParameter.head];

      if (!reactiveParameter.tail) {
        return value;
      }

      const segments = reactiveParameter.tail;

      for (let i = 0, len = segments.length; i < len && value != null; i++) {
        const segment = segments[i];

        if (typeof value !== 'object' || !(segment in value)) {
          return undefined;
        }

        value = value[segment];
      }

      return value;
    }
    /**
     * Installs setter override to trap changes to a property, triggering the config listeners.
     * @param cmp The component
     * @param reactiveParameter Reactive parameter that defines the property to monitor
     * @param configContext The service context
     */


    function installTrap(cmp, reactiveParameter, configContext) {
      const callback = updated.bind(undefined, cmp, reactiveParameter, configContext);
      const newDescriptor = getOverrideDescriptor(cmp, reactiveParameter.head, callback);
      Object.defineProperty(cmp, reactiveParameter.head, newDescriptor);
    }
    /**
     * Finds the descriptor of the named property on the prototype chain
     * @param target The target instance/constructor function
     * @param propName Name of property to find
     * @param protoSet Prototypes searched (to avoid circular prototype chains)
     */


    function findDescriptor(target, propName, protoSet) {
      protoSet = protoSet || [];

      if (!target || protoSet.indexOf(target) > -1) {
        return null; // null, undefined, or circular prototype definition
      }

      const descriptor = Object.getOwnPropertyDescriptor(target, propName);

      if (descriptor) {
        return descriptor;
      }

      const proto = Object.getPrototypeOf(target);

      if (!proto) {
        return null;
      }

      protoSet.push(target);
      return findDescriptor(proto, propName, protoSet);
    }
    /**
     * Gets a property descriptor that monitors the provided property for changes
     * @param cmp The component
     * @param prop The name of the property to be monitored
     * @param callback A function to invoke when the prop's value changes
     * @return A property descriptor
     */


    function getOverrideDescriptor(cmp, prop, callback) {
      const descriptor = findDescriptor(cmp, prop);
      let enumerable;
      let get;
      let set; // TODO: this does not cover the override of existing descriptors at the instance level
      // and that's ok because eventually we will not need to do any of these :)

      if (descriptor === null || descriptor.get === undefined && descriptor.set === undefined) {
        let value = cmp[prop];
        enumerable = true;

        get = function () {
          return value;
        };

        set = function (newValue) {
          value = newValue;
          callback();
        };
      } else {
        const {
          set: originalSet,
          get: originalGet
        } = descriptor;
        enumerable = descriptor.enumerable;

        set = function (newValue) {
          if (originalSet) {
            originalSet.call(cmp, newValue);
          }

          callback();
        };

        get = function () {
          return originalGet ? originalGet.call(cmp) : undefined;
        };
      }

      return {
        set,
        get,
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


    function removeListener(listeners, toRemove) {
      const idx = listeners.indexOf(toRemove);

      if (idx > -1) {
        listeners.splice(idx, 1);
      }
    }

    function removeConfigListener(configListenerMetadatas, toRemove) {
      for (let i = 0, len = configListenerMetadatas.length; i < len; i++) {
        if (configListenerMetadatas[i].listener === toRemove) {
          configListenerMetadatas.splice(i, 1);
          return;
        }
      }
    }

    function buildReactiveParameter(reference) {
      if (!reference.includes('.')) {
        return {
          reference,
          head: reference
        };
      }

      const segments = reference.split('.');
      return {
        reference,
        head: segments.shift(),
        tail: segments
      };
    }

    class WireEventTarget {
      constructor(cmp, def, context, wireDef, wireTarget) {
        this._cmp = cmp;
        this._def = def;
        this._context = context;
        this._wireDef = wireDef;
        this._wireTarget = wireTarget;
      }

      addEventListener(type, listener) {
        switch (type) {
          case CONNECT:
            {
              const connectedListeners = this._context[CONTEXT_ID][CONTEXT_CONNECTED];

              if (process.env.NODE_ENV !== 'production') {
                assert.isFalse(connectedListeners.includes(listener), 'must not call addEventListener("connect") with the same listener');
              }

              connectedListeners.push(listener);
              break;
            }

          case DISCONNECT:
            {
              const disconnectedListeners = this._context[CONTEXT_ID][CONTEXT_DISCONNECTED];

              if (process.env.NODE_ENV !== 'production') {
                assert.isFalse(disconnectedListeners.includes(listener), 'must not call addEventListener("disconnect") with the same listener');
              }

              disconnectedListeners.push(listener);
              break;
            }

          case CONFIG:
            {
              const reactives = this._wireDef.params;
              const statics = this._wireDef.static;
              let reactiveKeys; // no reactive parameters. fire config once with static parameters (if present).

              if (!reactives || (reactiveKeys = Object.keys(reactives)).length === 0) {
                const config = statics || Object.create(null);
                listener.call(undefined, config);
                return;
              }

              const configListenerMetadata = {
                listener,
                statics,
                reactives
              }; // setup listeners for all reactive parameters

              const configContext = this._context[CONTEXT_ID][CONTEXT_UPDATED];
              reactiveKeys.forEach(key => {
                const reactiveParameter = buildReactiveParameter(reactives[key]);
                let configListenerMetadatas = configContext.listeners[reactiveParameter.head];

                if (!configListenerMetadatas) {
                  configListenerMetadatas = [configListenerMetadata];
                  configContext.listeners[reactiveParameter.head] = configListenerMetadatas;
                  installTrap(this._cmp, reactiveParameter, configContext);
                } else {
                  configListenerMetadatas.push(configListenerMetadata);
                } // enqueue to pickup default values


                updated(this._cmp, reactiveParameter, configContext);
              });
              break;
            }

          default:
            throw new Error(`unsupported event type ${type}`);
        }
      }

      removeEventListener(type, listener) {
        switch (type) {
          case CONNECT:
            {
              const connectedListeners = this._context[CONTEXT_ID][CONTEXT_CONNECTED];
              removeListener(connectedListeners, listener);
              break;
            }

          case DISCONNECT:
            {
              const disconnectedListeners = this._context[CONTEXT_ID][CONTEXT_DISCONNECTED];
              removeListener(disconnectedListeners, listener);
              break;
            }

          case CONFIG:
            {
              const paramToConfigListenerMetadata = this._context[CONTEXT_ID][CONTEXT_UPDATED].listeners;
              const reactives = this._wireDef.params;

              if (reactives) {
                Object.keys(reactives).forEach(key => {
                  const reactiveParameter = buildReactiveParameter(reactives[key]);
                  const configListenerMetadatas = paramToConfigListenerMetadata[reactiveParameter.head];

                  if (configListenerMetadatas) {
                    removeConfigListener(configListenerMetadatas, listener);
                  }
                });
              }

              break;
            }

          default:
            throw new Error(`unsupported event type ${type}`);
        }
      }

      dispatchEvent(evt) {
        if (evt instanceof ValueChangedEvent) {
          const value = evt.value;

          if (this._wireDef.method) {
            this._cmp[this._wireTarget](value);
          } else {
            this._cmp[this._wireTarget] = value;
          }

          return false; // canceling signal since we don't want this to propagate
        } else if (evt.type === 'WireContextEvent') {
          // NOTE: kill this hack
          // we should only allow ValueChangedEvent
          // however, doing so would require adapter to implement machinery
          // that fire the intended event as DOM event and wrap inside ValueChangedEvent
          return this._cmp.dispatchEvent(evt);
        } else {
          throw new Error(`Invalid event ${evt}.`);
        }
      }

    }
    /**
     * Event fired by wire adapters to emit a new value.
     */


    class ValueChangedEvent {
      constructor(value) {
        this.type = 'ValueChangedEvent';
        this.value = value;
      }

    }
    /*
     * Copyright (c) 2018, salesforce.com, inc.
     * All rights reserved.
     * SPDX-License-Identifier: MIT
     * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
     */
    // wire adapters: wire adapter id => adapter ctor


    const adapterFactories = new Map();
    /**
     * Invokes the specified callbacks.
     * @param listeners functions to call
     */

    function invokeListener(listeners) {
      for (let i = 0, len = listeners.length; i < len; ++i) {
        listeners[i].call(undefined);
      }
    }
    /**
     * The wire service.
     *
     * This service is registered with the engine's service API. It connects service
     * callbacks to wire adapter lifecycle events.
     */


    const wireService = {
      wiring: (cmp, data, def, context) => {
        const wireContext = context[CONTEXT_ID] = Object.create(null);
        wireContext[CONTEXT_CONNECTED] = [];
        wireContext[CONTEXT_DISCONNECTED] = [];
        wireContext[CONTEXT_UPDATED] = {
          listeners: {},
          values: {}
        }; // engine guarantees invocation only if def.wire is defined

        const wireStaticDef = def.wire;
        const wireTargets = Object.keys(wireStaticDef);

        for (let i = 0, len = wireTargets.length; i < len; i++) {
          const wireTarget = wireTargets[i];
          const wireDef = wireStaticDef[wireTarget];
          const adapterFactory = adapterFactories.get(wireDef.adapter);

          if (process.env.NODE_ENV !== 'production') {
            assert.isTrue(wireDef.adapter, `@wire on "${wireTarget}": adapter id must be truthy`);
            assert.isTrue(adapterFactory, `@wire on "${wireTarget}": unknown adapter id: ${String(wireDef.adapter)}`); // enforce restrictions of reactive parameters

            if (wireDef.params) {
              Object.keys(wireDef.params).forEach(param => {
                const prop = wireDef.params[param];
                const segments = prop.split('.');
                segments.forEach(segment => {
                  assert.isTrue(segment.length > 0, `@wire on "${wireTarget}": reactive parameters must not be empty`);
                });
                assert.isTrue(segments[0] !== wireTarget, `@wire on "${wireTarget}": reactive parameter "${segments[0]}" must not refer to self`); // restriction for dot-notation reactive parameters

                if (segments.length > 1) {
                  // @wire emits a stream of immutable values. an emit sets the target property; it does not mutate a previously emitted value.
                  // restricting dot-notation reactive parameters to reference other @wire targets makes trapping the 'head' of the parameter
                  // sufficient to observe the value change.
                  assert.isTrue(wireTargets.includes(segments[0]) && wireStaticDef[segments[0]].method !== 1, `@wire on "${wireTarget}": dot-notation reactive parameter "${prop}" must refer to a @wire property`);
                }
              });
            }
          }

          if (adapterFactory) {
            const wireEventTarget = new WireEventTarget(cmp, def, context, wireDef, wireTarget);
            adapterFactory({
              dispatchEvent: wireEventTarget.dispatchEvent.bind(wireEventTarget),
              addEventListener: wireEventTarget.addEventListener.bind(wireEventTarget),
              removeEventListener: wireEventTarget.removeEventListener.bind(wireEventTarget)
            });
          }
        }
      },
      connected: (cmp, data, def, context) => {
        let listeners;

        if (process.env.NODE_ENV !== 'production') {
          assert.isTrue(!def.wire || context[CONTEXT_ID], 'wire service was not initialized prior to component creation:  "connected" service hook invoked without necessary context');
        }

        if (!def.wire || !(listeners = context[CONTEXT_ID][CONTEXT_CONNECTED])) {
          return;
        }

        invokeListener(listeners);
      },
      disconnected: (cmp, data, def, context) => {
        let listeners;

        if (process.env.NODE_ENV !== 'production') {
          assert.isTrue(!def.wire || context[CONTEXT_ID], 'wire service was not initialized prior to component creation:  "disconnected" service hook invoked without necessary context');
        }

        if (!def.wire || !(listeners = context[CONTEXT_ID][CONTEXT_DISCONNECTED])) {
          return;
        }

        invokeListener(listeners);
      }
    };
    /**
     * Registers the wire service.
     */

    function registerWireService(registerService) {
      registerService(wireService);
    }
    /** version: 0.37.4-220.2 */

    function tmpl($api, $cmp, $slotset, $ctx) {
      const {
        fid: api_scoped_frag_id,
        h: api_element
      } = $api;
      return [api_element("svg", {
        className: $cmp.computedClass,
        attrs: {
          "focusable": "false",
          "data-key": $cmp.name,
          "aria-hidden": "true"
        },
        key: 2
      }, [api_element("use", {
        attrs: {
          "xlink:href": lwc.sanitizeAttribute("use", "http://www.w3.org/2000/svg", "xlink:href", api_scoped_frag_id($cmp.href))
        },
        key: 3
      }, [])])];
    }

    var _tmpl = lwc.registerTemplate(tmpl);
    tmpl.stylesheets = [];
    tmpl.stylesheetTokens = {
      hostAttribute: "lightning-primitiveIcon_primitiveIcon-host",
      shadowAttribute: "lightning-primitiveIcon_primitiveIcon"
    };

    const proto = {
      add(className) {
        if (typeof className === 'string') {
          this[className] = true;
        } else {
          Object.assign(this, className);
        }

        return this;
      },

      invert() {
        Object.keys(this).forEach(key => {
          this[key] = !this[key];
        });
        return this;
      },

      toString() {
        return Object.keys(this).filter(key => this[key]).join(' ');
      }

    };
    function classSet(config) {
      if (typeof config === 'string') {
        const key = config;
        config = {};
        config[key] = true;
      }

      return Object.assign(Object.create(proto), config);
    }

    function assert$1(condition, message) {
      if (process.env.NODE_ENV !== 'production') {
        if (!condition) {
          throw new Error(message);
        }
      }
    }

    /**
    An emitter implementation based on the Node.js EventEmitter API:
    https://nodejs.org/dist/latest-v6.x/docs/api/events.html#events_class_eventemitter
    **/
    class EventEmitter {
      constructor() {
        this.registry = {};
      }
      /**
      Registers a listener on the emitter
      @method EventEmitter#on
      @param {String} name - The name of the event
      @param {Function} listener - The callback function
      @return {EventEmitter} - Returns a reference to the `EventEmitter` so that calls can be chained
      **/


      on(name, listener) {
        this.registry[name] = this.registry[name] || [];
        this.registry[name].push(listener);
        return this;
      }
      /**
      Registers a listener on the emitter that only executes once
      @method EventEmitter#once
      @param {String} name - The name of the event
      @param {Function} listener - The callback function
      @return {EventEmitter} - Returns a reference to the `EventEmitter` so that calls can be chained
      **/


      once(name, listener) {
        const doOnce = function () {
          listener.apply(null, arguments);
          this.removeListener(name, doOnce);
        }.bind(this);

        this.on(name, doOnce);
        return this;
      }
      /**
      Synchronously calls each listener registered with the specified event
      @method EventEmitter#emit
      @param {String} name - The name of the event
      @return {Boolean} - Returns `true` if the event had listeners, `false` otherwise
      **/


      emit(name, ...args) {
        const listeners = this.registry[name];
        let count = 0;

        if (listeners) {
          listeners.forEach(listener => {
            count += 1;
            listener.apply(null, args);
          });
        }

        return count > 0;
      }
      /**
      Removes the specified `listener` from the listener array for the event named `name`
      @method EventEmitter#removeListener
      @param {String} name - The name of the event
      @param {Function} listener - The callback function
      @return {EventEmitter} - Returns a reference to the `EventEmitter` so that calls can be chained
      **/


      removeListener(name, listener) {
        const listeners = this.registry[name];

        if (listeners) {
          for (let i = 0, len = listeners.length; i < len; i += 1) {
            if (listeners[i] === listener) {
              listeners.splice(i, 1);
              return this;
            }
          }
        }

        return this;
      }

    }

    /**
     * Utility function to generate an unique guid.
     * used on state objects to provide a performance aid when iterating
     * through the items and marking them for render
     * @returns {String} an unique string ID
     */
    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }

      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function classListMutation(classList, config) {
      Object.keys(config).forEach(key => {
        if (typeof key === 'string' && key.length) {
          if (config[key]) {
            classList.add(key);
          } else {
            classList.remove(key);
          }
        }
      });
    }

    /**
    A string normalization utility for attributes.
    @param {String} value - The value to normalize.
    @param {Object} config - The optional configuration object.
    @param {String} [config.fallbackValue] - The optional fallback value to use if the given value is not provided or invalid. Defaults to an empty string.
    @param {Array} [config.validValues] - An optional array of valid values. Assumes all input is valid if not provided.
    @return {String} - The normalized value.
    **/
    function normalizeString(value, config = {}) {
      const {
        fallbackValue = '',
        validValues,
        toLowerCase = true
      } = config;
      let normalized = typeof value === 'string' && value.trim() || '';
      normalized = toLowerCase ? normalized.toLowerCase() : normalized;

      if (validValues && validValues.indexOf(normalized) === -1) {
        normalized = fallbackValue;
      }

      return normalized;
    }
    /**
    A boolean normalization utility for attributes.
    @param {Any} value - The value to normalize.
    @return {Boolean} - The normalized value.
    **/

    function normalizeBoolean(value) {
      return typeof value === 'string' || !!value;
    }
    /**
    A aria attribute normalization utility.
    @param {Any} value - A single aria value or an array of aria values
    @return {String} - A space separated list of aria values
    **/

    function normalizeAriaAttribute(value) {
      let arias = Array.isArray(value) ? value : [value];
      arias = arias.map(ariaValue => {
        if (typeof ariaValue === 'string') {
          return ariaValue.replace(/\s+/g, ' ').trim();
        }

        return '';
      }).filter(ariaValue => !!ariaValue);
      return arias.length > 0 ? arias.join(' ') : null;
    }

    const keyCodes = {
      tab: 9,
      backspace: 8,
      enter: 13,
      escape: 27,
      space: 32,
      pageup: 33,
      pagedown: 34,
      end: 35,
      home: 36,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      delete: 46,
      shift: 16
    };
    const buffer = {};
    /**
     * Runs an action and passes the string of buffered keys typed within a short time period.
     * Use for type-ahead like functionality in menus, lists, comboboxes, and similar components.
     *
     * @param {CustomEvent} event A keyboard event
     * @param {Function} action function to run, it's passed the buffered text
     */

    function runActionOnBufferedTypedCharacters(event, action) {
      const letter = event.key;

      if (letter.length > 1) {
        // Not an individual character/letter, but rather a special code (like Shift, Backspace, etc.)
        return;
      } // If we were going to clear what keys were typed, don't yet.


      if (buffer._clearBufferId) {
        clearTimeout(buffer._clearBufferId);
      }

      buffer._keyBuffer = buffer._keyBuffer || [];

      buffer._keyBuffer.push(letter);

      const matchText = buffer._keyBuffer.join('').toLowerCase();

      action(matchText); // eslint-disable-next-line lwc/no-set-timeout

      buffer._clearBufferId = setTimeout(() => {
        buffer._keyBuffer = [];
      }, 700);
    }

    const isIE11 = isIE11Test(navigator);
    const isChrome = isChromeTest(navigator); // The following functions are for tests only

    function isIE11Test(navigator) {
      // https://stackoverflow.com/questions/17447373/how-can-i-target-only-internet-explorer-11-with-javascript
      return /Trident.*rv[ :]*11\./.test(navigator.userAgent);
    }
    function isChromeTest(navigator) {
      // https://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome
      return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    }

    // hide panel on scroll
    const POSITION_CHANGE_THRESHOLD = 5;
    function observePosition(target, threshold = POSITION_CHANGE_THRESHOLD, originalRect, callback) {
      // retrieve current bounding client rect of target element
      const newBoundingRect = target.getBoundingClientRect();
      const newLeft = newBoundingRect.left;
      const newTop = newBoundingRect.top; // old bounding rect values

      const oldLeft = originalRect.left;
      const oldTop = originalRect.top; // if we have a position change (horizontal or vertical) equal or greater to the threshold then execute the callback

      const horizontalShiftDelta = Math.abs(newLeft - oldLeft);
      const verticalShiftDelta = Math.abs(newTop - oldTop);

      if (horizontalShiftDelta >= threshold || verticalShiftDelta >= threshold) {
        callback();
      }
    }

    /**
     * Get the actual DOM id for an element
     * @param {HTMLElement|String} el The element to get the id for (string will just be returned)
     *
     * @returns {String} The DOM id or null
     */

    function getRealDOMId(el) {
      if (el && typeof el === 'string') {
        return el;
      } else if (el) {
        return el.getAttribute('id');
      }

      return null;
    }

    /*
     * Regex to test a string for an ISO8601 Date. The following formats are matched.
     * Note that if a time element is present (e.g. 'T'), the string should have a time zone designator (Z or +hh:mm or -hh:mm).
     *
     *  YYYY
     *  YYYY-MM
     *  YYYY-MM-DD
     *  YYYY-MM-DDThh:mmTZD
     *  YYYY-MM-DDThh:mm:ssTZD
     *  YYYY-MM-DDThh:mm:ss.STZD
     *
     *
     * @see: https://www.w3.org/TR/NOTE-datetime
     */
    const ISO8601_STRICT_PATTERN = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z){1})?)?)?$/i;
    /* Regex to test a string for an ISO8601 partial time or full time:
     * hh:mm
     * hh:mm:ss
     * hh:mm:ss.S
     * full time = partial time + TZD
     */

    const ISO8601_TIME_PATTERN = /^\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
    const STANDARD_TIME_FORMAT = 'HH:mm:ss.SSS';
    const STANDARD_DATE_FORMAT = 'YYYY-MM-DD';
    const TIME_SEPARATOR = 'T';
    const TIMEZONE_INDICATOR = /(Z|([+-])(\d{2}):(\d{2}))$/;
    function isValidISODateTimeString(dateTimeString) {
      return isValidISO8601String(dateTimeString) && isValidDate(dateTimeString);
    }
    function isValidISOTimeString(timeString) {
      if (!isValidISO8601TimeString(timeString)) {
        return false;
      }

      const timeOnly = removeTimeZoneSuffix(timeString);
      return isValidDate(`2018-09-09T${timeOnly}Z`);
    }
    function removeTimeZoneSuffix(dateTimeString) {
      if (typeof dateTimeString === 'string') {
        return dateTimeString.split(TIMEZONE_INDICATOR)[0];
      }

      return dateTimeString;
    }

    function isValidISO8601String(dateTimeString) {
      if (typeof dateTimeString !== 'string') {
        return false;
      }

      return ISO8601_STRICT_PATTERN.test(dateTimeString);
    }

    function isValidISO8601TimeString(timeString) {
      if (typeof timeString !== 'string') {
        return false;
      }

      return ISO8601_TIME_PATTERN.test(timeString);
    }

    function isValidDate(value) {
      // Date.parse returns NaN if the argument doesn't represent a valid date
      const timeStamp = Date.parse(value);
      return isFinite(timeStamp);
    }

    var _tmpl$1 = void 0;

    var labelSecondsLater = 'in a few seconds';

    var labelSecondsAgo = 'a few seconds ago';

    const fallbackFutureLabel = 'in {0} {1}'; // e.g. in 1 minute

    const fallbackPastLabel = '{0} {1} ago'; // e.g. 1 minute ago

    const fallbackPluralSuffix = 's'; // plural suffix for the units, e.g. in 10 minutes
    // The threshold values come from moment.js

    const units = {
      SECONDS: {
        name: 'second',
        threshold: 45
      },
      // a few seconds to minute
      MINUTES: {
        name: 'minute',
        threshold: 45
      },
      // minutes to hour
      HOURS: {
        name: 'hour',
        threshold: 22
      },
      // hours to day
      DAYS: {
        name: 'day',
        threshold: 26
      },
      // days to month
      MONTHS: {
        name: 'month',
        threshold: 11
      },
      // months to year
      YEARS: {
        name: 'year'
      }
    };
    const SECOND_TO_MILLISECONDS = 1000;
    const MINUTE_TO_MILLISECONDS = 6e4; // 60 * SECOND_TO_MILLISECONDS;

    const HOUR_TO_MILLISECONDS = 36e5; // 60 * MINUTE_TO_MILLISECONDS

    const DAY_TO_MILLISECONDS = 864e5; // 24 * HOUR_TO_MILLISECONDS;

    class Duration {
      constructor(milliseconds) {
        this.milliseconds = 0;

        if (typeof milliseconds !== 'number') {
          this.isValid = false; // eslint-disable-next-line no-console

          console.warn(`The value of milliseconds passed into Duration must be of type number, 
                but we are getting the ${typeof milliseconds} value "${milliseconds}" instead.
                `);
          return;
        }

        this.isValid = true;
        this.milliseconds = milliseconds;
      }

      humanize(locale) {
        if (!this.isValid) {
          return '';
        }

        const unit = findBestUnitMatch(this);

        if (unit === units.SECONDS) {
          const isLater = this.milliseconds > 0;
          return isLater ? labelSecondsLater : labelSecondsAgo;
        }

        return format(locale, this.asIn(unit), unit.name);
      }

      asIn(unit) {
        switch (unit) {
          case units.SECONDS:
            return Math.round(this.milliseconds / SECOND_TO_MILLISECONDS);

          case units.MINUTES:
            return Math.round(this.milliseconds / MINUTE_TO_MILLISECONDS);

          case units.HOURS:
            return Math.round(this.milliseconds / HOUR_TO_MILLISECONDS);

          case units.DAYS:
            return Math.round(this.milliseconds / DAY_TO_MILLISECONDS);

          case units.MONTHS:
            return Math.round(daysToMonth(this.milliseconds / DAY_TO_MILLISECONDS));

          case units.YEARS:
          default:
            return Math.round(daysToMonth(this.milliseconds / DAY_TO_MILLISECONDS) / 12);
        }
      }

    }

    var Duration$1 = lwc.registerComponent(Duration, {
      tmpl: _tmpl$1
    });

    function daysToMonth(days) {
      // 400 years have 146097 days (taking into account leap year rules)
      // 400 years have 12 months === 4800
      const daysToMonthRatio = 4800 / 146097;
      return days * daysToMonthRatio;
    }

    function findBestUnitMatch(duration) {
      // Traversing the object keys in order from Seconds to Years
      // http://exploringjs.com/es6/ch_oop-besides-classes.html#_traversal-order-of-properties
      const match = Object.keys(units).find(key => {
        const unit = units[key]; // Year is the max and doesn't have a threshold

        return unit === units.YEARS || Math.abs(duration.asIn(unit)) < unit.threshold;
      });
      return units[match];
    }

    function format(locale, value, unit) {
      if ('Intl' in window && Intl.RelativeTimeFormat) {
        const formatter = new Intl.RelativeTimeFormat(locale, {
          style: 'long',
          numeric: 'always'
        });
        return formatter.format(value, unit);
      }

      return fallbackFormatter(value, unit);
    }

    function fallbackFormatter(value, unit) {
      // eslint-disable-next-line no-console
      console.warn(`The current environment does not support formatters for relative time.`);
      const absoluteValue = Math.abs(value);
      const unitString = absoluteValue !== 1 ? unit + fallbackPluralSuffix : unit;
      const label = value > 0 ? fallbackFutureLabel : fallbackPastLabel;
      return formatString(label, absoluteValue, unitString);
    }

    function formatString(str, ...args) {
      return str.replace(/{(\d+)}/g, (match, i) => {
        return args[i];
      });
    }

    // default implementation of localization service for en-US locale. This covers the current usage of the localizationService in the code base.
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DATE_FORMAT = {
      short: 'M/d/yyyy',
      medium: 'MMM d, yyyy',
      long: 'MMMM d, yyyy'
    };
    const TIME_FORMAT = {
      short: 'h:mm a',
      medium: 'h:mm:ss a',
      long: 'h:mm:ss a'
    }; // The parseTime method normalizes the time format so that minor deviations are accepted

    const TIME_FORMAT_SIMPLE = {
      short: 'h:m a',
      medium: 'h:m:s a',
      long: 'h:m:s a'
    }; // Only works with dates and iso strings
    // formats the date object by ignoring the timezone offset
    // e.g. assume date is Mar 11 2019 00:00:00 GMT+1100:
    // formatDate(date, 'YYYY-MM-DD') -> 2019-03-11

    function formatDate(value, format) {
      let isUTC = false;
      let dateString = value;

      if (typeof value === 'string') {
        dateString = value.split(TIME_SEPARATOR)[0];
        isUTC = true;
      }

      return formatDateInternal(dateString, format, isUTC);
    } // Only works with date objects.
    // formats the date object according to UTC.
    // e.g. assume date is Mar 11 2019 00:00:00 GMT+1100:
    // formatDateUTC(date, 'YYYY-MM-DD') -> 2019-03-10


    function formatDateUTC(value, format) {
      return formatDateInternal(value, format, true);
    } // Only works with a date object


    function formatTime(date, format) {
      if (!isDate(date)) {
        return new Date('');
      }

      const hours = (date.getHours() + 11) % 12 + 1;
      const suffix = date.getHours() >= 12 ? 'PM' : 'AM';

      switch (format) {
        case STANDARD_TIME_FORMAT:
          // 16:12:32.000
          return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${doublePad(date.getMilliseconds())}`;

        case TIME_FORMAT.short:
          // 4:12 PM;
          return `${hours}:${pad(date.getMinutes())} ${suffix}`;

        case TIME_FORMAT.medium:
        case TIME_FORMAT.long:
        default:
          // 4:12:32 PM;
          return `${hours}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${suffix}`;
      }
    } // Only works with a date object
    // formats the date object according to UTC.
    // e.g. assume date is Mar 11 2019 00:00:00 GMT+1100:
    // formatDateTimeUTC(date) -> 2019-03-10  1:00:00 PM


    function formatDateTimeUTC(value) {
      if (!isDate(value)) {
        return new Date('');
      }

      const date = new Date(value.getTime());
      return `${formatDateUTC(date)}, ${formatTime(addTimezoneOffset(date))}`;
    } // parses ISO8601 date/time strings. Currently only used to parse ISO time strings without a TZD. Some examples:
    // 20:00:00.000             -> Feb 26 2019 20:00:00 GMT-0500
    // 2019-03-11               -> Mar 11 2019 00:00:00 GMT-0400
    // 2019-03-11T00:00:00.000Z -> Mar 10 2019 20:00:00 GMT-0400


    function parseDateTimeISO8601(value) {
      let isoString = null;
      let shouldAddOffset = true;

      if (isValidISOTimeString(value)) {
        isoString = `2014-03-20T${addTimezoneSuffix(value)}`;
      } else if (isValidISODateTimeString(value)) {
        if (value.indexOf(TIME_SEPARATOR) > 0) {
          isoString = addTimezoneSuffix(value);
          shouldAddOffset = false;
        } else {
          isoString = `${value}T00:00:00.000Z`;
        }
      }

      if (isoString) {
        // Browsers differ on how they treat iso strings without a timezone offset (local vs utc time)
        const parsedDate = new Date(isoString);

        if (shouldAddOffset) {
          addTimezoneOffset(parsedDate);
        }

        return parsedDate;
      }

      return null;
    } // called by the datepicker and calendar for parsing iso and formatted date strings
    // called by the timepicker to parse the formatted time string


    function parseDateTime(value, format) {
      if (format === STANDARD_DATE_FORMAT && isValidISODateTimeString(value)) {
        return parseDateTimeISO8601(value);
      }

      if (Object.values(DATE_FORMAT).includes(format)) {
        return parseFormattedDate(value, format);
      }

      if (Object.values(TIME_FORMAT_SIMPLE).includes(format)) {
        return parseFormattedTime(value);
      }

      return null;
    } // The input to this method is always an ISO string with timezone offset.


    function parseDateTimeUTC(value) {
      return parseDateTimeISO8601(addTimezoneSuffix(value));
    }

    function isBefore(date1, date2, unit) {
      const normalizedDate1 = getDate(date1);
      const normalizedDate2 = getDate(date2);

      if (!normalizedDate1 || !normalizedDate2) {
        return false;
      }

      return startOf(normalizedDate1, unit).getTime() < startOf(normalizedDate2, unit).getTime();
    } // unit can be millisecond, minute, day


    function isAfter(date1, date2, unit) {
      const normalizedDate1 = getDate(date1);
      const normalizedDate2 = getDate(date2);

      if (!normalizedDate1 || !normalizedDate2) {
        return false;
      }

      return startOf(normalizedDate1, unit).getTime() > startOf(normalizedDate2, unit).getTime();
    } // We're not doing timezone conversion in the default config. Only converting from UTC to system timezone


    function UTCToWallTime(date, timezone, callback) {
      const utcDate = new Date(date.getTime());
      callback(subtractTimezoneOffset(utcDate));
    } // We're not doing timezone conversion in the default config. Only converting from system timezone to UTC


    function WallTimeToUTC(date, timezone, callback) {
      const localDate = new Date(date.getTime());
      callback(addTimezoneOffset(localDate));
    } // We're assuming en-US locale so we don't need translation between calendar systems


    function translateToOtherCalendar(date) {
      return date;
    } // We're assuming en-US locale so we don't need translation between calendar systems


    function translateFromOtherCalendar(date) {
      return date;
    } // This is called from the numberFormat library when the value exceeds the safe length.
    // We currently rely on aura to format large numbers


    function getNumberFormat() {
      return {
        format: value => {
          // eslint-disable-next-line no-console
          console.warn(`The current environment does not support large numbers and the original value of ${value} will be returned.`);
          return value;
        }
      };
    } // relativeDateTime (currently the only user of duration) uses unit="minutes"
    // The default implementation here assumes the unit is always minutes.


    function duration(minutes) {
      return new Duration$1(minutes * 60 * 1000);
    }

    function displayDuration(value) {
      return value.humanize('en');
    } // parses a time string formatted in en-US locale i.e. h:mm:ss a


    function parseFormattedTime(value) {
      // for time strings it's easier to just split on :.\s
      const values = value.trim().split(/[:.\s*]/); // at least two parts i.e. 12 PM, and at most 5 parts i.e. 12:34:21.432 PM

      const length = values.length;

      if (!values || length < 2 || length > 5) {
        return null;
      }

      const ampm = values[length - 1];
      const isBeforeNoon = ampm.toLowerCase() === 'am';
      const isAfternoon = ampm.toLowerCase() === 'pm'; // remove ampm

      values.splice(-1, 1);
      const allNumbers = values.every(item => !isNaN(item));

      if (!isAfternoon && !isBeforeNoon || !allNumbers) {
        return null;
      }

      const hours = values[0];
      const hour24 = pad(isAfternoon ? hours % 12 + 12 : hours % 12);
      const minutes = length >= 3 && values[1] || '0';
      const seconds = length >= 4 && values[2] || '0';
      const milliseconds = length === 5 && values[3] || '0';
      const newDate = new Date('2014-03-20');
      newDate.setHours(hour24, minutes, seconds, milliseconds);
      return isDate(newDate) ? newDate : null;
    } // parses a date string formatted in en-US locale, i.e. MMM d, yyyy


    function parseFormattedDate(value, format) {
      // default to medium style pattern
      let pattern = /^([a-zA-Z]{3})\s*(\d{1,2}),\s*(\d{4})$/;

      switch (format) {
        case DATE_FORMAT.short:
          pattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
          break;

        case DATE_FORMAT.long:
          pattern = /^([a-zA-Z]+)\s*(\d{1,2}),\s*(\d{4})$/;
          break;

        default:
      } // matches[1]: month, matches[2]: day, matches[3]: year


      const match = pattern.exec(value.trim());

      if (!match) {
        return null;
      }

      let month = match[1];
      const day = match[2];
      const year = match[3]; // for long and medium style formats, we need to find the month index

      if (format !== DATE_FORMAT.short) {
        month = MONTH_NAMES.findIndex(item => item.toLowerCase().includes(month.toLowerCase())); // the actual month for the ISO string is 1 more than the index

        month += 1;
      }

      const isoValue = `${year}-${pad(month)}-${pad(day)}`;
      const newDate = new Date(`${isoValue}T00:00:00.000Z`);
      return isDate(newDate) ? addTimezoneOffset(newDate) : null;
    }

    function formatDateInternal(value, format, isUTC) {
      const date = getDate(value);

      if (!date) {
        // return Invalid Date
        return new Date('');
      }

      if (isUTC && isDate(value)) {
        // if value is an ISO string, we already add the timezone offset when parsing the date string.
        addTimezoneOffset(date);
      }

      switch (format) {
        case STANDARD_DATE_FORMAT:
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

        case DATE_FORMAT.short:
          return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

        case DATE_FORMAT.long:
          return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

        case DATE_FORMAT.medium:
        default:
          {
            const shortMonthName = MONTH_NAMES[date.getMonth()].substring(0, 3);
            return `${shortMonthName} ${date.getDate()}, ${date.getFullYear()}`;
          }
      }
    } // unit can be 'day' or 'minute', otherwise will default to milliseconds. These are the only units that are currently used in the codebase.


    function startOf(date, unit) {
      switch (unit) {
        case 'day':
          date.setHours(0);
          date.setMinutes(0);
        // falls through

        case 'minute':
          date.setSeconds(0);
          date.setMilliseconds(0);
          break;

        default:
      }

      return date;
    }

    function isDate(value) {
      return Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime());
    }

    function addTimezoneSuffix(value) {
      // first remove TZD if the string has one, and then add Z
      return removeTimeZoneSuffix(value) + 'Z';
    }

    function addTimezoneOffset(date) {
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return date;
    }

    function subtractTimezoneOffset(date) {
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      return date;
    }

    function getDate(value) {
      if (!value) {
        return null;
      }

      if (isDate(value)) {
        return new Date(value.getTime());
      }

      if (isFinite(value) && (typeof value === 'number' || typeof value === 'string')) {
        return new Date(parseInt(value, 10));
      }

      if (typeof value === 'string') {
        return parseDateTimeISO8601(value);
      }

      return null;
    }

    function pad(n) {
      return Number(n) < 10 ? '0' + n : n;
    }

    function doublePad(n) {
      return Number(n) < 10 ? '00' + n : Number(n) < 100 ? '0' + n : n;
    }

    var localizationService = {
      formatDate,
      formatDateUTC,
      formatTime,
      formatDateTimeUTC,
      parseDateTimeISO8601,
      parseDateTime,
      parseDateTimeUTC,
      isBefore,
      isAfter,
      UTCToWallTime,
      WallTimeToUTC,
      translateToOtherCalendar,
      translateFromOtherCalendar,
      getNumberFormat,
      duration,
      displayDuration
    };

    /* eslint eslint-comments/no-use: off */

    function getConfigFromAura($A) {
      return {
        getFormFactor() {
          return $A.get('$Browser.formFactor');
        },

        getLocale() {
          return $A.get('$Locale');
        },

        getLocalizationService() {
          return $A.localizationService;
        },

        getPathPrefix() {
          return $A.getContext().getPathPrefix();
        },

        getToken(name) {
          return $A.getToken(name);
        },

        sanitizeDOM(dirty, config) {
          return $A.util.sanitizeDOM(dirty, config);
        }

      };
    }

    function createStandAloneConfig() {
      return {
        getFormFactor() {
          return 'DESKTOP';
        },

        getLocale() {
          return {
            userLocaleLang: 'en',
            userLocaleCountry: 'US',
            language: 'en',
            country: 'US',
            variant: '',
            langLocale: 'en_US',
            firstDayOfWeek: 1,
            timezone: 'America/Los_Angeles',
            isEasternNameStyle: false,
            dateFormat: 'MMM d, yyyy',
            shortDateFormat: 'M/d/yyyy',
            longDateFormat: 'MMMM d, yyyy',
            datetimeFormat: 'MMM d, yyyy h:mm:ss a',
            timeFormat: 'h:mm:ss a',
            numberFormat: '#,##0.###',
            decimal: '.',
            grouping: ',',
            zero: '0',
            percentFormat: '#,##0%',
            currencyFormat: '¤ #,##0.00;¤-#,##0.00',
            currencyCode: 'USD',
            currency: '$',
            dir: 'ltr'
          };
        },

        getLocalizationService() {
          return localizationService;
        },

        getPathPrefix() {
          return '/slds/2.9.4/';
        },

        getToken(name) {
          return void 0;
        },

        getOneConfig() {
          return {
            densitySetting: ''
          };
        }

      };
    }

    function getDefaultConfig() {
      return window.$A !== undefined && window.$A.localizationService ? getConfigFromAura(window.$A) : createStandAloneConfig();
    }

    let PROVIDED_IMPL = getDefaultConfig();
    function getPathPrefix() {
      return PROVIDED_IMPL && PROVIDED_IMPL.getPathPrefix && PROVIDED_IMPL.getPathPrefix() || '';
    }
    function getToken(name) {
      return PROVIDED_IMPL && PROVIDED_IMPL.getToken && PROVIDED_IMPL.getToken(name);
    }
    function getLocale() {
      return PROVIDED_IMPL && PROVIDED_IMPL.getLocale && PROVIDED_IMPL.getLocale();
    }
    function getIconSvgTemplates() {
      return PROVIDED_IMPL && PROVIDED_IMPL.iconSvgTemplates;
    }

    // Taken from https://github.com/jonathantneal/svg4everybody/pull/139
    // Remove this iframe-in-edge check once the following is resolved https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8323875/
    const isEdgeUA = /\bEdge\/.(\d+)\b/.test(navigator.userAgent);
    const inIframe = window.top !== window.self;
    const isIframeInEdge = isEdgeUA && inIframe;
    var isIframeInEdge$1 = lwc.registerComponent(isIframeInEdge, {
      tmpl: _tmpl$1
    });

    // Taken from https://git.soma.salesforce.com/aura/lightning-global/blob/999dc35f948246181510df6e56f45ad4955032c2/src/main/components/lightning/SVGLibrary/stamper.js#L38-L60
    function fetchSvg(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.send();

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              resolve(xhr.responseText);
            } else {
              reject(xhr);
            }
          }
        };
      });
    }

    // Which looks like it was inspired by https://github.com/jonathantneal/svg4everybody/blob/377d27208fcad3671ed466e9511556cb9c8b5bd8/lib/svg4everybody.js#L92-L107
    // Modify at your own risk!

    const newerIEUA = /\bTrident\/[567]\b|\bMSIE (?:9|10)\.0\b/;
    const webkitUA = /\bAppleWebKit\/(\d+)\b/;
    const olderEdgeUA = /\bEdge\/12\.(\d+)\b/;
    const isIE = newerIEUA.test(navigator.userAgent) || (navigator.userAgent.match(olderEdgeUA) || [])[1] < 10547 || (navigator.userAgent.match(webkitUA) || [])[1] < 537;
    const supportsSvg = !isIE && !isIframeInEdge$1;
    var supportsSvg$1 = lwc.registerComponent(supportsSvg, {
      tmpl: _tmpl$1
    });

    /**
    This polyfill injects SVG sprites into the document for clients that don't
    fully support SVG. We do this globally at the document level for performance
    reasons. This causes us to lose namespacing of IDs across sprites. For example,
    if both #image from utility sprite and #image from doctype sprite need to be
    rendered on the page, both end up as #image from the doctype sprite (last one
    wins). SLDS cannot change their image IDs due to backwards-compatibility
    reasons so we take care of this issue at runtime by adding namespacing as we
    polyfill SVG elements.

    For example, given "/assets/icons/action-sprite/svg/symbols.svg#approval", we
    replace the "#approval" id with "#${namespace}-approval" and a similar
    operation is done on the corresponding symbol element.
    **/
    const svgTagName = /svg/i;

    const isSvgElement = el => el && svgTagName.test(el.nodeName);

    const requestCache = {};
    const symbolEls = {};
    const svgFragments = {};
    const spritesContainerId = 'slds-svg-sprites';
    let spritesEl;
    function polyfill(el) {
      if (!supportsSvg$1 && isSvgElement(el)) {
        if (!spritesEl) {
          spritesEl = document.createElement('svg');
          spritesEl.xmlns = 'http://www.w3.org/2000/svg';
          spritesEl['xmlns:xlink'] = 'http://www.w3.org/1999/xlink';
          spritesEl.style.display = 'none';
          spritesEl.id = spritesContainerId;
          document.body.insertBefore(spritesEl, document.body.childNodes[0]);
        }

        Array.from(el.getElementsByTagName('use')).forEach(use => {
          // We access the href differently in raptor and in aura, probably
          // due to difference in the way the svg is constructed.
          const src = use.getAttribute('xlink:href') || use.getAttribute('href');

          if (src) {
            // "/assets/icons/action-sprite/svg/symbols.svg#approval" =>
            // ["/assets/icons/action-sprite/svg/symbols.svg", "approval"]
            const parts = src.split('#');
            const url = parts[0];
            const id = parts[1];
            const namespace = url.replace(/[^\w]/g, '-');
            const href = `#${namespace}-${id}`;

            if (url.length) {
              // set the HREF value to no longer be an external reference
              if (use.getAttribute('xlink:href')) {
                use.setAttribute('xlink:href', href);
              } else {
                use.setAttribute('href', href);
              } // only insert SVG content if it hasn't already been retrieved


              if (!requestCache[url]) {
                requestCache[url] = fetchSvg(url);
              }

              requestCache[url].then(svgContent => {
                // create a document fragment from the svgContent returned (is parsed by HTML parser)
                if (!svgFragments[url]) {
                  const svgFragment = document.createRange().createContextualFragment(svgContent);
                  svgFragments[url] = svgFragment;
                }

                if (!symbolEls[href]) {
                  const svgFragment = svgFragments[url];
                  const symbolEl = svgFragment.querySelector(`#${id}`);
                  symbolEls[href] = true;
                  symbolEl.id = `${namespace}-${id}`;
                  spritesEl.appendChild(symbolEl);
                }
              });
            }
          }
        });
      }
    }

    const validNameRe = /^([a-zA-Z]+):([a-zA-Z]\w*)$/;
    const underscoreRe = /_/g;
    let pathPrefix;
    const tokenNameMap = Object.assign(Object.create(null), {
      action: 'lightning.actionSprite',
      custom: 'lightning.customSprite',
      doctype: 'lightning.doctypeSprite',
      standard: 'lightning.standardSprite',
      utility: 'lightning.utilitySprite'
    });
    const tokenNameMapRtl = Object.assign(Object.create(null), {
      action: 'lightning.actionSpriteRtl',
      custom: 'lightning.customSpriteRtl',
      doctype: 'lightning.doctypeSpriteRtl',
      standard: 'lightning.standardSpriteRtl',
      utility: 'lightning.utilitySpriteRtl'
    });
    const defaultTokenValueMap = Object.assign(Object.create(null), {
      'lightning.actionSprite': '/assets/icons/action-sprite/svg/symbols.svg',
      'lightning.actionSpriteRtl': '/assets/icons/action-sprite/svg/symbols.svg',
      'lightning.customSprite': '/assets/icons/custom-sprite/svg/symbols.svg',
      'lightning.customSpriteRtl': '/assets/icons/custom-sprite/svg/symbols.svg',
      'lightning.doctypeSprite': '/assets/icons/doctype-sprite/svg/symbols.svg',
      'lightning.doctypeSpriteRtl': '/assets/icons/doctype-sprite/svg/symbols.svg',
      'lightning.standardSprite': '/assets/icons/standard-sprite/svg/symbols.svg',
      'lightning.standardSpriteRtl': '/assets/icons/standard-sprite/svg/symbols.svg',
      'lightning.utilitySprite': '/assets/icons/utility-sprite/svg/symbols.svg',
      'lightning.utilitySpriteRtl': '/assets/icons/utility-sprite/svg/symbols.svg'
    });

    const getDefaultBaseIconPath = (category, nameMap) => defaultTokenValueMap[nameMap[category]];

    const getBaseIconPath = (category, direction) => {
      const nameMap = direction === 'rtl' ? tokenNameMapRtl : tokenNameMap;
      return getToken(nameMap[category]) || getDefaultBaseIconPath(category, nameMap);
    };

    const getMatchAtIndex = index => iconName => {
      const result = validNameRe.exec(iconName);
      return result ? result[index] : '';
    };

    const getCategory = getMatchAtIndex(1);
    const getName = getMatchAtIndex(2);
    const isValidName = iconName => validNameRe.test(iconName);
    const getIconPath = (iconName, direction = 'ltr') => {
      pathPrefix = pathPrefix !== undefined ? pathPrefix : getPathPrefix();

      if (isValidName(iconName)) {
        const baseIconPath = getBaseIconPath(getCategory(iconName), direction);

        if (baseIconPath) {
          // This check was introduced the following MS-Edge issue:
          // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/9655192/
          // If and when this get fixed, we can safely remove this block of code.
          if (isIframeInEdge$1) {
            // protocol => 'https:' or 'http:'
            // host => hostname + port
            const origin = `${window.location.protocol}//${window.location.host}`;
            return `${origin}${pathPrefix}${baseIconPath}#${getName(iconName)}`;
          }

          return `${pathPrefix}${baseIconPath}#${getName(iconName)}`;
        }
      }

      return '';
    };
    const computeSldsClass = iconName => {
      if (isValidName(iconName)) {
        const category = getCategory(iconName);
        const name = getName(iconName).replace(underscoreRe, '-');
        return `slds-icon-${category}-${name}`;
      }

      return '';
    };

    const isSafari = window.safari && window.safari.pushNotification && window.safari.pushNotification.toString() === '[object SafariRemoteNotification]'; // [W-3421985] https://bugs.webkit.org/show_bug.cgi?id=162866
    // https://git.soma.salesforce.com/aura/lightning-global/blob/82e8bfd02846fa7e6b3e7549a64be95b619c4b1f/src/main/components/lightning/primitiveIcon/primitiveIconHelper.js#L53-L56

    function safariA11yPatch(svgElement) {
      if (!svgElement || !isSafari) {
        return;
      } // In case we're dealing with a proxied element.


      svgElement = lwc.unwrap(svgElement);
      const use = svgElement.querySelector('use');

      if (!use) {
        return;
      }

      svgElement.insertBefore(document.createTextNode('\n'), use); // If use.nextSibling is null, the text node is added to the end of
      // the list of children of the SVG element.
      // https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore

      svgElement.insertBefore(document.createTextNode('\n'), use.nextSibling);
    }

    class LightningPrimitiveIcon extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.iconName = void 0;
        this.src = void 0;
        this.svgClass = void 0;
        this.size = 'medium';
        this.variant = void 0;
        this.privateIconSvgTemplates = getIconSvgTemplates();
      }

      get inlineSvgProvided() {
        return !!this.privateIconSvgTemplates;
      }

      renderedCallback() {
        if (this.iconName !== this.prevIconName && !this.inlineSvgProvided) {
          this.prevIconName = this.iconName;
          const svgElement = this.template.querySelector('svg');
          polyfill(svgElement);
          safariA11yPatch(svgElement);
        }
      }

      get href() {
        return this.src || getIconPath(this.iconName, getLocale && getLocale().dir);
      }

      get name() {
        return getName(this.iconName);
      }

      get normalizedSize() {
        return normalizeString(this.size, {
          fallbackValue: 'medium',
          validValues: ['xx-small', 'x-small', 'small', 'medium', 'large']
        });
      }

      get normalizedVariant() {
        // NOTE: Leaving a note here because I just wasted a bunch of time
        // investigating why both 'bare' and 'inverse' are supported in
        // lightning-primitive-icon. lightning-icon also has a deprecated
        // 'bare', but that one is synonymous to 'inverse'. This 'bare' means
        // that no classes should be applied. So this component needs to
        // support both 'bare' and 'inverse' while lightning-icon only needs to
        // support 'inverse'.
        return normalizeString(this.variant, {
          fallbackValue: '',
          validValues: ['bare', 'error', 'inverse', 'warning', 'success']
        });
      }

      get computedClass() {
        const {
          normalizedSize,
          normalizedVariant
        } = this;
        const classes = classSet(this.svgClass);

        if (normalizedVariant !== 'bare') {
          classes.add('slds-icon');
        }

        switch (normalizedVariant) {
          case 'error':
            classes.add('slds-icon-text-error');
            break;

          case 'warning':
            classes.add('slds-icon-text-warning');
            break;

          case 'success':
            classes.add('slds-icon-text-success');
            break;

          case 'inverse':
          case 'bare':
            break;

          default:
            // if custom icon is set, we don't want to set
            // the text-default class
            if (!this.src) {
              classes.add('slds-icon-text-default');
            }

        }

        if (normalizedSize !== 'medium') {
          classes.add(`slds-icon_${normalizedSize}`);
        }

        return classes.toString();
      }

      resolveTemplate() {
        const name = this.iconName;

        if (isValidName(name)) {
          const [spriteName, iconName] = name.split(':');
          const template = this.privateIconSvgTemplates[`${spriteName}_${iconName}`];

          if (template) {
            return template;
          }
        }

        return _tmpl;
      }

      render() {
        if (this.inlineSvgProvided) {
          return this.resolveTemplate();
        }

        return _tmpl;
      }

    }

    lwc.registerDecorators(LightningPrimitiveIcon, {
      publicProps: {
        iconName: {
          config: 0
        },
        src: {
          config: 0
        },
        svgClass: {
          config: 0
        },
        size: {
          config: 0
        },
        variant: {
          config: 0
        }
      }
    });

    var _lightningPrimitiveIcon = lwc.registerComponent(LightningPrimitiveIcon, {
      tmpl: _tmpl
    });

    function tmpl$1($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        d: api_dynamic,
        h: api_element
      } = $api;
      return [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.state.iconName,
          "size": $cmp.size,
          "variant": $cmp.variant,
          "src": $cmp.state.src
        },
        key: 2
      }, []), $cmp.alternativeText ? api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 3
      }, [api_dynamic($cmp.alternativeText)]) : null];
    }

    var _tmpl$2 = lwc.registerTemplate(tmpl$1);
    tmpl$1.stylesheets = [];
    tmpl$1.stylesheetTokens = {
      hostAttribute: "lightning-icon_icon-host",
      shadowAttribute: "lightning-icon_icon"
    };

    /**
     * Represents a visual element that provides context and enhances usability.
     */

    class LightningIcon extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.state = {};
        this.alternativeText = void 0;
      }

      /**
       * A uri path to a custom svg sprite, including the name of the resouce,
       * for example: /assets/icons/standard-sprite/svg/test.svg#icon-heart
       * @type {string}
       */
      get src() {
        return this.privateSrc;
      }

      set src(value) {
        this.privateSrc = value; // if value is not present, then we set the state back
        // to the original iconName that was passed
        // this might happen if the user sets a custom icon, then
        // decides to revert back to SLDS by removing the src attribute

        if (!value) {
          this.state.iconName = this.iconName;
          this.classList.remove('slds-icon-standard-default');
        } // if isIE11 and the src is set
        // we'd like to show the 'standard:default' icon instead
        // for performance reasons.


        if (value && isIE11) {
          this.setDefault();
          return;
        }

        this.state.src = value;
      }
      /**
       * The Lightning Design System name of the icon.
       * Names are written in the format 'utility:down' where 'utility' is the category,
       * and 'down' is the specific icon to be displayed.
       * @type {string}
       * @required
       */


      get iconName() {
        return this.privateIconName;
      }

      set iconName(value) {
        this.privateIconName = value; // if src is set, we don't need to validate
        // iconName

        if (this.src) {
          return;
        }

        if (isValidName(value)) {
          const isAction = getCategory(value) === 'action'; // update classlist only if new iconName is different than state.iconName
          // otherwise classListMutation receives class:true and class: false and removes slds class

          if (value !== this.state.iconName) {
            classListMutation(this.classList, {
              'slds-icon_container_circle': isAction,
              [computeSldsClass(value)]: true,
              [computeSldsClass(this.state.iconName)]: false
            });
          }

          this.state.iconName = value;
        } else {
          console.warn(`<lightning-icon> Invalid icon name ${value}`); // eslint-disable-line no-console
          // Invalid icon names should render a blank icon. Remove any
          // classes that might have been previously added.

          classListMutation(this.classList, {
            'slds-icon_container_circle': false,
            [computeSldsClass(this.state.iconName)]: false
          });
          this.state.iconName = undefined;
        }
      }
      /**
       * The size of the icon. Options include xx-small, x-small, small, medium, or large.
       * The default is medium.
       * @type {string}
       * @default medium
       */


      get size() {
        return normalizeString(this.state.size, {
          fallbackValue: 'medium',
          validValues: ['xx-small', 'x-small', 'small', 'medium', 'large']
        });
      }

      set size(value) {
        this.state.size = value;
      }
      /**
       * The variant changes the appearance of a utility icon.
       * Accepted variants include inverse, success, warning, and error.
       * Use the inverse variant to implement a white fill in utility icons on dark backgrounds.
       * @type {string}
       */


      get variant() {
        return normalizeVariant(this.state.variant, this.state.iconName);
      }

      set variant(value) {
        this.state.variant = value;
      }

      connectedCallback() {
        this.classList.add('slds-icon_container');
      }

      setDefault() {
        this.state.src = undefined;
        this.state.iconName = 'standard:default';
        this.classList.add('slds-icon-standard-default');
      }

    }

    lwc.registerDecorators(LightningIcon, {
      publicProps: {
        alternativeText: {
          config: 0
        },
        src: {
          config: 3
        },
        iconName: {
          config: 3
        },
        size: {
          config: 3
        },
        variant: {
          config: 3
        }
      },
      track: {
        state: 1
      }
    });

    var _lightningIcon = lwc.registerComponent(LightningIcon, {
      tmpl: _tmpl$2
    });

    function normalizeVariant(variant, iconName) {
      // Unfortunately, the `bare` variant was implemented to do what the
      // `inverse` variant should have done. Keep this logic for as long as
      // we support the `bare` variant.
      if (variant === 'bare') {
        // TODO: Deprecation warning using strippable assertion
        variant = 'inverse';
      }

      if (getCategory(iconName) === 'utility') {
        return normalizeString(variant, {
          fallbackValue: '',
          validValues: ['error', 'inverse', 'warning', 'success']
        });
      }

      return 'inverse';
    }

    function tmpl$2($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        h: api_element,
        d: api_dynamic,
        s: api_slot
      } = $api;
      return [api_element("article", {
        className: $cmp.computedWrapperClassNames,
        key: 2
      }, [api_element("header", {
        classMap: {
          "slds-card__header": true,
          "slds-grid": true
        },
        key: 3
      }, [api_element("div", {
        classMap: {
          "slds-media": true,
          "slds-media_center": true,
          "slds-has-flexi-truncate": true
        },
        key: 4
      }, [$cmp.hasIcon ? api_element("div", {
        classMap: {
          "slds-media__figure": true
        },
        key: 6
      }, [api_custom_element("lightning-icon", _lightningIcon, {
        props: {
          "iconName": $cmp.iconName,
          "size": "small"
        },
        key: 7
      }, [])]) : null, api_element("div", {
        classMap: {
          "slds-media__body": true,
          "slds-truncate": true
        },
        key: 8
      }, [api_element("h2", {
        key: 9
      }, [api_element("span", {
        classMap: {
          "slds-text-heading_small": true
        },
        key: 10
      }, [$cmp.hasStringTitle ? api_dynamic($cmp.title) : null, !$cmp.hasStringTitle ? api_slot("title", {
        attrs: {
          "name": "title"
        },
        key: 13
      }, [], $slotset) : null])])])]), api_element("div", {
        classMap: {
          "slds-no-flex": true
        },
        key: 14
      }, [api_slot("actions", {
        attrs: {
          "name": "actions"
        },
        key: 15
      }, [], $slotset)])]), api_element("div", {
        classMap: {
          "slds-card__body": true
        },
        key: 16
      }, [api_slot("", {
        key: 17
      }, [], $slotset)]), api_element("div", {
        classMap: {
          "slds-card__footer": true
        },
        key: 18
      }, [api_slot("footer", {
        attrs: {
          "name": "footer"
        },
        key: 19
      }, [api_element("span", {
        attrs: {
          "data-id": "default-content"
        },
        key: 20
      }, [])], $slotset)])])];
    }

    var _tmpl$3 = lwc.registerTemplate(tmpl$2);
    tmpl$2.slots = ["title", "actions", "", "footer"];
    tmpl$2.stylesheets = [];
    tmpl$2.stylesheetTokens = {
      hostAttribute: "lightning-card_card-host",
      shadowAttribute: "lightning-card_card"
    };

    function isNarrow(variant) {
      return typeof variant === 'string' && variant.toLowerCase() === 'narrow';
    }
    function isBase(variant) {
      return typeof variant === 'string' && variant.toLowerCase() === 'base';
    }

    /**
     * Cards apply a container around a related grouping of information.
     * @slot title Placeholder for the card title, which can be represented by a header or h1 element.
     * The title is displayed at the top of the card, to the right of the icon.
     * Alternatively, use the title attribute if you don't need to pass in extra markup in your title.
     * @slot actions Placeholder for actionable components, such as lightning-button or lightning-button-menu.
     * Actions are displayed on the top right corner of the card next to the title.
     * @slot footer Placeholder for the card footer, which is displayed at the bottom of the card and is usually optional.
     * For example, the footer can display a "View All" link to navigate to a list view.
     * @slot default Placeholder for your content in the card body.
     */

    class LightningCard extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.title = void 0;
        this.iconName = void 0;
        this.privateVariant = 'base';
      }

      set variant(value) {
        if (isNarrow(value) || isBase(value)) {
          this.privateVariant = value;
        } else {
          this.privateVariant = 'base';
        }
      }
      /**
       * The variant changes the appearance of the card.
       * Accepted variants include base or narrow.
       * This value defaults to base.
       *
       * @type {string}
       * @default base
       */


      get variant() {
        return this.privateVariant;
      }

      renderedCallback() {
        const footerWrapper = this.template.querySelector('.slds-card__footer');
        const noFooterContent = this.template.querySelector('slot[name="footer"] [data-id="default-content"]');

        if (noFooterContent) {
          if (footerWrapper.remove) {
            footerWrapper.remove();
          } else if (footerWrapper.parentNode) {
            // IE11 doesn't support remove. https://caniuse.com/#feat=childnode-remove
            // TODO: remove when lwc can polyfill node.remove.
            footerWrapper.parentNode.removeChild(footerWrapper);
          }
        }
      }

      get computedWrapperClassNames() {
        return classSet('slds-card').add({
          'slds-card_narrow': isNarrow(this.privateVariant)
        });
      }

      get hasIcon() {
        return !!this.iconName;
      }

      get hasStringTitle() {
        return !!this.title;
      }

    }

    lwc.registerDecorators(LightningCard, {
      publicProps: {
        title: {
          config: 0
        },
        iconName: {
          config: 0
        },
        variant: {
          config: 3
        }
      },
      track: {
        privateVariant: 1
      }
    });

    var _lightningCard = lwc.registerComponent(LightningCard, {
      tmpl: _tmpl$3
    });

    function tmpl$3($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        d: api_dynamic,
        h: api_element
      } = $api;
      return [api_element("div", {
        classMap: {
          "slds-form-element__icon": true
        },
        key: 2
      }, [api_element("button", {
        classMap: {
          "slds-button": true,
          "slds-button_icon": true
        },
        attrs: {
          "type": "button"
        },
        key: 3
      }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "svgClass": $cmp.computedSvgClass,
          "iconName": $cmp.computedIconName,
          "variant": "bare"
        },
        key: 4
      }, []), api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 5
      }, [api_dynamic($cmp.i18n.buttonAlternativeText)])])])];
    }

    var _tmpl$4 = lwc.registerTemplate(tmpl$3);
    tmpl$3.stylesheets = [];
    tmpl$3.stylesheetTokens = {
      hostAttribute: "lightning-helptext_helptext-host",
      shadowAttribute: "lightning-helptext_helptext"
    };

    var labelButtonAlternativeText = 'Help';

    const isiOS = !!navigator.platform && ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;

    function tmpl$4($api, $cmp, $slotset, $ctx) {
      const {
        h: api_element
      } = $api;
      return [api_element("div", {
        classMap: {
          "slds-popover__body": true
        },
        context: {
          lwc: {
            dom: "manual"
          }
        },
        key: 2
      }, [])];
    }

    var _tmpl$5 = lwc.registerTemplate(tmpl$4);
    tmpl$4.stylesheets = [];
    tmpl$4.stylesheetTokens = {
      hostAttribute: "lightning-primitiveBubble_primitiveBubble-host",
      shadowAttribute: "lightning-primitiveBubble_primitiveBubble"
    };

    const DEFAULT_ALIGN = {
      horizontal: 'left',
      vertical: 'bottom'
    };

    class LightningPrimitiveBubble extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.state = {
          visible: false,
          contentId: ''
        };
        this.divElement = void 0;
      }

      get contentId() {
        return this.state.contentId;
      }

      set contentId(value) {
        this.state.contentId = value;

        if (this.state.inDOM) {
          this.divEl.setAttribute('id', this.state.contentId);
        }
      }

      connectedCallback() {
        this.updateClassList();
        this.state.inDOM = true;
      }

      disconnectedCallback() {
        this.state.inDOM = false;
      }

      renderedCallback() {
        // set content manually once rendered
        // - this is required to avoid the content update being in the wrong 'tick'
        this.setContentManually();
        this.setIdManually();
      }

      set content(value) {
        this.state.content = value;

        if (this.state.inDOM) {
          this.setContentManually();
        }
      }

      get content() {
        return this.state.content || '';
      }

      get align() {
        return this.state.align || DEFAULT_ALIGN;
      }

      set align(value) {
        this.state.align = value;
        this.updateClassList();
      }

      get visible() {
        return this.state.visible;
      }

      set visible(value) {
        this.state.visible = value;
        this.updateClassList();
      }

      setIdManually() {
        this.divElement = this.divElement ? this.divElement : this.template.querySelector('div');
        this.divElement.setAttribute('id', this.state.contentId);
      } // manually set the content value


      setContentManually() {
        /* manipulate DOM directly */
        this.template.querySelector('.slds-popover__body').textContent = this.state.content;
      } // compute class value for this bubble


      updateClassList() {
        const classes = classSet('slds-popover').add('slds-popover_tooltip'); // show or hide bubble

        classes.add({
          'slds-rise-from-ground': this.visible,
          'slds-fall-into-ground': !this.visible
        }); // apply the proper nubbin CSS class

        const {
          horizontal,
          vertical
        } = this.align;
        classes.add({
          'slds-nubbin_top-left': horizontal === 'left' && vertical === 'top',
          'slds-nubbin_top-right': horizontal === 'right' && vertical === 'top',
          'slds-nubbin_bottom-left': horizontal === 'left' && vertical === 'bottom',
          'slds-nubbin_bottom-right': horizontal === 'right' && vertical === 'bottom',
          'slds-nubbin_bottom': horizontal === 'center' && vertical === 'bottom',
          'slds-nubbin_top': horizontal === 'center' && vertical === 'top',
          'slds-nubbin_left': horizontal === 'left' && vertical === 'center',
          'slds-nubbin_right': horizontal === 'right' && vertical === 'center'
        });
        classListMutation(this.classList, classes);
      }

    }

    lwc.registerDecorators(LightningPrimitiveBubble, {
      publicProps: {
        contentId: {
          config: 3
        },
        content: {
          config: 3
        },
        align: {
          config: 3
        },
        visible: {
          config: 3
        }
      },
      track: {
        state: 1
      }
    });

    var LightningPrimitiveBubble$1 = lwc.registerComponent(LightningPrimitiveBubble, {
      tmpl: _tmpl$5
    });

    function getBubbleAlignAndPosition(triggerBoundingClientRect, bubbleBoundingClientRect, defaultAlign, shiftAmounts, availableHeight, availableWidth, xOffset, yOffset) {
      let align = {
        horizontal: defaultAlign.horizontal,
        vertical: defaultAlign.vertical
      };
      let positionAt = {
        top: null,
        right: null,
        bottom: null,
        left: null
      };
      const bubbleOverflows = getBubbleOverflows(triggerBoundingClientRect, bubbleBoundingClientRect, shiftAmounts, availableWidth, availableHeight); // evaluate where the bubble should be positioned

      const alignAndPosition = calculateAlignAndPosition(align, positionAt, bubbleOverflows, triggerBoundingClientRect, bubbleBoundingClientRect, availableWidth, availableHeight);
      align = alignAndPosition.alignment;
      positionAt = alignAndPosition.positioning;
      const result = {
        align
      }; // assign default values for position bottom & left based on trigger element if needed
      // - default anchor point of popover is bottom center attached to trigger element's top center

      positionAt.bottom = positionAt.top || positionAt.top === 0 ? null : availableHeight - triggerBoundingClientRect.top; // set the left positioning default according to vertical alignment when needed

      let defaultLeft = align.vertical === 'center' ? triggerBoundingClientRect.right : triggerBoundingClientRect.left; // don't use the default if we already have a value

      if (positionAt.left) {
        defaultLeft = positionAt.left;
      }

      positionAt.left = positionAt.right || positionAt.right === 0 ? null : defaultLeft;
      const shiftByVertical = align.vertical === 'center' ? 0 : shiftAmounts.vertical;
      let shiftByHorizontal = align.horizontal === 'center' ? 0 : shiftAmounts.horizontal; // Change horizontal shift value to opposite value (negative or positive)
      // :: needed to push the bubble away from the trigger instead of into it when positioned on left or right

      if (align.vertical === 'center') {
        shiftByHorizontal *= -1;
      } // apply calculated position values


      result.top = positionAt.top ? positionAt.top + shiftByVertical + yOffset + 'px' : positionAt.top;
      result.right = positionAt.right ? positionAt.right - shiftByHorizontal - xOffset + 'px' : positionAt.right;
      result.bottom = positionAt.bottom ? positionAt.bottom + shiftByVertical - yOffset + 'px' : positionAt.bottom;
      result.left = positionAt.left ? positionAt.left - shiftByHorizontal + xOffset + 'px' : positionAt.left;
      return result;
    }
    function getNubbinShiftAmount(nubbinComputedStyles, triggerWidth) {
      // calculate smallest positive value of horizontal nubbin distance, right or left
      // - the nubbin is the pointy element on the bubble
      const nubbinShiftLeft = parseInt(nubbinComputedStyles.left, 10) || -1;
      const nubbinShiftRight = parseInt(nubbinComputedStyles.right, 10) || -1; // check which measurement is the lesser of the two (closest to edge)

      let nubbinShift = nubbinShiftLeft < nubbinShiftRight ? nubbinShiftLeft : nubbinShiftRight; // use the positive, greater than zero, shift value

      if (nubbinShift < 0 && nubbinShiftLeft < 0 && nubbinShiftRight > 0) {
        nubbinShift = nubbinShiftRight;
      }

      if (nubbinShift < 0 && nubbinShiftRight < 0 && nubbinShiftLeft > 0) {
        nubbinShift = nubbinShiftLeft;
      }

      return {
        horizontal: nubbinShift - triggerWidth / 2,
        // prettier-ignore
        vertical: parseInt(nubbinComputedStyles.height, 10)
      };
    } //
    // Utility functions (for reduced complexity)
    //

    function getBubbleOverflows(triggerBoundingClientRect, bubbleBoundingClientRect, shiftAmounts, availableWidth, availableHeight) {
      const bubbleOverflows = {}; // evaluate in which directions the bubble overflows
      // is the bubble overflowing if positioned above the trigger?

      bubbleOverflows.top = triggerBoundingClientRect.top - (bubbleBoundingClientRect.height + shiftAmounts.vertical) < 0; // is the bubble overflowing if halfway positioned above the trigger?
      // :: useful for vertical center calculation

      bubbleOverflows.topCenter = triggerBoundingClientRect.top - bubbleBoundingClientRect.height / 2 < 0; // is the bubble overflowing if positioned below the trigger?

      bubbleOverflows.bottom = triggerBoundingClientRect.bottom + bubbleBoundingClientRect.height + shiftAmounts.vertical > availableHeight; // is the bubble overflowing if positioned to the right of the trigger?

      bubbleOverflows.right = triggerBoundingClientRect.left + bubbleBoundingClientRect.width > availableWidth; // is the bubble overflowing if halfway positioned to the right of the trigger?
      // :: useful for horizontal center calculation

      bubbleOverflows.rightCenter = triggerBoundingClientRect.left + bubbleBoundingClientRect.width / 2 > availableWidth; // is the bubble overflowing if positioned to the left of the trigger?

      bubbleOverflows.left = triggerBoundingClientRect.right - bubbleBoundingClientRect.width < 0; // is the bubble overflowing if halfway positioned to the left of the trigger?
      // :: useful for horizontal center calculation

      bubbleOverflows.leftCenter = triggerBoundingClientRect.right - bubbleBoundingClientRect.width / 2 < 0;
      return bubbleOverflows;
    }

    function calculateAlignAndPosition(align, positionAt, bubbleOverflows, triggerBoundingClientRect, bubbleBoundingClientRect, availableWidth, availableHeight) {
      let bubbleIsVerticallyCentered = false; // if enough space to be vertically centered from top

      if (bubbleOverflows.top && !bubbleOverflows.topCenter) {
        align.vertical = 'center'; // set the bubble to be vertically centered on the trigger
        // top position of the bubble to match the following formula:
        //  <bottom of trigger> - <half the height of trigger> - <half the height of the bubble>

        positionAt.top = triggerBoundingClientRect.bottom - triggerBoundingClientRect.height / 2 - bubbleBoundingClientRect.height / 2;
        bubbleIsVerticallyCentered = true; // if overflows upwards show below trigger
      } else if (bubbleOverflows.top) {
        align.vertical = 'top';
        positionAt.top = triggerBoundingClientRect.bottom;
      } // if overflows downward show above the trigger


      if (bubbleOverflows.bottom) {
        align.vertical = 'bottom';
        positionAt.bottom = availableHeight - triggerBoundingClientRect.top;
      } // if vertically centered and overflows left then show on right


      if (bubbleIsVerticallyCentered && bubbleOverflows.left) {
        align.horizontal = 'left';
        positionAt.left = triggerBoundingClientRect.right; // if overflows to the left show on right
      } else if (bubbleOverflows.left) {
        align.horizontal = 'left';
        positionAt.left = triggerBoundingClientRect.left;
      } // if vertically centered and overflows right then show on left


      if (bubbleIsVerticallyCentered && bubbleOverflows.right) {
        align.horizontal = 'right';
        positionAt.right = availableWidth - triggerBoundingClientRect.left; // if overflows to the right show on left
      } else if (bubbleOverflows.right) {
        align.horizontal = 'right';
        positionAt.right = availableWidth - triggerBoundingClientRect.right;
      } // only horizontally center bubble if it would overflow to the right or left


      if (bubbleOverflows.left && bubbleOverflows.right && !bubbleOverflows.leftCenter && !bubbleOverflows.rightCenter) {
        align.horizontal = 'center'; // set the bubble to be horizontally centered on the trigger
        // left position of the bubble to match the following formula:
        //  <left edge of trigger> - <half the width of trigger> - <half the width of the bubble>

        positionAt.left = triggerBoundingClientRect.left + triggerBoundingClientRect.width / 2 - bubbleBoundingClientRect.width / 2;
        positionAt.right = null;
      }

      return {
        alignment: align,
        positioning: positionAt
      };
    }

    const i18n = {
      buttonAlternativeText: labelButtonAlternativeText
    };
    /**
     * Generate a unique id for the shared bubble instance. Note that primitive bubble uses
     * lwc:dom="manual" which makes the id static. For elements that are described by BUBBLE_ID, we
     * should use setAttribute with aria-describedby and BUBBLE_ID directly.
     */

    const BUBBLE_ID = `salesforce-lightning-helptext-bubble_${guid()}`;
    /**
     * Instance of primitive bubble shared by all helptext components.
     */

    const CACHED_BUBBLE_ELEMENT = lwc.createElement('lightning-primitive-bubble', {
      is: LightningPrimitiveBubble$1
    });
    CACHED_BUBBLE_ELEMENT.contentId = BUBBLE_ID;
    CACHED_BUBBLE_ELEMENT.style.position = 'absolute';
    CACHED_BUBBLE_ELEMENT.style.minWidth = '75px';
    const DEFAULT_ICON_NAME = 'utility:info';
    const DEFAULT_ANCHORING = {
      trigger: {
        horizontal: 'left',
        vertical: 'top'
      },
      bubble: {
        horizontal: 'left',
        vertical: 'bottom'
      }
    };
    /**
     * An icon with a text popover used for tooltips.
     */

    class LightningHelptext extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.content = '';
        this.iconName = DEFAULT_ICON_NAME;
        this.iconVariant = 'bare';
        this.state = {};
        this._initialRender = true;

        this.handleBrowserEvent = () => {
          // only perform changes for the currently focused/active trigger
          if (this.state.currentTrigger === true) {
            this.setBubblePosition();
          }
        };
      }

      connectedCallback() {
        // watch for resize & scroll events to recalculate when needed
        window.addEventListener('resize', this.handleBrowserEvent, false);
        window.addEventListener('scroll', this.handleBrowserEvent, true);
      }

      renderedCallback() {
        if (this._initialRender) {
          const buttonEle = this.template.querySelector('button');

          if (isiOS && 'ontouchstart' in document.documentElement) {
            buttonEle.addEventListener('touchstart', this.handleTouch.bind(this));
          } else {
            buttonEle.addEventListener('mouseover', this.handleMouseOver.bind(this));
            buttonEle.addEventListener('mouseout', this.handleMouseOut.bind(this));
            buttonEle.addEventListener('focusin', this.handleFocus.bind(this));
            buttonEle.addEventListener('focusout', this.handleBlur.bind(this));
          } // When retrieving BUBBLE_ID via a getter, the framework wraps the value with the
          // api_scoped_id function. This would always add a suffix to the id which would cause
          // it not match the actual id of the bubble element. Explicitly setting the
          // aria-describedby id here using setAttribute to avoid having the suffix.


          buttonEle.setAttribute('aria-describedby', BUBBLE_ID);
        }

        this._initialRender = false;
      }

      disconnectedCallback() {
        // remove event listeners
        window.removeEventListener('resize', this.handleBrowserEvent, false);
        window.removeEventListener('scroll', this.handleBrowserEvent, true); // handle the case where panels try to focus on element after closing

        if (this.state.currentTrigger === true) {
          this.hideBubble();
        }
      }

      get i18n() {
        return i18n;
      } // compute icon name


      get computedIconName() {
        if (isValidName(this.iconName)) {
          return this.iconName;
        }

        return DEFAULT_ICON_NAME;
      } // compute SVG CSS classes to apply to the icon


      get computedSvgClass() {
        const classes = classSet('slds-button__icon');

        switch (this.normalizedIconVariant) {
          case 'error':
            classes.add('slds-icon-text-error');
            break;

          case 'warning':
            classes.add('slds-icon-text-warning');
            break;

          case 'inverse':
          case 'bare':
            break;

          default:
            // if custom icon is set, we don't want to set
            // the text-default class
            classes.add('slds-icon-text-default');
        }

        return classes.toString();
      }

      get normalizedIconVariant() {
        // NOTE: Leaving a note here because I just wasted a bunch of time
        // investigating why both 'bare' and 'inverse' are supported in
        // lightning-primitive-icon. lightning-icon also has a deprecated
        // 'bare', but that one is synonymous to 'inverse'. This 'bare' means
        // that no classes should be applied. So this component needs to
        // support both 'bare' and 'inverse' while lightning-icon only needs to
        // support 'inverse'.
        return normalizeString(this.iconVariant, {
          fallbackValue: 'bare',
          validValues: ['bare', 'error', 'inverse', 'warning']
        });
      }

      handleTouch() {
        if (this.state.currentTrigger === true) {
          this.hideBubble();
        } else {
          this.showBubble();
        }
      } // handle mouse over event


      handleMouseOver() {
        this.showBubble();
      } // handle mouse out event


      handleMouseOut() {
        this.hideBubble();
      } // handle focus


      handleFocus() {
        this.showBubble();
      } // handle blur


      handleBlur() {
        this.hideBubble();
      } // handle resize + scroll event


      // retrieve trigger element bounding rectangle
      getTriggerBoundingRect() {
        const triggerEl = this.template.querySelector('div');
        return triggerEl ? triggerEl.getBoundingClientRect() : null;
      } // retrieve bubble element bounding rectangle (raw)


      getBubbleBoundingRect() {
        const bubbleEl = CACHED_BUBBLE_ELEMENT; // initialize position in top left corner

        bubbleEl.style.top = 0;
        bubbleEl.style.left = 0;
        bubbleEl.style.removeProperty('bottom');
        bubbleEl.style.removeProperty('right');
        return bubbleEl ? bubbleEl.getBoundingClientRect() : null;
      } // show bubble


      showBubble() {
        // set the triggered by element
        this.state.currentTrigger = true;
        const bubbleEl = CACHED_BUBBLE_ELEMENT;
        this.initBubble();
        this.setBubblePosition();
        bubbleEl.visible = true;
      } // hide bubble


      hideBubble() {
        const bubbleEl = CACHED_BUBBLE_ELEMENT; // remove the triggered by value

        this.state.currentTrigger = false;
        bubbleEl.visible = false;
      } // calculate shift amounts


      calculateShiftAmounts() {
        // only calculate once
        if (typeof this.shiftAmounts === 'undefined') {
          const bubbleEl = CACHED_BUBBLE_ELEMENT; // initialize position in top left corner

          bubbleEl.style.top = 0;
          bubbleEl.style.left = 0;
          bubbleEl.style.removeProperty('bottom');
          bubbleEl.style.removeProperty('right'); // calculate initial position of trigger element

          const triggerElRect = this.getTriggerBoundingRect(); // calculate shift to align nubbin

          const nubbinComputedStyles = window.getComputedStyle(bubbleEl, ':before') || bubbleEl.style;
          this.shiftAmounts = getNubbinShiftAmount(nubbinComputedStyles, triggerElRect.width);
        }
      } // initialize bubble element


      initBubble() {
        const bubbleEl = CACHED_BUBBLE_ELEMENT; // set the content value

        bubbleEl.content = this.content; // check if bubble element is already in DOM

        if (bubbleEl.parentNode === null) {
          document.body.appendChild(bubbleEl);
        }

        this.calculateShiftAmounts();
      } // set the position of the bubble relative to its target


      setBubblePosition() {
        const rootEl = document.documentElement;
        const bubbleEl = CACHED_BUBBLE_ELEMENT;
        const result = getBubbleAlignAndPosition(this.getTriggerBoundingRect(), this.getBubbleBoundingRect(), DEFAULT_ANCHORING.bubble, this.shiftAmounts, rootEl.clientHeight || window.innerHeight, rootEl.clientWidth || window.innerWidth, window.pageXOffset, window.pageYOffset);
        bubbleEl.align = result.align;
        bubbleEl.style.top = result.top;
        bubbleEl.style.right = result.right;
        bubbleEl.style.bottom = result.bottom;
        bubbleEl.style.left = result.left;
      }

    }

    lwc.registerDecorators(LightningHelptext, {
      publicProps: {
        content: {
          config: 0
        },
        iconName: {
          config: 0
        },
        iconVariant: {
          config: 0
        }
      },
      track: {
        state: 1
      }
    });

    var _lightningHelptext = lwc.registerComponent(LightningHelptext, {
      tmpl: _tmpl$4
    });

    function tmpl$5($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        h: api_element
      } = $api;
      return [api_element("div", {
        className: $cmp.computedClass,
        attrs: {
          "role": "status"
        },
        key: 2
      }, [$cmp.validAlternativeText ? api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 3
      }, [api_dynamic($cmp.alternativeText)]) : null, api_element("div", {
        classMap: {
          "slds-spinner__dot-a": true
        },
        key: 4
      }, []), api_element("div", {
        classMap: {
          "slds-spinner__dot-b": true
        },
        key: 5
      }, [])])];
    }

    var _tmpl$6 = lwc.registerTemplate(tmpl$5);
    tmpl$5.stylesheets = [];
    tmpl$5.stylesheetTokens = {
      hostAttribute: "lightning-spinner_spinner-host",
      shadowAttribute: "lightning-spinner_spinner"
    };

    /**
     * Displays an animated spinner.
     */

    class LightningSpinner extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.alternativeText = void 0;
        this.size = 'medium';
        this.variant = void 0;
      }

      connectedCallback() {
        this.classList.add('slds-spinner_container');
        this.template.addEventListener('mousewheel', this.stopScrolling);
        this.template.addEventListener('touchmove', this.stopScrolling);
      }

      get normalizedVariant() {
        return normalizeString(this.variant, {
          fallbackValue: 'base',
          validValues: ['base', 'brand', 'inverse']
        });
      }

      get normalizedSize() {
        return normalizeString(this.size, {
          fallbackValue: 'medium',
          validValues: ['small', 'medium', 'large']
        });
      }

      get computedClass() {
        const {
          normalizedVariant,
          normalizedSize
        } = this;
        const classes = classSet('slds-spinner'); // add variant-specific class

        if (normalizedVariant !== 'base') {
          classes.add(`slds-spinner_${normalizedVariant}`);
        } // add size-specific class


        classes.add(`slds-spinner_${normalizedSize}`);
        return classes.toString();
      } // alternativeText validation


      get validAlternativeText() {
        const hasAlternativeText = !!this.alternativeText; // if we have an empty value output a console warning

        if (!hasAlternativeText) {
          // eslint-disable-next-line no-console
          console.warn(`<lightning-spinner> The alternativeText attribute should not be empty. Please add a description of what is causing the wait.`);
        }

        return hasAlternativeText;
      } // prevent scrolling


      stopScrolling(event) {
        event.preventDefault();
      }

    }

    lwc.registerDecorators(LightningSpinner, {
      publicProps: {
        alternativeText: {
          config: 0
        },
        size: {
          config: 0
        },
        variant: {
          config: 0
        }
      }
    });

    var _lightningSpinner = lwc.registerComponent(LightningSpinner, {
      tmpl: _tmpl$6
    });

    function tmpl$6($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        d: api_dynamic,
        h: api_element,
        gid: api_scoped_id,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [api_element("button", {
        className: $cmp.computedButtonClass,
        attrs: {
          "name": $cmp.name,
          "title": $cmp.computedTitle,
          "accesskey": $cmp.computedAccessKey,
          "type": $cmp.normalizedType,
          "value": $cmp.value,
          "aria-describedby": api_scoped_id($cmp.computedAriaDescribedBy),
          "aria-label": $cmp.computedAriaLabel,
          "aria-controls": api_scoped_id($cmp.computedAriaControls),
          "aria-expanded": $cmp.computedAriaExpanded,
          "aria-live": $cmp.computedAriaLive,
          "aria-atomic": $cmp.computedAriaAtomic
        },
        props: {
          "disabled": $cmp.disabled
        },
        key: 2,
        on: {
          "focus": _m0 || ($ctx._m0 = api_bind($cmp.handleFocus)),
          "blur": _m1 || ($ctx._m1 = api_bind($cmp.handleBlur))
        }
      }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.iconName,
          "svgClass": $cmp.computedIconClass,
          "variant": "bare"
        },
        key: 3
      }, []), $cmp.alternativeText ? api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 5
      }, [api_dynamic($cmp.alternativeText)]) : null])];
    }

    var _tmpl$7 = lwc.registerTemplate(tmpl$6);
    tmpl$6.stylesheets = [];
    tmpl$6.stylesheetTokens = {
      hostAttribute: "lightning-buttonIcon_buttonIcon-host",
      shadowAttribute: "lightning-buttonIcon_buttonIcon"
    };

    const POSITION_ATTR_NAME = 'data-position-id';

    class BrowserWindow {
      get window() {
        if (!this._window) {
          this._window = window; // JTEST/Ingtegration: getComputedStyle may be null

          if (!this.window.getComputedStyle) {
            this.window.getComputedStyle = node => {
              return node.style;
            };
          }
        }

        return this._window;
      }

      mockWindow(value) {
        // For test, allow mock window.
        this._window = value;
      }

      get documentElement() {
        assert$1(this.window.document, 'Missing window.document');
        return this.window.document.documentElement;
      }

      get MutationObserver() {
        return this.window.MutationObserver;
      }

      isWindow(element) {
        return element && element.toString() === '[object Window]';
      }

    }

    const WindowManager = new BrowserWindow(); // A global

    let passiveEventsSupported;

    function supportsPassiveEvents() {
      if (typeof passiveEventsSupported !== 'boolean') {
        passiveEventsSupported = false;

        try {
          const opts = Object.defineProperty({}, 'passive', {
            get: () => {
              passiveEventsSupported = true;
            }
          });
          window.addEventListener('testPassive', null, opts);
          window.removeEventListener('testPassive', null, opts); // eslint-disable-next-line no-empty
        } catch (e) {}
      }

      return passiveEventsSupported;
    }

    function attachPassiveEvent(element, eventName, callback) {
      const options = supportsPassiveEvents() ? {
        passive: true
      } : false;
      element.addEventListener(eventName, callback, options);
      return () => {
        element.removeEventListener(eventName, callback, options);
      };
    }

    function isShadowRoot(node) {
      return node && node.nodeType === 11;
    }

    function enumerateParent(elem, stopEl, checker) {
      // document.body is not necessarily a body tag, because of the (very rare)
      // case of a frameset.
      if (!elem || elem === stopEl || elem === document.body) {
        return null;
      } // if overflow is auto and overflow-y is also auto,
      // however in firefox the opposite is not true


      try {
        // getComputedStyle throws an exception
        // if elem is not an element
        // (can happen during unrender)
        const computedStyle = WindowManager.window.getComputedStyle(elem);

        if (!computedStyle) {
          return null;
        }

        if (checker(computedStyle)) {
          return elem;
        }

        return enumerateParent(isShadowRoot(elem.parentNode) ? elem.parentNode.host : elem.parentNode, stopEl, checker);
      } catch (e) {
        return null;
      }
    }

    function getScrollableParent(elem, stopEl) {
      return enumerateParent(elem, stopEl, computedStyle => {
        const overflow = computedStyle['overflow-y'];
        return overflow === 'auto' || overflow === 'scroll';
      });
    }

    function queryOverflowHiddenParent(elem, stopEl) {
      return enumerateParent(elem, stopEl, computedStyle => {
        return computedStyle['overflow-x'] === 'hidden' || computedStyle['overflow-y'] === 'hidden';
      });
    }

    function isInDom(el) {
      if (el === WindowManager.window) {
        return true;
      }

      if (!isShadowRoot(el.parentNode) && el.parentNode && el.parentNode.tagName && el.parentNode.tagName.toUpperCase() === 'BODY') {
        return true;
      }

      if (isShadowRoot(el.parentNode) && el.parentNode.host) {
        return isInDom(el.parentNode.host);
      }

      if (el.parentNode) {
        return isInDom(el.parentNode);
      }

      return false;
    }
    function isScrolling(elem) {
      return elem.scrollHeight > elem.clientHeight;
    }
    function isDomNode(obj) {
      return obj.nodeType && (obj.nodeType === 1 || obj.nodeType === 11);
    }
    function timeout(time) {
      return new Promise(resolve => {
        // eslint-disable-next-line lwc/no-set-timeout
        setTimeout(() => {
          resolve();
        }, time);
      });
    }
    function containsScrollingElement(list) {
      const len = list.length;

      if (!len) {
        return false;
      }

      for (let i = 0; i < len; i++) {
        if (isScrolling(list[i])) {
          return true;
        }
      }

      return false;
    }
    function queryScrollableChildren(element) {
      return element.querySelectorAll('[data-scoped-scroll="true"]');
    }
    function getPositionTarget(element) {
      return element.tagName === 'TEXTAREA' ? isShadowRoot(element.parentNode) ? element.parentNode.host : element.parentNode : element;
    }
    let lastId = 1000000;
    function generateUniqueSelector() {
      return `lgcp-${lastId++}`;
    }
    function normalizeElement(element) {
      const selector = generateUniqueSelector();
      element.setAttribute(POSITION_ATTR_NAME, selector);
      element = document.querySelector(`[${POSITION_ATTR_NAME}="${selector}"]`) || element;
      return element;
    }

    function isInsideOverlay(element, modalOnly) {
      if (!element) {
        return false;
      }

      if (element.classList && (element.classList.contains('uiModal') || !modalOnly && element.classList.contains('uiPanel'))) {
        return true;
      }

      if (!element.parentNode) {
        return false;
      }

      return isInsideOverlay(isShadowRoot(element.parentNode) ? element.parentNode.host : element.parentNode, modalOnly);
    }

    function isInsideModal(element) {
      return isInsideOverlay(element, true);
    }
    function normalizePosition(element, nextIndex, target, alignWidth) {
      // Set element position to fixed
      // 1. element is inside overlay
      // or 2. When element isn't align with target's width, and target's parent has overflow-x:hidden setting.
      const isFixed = isInsideOverlay(element) || !alignWidth && queryOverflowHiddenParent(target, WindowManager.window);
      element.style.position = isFixed ? 'fixed' : 'absolute';
      element.style.zIndex = nextIndex || 0;
      element.style.left = '-9999px'; // Avoid flicker

      element.style.top = '0px'; // Avoid flicker

      return element;
    }
    function requestAnimationFrameAsPromise() {
      return new Promise(resolve => {
        requestAnimationFrame(() => resolve());
      });
    }

    const Direction = {
      Center: 'center',
      Middle: 'middle',
      Right: 'right',
      Left: 'left',
      Bottom: 'bottom',
      Top: 'top',
      Default: 'default'
    };
    const VerticalMap = {
      top: Direction.Top,
      bottom: Direction.Bottom,
      center: Direction.Middle
    };
    const HorizontalMap = {
      left: Direction.Left,
      right: Direction.Right,
      center: Direction.Center
    };
    const FlipMap = {
      left: Direction.Right,
      right: Direction.Left,
      top: Direction.Bottom,
      bottom: Direction.Top,
      default: Direction.Right
    };

    function getWindowSize() {
      return {
        width: WindowManager.window.innerWidth || document.body.clientWidth || 0,
        height: WindowManager.window.innerHeight || document.body.clientHeight || 0
      };
    }

    function normalizeDirection(direction, defaultValue) {
      return normalizeString(direction, {
        fallbackValue: defaultValue || Direction.Default,
        validValues: [Direction.Center, Direction.Right, Direction.Left, Direction.Bottom, Direction.Top, Direction.Middle, Direction.Default]
      });
    }
    function mapToHorizontal(value) {
      value = normalizeDirection(value, Direction.Left);
      return HorizontalMap[value];
    }
    function mapToVertical(value) {
      value = normalizeDirection(value, Direction.Left);
      return VerticalMap[value];
    }
    function flipDirection(value) {
      value = normalizeDirection(value, Direction.Left);
      return FlipMap[value];
    }
    function checkFlipPossibility(element, target, leftAsBoundary) {
      const viewPort = getWindowSize();
      const elemRect = element.getBoundingClientRect();
      const referenceElemRect = target.getBoundingClientRect();
      const height = typeof elemRect.height !== 'undefined' ? elemRect.height : elemRect.bottom - elemRect.top;
      const width = typeof elemRect.width !== 'undefined' ? elemRect.width : elemRect.right - elemRect.left;
      const hasSpaceAbove = referenceElemRect.top >= height;
      const hasSpaceBelow = viewPort.height - referenceElemRect.bottom >= height;
      const shouldAlignToRight = referenceElemRect.right >= width && // enough space on the left
      viewPort.width - referenceElemRect.left < width; // not enough space on the right

      const shouldAlignToLeft = referenceElemRect.left + width <= viewPort.width && referenceElemRect.right - width < (leftAsBoundary ? referenceElemRect.left : 0);
      return {
        shouldAlignToLeft,
        shouldAlignToRight,
        hasSpaceAbove,
        hasSpaceBelow
      };
    }

    class Transformer {
      constructor(pad, boxDirections, transformX, transformY) {
        this.pad = pad || 0;
        this.boxDirections = boxDirections || {
          left: true,
          right: true
        };

        this.transformX = transformX || function () {};

        this.transformY = transformY || function () {};
      }

      transform() {// no-op
      }

    }

    class TopTransformer extends Transformer {
      transform(targetBox, elementBox) {
        return {
          top: this.transformY(targetBox.top, targetBox, elementBox) + this.pad
        };
      }

    }

    class BottomTransFormer extends Transformer {
      transform(targetBox, elementBox) {
        return {
          top: this.transformY(targetBox.top, targetBox, elementBox) - elementBox.height - this.pad
        };
      }

    }

    class CenterTransformer extends Transformer {
      transform(targetBox, elementBox) {
        return {
          left: Math.floor(this.transformX(targetBox.left, targetBox, elementBox) - 0.5 * elementBox.width)
        };
      }

    }

    class MiddleTransformer extends Transformer {
      transform(targetBox, elementBox) {
        return {
          top: Math.floor(0.5 * (2 * targetBox.top + targetBox.height - elementBox.height))
        };
      }

    }

    class LeftTransformer extends Transformer {
      transform(targetBox, elementBox) {
        return {
          left: this.transformX(targetBox.left, targetBox, elementBox) + this.pad
        };
      }

    }

    class RightTransformer extends Transformer {
      transform(targetBox, elementBox) {
        return {
          left: this.transformX(targetBox.left, targetBox, elementBox) - elementBox.width - this.pad
        };
      }

    }

    class BelowTransformer extends Transformer {
      transform(targetBox, elementBox) {
        const top = targetBox.top + targetBox.height + this.pad;
        return elementBox.top < top ? {
          top
        } : {};
      }

    }

    const MIN_HEIGHT = 36; // Minimum Line Height

    const MIN_WIDTH = 36;

    class ShrinkingBoxTransformer extends Transformer {
      transform(targetBox, elementBox) {
        const retBox = {};

        if (this.boxDirections.top && elementBox.top < targetBox.top + this.pad) {
          retBox.top = targetBox.top + this.pad;
          retBox.height = Math.max(elementBox.height - (retBox.top - elementBox.top), MIN_HEIGHT);
        }

        if (this.boxDirections.left && elementBox.left < targetBox.left + this.pad) {
          retBox.left = targetBox.left + this.pad;
          retBox.width = Math.max(elementBox.width - (retBox.left - elementBox.left), MIN_WIDTH);
        }

        if (this.boxDirections.right && elementBox.left + elementBox.width > targetBox.left + targetBox.width - this.pad) {
          retBox.right = targetBox.left + targetBox.width - this.pad;
          retBox.width = Math.max(retBox.right - (retBox.left || elementBox.left), MIN_WIDTH);
        }

        if (this.boxDirections.bottom && elementBox.top + elementBox.height > targetBox.top + targetBox.height - this.pad) {
          retBox.bottom = targetBox.top + targetBox.height - this.pad;
          retBox.height = Math.max(retBox.bottom - (retBox.top || elementBox.top), MIN_HEIGHT);
        }

        return retBox;
      }

    }

    class BoundingBoxTransformer extends Transformer {
      transform(targetBox, elementBox) {
        const retBox = {};

        if (this.boxDirections.top && elementBox.top < targetBox.top + this.pad) {
          retBox.top = targetBox.top + this.pad;
        }

        if (this.boxDirections.left && elementBox.left < targetBox.left + this.pad) {
          retBox.left = targetBox.left + this.pad;
        }

        if (this.boxDirections.right && elementBox.left + elementBox.width > targetBox.left + targetBox.width - this.pad) {
          retBox.left = targetBox.left + targetBox.width - elementBox.width - this.pad;
        }

        if (this.boxDirections.bottom && elementBox.top + elementBox.height > targetBox.top + targetBox.height - this.pad) {
          retBox.top = targetBox.top + targetBox.height - elementBox.height - this.pad;
        }

        return retBox;
      }

    }

    class InverseBoundingBoxTransformer extends Transformer {
      transform(targetBox, elementBox) {
        const retBox = {};

        if (this.boxDirections.left && targetBox.left - this.pad < elementBox.left) {
          retBox.left = targetBox.left - this.pad;
        }

        if (this.boxDirections.right && elementBox.left + elementBox.width < targetBox.left + targetBox.width + this.pad) {
          retBox.left = targetBox.width + this.pad - elementBox.width + targetBox.left;
        }

        if (this.boxDirections.top && targetBox.top < elementBox.top + this.pad) {
          retBox.top = targetBox.top - this.pad;
        }

        if (this.boxDirections.bottom && elementBox.top + elementBox.height < targetBox.top + targetBox.height + this.pad) {
          retBox.top = targetBox.height + this.pad - elementBox.height + targetBox.top;
        }

        return retBox;
      }

    }

    const TransformFunctions = {
      center(input, targetBox) {
        return Math.floor(input + 0.5 * targetBox.width);
      },

      right(input, targetBox) {
        return input + targetBox.width;
      },

      left(input) {
        return input;
      },

      bottom(input, targetBox) {
        return input + targetBox.height;
      }

    };
    const Transformers = {
      top: TopTransformer,
      bottom: BottomTransFormer,
      center: CenterTransformer,
      middle: MiddleTransformer,
      left: LeftTransformer,
      right: RightTransformer,
      below: BelowTransformer,
      'bounding box': BoundingBoxTransformer,
      'shrinking box': ShrinkingBoxTransformer,
      'inverse bounding box': InverseBoundingBoxTransformer,
      default: Transformer
    };
    function toTransformFunctions(value) {
      return TransformFunctions[value] || TransformFunctions.left;
    }

    class TransformBuilder {
      type(value) {
        this._type = value;
        return this;
      }

      align(horizontal, vertical) {
        this._transformX = toTransformFunctions(horizontal);
        this._transformY = toTransformFunctions(vertical);
        return this;
      }

      pad(value) {
        this._pad = parseInt(value, 10);
        return this;
      }

      boxDirections(value) {
        this._boxDirections = value;
        return this;
      }

      build() {
        const AConstructor = Transformers[this._type] ? Transformers[this._type] : Transformers[Direction.Default];
        return new AConstructor(this._pad || 0, this._boxDirections || {}, this._transformX || toTransformFunctions(Direction.left), this._transformY || toTransformFunctions(Direction.left));
      }

    }

    class Constraint {
      constructor(type, config) {
        const {
          target,
          element,
          pad,
          boxDirections
        } = config;
        const {
          horizontal,
          vertical
        } = config.targetAlign;
        this._element = element;
        this._targetElement = target;
        this.destroyed = false;
        this._transformer = new TransformBuilder().type(type).align(horizontal, vertical).pad(pad).boxDirections(boxDirections).build();
      }

      detach() {
        this._disabled = true;
      }

      attach() {
        this._disabled = false;
      }

      computeDisplacement() {
        if (!this._disabled) {
          this._targetElement.refresh();

          this._element.refresh();

          this._pendingBox = this._transformer.transform(this._targetElement, this._element);
        }

        return this;
      }

      computePosition() {
        const el = this._element;

        if (!this._disabled) {
          Object.keys(this._pendingBox).forEach(key => {
            el.setDirection(key, this._pendingBox[key]);
          });
        }

        return this;
      }

      destroy() {
        this._element.release();

        this._targetElement.release();

        this._disabled = true;
        this.destroyed = true;
      }

    }

    class ElementProxy {
      constructor(el, id) {
        this.id = id;
        this.width = 0;
        this.height = 0;
        this.left = 0;
        this.top = 0;
        this.right = 0;
        this.bottom = 0;
        this._dirty = false;
        this._node = null;
        this._releaseCb = null;

        if (!el) {
          throw new Error('Element missing');
        } // W-3262919
        // for some reason I cannot figure out sometimes the
        // window, which clearly a window object, is not the window object
        // this will correct that. It might be related to locker


        if (WindowManager.isWindow(el)) {
          el = WindowManager.window;
        }

        this._node = el;
        this.setupObserver();
        this.refresh();
      }

      setupObserver() {
        // this check is because phantomjs does not support
        // mutation observers. The consqeuence here
        // is that any browser without mutation observers will
        // fail to update dimensions if they changwe after the proxy
        // is created and the proxy is not not refreshed
        if (WindowManager.MutationObserver && !this._node.isObserved) {
          // Use mutation observers to invalidate cache. It's magic!
          this._observer = new WindowManager.MutationObserver(this.refresh.bind(this)); // do not observe the window

          if (!WindowManager.isWindow(this._node)) {
            this._observer.observe(this._node, {
              attributes: true,
              childList: true,
              characterData: true,
              subtree: true
            });

            this._node.isObserved = true;
          }
        }
      }

      setReleaseCallback(cb, scope) {
        const scopeObj = scope || this;
        this._releaseCb = cb.bind(scopeObj);
      }

      checkNodeIsInDom() {
        // if underlying DOM node is gone,
        // this proxy should be released
        if (!isInDom(this._node)) {
          return false;
        }

        return true;
      }

      refresh() {
        const w = WindowManager.window;

        if (!this.isDirty()) {
          if (!this.checkNodeIsInDom()) {
            return this.release();
          }

          let box, x, scrollTop, scrollLeft;

          if (typeof w.pageYOffset !== 'undefined') {
            scrollTop = w.pageYOffset;
            scrollLeft = w.pageXOffset;
          } else {
            scrollTop = w.scrollY;
            scrollLeft = w.scrollX;
          }

          if (!WindowManager.isWindow(this._node)) {
            // force paint
            // eslint-disable-next-line no-unused-vars
            const offsetHeight = this._node.offsetHeight;
            box = this._node.getBoundingClientRect(); // not using integers causes weird rounding errors
            // eslint-disable-next-line guard-for-in

            for (x in box) {
              this[x] = Math.floor(box[x]);
            }

            this.top = Math.floor(this.top + scrollTop);
            this.bottom = Math.floor(this.top + box.height);
            this.left = Math.floor(this.left + scrollLeft);
            this.right = Math.floor(this.left + box.width);
          } else {
            box = {};
            this.width = WindowManager.documentElement.clientWidth;
            this.height = WindowManager.documentElement.clientHeight;
            this.left = scrollLeft;
            this.top = scrollTop;
            this.right = WindowManager.documentElement.clientWidth + scrollLeft;
            this.bottom = WindowManager.documentElement.clientHeight;
          }

          this._dirty = false;
        }

        return this._dirty;
      }

      getNode() {
        return this._node;
      }

      isDirty() {
        return this._dirty;
      }

      bake() {
        const w = WindowManager.window;

        const absPos = this._node.getBoundingClientRect();

        const style = w.getComputedStyle(this._node) || this._node.style;

        const hasPageOffset = typeof w.pageYOffset !== 'undefined';
        const scrollTop = hasPageOffset ? w.pageYOffset : w.scrollY;
        const scrollLeft = hasPageOffset ? w.pageXOffset : w.scrollX;
        const originalLeft = style.left.match(/auto|fixed/) ? '0' : parseInt(style.left.replace('px', ''), 10);
        const originalTop = style.top.match(/auto|fixed/) ? '0' : parseInt(style.top.replace('px', ''), 10);
        const leftDif = Math.round(this.left - (absPos.left + scrollLeft));
        const topDif = this.top - (absPos.top + scrollTop);
        this._node.style.left = `${originalLeft + leftDif}px`;
        this._node.style.top = `${originalTop + topDif}px`;

        if (this._restoreSize) {
          // Only store the first height/width which is the original height/width.
          this.originalHeight = this.originalHeight || this._node.style.height;
          this.originalWidth = this.originalWidth || this._node.style.width;
          this._node.style.width = `${this.width}px`;
          this._node.style.height = `${this.height}px`;
        }

        this._dirty = false;
      }

      setDirection(direction, val) {
        this[direction] = val;
        this._dirty = true; // if size is changed, should restore the original size.

        if (direction === 'height' || direction === 'width') {
          this._restoreSize = true;
        }
      }

      release() {
        if (this._restoreSize) {
          this._node.style.width = this.originalWidth;
          this._node.style.height = this.originalHeight;

          if (this._removeMinHeight) {
            this._node.style.minHeight = '';
          }
        }

        if (this._releaseCb) {
          this._releaseCb(this);
        }
      }

      querySelectorAll(selector) {
        return this._node.querySelectorAll(selector);
      }

    }

    class ProxyCache {
      constructor() {
        this.proxyCache = {};
      }

      get count() {
        return Object.keys(this.proxyCache).length;
      }

      releaseOrphanProxies() {
        for (const proxy in this.proxyCache) {
          if (!this.proxyCache[proxy].el.checkNodeIsInDom()) {
            this.proxyCache[proxy].el.release();
          }
        }
      }

      bakeOff() {
        for (const proxy in this.proxyCache) {
          if (this.proxyCache[proxy].el.isDirty()) {
            this.proxyCache[proxy].el.bake();
          }
        }
      }

      getReferenceCount(proxy) {
        const id = proxy.id;

        if (!id || !this.proxyCache[id]) {
          return 0;
        }

        return this.proxyCache[id].refCount;
      }

      release(proxy) {
        const proxyInstance = this.proxyCache[proxy.id];

        if (proxyInstance) {
          --proxyInstance.refCount;
        }

        if (proxyInstance && proxyInstance.refCount <= 0) {
          delete this.proxyCache[proxy.id];
        }
      }

      reset() {
        this.proxyCache = {};
      }

      create(element) {
        let key = 'window';

        if (!WindowManager.isWindow(element)) {
          key = element ? element.getAttribute(POSITION_ATTR_NAME) : null; // 1 - Node.ELEMENT_NODE, 11 - Node.DOCUMENT_FRAGMENT_NODE

          assert$1(key && element.nodeType && (element.nodeType !== 1 || element.nodeType !== 11), `Element Proxy requires an element and has property ${POSITION_ATTR_NAME}`);
        }

        if (this.proxyCache[key]) {
          this.proxyCache[key].refCount++;
          return this.proxyCache[key].el;
        }

        const newProxy = new ElementProxy(element, key);
        newProxy.setReleaseCallback(release, newProxy);
        this.proxyCache[key] = {
          el: newProxy,
          refCount: 1
        }; // run GC

        timeout(0).then(() => {
          this.releaseOrphanProxies();
        });
        return this.proxyCache[key].el;
      }

    }

    const elementProxyCache = new ProxyCache();
    function bakeOff() {
      elementProxyCache.bakeOff();
    }
    function release(proxy) {
      return elementProxyCache.release(proxy);
    }
    function createProxy(element) {
      return elementProxyCache.create(element);
    }

    class RepositionQueue {
      constructor() {
        this.callbacks = [];
        this.repositionScheduled = false;
        this._constraints = [];
        this.timeoutId = 0;
        this.lastIndex = 7000;
        this.eventsBound = false;
      }

      get nextIndex() {
        return this.lastIndex++;
      }

      get constraints() {
        return this._constraints;
      }

      set constraints(value) {
        this._constraints = this._constraints.concat(value);
      }

      dispatchRepositionCallbacks() {
        while (this.callbacks.length > 0) {
          this.callbacks.shift()();
        }
      }

      add(callback) {
        if (typeof callback === 'function') {
          this.callbacks.push(callback);
          return true;
        }

        return false;
      }

      scheduleReposition(callback) {
        if (this.timeoutId === 0) {
          // eslint-disable-next-line lwc/no-set-timeout
          this.timeoutId = setTimeout(() => {
            this.reposition(callback);
          }, 10);
        }
      }

      reposition(callback) {
        // all the callbacks will be called
        if (typeof callback === 'function') {
          this.callbacks.push(callback);
        } // this is for throttling


        clearTimeout(this.timeoutId);
        this.timeoutId = 0; // this semaphore is to make sure
        // if reposition is called twice within one frame
        // we only run this once

        if (!this.repositionScheduled) {
          requestAnimationFrame(() => {
            this.repositionScheduled = false; // this must be executed in order or constraints
            // will behave oddly

            this._constraints = this._constraints.filter(constraint => {
              if (!constraint.destroyed) {
                constraint.computeDisplacement().computePosition();
                return true;
              }

              return false;
            });
            bakeOff();
            this.dispatchRepositionCallbacks();
          });
          this.repositionScheduled = true;
        }
      }

      get repositioning() {
        if (!this._reposition) {
          this._reposition = this.scheduleReposition.bind(this);
        }

        return this._reposition;
      }

      bindEvents() {
        if (!this.eventsBound) {
          window.addEventListener('resize', this.repositioning);
          window.addEventListener('scroll', this.repositioning);
          this.eventsBound = true;
        }
      }

      detachEvents() {
        window.removeEventListener('resize', this.repositioning);
        window.removeEventListener('scroll', this.repositioning);
        this.eventsBound = false;
      }

    }

    const positionQueue = new RepositionQueue();
    function scheduleReposition(callback) {
      positionQueue.scheduleReposition(callback);
    }
    function bindEvents() {
      positionQueue.bindEvents();
    }
    function addConstraints(list) {
      positionQueue.constraints = list;
    }
    function reposition(callback) {
      positionQueue.reposition(callback);
    }
    function nextIndex() {
      return positionQueue.nextIndex;
    }

    class Relationship {
      constructor(config, constraintList, scrollableParent) {
        this.config = config;
        this.constraintList = constraintList;
        this.scrollableParent = scrollableParent;
      }

      disable() {
        this.constraintList.forEach(constraintToDisable => {
          constraintToDisable.detach();
        });
      }

      enable() {
        this.constraintList.forEach(constraintToEnable => {
          constraintToEnable.attach();
        });
      }

      destroy() {
        if (this.config.removeListeners) {
          this.config.removeListeners();
          this.config.removeListeners = undefined;
        }

        while (this.constraintList.length > 0) {
          this.constraintList.pop().destroy();
        } // Clean up node appended to body of dom


        if (this.config.appendToBody && this.config.element) {
          const nodeToRemove = document.querySelector(`[${POSITION_ATTR_NAME}="${this.config.element.getAttribute(POSITION_ATTR_NAME)}"]`);

          if (nodeToRemove) {
            nodeToRemove.parentNode.removeChild(nodeToRemove);
          }
        }
      }

      reposition() {
        return new Promise(resolve => {
          reposition(() => {
            resolve();
          });
        });
      }

    }

    const DEFAULT_MIN_HEIGHT = '1.875rem';

    function setupObserver(config, scrollableParent) {
      let proxyWheelEvents = true;

      if (WindowManager.MutationObserver && !config.element.isObserved) {
        // phantomjs :(
        let scrollableChildren = queryScrollableChildren(config.element);
        const observer = new WindowManager.MutationObserver(() => {
          scrollableChildren = queryScrollableChildren(config.element);
          proxyWheelEvents = !containsScrollingElement(scrollableChildren);
        });

        if (containsScrollingElement(scrollableChildren)) {
          proxyWheelEvents = false;
        }

        observer.observe(config.element, {
          attributes: true,
          subtree: true,
          childList: true
        });
        config.element.isObserved = true;
      }

      if (scrollableParent) {
        const scrollRemovalFunction = attachPassiveEvent(scrollableParent, 'scroll', scheduleReposition); // if the target element is inside a
        // scrollable element, we need to make sure
        // scroll events move that element,
        // not the parent, also we need to reposition on scroll

        const wheelRemovalFunction = attachPassiveEvent(config.element, 'wheel', e => {
          if (proxyWheelEvents && scrollableParent && typeof scrollableParent.scrollTop !== 'undefined') {
            scrollableParent.scrollTop += e.deltaY;
          }
        });

        config.removeListeners = () => {
          scrollRemovalFunction();
          wheelRemovalFunction();
        };
      }
    }

    function validateConfig(config) {
      assert$1(config.element && isDomNode(config.element), 'Element is undefined or missing, or not a Dom Node');
      assert$1(config.target && (WindowManager.isWindow(config.target) || isDomNode(config.target)), 'Target is undefined or missing');
    }

    function createRelationship(config) {
      bindEvents();
      config.element = normalizePosition(config.element, nextIndex(), config.target, config.alignWidth);

      if (config.alignWidth && config.element.style.position === 'fixed') {
        config.element.style.width = config.target.getBoundingClientRect().width + 'px';
      }

      const constraintList = [];
      const scrollableParent = getScrollableParent(getPositionTarget(config.target), WindowManager.window); // This observer and the test for scrolling children
      // is so that if a panel contains a scroll we do not
      // proxy the events to the "parent"  (actually the target's parent)

      setupObserver(config, scrollableParent);

      if (config.appendToBody) {
        document.body.appendChild(config.element);
      }

      config.element = createProxy(config.element);
      config.target = createProxy(config.target); // Add vertical constraint.

      const verticalConfig = Object.assign({}, config);

      if (verticalConfig.padTop !== undefined) {
        verticalConfig.pad = verticalConfig.padTop;
      } // Add horizontal constraint.


      constraintList.push(new Constraint(mapToHorizontal(config.align.horizontal), config));
      constraintList.push(new Constraint(mapToVertical(config.align.vertical), verticalConfig));
      const autoShrink = config.autoShrink.height || config.autoShrink.width;

      if (config.scrollableParentBound && scrollableParent) {
        const parent = normalizeElement(scrollableParent);
        const boxConfig = {
          element: config.element,
          enabled: config.enabled,
          target: createProxy(parent),
          align: {},
          targetAlign: {},
          pad: 3,
          boxDirections: {
            top: true,
            bottom: true,
            left: true,
            right: true
          }
        };

        if (autoShrink) {
          const style = boxConfig.element.getNode().style;

          if (!style.minHeight) {
            style.minHeight = DEFAULT_MIN_HEIGHT;
            boxConfig.element._removeMinHeight = true;
          }

          boxConfig.boxDirections = {
            top: !!config.autoShrink.height,
            bottom: !!config.autoShrink.height,
            left: !!config.autoShrink.width,
            right: !!config.autoShrink.width
          };
          constraintList.push(new Constraint('shrinking box', boxConfig));
        } else {
          constraintList.push(new Constraint('bounding box', boxConfig));
        }
      }

      addConstraints(constraintList);
      reposition();
      return new Relationship(config, constraintList, scrollableParent);
    }

    function isAutoFlipHorizontal(config) {
      return config.autoFlip || config.autoFlipHorizontal;
    }

    function isAutoFlipVertical(config) {
      return config.autoFlip || config.autoFlipVertical;
    }

    function normalizeConfig(config) {
      config.align = config.align || {};
      config.targetAlign = config.targetAlign || {};
      const {
        shouldAlignToLeft,
        shouldAlignToRight,
        hasSpaceAbove,
        hasSpaceBelow
      } = checkFlipPossibility(config.element, config.target, config.leftAsBoundary);
      const {
        align,
        targetAlign
      } = config;
      let vFlip = false;

      if (align.vertical === Direction.Bottom) {
        vFlip = isAutoFlipVertical(config) ? !hasSpaceAbove && hasSpaceBelow : false;
      } else if (align.vertical === Direction.Top) {
        vFlip = isAutoFlipVertical(config) ? hasSpaceAbove && !hasSpaceBelow : false;
      }

      let hFlip = false;

      if (align.horizontal === Direction.Left) {
        hFlip = isAutoFlipHorizontal(config) ? shouldAlignToRight : false;
      } else if (align.horizontal === Direction.Right) {
        hFlip = isAutoFlipHorizontal(config) ? shouldAlignToLeft : false;
      }

      config.isInsideModal = isInsideModal(config.element); // When inside modal, element may expand out of the viewport and be cut off.
      // So if inside modal, and don't have enough space above or below, will add bounding box rule.

      if (config.isInsideModal && !hasSpaceAbove && !hasSpaceBelow) {
        config.scrollableParentBound = true;
      }

      return {
        target: config.target,
        element: config.element,
        align: {
          horizontal: hFlip ? flipDirection(align.horizontal) : normalizeDirection(align.horizontal, Direction.Left),
          vertical: vFlip ? flipDirection(align.vertical) : normalizeDirection(align.vertical, Direction.Top)
        },
        targetAlign: {
          horizontal: hFlip ? flipDirection(targetAlign.horizontal) : normalizeDirection(targetAlign.horizontal, Direction.Left),
          vertical: vFlip ? flipDirection(targetAlign.vertical) : normalizeDirection(targetAlign.vertical, Direction.Bottom)
        },
        alignWidth: config.alignWidth,
        scrollableParentBound: config.scrollableParentBound,
        pad: config.pad,
        autoShrink: {
          height: config.autoShrink || config.autoShrinkHeight,
          width: config.autoShrink || config.autoShrinkWidth
        }
      };
    }

    function toElement(root, target) {
      if (target && typeof target === 'string') {
        return root.querySelector(target);
      } else if (target && typeof target === 'function') {
        return lwc.unwrap(target());
      }

      return target;
    }

    function startPositioning(root, config) {
      assert$1(root, 'Root is undefined or missing');
      assert$1(config, 'Config is undefined or missing');
      const node = normalizeElement(root);
      const target = toElement(node, config.target);
      const element = toElement(node, config.element); // when target/element is selector, there is chance, dom isn't present anymore.

      if (!target || !element) {
        return null;
      }

      config.target = normalizeElement(target);
      config.element = normalizeElement(element);
      validateConfig(config);
      return createRelationship(normalizeConfig(config));
    }
    function stopPositioning(relationship) {
      if (relationship) {
        relationship.destroy();
      }
    }
    class AutoPosition {
      constructor(root) {
        this._autoPositionUpdater = null;
        this._root = root;
      }

      start(config) {
        return requestAnimationFrameAsPromise().then(() => {
          let promise = Promise.resolve();

          if (!this._autoPositionUpdater) {
            this._autoPositionUpdater = startPositioning(this._root, config);
          } else {
            promise = promise.then(() => {
              return this._autoPositionUpdater.reposition();
            });
          }

          return promise.then(() => {
            return this._autoPositionUpdater;
          });
        });
      }

      stop() {
        if (this._autoPositionUpdater) {
          stopPositioning(this._autoPositionUpdater);
          this._autoPositionUpdater = null;
        }

        return Promise.resolve();
      }

    }

    const BUBBLE_ID$1 = `salesforce-lightning-tooltip-bubble_${guid()}`;
    /**
     * Shared instance of a primitive bubble used as a tooltip by most components. This was originally
     * defined in the helptext component which is where the minWidth style came from.
     * TODO: We may want to revisit the minWidth style with the PO and/or UX.
     */

    const CACHED_BUBBLE_ELEMENT$1 = lwc.createElement('lightning-primitive-bubble', {
      is: LightningPrimitiveBubble$1
    });
    CACHED_BUBBLE_ELEMENT$1.contentId = BUBBLE_ID$1;
    CACHED_BUBBLE_ELEMENT$1.style.position = 'absolute';
    CACHED_BUBBLE_ELEMENT$1.style.minWidth = '75px';
    const TOOLTIP_ALIGN = {
      horizontal: Direction.Center,
      vertical: Direction.Bottom
    };
    const TARGET_ALIGN = {
      horizontal: Direction.Center,
      vertical: Direction.Top
    };
    const ARIA_DESCRIBEDBY = 'aria-describedby';
    /**
     * Used as a position offset to compensate for the nubbin. The dimensions of the nubbin are not
     * included in the position library bounding box calculations. This is the size in pixels of the
     * nubbin.
     */

    const TOOLTIP_PADDING = 16;
    /**
     * Allows us to attach a tooltip to components. Typical usage is as follows:
     * - Create an instance of Tooltip
     * - Call Tooltip.initialize() to add the appropriate listeners to the element that needs a tooltip
     * See buttonIcon and buttonMenu for example usage.
     */

    class Tooltip {
      /**
       * A shared instance of primitiveBubble is used when an element is not specified in the config
       * object.
       * @param {string} value the content of the tooltip
       * @param {object} config specifies the root component, target element of the tooltip
       */
      constructor(value, config) {
        this._autoPosition = null;
        this._disabled = true;
        this._initialized = false;
        this._visible = false;
        assert$1(config.target, 'target for tooltip is undefined or missing');
        this.value = value;
        this._root = config.root;
        this._target = config.target; // If a tooltip element is not given, fall back on the globally shared instance.

        this._element = config.element;

        if (!this._element) {
          this._element = () => CACHED_BUBBLE_ELEMENT$1;

          if (CACHED_BUBBLE_ELEMENT$1.parentNode === null) {
            document.body.appendChild(CACHED_BUBBLE_ELEMENT$1);
          }
        }
      }
      /**
       * Disables the tooltip.
       */


      detach() {
        this._disabled = true;
      }
      /**
       * Enables the tooltip.
       */


      attach() {
        this._disabled = false;
      }
      /**
       * Adds the appropriate event listeners to the target element to make the tooltip appear. Also
       * links the tooltip and target element via the aria-describedby attribute for screen readers.
       */


      initialize() {
        const target = this._target();

        if (!this._initialized && target) {
          ['mouseenter', 'focus'].forEach(event => target.addEventListener(event, () => this.show())); // Unlike the tooltip in Aura, we want clicks and keys to dismiss the tooltip.

          ['mouseleave', 'blur', 'click', 'keydown'].forEach(event => target.addEventListener(event, () => this.hide()));
          const ariaDescribedBy = normalizeAriaAttribute([target.getAttribute(ARIA_DESCRIBEDBY), this._element().contentId]);
          target.setAttribute(ARIA_DESCRIBEDBY, ariaDescribedBy);
          this._initialized = true;
        }
      }

      show() {
        if (this._disabled) {
          return;
        }

        this._visible = true;

        const tooltip = this._element();

        tooltip.content = this._value;
        this.startPositioning();
      }

      hide() {
        this._visible = false;

        const tooltip = this._element();

        tooltip.visible = this._visible;
        this.stopPositioning();
      }

      get value() {
        return this._value;
      }

      set value(value) {
        this._value = value;
        this._disabled = !value;
      }

      get initialized() {
        return this._initialized;
      }

      get visible() {
        return this._visible;
      }

      startPositioning() {
        if (!this._autoPosition) {
          this._autoPosition = new AutoPosition(this._root);
        }

        this._autoPosition.start({
          target: this._target,
          element: this._element,
          align: TOOLTIP_ALIGN,
          targetAlign: TARGET_ALIGN,
          autoFlip: true,
          pad: TOOLTIP_PADDING
        }).then(autoPositionUpdater => {
          // The calculation above may have flipped the alignment of the tooltip. When the
          // tooltip flips, we need to draw the nubbin on the opposite side.
          const tooltip = this._element();

          if (tooltip) {
            tooltip.align = autoPositionUpdater ? autoPositionUpdater.config.align : TOOLTIP_ALIGN;
            tooltip.visible = this._visible;
          }
        });
      }

      stopPositioning() {
        if (this._autoPosition) {
          this._autoPosition.stop();
        }
      }

    }

    function tmpl$7($api, $cmp, $slotset, $ctx) {
      return [];
    }

    var _tmpl$8 = lwc.registerTemplate(tmpl$7);
    tmpl$7.stylesheets = [];
    tmpl$7.stylesheetTokens = {
      hostAttribute: "lightning-primitiveButton_primitiveButton-host",
      shadowAttribute: "lightning-primitiveButton_primitiveButton"
    };

    class LightningPrimitiveButton extends lwc.LightningElement {
      get disabled() {
        return this.state.disabled;
      }

      set disabled(value) {
        this.state.disabled = normalizeBoolean(value);
      }

      set accessKey(value) {
        this.state.accesskey = value;
      }

      get accessKey() {
        return this.state.accesskey;
      }

      get computedAccessKey() {
        return this.state.accesskey;
      }

      get title() {
        return this.state.title;
      }

      set title(value) {
        this.state.title = value;
      }

      get ariaLabel() {
        return this.state.ariaLabel;
      }

      set ariaLabel(value) {
        this.state.ariaLabel = value;
      }

      get computedAriaLabel() {
        return this.state.ariaLabel;
      }

      get ariaDescribedBy() {
        return this.state.ariaDescribedBy;
      }

      set ariaDescribedBy(value) {
        this.state.ariaDescribedBy = value;
      }

      get computedAriaDescribedBy() {
        return this.state.ariaDescribedBy;
      }

      get ariaControls() {
        return this.state.ariaControls;
      }

      set ariaControls(value) {
        this.state.ariaControls = value;
      }

      get computedAriaControls() {
        return this.state.ariaControls;
      }

      get ariaExpanded() {
        return this.state.ariaExpanded;
      }

      set ariaExpanded(value) {
        this.state.ariaExpanded = normalizeString(value, {
          fallbackValue: undefined,
          validValues: ['true', 'false']
        });
      }

      get computedAriaExpanded() {
        return this.state.ariaExpanded || null;
      }

      set ariaLive(value) {
        this.state.ariaLive = value;
      }

      get ariaLive() {
        return this.state.ariaLive;
      }

      get computedAriaLive() {
        return this.state.ariaLive;
      }

      get ariaAtomic() {
        return this.state.ariaAtomic || null;
      }

      set ariaAtomic(value) {
        this.state.ariaAtomic = normalizeString(value, {
          fallbackValue: undefined,
          validValues: ['true', 'false']
        });
      }

      get computedAriaAtomic() {
        return this.state.ariaAtomic || null;
      }

      focus() {}

      constructor() {
        super(); // Workaround for an IE11 bug where click handlers on button ancestors
        // receive the click event even if the button element has the `disabled`
        // attribute set.

        this.state = {
          accesskey: null,
          ariaAtomic: null,
          ariaControls: null,
          ariaDescribedBy: null,
          ariaExpanded: null,
          ariaLabel: null,
          ariaLive: null,
          disabled: false
        };

        if (isIE11) {
          this.template.addEventListener('click', event => {
            if (this.disabled) {
              event.stopImmediatePropagation();
            }
          });
        }
      }

    }

    lwc.registerDecorators(LightningPrimitiveButton, {
      publicProps: {
        disabled: {
          config: 3
        },
        accessKey: {
          config: 3
        },
        title: {
          config: 3
        },
        ariaLabel: {
          config: 3
        },
        ariaDescribedBy: {
          config: 3
        },
        ariaControls: {
          config: 3
        },
        ariaExpanded: {
          config: 3
        },
        ariaLive: {
          config: 3
        },
        ariaAtomic: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        state: 1
      }
    });

    var LightningPrimitiveButton$1 = lwc.registerComponent(LightningPrimitiveButton, {
      tmpl: _tmpl$8
    });

    const DEFAULT_SIZE = 'medium';
    const DEFAULT_VARIANT = 'border';
    const DEFAULT_TYPE = 'button';
    /**
     * An icon-only HTML button.
     */

    class LightningButtonIcon extends LightningPrimitiveButton$1 {
      constructor(...args) {
        super(...args);
        this.name = void 0;
        this.value = void 0;
        this.variant = DEFAULT_VARIANT;
        this.iconName = void 0;
        this.iconClass = void 0;
        this.size = DEFAULT_SIZE;
        this.type = DEFAULT_TYPE;
        this.alternativeText = void 0;
        this._order = null;
        this._tooltip = null;
      }

      /**
       * Text to display when the user mouses over or focuses on the button.
       * The tooltip is auto-positioned relative to the button and screen space.
       * @type {string}
       * @param {string} value - The plain text string for the tooltip
       */
      set tooltip(value) {
        if (this._tooltip) {
          this._tooltip.value = value;
        } else if (value) {
          // Note that because the tooltip target is a child element it may not be present in the
          // dom during initial rendering.
          this._tooltip = new Tooltip(value, {
            root: this,
            target: () => this.template.querySelector('button')
          });

          this._tooltip.initialize();
        }
      }

      get tooltip() {
        return this._tooltip ? this._tooltip.value : undefined;
      }

      // this is there because raptor currently doesnt support inheritance
      render() {
        return _tmpl$7;
      }

      get computedTitle() {
        return this.state.title || this.alternativeText || '';
      }

      get normalizedVariant() {
        return normalizeString(this.variant, {
          fallbackValue: DEFAULT_VARIANT,
          validValues: ['bare', 'brand', 'container', 'border', 'border-filled', 'bare-inverse', 'border-inverse']
        });
      }

      get normalizedType() {
        return normalizeString(this.type, {
          fallbackValue: DEFAULT_TYPE,
          validValues: ['button', 'reset', 'submit']
        });
      }

      get normalizedSize() {
        return normalizeString(this.size, {
          fallbackValue: DEFAULT_SIZE,
          validValues: ['xx-small', 'x-small', 'small', 'medium', 'large']
        });
      }

      getVariantBase() {
        return this.normalizedVariant.split('-')[0];
      }

      getVariantModifier() {
        return this.normalizedVariant.split('-')[1] || '';
      }

      get computedButtonClass() {
        const {
          normalizedSize,
          normalizedVariant
        } = this;
        const isBare = this.getVariantBase(normalizedSize) === 'bare';
        const classes = classSet('slds-button');

        if (!isBare) {
          // If the variant is not bare, then size the button instead of the icon
          switch (normalizedSize) {
            case 'small':
              classes.add('slds-button_icon-small');
              break;

            case 'x-small':
              classes.add('slds-button_icon-x-small');
              break;

            case 'xx-small':
              classes.add('slds-button_icon-xx-small');
              break;

            case 'large':
              // There is no `large` modifier for buttons so we should drop down one size to `medium`
              // eslint-disable-next-line no-console
              console.warn(`<lightning-button-icon> The non-bare variants of buttonIcon do not support a size value of "large". Supported values include "xx-small", "x-small", "small", and "medium". Falling back to size value "medium".`);

            /* falls through */

            case 'medium': // Medium is the default size, and the default size doesn't require a size modifier

            default:
          }
        }

        return classes.add({
          'slds-button_icon-bare': isBare,
          'slds-button_icon-container': normalizedVariant === 'container',
          'slds-button_icon-border': normalizedVariant === 'border',
          'slds-button_icon-border-filled': normalizedVariant === 'border-filled',
          'slds-button_icon-border-inverse': normalizedVariant === 'border-inverse',
          'slds-button_icon-inverse': normalizedVariant === 'bare-inverse',
          'slds-button_icon-brand': normalizedVariant === 'brand',
          'slds-button_first': this._order === 'first',
          'slds-button_middle': this._order === 'middle',
          'slds-button_last': this._order === 'last'
        }).toString();
      }

      get computedIconClass() {
        const {
          normalizedSize,
          normalizedVariant
        } = this;
        const isBare = this.getVariantBase(normalizedVariant) === 'bare';
        const iconClass = this.iconClass || '';
        const classes = classSet('slds-button__icon');
        classes.add(iconClass);

        if (isBare) {
          // If the variant is bare, then size the icon instead of the button
          switch (normalizedSize) {
            case 'large':
              classes.add('slds-button__icon_large');
              break;

            case 'small':
              classes.add('slds-button__icon_small');
              break;

            case 'xx-small':
              // There is no `xx-small` modifier for bare so we should drop down one size to `x-small`
              // eslint-disable-next-line no-console
              console.warn(`<lightning-button-icon> The bare variant of buttonIcon does not support a size value of "xx-small". Supported values include "x-small", "small", "medium", and "large". The default is "medium".`);

            /* falls through */

            case 'x-small':
              classes.add('slds-button__icon_x-small');
              break;

            case 'medium': // Medium is the default size, and the default size doesn't require a size modifier

            default:
          }
        }

        if (this.getVariantModifier(normalizedVariant) === 'inverse') {
          classes.add('slds-button_icon-inverse');
        }

        return classes.toString();
      }

      handleFocus() {
        this.dispatchEvent(new CustomEvent('focus'));
      }

      handleBlur() {
        this.dispatchEvent(new CustomEvent('blur'));
      }
      /**
       * Sets focus on the button.
       */


      focus() {
        this.template.querySelector('button').focus();
      }
      /**
       * {Function} setOrder - Sets the order value of the button when in the context of a button-group or other ordered component
       * @param {String} order -  The order string (first, middle, last)
       */


      setOrder(order) {
        this._order = order;
      }
      /**
       * Once we are connected, we fire a register event so the button-group (or other) component can register
       * the buttons.
       */


      connectedCallback() {
        const privatebuttonregister = new CustomEvent('privatebuttonregister', {
          bubbles: true,
          detail: {
            callbacks: {
              setOrder: this.setOrder.bind(this),
              setDeRegistrationCallback: deRegistrationCallback => {
                this._deRegistrationCallback = deRegistrationCallback;
              }
            }
          }
        });
        this.dispatchEvent(privatebuttonregister);
      }

      renderedCallback() {
        if (this._tooltip && !this._tooltip.initialized) {
          this._tooltip.initialize();
        }
      }

      disconnectedCallback() {
        if (this._deRegistrationCallback) {
          this._deRegistrationCallback();
        }
      }

    }

    LightningButtonIcon.delegatesFocus = true;

    lwc.registerDecorators(LightningButtonIcon, {
      publicProps: {
        name: {
          config: 0
        },
        value: {
          config: 0
        },
        variant: {
          config: 0
        },
        iconName: {
          config: 0
        },
        iconClass: {
          config: 0
        },
        size: {
          config: 0
        },
        type: {
          config: 0
        },
        alternativeText: {
          config: 0
        },
        tooltip: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        _order: 1
      }
    });

    var _lightningButtonIcon = lwc.registerComponent(LightningButtonIcon, {
      tmpl: _tmpl$7
    });

    function tmpl$8($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element,
        d: api_dynamic,
        gid: api_scoped_id,
        c: api_custom_element,
        ti: api_tab_index,
        b: api_bind,
        k: api_key,
        i: api_iterator
      } = $api;
      const {
        _m0,
        _m1,
        _m2,
        _m3,
        _m4,
        _m5,
        _m6,
        _m7,
        _m8,
        _m9
      } = $ctx;
      return [api_element("div", {
        attrs: {
          "role": "group",
          "aria-labelledby": `${api_scoped_id("group-label")}`
        },
        key: 2
      }, [api_element("div", {
        className: $cmp.computedGroupLabelClass,
        attrs: {
          "id": api_scoped_id("group-label")
        },
        key: 3
      }, [$cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true
        },
        attrs: {
          "title": $cmp.i18n.required
        },
        key: 5
      }, [api_text("*")]) : null, api_dynamic($cmp.label)]), $cmp.fieldLevelHelp ? api_custom_element("lightning-helptext", _lightningHelptext, {
        props: {
          "content": $cmp.fieldLevelHelp
        },
        key: 6
      }, []) : null, api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 7
      }, [api_element("div", {
        classMap: {
          "slds-dueling-list": true
        },
        key: 8,
        on: {
          "focusin": _m8 || ($ctx._m8 = api_bind($cmp.handleFocus)),
          "focusout": _m9 || ($ctx._m9 = api_bind($cmp.handleBlur))
        }
      }, [api_element("div", {
        classMap: {
          "slds-assistive-text": true
        },
        attrs: {
          "id": api_scoped_id("assertive-thing"),
          "aria-live": "assertive"
        },
        key: 9
      }, []), api_element("div", {
        classMap: {
          "slds-assistive-text": true
        },
        attrs: {
          "id": api_scoped_id("keyboard-interacton")
        },
        key: 10
      }, [api_dynamic($cmp.i18n.componentAssistiveText)]), api_element("div", {
        className: $cmp.computedLeftColumnClass,
        key: 11
      }, [api_element("span", {
        classMap: {
          "slds-form-element__label": true
        },
        attrs: {
          "id": api_scoped_id("source-list-label")
        },
        key: 12
      }, [api_dynamic($cmp.sourceLabel)]), api_element("div", {
        className: $cmp.computedListboxContainerClass,
        style: $cmp.computedColumnStyle,
        key: 13
      }, [api_element("ul", {
        classMap: {
          "slds-listbox": true,
          "slds-listbox_vertical": true
        },
        attrs: {
          "data-source-list": true,
          "id": api_scoped_id("source-list"),
          "aria-describedby": `${api_scoped_id("keyboard-interacton")}`,
          "aria-labelledby": `${api_scoped_id("source-list-label")}`,
          "aria-multiselectable": "true",
          "role": "listbox",
          "aria-disabled": $cmp.ariaDisabled
        },
        key: 14
      }, api_iterator($cmp.computedSourceList, function (option, index) {
        return api_element("li", {
          classMap: {
            "slds-listbox__item": true
          },
          attrs: {
            "role": "presentation"
          },
          key: api_key(16, option.value)
        }, [api_element("div", {
          className: option.classList,
          attrs: {
            "aria-selected": option.selected,
            "role": "option",
            "tabindex": api_tab_index(option.tabIndex),
            "data-index": index,
            "data-value": option.value,
            "data-type": $cmp.computedSourceListId
          },
          key: 17,
          on: {
            "click": _m0 || ($ctx._m0 = api_bind($cmp.handleOptionClick)),
            "keydown": _m1 || ($ctx._m1 = api_bind($cmp.handleOptionKeyDown))
          }
        }, [api_element("span", {
          classMap: {
            "slds-media__body": true
          },
          key: 18
        }, [api_element("span", {
          classMap: {
            "slds-truncate": true
          },
          attrs: {
            "title": option.label
          },
          key: 19
        }, [api_dynamic(option.label)])])])]);
      }))]), $cmp.showActivityIndicator ? api_element("div", {
        key: 20
      }, [api_custom_element("lightning-spinner", _lightningSpinner, {
        props: {
          "size": "small",
          "variant": "brand",
          "alternativeText": $cmp.i18n.loadingText
        },
        key: 21
      }, [])]) : null]), api_element("div", {
        classMap: {
          "slds-dueling-list__column": true
        },
        key: 22
      }, [api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        props: {
          "iconName": "utility:right",
          "variant": "container",
          "disabled": $cmp.moveButtonsDisabled,
          "title": $cmp.addButtonLabel,
          "alternativeText": $cmp.addButtonLabel
        },
        key: 23,
        on: {
          "click": _m2 || ($ctx._m2 = api_bind($cmp.handleRightButtonClick))
        }
      }, []), api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        props: {
          "iconName": "utility:left",
          "variant": "container",
          "disabled": $cmp.moveButtonsDisabled,
          "title": $cmp.removeButtonLabel,
          "alternativeText": $cmp.removeButtonLabel
        },
        key: 24,
        on: {
          "click": _m3 || ($ctx._m3 = api_bind($cmp.handleLeftButtonClick))
        }
      }, [])]), api_element("div", {
        classMap: {
          "slds-dueling-list__column": true,
          "slds-dueling-list__column_responsive": true
        },
        key: 25
      }, [api_element("span", {
        classMap: {
          "slds-form-element__label": true
        },
        attrs: {
          "id": api_scoped_id("selected-list-label")
        },
        key: 26
      }, [api_dynamic($cmp.selectedLabel)]), api_element("div", {
        className: $cmp.computedListboxContainerClass,
        style: $cmp.computedColumnStyle,
        key: 27
      }, [api_element("ul", {
        classMap: {
          "slds-listbox": true,
          "slds-listbox_vertical": true
        },
        attrs: {
          "data-selected-list": true,
          "id": api_scoped_id("selected-list"),
          "aria-describedby": `${api_scoped_id("keyboard-interacton")}`,
          "aria-labelledby": `${api_scoped_id("selected-list-label")}`,
          "aria-multiselectable": "true",
          "role": "listbox",
          "aria-disabled": $cmp.ariaDisabled
        },
        key: 28
      }, api_iterator($cmp.computedSelectedList, function (option, index) {
        return api_element("li", {
          classMap: {
            "slds-listbox__item": true
          },
          attrs: {
            "role": "presentation"
          },
          key: api_key(30, option.value)
        }, [api_element("div", {
          className: option.classList,
          attrs: {
            "aria-selected": option.selected,
            "role": "option",
            "tabindex": api_tab_index(option.tabIndex),
            "data-index": index,
            "data-value": option.value,
            "data-type": $cmp.computedSelectedListId
          },
          key: 31,
          on: {
            "click": _m4 || ($ctx._m4 = api_bind($cmp.handleOptionClick)),
            "keydown": _m5 || ($ctx._m5 = api_bind($cmp.handleOptionKeyDown))
          }
        }, [api_element("span", {
          classMap: {
            "slds-media__body": true
          },
          key: 32
        }, [api_element("span", {
          classMap: {
            "slds-truncate": true
          },
          attrs: {
            "title": option.label
          },
          key: 33
        }, [api_dynamic(option.label)])]), option.isLocked ? api_element("span", {
          classMap: {
            "slds-media__figure": true,
            "slds-media__figure_reverse": true
          },
          key: 35
        }, [api_custom_element("lightning-icon", _lightningIcon, {
          props: {
            "iconName": "utility:lock",
            "size": "x-small",
            "alternativeText": $cmp.computedLockAssistiveText
          },
          key: 36
        }, [])]) : null])]);
      }))])]), !$cmp.disableReordering ? api_element("div", {
        classMap: {
          "slds-dueling-list__column": true
        },
        key: 38
      }, [api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        props: {
          "iconName": "utility:up",
          "variant": "container",
          "disabled": $cmp.disabled,
          "title": $cmp.upButtonLabel,
          "alternativeText": $cmp.upButtonLabel
        },
        key: 39,
        on: {
          "click": _m6 || ($ctx._m6 = api_bind($cmp.handleUpButtonClick))
        }
      }, []), api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        props: {
          "iconName": "utility:down",
          "variant": "container",
          "disabled": $cmp.disabled,
          "title": $cmp.downButtonLabel,
          "alternativeText": $cmp.downButtonLabel
        },
        key: 40,
        on: {
          "click": _m7 || ($ctx._m7 = api_bind($cmp.handleDownButtonClick))
        }
      }, [])]) : null])]), $cmp.errorMessage ? api_element("span", {
        classMap: {
          "slds-has-error": true,
          "slds-form-element__help": true
        },
        attrs: {
          "id": api_scoped_id("error-message"),
          "aria-live": "assertive"
        },
        key: 42
      }, [api_dynamic($cmp.errorMessage)]) : null])];
    }

    var _tmpl$9 = lwc.registerTemplate(tmpl$8);
    tmpl$8.stylesheets = [];
    tmpl$8.stylesheetTokens = {
      hostAttribute: "lightning-dualListbox_dualListbox-host",
      shadowAttribute: "lightning-dualListbox_dualListbox"
    };

    var labelComponentAssistiveText = 'Press Ctrl (Cmd on Mac) + Left Arrow or Ctrl (Cmd on Mac) + Right Arrow to move items between lists.';

    var labelDownButtonAssistiveText = 'Move selection down';

    var labelMaxError = 'Select at most {0} options';

    var labelMaxHelp = ' [and a maximum of {0}]';

    var labelMinErrorPlural = 'Select at least {0} options';

    var labelMinErrorSingular = 'Select at least 1 option';

    var labelMinHelp = ' [and a minimum of {0}]';

    var labelMinRequiredErrorPlural = 'At least {0} options must be selected';

    var labelMinRequiredErrorSingular = 'At least 1 option must be selected';

    var labelOptionLockAssistiveText = ': item cannot be removed from {0}';

    var labelRequired = 'required';

    var labelRequiredError = 'An option must be selected';

    var labelRequiredOptionError = '{0} must be selected';

    var labelUpButtonAssistiveText = 'Move selection up';

    var labelMoveSelectionToAssistiveText = 'Move selection to {0}';

    var labelLoadingText = 'Loading';

    function preventDefaultAndStopPropagation(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    function setFocusOnNextOption(option, moveUp, intf) {
      const index = parseInt(option.getAttribute('data-index'), 10);
      const i = index + (moveUp ? -1 : 1);
      const options = intf.getElementsOfList(option.getAttribute('data-type'));
      const next = options[i];

      if (next) {
        next.focus();
      }
    }

    function selectNextOption(option, moveUp, intf) {
      const selected = option.getAttribute('aria-selected') === 'true';
      const index = parseInt(option.getAttribute('data-index'), 10);
      const i = index + (selected ? moveUp ? -1 : 1 : 0);
      const options = intf.getElementsOfList(option.getAttribute('data-type'));
      const next = options[i];

      if (next) {
        intf.updateSelectedOptions(next, true, false);
      }
    }

    function selectNextOptionFromShift(option, moveUp, isMultiple, intf) {
      const curr = parseInt(option.getAttribute('data-index'), 10);

      if (intf.getShiftIndex() < 0) {
        intf.setShiftIndex(curr);
        intf.setLastShift(moveUp);
      }

      const next = curr + (intf.getLastShift() !== moveUp ? 0 : moveUp ? -1 : 1);
      const pos = next < intf.getShiftIndex();
      const shiftAdd = pos === moveUp || intf.getShiftIndex() === next;
      const options = intf.getElementsOfList(option.getAttribute('data-type'));
      const nextOption = options[next];

      if (nextOption) {
        intf.updateSelectedOptions(nextOption, shiftAdd, true);
        intf.setLastShift(moveUp);
      }
    }

    function handleKeyDownOnOption(event, keyboardInterface) {
      if (event.metaKey || event.ctrlKey) {
        keyboardInterface.setShiftIndex(-1);
        const keyCodesA = 'A'.charCodeAt(0);
        const selected = event.target.getAttribute('aria-selected') === 'true';

        switch (event.keyCode) {
          case keyCodes.up:
            preventDefaultAndStopPropagation(event);
            setFocusOnNextOption(event.target, true, keyboardInterface);
            break;

          case keyCodes.down:
            preventDefaultAndStopPropagation(event);
            setFocusOnNextOption(event.target, false, keyboardInterface);
            break;

          case keyCodes.right:
            preventDefaultAndStopPropagation(event);
            keyboardInterface.moveOptionsBetweenLists(true);
            break;

          case keyCodes.left:
            preventDefaultAndStopPropagation(event);
            keyboardInterface.moveOptionsBetweenLists(false);
            break;

          case keyCodes.space:
            preventDefaultAndStopPropagation(event);
            keyboardInterface.updateSelectedOptions(event.target, !selected, true);
            break;

          case keyCodesA:
            preventDefaultAndStopPropagation(event);
            keyboardInterface.selectAllOptions(event.target);
            break;

          default: // do nothing

        }
      } else if (event.shiftKey) {
        switch (event.keyCode) {
          case keyCodes.up:
            preventDefaultAndStopPropagation(event);
            selectNextOptionFromShift(event.target, true, true, keyboardInterface);
            break;

          case keyCodes.down:
            preventDefaultAndStopPropagation(event);
            selectNextOptionFromShift(event.target, false, true, keyboardInterface);
            break;

          default: // do nothing

        }
      } else {
        keyboardInterface.setShiftIndex(-1);

        switch (event.keyCode) {
          case keyCodes.up:
            preventDefaultAndStopPropagation(event);
            selectNextOption(event.target, true, keyboardInterface);
            break;

          case keyCodes.down:
            preventDefaultAndStopPropagation(event);
            selectNextOption(event.target, false, keyboardInterface);
            break;

          default: // do nothing

        }
      }
    }

    let idCounter = 0;
    function generateUniqueId(prefix = 'input') {
      idCounter++;
      return `${prefix}-${idCounter}`;
    }

    /**
     Represents an object which keeps track of a user's interacting state.
     @constructor InteractingState
     @param {Object} options - The options object.
     @param {Object} [options.duration=2000] - The number of milliseconds of idle time to wait before exiting the interacting state.
     @param {Object} [options.debounceInteraction=false] - Whether to debounce interaction to ignore consecutive leave-enter interactions.
     **/

    class InteractingState {
      constructor(options) {
        const duration = options && options.duration >= 0 ? options.duration : 2000;
        this.eventemitter = new EventEmitter();
        this._interacting = false;
        this._debouncedLeave = debounce(this.leave.bind(this), duration);
        this._debounceInteraction = options && options.debounceInteraction;
        this._interactedRecently = false;

        if (this._debounceInteraction) {
          // debounce leave until a short time later
          this._debouncedEmitLeave = debounce(() => {
            if (!this._interacting) {
              this._interactedRecently = false;
              this.eventemitter.emit('leave');
            }
          }, 200); // debounce enter until left

          this._debouncedEmitEnter = () => {
            if (!this._interactedRecently) {
              this._interactedRecently = true;
              this.eventemitter.emit('enter');
            }
          };
        }
      }
      /**
       Checks whether or not we are in the interacting state.
       @method InteractingState#isInteracting
       @return {Boolean} - Whether or not we are interacting.
       **/


      isInteracting() {
        return this._interacting;
      }
      /**
       Enters the interacting state.
       @method InteractingState#enter
       @returns {void}
       **/


      enter() {
        if (!this._interacting) {
          this._interacting = true;

          if (this._debounceInteraction) {
            this._debouncedEmitEnter();
          } else {
            this.eventemitter.emit('enter');
          }
        }
      }
      /**
       Registers a handler to execute when we enter the interacting state.
       @method InteractingState#onenter
       @param {Function} handler - The callback function.
       **/


      onenter(handler) {
        this.eventemitter.on('enter', handler);
      }
      /**
       Leaves the interacting state.
       @method InteractingState#leave
       @returns {void}
       **/


      leave() {
        if (this._interacting) {
          this._interacting = false;

          if (this._debounceInteraction) {
            this._debouncedEmitLeave();
          } else {
            this.eventemitter.emit('leave');
          }
        }
      }
      /**
       Registers a handler to execute when we leave the interacting state.
       @method InteractingState#onleave
       @param {Function} handler - The callback function.
       **/


      onleave(handler) {
        this.eventemitter.on('leave', handler);
      }
      /**
       Signals the start of the transition into the interacting state and
       schedules a transition out of the interacting state after an idle
       duration. Calling this method multiple times will reset the timer.
       @method InteractingState#interacting
       @returns {void}
       **/


      interacting() {
        this.enter();

        this._debouncedLeave();
      }

    }
    /**
     Creates a debounced function that delays invoking `func` until after
     `delay` milliseconds have elapsed since the last time the debounced
     function was invoked.
     @function debounce
     @param {Function} func - The function to debounce
     @param {Number} delay - The number of milliseconds to delay
     @param {Object} options - The options object
     @param {Boolean} options.leading - Specify invoking on the leading edge of the timeout
     @return {Function} - debounced function
     **/

    function debounce(func, delay, options) {
      const _options = options || {};

      let invokeLeading = _options.leading;
      let timer;
      return function debounced() {
        const args = Array.prototype.slice.apply(arguments);

        if (invokeLeading) {
          func.apply(this, args);
          invokeLeading = false;
        }

        clearTimeout(timer); // eslint-disable-next-line lwc/no-set-timeout

        timer = setTimeout(function () {
          func.apply(this, args);
          invokeLeading = _options.leading; // reset for next debounce sequence
        }, delay);
      };
    }

    var labelBadInput = 'Enter a valid value.';

    var labelPatternMismatch = 'Your entry does not match the allowed pattern.';

    var labelRangeOverflow = 'The number is too high.';

    var labelRangeUnderflow = 'The number is too low.';

    var labelStepMismatch = 'Your entry isn\'t a valid increment.';

    var labelTooLong = 'Your entry is too long.';

    var labelTooShort = 'Your entry is too short.';

    var labelTypeMismatch = 'You have entered an invalid format.';

    var labelValueMissing = 'Complete this field.';

    const constraintsSortedByPriority = ['customError', 'badInput', 'patternMismatch', 'rangeOverflow', 'rangeUnderflow', 'stepMismatch', 'tooLong', 'tooShort', 'typeMismatch', 'valueMissing'];
    const defaultLabels = {
      badInput: labelBadInput,
      customError: labelBadInput,
      patternMismatch: labelPatternMismatch,
      rangeOverflow: labelRangeOverflow,
      rangeUnderflow: labelRangeUnderflow,
      stepMismatch: labelStepMismatch,
      tooLong: labelTooLong,
      tooShort: labelTooShort,
      typeMismatch: labelTypeMismatch,
      valueMissing: labelValueMissing
    };

    function resolveBestMatch(validity) {
      let validityState;

      if (validity && validity.valid === false) {
        validityState = 'badInput';
        constraintsSortedByPriority.some(stateName => {
          if (validity[stateName] === true) {
            validityState = stateName;
            return true;
          }

          return false;
        });
      }

      return validityState;
    }

    function computeConstraint(valueProvider, constraint) {
      const provider = valueProvider[constraint];

      if (typeof provider === 'function') {
        return provider();
      }

      if (typeof provider === 'boolean') {
        return provider;
      }

      return false;
    } // We're doing the below to avoid exposing the constraintsProvider in the ValidityState


    function newValidityState(constraintsProvider) {
      class ValidityState {
        get valueMissing() {
          return computeConstraint(constraintsProvider, 'valueMissing');
        }

        get typeMismatch() {
          return computeConstraint(constraintsProvider, 'typeMismatch');
        }

        get patternMismatch() {
          return computeConstraint(constraintsProvider, 'patternMismatch');
        }

        get tooLong() {
          return computeConstraint(constraintsProvider, 'tooLong');
        }

        get tooShort() {
          return computeConstraint(constraintsProvider, 'tooShort');
        }

        get rangeUnderflow() {
          return computeConstraint(constraintsProvider, 'rangeUnderflow');
        }

        get rangeOverflow() {
          return computeConstraint(constraintsProvider, 'rangeOverflow');
        }

        get stepMismatch() {
          return computeConstraint(constraintsProvider, 'stepMismatch');
        }

        get customError() {
          return computeConstraint(constraintsProvider, 'customError');
        }

        get badInput() {
          return computeConstraint(constraintsProvider, 'badInput');
        }

        get valid() {
          return !(this.valueMissing || this.typeMismatch || this.patternMismatch || this.tooLong || this.tooShort || this.rangeUnderflow || this.rangeOverflow || this.stepMismatch || this.customError || this.badInput);
        }

      }

      return new ValidityState();
    }

    function buildSyntheticValidity(constraintProvider) {
      return Object.freeze(newValidityState(constraintProvider));
    }
    function getErrorMessage(validity, labelMap) {
      const key = resolveBestMatch(validity);

      if (key) {
        return labelMap[key] ? labelMap[key] : defaultLabels[key];
      }

      return '';
    }
    class FieldConstraintApi {
      constructor(inputComponentProvider, constraintProviders) {
        assert$1(typeof inputComponentProvider === 'function');
        this._inputComponentProvider = inputComponentProvider;
        this._constraintsProvider = Object.assign({}, constraintProviders);

        if (!this._constraintsProvider.customError) {
          this._constraintsProvider.customError = () => typeof this._customValidityMessage === 'string' && this._customValidityMessage !== '';
        }
      }

      get validity() {
        if (!this._constraint) {
          this._constraint = buildSyntheticValidity(this._constraintsProvider);
        }

        return this._constraint;
      }

      checkValidity() {
        const isValid = this.validity.valid;

        if (!isValid) {
          if (this.inputComponent) {
            this.inputComponent.dispatchEvent(new CustomEvent('invalid', {
              cancellable: true
            }));
          }
        }

        return isValid;
      }

      reportValidity(callback) {
        const valid = this.checkValidity();
        this.inputComponent.classList.toggle('slds-has-error', !valid);

        if (callback) {
          callback(this.validationMessage);
        }

        return valid;
      }

      setCustomValidity(message) {
        this._customValidityMessage = message;
      }

      get validationMessage() {
        return getErrorMessage(this.validity, {
          customError: this._customValidityMessage,
          badInput: this.inputComponent.messageWhenBadInput,
          patternMismatch: this.inputComponent.messageWhenPatternMismatch,
          rangeOverflow: this.inputComponent.messageWhenRangeOverflow,
          rangeUnderflow: this.inputComponent.messageWhenRangeUnderflow,
          stepMismatch: this.inputComponent.messageWhenStepMismatch,
          tooShort: this.inputComponent.messageWhenTooShort,
          tooLong: this.inputComponent.messageWhenTooLong,
          typeMismatch: this.inputComponent.messageWhenTypeMismatch,
          valueMissing: this.inputComponent.messageWhenValueMissing
        });
      }

      get inputComponent() {
        if (!this._inputComponentElement) {
          this._inputComponentElement = this._inputComponentProvider();
        }

        return this._inputComponentElement;
      }

    }

    const VARIANT = {
      STANDARD: 'standard',
      LABEL_HIDDEN: 'label-hidden',
      LABEL_STACKED: 'label-stacked',
      LABEL_INLINE: 'label-inline'
    };
    /**
    A variant normalization utility for attributes.
    @param {Any} value - The value to normalize.
    @return {Boolean} - The normalized value.
    **/

    function normalizeVariant$1(value) {
      return normalizeString(value, {
        fallbackValue: VARIANT.STANDARD,
        validValues: [VARIANT.STANDARD, VARIANT.LABEL_HIDDEN, VARIANT.LABEL_STACKED, VARIANT.LABEL_INLINE]
      });
    }

    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    const i18n$1 = {
      componentAssistiveText: labelComponentAssistiveText,
      downButtonAssistiveText: labelDownButtonAssistiveText,
      maxError: labelMaxError,
      maxHelp: labelMaxHelp,
      minErrorPlural: labelMinErrorPlural,
      minErrorSingular: labelMinErrorSingular,
      minHelp: labelMinHelp,
      minRequiredErrorPlural: labelMinRequiredErrorPlural,
      minRequiredErrorSingular: labelMinRequiredErrorSingular,
      optionLockAssistiveText: labelOptionLockAssistiveText,
      required: labelRequired,
      requiredError: labelRequiredError,
      requiredOptionError: labelRequiredOptionError,
      upButtonAssistiveText: labelUpButtonAssistiveText,
      moveSelectionToAssistiveText: labelMoveSelectionToAssistiveText,
      loadingText: labelLoadingText
    };
    /**
     * A pair of listboxes that enables multiple options to be selected and reordered.
     */

    class LightningDualListbox extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.sourceLabel = void 0;
        this.selectedLabel = void 0;
        this.label = void 0;
        this.options = void 0;
        this.min = 0;
        this.max = void 0;
        this.name = void 0;
        this._showActivityIndicator = false;
        this._requiredOptions = [];
        this._selectedValues = [];
        this._variant = void 0;
        this._disabled = void 0;
        this._disableReordering = false;
        this._required = false;
        this._addButtonLabel = void 0;
        this._removeButtonLabel = void 0;
        this._upButtonLabel = void 0;
        this._downButtonLabel = void 0;
        this._size = void 0;
        this.errorMessage = '';
        this.highlightedOptions = [];
        this.focusableInSource = void 0;
        this.focusableInSelected = void 0;
        this.isFocusOnList = false;
        this.messageWhenValueMissing = i18n$1.requiredError;
        this.fieldLevelHelp = void 0;
      }

      /**
       * Error message to be displayed when a range overflow is detected.
       * @type {string}
       */
      get messageWhenRangeOverflow() {
        return this._messageWhenRangeOverflow || this._overflowMessage;
      }

      set messageWhenRangeOverflow(message) {
        this._messageWhenRangeOverflow = message;
      }
      /**
       * Error message to be displayed when a range underflow is detected.
       * @type {string}
       */


      get messageWhenRangeUnderflow() {
        return this._messageWhenRangeUnderflow || this._underflowMessage;
      }

      set messageWhenRangeUnderflow(message) {
        this._messageWhenRangeUnderflow = message;
      }
      /**
       * If present, the listbox is disabled and users cannot interact with it.
       * @type {string}
       */


      get disabled() {
        return this._disabled || false;
      }

      set disabled(value) {
        this._disabled = normalizeBoolean(value);
      }
      /**
       * If present, the user must add an item to the selected listbox before submitting the form.
       * @type {string}
       * @default false
       */


      get required() {
        return this._required;
      }

      set required(value) {
        this._required = normalizeBoolean(value);
      }
      /**
       * A list of default options that are included in the selected options listbox. This list is populated with values from the options attribute.
       * @type {list}
       */


      get value() {
        return this._selectedValues;
      }

      set value(newValue) {
        this._selectedValues = newValue || [];

        if (this._connected) {
          this.addRequiredOptionsToValue();
        }
      }
      /**
       * A list of required options that cannot be removed from selected options listbox. This list is populated with values from the options attribute.
       * @type {list}
       */


      get requiredOptions() {
        return this._requiredOptions;
      }

      set requiredOptions(newValue) {
        this._requiredOptions = newValue || [];

        if (this._connected) {
          this.addRequiredOptionsToValue();
        }
      }
      /**
       * The variant changes the appearance of the dual listbox.
       * Accepted variants include standard, label-hidden, label-inline, and label-stacked.
       * This value defaults to standard.
       * Use label-hidden to hide the label but make it available to assistive technology.
       * Use label-inline to horizontally align the label and dual listbox.
       * Use label-stacked to place the label above the dual listbox.
       * @type {string}
       */


      get variant() {
        return this._variant || VARIANT.STANDARD;
      }

      set variant(value) {
        this._variant = normalizeVariant$1(value);
        this.updateClassList();
      }

      set size(value) {
        this._size = value;
      }
      /**
       * Number of items that display in the listboxes before vertical scrollbars are displayed. Determines the vertical size of the listbox.
       * @type {number}
       * @default
       */


      get size() {
        return this._size;
      }
      /**
       * Help text detailing the purpose and function of the dual listbox.
       * @type {string}
       */


      set disableReordering(value) {
        this._disableReordering = normalizeBoolean(value);
      }
      /**
       * If present, the Up and Down buttons used for reordering the selected list items are hidden.
       * @type {boolean}
       * @default false
       */


      get disableReordering() {
        return this._disableReordering;
      }
      /**
       * If present, a spinner is displayed in the first listbox to indicate loading activity.
       * @type {boolean}
       * @default false
       */


      get showActivityIndicator() {
        return this._showActivityIndicator;
      }

      set showActivityIndicator(value) {
        this._showActivityIndicator = normalizeBoolean(value);
      }
      /**
       * Sets focus on the first option from either list.
       * If the source list doesn't contain any options, the first option on the selected list is focused on.
       */


      focus() {
        // focus on the first option from either list
        // if nothing on source, then it'll pick the one on selected
        const firstOption = this.template.querySelector(`div[data-index='0']`);

        if (firstOption) {
          firstOption.focus();
          this.updateSelectedOptions(firstOption, true, false);
        }
      }
      /**
       * Represents the validity states that an element can be in, with respect to constraint validation.
       * @type {object}
       */


      get validity() {
        return this._constraint.validity;
      }
      /**
       * Returns the valid attribute value (Boolean) on the ValidityState object.
       * @returns {boolean} Indicates whether the dual listbox meets all constraint validations.
       */


      checkValidity() {
        return this._constraint.checkValidity();
      }
      /**
       * Displays the error messages and returns false if the input is invalid.
       * If the input is valid, reportValidity() clears displayed error messages and returns true.
       * @returns {boolean} - The validity status of the input fields.
       */


      reportValidity() {
        return this._constraint.reportValidity(message => {
          this.errorMessage = message;
        });
      }
      /**
       * Sets a custom error message to be displayed when the dual listbox value is submitted.
       * @param {string} message - The string that describes the error. If message is an empty string, the error message
       *     is reset.
       */


      setCustomValidity(message) {
        this._constraint.setCustomValidity(message);
      }
      /**
       * Displays an error message if the dual listbox value is required.
       */


      showHelpMessageIfInvalid() {
        this.reportValidity();
      }

      connectedCallback() {
        this.classList.add('slds-form-element');
        this.updateClassList();
        this.keyboardInterface = this.selectKeyboardInterface();
        this._connected = true;
        this.addRequiredOptionsToValue(); // debounceInteraction since DualListbox has multiple focusable elements

        this.interactingState = new InteractingState({
          debounceInteraction: true
        });
        this.interactingState.onenter(() => {
          this.dispatchEvent(new CustomEvent('focus'));
        });
        this.interactingState.onleave(() => {
          this.showHelpMessageIfInvalid();
          this.dispatchEvent(new CustomEvent('blur'));
        });
      }

      updateClassList() {
        classListMutation(this.classList, {
          'slds-form-element_stacked': this.variant === VARIANT.LABEL_STACKED,
          'slds-form-element_horizontal': this.variant === VARIANT.LABEL_INLINE
        });
      }

      renderedCallback() {
        this.assertRequiredAttributes();

        if (this.disabled) {
          return;
        }

        if (this.optionToFocus) {
          // value could have an apostrophe, which is why we need to escape it otherwise the queryselector will not work
          const option = this.template.querySelector(`div[data-value='${this.optionToFocus.replace(/'/g, "\\'")}']`);

          if (option) {
            this.isFocusOnList = true;
            option.focus();
          }
        }
      }

      get computedUniqueId() {
        return this.uniqueId;
      }

      get computedSourceListId() {
        return getRealDOMId(this.template.querySelector('[data-source-list]'));
      }

      get computedSelectedListId() {
        return getRealDOMId(this.template.querySelector('[data-selected-list]'));
      }

      get ariaDisabled() {
        // aria-disabled works only with String not Boolean value
        return String(this.disabled);
      }

      get computedSourceList() {
        let sourceListOptions = [];

        if (this.options) {
          const required = this.requiredOptions;
          const values = this.value;
          sourceListOptions = this.options.filter(option => values.indexOf(option.value) === -1 && required.indexOf(option.value) === -1);
        }

        return this.computeListOptions(sourceListOptions, this.focusableInSource);
      }

      get computedSelectedList() {
        const selectedListOptions = [];

        if (this.options) {
          const optionsMap = {};
          this.options.forEach(option => {
            optionsMap[option.value] = _objectSpread({}, option);
          });
          this.value.forEach(optionValue => {
            const option = optionsMap[optionValue];

            if (option) {
              option.isSelected = true;
            }
          });
          this.requiredOptions.forEach(optionValue => {
            const option = optionsMap[optionValue];

            if (option) {
              option.isLocked = true;
            }
          }); // add selected items in the given order

          this.value.forEach(optionValue => {
            const option = optionsMap[optionValue];

            if (option) {
              selectedListOptions.push(option);
            }
          });
        }

        return this.computeListOptions(selectedListOptions, this.focusableInSelected);
      }

      computeListOptions(options, focusableOptionValue) {
        if (options.length > 0) {
          const focusableOption = options.find(option => {
            return option.value === focusableOptionValue;
          });
          const focusableValue = focusableOption ? focusableOption.value : options[0].value;
          return options.map(option => {
            return this.computeOptionProperties(option, focusableValue);
          });
        }

        return [];
      }

      computeOptionProperties(option, focusableValue) {
        const isSelected = this.highlightedOptions.indexOf(option.value) > -1;
        const classList = classSet('slds-listbox__option slds-listbox__option_plain slds-media slds-media_small slds-media_inline').add({
          'slds-is-selected': isSelected
        }).toString();
        return _objectSpread({}, option, {
          tabIndex: option.value === focusableValue ? '0' : '-1',
          selected: isSelected ? 'true' : 'false',
          classList
        });
      }

      get computedLeftColumnClass() {
        return classSet('slds-dueling-list__column slds-dueling-list__column_responsive').add({
          'slds-is-relative': this.showActivityIndicator
        }).toString();
      }

      get computedColumnStyle() {
        if (this.isNumber(this.size)) {
          // From the SLDS page on how to adjust the height: lightningdesignsystem.com/components/dueling-picklist/#Responsive
          const newHeight = parseInt(this.size, 10) * 2.25 + 1;
          return `height:${newHeight}rem`;
        }

        return '';
      }

      get isLabelHidden() {
        return this.variant === VARIANT.LABEL_HIDDEN;
      }

      get computedGroupLabelClass() {
        return classSet('slds-form-element__label slds-form-element__legend').add({
          'slds-assistive-text': this.isLabelHidden
        }).toString();
      }

      get computedListboxContainerClass() {
        return classSet('slds-dueling-list__options').add({
          'slds-is-disabled': this.disabled
        }).toString();
      }

      get computedLockAssistiveText() {
        return this.formatString(this.i18n.optionLockAssistiveText, this.selectedLabel);
      }

      get i18n() {
        return i18n$1;
      }

      getRightButtonAssistiveText() {
        return this.formatString(i18n$1.moveSelectionToAssistiveText, this.selectedLabel);
      }
      /**
       * Label for add button.
       * @type {string}
       * @default Move selection to {selectedLabel}
       */


      get addButtonLabel() {
        if (this._addButtonLabel) {
          return this._addButtonLabel;
        }

        return this.getRightButtonAssistiveText();
      }

      set addButtonLabel(value) {
        this._addButtonLabel = value;
      }

      getLeftButtonAssistiveText() {
        return this.formatString(i18n$1.moveSelectionToAssistiveText, this.sourceLabel);
      }
      /**
       * Label for remove button.
       * @type {string}
       * @default "Move selection to {sourceLabel}"
       */


      get removeButtonLabel() {
        if (this._removeButtonLabel) {
          return this._removeButtonLabel;
        }

        return this.getLeftButtonAssistiveText();
      }

      set removeButtonLabel(value) {
        this._removeButtonLabel = value;
      }
      /**
       * Label for up button.
       * @type {string}
       * @default "Move selection up"
       */


      get upButtonLabel() {
        return this._upButtonLabel || this.i18n.upButtonAssistiveText;
      }

      set upButtonLabel(value) {
        this._upButtonLabel = value;
      }
      /**
       * Label for down button.
       * @type {string}
       * @default "Move selection down"
       */


      get downButtonLabel() {
        return this._downButtonLabel || this.i18n.downButtonAssistiveText;
      }

      set downButtonLabel(value) {
        this._downButtonLabel = value;
      }

      get moveButtonsDisabled() {
        return this.disabled || this.showActivityIndicator;
      }

      handleOptionClick(event) {
        this.interactingState.interacting();

        if (this.disabled) {
          return;
        }

        const selectMultiple = event.metaKey || event.ctrlKey || event.shiftKey;
        const option = event.currentTarget;

        if (event.shiftKey) {
          this.selectAllFromLastSelectedToOption(option, false);
          return;
        }

        const selected = selectMultiple && option.getAttribute('aria-selected') === 'true';
        this.updateSelectedOptions(option, !selected, selectMultiple);
        this.shiftIndex = -1;
      }

      handleFocus(event) {
        this.interactingState.enter(); // select the focused option if entering a listbox

        const element = event.target;

        if (element.role === 'option') {
          if (!this.isFocusOnList) {
            this.isFocusOnList = true;
            this.updateSelectedOptions(element, true, false);
          }
        }
      }

      handleBlur(event) {
        this.interactingState.leave();
        const element = event.target;

        if (element.role !== 'option') {
          this.isFocusOnList = false;
        }
      }

      handleRightButtonClick() {
        this.interactingState.interacting();
        this.moveOptionsBetweenLists(true);
      }

      handleLeftButtonClick() {
        this.interactingState.interacting();
        this.moveOptionsBetweenLists(false);
      }

      handleUpButtonClick() {
        this.interactingState.interacting();
        this.changeOrderOfOptionsInList(true);
      }

      handleDownButtonClick() {
        this.interactingState.interacting();
        this.changeOrderOfOptionsInList(false);
      }

      handleOptionKeyDown(event) {
        this.interactingState.interacting();

        if (this.disabled) {
          return;
        }

        handleKeyDownOnOption(event, this.keyboardInterface);
      }

      moveOptionsBetweenLists(addToSelect, retainFocus) {
        const isValidList = addToSelect ? this.selectedList === this.computedSourceListId : this.selectedList === this.computedSelectedListId;

        if (!isValidList) {
          return;
        }

        const toMove = this.highlightedOptions;
        const values = this.computedSelectedList.map(option => option.value);
        const required = this.requiredOptions;
        let newValues = [];

        if (addToSelect) {
          newValues = values.concat(toMove);
        } else {
          newValues = values.filter(value => toMove.indexOf(value) === -1 || required.indexOf(value) > -1);
        }

        const oldSelectedValues = this._selectedValues;
        this._selectedValues = newValues;
        const invalidMove = this.validity.valueMissing || this.validity.rangeOverflow && this.selectedList === this.computedSourceListId || this.validity.rangeUnderflow && this.selectedList === this.computedSelectedListId;

        if (invalidMove || toMove.length === 0) {
          this.showHelpMessageIfInvalid();
          this._selectedValues = oldSelectedValues;
          return;
        }

        if (retainFocus) {
          const listId = addToSelect ? this.computedSelectedListId : this.computedSourceListId;
          this.selectedList = listId;
          this.updateFocusableOption(listId, toMove[0]);
        } else {
          this.interactingState.leave();
          this.isFocusOnList = false;
          this.highlightedOptions = [];
          this.optionToFocus = null;
        }

        this.dispatchChangeEvent(newValues);
      }

      changeOrderOfOptionsInList(moveUp) {
        const elementList = this.getElementsOfList(this.selectedList);
        const values = this.computedSelectedList.map(option => option.value);
        const toMove = values.filter(option => this.highlightedOptions.indexOf(option) > -1);
        const validSelection = toMove.length === 0 || this.selectedList !== this.computedSelectedListId;

        if (validSelection) {
          return;
        }

        let start = moveUp ? 0 : toMove.length - 1;
        let index = values.indexOf(toMove[start]);
        const validMove = moveUp && index === 0 || !moveUp && index === values.length - 1;

        if (validMove) {
          return;
        }

        if (moveUp) {
          while (start < toMove.length) {
            index = values.indexOf(toMove[start]);
            this.swapOptions(index, index - 1, values, elementList);
            start++;
          }
        } else {
          while (start > -1) {
            index = values.indexOf(toMove[start]);
            this.swapOptions(index, index + 1, values, elementList);
            start--;
          }
        }

        this._selectedValues = values;
        this.updateFocusableOption(this.selectedList, toMove[0]);
        this.optionToFocus = null;
        this.dispatchChangeEvent(values);
      }

      selectAllFromLastSelectedToOption(option, all) {
        const listId = option.getAttribute('data-type');
        this.updateCurrentSelectedList(listId, true);
        const options = this.getElementsOfList(listId);
        const end = all ? 0 : this.getOptionIndex(option);
        this.lastSelected = this.lastSelected < 0 ? end : this.lastSelected;
        const start = all ? options.length : this.lastSelected;
        let val, select;
        this.highlightedOptions = [];

        for (let i = 0; i < options.length; i++) {
          select = (i - start) * (i - end) <= 0;

          if (select) {
            val = options[i].getAttribute('data-value');
            this.highlightedOptions.push(val);
          }
        }
      }

      updateSelectedOptions(option, select, isMultiple) {
        const value = option.getAttribute('data-value');
        const listId = this.getListId(option);
        const optionIndex = this.getOptionIndex(option);
        this.updateCurrentSelectedList(listId, isMultiple);

        if (select) {
          if (this.highlightedOptions.indexOf(value) === -1) {
            this.highlightedOptions.push(value);
          }
        } else {
          this.highlightedOptions.splice(this.highlightedOptions.indexOf(value), 1);
        }

        this.updateFocusableOption(listId, value);
        this.lastSelected = optionIndex;
      }

      addRequiredOptionsToValue() {
        if (!this.options || !this.options.length || !this._requiredOptions || !this._requiredOptions.length) {
          // no options/requiredOptions, just ignore
          return;
        }

        const numOfSelectedValues = this._selectedValues.length;
        const allValues = this.options.map(option => option.value);

        const requiredValues = this._requiredOptions.filter(option => allValues.includes(option)); // add required options to the selected values as they are already displayed in the selected list


        this._selectedValues = [...new Set([...requiredValues, ...this._selectedValues])];

        if (numOfSelectedValues !== this._selectedValues.length) {
          // value was changed
          this.dispatchChangeEvent(this._selectedValues);
        }
      }

      get _constraint() {
        if (!this._constraintApi) {
          this._constraintApi = new FieldConstraintApi(() => this, {
            valueMissing: () => !this.disabled && this.required && this.computedSelectedList.length < 1,
            rangeUnderflow: () => this.computedSelectedList.length < this.min,
            rangeOverflow: () => this.computedSelectedList.length > this.max
          });
        }

        return this._constraintApi;
      }

      get _overflowMessage() {
        const minHelpMsg = this.min > 0 ? this.formatString(this.i18n.minHelp, this.min) : '';
        return this.formatString(this.i18n.maxError, this.max) + minHelpMsg;
      }

      get _underflowMessage() {
        const maxHelpMsg = this.max ? this.formatString(this.i18n.maxHelp, this.max) : '';
        const minRequiredError = this.min > 1 ? this.formatString(this.i18n.minRequiredErrorPlural, this.min) : this.i18n.minRequiredErrorSingular;
        const minError = this.min > 1 ? this.formatString(this.i18n.minErrorPlural, this.min) : this.i18n.minErrorSingular;
        return this.required ? minRequiredError + maxHelpMsg : minError + maxHelpMsg;
      }

      updateCurrentSelectedList(currentList, isMultiple) {
        if (this.selectedList !== currentList || !isMultiple) {
          if (this.selectedList) {
            this.highlightedOptions = [];
            this.lastSelected = -1;
          }

          this.selectedList = currentList;
        }
      }

      dispatchChangeEvent(values) {
        this.dispatchEvent(new CustomEvent('change', {
          composed: true,
          bubbles: true,
          detail: {
            value: values
          }
        }));
      }

      assertRequiredAttributes() {
        assert$1(!!this.label, `<lightning-dual-listbox> Missing required "label" attribute.`);
        assert$1(!!this.sourceLabel, `<lightning-dual-listbox> Missing required "sourceLabel" attribute.`);
        assert$1(!!this.selectedLabel, `<lightning-dual-listbox> Missing required "selectedLabel" attribute.`);
        assert$1(!!this.options, `<lightning-dual-listbox> Missing required "options" attribute.`);
      }

      swapOptions(i, j, array) {
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }

      formatString(str, ...args) {
        if (str) {
          return str.replace(/{(\d+)}/g, (match, i) => {
            return typeof args[i] !== 'undefined' ? args[i] : match;
          });
        }

        return '';
      }

      getElementsOfList(listId) {
        const elements = this.template.querySelectorAll(`div[data-type='${listId}']`);
        return elements ? elements : [];
      }

      selectKeyboardInterface() {
        const that = this;
        that.shiftIndex = -1;
        that.lastShift = null;
        return {
          getShiftIndex() {
            return that.shiftIndex;
          },

          setShiftIndex(value) {
            that.shiftIndex = value;
          },

          getLastShift() {
            return that.lastShift;
          },

          setLastShift(value) {
            that.lastShift = value;
          },

          getElementsOfList(listId) {
            return that.getElementsOfList(listId);
          },

          selectAllOptions(option) {
            that.selectAllFromLastSelectedToOption(option, true);
          },

          updateSelectedOptions(option, select, isMultiple) {
            that.updateSelectedOptions(option, select, isMultiple);
          },

          moveOptionsBetweenLists(addToSelect) {
            that.moveOptionsBetweenLists(addToSelect, true);
          }

        };
      }

      getOptionIndex(optionElement) {
        return parseInt(optionElement.getAttribute('data-index'), 10);
      }

      getListId(optionElement) {
        return getRealDOMId(optionElement.parentElement.parentElement);
      }

      updateFocusableOption(listId, value) {
        if (listId === this.computedSourceListId) {
          this.focusableInSource = value;
        } else if (listId === this.computedSelectedListId) {
          this.focusableInSelected = value;
        }

        this.optionToFocus = value;
      }

      isNumber(value) {
        return value !== '' && value !== null && isFinite(value);
      }

    }

    lwc.registerDecorators(LightningDualListbox, {
      publicProps: {
        sourceLabel: {
          config: 0
        },
        selectedLabel: {
          config: 0
        },
        label: {
          config: 0
        },
        options: {
          config: 0
        },
        min: {
          config: 0
        },
        max: {
          config: 0
        },
        name: {
          config: 0
        },
        messageWhenValueMissing: {
          config: 0
        },
        messageWhenRangeOverflow: {
          config: 3
        },
        messageWhenRangeUnderflow: {
          config: 3
        },
        disabled: {
          config: 3
        },
        required: {
          config: 3
        },
        value: {
          config: 3
        },
        requiredOptions: {
          config: 3
        },
        variant: {
          config: 3
        },
        size: {
          config: 3
        },
        fieldLevelHelp: {
          config: 0
        },
        disableReordering: {
          config: 3
        },
        showActivityIndicator: {
          config: 3
        },
        validity: {
          config: 1
        },
        addButtonLabel: {
          config: 3
        },
        removeButtonLabel: {
          config: 3
        },
        upButtonLabel: {
          config: 3
        },
        downButtonLabel: {
          config: 3
        }
      },
      publicMethods: ["focus", "checkValidity", "reportValidity", "setCustomValidity", "showHelpMessageIfInvalid"],
      track: {
        _showActivityIndicator: 1,
        _requiredOptions: 1,
        _selectedValues: 1,
        _variant: 1,
        _disabled: 1,
        _disableReordering: 1,
        _required: 1,
        _addButtonLabel: 1,
        _removeButtonLabel: 1,
        _upButtonLabel: 1,
        _downButtonLabel: 1,
        _size: 1,
        errorMessage: 1,
        highlightedOptions: 1,
        focusableInSource: 1,
        focusableInSelected: 1
      }
    });

    var _lightningDualListbox = lwc.registerComponent(LightningDualListbox, {
      tmpl: _tmpl$9
    });

    function tmpl$9($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element,
        d: api_dynamic,
        c: api_custom_element,
        ti: api_tab_index,
        b: api_bind,
        s: api_slot
      } = $api;
      const {
        _m0,
        _m1,
        _m2,
        _m3,
        _m4,
        _m5,
        _m6,
        _m7,
        _m8,
        _m9,
        _m10,
        _m11,
        _m12,
        _m13
      } = $ctx;
      return [api_element("button", {
        className: $cmp.computedButtonClass,
        attrs: {
          "aria-expanded": $cmp.computedAriaExpanded,
          "title": $cmp.computedTitle,
          "accesskey": $cmp.computedAccessKey,
          "tabindex": api_tab_index($cmp.computedTabIndex),
          "value": $cmp.value,
          "aria-haspopup": "true",
          "type": "button"
        },
        props: {
          "disabled": $cmp.disabled
        },
        key: 2,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleButtonClick)),
          "keydown": _m1 || ($ctx._m1 = api_bind($cmp.handleButtonKeyDown)),
          "blur": _m2 || ($ctx._m2 = api_bind($cmp.handleBlur)),
          "focus": _m3 || ($ctx._m3 = api_bind($cmp.handleFocus)),
          "mousedown": _m4 || ($ctx._m4 = api_bind($cmp.handleButtonMouseDown))
        }
      }, [$cmp.isDraft ? api_element("abbr", {
        classMap: {
          "slds-indicator_unsaved": true,
          "slds-p-right_xx-small": true
        },
        attrs: {
          "title": $cmp.draftAlternativeText
        },
        key: 3
      }, [api_text("*")]) : null, api_dynamic($cmp.label), api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.iconName,
          "svgClass": "slds-button__icon",
          "variant": "bare"
        },
        key: 4
      }, []), $cmp.computedShowDownIcon ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": "utility:down",
          "svgClass": "slds-button_icon slds-button__icon_x-small slds-m-left_xx-small",
          "variant": "bare"
        },
        key: 6
      }, []) : null, api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 7
      }, [api_dynamic($cmp.computedAlternativeText)])]), $cmp.state.dropdownOpened ? api_element("div", {
        className: $cmp.computedDropdownClass,
        key: 9,
        on: {
          "mousedown": _m11 || ($ctx._m11 = api_bind($cmp.handleDropdownMouseDown)),
          "mouseup": _m12 || ($ctx._m12 = api_bind($cmp.handleDropdownMouseUp)),
          "mouseleave": _m13 || ($ctx._m13 = api_bind($cmp.handleDropdownMouseLeave))
        }
      }, [$cmp.isLoading ? api_custom_element("lightning-spinner", _lightningSpinner, {
        props: {
          "size": "small",
          "alternativeText": $cmp.computedLoadingStateAlternativeText
        },
        key: 11
      }, []) : null, !$cmp.isLoading ? api_element("div", {
        classMap: {
          "slds-dropdown__list": true
        },
        attrs: {
          "role": "menu"
        },
        key: 13,
        on: {
          "privateselect": _m5 || ($ctx._m5 = api_bind($cmp.handleMenuItemPrivateSelect)),
          "privateblur": _m6 || ($ctx._m6 = api_bind($cmp.handlePrivateBlur)),
          "privatefocus": _m7 || ($ctx._m7 = api_bind($cmp.handlePrivateFocus)),
          "mouseover": _m8 || ($ctx._m8 = api_bind($cmp.handleMouseOverOnMenuItem)),
          "mouseout": _m9 || ($ctx._m9 = api_bind($cmp.allowBlur)),
          "keydown": _m10 || ($ctx._m10 = api_bind($cmp.handleKeyOnMenuItem))
        }
      }, [api_slot("", {
        key: 14
      }, [], $slotset)]) : null]) : null];
    }

    var _tmpl$a = lwc.registerTemplate(tmpl$9);
    tmpl$9.slots = [""];
    tmpl$9.stylesheets = [];
    tmpl$9.stylesheetTokens = {
      hostAttribute: "lightning-buttonMenu_buttonMenu-host",
      shadowAttribute: "lightning-buttonMenu_buttonMenu"
    };

    var labelLoading = 'Loading menu items...';

    var labelShowMenu = 'Show menu';

    /*
     * This is following the practices listed in
     *
     * https://www.w3.org/TR/wai-aria-practices/#menu
     *
     * and
     *
     * https://www.w3.org/TR/wai-aria-practices/#menubutton
     */

    function preventDefaultAndStopPropagation$1(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    function moveFocusToTypedCharacters(event, menuInterface) {
      runActionOnBufferedTypedCharacters(event, menuInterface.focusMenuItemWithText);
    }

    function handleKeyDownOnMenuItem(event, menuItemIndex, menuInterface) {
      switch (event.keyCode) {
        // W3: Down Arrow and Up Arrow: move focus to the next and previous items, respectively, optionally
        // wrapping from last to first and vice versa.
        case keyCodes.down:
        case keyCodes.up:
          // eslint-disable-line no-case-declarations
          preventDefaultAndStopPropagation$1(event);
          let nextIndex = event.keyCode === keyCodes.up ? menuItemIndex - 1 : menuItemIndex + 1;
          const totalMenuItems = menuInterface.getTotalMenuItems();

          if (nextIndex >= totalMenuItems) {
            nextIndex = 0;
          } else if (nextIndex < 0) {
            nextIndex = totalMenuItems - 1;
          }

          menuInterface.focusOnIndex(nextIndex);
          break;
        // W3: Home and End: If arrow key wrapping is not supported, move focus to first and last item
        // Note: We do support wrapping, but it doesn't hurt to support these keys anyway.

        case keyCodes.home:
          preventDefaultAndStopPropagation$1(event);
          menuInterface.focusOnIndex(0);
          break;

        case keyCodes.end:
          preventDefaultAndStopPropagation$1(event);
          menuInterface.focusOnIndex(menuInterface.getTotalMenuItems() - 1);
          break;
        // W3: Escape: Close the menu and return focus to the element or context, e.g., menu button or
        // parent menu item, from which the menu was opened
        // Tab: Close the menu and all open parent menus and move focus to the next element in the tab sequence.
        // Note: We don't have to do anything special for Tab because we're not stopping the event, we'll first
        // return the focus and the browser will then handle the tab key default event and will move the focus
        // appropriately. It's handy to return focus for 'Tab' anyway for cases where the menu is in a detached
        // popup (one that's using a panel attached directly to the body).

        case keyCodes.escape:
        case keyCodes.tab:
          // hide menu item list if it is visible
          if (menuInterface.isMenuVisible()) {
            // prevent default escape key action only when menu is visible
            if (event.keyCode === keyCodes.escape) {
              preventDefaultAndStopPropagation$1(event);
            }

            menuInterface.toggleMenuVisibility();
          }

          menuInterface.returnFocus();
          break;

        default:
          // W3: Any key that corresponds to a printable character: Move focus to the next menu item in the
          // current menu whose label begins with that printable character.
          // Note: we actually support a buffer, and in the current implementation it would jump to
          // the first menu item that matches not next.
          moveFocusToTypedCharacters(event, menuInterface);
      }
    }
    function handleKeyDownOnMenuTrigger(event, menuInterface) {
      const isVisible = menuInterface.isMenuVisible();

      switch (event.keyCode) {
        // W3 suggests that opening a menu should place the focus on the first item (as we do with Up/Down),
        // but we're not doing that because it would differ from most of the native menus behaviour.
        case keyCodes.enter:
        case keyCodes.space:
          preventDefaultAndStopPropagation$1(event);
          menuInterface.toggleMenuVisibility();
          break;

        case keyCodes.down:
        case keyCodes.up:
          preventDefaultAndStopPropagation$1(event);

          if (!isVisible) {
            // default to first menu item
            let focusNextIndex = 0; // if key was up-arrow then set to last menu item

            if (event.keyCode === keyCodes.up) {
              focusNextIndex = 'LAST';
            }

            menuInterface.setNextFocusIndex(focusNextIndex);
            menuInterface.toggleMenuVisibility();
          }

          break;
        // W3: Home and End: If arrow key wrapping is not supported, move focus to first and last item
        // Note: We do support wrapping, but it doesn't hurt to support these keys anyway.

        case keyCodes.home:
          preventDefaultAndStopPropagation$1(event);
          menuInterface.focusOnIndex(0);
          break;

        case keyCodes.end:
          preventDefaultAndStopPropagation$1(event);
          menuInterface.focusOnIndex(menuInterface.getTotalMenuItems() - 1);
          break;
        // W3: Escape: Close the menu and return focus to the element or context, e.g., menu button or
        // parent menu item, from which the menu was opened

        case keyCodes.escape:
        case keyCodes.tab:
          if (isVisible) {
            preventDefaultAndStopPropagation$1(event);
            menuInterface.toggleMenuVisibility();
          }

          break;

        default:
          if (!isVisible && menuInterface.showDropdownWhenTypingCharacters) {
            preventDefaultAndStopPropagation$1(event);
            menuInterface.toggleMenuVisibility();
          } else if (!isVisible) {
            break;
          } // eslint-disable-next-line lwc/no-raf


          window.requestAnimationFrame(() => {
            moveFocusToTypedCharacters(event, menuInterface);
          });
      }
    }

    const i18n$2 = {
      loading: labelLoading,
      showMenu: labelShowMenu
    }; // CSS class and selectors for menu items

    const menuItemCSSClassName = 'slds-dropdown__item';
    const menuItemCSSSelector = `.slds-dropdown__list .${menuItemCSSClassName}`;
    /**
     * Represents a dropdown menu with a list of actions or functions.
     * @slot default Placeholder for menu-item
     */

    class LightningButtonMenu extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.variant = 'border';
        this.iconSize = 'medium';
        this.iconName = 'utility:down';
        this.value = '';
        this.alternativeText = i18n$2.showMenu;
        this.loadingStateAlternativeText = i18n$2.loading;
        this.label = void 0;
        this.draftAlternativeText = void 0;
        this._positioning = false;
        this.privateMenuAlignment = 'left';
        this.privateBoundingRect = {};
        this._tooltip = null;
        this._order = null;
        this.state = {
          accesskey: null,
          disabled: false,
          dropdownVisible: false,
          dropdownOpened: false,
          nubbin: false,
          tabindex: 0,
          title: null,
          isDraft: false,
          isLoading: false,
          focusOnIndexDuringRenderedCallback: null
        };
      }

      /**
       * Determines the alignment of the menu relative to the button.
       * Available options are: auto, left, center, right, bottom-left, bottom-center, bottom-right.
       * The auto option aligns the dropdown menu based on available space.
       * This value defaults to left.
       *
       * @type {string}
       * @default left
       */
      get menuAlignment() {
        return this.privateMenuAlignment;
      }

      set menuAlignment(value) {
        this.privateMenuAlignment = normalizeString(value, {
          fallbackValue: 'left',
          validValues: ['auto', 'auto-right', 'auto-left', 'left', 'center', 'right', 'bottom-left', 'bottom-center', 'bottom-right']
        });
      }
      /**
       * If present, the menu can be opened by users.
       * @type {boolean}
       * @default false
       */


      get disabled() {
        return this.state.disabled;
      }

      set disabled(value) {
        this.state.disabled = normalizeBoolean(value);
      }
      /**
       * If present, a nubbin is present on the menu.
       * A nubbin is a stub that protrudes from the menu item towards the button menu.
       * The nubbin position is based on the menu-alignment.
       * @type {boolean}
       * @default false
       */


      get nubbin() {
        return this.state.nubbin;
      }

      set nubbin(value) {
        this.state.nubbin = normalizeBoolean(value);
      }
      /**
       * Displays tooltip text when the mouse moves over the button menu.
       * @type {string}
       */


      get title() {
        return this.state.title;
      }

      set title(newValue) {
        this.state.title = newValue;
      }
      /**
       * If present, the menu trigger shows a draft indicator.
       * @type {boolean}
       * @default false
       */


      get isDraft() {
        return this.state.isDraft;
      }

      set isDraft(value) {
        this.state.isDraft = normalizeBoolean(value);
      }
      /**
       * If present, the menu is in a loading state and shows a spinner.
       * @type {boolean}
       * @default false
       */


      get isLoading() {
        return this.state.isLoading;
      }

      set isLoading(value) {
        const normalizedValue = normalizeBoolean(value);

        if (this.isAutoAlignment()) {
          // stop previous positioning if any as it maintains old position relationship
          this.stopPositioning();

          if (this.state.isLoading && !normalizedValue) {
            // was loading before and now is not, we need to reposition
            this.startPositioning();
          }
        }

        this.state.isLoading = normalizedValue;
      }
      /**
       * The keyboard shortcut for the button menu.
       * @type {string}
       */


      get accessKey() {
        return this.state.accesskey;
      }

      set accessKey(newValue) {
        this.state.accesskey = newValue;
      }
      /**
       * Reserved for internal use. Use tabindex instead to indicate if an element should be focusable.
       * tabindex can be set to 0 or -1.
       * The default tabindex value is 0, which means that the button is focusable and participates in sequential keyboard navigation.
       * -1 means that the button is focusable but does not participate in keyboard navigation.
       * @type {number}
       */


      get tabIndex() {
        return -1;
      }

      set tabIndex(newValue) {
        this.setAttribute('tabindex', newValue);
        this.state.tabindex = newValue;
      }
      /**
       * Text to display when the user mouses over or focuses on the button.
       * The tooltip is auto-positioned relative to the button and screen space.
       * @type {string}
       */


      get tooltip() {
        return this._tooltip ? this._tooltip.value : undefined;
      }

      set tooltip(value) {
        if (this._tooltip) {
          this._tooltip.value = value;
        } else if (value) {
          // Note that because the tooltip target is a child element it may not be present in the
          // dom during initial rendering.
          this._tooltip = new Tooltip(value, {
            root: this,
            target: () => this.template.querySelector('button')
          });

          this._tooltip.initialize();
        }
      }

      get computedAriaExpanded() {
        return String(this.state.dropdownVisible); // default value must be a string for the attribute to always be present with a string value
      }

      connectedCallback() {
        this._connected = true;
        this.keyboardInterface = this.menuKeyboardInterface();
        this.classList.add('slds-dropdown-trigger', 'slds-dropdown-trigger_click');

        if (this.isDraft) {
          this.classList.add('slds-is-unsaved');
        } // button-group necessities


        const privatebuttonregister = new CustomEvent('privatebuttonregister', {
          bubbles: true,
          detail: {
            callbacks: {
              setOrder: this.setOrder.bind(this),
              setDeRegistrationCallback: deRegistrationCallback => {
                this._deRegistrationCallback = deRegistrationCallback;
              }
            }
          }
        });
        this.dispatchEvent(privatebuttonregister);
      }

      disconnectedCallback() {
        this._connected = false;

        if (this._deRegistrationCallback) {
          this._deRegistrationCallback();
        }
      }

      renderedCallback() {
        if (this._tooltip && !this._tooltip.initialized) {
          this._tooltip.initialize();
        } // if we are using autopositioning focus happens in its own cycle


        if (!this._positioning && this.state.dropdownVisible) {
          // logic to focus on first menu item after render
          this.focusOnMenuItemAfterRender();
        }
      }

      focusOnMenuItemAfterRender() {
        // if no menu items are focused then set focus on the first or last one once registered
        // :: this can occur if there's a delay in loading the menu items (loading from server for example)
        // :: revealing the menu in an empty state to later have menu items loaded
        let focusOnIndex = this.state.focusOnIndexDuringRenderedCallback || 0; // if focus index is greater than the size of the list,
        // or next focus should be on LAST,
        // set to the last item

        const menuItems = this.getMenuItems(); // if specified as 'LAST' set it to a valid numeric value instead

        if (focusOnIndex === 'LAST') {
          focusOnIndex = menuItems.length - 1; // maintain 'LAST' value if menu items aren't available yet

          if (focusOnIndex < 0) {
            focusOnIndex = 'LAST';
          }
        } // only perform operations when we have a valid numeric index


        if (focusOnIndex !== 'LAST') {
          if (focusOnIndex > menuItems.length - 1 && menuItems.length > 0) {
            focusOnIndex = menuItems.length - 1;
          } // set the focus


          this.focusOnMenuItem(focusOnIndex); // reset tracker value

          this.state.focusOnIndexDuringRenderedCallback = null;
        }
      }

      get computedAccessKey() {
        return this.state.accesskey;
      }

      get computedTitle() {
        return this.state.title;
      }

      get computedAlternativeText() {
        return this.alternativeText || i18n$2.showMenu;
      }

      get computedLoadingStateAlternativeText() {
        return this.loadingStateAlternativeText || i18n$2.loading;
      }

      get computedTabIndex() {
        return this.disabled ? -1 : this.state.tabindex;
      }
      /**
       * Sets focus on the button.
       */


      focus() {
        this.focusOnButton();
      }

      get computedButtonClass() {
        const isDropdownIcon = !this.computedShowDownIcon;
        const isBare = this.variant.split('-')[0] === 'bare';
        return classSet('slds-button').add({
          'slds-button_icon': !isDropdownIcon && !this.label,
          'slds-button_icon-bare': isBare && !this.label,
          'slds-button_icon-more': this.variant !== 'container' && !isDropdownIcon && !this.label,
          'slds-button_icon-container-more': this.variant === 'container' && !isDropdownIcon && !this.label,
          'slds-button_icon-container': this.variant === 'container' && isDropdownIcon && !this.label,
          'slds-button_icon-border': this.variant === 'border' && isDropdownIcon && !this.label,
          'slds-button_icon-border-filled': this.variant === 'border-filled' && !this.label,
          'slds-button_icon-border-inverse': this.variant === 'border-inverse' && !this.label,
          'slds-button_icon-inverse': this.variant === 'bare-inverse' && !this.label,
          'slds-button_icon-xx-small': this.iconSize === 'xx-small' && !isBare && !this.label,
          'slds-button_icon-x-small': this.iconSize === 'x-small' && !isBare && !this.label,
          'slds-button_icon-small': this.iconSize === 'small' && !isBare && !this.label,
          // alternative classes when we have a label value
          'slds-button_neutral': this.variant === 'border' && isDropdownIcon && this.label,
          'slds-button_inverse': this.variant === 'border-inverse' && this.label,
          // order classes when part of a button-group
          'slds-button_first': this._order === 'first',
          'slds-button_middle': this._order === 'middle',
          'slds-button_last': this._order === 'last'
        }).toString();
      }

      get computedShowDownIcon() {
        return !(this.iconName === 'utility:down' || this.iconName === 'utility:chevrondown');
      }

      get computedDropdownClass() {
        return classSet('slds-dropdown').add({
          'slds-dropdown_left': this.menuAlignment === 'left' || this.isAutoAlignment(),
          'slds-dropdown_center': this.menuAlignment === 'center',
          'slds-dropdown_right': this.menuAlignment === 'right',
          'slds-dropdown_bottom': this.menuAlignment === 'bottom-center',
          'slds-dropdown_bottom slds-dropdown_right slds-dropdown_bottom-right': this.menuAlignment === 'bottom-right',
          'slds-dropdown_bottom slds-dropdown_left slds-dropdown_bottom-left': this.menuAlignment === 'bottom-left',
          'slds-nubbin_top-left': this.nubbin && this.menuAlignment === 'left',
          'slds-nubbin_top-right': this.nubbin && this.menuAlignment === 'right',
          'slds-nubbin_top': this.nubbin && this.menuAlignment === 'center',
          'slds-nubbin_bottom-left': this.nubbin && this.menuAlignment === 'bottom-left',
          'slds-nubbin_bottom-right': this.nubbin && this.menuAlignment === 'bottom-right',
          'slds-nubbin_bottom': this.nubbin && this.menuAlignment === 'bottom-center',
          'slds-p-vertical_large': this.isLoading
        }).toString();
      }

      handleMenuItemPrivateSelect(event) {
        if (this.state.dropdownVisible) {
          this.toggleMenuVisibility();
          this.focusOnButton();
        } //


        this.dispatchSelect(event);
      }

      dispatchSelect(event) {
        this.dispatchEvent(new CustomEvent('select', {
          cancelable: true,
          detail: {
            value: event.detail.value // pass value through from original private event

          }
        }));
      }

      handleButtonClick() {
        this.allowBlur();
        this.toggleMenuVisibility(); // Focus on the button even if the browser doesn't do it by default
        // (the behaviour differs between Chrome, Safari, Firefox)

        this.focusOnButton();
      }

      handleButtonKeyDown(event) {
        handleKeyDownOnMenuTrigger(event, this.keyboardInterface);
      }

      handleButtonMouseDown(event) {
        const mainButton = 0;

        if (event.button === mainButton) {
          this.cancelBlur();
        }
      }

      handleDropdownMouseDown(event) {
        // if the menu contais a scrollbar due to large number of menu-items
        // this is needed so that menu doesnt close on dragging the scrollbar with the mouse
        const mainButton = 0;

        if (event.button === mainButton) {
          this.cancelBlur();
        }
      }

      handleDropdownMouseUp() {
        // We need this to make sure that if a scrollbar is being dragged with the mouse, upon release
        // of the drag we allow blur, otherwise the dropdown would not close on blur since we'd have cancel blur
        // set
        this.allowBlur();
      }

      handleDropdownMouseLeave() {
        // this is to close the menu after mousedown happens on scrollbar
        // in this case we close immediately if no menu-items were hovered/focused
        // without this the menu would remain open since the blur on the menuitems has happened already
        // when clicking the scrollbar
        if (!this._menuHasFocus) {
          this.close();
        }
      }

      focusOnButton() {
        this.template.querySelector('button').focus();
      }

      focusOnMenuItem(itemIndex) {
        if (this.state.dropdownVisible) {
          const menuItem = this.getMenuItemByIndex(itemIndex);
          this.cancelBlurAndFocusOnMenuItem(menuItem);
        }
      }

      isAutoAlignment() {
        return this.menuAlignment.startsWith('auto');
      }

      startPositioning() {
        if (!this.isAutoAlignment()) {
          return;
        }

        this._positioning = true;
        const align = {
          horizontal: Direction.Left,
          vertical: Direction.Top
        };
        const targetAlign = {
          horizontal: Direction.Left,
          vertical: Direction.Bottom
        };
        let autoFlip = true;
        let autoFlipVertical;

        if (this.menuAlignment === 'auto-right') {
          align.horizontal = Direction.Right;
          targetAlign.horizontal = Direction.Right;
        }

        if (this.menuAlignment === 'auto-right' || this.menuAlignment === 'auto-left') {
          autoFlip = false;
          autoFlipVertical = true;
        }

        requestAnimationFrame(() => {
          this.stopPositioning();
          this._autoPosition = startPositioning(this, {
            target: () => this.template.querySelector('button'),
            element: () => this.template.querySelector('.slds-dropdown'),
            align,
            targetAlign,
            autoFlip,
            autoFlipVertical
          });
        }); // focus on the first item in next cycle
        // eslint-disable-next-line lwc/no-set-timeout

        setTimeout(() => {
          this._positioning = false;
          this.focusOnMenuItemAfterRender();
        }, 0);
      }

      stopPositioning() {
        if (this._autoPosition) {
          stopPositioning(this._autoPosition);
          this._autoPosition = null;
        }

        this._positioning = false;
      }

      toggleMenuVisibility() {
        if (!this.disabled) {
          this.state.dropdownVisible = this.state.dropdownVisible ? false : true;

          if (!this.state.dropdownOpened && this.state.dropdownVisible) {
            this.state.dropdownOpened = true;
          }

          if (this.state.dropdownVisible) {
            this.startPositioning();
            this.dispatchEvent(new CustomEvent('open')); // update the bounding rect when the menu is toggled

            this.privateBoundingRect = this.getBoundingClientRect();
            this.pollBoundingRect();
          } else {
            this.stopPositioning();
          }

          this.classList.toggle('slds-is-open');
        }
      }

      getMenuItems() {
        return Array.from(this.querySelectorAll(menuItemCSSSelector));
      }

      getMenuItemByIndex(index) {
        return this.getMenuItems()[index];
      }

      findMenuItemIndex(menuItemElement) {
        // Get children (HTMLCollection) and transform into an array.
        const listChildren = Array.prototype.map.call(this.getMenuItems(), item => {
          return lwc.unwrap(item);
        });
        return listChildren.indexOf(menuItemElement);
      }

      findMenuItemFromEventTarget(element) {
        let currentNode = lwc.unwrap(element);
        const stopAtElement = lwc.unwrap(this.template.querySelector("[role='menu']"));

        while (currentNode !== stopAtElement) {
          if (currentNode.classList && currentNode.classList.contains(menuItemCSSClassName)) {
            return currentNode;
          }

          if (currentNode.parentNode) {
            currentNode = currentNode.parentNode;
          } else {
            return null;
          }
        }

        return null;
      }

      handleKeyOnMenuItem(event) {
        const menuItem = this.findMenuItemFromEventTarget(event.target);

        if (menuItem) {
          handleKeyDownOnMenuItem(event, this.findMenuItemIndex(menuItem), this.keyboardInterface);
        }
      }

      handleMouseOverOnMenuItem(event) {
        const menuItem = this.findMenuItemFromEventTarget(event.target);

        if (menuItem) {
          const menuItemIndex = this.findMenuItemIndex(menuItem);
          this.focusOnMenuItem(menuItemIndex);
        }
      }

      cancelBlurAndFocusOnMenuItem(menuItem) {
        if (menuItem) {
          // prevent blur during a non-blurring focus change
          // set lock so that while focusing on menutitem, menu doesnt close
          this.cancelBlur();
          menuItem.focus();
        } // allowBlur is called when the menu items receives focus

      }

      handleFocus() {
        this.dispatchEvent(new CustomEvent('focus'));
      }

      handlePrivateBlur(event) {
        // The event may be synthetic from the menu items
        event.stopPropagation(); // perform common blurring behavior

        this.handleBlur();
        this._menuHasFocus = false;
      }

      handlePrivateFocus(event) {
        // synthetic from the menu items
        event.stopPropagation(); // reset the cancelBlur so any clicks outside the menu can now close the menu

        this.allowBlur();
        this._menuHasFocus = true;
      }

      handleBlur() {
        // Don't handle the blur event if the focus events are inside the menu (see the cancelBlur/allowBlur functions)
        if (this._cancelBlur) {
          return;
        } // Hide only when the focus moved away from the container


        if (this.state.dropdownVisible) {
          this.toggleMenuVisibility();
        } // dispatch standard blur event


        this.dispatchEvent(new CustomEvent('blur'));
      }

      allowBlur() {
        this._cancelBlur = false;
      }

      cancelBlur() {
        this._cancelBlur = true;
      }

      menuKeyboardInterface() {
        const that = this;
        return {
          getTotalMenuItems() {
            return that.getMenuItems().length;
          },

          focusOnIndex(index) {
            that.focusOnMenuItem(index);
          },

          setNextFocusIndex(index) {
            that.state.focusOnIndexDuringRenderedCallback = index;
          },

          returnFocus() {
            that.focusOnButton();
          },

          isMenuVisible() {
            return that.state.dropdownVisible;
          },

          toggleMenuVisibility() {
            that.toggleMenuVisibility();
          },

          focusMenuItemWithText(text) {
            const match = [...that.getMenuItems()].filter(menuItem => {
              const label = menuItem.label;
              return label && label.toLowerCase().indexOf(text) === 0;
            });

            if (match.length > 0) {
              that.focusOnMenuItem(match[0]);
            }
          }

        };
      }
      /**
       * {Function} setOrder - Sets the order value of the button when in the context of a button-group or other ordered component
       * @param {String} order -  The order string (first, middle, last)
       */


      setOrder(order) {
        this._order = order;
      }
      /**
       * {Function} close - Closes the dropdown if it's open
       */


      close() {
        // should only do something if dropdown is visible
        if (this.state.dropdownVisible) {
          this.toggleMenuVisibility();
        }
      }
      /**
       * Poll for change in bounding rectangle
       * only if it is menuAlignment=auto since that is
       * position:fixed and is opened
       */


      pollBoundingRect() {
        // only poll if the dropdown is auto aligned
        if (this.isAutoAlignment() && this.state.dropdownVisible) {
          // eslint-disable-next-line lwc/no-set-timeout
          setTimeout(() => {
            if (this._connected) {
              observePosition(this, 300, this.privateBoundingRect, () => {
                this.close();
              }); // continue polling

              this.pollBoundingRect();
            }
          }, 250 // check every 0.25 second
          );
        }
      }

    }

    LightningButtonMenu.delegatesFocus = true;

    lwc.registerDecorators(LightningButtonMenu, {
      publicProps: {
        variant: {
          config: 0
        },
        iconSize: {
          config: 0
        },
        iconName: {
          config: 0
        },
        value: {
          config: 0
        },
        alternativeText: {
          config: 0
        },
        loadingStateAlternativeText: {
          config: 0
        },
        label: {
          config: 0
        },
        draftAlternativeText: {
          config: 0
        },
        menuAlignment: {
          config: 3
        },
        disabled: {
          config: 3
        },
        nubbin: {
          config: 3
        },
        title: {
          config: 3
        },
        isDraft: {
          config: 3
        },
        isLoading: {
          config: 3
        },
        accessKey: {
          config: 3
        },
        tabIndex: {
          config: 3
        },
        tooltip: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        _order: 1,
        state: 1
      }
    });

    var _lightningButtonMenu = lwc.registerComponent(LightningButtonMenu, {
      tmpl: _tmpl$a
    });

    function tmpl$a($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        t: api_text,
        h: api_element,
        d: api_dynamic,
        ti: api_tab_index,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1,
        _m2,
        _m3
      } = $ctx;
      return [api_element("a", {
        attrs: {
          "href": $cmp.computedHref,
          "role": $cmp.computedRole,
          "tabindex": api_tab_index($cmp.computedTabIndex),
          "accesskey": $cmp.computedAccessKey,
          "aria-checked": $cmp.computedAriaChecked,
          "aria-disabled": $cmp.computedAriaDisabled
        },
        key: 2,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleClick)),
          "focus": _m1 || ($ctx._m1 = api_bind($cmp.handleFocus)),
          "keydown": _m2 || ($ctx._m2 = api_bind($cmp.handleKeyDown)),
          "blur": _m3 || ($ctx._m3 = api_bind($cmp.handleBlur))
        }
      }, [api_element("span", {
        classMap: {
          "slds-truncate": true
        },
        key: 3
      }, [$cmp.isMenuItemCheckbox ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": "utility:check",
          "size": "x-small",
          "svgClass": $cmp.computedCheckedIconClass,
          "variant": "bare"
        },
        key: 5
      }, []) : null, $cmp.isDraft ? api_element("abbr", {
        classMap: {
          "slds-indicator_unsaved": true
        },
        attrs: {
          "title": $cmp.draftAlternativeText
        },
        key: 6
      }, [api_text("*")]) : null, $cmp.prefixIconName ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.prefixIconName,
          "size": "x-small",
          "svgClass": "slds-icon slds-icon_x-small slds-icon-text-default slds-m-right_x-small",
          "variant": "bare"
        },
        key: 8
      }, []) : null, api_dynamic($cmp.label)]), $cmp.iconName ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.iconName,
          "size": "x-small",
          "svgClass": "slds-icon-text-default slds-m-left_small slds-shrink-none",
          "variant": "bare"
        },
        key: 10
      }, []) : null])];
    }

    var _tmpl$b = lwc.registerTemplate(tmpl$a);
    tmpl$a.stylesheets = [];
    tmpl$a.stylesheetTokens = {
      hostAttribute: "lightning-menuItem_menuItem-host",
      shadowAttribute: "lightning-menuItem_menuItem"
    };

    /**
     * Represents a list item in a menu.
     */

    class LightningMenuItem extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.value = void 0;
        this.label = void 0;
        this.iconName = void 0;
        this.state = {
          accesskey: null,
          disabled: false,
          tabindex: '-1',
          checked: undefined,
          isDraft: false
        };
        this.prefixIconName = void 0;
        this.href = void 0;
        this.draftAlternativeText = void 0;
      }

      connectedCallback() {
        this.classList.add('slds-dropdown__item');
        this.setAttribute('role', 'presentation');
      }
      /**
       * If present, a draft indicator is shown on the menu item.
       * A draft indicator is denoted by blue asterisk on the left of the menu item.
       * When you use a draft indicator, include alternative text for accessibility using draft-alternative-text.
       * @type {boolean}
       * @default false
       */


      get isDraft() {
        return this.state.isDraft;
      }

      set isDraft(value) {
        this.state.isDraft = normalizeBoolean(value);
      }
      /**
       * The keyboard shortcut for the menu item.
       * @type {string}
       */


      get accessKey() {
        return this.state.accesskey;
      }

      set accessKey(newValue) {
        this.state.accesskey = newValue;
        this.handleAccessKeyChange(newValue);
      }
      /**
       * Reserved for internal use. Use tabindex instead to indicate if an element should be focusable.
       * tabindex can be set to 0 or -1.
       * The default tabindex value is 0, which means that the menu item is focusable and
       * participates in sequential keyboard navigation. The value -1 means
       * that the menu item is focusable but does not participate in keyboard navigation.
       * @type {number}
       */


      get tabIndex() {
        return this.state.tabindex;
      }

      set tabIndex(newValue) {
        this.state.tabindex = newValue;
        this.handleTabIndexChange(newValue);
      }

      handleAccessKeyChange(value) {
        this.state.accesskey = value;
      }

      handleTabIndexChange(value) {
        this.state.tabindex = value;
      }

      get computedAccessKey() {
        return this.state.accesskey;
      }

      get computedTabIndex() {
        return this.state.tabindex;
      }
      /**
       * If present, the menu item is disabled and users cannot interact with it.
       * @type {boolean}
       * @default false
       */


      get disabled() {
        return this.state.disabled;
      }

      set disabled(value) {
        this.state.disabled = normalizeBoolean(value);
      }
      /**
       * If present, a check mark displays on the left of the menu item if it's selected.
       * @type {boolean}
       * @default false
       */


      get checked() {
        return this.state.checked;
      }

      set checked(value) {
        if (typeof value === 'string') {
          // handle string
          value = normalizeString(value, {
            fallbackValue: undefined,
            validValues: ['true', 'false']
          });

          if (value !== undefined) {
            value = value === 'true';
          }
        }

        if (value !== undefined) {
          // handle boolean which is from above or user
          value = normalizeBoolean(value);
        }

        this.state.checked = value;
        this.classList.toggle('slds-is-selected', this.checked === true);
      }

      get computedCheckedIconClass() {
        // note that what .slds-icon_selected does is to hide the checked icon
        return classSet('slds-icon slds-icon_x-small slds-icon-text-default slds-m-right_x-small').add({
          'slds-icon_selected': !this.checked
        }).toString();
      }

      get computedHref() {
        // eslint-disable-next-line no-script-url
        return this.href ? this.href : 'javascript:void(0)';
      }

      get computedAriaChecked() {
        return this.isMenuItemCheckbox ? this.checked + '' : null;
      }

      get computedAriaDisabled() {
        // Note: Needed to explicitly set aria-disabled="true"
        return this.disabled ? 'true' : 'false';
      }

      get isMenuItemCheckbox() {
        return this.checked !== undefined;
      }

      get computedRole() {
        return this.isMenuItemCheckbox ? 'menuitemcheckbox' : 'menuitem';
      }

      handleBlur() {
        this.dispatchEvent(new CustomEvent('blur')); // we need to trigger a private blur to make it bubble and be handled by parent button-menu

        this.dispatchEvent(new CustomEvent('privateblur', {
          composed: true,
          bubbles: true,
          cancelable: true
        }));
      }

      handleFocus() {
        // trigger a private focus to make it bubble and be handled by parent button-menu
        // this is used for resetting cancelBlur in button-menu
        this.dispatchEvent(new CustomEvent('privatefocus', {
          bubbles: true,
          cancelable: true
        }));
      }

      handleClick(event) {
        // no action needed when item is disabled
        if (this.disabled) {
          event.preventDefault(); // do nothing and return

          return;
        } // allow HREF to be followed


        if (this.href) ; else {
          event.preventDefault();
          this.dispatchSelect();
        }
      }

      handleKeyDown(event) {
        // no action needed when item is disabled
        if (this.disabled) {
          // do nothing and return
          return;
        }

        if (event.keyCode === keyCodes.space) {
          // follow HREF if a value was provided
          if (this.href) {
            // trigger click behavior
            this.template.querySelector('a').click();
          } else {
            // if no HREF is provided follow usual select behavior
            this.dispatchSelect();
          }
        }
      }
      /**
       *
       * The select event is a non-navigational event.
       * The purpose of the event is to toggle the selected state of a menu item.
       * It will not be dispatched if a menu item has an HREF value to navigate to (other than the default).
       * This event will be handled by the parent button-menu component.
       *
       **/


      dispatchSelect() {
        if (!this.disabled) {
          this.dispatchEvent(new CustomEvent('privateselect', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {
              value: lwc.unwrap(this.value)
            }
          }));
        }
      }
      /**
       * Sets focus on the anchor element in the menu item.
       */


      focus() {
        // set the focus on the anchor element
        this.template.querySelector('a').focus(); // dispatch a focus event for the menu item component

        this.dispatchEvent(new CustomEvent('focus'));
      }

    }

    lwc.registerDecorators(LightningMenuItem, {
      publicProps: {
        value: {
          config: 0
        },
        label: {
          config: 0
        },
        iconName: {
          config: 0
        },
        prefixIconName: {
          config: 0
        },
        href: {
          config: 0
        },
        draftAlternativeText: {
          config: 0
        },
        isDraft: {
          config: 3
        },
        accessKey: {
          config: 3
        },
        tabIndex: {
          config: 3
        },
        disabled: {
          config: 3
        },
        checked: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        state: 1
      }
    });

    var _lightningMenuItem = lwc.registerComponent(LightningMenuItem, {
      tmpl: _tmpl$b
    });

    function tmpl$b($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        h: api_element,
        d: api_dynamic,
        ti: api_tab_index,
        b: api_bind,
        k: api_key,
        i: api_iterator,
        f: api_flatten
      } = $api;
      const {
        _m0,
        _m1,
        _m2,
        _m3,
        _m4
      } = $ctx;
      return [api_element("ul", {
        className: $cmp.computedListClass,
        attrs: {
          "role": "tablist",
          "aria-orientation": $cmp.computedAriaOrientation
        },
        key: 2,
        on: {
          "keydown": _m4 || ($ctx._m4 = api_bind($cmp.handleKeyDown))
        }
      }, api_flatten([api_iterator($cmp._allTabs, function (tab) {
        return tab.visible ? api_element("li", {
          className: tab.class,
          attrs: {
            "data-tab": true,
            "title": tab.title,
            "role": "presentation",
            "data-label": tab.label,
            "data-tab-value": tab.value
          },
          key: api_key(5, tab.value),
          on: {
            "click": _m2 || ($ctx._m2 = api_bind($cmp.handleTabClick))
          }
        }, [api_element("a", {
          className: tab.linkClass,
          attrs: {
            "data-tab-value": tab.value,
            "data-label": tab.label,
            "role": "tab",
            "href": "javascript:void(0)",
            "tabindex": api_tab_index(tab.tabIndex),
            "aria-selected": tab.ariaSelected
          },
          key: 6,
          on: {
            "blur": _m0 || ($ctx._m0 = api_bind($cmp.handleBlur)),
            "focus": _m1 || ($ctx._m1 = api_bind($cmp.handleFocus))
          }
        }, [tab.iconName ? api_element("span", {
          classMap: {
            "slds-tabs__left-icon": true
          },
          key: 8
        }, [api_custom_element("lightning-icon", _lightningIcon, {
          attrs: {
            "data-tab-value": tab.value
          },
          props: {
            "iconName": tab.iconName,
            "size": "small",
            "alternativeText": tab.iconAssistiveText
          },
          key: 9
        }, [])]) : null, api_dynamic(tab.label), tab.showErrorIndicator ? api_element("span", {
          classMap: {
            "slds-tabs__right-icon": true
          },
          key: 11
        }, [api_custom_element("lightning-icon", _lightningIcon, {
          attrs: {
            "data-tab-value": tab.value
          },
          props: {
            "iconName": "utility:error",
            "variant": "error",
            "size": "small",
            "alternativeText": $cmp.i18n.errorStateAlternativeText
          },
          key: 12
        }, [])]) : null])]) : null;
      }), $cmp.overflowSupported ? api_element("li", {
        className: $cmp.computedOverflowClass,
        style: $cmp.computedOverflowVisibility,
        attrs: {
          "data-overflow": true
        },
        key: 14
      }, [api_custom_element("lightning-button-menu", _lightningButtonMenu, {
        props: {
          "variant": "bare",
          "alternativeText": $cmp.i18n.moreAlternativeText,
          "title": $cmp.i18n.moreTitle,
          "iconName": "utility:chevrondown",
          "label": $cmp.i18n.more,
          "menuAlignment": "right"
        },
        key: 15,
        on: {
          "select": _m3 || ($ctx._m3 = api_bind($cmp.handleOverflowSelect))
        }
      }, api_iterator($cmp._allTabs, function (tab) {
        return !tab.visible ? api_custom_element("lightning-menu-item", _lightningMenuItem, {
          props: {
            "label": tab.label,
            "value": tab.value
          },
          key: api_key(18, tab.value)
        }, []) : null;
      }))]) : null]))];
    }

    var _tmpl$c = lwc.registerTemplate(tmpl$b);
    tmpl$b.stylesheets = [];
    tmpl$b.stylesheetTokens = {
      hostAttribute: "lightning-tabBar_tabBar-host",
      shadowAttribute: "lightning-tabBar_tabBar"
    };

    var labelOverflowMore = 'More';

    var labelOverflowMoreAlternativeText = 'Tabs';

    var labelOverflowMoreTitle = 'More Tabs';

    var labelErrorStateAlternativeText = 'This item has an error';

    function calculateOverflow({
      items,
      activeItem,
      containerWidth,
      overflowWidth
    }) {
      const visibleItems = [];
      const overflowItems = [];
      const allItemsWidth = items.reduce((totalWidth, item) => totalWidth + item.width, 0); // if total items width is less than containerwidth or if the containerwidth is
      // less than zero in cases where container is not yet rendered and we subtract the threshold
      // return all items as visibleItems and overflowItems empty

      if (allItemsWidth <= containerWidth || containerWidth <= 0) {
        return {
          visibleItems: items,
          overflowItems
        };
      } // Not all items fit, an overflow is needed


      let totalWidth = overflowWidth; // The active item should always show so we're always including it

      if (activeItem) {
        totalWidth += activeItem.width;
      }

      let activeItemFitsWithoutRearrangement = false;

      for (const item of items) {
        if (activeItem.value === item.value) {
          activeItemFitsWithoutRearrangement = overflowItems.length === 0;

          if (activeItemFitsWithoutRearrangement) {
            visibleItems.push(activeItem);
          }
        } else {
          const itemFits = item.width + totalWidth <= containerWidth;

          if (itemFits && overflowItems.length === 0) {
            totalWidth += item.width;
            visibleItems.push(item);
          } else {
            overflowItems.push(item);
          }
        }
      }

      if (!activeItemFitsWithoutRearrangement) {
        visibleItems.push(activeItem);
      }

      return {
        visibleItems,
        overflowItems
      };
    }

    class LightningResizeObserver {
      constructor(resizeCallback) {
        this._resizeObserverAvailable = typeof ResizeObserver === 'function';

        const delayedCallback = callback => {
          if (this._running) {
            return;
          }

          this._running = true; // eslint-disable-next-line lwc/no-set-timeout

          setTimeout(() => {
            callback();
            this._running = false;
          }, 60);
        };

        this._delayedResizeCallback = delayedCallback.bind(this, resizeCallback);

        if (this._resizeObserverAvailable) {
          this._resizeObserver = new ResizeObserver(this._delayedResizeCallback);
        }
      }

      observe(lightningElement) {
        // Using requestAnimationFrame as the element may not be physically in the DOM yet.
        this._requestAnimationId = requestAnimationFrame(() => {
          const domElement = lwc.unwrap(lightningElement);

          if (this._resizeObserverAvailable) {
            this._resizeObserver.observe(domElement);
          } else if (!this._hasWindowResizeHandler) {
            window.addEventListener('resize', this._delayedResizeCallback);
            this._hasWindowResizeHandler = true;
          }
        });
      }

      disconnect() {
        if (this._resizeObserver) {
          this._resizeObserver.disconnect();
        }

        if (this._requestAnimationId) {
          cancelAnimationFrame(this._requestAnimationId);
        }

        window.removeEventListener('resize', this._delayedResizeCallback);
        this._hasWindowResizeHandler = false;
      }

    }

    function preventDefaultAndStopPropagation$2(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    function handleKeyDownOnTabList(event, currentFocusedIndex, tabsetInterface) {
      switch (event.keyCode) {
        case keyCodes.left:
        case keyCodes.right:
        case keyCodes.down:
        case keyCodes.up:
          // eslint-disable-line no-case-declarations
          const isArrowUp = event.keyCode === keyCodes.up;
          const isArrowDown = event.keyCode === keyCodes.down;
          const isArrowLeft = event.keyCode === keyCodes.left;
          const isArrowRight = event.keyCode === keyCodes.right;
          const verticalNavigation = tabsetInterface.isVerticalOrientation() && (isArrowUp || isArrowDown);
          const horizontalNavigation = !tabsetInterface.isVerticalOrientation() && (isArrowLeft || isArrowRight);

          if (verticalNavigation || horizontalNavigation) {
            preventDefaultAndStopPropagation$2(event);
            const increment = isArrowLeft || isArrowUp ? -1 : 1;
            let newIndex = currentFocusedIndex + increment;

            if (newIndex < 0) {
              newIndex = tabsetInterface.totalTabs() - 1;
            }

            if (newIndex + 1 > tabsetInterface.totalTabs()) {
              newIndex = 0;
            }

            tabsetInterface.selectTabIndex(newIndex);
          }

          break;

        default:
          break;
      }
    }

    const i18n$3 = {
      more: labelOverflowMore,
      moreAlternativeText: labelOverflowMoreAlternativeText,
      moreTitle: labelOverflowMoreTitle,
      errorStateAlternativeText: labelErrorStateAlternativeText
    };
    const RECOMPUTE_OVERFLOW_THRESHOLD_PX = 30;

    class LightningTabBar extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.disableOverflow = false;
        this._allTabs = [];
        this._hasOverflow = false;
        this._variant = void 0;
        this._tabsChanged = false;
      }

      connectedCallback() {
        this._connected = true;

        if (this.overflowSupported) {
          this._queueOverflow();
        }
      }

      renderedCallback() {
        if (this.overflowSupported && !this._resizeObserver) {
          this._resizeObserver = this._setupResizeObserver();
        }

        if (this._tabsChanged) {
          // tabs array changed, causing this render.
          this.synchronizeA11y();
          this._tabsChanged = false;
        }
      }

      disconnectedCallback() {
        this._connected = false;

        if (this._resizeObserver) {
          this._resizeObserver.disconnect();
        }
      }

      get variant() {
        return this._variant;
      }

      set variant(value) {
        if (this._connected && value === 'vertical') {
          if (this._resizeObserver) {
            this._resizeObserver.disconnect();
          }
        }

        this._variant = value;
      }

      get tabHeaders() {
        return this._tabHeaders;
      }

      set tabHeaders(tabHeaders = []) {
        this._tabsChanged = true;
        this._tabHeaders = tabHeaders;
        const allTabs = tabHeaders.map(tab => {
          const classNames = this.tabClass({});
          const linkClassNames = this.computedLinkClass;
          return {
            label: tab.label,
            title: tab.title || tab.label,
            linkId: tab.value + '__item',
            domId: tab.domId,
            value: String(tab.value),
            class: classNames,
            linkClass: linkClassNames,
            tabIndex: -1,
            ariaSelected: false,
            contentId: '',
            visible: true,
            iconName: tab.iconName,
            iconAssistiveText: tab.iconAssistiveText,
            showErrorIndicator: tab.showErrorIndicator
          };
        });
        let selectedTab = allTabs[0];

        if (this._selectedTab) {
          selectedTab = allTabs.find(tab => tab.value === this._selectedTab.value);

          if (!selectedTab) {
            selectedTab = allTabs[0];
          }
        }

        if (selectedTab) {
          this._selectedTab = selectedTab;
          selectedTab.class = this.tabClass({
            selected: true
          });
          selectedTab.ariaSelected = 'true';
          selectedTab.tabIndex = 0;
        }

        this._allTabs = allTabs;

        if (this._connected && this.overflowSupported) {
          requestAnimationFrame(this._queueOverflow.bind(this));
        }
      }

      selectTabByValue(tabValue) {
        this._selectTab(tabValue);
      }

      get overflowSupported() {
        return this._variant !== 'vertical' && !this.disableOverflow;
      }

      get computedLinkClass() {
        const isScopedVariant = this._variant === 'scoped';
        const isVerticalVariant = this._variant === 'vertical';
        const linkClassNames = classSet().add({
          'slds-tabs_default__link': !isScopedVariant && !isVerticalVariant,
          'slds-tabs_scoped__link': isScopedVariant,
          'slds-vertical-tabs__link': isVerticalVariant
        }).toString();
        return linkClassNames;
      }

      get computedOverflowVisibility() {
        return this._hasOverflow ? '' : 'visibility: hidden;';
      }

      get i18n() {
        return i18n$3;
      }

      handleOverflowSelect(event) {
        event.stopPropagation();

        this._selectTabAndFireSelectEvent(event.detail.value);

        if (this._hasOverflow) {
          this._recomputeOverflow();
        }
      }

      handleTabClick(event) {
        // Don't navigate to href. Since href is set to "javascript:void(0)", if event default action is not prevented
        // the browser attempts to navigate to the url provided, thus raising a CSP violation that doesn't allow
        // javascript: in urls.
        event.preventDefault();
        const clickedtabValue = event.target.getAttribute('data-tab-value');

        this._selectTabAndFireSelectEvent(clickedtabValue, {
          hasFocus: true
        });
      }

      _findTabByValue(tabValue) {
        return this._allTabs.find(tab => tab.value === tabValue);
      }

      _selectTabAndFireSelectEvent(tabValue, options) {
        this._selectTab(tabValue, options);

        const tab = this._findTabByValue(tabValue);

        this.dispatchEvent(new CustomEvent('select', {
          detail: {
            value: tab.value,
            label: tab.label
          }
        }));
      }

      _selectTab(tabValue, options = {}) {
        const tab = this._findTabByValue(tabValue);

        if (!tab) {
          return;
        }

        if (this._selectedTab) {
          if (this._selectedTab.value === tabValue) {
            // already selected, do nothing
            return;
          }

          this._selectedTab.hasFocus = false;
          this._selectedTab.ariaSelected = 'false';
          this._selectedTab.class = this.tabClass({});
          this._selectedTab.tabIndex = -1;
        }

        tab.hasFocus = true;
        tab.ariaSelected = 'true';
        tab.class = this.tabClass({
          selected: true,
          hasFocus: options.hasFocus
        });
        tab.tabIndex = 0;
        this._selectedTab = tab;
      }

      handleBlur(event) {
        const tabValue = event.target.getAttribute('data-tab-value');

        const tab = this._findTabByValue(tabValue);

        if (tab) {
          tab.class = this.tabClass({
            selected: this._selectedTab.value === tab.value,
            hasFocus: false
          });
        }
      }

      handleFocus(event) {
        const tabValue = event.target.getAttribute('data-tab-value');

        const tab = this._findTabByValue(tabValue);

        tab.class = this.tabClass({
          selected: this._selectedTab.value === tab.value,
          hasFocus: true
        });
      }

      get _visibleTabs() {
        return this._allTabs.filter(tab => tab.visible);
      }

      handleKeyDown(event) {
        let currentFocusedIndex = 0;

        if (this._selectedTab) {
          currentFocusedIndex = this._visibleTabs.findIndex(tab => tab.value === this._selectedTab.value);
        }

        handleKeyDownOnTabList(event, currentFocusedIndex, {
          isVerticalOrientation: () => this._variant === 'vertical',
          totalTabs: () => this._visibleTabs.length,
          selectTabIndex: index => {
            const tab = this._visibleTabs[index];

            this._selectTabAndFireSelectEvent(tab.value, {
              hasFocus: true
            });

            this.template.querySelector(`a[data-tab-value="${tab.value}"]`).focus();
          }
        });
      }

      get computedAriaOrientation() {
        return this._variant === 'vertical' ? 'vertical' : null;
      }

      get computedListClass() {
        const isScoped = this._variant === 'scoped';
        const isVertical = this._variant === 'vertical';
        return classSet().add({
          'slds-tabs_scoped__nav': isScoped,
          'slds-vertical-tabs__nav': isVertical,
          'slds-tabs_default__nav': !isScoped && !isVertical
        }).toString();
      }

      tabClass({
        selected = false,
        hasFocus = false
      }) {
        const isScopedVariant = this._variant === 'scoped';
        const isVerticalVariant = this._variant === 'vertical';
        return classSet().add({
          'slds-tabs_default__item': !isScopedVariant && !isVerticalVariant,
          'slds-tabs_scoped__item': isScopedVariant,
          'slds-vertical-tabs__nav-item': isVerticalVariant,
          'slds-is-active': selected,
          'slds-has-focus': hasFocus
        }).toString();
      }

      get computedOverflowClass() {
        const tabStyle = this._variant === 'scoped' ? 'scoped' : 'default';
        return `slds-tabs_${tabStyle}__item slds-tabs_${tabStyle}__overflow-button`;
      }

      synchronizeA11y() {
        const tabLinks = this.template.querySelectorAll('a[role="tab"]');
        tabLinks.forEach(tabLink => {
          const tabData = this._allTabs.find(tab => tabLink.getAttribute('data-tab-value') === tab.value);

          tabLink.setAttribute('id', tabData.linkId);
          tabLink.setAttribute('aria-controls', tabData.domId);
        });
      }

      _setupResizeObserver() {
        const resizeObserver = new LightningResizeObserver(() => {
          if (this._connected) {
            const newWidth = this.getBoundingClientRect().width; // dont do anything if the resize is within a threshold of containerwidth +/- 30 possibly because of scroller appearance etc

            if (this._containerWidthWhenLastResized && newWidth < this._containerWidthWhenLastResized + RECOMPUTE_OVERFLOW_THRESHOLD_PX && newWidth > this._containerWidthWhenLastResized - RECOMPUTE_OVERFLOW_THRESHOLD_PX) {
              return;
            } // set the containerWidthWhenLastResized to the newWidth only when resize happens
            // so that next time it is compared against this accumulated value and resize happens


            this._containerWidthWhenLastResized = newWidth;

            this._queueOverflow();
          }
        });
        resizeObserver.observe(this.template.querySelector('[role="tablist"]'));
        return resizeObserver;
      }

      _queueOverflow() {
        this._allTabs.forEach(tab => {
          tab.visible = true;
        });

        requestAnimationFrame(this._recomputeOverflow.bind(this));
      }

      _recomputeOverflow() {
        if (!this._connected) {
          return;
        } // keep buffer = RECOMPUTE_OVERFLOW_THRESHOLD_PX so that we dont run into edge cases where recompute doesnt happen in the window


        const containerWidth = this.getBoundingClientRect().width - RECOMPUTE_OVERFLOW_THRESHOLD_PX;
        const tabHeaderElements = this.template.querySelectorAll('[data-tab]');

        for (let i = 0; i < tabHeaderElements.length; i++) {
          const tabHeaderElement = tabHeaderElements[i];
          const tabValue = tabHeaderElement.getAttribute('data-tab-value');

          const tab = this._findTabByValue(tabValue);

          let tabWidth = tabHeaderElement.getBoundingClientRect().width; // eslint-disable-next-line lightning-global/check-return-value-for-nullable-call

          const computedStyle = getComputedStyle(lwc.unwrap(tabHeaderElement));

          if (computedStyle) {
            tabWidth += parseFloat(computedStyle.marginLeft) + parseFloat(computedStyle.marginRight);
          }

          tab.width = tabWidth;
        }

        const overflowElement = this.template.querySelector('[data-overflow]');
        const overflowData = calculateOverflow({
          items: this._allTabs,
          activeItem: this._selectedTab,
          containerWidth,
          overflowWidth: overflowElement.getBoundingClientRect().width
        });
        overflowData.overflowItems.forEach(overflowItem => {
          if (overflowItem.visible) {
            overflowItem.visible = false;
          }
        });
        this._hasOverflow = overflowData.overflowItems && overflowData.overflowItems.length > 0;
        overflowData.visibleItems.forEach(overflowItem => {
          if (!overflowItem.visible) {
            overflowItem.visible = true;
          }
        });
      }

    }

    lwc.registerDecorators(LightningTabBar, {
      publicProps: {
        disableOverflow: {
          config: 0
        },
        variant: {
          config: 3
        },
        tabHeaders: {
          config: 3
        }
      },
      publicMethods: ["selectTabByValue"],
      track: {
        _allTabs: 1,
        _hasOverflow: 1,
        _variant: 1
      }
    });

    var _lightningTabBar = lwc.registerComponent(LightningTabBar, {
      tmpl: _tmpl$c
    });

    function tmpl$c($api, $cmp, $slotset, $ctx) {
      const {
        b: api_bind,
        c: api_custom_element,
        s: api_slot,
        h: api_element
      } = $api;
      const {
        _m0,
        _m1,
        _m2
      } = $ctx;
      return [api_element("div", {
        className: $cmp.computedClass,
        attrs: {
          "title": $cmp.title
        },
        key: 2,
        on: {
          "privatetabregister": _m1 || ($ctx._m1 = api_bind($cmp.handleTabRegister)),
          "privatetabdatachange": _m2 || ($ctx._m2 = api_bind($cmp.handleTabDataChange))
        }
      }, [api_custom_element("lightning-tab-bar", _lightningTabBar, {
        props: {
          "variant": $cmp.variant
        },
        key: 3,
        on: {
          "select": _m0 || ($ctx._m0 = api_bind($cmp.handleTabSelected))
        }
      }, []), api_slot("", {
        key: 4
      }, [], $slotset)])];
    }

    var _tmpl$d = lwc.registerTemplate(tmpl$c);
    tmpl$c.slots = [""];
    tmpl$c.stylesheets = [];
    tmpl$c.stylesheetTokens = {
      hostAttribute: "lightning-tabset_tabset-host",
      shadowAttribute: "lightning-tabset_tabset"
    };

    const tabClassPrefixByVariant = {
      scoped: 'slds-tabs_scoped',
      vertical: 'slds-vertical-tabs',
      standard: 'slds-tabs_default'
    };
    /**
     * Represents a list of tabs.
     * @slot default Placeholder for lightning-tab.
     */

    class LightningTabset extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.title = void 0;
        this._variant = 'standard';
      }

      connectedCallback() {
        this._tabByValue = {};
        this._tabHeaders = [];
        this._connected = true;
      }

      disconnectedCallback() {
        this._connected = false;
      }
      /**
       * The variant changes the appearance of the tabset. Accepted variants are standard, scoped, and vertical.
       * @type {string}
       */


      get variant() {
        return this._variant;
      }

      set variant(value) {
        this._variant = normalizeString(value, {
          fallbackValue: 'standard',
          validValues: ['scoped', 'vertical']
        });
      }
      /**
       * Sets a specific tab to open by default using a string that matches a tab's value string. If not used, the first tab opens by default.
       * @type {string}
       */


      get activeTabValue() {
        return this._activeTabValue;
      }

      set activeTabValue(tabValue) {
        const newTabValue = tabValue && String(tabValue);

        if (!newTabValue || this._activeTabValue === newTabValue) {
          // already selected, do nothing
          return;
        }

        if (this._connected) {
          const tab = this._tabByValue[tabValue];

          if (tab) {
            this._selectTab(tabValue);
          }
        } else {
          this._activeTabValue = newTabValue;
        }
      }

      handleTabRegister(event) {
        event.stopPropagation();
        const tab = event.target;
        tab.role = 'tabpanel';
        const generatedUniqueId = generateUniqueId('tab');

        if (!tab.id) {
          // We need a tab.id on the tab component to ensure that aria-controls from tab-bar can point to it
          tab.id = generatedUniqueId;
        }

        if (!tab.value) {
          tab.value = generatedUniqueId;
        }

        const tabValue = tab.value;
        tab.dataTabValue = tabValue;
        tab.ariaLabelledBy = tabValue + '__item';
        tab.classList.add(`${tabClassPrefixByVariant[this.variant]}__content`);
        tab.classList.add('slds-hide');
        tab.classList.remove('slds-show');
        const tabs = this.querySelectorAll(`[role='tabpanel']`);
        let tabIndex;

        for (tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
          if (tabs[tabIndex].dataTabValue === tabValue) {
            break;
          }
        }

        event.detail.setDeRegistrationCallback(() => {
          if (!this._connected) {
            return;
          }

          const index = this._tabHeaders.findIndex(existingTab => existingTab.value === tabValue);

          if (index >= 0) {
            this._tabHeaders.splice(index, 1);

            this._updateTabBarHeaders(this._tabHeaders);

            this._tabByValue[tabValue] = undefined;

            if (this._activeTabValue === tab.value && this._tabHeaders.length > 0) {
              this._showTabContentForTabValue(this._tabHeaders[0].value);
            }
          }
        });

        this._tabHeaders.splice(tabIndex, 0, {
          value: tabValue,
          label: tab.label,
          domId: tab.id,
          title: tab.title,
          iconName: tab.iconName,
          iconAssistiveText: tab.iconAssistiveText,
          showErrorIndicator: tab.showErrorIndicator
        });

        this._updateTabBarHeaders(this._tabHeaders);

        this._tabByValue[tabValue] = tab; // if no activeTabValue specified, we will default to the first registered tab

        if (!this._activeTabValue) {
          this._activeTabValue = tab.value;
        }

        if (this._activeTabValue === tab.value) {
          this._selectTab(tabValue);
        }
      }

      _selectTab(value) {
        this._selectTabHeaderByTabValue(value);

        this._showTabContentForTabValue(value);
      }

      _showTabContentForTabValue(value) {
        const tab = this._tabByValue[value];

        if (!tab) {
          return;
        }

        if (this._activeTabValue) {
          const currentTab = this._tabByValue[this._activeTabValue];

          if (currentTab) {
            currentTab.classList.add('slds-hide');
            currentTab.classList.remove('slds-show');
          }
        }

        this._activeTabValue = tab.value;
        tab.classList.add('slds-show');
        tab.classList.remove('slds-hide');
        tab.loadContent();
      }

      _selectTabHeaderByTabValue(value) {
        if (!this._connected) {
          return;
        }

        const tabBar = this.template.querySelector('lightning-tab-bar');
        tabBar.selectTabByValue(value);
      }

      handleTabSelected(event) {
        const selectedTabValue = event.detail.value;
        const tab = this._tabByValue[selectedTabValue];

        if (this._activeTabValue !== tab.value) {
          this._showTabContentForTabValue(selectedTabValue);
        }
      }

      handleTabDataChange(event) {
        const changedTab = event.target;
        const newTabValue = changedTab.value;
        const currentTabValue = changedTab.dataTabValue;

        const matchingTabHeader = this._tabHeaders.find(tabHeader => tabHeader.value === currentTabValue);

        if (matchingTabHeader) {
          matchingTabHeader.label = changedTab.label;
          matchingTabHeader.value = newTabValue;
          matchingTabHeader.title = changedTab.title;
          matchingTabHeader.iconName = changedTab.iconName;
          matchingTabHeader.iconAssistiveText = changedTab.iconAssistiveText;
          matchingTabHeader.showErrorIndicator = changedTab.showErrorIndicator;
        }

        this._updateTabBarHeaders(this._tabHeaders);

        if (currentTabValue !== newTabValue) {
          const tab = this._tabByValue[currentTabValue];

          if (tab) {
            tab.dataTabValue = newTabValue;
            this._tabByValue[newTabValue] = this._tabByValue[currentTabValue];
            this._tabByValue[currentTabValue] = undefined;
          }

          if (this._activeTabValue === currentTabValue) {
            this._activeTabValue = newTabValue;
          }
        }
      }

      _updateTabBarHeaders(headers) {
        this.template.querySelector('lightning-tab-bar').tabHeaders = headers.slice();
      }

      get computedClass() {
        return tabClassPrefixByVariant[this.variant];
      }

    }

    lwc.registerDecorators(LightningTabset, {
      publicProps: {
        title: {
          config: 0
        },
        variant: {
          config: 3
        },
        activeTabValue: {
          config: 3
        }
      },
      track: {
        _variant: 1
      }
    });

    var _lightningTabset = lwc.registerComponent(LightningTabset, {
      tmpl: _tmpl$d
    });

    function tmpl$d($api, $cmp, $slotset, $ctx) {
      const {
        s: api_slot
      } = $api;
      return [$cmp._loadContent ? api_slot("", {
        key: 3
      }, [], $slotset) : null];
    }

    var _tmpl$e = lwc.registerTemplate(tmpl$d);
    tmpl$d.slots = [""];
    tmpl$d.stylesheets = [];
    tmpl$d.stylesheetTokens = {
      hostAttribute: "lightning-tab_tab-host",
      shadowAttribute: "lightning-tab_tab"
    };

    /**
     * A single tab in a tabset component.
     * @slot default Placeholder for your content in lightning-tab.
     */

    class LightningTab extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this._loadContent = false;
      }

      connectedCallback() {
        this._connected = true;
        this.dispatchEvent(new CustomEvent('privatetabregister', {
          cancelable: true,
          bubbles: true,
          composed: true,
          detail: {
            setDeRegistrationCallback: deRegistrationCallback => {
              this._deRegistrationCallback = deRegistrationCallback;
            }
          }
        }));
      }
      /**
       * Reserved for internal use.
       */


      loadContent() {
        this._loadContent = true;
        this.dispatchEvent(new CustomEvent('active'));
      }

      disconnectedCallback() {
        this._connected = false;

        if (this._deRegistrationCallback) {
          this._deRegistrationCallback();
        }
      }
      /**
       * The optional string to be used during tabset's select event to determine which tab was clicked.
       * This string is also used by active-tab-value in tabset to open a tab.
       * @type {string}
       */


      get value() {
        return this._value;
      }

      set value(newValue) {
        this._value = String(newValue);

        this._dispatchDataChangeEventIfConnected();
      }
      /**
       * The text displayed in the tab header.
       * @type {string}
       */


      get label() {
        return this._label;
      }

      set label(value) {
        this._label = value;

        this._dispatchDataChangeEventIfConnected();
      }
      /**
       * Specifies text that displays in a tooltip over the tab content.
       * @type {string}
       */


      get title() {
        return this._title;
      }

      set title(value) {
        this._title = value;

        this._dispatchDataChangeEventIfConnected();
      }
      /**
       * The Lightning Design System name of an icon to display to the left of the tab label.
       * Specify the name in the format 'utility:down' where 'utility' is the category, and
       * 'down' is the icon to be displayed. Only utility icons can be used.
       * @type {string}
       */


      get iconName() {
        return this._iconName;
      }

      set iconName(value) {
        this._iconName = value;

        this._dispatchDataChangeEventIfConnected();
      }
      /**
       * The alternative text for the icon specified by icon-name.
       * @type {string}
       */


      get iconAssistiveText() {
        return this._iconAssistiveText;
      }

      set iconAssistiveText(value) {
        this._iconAssistiveText = value;

        this._dispatchDataChangeEventIfConnected();
      }
      /**
       * Specifies whether there's an error in the tab content.
       * An error icon is displayed to the right of the tab label.
       * @type {boolean}
       */


      get showErrorIndicator() {
        return this._showErrorIndicator;
      }

      set showErrorIndicator(value) {
        this._showErrorIndicator = normalizeBoolean(value);

        this._dispatchDataChangeEventIfConnected();
      }

      _dispatchDataChangeEventIfConnected() {
        if (this._connected) {
          this.dispatchEvent(new CustomEvent('privatetabdatachange', {
            cancelable: true,
            bubbles: true,
            composed: true
          }));
        }
      }

    }

    lwc.registerDecorators(LightningTab, {
      publicProps: {
        value: {
          config: 3
        },
        label: {
          config: 3
        },
        title: {
          config: 3
        },
        iconName: {
          config: 3
        },
        iconAssistiveText: {
          config: 3
        },
        showErrorIndicator: {
          config: 3
        }
      },
      publicMethods: ["loadContent"],
      track: {
        _loadContent: 1
      }
    });

    var _lightningTab = lwc.registerComponent(LightningTab, {
      tmpl: _tmpl$e
    });

    function tmpl$e($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element,
        c: api_custom_element,
        b: api_bind,
        d: api_dynamic,
        k: api_key,
        i: api_iterator
      } = $api;
      const {
        _m0
      } = $ctx;
      return [api_custom_element("lightning-card", _lightningCard, {
        key: 2
      }, [api_text("The Kural is structured into 133 chapters, each containing 10 couplets (or kurals) for a total of 1,330 couplets."), api_element("br", {
        key: 3
      }, []), api_text("The 133 chapters are grouped into three "), api_element("b", {
        key: 4
      }, [api_text("Parts")]), api_text(", or "), api_element("b", {
        key: 5
      }, [api_text("Books")])]), api_custom_element("lightning-dual-listbox", _lightningDualListbox, {
        props: {
          "name": "languages",
          "label": "Select Tirukku\u1E5Ba\u1E37 Parts",
          "sourceLabel": "Available",
          "selectedLabel": "Selected",
          "fieldLevelHelp": "This is a dual listbox for quotes",
          "options": $cmp.options
        },
        key: 6,
        on: {
          "change": _m0 || ($ctx._m0 = api_bind($cmp.handleChange))
        }
      }, []), api_element("div", {
        classMap: {
          "slds-box": true
        },
        key: 7
      }, [api_element("p", {
        key: 8
      }, [api_text("Selected Parts are: "), api_dynamic($cmp.selected)])]), api_custom_element("lightning-tabset", _lightningTabset, {
        key: 9
      }, api_iterator($cmp.options, function (option) {
        return api_custom_element("lightning-tab", _lightningTab, {
          props: {
            "label": option.label
          },
          key: api_key(11, option.label)
        }, [api_custom_element("lightning-card", _lightningCard, {
          key: 12
        }, [api_dynamic(option.content)])]);
      }))];
    }

    var _tmpl$f = lwc.registerTemplate(tmpl$e);
    tmpl$e.stylesheets = [];
    tmpl$e.stylesheetTokens = {
      hostAttribute: "c-kural_kural-host",
      shadowAttribute: "c-kural_kural"
    };

    class App extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this._selected = [];
        this.options = [{
          label: 'அறத்துப்பால்( Virtue )',
          value: 'அறத்துப்பால் ( Virtue )',
          content: 'அறத்துப்பால் content goes here'
        }, {
          label: 'பொருட்பால்( Polity )',
          value: 'பொருட்பால் ( Polity )',
          content: 'பொருட்பால் content goes here'
        }, {
          label: 'காமத்துப்பால்(  Love  )',
          value: 'காமத்துப்பால் (  Love  )',
          content: 'காமத்துப்பால் content goes here'
        }];
      }

      handleChange(e) {
        this._selected = e.detail.value;
      }

      get selected() {
        return this._selected.length ? this._selected : 'none';
      }

    }

    lwc.registerDecorators(App, {
      track: {
        _selected: 1,
        options: 1
      }
    });

    var main = lwc.registerComponent(App, {
      tmpl: _tmpl$f
    });

    registerWireService(lwc.register);

        const element = lwc.createElement('c-kural', { is: main, fallback: true });
        document.querySelector('main').appendChild(element);

}(Engine));
