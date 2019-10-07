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
        d: api_dynamic
      } = $api;
      return [api_dynamic($cmp.label)];
    }

    var _tmpl = lwc.registerTemplate(tmpl);
    tmpl.stylesheets = [];
    tmpl.stylesheetTokens = {
      hostAttribute: "lightning-badge_badge-host",
      shadowAttribute: "lightning-badge_badge"
    };

    /**
     * Represents a label which holds a small amount of information, such as the
     * number of unread notifications.
     */

    class LightningBadge extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.label = void 0;
      }

      connectedCallback() {
        this.classList.add('slds-badge');
      }

    }

    lwc.registerDecorators(LightningBadge, {
      publicProps: {
        label: {
          config: 0
        }
      }
    });

    var _lightningBadge = lwc.registerComponent(LightningBadge, {
      tmpl: _tmpl
    });

    function tmpl$1($api, $cmp, $slotset, $ctx) {
      const {
        s: api_slot,
        h: api_element
      } = $api;
      return [api_element("div", {
        classMap: {
          "slds-breadcrumb": true,
          "slds-list_horizontal": true,
          "slds-wrap": true
        },
        attrs: {
          "role": "list"
        },
        key: 2
      }, [api_slot("", {
        key: 3
      }, [], $slotset)])];
    }

    var _tmpl$1 = lwc.registerTemplate(tmpl$1);
    tmpl$1.slots = [""];
    tmpl$1.stylesheets = [];
    tmpl$1.stylesheetTokens = {
      hostAttribute: "lightning-breadcrumbs_breadcrumbs-host",
      shadowAttribute: "lightning-breadcrumbs_breadcrumbs"
    };

    /**
     * A hierarchy path of the page you're currently visiting within the website or app.
     * @slot default Placeholder for lightning-breadcrumb
     */

    class LightningBreadcrumbs extends lwc.LightningElement {
      connectedCallback() {
        this.setAttribute('aria-label', 'Breadcrumbs');
        this.setAttribute('role', 'navigation');
      }

    }

    var _lightningBreadcrumbs = lwc.registerComponent(LightningBreadcrumbs, {
      tmpl: _tmpl$1
    });

    function tmpl$2($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        h: api_element
      } = $api;
      return [api_element("a", {
        attrs: {
          "href": $cmp.href
        },
        key: 2
      }, [api_dynamic($cmp.label)])];
    }

    var _tmpl$2 = lwc.registerTemplate(tmpl$2);
    tmpl$2.stylesheets = [];
    tmpl$2.stylesheetTokens = {
      hostAttribute: "lightning-breadcrumb_breadcrumb-host",
      shadowAttribute: "lightning-breadcrumb_breadcrumb"
    };

    /**
     * An item in the hierarchy path of the page the user is on.
     */

    class LightningBreadcrumb extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.href = void 0;
        this.label = void 0;
        this.name = void 0;
      }

      connectedCallback() {
        // add default CSS classes to custom element tag
        this.classList.add('slds-breadcrumb__item');
        this.classList.add('slds-text-title_caps');
        this.setAttribute('role', 'listitem');
      }

    }

    lwc.registerDecorators(LightningBreadcrumb, {
      publicProps: {
        href: {
          config: 0
        },
        label: {
          config: 0
        },
        name: {
          config: 0
        }
      }
    });

    var _lightningBreadcrumb = lwc.registerComponent(LightningBreadcrumb, {
      tmpl: _tmpl$2
    });

    function tmpl$3($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$3 = lwc.registerTemplate(tmpl$3);
    tmpl$3.stylesheets = [];
    tmpl$3.stylesheetTokens = {
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

    var _tmpl$4 = void 0;

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
      tmpl: _tmpl$4
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
      tmpl: _tmpl$4
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
      tmpl: _tmpl$4
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

        return _tmpl$3;
      }

      render() {
        if (this.inlineSvgProvided) {
          return this.resolveTemplate();
        }

        return _tmpl$3;
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
      tmpl: _tmpl$3
    });

    function tmpl$4($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$5 = lwc.registerTemplate(tmpl$4);
    tmpl$4.stylesheets = [];
    tmpl$4.stylesheetTokens = {
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

    function tmpl$5($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$6 = lwc.registerTemplate(tmpl$5);
    tmpl$5.stylesheets = [];
    tmpl$5.stylesheetTokens = {
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
      tmpl: _tmpl$6
    });

    const BUBBLE_ID = `salesforce-lightning-tooltip-bubble_${guid()}`;
    /**
     * Shared instance of a primitive bubble used as a tooltip by most components. This was originally
     * defined in the helptext component which is where the minWidth style came from.
     * TODO: We may want to revisit the minWidth style with the PO and/or UX.
     */

    const CACHED_BUBBLE_ELEMENT = lwc.createElement('lightning-primitive-bubble', {
      is: LightningPrimitiveBubble$1
    });
    CACHED_BUBBLE_ELEMENT.contentId = BUBBLE_ID;
    CACHED_BUBBLE_ELEMENT.style.position = 'absolute';
    CACHED_BUBBLE_ELEMENT.style.minWidth = '75px';
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
          this._element = () => CACHED_BUBBLE_ELEMENT;

          if (CACHED_BUBBLE_ELEMENT.parentNode === null) {
            document.body.appendChild(CACHED_BUBBLE_ELEMENT);
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

    function tmpl$6($api, $cmp, $slotset, $ctx) {
      return [];
    }

    var _tmpl$7 = lwc.registerTemplate(tmpl$6);
    tmpl$6.stylesheets = [];
    tmpl$6.stylesheetTokens = {
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
      tmpl: _tmpl$7
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
        return _tmpl$5;
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
      tmpl: _tmpl$5
    });

    function tmpl$7($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$8 = lwc.registerTemplate(tmpl$7);
    tmpl$7.stylesheets = [];
    tmpl$7.stylesheetTokens = {
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
      tmpl: _tmpl$8
    });

    function tmpl$8($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$9 = lwc.registerTemplate(tmpl$8);
    tmpl$8.slots = [""];
    tmpl$8.stylesheets = [];
    tmpl$8.stylesheetTokens = {
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

    function preventDefaultAndStopPropagation(event) {
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
          preventDefaultAndStopPropagation(event);
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
          preventDefaultAndStopPropagation(event);
          menuInterface.focusOnIndex(0);
          break;

        case keyCodes.end:
          preventDefaultAndStopPropagation(event);
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
              preventDefaultAndStopPropagation(event);
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
          preventDefaultAndStopPropagation(event);
          menuInterface.toggleMenuVisibility();
          break;

        case keyCodes.down:
        case keyCodes.up:
          preventDefaultAndStopPropagation(event);

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
          preventDefaultAndStopPropagation(event);
          menuInterface.focusOnIndex(0);
          break;

        case keyCodes.end:
          preventDefaultAndStopPropagation(event);
          menuInterface.focusOnIndex(menuInterface.getTotalMenuItems() - 1);
          break;
        // W3: Escape: Close the menu and return focus to the element or context, e.g., menu button or
        // parent menu item, from which the menu was opened

        case keyCodes.escape:
        case keyCodes.tab:
          if (isVisible) {
            preventDefaultAndStopPropagation(event);
            menuInterface.toggleMenuVisibility();
          }

          break;

        default:
          if (!isVisible && menuInterface.showDropdownWhenTypingCharacters) {
            preventDefaultAndStopPropagation(event);
            menuInterface.toggleMenuVisibility();
          } else if (!isVisible) {
            break;
          } // eslint-disable-next-line lwc/no-raf


          window.requestAnimationFrame(() => {
            moveFocusToTypedCharacters(event, menuInterface);
          });
      }
    }

    const i18n = {
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
        this.alternativeText = i18n.showMenu;
        this.loadingStateAlternativeText = i18n.loading;
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
        return this.alternativeText || i18n.showMenu;
      }

      get computedLoadingStateAlternativeText() {
        return this.loadingStateAlternativeText || i18n.loading;
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
      tmpl: _tmpl$9
    });

    function tmpl$9($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$a = lwc.registerTemplate(tmpl$9);
    tmpl$9.stylesheets = [];
    tmpl$9.stylesheetTokens = {
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
      tmpl: _tmpl$a
    });

    function tmpl$a($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element,
        c: api_custom_element,
        k: api_key,
        i: api_iterator,
        d: api_dynamic,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [api_element("h3", {
        classMap: {
          "slds-text-heading_medium": true,
          "slds-m-bottom_small": true
        },
        key: 2
      }, [api_text("Badges")]), api_custom_element("lightning-badge", _lightningBadge, {
        props: {
          "label": $cmp.mapItems.length
        },
        key: 3
      }, []), api_element("hr", {
        key: 4
      }, []), api_element("h3", {
        classMap: {
          "slds-text-heading_medium": true,
          "slds-m-bottom_small": true
        },
        key: 5
      }, [api_text(" Breadcrumb Items")]), api_custom_element("lightning-breadcrumbs", _lightningBreadcrumbs, {
        key: 6
      }, api_iterator($cmp.mapItems, function (item) {
        return api_custom_element("lightning-breadcrumb", _lightningBreadcrumb, {
          props: {
            "label": item.name,
            "href": item.wiki
          },
          key: api_key(8, item.name)
        }, []);
      })), api_element("hr", {
        key: 9
      }, []), api_element("div", {
        classMap: {
          "slds-p-around-large": true
        },
        key: 10
      }, [api_text("Lighting button icons")]), api_element("div", {
        classMap: {
          "slds-p-around_small": true
        },
        key: 11
      }, api_iterator($cmp.icons, function (icon) {
        return api_custom_element("lightning-button-icon", _lightningButtonIcon, {
          props: {
            "iconName": icon.name,
            "alternativeText": icon.label
          },
          key: api_key(13, icon.name)
        }, []);
      })), api_element("div", {
        classMap: {
          "slds-p-around_small": true
        },
        key: 14
      }, [api_element("p", {
        key: 15
      }, [api_text("Selected : "), api_dynamic($cmp.clickedMenuItem)]), api_custom_element("lightning-button-menu", _lightningButtonMenu, {
        key: 16
      }, api_iterator($cmp.icons, function (icon) {
        return api_custom_element("lightning-menu-item", _lightningMenuItem, {
          props: {
            "value": icon.name,
            "label": icon.label
          },
          key: api_key(18, icon.name),
          on: {
            "click": _m0 || ($ctx._m0 = api_bind($cmp.handleMenuClick))
          }
        }, []);
      }))]), api_element("div", {
        classMap: {
          "slds-p-around_small": true
        },
        key: 19
      }, [api_element("p", {
        key: 20
      }, [api_text("Selected : "), api_dynamic($cmp.clickedIconLabel)]), api_custom_element("lightning-button-menu", _lightningButtonMenu, {
        key: 21
      }, api_iterator($cmp.icons, function (icon) {
        return api_custom_element("lightning-button-icon", _lightningButtonIcon, {
          props: {
            "iconName": icon.name,
            "alternativeText": icon.label
          },
          key: api_key(23, icon.name),
          on: {
            "click": _m1 || ($ctx._m1 = api_bind($cmp.handleIconClick))
          }
        }, []);
      }))])];
    }

    var _tmpl$b = lwc.registerTemplate(tmpl$a);
    tmpl$a.stylesheets = [];
    tmpl$a.stylesheetTokens = {
      hostAttribute: "c-foreach_foreach-host",
      shadowAttribute: "c-foreach_foreach"
    };

    class App extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.mapItems = [{
          name: 'Asia',
          wiki: 'https://en.wikipedia.org/wiki/Asia'
        }, {
          name: 'South Asia',
          wiki: 'https://en.wikipedia.org/wiki/South_Asia'
        }, {
          name: 'India',
          wiki: 'https://en.wikipedia.org/wiki/India'
        }];
        this.icons = [{
          name: 'utility:settings',
          label: 'Settings'
        }, {
          name: 'utility:adduser',
          label: 'Add User'
        }, {
          name: 'utility:delete',
          label: 'Delete'
        }, {
          name: 'utility:save',
          label: 'Save'
        }, {
          name: 'utility:bookmark',
          label: 'Bookmark'
        }, {
          name: 'utility:zoomin',
          label: 'Zoom in'
        }, {
          name: 'utility:zoomout',
          label: 'Zoom out'
        }];
        this.clickedIconLabel = void 0;
        this.clickedMenuItem = void 0;
      }

      handleIconClick(event) {
        this.clickedIconLabel = event.target.alternativeText;
      }

      handleMenuClick(event) {
        this.clickedMenuItem = event.target.label;
      }

    }

    lwc.registerDecorators(App, {
      track: {
        mapItems: 1,
        icons: 1,
        clickedIconLabel: 1,
        clickedMenuItem: 1
      }
    });

    var main = lwc.registerComponent(App, {
      tmpl: _tmpl$b
    });

    registerWireService(lwc.register);

        const element = lwc.createElement('c-foreach', { is: main, fallback: true });
        document.querySelector('main').appendChild(element);

}(Engine));
