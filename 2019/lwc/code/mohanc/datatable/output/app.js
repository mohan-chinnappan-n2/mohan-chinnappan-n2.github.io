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
        t: api_text,
        h: api_element,
        s: api_slot
      } = $api;
      return [$cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true,
          "slds-col": true,
          "slds-grow-none": true,
          "slds-m-right_xx-small": true
        },
        attrs: {
          "aria-hidden": "true"
        },
        key: 3
      }, [api_text("*")]) : null, api_slot("", {
        key: 4
      }, [], $slotset)];
    }

    var _tmpl = lwc.registerTemplate(tmpl);
    tmpl.slots = [""];
    tmpl.stylesheets = [];
    tmpl.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditInputWrapper_primitiveDatatableIeditInputWrapper-host",
      shadowAttribute: "lightning-primitiveDatatableIeditInputWrapper_primitiveDatatableIeditInputWrapper"
    };

    /**
     * @TODO: This component should be removed once the issue with label is solved in SLDS or IO
     */

    class LightningPrimitiveDatatableIeditInputWrapper extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.required = void 0;
      }

    }

    lwc.registerDecorators(LightningPrimitiveDatatableIeditInputWrapper, {
      publicProps: {
        required: {
          config: 0
        }
      }
    });

    var _lightningPrimitiveDatatableIeditInputWrapper = lwc.registerComponent(LightningPrimitiveDatatableIeditInputWrapper, {
      tmpl: _tmpl
    });

    var _tmpl$1 = void 0;

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

    const NA_PHONE_NUMBER = '($1) $2-$3';
    const IS_TEN_DIGITS = /^\d{10}$/;
    const TEN_TO_NA = /(\d{3})(\d{3})(\d{4})/;
    const IS_ELEVEN_DIGITS = /^1\d{10}/;
    const ELEVEN_TO_NA = /1(\d{3})(\d{3})(\d{4})$/;
    function toNorthAmericanPhoneNumber(value) {
      if (IS_TEN_DIGITS.test(value)) {
        return value.replace(TEN_TO_NA, NA_PHONE_NUMBER);
      } else if (IS_ELEVEN_DIGITS.test(value)) {
        return value.replace(ELEVEN_TO_NA, NA_PHONE_NUMBER);
      }

      return value || '';
    }

    const urlRegexString = "((?:(?:https?|ftp):\\/\\/(?:[\\w\\-\\|=%~#\\/+*@\\.,;:\\?!']|&){0,2047}(?:[\\(\\)\\.\\w=\\/+#-]*)[^\\s()\\.<>,;\\[\\]`'\"])|(?:\\b(?:[a-z0-9](?:[-a-z0-9]{0,62}[a-z0-9])?\\.)+(?:AC|AD|AE|AERO|AF|AG|AI|AL|AM|AN|AO|AQ|AR|ARPA|AS|ASIA|AT|AU|AW|AX|AZ|BA|BB|BD|BE|BF|BG|BH|BI|BIZ|BJ|BM|BN|BO|BR|BS|BT|BV|BW|BY|BZ|CA|CAT|CC|CD|CF|CG|CH|CI|CK|CL|CM|CN|CO|COM|COOP|CR|CU|CV|CX|CY|CZ|DE|DJ|DK|DM|DO|DZ|EC|EDU|EE|EG|ER|ES|ET|EU|FI|FJ|FK|FM|FO|FR|GA|GB|GD|GE|GF|GG|GH|GI|GL|GM|GN|GOV|GP|GQ|GR|GS|GT|GU|GW|GY|HK|HM|HN|HR|HT|HU|ID|IE|IL|IM|IN|INFO|INT|IO|IQ|IR|IS|IT|JE|JM|JO|JOBS|JP|KE|KG|KH|KI|KM|KN|KP|KR|KW|KY|KZ|LA|LB|LC|LI|LK|LR|LS|LT|LU|LV|LY|MA|MC|MD|ME|MG|MH|MIL|MK|ML|MM|MN|MO|MOBI|MP|MQ|MR|MS|MT|MU|MUSEUM|MV|MW|MX|MY|MZ|NA|NAME|NC|NE|NET|NF|NG|NI|NL|NO|NP|NR|NU|NZ|OM|ORG|PA|PE|PF|PG|PH|PK|PL|PM|PN|PR|PRO|PS|PT|PW|PY|QA|RE|RO|RS|RU|RW|SA|SB|SC|SD|SE|SG|SH|SI|SJ|SK|SL|SM|SN|SO|SR|ST|SU|SV|SY|SZ|TC|TD|TEL|TF|TG|TH|TJ|TK|TL|TM|TN|TO|TP|TR|TRAVEL|TT|TV|TW|TZ|UA|UG|UK|US|UY|UZ|VA|VC|VE|VG|VI|VN|VU|WF|WS|XN--0ZWM56D|XN--11B5BS3A9AJ6G|XN--80AKHBYKNJ4F|XN--9T4B11YI5A|XN--DEBA0AD|XN--FIQS8S|XN--FIQZ9S|XN--G6W251D|XN--HGBK6AJ7F53BBA|XN--HLCJ6AYA9ESC7A|XN--J6W193G|XN--JXALPDLP|XN--KGBECHTV|XN--KPRW13D|XN--KPRY57D|XN--MGBAAM7A8H|XN--MGBERP4A5D4AR|XN--P1AI|XN--WGBH1C|XN--ZCKZAH|YE|YT|ZA|ZM|ZW)(?!@(?:[a-z0-9](?:[-a-z0-9]{0,62}[a-z0-9])?\\.)+(?:AC|AD|AE|AERO|AF|AG|AI|AL|AM|AN|AO|AQ|AR|ARPA|AS|ASIA|AT|AU|AW|AX|AZ|BA|BB|BD|BE|BF|BG|BH|BI|BIZ|BJ|BM|BN|BO|BR|BS|BT|BV|BW|BY|BZ|CA|CAT|CC|CD|CF|CG|CH|CI|CK|CL|CM|CN|CO|COM|COOP|CR|CU|CV|CX|CY|CZ|DE|DJ|DK|DM|DO|DZ|EC|EDU|EE|EG|ER|ES|ET|EU|FI|FJ|FK|FM|FO|FR|GA|GB|GD|GE|GF|GG|GH|GI|GL|GM|GN|GOV|GP|GQ|GR|GS|GT|GU|GW|GY|HK|HM|HN|HR|HT|HU|ID|IE|IL|IM|IN|INFO|INT|IO|IQ|IR|IS|IT|JE|JM|JO|JOBS|JP|KE|KG|KH|KI|KM|KN|KP|KR|KW|KY|KZ|LA|LB|LC|LI|LK|LR|LS|LT|LU|LV|LY|MA|MC|MD|ME|MG|MH|MIL|MK|ML|MM|MN|MO|MOBI|MP|MQ|MR|MS|MT|MU|MUSEUM|MV|MW|MX|MY|MZ|NA|NAME|NC|NE|NET|NF|NG|NI|NL|NO|NP|NR|NU|NZ|OM|ORG|PA|PE|PF|PG|PH|PK|PL|PM|PN|PR|PRO|PS|PT|PW|PY|QA|RE|RO|RS|RU|RW|SA|SB|SC|SD|SE|SG|SH|SI|SJ|SK|SL|SM|SN|SO|SR|ST|SU|SV|SY|SZ|TC|TD|TEL|TF|TG|TH|TJ|TK|TL|TM|TN|TO|TP|TR|TRAVEL|TT|TV|TW|TZ|UA|UG|UK|US|UY|UZ|VA|VC|VE|VG|VI|VN|VU|WF|WS|XN--0ZWM56D|XN--11B5BS3A9AJ6G|XN--80AKHBYKNJ4F|XN--9T4B11YI5A|XN--DEBA0AD|XN--FIQS8S|XN--FIQZ9S|XN--G6W251D|XN--HGBK6AJ7F53BBA|XN--HLCJ6AYA9ESC7A|XN--J6W193G|XN--JXALPDLP|XN--KGBECHTV|XN--KPRW13D|XN--KPRY57D|XN--MGBAAM7A8H|XN--MGBERP4A5D4AR|XN--P1AI|XN--WGBH1C|XN--ZCKZAH|YE|YT|ZA|ZM|ZW))(?:/[\\w\\-=?/.&;:%~,+@#*]{0,2048}(?:[\\w=/+#-]|\\([^\\s()]*\\)))?(?:$|(?=\\.$)|(?=\\.\\s)|(?=[^\\w\\.]))))";
    const emailRegexString = '([\\w-\\.\\+_]{1,64}@(?:[\\w-]){1,255}(?:\\.[\\w-]{1,255}){1,10})';
    const newLineRegexString = '(\r\n|\r|\n)';
    const createHttpHref = function (url) {
      let href = url;

      if (url.toLowerCase().lastIndexOf('http', 0) !== 0 && url.toLowerCase().lastIndexOf('ftp', 0) !== 0) {
        href = `http://${href}`;
      }

      return href;
    };
    const createEmailHref = function (email) {
      return `mailto:${email}`;
    };

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

    function raf(fn) {
      let ticking = false;
      return function (event) {
        if (!ticking) {
          requestAnimationFrame(() => {
            fn.call(this, event);
            ticking = false;
          });
        }

        ticking = true;
      };
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

    /**
     * Set an attribute on an element, if it's a normal element
     * it will use setAttribute, if it's an LWC component
     * it will use the public property
     *
     * @param {HTMLElement} element The element to act on
     * @param {String} attribute the attribute to set
     * @param {Any} value the value to set
     */
    function smartSetAttribute(element, attribute, value) {
      if (element.tagName.match(/^LIGHTNING/i)) {
        attribute = attribute.replace(/-\w/g, m => m[1].toUpperCase());
        element[attribute] = value ? value : null;
      } else if (value) {
        element.setAttribute(attribute, value);
      } else {
        element.removeAttribute(attribute);
      }
    }

    const CONTENT_SEPARATOR = '\n';
    /**
    <template>
        <span lwc:dom="manual" class="visually-hidden"></span>
        <input>
    </template>

    class Foo extends LightningElement {
        constructor() {
            super();
            this.ariaObserver = new ContentMutation(this);
        }

        @track ariaLabeledbyValue = '';

        @api
        get ariaLabeledby() {
            return this.ariaLabeledbyValue; // whatever they set, is what they get back.
        }
        set ariaLabeledby(refs) {
            this.ariaLabeledbyValue = refs;
            this.ariaObserver.link('input', 'aria-labeledby', refs, 'span.visually-hidden');
        }

        renderedCallback() {
            this.ariaObserver.sync();
        }
    }
    **/

    function getAttr(elm, attr) {
      if (elm.tagName.match(/lightning/i)) {
        return elm[attr];
      }

      return elm.getAttribute(attr);
    }

    function extractElements(root, selector) {
      if (typeof selector !== 'string' || selector === '') {
        return [];
      }

      return [].slice.call(root.querySelectorAll(selector));
    }

    function extractContent(elements) {
      return elements.map(element => element.textContent).filter(text => text.length).join(CONTENT_SEPARATOR);
    }

    function splitIds(ids) {
      return (ids + '').trim().split(/\s+/);
    }

    function hashIds(ids) {
      return (ids + '').trim().split(/\s+/).reduce((r, v) => {
        r[v] = 1;
        return r;
      }, {});
    } // this method should check each individual id from computedIds
    // against the existing value of the attrName on elm, and dupe
    // them, and add the new ones.


    function addAriaRefWhenNeeded(elm, attrName, computedIds) {
      const newIds = splitIds(computedIds);
      const oldIds = getAttr(elm, attrName) || '';
      const oldIdsHash = hashIds(oldIds);
      const suffix = [];

      for (let i = 0; i < newIds.length; i += 1) {
        if (!oldIdsHash[newIds[i]]) {
          suffix.push(newIds[i]);
        }
      }

      if (suffix.length !== 0) {
        smartSetAttribute(elm, attrName, oldIds + (oldIds.length === 0 ? '' : ' ') + suffix.join(' '));
      }
    } // this method should check each individual id from computedIds
    // against the existing value of the attrName on elm, and remove
    // them when possible in preparation for some new values.


    function removeAriaRefWhenPossible(elm, attrName, computedIds) {
      const newIds = splitIds(computedIds);
      const oldIds = getAttr(elm, attrName) || '';
      const oldIdsHash = hashIds(oldIds);
      const newValues = [];

      for (let i = 0; i < newIds.length; i += 1) {
        if (!oldIdsHash[newIds[i]]) {
          newValues.push(newIds[i]);
        }
      }

      smartSetAttribute(elm, attrName, newValues.join(' '));
    }

    class ContentMutation {
      constructor(component) {
        this.template = component.template;
        this.isNative = this.template.constructor.toString().match(/\[native code\]/);
        this.state = {};
        this.liveIds = {};
        this.guid = guid();
      }

      connectLiveIdRef(refs, callback) {
        const selector = (refs + '').trim().split(/\s+/).map(ref => `[id*="${ref}"]`).join(',');
        const liveId = {
          selector,
          callback
        };
        this.liveIds[refs] = liveId;
      }

      link(innerSelector, attrName, ids, placeholderContainerSelector) {
        let attrState = this.state[attrName];

        if (attrState) {
          // note: we don't support linking to a different innerSelector,
          // attrName, or placeholderContainerSelector
          if (!this.isNative) {
            const elm = this.template.querySelector(innerSelector);

            if (elm) {
              // removing the old ids if possible before setting the new ones
              removeAriaRefWhenPossible(elm, attrName, attrState.ids);
            }

            attrState.ids = ids;
          }
        } else {
          attrState = this.state[attrName] = {
            ids,
            innerSelector,
            placeholderContainerSelector
          };
        }

        if (this.isNative) {
          attrState.outerSelector = (ids + '').trim().split(/\s+/).map(ref => `#${ref}`).join(',');
          attrState.placeholder = document.createElement('span');
          attrState.placeholder.id = `auto-link-${attrName}-${this.guid}`;
        }

        if (this.template.host.parentNode) {
          this.privateUpdate(attrName);
        }
      }

      sync() {
        if (!this.template.host.parentNode) {
          throw new Error(`Invalid sync invocation. It can only be invoked during renderedCallback().`);
        }

        if (this.isNative && !this.mo) {
          this.privateConnect();
        }

        for (const attrName in this.state) {
          if (this.state.hasOwnProperty(attrName)) {
            this.privateUpdate(attrName);
          }
        } // live idRef feature is a no-op in native


        if (!this.isNative) {
          this.privateUpdateLiveIds();
        }
      }

      privateExtractIds(elements) {
        return elements.map(el => {
          return el.getAttribute('id');
        }).join(' ');
      }

      privateUpdateLiveIds() {
        const root = this.template.host.getRootNode(); // if not connected do nothing

        if (!root) {
          return;
        }

        for (const liveId in this.liveIds) {
          if (this.liveIds.hasOwnProperty(liveId)) {
            const thisId = this.liveIds[liveId];

            if (!thisId.elements) {
              // element refs are cached
              thisId.elements = Array.prototype.slice.call(root.querySelectorAll(thisId.selector));
            }

            const newIds = this.privateExtractIds(thisId.elements); // only fire calback if the value changed

            if (newIds !== thisId.ids) {
              thisId.callback(newIds);
              thisId.ids = newIds;
            }
          }
        }
      }

      privateUpdate(attrName) {
        const {
          innerSelector
        } = this.state[attrName];
        const elm = this.template.querySelector(innerSelector);

        if (!elm) {
          return; // nothing to update
        }

        let computedIds;

        if (this.isNative) {
          const {
            outerSelector,
            content,
            placeholder,
            placeholderContainerSelector
          } = this.state[attrName];
          const newContent = extractContent(extractElements(this.root, outerSelector));

          if (content !== newContent) {
            this.state[attrName].content = placeholder.textContent = newContent;
          }

          if (!placeholder.parentNode) {
            // inserting the placeholder once
            const container = this.template.querySelector(placeholderContainerSelector);

            if (container) {
              container.appendChild(placeholder);
            }
          }

          computedIds = placeholder.id;
        } else {
          computedIds = this.state[attrName].ids;
        }

        addAriaRefWhenNeeded(elm, attrName, computedIds);
      }

      privateConnect() {
        // caching root ref
        this.root = this.template.host.getRootNode(); // creating the observer once

        const mo = new MutationObserver(() => {
          if (!this.template.host.parentNode) {
            return; // do nothing when the template is not connected
          }

          this.sync();
        });
        mo.observe(this.root, {
          characterData: true,
          childList: true,
          subtree: true
        });
      }

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
     * @param {HTMLElement} element Element to act on
     * @param {Object} values values and attributes to set, if the value is
     *                        falsy it the attribute will be removed
     */

    function synchronizeAttrs(element, values) {
      if (!element) {
        return;
      }

      const attributes = Object.keys(values);
      attributes.forEach(attribute => {
        smartSetAttribute(element, attribute, values[attribute]);
      });
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
    const URL_CHECK_REGEX = /^(\/+|\.+|ftp|http(s?):\/\/)/i;
    function isAbsoluteUrl(url) {
      return URL_CHECK_REGEX.test(url);
    }

    function tmpl$1($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$2 = lwc.registerTemplate(tmpl$1);
    tmpl$1.stylesheets = [];
    tmpl$1.stylesheetTokens = {
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

    const inputableNode = /input|select|textarea|button|object/;

    function visible(element) {
      const {
        width,
        height
      } = element.getBoundingClientRect();
      const noZeroSize = width > 0 || height > 0;
      return noZeroSize && window.getComputedStyle(lwc.unwrap(element)).visibility !== 'hidden';
    }

    function focusable(element) {
      const nodeName = element.tagName.toLowerCase();
      const res = inputableNode.test(nodeName) && !element.disabled || nodeName === 'a' && element.href;
      return res && visible(element);
    }

    function tabbable(element) {
      const isDataActionable = element.getAttribute('data-navigation') === 'enable';
      const tabIndex = element.tabIndex;
      return tabIndex >= 0 && focusable(element) || isDataActionable;
    }

    function queryFocusable(element) {
      return [].slice.call(element.querySelectorAll('*'), 0).filter(tabbable);
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

    let FORM_FACTOR;
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
    function getFormFactor() {
      if (!FORM_FACTOR) {
        if (PROVIDED_IMPL && PROVIDED_IMPL.getFormFactor) {
          FORM_FACTOR = PROVIDED_IMPL.getFormFactor();
        } else {
          FORM_FACTOR = 'DESKTOP';
        }
      }

      return FORM_FACTOR;
    }
    function getLocalizationService() {
      return PROVIDED_IMPL && PROVIDED_IMPL.getLocalizationService && PROVIDED_IMPL.getLocalizationService();
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

        return _tmpl$2;
      }

      render() {
        if (this.inlineSvgProvided) {
          return this.resolveTemplate();
        }

        return _tmpl$2;
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
      tmpl: _tmpl$2
    });

    function tmpl$2($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$3 = lwc.registerTemplate(tmpl$2);
    tmpl$2.stylesheets = [];
    tmpl$2.stylesheetTokens = {
      hostAttribute: "lightning-helptext_helptext-host",
      shadowAttribute: "lightning-helptext_helptext"
    };

    var labelButtonAlternativeText = 'Help';

    const isiOS = !!navigator.platform && ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;

    function tmpl$3($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$4 = lwc.registerTemplate(tmpl$3);
    tmpl$3.stylesheets = [];
    tmpl$3.stylesheetTokens = {
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
      tmpl: _tmpl$4
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
      tmpl: _tmpl$3
    });

    function tmpl$4($api, $cmp, $slotset, $ctx) {
      const {
        s: api_slot
      } = $api;
      return [api_slot("", {
        key: 2
      }, [], $slotset)];
    }

    var _tmpl$5 = lwc.registerTemplate(tmpl$4);
    tmpl$4.slots = [""];
    tmpl$4.stylesheets = [];
    tmpl$4.stylesheetTokens = {
      hostAttribute: "lightning-primitiveFileDroppableZone_primitiveFileDroppableZone-host",
      shadowAttribute: "lightning-primitiveFileDroppableZone_primitiveFileDroppableZone"
    };

    class LightningPrimitiveFileDroppableZone extends lwc.LightningElement {
      get disabled() {
        return this.state.disabled || false;
      }

      set disabled(value) {
        this.state.disabled = normalizeBoolean(value);
      }

      get multiple() {
        return this.state.multiple || false;
      }

      set multiple(value) {
        this.state.multiple = normalizeBoolean(value);
      }

      constructor() {
        super();
        this.state = {};
        this.template.addEventListener('dragover', this.allowDrop.bind(this));
        this.template.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.template.addEventListener('drop', this.handleOnDrop.bind(this));
      }

      connectedCallback() {
        this.classList.add('slds-file-selector__dropzone');
      }

      setDragOver(dragOver) {
        this.classList.toggle('slds-has-drag-over', dragOver);
      }

      handleDragLeave() {
        this.setDragOver(false);
      }

      handleOnDrop(event) {
        event.preventDefault();
        this.setDragOver(false);

        if (this.disabled) {
          event.stopPropagation();
          return;
        }

        if (!this.meetsMultipleCriteria(event)) {
          event.stopPropagation();
        }
      }

      allowDrop(event) {
        event.preventDefault();

        if (!this.disabled) {
          this.setDragOver(true);
        }
      }

      meetsMultipleCriteria(dragEvent) {
        const files = dragEvent.dataTransfer.files;
        return !(files.length > 1 && !this.multiple);
      }

    }

    lwc.registerDecorators(LightningPrimitiveFileDroppableZone, {
      publicProps: {
        disabled: {
          config: 3
        },
        multiple: {
          config: 3
        }
      },
      track: {
        state: 1
      }
    });

    var _lightningPrimitiveFileDroppableZone = lwc.registerComponent(LightningPrimitiveFileDroppableZone, {
      tmpl: _tmpl$5
    });

    function tmpl$5($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        gid: api_scoped_id,
        h: api_element,
        b: api_bind
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
        classMap: {
          "slds-color-picker__custom": true
        },
        key: 2
      }, [api_element("p", {
        classMap: {
          "slds-assistive-text": true
        },
        attrs: {
          "id": api_scoped_id("color-picker-instructions")
        },
        key: 3
      }, [api_dynamic($cmp.i18n.colorPickerInstructions)]), api_element("div", {
        classMap: {
          "slds-m-bottom_small": true
        },
        style: $cmp.gradientStyle,
        attrs: {
          "data-id": "color-gradient"
        },
        key: 4,
        on: {
          "mousedown": _m3 || ($ctx._m3 = api_bind($cmp.handleMouseDown))
        }
      }, [api_element("canvas", {
        attrs: {
          "width": $cmp.canvasRect.x,
          "height": $cmp.canvasRect.y
        },
        key: 5
      }, []), api_element("a", {
        classMap: {
          "slds-color-picker__range-indicator": true
        },
        styleMap: {
          "position": "absolute",
          "display": "inline"
        },
        attrs: {
          "data-id": "color-anchor",
          "href": "javascript:void(0)",
          "aria-live": "assertive",
          "aria-atomic": "true",
          "aria-describedby": `${api_scoped_id("color-picker-instructions")}`
        },
        key: 6,
        on: {
          "mousedrag": _m0 || ($ctx._m0 = api_bind($cmp.handlePreventDefault)),
          "mousedown": _m1 || ($ctx._m1 = api_bind($cmp.handlePreventDefault)),
          "keydown": _m2 || ($ctx._m2 = api_bind($cmp.handleKeydown))
        }
      }, [api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 7
      }, [api_dynamic($cmp.computedSaturationAndBrightness)])])]), api_element("div", {
        classMap: {
          "slds-color-picker__hue-and-preview": true
        },
        key: 8
      }, [api_element("label", {
        classMap: {
          "slds-assistive-text": true
        },
        attrs: {
          "for": `${api_scoped_id("rainbow")}`
        },
        key: 9
      }, [api_dynamic($cmp.i18n.hueInput)]), api_element("input", {
        classMap: {
          "slds-color-picker__hue-slider": true
        },
        attrs: {
          "data-id": "hue-slider",
          "type": "range",
          "min": "0",
          "max": "360",
          "id": api_scoped_id("rainbow")
        },
        props: {
          "value": $cmp.state.hueValue
        },
        key: 10,
        on: {
          "mousedown": _m4 || ($ctx._m4 = api_bind($cmp.handleDrag)),
          "change": _m5 || ($ctx._m5 = api_bind($cmp.onChange))
        }
      }, []), api_element("span", {
        classMap: {
          "slds-swatch": true
        },
        style: $cmp.thumbnailStyle,
        attrs: {
          "data-id": "color-preview"
        },
        key: 11
      }, [api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        attrs: {
          "aria-hidden": "true"
        },
        key: 12
      }, [api_dynamic($cmp.state.hex)])])]), api_element("div", {
        classMap: {
          "slds-color-picker__custom-inputs": true
        },
        key: 13
      }, [api_element("div", {
        classMap: {
          "slds-form-element": true,
          "slds-color-picker__input-custom-hex": true
        },
        key: 14
      }, [api_element("label", {
        classMap: {
          "slds-form-element__label": true
        },
        attrs: {
          "for": `${api_scoped_id("input")}`
        },
        key: 15
      }, [api_dynamic($cmp.i18n.hexLabel)]), api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 16
      }, [api_element("input", {
        classMap: {
          "slds-input": true
        },
        attrs: {
          "data-primary-input": true,
          "type": "text",
          "id": api_scoped_id("input"),
          "minlength": "4",
          "maxlength": "7",
          "pattern": "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
          "placeholder": "#FFFFFF"
        },
        props: {
          "value": $cmp.state.hex
        },
        key: 17,
        on: {
          "change": _m6 || ($ctx._m6 = api_bind($cmp.handleHexChange))
        }
      }, [])])]), api_element("div", {
        classMap: {
          "slds-form-element": true
        },
        key: 18
      }, [api_element("label", {
        classMap: {
          "slds-form-element__label": true
        },
        attrs: {
          "for": `${api_scoped_id("red")}`
        },
        key: 19
      }, [api_element("abbr", {
        attrs: {
          "title": $cmp.i18n.redAbbr
        },
        key: 20
      }, [api_dynamic($cmp.i18n.rInput)])]), api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 21
      }, [api_element("input", {
        classMap: {
          "slds-input": true
        },
        attrs: {
          "type": "text",
          "id": api_scoped_id("red"),
          "data-color-name": "red",
          "placeholder": "255"
        },
        props: {
          "value": $cmp.state.rgb.red
        },
        key: 22,
        on: {
          "change": _m7 || ($ctx._m7 = api_bind($cmp.handleRgbChange))
        }
      }, [])])]), api_element("div", {
        classMap: {
          "slds-form-element": true
        },
        key: 23
      }, [api_element("label", {
        classMap: {
          "slds-form-element__label": true
        },
        attrs: {
          "for": `${api_scoped_id("green")}`
        },
        key: 24
      }, [api_element("abbr", {
        attrs: {
          "title": $cmp.i18n.greenAbbr
        },
        key: 25
      }, [api_dynamic($cmp.i18n.gInput)])]), api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 26
      }, [api_element("input", {
        classMap: {
          "slds-input": true
        },
        attrs: {
          "type": "text",
          "id": api_scoped_id("green"),
          "data-color-name": "green",
          "placeholder": "255"
        },
        props: {
          "value": $cmp.state.rgb.green
        },
        key: 27,
        on: {
          "change": _m8 || ($ctx._m8 = api_bind($cmp.handleRgbChange))
        }
      }, [])])]), api_element("div", {
        classMap: {
          "slds-form-element": true
        },
        key: 28
      }, [api_element("label", {
        classMap: {
          "slds-form-element__label": true
        },
        attrs: {
          "for": `${api_scoped_id("blue")}`
        },
        key: 29
      }, [api_element("abbr", {
        attrs: {
          "title": $cmp.i18n.blueAbbr
        },
        key: 30
      }, [api_dynamic($cmp.i18n.bInput)])]), api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 31
      }, [api_element("input", {
        classMap: {
          "slds-input": true
        },
        attrs: {
          "type": "text",
          "id": api_scoped_id("blue"),
          "data-color-name": "blue",
          "placeholder": "255"
        },
        props: {
          "value": $cmp.state.rgb.blue
        },
        key: 32,
        on: {
          "change": _m9 || ($ctx._m9 = api_bind($cmp.handleRgbChange))
        }
      }, [])])])]), $cmp.state.errorMessage ? api_element("div", {
        classMap: {
          "slds-form-element__help": true
        },
        attrs: {
          "aria-live": "assertive"
        },
        key: 34
      }, [api_dynamic($cmp.state.errorMessage)]) : null])];
    }

    var _tmpl$6 = lwc.registerTemplate(tmpl$5);
    tmpl$5.stylesheets = [];
    tmpl$5.stylesheetTokens = {
      hostAttribute: "lightning-colorPickerCustom_colorPickerCustom-host",
      shadowAttribute: "lightning-colorPickerCustom_colorPickerCustom"
    };

    var labelBInput = 'B';

    var labelBlueAbbr = 'Blue';

    var labelColorPickerInstructions = 'Use arrow keys to select a saturation and brightness, on an x and y axis.';

    var labelErrorMessage = 'Enter a valid hexadecimal value.';

    var labelGInput = 'G';

    var labelGreenAbbr = 'Green';

    var labelHexLabel = 'Hex';

    var labelHueInput = 'Select Hue';

    var labelRInput = 'R';

    var labelRedAbbr = 'Red';

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
    class FieldConstraintApiWithProxyInput {
      constructor(inputComponent, overrides = {}, inputElementName = 'input') {
        this._inputComponent = inputComponent;
        this._overrides = overrides;
        this._proxyInput = document.createElement(inputElementName);
      }

      setInputAttributes(attributes) {
        this._attributes = attributes;

        this._attributeUpdater = attributeNames => {
          if (!attributes) {
            return;
          }

          if (typeof attributeNames === 'string') {
            this._setAttribute(attributeNames, attributes[attributeNames]());
          } else {
            attributeNames.forEach(attributeName => {
              this._setAttribute(attributeName, attributes[attributeName]());
            });
          }
        };

        return this._attributeUpdater;
      }

      get validity() {
        return this._constraintApi.validity;
      }

      checkValidity() {
        return this._constraintApi.checkValidity();
      }

      reportValidity(callback) {
        return this._constraintApi.reportValidity(callback);
      }

      setCustomValidity(message) {
        this._constraintApi.setCustomValidity(message);

        this._proxyInput.setCustomValidity(message);
      }

      get validationMessage() {
        return this._constraintApi.validationMessage;
      }

      _setAttribute(attributeName, value) {
        if (value !== null && value !== undefined && value !== false) {
          if (attributeName === 'value') {
            if (this._proxyInput.type === 'file') {
              // Can't set value on file
              return;
            }

            this._proxyInput.value = value;
          } else {
            this._proxyInput.setAttribute(attributeName, value);
          }
        } else {
          this._removeAttribute(attributeName);
        }
      }

      _removeAttribute(attributeName) {
        this._proxyInput.removeAttribute(attributeName);
      }

      get _constraintApi() {
        if (!this._privateConstraintApi) {
          this._updateAllAttributes();

          const computeConstraintWithProxyInput = constraintName => {
            const constraintOverride = this._overrides[constraintName];

            if (typeof constraintOverride === 'function') {
              const result = constraintOverride();

              if (typeof result === 'boolean') {
                return !this._proxyInput.hasAttribute('disabled') && !this._proxyInput.hasAttribute('readonly') && result;
              }
            }

            return this._proxyInput.validity[constraintName];
          };

          const constraintsProvider = constraintsSortedByPriority.reduce((provider, constraint) => {
            provider[constraint] = computeConstraintWithProxyInput.bind(this, constraint);
            return provider;
          }, {});
          this._privateConstraintApi = new FieldConstraintApi(this._inputComponent, constraintsProvider);
        }

        return this._privateConstraintApi;
      }

      _updateAllAttributes() {
        if (this._attributes) {
          Object.entries(this._attributes).forEach(([key, valueFunction]) => {
            this._setAttribute(key, valueFunction());
          });
        }
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

    function normalizeVariant(value) {
      return normalizeString(value, {
        fallbackValue: VARIANT.STANDARD,
        validValues: [VARIANT.STANDARD, VARIANT.LABEL_HIDDEN, VARIANT.LABEL_STACKED, VARIANT.LABEL_INLINE]
      });
    }

    function isEmptyString(s) {
      return s === undefined || s === null || typeof s === 'string' && s.trim() === '';
    }

    function fullHexValue(hex) {
      if (hex && hex.length <= 6 && hex.charAt(0) !== '#') {
        hex = '#' + hex;
      }

      const isInputValid = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);

      if (!isInputValid) {
        hex = '#000000';
      } // Converting 3 digit hex color to 6 digit hex color


      if (hex.length === 4) {
        hex = '#' + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) + hex.charAt(3) + hex.charAt(3);
      }

      return hex;
    }
    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHexValue(hex));

      if (!result) {
        return null;
      }

      return {
        red: parseInt(result[1], 16),
        green: parseInt(result[2], 16),
        blue: parseInt(result[3], 16)
      };
    }
    function rgbToHex(rgb) {
      const r = rgb.red;
      const g = rgb.green;
      const b = rgb.blue;
      const bin = r << 16 | g << 8 | b;
      return function (hex) {
        return new Array(7 - hex.length).join('0') + hex;
      }(bin.toString(16).toUpperCase());
    }
    function rgbToHsl(rgb) {
      const r1 = rgb.red / 255;
      const g1 = rgb.green / 255;
      const b1 = rgb.blue / 255;
      const maxColor = Math.max(r1, g1, b1);
      const minColor = Math.min(r1, g1, b1); // Calculate L:

      let L = (maxColor + minColor) / 2;
      let S = 0;
      let H = 0;

      if (maxColor !== minColor) {
        // Calculate S:
        if (L < 0.5) {
          S = (maxColor - minColor) / (maxColor + minColor);
        } else {
          S = (maxColor - minColor) / (2.0 - maxColor - minColor);
        } // Calculate H:


        if (r1 === maxColor) {
          const x = g1 - b1,
                y = maxColor - minColor;
          H = x / y;
        } else if (g1 === maxColor) {
          const x = b1 - r1,
                y = maxColor - minColor,
                z = x / y;
          H = 2.0 + z;
        } else {
          const x = r1 - g1,
                y = maxColor - minColor,
                z = x / y;
          H = 4.0 + z;
        }
      }

      L *= 100;
      S *= 100;
      H *= 60;

      if (H < 0) {
        H += 360;
      }

      const result = {
        hue: H,
        saturation: S,
        lightness: L
      };
      return result;
    }
    function rgbToPosition(rgb, canvas) {
      const hsv = rgbToHsv(rgb);
      const saturation = hsv.saturation / 100,
            brightness = hsv.brightness / 100;
      const x = canvas.x * saturation;
      const y = canvas.y * (1 - brightness);
      return {
        x,
        y
      };
    }
    function rgbToHsv(rgb) {
      const r = rgb.red / 255;
      const g = rgb.green / 255;
      const b = rgb.blue / 255;
      const max = Math.max(r, g, b),
            min = Math.min(r, g, b);
      const d = max - min,
            s = max === 0 ? 0 : d / max,
            v = max;
      let h, x, y;

      if (max === min) {
        h = 0;
      } else {
        switch (max) {
          case r:
            x = g - b;
            y = x / d;
            h = y + (g < b ? 6 : 0);
            break;

          case g:
            x = b - r;
            y = x / d;
            h = y + 2;
            break;

          case b:
            x = r - g;
            y = x / d;
            h = y + 4;
            break;

          default:
            break;
        }

        h /= 6;
      }

      const result = {
        hue: h * 360,
        saturation: s * 100,
        brightness: v * 100
      };
      return result;
    }

    const i18n$1 = {
      bInput: labelBInput,
      blueAbbr: labelBlueAbbr,
      colorPickerInstructions: labelColorPickerInstructions,
      errorMessage: labelErrorMessage,
      gInput: labelGInput,
      greenAbbr: labelGreenAbbr,
      hexLabel: labelHexLabel,
      hueInput: labelHueInput,
      rInput: labelRInput,
      redAbbr: labelRedAbbr
    };
    const CANVAS = {
      x: 198,
      y: 80
    };

    class LightningColorPickerCustom extends lwc.LightningElement {
      constructor() {
        super();
        this.state = {
          hueValue: null,
          rgb: {
            red: '86',
            green: '121',
            blue: '192'
          },
          hex: '#5679C0',
          errorMessage: null,
          currentColor: null
        };
        this._initialized = false;
        this.uniqueId = generateUniqueId();
      }

      renderedCallback() {
        if (!this._initialized) {
          this.focus();
          this.gradient();
          this.handleUpdateAnchor();
          this._initialized = true;
        }
      }

      get currentColor() {
        return this.state.currentColor;
      }

      set currentColor(value) {
        const fullHex = fullHexValue(value);
        this.state.currentColor = value;
        this.state.hex = fullHex;
        this.state.rgb = hexToRgb(fullHex);
      }

      focus() {
        this.anchorElement.focus();
      }

      get i18n() {
        return i18n$1;
      }

      get thumbnailStyle() {
        return `background: ${this.state.hex || 'hsl(220, 46%, 55%)'};`;
      }

      get gradientStyle() {
        return `background: ${this.state.hex || 'rgb(0, 85, 255)'}; position: relative;`;
      }

      get canvasRect() {
        return CANVAS;
      }

      get anchorElement() {
        return this.template.querySelector('*[data-id="color-anchor"]');
      }

      get thumbnailElement() {
        return this.template.querySelector('*[data-id="color-preview"]');
      }

      get gradientElement() {
        return this.template.querySelector('*[data-id="color-gradient"]');
      }

      get computedSaturationAndBrightness() {
        const rgb = this.state.rgb;
        const saturation = rgbToHsv(rgb).saturation || 0;
        const brightness = rgbToHsv(rgb).brightness || 0;
        return `Saturation: ${saturation.toFixed()}%. Brightness: ${brightness.toFixed()}%.`;
      }

      handlePreventDefault(event) {
        event.preventDefault();
      }

      selectColor(event) {
        this.dispatchEvent( // eslint-disable-next-line lightning-global/no-custom-event-bubbling
        new CustomEvent('updatecolor', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            color: event.target.innerText
          }
        }));
      }

      handleMouseDown(event) {
        event.preventDefault();
        this.onMouseDrag(event, true);
      }

      handleDrag(event) {
        this.onMouseDrag(event, false);
      }

      onChange() {
        this.rainbowCursor();
      }

      parseAndLimit(value) {
        let out = value;

        if (!value || parseInt(value, 10) < 0 || isNaN(value)) {
          out = 0;
        } else if (parseInt(value, 10) > 255) {
          out = 255;
        }

        return out;
      }

      handleRgbChange(event) {
        const value = this.parseAndLimit(event.currentTarget.value); // Fix for no rerender on second bad value attempt

        event.currentTarget.value = value;

        if (event.currentTarget.getAttribute('data-color-name') === 'red') {
          this.state.rgb.red = value;
        } else if (event.currentTarget.getAttribute('data-color-name') === 'green') {
          this.state.rgb.green = value;
        } else if (event.currentTarget.getAttribute('data-color-name') === 'blue') {
          this.state.rgb.blue = value;
        }

        const rgb = this.state.rgb;
        const hue = rgbToHsl(rgb).hue;
        const position = this.rgbToPosition(rgb);
        const selectedColor = `#${rgbToHex(rgb)}`;
        this.updateRainbow(hue);
        this.setCanvasColor(hue);
        this.setCanvasCursor(position.x, position.y);
        this.updateSelectedColor(selectedColor);
      }

      handleHexChange(event) {
        const isInputValid = event.srcElement.validity.valid;

        if (isInputValid) {
          const selectedColor = fullHexValue(event.target.value);
          this.classList.remove('slds-has-error');
          this.state.errorMessage = null;
          const rgb = hexToRgb(selectedColor);
          this.state.rgb = rgb;
          const hue = rgbToHsl(rgb).hue;
          const position = this.rgbToPosition(rgb);
          this.updateRainbow(hue);
          this.setCanvasColor(hue);
          this.setCanvasCursor(position.x, position.y);
          this.updateSelectedColor(selectedColor);
        } else {
          event.srcElement.classList.add('slds-has-error');
          this.state.errorMessage = getErrorMessage(event.srcElement.validity, {
            patternMismatch: this.i18n.errorMessage
          });
        }
      }

      updateSelectedColor(selectedColor) {
        this.template.querySelector(`[data-primary-input]`).classList.remove('slds-has-error');
        this.state.errorMessage = null;
        this.state.hex = selectedColor;
        this.dispatchEvent( // eslint-disable-next-line lightning-global/no-custom-event-bubbling
        new CustomEvent('updateselectedcolor', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            color: selectedColor
          }
        }));
      }

      onMouseDrag(event, isGradientCursor) {
        const that = this;
        let drag = false;

        if (isGradientCursor) {
          this.getColorFromGradient(event);
        } else {
          this.rainbowCursor();
        }

        if (this._mousedown && this._mousemove && this._mouseup) {
          return;
        }

        that._mousedown = function () {
          drag = true;
          this._cursorActive = true;
        };

        that._mouseup = function () {
          drag = false;
          this._cursorActive = false;
          window.removeEventListener('mousedown', that._mousedown);
          window.removeEventListener('mouseup', that._mouseup);
          window.removeEventListener('mousemove', that._mousemove);
          that._mousedown = null;
          that._mouseup = null;
          that._mousemove = null;
        };

        that._mousemove = function (evt) {
          if (drag && isGradientCursor) {
            that.getColorFromGradient(evt);
          } else if (drag) {
            that.rainbowCursor();
          }
        };

        window.addEventListener('mousedown', that._mousedown);
        window.addEventListener('mouseup', that._mouseup);
        window.addEventListener('mousemove', that._mousemove);
      }

      gradient() {
        const hue = rgbToHsl(this.state.rgb).hue;
        this.canvasContext();
        this.setCanvasColor(hue);
        this.updateRainbow(hue);
      }

      getColorFromGradient(event) {
        let cursorPosition;

        if (event.type === 'keydown' && event.key !== 'Tab') {
          cursorPosition = this.gradientCursorPositionFromKeydown(event);
        } else if (event.type === 'mousedown' || event.type === 'mousemove') {
          cursorPosition = this.gradientCursorPosition(event);
        } else {
          return;
        }

        const x = cursorPosition.x;
        const y = cursorPosition.y; // Get the current HUE value and update the canvas & cursor

        this.setCanvasColor(this.state.hueValue); // set color from gradient

        this.setRGBValues(x, y);
      }

      rainbowCursor() {
        const rainbow = this.template.querySelector('*[data-id="hue-slider"]');
        const position = this._cachePosition || this.rgbToPosition(this.state.rgb);
        this.setCanvasColor(rainbow.value);
        this.setRGBValues(position.x, position.y);
        this.updateRainbow(rainbow.value);
      }

      updateRainbow(hue) {
        this.state.hueValue = hue;
      }

      handleUpdateAnchor() {
        const position = this._cachePosition || this.rgbToPosition(this.state.rgb);
        const anchor = this.anchorElement;
        const offset = anchor.offsetWidth / 2;
        const x = position.x - offset + 5;
        const y = position.y - offset - 5;
        const xPercent = x / this._canvas.width * 100;
        const yPercent = y / this._canvas.height * 100;
        anchor.style.left = `${xPercent}%`;
        anchor.style.top = `${yPercent}%`;
      }

      gradientCursorPosition(event) {
        const canvas = this._canvas;
        const gradientCanvas = canvas.getBoundingClientRect();
        let x = event.clientX - gradientCanvas.left;
        let y = event.clientY - gradientCanvas.top;

        if (x > gradientCanvas.width) {
          x = gradientCanvas.width - 1;
        }

        if (x < 0) {
          x = 0;
        }

        if (y > gradientCanvas.height) {
          y = gradientCanvas.height;
        }

        if (y < 0) {
          y = 0;
        }
        /*
         * Caching the position x & y in the component so that we can use it when moving the rainbow slider
         * instead of calculating the position of x & y each time.
         */


        this._cachePosition = {
          x,
          y
        };
        return {
          x,
          y
        };
      }

      gradientCursorPositionFromKeydown(event) {
        event.preventDefault();
        const canvas = this._canvas;
        const gradientCanvas = canvas.getBoundingClientRect();
        const keyCode = event.keyCode;
        let x, y;

        if (!this._cachePosition) {
          this._cachePosition = this.rgbToPosition(this.state.rgb);
        }

        const positionMap = {};
        positionMap[keyCodes.left] = {
          x: -1,
          y: 0
        };
        positionMap[keyCodes.up] = {
          x: 0,
          y: -1
        };
        positionMap[keyCodes.right] = {
          x: +1,
          y: 0
        };
        positionMap[keyCodes.down] = {
          x: 0,
          y: +1
        };
        const transform = positionMap[keyCode] ? positionMap[keyCode] : {
          x: 0,
          y: 0
        };
        x = this._cachePosition.x + transform.x;
        y = this._cachePosition.y + transform.y;

        if (x > gradientCanvas.width) {
          x = gradientCanvas.width - 1;
        }

        if (x < 0) {
          x = 0;
        }

        if (y > gradientCanvas.height) {
          y = gradientCanvas.height;
        }

        if (y < 0) {
          y = 0;
        }
        /*
         * Caching the position x & y in the component so that we can use it when moving the rainbow slider
         * instead of calculating the position of x & y each time.
         */


        this._cachePosition = {
          x,
          y
        };
        return {
          x,
          y
        };
      }

      setRGBValues(x, y) {
        const ctx = this._canvasCtx;
        const imageData = ctx.getImageData(x, y, 1, 1).data;
        const rgb = {
          red: imageData[0],
          green: imageData[1],
          blue: imageData[2]
        };
        const color = `#${rgbToHex(rgb)}`;
        this.state.rgb = rgb;
        this.updateSelectedColor(color);
        this.handleUpdateAnchor();
      }

      setCanvasColor(hue) {
        const ctx = this._canvasCtx; // don't map the gradient onto extreme left and right to make extremes have their max values

        const white = ctx.createLinearGradient(1, 0, this.canvasRect.x - 1, 0);
        white.addColorStop(0, 'rgb(255,255,255)');
        white.addColorStop(1, 'hsl(' + hue + ', 100%, 50%)');
        ctx.fillStyle = white;
        ctx.fillRect(0, 0, this.canvasRect.x, this.canvasRect.y); // starting y is the first line to avoid blending the black into the hue, thus
        // making extreme values unselectable

        const black = ctx.createLinearGradient(0, 1, 0, this.canvasRect.y);
        black.addColorStop(0, 'rgba(0,0,0,0)');
        black.addColorStop(1, 'rgb(0,0,0)');
        ctx.fillStyle = black;
        ctx.fillRect(0, 0, this.canvasRect.x, this.canvasRect.y);
      }

      setCanvasCursor(x, y) {
        const position = {
          x,
          y
        };
        const anchor = this.anchorElement;
        const offset = anchor.offsetWidth / 2;
        x = position.x - offset + 5;
        y = position.y - offset - 5;
        const xPercent = x / this._canvas.width * 100;
        const yPercent = y / this._canvas.height * 100;
        anchor.style.left = `${xPercent}%`;
        anchor.style.top = `${yPercent}%`;
      }

      canvasContext() {
        this._canvas = this.template.querySelector('canvas');
        this._canvasCtx = this._canvas.getContext('2d');
        this._cursorActive = false;
      }

      handleKeydown(event) {
        this.getColorFromGradient(event);
      }

      rgbToPosition(rgb) {
        return rgbToPosition(rgb, this.canvasRect);
      }

    }

    lwc.registerDecorators(LightningColorPickerCustom, {
      publicProps: {
        currentColor: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        state: 1
      }
    });

    var _lightningColorPickerCustom = lwc.registerComponent(LightningColorPickerCustom, {
      tmpl: _tmpl$6
    });

    function tmpl$6($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        gid: api_scoped_id,
        h: api_element,
        d: api_dynamic,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1,
        _m2,
        _m3
      } = $ctx;
      return [api_element("section", {
        classMap: {
          "slds-popover": true,
          "slds-color-picker__selector": true,
          "slds-show": true,
          "slds-is-absolute": true
        },
        attrs: {
          "role": "dialog",
          "aria-label": "Choose a color",
          "aria-describedby": `${api_scoped_id("dialog-body-id")}`
        },
        key: 2,
        on: {
          "updateselectedcolor": _m2 || ($ctx._m2 = api_bind($cmp.handleUpdateSelectedColor)),
          "keydown": _m3 || ($ctx._m3 = api_bind($cmp.handleKeydown))
        }
      }, [api_element("div", {
        classMap: {
          "slds-popover__body": true
        },
        attrs: {
          "id": api_scoped_id("dialog-body-id")
        },
        key: 3
      }, [api_custom_element("lightning-color-picker-custom", _lightningColorPickerCustom, {
        props: {
          "currentColor": $cmp.currentColor
        },
        key: 4
      }, [])]), api_element("footer", {
        classMap: {
          "slds-popover__footer": true
        },
        key: 5
      }, [api_element("div", {
        classMap: {
          "slds-color-picker__selector-footer": true
        },
        key: 6
      }, [api_element("button", {
        classMap: {
          "slds-button": true,
          "slds-button_neutral": true
        },
        attrs: {
          "name": "cancel"
        },
        key: 7,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleCancelClick))
        }
      }, [api_dynamic($cmp.i18n.cancelButton)]), api_element("button", {
        classMap: {
          "slds-button": true,
          "slds-button_brand": true
        },
        attrs: {
          "name": "done"
        },
        key: 8,
        on: {
          "click": _m1 || ($ctx._m1 = api_bind($cmp.handleDoneClick))
        }
      }, [api_dynamic($cmp.i18n.doneButton)])])])])];
    }

    var _tmpl$7 = lwc.registerTemplate(tmpl$6);
    tmpl$6.stylesheets = [];
    tmpl$6.stylesheetTokens = {
      hostAttribute: "lightning-colorPickerPanel_colorPickerPanel-host",
      shadowAttribute: "lightning-colorPickerPanel_colorPickerPanel"
    };

    var labelCancelButton = 'Cancel';

    var labelCustomTab = 'Custom';

    var labelDefaultTab = 'Default';

    var labelDoneButton = 'Done';

    const i18n$2 = {
      cancelButton: labelCancelButton,
      customTab: labelCustomTab,
      defaultTab: labelDefaultTab,
      doneButton: labelDoneButton
    };
    const DEFAULT_COLOR = '#000000';

    class LightningColorPickerPanel extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.currentColor = void 0;
        this.state = {
          isCustomTabActive: false,
          selectedColor: null
        };
      }

      connectedCallback() {
        this.state.selectedColor = this.currentColor || DEFAULT_COLOR;
      }

      get i18n() {
        return i18n$2;
      }

      get computedClassDefault() {
        return classSet({
          'slds-tabs_default__item': true,
          'slds-is-active': !this.state.isCustomTabActive
        }).toString();
      }

      get computedClassCustom() {
        return classSet({
          'slds-tabs_default__item': true,
          'slds-is-active': this.state.isCustomTabActive
        }).toString();
      }

      get ariaSelectedDefault() {
        return !this.state.isCustomTabActive.toString();
      }

      get ariaSelectedCustom() {
        return this.state.isCustomTabActive.toString();
      }

      handleTabChange(event) {
        event.preventDefault();
        const tabElement = event.currentTarget;

        if (tabElement.classList.contains('slds-is-active')) {
          return;
        }

        this.state.isCustomTabActive = tabElement.title !== i18n$2.defaultTab;
      }

      handleUpdateSelectedColor(event) {
        this.state.selectedColor = event.detail.color;
      }

      dispatchUpdateColorEventWithColor(color) {
        this.dispatchEvent( // eslint-disable-next-line lightning-global/no-custom-event-bubbling
        new CustomEvent('updatecolor', {
          composed: true,
          bubbles: true,
          detail: {
            color
          }
        }));
      }

      handleDoneClick() {
        this.dispatchUpdateColorEventWithColor(this.state.selectedColor);
      }

      handleCancelClick() {
        this.dispatchUpdateColorEventWithColor(this.currentColor);
      }

      handleKeydown(event) {
        if (event.keyCode === keyCodes.escape) {
          event.preventDefault();
          this.dispatchUpdateColorEventWithColor(this.currentColor);
        } else if (event.shiftKey && event.keyCode === keyCodes.tab && event.srcElement.dataset.id === 'color-anchor') {
          event.preventDefault();
          this.template.querySelector('button[name="done"]').focus();
        } else if (!event.shiftKey && event.keyCode === keyCodes.tab && event.srcElement.name === 'done') {
          event.preventDefault();
          this.template.querySelector('lightning-color-picker-custom').focus();
        }
      }

    }

    lwc.registerDecorators(LightningColorPickerPanel, {
      publicProps: {
        currentColor: {
          config: 0
        }
      },
      track: {
        state: 1
      }
    });

    var _lightningColorPickerPanel = lwc.registerComponent(LightningColorPickerPanel, {
      tmpl: _tmpl$7
    });

    function tmpl$7($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        h: api_element,
        c: api_custom_element,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [api_element("button", {
        classMap: {
          "slds-button": true,
          "slds-color-picker__summary-button": true,
          "slds-button_icon": true,
          "slds-button_icon-more": true
        },
        props: {
          "disabled": $cmp.disabled
        },
        key: 2,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleColorPickerToggleClick))
        }
      }, [api_element("span", {
        classMap: {
          "slds-swatch": true
        },
        style: $cmp.colorInputStyle,
        attrs: {
          "data-id": "thumbnail"
        },
        key: 3
      }, [api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 4
      }, [api_dynamic($cmp.i18n.a11yTriggerText)])]), api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": "utility:down",
          "svgClass": "slds-button__icon slds-button__icon_small",
          "variant": "bare"
        },
        key: 5
      }, []), api_element("span", {
        classMap: {
          "slds-assistive-text": true,
          "a11y-color-value": true
        },
        key: 6
      }, [api_dynamic($cmp.value)])]), $cmp._isColorPickerPanelOpen ? api_custom_element("lightning-color-picker-panel", _lightningColorPickerPanel, {
        classMap: {
          "color-picker-panel": true
        },
        props: {
          "currentColor": $cmp.value
        },
        key: 8,
        on: {
          "updatecolor": _m1 || ($ctx._m1 = api_bind($cmp.handleUpdateColorEvent))
        }
      }, []) : null];
    }

    var _tmpl$8 = lwc.registerTemplate(tmpl$7);
    tmpl$7.stylesheets = [];
    tmpl$7.stylesheetTokens = {
      hostAttribute: "lightning-primitiveColorpickerButton_primitiveColorpickerButton-host",
      shadowAttribute: "lightning-primitiveColorpickerButton_primitiveColorpickerButton"
    };

    var labelA11yTriggerText = 'Choose a color. Current color: ';

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

    const i18n$3 = {
      a11yTriggerText: labelA11yTriggerText
    };

    class PrimitiveColorpickerButton extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this._isColorPickerPanelOpen = false;
        this._value = '';
        this._disabled = false;
      }

      get value() {
        return this._value;
      }

      set value(value) {
        this._value = value;
      }
      /**
       * If present, the input field is disabled and users cannot interact with it.
       * @type {boolean}
       * @default false
       */


      get disabled() {
        return this._disabled;
      }

      set disabled(value) {
        this._disabled = normalizeBoolean(value);
      }

      focus() {
        const button = this.template.querySelector('button');
        return button && button.focus();
      }

      blur() {
        const button = this.template.querySelector('button');
        return button && button.blur();
      }

      get colorInputStyle() {
        return `background: ${this.value || '#5679C0'};`;
      }

      handleColorPickerToggleClick(event) {
        event.preventDefault();
        this._isColorPickerPanelOpen = !this._isColorPickerPanelOpen;

        if (this._isColorPickerPanelOpen) {
          this.startColorPickerPositioning();
        } else {
          this.stopColorPickerPositioning();
        }
      }

      startColorPickerPositioning() {
        if (!this._autoPosition) {
          this._autoPosition = new AutoPosition(this);
        }

        this._autoPosition.start({
          target: () => this.template.querySelector('button.slds-color-picker__summary-button'),
          element: () => this.template.querySelector('lightning-color-picker-panel').shadowRoot.querySelector('section'),
          align: {
            horizontal: Direction.Left,
            vertical: Direction.Top
          },
          targetAlign: {
            horizontal: Direction.Left,
            vertical: Direction.Bottom
          },
          autoFlip: true
        });
      }

      stopColorPickerPositioning() {
        if (this._autoPosition) {
          this._autoPosition.stop();
        }
      }

      handleUpdateColorEvent(event) {
        event.stopPropagation();
        const detail = event.detail;
        this._isColorPickerPanelOpen = false;
        this.stopColorPickerPositioning();
        this.dispatchEvent(new CustomEvent('change', {
          detail
        }));
      }

      get i18n() {
        return i18n$3;
      }

    }

    PrimitiveColorpickerButton.delegatesFocus = true;

    lwc.registerDecorators(PrimitiveColorpickerButton, {
      publicProps: {
        value: {
          config: 3
        },
        disabled: {
          config: 3
        }
      },
      publicMethods: ["focus", "blur"],
      track: {
        _isColorPickerPanelOpen: 1,
        _value: 1,
        _disabled: 1
      }
    });

    var _lightningPrimitiveColorpickerButton = lwc.registerComponent(PrimitiveColorpickerButton, {
      tmpl: _tmpl$8
    });

    function tmpl$8($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$9 = lwc.registerTemplate(tmpl$8);
    tmpl$8.stylesheets = [];
    tmpl$8.stylesheetTokens = {
      hostAttribute: "lightning-buttonIcon_buttonIcon-host",
      shadowAttribute: "lightning-buttonIcon_buttonIcon"
    };

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

    function tmpl$9($api, $cmp, $slotset, $ctx) {
      return [];
    }

    var _tmpl$a = lwc.registerTemplate(tmpl$9);
    tmpl$9.stylesheets = [];
    tmpl$9.stylesheetTokens = {
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
      tmpl: _tmpl$a
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
        return _tmpl$9;
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
      tmpl: _tmpl$9
    });

    function tmpl$a($api, $cmp, $slotset, $ctx) {
      const {
        b: api_bind,
        c: api_custom_element,
        h: api_element,
        d: api_dynamic,
        gid: api_scoped_id,
        k: api_key,
        i: api_iterator,
        ti: api_tab_index
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
        _m8
      } = $ctx;
      return [api_element("div", {
        classMap: {
          "slds-datepicker": true,
          "slds-dropdown": true,
          "slds-dropdown_left": true
        },
        attrs: {
          "aria-hidden": "false",
          "aria-label": $cmp.computedAriaLabel,
          "role": "dialog"
        },
        key: 2
      }, [api_element("div", {
        classMap: {
          "slds-datepicker__filter": true,
          "slds-grid": true
        },
        key: 3
      }, [api_element("div", {
        classMap: {
          "slds-datepicker__filter_month": true,
          "slds-grid": true,
          "slds-grid_align-spread": true,
          "slds-grow": true
        },
        key: 4
      }, [api_element("div", {
        classMap: {
          "slds-align-middle": true
        },
        key: 5
      }, [api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        props: {
          "iconName": "utility:left",
          "variant": "container",
          "alternativeText": $cmp.i18n.previousMonth
        },
        key: 6,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.goToPreviousMonth)),
          "keydown": _m1 || ($ctx._m1 = api_bind($cmp.handlePrevNavKeyDown))
        }
      }, [])]), api_element("h2", {
        classMap: {
          "slds-align-middle": true
        },
        attrs: {
          "aria-atomic": "true",
          "aria-live": "assertive",
          "id": api_scoped_id("month-title")
        },
        key: 7
      }, [api_dynamic($cmp.computedMonthTitle)]), api_element("div", {
        classMap: {
          "slds-align-middle": true
        },
        key: 8
      }, [api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        props: {
          "iconName": "utility:right",
          "variant": "container",
          "alternativeText": $cmp.i18n.nextMonth
        },
        key: 9,
        on: {
          "click": _m2 || ($ctx._m2 = api_bind($cmp.goToNextMonth))
        }
      }, [])])]), api_element("div", {
        classMap: {
          "slds-shrink-none": true
        },
        key: 10
      }, [api_element("label", {
        classMap: {
          "slds-assistive-text": true
        },
        attrs: {
          "for": `${api_scoped_id("select-element")}`
        },
        key: 11
      }, [api_dynamic($cmp.i18n.yearSelector)]), api_element("div", {
        classMap: {
          "slds-select_container": true
        },
        key: 12
      }, [api_element("select", {
        classMap: {
          "slds-select": true
        },
        attrs: {
          "id": api_scoped_id("select-element")
        },
        key: 13,
        on: {
          "change": _m3 || ($ctx._m3 = api_bind($cmp.handleYearChange)),
          "click": _m4 || ($ctx._m4 = api_bind($cmp.handleYearSelectClick))
        }
      }, api_iterator($cmp.computedYearList, function (year) {
        return api_element("option", {
          attrs: {
            "value": year
          },
          key: api_key(15, year)
        }, [api_dynamic(year)]);
      }))])])]), api_element("table", {
        classMap: {
          "slds-datepicker__month": true
        },
        attrs: {
          "aria-labelledby": `${api_scoped_id("month-title")}`,
          "role": "grid"
        },
        key: 16
      }, [api_element("thead", {
        key: 17
      }, [api_element("tr", {
        attrs: {
          "id": api_scoped_id("weekdays-element")
        },
        key: 18
      }, api_iterator($cmp.computedWeekdayLabels, function (weekday) {
        return api_element("th", {
          attrs: {
            "id": api_scoped_id(weekday.fullName),
            "scope": "col"
          },
          key: api_key(20, weekday.fullName)
        }, [api_element("abbr", {
          attrs: {
            "title": weekday.fullName
          },
          key: 21
        }, [api_dynamic(weekday.shortName)])]);
      }))]), api_element("tbody", {
        key: 22,
        on: {
          "keydown": _m6 || ($ctx._m6 = api_bind($cmp.handleCalendarKeyDown))
        }
      }, api_iterator($cmp.computedMonth, function (week, index) {
        return api_element("tr", {
          key: api_key(24, week.id)
        }, api_iterator(week.days, function (day) {
          return api_element("td", {
            className: day.className,
            attrs: {
              "role": "gridcell",
              "aria-selected": day.isSelected,
              "aria-disabled": day.isDisabled,
              "aria-current": day.ariaCurrent,
              "tabindex": api_tab_index(day.tabIndex),
              "data-value": day.dateValue
            },
            key: api_key(26, day.dateValue)
          }, [api_element("span", {
            classMap: {
              "slds-day": true
            },
            key: 27,
            on: {
              "click": _m5 || ($ctx._m5 = api_bind($cmp.handleDateClick))
            }
          }, [api_dynamic(day.date)])]);
        }));
      }))]), api_element("button", {
        classMap: {
          "slds-button": true,
          "slds-align_absolute-center": true,
          "slds-text-link": true
        },
        attrs: {
          "name": "today",
          "type": "button"
        },
        key: 28,
        on: {
          "click": _m7 || ($ctx._m7 = api_bind($cmp.handleTodayClick)),
          "keydown": _m8 || ($ctx._m8 = api_bind($cmp.handleTodayKeyDown))
        }
      }, [api_dynamic($cmp.i18n.today)])])];
    }

    var _tmpl$b = lwc.registerTemplate(tmpl$a);
    tmpl$a.stylesheets = [];
    tmpl$a.stylesheetTokens = {
      hostAttribute: "lightning-calendar_calendar-host",
      shadowAttribute: "lightning-calendar_calendar"
    };

    var labelAriaLabelMonth = 'Date picker: ';

    var labelNextMonth = 'Next Month';

    var labelPreviousMonth = 'Previous Month';

    var labelToday = 'Today';

    var labelYearSelector = 'Pick a Year';

    function handleKeyDownOnCalendar(event, date, calendarInterface) {
      const tdElement = event.target;

      switch (event.keyCode) {
        case keyCodes.up:
          preventDefaultAndStopPropagation(event);
          date.setDate(date.getDate() - 7);
          calendarInterface.focusDate(date);
          break;

        case keyCodes.down:
          preventDefaultAndStopPropagation(event);
          date.setDate(date.getDate() + 7);
          calendarInterface.focusDate(date);
          break;

        case keyCodes.right:
          preventDefaultAndStopPropagation(event);
          date.setDate(date.getDate() + 1);
          calendarInterface.focusDate(date);
          break;

        case keyCodes.left:
          preventDefaultAndStopPropagation(event);
          date.setDate(date.getDate() - 1);
          calendarInterface.focusDate(date);
          break;

        case keyCodes.enter:
        case keyCodes.space:
          preventDefaultAndStopPropagation(event);
          calendarInterface.selectDate(tdElement);
          break;

        case keyCodes.pageup:
          preventDefaultAndStopPropagation(event);

          if (event.altKey) {
            date.setFullYear(date.getFullYear() - 1);
          } else {
            date.setMonth(date.getMonth() - 1);
          }

          calendarInterface.focusDate(date);
          break;

        case keyCodes.pagedown:
          preventDefaultAndStopPropagation(event);

          if (event.altKey) {
            date.setFullYear(date.getFullYear() + 1);
          } else {
            date.setMonth(date.getMonth() + 1);
          }

          calendarInterface.focusDate(date);
          break;

        case keyCodes.home:
          // eslint-disable-line no-case-declarations
          preventDefaultAndStopPropagation(event);
          const startOfWeek = calendarInterface.getStartOfWeek(date);
          calendarInterface.focusDate(startOfWeek);
          break;

        case keyCodes.end:
          // eslint-disable-line no-case-declarations
          preventDefaultAndStopPropagation(event);
          const endOfWeek = calendarInterface.getStartOfWeek(date);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          calendarInterface.focusDate(endOfWeek);
          break;

        default:
      }
    }
    function handleKeyDownOnToday(event, calendarInterface) {
      switch (event.keyCode) {
        case keyCodes.tab:
          if (!event.shiftKey) {
            preventDefaultAndStopPropagation(event);
            calendarInterface.focusFirstFocusableElement();
          }

          break;

        default:
      }
    }
    function handleKeyDownOnPreviousMonthNav(event, calendarInterface) {
      switch (event.keyCode) {
        case keyCodes.tab:
          if (event.shiftKey) {
            preventDefaultAndStopPropagation(event);
            calendarInterface.focusLastFocusableElement();
          }

          break;

        default:
      }
    }

    function preventDefaultAndStopPropagation(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // This is a library built from Globalization's repo
    /**
     * Define address format patterns.
     */

    var AddressFormatPattern = Object.freeze({
      /**
       *
       * N: Name (The formatting of names for this field is outside of the scope of the address elements.)
       * O: Organization
       * A: Address Lines (2 or 3 lines address)
       * D: District (Sub-locality): smaller than a city, and could be a neighborhood, suburb or dependent locality.
       * C: City (Locality)
       * S: State (Administrative Area)
       * K: Country
       * Z: ZIP Code / Postal Code
       * X: Sorting code, for example, CEDEX as used in France
       * n: newline
       */
      A: Symbol('Address Lines'),
      C: Symbol('City'),
      S: Symbol('State'),
      K: Symbol('Country'),
      Z: Symbol('Zip Code'),
      n: Symbol('New Line'),
      fromPlaceHolder: function fromPlaceHolder(placeHolder) {
        switch (placeHolder) {
          case 'A':
            return AddressFormatPattern.A;

          case 'C':
            return AddressFormatPattern.C;

          case 'S':
            return AddressFormatPattern.S;

          case 'K':
            return AddressFormatPattern.K;

          case 'Z':
            return AddressFormatPattern.Z;

          case 'n':
            return AddressFormatPattern.n;
        }

        return null;
      },
      getPlaceHolder: function getPlaceHolder(pattern) {
        switch (pattern) {
          case AddressFormatPattern.A:
            return 'A';

          case AddressFormatPattern.C:
            return 'C';

          case AddressFormatPattern.S:
            return 'S';

          case AddressFormatPattern.K:
            return 'K';

          case AddressFormatPattern.Z:
            return 'Z';

          case AddressFormatPattern.n:
            return 'n';
        }

        return null;
      },
      getData: function getData(pattern, data) {
        if (data) {
          switch (pattern) {
            case AddressFormatPattern.A:
              return data.address;

            case AddressFormatPattern.C:
              return data.city;

            case AddressFormatPattern.S:
              return data.state;

            case AddressFormatPattern.K:
              return data.country;

            case AddressFormatPattern.Z:
              return data.zipCode;

            case AddressFormatPattern.n:
              return data.newLine;
          }
        }

        return null;
      }
    });

    var classCallCheck = function (instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError('Cannot call a class as a function');
      }
    };

    var createClass = function () {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ('value' in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
      };
    }();
    /**
     * Address token types enum
     *
     * @private
     */


    var AddressTokenTypes = Object.freeze({
      DATA: Symbol('data'),
      STRING: Symbol('string'),
      NEWLINE: Symbol('newline'),
      GROUP: Symbol('group')
    });
    /**
     * AddressToken class
     *
     * @private
     */

    var AddressToken = function () {
      /**
       *
       * @param {AddressTokenTypes} type
       * @param {string} string
       * @param {*} pattern
       */
      function AddressToken(type, string, pattern) {
        classCallCheck(this, AddressToken);
        this.type = type;
        this.string = string;
        this.pattern = pattern;
      }
      /**
       * Construct a string type token
       *
       * @param {string} string String
       * @return {AddressToken} Address Token
       */


      createClass(AddressToken, null, [{
        key: 'string',
        value: function string(_string) {
          return new AddressToken(AddressTokenTypes.STRING, _string);
        }
        /**
         * Construct a data type token
         *
         * @param {pattern} pattern Address Format Pattern
         * @return {AddressToken} Address Token
         */

      }, {
        key: 'data',
        value: function data(pattern) {
          return new AddressToken(AddressTokenTypes.DATA, undefined, pattern);
        }
        /**
         * Construct a new line type token
         *
         * @return {AddressToken} Address Token
         */

      }, {
        key: 'newLine',
        value: function newLine() {
          return new AddressToken(AddressTokenTypes.NEWLINE);
        }
      }]);
      return AddressToken;
    }();

    // This is a library built from Globalization's repo

    /**
     S: Salutation
     F: First Name(givenName)
     M: Middle Name
     L: Last Name(familyName)
     X: Suffix
     I: Informal Name
     */

    var fieldConstants = {
      SALUTATION: Symbol('Salutation'),
      FIRST: Symbol('First Name'),
      MIDDLE: Symbol('Middle Name'),
      LAST: Symbol('Last Name'),
      SUFFIX: Symbol('Suffix'),
      INFORMAL: Symbol('Informal Name')
    };

    var _createClass = function () {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ('value' in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
      };
    }();

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError('Cannot call a class as a function');
      }
    }

    var Format = function Format(parts) {
      _classCallCheck(this, Format);

      this.parts = Object.freeze(parts);
      Object.freeze(this);
    };
    /**
     * Represents a field within the format
     */


    var FieldFormatPart = function FieldFormatPart(field) {
      _classCallCheck(this, FieldFormatPart);

      this.field = field;
      this.type = 'field';
      Object.freeze(this);
    };
    /**
     * Represents text to be output directly
     */


    var TextFormatPart = function TextFormatPart(text) {
      _classCallCheck(this, TextFormatPart);

      this.type = 'text';
      this.text = text;
      Object.freeze(this);
    };

    var fieldFormatParts = Object.freeze({
      SALUTATION: new FieldFormatPart(fieldConstants.SALUTATION),
      FIRST: new FieldFormatPart(fieldConstants.FIRST),
      MIDDLE: new FieldFormatPart(fieldConstants.MIDDLE),
      LAST: new FieldFormatPart(fieldConstants.LAST),
      SUFFIX: new FieldFormatPart(fieldConstants.SUFFIX),
      INFORMAL: new FieldFormatPart(fieldConstants.INFORMAL)
    });

    var FormatParser = function () {
      function FormatParser() {
        _classCallCheck(this, FormatParser);
      }

      _createClass(FormatParser, [{
        key: 'parse',

        /**
         * Parses the format
         * @param {string} fmt the format to be parsed
         * @returns {Format}
         */
        value: function parse(fmt) {
          var nodes = [];
          var textBuffer = ''; // parse the format string

          for (var i = 0; i < fmt.length; i = i + 1) {
            if (fmt[i] === '%') {
              i = i + 1; // move to the next character after %
              // end the last text buffer

              if (textBuffer.length > 0) {
                nodes.push(Object.freeze(new TextFormatPart(textBuffer)));
                textBuffer = '';
              }

              if (i >= fmt.length) {
                throw new Error('Unexpected end of format. Symbol at ' + (i - 1) + ' should be followed by a valid field code');
              }

              var code = fmt[i];

              switch (code) {
                case 'S':
                  nodes.push(fieldFormatParts.SALUTATION);
                  break;

                case 'F':
                  nodes.push(fieldFormatParts.FIRST);
                  break;

                case 'M':
                  nodes.push(fieldFormatParts.MIDDLE);
                  break;

                case 'L':
                  nodes.push(fieldFormatParts.LAST);
                  break;

                case 'X':
                  nodes.push(fieldFormatParts.SUFFIX);
                  break;

                case 'I':
                  nodes.push(fieldFormatParts.INFORMAL);
                  break;

                default:
                  // TODO log the bad symbol and continue
                  break;
              }
            } else {
              // if it wasn't a symbol, then just output the value directly
              textBuffer += fmt[i];
            }
          }

          if (textBuffer.length > 0) {
            nodes.push(new TextFormatPart(textBuffer));
          }

          return new Format(nodes);
        }
      }]);

      return FormatParser;
    }();

    var formatParser = new FormatParser();

    // This returns the locale tag similar to the lwc @salesforce/i18n/locale and should be replaced once we switch to lwc GVPs
    // The aura locale GVPs are confusing, see the following doc for more details and their lwc equivalent:
    // See https://salesforce.quip.com/M9sPA9xFnRgv

    function getLocaleTag() {
      const localeLanguage = getLocale().userLocaleLang; // e.g. 'en'

      const localeCountry = getLocale().userLocaleCountry; // e.g. 'CA'

      if (!localeLanguage) {
        return getLocale().langLocale.replace(/_/g, '-'); // e.g. 'en_US' -> 'en-US'
      } // should return a valid BCP47 tag


      return localeLanguage + (localeCountry ? '-' + localeCountry : '');
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat#Parameters

    const POSSIBLE_OPTS = {
      style: true,
      currency: true,
      currencyDisplay: true,
      useGrouping: true,
      minimumIntegerDigits: true,
      minimumFractionDigits: true,
      maximumFractionDigits: true,
      minimumSignificantDigits: true,
      maximumSignificantDigits: true
    };
    const STYLE = {
      DECIMAL: 'decimal',
      CURRENCY: 'currency',
      PERCENT: 'percent'
    };
    const CURRENCY_DISPLAY = {
      CODE: 'code',
      // USD
      SYMBOL: 'symbol',
      // $
      NAME: 'name' // US Dollars

    };
    const SAFE_NUM_LENGTH = 15;
    const numberFormatInstancesCache = {};

    function getStringOfChar(char, amount) {
      return new Array(amount + 1).join(char);
    }

    function getGroupingCount(skeleton) {
      const match = skeleton.match(/,[#0]*\./);
      return match ? match[0].length - 2 : 0;
    }

    function getOptionsUniqueKey(options) {
      return Object.keys(options).sort().reduce((prev, optionName) => {
        if (POSSIBLE_OPTS[optionName]) {
          return prev + optionName + options[optionName] + '';
        }

        return prev;
      }, '');
    }

    function toNumber(value, defaultValue) {
      const number = parseInt(value, 10);

      if (isNaN(number)) {
        return defaultValue;
      }

      return number;
    }

    function getFractionPart(options) {
      const minimumDigits = toNumber(options.minimumFractionDigits, 0);
      const maximumDigits = Math.max(toNumber(options.maximumFractionDigits, 0), minimumDigits);
      return '.' + new Array(minimumDigits + 1).join('0') + new Array(maximumDigits - minimumDigits + 1).join('#');
    }

    function updateFractionPart(skeleton, options) {
      const fractionPart = getFractionPart(options);
      return fractionPart ? skeleton.replace(/\.(0|#)*/, fractionPart) : skeleton;
    }

    function updateCurrencySymbol(skeleton, currencyCode, options) {
      const symbol = String.fromCharCode(164);

      if (options.currencyDisplay === CURRENCY_DISPLAY.NAME) {
        // append the currency code at the end.
        return skeleton.replace(symbol, '') + currencyCode;
      }

      return skeleton.replace(symbol, currencyCode);
    }

    function updateIntegerPart(skeleton, options) {
      const minimumIntegerDigits = options.minimumIntegerDigits;
      const groupingCount = getGroupingCount(skeleton);

      if (!minimumIntegerDigits) {
        return skeleton;
      }

      if (minimumIntegerDigits <= groupingCount) {
        return skeleton.replace(/,[#0]*\./, ',' + getStringOfChar('#', groupingCount - minimumIntegerDigits) + getStringOfChar('0', minimumIntegerDigits) + '.');
      }

      return skeleton.replace(/[#0]*\./, getStringOfChar('0', minimumIntegerDigits - groupingCount) + ',' + getStringOfChar('0', groupingCount) + '.');
    }

    function getBestMatchCurrencySymbol(code, currencyDisplay) {
      if (!('Intl' in window)) {
        return code; // fail gracefully.
      }

      const opts = {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 0
      };

      if (currencyDisplay) {
        opts.currencyDisplay = currencyDisplay;
      }

      const nf = getFromCache(opts);
      return nf.format(2).replace(/2/g, '');
    }

    function getCurrency(options) {
      const currencyDisplay = options.currencyDisplay || CURRENCY_DISPLAY.SYMBOL;

      if (currencyDisplay === CURRENCY_DISPLAY.SYMBOL || currencyDisplay === CURRENCY_DISPLAY.NAME) {
        return getBestMatchCurrencySymbol(options.currency, currencyDisplay);
      }

      return options.currency;
    }

    function getFromCache(options) {
      const optionsUniqueKey = getOptionsUniqueKey(options);
      let numberFormatInstance = numberFormatInstancesCache[optionsUniqueKey];

      if (numberFormatInstance) {
        return numberFormatInstance;
      }

      numberFormatInstance = new Intl.NumberFormat(getLocaleTag(), options);
      numberFormatInstancesCache[optionsUniqueKey] = numberFormatInstance;
      return numberFormatInstance;
    }

    function exceedsSafeLength(value, maxFractionDigits) {
      const str = value.toString();
      const intPart = str.split('.')[0];
      return intPart.length + toNumber(maxFractionDigits, 0) >= SAFE_NUM_LENGTH;
    }

    function normalizedMinimumFractionDigits(options) {
      const fractionSkeleton = getFallbackFractionSkeleton(options.style);
      const fractionDigits = fractionSkeleton.replace(/[^0]/g, '');
      return fractionDigits.length;
    }

    function normalizedMaximumFractionDigits(options) {
      const fractionSkeleton = getFallbackFractionSkeleton(options.style);
      const fractionDigits = fractionSkeleton.replace(/[^0#]/g, '');
      return Math.max(options.minimumFractionDigits, fractionDigits.length);
    }

    function getFallbackFractionSkeleton(style) {
      const locale = getLocale();
      let styleFormat = 'numberFormat';

      if (style === STYLE.CURRENCY) {
        styleFormat = 'currencyFormat';
      } else if (style === STYLE.PERCENT) {
        styleFormat = 'percentFormat';
      }

      const format = locale[styleFormat].split(';')[0];
      return format.split('.')[1] || '';
    }

    function normalizeOptions(options) {
      const locale = getLocale();
      const normalizedOpts = Object.assign({}, options);
      normalizedOpts.currency = normalizedOpts.currency || locale.currencyCode;

      if (normalizedOpts.minimumFractionDigits === undefined) {
        normalizedOpts.minimumFractionDigits = normalizedMinimumFractionDigits(normalizedOpts);
      }

      if (normalizedOpts.maximumFractionDigits === undefined || normalizedOpts.maximumFractionDigits < normalizedOpts.minimumFractionDigits) {
        normalizedOpts.maximumFractionDigits = normalizedMaximumFractionDigits(normalizedOpts);
      }

      return normalizedOpts;
    }

    function NumberOptions(options) {
      this.locale = getLocale();
      this.options = options || {};
    }

    NumberOptions.prototype.isCurrency = function () {
      return this.options.style === 'currency';
    };

    NumberOptions.prototype.isPercent = function () {
      return this.options.style === 'percent';
    };

    NumberOptions.prototype.isDefaultCurrency = function () {
      return !this.options.currency || this.locale.currencyCode === this.options.currency;
    };

    NumberOptions.prototype.getDefaultSkeleton = function () {
      return this.isCurrency() ? this.locale.currencyFormat : this.isPercent() ? this.locale.percentFormat : this.locale.numberFormat;
    };

    NumberOptions.prototype.getSkeleton = function () {
      const options = this.options;
      const defaultSkeleton = this.getDefaultSkeleton();
      let skeleton = updateFractionPart(defaultSkeleton, options);
      skeleton = updateIntegerPart(skeleton, options);

      if (!this.isDefaultCurrency()) {
        skeleton = updateCurrencySymbol(skeleton, getCurrency(options), options);
      }

      return skeleton;
    };

    // This is a library for all calls to the aura localizationService.
    function isBefore$1(date1, date2, unit) {
      return getLocalizationService().isBefore(date1, date2, unit);
    }
    function isAfter$1(date1, date2, unit) {
      return getLocalizationService().isAfter(date1, date2, unit);
    }
    function formatDateTimeUTC$1(date) {
      return getLocalizationService().formatDateTimeUTC(date);
    }
    function formatDate$1(dateString, format, locale) {
      return getLocalizationService().formatDate(dateString, format, locale);
    }
    function formatDateUTC$1(dateString, format, locale) {
      return getLocalizationService().formatDateUTC(dateString, format, locale);
    }
    function formatTime$1(timeString, format) {
      return getLocalizationService().formatTime(timeString, format);
    }
    function parseDateTimeUTC$1(dateTimeString) {
      return getLocalizationService().parseDateTimeUTC(dateTimeString);
    }
    function parseDateTimeISO8601$1(dateTimeString) {
      return getLocalizationService().parseDateTimeISO8601(dateTimeString);
    }
    function parseDateTime$1(dateTimeString, format, strictMode) {
      return getLocalizationService().parseDateTime(dateTimeString, format, strictMode);
    }
    function syncUTCToWallTime(date, timeZone) {
      let converted = null; // eslint-disable-next-line new-cap

      getLocalizationService().UTCToWallTime(date, timeZone, result => {
        converted = result;
      });
      return converted;
    }
    function syncWallTimeToUTC(date, timeZone) {
      let converted = null; // eslint-disable-next-line new-cap

      getLocalizationService().WallTimeToUTC(date, timeZone, result => {
        converted = result;
      });
      return converted;
    }
    function toOtherCalendar(date) {
      return getLocalizationService().translateToOtherCalendar(date);
    }
    function fromOtherCalendar(date) {
      return getLocalizationService().translateFromOtherCalendar(date);
    } // This belongs to localization service; i.e. getLocalizationService().parseTime()
    // Should be removed after it's been added to the localization service

    function parseTime(timeString, format, strictParsing) {
      if (!timeString) {
        return null;
      }

      if (!format) {
        if (!isValidISOTimeString(timeString)) {
          return null;
        }

        return parseDateTimeISO8601$1(timeString);
      }

      const parseString = timeString.replace(/(\d)([AaPp][Mm])/g, '$1 $2'); // Modifying the time string so that strict parsing doesn't break on minor deviations

      const parseFormat = format.replace(/(\b|[^h])h{2}(?!h)/g, '$1h').replace(/(\b|[^H])H{2}(?!H)/g, '$1H').replace(/(\b|[^m])m{2}(?!m)/g, '$1m').replace(/\s*A/g, ' A').trim();
      const acceptableFormats = [parseFormat]; // We want to be lenient and accept input values with seconds or milliseconds precision.
      // So even though we may display the time as 10:23 AM, we would accept input values like 10:23:30.555 AM.

      acceptableFormats.push(parseFormat.replace('m', 'm:s'), parseFormat.replace('m', 'm:s.S'), parseFormat.replace('m', 'm:s.SS'), parseFormat.replace('m', 'm:s.SSS')); // Start parsing from the most strict format (i.e. time with milliseconds).
      // The strict mode parsing of time strings using parseDateTime seems to be lenient for certain formats

      acceptableFormats.reverse();

      for (let i = 0; i < acceptableFormats.length; i++) {
        const time = parseDateTime$1(parseString, acceptableFormats[i], strictParsing);

        if (time) {
          return time;
        }
      }

      return null;
    } // This is called from the numberFormat library when the value exceeds the safe length.

    function getNumberFormat$1(format) {
      return getLocalizationService().getNumberFormat(format);
    }

    function numberFormatFallback(options) {
      const skeleton = new NumberOptions(options).getSkeleton();
      return {
        format: value => {
          return getNumberFormat$1(skeleton).format(value);
        }
      };
    }

    function numberFormat(options) {
      const normalizedOpts = Object.assign({}, normalizeOptions(options));

      if (!('Intl' in window)) {
        return numberFormatFallback(normalizedOpts);
      }

      return {
        format: value => {
          if (value && exceedsSafeLength(value, normalizedOpts.maximumFractionDigits)) {
            return numberFormatFallback(normalizedOpts).format(value);
          }

          const numberFormatInstance = getFromCache(normalizedOpts);
          return numberFormatInstance.format(value);
        }
      };
    }

    const FORMATTING_OPTS = ['weekday', 'year', 'month', 'day', 'hour', 'minute', 'second', 'era'];
    const FORMAT_MAP = {
      weekday: {
        short: 'EEE, ',
        narrow: 'EEE, ',
        long: 'EEEE, '
      },
      month: {
        short: 'MMM ',
        narrow: 'MMM ',
        numeric: 'MMM ',
        '2-digit': 'MMM ',
        long: 'MMMM '
      },
      day: {
        numeric: 'd, ',
        '2-digit': 'dd, '
      },
      year: {
        numeric: 'yyyy ',
        '2-digit': 'yy '
      },
      hour: {
        numeric12: 'h',
        numeric24: 'H',
        '2-digit12': 'hh',
        '2-digit24': 'HH'
      },
      minute: {
        numeric: 'mm',
        '2-digit': 'mm'
      },
      second: {
        numeric: 'ss',
        '2-digit': 'ss'
      },
      timeZoneName: {
        short: '[GMT]Z',
        long: '[GMT]Z'
      }
    };
    const SEPARATORS = [',', ' ', ':'];

    function getWeekDayPart(format, options) {
      const weekdayOptionValue = options.weekday;

      if (FORMAT_MAP.weekday[weekdayOptionValue] !== undefined) {
        format.push(FORMAT_MAP.weekday[weekdayOptionValue]);
      }
    }

    function getMonthPart(format, options) {
      const monthOptionValue = options.month;

      if (FORMAT_MAP.month[monthOptionValue] !== undefined) {
        format.push(FORMAT_MAP.month[monthOptionValue]);
      }
    }

    function getDayPart(format, options) {
      const dayOptionValue = options.day;

      if (FORMAT_MAP.day[dayOptionValue] !== undefined) {
        format.push(FORMAT_MAP.day[dayOptionValue]);
      }
    }

    function getYearPart(format, options) {
      const yearOptionValue = options.year;

      if (FORMAT_MAP.year[yearOptionValue] !== undefined) {
        format.push(FORMAT_MAP.year[yearOptionValue]);
      }
    }

    function getTZPart(format, options) {
      const timeZoneNameOptionValue = options.timeZoneName;

      if (FORMAT_MAP.timeZoneName[timeZoneNameOptionValue] !== undefined) {
        if (options.timeZone === 'UTC') {
          format.push('[GMT]');
        } else {
          format.push(FORMAT_MAP.timeZoneName[timeZoneNameOptionValue]);
        }
      }
    }

    function getTimePart(format, options) {
      const hourOptionValue = options.hour,
            minuteOptionValue = options.minute,
            secondOptionValue = options.second;
      let hasTime = false;
      let hasHourOnly = false; // hour 12 hr or 24 hr

      if (hourOptionValue === 'numeric' || hourOptionValue === '2-digit') {
        hasTime = true;

        if (options.hour12 === false) {
          if (hourOptionValue === 'numeric') {
            format.push(FORMAT_MAP.hour.numeric24);
          } else {
            format.push(FORMAT_MAP.hour['2-digit24']);
          }
        } else if (hourOptionValue === 'numeric') {
          format.push(FORMAT_MAP.hour.numeric12);
        } else {
          format.push(FORMAT_MAP.hour['2-digit12']);
        }

        if (FORMAT_MAP.minute[minuteOptionValue] !== undefined) {
          format.push(':');
        } else if (FORMAT_MAP.second[secondOptionValue] !== undefined) {
          hasHourOnly = true;
        }
      } // minute


      if (FORMAT_MAP.minute[minuteOptionValue] !== undefined) {
        hasTime = true;
        format.push(FORMAT_MAP.minute[minuteOptionValue]);

        if (FORMAT_MAP.second[secondOptionValue] !== undefined) {
          format.push(':');
        }
      } // second


      if (FORMAT_MAP.second[secondOptionValue] !== undefined && !hasHourOnly) {
        hasTime = true;
        format.push(FORMAT_MAP.second[secondOptionValue]);
      } // AM/PM marker


      if (hasTime) {
        format.push(' a ');
      }

      if (hasHourOnly) {
        format.push('[(sec]: ' + FORMAT_MAP.second[secondOptionValue] + '[)]');
      }
    }

    function DateTimeOptions(options) {
      this.options = options || {};
    }

    DateTimeOptions.prototype.hasFormattingOptions = function () {
      return FORMATTING_OPTS.some(opt => {
        return this.options[opt] !== undefined;
      });
    };

    DateTimeOptions.prototype.getSkeleton = function () {
      const format = [];
      getWeekDayPart(format, this.options);
      getMonthPart(format, this.options);
      getDayPart(format, this.options);
      getYearPart(format, this.options);
      getTimePart(format, this.options);
      getTZPart(format, this.options);
      let formatStr = format.join('');
      SEPARATORS.forEach(element => {
        if (formatStr.lastIndexOf(element) === formatStr.length - 1) {
          formatStr = formatStr.slice(0, -1);
        }
      });
      return formatStr;
    };

    const dateTimeFormatInstancesCache = {};
    const POSSIBLE_OPTS$1 = {
      weekday: true,
      era: true,
      year: true,
      month: true,
      day: true,
      hour: true,
      minute: true,
      second: true,
      timeZone: true,
      timeZoneName: true,
      hour12: true
    };

    function getOptionsUniqueKey$1(options) {
      return Object.keys(options).sort().reduce((prev, optionName) => {
        if (POSSIBLE_OPTS$1[optionName]) {
          return prev + optionName + options[optionName] + '';
        }

        return prev;
      }, '');
    }

    function getFromCache$1(options) {
      const optionsUniqueKey = getOptionsUniqueKey$1(options);
      let formatInstance = dateTimeFormatInstancesCache[optionsUniqueKey];

      if (!formatInstance) {
        formatInstance = new Intl.DateTimeFormat(getLocaleTag(), options);
        dateTimeFormatInstancesCache[optionsUniqueKey] = formatInstance;
      }

      return formatInstance;
    }

    function convertAndFormatDate(date, format, timeZone) {
      const translatedDate = toOtherCalendar(date);
      const converted = syncUTCToWallTime(translatedDate, timeZone);
      return formatDateUTC$1(converted, format);
    }

    function isDate$1(value) {
      return Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime());
    }

    function toDate(value) {
      let dateObj = value;

      if (!isDate$1(value) && (typeof value === 'string' || typeof value === 'number')) {
        dateObj = new Date(isFinite(value) ? parseInt(value, 10) : Date.parse(value));
      }

      return dateObj;
    }

    const isTimeZonesSupported = function () {
      try {
        // IE11 only supports the UTC time zone and throws when given anything else
        // eslint-disable-next-line new-cap
        Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles'
        });
      } catch (err) {
        return false;
      }

      return true;
    }();

    function dateTimeFormatFallback(dto) {
      // localization service will default to $Locale.dateFormat when no format is provided
      const format = dto.hasFormattingOptions() ? dto.getSkeleton() : null;
      const {
        timeZone
      } = dto.options;
      return {
        format: value => {
          // if value is an ISO date string (e.g. 2019-10-25), do not convert between timezones and just format the date
          if (isValidISODateTimeString(value) && value.indexOf(TIME_SEPARATOR) < 0) {
            return formatDate$1(value);
          } // FIXME use standard methods from localizationService for parsing and formatting instead


          const dateObj = toDate(value);

          if (isDate$1(dateObj)) {
            if (timeZone === 'UTC') {
              dateObj.setTime(dateObj.getTime() + dateObj.getTimezoneOffset() * 60 * 1000);
            }

            return convertAndFormatDate(dateObj, format, timeZone);
          }

          return '';
        }
      };
    }

    function dateTimeFormat(opts) {
      const options = opts || {};
      const dto = new DateTimeOptions(options);

      if (!('Intl' in window) || !dto.hasFormattingOptions() || !isTimeZonesSupported) {
        return dateTimeFormatFallback(dto);
      }

      return {
        format: value => {
          const dtf = getFromCache$1(options);
          return dtf.format(toDate(value));
        }
      };
    }

    const FALLBACK_LOCALE = 'en-us';
    const symbolsCache = {}; // Copied over from auraLocalizationService: override for locales which are not identified by browsers

    const localeOverrides = {
      no_NO: 'nb',
      // eslint-disable-line camelcase
      tl_PH: 'fil',
      // eslint-disable-line camelcase
      sh_BA: 'hr',
      // eslint-disable-line camelcase
      sh_ME: 'hr',
      // eslint-disable-line camelcase
      sh_CS: 'hr' // eslint-disable-line camelcase

    };
    function getNameOfWeekdays() {
      const locale = getNormalizedLocale();
      const localeCache = symbolsCache[locale];

      if (localeCache && localeCache.weekdays) {
        return localeCache.weekdays;
      }

      const locales = [locale, FALLBACK_LOCALE];
      const fullNameFormatter = new Intl.DateTimeFormat(locales, {
        weekday: 'long',
        timeZone: 'UTC'
      });
      const shortNameFormatter = new Intl.DateTimeFormat(locales, {
        weekday: 'short',
        timeZone: 'UTC'
      });
      const weekdays = [];

      for (let i = 0; i <= 6; i++) {
        // (1970, 0, 4) corresponds to a sunday.
        const date = new Date(Date.UTC(1970, 0, 4 + i));
        weekdays.push({
          fullName: format$1(fullNameFormatter, date),
          shortName: format$1(shortNameFormatter, date)
        });
      }

      if (!symbolsCache[locale]) {
        symbolsCache[locale] = {};
      }

      symbolsCache[locale].weekdays = weekdays;
      return weekdays;
    }
    function getMonthNames() {
      const locale = getNormalizedLocale();
      const localeCache = symbolsCache[locale];

      if (localeCache && localeCache.months) {
        return localeCache.months;
      }

      const locales = [locale, FALLBACK_LOCALE];
      const monthNameFormatter = new Intl.DateTimeFormat(locales, {
        month: 'long'
      });
      const months = [];

      for (let i = 0; i <= 11; i++) {
        const date = new Date(1970, i, 4);
        months.push({
          // we currently only need the fullName
          fullName: format$1(monthNameFormatter, date)
        });
      }

      if (!symbolsCache[locale]) {
        symbolsCache[locale] = {};
      }

      symbolsCache[locale].months = months;
      return months;
    }

    function format$1(dateTimeFormat, date) {
      const formattedDate = dateTimeFormat.format(date);
      return removeIE11Markers(formattedDate);
    }

    function removeIE11Markers(formattedString) {
      // IE11 adds LTR / RTL mark in the formatted date time string
      return formattedString.replace(/[\u200E\u200F]/g, '');
    }

    function getNormalizedLocale() {
      const locale = getLocale().langLocale;

      if (locale) {
        return localeOverrides[locale] || locale.toLowerCase().replace('_', '-');
      }

      return FALLBACK_LOCALE;
    }

    function normalizeISODate(value, format) {
      const dateValue = typeof value === 'string' ? value.trim() : value;

      if (!dateValue) {
        return {
          isoValue: null,
          displayValue: value || ''
        };
      } // if value is an ISO string, only fetch the date part


      const dateOnlyString = typeof dateValue === 'string' && dateValue.split(TIME_SEPARATOR)[0] || dateValue;
      assert$1(isValidISODateTimeString(dateOnlyString), `datetime component: The value attribute accepts a valid ISO8601 formatted string ` + `with timezone offset. but we are getting the ${typeof value} value "${value}" instead.`);
      const parsedDate = parseDateTime$1(dateOnlyString, STANDARD_DATE_FORMAT);

      if (!parsedDate) {
        return {
          isoValue: null,
          displayValue: value || ''
        };
      } // convert from Gregorian to Buddhist Calendar if necessary


      const civilDate = toOtherCalendar(parsedDate);
      return {
        isoValue: dateOnlyString,
        displayValue: formatDate$1(civilDate, format)
      };
    }
    function normalizeISOTime(value, format) {
      // We are not converting the time to the user's timezone. All values are displayed and saved as UTC time values
      const normalizedValue = removeTimeZoneSuffix(value);
      const timeValue = typeof normalizedValue === 'string' ? normalizedValue.trim() : normalizedValue;

      if (!timeValue) {
        return {
          isoValue: null,
          displayValue: value || ''
        };
      }

      assert$1(isValidISOTimeString(timeValue), `datetime component: The value attribute accepts a valid ISO8601 formatted string. ` + `but we are getting the ${typeof value} value "${value}" instead.`);
      const parsedTime = parseTime(timeValue);

      if (!parsedTime) {
        return {
          isoValue: null,
          displayValue: value || ''
        };
      }

      return {
        isoValue: formatTime$1(parsedTime, STANDARD_TIME_FORMAT),
        displayValue: formatTime$1(parsedTime, format)
      };
    }
    function normalizeISODateTime(value, timezone, format) {
      const dateTimeValue = typeof value === 'string' ? value.trim() : value;

      if (!dateTimeValue) {
        return {
          isoValue: null,
          displayValue: value || ''
        };
      }

      assert$1(isValidISODateTimeString(dateTimeValue), `datetime component: The value attribute accepts a valid ISO8601 formatted string ` + `with timezone offset. but we are getting the ${typeof value} value "${value}" instead.`);
      const parsedDate = parseDateTimeISO8601$1(dateTimeValue);

      if (!parsedDate) {
        return {
          isoValue: null,
          displayValue: value || ''
        };
      }

      const convertedDate = syncUTCToWallTime(parsedDate, timezone);
      return {
        // We are passing the ISO value without a timezone designator.
        // the native input type='datetime-local' who calls this does not accept timezone offset
        isoValue: removeTimeZoneSuffix(convertedDate.toISOString()),
        displayValue: formatDateTimeUTC$1(convertedDate)
      };
    }
    function normalizeFormattedDate(value, format) {
      const dateValue = typeof value === 'string' ? value.trim() : value;

      if (!dateValue) {
        return null;
      }

      const parsedDate = parseDateTime$1(dateValue, format || getLocale().dateFormat, true);

      if (!parsedDate) {
        return null;
      }

      const gregorianDate = fromOtherCalendar(parsedDate);
      return formatDate$1(gregorianDate, STANDARD_DATE_FORMAT);
    }
    function normalizeFormattedTime(value, format) {
      const timeValue = typeof value === 'string' ? value.trim() : value;

      if (!timeValue) {
        return null;
      }

      const parsedDate = parseTime(timeValue, format || getLocale().timeFormat, true);

      if (!parsedDate) {
        return null;
      }

      return formatTime$1(parsedDate, STANDARD_TIME_FORMAT);
    } // The value here isn't really formatted, it's always an ISO string in the form isoDate + T + isoTime (without Z).

    function normalizeFormattedDateTime(value, timezone, format) {
      const datetimeValue = typeof value === 'string' ? value.trim() : value;

      if (!datetimeValue) {
        return null;
      } // given that value is an ISO string without Z, the method below is equivalent to parseDateTimeISO8601(value + 'Z')
      // However, parseDateTimeUTC is more concise and doesn't need any manipulation of the input (adding Z).


      const parsedDate = parseDateTimeUTC$1(datetimeValue);

      if (!parsedDate) {
        return null;
      }

      const convertedDate = syncWallTimeToUTC(parsedDate, timezone);
      return convertedDate.toISOString();
    }
    function getToday() {
      const today = getTodayBasedOnTimezone();
      return today.getFullYear() + '-' + pad$1(today.getMonth() + 1) + '-' + pad$1(today.getDate());
    }
    function getCurrentTime(timezone) {
      const today = getTodayBasedOnTimezone(timezone);
      return pad$1(today.getHours()) + ':' + pad$1(today.getMinutes());
    }

    function getTodayBasedOnTimezone(timezone) {
      const today = new Date();
      today.setTime(today.getTime() + today.getTimezoneOffset() * 60 * 1000); // time in UTC
      // localization service will use $Locale.timezone when no timezone provided

      return syncUTCToWallTime(today, timezone);
    }

    function pad$1(n) {
      return n < 10 ? '0' + n : n;
    }

    const i18n$4 = {
      ariaLabelMonth: labelAriaLabelMonth,
      nextMonth: labelNextMonth,
      previousMonth: labelPreviousMonth,
      today: labelToday,
      yearSelector: labelYearSelector
    };
    const WEEKS_PER_MONTH = 6;
    const DAYS_PER_WEEK = 7;
    const calendarCache = {}; // cache of calendar cells for a given year/month

    class LightningCalendar extends lwc.LightningElement {
      get value() {
        return this.selectedDate;
      }

      set value(newValue) {
        // if value is an ISO string, only fetch the time part
        const dateOnlyString = typeof newValue === 'string' ? newValue.split(TIME_SEPARATOR)[0] : newValue;

        if (dateOnlyString !== this.selectedDate) {
          this.selectedDate = dateOnlyString;

          if (!this.connected) {
            return;
          }

          const newDate = this.parseDate(dateOnlyString); // if the date is invalid, render today's date

          if (!newDate) {
            this.selectedDate = null;
            this.renderToday();
          } else {
            this.selectDate(newDate);
          }
        }
      }

      constructor() {
        super();
        this.calendarYear = null;
        this.calendarMonth = null;
        this.min = void 0;
        this.max = void 0;
        this.initialRender = true;
        this.uniqueId = generateUniqueId();
      }

      renderedCallback() {
        if (this.initialRender) {
          this.todayDate = getToday(); // The connected logic here is needed because at the point when the @api setters are called, the actual value
          // for today's date may not have been set yet

          this.connected = true;
          const renderDate = this.getSelectedDate() || this.getTodaysDate();
          this.renderCalendar(renderDate);
          this.initialRender = false;
        }

        this.dispatchEvent(new CustomEvent('ready'));
      }

      connectedCallback() {
        this.keyboardInterface = this.calendarKeyboardInterface();
      }

      disconnectedCallback() {
        this.connected = false;
      }
      /**
       * Sets focus on the focusable date cell in the calendar.
       */


      focus() {
        requestAnimationFrame(() => {
          const dateElement = this.getFocusableDateCell();

          if (dateElement) {
            dateElement.focus();
          }
        });
      }

      get i18n() {
        return i18n$4;
      }

      get computedAriaLabel() {
        const renderedMonth = this.getCalendarDate().getMonth();
        return i18n$4.ariaLabelMonth + getMonthNames()[renderedMonth].fullName;
      }

      get computedMonthTitle() {
        const renderedMonth = this.getCalendarDate().getMonth();
        return getMonthNames()[renderedMonth].fullName;
      }

      get computedWeekdayLabels() {
        const nameOfWeekdays = getNameOfWeekdays();
        const firstDayOfWeek = this.getFirstDayOfWeek();
        const computedWeekdayLabels = []; // We need to adjust the weekday labels to start from the locale's first day of week

        for (let i = firstDayOfWeek; i < nameOfWeekdays.length; i++) {
          computedWeekdayLabels.push(nameOfWeekdays[i]);
        }

        for (let i = 0; i < firstDayOfWeek; i++) {
          computedWeekdayLabels.push(nameOfWeekdays[i]);
        }

        return computedWeekdayLabels;
      }

      get computedSelectElementId() {
        return this.uniqueId + '-select';
      }

      get computedWeekdaysElementId() {
        return this.uniqueId + '-weekdays';
      }

      get computedMonthTitleId() {
        return this.uniqueId + '-month';
      }

      get computedYearList() {
        const sampleDate = new Date();
        const currentYear = sampleDate.getFullYear();
        const minDate = this.parseDate(this.min);
        const maxDate = this.parseDate(this.max);
        const minYear = minDate ? minDate.getFullYear() : currentYear - 100;
        sampleDate.setFullYear(minYear);
        const convertedMinYear = toOtherCalendar(sampleDate).getFullYear();
        const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 100;
        sampleDate.setFullYear(maxYear);
        const convertedMaxYear = toOtherCalendar(sampleDate).getFullYear();
        const yearList = [];

        for (let year = convertedMinYear; year <= convertedMaxYear; year++) {
          yearList.push(year);
        }

        return yearList;
      }

      get computedMonth() {
        // The calendar will be rendered after getting today's date based on the user's timezone
        if (!this.connected) {
          return [];
        }

        this.removeCurrentlySelectedDateAttributes();
        const selectedDate = this.getSelectedDate();
        const renderDate = this.getCalendarDate();
        const cacheKey = this.getCalendarCacheKey(renderDate, selectedDate);

        if (cacheKey in calendarCache) {
          return calendarCache[cacheKey];
        }

        const todayDate = this.getTodaysDate();
        const focusableDate = this.getInitialFocusDate(todayDate, selectedDate, renderDate);
        const calendarDates = {
          selectedDate,
          renderDate,
          focusableDate,
          todayDate,
          minDate: this.parseDate(this.min),
          maxDate: this.parseDate(this.max)
        };
        const monthCells = [];
        const date = this.getCalendarStartDate(renderDate);

        for (let week = 0; week < WEEKS_PER_MONTH; week++) {
          const weekCells = {
            id: week,
            days: []
          };

          for (let weekday = 0; weekday < DAYS_PER_WEEK; weekday++) {
            const dayCell = this.getDateCellAttributes(date, calendarDates);
            weekCells.days.push(dayCell);
            date.setDate(date.getDate() + 1);
          }

          monthCells.push(weekCells);
        }

        calendarCache[cacheKey] = monthCells;
        return monthCells;
      }

      getDateCellAttributes(date, calendarDates) {
        const isDisabled = !this.dateInCalendar(date, calendarDates.renderDate) || !this.isBetween(date, calendarDates.minDate, calendarDates.maxDate);
        const isSelected = this.isSame(date, calendarDates.selectedDate);
        const isToday = this.isSame(date, calendarDates.todayDate);
        const ariaCurrent = isToday ? 'date' : false;
        const tabIndex = this.isSame(date, calendarDates.focusableDate) ? '0' : false;
        const className = classSet().add({
          'slds-is-today': isToday,
          'slds-is-selected': isSelected,
          'slds-disabled-text': isDisabled
        }).toString();
        return {
          date: date.getDate(),
          dateValue: this.formatDate(date),
          isDisabled,
          isSelected: isSelected ? 'true' : 'false',
          className,
          tabIndex,
          ariaCurrent
        };
      }

      dispatchSelectEvent() {
        this.dispatchEvent(new CustomEvent('select', {
          composed: true,
          bubbles: true,
          cancelable: true,
          detail: {
            value: this.selectedDate
          }
        }));
      } // Determines if the date is in the rendered month/year calendar.


      dateInCalendar(date, calendarDate) {
        const renderedCalendar = calendarDate || this.getCalendarDate();
        return date.getMonth() === renderedCalendar.getMonth() && date.getFullYear() === renderedCalendar.getFullYear();
      }

      getInitialFocusDate(todayDate, selectedDate, renderedDate) {
        if (selectedDate && this.dateInCalendar(selectedDate, renderedDate)) {
          return selectedDate;
        }

        if (this.dateInCalendar(todayDate, renderedDate)) {
          return todayDate;
        }

        return new Date(renderedDate.getFullYear(), renderedDate.getMonth(), 1);
      }

      getTodaysDate() {
        if (this.todayDate) {
          return this.parseDate(this.todayDate);
        } // Today's date will be fetched in connectedCallback. In the meantime, use the date based on the device timezone.


        return new Date();
      }

      getSelectedDate() {
        return this.parseDate(this.selectedDate);
      } // returns the month and year in the calendar


      getCalendarDate() {
        if (this.calendarYear) {
          return new Date(this.calendarYear, this.calendarMonth, 1);
        }

        return this.getTodaysDate();
      }

      getCalendarStartDate(renderedDate) {
        const firstDayOfMonth = new Date(renderedDate.getFullYear(), renderedDate.getMonth(), 1);
        return this.getStartOfWeek(firstDayOfMonth);
      }

      getStartOfWeek(dayInWeek) {
        const firstDayOfWeek = this.getFirstDayOfWeek(); // Negative dates in JS will subtract days from the 1st of the given month

        let startDay = dayInWeek.getDay();

        while (startDay !== firstDayOfWeek) {
          dayInWeek.setDate(dayInWeek.getDate() - 1);
          startDay = dayInWeek.getDay();
        }

        return dayInWeek;
      }

      getFirstDayOfWeek() {
        return getLocale().firstDayOfWeek - 1; // In Java, week days are 1 - 7
      } // This method is called when a new value is set, or when you click the today button.
      // In both cases, we need to check if newValue is in the currently rendered calendar


      selectDate(newDate) {
        if (this.dateInCalendar(newDate)) {
          const dateElement = this.getElementByDate(this.formatDate(newDate)); // do not select if date is disabled

          if (this.dateElementDisabled(dateElement)) {
            return;
          }

          this.selectDateInCalendar(dateElement);
        } else {
          this.renderCalendar(newDate);
        }
      } // Select a date in current calendar without the need to re-render the calendar


      selectDateInCalendar(dateElement) {
        this.selectedDate = dateElement.getAttribute('data-value');
        this.removeCurrentlySelectedDateAttributes();
        this.addSelectedDateAttributes(dateElement);
      }

      selectDateInCalendarAndDispatchSelect(dateElement) {
        // do not select if date is disabled
        if (this.dateElementDisabled(dateElement)) {
          return;
        }

        this.selectDateInCalendar(dateElement);
        this.dispatchSelectEvent();
      } // we should be able to control the select value with an attribute once we have a select component


      selectYear(year) {
        const sampleDate = new Date();
        sampleDate.setFullYear(year);
        const convertedYear = toOtherCalendar(sampleDate).getFullYear();
        const optionElement = this.template.querySelector(`option[value='${convertedYear}']`);

        if (optionElement) {
          optionElement.selected = true;
        }
      }

      getElementByDate(dateString) {
        return this.template.querySelector(`td[data-value='${dateString}']`);
      }

      getFocusableDateCell() {
        return this.template.querySelector(`td[tabIndex='0']`);
      }

      unfocusDateCell(element) {
        if (element) {
          element.removeAttribute('tabIndex');
        }
      }

      focusDateCell(element) {
        if (element) {
          element.setAttribute('tabIndex', 0);
          element.focus();
        }
      }

      focusElementByDate(date) {
        requestAnimationFrame(() => {
          const element = this.getElementByDate(this.formatDate(date));

          if (element) {
            this.unfocusDateCell(this.getFocusableDateCell());
            this.focusDateCell(element);
          }
        });
      }

      renderCalendar(newDate) {
        this.calendarMonth = newDate.getMonth();
        this.calendarYear = newDate.getFullYear();
        this.selectYear(newDate.getFullYear());
      }

      renderToday() {
        const todaysDate = this.getTodaysDate();

        if (this.dateInCalendar(todaysDate)) {
          this.removeCurrentlySelectedDateAttributes();
          this.unfocusDateCell(this.getFocusableDateCell());
          const todayElement = this.getElementByDate(this.todayDate);
          todayElement.setAttribute('tabIndex', 0);
        } else {
          this.renderCalendar(todaysDate);
        }
      }

      removeCurrentlySelectedDateAttributes() {
        const currentlySelectedElement = this.template.querySelector(`td[class*='slds-is-selected']`);

        if (currentlySelectedElement) {
          currentlySelectedElement.classList.remove('slds-is-selected');
          currentlySelectedElement.setAttribute('aria-selected', 'false');
        }

        this.unfocusDateCell(this.getFocusableDateCell());
      }

      addSelectedDateAttributes(dateElement) {
        this.focusDateCell(dateElement);
        dateElement.classList.add('slds-is-selected');
        dateElement.setAttribute('aria-selected', 'true');
      }

      dateElementDisabled(dateElement) {
        // do not select if date is disabled
        return !dateElement || dateElement.getAttribute('aria-disabled') === 'true';
      }

      handleCalendarKeyDown(event) {
        const dateString = event.target.getAttribute('data-value');
        handleKeyDownOnCalendar(event, this.parseDate(dateString), this.keyboardInterface);
      }

      handleTodayKeyDown(event) {
        handleKeyDownOnToday(event, this.keyboardInterface);
      }

      handlePrevNavKeyDown(event) {
        handleKeyDownOnPreviousMonthNav(event, this.keyboardInterface);
      }

      handleDateClick(event) {
        event.stopPropagation();
        const tdElement = event.target.parentElement;
        this.selectDateInCalendarAndDispatchSelect(tdElement);
      }

      handleTodayClick(event) {
        event.stopPropagation();
        this.selectedDate = this.todayDate;
        this.selectDate(this.getTodaysDate());
        this.dispatchSelectEvent();
      }

      handleYearSelectClick(event) {
        event.stopPropagation();
      }

      handleYearChange(event) {
        const sampleDate = new Date();
        sampleDate.setFullYear(event.target.value);
        const convertedYear = fromOtherCalendar(sampleDate).getFullYear();

        if (this.calendarYear !== convertedYear) {
          this.calendarYear = convertedYear;
        }
      }

      goToNextMonth(event) {
        event.stopPropagation();
        const calendarDate = this.getCalendarDate();
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        this.renderCalendar(calendarDate);
      }

      goToPreviousMonth(event) {
        event.stopPropagation();
        const calendarDate = this.getCalendarDate();
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        this.renderCalendar(calendarDate);
      }

      calendarKeyboardInterface() {
        const that = this;
        return {
          focusDate(newDate) {
            if (!that.dateInCalendar(newDate)) {
              that.renderCalendar(newDate);
            }

            that.focusElementByDate(newDate);
          },

          getStartOfWeek(dayInWeek) {
            return that.getStartOfWeek(dayInWeek);
          },

          focusFirstFocusableElement() {
            that.template.querySelector('lightning-button-icon').focus();
          },

          focusLastFocusableElement() {
            that.template.querySelector('button[name="today"]').focus();
          },

          selectDate(dateElement) {
            that.selectDateInCalendarAndDispatchSelect(dateElement);
          }

        };
      }

      formatDate(date) {
        return formatDate$1(date, STANDARD_DATE_FORMAT);
      }

      parseDate(dateString) {
        return parseDateTime$1(dateString, STANDARD_DATE_FORMAT, true);
      }

      isSame(date1, date2) {
        if (!date1 || !date2) {
          return false;
        }

        return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate() // getDate returns the day in month whereas getDay returns the weekday number
        ;
      }

      isBetween(date, date1, date2) {
        let isBeforeEndDate = true;
        let isAfterStartDate = true;

        if (date2) {
          isBeforeEndDate = isBefore$1(date, date2, 'day') || this.isSame(date, date2);
        }

        if (date1) {
          isAfterStartDate = isAfter$1(date, date1, 'day') || this.isSame(date, date1);
        }

        return isBeforeEndDate && isAfterStartDate;
      }

      getCalendarCacheKey(renderDate, selectedDate) {
        let key = renderDate.getFullYear() + '-' + renderDate.getMonth(); // Having the key include min/max seems enough for now.
        // We're not going to complicate things by checking if renderDate falls before/after the min/max.

        key += this.min ? 'min' + this.min : '';
        key += this.max ? 'max' + this.max : '';

        if (selectedDate && this.dateInCalendar(selectedDate, renderDate)) {
          key += '_' + selectedDate.getDate();
        }

        return key;
      }

    }

    lwc.registerDecorators(LightningCalendar, {
      publicProps: {
        min: {
          config: 0
        },
        max: {
          config: 0
        },
        value: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        calendarYear: 1,
        calendarMonth: 1
      }
    });

    var _lightningCalendar = lwc.registerComponent(LightningCalendar, {
      tmpl: _tmpl$b
    });

    function tmpl$b($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element,
        d: api_dynamic,
        gid: api_scoped_id,
        c: api_custom_element,
        b: api_bind
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
        _m12
      } = $ctx;
      return [api_element("div", {
        classMap: {
          "slds-form-element": true,
          "slds-dropdown-trigger": true,
          "slds-dropdown-trigger_click": true,
          "slds-size_1-of-1": true
        },
        attrs: {
          "tabindex": "-1"
        },
        key: 2
      }, [api_element("label", {
        className: $cmp.computedLabelClass,
        attrs: {
          "for": `${api_scoped_id("input")}`
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
          "slds-form-element__control": true,
          "slds-input-has-icon": true,
          "slds-input-has-icon_right": true
        },
        key: 7
      }, [api_element("input", {
        classMap: {
          "slds-input": true
        },
        attrs: {
          "type": "text",
          "id": api_scoped_id("input"),
          "name": $cmp.name,
          "placeholder": $cmp.placeholder,
          "aria-label": $cmp.ariaLabel,
          "autocomplete": $cmp.autocomplete
        },
        props: {
          "value": $cmp.displayValue,
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "disabled": $cmp.disabled
        },
        key: 8,
        on: {
          "input": _m0 || ($ctx._m0 = api_bind($cmp.handleInput)),
          "change": _m1 || ($ctx._m1 = api_bind($cmp.handleInputChange)),
          "focus": _m2 || ($ctx._m2 = api_bind($cmp.handleInputFocus)),
          "blur": _m3 || ($ctx._m3 = api_bind($cmp.handleInputBlur)),
          "keydown": _m4 || ($ctx._m4 = api_bind($cmp.handleInputKeydown)),
          "click": _m5 || ($ctx._m5 = api_bind($cmp.handleInputClick))
        }
      }, []), api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        classMap: {
          "slds-input__icon": true,
          "slds-input__icon_right": true
        },
        props: {
          "iconName": "utility:event",
          "variant": "bare",
          "disabled": $cmp.computedIconDisabledState,
          "title": $cmp.i18n.selectDate,
          "alternativeText": $cmp.i18n.selectDate
        },
        key: 9,
        on: {
          "click": _m6 || ($ctx._m6 = api_bind($cmp.handleDatePickerIconClick)),
          "keydown": _m7 || ($ctx._m7 = api_bind($cmp.handleDatePickerIconKeyDown)),
          "focus": _m8 || ($ctx._m8 = api_bind($cmp.handleIconFocus)),
          "blur": _m9 || ($ctx._m9 = api_bind($cmp.handleIconBlur))
        }
      }, []), $cmp.isCalendarVisible ? api_custom_element("lightning-calendar", _lightningCalendar, {
        props: {
          "value": $cmp.value,
          "min": $cmp.min,
          "max": $cmp.max
        },
        key: 11,
        on: {
          "keydown": _m10 || ($ctx._m10 = api_bind($cmp.handleCalendarKeyDown)),
          "select": _m11 || ($ctx._m11 = api_bind($cmp.handleDateSelect)),
          "ready": _m12 || ($ctx._m12 = api_bind($cmp.startPositioning))
        }
      }, []) : null])]), $cmp.errorMessage ? api_element("div", {
        classMap: {
          "slds-form-element__help": true
        },
        attrs: {
          "id": api_scoped_id("error-message"),
          "data-error-message": true,
          "aria-live": "assertive"
        },
        key: 13
      }, [api_dynamic($cmp.errorMessage)]) : null];
    }

    var _tmpl$c = lwc.registerTemplate(tmpl$b);
    tmpl$b.stylesheets = [];
    tmpl$b.stylesheetTokens = {
      hostAttribute: "lightning-datepicker_datepicker-host",
      shadowAttribute: "lightning-datepicker_datepicker"
    };

    var labelInvalidDate = 'Your entry does not match the allowed format {0}.';

    var labelRangeOverflow$1 = 'Value must be {0} or earlier.';

    var labelRangeUnderflow$1 = 'Value must be {0} or later.';

    var labelRequired = 'required';

    var labelSelectDate = 'Select a date';

    function handleKeyDownOnDatePickerIcon(event, datepickerInterface) {
      switch (event.keyCode) {
        case keyCodes.enter:
        case keyCodes.space:
          preventDefaultAndStopPropagation$1(event);
          datepickerInterface.showCalendar();
          break;

        case keyCodes.escape:
          preventDefaultAndStopPropagation$1(event);
          datepickerInterface.hideCalendar();
          break;

        default:
      }
    }
    function handleBasicKeyDownBehaviour(event, datepickerInterface) {
      if (!datepickerInterface.isCalendarVisible()) {
        return;
      }

      if (event.keyCode === keyCodes.escape) {
        preventDefaultAndStopPropagation$1(event);
        datepickerInterface.hideCalendar();
      }
    }

    function preventDefaultAndStopPropagation$1(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const i18n$5 = {
      invalidDate: labelInvalidDate,
      rangeOverflow: labelRangeOverflow$1,
      rangeUnderflow: labelRangeUnderflow$1,
      required: labelRequired,
      selectDate: labelSelectDate
    };
    const ARIA_CONTROLS = 'aria-controls';
    const ARIA_LABEL = 'aria-label';
    const ARIA_LABELLEDBY = 'aria-labelledby';
    const ARIA_DESCRIBEDBY$1 = 'aria-describedby';
    const DATE_STYLE = {
      SHORT: 'short',
      MEDIUM: 'medium',
      LONG: 'long'
    };

    class LightningDatePicker extends lwc.LightningElement {
      get messageWhenBadInput() {
        return this._messageWhenBadInput || this.formatString(this.i18n.invalidDate, this.dateFormat);
      }

      set messageWhenBadInput(message) {
        this._messageWhenBadInput = message;
      }

      get messageWhenRangeOverflow() {
        return this._messageWhenRangeOverflow || this.formatString(this.i18n.rangeOverflow, this.max);
      }

      set messageWhenRangeOverflow(message) {
        this._messageWhenRangeOverflow = message;
      }

      get messageWhenRangeUnderflow() {
        return this._messageWhenRangeUnderflow || this.formatString(this.i18n.rangeUnderflow, this.min);
      }

      set messageWhenRangeUnderflow(message) {
        this._messageWhenRangeUnderflow = message;
      } // setter is required to properly trigger update


      get ariaLabel() {
        return this._ariaLabel;
      }

      set ariaLabel(val) {
        this._ariaLabel = val;
        this.synchronizeA11y();
      }

      set ariaLabelledByElement(el) {
        this._ariaLabelledBy = el;
        this.synchronizeA11y();
      }

      get ariaLabelledByElement() {
        return this._ariaLabelledBy;
      }

      set ariaControlsElement(el) {
        this._ariaControls = el;
        this.synchronizeA11y();
      }

      get ariaControlsElement() {
        return this._ariaControls;
      }

      set ariaDescribedByElements(el) {
        if (Array.isArray(el)) {
          this._ariaDescribedBy = el;
        } else {
          this._ariaDescribedBy = [el];
        }

        this.synchronizeA11y();
      }

      get ariaDescribedByElements() {
        return this._ariaDescribedBy;
      }

      get ariaLabelledbyId() {
        return getRealDOMId(this._ariaLabelledBy);
      }

      get ariaControlsId() {
        return getRealDOMId(this.ariaControlsElement);
      }

      synchronizeA11y() {
        const input = this.template.querySelector('input');

        if (!input) {
          return;
        }

        synchronizeAttrs(input, {
          [ARIA_LABELLEDBY]: this.ariaLabelledbyId,
          [ARIA_DESCRIBEDBY$1]: this.computedAriaDescribedby,
          [ARIA_CONTROLS]: this.ariaControlsId,
          [ARIA_LABEL]: this._ariaLabel
        });
      }

      renderedCallback() {
        this.synchronizeA11y();
      }

      get value() {
        return this._value;
      }

      set value(newValue) {
        const normalizedValue = this.normalizeInputValue(newValue);

        if (normalizedValue !== this._value) {
          const normalizedDate = normalizeISODate(normalizedValue, this.dateFormat);
          this._value = normalizedDate.isoValue;
          this._displayValue = normalizedDate.displayValue;
        }
      }

      get disabled() {
        return this._disabled;
      }

      set disabled(value) {
        this._disabled = normalizeBoolean(value);
      }

      get readOnly() {
        return this._readonly;
      }

      set readOnly(value) {
        this._readonly = normalizeBoolean(value);
      }

      get required() {
        return this._required;
      }

      set required(value) {
        this._required = normalizeBoolean(value);
      }

      set fieldLevelHelp(value) {
        this._fieldLevelHelp = value;
      }

      get fieldLevelHelp() {
        return this._fieldLevelHelp;
      }

      get variant() {
        return this._variant || VARIANT.STANDARD;
      }

      set variant(value) {
        this._variant = normalizeVariant(value);
      }
      /**
       * Sets focus on the input element.
       */


      focus() {
        if (this.connected) {
          this.inputElement.focus();
        }
      }
      /**
       * Removes keyboard focus from the input element.
       */


      blur() {
        if (this.connected) {
          this.inputElement.blur();
        }
      }

      showHelpMessage(message) {
        if (!message) {
          this.classList.remove('slds-has-error');
          this._errorMessage = '';
        } else {
          this.classList.add('slds-has-error');
          this._errorMessage = message;
        }
      }

      hasBadInput() {
        return !!this._displayValue && this._value === null;
      }

      get dateStyle() {
        return this._dateStyle;
      }

      set dateStyle(value) {
        this._dateStyle = normalizeString(value, {
          fallbackValue: DATE_STYLE.MEDIUM,
          validValues: [DATE_STYLE.SHORT, DATE_STYLE.MEDIUM, DATE_STYLE.LONG]
        });
        this.dateFormat = this.getDateFormatFromStyle(this._dateStyle);
        const normalizedDate = normalizeISODate(this._value, this.dateFormat);
        this._displayValue = normalizedDate.displayValue;
      }

      constructor() {
        super();
        this._disabled = false;
        this._readonly = false;
        this._required = false;
        this._value = null;
        this._calendarVisible = false;
        this._displayValue = null;
        this._errorMessage = '';
        this._fieldLevelHelp = void 0;
        this._variant = void 0;
        this.label = void 0;
        this.name = void 0;
        this.max = void 0;
        this.min = void 0;
        this.placeholder = void 0;
        this.autocomplete = void 0;
        this.messageWhenValueMissing = void 0;
        this._ariaLabelledBy = void 0;
        this._ariaControls = void 0;
        this._ariaDescribedBy = [];
        this.uniqueId = generateUniqueId();
      }

      connectedCallback() {
        this.connected = true;
        this.keyboardInterface = this.datepickerKeyboardInterface();
        this.documentClickHandler = this.getClickHandler.bind(this);
        this.interactingState = new InteractingState({
          debounceInteraction: true
        });
        this.interactingState.onenter(() => {
          this.dispatchEvent(new CustomEvent('focus'));
        });
        this.interactingState.onleave(() => {
          if (this.connected) {
            this.dispatchEvent(new CustomEvent('blur'));
          }
        });
      }

      disconnectedCallback() {
        this.connected = false; // make sure the click handler has been removed from the document

        document.removeEventListener('click', this.documentClickHandler);
      }

      get i18n() {
        return i18n$5;
      }

      get isLabelHidden() {
        return this.variant === VARIANT.LABEL_HIDDEN;
      }

      get computedLabelClass() {
        return classSet('slds-form-element__label').add({
          'slds-assistive-text': this.isLabelHidden
        }).toString();
      }

      get computedUniqueErrorMessageElementId() {
        const el = this.template.querySelector('[data-error-message]');
        return getRealDOMId(el);
      }

      get isCalendarVisible() {
        return this._calendarVisible;
      }

      get displayValue() {
        return this._displayValue;
      }

      get errorMessage() {
        return this._errorMessage;
      }

      get computedIconDisabledState() {
        return this.disabled || this.readOnly;
      }

      get computedAriaDescribedby() {
        const ariaValues = [];

        if (this.errorMessage) {
          ariaValues.push(this.computedUniqueErrorMessageElementId);
        }

        this._ariaDescribedBy.forEach(item => {
          const id = getRealDOMId(item);

          if (id) {
            ariaValues.push(id);
          }
        });

        return normalizeAriaAttribute(ariaValues);
      }

      handleInputChange(event) {
        event.stopPropagation(); // keeping the display value in sync with the element's value

        this._displayValue = event.currentTarget.value;
        this._value = this.parseFormattedDate(this._displayValue);
        this.dispatchChangeEvent();
      }

      handleInput() {
        // IE11 fires an input event along with the click event when the element has a placeholder.
        // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/101220/
        // remove this block when we stop support for IE11
        const normalizedInputValue = this.normalizeInputValue(this.inputElement.value);

        if (this._displayValue === normalizedInputValue) {
          return;
        } // keeping the display value in sync with the element's value


        this._displayValue = this.inputElement.value; // Making sure that the focus remains on the input and we're not triggering leave

        this.hideCalendarAndFocusTrigger();
      }

      handleInputFocus() {
        this.interactingState.enter();
      }

      handleInputBlur() {
        if (!this.isCalendarVisible) {
          if (this._value !== null) {
            const normalizedDate = normalizeISODate(this._value, this.dateFormat);
            this._displayValue = normalizedDate.displayValue;
          }

          this.interactingState.leave();
        }
      }

      handleInputClick(event) {
        if (this.readOnly) {
          return;
        }

        this.calendarTrigger = event.target;
        this.showCalendar();
      }

      handleIconBlur() {
        if (!this.isCalendarVisible) {
          this.interactingState.leave();
        }
      }

      handleIconFocus() {
        this.interactingState.enter();
      }

      handleDatePickerIconClick(event) {
        if (this.readOnly || this.disabled) {
          return;
        }

        this.calendarTrigger = event.target;
        this.showAndFocusCalendar();
      }

      handleInputKeydown(event) {
        this.calendarTrigger = event.target;
        handleBasicKeyDownBehaviour(event, this.keyboardInterface);
      }

      handleDatePickerIconKeyDown(event) {
        this.calendarTrigger = event.target;
        handleKeyDownOnDatePickerIcon(event, this.keyboardInterface);
      }

      handleCalendarKeyDown(event) {
        handleBasicKeyDownBehaviour(event, this.keyboardInterface);
      }

      handleDateSelect(event) {
        event.stopPropagation();
        this._value = event.detail.value;
        this._displayValue = normalizeISODate(this._value, this.dateFormat).displayValue;
        this.hideCalendarAndFocusTrigger();
        this.dispatchChangeEvent();
      }

      showAndFocusCalendar() {
        this.showCalendar();
        requestAnimationFrame(() => {
          this.focusCalendar();
        });
      }

      hideCalendarAndFocusTrigger() {
        this.hideCalendar();
        this.calendarTrigger.focus(); // in the case where the input already has focus, we should re-enter to make sure we are not triggering leave

        this.interactingState.enter();
      }

      focusCalendar() {
        const calendar = this.template.querySelector('lightning-calendar');

        if (calendar) {
          calendar.focus();
        }
      }

      startPositioning() {
        if (!this._relationship) {
          this._relationship = startPositioning(this, {
            target: () => this.template.querySelector('input'),
            element: () => this.template.querySelector('lightning-calendar').shadowRoot.querySelector('div'),
            align: {
              horizontal: Direction.Right,
              vertical: Direction.Top
            },
            targetAlign: {
              horizontal: Direction.Right,
              vertical: Direction.Bottom
            },
            autoFlip: true,
            // Auto flip direction if not have enough space
            leftAsBoundary: true // horizontal flip uses target left as boundary

          });
        } else {
          this._relationship.reposition();
        }
      }

      stopPositioning() {
        if (this._relationship) {
          stopPositioning(this._relationship);
          this._relationship = null;
        }
      }

      showCalendar() {
        if (!this.isCalendarVisible) {
          this.interactingState.enter(); // Async bind the click handler because we are currently handling a
          // click event and we don't want to immediately close the calendar.

          requestAnimationFrame(() => {
            this.addDocumentClickHandler();
          });
          this.rootElement.classList.add('slds-is-open');
          this._calendarVisible = true;
        }
      }

      hideCalendar() {
        if (this.isCalendarVisible) {
          this.removeDocumentClickHandler();
          this.rootElement.classList.remove('slds-is-open');
          this.stopPositioning();
          this._calendarVisible = false;
          this.interactingState.leave();
        }
      }

      get rootElement() {
        return this.template.querySelector('div');
      }

      get inputElement() {
        return this.template.querySelector('input');
      }

      get dateFormat() {
        if (!this._dateFormat) {
          this._dateFormat = this.getDateFormatFromStyle();
        }

        return this._dateFormat;
      }

      set dateFormat(value) {
        this._dateFormat = value;
      }

      getDateFormatFromStyle(dateStyle) {
        let dateFormat;

        switch (dateStyle) {
          case DATE_STYLE.SHORT:
            dateFormat = getLocale().shortDateFormat;
            break;

          case DATE_STYLE.LONG:
            dateFormat = getLocale().longDateFormat;
            break;

          default:
            dateFormat = getLocale().dateFormat;
            break;
        }

        return dateFormat;
      }

      dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('change', {
          composed: true,
          bubbles: true,
          detail: {
            value: this._value
          }
        }));
      }

      addDocumentClickHandler() {
        document.addEventListener('click', this.documentClickHandler);
      }

      removeDocumentClickHandler() {
        document.removeEventListener('click', this.documentClickHandler);
      }

      getClickHandler(event) {
        const rootElement = this.rootElement;

        if (!rootElement.contains(event.target)) {
          this.hideCalendar();
        }
      }

      datepickerKeyboardInterface() {
        const that = this;
        return {
          showCalendar() {
            that.showAndFocusCalendar();
          },

          hideCalendar() {
            that.hideCalendarAndFocusTrigger();
          },

          isCalendarVisible() {
            return that.isCalendarVisible;
          }

        };
      }

      normalizeInputValue(value) {
        if (!value || value === '') {
          return null;
        }

        return value;
      }

      parse(dateString) {
        // We cannot use parseDateTimeISO8601 here because that method does not have a strict flag. If the value is not an ISO string, that method will parse using the native Date()
        // Alternatively we could call isValidISODateTimeString and then parseDateTimeISO8601.
        return parseDateTime$1(dateString, STANDARD_DATE_FORMAT, true);
      }

      get allowedDateFormats() {
        // this method can't be static because at the time this file is interpreted,
        // getLocale don't have the injected Locale in the config provider.
        const locale = getLocale(); // We should prioritize the long, because a long date matched with the medium format. An issue in aura?
        // Ex: September 8, 2017 when be parsed with the medium format, returns a valid iso date.

        return [locale.longDateFormat, locale.dateFormat, locale.shortDateFormat];
      }
      /**
       * Parses the input date and sets the dateFormat used to parse the displayValue
       * if it is a valid Date.
       *
       * @param {String} displayValue - The input date.
       * @return {null | string} - A normalized formatted date if displayValue is valid. null otherwise.
       */


      parseFormattedDate(displayValue) {
        const allowedFormats = this.allowedDateFormats;
        const n = allowedFormats.length;
        let i = 0,
            value = null;

        do {
          value = normalizeFormattedDate(displayValue, allowedFormats[i]);
          i++;
        } while (value === null && i < n);

        return value;
      }

      formatString(str, ...args) {
        return str.replace(/{(\d+)}/g, (match, i) => {
          return args[i];
        });
      }

    }

    LightningDatePicker.delegatesFocus = true;

    lwc.registerDecorators(LightningDatePicker, {
      publicProps: {
        label: {
          config: 0
        },
        name: {
          config: 0
        },
        max: {
          config: 0
        },
        min: {
          config: 0
        },
        placeholder: {
          config: 0
        },
        autocomplete: {
          config: 0
        },
        messageWhenValueMissing: {
          config: 0
        },
        messageWhenBadInput: {
          config: 3
        },
        messageWhenRangeOverflow: {
          config: 3
        },
        messageWhenRangeUnderflow: {
          config: 3
        },
        ariaLabel: {
          config: 3
        },
        ariaLabelledByElement: {
          config: 3
        },
        ariaControlsElement: {
          config: 3
        },
        ariaDescribedByElements: {
          config: 3
        },
        value: {
          config: 3
        },
        disabled: {
          config: 3
        },
        readOnly: {
          config: 3
        },
        required: {
          config: 3
        },
        fieldLevelHelp: {
          config: 3
        },
        variant: {
          config: 3
        },
        dateStyle: {
          config: 3
        }
      },
      publicMethods: ["focus", "blur", "showHelpMessage", "hasBadInput"],
      track: {
        _disabled: 1,
        _readonly: 1,
        _required: 1,
        _value: 1,
        _calendarVisible: 1,
        _displayValue: 1,
        _errorMessage: 1,
        _fieldLevelHelp: 1,
        _variant: 1
      }
    });

    var _lightningDatepicker = lwc.registerComponent(LightningDatePicker, {
      tmpl: _tmpl$c
    });

    function tmpl$c($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$d = lwc.registerTemplate(tmpl$c);
    tmpl$c.stylesheets = [];
    tmpl$c.stylesheetTokens = {
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
        return normalizeVariant$1(this.state.variant, this.state.iconName);
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
      tmpl: _tmpl$d
    });

    function normalizeVariant$1(variant, iconName) {
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

    function tmpl$d($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        k: api_key,
        h: api_element,
        i: api_iterator,
        f: api_flatten
      } = $api;
      return api_flatten([$cmp.hasParts ? api_iterator($cmp.text, function (item) {
        return [item.part.highlight ? api_element("strong", {
          key: api_key(5, item.key)
        }, [api_dynamic(item.part.text)]) : null, !item.part.highlight ? api_dynamic(item.part.text) : null];
      }) : [], !$cmp.hasParts ? api_dynamic($cmp.text) : null]);
    }

    var _tmpl$e = lwc.registerTemplate(tmpl$d);
    tmpl$d.stylesheets = [];
    tmpl$d.stylesheetTokens = {
      hostAttribute: "lightning-baseComboboxFormattedText_baseComboboxFormattedText-host",
      shadowAttribute: "lightning-baseComboboxFormattedText_baseComboboxFormattedText"
    };

    class LightningBaseComboboxFormattedText extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this._text = '';
        this.hasParts = void 0;
      }

      get text() {
        return this._text;
      }

      set text(value) {
        this.hasParts = Array.isArray(value) && value.length > 0;

        if (this.hasParts) {
          // Generate keys for LWC DOM
          this._text = value.map((part, i) => ({
            part,
            key: i
          }));
        } else {
          this._text = value;
        }
      }

    }

    lwc.registerDecorators(LightningBaseComboboxFormattedText, {
      publicProps: {
        text: {
          config: 3
        }
      },
      track: {
        _text: 1,
        hasParts: 1
      }
    });

    var _lightningBaseComboboxFormattedText = lwc.registerComponent(LightningBaseComboboxFormattedText, {
      tmpl: _tmpl$e
    });

    function tmpl$e($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        h: api_element,
        d: api_dynamic
      } = $api;
      return [api_element("span", {
        classMap: {
          "slds-media__figure": true
        },
        key: 2
      }, [api_custom_element("lightning-icon", _lightningIcon, {
        props: {
          "size": $cmp.iconSize,
          "alternativeText": $cmp.item.iconAlternativeText,
          "iconName": $cmp.item.iconName
        },
        key: 3
      }, [])]), api_element("span", {
        classMap: {
          "slds-media__body": true
        },
        key: 4
      }, [api_element("span", {
        classMap: {
          "slds-listbox__option-text": true,
          "slds-listbox__option-text_entity": true
        },
        key: 5
      }, [!$cmp.textHasParts ? api_element("span", {
        classMap: {
          "slds-truncate": true
        },
        attrs: {
          "title": $cmp.item.text
        },
        key: 7
      }, [api_dynamic($cmp.item.text)]) : null, $cmp.textHasParts ? api_custom_element("lightning-base-combobox-formatted-text", _lightningBaseComboboxFormattedText, {
        classMap: {
          "slds-truncate": true
        },
        props: {
          "title": $cmp.text,
          "text": $cmp.item.text
        },
        key: 9
      }, []) : null]), $cmp.hasSubText ? api_element("span", {
        classMap: {
          "slds-listbox__option-meta": true,
          "slds-listbox__option-meta_entity": true
        },
        key: 11
      }, [!$cmp.subTextHasParts ? api_element("span", {
        classMap: {
          "slds-truncate": true
        },
        attrs: {
          "title": $cmp.item.subText
        },
        key: 13
      }, [api_dynamic($cmp.item.subText)]) : null, $cmp.subTextHasParts ? api_custom_element("lightning-base-combobox-formatted-text", _lightningBaseComboboxFormattedText, {
        classMap: {
          "slds-truncate": true
        },
        props: {
          "title": $cmp.subText,
          "text": $cmp.item.subText
        },
        key: 15
      }, []) : null]) : null]), $cmp.item.rightIconName ? api_element("span", {
        classMap: {
          "slds-media__figure": true,
          "slds-media__figure_reverse": true
        },
        key: 17
      }, [api_custom_element("lightning-icon", _lightningIcon, {
        props: {
          "size": $cmp.rightIconSize,
          "alternativeText": $cmp.item.rightIconAlternativeText,
          "iconName": $cmp.item.rightIconName
        },
        key: 18
      }, [])]) : null];
    }

    var card = lwc.registerTemplate(tmpl$e);
    tmpl$e.stylesheets = [];
    tmpl$e.stylesheetTokens = {
      hostAttribute: "lightning-baseComboboxItem_card-host",
      shadowAttribute: "lightning-baseComboboxItem_card"
    };

    function tmpl$f($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        h: api_element,
        d: api_dynamic
      } = $api;
      return [api_element("span", {
        classMap: {
          "slds-media__figure": true,
          "slds-listbox__option-icon": true
        },
        key: 2
      }, [$cmp.item.iconName ? api_custom_element("lightning-icon", _lightningIcon, {
        props: {
          "alternativeText": $cmp.item.iconAlternativeText,
          "iconName": $cmp.item.iconName,
          "size": "x-small"
        },
        key: 4
      }, []) : null]), api_element("span", {
        classMap: {
          "slds-media__body": true
        },
        key: 5
      }, [!$cmp.textHasParts ? api_element("span", {
        classMap: {
          "slds-truncate": true
        },
        attrs: {
          "title": $cmp.item.text
        },
        key: 7
      }, [api_dynamic($cmp.item.text)]) : null, $cmp.textHasParts ? api_custom_element("lightning-base-combobox-formatted-text", _lightningBaseComboboxFormattedText, {
        classMap: {
          "slds-truncate": true
        },
        props: {
          "text": $cmp.item.text,
          "title": $cmp.text
        },
        key: 9
      }, []) : null])];
    }

    var inline = lwc.registerTemplate(tmpl$f);
    tmpl$f.stylesheets = [];
    tmpl$f.stylesheetTokens = {
      hostAttribute: "lightning-baseComboboxItem_inline-host",
      shadowAttribute: "lightning-baseComboboxItem_inline"
    };

    class LightningBaseComboboxItem extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.item = {};
      }

      connectedCallback() {
        // We want to make sure that the item has 'aria-selected' if it's selectable
        if (this.item.selectable) {
          this.setAttribute('aria-selected', 'false');
        }

        if (this.item.type === 'option-inline') {
          this.classList.add('slds-media_small', 'slds-listbox__option_plain');
        } else {
          this.classList.add('slds-listbox__option_entity');
        }
      }

      get textHasParts() {
        const text = this.item.text;
        return text && Array.isArray(text) && text.length > 0;
      }

      get subTextHasParts() {
        const subText = this.item.subText;
        return subText && Array.isArray(subText) && subText.length > 0;
      } // Return html based on the specified item type


      render() {
        if (this.item.type === 'option-card') {
          return card;
        }

        return inline;
      }

      highlight() {
        this.toggleHighlight(true);
      }

      removeHighlight() {
        this.toggleHighlight(false);
      }

      toggleHighlight(highlighted) {
        if (this.item.selectable) {
          this.setAttribute('aria-selected', highlighted ? 'true' : 'false');
          this.classList.toggle('slds-has-focus', highlighted);
        }
      } // Parts are needed for highlighting


      partsToText(parts) {
        if (parts && Array.isArray(parts) && parts.length > 0) {
          return parts.map(part => part.text).join('');
        }

        return parts;
      }

      get rightIconSize() {
        return this.item.rightIconSize || 'small';
      }

      get iconSize() {
        return this.item.iconSize || 'small';
      }

      get text() {
        return this.partsToText(this.item.text);
      }

      get subText() {
        return this.partsToText(this.item.subText);
      }

      get hasSubText() {
        const subText = this.item.subText;
        return subText && subText.length > 0;
      }

    }

    lwc.registerDecorators(LightningBaseComboboxItem, {
      publicProps: {
        item: {
          config: 0
        }
      },
      publicMethods: ["highlight", "removeHighlight"]
    });

    var _lightningBaseComboboxItem = lwc.registerComponent(LightningBaseComboboxItem, {
      tmpl: _tmpl$1
    });

    function tmpl$g($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        gid: api_scoped_id,
        b: api_bind,
        h: api_element,
        d: api_dynamic,
        k: api_key,
        i: api_iterator,
        f: api_flatten
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
        _m13,
        _m14
      } = $ctx;
      return [api_element("div", {
        className: $cmp.computedDropdownTriggerClass,
        attrs: {
          "role": "combobox",
          "aria-expanded": $cmp.computedAriaExpanded,
          "aria-haspopup": "listbox"
        },
        key: 2,
        on: {
          "click": _m14 || ($ctx._m14 = api_bind($cmp.handleTriggerClick))
        }
      }, [api_element("div", {
        className: $cmp.computedFormElementClass,
        attrs: {
          "role": "none"
        },
        key: 3
      }, [$cmp.hasInputPill ? api_custom_element("lightning-icon", _lightningIcon, {
        classMap: {
          "slds-icon_container": true,
          "slds-combobox__input-entity-icon": true
        },
        props: {
          "iconName": $cmp.inputPill.iconName,
          "alternativeText": $cmp.inputPill.iconAlternativeText,
          "size": "x-small"
        },
        key: 5
      }, []) : null, api_element("input", {
        className: $cmp.computedInputClass,
        attrs: {
          "id": api_scoped_id("input"),
          "type": "text",
          "role": "textbox",
          "autocomplete": "off",
          "name": $cmp.name,
          "placeholder": $cmp.computedPlaceholder,
          "maxlength": $cmp.inputMaxlength,
          "aria-autocomplete": $cmp.computedAriaAutocomplete,
          "aria-label": $cmp.inputLabel
        },
        props: {
          "value": $cmp.computedInputValue,
          "disabled": $cmp.disabled,
          "readOnly": $cmp._inputReadOnly
        },
        key: 6,
        on: {
          "focus": _m0 || ($ctx._m0 = api_bind($cmp.handleFocus)),
          "select": _m1 || ($ctx._m1 = api_bind($cmp.handleInputSelect)),
          "change": _m2 || ($ctx._m2 = api_bind($cmp.handleTextChange)),
          "input": _m3 || ($ctx._m3 = api_bind($cmp.handleInput)),
          "keydown": _m4 || ($ctx._m4 = api_bind($cmp.handleInputKeyDown)),
          "blur": _m5 || ($ctx._m5 = api_bind($cmp.handleBlur))
        }
      }, []), $cmp.hasInputPill ? api_element("div", {
        classMap: {
          "slds-input__icon-group": true,
          "slds-input__icon-group_right": true
        },
        key: 8
      }, [api_element("button", {
        classMap: {
          "slds-button": true,
          "slds-button_icon": true,
          "slds-input__icon": true,
          "slds-input__icon_right": true
        },
        attrs: {
          "type": "button",
          "title": $cmp.i18n.pillCloseButtonAlternativeText
        },
        key: 9,
        on: {
          "click": _m6 || ($ctx._m6 = api_bind($cmp.handlePillRemove))
        }
      }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": "utility:close",
          "variant": "bare",
          "svgClass": "slds-button__icon"
        },
        key: 10
      }, []), api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 11
      }, [api_dynamic($cmp.i18n.pillCloseButtonAlternativeText)])])]) : null, !$cmp.hasInputPill ? api_element("div", {
        classMap: {
          "slds-input__icon-group": true,
          "slds-input__icon-group_right": true
        },
        key: 13
      }, [$cmp.showInputActivityIndicator ? api_element("div", {
        classMap: {
          "slds-spinner": true,
          "slds-spinner_brand": true,
          "slds-spinner_x-small": true,
          "slds-input__spinner": true
        },
        attrs: {
          "role": "status"
        },
        key: 15
      }, [api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 16
      }, [api_dynamic($cmp.i18n.loadingText)]), api_element("div", {
        classMap: {
          "slds-spinner__dot-a": true
        },
        key: 17
      }, []), api_element("div", {
        classMap: {
          "slds-spinner__dot-b": true
        },
        key: 18
      }, [])]) : null, $cmp.inputIconName ? api_custom_element("lightning-icon", _lightningIcon, {
        classMap: {
          "slds-input__icon": true,
          "slds-input__icon_right": true
        },
        props: {
          "alternativeText": $cmp.inputIconAlternativeText,
          "iconName": $cmp.inputIconName,
          "size": $cmp.inputIconSize
        },
        key: 20
      }, []) : null]) : null]), api_element("div", {
        className: $cmp.computedDropdownClass,
        attrs: {
          "id": api_scoped_id("dropdown-element"),
          "data-dropdown-element": true,
          "role": "listbox"
        },
        key: 21,
        on: {
          "scroll": _m9 || ($ctx._m9 = api_bind($cmp.handleListboxScroll)),
          "mousedown": _m10 || ($ctx._m10 = api_bind($cmp.handleDropdownMouseDown)),
          "mouseup": _m11 || ($ctx._m11 = api_bind($cmp.handleDropdownMouseUp)),
          "mouseleave": _m12 || ($ctx._m12 = api_bind($cmp.handleDropdownMouseLeave)),
          "click": _m13 || ($ctx._m13 = api_bind($cmp.handleOptionClick))
        }
      }, $cmp._hasDropdownOpened ? api_flatten([api_iterator($cmp._items, function (item) {
        return [!item.items ? api_custom_element("lightning-base-combobox-item", _lightningBaseComboboxItem, {
          classMap: {
            "slds-media": true,
            "slds-listbox__option": true,
            "slds-media_center": true
          },
          attrs: {
            "data-item-id": item.id,
            "data-value": item.value
          },
          props: {
            "role": "option",
            "item": item,
            "id": api_scoped_id(item.id)
          },
          key: api_key(25, item.value),
          on: {
            "mouseenter": _m7 || ($ctx._m7 = api_bind($cmp.handleOptionMouseEnter))
          }
        }, []) : null, item.items ? api_element("ul", {
          attrs: {
            "role": "group",
            "aria-label": item.label
          },
          key: api_key(27, item.label)
        }, api_flatten([item.label ? api_element("li", {
          classMap: {
            "slds-listbox__item": true
          },
          attrs: {
            "role": "presentation"
          },
          key: 29
        }, [api_element("div", {
          classMap: {
            "slds-media": true,
            "slds-listbox__option": true,
            "slds-listbox__option_plain": true,
            "slds-media_small": true
          },
          attrs: {
            "role": "presentation"
          },
          key: 30
        }, [api_element("h3", {
          classMap: {
            "slds-text-title_caps": true
          },
          attrs: {
            "role": "presentation",
            "title": item.label
          },
          key: 31
        }, [api_dynamic(item.label)])])]) : null, api_iterator(item.items, function (groupItem) {
          return api_element("li", {
            classMap: {
              "slds-listbox__item": true
            },
            attrs: {
              "role": "presentation"
            },
            key: api_key(33, groupItem.value)
          }, [api_custom_element("lightning-base-combobox-item", _lightningBaseComboboxItem, {
            classMap: {
              "slds-media": true,
              "slds-listbox__option": true,
              "slds-media_center": true
            },
            attrs: {
              "data-item-id": groupItem.id,
              "data-value": groupItem.value
            },
            props: {
              "role": "option",
              "item": groupItem,
              "id": api_scoped_id(groupItem.id)
            },
            key: 34,
            on: {
              "mouseenter": _m8 || ($ctx._m8 = api_bind($cmp.handleOptionMouseEnter))
            }
          }, [])]);
        })])) : null];
      }), $cmp.showDropdownActivityIndicator ? api_element("div", {
        classMap: {
          "slds-listbox__item": true
        },
        attrs: {
          "role": "presentation"
        },
        key: 36
      }, [api_element("div", {
        classMap: {
          "slds-align_absolute-center": true,
          "slds-p-top_medium": true
        },
        key: 37
      }, [api_element("div", {
        classMap: {
          "slds-spinner": true,
          "slds-spinner_x-small": true,
          "slds-spinner_inline": true
        },
        attrs: {
          "role": "status"
        },
        key: 38
      }, [api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 39
      }, [api_dynamic($cmp.i18n.loadingText)]), api_element("div", {
        classMap: {
          "slds-spinner__dot-a": true
        },
        key: 40
      }, []), api_element("div", {
        classMap: {
          "slds-spinner__dot-b": true
        },
        key: 41
      }, [])])])]) : null, $cmp.showAttribution ? api_element("div", {
        classMap: {
          "slds-align_absolute-center": true
        },
        key: 43
      }, [api_element("img", {
        classMap: {
          "slds-inline-logo": true
        },
        attrs: {
          "src": $cmp.attributionLogoUrl,
          "alt": $cmp.attributionLogoAssistiveText,
          "title": $cmp.attributionLogoAssistiveText
        },
        key: 44
      }, [])]) : null]) : [])])];
    }

    var _tmpl$f = lwc.registerTemplate(tmpl$g);
    tmpl$g.stylesheets = [];
    tmpl$g.stylesheetTokens = {
      hostAttribute: "lightning-baseCombobox_baseCombobox-host",
      shadowAttribute: "lightning-baseCombobox_baseCombobox"
    };

    var labelAriaSelectedOptions = 'Selected Options:';

    var labelDeselectOptionKeyboard = 'Press delete or backspace to remove';

    var labelLoadingText = 'Loading';

    var labelPillCloseButtonAlternativeText = 'Clear Selection';

    function preventDefaultAndStopPropagation$2(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    function handleEnterKey({
      event,
      currentIndex,
      dropdownInterface
    }) {
      preventDefaultAndStopPropagation$2(event);

      if (dropdownInterface.isDropdownVisible() && currentIndex >= 0) {
        dropdownInterface.selectByIndex(currentIndex);
      } else {
        dropdownInterface.openDropdownIfNotEmpty();
      }
    }

    function handlePageUpOrDownKey({
      event,
      currentIndex,
      dropdownInterface
    }) {
      preventDefaultAndStopPropagation$2(event);

      if (!dropdownInterface.isDropdownVisible()) {
        dropdownInterface.openDropdownIfNotEmpty();
      }

      const pageUpDownOptionSkipCount = 10;

      if (dropdownInterface.getTotalOptions() > 0) {
        requestAnimationFrame(() => {
          let highlightIndex = 0;

          if (event.key === 'PageUp') {
            highlightIndex = Math.max(currentIndex - pageUpDownOptionSkipCount, 0);
          } else {
            // Jump 10 options down
            highlightIndex = Math.min(currentIndex + pageUpDownOptionSkipCount, dropdownInterface.getTotalOptions() - 1);
          }

          dropdownInterface.highlightOptionWithIndex(highlightIndex);
        });
      }
    }

    function handleHomeOrEndKey({
      event,
      dropdownInterface
    }) {
      // If not a read-only input we want the default browser behaviour
      if (!dropdownInterface.isInputReadOnly()) {
        return;
      }

      preventDefaultAndStopPropagation$2(event);

      if (!dropdownInterface.isDropdownVisible()) {
        dropdownInterface.openDropdownIfNotEmpty();
      }

      if (dropdownInterface.getTotalOptions() > 0) {
        requestAnimationFrame(() => {
          const highlightIndex = event.key === 'Home' ? 0 : dropdownInterface.getTotalOptions() - 1;
          dropdownInterface.highlightOptionWithIndex(highlightIndex);
        });
      }
    }

    function handleUpOrDownKey({
      event,
      currentIndex,
      dropdownInterface
    }) {
      preventDefaultAndStopPropagation$2(event);

      if (!dropdownInterface.isDropdownVisible()) {
        dropdownInterface.openDropdownIfNotEmpty();
      }

      const isUpKey = event.key === 'Up' || event.key === 'ArrowUp';
      let nextIndex;

      if (currentIndex >= 0) {
        nextIndex = isUpKey ? currentIndex - 1 : currentIndex + 1;

        if (nextIndex >= dropdownInterface.getTotalOptions()) {
          nextIndex = 0;
        } else if (nextIndex < 0) {
          nextIndex = dropdownInterface.getTotalOptions() - 1;
        }
      } else {
        nextIndex = isUpKey ? dropdownInterface.getTotalOptions() - 1 : 0;
      }

      if (dropdownInterface.getTotalOptions() > 0) {
        requestAnimationFrame(() => {
          dropdownInterface.highlightOptionWithIndex(nextIndex);
        });
      }
    }

    function handleEscapeOrTabKey({
      event,
      dropdownInterface
    }) {
      if (dropdownInterface.isDropdownVisible()) {
        event.stopPropagation();
        dropdownInterface.closeDropdown();
      }
    }

    function handleTypedCharacters({
      event,
      currentIndex,
      dropdownInterface
    }) {
      if (!dropdownInterface.isDropdownVisible()) {
        dropdownInterface.openDropdownIfNotEmpty();
      }

      if (dropdownInterface.isInputReadOnly()) {
        // The element should be read only, it's a work-around for IE11 as it will still make editable an input
        // that has focus and was dynamically changed to be readonly on focus change. Remove once we no longer
        // support IE11
        event.preventDefault();
        requestAnimationFrame(() => runActionOnBufferedTypedCharacters(event, dropdownInterface.highlightOptionWithText.bind(this, currentIndex || 0)));
      }
    }

    const eventKeyToHandlerMap = {
      Enter: handleEnterKey,
      PageUp: handlePageUpOrDownKey,
      PageDown: handlePageUpOrDownKey,
      Home: handleHomeOrEndKey,
      End: handleHomeOrEndKey,
      Down: handleUpOrDownKey,
      // IE11/Edge specific
      Up: handleUpOrDownKey,
      // IE11/Edge specific
      ArrowUp: handleUpOrDownKey,
      ArrowDown: handleUpOrDownKey,
      Esc: handleEscapeOrTabKey,
      // IE11/Edge specific
      Escape: handleEscapeOrTabKey,
      Tab: handleEscapeOrTabKey
    };
    function handleKeyDownOnInput({
      event,
      currentIndex,
      dropdownInterface
    }) {
      const parameters = {
        event,
        currentIndex,
        dropdownInterface
      };

      if (eventKeyToHandlerMap[event.key]) {
        eventKeyToHandlerMap[event.key](parameters);
      } else {
        handleTypedCharacters(parameters);
      }
    }

    class BaseComboboxEvents {
      constructor(baseCombobox) {
        this.dispatchEvent = baseCombobox.dispatchEvent.bind(baseCombobox);
      }

      dispatchPillRemove(pill) {
        this.dispatchEvent(new CustomEvent('pillremove', {
          detail: {
            item: pill
          }
        }));
      }

      dispatchEndReached() {
        this.dispatchEvent(new CustomEvent('endreached'));
      }

      dispatchFocus() {
        this.dispatchEvent(new CustomEvent('focus'));
      }

      dispatchBlur() {
        this.dispatchEvent(new CustomEvent('blur'));
      }

      dispatchTextInput(text) {
        this.dispatchEvent(new CustomEvent('textinput', {
          detail: {
            text
          }
        }));
      }

      dispatchTextChange(text) {
        this.dispatchEvent(new CustomEvent('textchange', {
          detail: {
            text
          }
        }));
      }

      dispatchSelect(value) {
        this.dispatchEvent(new CustomEvent('select', {
          detail: {
            value
          }
        }));
      }

      dispatchDropdownOpen() {
        this.dispatchEvent(new CustomEvent('dropdownopen'));
      }

      dispatchDropdownOpenRequest() {
        this.dispatchEvent(new CustomEvent('dropdownopenrequest'));
      }

    }

    const i18n$6 = {
      ariaSelectedOptions: labelAriaSelectedOptions,
      deselectOptionKeyboard: labelDeselectOptionKeyboard,
      pillCloseButtonAlternativeText: labelPillCloseButtonAlternativeText,
      loadingText: labelLoadingText
    };
    const ARIA_CONTROLS$1 = 'aria-controls';
    const ARIA_LABELLEDBY$1 = 'aria-labelledby';
    const ARIA_DESCRIBEDBY$2 = 'aria-describedby';
    const ARIA_LABEL$1 = 'aria-label';
    const ARIA_ACTIVEDESCENDANT = 'aria-activedescendant';

    class LightningBaseCombobox extends lwc.LightningElement {
      constructor() {
        super();
        this.inputText = '';
        this.inputIconName = 'utility:down';
        this.inputIconSize = 'x-small';
        this.inputIconAlternativeText = void 0;
        this.inputMaxlength = void 0;
        this.showInputActivityIndicator = false;
        this.dropdownAlignment = 'left';
        this.placeholder = 'Select an Item';
        this.inputLabel = void 0;
        this.name = void 0;
        this.inputPill = void 0;
        this.attributionLogoUrl = void 0;
        this.attributionLogoAssistiveText = void 0;
        this._showDropdownActivityIndicator = false;
        this._items = [];
        this._disabled = false;
        this._dropdownVisible = false;
        this._hasDropdownOpened = false;
        this._highlightedOptionElementId = null;
        this._variant = void 0;
        this._dropdownHeight = 'standard';
        this._readonly = false;
        this._logoLoaded = false;
        this._inputDescribedBy = [];
        this._inputAriaControls = void 0;
        this._activeElementDomId = void 0;
        this._events = new BaseComboboxEvents(this);
      }

      renderedCallback() {
        this.dispatchEvent(new CustomEvent('ready', {
          detail: {
            id: this.inputId,
            name: this.name
          }
        }));
        this.synchronizeA11y();
      }

      connectedCallback() {
        this.classList.add('slds-combobox_container');
        this._connected = true;
        this._keyboardInterface = this.dropdownKeyboardInterface();
      }

      disconnectedCallback() {
        this._connected = false;
        this._listBoxElementCache = undefined;
      }

      get inputControlsElement() {
        return this._inputAriaControls;
      }

      set inputControlsElement(el) {
        this._inputAriaControls = el;
        this.synchronizeA11y();
      }

      get inputDescribedByElements() {
        return this._inputDescribedBy;
      }

      set inputDescribedByElements(elements) {
        if (Array.isArray(elements)) {
          this._inputDescribedBy = elements;
        } else {
          this._inputDescribedBy = [elements];
        }

        this.synchronizeA11y();
      }

      get inputLabelledByElement() {
        return this._inputLabelledBy;
      }

      set inputLabelledByElement(el) {
        this._inputLabelledBy = el;
        this.synchronizeA11y();
      }

      get inputLabelledById() {
        return getRealDOMId(this._inputLabelledBy);
      }

      get inputAriaControlsId() {
        return getRealDOMId(this._inputAriaControls);
      }

      get inputId() {
        return getRealDOMId(this.template.querySelector('input'));
      }

      get computedAriaDescribedBy() {
        const ariaValues = [];

        this._inputDescribedBy.forEach(el => {
          ariaValues.push(getRealDOMId(el));
        });

        return normalizeAriaAttribute(ariaValues);
      }

      get dropdownHeight() {
        return this._dropdownHeight;
      }

      set dropdownHeight(height) {
        this._dropdownHeight = normalizeString(height, {
          fallbackValue: 'standard',
          validValues: ['standard', 'small']
        });
      }

      get showDropdownActivityIndicator() {
        return this._showDropdownActivityIndicator;
      }

      set showDropdownActivityIndicator(value) {
        this._showDropdownActivityIndicator = normalizeBoolean(value);

        if (this._connected) {
          if (this._showDropdownActivityIndicator) {
            if (this._shouldOpenDropDown) {
              this.openDropdownIfNotEmpty();
            }
          } else if (this._dropdownVisible && this.isDropdownEmpty) {
            this.closeDropdown();
          }
        }
      }

      get disabled() {
        return this._disabled;
      }

      set disabled(value) {
        this._disabled = normalizeBoolean(value);

        if (this._disabled && this._dropdownVisible) {
          this.closeDropdown();
        }
      }

      get readOnly() {
        return this._readonly;
      }

      set readOnly(value) {
        this._readonly = normalizeBoolean(value);

        if (this._readonly && this._dropdownVisible) {
          this.closeDropdown();
        }
      }

      get variant() {
        return this._variant || VARIANT.STANDARD;
      }

      set variant(value) {
        this._variant = normalizeString(value, {
          fallbackValue: VARIANT.STANDARD,
          validValues: [VARIANT.STANDARD, 'lookup']
        });
      }

      get items() {
        return this._unprocessedItems;
      }

      set items(items = []) {
        this._unprocessedItems = items;

        if (this._connected) {
          if (this._hasDropdownOpened) {
            // The dropdown has already been opened at least once, so process the items immediately
            this.updateItems(items);

            if (this._dropdownVisible) {
              // The dropdown is visible but there are no items to show, close it
              if (this.isDropdownEmpty) {
                this.closeDropdown();
              } else {
                // We have new items, update highlight
                this.highlightDefaultItem(); // Since the items have changed, the positioning should be recomputed

                this.startDropdownAutoPositioning();
              }
            }
          }

          if (this._shouldOpenDropDown) {
            this.openDropdownIfNotEmpty();
          }
        }
      }

      highlightInputText() {
        if (this._connected) {
          // Safari has issues with invoking set selection range immediately in the 'focus' handler, instead
          // we'd be doing it in an animation frame. Remove the requestAnimationFrame once/if this is fixed
          // in Safari
          requestAnimationFrame(() => {
            const {
              inputElement
            } = this;
            inputElement.setSelectionRange(0, inputElement.value.length);
          });
        }
      }

      get showAttribution() {
        return this.attributionLogoUrl;
      }

      focus() {
        if (this._connected) {
          this.inputElement.focus();
        }
      }

      focusAndOpenDropdownIfNotEmpty() {
        if (this._connected) {
          if (!this._inputHasFocus) {
            this.focus();
          }

          this.openDropdownIfNotEmpty();
        }
      }

      blur() {
        if (this._connected) {
          this.inputElement.blur();
        }
      }

      synchronizeA11y() {
        const input = this.template.querySelector('input');

        if (!input) {
          return;
        }

        synchronizeAttrs(input, {
          [ARIA_LABELLEDBY$1]: this.inputLabelledById,
          [ARIA_DESCRIBEDBY$2]: this.computedAriaDescribedBy,
          [ARIA_ACTIVEDESCENDANT]: this._activeElementDomId,
          [ARIA_CONTROLS$1]: this.computedInputControls,
          [ARIA_LABEL$1]: this.inputLabel
        });
      }

      itemId(index) {
        return this.inputId + '-' + index;
      }

      itemIndexFromId(id) {
        // Extracts the index from an item id.
        return parseInt(id.substring(id.lastIndexOf('-') + 1), 10);
      }

      processItem(item) {
        const itemCopy = {}; // Supported item properties:
        // 'type' (string): option-inline, option-card
        // 'highlight' (boolean): Whether to highlight the item when dropdown opens
        // 'iconName': left icon name
        // 'iconSize': left icon size
        // 'iconAlternativeText': assistive text for the left icon
        // 'rightIconName': right icon name
        // 'rightIconSize': right icon size
        // 'rightIconAlternativeText': assistive text for the right icon
        // 'text': text to display
        // 'subText': sub-text to display (only option-card supports it)
        // 'value': value associated with the option

        itemCopy.type = item.type;
        itemCopy.iconName = item.iconName;
        itemCopy.iconSize = item.iconSize;
        itemCopy.iconAlternativeText = item.iconAlternativeText;
        itemCopy.rightIconName = item.rightIconName;
        itemCopy.rightIconSize = item.rightIconSize;
        itemCopy.rightIconAlternativeText = item.rightIconAlternativeText;
        itemCopy.text = item.text;
        itemCopy.subText = item.subText;
        itemCopy.value = item.value; // extra metadata needed

        itemCopy.selectable = ['option-card', 'option-inline'].indexOf(item.type) >= 0;

        if (itemCopy.selectable) {
          itemCopy.index = this._selectableItems;
          itemCopy.id = this.itemId(itemCopy.index);
          this._selectableItems += 1;

          if (item.highlight) {
            this._highlightedItemIndex = itemCopy.index;
          }
        }

        return itemCopy;
      }

      get _inputReadOnly() {
        return this._readonly || this.variant === VARIANT.STANDARD || this.hasInputPill;
      }

      get computedAriaAutocomplete() {
        if (this.hasInputPill) {
          // no aria-autocomplete when pill is showing
          return null;
        }

        return this._inputReadOnly ? 'none' : 'list';
      }

      get computedPlaceholder() {
        return this.hasInputPill ? this.inputPill.label : this.placeholder;
      }

      get computedInputValue() {
        return this.hasInputPill ? this.inputPill.label : this.inputText;
      }

      handleListboxScroll(event) {
        const listbox = event.target;
        const height = listbox.getBoundingClientRect().height;
        const maxScroll = listbox.scrollHeight - height;
        const bottomReached = listbox.scrollTop >= maxScroll;

        if (bottomReached) {
          this._events.dispatchEndReached();
        }
      }

      get listboxElement() {
        if (!this._listBoxElementCache) {
          this._listBoxElementCache = this.template.querySelector('[role="listbox"]');
        }

        return this._listBoxElementCache;
      }

      get computedUniqueElementId() {
        return this.inputId;
      }

      get computedUniqueDropdownElementId() {
        return getRealDOMId(this.template.querySelector('[data-dropdown-element]'));
      }

      get computedInputControls() {
        const ariaValues = [this.computedUniqueDropdownElementId];

        if (this.inputControlsElement) {
          ariaValues.push(this.inputAriaControlsId);
        }

        return normalizeAriaAttribute(ariaValues);
      }

      get i18n() {
        return i18n$6;
      }

      get computedDropdownTriggerClass() {
        return classSet('slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click').add({
          'slds-is-open': this._dropdownVisible
        }).toString();
      }

      get computedDropdownClass() {
        const alignment = this.dropdownAlignment;
        return classSet('slds-listbox slds-listbox_vertical slds-dropdown slds-dropdown_fluid').add({
          'slds-dropdown_length-with-icon-10': this._dropdownHeight === 'standard',
          'slds-dropdown_length-with-icon-5': this._dropdownHeight === 'small',
          'slds-dropdown_left': alignment === 'left' || alignment === 'auto',
          'slds-dropdown_center': alignment === 'center',
          'slds-dropdown_right': alignment === 'right',
          'slds-dropdown_bottom': alignment === 'bottom-center',
          'slds-dropdown_bottom slds-dropdown_right slds-dropdown_bottom-right': alignment === 'bottom-right',
          'slds-dropdown_bottom slds-dropdown_left slds-dropdown_bottom-left': alignment === 'bottom-left'
        }).toString();
      }

      get computedInputClass() {
        const classes = classSet('slds-input slds-combobox__input');

        if (this.hasInputPill) {
          classes.add('slds-combobox__input-value');
        } else {
          classes.add({
            'slds-input-has-icon_group-right': this.showInputActivityIndicator
          });
        }

        return classes.toString();
      }

      get _shouldOpenDropDown() {
        // If items were empty and through a user interaction the dropdown should have opened, and if the
        // component still has the focus we'll open it on items update instead.
        return !this.dropdownDisabled && this._inputHasFocus && this._requestedDropdownOpen;
      }

      get dropdownDisabled() {
        return this.readOnly || this.disabled;
      }

      handleOptionClick(event) {
        if (event.target.hasAttribute('aria-selected')) {
          event.stopPropagation();
          event.preventDefault();
          this.selectOptionAndCloseDropdown(event.target);
        }
      }

      handleOptionMouseEnter(event) {
        if (event.target.hasAttribute('aria-selected')) {
          this.highlightOption(event.target);
        }
      }

      handleDropdownMouseLeave() {
        this.removeHighlight(); // This is to account for when a user makes a mousedown press on the dropdown and then leaves the dropdown
        // area, it would leave the dropdown open even though the focus would no longer be on the input

        if (!this._inputHasFocus) {
          this.closeDropdown();
        }
      }

      handleTriggerClick(event) {
        event.stopPropagation();
        this.allowBlur();

        if (this.dropdownDisabled) {
          return;
        }

        if (!this.hasInputPill) {
          // toggle dropdown only for readonly combobox, only open the dropdown otherwise
          // if it's not already opened.
          if (this._inputReadOnly) {
            if (this._dropdownVisible) {
              this.closeDropdown();
            } else {
              this.openDropdownIfNotEmpty();
            }
          } else {
            this.openDropdownIfNotEmpty();
          }

          this.inputElement.focus();
        }
      }

      handlePillKeyDown(event) {
        if (this.dropdownDisabled) {
          return;
        } // 'Del' is IE11 specific, remove once IE11 is no longer supported


        if (event.key === 'Delete' || event.key === 'Del') {
          this.handlePillRemove();
        }
      }

      handleInputKeyDown(event) {
        if (this.dropdownDisabled) {
          return;
        }

        if (this.hasInputPill) {
          this.handlePillKeyDown(event);
        } else {
          handleKeyDownOnInput({
            event,
            currentIndex: this.getCurrentHighlightedOptionIndex(),
            dropdownInterface: this._keyboardInterface
          });
        }
      }

      handleTextChange() {
        this._events.dispatchTextChange(this.inputElement.value);
      }

      handleFocus() {
        this._inputHasFocus = true;

        this._events.dispatchFocus();
      }

      handleInput() {
        this._events.dispatchTextInput(this.inputElement.value);
      }

      handleBlur() {
        this._inputHasFocus = false;

        if (this._cancelBlur) {
          return;
        }

        this.closeDropdown();

        this._events.dispatchBlur();
      }

      handleDropdownMouseDown(event) {
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

      highlightOption(option) {
        this.removeHighlight();

        if (option) {
          option.highlight();
          this._highlightedOptionElement = option;
          this._highlightedOptionElementId = option.getAttribute('data-item-id'); // active element is a component id getter works properly

          this._activeElementDomId = option.id;
        }

        this.synchronizeA11y();
      }

      highlightOptionAndScrollIntoView(optionElement) {
        if (this._selectableItems.length === 0 || !optionElement) {
          return;
        }

        this.highlightOption(optionElement);
        scrollIntoViewIfNeeded(optionElement, this.listboxElement);
      }

      removeHighlight() {
        const option = this._highlightedOptionElement;

        if (option) {
          option.removeHighlight();
          this._highlightedOptionElement = null;
          this._highlightedOptionElementId = null;
          this._activeElementDomId = null;
        }
      }

      selectOptionAndCloseDropdown(optionElement) {
        this.closeDropdown();
        this.inputElement.focus();
        const value = optionElement.getAttribute('data-value');

        this._events.dispatchSelect(value);
      }

      handleInputSelect(event) {
        event.stopPropagation();
      }

      openDropdownIfNotEmpty() {
        if (this._dropdownVisible) {
          // Already visible
          return;
        }

        const noOptions = !Array.isArray(this.items) || this.items.length === 0;

        if (noOptions) {
          // Dispatch dropdown open request
          this._events.dispatchDropdownOpenRequest();
        } // Do not open if there's nothing to show in the dropdown (eg. no options and no dropdown activity indicator)


        if (this.isDropdownEmpty) {
          // We use this attribute to flag whether an attempt has been made via user-interaction
          // to open the dropdown
          this._requestedDropdownOpen = true;
          return;
        }

        if (!this._hasDropdownOpened) {
          if (this._unprocessedItems) {
            this.updateItems(this._unprocessedItems);
          }

          this._hasDropdownOpened = true;
        }

        this._requestedDropdownOpen = false;
        this._dropdownVisible = true;
        this.startDropdownAutoPositioning();
        this.highlightDefaultItem();

        this._events.dispatchDropdownOpen();
      }

      closeDropdown() {
        if (!this._dropdownVisible) {
          // Already closed
          return;
        }

        this.stopDropdownPositioning();
        this.removeHighlight();
        this._dropdownVisible = false;
      }

      findOptionElementByIndex(index) {
        return this.template.querySelector(`[data-item-id="${this.itemId(index)}"]`);
      }

      allowBlur() {
        this._cancelBlur = false;
      }

      cancelBlur() {
        this._cancelBlur = true;
      }

      getCurrentHighlightedOptionIndex() {
        if (this._highlightedOptionElementId && this._highlightedOptionElementId.length > 0) {
          return this.itemIndexFromId(this._highlightedOptionElementId);
        }

        return -1;
      }

      get inputElement() {
        return this.template.querySelector('input');
      }

      startDropdownAutoPositioning() {
        if (this.dropdownAlignment !== 'auto') {
          return;
        }

        if (!this._autoPosition) {
          this._autoPosition = new AutoPosition(this);
        }

        this._autoPosition.start({
          target: () => this.template.querySelector('input'),
          element: () => this.template.querySelector('div.slds-dropdown'),
          align: {
            horizontal: Direction.Left,
            vertical: Direction.Top
          },
          targetAlign: {
            horizontal: Direction.Left,
            vertical: Direction.Bottom
          },
          autoFlip: true,
          alignWidth: true,
          autoShrinkHeight: true
        });
      }

      stopDropdownPositioning() {
        if (this._autoPosition) {
          this._autoPosition.stop();
        }
      }

      get hasInputPill() {
        return this.inputPill && Object.keys(this.inputPill).length > 0;
      }

      handlePillRemove() {
        this.inputElement.focus();

        this._events.dispatchPillRemove(this.inputPill);
      }

      get computedFormElementClass() {
        const hasIcon = this.hasInputPill && this.inputPill.iconName;
        return classSet('slds-combobox__form-element slds-input-has-icon').add({
          'slds-input-has-icon_right': !hasIcon,
          'slds-input-has-icon_left-right': hasIcon
        }).toString();
      }

      get computedAriaExpanded() {
        return this._dropdownVisible ? 'true' : 'false';
      }

      updateItems(items) {
        if (!items) {
          return;
        }

        assert$1(Array.isArray(items), '"items" must be an array');
        this._selectableItems = 0;
        this._highlightedItemIndex = 0;
        this._items = items.map(item => {
          if (item.items) {
            // This is a group
            const groupCopy = {
              label: item.label
            };
            groupCopy.items = item.items.map(groupItem => {
              return this.processItem(groupItem);
            });
            return groupCopy;
          }

          return this.processItem(item);
        });
      }

      highlightDefaultItem() {
        this.removeHighlight();
        requestAnimationFrame(() => {
          this.highlightOptionAndScrollIntoView(this.findOptionElementByIndex(this._highlightedItemIndex));
        });
      }

      get isDropdownEmpty() {
        // If the activity indicator is showing then it's not empty
        return !this.showDropdownActivityIndicator && (!Array.isArray(this.items) || this.items.length === 0);
      }

      dropdownKeyboardInterface() {
        const that = this;
        return {
          getTotalOptions() {
            return that._selectableItems;
          },

          selectByIndex(index) {
            that.selectOptionAndCloseDropdown(that.findOptionElementByIndex(index));
          },

          highlightOptionWithIndex(index) {
            that.highlightOptionAndScrollIntoView(that.findOptionElementByIndex(index));
          },

          isInputReadOnly() {
            return that._inputReadOnly;
          },

          highlightOptionWithText(currentIndex, text) {
            // This only supports a flat structure, groups are not supported
            for (let index = currentIndex + 1; index < that._items.length; index++) {
              const option = that._items[index];

              if (option.selectable && option.text && option.text.toLowerCase().indexOf(text.toLowerCase()) === 0) {
                that.highlightOptionAndScrollIntoView(that.findOptionElementByIndex(index));
                return;
              }
            }

            for (let index = 0; index < currentIndex; index++) {
              const option = that._items[index];

              if (option.selectable && option.text && option.text.toLowerCase().indexOf(text.toLowerCase()) === 0) {
                that.highlightOptionAndScrollIntoView(that.findOptionElementByIndex(index));
                return;
              }
            }
          },

          isDropdownVisible() {
            return that._dropdownVisible;
          },

          openDropdownIfNotEmpty() {
            that.openDropdownIfNotEmpty();
          },

          closeDropdown() {
            that.closeDropdown();
          }

        };
      }

    }

    LightningBaseCombobox.delegatesFocus = true;

    lwc.registerDecorators(LightningBaseCombobox, {
      publicProps: {
        inputText: {
          config: 0
        },
        inputIconName: {
          config: 0
        },
        inputIconSize: {
          config: 0
        },
        inputIconAlternativeText: {
          config: 0
        },
        inputMaxlength: {
          config: 0
        },
        showInputActivityIndicator: {
          config: 0
        },
        dropdownAlignment: {
          config: 0
        },
        placeholder: {
          config: 0
        },
        inputLabel: {
          config: 0
        },
        name: {
          config: 0
        },
        inputPill: {
          config: 0
        },
        attributionLogoUrl: {
          config: 0
        },
        attributionLogoAssistiveText: {
          config: 0
        },
        inputControlsElement: {
          config: 3
        },
        inputDescribedByElements: {
          config: 3
        },
        inputLabelledByElement: {
          config: 3
        },
        dropdownHeight: {
          config: 3
        },
        showDropdownActivityIndicator: {
          config: 3
        },
        disabled: {
          config: 3
        },
        readOnly: {
          config: 3
        },
        variant: {
          config: 3
        },
        items: {
          config: 3
        }
      },
      publicMethods: ["highlightInputText", "focus", "focusAndOpenDropdownIfNotEmpty", "blur"],
      track: {
        _showDropdownActivityIndicator: 1,
        _items: 1,
        _disabled: 1,
        _dropdownVisible: 1,
        _hasDropdownOpened: 1,
        _highlightedOptionElementId: 1,
        _variant: 1,
        _dropdownHeight: 1,
        _readonly: 1,
        _logoLoaded: 1
      }
    });

    var _lightningBaseCombobox = lwc.registerComponent(LightningBaseCombobox, {
      tmpl: _tmpl$f
    });

    function scrollIntoViewIfNeeded(element, scrollingParent) {
      const parentRect = scrollingParent.getBoundingClientRect();
      const findMeRect = element.getBoundingClientRect();

      if (findMeRect.top < parentRect.top) {
        if (element.offsetTop + findMeRect.height < parentRect.height) {
          // If element fits by scrolling to the top, then do that
          scrollingParent.scrollTop = 0;
        } else {
          // Otherwise, top align the element
          scrollingParent.scrollTop = element.offsetTop;
        }
      } else if (findMeRect.bottom > parentRect.bottom) {
        // bottom align the element
        scrollingParent.scrollTop += findMeRect.bottom - parentRect.bottom;
      }
    }

    function tmpl$h($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element,
        d: api_dynamic,
        c: api_custom_element,
        b: api_bind,
        gid: api_scoped_id
      } = $api;
      const {
        _m0,
        _m1,
        _m2,
        _m3,
        _m4,
        _m5,
        _m6
      } = $ctx;
      return [api_element("label", {
        className: $cmp.computedLabelClass,
        key: 2
      }, [$cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true
        },
        attrs: {
          "title": $cmp.i18n.required
        },
        key: 4
      }, [api_text("*")]) : null, api_dynamic($cmp.label)]), $cmp.fieldLevelHelp ? api_custom_element("lightning-helptext", _lightningHelptext, {
        props: {
          "content": $cmp.fieldLevelHelp
        },
        key: 5
      }, []) : null, api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 6
      }, [api_custom_element("lightning-base-combobox", _lightningBaseCombobox, {
        props: {
          "dropdownHeight": "small",
          "name": $cmp.name,
          "variant": "lookup",
          "placeholder": $cmp.placeholder,
          "disabled": $cmp.disabled,
          "readOnly": $cmp.readOnly,
          "items": $cmp.items,
          "inputText": $cmp.displayValue,
          "inputIconName": "utility:clock",
          "inputLabel": $cmp.ariaLabel,
          "inputControlsElement": $cmp.ariaControlsElement,
          "inputLabelledByElement": $cmp.ariaLabelledByElement,
          "dropdownAlignment": "auto"
        },
        key: 7,
        on: {
          "ready": _m0 || ($ctx._m0 = api_bind($cmp.handleReady)),
          "textchange": _m1 || ($ctx._m1 = api_bind($cmp.handleInputChange)),
          "textinput": _m2 || ($ctx._m2 = api_bind($cmp.handleTextInput)),
          "dropdownopenrequest": _m3 || ($ctx._m3 = api_bind($cmp.handleDropdownOpenRequest)),
          "focus": _m4 || ($ctx._m4 = api_bind($cmp.handleFocus)),
          "blur": _m5 || ($ctx._m5 = api_bind($cmp.handleBlur)),
          "select": _m6 || ($ctx._m6 = api_bind($cmp.handleTimeSelect))
        }
      }, [])]), $cmp._errorMessage ? api_element("div", {
        classMap: {
          "slds-form-element__help": true
        },
        attrs: {
          "id": api_scoped_id("error-message"),
          "data-error-message": true,
          "aria-live": "assertive"
        },
        key: 9
      }, [api_dynamic($cmp._errorMessage)]) : null];
    }

    var _tmpl$g = lwc.registerTemplate(tmpl$h);
    tmpl$h.stylesheets = [];
    tmpl$h.stylesheetTokens = {
      hostAttribute: "lightning-timepicker_timepicker-host",
      shadowAttribute: "lightning-timepicker_timepicker"
    };

    /* returns the closes time in the list that should be highlighted in case the value is not in the list. E.g.
    - if value is 16:18 and the list has 15 minute intervals, returns 16:30
    */

    function getTimeToHighlight(value, step) {
      const selectedTime = parseTime(value);

      if (!selectedTime) {
        return null;
      }

      selectedTime.setSeconds(0, 0);
      let closestHour = selectedTime.getHours();
      let closestMinute = selectedTime.getMinutes();
      const mod = closestMinute % step;
      const quotient = Math.floor(closestMinute / step);

      if (mod !== 0) {
        const multiplier = mod < step / 2 ? quotient : quotient + 1;
        closestMinute = multiplier * step;

        if (closestMinute >= 60) {
          if (closestHour === 23) {
            closestMinute -= step;
          } else {
            closestMinute = 0;
            closestHour++;
          }
        }

        selectedTime.setHours(closestHour);
        selectedTime.setMinutes(closestMinute);
      }

      return formatTime$1(selectedTime, STANDARD_TIME_FORMAT);
    }

    const i18n$7 = {
      invalidDate: labelInvalidDate,
      rangeOverflow: labelRangeOverflow$1,
      rangeUnderflow: labelRangeUnderflow$1,
      required: labelRequired
    };
    const STEP = 15; // in minutes

    const TIME_STYLE = {
      SHORT: 'short',
      MEDIUM: 'medium',
      LONG: 'long'
    };

    class LightningTimePicker extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this._disabled = false;
        this._required = false;
        this._displayValue = null;
        this._value = null;
        this._items = [];
        this._fieldLevelHelp = void 0;
        this._variant = 'lookup';
        this._mainInputId = void 0;
        this._errorMessage = void 0;
        this._readonly = true;
        this._describedByElements = [];
        this.label = void 0;
        this.name = void 0;
        this.max = void 0;
        this.min = void 0;
        this.placeholder = '';
        this.ariaLabelledByElement = void 0;
        this.ariaControlsElement = void 0;
        this.ariaLabel = void 0;
        this.messageWhenValueMissing = void 0;
        this._ariaDescribedByElements = void 0;
      }

      get messageWhenBadInput() {
        return this._messageWhenBadInput || this.formatString(i18n$7.invalidDate, this.timeFormat);
      }

      set messageWhenBadInput(message) {
        this._messageWhenBadInput = message;
      }

      get messageWhenRangeOverflow() {
        // using isoValue since the manually entered time could have seconds/milliseconds and the locale format generally doesn't have this precision
        return this._messageWhenRangeOverflow || this.formatString(i18n$7.rangeOverflow, normalizeISOTime(this.max, this.timeFormat).isoValue);
      }

      set messageWhenRangeOverflow(message) {
        this._messageWhenRangeOverflow = message;
      }

      get messageWhenRangeUnderflow() {
        return this._messageWhenRangeUnderflow || this.formatString(i18n$7.rangeUnderflow, normalizeISOTime(this.min, this.timeFormat).isoValue);
      }

      set messageWhenRangeUnderflow(message) {
        this._messageWhenRangeUnderflow = message;
      }

      set ariaDescribedByElements(el) {
        if (Array.isArray(el)) {
          this._ariaDescribedByElements = el;
        } else {
          this.ariaDescribedByElements = [el];
        }
      }

      get ariaDescribedByElements() {
        return this._ariaDescribedByElements;
      }

      get value() {
        return this._value;
      }

      set value(newValue) {
        const normalizedValue = this.normalizeInputValue(newValue);

        if (normalizedValue !== this._value) {
          const normalizedTime = normalizeISOTime(normalizedValue, this.timeFormat);
          this._value = normalizedTime.isoValue;
          this._displayValue = normalizedTime.displayValue;
        }
      }

      get disabled() {
        return this._disabled;
      }

      set disabled(value) {
        this._disabled = normalizeBoolean(value);
      }

      get readOnly() {
        return this._readonly;
      }

      set readOnly(value) {
        this._readonly = normalizeBoolean(value);

        if (this._readonly) {
          this._variant = VARIANT.STANDARD;
        }
      }

      get required() {
        return this._required;
      }

      set required(value) {
        this._required = normalizeBoolean(value);
      }

      hasBadInput() {
        return !!this._displayValue && this._value === null;
      }

      showHelpMessage(message) {
        if (!message) {
          this.classList.remove('slds-has-error');
          this._errorMessage = '';
        } else {
          this.classList.add('slds-has-error');
          this._errorMessage = message;
        }
      }

      set fieldLevelHelp(value) {
        this._fieldLevelHelp = value;
      }

      get fieldLevelHelp() {
        return this._fieldLevelHelp;
      }

      get variant() {
        return this._variant || VARIANT.STANDARD;
      }

      set variant(value) {
        this._variant = normalizeVariant(value);
      }
      /**
       * Sets focus on the input element.
       */


      focus() {
        if (this.connected) {
          this.getCombobox().focus();
        }
      }
      /**
       * Removes keyboard focus from the input element.
       */


      blur() {
        if (this.connected) {
          this.getCombobox().blur();
        }
      }

      get timeStyle() {
        return this._timeStyle;
      }

      set timeStyle(value) {
        this._timeStyle = normalizeString(value, {
          fallbackValue: TIME_STYLE.SHORT,
          validValues: [TIME_STYLE.SHORT, TIME_STYLE.MEDIUM, TIME_STYLE.LONG]
        });
        this.timeFormat = this.getTimeFormatFromStyle(this._timeStyle);
        const normalizedDate = normalizeISOTime(this._value, this.timeFormat);
        this._displayValue = normalizedDate.displayValue;
      }

      connectedCallback() {
        this.connected = true;
      }

      disconnectedCallback() {
        this.connected = false;
      }

      synchronizeA11y() {
        const label = this.template.querySelector('label');
        const comboBox = this.template.querySelector('lightning-base-combobox');
        let describedByElements = [];

        if (this._ariaDescribedByElements) {
          describedByElements = describedByElements.concat(this._ariaDescribedByElements);
        }

        const errorMessage = this.template.querySelector('[data-error-message]');

        if (errorMessage) {
          describedByElements.push(errorMessage);
        }

        comboBox.inputDescribedByElements = describedByElements;
        synchronizeAttrs(label, {
          for: this._mainInputId
        });
      }

      renderedCallback() {
        this.synchronizeA11y();
      }

      get displayValue() {
        return this._displayValue;
      }

      get items() {
        return this._items;
      }

      get i18n() {
        return i18n$7;
      }

      get isLabelHidden() {
        return this.variant === VARIANT.LABEL_HIDDEN;
      }

      get computedLabelClass() {
        return classSet('slds-form-element__label').add({
          'slds-assistive-text': this.isLabelHidden
        }).toString();
      }

      handleReady(e) {
        this._mainInputId = e.detail.id;
      }

      buildTimeList() {
        // We should always display the options in the short style since m/l will add an extra :00 to the options.
        const optionsTimeFormat = getLocale().shortTimeFormat;
        const timeList = [];
        const minTime = parseTime(this.normalizeInputValue(this.min));
        const minHour = minTime ? minTime.getHours() : 0;
        const maxTime = parseTime(this.normalizeInputValue(this.max));
        const maxHour = maxTime ? maxTime.getHours() + 1 : 24;
        const date = new Date();

        for (let hour = minHour; hour < maxHour; hour++) {
          for (let minutes = 0; minutes < 60; minutes += STEP) {
            date.setHours(hour, minutes);
            date.setSeconds(0, 0);

            if (this.isBeforeMinTime(date, minTime)) {
              continue; // eslint-disable-line no-continue
            }

            if (this.isAfterMaxTime(date, maxTime)) {
              break;
            } // @todo: should we always display it short in the combobox given that it makes no sense?


            timeList.push({
              type: 'option-inline',
              text: this.format(date, optionsTimeFormat),
              value: this.format(date)
            });
          }
        }

        return timeList;
      }

      get timeList() {
        if (!this._timeList) {
          this._timeList = this.buildTimeList();
        }

        if (!this._value) {
          return this._timeList;
        }

        const timeToHighlight = getTimeToHighlight(this._value, STEP);

        const timeList = this._timeList.map(item => {
          const itemCopy = Object.assign({}, item);

          if (item.value === this._value) {
            itemCopy.iconName = 'utility:check';
          }

          if (item.value === timeToHighlight) {
            itemCopy.highlight = true;
          }

          return itemCopy;
        });

        return timeList;
      }

      get timeFormat() {
        if (!this._timeFormat) {
          this._timeFormat = this.getTimeFormatFromStyle();
        }

        return this._timeFormat;
      }

      set timeFormat(value) {
        this._timeFormat = value;
      }

      getCombobox() {
        return this.template.querySelector('lightning-base-combobox');
      }

      handleFocus() {
        this.dispatchEvent(new CustomEvent('focus'));
      }

      handleBlur() {
        this.dispatchEvent(new CustomEvent('blur'));
      }

      handleInputChange(event) {
        event.preventDefault();
        event.stopPropagation(); // keeping the display value in sync with the element's value

        this._displayValue = event.detail.text;
        this._value = this.parseFormattedTime(this._displayValue);
        this._items = this.timeList;
        this.dispatchChangeEvent();
      }

      handleTextInput(event) {
        event.preventDefault();
        event.stopPropagation(); // keeping the display value in sync with the element's value

        this._displayValue = event.detail.text;
      }

      handleTimeSelect(event) {
        event.stopPropagation(); // for some reason this event is fired without detail from grouped-combobox

        if (!event.detail) {
          return;
        }

        this._value = event.detail.value;
        this._displayValue = normalizeISOTime(this._value, this.timeFormat).displayValue;
        this._items = this.timeList;
        this.dispatchChangeEvent();
      }

      handleDropdownOpenRequest() {
        this._items = this.timeList;
      }

      dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('change', {
          composed: true,
          bubbles: true,
          detail: {
            value: this._value
          }
        }));
      }

      normalizeInputValue(value) {
        if (!value || value === '') {
          return null;
        }

        return removeTimeZoneSuffix(value);
      }

      format(date, formatString) {
        return formatTime$1(date, formatString || STANDARD_TIME_FORMAT);
      }

      isBeforeMinTime(date, minTime) {
        const minDate = minTime || parseTime(this.normalizeInputValue(this.min));
        return minDate ? isBefore$1(date, minDate, 'minute') : false;
      }

      isAfterMaxTime(date, maxTime) {
        const maxDate = maxTime || parseTime(this.normalizeInputValue(this.max));
        return maxDate ? isAfter$1(date, maxDate, 'minute') : false;
      }

      getTimeFormatFromStyle(timeStyle) {
        let timeFormat;

        switch (timeStyle) {
          case TIME_STYLE.MEDIUM:
          case TIME_STYLE.LONG:
            timeFormat = getLocale().timeFormat;
            break;

          default:
            timeFormat = getLocale().shortTimeFormat;
            break;
        }

        return timeFormat;
      }

      get allowedTimeFormats() {
        // this method can't be static because at the time this file is interpreted,
        // getLocale don't have the injected Locale in the config provider.
        const locale = getLocale(); // the locale.timeFormat is the medium format. Locale dont supports a large
        // time format at the moment.

        return [locale.timeFormat, locale.shortTimeFormat];
      }
      /**
       * Parses the input time and sets the timeFormat used to parse the displayValue
       * if it is a valid time.
       *
       * @param {String} displayValue - The input date.
       * @return {null | string} - A normalized formatted time if displayValue is valid. null otherwise.
       */


      parseFormattedTime(displayValue) {
        const allowedFormats = this.allowedTimeFormats;
        const n = allowedFormats.length;
        let i = 0,
            value = null;

        do {
          value = normalizeFormattedTime(displayValue, allowedFormats[i]);
          i++;
        } while (value === null && i < n);

        if (value !== null) {
          this.timeFormat = allowedFormats[i - 1];
        }

        return value;
      }

      formatString(str, ...args) {
        return str.replace(/{(\d+)}/g, (match, i) => {
          return args[i];
        });
      }

    }

    LightningTimePicker.delegatesFocus = true;

    lwc.registerDecorators(LightningTimePicker, {
      publicProps: {
        label: {
          config: 0
        },
        name: {
          config: 0
        },
        max: {
          config: 0
        },
        min: {
          config: 0
        },
        placeholder: {
          config: 0
        },
        ariaLabelledByElement: {
          config: 0
        },
        ariaControlsElement: {
          config: 0
        },
        ariaLabel: {
          config: 0
        },
        messageWhenValueMissing: {
          config: 0
        },
        messageWhenBadInput: {
          config: 3
        },
        messageWhenRangeOverflow: {
          config: 3
        },
        messageWhenRangeUnderflow: {
          config: 3
        },
        ariaDescribedByElements: {
          config: 3
        },
        value: {
          config: 3
        },
        disabled: {
          config: 3
        },
        readOnly: {
          config: 3
        },
        required: {
          config: 3
        },
        fieldLevelHelp: {
          config: 3
        },
        variant: {
          config: 3
        },
        timeStyle: {
          config: 3
        }
      },
      publicMethods: ["hasBadInput", "showHelpMessage", "focus", "blur"],
      track: {
        _disabled: 1,
        _required: 1,
        _displayValue: 1,
        _value: 1,
        _items: 1,
        _fieldLevelHelp: 1,
        _variant: 1,
        _mainInputId: 1,
        _errorMessage: 1,
        _readonly: 1,
        _describedByElements: 1
      }
    });

    var _lightningTimepicker = lwc.registerComponent(LightningTimePicker, {
      tmpl: _tmpl$g
    });

    function tmpl$i($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element,
        d: api_dynamic,
        c: api_custom_element,
        b: api_bind,
        gid: api_scoped_id
      } = $api;
      const {
        _m0,
        _m1,
        _m2,
        _m3,
        _m4,
        _m5
      } = $ctx;
      return [api_element("div", {
        classMap: {
          "slds-form": true,
          "slds-form_compound": true
        },
        attrs: {
          "tabindex": "-1"
        },
        key: 2
      }, [api_element("fieldset", {
        classMap: {
          "slds-form-element": true
        },
        key: 3
      }, [api_element("legend", {
        className: $cmp.computedLabelClass,
        key: 4
      }, [$cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true
        },
        attrs: {
          "title": $cmp.i18n.required
        },
        key: 6
      }, [api_text("*")]) : null, api_dynamic($cmp.label)]), $cmp.fieldLevelHelp ? api_custom_element("lightning-helptext", _lightningHelptext, {
        props: {
          "content": $cmp.fieldLevelHelp
        },
        key: 7
      }, []) : null, api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 8
      }, [api_element("div", {
        classMap: {
          "slds-form-element__group": true
        },
        key: 9
      }, [api_element("div", {
        classMap: {
          "slds-form-element__row": true
        },
        key: 10
      }, [api_custom_element("lightning-datepicker", _lightningDatepicker, {
        classMap: {
          "slds-form-element": true
        },
        props: {
          "value": $cmp.dateValue,
          "min": $cmp.dateMin,
          "max": $cmp.dateMax,
          "label": $cmp.i18n.date,
          "name": $cmp.name,
          "variant": $cmp.variant,
          "placeholder": $cmp.placeholder,
          "readOnly": $cmp.readOnly,
          "disabled": $cmp.disabled,
          "autocomplete": $cmp.autocomplete,
          "dateStyle": $cmp.dateStyle
        },
        key: 11,
        on: {
          "focus": _m0 || ($ctx._m0 = api_bind($cmp.handleDatepickerFocus)),
          "blur": _m1 || ($ctx._m1 = api_bind($cmp.handleDatepickerBlur)),
          "change": _m2 || ($ctx._m2 = api_bind($cmp.handleDateChange))
        }
      }, []), api_custom_element("lightning-timepicker", _lightningTimepicker, {
        classMap: {
          "slds-form-element": true
        },
        props: {
          "value": $cmp.timeValue,
          "label": $cmp.i18n.time,
          "name": $cmp.name,
          "variant": $cmp.variant,
          "timeStyle": $cmp.timeStyle,
          "placeholder": $cmp.placeholder,
          "readOnly": $cmp.readOnly,
          "disabled": $cmp.disabled
        },
        key: 12,
        on: {
          "focus": _m3 || ($ctx._m3 = api_bind($cmp.handleTimepickerFocus)),
          "blur": _m4 || ($ctx._m4 = api_bind($cmp.handleTimepickerBlur)),
          "change": _m5 || ($ctx._m5 = api_bind($cmp.handleTimeChange))
        }
      }, [])])])]), $cmp.customErrorMessage ? api_element("div", {
        classMap: {
          "slds-form-element__help": true
        },
        attrs: {
          "data-error-message": true,
          "id": api_scoped_id("errormessage"),
          "aria-live": "assertive"
        },
        key: 14
      }, [api_dynamic($cmp.customErrorMessage)]) : null])])];
    }

    var _tmpl$h = lwc.registerTemplate(tmpl$i);
    tmpl$i.stylesheets = [];
    tmpl$i.stylesheetTokens = {
      hostAttribute: "lightning-datetimepicker_datetimepicker-host",
      shadowAttribute: "lightning-datetimepicker_datetimepicker"
    };

    var labelDate = 'Date';

    var labelTime = 'Time';

    const i18n$8 = {
      date: labelDate,
      rangeOverflow: labelRangeOverflow$1,
      rangeUnderflow: labelRangeUnderflow$1,
      required: labelRequired,
      time: labelTime
    };

    class LightningDateTimePicker extends lwc.LightningElement {
      // getters and setters necessary to trigger sync
      set timeAriaControls(val) {
        this._timeAriaControls = val;
        this.synchronizeA11y();
      }

      get timeAriaControls() {
        return this._timeAriaControls;
      }

      set timeAriaLabelledBy(val) {
        this._timeAriaLabelledBy = val;
        this.synchronizeA11y();
      }

      get timeAriaLabelledBy() {
        return this._timeAriaLabelledBy;
      }

      set timeAriaDescribedBy(val) {
        this._timeAriaDescribedBy = val;
        this.synchronizeA11y();
      }

      get timeAriaDescribedBy() {
        return this._timeAriaDescribedBy;
      }

      get messageWhenBadInput() {
        if (this._messageWhenBadInput) {
          return this._messageWhenBadInput;
        } else if (this.hasBadDateInput) {
          return this.getDatepicker().messageWhenBadInput;
        } else if (this.hasBadTimeInput) {
          return this.getTimepicker().messageWhenBadInput;
        }

        return null;
      }

      set messageWhenBadInput(message) {
        this._messageWhenBadInput = message;
      }

      get messageWhenRangeOverflow() {
        return this._messageWhenRangeOverflow || this.formatString(i18n$8.rangeOverflow, this.formattedMax);
      }

      set messageWhenRangeOverflow(message) {
        this._messageWhenRangeOverflow = message;
      }

      get messageWhenRangeUnderflow() {
        return this._messageWhenRangeUnderflow || this.formatString(i18n$8.rangeUnderflow, this.formattedMin);
      }

      set messageWhenRangeUnderflow(message) {
        this._messageWhenRangeUnderflow = message;
      }

      get max() {
        return this.maxValue;
      }

      set max(newValue) {
        this.maxValue = newValue;
        this.calculateFormattedMaxValue();
      }

      get min() {
        return this.minValue;
      }

      set min(newValue) {
        this.minValue = newValue;
        this.calculateFormattedMinValue();
      }

      get value() {
        return this._value;
      }

      set value(newValue) {
        const normalizedValue = this.normalizeInputValue(newValue);

        if (normalizedValue !== this._value) {
          if (!this.connected) {
            // we set the values in connectedCallback to make sure timezone is available.
            this._initialValue = normalizedValue;
            return;
          }

          this.setDateAndTimeValues(normalizedValue);
        }
      }

      get disabled() {
        return this._disabled;
      }

      set disabled(value) {
        this._disabled = normalizeBoolean(value);
      }

      get readOnly() {
        return this._readonly;
      }

      set readOnly(value) {
        this._readonly = normalizeBoolean(value);
      }

      get required() {
        return this._required;
      }

      set required(value) {
        this._required = normalizeBoolean(value);
      }

      set fieldLevelHelp(value) {
        this._fieldLevelHelp = value;
      }

      get fieldLevelHelp() {
        return this._fieldLevelHelp;
      }

      get variant() {
        return this._variant || VARIANT.STANDARD;
      }

      set variant(value) {
        this._variant = normalizeVariant(value);
      }
      /**
       * Sets focus on the date input element.
       */


      focus() {
        if (this.connected) {
          this.getDatepicker().focus();
        }
      }
      /**
       * Removes keyboard focus from the input elements.
       */


      blur() {
        if (this.connected) {
          this.getDatepicker().blur();
          this.getTimepicker().blur();
        }
      }

      hasBadInput() {
        return this.connected && (this.hasBadDateInput || this.hasBadTimeInput);
      }

      get hasBadDateInput() {
        return this.getDatepicker().hasBadInput();
      }

      get hasBadTimeInput() {
        const timeBadInput = this.getTimepicker().hasBadInput();
        const timeMissing = this.required && this._dateValue && !this._timeValue;
        return timeMissing || timeBadInput;
      }

      showHelpMessage(message) {
        if (!this.connected) {
          return;
        }

        if (!message) {
          this.clearHelpMessage();
          return;
        }

        if (this.hasBadDateInput && !this._messageWhenBadInput) {
          this.clearHelpMessage();
          this.getDatepicker().showHelpMessage(message);
          return;
        }

        if (this.hasBadTimeInput && !this._messageWhenBadInput) {
          this.clearHelpMessage();
          this.getTimepicker().showHelpMessage(message);
          return;
        }

        this.classList.add('slds-has-error');
        this._customErrorMessage = message;
      }

      clearHelpMessage() {
        this.classList.remove('slds-has-error');
        this._customErrorMessage = '';
        this.getDatepicker().showHelpMessage('');
        this.getTimepicker().showHelpMessage('');
      }

      get isLabelHidden() {
        return this.variant === VARIANT.LABEL_HIDDEN;
      }

      get computedLabelClass() {
        return classSet('slds-form-element__legend slds-form-element__label').add({
          'slds-assistive-text': this.isLabelHidden
        }).toString();
      }

      get i18n() {
        return i18n$8;
      }

      get dateValue() {
        return this._dateValue;
      }

      get timeValue() {
        return this._timeValue;
      }

      get customErrorMessage() {
        return this._customErrorMessage;
      }

      get dateMin() {
        return this._dateMin;
      }

      get dateMax() {
        return this._dateMax;
      }

      get errorMessageElementId() {
        return getRealDOMId(this.template.querySelector('[data-error-message'));
      }

      get computedDateAriaDescribedBy() {
        const ariaValues = [];

        if (this.customErrorMessage) {
          ariaValues.push(this.errorMessageElementId);
        }

        if (this.dateAriaDescribedBy) {
          ariaValues.push(this.dateAriaDescribedBy);
        }

        return normalizeAriaAttribute(ariaValues);
      }

      get computedTimeAriaDescribedBy() {
        const ariaValues = [];

        if (this.customErrorMessage) {
          ariaValues.push(this.errorMessageElementId);
        }

        if (this.timeAriaDescribedBy) {
          ariaValues.push(this.timeAriaDescribedBy);
        }

        return normalizeAriaAttribute(ariaValues);
      }

      constructor() {
        super();
        this._disabled = false;
        this._readonly = false;
        this._required = false;
        this._fieldLevelHelp = void 0;
        this._variant = void 0;
        this._value = null;
        this._dateValue = null;
        this._timeValue = null;
        this._customErrorMessage = '';
        this._dateMin = void 0;
        this._dateMax = void 0;
        this.label = void 0;
        this.name = void 0;
        this.timezone = void 0;
        this.placeholder = '';
        this.dateStyle = void 0;
        this.timeStyle = void 0;
        this.timeAriaLabel = void 0;
        this.autocomplete = void 0;
        this.dateAriaControls = void 0;
        this.dateAriaLabel = void 0;
        this.dateAriaLabelledBy = void 0;
        this.dateAriaDescribedBy = void 0;
        this.messageWhenValueMissing = void 0;
        this.uniqueId = generateUniqueId();
      }

      synchronizeA11y() {
        const datepicker = this.template.querySelector('lightning-datepicker');
        const timepicker = this.template.querySelector('lightning-timepicker');

        if (datepicker) {
          synchronizeAttrs(datepicker, {
            ariaLabelledByElement: this.dateAriaLabelledBy,
            ariaDescribedByElements: this.computedDateAriaDescribedBy,
            ariaControlsElement: this.dateAriaControls,
            'aria-label': this.dateAriaLabel
          });
        }

        if (timepicker) {
          synchronizeAttrs(timepicker, {
            ariaLabelledByElement: this.timeAriaLabelledBy,
            ariaDescribedByElements: this.computedTimeAriaDescribedBy,
            ariaControlsElement: this.timeAriaControls,
            'aria-label': this.timeAriaLabel
          });
        }
      }

      connectedCallback() {
        this.classList.add('slds-form_compound');
        this.calculateFormattedMinValue();
        this.calculateFormattedMaxValue();
        this.connected = true; // we set the initial values here in order to make sure timezone is available.

        this.setDateAndTimeValues(this._initialValue);
        this.interactingState = new InteractingState();
        this.interactingState.onenter(() => {
          this.dispatchEvent(new CustomEvent('focus'));
        });
        this.interactingState.onleave(() => {
          this.dispatchEvent(new CustomEvent('blur'));
        });
      }

      renderedCallback() {
        this.synchronizeA11y();
      }

      disconnectedCallback() {
        this.connected = false;
      }

      getTimepicker() {
        return this.template.querySelector('lightning-timepicker');
      }

      getDatepicker() {
        return this.template.querySelector('lightning-datepicker');
      }

      handleDatepickerFocus() {
        this._dateFocus = true;
        this.interactingState.enter();
      }

      handleTimepickerFocus() {
        this._timeFocus = true;
        this.interactingState.enter();
      }

      handleDatepickerBlur() {
        this._dateFocus = false; // timepicker fires focus before datepicker fires blur

        if (!this._timeFocus) {
          this.interactingState.leave();
        }
      }

      handleTimepickerBlur() {
        this._timeFocus = false; // datepicker fires focus before timepicker fires blur

        if (!this._dateFocus) {
          this.interactingState.leave();
        }
      }

      handleDateChange(event) {
        event.stopPropagation(); // for some reason this event is fired without detail from listbox

        if (!event.detail) {
          return;
        }

        this._dateValue = event.detail.value;

        if (this._dateValue) {
          this._timeValue = this._timeValue || getCurrentTime(this.timezone);
        }

        this.updateValue();
      }

      handleTimeChange(event) {
        event.stopPropagation(); // for some reason this event is fired without detail from listbox

        if (!event.detail) {
          return;
        }

        this._timeValue = event.detail.value;
        this.updateValue();
      }

      updateValue() {
        const dateValue = this._dateValue;
        const timeValue = this._timeValue;

        if (dateValue && timeValue) {
          const dateTimeString = dateValue + TIME_SEPARATOR + timeValue;
          this._value = normalizeFormattedDateTime(dateTimeString, this.timezone);
          this.dispatchChangeEvent();
        } else if (!dateValue) {
          this._value = null;
          this._timeValue = null;
          this.dispatchChangeEvent();
        }
      }

      dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('change', {
          composed: true,
          bubbles: true,
          detail: {
            value: this._value
          }
        }));
      }

      normalizeInputValue(value) {
        if (!value || value === '') {
          return null;
        }

        return value;
      }

      setDateAndTimeValues(value) {
        const normalizedValue = normalizeISODateTime(value, this.timezone).isoValue;
        const isDateOnly = normalizedValue && value.indexOf(TIME_SEPARATOR) < 0;

        if (isDateOnly) {
          this._dateValue = value;
          this._value = this._dateValue;
          return;
        }

        const dateAndTime = this.separateDateTime(normalizedValue);
        this._dateValue = dateAndTime && dateAndTime[0];
        this._timeValue = dateAndTime && dateAndTime[1];
        this._value = normalizedValue;
      }

      calculateFormattedMinValue() {
        if (!this.min) {
          return;
        }

        const normalizedDate = normalizeISODateTime(this.min, this.timezone);
        this._dateMin = this.separateDateTime(normalizedDate.isoValue)[0];
        this.formattedMin = normalizedDate.displayValue;
      }

      calculateFormattedMaxValue() {
        if (!this.max) {
          return;
        }

        const normalizedDate = normalizeISODateTime(this.max, this.timezone);
        this._dateMax = this.separateDateTime(normalizedDate.isoValue)[0];
        this.formattedMax = normalizedDate.displayValue;
      }

      separateDateTime(isoString) {
        return typeof isoString === 'string' ? isoString.split(TIME_SEPARATOR) : null;
      }

      formatString(str, ...args) {
        return str.replace(/{(\d+)}/g, (match, i) => {
          return args[i];
        });
      }

    }

    LightningDateTimePicker.delegatesFocus = true;

    lwc.registerDecorators(LightningDateTimePicker, {
      publicProps: {
        label: {
          config: 0
        },
        name: {
          config: 0
        },
        timezone: {
          config: 0
        },
        placeholder: {
          config: 0
        },
        dateStyle: {
          config: 0
        },
        timeStyle: {
          config: 0
        },
        timeAriaLabel: {
          config: 0
        },
        autocomplete: {
          config: 0
        },
        timeAriaControls: {
          config: 3
        },
        timeAriaLabelledBy: {
          config: 3
        },
        timeAriaDescribedBy: {
          config: 3
        },
        dateAriaControls: {
          config: 0
        },
        dateAriaLabel: {
          config: 0
        },
        dateAriaLabelledBy: {
          config: 0
        },
        dateAriaDescribedBy: {
          config: 0
        },
        messageWhenValueMissing: {
          config: 0
        },
        messageWhenBadInput: {
          config: 3
        },
        messageWhenRangeOverflow: {
          config: 3
        },
        messageWhenRangeUnderflow: {
          config: 3
        },
        max: {
          config: 3
        },
        min: {
          config: 3
        },
        value: {
          config: 3
        },
        disabled: {
          config: 3
        },
        readOnly: {
          config: 3
        },
        required: {
          config: 3
        },
        fieldLevelHelp: {
          config: 3
        },
        variant: {
          config: 3
        }
      },
      publicMethods: ["focus", "blur", "hasBadInput", "showHelpMessage"],
      track: {
        _disabled: 1,
        _readonly: 1,
        _required: 1,
        _fieldLevelHelp: 1,
        _variant: 1,
        _value: 1,
        _dateValue: 1,
        _timeValue: 1,
        _customErrorMessage: 1,
        _dateMin: 1,
        _dateMax: 1
      }
    });

    var _lightningDatetimepicker = lwc.registerComponent(LightningDateTimePicker, {
      tmpl: _tmpl$h
    });

    function tmpl$j($api, $cmp, $slotset, $ctx) {
      const {
        h: api_element,
        t: api_text,
        d: api_dynamic,
        gid: api_scoped_id,
        c: api_custom_element,
        b: api_bind
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
        _m13,
        _m14,
        _m15,
        _m16,
        _m17,
        _m18,
        _m19,
        _m20,
        _m21,
        _m22,
        _m23,
        _m24,
        _m25,
        _m26,
        _m27,
        _m28,
        _m29,
        _m30,
        _m31,
        _m32,
        _m33,
        _m34,
        _m35,
        _m36,
        _m37,
        _m38,
        _m39,
        _m40
      } = $ctx;
      return [api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        attrs: {
          "data-aria": true
        },
        key: 2
      }, []), $cmp.isTypeSimple ? api_element("label", {
        className: $cmp.computedLabelClass,
        attrs: {
          "for": `${api_scoped_id("input")}`
        },
        key: 4
      }, [$cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true
        },
        attrs: {
          "title": $cmp.i18n.required
        },
        key: 6
      }, [api_text("*")]) : null, api_dynamic($cmp.label)]) : null, $cmp.isTypeSimple ? $cmp.fieldLevelHelp ? api_custom_element("lightning-helptext", _lightningHelptext, {
        props: {
          "content": $cmp.fieldLevelHelp
        },
        key: 7
      }, []) : null : null, $cmp.isTypeSimple ? api_element("div", {
        className: $cmp.computedFormElementClass,
        key: 8
      }, [api_element("input", {
        classMap: {
          "slds-input": true
        },
        attrs: {
          "type": $cmp._internalType,
          "id": api_scoped_id("input"),
          "aria-label": $cmp.computedAriaLabel,
          "accesskey": $cmp.accesskey,
          "autocomplete": $cmp.autocomplete,
          "max": $cmp.normalizedMax,
          "min": $cmp.normalizedMin,
          "step": $cmp.step,
          "maxlength": $cmp.maxLength,
          "minlength": $cmp.minLength,
          "pattern": $cmp.pattern,
          "placeholder": $cmp.placeholder,
          "name": $cmp.name
        },
        props: {
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "disabled": $cmp.disabled
        },
        key: 9,
        on: {
          "blur": _m0 || ($ctx._m0 = api_bind($cmp.handleBlur)),
          "focus": _m1 || ($ctx._m1 = api_bind($cmp.handleFocus)),
          "change": _m2 || ($ctx._m2 = api_bind($cmp.handleChange)),
          "input": _m3 || ($ctx._m3 = api_bind($cmp.handleInput)),
          "keypress": _m4 || ($ctx._m4 = api_bind($cmp.handleKeyPress)),
          "touchend": _m5 || ($ctx._m5 = api_bind($cmp.handleTouchEnd))
        }
      }, []), $cmp.isTypeSearch ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": "utility:search",
          "variant": "bare",
          "svgClass": "slds-input__icon slds-input__icon_left slds-icon-text-default"
        },
        key: 11
      }, []) : null, $cmp.isTypeSearch ? api_element("div", {
        classMap: {
          "slds-input__icon-group": true,
          "slds-input__icon-group_right": true
        },
        key: 12
      }, [$cmp.isLoading ? api_element("div", {
        classMap: {
          "slds-spinner": true,
          "slds-spinner_brand": true,
          "slds-spinner_x-small": true,
          "slds-input__spinner": true
        },
        attrs: {
          "role": "status"
        },
        key: 14
      }, [api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 15
      }, [api_dynamic($cmp.i18n.loading)]), api_element("div", {
        classMap: {
          "slds-spinner__dot-a": true
        },
        key: 16
      }, []), api_element("div", {
        classMap: {
          "slds-spinner__dot-b": true
        },
        key: 17
      }, [])]) : null, $cmp._showClearButton ? api_element("button", {
        classMap: {
          "slds-input__icon": true,
          "slds-input__icon_right": true,
          "slds-button": true,
          "slds-button_icon": true
        },
        attrs: {
          "data-element-id": "searchClear"
        },
        key: 19,
        on: {
          "blur": _m6 || ($ctx._m6 = api_bind($cmp.handleBlur)),
          "click": _m7 || ($ctx._m7 = api_bind($cmp.clearAndSetFocusOnInput))
        }
      }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": "utility:clear",
          "variant": "bare",
          "svgClass": "slds-button__icon"
        },
        key: 20
      }, []), api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 21
      }, [api_dynamic($cmp.i18n.clear)])]) : null]) : null]) : null, $cmp.isTypeToggle ? api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 23
      }, [api_element("label", {
        classMap: {
          "slds-checkbox_toggle": true,
          "slds-grid": true
        },
        attrs: {
          "for": `${api_scoped_id("checkbox-toggle")}`
        },
        key: 24
      }, [$cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true
        },
        attrs: {
          "title": $cmp.i18n.required
        },
        key: 26
      }, [api_text("*")]) : null, api_element("span", {
        className: $cmp.computedLabelClass,
        key: 27
      }, [api_dynamic($cmp.label)]), api_element("input", {
        attrs: {
          "type": "checkbox",
          "id": api_scoped_id("checkbox-toggle"),
          "aria-label": $cmp.computedAriaLabel,
          "accesskey": $cmp.accesskey,
          "name": $cmp.name
        },
        props: {
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "disabled": $cmp.disabled
        },
        key: 28,
        on: {
          "blur": _m8 || ($ctx._m8 = api_bind($cmp.handleBlur)),
          "focus": _m9 || ($ctx._m9 = api_bind($cmp.handleFocus)),
          "change": _m10 || ($ctx._m10 = api_bind($cmp.handleChange))
        }
      }, []), api_element("span", {
        classMap: {
          "slds-checkbox_faux_container": true
        },
        attrs: {
          "id": api_scoped_id("toggle-description"),
          "data-toggle-description": true,
          "aria-live": "assertive"
        },
        key: 29
      }, [api_element("span", {
        classMap: {
          "slds-checkbox_faux": true
        },
        key: 30
      }, []), api_element("span", {
        classMap: {
          "slds-checkbox_on": true
        },
        key: 31
      }, [api_dynamic($cmp.messageToggleActive)]), api_element("span", {
        classMap: {
          "slds-checkbox_off": true
        },
        key: 32
      }, [api_dynamic($cmp.messageToggleInactive)])])])]) : null, $cmp.isTypeCheckbox ? !$cmp.isStandardVariant ? api_element("label", {
        classMap: {
          "slds-checkbox__label": true
        },
        attrs: {
          "for": `${api_scoped_id("checkbox")}`
        },
        key: 35
      }, [$cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true
        },
        attrs: {
          "title": $cmp.i18n.required
        },
        key: 37
      }, [api_text("*")]) : null, api_element("span", {
        className: $cmp.computedLabelClass,
        key: 38
      }, [api_dynamic($cmp.label)])]) : null : null, $cmp.isTypeCheckbox ? !$cmp.isStandardVariant ? $cmp.fieldLevelHelp ? api_custom_element("lightning-helptext", _lightningHelptext, {
        props: {
          "content": $cmp.fieldLevelHelp
        },
        key: 39
      }, []) : null : null : null, $cmp.isTypeCheckbox ? api_element("div", {
        className: $cmp.computedFormElementClass,
        key: 40
      }, [api_element("span", {
        className: $cmp.computedCheckboxClass,
        key: 41
      }, [$cmp.isStandardVariant ? $cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true
        },
        attrs: {
          "title": $cmp.i18n.required
        },
        key: 44
      }, [api_text("*")]) : null : null, api_element("input", {
        attrs: {
          "type": "checkbox",
          "id": api_scoped_id("checkbox"),
          "aria-label": $cmp.computedAriaLabel,
          "accesskey": $cmp.accesskey,
          "name": $cmp.name
        },
        props: {
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "disabled": $cmp.disabled
        },
        key: 45,
        on: {
          "blur": _m11 || ($ctx._m11 = api_bind($cmp.handleBlur)),
          "focus": _m12 || ($ctx._m12 = api_bind($cmp.handleFocus)),
          "change": _m13 || ($ctx._m13 = api_bind($cmp.handleChange))
        }
      }, []), !$cmp.isStandardVariant ? api_element("span", {
        classMap: {
          "slds-checkbox_faux": true
        },
        key: 47
      }, []) : null, $cmp.isStandardVariant ? api_element("label", {
        classMap: {
          "slds-checkbox__label": true
        },
        attrs: {
          "for": `${api_scoped_id("checkbox")}`
        },
        key: 49
      }, [api_element("span", {
        classMap: {
          "slds-checkbox_faux": true
        },
        key: 50
      }, []), api_element("span", {
        className: $cmp.computedLabelClass,
        key: 51
      }, [api_dynamic($cmp.label)])]) : null, $cmp.isStandardVariant ? $cmp.fieldLevelHelp ? api_custom_element("lightning-helptext", _lightningHelptext, {
        props: {
          "content": $cmp.fieldLevelHelp
        },
        key: 52
      }, []) : null : null])]) : null, $cmp.isTypeCheckboxButton ? api_element("div", {
        classMap: {
          "slds-checkbox_add-button": true
        },
        key: 54
      }, [api_element("input", {
        classMap: {
          "slds-assistive-text": true
        },
        attrs: {
          "type": "checkbox",
          "id": api_scoped_id("checkbox-button"),
          "aria-label": $cmp.computedAriaLabel,
          "accesskey": $cmp.accesskey,
          "name": $cmp.name
        },
        props: {
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "disabled": $cmp.disabled
        },
        key: 55,
        on: {
          "blur": _m14 || ($ctx._m14 = api_bind($cmp.handleBlur)),
          "focus": _m15 || ($ctx._m15 = api_bind($cmp.handleFocus)),
          "change": _m16 || ($ctx._m16 = api_bind($cmp.handleChange))
        }
      }, []), api_element("label", {
        classMap: {
          "slds-checkbox_faux": true
        },
        attrs: {
          "for": `${api_scoped_id("checkbox-button")}`
        },
        key: 56
      }, [api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 57
      }, [api_dynamic($cmp.label)])])]) : null, $cmp.isTypeRadio ? api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 59
      }, [api_element("span", {
        classMap: {
          "slds-radio": true
        },
        key: 60
      }, [api_element("input", {
        attrs: {
          "type": "radio",
          "id": api_scoped_id("radio"),
          "accesskey": $cmp.accesskey,
          "name": $cmp.name
        },
        props: {
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "disabled": $cmp.disabled
        },
        key: 61,
        on: {
          "blur": _m17 || ($ctx._m17 = api_bind($cmp.handleBlur)),
          "focus": _m18 || ($ctx._m18 = api_bind($cmp.handleFocus)),
          "change": _m19 || ($ctx._m19 = api_bind($cmp.handleChange))
        }
      }, []), api_element("label", {
        classMap: {
          "slds-radio__label": true
        },
        attrs: {
          "for": `${api_scoped_id("radio")}`
        },
        key: 62
      }, [api_element("span", {
        classMap: {
          "slds-radio_faux": true
        },
        key: 63
      }, []), api_element("span", {
        className: $cmp.computedLabelClass,
        key: 64
      }, [api_dynamic($cmp.label)])])])]) : null, $cmp.isTypeFile ? api_element("span", {
        className: $cmp.computedLabelClass,
        attrs: {
          "id": api_scoped_id("form-label"),
          "data-form-label": true
        },
        key: 66
      }, [$cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true
        },
        attrs: {
          "title": $cmp.i18n.required
        },
        key: 68
      }, [api_text("*")]) : null, api_dynamic($cmp.label)]) : null, $cmp.isTypeFile ? api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 69
      }, [api_element("div", {
        classMap: {
          "slds-file-selector": true,
          "slds-file-selector_files": true
        },
        key: 70,
        on: {
          "drop": _m24 || ($ctx._m24 = api_bind($cmp.handleDropFiles))
        }
      }, [api_custom_element("lightning-primitive-file-droppable-zone", _lightningPrimitiveFileDroppableZone, {
        props: {
          "multiple": $cmp.multiple,
          "disabled": $cmp.disabled
        },
        key: 71
      }, [api_element("input", {
        classMap: {
          "slds-file-selector__input": true,
          "slds-assistive-text": true
        },
        attrs: {
          "type": "file",
          "id": api_scoped_id("input-file"),
          "aria-label": $cmp.computedAriaLabel,
          "accesskey": $cmp.accesskey,
          "accept": $cmp.accept,
          "name": $cmp.name
        },
        props: {
          "multiple": $cmp.multiple,
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "disabled": $cmp.disabled
        },
        key: 72,
        on: {
          "blur": _m20 || ($ctx._m20 = api_bind($cmp.handleBlur)),
          "click": _m21 || ($ctx._m21 = api_bind($cmp.handleFileClick)),
          "focus": _m22 || ($ctx._m22 = api_bind($cmp.handleFocus)),
          "change": _m23 || ($ctx._m23 = api_bind($cmp.handleChange))
        }
      }, []), api_element("label", {
        classMap: {
          "slds-file-selector__body": true
        },
        attrs: {
          "id": api_scoped_id("file-selector-label"),
          "data-file-selector-label": true,
          "for": `${api_scoped_id("input-file")}`
        },
        key: 73
      }, [api_element("span", {
        classMap: {
          "slds-file-selector__button": true,
          "slds-button": true,
          "slds-button_neutral": true
        },
        key: 74
      }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": "utility:upload",
          "variant": "bare",
          "svgClass": "slds-button__icon slds-button__icon_left"
        },
        key: 75
      }, []), api_dynamic($cmp.i18n.inputFileButtonLabel)]), api_element("span", {
        classMap: {
          "slds-file-selector__text": true,
          "slds-medium-show": true
        },
        key: 76
      }, [api_dynamic($cmp.i18n.inputFileBodyText)])])])])]) : null, $cmp.isTypeColor ? api_element("div", {
        classMap: {
          "slds-color-picker": true
        },
        key: 78
      }, [api_element("div", {
        classMap: {
          "slds-color-picker__summary": true
        },
        key: 79
      }, [api_element("label", {
        className: $cmp.computedColorLabelClass,
        attrs: {
          "for": `${api_scoped_id("color")}`
        },
        key: 80
      }, [$cmp.required ? api_element("abbr", {
        classMap: {
          "slds-required": true
        },
        attrs: {
          "title": $cmp.i18n.required
        },
        key: 82
      }, [api_text("*")]) : null, api_dynamic($cmp.label)]), api_custom_element("lightning-primitive-colorpicker-button", _lightningPrimitiveColorpickerButton, {
        props: {
          "value": $cmp.value,
          "disabled": $cmp.disabled
        },
        key: 83,
        on: {
          "blur": _m25 || ($ctx._m25 = api_bind($cmp.handleBlur)),
          "focus": _m26 || ($ctx._m26 = api_bind($cmp.handleFocus)),
          "change": _m27 || ($ctx._m27 = api_bind($cmp.handleColorChange))
        }
      }, []), api_element("div", {
        classMap: {
          "slds-form-element": true,
          "slds-color-picker__summary-input": true
        },
        key: 84
      }, [api_element("div", {
        classMap: {
          "slds-form-element__control": true
        },
        key: 85
      }, [api_element("input", {
        classMap: {
          "slds-input": true,
          "slds-m-right_x-small": true
        },
        attrs: {
          "type": "text",
          "id": api_scoped_id("color"),
          "name": $cmp.name,
          "autocomplete": $cmp.autocomplete,
          "accesskey": $cmp.accesskey,
          "aria-label": $cmp.computedAriaLabel,
          "minlength": "4",
          "maxlength": "7",
          "placeholder": $cmp.placeholder,
          "pattern": $cmp.pattern
        },
        props: {
          "disabled": $cmp.disabled
        },
        key: 86,
        on: {
          "blur": _m28 || ($ctx._m28 = api_bind($cmp.handleBlur)),
          "focus": _m29 || ($ctx._m29 = api_bind($cmp.handleFocus)),
          "change": _m30 || ($ctx._m30 = api_bind($cmp.handleChange)),
          "input": _m31 || ($ctx._m31 = api_bind($cmp.handleInput))
        }
      }, [])])]), $cmp.fieldLevelHelp ? api_custom_element("lightning-helptext", _lightningHelptext, {
        props: {
          "content": $cmp.fieldLevelHelp
        },
        key: 87
      }, []) : null])]) : null, $cmp.isTypeDesktopDate ? api_custom_element("lightning-datepicker", _lightningDatepicker, {
        props: {
          "max": $cmp.max,
          "min": $cmp.min,
          "label": $cmp.label,
          "name": $cmp.name,
          "variant": $cmp.variant,
          "ariaLabel": $cmp.ariaLabel,
          "dateStyle": $cmp.dateStyle,
          "placeholder": $cmp.placeholder,
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "fieldLevelHelp": $cmp.fieldLevelHelp,
          "autocomplete": $cmp.autocomplete,
          "messageWhenBadInput": $cmp.messageWhenBadInput,
          "messageWhenValueMissing": $cmp.messageWhenValueMissing,
          "messageWhenRangeOverflow": $cmp.messageWhenRangeOverflow,
          "messageWhenRangeUnderflow": $cmp.messageWhenRangeUnderflow,
          "disabled": $cmp.disabled
        },
        key: 89,
        on: {
          "change": _m32 || ($ctx._m32 = api_bind($cmp.handleChange)),
          "blur": _m33 || ($ctx._m33 = api_bind($cmp.handleBlur)),
          "focus": _m34 || ($ctx._m34 = api_bind($cmp.handleFocus))
        }
      }, []) : null, $cmp.isTypeDesktopTime ? api_custom_element("lightning-timepicker", _lightningTimepicker, {
        props: {
          "max": $cmp.max,
          "min": $cmp.min,
          "label": $cmp.label,
          "name": $cmp.name,
          "ariaLabel": $cmp.ariaLabel,
          "variant": $cmp.variant,
          "timeStyle": $cmp.timeStyle,
          "placeholder": $cmp.placeholder,
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "fieldLevelHelp": $cmp.fieldLevelHelp,
          "messageWhenBadInput": $cmp.messageWhenBadInput,
          "messageWhenValueMissing": $cmp.messageWhenValueMissing,
          "messageWhenRangeOverflow": $cmp.messageWhenRangeOverflow,
          "messageWhenRangeUnderflow": $cmp.messageWhenRangeUnderflow,
          "disabled": $cmp.disabled
        },
        key: 91,
        on: {
          "change": _m35 || ($ctx._m35 = api_bind($cmp.handleChange)),
          "blur": _m36 || ($ctx._m36 = api_bind($cmp.handleBlur)),
          "focus": _m37 || ($ctx._m37 = api_bind($cmp.handleFocus))
        }
      }, []) : null, $cmp.isTypeDesktopDateTime ? api_custom_element("lightning-datetimepicker", _lightningDatetimepicker, {
        props: {
          "dateAriaControls": $cmp.dateAriaControls,
          "dateAriaLabel": $cmp.dateAriaLabel,
          "dateAriaLabelledBy": $cmp.dateAriaLabelledBy,
          "dateAriaDescribedBy": $cmp.dateAriaDescribedBy,
          "dateStyle": $cmp.dateStyle,
          "timeStyle": $cmp.timeStyle,
          "timeAriaControls": $cmp.timeAriaControls,
          "timeAriaLabel": $cmp.timeAriaLabel,
          "timeAriaLabelledBy": $cmp.timeAriaLabelledBy,
          "timeAriaDescribedBy": $cmp.timeAriaDescribedBy,
          "max": $cmp.max,
          "min": $cmp.min,
          "timezone": $cmp.timezone,
          "label": $cmp.label,
          "name": $cmp.name,
          "variant": $cmp.variant,
          "placeholder": $cmp.placeholder,
          "required": $cmp.required,
          "readOnly": $cmp.readOnly,
          "fieldLevelHelp": $cmp.fieldLevelHelp,
          "autocomplete": $cmp.autocomplete,
          "messageWhenBadInput": $cmp.messageWhenBadInput,
          "messageWhenValueMissing": $cmp.messageWhenValueMissing,
          "messageWhenRangeOverflow": $cmp.messageWhenRangeOverflow,
          "messageWhenRangeUnderflow": $cmp.messageWhenRangeUnderflow,
          "disabled": $cmp.disabled
        },
        key: 93,
        on: {
          "change": _m38 || ($ctx._m38 = api_bind($cmp.handleChange)),
          "blur": _m39 || ($ctx._m39 = api_bind($cmp.handleBlur)),
          "focus": _m40 || ($ctx._m40 = api_bind($cmp.handleFocus))
        }
      }, []) : null, $cmp._helpMessage ? api_element("div", {
        classMap: {
          "slds-form-element__help": true
        },
        attrs: {
          "id": api_scoped_id("help-message"),
          "data-help-message": true,
          "role": "alert"
        },
        key: 95
      }, [api_dynamic($cmp._helpMessage)]) : null];
    }

    var _tmpl$i = lwc.registerTemplate(tmpl$j);
    tmpl$j.stylesheets = [];
    tmpl$j.stylesheetTokens = {
      hostAttribute: "lightning-input_input-host",
      shadowAttribute: "lightning-input_input"
    };

    var labelInputFileBodyText = 'Or drop files';

    var labelInputFileButtonLabel = 'Upload Files';

    var labelMessageToggleActive = 'Active';

    var labelMessageToggleInactive = 'Inactive';

    var labelClearInput = 'Clear';

    var labelLoadingIndicator = 'Loading';

    function normalizeInput(value) {
      if (typeof value === 'number' || typeof value === 'string') {
        return value;
      }

      return '';
    }
    function normalizeDate(value) {
      return normalizeISODate(value).isoValue || '';
    }
    function normalizeTime(value) {
      return normalizeISOTime(value, STANDARD_TIME_FORMAT).isoValue || '';
    } // Converts value to the user's timezone and formats it in a way that will be accepted by the input

    function normalizeUTCDateTime(value, timezone) {
      return normalizeISODateTime(value, timezone).isoValue || '';
    } // parses the input value and converts it back to UTC from the user's timezone

    function normalizeDateTimeToUTC(value, timezone) {
      return normalizeFormattedDateTime(value, timezone) || '';
    }

    const i18n$9 = {
      a11yTriggerText: labelA11yTriggerText,
      inputFileBodyText: labelInputFileBodyText,
      inputFileButtonLabel: labelInputFileButtonLabel,
      messageToggleActive: labelMessageToggleActive,
      messageToggleInactive: labelMessageToggleInactive,
      required: labelRequired,
      clear: labelClearInput,
      loading: labelLoadingIndicator
    };
    const ARIA_CONTROLS$2 = 'aria-controls';
    const ARIA_LABEL$2 = 'aria-label';
    const ARIA_LABELEDBY = 'aria-labelledby';
    const ARIA_DESCRIBEDBY$3 = 'aria-describedby';
    /*
    * This component supports the regular native input types, with the addition of toggle, checkbox-button and color.
    * Furthermore the file type supports a droppable zone, search has a clear button, number has formatting.
    * Input changes (native oninput event) triggers an onchange event,
    *     the native even is stopped, the dispatched custom event has a value that points to the state of the component
    *     in case of files it's the files uploaded (via droppable zone or through the upload button),
    *     checked for radio and checkbox, checkbox-button, and just straight input's value for everything else
    *
    *
    * _Toggle_ (always has an aria-describedby, on error has an additional one, default label text for active and inactive
    * states)
    * _File_ (as it has a droppable zone, the validity returned would have to be valid - unless a custom error message was
    *    passed)
    * _Search_ (it has the clear button and the icon)
    * _Number_ (formatting when not in focus, when in focus shows raw value)
    *
    * */

    const VALID_NUMBER_FORMATTERS = ['decimal', 'percent', 'percent-fixed', 'currency'];
    const DEFAULT_COLOR$1 = '#000000';
    const DEFAULT_FORMATTER = VALID_NUMBER_FORMATTERS[0];
    /**
     * Returns an aria string with all the non-autolinked values removed
     * @param {String} values space sperated list of ids
     * @returns {String} The aria values with the non-auto linked ones removed
     */

    function filterNonAutoLink(values) {
      const ariaValues = values.split(/\s+/);
      return ariaValues.filter(value => {
        return !!value.match(/^auto-link/);
      }).join(' ');
    }
    /**
     * Represents interactive controls that accept user input depending on the type attribute.
     */


    class LightningInput extends lwc.LightningElement {
      /**
       * Text that is displayed when the field is empty, to prompt the user for a valid entry.
       * @type {string}
       *
       */

      /**
       * Specifies the name of an input element.
       * @type {string}
       *
       */

      /**
       * Text label for the input.
       * @type {string}
       * @required
       *
       */

      /**
       * Error message to be displayed when a bad input is detected.
       * @type {string}
       *
       */

      /**
       * Error message to be displayed when a pattern mismatch is detected.
       * @type {string}
       *
       */

      /**
       * Error message to be displayed when a range overflow is detected.
       * @type {string}
       *
       */

      /**
       * Error message to be displayed when a range underflow is detected.
       * @type {string}
       *
       */

      /**
       * Error message to be displayed when a step mismatch is detected.
       * @type {string}
       *
       */

      /**
       * Error message to be displayed when the value is too short.
       * @type {string}
       *
       */

      /**
       * Error message to be displayed when the value is too long.
       * @type {string}
       *
       */

      /**
       * Error message to be displayed when a type mismatch is detected.
       * @type {string}
       *
       */

      /**
       * Error message to be displayed when the value is missing.
       * @type {string}
       *
       */

      /**
       * Text shown for the active state of a toggle. The default is "Active".
       * @type {string}
       */

      /**
       * Text shown for the inactive state of a toggle. The default is "Inactive".
       * @type {string}
       */

      /**
       * Describes the input to assistive technologies.
       * @type {string}
       */

      /**
       * Controls auto-filling of the field. Use this attribute with
       * email, search, tel, text, and url input types only. Set the attribute to pass
       * through autocomplete values to be interpreted by the browser.
       * @type {string}
       */
      constructor() {
        super();
        this.placeholder = void 0;
        this.name = void 0;
        this.label = void 0;
        this.messageWhenBadInput = void 0;
        this.messageWhenPatternMismatch = void 0;
        this.messageWhenRangeOverflow = void 0;
        this.messageWhenRangeUnderflow = void 0;
        this.messageWhenStepMismatch = void 0;
        this.messageWhenTooShort = void 0;
        this.messageWhenTooLong = void 0;
        this.messageWhenTypeMismatch = void 0;
        this.messageWhenValueMissing = void 0;
        this.messageToggleActive = i18n$9.messageToggleActive;
        this.messageToggleInactive = i18n$9.messageToggleInactive;
        this.ariaLabel = void 0;
        this.autocomplete = void 0;
        this._timeAriaDescribedBy = void 0;
        this._timeAriaLabelledBy = void 0;
        this._timeAriaControls = void 0;
        this._dateAriaControls = void 0;
        this._dateAriaDescribedBy = void 0;
        this._dateAriaLabelledBy = void 0;
        this._value = '';
        this._type = 'text';
        this._pattern = void 0;
        this._max = void 0;
        this._min = void 0;
        this._step = void 0;
        this._disabled = false;
        this._readOnly = false;
        this._required = false;
        this._checked = false;
        this._isLoading = false;
        this._multiple = false;
        this._timezone = false;
        this._helpMessage = null;
        this._isColorPickerPanelOpen = false;
        this._fieldLevelHelp = void 0;
        this._accesskey = void 0;
        this._maxLength = void 0;
        this._minLength = void 0;
        this._accept = void 0;
        this._variant = void 0;
        this._connected = void 0;
        this._formatter = DEFAULT_FORMATTER;
        this._showRawNumber = false;
        this._initialValueSet = false;
        this._files = null;
        this.dateStyle = void 0;
        this.timeStyle = void 0;
        this.dateAriaLabel = void 0;
        this.ariaObserver = new ContentMutation(this); // Native Shadow Root will return [native code].
        // Our synthetic method will return the function source.

        this.isNative = this.template.querySelector.toString().match(/\[native code\]/);
      }
      /**
       * Reserved for internal use.
       * @type {number}
       *
       */


      get formatFractionDigits() {
        return this._formatFractionDigits;
      }

      set formatFractionDigits(value) {
        this._formatFractionDigits = value;

        if (this._connected && this.isTypeNumber) {
          this.inputElement.value = this.displayedValue;
        }
      }

      set timeAriaControls(refs) {
        this._timeAriaControls = refs;
        this.ariaObserver.connectLiveIdRef(refs, ref => {
          this._timeAriaControls = ref;
        });
      }
      /**
       * A space-separated list of element IDs whose presence or content is controlled by the
       * time input when type='datetime'. On mobile devices, this is merged with aria-controls
       * and date-aria-controls to describe the native date time input.
       * @type {string}
       */


      get timeAriaControls() {
        return this._timeAriaControls;
      }
      /**
       * The display style of the date when type='date' or type='datetime'. Valid values are
       * short, medium (default), and long. The format of each style is specific to the locale.
       * On mobile devices this attribute has no effect.
       * @type {string}
       * @default medium
       */


      set dateAriaLabelledBy(refs) {
        this._dateAriaLabelledBy = refs;
        this.ariaObserver.connectLiveIdRef(refs, ref => {
          this._dateAriaLabelledBy = ref;
        });
      }
      /**
       * A space-separated list of element IDs that provide labels for the date input when type='datetime'.
       * On mobile devices, this is merged with aria-labelled-by and time-aria-labelled-by to describe
       * the native date time input.
       * @type {string}
       */


      get dateAriaLabelledBy() {
        return this._dateAriaLabelledBy;
      }

      set timeAriaLabelledBy(refs) {
        this._timeAriaLabelledBy = refs;
        this.ariaObserver.connectLiveIdRef(refs, ref => {
          this._timeAriaLabelledBy = ref;
        });
      }
      /**
       * A space-separated list of element IDs that provide labels for the time input when type='datetime'.
       * On mobile devices, this is merged with aria-labelled-by and date-aria-labelled-by to describe
       * the native date time input.
       * @type {string}
       *
       */


      get timeAriaLabelledBy() {
        return this._timeAriaLabelledBy;
      }

      set timeAriaDescribedBy(refs) {
        this._timeAriaDescribedBy = refs;
        this.ariaObserver.connectLiveIdRef(refs, ref => {
          this._timeAriaDescribedBy = ref;
        });
      }
      /**
       * A space-separated list of element IDs that provide descriptive labels for the time input when
       * type='datetime'. On mobile devices, this is merged with aria-described-by and date-aria-described-by
       * to describe the native date time input.
       *  @type {string}
       *
       */


      get timeAriaDescribedBy() {
        return this._timeAriaDescribedBy;
      }

      set dateAriaControls(refs) {
        this._dateAriaControls = refs;
        this.ariaObserver.connectLiveIdRef(refs, ref => {
          this._dateAriaControls = ref;
        });
      }
      /**
       * A space-separated list of element IDs whose presence or content is controlled by the
       * date input when type='datetime'. On mobile devices, this is merged with aria-controls
       * and time-aria-controls to describe the native date time input.
       * @type {string}
       *
       */


      get dateAriaControls() {
        return this._dateAriaControls;
      }

      set dateAriaDescribedBy(refs) {
        this._dateAriaDescribedBy = refs;
        this.ariaObserver.connectLiveIdRef(refs, ref => {
          this._dateAriaDescribedBy = ref;
        });
      }
      /**
       * A space-separated list of element IDs that provide descriptive labels for the date input when
       * type='datetime'. On mobile devices, this is merged with aria-described-by and time-aria-described-by
       * to describe the native date time input.
       * @type {string}
       */


      get dateAriaDescribedBy() {
        return this._dateAriaDescribedBy;
      }

      set ariaControls(refs) {
        this._ariaControls = refs;
        this.ariaObserver.link('input', 'aria-controls', refs, '[data-aria]');
      }
      /**
       * A space-separated list of element IDs whose presence or content is controlled by the input.
       * @type {string}
       */


      get ariaControls() {
        return this._ariaControls;
      }

      set ariaLabelledBy(refs) {
        this._ariaLabelledBy = refs;
        this.ariaObserver.link('input', 'aria-labelledby', refs, '[data-aria]');
      }
      /**
       * A space-separated list of element IDs that provide labels for the input.
       * @type {string}
       */


      get ariaLabelledBy() {
        // native version returns the auto linked value
        if (this.isNative) {
          const ariaValues = this.template.querySelector('input').getAttribute('aria-labelledby');
          return filterNonAutoLink(ariaValues);
        }

        return this._ariaLabelledBy;
      }

      set ariaDescribedBy(refs) {
        this._ariaDescribedBy = refs;
        this.ariaObserver.link('input', 'aria-describedby', refs, '[data-aria]');
      }
      /**
       * A space-separated list of element IDs that provide descriptive labels for the input.
       * @type {string}
       */


      get ariaDescribedBy() {
        if (this.isNative) {
          // in native case return the linked value
          const ariaValues = this.template.querySelector('input').getAttribute('aria-describedby');
          return filterNonAutoLink(ariaValues);
        }

        return this._ariaDescribedBy;
      }

      synchronizeA11y() {
        const input = this.template.querySelector('input');
        const datepicker = this.template.querySelector('lightning-datepicker');
        const timepicker = this.template.querySelector('lightning-timepicker');

        if (datepicker) {
          synchronizeAttrs(datepicker, {
            ariaLabelledByElement: this.ariaLabelledBy,
            ariaDescribedByElements: this.ariaDescribedBy,
            ariaControlsElement: this.ariaControls,
            [ARIA_LABEL$2]: this.computedAriaLabel
          });
          return;
        }

        if (timepicker) {
          synchronizeAttrs(timepicker, {
            ariaLabelledByElement: this.ariaLabelledBy,
            ariaDescribedByElements: this.ariaDescribedBy,
            ariaControlsElement: this.ariaControls,
            [ARIA_LABEL$2]: this.computedAriaLabel
          });
          return;
        }

        if (!input) {
          return;
        }

        synchronizeAttrs(input, {
          [ARIA_LABELEDBY]: this.computedAriaLabelledBy,
          [ARIA_DESCRIBEDBY$3]: this.computedAriaDescribedBy,
          [ARIA_CONTROLS$2]: this.computedAriaControls,
          [ARIA_LABEL$2]: this.computedAriaLabel
        });
      }

      connectedCallback() {
        this.classList.add('slds-form-element');
        this.updateClassList();
        this.validateRequiredAttributes();
        this._connected = true;
        this.interactingState = new InteractingState();
        this.interactingState.onleave(() => this.reportValidity());
      }

      updateClassList() {
        classListMutation(this.classList, {
          'slds-form-element_stacked': this.variant === VARIANT.LABEL_STACKED,
          'slds-form-element_horizontal': this.variant === VARIANT.LABEL_INLINE
        });
      }

      disconnectedCallback() {
        this._connected = false;
        this._initialValueSet = false;
        this._inputElement = undefined;
      }

      renderedCallback() {
        if (!this._initialValueSet && this.inputElement) {
          this.inputElement.value = this.displayedValue;

          if (this.isTypeCheckable) {
            this.inputElement.checked = this._checked;
          }

          this._initialValueSet = true;
        }

        this.ariaObserver.sync();
        this.synchronizeA11y();
      }
      /**
       * String value with the formatter to be used for number input. Valid values include
       * decimal, percent, percent-fixed, and currency.
       * @type {string}
       */


      get formatter() {
        return this._formatter;
      }

      set formatter(value) {
        this._formatter = normalizeString(value, {
          fallbackValue: DEFAULT_FORMATTER,
          validValues: VALID_NUMBER_FORMATTERS
        });

        this._updateInputDisplayValueIfTypeNumber();
      }
      /**
       * The type of the input. This value defaults to text.
       * @type {string}
       * @default text
       */


      get type() {
        return this._type;
      }

      set type(value) {
        const normalizedValue = normalizeString(value);
        this._type = normalizedValue === 'datetime' ? 'datetime-local' : normalizedValue;
        this.validateType(normalizedValue);
        this._inputElementRefreshNeeded = true;

        if (this._connected) {
          // The type is being changed after render, which means the input element may be different (eg. changing
          // from text to 'checkbox', so we need to set the initial value again
          this._initialValueSet = false;
        }

        this._updateProxyInputAttributes(['type', 'value', 'max', 'min', 'required', 'pattern']);
      }
      /**
       * For the search type only. If present, a spinner is displayed to indicate that data is loading.
       * @type {boolean}
       * @default false
       */


      get isLoading() {
        return this._isLoading;
      }

      set isLoading(value) {
        this._isLoading = normalizeBoolean(value);
      }
      /**
       * Specifies the regular expression that the input's value is checked against.
       * This attribute is supported for email, password, search, tel, text, and url types.
       * @type {string}
       *
       */


      get pattern() {
        if (this.isTypeColor) {
          return '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$';
        }

        return this._pattern;
      }

      set pattern(value) {
        this._pattern = value;

        this._updateProxyInputAttributes('pattern');
      }
      /**
       * The maximum number of characters allowed in the field.
       * Use this attribute with email, password, search, tel, text, and url input types only.
       * @type {number}
       */


      get maxLength() {
        return this._maxLength;
      }

      set maxLength(value) {
        this._maxLength = value;

        this._updateProxyInputAttributes('maxlength');
      }
      /**
       * Specifies the types of files that the server accepts. Use this attribute with file input type only.
       * @type {string}
       */


      get accept() {
        return this._accept;
      }

      set accept(value) {
        this._accept = value;

        this._updateProxyInputAttributes('accept');
      }
      /**
       * The minimum number of characters allowed in the field.
       * Use this attribute with email, password, search, tel, text, and url input types only.
       * @type {number}
       */


      get minLength() {
        return this._minLength;
      }

      set minLength(value) {
        this._minLength = value;

        this._updateProxyInputAttributes('minlength');
      } // number and date/time

      /**
       * The maximum acceptable value for the input.  Use this attribute with number,
       * range, date, time, and datetime input types only. For number and range type, the max value is a
       * decimal number. For the date, time, and datetime types, the max value must use a valid string for the type.
       * @type {decimal|string}
       */


      get max() {
        return this._max;
      }

      set max(value) {
        this._max = value;

        this._updateProxyInputAttributes('max');
      }
      /**
       * The minimum acceptable value for the input. Use this attribute with number,
       * range, date, time, and datetime input types only. For number and range types, the min value
       * is a decimal number. For the date, time, and datetime types, the min value must use a valid string for the type.
       * @type {decimal|string}
       */


      get min() {
        return this._min;
      }

      set min(value) {
        this._min = value;

        this._updateProxyInputAttributes('min');
      }
      /**
       * Granularity of the value, specified as a positive floating point number.
       * Use this attribute with number and range input types only.
       * Use 'any' when granularity is not a concern. This value defaults to 1.
       * @type {decimal|string}
       * @default 1
       */


      get step() {
        const stepNotSupportedYet = this.isTypeDateTime || this.isTypeTime; // The step attribute is broken on IE11; e.g. 123.45 with step=0.01 returns stepMismatch. See W-5356698 for details.

        const nativeStepBroken = this.isTypeNumber && isIE11;

        if (stepNotSupportedYet || nativeStepBroken) {
          return 'any';
        }

        return this._step;
      }

      set step(value) {
        this._step = normalizeInput(value);

        this._updateProxyInputAttributes('step');

        this._calculateFractionDigitsFromStep(value);

        this._updateInputDisplayValueIfTypeNumber();
      }
      /**
       * If present, the checkbox is selected.
       * @type {boolean}
       * @default false
       */


      get checked() {
        // checkable inputs can be part of a named group, in that case there won't be a change event thrown and so
        // the internal tracking _checked would be out of sync with the actual input value.
        if (this.isTypeCheckable && this._initialValueSet) {
          return this.inputElement.checked;
        }

        return this._checked;
      }

      set checked(value) {
        this._checked = normalizeBoolean(value);

        this._updateProxyInputAttributes('checked');

        if (this._connected) {
          this.inputElement.checked = this._checked;
        }
      }
      /**
       * Specifies that a user can enter more than one value. Use this attribute with file and email input types only.
       * @type {boolean}
       * @default false
       */


      get multiple() {
        return this._multiple;
      }

      set multiple(value) {
        this._multiple = normalizeBoolean(value);

        this._updateProxyInputAttributes('multiple');
      }
      /**
       * Specifies the value of an input element.
       * @type {object}
       */


      get value() {
        return this._value;
      }

      set value(value) {
        this._value = normalizeInput(value);

        this._updateProxyInputAttributes('value'); // Setting value of a type file isn't allowed, but due to the design of Aura/LWC interop layer
        // it will try to set the value after a change event


        if (!this.isTypeFile) {
          // Again, due to the interop layer we need to check whether the value being set
          // is different, otherwise we're duplicating the sets on the input, which result
          // in different bugs like Japanese IME duplication of characters in Safari (likely a browser bug) or
          // character position re-set in IE11.
          if (this._connected && this.inputElement.value !== this.displayedValue) {
            this.inputElement.value = this.displayedValue;
          }
        }
      }
      /**
       * The variant changes the appearance of an input field.
       * Accepted variants include standard, label-inline, label-hidden, and label-stacked.
       * This value defaults to standard, which displays the label above the field.
       * Use label-hidden to hide the label but make it available to assistive technology.
       * Use label-inline to horizontally align the label and input field.
       * Use label-stacked to place the label above the input field.
       * @type {string}
       * @default standard
       */


      get variant() {
        return this._variant || VARIANT.STANDARD;
      }

      set variant(value) {
        this._variant = normalizeVariant(value);
        this.updateClassList();
      }
      /**
       * If present, the input field is disabled and users cannot interact with it.
       * @type {boolean}
       * @default false
       */


      get disabled() {
        return this._disabled;
      }

      set disabled(value) {
        this._disabled = normalizeBoolean(value);

        this._updateProxyInputAttributes('disabled');
      }
      /**
       * If present, the input field is read-only and cannot be edited by users.
       * @type {boolean}
       * @default false
       */


      get readOnly() {
        return this._readOnly;
      }

      set readOnly(value) {
        this._readOnly = normalizeBoolean(value);

        this._updateProxyInputAttributes('readonly');
      }
      /**
       * If present, the input field must be filled out before the form is submitted.
       * @type {boolean}
       * @default false
       */


      get required() {
        return this._required;
      }

      set required(value) {
        this._required = normalizeBoolean(value);

        this._updateProxyInputAttributes('required');
      }
      /**
       * Specifies the time zone used when type='datetime' only. This value defaults to the user's Salesforce time zone setting.
       * @type {string}
       *
       */


      get timezone() {
        return this._timezone || getLocale().timezone;
      }

      set timezone(value) {
        this._timezone = value; // mobile date/time normalization of value/max/min depends on timezone, so we need to update here as well

        this._updateProxyInputAttributes(['value', 'max', 'min']);
      }
      /**
       * A FileList that contains selected files. Use this attribute with the file input type only.
       * @type {object}
       *
       */


      get files() {
        if (this.isTypeFile) {
          return lwc.unwrap(this._files);
        }

        return null;
      }
      /**
       * Represents the validity states that an element can be in, with respect to constraint validation.
       * @type {object}
       *
       */


      get validity() {
        return this._constraint.validity;
      }
      /**
       * Checks if the input is valid.
       * @returns {boolean} Indicates whether the element meets all constraint validations.
       */


      checkValidity() {
        return this._constraint.checkValidity();
      }
      /**
       * Sets a custom error message to be displayed when a form is submitted.
       * @param {string} message - The string that describes the error. If message is an empty string, the error message is reset.
       */


      setCustomValidity(message) {
        this._constraint.setCustomValidity(message);
      }
      /**
       * Displays the error messages and returns false if the input is invalid.
       * If the input is valid, reportValidity() clears displayed error messages and returns true.
       * @returns {boolean} - The validity status of the input fields.
       */


      reportValidity() {
        return this._constraint.reportValidity(message => {
          if (this._connected && !this.isNativeInput) {
            this.inputElement.showHelpMessage(message);
          } else {
            this._helpMessage = message;
          }
        });
      }

      get isNativeInput() {
        return !(this.isTypeDesktopDate || this.isTypeDesktopDateTime || this.isTypeDesktopTime);
      }

      set fieldLevelHelp(value) {
        this._fieldLevelHelp = value;
      }
      /**
       * Help text detailing the purpose and function of the input.
       * This attribute isn't supported for file, radio, toggle, and checkbox-button types.
       * @type {string}
       *
       */


      get fieldLevelHelp() {
        return this._fieldLevelHelp;
      }
      /**
       * Sets focus on the input element.
       */


      focus() {
        if (this._connected) {
          this.inputElement.focus();
        }
      }
      /**
       * Removes keyboard focus from the input element.
       */


      blur() {
        if (this._connected) {
          this.inputElement.blur();
        }
      }
      /**
       * Displays error messages on invalid fields.
       * An invalid field fails at least one constraint validation and returns false when checkValidity() is called.
       */


      showHelpMessageIfInvalid() {
        this.reportValidity();
      }

      get computedAriaControls() {
        const ariaValues = []; // merge all date & time arias on mobile since it's displayed as a single field

        if (this.isTypeMobileDateTime) {
          ariaValues.push(this.dateAriaControls);
          ariaValues.push(this.timeAriaControls);
        }

        if (this.ariaControls) {
          ariaValues.push(this.ariaControls);
        }

        return normalizeAriaAttribute(ariaValues);
      }

      get computedAriaLabel() {
        const ariaValues = []; // merge all date & time arias on mobile since it's displayed as a single field

        if (this.isTypeMobileDateTime) {
          ariaValues.push(this.dateAriaLabel);
          ariaValues.push(this.timeAriaLabel);
        }

        if (this.ariaLabel) {
          ariaValues.push(this.ariaLabel);
        }

        return normalizeAriaAttribute(ariaValues);
      }

      get computedAriaLabelledBy() {
        const ariaValues = [];

        if (this.isTypeFile) {
          ariaValues.push(this.computedUniqueFileElementLabelledById);
        } // merge all date & time arias on mobile since it's displayed as a single field


        if (this.isTypeMobileDateTime) {
          ariaValues.push(this.dateAriaLabelledBy);
          ariaValues.push(this.timeAriaLabelledBy);
        }

        if (this.ariaLabelledBy) {
          ariaValues.push(this.ariaLabelledBy);
        }

        return normalizeAriaAttribute(ariaValues);
      }

      get computedAriaDescribedBy() {
        const ariaValues = [];

        if (this._helpMessage) {
          ariaValues.push(this.computedUniqueHelpElementId);
        } // The toggle type is described by a secondary element


        if (this.isTypeToggle) {
          ariaValues.push(this.computedUniqueToggleElementDescribedById);
        } // merge all date & time arias on mobile since it's displayed as a single field


        if (this.isTypeMobileDateTime) {
          ariaValues.push(this.dateAriaDescribedBy);
          ariaValues.push(this.timeAriaDescribedBy);
        }

        if (this.ariaDescribedBy) {
          ariaValues.push(this.ariaDescribedBy);
        }

        return normalizeAriaAttribute(ariaValues);
      }
      /**
       * Specifies a shortcut key to activate or focus an element.
       * @type {string}
       *
       */


      get accessKey() {
        return this._accesskey;
      }

      set accessKey(newValue) {
        this._accesskey = newValue;
      }

      get isLabelHidden() {
        return this.variant === VARIANT.LABEL_HIDDEN;
      }

      get isLabelStacked() {
        return this.variant === VARIANT.LABEL_STACKED;
      }

      get accesskey() {
        return this._accesskey;
      }

      get isTypeCheckable() {
        return this.isTypeCheckbox || this.isTypeCheckboxButton || this.isTypeRadio || this.isTypeToggle;
      }

      get colorInputElementValue() {
        return this.validity.valid && this.value ? this.value : DEFAULT_COLOR$1;
      }

      get colorInputStyle() {
        return `background: ${this.value || '#5679C0'};`;
      }

      get computedUniqueHelpElementId() {
        return getRealDOMId(this.template.querySelector('[data-help-message]'));
      }

      get computedUniqueToggleElementDescribedById() {
        if (this.isTypeToggle) {
          const toggle = this.template.querySelector('[data-toggle-description]');
          return getRealDOMId(toggle);
        }

        return null;
      }

      get computedUniqueFormLabelId() {
        if (this.isTypeFile) {
          const formLabel = this.template.querySelector('[data-form-label]');
          return getRealDOMId(formLabel);
        }

        return null;
      }

      get computedUniqueFileSelectorLabelId() {
        if (this.isTypeFile) {
          const fileBodyLabel = this.template.querySelector('[data-file-selector-label]');
          return getRealDOMId(fileBodyLabel);
        }

        return null;
      }

      get computedUniqueFileElementLabelledById() {
        if (this.isTypeFile) {
          const labelIds = [this.computedUniqueFormLabelId, this.computedUniqueFileSelectorLabelId];
          return labelIds.join(' ');
        }

        return null;
      }

      get computedFormElementClass() {
        const classes = classSet('slds-form-element__control slds-grow');

        if (this.isTypeSearch) {
          classes.add('slds-input-has-icon slds-input-has-icon_left-right');
        }

        return classes.toString();
      }

      get i18n() {
        return i18n$9;
      }

      get computedLabelClass() {
        const classnames = classSet('slds-form-element__label');

        if (this.isTypeCheckable || this.isTypeFile) ; else if (this.isTypeToggle) {
          classnames.add('slds-m-bottom_none');
        } else {
          classnames.add('slds-no-flex');
        }

        return classnames.add({
          'slds-assistive-text': this.isLabelHidden
        }).toString();
      }

      get computedNumberClass() {
        return classSet('slds-input').add({
          'slds-is-disabled': this.disabled
        }).toString();
      }

      get computedColorLabelClass() {
        return classSet('slds-color-picker__summary-label').add({
          'slds-assistive-text': this.isLabelHidden
        }).toString();
      }

      get computedCheckboxClass() {
        return classSet('slds-checkbox').add({
          'slds-checkbox_standalone': !this.isStandardVariant
        }).toString();
      }

      get normalizedMax() {
        return this.normalizeDateTimeString(this.max);
      }

      get normalizedMin() {
        return this.normalizeDateTimeString(this.min);
      }

      get isTypeNumber() {
        return this.type === 'number';
      }

      get isTypeSearch() {
        return this.type === 'search';
      }

      get isTypeToggle() {
        return this.type === 'toggle';
      }

      get isTypeText() {
        return this.type === 'text';
      }

      get isTypeCheckbox() {
        return this.type === 'checkbox';
      }

      get isTypeRadio() {
        return this.type === 'radio';
      }

      get isTypeCheckboxButton() {
        return this.type === 'checkbox-button';
      }

      get isTypeFile() {
        return this.type === 'file';
      }

      get isTypeColor() {
        return this.type === 'color';
      }

      get isTypeDate() {
        return this.type === 'date';
      }

      get isTypeDateTime() {
        return this.type === 'datetime' || this.type === 'datetime-local';
      }

      get isTypeTime() {
        return this.type === 'time';
      }

      get isTypeMobileDate() {
        return this.isTypeDate && !this.isDesktopBrowser();
      }

      get isTypeDesktopDate() {
        return this.isTypeDate && this.isDesktopBrowser();
      }

      get isTypeMobileDateTime() {
        return this.isTypeDateTime && !this.isDesktopBrowser();
      }

      get isTypeDesktopDateTime() {
        return this.isTypeDateTime && this.isDesktopBrowser();
      }

      get isTypeMobileTime() {
        return this.isTypeTime && !this.isDesktopBrowser();
      }

      get isTypeDesktopTime() {
        return this.isTypeTime && this.isDesktopBrowser();
      }

      get isTypeSimple() {
        return !this.isTypeCheckbox && !this.isTypeCheckboxButton && !this.isTypeToggle && !this.isTypeRadio && !this.isTypeFile && !this.isTypeColor && !this.isTypeDesktopDate && !this.isTypeDesktopDateTime && !this.isTypeDesktopTime;
      }

      get inputElement() {
        if (!this._connected) {
          return undefined;
        }

        if (!this._inputElement || this._inputElementRefreshNeeded) {
          let inputElement;

          if (this.isTypeDesktopDate) {
            inputElement = this.template.querySelector('lightning-datepicker');
          } else if (this.isTypeDesktopDateTime) {
            inputElement = this.template.querySelector('lightning-datetimepicker');
          } else if (this.isTypeDesktopTime) {
            inputElement = this.template.querySelector('lightning-timepicker');
          } else {
            inputElement = this.template.querySelector('input');
          }

          this._inputElementRefreshNeeded = false;
          this._inputElement = inputElement;
        }

        return this._inputElement;
      }

      get nativeInputType() {
        let inputType = 'text';

        if (this.isTypeSimple) {
          inputType = this.type;
        } else if (this.isTypeToggle || this.isTypeCheckboxButton || this.isTypeCheckbox) {
          inputType = 'checkbox';
        } else if (this.isTypeRadio) {
          inputType = 'radio';
        } else if (this.isTypeFile) {
          inputType = 'file';
        } else if (this.isTypeDateTime) {
          inputType = 'datetime-local';
        } else if (this.isTypeTime) {
          inputType = 'time';
        } else if (this.isTypeDate) {
          inputType = 'date';
        }

        return inputType;
      }

      clearAndSetFocusOnInput(event) {
        this.interactingState.enter();
        this.inputElement.value = '';

        this._updateValueAndValidityAttribute('');

        this.dispatchChangeEventWithDetail({
          value: this._value
        });
        this.inputElement.focus(); // button is removed from template, but
        // event still is propagated, For example, captured by panel,
        // then cause panel think is clicked outside.

        event.stopPropagation();
      }

      dispatchChangeEventWithDetail(detail) {
        this.dispatchEvent(new CustomEvent('change', {
          composed: true,
          bubbles: true,
          detail
        }));
      }

      getFormattedValue(value) {
        if (!this.isTypeNumber) {
          return value;
        }

        if (isEmptyString(value)) {
          return '';
        }

        let formattedValue = value;
        let inputValue = value; // set formatter style & default options

        const formatStyle = this.formatter;
        const formatOptions = {
          style: formatStyle
        }; // Use the min/max fraction digits from the formatFractionDigits provided by the user if available.
        // Otherwise, use the number of digits calculated from step

        if (this._formatFractionDigits !== undefined) {
          formatOptions.minimumFractionDigits = this._formatFractionDigits;
          formatOptions.maximumFractionDigits = this._formatFractionDigits;
        } else if (this._calculatedFractionDigits !== undefined) {
          formatOptions.minimumFractionDigits = this._calculatedFractionDigits;
          formatOptions.maximumFractionDigits = this._calculatedFractionDigits;
        }

        if (formatStyle === 'percent-fixed') {
          // percent-fixed just uses percent format and divides the value by 100
          // before passing to the library, this is to deal with the
          // fact that percentages in salesforce are 0-100, not 0-1
          formatOptions.style = 'percent';
          const inputValueAsString = inputValue.toString();
          const normalisedNumberInPercent = parseFloat(inputValue) / 100; // If the number contains fraction digits and is not in an exponent format

          if (inputValueAsString.indexOf('.') > 0 && inputValueAsString.indexOf('e') < 0) {
            // Depending on the input number, division by 100 may lead to rounding errors
            // (e.g 0.785 / 100 is 0.007850000000000001), so we need to round back
            // to the correct precision, that is - existing number of fractional digits
            // plus extra 2 for division by 100.
            inputValue = normalisedNumberInPercent.toFixed(inputValueAsString.split('.')[1].length + 2);
          } else {
            inputValue = normalisedNumberInPercent;
          }
        }

        try {
          formattedValue = numberFormat(formatOptions).format(inputValue) || '';
        } catch (ignore) {// ignore any errors
        }

        return formattedValue;
      }

      validateType(type) {
        assert$1(type !== 'hidden', `<lightning-input> The type attribute value "hidden" is invalid. Use a regular <input type="hidden"> instead.`);
        assert$1(type !== 'submit' && type !== 'reset' && type !== 'image' && type !== 'button', `<lightning-input> The type attribute value "${type}" is invalid. Use <lightning:button> instead.`);

        if (this.isTypeRadio) {
          assert$1(!this.required, `<lightning-input> The required attribute is not supported on radio inputs directly. It should be implemented at the radio group level.`);
        }
      }

      validateRequiredAttributes() {
        const {
          label
        } = this;
        assert$1(typeof label === 'string' && label.length, `<lightning-input> The required label attribute value "${label}" is invalid.`);
      }

      handleFileClick() {
        this.inputElement.value = null;

        this._updateValueAndValidityAttribute(null);
      }

      handleDropFiles(event) {
        // drop doesn't trigger focus nor blur, so set state to interacting
        // and auto leave when there's no more action
        this.interactingState.interacting();
        this.fileUploadedViaDroppableZone = true;
        this._files = event.dataTransfer && event.dataTransfer.files;

        this._updateProxyInputAttributes('required');

        this.dispatchChangeEventWithDetail({
          files: lwc.unwrap(this._files)
        });
      } // We need this handler to account for mobile platforms' soft keyboards.
      // The type of the underlying native input for type="number" needs to be changed before the focus event is triggered,
      // this way the correct soft keyboard is shown on iOS, and on Android you don't need to tap twice to get the
      // keyboard to show.
      //
      // The minor side-effect of this is that if a touch drag ends on the input, the input will change type and
      // displayed value without the focus being triggered.


      handleTouchEnd() {
        if (this._connected && this.isTypeNumber) {
          this._switchInputTypeToNumber();
        }
      }

      handleFocus() {
        this.interactingState.enter();

        if (this.isTypeColor) {
          this._isColorPickerPanelOpen = false;
        }

        if (this._connected && this.isTypeNumber) {
          this._switchInputTypeToNumber();
        } // W-6176985: IE11 input when set value, will move cursor to beginning.
        // This fix is only for input type=number on IE11, and force the cursor to the end.


        if (isIE11 && this.isTypeNumber) {
          const length = this.inputElement.value.length;
          this.inputElement.selectionStart = length;
          this.inputElement.selectionEnd = length;
        }

        this.dispatchEvent(new CustomEvent('focus'));
      }

      handleBlur(event) {
        this.interactingState.leave();

        if (this._connected && this.isTypeNumber) {
          // Don't need to change type to text and show the formatted number when value is empty.
          // This also fixes the issue where the component resets to empty string when
          // there's invalid value since input in badInput validity state gives us back an empty
          // string instead of the invalid value.
          this._showRawNumber = isEmptyString(this._value);

          if (!this._showRawNumber) {
            this.inputElement.type = 'text';
            this.inputElement.value = this.displayedValue;
          }
        }

        if (!event.relatedTarget || !this.template.contains(event.relatedTarget)) {
          this.dispatchEvent(new CustomEvent('blur'));
        }
      }

      handleChange(event) {
        event.stopPropagation();

        if (this.isTypeSimple && this.value === event.target.value) {
          return;
        }

        this.dispatchChangeEvent();
      }

      handleInput(event) {
        event.stopPropagation();

        if (this.isTypeSimple && this.value === event.target.value) {
          return;
        }

        this.dispatchChangeEvent();
      }

      handleKeyPress(event) {
        if (this.isTypeNumber && !this.isFunctionKeyStroke(event) && !this.isValidNumericKeyStroke(event)) {
          event.preventDefault();
        }
      }

      dispatchChangeEvent() {
        this.interactingState.enter();
        const detail = {};

        if (this.isTypeCheckable) {
          this._updateCheckedAndValidityAttribute(this.inputElement.checked);

          detail.checked = this._checked;
        } else if (this.isTypeFile) {
          this._files = this.inputElement.files; // this.template.querySelector returns a proxy, and .files would also be proxied
          // we're unwrapping it here so that native apis can be used on it

          detail.files = lwc.unwrap(this._files);

          this._updateProxyInputAttributes('required');
        }

        if (!this.isTypeCheckable) {
          detail.value = this.inputElement.value;

          if (this.isTypeMobileDateTime) {
            detail.value = normalizeDateTimeToUTC(detail.value, this.timezone);
          } else if (this.isTypeMobileTime) {
            detail.value = normalizeTime(detail.value);
          }

          this._updateValueAndValidityAttribute(detail.value);
        }

        this.dispatchChangeEventWithDetail(detail);
      }

      get _showClearButton() {
        return this.isTypeSearch && this._value !== undefined && this._value !== null && this._value !== '';
      }

      handleColorPickerToggleClick(event) {
        event.preventDefault(); // Don't want error state inside panel

        if (!this.validity.valid) {
          this.inputElement.value = DEFAULT_COLOR$1;

          this._updateValueAndValidityAttribute(DEFAULT_COLOR$1);

          this._helpMessage = null;
          this.classList.remove('slds-has-error');
          this.dispatchChangeEventWithDetail({
            value: DEFAULT_COLOR$1
          });
        }
      }

      handleColorChange(event) {
        const selectedColor = event.detail.color;

        if (selectedColor !== this.inputElement.value) {
          this.inputElement.value = selectedColor;

          this._updateValueAndValidityAttribute(selectedColor);

          this.focus();
          this.dispatchChangeEventWithDetail({
            value: selectedColor
          });
        }

        this.template.querySelector('lightning-primitive-colorpicker-button').focus();
      }

      isNonPrintableKeyStroke(keyCode) {
        return Object.keys(keyCodes).some(code => keyCodes[code] === keyCode);
      }

      isFunctionKeyStroke(event) {
        return event.ctrlKey || event.metaKey || this.isNonPrintableKeyStroke(event.keyCode);
      }

      isValidNumericKeyStroke(event) {
        return /^[0-9eE.,+-]$/.test(event.key);
      }

      isDesktopBrowser() {
        return getFormFactor() === 'DESKTOP';
      }

      normalizeDateTimeString(value) {
        let result = value;

        if (this.isTypeDate) {
          result = normalizeDate(value);
        } else if (this.isTypeTime) {
          result = normalizeTime(value);
        } else if (this.isTypeDateTime) {
          result = normalizeUTCDateTime(value, this.timezone);
        }

        return result;
      }

      get displayedValue() {
        if (this.isTypeNumber && !this._showRawNumber) {
          return this.getFormattedValue(this._value);
        }

        if (this.isTypeMobileDate || this.isTypeMobileDateTime || this.isTypeMobileTime) {
          return this.normalizeDateTimeString(this._value);
        }

        return this._value;
      }

      get _internalType() {
        if (this.isTypeNumber) {
          return 'text';
        }

        return this._type;
      }

      get isStandardVariant() {
        return this.variant === VARIANT.STANDARD || this.variant === VARIANT.LABEL_HIDDEN;
      }

      _updateValueAndValidityAttribute(value) {
        this._value = value;

        this._updateProxyInputAttributes('value');
      }

      _updateCheckedAndValidityAttribute(value) {
        this._checked = value;

        this._updateProxyInputAttributes('checked');
      }

      _calculateFractionDigitsFromStep(step) {
        // clear any previous value if set
        this._calculatedFractionDigits = undefined;

        if (step && step !== 'any') {
          let numDecimals = 0; // calculate number of decimals using step

          const decimals = String(step).split('.')[1]; // we're parsing the decimals to account for cases where the step is
          // '1.0'

          if (decimals && parseInt(decimals, 10) > 0) {
            numDecimals = decimals.length;
          }

          this._calculatedFractionDigits = numDecimals;
        }
      }

      get _ignoreRequired() {
        // If uploading via the drop zone or via the input directly, we should
        // ignore the required flag as a file has been uploaded
        return this.isTypeFile && this._required && (this.fileUploadedViaDroppableZone || this._files && this._files.length > 0);
      }

      _updateProxyInputAttributes(attributes) {
        if (this._constraintApiProxyInputUpdater) {
          this._constraintApiProxyInputUpdater(attributes);
        }
      }

      get _constraint() {
        if (!this._constraintApi) {
          const overrides = {
            badInput: () => {
              if (!this._connected) {
                return false;
              }

              if (this.isTypeNumber && this.getFormattedValue(this._value) === 'NaN') {
                return true;
              }

              if (!this.isNativeInput) {
                return this.inputElement.hasBadInput();
              }

              return this.inputElement.validity.badInput;
            },
            tooLong: () => // since type=number is type=text in the dom when not in focus
            // we should always return false as maxlength doesn't apply
            this.isNativeInput && !this.isTypeNumber && this._connected && this.inputElement.validity.tooLong,
            tooShort: () => // since type=number is type=text in the dom when not in focus
            // we should always return false as minlength doesn't apply
            this.isNativeInput && !this.isTypeNumber && this._connected && this.inputElement.validity.tooShort,
            patternMismatch: () => this.isNativeInput && this._connected && this.inputElement.validity.patternMismatch
          }; // FF, IE and Safari don't support type datetime-local,
          // IE and Safari don't support type date or time
          // we need to defer to the base component to check rangeOverflow/rangeUnderflow.
          // Due to the custom override, changing the type to or from datetime/time would affect the validation

          if (this.isTypeDesktopDateTime || this.isTypeDesktopTime || this.isTypeDesktopDate) {
            overrides.rangeOverflow = () => {
              // input type='time' is timezone agnostic, so we should remove the timezone designator before comparison
              const max = this.isTypeDesktopTime ? normalizeTime(this.max) : this.max;
              return isAfter$1(this.value, max);
            };

            overrides.rangeUnderflow = () => {
              // input type='time' is timezone agnostic, so we should remove the timezone designator before comparison
              const min = this.isTypeDesktopTime ? normalizeTime(this.min) : this.min;
              return isBefore$1(this.value, min);
            };
          }

          this._constraintApi = new FieldConstraintApiWithProxyInput(() => {
            // The date/time components display their own errors and have custom messages for badInput and rangeOverflow/Underflow.
            if (!this.isNativeInput) {
              return this.inputElement;
            }

            return this;
          }, overrides);
          this._constraintApiProxyInputUpdater = this._constraint.setInputAttributes({
            type: () => this.nativeInputType,
            // We need to normalize value so that it's consumable by the proxy input (otherwise the value
            // will be invalid for the native input)
            value: () => this.normalizeDateTimeString(this.value),
            checked: () => this.checked,
            maxlength: () => this.maxLength,
            minlength: () => this.minLength,
            // 'pattern' depends on type
            pattern: () => this.pattern,
            // 'max' and 'min' depend on type and timezone
            max: () => this.normalizedMax,
            min: () => this.normalizedMin,
            step: () => this.step,
            accept: () => this.accept,
            multiple: () => this.multiple,
            disabled: () => this.disabled,
            readonly: () => this.readOnly,
            // depends on type and whether an upload has been made
            required: () => this.required && !this._ignoreRequired
          });
        }

        return this._constraintApi;
      }

      _updateInputDisplayValueIfTypeNumber() {
        // Displayed value depends on the format number, so if we're not showing the raw
        // number we should update the value
        if (this._connected && this.isTypeNumber && !this._showRawNumber && this.inputElement) {
          this.inputElement.value = this.displayedValue;
        }
      }

      _switchInputTypeToNumber() {
        this._showRawNumber = true;
        this.inputElement.value = this.displayedValue;
        this.inputElement.inputMode = 'decimal'; // The below check is needed due to a bug in Firefox with switching the
        // type to/from 'number'.
        // Remove the check once https://bugzilla.mozilla.org/show_bug.cgi?id=981248 is fixed

        const isFirefox = navigator.userAgent.indexOf('Firefox') >= 0;

        if (isFirefox) {
          if (this.validity.badInput) {
            // reset value manually for Firefox to emulate the behaviour of
            // a native input type number
            this.inputElement.value = '';
          }
        } else {
          this.inputElement.type = 'number';
        }
      }

    }

    LightningInput.delegatesFocus = true;

    lwc.registerDecorators(LightningInput, {
      publicProps: {
        placeholder: {
          config: 0
        },
        name: {
          config: 0
        },
        label: {
          config: 0
        },
        messageWhenBadInput: {
          config: 0
        },
        messageWhenPatternMismatch: {
          config: 0
        },
        messageWhenRangeOverflow: {
          config: 0
        },
        messageWhenRangeUnderflow: {
          config: 0
        },
        messageWhenStepMismatch: {
          config: 0
        },
        messageWhenTooShort: {
          config: 0
        },
        messageWhenTooLong: {
          config: 0
        },
        messageWhenTypeMismatch: {
          config: 0
        },
        messageWhenValueMissing: {
          config: 0
        },
        messageToggleActive: {
          config: 0
        },
        messageToggleInactive: {
          config: 0
        },
        ariaLabel: {
          config: 0
        },
        autocomplete: {
          config: 0
        },
        formatFractionDigits: {
          config: 3
        },
        timeAriaControls: {
          config: 3
        },
        dateStyle: {
          config: 0
        },
        timeStyle: {
          config: 0
        },
        dateAriaLabel: {
          config: 0
        },
        dateAriaLabelledBy: {
          config: 3
        },
        timeAriaLabelledBy: {
          config: 3
        },
        timeAriaDescribedBy: {
          config: 3
        },
        dateAriaControls: {
          config: 3
        },
        dateAriaDescribedBy: {
          config: 3
        },
        ariaControls: {
          config: 3
        },
        ariaLabelledBy: {
          config: 3
        },
        ariaDescribedBy: {
          config: 3
        },
        formatter: {
          config: 3
        },
        type: {
          config: 3
        },
        isLoading: {
          config: 3
        },
        pattern: {
          config: 3
        },
        maxLength: {
          config: 3
        },
        accept: {
          config: 3
        },
        minLength: {
          config: 3
        },
        max: {
          config: 3
        },
        min: {
          config: 3
        },
        step: {
          config: 3
        },
        checked: {
          config: 3
        },
        multiple: {
          config: 3
        },
        value: {
          config: 3
        },
        variant: {
          config: 3
        },
        disabled: {
          config: 3
        },
        readOnly: {
          config: 3
        },
        required: {
          config: 3
        },
        timezone: {
          config: 3
        },
        files: {
          config: 1
        },
        validity: {
          config: 1
        },
        fieldLevelHelp: {
          config: 3
        },
        accessKey: {
          config: 3
        }
      },
      publicMethods: ["checkValidity", "setCustomValidity", "reportValidity", "focus", "blur", "showHelpMessageIfInvalid"],
      track: {
        _timeAriaDescribedBy: 1,
        _timeAriaLabelledBy: 1,
        _timeAriaControls: 1,
        _dateAriaControls: 1,
        _dateAriaDescribedBy: 1,
        _dateAriaLabelledBy: 1,
        _value: 1,
        _type: 1,
        _pattern: 1,
        _max: 1,
        _min: 1,
        _step: 1,
        _disabled: 1,
        _readOnly: 1,
        _required: 1,
        _checked: 1,
        _isLoading: 1,
        _multiple: 1,
        _timezone: 1,
        _helpMessage: 1,
        _isColorPickerPanelOpen: 1,
        _fieldLevelHelp: 1,
        _accesskey: 1,
        _maxLength: 1,
        _minLength: 1,
        _accept: 1,
        _variant: 1,
        _connected: 1
      }
    });

    var _lightningInput = lwc.registerComponent(LightningInput, {
      tmpl: _tmpl$i
    });
    LightningInput.interopMap = {
      exposeNativeEvent: {
        change: true,
        focus: true,
        blur: true
      }
    };

    function tmpl$k($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "required": $cmp.required,
          "label": $cmp.columnLabel,
          "name": "dt-inline-edit-text",
          "variant": "label-hidden",
          "value": $cmp.editedValue
        },
        key: 2
      }, [])];
    }

    var TextTpl = lwc.registerTemplate(tmpl$k);
    tmpl$k.stylesheets = [];
    tmpl$k.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_text-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_text"
    };

    function tmpl$l($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "required": $cmp.required,
          "type": "tel",
          "label": $cmp.columnLabel,
          "name": "dt-inline-edit-phone",
          "variant": "label-hidden",
          "value": $cmp.editedValue
        },
        key: 2
      }, [])];
    }

    var PhoneTpl = lwc.registerTemplate(tmpl$l);
    tmpl$l.stylesheets = [];
    tmpl$l.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_phone-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_phone"
    };

    function tmpl$m($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "required": $cmp.required,
          "type": "email",
          "label": $cmp.columnLabel,
          "name": "dt-inline-edit-email",
          "variant": "label-hidden",
          "value": $cmp.editedValue
        },
        key: 2
      }, [])];
    }

    var EmailTpl = lwc.registerTemplate(tmpl$m);
    tmpl$m.stylesheets = [];
    tmpl$m.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_email-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_email"
    };

    function tmpl$n($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "required": $cmp.required,
          "type": "number",
          "formatter": "percent",
          "step": "0.01",
          "label": $cmp.columnLabel,
          "name": "dt-inline-edit-percent",
          "variant": "label-hidden",
          "value": $cmp.editedValue
        },
        key: 2
      }, [])];
    }

    var PercentTpl = lwc.registerTemplate(tmpl$n);
    tmpl$n.stylesheets = [];
    tmpl$n.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_percent-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_percent"
    };

    function tmpl$o($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "required": $cmp.required,
          "type": "url",
          "label": $cmp.columnLabel,
          "name": "dt-inline-edit-url",
          "variant": "label-hidden",
          "value": $cmp.editedValue
        },
        key: 2
      }, [])];
    }

    var UrlTpl = lwc.registerTemplate(tmpl$o);
    tmpl$o.stylesheets = [];
    tmpl$o.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_url-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_url"
    };

    function tmpl$p($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "required": $cmp.required,
          "type": "number",
          "formatter": "currency",
          "step": "0.01",
          "label": $cmp.columnLabel,
          "name": "dt-inline-edit-currency",
          "variant": "label-hidden",
          "value": $cmp.editedValue
        },
        key: 2
      }, [])];
    }

    var CurrencyTpl = lwc.registerTemplate(tmpl$p);
    tmpl$p.stylesheets = [];
    tmpl$p.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_currency-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_currency"
    };

    function tmpl$q($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "required": $cmp.required,
          "type": "number",
          "label": $cmp.columnLabel,
          "step": "any",
          "name": "dt-inline-edit-number",
          "variant": "label-hidden",
          "value": $cmp.editedValue
        },
        key: 2
      }, [])];
    }

    var NumberTpl = lwc.registerTemplate(tmpl$q);
    tmpl$q.stylesheets = [];
    tmpl$q.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_number-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_number"
    };

    function tmpl$r($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "required": $cmp.required,
          "type": "checkbox",
          "label": $cmp.columnLabel,
          "name": "dt-inline-edit-text",
          "checked": $cmp.editedValue
        },
        key: 2
      }, [])];
    }

    var BooleanTpl = lwc.registerTemplate(tmpl$r);
    tmpl$r.stylesheets = [];
    tmpl$r.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_boolean-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_boolean"
    };

    function tmpl$s($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        classMap: {
          "datatable-inline-edit": true
        },
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "type": "date",
          "label": $cmp.columnLabel,
          "name": "dt-inline-edit-dateLocal",
          "variant": "label-hidden",
          "value": $cmp.editedValue
        },
        key: 2
      }, [])];
    }

    var DateLocalTpl = lwc.registerTemplate(tmpl$s);
    tmpl$s.stylesheets = [];
    tmpl$s.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_dateLocal-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_dateLocal"
    };

    function tmpl$t($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-inputable": "true"
        },
        props: {
          "type": "datetime",
          "label": $cmp.columnLabel,
          "name": "dt-inline-edit-datetime",
          "variant": "label-hidden",
          "value": $cmp.editedDateValue
        },
        key: 2
      }, [])];
    }

    var DateTpl = lwc.registerTemplate(tmpl$t);
    tmpl$t.stylesheets = [];
    tmpl$t.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_date-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_date"
    };

    function tmpl$u($api, $cmp, $slotset, $ctx) {
      return [];
    }

    var DefaultTpl = lwc.registerTemplate(tmpl$u);
    tmpl$u.stylesheets = [];
    tmpl$u.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditTypeFactory_default-host",
      shadowAttribute: "lightning-primitiveDatatableIeditTypeFactory_default"
    };

    const TYPE_TPL_MAPPINGS = {
      text: TextTpl,
      phone: PhoneTpl,
      email: EmailTpl,
      percent: PercentTpl,
      url: UrlTpl,
      currency: CurrencyTpl,
      number: NumberTpl,
      boolean: BooleanTpl,
      'date-local': DateLocalTpl,
      date: DateTpl
    };
    const INVALID_TYPE_FOR_EDIT = 'column type not supported for inline edit';

    class LightningPrimitiveDatatableIeditTypeFactory extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.columnLabel = void 0;
        this.editedValue = void 0;
        this.required = void 0;
      }

      get columnDef() {
        return this._columnDef;
      }

      set columnDef(value) {
        assert$1(TYPE_TPL_MAPPINGS.hasOwnProperty(value.type), INVALID_TYPE_FOR_EDIT);
        this._columnDef = value;
        this.columnLabel = value.label;
      }

      get columnType() {
        return this._columnDef.type;
      }

      render() {
        return TYPE_TPL_MAPPINGS[this.columnType] || DefaultTpl;
      }

      connectedCallback() {
        this._blurHandler = this.handleComponentBlur.bind(this);
        this._focusHandler = this.handleComponentFocus.bind(this);
        this._changeHandler = this.handleComponentChange.bind(this);
      }

      renderedCallback() {
        this.concreteComponent.addEventListener('blur', this._blurHandler);
        this.concreteComponent.addEventListener('focus', this._focusHandler);
        this.concreteComponent.addEventListener('change', this._changeHandler);
      }

      get concreteComponent() {
        return this.template.querySelector('[data-inputable="true"]');
      }

      focus() {
        if (this.concreteComponent) {
          this.concreteComponent.focus();
        }
      }

      get value() {
        if (this.columnDef.type === 'boolean') {
          return this.concreteComponent.checked;
        }

        return this.concreteComponent.value;
      }

      get validity() {
        return this.concreteComponent.validity;
      }

      showHelpMessageIfInvalid() {
        this.concreteComponent.showHelpMessageIfInvalid();
      }

      get editedDateValue() {
        const dateValue = new Date(this.editedValue);

        if (this.editedValue === null || isNaN(dateValue.getTime())) {
          return '';
        }

        return dateValue.toISOString();
      }

      handleComponentFocus() {
        this.dispatchEvent(new CustomEvent('focus'));
      }

      handleComponentBlur() {
        this.dispatchEvent(new CustomEvent('blur'));
      }

      handleComponentChange() {
        this.showHelpMessageIfInvalid();
      }

    }

    lwc.registerDecorators(LightningPrimitiveDatatableIeditTypeFactory, {
      publicProps: {
        editedValue: {
          config: 0
        },
        required: {
          config: 0
        },
        columnDef: {
          config: 3
        },
        value: {
          config: 1
        },
        validity: {
          config: 1
        }
      },
      publicMethods: ["focus", "showHelpMessageIfInvalid"],
      track: {
        columnLabel: 1
      }
    });

    var _lightningPrimitiveDatatableIeditTypeFactory = lwc.registerComponent(LightningPrimitiveDatatableIeditTypeFactory, {
      tmpl: _tmpl$1
    });

    function tmpl$v($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        d: api_dynamic,
        gid: api_scoped_id,
        b: api_bind,
        h: api_element
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [api_element("button", {
        className: $cmp.computedButtonClass,
        attrs: {
          "name": $cmp.name,
          "accesskey": $cmp.computedAccessKey,
          "title": $cmp.computedTitle,
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
          "focus": _m0 || ($ctx._m0 = api_bind($cmp.handleButtonFocus)),
          "blur": _m1 || ($ctx._m1 = api_bind($cmp.handleButtonBlur))
        }
      }, [$cmp.showIconLeft ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.iconName,
          "svgClass": $cmp.computedIconClass,
          "variant": "bare"
        },
        key: 4
      }, []) : null, api_dynamic($cmp.label), $cmp.showIconRight ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.iconName,
          "svgClass": $cmp.computedIconClass,
          "variant": "bare"
        },
        key: 6
      }, []) : null])];
    }

    var _tmpl$j = lwc.registerTemplate(tmpl$v);
    tmpl$v.stylesheets = [];
    tmpl$v.stylesheetTokens = {
      hostAttribute: "lightning-button_button-host",
      shadowAttribute: "lightning-button_button"
    };

    /**
     * A clickable element used to perform an action.
     */

    class LightningButton extends LightningPrimitiveButton$1 {
      constructor(...args) {
        super(...args);
        this.name = void 0;
        this.value = void 0;
        this.label = void 0;
        this.variant = 'neutral';
        this.iconName = void 0;
        this.iconPosition = 'left';
        this.type = 'button';
        this.title = null;
        this._order = null;
      }

      render() {
        return _tmpl$j;
      }

      get computedButtonClass() {
        return classSet('slds-button').add({
          'slds-button_neutral': this.normalizedVariant === 'neutral',
          'slds-button_brand': this.normalizedVariant === 'brand',
          'slds-button_destructive': this.normalizedVariant === 'destructive',
          'slds-button_inverse': this.normalizedVariant === 'inverse',
          'slds-button_success': this.normalizedVariant === 'success',
          'slds-button_first': this._order === 'first',
          'slds-button_middle': this._order === 'middle',
          'slds-button_last': this._order === 'last'
        }).toString();
      }

      get computedTitle() {
        return this.title;
      }

      get normalizedVariant() {
        return normalizeString(this.variant, {
          fallbackValue: 'neutral',
          validValues: ['base', 'neutral', 'brand', 'destructive', 'inverse', 'success']
        });
      }

      get normalizedType() {
        return normalizeString(this.type, {
          fallbackValue: 'button',
          validValues: ['button', 'reset', 'submit']
        });
      }

      get normalizedIconPosition() {
        return normalizeString(this.iconPosition, {
          fallbackValue: 'left',
          validValues: ['left', 'right']
        });
      }

      get showIconLeft() {
        return this.iconName && this.normalizedIconPosition === 'left';
      }

      get showIconRight() {
        return this.iconName && this.normalizedIconPosition === 'right';
      }

      get computedIconClass() {
        return classSet('slds-button__icon').add({
          'slds-button__icon_left': this.normalizedIconPosition === 'left',
          'slds-button__icon_right': this.normalizedIconPosition === 'right'
        }).toString();
      }

      handleButtonFocus() {
        this.dispatchEvent(new CustomEvent('focus'));
      }

      handleButtonBlur() {
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

      disconnectedCallback() {
        if (this._deRegistrationCallback) {
          this._deRegistrationCallback();
        }
      }

    }

    LightningButton.delegatesFocus = true;

    lwc.registerDecorators(LightningButton, {
      publicProps: {
        name: {
          config: 0
        },
        value: {
          config: 0
        },
        label: {
          config: 0
        },
        variant: {
          config: 0
        },
        iconName: {
          config: 0
        },
        iconPosition: {
          config: 0
        },
        type: {
          config: 0
        }
      },
      publicMethods: ["focus"],
      track: {
        title: 1,
        _order: 1
      }
    });

    var _lightningButton = lwc.registerComponent(LightningButton, {
      tmpl: _tmpl$j
    });
    LightningButton.interopMap = {
      exposeNativeEvent: {
        click: true,
        focus: true,
        blur: true
      }
    };

    function tmpl$w($api, $cmp, $slotset, $ctx) {
      const {
        b: api_bind,
        h: api_element,
        k: api_key,
        c: api_custom_element
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
        _m13,
        _m14,
        _m15,
        _m16
      } = $ctx;
      return [$cmp.visible ? api_element("section", {
        classMap: {
          "slds-popover": true,
          "slds-popover_edit": true
        },
        style: $cmp.computedStyle,
        attrs: {
          "role": "dialog",
          "tabindex": "-1"
        },
        key: 2,
        on: {
          "blur": _m14 || ($ctx._m14 = api_bind($cmp.handleTypeElemBlur)),
          "focus": _m15 || ($ctx._m15 = api_bind($cmp.handleTypeElemFocus)),
          "keydown": _m16 || ($ctx._m16 = api_bind($cmp.handleCellKeydown))
        }
      }, [api_element("span", {
        classMap: {
          "inline-edit-form-start": true
        },
        attrs: {
          "tabindex": "0"
        },
        key: 3,
        on: {
          "focus": _m0 || ($ctx._m0 = api_bind($cmp.handleFormStartFocus))
        }
      }, []), api_element("div", {
        classMap: {
          "slds-popover__body": true
        },
        key: 4
      }, [api_element("form", {
        props: {
          "noValidate": true
        },
        key: 5,
        on: {
          "submit": _m6 || ($ctx._m6 = api_bind($cmp.handleEditFormSubmit))
        }
      }, [api_custom_element("lightning-primitive-datatable-iedit-input-wrapper", _lightningPrimitiveDatatableIeditInputWrapper, {
        classMap: {
          "slds-grid": true,
          "slds-p-left_xx-small": true
        },
        props: {
          "required": $cmp.required
        },
        key: 6
      }, [api_custom_element("lightning-primitive-datatable-iedit-type-factory", _lightningPrimitiveDatatableIeditTypeFactory, {
        classMap: {
          "dt-type-edit-factory": true,
          "slds-col": true
        },
        props: {
          "required": $cmp.required,
          "columnDef": $cmp.columnDef,
          "editedValue": $cmp.editedValue
        },
        key: api_key(7, $cmp.inputKey),
        on: {
          "blur": _m1 || ($ctx._m1 = api_bind($cmp.handleTypeElemBlur)),
          "focus": _m2 || ($ctx._m2 = api_bind($cmp.handleTypeElemFocus))
        }
      }, [])]), $cmp.isMassEditEnabled ? api_custom_element("lightning-input", _lightningInput, {
        attrs: {
          "data-mass-selection": "true"
        },
        props: {
          "type": "checkbox",
          "name": "dt-iedit-mass-edit",
          "label": $cmp.massEditCheckboxLabel
        },
        key: 9,
        on: {
          "change": _m3 || ($ctx._m3 = api_bind($cmp.handleMassCheckboxChange)),
          "blur": _m4 || ($ctx._m4 = api_bind($cmp.handleTypeElemBlur)),
          "focus": _m5 || ($ctx._m5 = api_bind($cmp.handleTypeElemFocus))
        }
      }, []) : null, !$cmp.isMassEditEnabled ? api_element("button", {
        classMap: {
          "slds-hide": true
        },
        attrs: {
          "type": "submit",
          "aria-hidden": "true",
          "tabindex": "-1",
          "value": "save"
        },
        key: 11
      }, []) : null])]), $cmp.isMassEditEnabled ? api_element("div", {
        classMap: {
          "slds-popover__footer": true
        },
        key: 13
      }, [api_element("div", {
        classMap: {
          "slds-grid": true,
          "slds-grid_align-end": true
        },
        key: 14
      }, [api_custom_element("lightning-button", _lightningButton, {
        props: {
          "label": $cmp.cancelLabel
        },
        key: 15,
        on: {
          "blur": _m7 || ($ctx._m7 = api_bind($cmp.handleTypeElemBlur)),
          "focus": _m8 || ($ctx._m8 = api_bind($cmp.handleTypeElemFocus)),
          "click": _m9 || ($ctx._m9 = api_bind($cmp.cancelEdition))
        }
      }, []), api_custom_element("lightning-button", _lightningButton, {
        styleMap: {
          "marginLeft": ".25rem"
        },
        attrs: {
          "data-form-last-element": "true"
        },
        props: {
          "label": $cmp.applyLabel,
          "variant": "brand"
        },
        key: 16,
        on: {
          "blur": _m10 || ($ctx._m10 = api_bind($cmp.handleTypeElemBlur)),
          "focus": _m11 || ($ctx._m11 = api_bind($cmp.handleTypeElemFocus)),
          "click": _m12 || ($ctx._m12 = api_bind($cmp.processSubmission))
        }
      }, [])])]) : null, api_element("div", {
        classMap: {
          "inline-edit-form-end": true
        },
        attrs: {
          "tabindex": "0"
        },
        key: 17,
        on: {
          "focus": _m13 || ($ctx._m13 = api_bind($cmp.handleFormEndsFocus))
        }
      }, [])]) : null];
    }

    var _tmpl$k = lwc.registerTemplate(tmpl$w);
    tmpl$w.stylesheets = [];
    tmpl$w.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableIeditPanel_primitiveDatatableIeditPanel-host",
      shadowAttribute: "lightning-primitiveDatatableIeditPanel_primitiveDatatableIeditPanel"
    };

    var labelUpdateSelectedItems = 'Update {0} selected items';

    var labelCancel = 'Cancel';

    var labelApply = 'Apply';

    const i18n$a = {
      updateSelectedItems: labelUpdateSelectedItems,
      cancel: labelCancel,
      apply: labelApply
    };

    class PrimitiveDatatableIeditPanel extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.visible = void 0;
        this.rowKeyValue = void 0;
        this.colKeyValue = void 0;
        this.editedValue = void 0;
        this.columnDef = void 0;
        this.isMassEditEnabled = false;
        this.numberOfSelectedRows = void 0;
      }

      connectedCallback() {
        this.interactingState = new InteractingState({
          duration: 10,
          debounceInteraction: true
        });
        this.interactingState.onleave(() => this.handlePanelLoosedFocus());
      }

      get computedStyle() {
        const styleHash = {
          'z-index': 1000,
          'background-color': 'white',
          'margin-top': '1px'
        };
        styleHash.display = this.visible ? 'block' : 'none';
        return Object.keys(styleHash).map(styleProp => `${styleProp}:${styleHash[styleProp]}`).join(';');
      }

      get inputKey() {
        return this.rowKeyValue + this.colKeyValue;
      }

      get massEditCheckboxLabel() {
        return this.formatString(i18n$a.updateSelectedItems, this.numberOfSelectedRows);
      }

      get applyLabel() {
        return i18n$a.apply;
      }

      get cancelLabel() {
        return i18n$a.cancel;
      }

      get required() {
        return this.columnDef.typeAttributes && this.columnDef.typeAttributes.required;
      }

      handleFormStartFocus() {
        this.interactingState.enter();

        if (this.isMassEditEnabled) {
          // on mass edit the panel dont loses the focus with the keyboard.
          this.focusLastElement();
        } else {
          this.triggerEditFinished({
            reason: 'tab-pressed-prev'
          });
        }
      }

      handleFormEndsFocus() {
        this.interactingState.enter();

        if (this.isMassEditEnabled) {
          // on mass edit the panel dont loses the focus with the keyboard.
          this.focus();
        } else {
          this.triggerEditFinished({
            reason: 'tab-pressed-next'
          });
        }
      }

      triggerEditFinished(detail) {
        detail.rowKeyValue = detail.rowKeyValue || this.rowKeyValue;
        detail.colKeyValue = detail.colKeyValue || this.colKeyValue;
        const event = new CustomEvent('ieditfinished', {
          detail
        });
        this.dispatchEvent(event);
      }

      focus() {
        const elem = this.inputableElement;
        this.interactingState.enter();

        if (elem) {
          elem.focus();
        }
      }

      get inputableElement() {
        return this.template.querySelector('.dt-type-edit-factory');
      }

      get value() {
        return this.inputableElement.value;
      }

      get validity() {
        return this.inputableElement.validity;
      }

      get isMassEditChecked() {
        return this.isMassEditEnabled && this.template.querySelector('[data-mass-selection="true"]').checked;
      }

      getPositionedElement() {
        return this.template.querySelector('section');
      }

      handleTypeElemBlur() {
        if (this.visible && !this.template.activeElement) {
          this.interactingState.leave();
        }
      }

      handleTypeElemFocus() {
        this.interactingState.enter();
      }

      handleEditFormSubmit(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.isMassEditEnabled) {
          this.processSubmission();
        }

        return false;
      }

      handleCellKeydown(event) {
        const {
          keyCode
        } = event;

        if (keyCode === 27) {
          // Esc key
          event.stopPropagation();
          this.cancelEdition();
        }
      }

      handlePanelLoosedFocus() {
        if (this.visible) {
          this.triggerEditFinished({
            reason: 'loosed-focus'
          });
        }
      }

      formatString(str, ...args) {
        return str.replace(/{(\d+)}/g, (match, i) => {
          return args[i];
        });
      }

      focusLastElement() {
        this.template.querySelector('[data-form-last-element="true"]').focus();
      }

      processSubmission() {
        if (this.validity.valid) {
          this.triggerEditFinished({
            reason: 'submit-action'
          });
        } else {
          this.inputableElement.showHelpMessageIfInvalid();
        }
      }

      cancelEdition() {
        this.triggerEditFinished({
          reason: 'edit-canceled'
        });
      }

      handleMassCheckboxChange(event) {
        const customEvent = new CustomEvent('masscheckboxchange', {
          detail: {
            checked: event.detail.checked
          }
        });
        this.dispatchEvent(customEvent);
      }

    }

    lwc.registerDecorators(PrimitiveDatatableIeditPanel, {
      publicProps: {
        visible: {
          config: 0
        },
        rowKeyValue: {
          config: 0
        },
        colKeyValue: {
          config: 0
        },
        editedValue: {
          config: 0
        },
        columnDef: {
          config: 0
        },
        isMassEditEnabled: {
          config: 0
        },
        numberOfSelectedRows: {
          config: 0
        },
        value: {
          config: 1
        },
        validity: {
          config: 1
        },
        isMassEditChecked: {
          config: 1
        }
      },
      publicMethods: ["focus", "getPositionedElement"]
    });

    var _lightningPrimitiveDatatableIeditPanel = lwc.registerComponent(PrimitiveDatatableIeditPanel, {
      tmpl: _tmpl$k
    });

    var labelChooseARow = 'Choose a Row to Select';

    var labelSelectAll = 'Select All';

    var labelSort = 'Sort by:';

    var labelSortAsc = 'Sorted Ascending';

    var labelSortDesc = 'Sorted Descending';

    var labelSortNone = 'Sorted: None';

    function tmpl$x($api, $cmp, $slotset, $ctx) {
      return [];
    }

    var _tmpl$l = lwc.registerTemplate(tmpl$x);
    tmpl$x.stylesheets = [];
    tmpl$x.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableCell_primitiveDatatableCell-host",
      shadowAttribute: "lightning-primitiveDatatableCell_primitiveDatatableCell"
    };

    class PrimitiveDatatableCell extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.rowKeyValue = void 0;
        this.colKeyValue = void 0;
        this._hasFocus = 0;
        this.state = {
          mode: 'NAVIGATION',
          currentInputIndex: 0,
          internalTabIndex: -1
        };
      }

      get hasFocus() {
        return this._hasFocus;
      }

      get keyboardMode() {
        return this.state.mode;
      }

      set hasFocus(value) {
        this._hasFocus = value;

        if (value) {
          this.classList.add('slds-has-focus');
        } else {
          this.classList.remove('slds-has-focus');
        }
      }

      setMode(keyboardMode, info) {
        const normalizedInfo = info || {
          action: 'none'
        };
        this.state.mode = keyboardMode;

        if (keyboardMode === 'ACTION') {
          this.state.internalTabIndex = 0;
          this.setFocusToActionableElement(this.state.currentInputIndex);
          const actionableElements = this.getActionableElements(); // check if we have an edit button first (tab should open the inline edit)

          if (normalizedInfo.action === 'tab') {
            let editActionElement = false;
            actionableElements.some(elem => {
              if (elem.getAttribute('data-action-edit')) {
                editActionElement = elem;
                return true;
              }

              return false;
            });

            if (editActionElement) {
              editActionElement.click();
            }
          } else if (actionableElements.length === 1) {
            const elem = actionableElements[0];
            let defaultActions = elem.getAttribute('data-action-triggers');
            defaultActions = defaultActions || '';

            if (defaultActions.indexOf(normalizedInfo.action) !== -1) {
              actionableElements[this.state.currentInputIndex].click();
            }
          }
        } else {
          this.state.internalTabIndex = -1;
        }
      }

      addFocusStyles() {
        this.classList.add('slds-has-focus');
      }

      removeFocusStyles(setTabIndex) {
        this.classList.remove('slds-has-focus');

        if (setTabIndex) {
          this.state.internalTabIndex = -1;
        }
      }

      resetCurrentInputIndex(direction) {
        switch (direction) {
          case -1:
            {
              const inputs = this.getActionableElements();
              this.state.currentInputIndex = inputs.length ? inputs.length - 1 : 0;
              break;
            }

          case 1:
          case 2:
            this.state.currentInputIndex = 0;
            break;

          default:
        }

        if (this.state.mode === 'ACTION') {
          this.setFocusToActionableElement(this.state.currentInputIndex);
        }
      }

      connectedCallback() {
        this.addEventListener('focus', this.handleFocus.bind(this));
        this.addEventListener('click', this.handleClick.bind(this));
        this.addEventListener('keydown', this.handleKeydown.bind(this));
      }

      get internalTabIndex() {
        return this.state.internalTabIndex;
      }

      get canMoveLeft() {
        return this.state.currentInputIndex > 0;
      }

      get canMoveRight() {
        return this.state.actionableElementsCount > 1 && this.state.currentInputIndex < this.state.actionableElementsCount - 1;
      }

      moveToNextActionableElement() {
        this.setFocusToActionableElement(this.state.currentInputIndex + 1);
      }

      moveToPrevActionableElement() {
        this.setFocusToActionableElement(this.state.currentInputIndex - 1);
      } // eslint-disable-next-line no-unused-vars


      handleClick(event) {
        this.addFocusStyles();
        this.fireCellFocusByClickEvent();
      }

      handleKeydown(event) {
        const {
          keyCode,
          shiftKey
        } = event;
        const {
          mode
        } = this.state;
        let passThroughEvent = keyCode !== keyCodes.shift; // if it is in Action mode, then traverse to the next or previous
        // focusable element.
        // if there is no focusable element, or reach outside of the range, then move to
        // previous or next cell.

        if (mode === 'ACTION') {
          switch (keyCode) {
            case keyCodes.left:
              if (this.canMoveLeft) {
                // there are still actionable element before the current one
                // move to the previous actionable element.
                event.preventDefault();
                this.moveToPrevActionableElement();
                passThroughEvent = false;
              }

              break;

            case keyCodes.right:
              if (this.canMoveRight) {
                // there are still actionable element before the current one
                // move to the previous actionable element.
                event.preventDefault();
                this.moveToNextActionableElement();
                passThroughEvent = false;
              }

              break;

            case keyCodes.tab:
              // if in action mode, try to navigate through the element inside
              // always prevent the default tab behavior
              // so that the tab will not focus outside of the table.
              if (shiftKey) {
                // moving to the left
                if (this.canMoveLeft) {
                  event.preventDefault();
                  this.moveToPrevActionableElement();
                  passThroughEvent = false;
                }
              } else {
                // moving to the right
                // eslint-disable-next-line no-lonely-if
                if (this.canMoveRight) {
                  event.preventDefault();
                  this.moveToNextActionableElement();
                  passThroughEvent = false;
                }
              }

              break;

            default:
          }
        } else if (mode === 'NAVIGATION') {
          // click the header, press enter, it does not go to action mode without this code.
          if (keyCode === keyCodes.left || keyCode === keyCodes.right || keyCode === keyCodes.up || keyCode === keyCodes.down || keyCode === keyCodes.enter) {
            this.fireCellKeydown(event);
          }
        }

        if (passThroughEvent && mode === 'ACTION') {
          this.fireCellKeydown(event);
        }
      }

      getActionableElements() {
        return Array.prototype.slice.call(this.template.querySelectorAll('[data-navigation="enable"]'));
      }

      get resizeElement() {
        return this.template.querySelector('.slds-resizable');
      }

      setFocusToActionableElement(activeInputIndex) {
        const actionableElements = this.getActionableElements();
        this.state.actionableElementsCount = actionableElements.length;

        if (actionableElements.length > 0) {
          if (activeInputIndex > 0 && activeInputIndex < actionableElements.length) {
            // try to locate to the previous active index of previous row.
            actionableElements[activeInputIndex].focus();
            this.state.currentInputIndex = activeInputIndex;
          } else {
            actionableElements[0].focus();
            this.state.currentInputIndex = 0;
          }
        } // TODO: Fire event back to the datatable, so that the activeInputIndex can be
        // stored in the datatable level state.  So that when user use up and down arrow to
        // navigate throught the datatable in ACTION mode, we can rememeber the active input position

      }

      handleFocus() {
        if (this.state.mode === 'ACTION') {
          this.setFocusToActionableElement(this.state.currentInputIndex);
        }
      }

      fireCellKeydown(keyEvent) {
        const {
          rowKeyValue,
          colKeyValue
        } = this;
        const {
          keyCode,
          shiftKey
        } = keyEvent;
        const event = new CustomEvent('privatecellkeydown', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            rowKeyValue,
            colKeyValue,
            keyCode,
            shiftKey,
            keyEvent
          }
        });
        this.dispatchEvent(event);
      }

      fireCellFocusByClickEvent() {
        const {
          rowKeyValue,
          colKeyValue
        } = this;
        const event = new CustomEvent('privatecellfocusedbyclick', {
          bubbles: true,
          composed: true,
          detail: {
            rowKeyValue,
            colKeyValue
          }
        });
        this.dispatchEvent(event);
      }

    }

    lwc.registerDecorators(PrimitiveDatatableCell, {
      publicProps: {
        rowKeyValue: {
          config: 0
        },
        colKeyValue: {
          config: 0
        },
        hasFocus: {
          config: 3
        }
      },
      publicMethods: ["setMode", "addFocusStyles", "removeFocusStyles", "resetCurrentInputIndex"],
      track: {
        state: 1
      }
    });

    var PrimitiveDatatableCell$1 = lwc.registerComponent(PrimitiveDatatableCell, {
      tmpl: _tmpl$l
    });

    function tmpl$y($api, $cmp, $slotset, $ctx) {
      const {
        gid: api_scoped_id,
        ti: api_tab_index,
        b: api_bind,
        h: api_element,
        d: api_dynamic
      } = $api;
      const {
        _m0
      } = $ctx;
      return [api_element("div", {
        classMap: {
          "slds-th__action": true,
          "slds-th__action_form": true,
          "slds-cell-fixed": true
        },
        style: $cmp.columnStyles,
        key: 2
      }, [$cmp.showCheckbox ? api_element("span", {
        classMap: {
          "slds-checkbox": true
        },
        key: 4
      }, [api_element("input", {
        classMap: {
          "datatable-select-all": true
        },
        attrs: {
          "type": "checkbox",
          "name": $cmp.computedOptionName,
          "id": api_scoped_id("lgt-dt-header-factory-id"),
          "tabindex": api_tab_index($cmp.internalTabIndex),
          "data-navigation": "enable"
        },
        props: {
          "disabled": $cmp.def.isBulkSelectionDisabled
        },
        key: 5,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleSelectAllRows))
        }
      }, []), api_element("label", {
        classMap: {
          "slds-checkbox__label": true
        },
        attrs: {
          "for": `${api_scoped_id("lgt-dt-header-factory-id")}`
        },
        key: 6
      }, [api_element("span", {
        classMap: {
          "slds-checkbox_faux": true
        },
        key: 7
      }, []), api_element("span", {
        classMap: {
          "slds-form-element__label": true,
          "slds-assistive-text": true
        },
        key: 8
      }, [api_dynamic($cmp.i18n.selectAll)])])]) : null, !$cmp.showCheckbox ? api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 10
      }, [api_dynamic($cmp.i18n.chooseARow)]) : null])];
    }

    var selectable = lwc.registerTemplate(tmpl$y);
    tmpl$y.stylesheets = [];
    tmpl$y.stylesheetTokens = {
      hostAttribute: "lightning-primitiveHeaderFactory_selectableHeader-host",
      shadowAttribute: "lightning-primitiveHeaderFactory_selectableHeader"
    };

    function tmpl$z($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$m = lwc.registerTemplate(tmpl$z);
    tmpl$z.stylesheets = [];
    tmpl$z.stylesheetTokens = {
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
      tmpl: _tmpl$m
    });

    function tmpl$A($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$n = lwc.registerTemplate(tmpl$A);
    tmpl$A.slots = [""];
    tmpl$A.stylesheets = [];
    tmpl$A.stylesheetTokens = {
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

    function preventDefaultAndStopPropagation$3(event) {
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
          preventDefaultAndStopPropagation$3(event);
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
          preventDefaultAndStopPropagation$3(event);
          menuInterface.focusOnIndex(0);
          break;

        case keyCodes.end:
          preventDefaultAndStopPropagation$3(event);
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
              preventDefaultAndStopPropagation$3(event);
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
          preventDefaultAndStopPropagation$3(event);
          menuInterface.toggleMenuVisibility();
          break;

        case keyCodes.down:
        case keyCodes.up:
          preventDefaultAndStopPropagation$3(event);

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
          preventDefaultAndStopPropagation$3(event);
          menuInterface.focusOnIndex(0);
          break;

        case keyCodes.end:
          preventDefaultAndStopPropagation$3(event);
          menuInterface.focusOnIndex(menuInterface.getTotalMenuItems() - 1);
          break;
        // W3: Escape: Close the menu and return focus to the element or context, e.g., menu button or
        // parent menu item, from which the menu was opened

        case keyCodes.escape:
        case keyCodes.tab:
          if (isVisible) {
            preventDefaultAndStopPropagation$3(event);
            menuInterface.toggleMenuVisibility();
          }

          break;

        default:
          if (!isVisible && menuInterface.showDropdownWhenTypingCharacters) {
            preventDefaultAndStopPropagation$3(event);
            menuInterface.toggleMenuVisibility();
          } else if (!isVisible) {
            break;
          } // eslint-disable-next-line lwc/no-raf


          window.requestAnimationFrame(() => {
            moveFocusToTypedCharacters(event, menuInterface);
          });
      }
    }

    const i18n$b = {
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
        this.alternativeText = i18n$b.showMenu;
        this.loadingStateAlternativeText = i18n$b.loading;
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
        return this.alternativeText || i18n$b.showMenu;
      }

      get computedLoadingStateAlternativeText() {
        return this.loadingStateAlternativeText || i18n$b.loading;
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
      tmpl: _tmpl$n
    });

    function tmpl$B($api, $cmp, $slotset, $ctx) {
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

    var _tmpl$o = lwc.registerTemplate(tmpl$B);
    tmpl$B.stylesheets = [];
    tmpl$B.stylesheetTokens = {
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
      tmpl: _tmpl$o
    });

    function tmpl$C($api, $cmp, $slotset, $ctx) {
      return [];
    }

    var _tmpl$p = lwc.registerTemplate(tmpl$C);
    tmpl$C.stylesheets = [];
    tmpl$C.stylesheetTokens = {
      hostAttribute: "lightning-menuDivider_menuDivider-host",
      shadowAttribute: "lightning-menuDivider_menuDivider"
    };

    class LightningMenuDivider extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.state = {
          variant: 'standard'
        };
      }

      connectedCallback() {
        this.setAttribute('role', 'separator');
        this.updateClass();
      }

      updateClass() {
        classListMutation(this.classList, {
          'slds-has-divider_top-space': this.variant === 'standard',
          'slds-has-divider_top': this.variant === 'compact'
        });
      }

      get variant() {
        return this.state.variant;
      }

      set variant(value) {
        this.state.variant = normalizeString(value, {
          fallbackValue: 'standard',
          validValues: ['standard', 'compact']
        });
        this.updateClass();
      }

    }

    lwc.registerDecorators(LightningMenuDivider, {
      publicProps: {
        variant: {
          config: 3
        }
      },
      track: {
        state: 1
      }
    });

    var _lightningMenuDivider = lwc.registerComponent(LightningMenuDivider, {
      tmpl: _tmpl$p
    });

    function tmpl$D($api, $cmp, $slotset, $ctx) {
      const {
        k: api_key,
        c: api_custom_element,
        i: api_iterator,
        f: api_flatten,
        gid: api_scoped_id,
        ti: api_tab_index,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [$cmp.hasActions ? api_custom_element("lightning-button-menu", _lightningButtonMenu, {
        classMap: {
          "slds-th__action-button": true
        },
        styleMap: {
          "zIndex": "1"
        },
        props: {
          "id": api_scoped_id("primitive-header-action-button-menu-id"),
          "iconSize": "x-small",
          "menuAlignment": $cmp.computedMenuAlignment,
          "alternativeText": $cmp.i18n.showActions,
          "variant": "bare",
          "iconName": "utility:chevrondown",
          "tabIndex": api_tab_index($cmp.state.internalTabIndex)
        },
        key: 3,
        on: {
          "open": _m0 || ($ctx._m0 = api_bind($cmp.handleMenuOpen)),
          "select": _m1 || ($ctx._m1 = api_bind($cmp.handleActionSelect))
        }
      }, api_flatten([api_iterator($cmp.state.internalActions, function (action, actionIndex) {
        return api_custom_element("lightning-menu-item", _lightningMenuItem, {
          props: {
            "value": action,
            "label": action.label,
            "iconName": action.iconName,
            "disabled": action.disabled,
            "checked": action.checked
          },
          key: api_key(5, action.label)
        }, []);
      }), $cmp.hasActionsDivider ? api_custom_element("lightning-menu-divider", _lightningMenuDivider, {
        key: 7
      }, []) : null, api_iterator($cmp.state.customerActions, function (action, actionIndex) {
        return api_custom_element("lightning-menu-item", _lightningMenuItem, {
          props: {
            "value": action,
            "label": action.label,
            "iconName": action.iconName,
            "disabled": action.disabled,
            "checked": action.checked
          },
          key: api_key(9, action.label)
        }, []);
      })])) : null];
    }

    var _tmpl$q = lwc.registerTemplate(tmpl$D);
    tmpl$D.stylesheets = [];
    tmpl$D.stylesheetTokens = {
      hostAttribute: "lightning-primitiveHeaderActions_primitiveHeaderActions-host",
      shadowAttribute: "lightning-primitiveHeaderActions_primitiveHeaderActions"
    };

    var labelClipText = 'Clip text';

    var labelShowActions = 'Show actions';

    var labelWrapText = 'Wrap text';

    const i18n$c = {
      clipText: labelClipText,
      showActions: labelShowActions,
      wrapText: labelWrapText
    };

    class PrimitiveHeaderActions extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.colKeyValue = void 0;
        this.containerRect = void 0;
        this.state = {
          internalActions: [],
          customerActions: [],
          internalTabIndex: 0
        };
      }

      get actions() {
        return this._actions;
      }

      set actions(value) {
        this._actions = value;
        this.updateActions();
      }

      focus() {
        const btnMenu = this.template.querySelector('lightning-button-menu');

        if (btnMenu) {
          btnMenu.focus();
        }
      }

      get tabIndex() {
        return -1;
      }

      set tabIndex(value) {
        this.setAttribute('tabindex', value);
        this.state.internalTabIndex = value;
      }

      get i18n() {
        return i18n$c;
      }

      get computedMenuAlignment() {
        return this.state.actionMenu.menuAlignment;
      }

      updateActions() {
        const actionTypeReducer = type => (actions, action) => {
          const overrides = {
            _type: type,
            _action: action
          };
          actions.push(Object.assign({}, action, overrides));
          return actions;
        };

        this.state.internalActions = this.getActionsByType('internalActions').reduce(actionTypeReducer('internal'), []);
        this.state.customerActions = this.getActionsByType('customerActions').reduce(actionTypeReducer('customer'), []);
        this.state.actionMenu = {
          menuAlignment: this._actions.menuAlignment
        };
      }

      get hasActions() {
        return this.state.internalActions.length > 0 || this.state.customerActions.length > 0;
      }

      get hasActionsDivider() {
        return this.state.internalActions.length > 0 && this.state.customerActions.length > 0;
      }

      getActionsByType(type) {
        return Array.isArray(this._actions[type]) ? this._actions[type] : [];
      }

      handleMenuOpen(event) {
        event.preventDefault();
        event.stopPropagation();
        this.elementRect = this.template.querySelector('lightning-button-menu').getBoundingClientRect();
        this.dispatchEvent(new CustomEvent('privatecellheaderactionmenuopening', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            saveContainerPosition: containerRect => {
              this.containerRect = containerRect;
            }
          }
        }));
      }

      handleActionSelect(evt) {
        const action = evt.detail.value;
        this.dispatchEvent(new CustomEvent('privatecellheaderactiontriggered', {
          composed: true,
          bubbles: true,
          cancelable: true,
          detail: {
            action: lwc.unwrap(action._action),
            actionType: action._type,
            colKeyValue: this.colKeyValue
          }
        }));
      }

    }

    PrimitiveHeaderActions.delegatesFocus = true;

    lwc.registerDecorators(PrimitiveHeaderActions, {
      publicProps: {
        colKeyValue: {
          config: 0
        },
        actions: {
          config: 3
        },
        tabIndex: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        containerRect: 1,
        state: 1
      }
    });

    var _lightningPrimitiveHeaderActions = lwc.registerComponent(PrimitiveHeaderActions, {
      tmpl: _tmpl$q
    });

    function tmpl$E($api, $cmp, $slotset, $ctx) {
      const {
        ti: api_tab_index,
        b: api_bind,
        h: api_element
      } = $api;
      const {
        _m0,
        _m1,
        _m2
      } = $ctx;
      return [api_element("input", {
        classMap: {
          "slds-resizable__input": true,
          "slds-assistive-text": true
        },
        attrs: {
          "type": "range",
          "min": $cmp.minWidth,
          "max": $cmp.maxWidth,
          "aria-label": $cmp.resizerLabel,
          "tabindex": api_tab_index($cmp.internalTabIndex)
        },
        props: {
          "value": $cmp.value
        },
        key: 2,
        on: {
          "keydown": _m0 || ($ctx._m0 = api_bind($cmp.handleKeydown))
        }
      }, []), api_element("span", {
        classMap: {
          "slds-resizable__handle": true
        },
        styleMap: {
          "willChange": "transform"
        },
        key: 3,
        on: {
          "mousedown": _m1 || ($ctx._m1 = api_bind($cmp.onStart)),
          "click": _m2 || ($ctx._m2 = api_bind($cmp.onClick))
        }
      }, [api_element("span", {
        classMap: {
          "slds-resizable__divider": true
        },
        key: 4
      }, [])])];
    }

    var _tmpl$r = lwc.registerTemplate(tmpl$E);
    tmpl$E.stylesheets = [];
    tmpl$E.stylesheetTokens = {
      hostAttribute: "lightning-primitiveResizeHandler_primitiveResizeHandler-host",
      shadowAttribute: "lightning-primitiveResizeHandler_primitiveResizeHandler"
    };

    var labelColumnWidth = 'column width';

    const i18n$d = {
      columnWidth: labelColumnWidth
    };

    class PrimitiveResizeHandler extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.minWidth = 0;
        this.maxWidth = 1000;
        this.label = '';
        this.colIndex = void 0;
        this.internalTabIndex = void 0;
        this.step = 10;
        this.value = void 0;
        this.state = {};
      }

      connectedCallback() {
        this.addEventListener('focus', this.handleFocus.bind(this));
      }

      get resizerLabel() {
        const label = this.label || '';
        return `${label} ${i18n$d.columnWidth}`;
      }

      get resizeElement() {
        return this.template.querySelector('.slds-resizable__handle');
      }

      handleFocus() {
        this.template.querySelector('input').focus();
      }

      onClick(event) {
        // capture the click event on button, to prevent the sorting of the column
        this.preventDefaultAndStopPropagation(event);
      }

      onStart(event) {
        // prevent selecting text when mouse down
        event.returnValue = false;
        this.preventDefaultAndStopPropagation(event);
        const headerClientWidth = this.value;
        this.lowRange = this.minWidth - headerClientWidth;
        this.highRange = this.maxWidth - headerClientWidth;
        this.startX = event.pageX;
        this.currentX = this.startX;
        this.touchingResizer = true;
        document.body.addEventListener('mousemove', this.onMove.bind(this));
        document.body.addEventListener('mouseup', this.onEnd.bind(this));
        document.body.addEventListener('mouseleave', this.onEnd.bind(this));
        requestAnimationFrame(this.resizing.bind(this));
      }

      onMove(event) {
        if (!this.touchingResizer) {
          return;
        }

        this.currentX = event.pageX;
      } // eslint-disable-next-line no-unused-vars


      onEnd(event) {
        if (!this.touchingResizer) {
          return;
        }

        this.touchingResizer = false;
        document.body.removeEventListener('mousemove', this.onMove.bind(this));
        document.body.removeEventListener('mouseup', this.onEnd.bind(this));
        document.body.removeEventListener('mouseleave', this.onEnd.bind(this));
        const translateX = this.currentX - this.startX;
        this.resizeElement.style.transform = '';
        this.fireResizeEvent(translateX);
      }

      resizing() {
        if (!this.touchingResizer) {
          return;
        }

        requestAnimationFrame(this.resizing.bind(this));
        const translateX = this.currentX - this.startX;

        if (this.lowRange === undefined || translateX >= this.lowRange && translateX <= this.highRange) {
          this.resizeElement.style.transform = `translateX(${translateX}px)`;
        }
      }

      preventDefaultAndStopPropagation(event) {
        event.preventDefault();
        event.stopPropagation();
      }

      handleKeydown(event) {
        switch (event.keyCode) {
          case keyCodes.left:
            this.preventDefaultAndStopPropagation(event);
            this.fireResizeEvent(0 - this.step);
            break;

          case keyCodes.right:
            this.preventDefaultAndStopPropagation(event);
            this.fireResizeEvent(this.step);
            break;

          case keyCodes.up:
          case keyCodes.down:
          case keyCodes.enter:
          case keyCodes.space:
            this.preventDefaultAndStopPropagation(event);
            break;

          case keyCodes.escape:
            break;

          default:
        }
      }

      fireResizeEvent(widthDelta) {
        const actionName = 'resizecol'; // eslint-disable-next-line lightning-global/no-custom-event-identifier-arguments

        const actionEvent = new CustomEvent(actionName, {
          bubbles: true,
          composed: true,
          detail: {
            colIndex: this.colIndex,
            widthDelta
          }
        });
        this.dispatchEvent(actionEvent);
      }

    }

    PrimitiveResizeHandler.delegatesFocus = true;

    lwc.registerDecorators(PrimitiveResizeHandler, {
      publicProps: {
        minWidth: {
          config: 0
        },
        maxWidth: {
          config: 0
        },
        label: {
          config: 0
        },
        colIndex: {
          config: 0
        },
        internalTabIndex: {
          config: 0
        },
        step: {
          config: 0
        },
        value: {
          config: 0
        }
      },
      track: {
        state: 1
      }
    });

    var _lightningPrimitiveResizeHandler = lwc.registerComponent(PrimitiveResizeHandler, {
      tmpl: _tmpl$r
    });

    function tmpl$F($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        h: api_element,
        c: api_custom_element,
        ti: api_tab_index,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [api_element("span", {
        className: $cmp.computedClass,
        style: $cmp.columnStyles,
        attrs: {
          "tabindex": api_tab_index($cmp.internalTabIndex)
        },
        key: 2
      }, [api_element("a", {
        className: $cmp.computedSortClass,
        style: $cmp.columnStyles,
        attrs: {
          "href": "javascript:void(0);",
          "role": $cmp.headerRole,
          "tabindex": api_tab_index($cmp.internalTabIndex),
          "data-navigation": "enable"
        },
        key: 3,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleSortingClick)),
          "keydown": _m1 || ($ctx._m1 = api_bind($cmp.handleSortingKeyDown))
        }
      }, [api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 4
      }, [api_dynamic($cmp.i18n.sort)]), $cmp.def.iconName ? api_element("div", {
        classMap: {
          "slds-grid": true,
          "slds-grid_vertical-align-center": true,
          "slds-has-flexi-truncate": true
        },
        key: 6
      }, [api_custom_element("lightning-icon", _lightningIcon, {
        classMap: {
          "slds-icon_container": true,
          "slds-m-right_xx-small": true
        },
        props: {
          "iconName": $cmp.def.iconName,
          "size": "x-small"
        },
        key: 7
      }, []), api_element("span", {
        classMap: {
          "slds-truncate": true
        },
        attrs: {
          "title": $cmp.def.label
        },
        key: 8
      }, [api_dynamic($cmp.def.label)]), api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        classMap: {
          "slds-icon_container": true
        },
        props: {
          "svgClass": "slds-icon slds-icon-text-default slds-is-sortable__icon",
          "iconName": "utility:arrowdown",
          "size": "x-small"
        },
        key: 9
      }, [])]) : null, !$cmp.def.iconName ? api_element("span", {
        classMap: {
          "slds-truncate": true
        },
        attrs: {
          "title": $cmp.def.label
        },
        key: 11
      }, [api_dynamic($cmp.def.label)]) : null, !$cmp.def.iconName ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        classMap: {
          "slds-icon_container": true
        },
        props: {
          "svgClass": "slds-icon slds-icon-text-default slds-is-sortable__icon",
          "iconName": "utility:arrowdown",
          "size": "x-small"
        },
        key: 12
      }, []) : null]), api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        attrs: {
          "aria-live": "assertive",
          "aria-atomic": "true"
        },
        key: 13
      }, [api_dynamic($cmp.sortedOrderLabel)]), $cmp.hasActions ? api_custom_element("lightning-primitive-header-actions", _lightningPrimitiveHeaderActions, {
        attrs: {
          "data-navigation": "enable"
        },
        props: {
          "colKeyValue": $cmp.def.colKeyValue,
          "actions": $cmp.actions,
          "tabIndex": api_tab_index($cmp.state.internalTabIndex)
        },
        key: 15
      }, []) : null, $cmp.isResizable ? api_custom_element("lightning-primitive-resize-handler", _lightningPrimitiveResizeHandler, {
        classMap: {
          "slds-resizable": true
        },
        attrs: {
          "data-navigation": "enable"
        },
        props: {
          "value": $cmp.columnWidth,
          "minWidth": $cmp.def.minWidth,
          "maxWidth": $cmp.def.maxWidth,
          "internalTabIndex": $cmp.internalTabIndex,
          "label": $cmp.def.label,
          "tabIndex": api_tab_index($cmp.internalTabIndex),
          "colIndex": $cmp.colIndex,
          "step": $cmp.resizeStep
        },
        key: 17
      }, []) : null])];
    }

    var sortable = lwc.registerTemplate(tmpl$F);
    tmpl$F.stylesheets = [];
    tmpl$F.stylesheetTokens = {
      hostAttribute: "lightning-primitiveHeaderFactory_sortableHeader-host",
      shadowAttribute: "lightning-primitiveHeaderFactory_sortableHeader"
    };

    function tmpl$G($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        d: api_dynamic,
        h: api_element,
        ti: api_tab_index
      } = $api;
      return [api_element("div", {
        className: $cmp.computedClass,
        style: $cmp.columnStyles,
        attrs: {
          "tabindex": api_tab_index($cmp.internalTabIndex)
        },
        key: 2
      }, [api_element("span", {
        classMap: {
          "slds-th__action": true
        },
        key: 3
      }, [$cmp.def.iconName ? api_element("div", {
        classMap: {
          "slds-grid": true,
          "slds-grid_vertical-align-center": true,
          "slds-has-flexi-truncate": true
        },
        key: 5
      }, [api_custom_element("lightning-icon", _lightningIcon, {
        classMap: {
          "slds-icon_container": true,
          "slds-m-right_xx-small": true
        },
        props: {
          "iconName": $cmp.def.iconName,
          "size": "x-small"
        },
        key: 6
      }, []), api_element("span", {
        classMap: {
          "slds-truncate": true
        },
        attrs: {
          "title": $cmp.def.label
        },
        key: 7
      }, [api_dynamic($cmp.def.label)])]) : null, !$cmp.def.iconName ? api_element("span", {
        classMap: {
          "slds-truncate": true
        },
        attrs: {
          "title": $cmp.def.label
        },
        key: 9
      }, [api_dynamic($cmp.def.label)]) : null, $cmp.hasActions ? api_custom_element("lightning-primitive-header-actions", _lightningPrimitiveHeaderActions, {
        attrs: {
          "data-navigation": "enable"
        },
        props: {
          "colKeyValue": $cmp.def.colKeyValue,
          "actions": $cmp.actions,
          "tabIndex": api_tab_index($cmp.state.internalTabIndex)
        },
        key: 11
      }, []) : null, $cmp.isResizable ? api_custom_element("lightning-primitive-resize-handler", _lightningPrimitiveResizeHandler, {
        classMap: {
          "slds-resizable": true
        },
        attrs: {
          "data-navigation": "enable"
        },
        props: {
          "value": $cmp.columnWidth,
          "minWidth": $cmp.def.minWidth,
          "maxWidth": $cmp.def.maxWidth,
          "internalTabIndex": $cmp.internalTabIndex,
          "label": $cmp.def.label,
          "tabIndex": api_tab_index($cmp.internalTabIndex),
          "colIndex": $cmp.colIndex,
          "step": $cmp.resizeStep
        },
        key: 13
      }, []) : null])])];
    }

    var nonsortable = lwc.registerTemplate(tmpl$G);
    tmpl$G.stylesheets = [];
    tmpl$G.stylesheetTokens = {
      hostAttribute: "lightning-primitiveHeaderFactory_nonsortableHeader-host",
      shadowAttribute: "lightning-primitiveHeaderFactory_nonsortableHeader"
    };

    const i18n$e = {
      chooseARow: labelChooseARow,
      selectAll: labelSelectAll,
      sort: labelSort,
      sortAsc: labelSortAsc,
      sortDesc: labelSortDesc,
      sortNone: labelSortNone
    };

    function preventDefaultAndStopPropagation$4(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    class PrimitiveHeaderFactory extends PrimitiveDatatableCell$1 {
      constructor(...args) {
        super(...args);
        this.colIndex = void 0;
        this.sorted = void 0;
        this.sortedDirection = void 0;
        this.resizestep = void 0;
        this.columnWidth = void 0;
        this.actions = void 0;
        this.showCheckbox = false;
        this.dtContextId = void 0;
        this._resizable = void 0;
        this._def = {};
        this._sortable = false;
      }

      get resizable() {
        return this._resizable;
      }

      set resizable(value) {
        this._resizable = value;
        this.updateElementClasses();
      }

      get def() {
        return this._def;
      }

      set def(value) {
        this._def = value;
        this.updateElementClasses();
      }

      get sortable() {
        return this._sortable;
      }

      set sortable(value) {
        this._sortable = value;
        this.updateElementClasses();
      }

      render() {
        if (this.isSelectableHeader) {
          return selectable;
        } else if (this.sortable) {
          return sortable;
        }

        return nonsortable;
      }

      renderedCallback() {
        if (this.isSelectableHeader && this.showCheckbox) {
          this.updateBulkSelectionCheckbox();
        }
      }

      updateElementClasses() {
        classListMutation(this.classList, {
          'slds-text-title_caps': true,
          'slds-is-sortable': this.isSortable,
          'slds-is-resizable': this.isResizable
        });
      }

      get columnStyles() {
        const outlineStyle = this.isSortable ? '' : 'outline:none;';
        return `
            width: ${this.columnWidth}px;
            ${outlineStyle}
        `;
      }

      get computedClass() {
        return classSet('slds-cell-fixed').add({
          'slds-has-button-menu': this.hasActions
        }).toString();
      }

      get computedSortClass() {
        return classSet('slds-th__action slds-text-link_reset').add({
          'slds-is-sorted': this.sorted
        }).add({
          'slds-is-sorted_asc': this.isAscSorting
        }).add({
          'slds-is-sorted_desc': this.isDescSorting
        }).toString();
      }

      get isAscSorting() {
        return this.sortedDirection === 'asc';
      }

      get isDescSorting() {
        return this.sortedDirection === 'desc';
      }

      get sortedOrderLabel() {
        if (this.sorted) {
          return this.sortedDirection === 'desc' ? i18n$e.sortDesc : i18n$e.sortAsc;
        }

        return i18n$e.sortNone;
      }

      get isSelectableHeader() {
        return this.def.type === 'SELECTABLE_CHECKBOX';
      }

      get isRegularHeader() {
        return this.def.type !== 'SELECTABLE_CHECKBOX';
      }

      get isResizable() {
        return this.resizable && this.def.resizable !== false;
      }

      get isSortable() {
        return this.sortable;
      }

      get i18n() {
        return i18n$e;
      }

      get headerRole() {
        return this.isResizable || this.sortable ? 'button' : false;
      }

      get resizeStep() {
        return this.resizestep;
      }

      get computedOptionName() {
        return `${this.dtContextId}-options`;
      }

      handleSelectAllRows() {
        const actionName = this.def.bulkSelection === 'none' ? 'selectallrows' : 'deselectallrows'; // eslint-disable-next-line lightning-global/no-custom-event-identifier-arguments

        const actionEvent = new CustomEvent(actionName, {
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(actionEvent);
      }

      handleSortingClick(event) {
        event.preventDefault();

        if (this.isSortable) {
          preventDefaultAndStopPropagation$4(event);
          this.fireSortedColumn(this.def.fieldName, this.getTargetSortDirection());
          this.fireCellFocusByClickEvent();
        }
      }

      handleSortingKeyDown(event) {
        if (this.isSortable && event.keyCode === keyCodes.enter) {
          preventDefaultAndStopPropagation$4(event);
          this.fireSortedColumn(this.def.fieldName, this.getTargetSortDirection());
        }
      }

      getTargetSortDirection() {
        if (this.sorted) {
          return this.sortedDirection === 'desc' ? 'asc' : 'desc';
        }

        return this.sortedDirection;
      }

      fireSortedColumn(fieldName, sortDirection) {
        const event = new CustomEvent('privateupdatecolsort', {
          bubbles: true,
          composed: true,
          detail: {
            fieldName,
            sortDirection
          }
        });
        this.dispatchEvent(event);
      }

      get hasActions() {
        return this.actions.customerActions.length > 0 || this.actions.internalActions.length > 0;
      }

      updateBulkSelectionCheckbox() {
        const allCheckbox = this.template.querySelector('.datatable-select-all');
        allCheckbox.indeterminate = this.def.bulkSelection === 'some'; // Note: since we have to handle the indeterminate state,
        //       this is to remove a raptor warning `Unneccessary update of property "checked"`

        allCheckbox.checked = !(this.def.bulkSelection === 'none');
      }

    }

    PrimitiveHeaderFactory.delegatesFocus = true;

    lwc.registerDecorators(PrimitiveHeaderFactory, {
      publicProps: {
        colIndex: {
          config: 0
        },
        sorted: {
          config: 0
        },
        sortedDirection: {
          config: 0
        },
        resizestep: {
          config: 0
        },
        columnWidth: {
          config: 0
        },
        actions: {
          config: 0
        },
        showCheckbox: {
          config: 0
        },
        dtContextId: {
          config: 0
        },
        resizable: {
          config: 3
        },
        def: {
          config: 3
        },
        sortable: {
          config: 3
        }
      },
      track: {
        _resizable: 1,
        _def: 1,
        _sortable: 1
      }
    });

    var _lightningPrimitiveHeaderFactory = lwc.registerComponent(PrimitiveHeaderFactory, {
      tmpl: _tmpl$1
    });

    var labelSelectItem = 'Select Item';

    function tmpl$H($api, $cmp, $slotset, $ctx) {
      const {
        gid: api_scoped_id,
        ti: api_tab_index,
        b: api_bind,
        h: api_element,
        d: api_dynamic
      } = $api;
      const {
        _m0,
        _m1,
        _m2
      } = $ctx;
      return [api_element("span", {
        classMap: {
          "slds-checkbox": true
        },
        key: 2,
        on: {
          "click": _m1 || ($ctx._m1 = api_bind($cmp.handleCheckboxContainerClick)),
          "mousedown": _m2 || ($ctx._m2 = api_bind($cmp.handleCheckboxContainerMouseDown))
        }
      }, [api_element("input", {
        attrs: {
          "type": "checkbox",
          "name": $cmp.computedOptionName,
          "id": api_scoped_id("primitive-cell-checkbox-id"),
          "tabindex": api_tab_index($cmp.internalTabIndex),
          "data-navigation": "enable",
          "data-action-triggers": "space"
        },
        props: {
          "disabled": $cmp.isDisabled,
          "checked": $cmp.isSelected
        },
        key: 3,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleCheckboxClick))
        }
      }, []), api_element("label", {
        classMap: {
          "slds-checkbox__label": true
        },
        attrs: {
          "for": `${api_scoped_id("primitive-cell-checkbox-id")}`
        },
        key: 4
      }, [api_element("span", {
        classMap: {
          "slds-checkbox_faux": true
        },
        key: 5
      }, []), api_element("span", {
        classMap: {
          "slds-form-element__label": true,
          "slds-assistive-text": true
        },
        key: 6
      }, [api_dynamic($cmp.selectItemAssistiveText)])])])];
    }

    var checkbox = lwc.registerTemplate(tmpl$H);
    tmpl$H.stylesheets = [];
    tmpl$H.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellCheckbox_checkbox-host",
      shadowAttribute: "lightning-primitiveCellCheckbox_checkbox"
    };

    function tmpl$I($api, $cmp, $slotset, $ctx) {
      const {
        gid: api_scoped_id,
        ti: api_tab_index,
        b: api_bind,
        h: api_element,
        d: api_dynamic
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [api_element("span", {
        classMap: {
          "slds-radio": true
        },
        key: 2
      }, [api_element("input", {
        attrs: {
          "type": "radio",
          "name": $cmp.computedOptionName,
          "id": api_scoped_id("primitive-checkbox-radio-id"),
          "tabindex": api_tab_index($cmp.internalTabIndex),
          "data-navigation": "enable",
          "data-action-triggers": "space",
          "aria-labelledby": api_scoped_id($cmp.ariaLabelledBy)
        },
        props: {
          "disabled": $cmp.isDisabled,
          "checked": $cmp.isSelected
        },
        key: 3,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleRadioClick)),
          "keydown": _m1 || ($ctx._m1 = api_bind($cmp.handleRadioKeyDown))
        }
      }, []), api_element("label", {
        classMap: {
          "slds-radio__label": true
        },
        attrs: {
          "for": `${api_scoped_id("primitive-checkbox-radio-id")}`
        },
        key: 4
      }, [api_element("span", {
        classMap: {
          "slds-radio_faux": true
        },
        key: 5
      }, []), api_element("span", {
        classMap: {
          "slds-form-element__label": true,
          "slds-assistive-text": true
        },
        key: 6
      }, [api_dynamic($cmp.selectItemAssistiveText)])])])];
    }

    var radio = lwc.registerTemplate(tmpl$I);
    tmpl$I.stylesheets = [];
    tmpl$I.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellCheckbox_radio-host",
      shadowAttribute: "lightning-primitiveCellCheckbox_radio"
    };

    const i18n$f = {
      selectItem: labelSelectItem
    };

    class PrimitiveCellCheckbox extends PrimitiveDatatableCell$1 {
      constructor(...args) {
        super(...args);
        this.rowIndex = 0;
        this.isSelected = false;
        this.isDisabled = false;
        this.type = 'checkbox';
        this.dtContextId = void 0;
      }

      render() {
        if (this.type === 'radio') {
          return radio;
        }

        return checkbox;
      }

      get selectItemAssistiveText() {
        return `${i18n$f.selectItem} ${this.rowIndex + 1}`;
      }

      get labelId() {
        return `radio-button-label-${this.rowIndex + 1}`;
      }

      get ariaLabelledBy() {
        return `${this.labelId} radio-group-header`;
      }

      get computedOptionName() {
        return `${this.dtContextId}-options`;
      }

      handleRadioClick(event) {
        event.stopPropagation();

        if (!this.isSelected) {
          this.dispatchSelection(false);
        }
      }
      /**
       * We control the checkbox behaviour with the state and we handle it in the container,
       * but we need to prevent default in order to avoid the checkbox to change state
       * with the click and the generated click in the input from the label
       *
       * @param {Object} event - click event of the checkbox
       */


      handleCheckboxClick(event) {
        // click was catch on the input, stop propagation to avoid to be handled in container.
        // ideally you can let it bubble and be handled in there, but there is a raptor issue:
        // https://git.soma.salesforce.com/raptor/raptor/issues/838
        event.stopPropagation();
        this.dispatchSelection(event.shiftKey);
      }

      handleCheckboxContainerClick(event) {
        if (!this.isDisabled) {
          // click was catch in the label, the default its to activate the checkbox,
          // lets prevent it to avoid to send a double event.
          event.preventDefault();
          this.dispatchSelection(event.shiftKey);
        }
      }

      handleCheckboxContainerMouseDown(event) {
        // Prevent selecting text by Shift+click
        if (event.shiftKey) {
          event.preventDefault();
        }
      }

      handleRadioKeyDown(event) {
        const keyCode = event.keyCode;

        if (keyCode === keyCodes.left || keyCode === keyCodes.right) {
          // default behavior for radios is to select the prev/next radio with the same name
          event.preventDefault();
        }
      }

      dispatchSelection(isMultipleSelection) {
        const actionName = !this.isSelected ? 'selectrow' : 'deselectrow'; // eslint-disable-next-line lightning-global/no-custom-event-identifier-arguments

        const actionEvent = new CustomEvent(actionName, {
          bubbles: true,
          composed: true,
          detail: {
            rowKeyValue: this.rowKeyValue,
            isMultiple: isMultipleSelection
          }
        });
        this.dispatchEvent(actionEvent);
      }

    }

    lwc.registerDecorators(PrimitiveCellCheckbox, {
      publicProps: {
        rowIndex: {
          config: 0
        },
        isSelected: {
          config: 0
        },
        isDisabled: {
          config: 0
        },
        type: {
          config: 0
        },
        dtContextId: {
          config: 0
        }
      }
    });

    var _lightningPrimitiveCellCheckbox = lwc.registerComponent(PrimitiveCellCheckbox, {
      tmpl: _tmpl$1
    });

    function tmpl$J($api, $cmp, $slotset, $ctx) {
      const {
        k: api_key,
        c: api_custom_element,
        i: api_iterator,
        ti: api_tab_index,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [api_custom_element("lightning-button-menu", _lightningButtonMenu, {
        props: {
          "iconSize": "x-small",
          "alternativeText": $cmp.buttonAlternateText,
          "menuAlignment": $cmp.computedMenuAlignment,
          "isLoading": $cmp.state.isLoadingActions,
          "loadingStateAlternativeText": $cmp.spinnerAlternateText,
          "tabIndex": api_tab_index($cmp.state.internalTabIndex)
        },
        key: 2,
        on: {
          "select": _m0 || ($ctx._m0 = api_bind($cmp.handleActionSelect)),
          "open": _m1 || ($ctx._m1 = api_bind($cmp.handleMenuOpen))
        }
      }, api_iterator($cmp.state.actions, function (action) {
        return api_custom_element("lightning-menu-item", _lightningMenuItem, {
          props: {
            "value": action,
            "label": action.label,
            "iconName": action.iconName,
            "disabled": action.disabled
          },
          key: api_key(4, action.label)
        }, []);
      }))];
    }

    var _tmpl$s = lwc.registerTemplate(tmpl$J);
    tmpl$J.stylesheets = [];
    tmpl$J.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellActions_primitiveCellActions-host",
      shadowAttribute: "lightning-primitiveCellActions_primitiveCellActions"
    };

    var labelLoadingActions = 'Loading actions';

    var labelShowActions$1 = 'Show actions';

    const DEFAULT_MENU_ALIGNMENT = 'auto-right';
    const VALID_MENU_ALIGNMENT = ['auto-right', 'auto-left', 'auto', 'left', 'center', 'right', 'bottom-left', 'bottom-center', 'bottom-right'];
    const i18n$g = {
      loadingActions: labelLoadingActions,
      showActions: labelShowActions$1
    };

    class PrimitiveCellActions extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.rowKeyValue = void 0;
        this.colKeyValue = void 0;
        this.rowActions = void 0;
        this.containerRect = void 0;
        this.state = {
          actions: [],
          menuAlignment: DEFAULT_MENU_ALIGNMENT,
          internalTabIndex: false
        };
      }

      get tabIndex() {
        return -1;
      }

      set tabIndex(newValue) {
        this.state.internalTabIndex = newValue;
      }

      get menuAlignment() {
        return this.state.menuAlignment;
      }

      set menuAlignment(value) {
        this.state.menuAlignment = normalizeString(value, {
          fallbackValue: DEFAULT_MENU_ALIGNMENT,
          validValues: VALID_MENU_ALIGNMENT
        });
      }

      focus() {
        this.template.querySelector('lightning-button-menu').focus();
      }

      get computedMenuAlignment() {
        return this.menuAlignment;
      }

      get buttonAlternateText() {
        return `${i18n$g.showActions}`;
      }

      get spinnerAlternateText() {
        return `${i18n$g.loadingActions}`;
      }

      handleActionSelect(event) {
        this.dispatchEvent(new CustomEvent('privatecellactiontriggered', {
          composed: true,
          bubbles: true,
          cancelable: true,
          detail: {
            rowKeyValue: this.rowKeyValue,
            colKeyValue: this.colKeyValue,
            action: event.detail.value
          }
        }));
      }

      handleMenuOpen() {
        this.elementRect = this.template.querySelector('lightning-button-menu').getBoundingClientRect();
        const detail = {
          rowKeyValue: this.rowKeyValue,
          colKeyValue: this.colKeyValue,
          doneCallback: this.finishLoadingActions.bind(this),
          saveContainerPosition: containerRect => {
            this.containerRect = containerRect;
          }
        };

        if (typeof this.rowActions === 'function') {
          this.state.isLoadingActions = true;
          this.state.actions = [];
          detail.actionsProviderFunction = this.rowActions; // This callback should always be async

          Promise.resolve().then(() => {
            this.dispatchEvent(new CustomEvent('privatecellactionmenuopening', {
              composed: true,
              bubbles: true,
              cancelable: true,
              detail
            }));
          });
        } else {
          this.state.actions = this.rowActions;
        }
      }

      finishLoadingActions(actions) {
        this.state.isLoadingActions = false;
        this.state.actions = actions;
      }

    }

    lwc.registerDecorators(PrimitiveCellActions, {
      publicProps: {
        rowKeyValue: {
          config: 0
        },
        colKeyValue: {
          config: 0
        },
        rowActions: {
          config: 0
        },
        tabIndex: {
          config: 3
        },
        menuAlignment: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        containerRect: 1,
        state: 1
      }
    });

    var _lightningPrimitiveCellActions = lwc.registerComponent(PrimitiveCellActions, {
      tmpl: _tmpl$s
    });

    function tmpl$K($api, $cmp, $slotset, $ctx) {
      const {
        ti: api_tab_index,
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-primitive-cell-actions", _lightningPrimitiveCellActions, {
        attrs: {
          "data-navigation": "enable",
          "data-action-triggers": "enter,space"
        },
        props: {
          "rowKeyValue": $cmp.rowKeyValue,
          "colKeyValue": $cmp.colKeyValue,
          "tabIndex": api_tab_index($cmp.internalTabIndex),
          "menuAlignment": $cmp.typeAttribute0,
          "rowActions": $cmp.typeAttribute1
        },
        key: 2
      }, [])];
    }

    var action = lwc.registerTemplate(tmpl$K);
    tmpl$K.stylesheets = [];
    tmpl$K.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_action-host",
      shadowAttribute: "lightning-primitiveCellTypes_action"
    };

    function tmpl$L($api, $cmp, $slotset, $ctx) {
      const {
        ti: api_tab_index,
        b: api_bind,
        c: api_custom_element
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [$cmp.isButtonIconType ? api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        className: $cmp.buttonClass,
        props: {
          "variant": $cmp.variant,
          "alternativeText": $cmp.alternativeText,
          "iconName": $cmp.iconName,
          "iconClass": $cmp.iconClass,
          "disabled": $cmp.disabled,
          "name": $cmp.buttonName,
          "title": $cmp.computedTitle,
          "tabIndex": api_tab_index($cmp.internalTabIndex)
        },
        key: 3,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleButtonClick))
        }
      }, []) : null, !$cmp.isButtonIconType ? api_custom_element("lightning-button", _lightningButton, {
        className: $cmp.buttonClass,
        props: {
          "variant": $cmp.variant,
          "label": $cmp.label,
          "iconName": $cmp.iconName,
          "iconPosition": $cmp.iconPosition,
          "disabled": $cmp.disabled,
          "name": $cmp.buttonName,
          "title": $cmp.computedTitle,
          "tabIndex": api_tab_index($cmp.internalTabIndex)
        },
        key: 5,
        on: {
          "click": _m1 || ($ctx._m1 = api_bind($cmp.handleButtonClick))
        }
      }, []) : null];
    }

    var _tmpl$t = lwc.registerTemplate(tmpl$L);
    tmpl$L.stylesheets = [];
    tmpl$L.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellButton_primitiveCellButton-host",
      shadowAttribute: "lightning-primitiveCellButton_primitiveCellButton"
    };

    class PrivateCellButton extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.rowKeyValue = void 0;
        this.colKeyValue = void 0;
        this.variant = void 0;
        this.label = void 0;
        this.iconName = void 0;
        this.iconPosition = void 0;
        this.buttonName = void 0;
        this.buttonClass = void 0;
        this.buttonTitle = void 0;
        this.internalTabIndex = void 0;
        this.type = void 0;
        this.alternativeText = void 0;
        this.iconClass = void 0;
        this.initialRender = true;
        this.buttonHasFocus = false;
        this.state = {
          disabled: false
        };
      }

      focus() {
        const buttonCustomElement = this.buttonCustomElement;

        if (buttonCustomElement) {
          buttonCustomElement.focus();
        }
      }

      get computedTitle() {
        return this.buttonTitle || this.label;
      }

      get disabled() {
        return this.state.disabled;
      }

      set disabled(value) {
        const newValue = normalizeBoolean(value);
        const oldValue = this.state.disabled;

        if (oldValue === false && newValue === true && this.buttonHasFocus) {
          this.fireCellFalseBlurred();
        }

        this.state.disabled = newValue;
      }

      get isButtonIconType() {
        return this.type === 'button-icon';
      }

      renderedCallback() {
        if (this.initialRender) {
          this.addListeners();
        }

        this.initialRender = false;
      }

      get buttonCustomElement() {
        const qs = this.isButtonIconType ? 'lightning-button-icon' : 'lightning-button';
        return this.template.querySelector(qs);
      }

      addListeners() {
        const buttonCustomElement = this.buttonCustomElement;
        buttonCustomElement.addEventListener('focus', this.handleButtonFocused.bind(this));
        buttonCustomElement.addEventListener('blur', this.handleButtonBlurred.bind(this));
      }

      handleButtonFocused(event) {
        if (event.target.localName.indexOf('button') > -1) {
          this.buttonHasFocus = true;
        }
      }

      handleButtonBlurred(event) {
        if (event.target.localName.indexOf('button') > -1) {
          this.buttonHasFocus = false;
        }
      }

      fireCellFalseBlurred() {
        const {
          rowKeyValue,
          colKeyValue
        } = this;
        this.dispatchEvent(new CustomEvent('privatecellfalseblurred', {
          composed: true,
          bubbles: true,
          cancelable: true,
          detail: {
            rowKeyValue,
            colKeyValue
          }
        }));
      }

      handleButtonClick() {
        const {
          rowKeyValue,
          colKeyValue
        } = this; // fire this event in the next tick so that dt can do things it has to do for correct focus
        // eslint-disable-next-line lwc/no-set-timeout

        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('privatecellbuttonclicked', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {
              rowKeyValue,
              colKeyValue
            }
          }));
        }, 0);
      }

    }

    lwc.registerDecorators(PrivateCellButton, {
      publicProps: {
        rowKeyValue: {
          config: 0
        },
        colKeyValue: {
          config: 0
        },
        variant: {
          config: 0
        },
        label: {
          config: 0
        },
        iconName: {
          config: 0
        },
        iconPosition: {
          config: 0
        },
        buttonName: {
          config: 0
        },
        buttonClass: {
          config: 0
        },
        buttonTitle: {
          config: 0
        },
        internalTabIndex: {
          config: 0
        },
        type: {
          config: 0
        },
        alternativeText: {
          config: 0
        },
        iconClass: {
          config: 0
        },
        disabled: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        state: 1
      }
    });

    var _lightningPrimitiveCellButton = lwc.registerComponent(PrivateCellButton, {
      tmpl: _tmpl$t
    });

    function tmpl$M($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-primitive-cell-button", _lightningPrimitiveCellButton, {
        attrs: {
          "data-navigation": "enable",
          "data-action-triggers": "enter,space"
        },
        props: {
          "rowKeyValue": $cmp.rowKeyValue,
          "colKeyValue": $cmp.colKeyValue,
          "variant": $cmp.typeAttribute0,
          "label": $cmp.typeAttribute1,
          "iconName": $cmp.typeAttribute2,
          "iconPosition": $cmp.typeAttribute3,
          "disabled": $cmp.typeAttribute4,
          "buttonName": $cmp.typeAttribute5,
          "buttonClass": $cmp.typeAttribute6,
          "buttonTitle": $cmp.typeAttribute7,
          "internalTabIndex": $cmp.internalTabIndex
        },
        key: 2
      }, [])];
    }

    var button = lwc.registerTemplate(tmpl$M);
    tmpl$M.stylesheets = [];
    tmpl$M.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_button-host",
      shadowAttribute: "lightning-primitiveCellTypes_button"
    };

    function tmpl$N($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic
      } = $api;
      return [api_dynamic($cmp.formattedNumber)];
    }

    var _tmpl$u = lwc.registerTemplate(tmpl$N);
    tmpl$N.stylesheets = [];
    tmpl$N.stylesheetTokens = {
      hostAttribute: "lightning-formattedNumber_formattedNumber-host",
      shadowAttribute: "lightning-formattedNumber_formattedNumber"
    };

    /**
     * Displays formatted numbers for decimals, currency, and percentages.
     */

    class LightningFormattedNumber extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.value = void 0;
        this.formatStyle = 'decimal';
        this.currencyCode = void 0;
        this.currencyDisplayAs = 'symbol';
        this.minimumIntegerDigits = void 0;
        this.minimumFractionDigits = void 0;
        this.maximumFractionDigits = void 0;
        this.minimumSignificantDigits = void 0;
        this.maximumSignificantDigits = void 0;
      }

      get formattedNumber() {
        const value = this.value;
        const options = {
          style: this.formatStyle,
          currency: this.currencyCode,
          currencyDisplay: this.currencyDisplayAs,
          minimumIntegerDigits: this.minimumIntegerDigits,
          minimumFractionDigits: this.minimumFractionDigits,
          maximumFractionDigits: this.maximumFractionDigits,
          minimumSignificantDigits: this.minimumSignificantDigits,
          maximumSignificantDigits: this.maximumSignificantDigits
        };
        const canReturnValue = value !== undefined && value !== null && value !== '' && isFinite(value);

        if (canReturnValue) {
          let valueToFormat = value; // percent-fixed just divides the value by 100
          // before passing to the library, this is to deal with the
          // fact that percentages in salesforce are 0-100, not 0-1

          if (this.formatStyle === 'percent-fixed') {
            options.style = 'percent';
            valueToFormat = parseFloat(value) / 100;
          }

          return numberFormat(options).format(valueToFormat);
        }

        return '';
      }

    }

    lwc.registerDecorators(LightningFormattedNumber, {
      publicProps: {
        value: {
          config: 0
        },
        formatStyle: {
          config: 0
        },
        currencyCode: {
          config: 0
        },
        currencyDisplayAs: {
          config: 0
        },
        minimumIntegerDigits: {
          config: 0
        },
        minimumFractionDigits: {
          config: 0
        },
        maximumFractionDigits: {
          config: 0
        },
        minimumSignificantDigits: {
          config: 0
        },
        maximumSignificantDigits: {
          config: 0
        }
      }
    });

    var _lightningFormattedNumber = lwc.registerComponent(LightningFormattedNumber, {
      tmpl: _tmpl$u
    });
    LightningFormattedNumber.interopMap = {
      props: {
        formatStyle: 'style'
      }
    };

    function tmpl$O($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-number", _lightningFormattedNumber, {
        props: {
          "value": $cmp.value,
          "formatStyle": "currency",
          "currencyCode": $cmp.typeAttribute0,
          "currencyDisplayAs": $cmp.typeAttribute1,
          "minimumIntegerDigits": $cmp.typeAttribute2,
          "minimumFractionDigits": $cmp.typeAttribute3,
          "maximumFractionDigits": $cmp.typeAttribute4,
          "minimumSignificantDigits": $cmp.typeAttribute5,
          "maximumSignificantDigits": $cmp.typeAttribute6
        },
        key: 2
      }, [])];
    }

    var currency = lwc.registerTemplate(tmpl$O);
    tmpl$O.stylesheets = [];
    tmpl$O.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_currency-host",
      shadowAttribute: "lightning-primitiveCellTypes_currency"
    };

    function tmpl$P($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic
      } = $api;
      return [api_dynamic($cmp.formattedValue)];
    }

    var _tmpl$v = lwc.registerTemplate(tmpl$P);
    tmpl$P.stylesheets = [];
    tmpl$P.stylesheetTokens = {
      hostAttribute: "lightning-formattedDateTime_formattedDateTime-host",
      shadowAttribute: "lightning-formattedDateTime_formattedDateTime"
    };

    /**
     * Displays formatted date and time.
     */

    class LightningFormattedDateTime extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.value = void 0;
        this.weekday = void 0;
        this.era = void 0;
        this.year = void 0;
        this.month = void 0;
        this.day = void 0;
        this.hour = void 0;
        this.minute = void 0;
        this.second = void 0;
        this.timeZoneName = void 0;
        this.timeZone = void 0;
        this._hour12 = false;
        this._hour12Set = false;
      }

      /**
       * Determines whether time is displayed as 12-hour. If false, time displays as 24-hour. The default setting is determined by the user's locale.
       * @type {boolean}
       *
       */
      get hour12() {
        return this._hour12;
      }

      set hour12(value) {
        // If hour12 is not explicitly set then locale default is used instead.
        this._hour12Set = true;
        this._hour12 = normalizeBoolean(value);
      }

      get formattedValue() {
        return this.computeFormattedValue();
      }

      computeFormattedValue() {
        const {
          value
        } = this;

        if (!this.isEmpty(value) && this.isValid(value)) {
          const formatted = dateTimeFormat(this.getOptions()).format(value);

          if (formatted) {
            return formatted;
          }
        }

        this.printError(value);
        return '';
      }

      isEmpty(value) {
        return value === undefined || value === null || value === '';
      }

      isValid(value) {
        return isFinite(value) || isValidISODateTimeString(value);
      }

      printError(value) {
        const errorMsg = `<lightning-formatted-date-time> The value attribute accepts either a Date object, a timestamp, or a valid ISO8601 formatted string ` + `with timezone offset. but we are getting the ${typeof value} value "${value}" instead.`;
        console.warn(errorMsg); // eslint-disable-line no-console
      }

      getOptions() {
        const options = {
          weekday: this.weekday,
          era: this.era,
          year: this.year,
          month: this.month,
          day: this.day,
          hour: this.hour,
          minute: this.minute,
          second: this.second,
          timeZoneName: this.timeZoneName,
          timeZone: this.timeZone
        }; // If hour12 is set, then we use it, otherwise locale defaults will be used

        if (this._hour12Set) {
          options.hour12 = this.hour12;
        }

        return options;
      }

    }

    lwc.registerDecorators(LightningFormattedDateTime, {
      publicProps: {
        value: {
          config: 0
        },
        weekday: {
          config: 0
        },
        era: {
          config: 0
        },
        year: {
          config: 0
        },
        month: {
          config: 0
        },
        day: {
          config: 0
        },
        hour: {
          config: 0
        },
        minute: {
          config: 0
        },
        second: {
          config: 0
        },
        timeZoneName: {
          config: 0
        },
        timeZone: {
          config: 0
        },
        hour12: {
          config: 3
        }
      },
      track: {
        _hour12: 1,
        _hour12Set: 1
      }
    });

    var _lightningFormattedDateTime = lwc.registerComponent(LightningFormattedDateTime, {
      tmpl: _tmpl$v
    });

    function tmpl$Q($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-date-time", _lightningFormattedDateTime, {
        props: {
          "value": $cmp.dateValue,
          "day": $cmp.typeAttribute0,
          "era": $cmp.typeAttribute1,
          "hour": $cmp.typeAttribute2,
          "hour12": $cmp.typeAttribute3,
          "minute": $cmp.typeAttribute4,
          "month": $cmp.typeAttribute5,
          "second": $cmp.typeAttribute6,
          "timeZone": $cmp.typeAttribute7,
          "timeZoneName": $cmp.typeAttribute8,
          "weekday": $cmp.typeAttribute9,
          "year": $cmp.typeAttribute10
        },
        key: 2
      }, [])];
    }

    var date = lwc.registerTemplate(tmpl$Q);
    tmpl$Q.stylesheets = [];
    tmpl$Q.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_date-host",
      shadowAttribute: "lightning-primitiveCellTypes_date"
    };

    function tmpl$R($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        t: api_text,
        d: api_dynamic,
        ti: api_tab_index,
        h: api_element
      } = $api;
      return [$cmp.hasValue ? api_element("a", {
        attrs: {
          "href": $cmp.href,
          "tabindex": api_tab_index($cmp.tabIndex)
        },
        key: 3
      }, [!$cmp.hideIcon ? api_custom_element("lightning-icon", _lightningIcon, {
        props: {
          "iconName": "utility:email",
          "size": "x-small",
          "alternativeText": $cmp.i18n.emailLabel
        },
        key: 5
      }, []) : null, api_text(" "), api_dynamic($cmp.computedLabel)]) : null];
    }

    var _tmpl$w = lwc.registerTemplate(tmpl$R);
    tmpl$R.stylesheets = [];
    tmpl$R.stylesheetTokens = {
      hostAttribute: "lightning-formattedEmail_formattedEmail-host",
      shadowAttribute: "lightning-formattedEmail_formattedEmail"
    };

    var labelEmailLabel = 'Email';

    // also be added to the static `labels` prop inside the class.
    // https://git.soma.salesforce.com/raptor/raptor/issues/196

    const i18n$h = {
      emailLabel: labelEmailLabel
    };
    /**
     * Displays an email as a hyperlink with the mailto: URL scheme.
     */

    class LightningFormattedEmail extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.value = void 0;
        this.label = void 0;
        this.tabIndex = void 0;
        this.hideIcon = false;
        this._connected = false;
      }

      connectedCallback() {
        this._connected = true;
      }

      disconnectedCallback() {
        this._connected = false;
      }
      /**
       * Sets focus on the element.
       */


      focus() {
        if (this.emailAnchor) {
          this.emailAnchor.focus();
        }
      }
      /**
       * Removes keyboard focus from the element.
       */


      blur() {
        if (this.emailAnchor) {
          this.emailAnchor.blur();
        }
      }
      /**
       * Clicks the email address and opens the default email app.
       */


      click() {
        const anchor = this.emailAnchor;

        if (anchor && anchor.click) {
          anchor.click();
        }
      }

      get emailAnchor() {
        if (this._connected && this.hasValue) {
          return this.template.querySelector('a');
        }

        return undefined;
      }

      get trimmedValue() {
        return (this.value || '').trim();
      }

      get trimmedLabel() {
        return (this.label || '').trim();
      }

      get hasValue() {
        return !!this.trimmedValue;
      }

      get href() {
        return 'mailto:' + this.trimmedValue;
      }

      get computedLabel() {
        return this.trimmedLabel || this.trimmedValue;
      }

      get i18n() {
        return i18n$h;
      }

    }

    lwc.registerDecorators(LightningFormattedEmail, {
      publicProps: {
        value: {
          config: 0
        },
        label: {
          config: 0
        },
        tabIndex: {
          config: 0
        },
        hideIcon: {
          config: 0
        }
      },
      publicMethods: ["focus", "blur", "click"]
    });

    var _lightningFormattedEmail = lwc.registerComponent(LightningFormattedEmail, {
      tmpl: _tmpl$w
    });

    function tmpl$S($api, $cmp, $slotset, $ctx) {
      const {
        ti: api_tab_index,
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-email", _lightningFormattedEmail, {
        attrs: {
          "data-navigation": "enable"
        },
        props: {
          "value": $cmp.value,
          "tabIndex": api_tab_index($cmp.internalTabIndex)
        },
        key: 2
      }, [])];
    }

    var email = lwc.registerTemplate(tmpl$S);
    tmpl$S.stylesheets = [];
    tmpl$S.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_email-host",
      shadowAttribute: "lightning-primitiveCellTypes_email"
    };

    function tmpl$T($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        t: api_text
      } = $api;
      return [$cmp.isValid ? api_dynamic($cmp.latitude) : null, $cmp.isValid ? api_text(", ") : null, $cmp.isValid ? api_dynamic($cmp.longitude) : null];
    }

    var _tmpl$x = lwc.registerTemplate(tmpl$T);
    tmpl$T.stylesheets = [];
    tmpl$T.stylesheetTokens = {
      hostAttribute: "lightning-formattedLocation_formattedLocation-host",
      shadowAttribute: "lightning-formattedLocation_formattedLocation"
    };

    const MAX_LONGITUDE = 180.0;
    const MAX_LATITUDE = 90.0;

    function isNumber(value) {
      return value !== '' && value !== null && isFinite(value);
    }

    function isLongitude(longitude) {
      return isNumber(longitude) && Math.abs(longitude) <= MAX_LONGITUDE;
    }

    function isLatitude(latitude) {
      return isNumber(latitude) && Math.abs(latitude) <= MAX_LATITUDE;
    }
    /**
     * Displays a geolocation in decimal degrees using the format [latitude, longitude].
     */


    class LightningFormattedLocation extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.latitude = void 0;
        this.longitude = void 0;
      }

      get isValid() {
        const valid = isLatitude(this.latitude) && isLongitude(this.longitude);

        if (!valid) {
          // eslint-disable-next-line no-console
          console.warn(`<lightning-formatted-location> expects latitude in range [-90.0, 90.0], longitude in range [-180.0, 180.0].`);
        }

        return valid;
      }

    }

    lwc.registerDecorators(LightningFormattedLocation, {
      publicProps: {
        latitude: {
          config: 0
        },
        longitude: {
          config: 0
        }
      }
    });

    var _lightningFormattedLocation = lwc.registerComponent(LightningFormattedLocation, {
      tmpl: _tmpl$x
    });

    function tmpl$U($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-location", _lightningFormattedLocation, {
        props: {
          "latitude": $cmp.value.latitude,
          "longitude": $cmp.value.longitude
        },
        key: 2
      }, [])];
    }

    var location = lwc.registerTemplate(tmpl$U);
    tmpl$U.stylesheets = [];
    tmpl$U.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_location-host",
      shadowAttribute: "lightning-primitiveCellTypes_location"
    };

    function tmpl$V($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-number", _lightningFormattedNumber, {
        props: {
          "value": $cmp.value,
          "minimumIntegerDigits": $cmp.typeAttribute0,
          "minimumFractionDigits": $cmp.typeAttribute1,
          "maximumFractionDigits": $cmp.typeAttribute2,
          "minimumSignificantDigits": $cmp.typeAttribute3,
          "maximumSignificantDigits": $cmp.typeAttribute4
        },
        key: 2
      }, [])];
    }

    var number = lwc.registerTemplate(tmpl$V);
    tmpl$V.stylesheets = [];
    tmpl$V.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_number-host",
      shadowAttribute: "lightning-primitiveCellTypes_number"
    };

    function tmpl$W($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-number", _lightningFormattedNumber, {
        props: {
          "value": $cmp.value,
          "formatStyle": "percent",
          "minimumIntegerDigits": $cmp.typeAttribute0,
          "minimumFractionDigits": $cmp.typeAttribute1,
          "maximumFractionDigits": $cmp.typeAttribute2,
          "minimumSignificantDigits": $cmp.typeAttribute3,
          "maximumSignificantDigits": $cmp.typeAttribute4
        },
        key: 2
      }, [])];
    }

    var percent = lwc.registerTemplate(tmpl$W);
    tmpl$W.stylesheets = [];
    tmpl$W.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_percent-host",
      shadowAttribute: "lightning-primitiveCellTypes_percent"
    };

    function tmpl$X($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        ti: api_tab_index,
        h: api_element
      } = $api;
      return [$cmp.showLink ? api_element("a", {
        attrs: {
          "href": $cmp.link,
          "tabindex": api_tab_index($cmp.tabIndex)
        },
        key: 3
      }, [api_dynamic($cmp.formattedPhoneNumber)]) : null];
    }

    var _tmpl$y = lwc.registerTemplate(tmpl$X);
    tmpl$X.stylesheets = [];
    tmpl$X.stylesheetTokens = {
      hostAttribute: "lightning-formattedPhone_formattedPhone-host",
      shadowAttribute: "lightning-formattedPhone_formattedPhone"
    };

    /**
     * Displays a phone number as a hyperlink with the tel: URL scheme.
     */

    class LightningFormattedPhone extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.value = void 0;
        this.tabIndex = void 0;
        this._connected = false;
      }

      connectedCallback() {
        this._connected = true;
      }

      disconnectedCallback() {
        this._connected = false;
      }
      /**
       * Sets focus on the element.
       */


      focus() {
        if (this.phoneAnchor) {
          this.phoneAnchor.focus();
        }
      }
      /**
       * Removes keyboard focus from the element.
       */


      blur() {
        if (this.phoneAnchor) {
          this.phoneAnchor.blur();
        }
      }
      /**
       * Clicks the phone number and opens the default phone app.
       */


      click() {
        const anchor = this.phoneAnchor;

        if (anchor && anchor.click) {
          anchor.click();
        }
      }

      get phoneAnchor() {
        if (this._connected && this.showLink) {
          return this.template.querySelector('a');
        }

        return undefined;
      }

      get showLink() {
        return this.value != null && this.value !== '';
      }

      get formattedPhoneNumber() {
        return toNorthAmericanPhoneNumber(this.value);
      }

      get link() {
        return `tel:${this.value}`;
      }

    }

    lwc.registerDecorators(LightningFormattedPhone, {
      publicProps: {
        value: {
          config: 0
        },
        tabIndex: {
          config: 0
        }
      },
      publicMethods: ["focus", "blur", "click"]
    });

    var _lightningFormattedPhone = lwc.registerComponent(LightningFormattedPhone, {
      tmpl: _tmpl$y
    });

    function tmpl$Y($api, $cmp, $slotset, $ctx) {
      const {
        ti: api_tab_index,
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-phone", _lightningFormattedPhone, {
        attrs: {
          "data-navigation": "enable"
        },
        props: {
          "value": $cmp.value,
          "tabIndex": api_tab_index($cmp.internalTabIndex)
        },
        key: 2
      }, [])];
    }

    var phone = lwc.registerTemplate(tmpl$Y);
    tmpl$Y.stylesheets = [];
    tmpl$Y.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_phone-host",
      shadowAttribute: "lightning-primitiveCellTypes_phone"
    };

    function tmpl$Z($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        d: api_dynamic,
        h: api_element,
        ti: api_tab_index,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1,
        _m2
      } = $ctx;
      return [api_element("button", {
        className: $cmp.computedButtonClass,
        attrs: {
          "data-trigger": "true",
          "tabindex": api_tab_index($cmp.internalTabIndex)
        },
        key: 2,
        on: {
          "mouseover": _m0 || ($ctx._m0 = api_bind($cmp.handleMouseOver)),
          "mouseout": _m1 || ($ctx._m1 = api_bind($cmp.handleMouseOut)),
          "click": _m2 || ($ctx._m2 = api_bind($cmp.handleClick))
        }
      }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.computedHeaderIconName,
          "variant": $cmp.variant,
          "size": $cmp.size
        },
        key: 3
      }, []), $cmp.alternativeText ? api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 4
      }, [api_dynamic($cmp.alternativeText)]) : null])];
    }

    var _tmpl$z = lwc.registerTemplate(tmpl$Z);
    tmpl$Z.stylesheets = [];
    tmpl$Z.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableTooltip_primitiveDatatableTooltip-host",
      shadowAttribute: "lightning-primitiveDatatableTooltip_primitiveDatatableTooltip"
    };

    function tmpl$_($api, $cmp, $slotset, $ctx) {
      const {
        b: api_bind,
        c: api_custom_element,
        h: api_element,
        d: api_dynamic,
        gid: api_scoped_id,
        k: api_key,
        i: api_iterator
      } = $api;
      const {
        _m0,
        _m1,
        _m2,
        _m3
      } = $ctx;
      return [api_element("section", {
        styleMap: {
          "outline": "none"
        },
        attrs: {
          "role": "dialog",
          "aria-describedby": `${api_scoped_id("primitive-datatable-tooltip-bubble-body-id")}`,
          "aria-labelledby": `${api_scoped_id("primitive-datatable-tooltip-bubble-header-id")}`,
          "tabindex": "0"
        },
        key: 2,
        on: {
          "focusout": _m2 || ($ctx._m2 = api_bind($cmp.handleBlur)),
          "keydown": _m3 || ($ctx._m3 = api_bind($cmp.handleBubbleKey))
        }
      }, [!$cmp.hideCloseButton ? api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        classMap: {
          "slds-float_right": true,
          "slds-popover__close": true
        },
        attrs: {
          "data-close": "true"
        },
        props: {
          "iconName": "utility:close",
          "variant": "bare-inverse",
          "size": "small",
          "alternativeText": $cmp.i18n.closeButtonAssistiveText
        },
        key: 4,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleCloseButtonClick)),
          "keydown": _m1 || ($ctx._m1 = api_bind($cmp.handleCloseButtonKey))
        }
      }, []) : null, api_element("header", {
        classMap: {
          "slds-popover__header": true
        },
        key: 5
      }, [api_element("div", {
        classMap: {
          "slds-media": true,
          "slds-media_center": true,
          "slds-has-flexi-truncate": true
        },
        key: 6
      }, [api_element("div", {
        classMap: {
          "slds-media__figure": true
        },
        key: 7
      }, [api_element("span", {
        classMap: {
          "slds-icon_container": true,
          "slds-icon-utility-ban": true
        },
        key: 8
      }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.computedHeaderIconName,
          "size": "x-small",
          "variant": "inverse"
        },
        key: 9
      }, [])])]), api_element("div", {
        classMap: {
          "slds-media__body": true
        },
        key: 10
      }, [api_element("h2", {
        classMap: {
          "slds-truncate": true,
          "slds-text-heading_medium": true
        },
        attrs: {
          "id": api_scoped_id("primitive-datatable-tooltip-bubble-header-id"),
          "title": $cmp.header
        },
        key: 11
      }, [api_dynamic($cmp.header)])])])]), api_element("div", {
        classMap: {
          "slds-popover__body": true
        },
        attrs: {
          "id": api_scoped_id("primitive-datatable-tooltip-bubble-body-id")
        },
        key: 12
      }, [$cmp.isContentList ? api_element("ul", {
        styleMap: {
          "listStyle": "disc",
          "marginLeft": "1.5rem"
        },
        key: 14
      }, api_iterator($cmp.content, function (item, index) {
        return api_element("li", {
          key: api_key(16, item)
        }, [api_dynamic(item)]);
      })) : null, !$cmp.isContentList ? api_dynamic($cmp.content) : null])])];
    }

    var _tmpl$A = lwc.registerTemplate(tmpl$_);
    tmpl$_.stylesheets = [];
    tmpl$_.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableTooltipBubble_primitiveDatatableTooltipBubble-host",
      shadowAttribute: "lightning-primitiveDatatableTooltipBubble_primitiveDatatableTooltipBubble"
    };

    var labelCloseButtonAssistiveText = 'Close dialog';

    const i18n$i = {
      closeButtonAssistiveText: labelCloseButtonAssistiveText
    };
    const DEFAULT_ALIGN$1 = {
      horizontal: 'left',
      vertical: 'bottom'
    };

    class LightningPrimitiveDatatableTooltipBubble extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.state = {
          inDom: false,
          visible: false,
          align: DEFAULT_ALIGN$1
        };
        this.anchor = void 0;
        this.header = '';
        this.content = '';
        this.variant = 'bare';
        this.hideCloseButton = false;

        this.handleBlur = evt => {
          // A valid blur is when the focus goes to an element outside the bubble.
          // If the element with the focus is inside the bubble, then the component as a whole was not blurred.
          const isValidBlur = evt.relatedTarget === null || !this.template.contains(evt.relatedTarget);

          if (isValidBlur) {
            this.handleBubbleFocusLost();
          }
        };

        this.handleBubbleFocusLost = () => {
          this.dispatchCloseButtonEvent('bubbleLoseFocus');
        };

        this.handleBubbleKey = event => {
          if (keyCodes.escape === event.keyCode) {
            this.dispatchCloseButtonEvent();
          }

          if (keyCodes.tab === event.keyCode) {
            event.preventDefault();
            event.stopPropagation();
            this.focus();
          }
        };

        this.handleCloseButtonClick = () => {
          this.dispatchCloseButtonEvent();
        };

        this.handleCloseButtonKey = event => {
          // block tab and all other keys to keep focus
          event.preventDefault();
          event.stopPropagation();
          const keysToClose = [keyCodes.enter, keyCodes.space, keyCodes.escape];

          if (keysToClose.includes(event.keyCode)) {
            this.dispatchCloseButtonEvent();
          }
        };
      }

      connectedCallback() {
        this.state.inDOM = true;
        this.updateClassList();
      }

      disconnectedCallback() {
        this.state.inDOM = false;
      }

      get align() {
        return this.state.align;
      }

      set align(value) {
        this.state.align = value;

        if (this.state.inDOM) {
          this.updateClassList();
        }
      }

      get visible() {
        return this.state.visible;
      }

      set visible(value) {
        this.state.visible = value;

        if (this.state.inDOM) {
          this.updateClassList();
        }
      }

      focus() {
        this.closeButton.focus();
      }

      get i18n() {
        return i18n$i;
      }

      get isContentList() {
        return Array.isArray(this.content);
      }

      get computedHeaderIconName() {
        switch (this.variant) {
          case 'error':
            return 'utility:ban';

          case 'warning':
            return 'utility:warning';

          case 'bare':
          default:
            return 'utility:info';
        }
      }

      get closeButton() {
        return this.template.querySelector('[data-close="true"]');
      }

      updateClassList() {
        const classes = classSet('slds-popover');
        classes.add({
          'slds-popover_error': this.variant === 'error',
          'slds-popover_warning': this.variant === 'warning'
        }); // apply fading effect

        classes.add({
          'slds-rise-from-ground': this.state.visible === true,
          'slds-fall-into-ground': this.state.visible === false
        }); // apply the proper nubbin CSS class

        const {
          horizontal,
          vertical
        } = this.align;
        classes.add({
          'slds-nubbin_top-left': horizontal === 'left' && vertical === 'top',
          'slds-nubbin_top-right': horizontal === 'right' && vertical === 'top',
          'slds-nubbin_bottom-left': horizontal === 'left' && vertical === 'bottom',
          'slds-nubbin_bottom-right': horizontal === 'right' && vertical === 'bottom'
        });
        classListMutation(this.classList, classes);
      }

      dispatchCloseButtonEvent(reason) {
        this.dispatchEvent(new CustomEvent('close', {
          detail: {
            reason: reason || 'userCloseBubble',
            anchor: this.anchor
          }
        }));
      }

    }

    lwc.registerDecorators(LightningPrimitiveDatatableTooltipBubble, {
      publicProps: {
        anchor: {
          config: 0
        },
        header: {
          config: 0
        },
        content: {
          config: 0
        },
        variant: {
          config: 0
        },
        hideCloseButton: {
          config: 0
        },
        align: {
          config: 3
        },
        visible: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        state: 1
      }
    });

    var LightningPrimitiveDatatableTooltipBubble$1 = lwc.registerComponent(LightningPrimitiveDatatableTooltipBubble, {
      tmpl: _tmpl$A
    });

    function getBubbleAlignAndPosition$1(triggerBoundingClientRect, bubbleBoundingClientRect, defaultAlign, shiftAmounts, availableHeight, availableWidth, xOffset, yOffset) {
      const bubbleOverflows = {};
      const align = {
        horizontal: defaultAlign.horizontal,
        vertical: defaultAlign.vertical
      };
      const positionAt = {
        top: null,
        right: null,
        bottom: null,
        left: null
      };
      bubbleOverflows.right = triggerBoundingClientRect.left + bubbleBoundingClientRect.width > availableWidth;
      bubbleOverflows.left = triggerBoundingClientRect.right - bubbleBoundingClientRect.width < 0;
      bubbleOverflows.top = triggerBoundingClientRect.top - (bubbleBoundingClientRect.height + shiftAmounts.vertical) < 0;
      bubbleOverflows.bottom = triggerBoundingClientRect.bottom + bubbleBoundingClientRect.height + shiftAmounts.vertical > availableHeight;

      if (bubbleOverflows.right) {
        align.horizontal = 'right';
        positionAt.right = availableWidth - triggerBoundingClientRect.right;
      }

      if (bubbleOverflows.left) {
        align.horizontal = 'left';
        positionAt.left = triggerBoundingClientRect.right;
      }

      if (bubbleOverflows.top) {
        align.vertical = 'top';
        positionAt.top = triggerBoundingClientRect.bottom;
      }

      if (bubbleOverflows.bottom) {
        align.vertical = 'bottom';
        positionAt.bottom = availableHeight - triggerBoundingClientRect.top;
      }

      const result = {
        align
      }; // assign default values for position bottom & left based on trigger element if needed
      // - default anchor point of popover is bottom left attached to trigger element's top left

      positionAt.bottom = positionAt.top || positionAt.top === 0 ? null : availableHeight - triggerBoundingClientRect.top;
      positionAt.left = positionAt.right || positionAt.right === 0 ? null : triggerBoundingClientRect.left; // apply calculated position values

      result.top = positionAt.top ? positionAt.top + shiftAmounts.vertical + yOffset + 'px' : positionAt.top;
      result.right = positionAt.right ? positionAt.right - shiftAmounts.horizontal - xOffset + 'px' : positionAt.right;
      result.bottom = positionAt.bottom ? positionAt.bottom + shiftAmounts.vertical - yOffset + 'px' : positionAt.bottom;
      result.left = positionAt.left ? positionAt.left - shiftAmounts.horizontal + xOffset + 'px' : positionAt.left;
      return result;
    }
    function getNubbinShiftAmount$1(nubbinComputedStyles, triggerWidth) {
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
    }

    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    const CACHED_BUBBLE_ELEMENT$2 = lwc.createElement('lightning-primitive-datatable-tooltip-bubble', {
      is: LightningPrimitiveDatatableTooltipBubble$1
    });
    CACHED_BUBBLE_ELEMENT$2.style.position = 'absolute';
    CACHED_BUBBLE_ELEMENT$2.style.minWidth = '75px';
    const DEFAULT_ANCHORING$1 = {
      trigger: {
        horizontal: 'left',
        vertical: 'top'
      },
      bubble: {
        horizontal: 'left',
        vertical: 'bottom'
      }
    };
    const ZERO_OFFSET = {
      horizontal: 0,
      // right if > 0, left if < 0
      vertical: 0 // down if > 0, up if < 0

    };

    class LightningPrimitiveDatatableTooltip extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.header = '';
        this.content = [];
        this.size = 'medium';
        this.trigger = 'click';
        this.hideCloseButton = false;
        this.variant = 'bare';
        this.alternativeText = void 0;
        this.internalTabIndex = void 0;
        this._uniqueId = `primitive-datatable-tooltip_${guid()}`;
        this.state = {
          showErrorBubble: false,
          offset: ZERO_OFFSET
        };
        this.handleBrowserEvent = raf(() => {
          // only perform changes for the currently focused/active trigger
          if (this.state.showErrorBubble && this.isBubbleAttachedToTrigger()) {
            this.setBubblePosition();
          }
        });

        this.handleBubbleClose = event => {
          // only keep 1 listener at a time and always turn off this.state.showErrorBubble
          // on close
          const bubbleEl = CACHED_BUBBLE_ELEMENT$2;
          bubbleEl.removeEventListener('close', this.handleBubbleClose);

          if (event.detail.anchor === this._uniqueId) {
            this.hideBubble();

            if (event.detail.reason !== 'bubbleLoseFocus') {
              this.triggerElement.focus();
            }
          }
        };
      }

      connectedCallback() {
        // watch for resize & scroll events to recalculate when needed
        window.addEventListener('resize', this.handleBrowserEvent, false);
        window.addEventListener('scroll', this.handleBrowserEvent, true);
      }

      disconnectedCallback() {
        // remove event listeners
        window.removeEventListener('resize', this.handleBrowserEvent, false);
        window.removeEventListener('scroll', this.handleBrowserEvent, true);
        const bubbleEl = CACHED_BUBBLE_ELEMENT$2;
        bubbleEl.removeEventListener('close', this.handleBubbleClose);
      }

      get offset() {
        return this.state.offset;
      }

      set offset(value) {
        this.state.offset = _objectSpread({}, ZERO_OFFSET, value);
      }

      focus() {
        this.triggerElement.focus();
      }

      get computedButtonClass() {
        const classes = classSet('slds-button').add('slds-button_icon');
        classes.add({
          'slds-button_icon-error': this.variant === 'error'
        });
        return classes.toString();
      }

      get computedHeaderIconName() {
        switch (this.variant) {
          case 'error':
            return 'utility:ban';

          case 'warning':
            return 'utility:warning';

          case 'bare':
          default:
            return 'utility:info';
        }
      }

      get triggerElement() {
        return this.template.querySelector('[data-trigger="true"]');
      }

      handleMouseOver() {
        if (this.trigger === 'hover') {
          this.showBubble();
        }
      }

      handleMouseOut() {
        if (this.trigger === 'hover') {
          this.hideBubble();
          this.triggerElement.focus();
        }
      }

      handleClick(event) {
        event.preventDefault();

        if (this.trigger === 'click') {
          // since we share bubble element with other tooltip triggers,
          // we need to keep it open if bubble is not attached to the trigger
          if (this.state.showErrorBubble && this.isBubbleAttachedToTrigger()) {
            this.hideBubble();
          } else {
            this.showBubble();
          }
        }
      }

      showBubble() {
        this.state.showErrorBubble = true;
        const bubbleEl = CACHED_BUBBLE_ELEMENT$2;
        this.initBubble();
        this.setBubblePosition();
        bubbleEl.visible = true; // 100ms for bubble to fade in before becoming focusable
        // eslint-disable-next-line lwc/no-set-timeout

        setTimeout(() => {
          bubbleEl.focus();
        }, 100);
      }

      hideBubble() {
        this.state.showErrorBubble = false;
        const bubbleEl = CACHED_BUBBLE_ELEMENT$2;
        bubbleEl.visible = false; // 25ms for bubble to fade out before trigger becoming focusable
        // eslint-disable-next-line lwc/no-set-timeout

        setTimeout(() => {
          this.focus();
        }, 25);
      }

      isBubbleAttachedToTrigger() {
        return CACHED_BUBBLE_ELEMENT$2.anchor === this._uniqueId;
      }

      getTriggerBoundingRect() {
        return this.triggerElement ? this.triggerElement.getBoundingClientRect() : null;
      }

      calculateShiftAmounts() {
        // only calculate once
        if (typeof this.shiftAmounts === 'undefined') {
          const bubbleEl = CACHED_BUBBLE_ELEMENT$2; // initialize position in top left corner

          bubbleEl.style.top = 0;
          bubbleEl.style.left = 0;
          bubbleEl.style.bottom = null;
          bubbleEl.style.right = null; // calculate initial position of trigger element

          const triggerElRect = this.getTriggerBoundingRect(); // calculate shift to align nubbin

          const nubbinComputedStyles = window.getComputedStyle(bubbleEl, ':before') || bubbleEl.style;
          this.shiftAmounts = getNubbinShiftAmount$1(nubbinComputedStyles, triggerElRect.width);
        }
      }

      initBubble() {
        const bubbleEl = CACHED_BUBBLE_ELEMENT$2;
        bubbleEl.anchor = this._uniqueId;
        bubbleEl.content = this.content;
        bubbleEl.header = this.header;
        bubbleEl.variant = this.variant;
        bubbleEl.hideCloseButton = this.hideCloseButton;
        bubbleEl.addEventListener('close', this.handleBubbleClose);

        if (bubbleEl.parentNode === null) {
          document.body.appendChild(bubbleEl);
        }

        this.calculateShiftAmounts();
      }

      setBubblePosition() {
        const rootEl = document.documentElement;
        const bubbleEl = CACHED_BUBBLE_ELEMENT$2;
        const result = getBubbleAlignAndPosition$1(this.getTriggerBoundingRect(), bubbleEl.getBoundingClientRect(), DEFAULT_ANCHORING$1.bubble, this.shiftAmounts, rootEl.clientHeight || window.innerHeight, rootEl.clientWidth || window.innerWidth, window.pageXOffset + this.offset.horizontal, window.pageYOffset + this.offset.vertical);
        bubbleEl.align = result.align;
        bubbleEl.style.top = result.top;
        bubbleEl.style.right = result.right;
        bubbleEl.style.bottom = result.bottom;
        bubbleEl.style.left = result.left;
      }

    }

    lwc.registerDecorators(LightningPrimitiveDatatableTooltip, {
      publicProps: {
        header: {
          config: 0
        },
        content: {
          config: 0
        },
        size: {
          config: 0
        },
        trigger: {
          config: 0
        },
        hideCloseButton: {
          config: 0
        },
        variant: {
          config: 0
        },
        alternativeText: {
          config: 0
        },
        internalTabIndex: {
          config: 0
        },
        offset: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        state: 1
      }
    });

    var _lightningPrimitiveDatatableTooltip = lwc.registerComponent(LightningPrimitiveDatatableTooltip, {
      tmpl: _tmpl$z
    });

    function tmpl$$($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        h: api_element
      } = $api;
      return [api_custom_element("lightning-primitive-datatable-tooltip", _lightningPrimitiveDatatableTooltip, {
        className: $cmp.rowNumberErrorClass,
        attrs: {
          "data-navigation": "enable",
          "data-action-triggers": "enter,space"
        },
        props: {
          "size": "xx-small",
          "header": $cmp.typeAttribute0.title,
          "content": $cmp.typeAttribute0.messages,
          "variant": "error",
          "internalTabIndex": $cmp.internalTabIndex,
          "alternativeText": $cmp.typeAttribute0.alternativeText
        },
        key: 2
      }, []), api_element("span", {
        classMap: {
          "slds-row-number": true,
          "slds-text-body_small": true,
          "slds-text-color_weak": true
        },
        key: 3
      }, [])];
    }

    var rowNumber = lwc.registerTemplate(tmpl$$);
    tmpl$$.stylesheets = [];
    tmpl$$.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_rowNumber-host",
      shadowAttribute: "lightning-primitiveCellTypes_rowNumber"
    };

    function tmpl$10($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        k: api_key,
        h: api_element,
        i: api_iterator
      } = $api;
      return api_iterator($cmp.formattedParts, function (part) {
        return [part.isLink ? api_element("a", {
          attrs: {
            "target": "_blank",
            "href": part.href,
            "rel": "noopener"
          },
          key: api_key(4, part.value)
        }, [api_dynamic(part.value)]) : null, part.isText ? api_dynamic(part.value) : null, part.isNewline ? api_element("br", {
          key: api_key(7, part.value)
        }, []) : null];
      });
    }

    var _tmpl$B = lwc.registerTemplate(tmpl$10);
    tmpl$10.stylesheets = [];
    tmpl$10.stylesheetTokens = {
      hostAttribute: "lightning-formattedText_formattedText-host",
      shadowAttribute: "lightning-formattedText_formattedText"
    };

    /*
     * Regex was taken from aura lib and refactored
     */

    const linkRegex = new RegExp(`(${newLineRegexString})|${urlRegexString}|${emailRegexString}`, 'gi');
    const emailRegex = new RegExp(emailRegexString, 'gi');
    const newLineRegex = new RegExp(newLineRegexString, 'gi');

    function getTextPart(text) {
      return {
        isText: true,
        value: text
      };
    }

    function getUrlPart(url) {
      return {
        isLink: true,
        value: url,
        href: createHttpHref(url)
      };
    }

    function getEmailPart(email) {
      return {
        isLink: true,
        value: email,
        href: createEmailHref(email)
      };
    }

    function getNewlinePart() {
      return {
        isNewline: true
      };
    }

    function getLinkPart(link) {
      if (link.match(newLineRegex)) {
        return getNewlinePart();
      } else if (link.match(emailRegex)) {
        return getEmailPart(link);
      }

      return getUrlPart(link);
    }

    function parseToFormattedLinkifiedParts(text) {
      const parts = [];
      const re = linkRegex;
      let match;

      while ((match = re.exec(text)) !== null) {
        const indexOfMatch = text.indexOf(match[0]);
        let link = match[0];
        const endsWithQuote = link && link.endsWith('&quot'); // If we found an email or url match, then create a text part for everything
        // up to the match and then create the part for the email or url

        if (indexOfMatch > 0) {
          parts.push(getTextPart(text.slice(0, text.indexOf(match[0]))));
        }

        if (endsWithQuote) {
          link = link.slice(0, link.lastIndexOf('&quot'));
        }

        parts.push(getLinkPart(link));

        if (endsWithQuote) {
          parts.push(getTextPart('&quot'));
        }

        text = text.substring(re.lastIndex);
        re.lastIndex = 0;
      }

      if (text != null && text !== '') {
        parts.push(getTextPart(text));
      }

      return parts;
    }
    function parseToFormattedParts(text) {
      return text.split(newLineRegex).map((part, index) => {
        return index % 2 === 0 ? getTextPart(part) : getNewlinePart();
      });
    }

    /**
     * Displays text, replaces newlines with line breaks, and linkifies if requested.
     */

    class FormattedText extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.value = '';
        this._linkify = false;
      }

      /**
       * If present, URLs and email addresses are displayed in anchor tags.
       * They are displayed in plain text by default.
       * @type {boolean}
       * @default false
       */
      get linkify() {
        return this._linkify;
      }

      set linkify(value) {
        this._linkify = normalizeBoolean(value);
      }

      get formattedParts() {
        if (!this.value || typeof this.value !== 'string') {
          return [];
        }

        return this.linkify ? parseToFormattedLinkifiedParts(this.value) : parseToFormattedParts(this.value);
      }

    }

    lwc.registerDecorators(FormattedText, {
      publicProps: {
        value: {
          config: 0
        },
        linkify: {
          config: 3
        }
      },
      track: {
        _linkify: 1
      }
    });

    var _lightningFormattedText = lwc.registerComponent(FormattedText, {
      tmpl: _tmpl$B
    });

    function tmpl$11($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-text", _lightningFormattedText, {
        props: {
          "value": $cmp.value
        },
        key: 2
      }, [])];
    }

    var text = lwc.registerTemplate(tmpl$11);
    tmpl$11.stylesheets = [];
    tmpl$11.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_text-host",
      shadowAttribute: "lightning-primitiveCellTypes_text"
    };

    function tmpl$12($api, $cmp, $slotset, $ctx) {
      const {
        d: api_dynamic,
        ti: api_tab_index,
        b: api_bind,
        h: api_element
      } = $api;
      const {
        _m0
      } = $ctx;
      return [$cmp.hasValue ? api_element("a", {
        attrs: {
          "href": $cmp.computedUrl,
          "title": $cmp.tooltip,
          "target": $cmp.target,
          "tabindex": api_tab_index($cmp.tabIndex)
        },
        key: 3,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleClick))
        }
      }, [api_dynamic($cmp.computedLabel)]) : null];
    }

    var _tmpl$C = lwc.registerTemplate(tmpl$12);
    tmpl$12.stylesheets = [];
    tmpl$12.stylesheetTokens = {
      hostAttribute: "lightning-formattedUrl_formattedUrl-host",
      shadowAttribute: "lightning-formattedUrl_formattedUrl"
    };

    const GET_LINK_INFO_EVENT = 'lightningroutingservicegetlinkinfo';
    const urlTypes = {
      standard: 'standard_webPage'
    };
    /*
     * Mock getLinkInfo
     *
     * @returns {Promise[LinkInfo]}
     */

    function getLinkInfo(element, stateRef) {
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line lightning-global/no-custom-event-identifier-arguments
        const getLinkInfoEvent = new CustomEvent(GET_LINK_INFO_EVENT, {
          detail: {
            stateRef,
            callback: (err, linkInfo) => {
              if (err) {
                reject(err);
              } else {
                resolve(linkInfo);
              }
            }
          },
          bubbles: true,
          composed: true,
          cancelable: true
        });
        element.dispatchEvent(getLinkInfoEvent);
      });
    }
    /**
     * Determines the route for the given url and updates the element
     * state with the correct url and dispatcher.
     *
     * @param {HTMLElement} element Element from which to dispatch the routing event
     * @param {Object} url Link to route, target Target of the link
     * @param {function} callback on the returned LinkInfo
     *
     * @returns {Promise} Promise[LinkInfo]
     */

    function updateRawLinkInfo(element, {
      url,
      target
    }) {
      if (url === undefined || url === null) {
        // eslint-disable-next-line no-console
        console.error('url must be specified');
      }

      if (target === '_blank') {
        // Have a no-op dispatcher if target is blank
        return new Promise(resolve => {
          resolve({
            url,
            dispatcher: () => {}
          });
        });
      }

      return getLinkInfo(element, {
        stateType: urlTypes.standard,
        attributes: {
          url,
          target
        }
      });
    }

    /**
     * Displays a URL as a hyperlink.
     */

    class LightningFormattedUrl extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.target = void 0;
        this.tooltip = void 0;
        this.label = void 0;
        this.tabIndex = void 0;
        this._url = void 0;
        this._value = void 0;
        this._connected = false;

        this._dispatcher = () => {};
      }

      /**
       * The URL to format.
       * @type {string}
       *
       */
      get value() {
        return this._value;
      }

      set value(value) {
        this._value = value;

        if (this._connected) {
          this.updateLinkInfo(value);
        }
      }

      connectedCallback() {
        this._connected = true;
        this.updateLinkInfo(this.value);
      }

      disconnectedCallback() {
        this._connected = false;
      }
      /**
       * Sets focus on the element.
       */


      focus() {
        if (this.urlAnchor) {
          this.urlAnchor.focus();
        }
      }
      /**
       * Removes keyboard focus from the element.
       */


      blur() {
        if (this.urlAnchor) {
          this.urlAnchor.blur();
        }
      }

      get urlAnchor() {
        if (this._connected && this.hasValue) {
          return this.template.querySelector('a');
        }

        return undefined;
      }

      handleClick(event) {
        // For target blank, use the default browser behaviour (open in a new tab)
        if (this.target !== '_blank') {
          this._dispatcher(event);
        }
      }

      updateLinkInfo(url) {
        updateRawLinkInfo(this, {
          url: this.makeAbsoluteUrl(url),
          target: this.target
        }).then(linkInfo => {
          this._url = linkInfo.url;
          this._dispatcher = linkInfo.dispatcher;
        });
      }

      get computedLabel() {
        const {
          label,
          computedUrl
        } = this;
        return label != null && label !== '' ? label : computedUrl;
      }

      get computedUrl() {
        return this._url || this.makeAbsoluteUrl(this.value);
      }

      get hasValue() {
        const url = this.value;
        return url != null && url !== '';
      }

      makeAbsoluteUrl(url) {
        return isAbsoluteUrl(url) ? url : `http://${url}`;
      }

    }

    lwc.registerDecorators(LightningFormattedUrl, {
      publicProps: {
        target: {
          config: 0
        },
        tooltip: {
          config: 0
        },
        label: {
          config: 0
        },
        tabIndex: {
          config: 0
        },
        value: {
          config: 3
        }
      },
      publicMethods: ["focus", "blur"],
      track: {
        _url: 1,
        _value: 1
      }
    });

    var _lightningFormattedUrl = lwc.registerComponent(LightningFormattedUrl, {
      tmpl: _tmpl$C
    });

    function tmpl$13($api, $cmp, $slotset, $ctx) {
      const {
        ti: api_tab_index,
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-url", _lightningFormattedUrl, {
        attrs: {
          "data-navigation": "enable"
        },
        props: {
          "value": $cmp.value,
          "tooltip": $cmp.urlTooltip,
          "tabIndex": api_tab_index($cmp.internalTabIndex),
          "label": $cmp.typeAttribute0,
          "target": $cmp.urlTarget
        },
        key: 2
      }, [])];
    }

    var url = lwc.registerTemplate(tmpl$13);
    tmpl$13.stylesheets = [];
    tmpl$13.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_url-host",
      shadowAttribute: "lightning-primitiveCellTypes_url"
    };

    function tmpl$14($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        h: api_element
      } = $api;
      return [$cmp.isChecked ? api_element("temaplte", {
        key: 2
      }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "size": "x-small",
          "iconName": "utility:check"
        },
        key: 3
      }, [])]) : null];
    }

    var boolean = lwc.registerTemplate(tmpl$14);
    tmpl$14.stylesheets = [];
    tmpl$14.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_boolean-host",
      shadowAttribute: "lightning-primitiveCellTypes_boolean"
    };

    function tmpl$15($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-formatted-date-time", _lightningFormattedDateTime, {
        props: {
          "value": $cmp.value,
          "day": $cmp.computedDateLocalDay,
          "month": $cmp.computedDateLocalMonth,
          "year": $cmp.computedDateLocalYear,
          "timeZone": "UTC"
        },
        key: 2
      }, [])];
    }

    var dateLocal = lwc.registerTemplate(tmpl$15);
    tmpl$15.stylesheets = [];
    tmpl$15.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_dateLocal-host",
      shadowAttribute: "lightning-primitiveCellTypes_dateLocal"
    };

    function tmpl$16($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-primitive-cell-button", _lightningPrimitiveCellButton, {
        attrs: {
          "data-navigation": "enable",
          "data-action-triggers": "enter,space"
        },
        props: {
          "type": "button-icon",
          "rowKeyValue": $cmp.rowKeyValue,
          "colKeyValue": $cmp.colKeyValue,
          "variant": $cmp.typeAttribute0,
          "alternativeText": $cmp.typeAttribute1,
          "iconName": $cmp.typeAttribute2,
          "iconClass": $cmp.typeAttribute3,
          "disabled": $cmp.typeAttribute4,
          "buttonName": $cmp.typeAttribute5,
          "buttonClass": $cmp.typeAttribute6,
          "buttonTitle": $cmp.typeAttribute7,
          "internalTabIndex": $cmp.internalTabIndex
        },
        key: 2
      }, [])];
    }

    var buttonIcon = lwc.registerTemplate(tmpl$16);
    tmpl$16.stylesheets = [];
    tmpl$16.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellTypes_buttonIcon-host",
      shadowAttribute: "lightning-primitiveCellTypes_buttonIcon"
    };

    const typesMap = {
      action,
      button,
      currency,
      date,
      email,
      location,
      number,
      percent,
      phone,
      rowNumber,
      text,
      url,
      boolean,
      'date-local': dateLocal,
      'button-icon': buttonIcon
    };

    class PrimitiveTypes extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.types = void 0;
        this.columnType = void 0;
        this.value = void 0;
        this.columnLabel = void 0;
        this.rowKeyValue = void 0;
        this.colKeyValue = void 0;
        this.columnSubType = void 0;
        this.typeAttribute0 = void 0;
        this.typeAttribute1 = void 0;
        this.typeAttribute2 = void 0;
        this.typeAttribute3 = void 0;
        this.typeAttribute4 = void 0;
        this.typeAttribute5 = void 0;
        this.typeAttribute6 = void 0;
        this.typeAttribute7 = void 0;
        this.typeAttribute8 = void 0;
        this.typeAttribute9 = void 0;
        this.typeAttribute10 = void 0;
        this.typeAttribute21 = void 0;
        this.typeAttribute22 = void 0;
        this.internalTabIndex = void 0;
        this.keyboardMode = void 0;
      }

      get type() {
        const type = this.types.getType(this.columnType);

        if (type.type === 'custom') {
          return type.template;
        }

        if (this.columnType === 'tree' && typesMap[this.columnSubType]) {
          return typesMap[this.columnSubType];
        }

        if (typesMap[this.columnType]) {
          return typesMap[this.columnType];
        }

        return typesMap.text;
      }

      render() {
        return this.type;
      }

      get hasTreeData() {
        return this.columnType === 'tree';
      }

      get urlTarget() {
        return this.typeAttribute1 || '_blank';
      }

      get urlTooltip() {
        return this.typeAttribute2 || this.value;
      }

      get isChecked() {
        return !!this.value;
      }

      get typeAttributes() {
        const typeAttributes = this.types.getType(this.columnType).typeAttributes;

        if (Array.isArray(typeAttributes)) {
          return typeAttributes.reduce((seed, attrName, index) => {
            seed[attrName] = this[`typeAttribute${index}`];
            return seed;
          }, {});
        }

        return {};
      }

      get dateValue() {
        // new Date(null) returns new Date(0), which is not expected.
        // for undefined, '', or any other invalid values, formatted-date-time
        // just displays ''
        if (this.value === null) {
          return '';
        } // this is temporary, formatted-date-time should accept
        // date time string formats like '2017-03-01 08:45:12Z'
        // it's accepting only timestamp and Date objects


        return new Date(this.value);
      }

      get computedDateLocalDay() {
        return this.typeAttribute0 || 'numeric';
      }

      get computedDateLocalMonth() {
        return this.typeAttribute1 || 'short';
      }

      get computedDateLocalYear() {
        return this.typeAttribute2 || 'numeric';
      }

      get rowNumberErrorClass() {
        const classes = classSet('slds-m-horizontal_xxx-small');
        const error = this.typeAttribute0;

        if (error) {
          classes.add({
            'slds-hidden': !error.title && !error.messages
          });
        }

        return classes.toString();
      }

      getActionableElements() {
        return queryFocusable(this.template);
      }

    }

    lwc.registerDecorators(PrimitiveTypes, {
      publicProps: {
        types: {
          config: 0
        },
        columnType: {
          config: 0
        },
        value: {
          config: 0
        },
        columnLabel: {
          config: 0
        },
        rowKeyValue: {
          config: 0
        },
        colKeyValue: {
          config: 0
        },
        columnSubType: {
          config: 0
        },
        typeAttribute0: {
          config: 0
        },
        typeAttribute1: {
          config: 0
        },
        typeAttribute2: {
          config: 0
        },
        typeAttribute3: {
          config: 0
        },
        typeAttribute4: {
          config: 0
        },
        typeAttribute5: {
          config: 0
        },
        typeAttribute6: {
          config: 0
        },
        typeAttribute7: {
          config: 0
        },
        typeAttribute8: {
          config: 0
        },
        typeAttribute9: {
          config: 0
        },
        typeAttribute10: {
          config: 0
        },
        typeAttribute21: {
          config: 0
        },
        typeAttribute22: {
          config: 0
        },
        internalTabIndex: {
          config: 0
        },
        keyboardMode: {
          config: 0
        }
      },
      publicMethods: ["getActionableElements"]
    });

    var _lightningPrimitiveCellTypes = lwc.registerComponent(PrimitiveTypes, {
      tmpl: _tmpl$1
    });

    function tmpl$17($api, $cmp, $slotset, $ctx) {
      const {
        b: api_bind,
        c: api_custom_element
      } = $api;
      const {
        _m0
      } = $ctx;
      return [api_custom_element("lightning-button-icon", _lightningButtonIcon, {
        className: $cmp.computedButtonClass,
        props: {
          "iconName": "utility:chevronright",
          "variant": "bare",
          "size": "small",
          "title": $cmp.buttonTitle,
          "alternativeText": $cmp.buttonTitle,
          "tabIndex": "-1",
          "ariaHidden": "true"
        },
        key: 2,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleChevronClick))
        }
      }, [])];
    }

    var _tmpl$D = lwc.registerTemplate(tmpl$17);
    tmpl$17.stylesheets = [];
    tmpl$17.stylesheetTokens = {
      hostAttribute: "lightning-primitiveTreegridCellToggle_primitiveTreegridCellToggle-host",
      shadowAttribute: "lightning-primitiveTreegridCellToggle_primitiveTreegridCellToggle"
    };

    var labelCollapseBranch = 'Collapse {0}';

    var labelExpandBranch = 'Expand {0}';

    const i18n$j = {
      collapseBranch: labelCollapseBranch,
      expandBranch: labelExpandBranch
    };

    class PrivateTreeGridCellToggle extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.rowKeyValue = void 0;
        this.colKeyValue = void 0;
        this.value = void 0;
        this.state = {
          expanded: false,
          hasChildren: false
        };
      }

      get computedButtonClass() {
        return classSet('slds-m-right_x-small').add({
          'slds-is-disabled': !this.hasChildren
        }).toString();
      }

      get hasChildren() {
        return this.state.hasChildren;
      }

      set hasChildren(value) {
        this.state.hasChildren = normalizeBoolean(value);
      }

      get isExpanded() {
        return this.state.expanded;
      }

      set isExpanded(value) {
        this.state.expanded = normalizeBoolean(value);
      }

      get buttonTitle() {
        if (this.isExpanded) {
          return this.formatString(i18n$j.collapseBranch, this.value);
        }

        return this.formatString(i18n$j.expandBranch, this.value);
      }

      formatString(str, ...args) {
        if (str) {
          return str.replace(/{(\d+)}/g, (match, i) => {
            return typeof args[i] !== 'undefined' ? args[i] : match;
          });
        }

        return '';
      }

      handleChevronClick() {
        const customEvent = new CustomEvent('privatetogglecell', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            name: this.rowKeyValue,
            nextState: this.isExpanded ? false : true // True = expanded, False = collapsed

          }
        });
        this.dispatchEvent(customEvent);
      }

    }

    lwc.registerDecorators(PrivateTreeGridCellToggle, {
      publicProps: {
        rowKeyValue: {
          config: 0
        },
        colKeyValue: {
          config: 0
        },
        value: {
          config: 0
        },
        hasChildren: {
          config: 3
        },
        isExpanded: {
          config: 3
        }
      },
      track: {
        state: 1
      }
    });

    var _lightningPrimitiveTreegridCellToggle = lwc.registerComponent(PrivateTreeGridCellToggle, {
      tmpl: _tmpl$D
    });

    function tmpl$18($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        d: api_dynamic,
        h: api_element,
        ti: api_tab_index
      } = $api;
      return [api_element("button", {
        classMap: {
          "slds-button": true,
          "slds-button_icon": true,
          "slds-cell-edit__button": true,
          "slds-m-left_x-small": true
        },
        attrs: {
          "tabindex": api_tab_index($cmp.tabIndex)
        },
        key: 2
      }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": "utility:edit",
          "size": "xx-small",
          "svgClass": "slds-button__icon slds-button__icon_hint slds-button__icon_lock slds-button__icon_small slds-button__icon_edit"
        },
        key: 3
      }, []), api_element("span", {
        classMap: {
          "slds-assistive-text": true
        },
        key: 4
      }, [api_dynamic($cmp.assistiveText)])])];
    }

    var _tmpl$E = lwc.registerTemplate(tmpl$18);
    tmpl$18.stylesheets = [];
    tmpl$18.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellEditableButton_primitiveCellEditableButton-host",
      shadowAttribute: "lightning-primitiveCellEditableButton_primitiveCellEditableButton"
    };

    var labelEdit = 'Edit';

    var labelEditHasError = 'has error';

    const i18n$k = {
      edit: labelEdit,
      editHasError: labelEditHasError
    };

    class PrivateCellEditableButton extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.columnLabel = void 0;
        this.hasError = void 0;
        this._htmlButton = null;
      }

      focus() {
        if (this.htmlButton) {
          this.htmlButton.focus();
        }
      }

      click() {
        if (this.htmlButton) {
          this.htmlButton.click();
        }
      }

      get tabIndex() {
        return this.getAttribute('tabindex');
      }

      set tabIndex(value) {
        this.setAttribute('tabindex', value);
      }

      get htmlButton() {
        if (!this._htmlButton) {
          this._htmlButton = this.template.querySelector('button');
        }

        return this._htmlButton;
      }

      disconnectedCallback() {
        this._htmlButton = null;
      }

      get assistiveText() {
        const suffix = this.hasError ? ` ${i18n$k.editHasError}` : '';
        return `${i18n$k.edit} ${this.columnLabel}${suffix}`;
      }

    }

    lwc.registerDecorators(PrivateCellEditableButton, {
      publicProps: {
        columnLabel: {
          config: 0
        },
        hasError: {
          config: 0
        },
        tabIndex: {
          config: 3
        }
      },
      publicMethods: ["focus", "click"]
    });

    var _lightningPrimitiveCellEditableButton = lwc.registerComponent(PrivateCellEditableButton, {
      tmpl: _tmpl$E
    });

    function tmpl$19($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        t: api_text,
        d: api_dynamic,
        s: api_slot,
        h: api_element,
        ti: api_tab_index,
        b: api_bind
      } = $api;
      const {
        _m0
      } = $ctx;
      return [api_element("div", {
        className: $cmp.computedCellDivClass,
        key: 2
      }, [$cmp.hasLeftIcon ? api_custom_element("lightning-icon", _lightningIcon, {
        props: {
          "iconName": $cmp.iconName,
          "size": "x-small",
          "alternativeText": $cmp.iconAlternativeText
        },
        key: 4
      }, []) : null, $cmp.hasLeftIcon ? api_text("\xA0 ") : null, $cmp.hasLeftIcon ? api_dynamic($cmp.iconLabel) : null, $cmp.hasLeftIcon ? api_text(" \xA0") : null, $cmp.hasTreeData ? api_custom_element("lightning-primitive-treegrid-cell-toggle", _lightningPrimitiveTreegridCellToggle, {
        props: {
          "rowKeyValue": $cmp.rowKeyValue,
          "colKeyValue": $cmp.colKeyValue,
          "value": $cmp.value,
          "hasChildren": $cmp.hasChildren,
          "isExpanded": $cmp.isExpanded
        },
        key: 6
      }, []) : null, api_slot("", {
        key: 7
      }, [], $slotset), $cmp.hasRightIcon ? api_text("\xA0") : null, $cmp.hasRightIcon ? api_custom_element("lightning-icon", _lightningIcon, {
        props: {
          "iconName": $cmp.iconName,
          "size": "x-small",
          "alternativeText": $cmp.iconAlternativeText
        },
        key: 9
      }, []) : null, $cmp.hasRightIcon ? api_text("\xA0 ") : null, $cmp.hasRightIcon ? api_dynamic($cmp.iconLabel) : null]), $cmp.editable ? api_custom_element("lightning-primitive-cell-editable-button", _lightningPrimitiveCellEditableButton, {
        attrs: {
          "data-navigation": "enable",
          "data-action-triggers": "enter,space",
          "data-action-edit": "true"
        },
        props: {
          "columnLabel": $cmp.columnLabel,
          "hasError": $cmp.hasError,
          "tabIndex": api_tab_index($cmp.internalTabIndex)
        },
        key: 11,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleEditButtonClick))
        }
      }, []) : null];
    }

    var _tmpl$F = lwc.registerTemplate(tmpl$19);
    tmpl$19.slots = [""];
    tmpl$19.stylesheets = [];
    tmpl$19.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellWrapper_primitiveCellWrapper-host",
      shadowAttribute: "lightning-primitiveCellWrapper_primitiveCellWrapper"
    };

    class PrimitiveCellWrapper extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.iconName = void 0;
        this.iconPosition = void 0;
        this.iconAlternativeText = void 0;
        this.isAction = false;
        this.wrapText = void 0;
        this.iconLabel = void 0;
        this.editable = false;
        this.hasError = false;
        this.type = 'text';
        this.rowKeyValue = void 0;
        this.colKeyValue = void 0;
        this.hasTreeData = false;
        this.value = void 0;
        this.hasChildren = void 0;
        this.isExpanded = void 0;
        this.columnLabel = void 0;
        this.internalTabIndex = void 0;
      }

      get hasLeftIcon() {
        return !this.hasTreeData && this.iconName && (!this.iconPosition || this.iconPosition === 'left');
      }

      get hasRightIcon() {
        return this.iconName && this.iconPosition === 'right';
      }

      get computedCellDivClass() {
        return classSet().add({
          'slds-truncate': !this.isAction && this.type !== 'button-icon' && !this.wrapText
        }).add({
          'slds-hyphenate': this.wrapText
        }).toString();
      } // Inline edit button


      handleEditButtonClick() {
        // this event does not bubble, it is not composed
        const event = new CustomEvent('edit');
        this.dispatchEvent(event);
      }

      getActionableElements() {
        return Array.prototype.slice.call(this.template.querySelectorAll('[data-navigation="enable"]'));
      }

    }

    lwc.registerDecorators(PrimitiveCellWrapper, {
      publicProps: {
        iconName: {
          config: 0
        },
        iconPosition: {
          config: 0
        },
        iconAlternativeText: {
          config: 0
        },
        isAction: {
          config: 0
        },
        wrapText: {
          config: 0
        },
        iconLabel: {
          config: 0
        },
        editable: {
          config: 0
        },
        hasError: {
          config: 0
        },
        type: {
          config: 0
        },
        rowKeyValue: {
          config: 0
        },
        colKeyValue: {
          config: 0
        },
        hasTreeData: {
          config: 0
        },
        value: {
          config: 0
        },
        hasChildren: {
          config: 0
        },
        isExpanded: {
          config: 0
        },
        columnLabel: {
          config: 0
        },
        internalTabIndex: {
          config: 0
        }
      },
      publicMethods: ["getActionableElements"]
    });

    var _lightningPrimitiveCellWrapper = lwc.registerComponent(PrimitiveCellWrapper, {
      tmpl: _tmpl$F
    });

    function tmpl$1a($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        h: api_element,
        b: api_bind
      } = $api;
      const {
        _m0
      } = $ctx;
      return [$cmp.isRowNumber ? api_element("div", {
        classMap: {
          "slds-truncate": true
        },
        key: 3
      }, [api_custom_element("lightning-primitive-cell-types", _lightningPrimitiveCellTypes, {
        props: {
          "types": $cmp.types,
          "keyboardMode": $cmp.keyboardMode,
          "columnType": "rowNumber",
          "internalTabIndex": $cmp.state.internalTabIndex,
          "rowKeyValue": $cmp.rowKeyValue,
          "colKeyValue": $cmp.colKeyValue,
          "typeAttribute0": $cmp.typeAttribute0
        },
        key: 4
      }, [])]) : null, !$cmp.isRowNumber ? !$cmp.isCustomType ? api_custom_element("lightning-primitive-cell-wrapper", _lightningPrimitiveCellWrapper, {
        className: $cmp.computedWrapperClass,
        props: {
          "editable": $cmp.editable,
          "hasError": $cmp.hasError,
          "iconName": $cmp.iconName,
          "iconPosition": $cmp.iconPosition,
          "iconLabel": $cmp.iconLabel,
          "iconAlternativeText": $cmp.iconAlternativeText,
          "isAction": $cmp.isAction,
          "type": $cmp.columnType,
          "wrapText": $cmp.wrapText,
          "hasTreeData": $cmp.hasTreeData,
          "rowKeyValue": $cmp.rowKeyValue,
          "colKeyValue": $cmp.colKeyValue,
          "columnLabel": $cmp.columnLabel,
          "value": $cmp.value,
          "internalTabIndex": $cmp.state.internalTabIndex,
          "hasChildren": $cmp.typeAttribute21,
          "isExpanded": $cmp.typeAttribute22
        },
        key: 7,
        on: {
          "edit": _m0 || ($ctx._m0 = api_bind($cmp.handleEditButtonClick))
        }
      }, [api_custom_element("lightning-primitive-cell-types", _lightningPrimitiveCellTypes, {
        props: {
          "types": $cmp.types,
          "keyboardMode": $cmp.keyboardMode,
          "columnType": $cmp.columnType,
          "columnSubType": $cmp.columnSubType,
          "value": $cmp.value,
          "internalTabIndex": $cmp.state.internalTabIndex,
          "rowKeyValue": $cmp.rowKeyValue,
          "colKeyValue": $cmp.colKeyValue,
          "typeAttribute0": $cmp.typeAttribute0,
          "typeAttribute1": $cmp.typeAttribute1,
          "typeAttribute2": $cmp.typeAttribute2,
          "typeAttribute3": $cmp.typeAttribute3,
          "typeAttribute4": $cmp.typeAttribute4,
          "typeAttribute5": $cmp.typeAttribute5,
          "typeAttribute6": $cmp.typeAttribute6,
          "typeAttribute7": $cmp.typeAttribute7,
          "typeAttribute8": $cmp.typeAttribute8,
          "typeAttribute9": $cmp.typeAttribute9,
          "typeAttribute10": $cmp.typeAttribute10,
          "typeAttribute21": $cmp.typeAttribute21,
          "typeAttribute22": $cmp.typeAttribute22
        },
        key: 8
      }, [])]) : null : null, !$cmp.isRowNumber ? $cmp.isCustomType ? api_element("div", {
        classMap: {
          "slds-truncate": true
        },
        key: 10
      }, [api_custom_element("lightning-primitive-cell-types", _lightningPrimitiveCellTypes, {
        props: {
          "types": $cmp.types,
          "keyboardMode": $cmp.keyboardMode,
          "columnType": $cmp.columnType,
          "columnSubType": $cmp.columnSubType,
          "value": $cmp.value,
          "internalTabIndex": $cmp.state.internalTabIndex,
          "rowKeyValue": $cmp.rowKeyValue,
          "colKeyValue": $cmp.colKeyValue,
          "typeAttribute0": $cmp.typeAttribute0,
          "typeAttribute1": $cmp.typeAttribute1,
          "typeAttribute2": $cmp.typeAttribute2,
          "typeAttribute3": $cmp.typeAttribute3,
          "typeAttribute4": $cmp.typeAttribute4,
          "typeAttribute5": $cmp.typeAttribute5,
          "typeAttribute6": $cmp.typeAttribute6,
          "typeAttribute7": $cmp.typeAttribute7,
          "typeAttribute8": $cmp.typeAttribute8,
          "typeAttribute9": $cmp.typeAttribute9,
          "typeAttribute10": $cmp.typeAttribute10,
          "typeAttribute21": $cmp.typeAttribute21,
          "typeAttribute22": $cmp.typeAttribute22
        },
        key: 11
      }, [])]) : null : null];
    }

    var _tmpl$G = lwc.registerTemplate(tmpl$1a);
    tmpl$1a.stylesheets = [];
    tmpl$1a.stylesheetTokens = {
      hostAttribute: "lightning-primitiveCellFactory_primitiveCellFactory-host",
      shadowAttribute: "lightning-primitiveCellFactory_primitiveCellFactory"
    };

    function isNumberedBasedType(cellType) {
      return cellType === 'currency' || cellType === 'number' || cellType === 'percent';
    }

    function isTypeCenteredByDefault(cellType) {
      return cellType === 'button-icon';
    }

    class PrivateCellFactory extends PrimitiveDatatableCell$1 {
      constructor(...args) {
        super(...args);
        this.types = void 0;
        this.alignment = void 0;
        this.value = void 0;
        this.iconName = void 0;
        this.iconLabel = void 0;
        this.iconPosition = void 0;
        this.iconAlternativeText = void 0;
        this.editable = void 0;
        this.hasError = void 0;
        this.columnLabel = void 0;
        this.columnSubType = void 0;
        this.typeAttribute0 = void 0;
        this.typeAttribute1 = void 0;
        this.typeAttribute2 = void 0;
        this.typeAttribute3 = void 0;
        this.typeAttribute4 = void 0;
        this.typeAttribute5 = void 0;
        this.typeAttribute6 = void 0;
        this.typeAttribute7 = void 0;
        this.typeAttribute8 = void 0;
        this.typeAttribute9 = void 0;
        this.typeAttribute10 = void 0;
        this.typeAttribute21 = void 0;
        this.typeAttribute22 = void 0;
      }

      get wrapText() {
        return this.state.wrapText;
      }

      set wrapText(value) {
        if (value) {
          this.classList.add('slds-cell-wrap');
        } else {
          this.classList.remove('slds-cell-wrap');
        }

        this.state.wrapText = value;
      }

      get columnType() {
        return this.state.columnType;
      }

      set columnType(value) {
        if (value === 'tree') {
          this.classList.add('slds-no-space');
        }

        this.state.columnType = value;
      }

      get computedWrapperClass() {
        const alignment = this.computedAlignment;
        return classSet('slds-grid').add({
          'slds-no-space': this.hasTreeData,
          'slds-align_absolute-center': this.isAction,
          'slds-grid_align-end': alignment === 'right',
          'slds-grid_align-center': alignment === 'center',
          'slds-grid_align-spread': this.isSpreadAlignment
        }).toString();
      }

      get hasTreeData() {
        return this.columnType === 'tree';
      }

      get isAction() {
        return this.columnType === 'action';
      }

      get isCustomType() {
        return this.types.getType(this.columnType).type === 'custom';
      }

      render() {
        return _tmpl$G;
      } // Inline edit button


      handleEditButtonClick() {
        const {
          rowKeyValue,
          colKeyValue
        } = this;
        const event = new CustomEvent('privateeditcell', {
          bubbles: true,
          composed: true,
          detail: {
            rowKeyValue,
            colKeyValue
          }
        });
        this.dispatchEvent(event);
      }
      /**
       * Overridden click handler from the datatable-cell.
       *
       */


      handleClick() {
        if (!this.classList.contains('slds-has-focus')) {
          this.addFocusStyles();
          this.fireCellFocusByClickEvent();
        }
      }

      getActionableElements() {
        const wrapper = this.template.querySelector('lightning-primitive-cell-wrapper');
        const types = this.template.querySelector('lightning-primitive-cell-types');
        const result = [];
        const typeActionableElements = types.getActionableElements();
        typeActionableElements.forEach(elem => result.push(elem));

        if (wrapper) {
          const wrapperActionableElements = wrapper.getActionableElements();
          wrapperActionableElements.forEach(elem => result.push(elem));
        }

        return result;
      }

      get isSpreadAlignment() {
        const alignment = this.computedAlignment;
        return !alignment || alignment === 'left' || alignment !== 'center' && alignment !== 'right';
      }
      /**
       * Note: this should be passed from above, but we dont have a defined architecture that lets customize / provide defaults
       * on cell attributes per type.
       */


      get computedAlignment() {
        if (!this.alignment && isNumberedBasedType(this.columnType)) {
          return 'right';
        }

        if (!this.alignment && isTypeCenteredByDefault(this.columnType)) {
          return 'center';
        }

        return this.alignment;
      }

      get isRowNumber() {
        return this.columnType === 'rowNumber';
      }

    }

    lwc.registerDecorators(PrivateCellFactory, {
      publicProps: {
        types: {
          config: 0
        },
        alignment: {
          config: 0
        },
        value: {
          config: 0
        },
        iconName: {
          config: 0
        },
        iconLabel: {
          config: 0
        },
        iconPosition: {
          config: 0
        },
        iconAlternativeText: {
          config: 0
        },
        editable: {
          config: 0
        },
        hasError: {
          config: 0
        },
        columnLabel: {
          config: 0
        },
        columnSubType: {
          config: 0
        },
        typeAttribute0: {
          config: 0
        },
        typeAttribute1: {
          config: 0
        },
        typeAttribute2: {
          config: 0
        },
        typeAttribute3: {
          config: 0
        },
        typeAttribute4: {
          config: 0
        },
        typeAttribute5: {
          config: 0
        },
        typeAttribute6: {
          config: 0
        },
        typeAttribute7: {
          config: 0
        },
        typeAttribute8: {
          config: 0
        },
        typeAttribute9: {
          config: 0
        },
        typeAttribute10: {
          config: 0
        },
        typeAttribute21: {
          config: 0
        },
        typeAttribute22: {
          config: 0
        },
        wrapText: {
          config: 3
        },
        columnType: {
          config: 3
        }
      }
    });

    var _lightningPrimitiveCellFactory = lwc.registerComponent(PrivateCellFactory, {
      tmpl: _tmpl$G
    });

    function tmpl$1b($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-spinner", _lightningSpinner, {
        styleMap: {
          "height": "40px"
        },
        props: {
          "variant": "brand",
          "alternativeText": $cmp.i18n.loading
        },
        key: 2
      }, [])];
    }

    var _tmpl$H = lwc.registerTemplate(tmpl$1b);
    tmpl$1b.stylesheets = [];
    tmpl$1b.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableLoadingIndicator_primitiveDatatableLoadingIndicator-host",
      shadowAttribute: "lightning-primitiveDatatableLoadingIndicator_primitiveDatatableLoadingIndicator"
    };

    var labelLoading$1 = 'Loading';

    const i18n$l = {
      loading: labelLoading$1
    };

    class LightningPrimitiveDatatableLoadingIndicator extends lwc.LightningElement {
      get i18n() {
        return i18n$l;
      }

    }

    var _lightningPrimitiveDatatableLoadingIndicator = lwc.registerComponent(LightningPrimitiveDatatableLoadingIndicator, {
      tmpl: _tmpl$H
    });

    function tmpl$1c($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        d: api_dynamic,
        b: api_bind,
        h: api_element
      } = $api;
      const {
        _m0,
        _m1
      } = $ctx;
      return [api_element("div", {
        classMap: {
          "slds-docked-form-footer": true,
          "slds-is-absolute": true
        },
        key: 2
      }, [api_element("div", {
        classMap: {
          "slds-grid": true,
          "slds-grid_align-center": true
        },
        key: 3
      }, [$cmp.showError ? api_custom_element("lightning-primitive-datatable-tooltip", _lightningPrimitiveDatatableTooltip, {
        classMap: {
          "slds-button": true
        },
        props: {
          "size": "small",
          "variant": "error",
          "header": $cmp.error.title,
          "content": $cmp.error.messages,
          "alternativeText": $cmp.i18n.error,
          "offset": $cmp.bubbleOffset
        },
        key: 5
      }, []) : null, api_element("button", {
        classMap: {
          "slds-button": true,
          "slds-button_neutral": true
        },
        attrs: {
          "type": "button"
        },
        key: 6,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleCancelButtonClick))
        }
      }, [api_dynamic($cmp.i18n.cancel)]), api_element("button", {
        classMap: {
          "slds-button": true,
          "slds-button_brand": true,
          "save-btn": true
        },
        attrs: {
          "type": "button"
        },
        key: 7,
        on: {
          "click": _m1 || ($ctx._m1 = api_bind($cmp.handleSaveButtonClick))
        }
      }, [api_dynamic($cmp.i18n.save)])])])];
    }

    var _tmpl$I = lwc.registerTemplate(tmpl$1c);
    tmpl$1c.stylesheets = [];
    tmpl$1c.stylesheetTokens = {
      hostAttribute: "lightning-primitiveDatatableStatusBar_primitiveDatatableStatusBar-host",
      shadowAttribute: "lightning-primitiveDatatableStatusBar_primitiveDatatableStatusBar"
    };

    var labelSave = 'Save';

    var labelError = 'Fix the errors and try saving again';

    const i18n$m = {
      save: labelSave,
      cancel: labelCancel,
      error: labelError
    };

    class LightningPrimitiveDatatableStatusBar extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.privateError = {};
      }

      get error() {
        return this.privateError;
      }

      set error(value) {
        this.privateError = value;

        if (this.showError && this.isSaveBtnFocused()) {
          this.focusOnErrorMessages();
        }
      }

      get i18n() {
        return i18n$m;
      }

      get showError() {
        const {
          error
        } = this;
        return error && (error.title || error.messages);
      }

      get bubbleOffset() {
        // move bubble above the docked bar since docked bar has higher z-index
        // and can block the nubbin of the bubble
        return {
          vertical: -10
        };
      }

      handleCancelButtonClick(event) {
        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('privatecancel', {
          bubbles: true,
          composed: true,
          cancelable: true
        }));
      }

      handleSaveButtonClick(event) {
        event.preventDefault();
        event.stopPropagation(); // safari and firefox does not focus on click.

        if (document.activeElement !== event.target) {
          event.target.focus();
        }

        this.dispatchEvent(new CustomEvent('privatesave', {
          bubbles: true,
          composed: true,
          cancelable: true
        }));
      }

      isSaveBtnFocused() {
        return this.template.querySelector('button.save-btn:focus') !== null;
      }

      focusOnErrorMessages() {
        Promise.resolve().then(() => {
          const trigger = this.template.querySelector('lightning-primitive-datatable-tooltip');

          if (trigger) {
            trigger.focus();
          }
        });
      }

    }

    lwc.registerDecorators(LightningPrimitiveDatatableStatusBar, {
      publicProps: {
        error: {
          config: 3
        }
      },
      track: {
        privateError: 1
      }
    });

    var _lightningPrimitiveDatatableStatusBar = lwc.registerComponent(LightningPrimitiveDatatableStatusBar, {
      tmpl: _tmpl$I
    });

    function tmpl$1d($api, $cmp, $slotset, $ctx) {
      const {
        h: api_element,
        b: api_bind,
        c: api_custom_element,
        ti: api_tab_index,
        k: api_key,
        i: api_iterator,
        f: api_flatten
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
        _m11
      } = $ctx;
      return [api_element("div", {
        classMap: {
          "dt-width-observer": true
        },
        styleMap: {
          "width": "100%",
          "height": "0px"
        },
        context: {
          lwc: {
            dom: "manual"
          }
        },
        key: 2
      }, []), api_element("div", {
        styleMap: {
          "height": "100%",
          "position": "relative"
        },
        key: 3
      }, [api_custom_element("lightning-primitive-datatable-iedit-panel", _lightningPrimitiveDatatableIeditPanel, {
        attrs: {
          "data-iedit-panel": "true"
        },
        props: {
          "visible": $cmp.state.inlineEdit.isPanelVisible,
          "rowKeyValue": $cmp.state.inlineEdit.rowKeyValue,
          "colKeyValue": $cmp.state.inlineEdit.colKeyValue,
          "editedValue": $cmp.state.inlineEdit.editedValue,
          "columnDef": $cmp.state.inlineEdit.columnDef,
          "isMassEditEnabled": $cmp.state.inlineEdit.massEditEnabled,
          "numberOfSelectedRows": $cmp.state.inlineEdit.massEditSelectedRows
        },
        key: 4,
        on: {
          "ieditfinished": _m0 || ($ctx._m0 = api_bind($cmp.handleInlineEditFinish)),
          "masscheckboxchange": _m1 || ($ctx._m1 = api_bind($cmp.handleMassCheckboxChange))
        }
      }, []), api_element("div", {
        classMap: {
          "slds-table_header-fixed_container": true,
          "slds-scrollable_x": true
        },
        style: $cmp.scrollerXStyles,
        key: 5,
        on: {
          "scroll": _m9 || ($ctx._m9 = api_bind($cmp.handleHorizontalScroll))
        }
      }, [api_element("div", {
        classMap: {
          "slds-scrollable_y": true
        },
        style: $cmp.computedScrollerStyle,
        key: 6,
        on: {
          "scroll": _m8 || ($ctx._m8 = api_bind($cmp.handleVerticalScroll))
        }
      }, [api_element("div", {
        key: 7
      }, [api_element("table", {
        className: $cmp.computedTableClass,
        style: $cmp.computedTableStyle,
        attrs: {
          "role": $cmp.computedTableRole,
          "tabindex": api_tab_index($cmp.state.tabindex)
        },
        key: 8,
        on: {
          "focus": _m3 || ($ctx._m3 = api_bind($cmp.handleTableFocus)),
          "keydown": _m4 || ($ctx._m4 = api_bind($cmp.handleTableKeydown)),
          "click": _m5 || ($ctx._m5 = api_bind($cmp.handleCellClick)),
          "focusin": _m6 || ($ctx._m6 = api_bind($cmp.handleTableFocusIn)),
          "focusout": _m7 || ($ctx._m7 = api_bind($cmp.handleTableFocusOut))
        }
      }, [$cmp.hasValidKeyField ? api_element("thead", {
        className: $cmp.computedTableHeaderClass,
        key: 11
      }, [api_element("tr", {
        classMap: {
          "slds-line-height_reset": true
        },
        key: 12
      }, api_iterator($cmp.state.columns, function (def, colIndex) {
        return api_element("th", {
          style: def.style,
          attrs: {
            "scope": "col",
            "tabindex": api_tab_index(def.tabIndex),
            "aria-label": def.ariaLabel,
            "aria-sort": def.sortAriaLabel
          },
          key: api_key(14, def.colKeyValue)
        }, [def.fixedWidth ? api_custom_element("lightning-primitive-header-factory", _lightningPrimitiveHeaderFactory, {
          style: def.style,
          props: {
            "def": def,
            "dtContextId": $cmp.privateDatatableId,
            "rowKeyValue": "HEADER",
            "colKeyValue": def.colKeyValue,
            "tabIndex": api_tab_index(def.tabIndex),
            "hasFocus": def.hasFocus,
            "columnWidth": def.columnWidth,
            "colIndex": colIndex,
            "showCheckbox": $cmp.showSelectAllCheckbox,
            "actions": def.actions
          },
          key: api_key(16, def.colKeyValue)
        }, []) : null, !def.fixedWidth ? api_custom_element("lightning-primitive-header-factory", _lightningPrimitiveHeaderFactory, {
          style: def.style,
          props: {
            "def": def,
            "dtContextId": $cmp.privateDatatableId,
            "rowKeyValue": "HEADER",
            "colKeyValue": def.colKeyValue,
            "colIndex": colIndex,
            "resizable": $cmp.hasResizebleColumns,
            "sortable": def.sortable,
            "sorted": def.sorted,
            "sortedDirection": def.sortedDirection,
            "tabIndex": api_tab_index(def.tabIndex),
            "hasFocus": def.hasFocus,
            "columnWidth": def.columnWidth,
            "resizestep": $cmp.state.resizeStep,
            "actions": def.actions
          },
          key: api_key(18, def.colKeyValue)
        }, []) : null]);
      }))]) : null, $cmp.hasValidKeyField ? api_element("tbody", {
        style: $cmp.computedTbodyStyle,
        key: 19
      }, api_flatten([api_iterator($cmp.state.rows, function (row, rowIndex) {
        return api_element("tr", {
          className: row.classnames,
          attrs: {
            "data-row-key-value": row.key,
            "aria-selected": row.ariaSelected,
            "aria-level": row.level,
            "aria-expanded": row.isExpanded,
            "aria-setsize": row.setSize,
            "aria-posinset": row.posInSet,
            "tabindex": api_tab_index(row.tabIndex)
          },
          key: api_key(21, row.key),
          on: {
            "keydown": _m2 || ($ctx._m2 = api_bind($cmp.handleTrRowKeyDown))
          }
        }, api_iterator(row.cells, function (cell) {
          return [cell.isCheckbox ? api_element("td", {
            className: cell.class,
            attrs: {
              "role": "gridcell",
              "tabindex": api_tab_index(cell.tabIndex),
              "data-label": cell.dataLabel
            },
            key: api_key(24, cell.colKeyValue)
          }, [api_custom_element("lightning-primitive-cell-checkbox", _lightningPrimitiveCellCheckbox, {
            attrs: {
              "data-label": cell.dataLabel
            },
            props: {
              "dtContextId": $cmp.privateDatatableId,
              "hasFocus": cell.hasFocus,
              "rowKeyValue": row.key,
              "colKeyValue": cell.colKeyValue,
              "rowIndex": rowIndex,
              "type": row.inputType,
              "isSelected": row.isSelected,
              "isDisabled": row.isDisabled
            },
            key: api_key(25, cell.key)
          }, [])]) : null, cell.isDataTypeScope ? api_element("th", {
            className: cell.class,
            style: cell.style,
            attrs: {
              "aria-selected": cell.ariaSelected,
              "scope": "row",
              "tabindex": api_tab_index(cell.tabIndex),
              "data-label": cell.dataLabel
            },
            key: api_key(27, cell.colKeyValue)
          }, [api_custom_element("lightning-primitive-cell-factory", _lightningPrimitiveCellFactory, {
            attrs: {
              "data-label": cell.dataLabel
            },
            props: {
              "types": $cmp.privateTypes,
              "ariaSelected": cell.ariaSelected,
              "alignment": cell.alignment,
              "hasError": cell.hasError,
              "hasFocus": cell.hasFocus,
              "columnLabel": cell.dataLabel,
              "columnType": cell.columnType,
              "columnSubType": cell.columnSubType,
              "wrapText": cell.wrapText,
              "rowKeyValue": row.key,
              "colKeyValue": cell.colKeyValue,
              "value": cell.value,
              "iconName": cell.iconName,
              "iconLabel": cell.iconLabel,
              "iconPosition": cell.iconPosition,
              "iconAlternativeText": cell.iconAlternativeText,
              "editable": cell.editable,
              "typeAttribute0": cell.typeAttribute0,
              "typeAttribute1": cell.typeAttribute1,
              "typeAttribute2": cell.typeAttribute2,
              "typeAttribute3": cell.typeAttribute3,
              "typeAttribute4": cell.typeAttribute4,
              "typeAttribute5": cell.typeAttribute5,
              "typeAttribute6": cell.typeAttribute6,
              "typeAttribute7": cell.typeAttribute7,
              "typeAttribute8": cell.typeAttribute8,
              "typeAttribute9": cell.typeAttribute9,
              "typeAttribute10": cell.typeAttribute10,
              "typeAttribute21": cell.typeAttribute21,
              "typeAttribute22": cell.typeAttribute22
            },
            key: api_key(28, cell.columnType)
          }, [])]) : null, cell.isDataType ? api_element("td", {
            className: cell.class,
            style: cell.style,
            attrs: {
              "aria-selected": cell.ariaSelected,
              "role": "gridcell",
              "tabindex": api_tab_index(cell.tabIndex),
              "data-label": cell.dataLabel
            },
            key: api_key(30, cell.colKeyValue)
          }, [api_custom_element("lightning-primitive-cell-factory", _lightningPrimitiveCellFactory, {
            attrs: {
              "data-label": cell.dataLabel
            },
            props: {
              "types": $cmp.privateTypes,
              "ariaSelected": cell.ariaSelected,
              "role": "gridcell",
              "alignment": cell.alignment,
              "hasFocus": cell.hasFocus,
              "hasError": cell.hasError,
              "columnLabel": cell.dataLabel,
              "columnType": cell.columnType,
              "columnSubType": cell.columnSubType,
              "wrapText": cell.wrapText,
              "rowKeyValue": row.key,
              "colKeyValue": cell.colKeyValue,
              "value": cell.value,
              "iconName": cell.iconName,
              "iconLabel": cell.iconLabel,
              "iconPosition": cell.iconPosition,
              "iconAlternativeText": cell.iconAlternativeText,
              "editable": cell.editable,
              "typeAttribute0": cell.typeAttribute0,
              "typeAttribute1": cell.typeAttribute1,
              "typeAttribute2": cell.typeAttribute2,
              "typeAttribute3": cell.typeAttribute3,
              "typeAttribute4": cell.typeAttribute4,
              "typeAttribute5": cell.typeAttribute5,
              "typeAttribute6": cell.typeAttribute6,
              "typeAttribute7": cell.typeAttribute7,
              "typeAttribute8": cell.typeAttribute8,
              "typeAttribute9": cell.typeAttribute9,
              "typeAttribute10": cell.typeAttribute10,
              "typeAttribute21": cell.typeAttribute21,
              "typeAttribute22": cell.typeAttribute22
            },
            key: api_key(31, cell.columnType)
          }, [])]) : null];
        }));
      }), $cmp.isLoading ? api_element("tr", {
        key: 33
      }, [api_element("td", {
        classMap: {
          "slds-is-relative": true
        },
        attrs: {
          "colspan": $cmp.numberOfColumns
        },
        key: 34
      }, [api_custom_element("lightning-primitive-datatable-loading-indicator", _lightningPrimitiveDatatableLoadingIndicator, {
        key: 35
      }, [])])]) : null])) : null])])])]), $cmp.showStatusBar ? api_custom_element("lightning-primitive-datatable-status-bar", _lightningPrimitiveDatatableStatusBar, {
        props: {
          "error": $cmp.tableError
        },
        key: 37,
        on: {
          "privatesave": _m10 || ($ctx._m10 = api_bind($cmp.handleInlineEditSave)),
          "privatecancel": _m11 || ($ctx._m11 = api_bind($cmp.handleInlineEditCancel))
        }
      }, []) : null])];
    }

    var _tmpl$J = lwc.registerTemplate(tmpl$1d);
    tmpl$1d.stylesheets = [];
    tmpl$1d.stylesheetTokens = {
      hostAttribute: "lightning-datatable_datatable-host",
      shadowAttribute: "lightning-datatable_datatable"
    };

    /**
     * It creates a row key generator based on the keyField passed by the consumer
     * if the keyField does not point to a value row object passed in computeUniqueRowKey
     * it fallback to a generated key using indexes
     *
     * @param {String} keyField  - keyField provided by the consumer
     * @returns {*} - Object with a computeUniqueRowKey method
     */
    const createRowKeysGenerator = function (keyField) {
      let index = 0;
      return {
        computeUniqueRowKey(row) {
          if (row[keyField]) {
            return row[keyField];
          }

          return `row-${index++}`;
        }

      };
    };
    /**
     * It generate a unique column key value.
     *
     * @param {object} columnMetadata - the object for an specific column metadata
     * @param {int} index - optionally, the index of the column.
     * @returns {string} It generate the column key value based on the column field name and type.
     */

    const generateColKeyValue = function (columnMetadata, index) {
      const prefix = columnMetadata.fieldName || index;
      return `${prefix}-${columnMetadata.type}`;
    };

    const isObjectLike = function (value) {
      return typeof value === 'object' && value !== null;
    };
    const proto$1 = {
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
    const classSet$1 = function (config) {
      if (typeof config === 'string') {
        const key = config;
        config = {};
        config[key] = true;
      }

      return Object.assign(Object.create(proto$1), config);
    };
    const isPositiveInteger = function (value) {
      return /^\d+$/.test(value);
    };
    const clamp = function (num, min, max) {
      return num <= min ? min : num >= max ? max : num;
    };
    function normalizePositiveIntegerAttribute(attrName, value, fallback) {
      if (isPositiveInteger(value)) {
        return parseInt(value, 10);
      } // eslint-disable-next-line no-console


      console.warn(`The attribute "${attrName}" value passed in is incorrect.
            "${attrName}" value should be an integer >= 0.`);
      return fallback;
    }

    const STANDARD_TYPES = {
      text: true,
      boolean: true,
      number: ['minimumIntegerDigits', 'minimumFractionDigits', 'maximumFractionDigits', 'minimumSignificantDigits', 'maximumSignificantDigits'],
      currency: ['currencyCode', 'currencyDisplayAs', 'minimumIntegerDigits', 'minimumFractionDigits', 'maximumFractionDigits', 'minimumSignificantDigits', 'maximumSignificantDigits'],
      percent: ['minimumIntegerDigits', 'minimumFractionDigits', 'maximumFractionDigits', 'minimumSignificantDigits', 'maximumSignificantDigits'],
      email: true,
      date: ['day', 'era', 'hour', 'hour12', 'minute', 'month', 'second', 'timeZone', 'timeZoneName', 'weekday', 'year'],
      'date-local': ['day', 'month', 'year'],
      phone: true,
      url: ['label', 'target', 'tooltip'],
      location: true,
      rowNumber: ['error'],
      action: ['menuAlignment', 'rowActions'],
      button: ['variant', 'label', 'iconName', 'iconPosition', 'disabled', 'name', 'class', 'title'],
      'button-icon': ['variant', 'alternativeText', 'iconName', 'iconClass', 'disabled', 'name', 'class', 'title'],
      tree: ['hasChildren', 'isExpanded', 'level', 'setSize', 'posInSet', 'subType']
    };
    const TREE_SUPPORTED_TYPES = {
      text: true,
      url: true,
      date: true,
      number: true,
      currency: true,
      percent: true
    };
    function isValidType(typeName) {
      return !!STANDARD_TYPES[typeName];
    }
    function isTreeType(typeName) {
      return typeName === 'tree';
    }
    function getAttributesNames(typeName) {
      assert$1(isValidType(typeName), `your are trying to access an invalid type (${typeName})`);
      return Array.isArray(STANDARD_TYPES[typeName]) ? STANDARD_TYPES[typeName] : [];
    }
    function isValidTypeForTree(dataType) {
      return !!TREE_SUPPORTED_TYPES[dataType];
    }

    function getStandardTypeAttributesNames(typeName) {
      return Array.isArray(STANDARD_TYPES[typeName]) ? STANDARD_TYPES[typeName] : [];
    }

    class DatatableTypes {
      constructor(types) {
        this.privateCustomTypes = {};
        this.isValidTypeForTree = isValidTypeForTree;

        if (typeof types === 'object' && types !== null) {
          Object.keys(types).reduce((seed, key) => {
            const {
              template,
              typeAttributes = []
            } = types[key];
            seed[key] = {
              template,
              typeAttributes,
              type: 'custom'
            };
            return seed;
          }, this.privateCustomTypes);
        }
      }

      getType(typeName) {
        if (this.privateCustomTypes[typeName]) {
          return this.privateCustomTypes[typeName];
        }

        if (STANDARD_TYPES[typeName]) {
          return {
            typeAttributes: getStandardTypeAttributesNames(typeName),
            type: 'standard'
          };
        }

        return undefined;
      }

      isValidType(typeName) {
        return !!this.getType(typeName);
      }

    }

    var DatatableTypes$1 = lwc.registerComponent(DatatableTypes, {
      tmpl: _tmpl$1
    });

    function getSortDefaultState() {
      return {
        sortedBy: undefined,
        sortedDirection: undefined,
        defaultSortDirection: 'asc'
      };
    }
    const VALID_SORT_DIRECTIONS = {
      asc: true,
      desc: true
    };
    function isValidSortDirection(value) {
      return !!VALID_SORT_DIRECTIONS[value];
    }
    function getSortedBy(state) {
      return state.sortedBy;
    }
    function setSortedBy(state, value) {
      if (typeof value === 'string') {
        state.sortedBy = value;
      } else {
        state.sortedBy = undefined;
      }
    }
    function getSortedDirection(state) {
      return state.sortedDirection;
    }
    function setSortedDirection(state, value) {
      assert$1(isValidSortDirection(value), `The "sortedDirection" value passed into lightning:datatable
        is incorrect, "sortedDirection" value should be one of
        ${Object.keys(VALID_SORT_DIRECTIONS).join()}.`);
      state.sortedDirection = isValidSortDirection(value) ? value : undefined;
    }
    function getDefaultSortDirection(state) {
      return state.defaultSortDirection;
    }
    function setDefaultSortDirection(state, value) {
      assert$1(isValidSortDirection(value), `The "defaultSortDirection" value passed into lightning:datatable
        is incorrect, "defaultSortDirection" value should be one of
        ${Object.keys(VALID_SORT_DIRECTIONS).join()}.`);
      state.defaultSortDirection = isValidSortDirection(value) ? value : getDefaultSortDirection(state);
    }
    function updateSorting(state) {
      const columns = getColumns(state);
      columns.forEach(column => updateColumnSortingState(column, state));
    }
    function updateColumnSortingState(column, state) {
      const {
        sortedBy,
        sortedDirection,
        defaultSortDirection
      } = state;

      if (column.fieldName === sortedBy && column.sortable) {
        Object.assign(column, {
          sorted: true,
          sortAriaLabel: sortedDirection === 'desc' ? 'descending' : 'ascending',
          sortedDirection
        });
      } else {
        Object.assign(column, {
          sorted: false,
          sortAriaLabel: column.sortable ? 'none' : null,
          sortedDirection: defaultSortDirection
        });
      }
    }

    const MAX_ROW_SELECTION_DEFAULT = undefined;
    function getSelectorDefaultState() {
      return {
        selectedRowsKeys: {},
        maxRowSelection: MAX_ROW_SELECTION_DEFAULT
      };
    }
    function handleSelectAllRows(event) {
      event.stopPropagation();
      markAllRowsSelected(this.state);
      this.fireSelectedRowsChange(this.getSelectedRows());
    }
    function handleDeselectAllRows(event) {
      event.stopPropagation();
      markAllRowsDeselected(this.state);
      this.fireSelectedRowsChange(this.getSelectedRows());
    }
    /**
     * Will select the cell identified by rowKeyValue, colKeyValue.
     * This will reflect as aria-selected="true" attribute in the cell td or th.
     *
     * Note: This change is volatile, and will be reset (lost) in the next index regeneration.
     *
     * @param {Object} state - the state of the datatable
     * @param {String} rowKeyValue - the row key of the cell to select
     * @param {String} colKeyValue - the col key of the cell to select
     */

    function markSelectedCell(state, rowKeyValue, colKeyValue) {
      const row = getRowByKey(state, rowKeyValue);
      const colIndex = getStateColumnIndex(state, colKeyValue);

      if (row && colIndex) {
        row.cells[colIndex].ariaSelected = 'true';
      }
    }
    /**
     * Will deselect the cell identified by rowKeyValue, colKeyValue.
     * This will reflect in removing aria-selected attribute in the cell td or th (if it was previously added).
     *
     * Note: This change is volatile, and will be reset (lost) in the next index regeneration.
     *
     * @param {Object} state - the state of the datatable
     * @param {String} rowKeyValue - the row key of the cell to select
     * @param {String} colKeyValue - the col key of the cell to select
     */

    function markDeselectedCell(state, rowKeyValue, colKeyValue) {
      const row = getRowByKey(state, rowKeyValue);
      const colIndex = getStateColumnIndex(state, colKeyValue);

      if (row && colIndex) {
        row.cells[colIndex].ariaSelected = false;
      }
    }
    /**
     * Returns the last rowKey that was clicked, false otherwise.
     * @param {Object} state - the datatable state.
     * @return {String | undefined } the row key or false.
     */

    function getLastRowSelection(state) {
      const lastSelectedRowKey = state.selectionLastSelectedRow;
      const keyIsValid = lastSelectedRowKey !== undefined && getRowIndexByKey(state, lastSelectedRowKey) !== undefined;
      return keyIsValid ? lastSelectedRowKey : undefined;
    }

    function setLastRowSelection(state, rowKeyValue) {
      state.selectionLastSelectedRow = rowKeyValue;
    }

    function handleSelectRow(event) {
      event.stopPropagation();
      const {
        rowKeyValue,
        isMultiple
      } = event.detail;
      let fromRowKey = rowKeyValue;

      if (isMultiple) {
        fromRowKey = getLastRowSelection(this.state) || rowKeyValue;
      }

      markSelectedRowsInterval(this.state, fromRowKey, rowKeyValue);
      setLastRowSelection(this.state, rowKeyValue);
      this.fireSelectedRowsChange(this.getSelectedRows());
    }

    function markSelectedRowsInterval(state, startRowKey, endRowKey) {
      const rows = getRows(state);
      const {
        start,
        end
      } = getRowIntervalIndexes(state, startRowKey, endRowKey);
      const maxRowSelection = getMaxRowSelection(state) || getRowsTotal(state);
      let i = start,
          maxSelectionReached;

      do {
        markRowSelected(state, rows[i].key);
        maxSelectionReached = getCurrentSelectionLength(state) >= maxRowSelection;
        i++;
      } while (i <= end && !maxSelectionReached);
    }

    function handleDeselectRow(event) {
      event.stopPropagation();
      const {
        rowKeyValue,
        isMultiple
      } = event.detail;
      let fromRowKey = rowKeyValue;

      if (isMultiple) {
        fromRowKey = getLastRowSelection(this.state) || rowKeyValue;
      }

      markDeselectedRowsInterval(this.state, fromRowKey, rowKeyValue);
      setLastRowSelection(this.state, rowKeyValue);
      this.fireSelectedRowsChange(this.getSelectedRows());
    }

    function getRowIntervalIndexes(state, startRowKey, endRowKey) {
      const start = startRowKey === 'HEADER' ? 0 : getRowIndexByKey(state, startRowKey);
      const end = getRowIndexByKey(state, endRowKey);
      return {
        start: Math.min(start, end),
        end: Math.max(start, end)
      };
    }

    function markDeselectedRowsInterval(state, startRowKey, endRowKey) {
      const rows = getRows(state);
      const {
        start,
        end
      } = getRowIntervalIndexes(state, startRowKey, endRowKey);

      for (let i = start; i <= end; i++) {
        markRowDeselected(state, rows[i].key);
      }
    }

    function getSelectedRowsKeys(state) {
      return Object.keys(state.selectedRowsKeys).filter(key => state.selectedRowsKeys[key]);
    }

    function getSelectedDiff(state, value) {
      const selectedRowsKeys = state.selectedRowsKeys;
      return value.filter(key => !selectedRowsKeys[key]);
    }

    function getDeselectedDiff(state, value) {
      const currentSelectedRowsKeys = state.selectedRowsKeys;
      return Object.keys(currentSelectedRowsKeys).filter(key => currentSelectedRowsKeys[key] && !value[key]);
    }

    function normalizeSelectedRowsKey(value) {
      return value.reduce((map, key) => {
        map[key] = true;
        return map;
      }, {});
    }

    function markRowsSelectedByKeys(state, keys) {
      keys.forEach(rowKeyValue => {
        const row = getRowByKey(state, rowKeyValue);
        row.isSelected = true;
        row.ariaSelected = 'true';
        row.classnames = resolveRowClassNames(row);
      });
    }

    function markRowsDeselectedByKeys(state, keys) {
      keys.forEach(rowKeyValue => {
        const row = getRowByKey(state, rowKeyValue);
        row.isSelected = false;
        row.ariaSelected = false;
        row.classnames = resolveRowClassNames(row);
      });
    }

    function filterValidKeys(state, keys) {
      return keys.filter(key => rowKeyExists(state, key));
    }

    function setSelectedRowsKeys(state, value) {
      if (Array.isArray(value)) {
        const maxRowSelection = getMaxRowSelection(state);
        const previousSelectionLength = getCurrentSelectionLength(state);
        let selectedRows = filterValidKeys(state, value);

        if (selectedRows.length > maxRowSelection) {
          // eslint-disable-next-line no-console
          console.warn(`The number of keys in selectedRows for lightning:datatable
            exceeds the limit defined by maxRowSelection.`);
          selectedRows = selectedRows.slice(0, maxRowSelection);
        }

        const normalizedSelectedRowsKeys = normalizeSelectedRowsKey(selectedRows);
        const selectionOperations = getSelectedDiff(state, selectedRows);
        const deselectionOperations = getDeselectedDiff(state, normalizedSelectedRowsKeys);
        markRowsSelectedByKeys(state, selectionOperations);
        markRowsDeselectedByKeys(state, deselectionOperations);
        state.selectedRowsKeys = normalizedSelectedRowsKeys;

        if (selectedRows.length === maxRowSelection && maxRowSelection > 1) {
          markDeselectedRowDisabled(state);
        } else if (selectedRows.length < maxRowSelection && previousSelectionLength === maxRowSelection) {
          markDeselectedRowEnabled(state);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error(`The "selectedRows" passed into "lightning:datatable"
        must be an Array with the keys of the selected rows. We receive instead ${value}`);
        markAllRowsDeselected(state);
      }
    }
    function getMaxRowSelection(state) {
      return state.maxRowSelection;
    }
    function getHideSelectAllCheckbox(state) {
      return getMaxRowSelection(state) === 1;
    }
    function setMaxRowSelection(state, value) {
      markAllRowsDeselected(state);

      if (isPositiveInteger(value)) {
        const previousMaxRowSelection = getMaxRowSelection(state);
        state.maxRowSelection = Number(value);

        if (inputTypeNeedsToChange(previousMaxRowSelection, getMaxRowSelection(state))) {
          updateRowSelectionInputType(state);
          updateSelectionState(state);
        }
      } else {
        state.maxRowSelection = MAX_ROW_SELECTION_DEFAULT; // eslint-disable-next-line no-console

        console.error(`The maxRowSelection value passed into lightning:datatable
            should be a positive integer. We receive instead (${value}).`);
      }
    }
    function inputTypeNeedsToChange(previousMaxRowSelection, newMaxRowSelection) {
      return previousMaxRowSelection === 1 && isMultiSelection(newMaxRowSelection) || isMultiSelection(previousMaxRowSelection) && newMaxRowSelection === 1 || previousMaxRowSelection === 0 || newMaxRowSelection === 0;
    }
    function isMultiSelection(value) {
      return value > 1 || value === undefined;
    }
    function updateRowSelectionInputType(state) {
      const type = getRowSelectionInputType(state);
      const rows = getRows(state);
      resetSelectedRowsKeys(state);
      rows.forEach(row => {
        row.inputType = type;
        row.isSelected = false;
        row.ariaSelected = false;
        row.isDisabled = isDisabledRow(state, row.key);
      });
    }
    function isSelectedRow(state, rowKeyValue) {
      return !!state.selectedRowsKeys[rowKeyValue];
    }
    function isDisabledRow(state, rowKeyValue) {
      if (!isSelectedRow(state, rowKeyValue)) {
        const maxRowSelection = getMaxRowSelection(state); // W-4819182 when selection is 1, we should not disable selection.

        return maxRowSelection !== 1 && getCurrentSelectionLength(state) === maxRowSelection;
      }

      return false;
    }
    function getRowSelectionInputType(state) {
      if (getMaxRowSelection(state) === 1) {
        return 'radio';
      }

      return 'checkbox';
    }
    function markDeselectedRowDisabled(state) {
      const rows = getRows(state);
      rows.forEach(row => {
        if (!isSelectedRow(state, row.key)) {
          row.isDisabled = true;
        }
      });
    }
    function markDeselectedRowEnabled(state) {
      const rows = getRows(state);
      rows.forEach(row => {
        if (!isSelectedRow(state, row.key)) {
          row.isDisabled = false;
        }
      });
    }
    function getCurrentSelectionLength(state) {
      return getSelectedRowsKeys(state).length;
    }
    function markRowSelected(state, rowKeyValue) {
      const row = getRowByKey(state, rowKeyValue);
      const maxRowSelection = getMaxRowSelection(state) || getRowsTotal(state);
      const previousSelectionLength = getCurrentSelectionLength(state);
      row.isSelected = true;
      row.ariaSelected = 'true';
      row.classnames = resolveRowClassNames(row);

      if (maxRowSelection > 1) {
        addKeyToSelectedRowKeys(state, row.key);

        if (previousSelectionLength + 1 === maxRowSelection) {
          markDeselectedRowDisabled(state);
        }
      } else {
        if (previousSelectionLength === 1) {
          const previousSelectedRow = getRowByKey(state, Object.keys(state.selectedRowsKeys)[0]);
          previousSelectedRow.isSelected = false;
          previousSelectedRow.ariaSelected = false;
          previousSelectedRow.classnames = resolveRowClassNames(previousSelectedRow);
          resetSelectedRowsKeys(state);
        }

        addKeyToSelectedRowKeys(state, row.key);
      }
    }
    function markRowDeselected(state, rowKeyValue) {
      const row = getRowByKey(state, rowKeyValue);
      const maxRowSelection = getMaxRowSelection(state);
      row.isSelected = false;
      row.ariaSelected = false;
      row.classnames = resolveRowClassNames(row);
      removeKeyFromSelectedRowKeys(state, row.key);

      if (getCurrentSelectionLength(state) === maxRowSelection - 1) {
        markDeselectedRowEnabled(state);
      }
    }
    function resetSelectedRowsKeys(state) {
      state.selectedRowsKeys = {};
    }
    function markAllRowsSelected(state) {
      const rows = getRows(state);
      const maxRowSelection = getMaxRowSelection(state);
      resetSelectedRowsKeys(state);
      rows.forEach((row, index) => {
        if (index < maxRowSelection || maxRowSelection === undefined) {
          row.isSelected = true;
          row.ariaSelected = 'true';
          row.classnames = resolveRowClassNames(row);
          addKeyToSelectedRowKeys(state, row.key);
        } else {
          row.isDisabled = true;
          row.isSelected = false;
          row.ariaSelected = false;
          row.classnames = resolveRowClassNames(row);
        }
      });
    }
    function markAllRowsDeselected(state) {
      const rows = getRows(state);
      resetSelectedRowsKeys(state);
      rows.forEach(row => {
        row.isDisabled = false;
        row.isSelected = false;
        row.ariaSelected = false;
        row.classnames = resolveRowClassNames(row);
      });
      return state;
    }
    function syncSelectedRowsKeys(state, selectedRows) {
      let changed = false;
      const {
        selectedRowsKeys,
        keyField
      } = state;

      if (Object.keys(selectedRowsKeys).length !== selectedRows.length) {
        changed = true;
        state.selectedRowsKeys = updateSelectedRowsKeysFromSelectedRows(selectedRows, keyField);
      } else {
        changed = selectedRows.some(row => !selectedRowsKeys[row[keyField]]);

        if (changed) {
          state.selectedRowsKeys = updateSelectedRowsKeysFromSelectedRows(selectedRows, keyField);
        }
      }

      updateSelectionState(state);
      return {
        ifChanged: callback => {
          if (changed && typeof callback === 'function') {
            callback(selectedRows);
          }
        }
      };
    }
    function handleRowSelectionChange() {
      updateSelectionState(this.state);
    }

    function updateSelectedRowsKeysFromSelectedRows(selectedRows, keyField) {
      return selectedRows.reduce((selectedRowsKeys, row) => {
        selectedRowsKeys[row[keyField]] = true;
        return selectedRowsKeys;
      }, {});
    }

    function addKeyToSelectedRowKeys(state, key) {
      state.selectedRowsKeys[key] = true;
    }

    function removeKeyFromSelectedRowKeys(state, key) {
      // not using delete this.state.selectedRowsKeys[key]
      // because that cause perf issues
      state.selectedRowsKeys[key] = false;
    }

    function updateSelectionState(state) {
      const selectBoxesColumnIndex = getSelectBoxesColumnIndex(state);

      if (selectBoxesColumnIndex >= 0) {
        state.columns[selectBoxesColumnIndex] = Object.assign({}, state.columns[selectBoxesColumnIndex], {
          bulkSelection: getBulkSelectionState(state),
          isBulkSelectionDisabled: isBulkSelectionDisabled(state)
        });
      }
    }
    function getBulkSelectionState(state) {
      const selected = getCurrentSelectionLength(state);
      const total = getMaxRowSelection(state) || getRowsTotal(state);

      if (selected === 0) {
        return 'none';
      } else if (selected === total) {
        return 'all';
      }

      return 'some';
    }
    function isBulkSelectionDisabled(state) {
      return getRowsTotal(state) === 0 || getMaxRowSelection(state) === 0;
    }

    function getSelectBoxesColumnIndex(state) {
      const columns = getColumns(state) || [];
      let selectBoxColumnIndex = -1;
      columns.some((column, index) => {
        if (column.type === SELECTABLE_ROW_CHECKBOX) {
          selectBoxColumnIndex = index;
          return true;
        }

        return false;
      });
      return selectBoxColumnIndex;
    }

    function getTreeStateIndicatorFieldNames() {
      return {
        children: 'hasChildren',
        level: 'level',
        expanded: 'isExpanded',
        position: 'posInSet',
        setsize: 'setSize'
      };
    }
    function hasTreeDataType(state) {
      const columns = getColumns(state);
      return columns.some(column => {
        return isTreeType(column.type);
      });
    }
    function getStateTreeColumn(state) {
      const columns = getColumns(state);

      for (let i = 0; i < columns.length; i++) {
        if (isTreeType(columns[i].type)) {
          return columns[i];
        }
      }

      return null;
    }
    function fireRowToggleEvent(rowKeyValue, expanded) {
      const customEvent = new CustomEvent('privatetogglecell', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: {
          name: rowKeyValue,
          nextState: expanded ? false : true // True = expanded, False = collapsed

        }
      });
      this.dispatchEvent(customEvent);
    }

    function getErrorsState() {
      return {
        errors: {
          rows: {},
          table: {}
        }
      };
    }
    function getErrors(state) {
      return state.errors;
    }
    function setErrors(state, errors) {
      return state.errors = Object.assign({}, getErrorsState(), errors);
    }
    function getRowError(state, rowKey) {
      const rows = getErrors(state).rows;
      return rows && rows[rowKey] || {};
    }
    function getTableError(state) {
      return getErrors(state).table || {};
    }

    function getRowsDefaultState() {
      return {
        data: [],
        keyField: undefined,
        rows: [],
        indexes: {}
      };
    }
    function setData(state, data) {
      if (Array.isArray(data)) {
        state.data = data;
      } else {
        state.data = [];
      }
    }
    function getData(state) {
      return state.data;
    }
    function getRows(state) {
      return state.rows;
    }
    function setKeyField(state, value) {
      assert$1(typeof value === 'string', `The "keyField" value expected in lightning:datatable must be type String.`);

      if (typeof value === 'string') {
        state.keyField = value;
      } else {
        state.keyField = undefined;
      }
    }
    function getKeyField(state) {
      return state.keyField;
    }
    function hasValidKeyField(state) {
      const keyField = getKeyField(state);
      return typeof keyField === 'string';
    }
    /**
     * It resolve the css classes for a row based on the row.isSelected state
     * @param {object} row - a row object in state.rows collection
     * @returns {string} the classSet string
     */

    function resolveRowClassNames(row) {
      const classes = classSet$1('slds-hint-parent');

      if (row.isSelected) {
        classes.add('slds-is-selected');
      }

      return classes.toString();
    }
    /**
     *
     * @param {object} state - data table state
     * @param {string} rowKeyValue - computed id for the row
     * @param {string} colKeyValue - computed id for the column
     *
     * @return {object} The user row that its related to the action.
     */

    function getUserRowByCellKeys(state, rowKeyValue, colKeyValue) {
      const rowIndex = state.indexes[rowKeyValue][colKeyValue][0];
      return getData(state)[rowIndex];
    }
    /**
     * It compute the state.rows collection based on the current normalized (data, columns)
     * and generate cells indexes map(state.indexes)
     * @param {object} state - the current datatable state
     */

    function updateRowsAndCellIndexes() {
      const {
        state,
        privateTypes: types
      } = this;
      const {
        keyField
      } = state;
      const data = getData(state);
      const columns = getColumns(state);
      const {
        computeUniqueRowKey
      } = createRowKeysGenerator(keyField);
      const scopeCol = columns.find(colData => types.isValidType(colData.type) && colData.isScopeCol); // initializing indexes

      state.indexes = {};
      state.rows = data.reduce((prev, rowData, rowIndex) => {
        const row = {
          key: computeUniqueRowKey(rowData),
          // attaching unique key to the row
          cells: []
        };
        const rowErrors = getRowError(state, row.key);
        state.indexes[row.key] = {
          rowIndex
        };
        row.inputType = getRowSelectionInputType(state);
        row.isSelected = isSelectedRow(state, row.key);
        row.ariaSelected = row.isSelected ? 'true' : false;
        row.isDisabled = isDisabledRow(state, row.key);
        row.classnames = resolveRowClassNames(row);
        Object.assign(row, getRowStateForTree(rowData, state));
        row.tabIndex = -1;
        columns.reduce((currentRow, colData, colIndex) => {
          const {
            fieldName
          } = colData;
          const colKeyValue = generateColKeyValue(colData, colIndex);
          const dirtyValue = getDirtyValue(state, row.key, colKeyValue);
          const computedCellValue = dirtyValue !== undefined ? dirtyValue : rowData[fieldName];
          const colType = types.getType(colData.type); // cell object creation

          const cell = {
            columnType: colData.type,
            columnSubType: colData.typeAttributes ? colData.typeAttributes.subType : undefined,
            dataLabel: colData.label,
            value: computedCellValue,
            // value based on the fieldName
            rowKeyValue: row.key,
            // unique row key value
            colKeyValue,
            // unique column key value
            tabIndex: -1,
            // tabindex
            isCheckbox: colData.type === 'SELECTABLE_CHECKBOX',
            class: computeCellClassNames(colData, rowErrors, dirtyValue),
            hasError: rowErrors.fieldNames && rowErrors.fieldNames.includes(colData.fieldName),
            isDataType: types.isValidType(colData.type) && !colData.isScopeCol,
            isDataTypeScope: types.isValidType(colData.type) && colData.isScopeCol,
            wrapText: state.wrapText[colKeyValue],
            // wrapText state
            style: colType && colType.type === 'custom' ? 'padding: 0px;' : undefined
          };

          if (isCustomerColumn(colData)) {
            Object.assign(cell, computeCellTypeAttributes(rowData, colData, types), computeCellAttributes(rowData, colData), computeCellEditable(colData));

            if (isTreeType(colData.type)) {
              Object.assign(cell, computeCellStateTypeAttributes(row));
            }
          } else if (isRowNumberColumn(colData)) {
            const scopeColValue = rowData[scopeCol.fieldName];
            const errorColumnDef = getRowNumberErrorColumnDef(rowErrors, scopeColValue);
            Object.assign(cell, computeCellTypeAttributes(rowData, errorColumnDef, types));
          } // adding cell indexes to state.indexes
          // Keeping the hash for backward compatibility, but we need to have 2 indexes, 1 for columns and one for rows,
          // because of memory usage and also at certain point we might have the data but not the columns


          state.indexes[row.key][colKeyValue] = [rowIndex, colIndex];
          currentRow.push(cell);
          return currentRow;
        }, row.cells);
        prev.push(row);
        return prev;
      }, []);
    }
    function computeCellAttributes(row, column) {
      const cellAttributesValues = getCellAttributesValues(column);
      return Object.keys(cellAttributesValues).reduce((attrs, attrName) => {
        const attrValue = cellAttributesValues[attrName];
        attrs[attrName] = resolveAttributeValue(attrValue, row);
        return attrs;
      }, {});
    }
    function computeCellTypeAttributes(row, column, types) {
      if (column.typeAttributes && column.typeAttributes.subType) {
        return computeCellSubTypeAttributes(row, column);
      }

      const attributesNames = types.getType(column.type).typeAttributes;
      const typeAttributesValues = getTypeAttributesValues(column);
      return attributesNames.reduce((attrs, attrName, index) => {
        const typeAttributeName = `typeAttribute${index}`;
        attrs[typeAttributeName] = resolveAttributeValue(typeAttributesValues[attrName], row);
        return attrs;
      }, {});
    }
    function computeCellSubTypeAttributes(row, column) {
      const attributesNames = getAttributesNames(column.typeAttributes.subType);
      const typeAttributesValues = getSubTypeAttributesValues(column);
      return attributesNames.reduce((attrs, attrName, index) => {
        const typeAttributeName = `typeAttribute${index}`;
        attrs[typeAttributeName] = resolveAttributeValue(typeAttributesValues[attrName], row);
        return attrs;
      }, {});
    }

    function computeCellEditable(column) {
      return {
        editable: column.editable
      };
    }

    function computeCellClassNames(column, rowErrors, dirtyValue) {
      const classNames = classSet$1('');
      classNames.add({
        'slds-cell-edit': column.editable === true
      });
      classNames.add({
        'slds-tree__item': isTreeType(column.type)
      });
      classNames.add({
        'slds-has-error': rowErrors.fieldNames && rowErrors.fieldNames.includes(column.fieldName)
      });
      classNames.add({
        'slds-is-edited': dirtyValue !== undefined
      });
      return classNames.toString();
    }
    /**
     * Attaches if the row containing this cell hasChildren or not and isExpanded or not
     * attributes to typeAttribute21 and typeAttribute22 respectively
     * typeAttribute0-typeAttribute20 are reserved for  types supported by tree
     * @param {object}row - current row which is stored in state.rows
     * @returns {{typeAttribute21, typeAttribute22: boolean}} typeAttributes
     * describing state of the row associated
     */


    function computeCellStateTypeAttributes(row) {
      return {
        typeAttribute21: row.hasChildren,
        typeAttribute22: row.isExpanded === 'true'
      };
    }

    function getRowIndexByKey(state, key) {
      if (!state.indexes[key]) {
        return undefined;
      }

      return state.indexes[key].rowIndex;
    }
    function getRowByKey(state, key) {
      const rows = getRows(state);
      return rows[getRowIndexByKey(state, key)];
    }
    function rowKeyExists(state, key) {
      return !!state.indexes[key];
    }
    function getRowsTotal(state) {
      return getRows(state).length;
    }

    function resolveAttributeValue(attrValue, row) {
      if (isObjectLike(attrValue)) {
        const fieldName = attrValue.fieldName;

        if (fieldName) {
          return row[fieldName];
        }
      }

      return attrValue;
    }

    function getRowStateForTree(row, state) {
      const column = getStateTreeColumn(state);

      if (column) {
        return {
          level: getRowLevel(column, row),
          posInSet: getRowPosInSet(column, row),
          setSize: getRowSetSize(column, row),
          isExpanded: isRowExpanded(column, row),
          hasChildren: getRowHasChildren(column, row)
        };
      }

      return {};
    }

    function getRowLevel(column, row) {
      const typeAttributesValues = getTypeAttributesValues(column);
      const attrValue = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().level], row);
      return attrValue ? attrValue : 1;
    }

    function getRowPosInSet(column, row) {
      const typeAttributesValues = getTypeAttributesValues(column);
      const attrValue = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().position], row);
      return attrValue ? attrValue : 1;
    }

    function getRowSetSize(column, row) {
      const typeAttributesValues = getTypeAttributesValues(column);
      const attrValue = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().setsize], row);
      return attrValue ? attrValue : 1;
    }

    function isRowExpanded(column, row) {
      const typeAttributesValues = getTypeAttributesValues(column);
      const hasChildren = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().children], row);

      if (hasChildren) {
        const attrValue = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().expanded], row);
        return !!attrValue + '';
      }

      return undefined;
    }
    function getRowHasChildren(column, row) {
      const typeAttributesValues = getTypeAttributesValues(column);
      const hasChildren = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().children], row);
      return !!hasChildren;
    }

    const ARROW_RIGHT = 39;
    const ARROW_LEFT = 37;
    const ARROW_DOWN = 40;
    const ARROW_UP = 38;
    const ENTER = 13;
    const ESCAPE = 27;
    const TAB = 9;
    const SPACE = 32;
    const NAVIGATION_DIR = {
      RIGHT: 1,
      LEFT: -1,
      USE_CURRENT: 0,
      RESET: 2
    };
    const TOP_MARGIN = 80;
    const BOTTOM_MARGIN = 80;
    const SCROLL_OFFSET = 20;
    const NAVIGATION_MODE = 'NAVIGATION';
    function getKeyboardDefaultState() {
      return {
        keyboardMode: NAVIGATION_MODE,
        rowMode: false,
        activeCell: undefined,
        tabindex: 0,
        cellToFocusNext: null,
        cellClicked: false
      };
    }
    /**
     * It update the current activeCell in the state with the new rowKeyValue, colKeyValue
     * @param {object} state - datatable state
     * @param {string} rowKeyValue  - the unique row key value
     * @param {string} colKeyValue {string} - the unique col key value
     * @returns {object} state - mutated datatable state
     */

    const updateActiveCell = function (state, rowKeyValue, colKeyValue) {
      state.activeCell = {
        rowKeyValue,
        colKeyValue
      };
      return state;
    };
    /**
     * It return if the pair rowKeyValue, colKeyValue are the current activeCell values
     * @param {object} state - datatable state
     * @param {string} rowKeyValue  - the unique row key value
     * @param {string} colKeyValue {string} - the unique col key value
     * @returns {boolean} - true if rowKeyValue, colKeyValue are the current activeCell values.
     */

    const isActiveCell = function (state, rowKeyValue, colKeyValue) {
      if (state.activeCell) {
        const {
          rowKeyValue: currentRowKeyValue,
          colKeyValue: currentColKeyValue
        } = state.activeCell;
        return currentRowKeyValue === rowKeyValue && currentColKeyValue === colKeyValue;
      }

      return false;
    };
    /**
     * It check if in the current (data, columns) the activeCell still valid.
     * When data changed the activeCell could be removed, then we check if there is cellToFocusNext
     * which is calculated from previously focused cell, if so we sync to that
     * If active cell is still valid we keep it the same
     *
     * @param {object} state - datatable state
     * @returns {object} state - mutated datatable state
     */

    const syncActiveCell = function (state) {
      if (!state.activeCell || !stillValidActiveCell(state)) {
        if (state.activeCell && state.cellToFocusNext) {
          // there is previously focused cell
          setNextActiveCellFromPrev(state);
        } else {
          // there is no active cell or there is no previously focused cell
          setDefaultActiveCell(state);
        }
      }

      return state;
    };
    const datatableHasFocus = function (state) {
      return state.tabindex === false || state.cellClicked;
    };
    /**
     * Sets the row and col index of cell to focus next if
     * there is state.activecell
     * datatable has focus
     * there is state.indexes
     * there is no  previously set state.cellToFocusNext
     * Indexes are calculated as to what to focus on next
     * @param {object} state - datatable state
     */

    const setCellToFocusFromPrev = function (state) {
      if (state.activeCell && datatableHasFocus(state) && state.indexes && !state.cellToFocusNext) {
        let {
          rowIndex,
          colIndex
        } = getIndexesActiveCell(state);
        colIndex = 0; // default point to the first column

        if (state.rows && rowIndex === state.rows.length - 1) {
          // if it is last row, make it point to its previous row
          rowIndex = state.rows.length - 1;
          colIndex = state.columns ? state.columns.length - 1 : 0;
        }

        state.cellToFocusNext = {
          rowIndex,
          colIndex
        };
      }
    };
    /**
     * if the current new active still is valid ie exists then set the celltofocusnext to null
     * @param {object} state - datatable state
     */

    const updateCellToFocusFromPrev = function (state) {
      if (state.activeCell && state.cellToFocusNext && stillValidActiveCell(state)) {
        // if the previous focused is there and valid,  dont set the prevActiveFocusedCell
        state.cellToFocusNext = null;
      }
    };
    /**
     * reset celltofocusnext to null (used after render)
     * @param {object} state - datatable state
     */

    const resetCellToFocusFromPrev = function (state) {
      state.cellToFocusNext = null;
    };
    /**
     * Sets the next active if there is a previously focused active cell
     * Logic is:
     * if the rowIndex is existing one - cell = (rowIndex, 0)
     * if the rowIndex is > the number of rows (focused was last row or more) = (lastRow, lastColumn)
     * for columns
     * same as above except if the colIndex is > the number of cols (means no data) = set it to null??
     * @param {object} state - datatable state
     */

    function setNextActiveCellFromPrev(state) {
      const {
        rowIndex,
        colIndex
      } = state.cellToFocusNext;
      let nextRowIndex = rowIndex;
      let nextColIndex = colIndex;
      const rowsCount = state.rows ? state.rows.length : 0;
      const colsCount = state.columns.length ? state.columns.length : 0;

      if (nextRowIndex > rowsCount - 1) {
        // row index not existing after update to new 5 > 5-1, 6 > 5-1,
        nextRowIndex = rowsCount - 1;
      }

      if (nextColIndex > colsCount - 1) {
        // col index not existing after update to new
        nextColIndex = colsCount - 1;
      }

      const nextActiveCell = getCellFromIndexes(state, nextRowIndex, nextColIndex);

      if (nextActiveCell) {
        state.activeCell = nextActiveCell;
      } else {
        setDefaultActiveCell(state);
      }

      state.keyboardMode = 'NAVIGATION';
    }
    /**
     * It update the tabIndex value of a cell in the state for the rowIndex, colIndex passed
     * as consequence of this change
     * datatable is gonna re-render the cell affected with the new tabindex value
     *
     * @param {object} state - datatable state
     * @param {number} rowIndex - the row index
     * @param {number} colIndex - the column index
     * @param {number} [index = 0] - the value for the tabindex
     */


    const updateTabIndex = function (state, rowIndex, colIndex, index = 0) {
      if (isHeaderRow(rowIndex)) {
        const {
          columns
        } = state;
        columns[colIndex].tabIndex = index;
      } else {
        state.rows[rowIndex].cells[colIndex].tabIndex = index;
      }
    };
    /**
     * It updates the tabIndex value of a row in the state for the rowIndex passed
     * as consequence of this change
     * datatable is gonna re-render the row affected with the new tabindex value
     *
     * @param {object} state - datatable state
     * @param {number} rowIndex - the row index
     * @param {number} [index = 0] - the value for the tabindex
     */

    const updateTabIndexRow = function (state, rowIndex, index = 0) {
      if (!isHeaderRow(rowIndex)) {
        // TODO what to do when rowIndex is header row
        state.rows[rowIndex].tabIndex = index;
      }
    };
    /**
     * It update the tabindex for the current activeCell.
     * @param {object} state - datatable state
     * @param {number} [index = 0] - the value for the tabindex
     * @returns {object} state - mutated state
     */

    const updateTabIndexActiveCell = function (state, index = 0) {
      if (state.activeCell && !stillValidActiveCell(state)) {
        syncActiveCell(state);
      } // we need to check again because maybe there is no active cell after sync


      if (state.activeCell && !isRowNavigationMode(state)) {
        const {
          rowIndex,
          colIndex
        } = getIndexesActiveCell(state);
        updateTabIndex(state, rowIndex, colIndex, index);
      }

      return state;
    };
    /**
     * It updates the tabindex for the row of the current activeCell.
     * This happens in rowMode of NAVIGATION_MODE
     * @param {object} state - datatable state
     * @param {number} [index = 0] - the value for the tabindex
     * @returns {object} state - mutated state
     */

    const updateTabIndexActiveRow = function (state, index = 0) {
      if (state.activeCell && !stillValidActiveCell(state)) {
        syncActiveCell(state);
      } // we need to check again because maybe there is no active cell after sync


      if (state.activeCell && isRowNavigationMode(state)) {
        const {
          rowIndex
        } = getIndexesActiveCell(state);
        updateTabIndexRow(state, rowIndex, index);
      }

      return state;
    };
    /**
     * If new set of columns doesnt have tree data mark it to false, as it
     * could be true earlier
     * Else if it has tree data, check if rowMode is false
     * Earlier it didnt have tree data, set rowMode to true to start
     * if rowMode is false and earlier it has tree data, keep it false
     * if rowMode is true and it has tree data, keep it true
     * @param {boolean} hadTreeDataTypePreviously - state object
     * @param {object} state - state object
     * @returns {object} state - mutated state
     */

    function updateRowNavigationMode(hadTreeDataTypePreviously, state) {
      if (!hasTreeDataType(state)) {
        state.rowMode = false;
      } else if (state.rowMode === false && !hadTreeDataTypePreviously) {
        state.rowMode = true;
      }

      return state;
    }
    /**
     * It return the indexes { rowIndex, colIndex } of a cell based of the unique cell values
     * rowKeyValue, colKeyValue
     * @param {object} state - datatable state
     * @param {string} rowKeyValue - the row key value
     * @param {string} colKeyValue - the column key value
     * @returns {object} - {rowIndex, colIndex}
     */

    const getIndexesByKeys = function (state, rowKeyValue, colKeyValue) {
      if (rowKeyValue === 'HEADER') {
        return {
          rowIndex: -1,
          colIndex: state.headerIndexes[colKeyValue]
        };
      }

      return {
        rowIndex: state.indexes[rowKeyValue][colKeyValue][0],
        colIndex: state.indexes[rowKeyValue][colKeyValue][1]
      };
    };
    /**
     * It set the focus to the current activeCell, this operation imply multiple changes
     * - update the tabindex of the activeCell
     * - set the current keyboard mode
     * - set the focus to the cell
     * @param {node} element - the custom element template `this.template`
     * @param {object} state - datatable state
     * @param {int} direction - direction (-1 left, 1 right and 0 for no direction) its used to know which actionable element to activate.
     * @param {object} info - extra information when setting the cell mode.
     */

    const setFocusActiveCell = function (element, state, direction, info) {
      const {
        keyboardMode
      } = state;
      const {
        rowIndex,
        colIndex
      } = getIndexesActiveCell(state);
      updateTabIndex(state, rowIndex, colIndex); // eslint-disable-next-line lwc/no-set-timeout

      setTimeout(() => {
        const cellElement = getCellElementByIndexes(element, rowIndex, colIndex);

        if (cellElement) {
          if (direction) {
            cellElement.resetCurrentInputIndex(direction);
          }

          cellElement.addFocusStyles();
          cellElement.parentElement.classList.add('slds-has-focus');
          cellElement.parentElement.focus();
          cellElement.setMode(keyboardMode, info);
          const scrollingParent = element.querySelector('.slds-table_header-fixed_container');
          const scrollableY = element.querySelector('.slds-scrollable_y');
          const parentRect = scrollingParent.getBoundingClientRect();
          const findMeRect = cellElement.getBoundingClientRect();

          if (findMeRect.top < parentRect.top + TOP_MARGIN) {
            scrollableY.scrollTop -= SCROLL_OFFSET;
          } else if (findMeRect.bottom > parentRect.bottom - BOTTOM_MARGIN) {
            scrollableY.scrollTop += SCROLL_OFFSET;
          }
        }
      }, 0);
    };
    /**
     * It adds and the focus classes to the th/td.
     *
     * @param {node} element - the custom element template `this.template`
     * @param {object} state - datatable state
     */

    const addFocusStylesToActiveCell = function (element, state) {
      const {
        rowIndex,
        colIndex
      } = getIndexesActiveCell(state);
      const cellElement = getCellElementByIndexes(element, rowIndex, colIndex);

      if (cellElement) {
        cellElement.parentElement.classList.add('slds-has-focus');
      }
    };
    /**
     * It blur to the current activeCell, this operation imply multiple changes
     * - blur the activeCell
     * - update the tabindex to -1
     * @param {node} element - the custom element root `this.template`
     * @param {object} state - datatable state
     */

    const setBlurActiveCell = function (element, state) {
      if (state.activeCell) {
        const {
          rowIndex,
          colIndex
        } = getIndexesActiveCell(state); // eslint-disable-next-line lwc/no-set-timeout

        setTimeout(() => {
          const cellElement = getCellElementByIndexes(element, rowIndex, colIndex); // we need to check because of the tree,
          // at this point it may remove/change the rows/keys because opening or closing a row.

          if (cellElement) {
            if (document.activeElement === cellElement) {
              cellElement.blur();
            }

            cellElement.removeFocusStyles(true);
            cellElement.parentElement.classList.remove('slds-has-focus');
          }
        }, 0);
        updateTabIndex(state, rowIndex, colIndex, -1);
      }
    };
    /**
     * It set the focus to the current activeCell, this operation imply multiple changes
     * - update the tabindex of the activeCell
     * - set the current keyboard mode
     * - set the focus to the cell
     * @param {node} element - the custom element root `this.template`
     * @param {object} state - datatable state
     */

    const setFocusActiveRow = function (element, state) {
      const {
        rowIndex
      } = getIndexesActiveCell(state);
      updateTabIndexRow(state, rowIndex); // eslint-disable-next-line lwc/no-set-timeout

      setTimeout(() => {
        const row = getRowElementByIndexes(element, rowIndex);
        row.focus();
        const scrollingParent = element.querySelector('.slds-table_header-fixed_container');
        const scrollableY = element.querySelector('.slds-scrollable_y');
        const parentRect = scrollingParent.getBoundingClientRect();
        const findMeRect = row.getBoundingClientRect();

        if (findMeRect.top < parentRect.top + TOP_MARGIN) {
          scrollableY.scrollTop -= SCROLL_OFFSET;
        } else if (findMeRect.bottom > parentRect.bottom - BOTTOM_MARGIN) {
          scrollableY.scrollTop += SCROLL_OFFSET;
        }
      }, 0);
    };
    /**
     * It blur the active Row, this operation imply multiple changes
     * - blur the active row
     * - update the tabindex to -1
     * @param {node} element - the custom element root `this.template`
     * @param {object} state - datatable state
     */

    const setBlurActiveRow = function (element, state) {
      if (state.activeCell) {
        const {
          rowIndex
        } = getIndexesActiveCell(state); // eslint-disable-next-line lwc/no-set-timeout

        setTimeout(() => {
          const row = getRowElementByIndexes(element, rowIndex);

          if (document.activeElement === row) {
            row.blur();
          }
        }, 0);
        updateTabIndexRow(state, rowIndex, -1);
      }
    };
    /**
     * It changes the datable state based on the keyboard event sent from the cell component,
     * the result of those change may trigger re-render on the table
     * @param {node} element - the custom element root `this.template`
     * @param {object} state - datatable state
     * @param {event} event - custom DOM event sent by the cell
     * @returns {object} - mutated state
     */

    const reactToKeyboard = function (element, state, event) {
      switch (event.detail.keyCode) {
        case ARROW_RIGHT:
          return reactToArrowRight(element, state, event);

        case ARROW_LEFT:
          return reactToArrowLeft(element, state, event);

        case ARROW_DOWN:
          return reactToArrowDown(element, state, event);

        case ARROW_UP:
          return reactToArrowUp(element, state, event);

        case ENTER:
        case SPACE:
          return reactToEnter(element, state, event);

        case ESCAPE:
          return reactToEscape(element, state, event);

        case TAB:
          return reactToTab(element, state, event);

        default:
          return state;
      }
    };

    function reactToKeyboardInNavMode(element, state, event) {
      const mockEvent = {
        detail: {
          rowKeyValue: state.activeCell.rowKeyValue,
          colKeyValue: state.activeCell.colKeyValue,
          keyCode: event.keyCode,
          shiftKey: event.shiftKey
        },
        preventDefault: () => {},
        stopPropagation: () => {}
      };

      switch (event.keyCode) {
        case ARROW_RIGHT:
          event.preventDefault();
          return reactToArrowRight(element, state, mockEvent);

        case ARROW_LEFT:
          event.preventDefault();
          return reactToArrowLeft(element, state, mockEvent);

        case ARROW_DOWN:
          event.preventDefault();
          return reactToArrowDown(element, state, mockEvent);

        case ARROW_UP:
          event.preventDefault();
          return reactToArrowUp(element, state, mockEvent);

        case ENTER:
        case SPACE:
          event.preventDefault();
          return reactToEnter(element, state, mockEvent);

        case ESCAPE:
          // do nothing since this only handles navigation mode.
          return state;

        case TAB:
          // event.preventDefault();
          return reactToTab(element, state, mockEvent);

        default:
          return state;
      }
    }

    const reactToKeyboardOnRow = function (dt, state, event) {
      if (isRowNavigationMode(state) && event.target.localName.indexOf('tr') !== -1) {
        const element = dt.template;

        switch (event.detail.keyCode) {
          case ARROW_RIGHT:
            return reactToArrowRightOnRow.call(dt, element, state, event);

          case ARROW_LEFT:
            return reactToArrowLeftOnRow.call(dt, element, state, event);

          case ARROW_DOWN:
            return reactToArrowDownOnRow.call(dt, element, state, event);

          case ARROW_UP:
            return reactToArrowUpOnRow.call(dt, element, state, event);

          default:
            return state;
        }
      }

      return state;
    };

    function isRowNavigationMode(state) {
      return state.keyboardMode === 'NAVIGATION' && state.rowMode === true;
    }

    function setRowNavigationMode(state) {
      if (hasTreeDataType(state) && state.keyboardMode === 'NAVIGATION') {
        state.rowMode = true;
      }
    }
    function unsetRowNavigationMode(state) {
      state.rowMode = false;
    }
    function canBeRowNavigationMode(state) {
      return hasTreeDataType(state) && state.keyboardMode === 'NAVIGATION';
    }

    function isHeaderRow(rowIndex) {
      return rowIndex === -1;
    }

    function getCellElementByIndexes(element, rowIndex, colIndex) {
      if (isHeaderRow(rowIndex)) {
        const rowElement = element.querySelector(`thead > tr:nth-child(1)`);
        return rowElement && rowElement.querySelector(`th:nth-child(${colIndex + 1}) :first-child`);
      }

      return element.querySelector(`tbody > tr:nth-child(${rowIndex + 1}) > *:nth-child(${colIndex + 1}) > :first-child`);
    }

    function getRowElementByIndexes(element, rowIndex) {
      if (isHeaderRow(rowIndex)) {
        return element.querySelector(`thead > tr:nth-child(1)`);
      }

      return element.querySelector(`tbody > tr:nth-child(${rowIndex + 1})`);
    }

    function reactToEnter(element, state, event) {
      if (state.keyboardMode === 'NAVIGATION') {
        state.keyboardMode = 'ACTION';
        const {
          rowIndex,
          colIndex
        } = getIndexesActiveCell(state);
        const actionsMap = {};
        actionsMap[SPACE] = 'space';
        actionsMap[ENTER] = 'enter';

        if (event.detail.keyEvent) {
          event.detail.keyEvent.preventDefault();
        }

        setModeActiveCell(element, state, {
          action: actionsMap[event.detail.keyCode]
        });
        updateTabIndex(state, rowIndex, colIndex, -1);
      }
    }

    function reactToEscape(element, state, event) {
      if (state.keyboardMode === 'ACTION') {
        // When the table is in action mode this event shouldn't bubble
        // because if the table in inside a modal it should prevent the model closes
        event.detail.keyEvent.stopPropagation();
        state.keyboardMode = 'NAVIGATION';
        setModeActiveCell(element, state);
        setFocusActiveCell(element, state, NAVIGATION_DIR.RESET);
      }
    }
    /**
     * Retrieve the next tab index values for row & column
     * @param {object} state - datatable state
     * @param {string} direction - 'RIGHT' or 'LEFT'
     * @returns {object} - nextRowIndex, nextColIndex values, isExitCell boolean
     */


    function getNextTabIndex(state, direction) {
      const {
        rowIndex,
        colIndex
      } = getIndexesActiveCell(state); // decide which function to use based on the value of direction

      const nextTabFunc = {
        RIGHT: getNextTabIndexRight,
        LEFT: getNextTabIndexLeft
      };
      return nextTabFunc[direction](state, rowIndex, colIndex);
    }
    /**
     * Check if we're in an escape/exit cell (first or last of grid)
     * @param {object} state - datatable state
     * @param {string} direction - 'RIGHT' or 'LEFT'
     * @returns {boolean} - if the current cell is or isn't an exit cell
     */


    function isActiveCellAnExitCell(state, direction) {
      // get next tab index values
      const {
        rowIndex,
        colIndex
      } = getIndexesActiveCell(state);
      const {
        nextRowIndex,
        nextColIndex
      } = getNextTabIndex(state, direction); // is it an exit cell?

      if ( // if first cell and moving left
      rowIndex === -1 && colIndex === 0 && nextRowIndex !== -1 && nextColIndex !== 0 || // or if last cell and moving right
      rowIndex !== -1 && nextRowIndex === -1 && nextColIndex === 0) {
        return true;
      }

      return false;
    }

    function reactToTab(element, state, event) {
      event.preventDefault();
      event.stopPropagation();
      const {
        shiftKey
      } = event.detail;
      const direction = shiftKey ? 'LEFT' : 'RIGHT';
      const isExitCell = isActiveCellAnExitCell(state, direction); // if in ACTION mode

      if (state.keyboardMode === 'ACTION') {
        // if not on last or first cell, tab through each cell of the grid
        if (isExitCell === false) {
          // prevent default key event in action mode when actually moving within the grid
          if (event.detail.keyEvent) {
            event.detail.keyEvent.preventDefault();
          } // tab in proper direction based on shift key press


          if (shiftKey) {
            reactToTabLeft(element, state);
          } else {
            reactToTabRight(element, state);
          }
        } else {
          // exit ACTION mode
          state.keyboardMode = 'NAVIGATION';
          setModeActiveCell(element, state);
        }
      }
    }

    function setModeActiveCell(element, state, info) {
      const cellElement = getActiveCellElement(element, state);
      cellElement.setMode(state.keyboardMode, info);
    }

    function getActiveCellElement(element, state) {
      const {
        rowIndex,
        colIndex
      } = getIndexesActiveCell(state);
      return getCellElementByIndexes(element, rowIndex, colIndex);
    }

    function getIndexesActiveCell(state) {
      const {
        activeCell: {
          rowKeyValue,
          colKeyValue
        }
      } = state;
      return getIndexesByKeys(state, rowKeyValue, colKeyValue);
    }

    function reactToArrowRight(element, state, event) {
      const {
        rowKeyValue,
        colKeyValue
      } = event.detail;
      const {
        colIndex
      } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
      const nextColIndex = getNextIndexRight(state, colIndex);
      const {
        columns
      } = state;

      if (nextColIndex === undefined) {
        return;
      }

      setBlurActiveCell(element, state); // update activeCell

      state.activeCell = {
        rowKeyValue,
        colKeyValue: generateColKeyValue(columns[nextColIndex], nextColIndex)
      };
      setFocusActiveCell(element, state, NAVIGATION_DIR.RIGHT);
    }

    function reactToArrowLeft(element, state, event) {
      const {
        rowKeyValue,
        colKeyValue
      } = event.detail;
      const {
        colIndex
      } = getIndexesByKeys(state, rowKeyValue, colKeyValue);

      if (colIndex === 0 && canBeRowNavigationMode(state)) {
        moveFromCellToRow(element, state);
      } else {
        const nextColIndex = getNextIndexLeft(state, colIndex);

        if (nextColIndex === undefined) {
          return;
        }

        const {
          columns
        } = state;
        setBlurActiveCell(element, state); // update activeCell

        state.activeCell = {
          rowKeyValue,
          colKeyValue: generateColKeyValue(columns[nextColIndex], nextColIndex)
        };
        setFocusActiveCell(element, state, NAVIGATION_DIR.LEFT);
      }
    }

    function reactToArrowRightOnRow(element, state, event) {
      const {
        rowKeyValue,
        rowHasChildren,
        rowExpanded
      } = event.detail; // check if row needs to be expanded
      // expand row if has children and is collapsed
      // otherwise make this.state.rowMode = false
      // move tabindex 0 to first cell in the row and focus there

      if (rowHasChildren && !rowExpanded) {
        fireRowToggleEvent.call(this, rowKeyValue, rowExpanded);
      } else {
        moveFromRowToCell(element, state);
      }
    }

    function reactToArrowLeftOnRow(element, state, event) {
      const {
        rowKeyValue,
        rowHasChildren,
        rowExpanded,
        rowLevel
      } = event.detail; // check if row needs to be collapsed
      // if not go to parent and focus there

      if (rowHasChildren && rowExpanded) {
        fireRowToggleEvent.call(this, rowKeyValue, rowExpanded);
      } else if (rowLevel > 1) {
        const treeColumn = getStateTreeColumn(state);

        if (treeColumn) {
          const colKeyValue = treeColumn.colKeyValue;
          const {
            rowIndex
          } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
          const parentIndex = getRowParent(state, rowLevel, rowIndex);

          if (parentIndex !== -1) {
            const rows = getRows(state);
            setBlurActiveRow(element, state); // update activeCell for the row

            state.activeCell = {
              rowKeyValue: rows[parentIndex].key,
              colKeyValue
            };
            setFocusActiveRow(element, state);
          }
        }
      }
    }

    function reactToArrowDownOnRow(element, state, event) {
      // move tabindex 0 one row down
      const {
        rowKeyValue
      } = event.detail;
      const treeColumn = getStateTreeColumn(state);
      event.detail.keyEvent.stopPropagation();
      event.detail.keyEvent.preventDefault();

      if (treeColumn) {
        const colKeyValue = treeColumn.colKeyValue;
        const {
          rowIndex
        } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
        const nextRowIndex = getNextIndexDownWrapped(state, rowIndex);
        const {
          rows
        } = state;

        if (nextRowIndex !== -1) {
          setBlurActiveRow(element, state); // update activeCell for the row

          state.activeCell = {
            rowKeyValue: rows[nextRowIndex].key,
            colKeyValue
          };
          setFocusActiveRow(element, state);
        }
      }
    }

    function reactToArrowUpOnRow(element, state, event) {
      // move tabindex 0 one row down
      // move tabindex 0 one row down
      const {
        rowKeyValue
      } = event.detail;
      const treeColumn = getStateTreeColumn(state);
      event.detail.keyEvent.stopPropagation();
      event.detail.keyEvent.preventDefault();

      if (treeColumn) {
        const colKeyValue = treeColumn.colKeyValue;
        const {
          rowIndex
        } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
        const prevRowIndex = getNextIndexUpWrapped(state, rowIndex);
        const {
          rows
        } = state;

        if (prevRowIndex !== -1) {
          setBlurActiveRow(element, state); // update activeCell for the row

          state.activeCell = {
            rowKeyValue: rows[prevRowIndex].key,
            colKeyValue
          };
          setFocusActiveRow(element, state);
        }
      }
    }

    function moveFromCellToRow(element, state) {
      setBlurActiveCell(element, state);
      setRowNavigationMode(state);
      setFocusActiveRow(element, state);
    }

    function moveFromRowToCell(element, state) {
      setBlurActiveRow(element, state);
      unsetRowNavigationMode(state);
      setFocusActiveCell(element, state, NAVIGATION_DIR.USE_CURRENT);
    }

    function reactToTabRight(element, state) {
      const {
        nextRowIndex,
        nextColIndex
      } = getNextTabIndex(state, 'RIGHT');
      const {
        columns,
        rows
      } = state;
      setBlurActiveCell(element, state); // update activeCell

      state.activeCell = {
        rowKeyValue: nextRowIndex !== -1 ? rows[nextRowIndex].key : 'HEADER',
        colKeyValue: generateColKeyValue(columns[nextColIndex], nextColIndex)
      };
      setFocusActiveCell(element, state, NAVIGATION_DIR.RIGHT, {
        action: 'tab'
      });
    }
    function reactToTabLeft(element, state) {
      const {
        nextRowIndex,
        nextColIndex
      } = getNextTabIndex(state, 'LEFT');
      const {
        columns,
        rows
      } = state;
      setBlurActiveCell(element, state); // update activeCell

      state.activeCell = {
        rowKeyValue: nextRowIndex !== -1 ? rows[nextRowIndex].key : 'HEADER',
        colKeyValue: generateColKeyValue(columns[nextColIndex], nextColIndex)
      };
      setFocusActiveCell(element, state, NAVIGATION_DIR.LEFT, {
        action: 'tab'
      });
    }

    function reactToArrowDown(element, state, event) {
      const {
        rowKeyValue,
        colKeyValue
      } = event.detail;
      const {
        rowIndex
      } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
      const nextRowIndex = getNextIndexDown(state, rowIndex);
      const {
        rows
      } = state;

      if (nextRowIndex === undefined) {
        return;
      }

      if (state.hideTableHeader && nextRowIndex === -1) {
        return;
      }

      if (event.detail.keyEvent) {
        event.detail.keyEvent.stopPropagation();
      }

      setBlurActiveCell(element, state); // update activeCell

      state.activeCell = {
        rowKeyValue: nextRowIndex !== -1 ? rows[nextRowIndex].key : 'HEADER',
        colKeyValue
      };
      setFocusActiveCell(element, state, NAVIGATION_DIR.USE_CURRENT);
    }

    function reactToArrowUp(element, state, event) {
      const {
        rowKeyValue,
        colKeyValue
      } = event.detail;
      const {
        rowIndex
      } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
      const nextRowIndex = getNextIndexUp(state, rowIndex);
      const {
        rows
      } = state;

      if (nextRowIndex === undefined) {
        return;
      }

      if (state.hideTableHeader && nextRowIndex === -1) {
        return;
      }

      if (event.detail.keyEvent) {
        event.detail.keyEvent.stopPropagation();
      }

      setBlurActiveCell(element, state); // update activeCell

      state.activeCell = {
        rowKeyValue: nextRowIndex !== -1 ? rows[nextRowIndex].key : 'HEADER',
        colKeyValue
      };
      setFocusActiveCell(element, state, NAVIGATION_DIR.USE_CURRENT);
    }

    function getNextIndexUp(state, rowIndex) {
      return rowIndex === -1 ? undefined : rowIndex - 1;
    }

    function getNextIndexDown(state, rowIndex) {
      const rowsCount = state.rows.length;
      return rowIndex + 1 < rowsCount ? rowIndex + 1 : undefined;
    }

    function getNextIndexRight(state, colIndex) {
      const columnsCount = state.columns.length;
      return columnsCount > colIndex + 1 ? colIndex + 1 : undefined;
    }

    function getNextIndexLeft(state, colIndex) {
      return colIndex > 0 ? colIndex - 1 : undefined;
    }

    function getNextIndexUpWrapped(state, rowIndex) {
      const rowsCount = state.rows.length;
      return rowIndex === 0 ? -1 : rowIndex === -1 ? rowsCount - 1 : rowIndex - 1;
    }

    function getNextIndexDownWrapped(state, rowIndex) {
      const rowsCount = state.rows.length;
      return rowIndex + 1 < rowsCount ? rowIndex + 1 : -1;
    }

    function getNextTabIndexRight(state, rowIndex, colIndex) {
      const columnsCount = state.columns.length;

      if (columnsCount > colIndex + 1) {
        return {
          nextRowIndex: rowIndex,
          nextColIndex: colIndex + 1
        };
      }

      return {
        nextRowIndex: getNextIndexDownWrapped(state, rowIndex),
        nextColIndex: 0
      };
    }

    function getNextTabIndexLeft(state, rowIndex, colIndex) {
      const columnsCount = state.columns.length;

      if (colIndex > 0) {
        return {
          nextRowIndex: rowIndex,
          nextColIndex: colIndex - 1
        };
      }

      return {
        nextRowIndex: getNextIndexUpWrapped(state, rowIndex),
        nextColIndex: columnsCount - 1
      };
    }

    function getRowParent(state, rowLevel, rowIndex) {
      const parentIndex = rowIndex - 1;
      const rows = getRows(state);

      for (let i = parentIndex; i >= 0; i--) {
        if (rows[i].level === rowLevel - 1) {
          return i;
        }
      }

      return -1;
    }

    function stillValidActiveCell(state) {
      const {
        activeCell: {
          rowKeyValue,
          colKeyValue
        }
      } = state;

      if (rowKeyValue === 'HEADER') {
        return !!state.headerIndexes[colKeyValue];
      }

      return !!(state.indexes[rowKeyValue] && state.indexes[rowKeyValue][colKeyValue]);
    }

    function setDefaultActiveCell(state) {
      state.activeCell = getDefaultActiveCell(state);
    }

    function getDefaultActiveCell(state) {
      const {
        columns,
        rows
      } = state;

      if (columns.length > 0) {
        let colIndex;
        const existCustomerColumn = columns.some((column, index) => {
          colIndex = index;
          return isCustomerColumn(column);
        });

        if (!existCustomerColumn) {
          colIndex = 0;
        }

        return {
          rowKeyValue: rows.length > 0 ? rows[0].key : 'HEADER',
          colKeyValue: generateColKeyValue(columns[colIndex], colIndex)
        };
      }

      return undefined;
    }

    function getCellFromIndexes(state, rowIndex, colIndex) {
      const {
        columns,
        rows
      } = state;

      if (columns.length > 0) {
        return {
          rowKeyValue: rowIndex === -1 ? 'HEADER' : rows[rowIndex].key,
          colKeyValue: generateColKeyValue(columns[colIndex], colIndex)
        };
      }

      return undefined;
    }

    function handleCellKeydown(event) {
      event.stopPropagation();
      reactToKeyboard(this.template, this.state, event);
    }
    function handleKeyDown(event) {
      const targetTagName = event.target.tagName.toLowerCase(); // when the event came from the td is cause it has the focus.

      if (targetTagName === 'td' || targetTagName === 'th') {
        reactToKeyboardInNavMode(this.template, this.state, event);
      }
    }
    /**
     * This is needed to check if datatable has lost focus but cell has been clicked recently
     * @param {object} state - datatable state
     */

    const setCellClickedForFocus = function (state) {
      state.cellClicked = true;
    };
    /**
     * Once the dt regains focus there is no need to set this
     *  @param {object} state - datatable state
     */

    const resetCellClickedForFocus = function (state) {
      state.cellClicked = false;
    };
    const handleDatatableLosedFocus = function (event) {
      if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
        const {
          state
        } = this;

        if (state.activeCell) {
          if (state.rowMode) {
            const {
              rowIndex
            } = getIndexesActiveCell(state);
            updateTabIndexRow(state, rowIndex, -1);
          } else {
            const {
              rowIndex,
              colIndex
            } = getIndexesActiveCell(state);
            const cellElement = getCellElementByIndexes(this.template, rowIndex, colIndex); // we need to check because of the tree,
            // at this point it may remove/change the rows/keys because opening or closing a row.

            if (cellElement) {
              cellElement.removeFocusStyles();
              cellElement.parentElement.classList.remove('slds-has-focus');
              cellElement.tabindex = -1;
            }
          }
        }

        state.tabindex = 0;
      }
    };
    const handleDatatableFocusIn = function () {
      const {
        state
      } = this;

      if (!datatableHasFocus(state)) {
        if (!state.rowMode && state.activeCell) {
          const {
            rowIndex,
            colIndex
          } = getIndexesActiveCell(state);
          const cellElement = getCellElementByIndexes(this.template, rowIndex, colIndex); // we need to check because of the tree,
          // at this point it may remove/change the rows/keys because opening or closing a row.

          if (cellElement) {
            cellElement.addFocusStyles();
            cellElement.parentElement.classList.add('slds-has-focus');
            cellElement.tabindex = 0;
          }
        }

        state.tabindex = false;
        resetCellClickedForFocus(state);
      }
    };

    const VALID_EDITABLE_TYPE = {
      text: true,
      percent: true,
      phone: true,
      email: true,
      url: true,
      currency: true,
      number: true,
      boolean: true,
      'date-local': true,
      date: true
    };
    const PANEL_SEL = '[data-iedit-panel="true"]';

    function isEditableType(type) {
      return !!VALID_EDITABLE_TYPE[type];
    }

    function getInlineEditDefaultState() {
      return {
        inlineEdit: {
          dirtyValues: {}
        }
      };
    }
    /**
     * @param {Object} state - Datatable instance.
     * @return {Array} - An array of objects, each object describing the dirty values in the form { colName : dirtyValue }.
     *                   A special key is the { [keyField]: value } pair used to identify the row containing this changed values.
     */

    function getDirtyValues(state) {
      return getChangesForCustomer(state, state.inlineEdit.dirtyValues);
    }
    /**
     * Sets the dirty values in the datatable.
     *
     * @param {Object} state Datatable state for the inline edit.
     * @param {Array} value An array of objects, each object describing the dirty values in the form { colName : dirtyValue }.
     *                      A special key is the { [keyField]: value } pair used to identify the row containing this changed values.
     */

    function setDirtyValues(state, value) {
      const keyField = getKeyField(state);
      const dirtyValues = Array.isArray(value) ? value : [];
      state.inlineEdit.dirtyValues = dirtyValues.reduce((result, rowValues) => {
        const changes = getRowChangesFromCustomer(state, rowValues);
        delete changes[keyField];
        result[rowValues[keyField]] = changes;
        return result;
      }, {});
    }
    function normalizeEditable(column) {
      if (isEditableType(column.type)) {
        column.editable = normalizeBoolean(column.editable);
      } else {
        column.editable = false;
      }
    }
    function hasEditableColumn(columns) {
      return columns.some(column => column.editable);
    }
    function isInlineEditTriggered(state) {
      return Object.keys(state.inlineEdit.dirtyValues).length > 0;
    }
    function cancelInlineEdit(dt) {
      dt.state.inlineEdit.dirtyValues = {};
      setErrors(dt.state, {});
      updateRowsAndCellIndexes.call(dt);
    }
    function handleEditCell(event) {
      startPanelPositioning(this, event.target.parentElement);
      const inlineEdit = this.state.inlineEdit;

      if (inlineEdit.isPanelVisible) {
        // A special case when we are trying to open a edit but we have one open. (click on another edit while editing)
        // in this case we will need to process the values before re-open the edit panel with the new values or we may lose the edition.
        processInlineEditFinish(this, 'loosed-focus', inlineEdit.rowKeyValue, inlineEdit.colKeyValue);
      }

      const {
        rowKeyValue,
        colKeyValue
      } = event.detail;
      inlineEdit.isPanelVisible = true;
      inlineEdit.rowKeyValue = rowKeyValue;
      inlineEdit.colKeyValue = colKeyValue;
      inlineEdit.editedValue = getCellValue(this.state, rowKeyValue, colKeyValue);
      inlineEdit.massEditSelectedRows = getCurrentSelectionLength(this.state);
      inlineEdit.massEditEnabled = isSelectedRow(this.state, rowKeyValue) && inlineEdit.massEditSelectedRows > 1; // pass the column definition

      const colIndex = getStateColumnIndex(this.state, colKeyValue);
      inlineEdit.columnDef = getColumns(this.state)[colIndex];
      markSelectedCell(this.state, rowKeyValue, colKeyValue); // eslint-disable-next-line lwc/no-set-timeout

      setTimeout(() => {
        this.template.querySelector('lightning-primitive-datatable-iedit-panel').focus();
      }, 0);
    }
    function handleInlineEditFinish(event) {
      stopPanelPositioning(this);
      const {
        reason,
        rowKeyValue,
        colKeyValue
      } = event.detail;
      processInlineEditFinish(this, reason, rowKeyValue, colKeyValue);
    }
    function handleMassCheckboxChange(event) {
      const state = this.state;

      if (event.detail.checked) {
        markAllSelectedRowsAsSelectedCell(state);
      } else {
        markAllSelectedRowsAsDeselectedCell(this.state);
        markSelectedCell(state, state.inlineEdit.rowKeyValue, state.inlineEdit.colKeyValue);
      }
    } // hide panel on scroll

    const HIDE_PANEL_THRESHOLD = 5;
    function handleInlineEditPanelScroll(event) {
      const {
        isPanelVisible,
        rowKeyValue,
        colKeyValue
      } = this.state.inlineEdit;

      if (!isPanelVisible) {
        return;
      }

      let delta = 0;
      const container = lwc.unwrap(event).target;

      if (container.classList.contains('slds-scrollable_x')) {
        const scrollX = container.scrollLeft;

        if (this.privateLastScrollX == null) {
          this.privateLastScrollX = scrollX;
        } else {
          delta = Math.abs(this.privateLastScrollX - scrollX);
        }
      } else {
        const scrollY = container.scrollTop;

        if (this.privateLastScrollY == null) {
          this.privateLastScrollY = scrollY;
        } else {
          delta = Math.abs(this.privateLastScrollY - scrollY);
        }
      }

      if (delta > HIDE_PANEL_THRESHOLD) {
        this.privateLastScrollX = null;
        this.privateLastScrollY = null;
        stopPanelPositioning(this);
        processInlineEditFinish(this, 'loosed-focus', rowKeyValue, colKeyValue);
      } else {
        // we want to keep the panel attached to the cell before
        // reaching the threshold and hiding the panel
        repositionPanel(this);
      }
    }
    function getDirtyValue(state, rowKeyValue, colKeyValue) {
      const dirtyValues = state.inlineEdit.dirtyValues;

      if (dirtyValues.hasOwnProperty(rowKeyValue) && dirtyValues[rowKeyValue].hasOwnProperty(colKeyValue)) {
        return dirtyValues[rowKeyValue][colKeyValue];
      }

      return undefined;
    }
    /**
     * Will update the dirty values specified in rowColKeyValues
     *
     * @param {Object} state - state of the datatable
     * @param {Object} rowColKeyValues - An object in the form of { rowKeyValue: { colKeyValue1: value, ..., colKeyValueN: value } ... }
     */

    function updateDirtyValues(state, rowColKeyValues) {
      const dirtyValues = state.inlineEdit.dirtyValues;
      Object.keys(rowColKeyValues).forEach(rowKey => {
        if (!dirtyValues.hasOwnProperty(rowKey)) {
          dirtyValues[rowKey] = {};
        }

        Object.assign(dirtyValues[rowKey], rowColKeyValues[rowKey]);
      });
    }
    /**
     * Returns the current value of the cell, already takes into account the dirty value
     *
     * @param {Object} state - state of the datatable
     * @param {String} rowKeyValue - row key
     * @param {String} colKeyValue - column key
     *
     * @return {Object} the value for the current cell.
     */


    function getCellValue(state, rowKeyValue, colKeyValue) {
      const row = getRowByKey(state, rowKeyValue);
      const colIndex = getStateColumnIndex(state, colKeyValue);
      return row.cells[colIndex].value;
    }
    /**
     *
     * @param {Object} state - Datatable state
     * @param {Object} changes - The internal representation of changes in a row
     * @returns {Object} - the list of customer changes in a row
     */


    function getColumnsChangesForCustomer(state, changes) {
      return Object.keys(changes).reduce((result, colKey) => {
        const columns = getColumns(state);
        const columnIndex = getStateColumnIndex(state, colKey);
        result[columns[columnIndex].fieldName] = changes[colKey];
        return result;
      }, {});
    }

    function getRowChangesFromCustomer(state, changes) {
      return Object.keys(changes).reduce((result, fieldName) => {
        const columns = getColumns(state);
        const columnIndex = getColumnIndexByFieldName(state, fieldName);

        if (columnIndex >= 0) {
          const colKey = columns[columnIndex].colKeyValue;
          result[colKey] = changes[fieldName];
        }

        return result;
      }, {});
    }

    function getChangesForCustomer(state, changes) {
      const keyField = getKeyField(state);
      return Object.keys(changes).reduce((result, rowKey) => {
        const rowChanges = getColumnsChangesForCustomer(state, changes[rowKey]);

        if (Object.keys(rowChanges).length > 0) {
          rowChanges[keyField] = rowKey;
          result.push(rowChanges);
        }

        return result;
      }, []);
    }

    function dispatchCellChangeEvent(dtInstance, cellChange) {
      dtInstance.dispatchEvent(new CustomEvent('cellchange', {
        detail: {
          draftValues: getChangesForCustomer(dtInstance.state, cellChange)
        }
      }));
    }

    function closeInlineEdit(dt) {
      const inlineEditState = dt.state.inlineEdit;

      if (inlineEditState.isPanelVisible) {
        processInlineEditFinish(dt, 'loosed-focus', inlineEditState.rowKeyValue, inlineEditState.colKeyValue);
      }
    }

    function isValidCell(state, rowKeyValue, colKeyValue) {
      const row = getRowByKey(state, rowKeyValue);
      const colIndex = getStateColumnIndex(state, colKeyValue);
      return row && row.cells[colIndex];
    }
    /**
     * It will process when the datatable had finished an edition.
     *
     * @param {Object} dt - the datatable instance
     * @param {string} reason - the reason to finish the edition. valid reasons are: edit-canceled | loosed-focus | tab-pressed | submit-action
     * @param {string} rowKeyValue - the row key of the edited cell
     * @param {string} colKeyValue - the column key of the edited cell
     */


    function processInlineEditFinish(dt, reason, rowKeyValue, colKeyValue) {
      const state = dt.state;
      const inlineEditState = state.inlineEdit;
      const shouldSaveData = reason !== 'edit-canceled' && !(inlineEditState.massEditEnabled && reason === 'loosed-focus') && isValidCell(dt.state, rowKeyValue, colKeyValue);

      if (shouldSaveData) {
        const panel = dt.template.querySelector(PANEL_SEL);
        const editValue = panel.value;
        const isValidEditValue = panel.validity.valid;
        const updateAllSelectedRows = panel.isMassEditChecked;
        const currentValue = getCellValue(state, rowKeyValue, colKeyValue);

        if (isValidEditValue && (editValue !== currentValue || updateAllSelectedRows)) {
          const cellChange = {};
          cellChange[rowKeyValue] = {};
          cellChange[rowKeyValue][colKeyValue] = editValue;

          if (updateAllSelectedRows) {
            const selectedRowKeys = getSelectedRowsKeys(state);
            selectedRowKeys.forEach(rowKey => {
              cellChange[rowKey] = {};
              cellChange[rowKey][colKeyValue] = editValue;
            });
          }

          updateDirtyValues(state, cellChange);
          dispatchCellChangeEvent(dt, cellChange); // @todo: do we need to update all rows in the dt or just the one that was modified?

          updateRowsAndCellIndexes.call(dt);
        }
      }

      if (reason !== 'loosed-focus') {
        switch (reason) {
          case 'tab-pressed-next':
            {
              reactToTabRight(dt.template, state);
              break;
            }

          case 'tab-pressed-prev':
            {
              reactToTabLeft(dt.template, state);
              break;
            }

          default:
            {
              setFocusActiveCell(dt.template, state, 0);
            }
        }
      }

      markAllSelectedRowsAsDeselectedCell(state);
      markDeselectedCell(state, rowKeyValue, colKeyValue);
      inlineEditState.isPanelVisible = false;
    }

    function startPanelPositioning(dt, target) {
      requestAnimationFrame(() => {
        // we need to discard previous binding otherwise the panel
        // will retain previous alignment
        stopPanelPositioning(dt);
        dt.privatePositionRelationship = startPositioning(dt, {
          target,
          element: () => dt.template.querySelector(PANEL_SEL).getPositionedElement(),
          align: {
            horizontal: Direction.Left,
            vertical: Direction.Top
          },
          targetAlign: {
            horizontal: Direction.Left,
            vertical: Direction.Top
          },
          autoFlip: true
        });
      });
    }

    function stopPanelPositioning(dt) {
      if (dt.privatePositionRelationship) {
        stopPositioning(dt.privatePositionRelationship);
        dt.privatePositionRelationship = null;
      }
    } // reposition inline edit panel
    // this does not realign the element, so it doesn't fix alignment
    // when size of panel changes


    function repositionPanel(dt) {
      requestAnimationFrame(() => {
        if (dt.privatePositionRelationship) {
          dt.privatePositionRelationship.reposition();
        }
      });
    }

    function markAllSelectedRowsAsSelectedCell(state) {
      const {
        colKeyValue
      } = state.inlineEdit;
      const selectedRowKeys = getSelectedRowsKeys(state);
      selectedRowKeys.forEach(rowKeyValue => {
        markSelectedCell(state, rowKeyValue, colKeyValue);
      });
    }

    function markAllSelectedRowsAsDeselectedCell(state) {
      const {
        colKeyValue
      } = state.inlineEdit;
      const selectedRowKeys = getSelectedRowsKeys(state);
      selectedRowKeys.forEach(rowKeyValue => {
        markDeselectedCell(state, rowKeyValue, colKeyValue);
      });
    }

    var rowActionsDefaultAriaLabel = 'Actions';

    const i18n$n = {
      rowActionsDefaultAriaLabel
    };
    function getColumnsDefaultState() {
      return {
        columns: []
      };
    }
    function getColumns(state) {
      return state.columns;
    }
    function hasColumns(state) {
      return getColumns(state).length > 0;
    }
    const SELECTABLE_ROW_CHECKBOX = 'SELECTABLE_CHECKBOX';
    const SELECTABLE_COLUMN = {
      type: SELECTABLE_ROW_CHECKBOX,
      fixedWidth: 32,
      tabIndex: -1,
      internal: true
    };
    function normalizeColumns(state, columns, types) {
      if (columns.length !== 0) {
        let firstColumnForReaders = 0; // workaround https://git.soma.salesforce.com/raptor/raptor/issues/763

        const normalizedColumns = Object.assign([], columns);

        if (!state.hideCheckboxColumn) {
          firstColumnForReaders++;
          normalizedColumns.unshift(SELECTABLE_COLUMN);
        }

        if (hasRowNumberColumn(state) || hasEditableColumn(columns)) {
          firstColumnForReaders++;
          normalizedColumns.unshift(getRowNumberColumnDef());
        }

        state.columns = normalizedColumns.map((column, index) => {
          const normalizedColumn = Object.assign(getColumnDefaults(column), column);
          normalizedColumn.ariaLabel = normalizedColumn.label || normalizedColumn.ariaLabel || null;

          if (isCustomerColumn(normalizedColumn)) {
            normalizeColumnDataType(normalizedColumn, types);
            normalizeEditable(normalizedColumn);
            updateColumnSortingState(normalizedColumn, state);
          }

          if (isTreeType(normalizedColumn.type)) {
            normalizedColumn.typeAttributes = getNormalizedSubTypeAttribute(normalizedColumn.type, normalizedColumn.typeAttributes);
          }

          return Object.assign(normalizedColumn, {
            tabIndex: -1,
            colKeyValue: generateColKeyValue(normalizedColumn, index),
            isScopeCol: index === firstColumnForReaders
          });
        });
      } else {
        state.columns = [];
      }
    }

    function normalizeColumnDataType(column, types) {
      if (!types.isValidType(column.type)) {
        column.type = getRegularColumnDefaults().type;
      }
    }
    /**
     * Normalizes the subType and subTypeAttributes in the typeAttributes.
     * @param {String} type the type of this column
     * @param {Object} typeAttributes the type attributes of the column
     * @returns {Object} a new typeAttributes object with the sybtype and subTypeAttributes normalized.
     */


    function getNormalizedSubTypeAttribute(type, typeAttributes) {
      const typeAttributesOverrides = {};

      if (!isValidTypeForTree(typeAttributes.subType)) {
        typeAttributesOverrides.subType = getColumnDefaults({
          type
        }).subType;
      }

      if (!typeAttributes.subTypeAttributes) {
        typeAttributesOverrides.subTypeAttributes = {};
      }

      return Object.assign({}, typeAttributes, typeAttributesOverrides);
    }

    function getRegularColumnDefaults() {
      return {
        type: 'text',
        typeAttributes: {},
        cellAttributes: {}
      };
    }

    function getActionColumnDefaults() {
      return {
        fixedWidth: 50,
        resizable: false,
        ariaLabel: i18n$n.rowActionsDefaultAriaLabel
      };
    }

    function getTreeColumnDefaults() {
      return {
        type: 'tree',
        subType: 'text',
        typeAttributes: {},
        cellAttributes: {}
      };
    }

    function getColumnDefaults(column) {
      switch (column.type) {
        case 'action':
          return getActionColumnDefaults();

        case 'tree':
          return getTreeColumnDefaults();

        default:
          return getRegularColumnDefaults();
      }
    }

    function isCustomerColumn(column) {
      return column.internal !== true;
    }
    function getTypeAttributesValues(column) {
      if (isObjectLike(column.typeAttributes)) {
        return column.typeAttributes;
      }

      return {};
    }
    function getSubTypeAttributesValues(column) {
      if (isObjectLike(column.typeAttributes.subTypeAttributes)) {
        return column.typeAttributes.subTypeAttributes;
      }

      return {};
    }
    function getCellAttributesValues(column) {
      if (isObjectLike(column.cellAttributes)) {
        return column.cellAttributes;
      }

      return {};
    }
    /**
     * Return the index in dt.columns (user definition) related to colKeyValue.
     *      -1 if no column with that key exist or if its internal.
     * @param {Object} state The datatable state
     * @param {String} colKeyValue The generated key for the column
     * @return {Number} The index in dt.columns. -1 if not found or if its internal.
     */

    function getUserColumnIndex(state, colKeyValue) {
      const stateColumnIndex = getStateColumnIndex(state, colKeyValue);
      let internalColumns = 0;

      if (state.columns[stateColumnIndex].internal) {
        return -1;
      }

      for (let i = 0; i < stateColumnIndex; i++) {
        if (state.columns[i].internal) {
          internalColumns++;
        }
      }

      return stateColumnIndex - internalColumns;
    }
    /**
     * Return the index in state.columns (internal definition) related to colKeyValue.
     *
     * @param {Object} state The datatable state
     * @param {String} colKeyValue The generated key for the column
     * @return {number} The index in state.columns.
     */

    function getStateColumnIndex(state, colKeyValue) {
      return state.headerIndexes[colKeyValue];
    }
    /**
     *
     * @param {Object} state - The datatable state
     * @param {String} fieldName - the field name of the column
     * @returns {number} The index in state.columns, -1 if it does not exist
     */

    function getColumnIndexByFieldName(state, fieldName) {
      let i = 0;
      const columns = getColumns(state);
      const existFieldName = columns.some((column, index) => {
        i = index;
        return column.fieldName === fieldName;
      });
      return existFieldName ? i : -1;
    }

    /**
     * It return the default portion of state use it for the resizer
     * @returns {{resizer: {columnWidths: Array}}} - resizer default state
     */

    function getResizerDefaultState() {
      return {
        resizeColumnDisabled: false,
        resizeStep: 10,
        columnWidths: [],
        tableWidth: 0,
        minColumnWidth: 50,
        maxColumnWidth: 1000
      };
    } // *******************************
    // states Getters/Setters
    // *******************************

    /**
     * resizeColumnDisabled
     */

    function isResizeColumnDisabled(state) {
      return state.resizeColumnDisabled;
    }
    function setResizeColumnDisabled(state, value) {
      state.resizeColumnDisabled = normalizeBoolean(value);
    }
    /**
     * resizeStep
     */

    function setResizeStep(state, value) {
      state.resizeStep = normalizePositiveIntegerAttribute('resizeStep', value, getResizerDefaultState().resizeStep);
    }
    function getResizeStep(state) {
      return state.resizeStep;
    }
    /**
     * columnWidths
     */

    /**
     * It return true if there are widths store in the state
     * @param {object} state - table state
     * @returns {boolean} - true if there are widths store in the state
     */

    function hasDefinedColumnsWidths(state) {
      return state.columnWidths.length > 0;
    }
    /**
     * It return the columnsWidths saved in the state
     * @param {object} state - table state
     * @returns {Array|*} - list of column widths
     */

    function getColumnsWidths(state) {
      return state.columnWidths;
    }
    /**
     * It set columnWidths to empty array
     * @param {object} state - table state
     */

    function resetColumnWidths(state) {
      state.columnWidths = [];
    }
    /**
     * tableWidth
     */

    /**
     * Get the full width of table
     * @param {object} state - table state
     * @returns {number} - table's width
     */

    function getTableWidth(state) {
      return state.tableWidth;
    }

    function setTableWidth(state, tableWidth) {
      state.tableWidth = tableWidth;
    }
    /**
     * minColumnWidth
     */


    function setMinColumnWidth(state, value) {
      state.minColumnWidth = normalizePositiveIntegerAttribute('minColumnWidth', value, getResizerDefaultState().minColumnWidth);
      updateColumnWidthsMetadata(state);
    }
    function getMinColumnWidth(state) {
      return state.minColumnWidth;
    }
    /**
     * maxColumnWidth
     */

    function getMaxColumnWidth(state) {
      return state.maxColumnWidth;
    }
    function setMaxColumnWidth(state, value) {
      state.maxColumnWidth = normalizePositiveIntegerAttribute('maxColumnWidth', value, getResizerDefaultState().maxColumnWidth);
      updateColumnWidthsMetadata(state);
    } // *******************************
    // Logics
    // *******************************

    /**
     * Get the style to match the full width of table
     * @param {object} state - table state
     * @returns {string} - style string
     */

    function getTableWidthStyle(state) {
      return getWidthStyle(getTableWidth(state));
    }
    /**
     * - It adjust the columns in the DOM, based on the table width and width meta in column definitions
     * - It also update the table and scroller container with the expected width
     *
     * @param {node} root - table root element
     * @param {object} state - table state
     */

    const adjustColumnsSize = function (root, state) {
      const widthsMeta = getTotalWidthsMetadata(state);
      const expectedTableWidth = getExpectedTableWidth(state, root, widthsMeta);
      const expectedFlexibleColumnWidth = getFlexibleColumnWidth(widthsMeta, expectedTableWidth);
      let columnsWidthSum = 0;
      resetColumnWidths(state);
      getColumns(state).forEach((column, colIndex) => {
        const width = getColumnWidthFromDef(column) || expectedFlexibleColumnWidth;
        columnsWidthSum += width;
        updateColumnWidth(state, colIndex, width);
      });
      setTableWidth(state, Math.min(expectedTableWidth, columnsWidthSum));
    };
    /**
     * - It adjusts the columns widths from the state
     * - It is used when there are columnwidths in state but the table is hidden with offsetwidth 0
     * - In this case we reset the columns to the width in state
     *
     * @param {object} state - table state
     */

    const adjustColumnsSizeFromState = function (state) {
      const columnsWidths = getColumnsWidths(state);
      let columnsWidthSum = 0;
      getColumns(state).forEach((column, colIndex) => {
        const width = columnsWidths[colIndex];

        if (typeof columnsWidths[colIndex] !== 'undefined') {
          columnsWidthSum += width;
          column.columnWidth = columnsWidths[colIndex];
          column.style = getWidthStyle(columnsWidths[colIndex]);
        }
      });
      setTableWidth(state, columnsWidthSum);
    };

    function getColumnWidthFromDef(column) {
      let resizedWidth;

      if (column.isResized) {
        resizedWidth = column.columnWidth;
      }

      return column.fixedWidth || resizedWidth || column.initialWidth;
    }
    /**
     * It resize a column width
     * @param {object} state - table state
     * @param {number} colIndex - the index of the column based on state.columns
     * @param {number} width - the new width is gonna be applied
     */


    const resizeColumn = function (state, colIndex, width) {
      const column = getColumns(state)[colIndex];
      const columnsWidths = getColumnsWidths(state);
      const currentWidth = columnsWidths[colIndex];
      const {
        minWidth,
        maxWidth
      } = column;
      const newWidth = clamp(width, minWidth, maxWidth);

      if (currentWidth !== newWidth) {
        const newDelta = newWidth - currentWidth;
        setTableWidth(state, getTableWidth(state) + newDelta);
        updateColumnWidth(state, colIndex, newWidth);
        column.isResized = true;
      }
    };
    /**
     * It resize a column width
     * @param {object} state - table state
     * @param {number} colIndex - the index of the column based on state.columns
     * @param {number} widthDelta - the delta that creates the new width
     */

    const resizeColumnWithDelta = function (state, colIndex, widthDelta) {
      const currentWidth = getColumnsWidths(state)[colIndex];
      resizeColumn(state, colIndex, currentWidth + widthDelta);
    };

    function updateColumnWidth(state, colIndex, newWidth) {
      const columnsWidths = getColumnsWidths(state);
      columnsWidths[colIndex] = newWidth;
      const column = getColumns(state)[colIndex];
      column.columnWidth = newWidth;
      column.style = getWidthStyle(newWidth);
    }

    function getExpectedTableWidth(state, root, widthsMeta) {
      const availableWidth = getAvailableWidthFromDom(root);
      const minExpectedTableWidth = getMinExpectedTableWidth(widthsMeta);
      return hasNoFlexibleColumns(widthsMeta) ? minExpectedTableWidth : Math.max(minExpectedTableWidth, availableWidth);
    }
    /**
     * It return the current widths for customer columns
     * @param {object} state - table state
     * @returns {Array} - the widths collection, every element
     * belong to a column with the same index in column prop
     */


    function getCustomerColumnWidths(state) {
      const columns = getColumns(state);
      return columns.reduce((prev, column, index) => {
        if (isCustomerColumn(column)) {
          prev.push(state.columnWidths[index]);
        }

        return prev;
      }, []);
    }
    function updateColumnWidthsMetadata(state) {
      getColumns(state).forEach(col => {
        if (!col.internal) {
          col.minWidth = getMinColumnWidth(state);
          col.maxWidth = getMaxColumnWidth(state);
        }

        if (col.initialWidth) {
          col.initialWidth = clamp(col.initialWidth, col.minWidth, col.maxWidth);
        }
      });
    }
    /**
     * It returns if table is rendered and not hidden
     * @param {node} root - table root element
     * @returns {boolean} - true or false if dt is rendered and not hidden on the page
     */

    function isTableRenderedVisible(root) {
      const CONTAINER_SEL = '.slds-scrollable_y';
      const elem = root.querySelector(CONTAINER_SEL);
      return elem && !!(elem.offsetParent || elem.offsetHeight || elem.offsetWidth);
    }

    function getTotalWidthsMetadata(state) {
      const initial = {
        totalFixedWidth: 0,
        totalFixedColumns: 0,
        totalResizedWidth: 0,
        totalResizedColumns: 0,
        totalFlexibleColumns: 0,
        minColumnWidth: state.minColumnWidth,
        maxColumnWidth: state.maxColumnWidth
      };
      return getColumns(state).reduce((prev, col) => {
        if (col.fixedWidth) {
          prev.totalFixedWidth += col.fixedWidth;
          prev.totalFixedColumns += 1;
        } else if (col.isResized) {
          prev.totalResizedWidth += col.columnWidth;
          prev.totalResizedColumns += 1;
        } else if (col.initialWidth) {
          prev.totalResizedWidth += col.initialWidth;
          prev.totalResizedColumns += 1;
        } else {
          prev.totalFlexibleColumns += 1;
        }

        return prev;
      }, initial);
    }

    function getMinExpectedTableWidth(widthsMeta) {
      const {
        totalFixedWidth,
        totalResizedWidth,
        totalFlexibleColumns,
        minColumnWidth
      } = widthsMeta;
      const minTotalFlexibleWidth = totalFlexibleColumns * minColumnWidth;
      return minTotalFlexibleWidth + totalFixedWidth + totalResizedWidth;
    }

    function getFlexibleColumnWidth(widthsMeta, totalTableWidth) {
      const {
        totalFixedWidth,
        totalResizedWidth,
        totalFlexibleColumns,
        minColumnWidth,
        maxColumnWidth
      } = widthsMeta;
      const totalFlexibleWidth = totalTableWidth - totalFixedWidth - totalResizedWidth;
      const avgFlexibleColumnWidth = Math.floor(totalFlexibleWidth / totalFlexibleColumns);
      const allowedSpace = Math.max(avgFlexibleColumnWidth, minColumnWidth);
      return Math.min(maxColumnWidth, allowedSpace);
    }

    function hasNoFlexibleColumns(widthsMeta) {
      return widthsMeta.totalFlexibleColumns === 0;
    }
    /**
     * Get width of dom element.
     * @param  {node} element - target dom element
     * @returns {number} - integer width of element
     */


    function getDomWidth(element) {
      return element.offsetWidth;
    }

    const CONTAINER_SEL = '.slds-scrollable_x';

    function getAvailableWidthFromDom(root) {
      return getDomWidth(root.querySelector(CONTAINER_SEL));
    }

    function getWidthStyle(pixels) {
      return pixels > 0 ? `width:${pixels}px` : '';
    }

    var labelRowLevelErrorAssistiveText = '{0} has {1} errors';

    const CHAR_WIDTH = 10;
    const COLUMN_TYPE = 'rowNumber';
    const i18n$o = {
      rowLevelErrorAssistiveText: labelRowLevelErrorAssistiveText
    };
    function isRowNumberColumn(column) {
      return column.type === COLUMN_TYPE;
    }
    function getRowNumberColumnDef() {
      return {
        type: COLUMN_TYPE,
        sortable: false,
        initialWidth: 52,
        minWidth: 52,
        maxWidth: 1000,
        tabIndex: -1,
        internal: true,
        resizable: false
      };
    }
    function getRowNumberState() {
      return {
        showRowNumberColumn: false,
        rowNumberOffset: 0
      };
    }
    /**
     * showRowNumberColumn
     */

    function hasRowNumberColumn(state) {
      return state.showRowNumberColumn;
    }
    function setShowRowNumberColumn(state, value) {
      state.showRowNumberColumn = normalizeBoolean(value);
    }
    /**
     * rowNumberOffset
     */

    function getRowNumberOffset(state) {
      return state.rowNumberOffset;
    }
    function setRowNumberOffset(state, value) {
      state.rowNumberOffset = normalizePositiveIntegerAttribute('rowNumberOffset', value, getRowNumberState().rowNumberOffset);
    }
    /**
     * Functions to adjusting row number column width
     */

    function adjustRowNumberColumnWidth(root, state) {
      const colIndex = getRowNumberColumnIndex(state);

      if (colIndex > -1) {
        const rowNumberCol = getColumns(state)[colIndex];
        const newWidth = getAdjustedRowNumberColumnWidth(state);

        if (rowNumberCol.initialWidth !== newWidth) {
          rowNumberCol.initialWidth = Math.max(newWidth, rowNumberCol.minWidth);

          if (hasDefinedColumnsWidths(state)) {
            // when columns are resized with the resizer, a horizontal scroller appears.
            // adjusting the columns size, will respect widths already set and try to fit this column
            adjustColumnsSize(root, state);
          }
        }
      }
    }

    function getAdjustedRowNumberColumnWidth(state) {
      const numOfRows = state.rows.length;
      const offset = state.rowNumberOffset;
      const numberOfChars = String(numOfRows + offset).length;
      return CHAR_WIDTH * numberOfChars + 12
      /* padding */
      + 20
      /* primitive-tootlip */
      ;
    }

    function getRowNumberColumnIndex(state) {
      if (hasRowNumberColumn(state) && hasColumns(state)) {
        const columns = getColumns(state);

        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];

          if (column.type === COLUMN_TYPE) {
            return i;
          }
        }
      }

      return -1;
    }

    function formatString$1(str, ...args) {
      if (str) {
        return str.replace(/{(\d+)}/g, (match, i) => {
          return typeof args[i] !== 'undefined' ? args[i] : match;
        });
      }

      return '';
    }

    function getRowNumberErrorColumnDef(rowErrors, rowTitle) {
      const {
        title,
        messages
      } = rowErrors;
      const alternativeText = formatString$1(i18n$o.rowLevelErrorAssistiveText, rowTitle || '', rowErrors.fieldNames ? rowErrors.fieldNames.length : '');
      return {
        type: COLUMN_TYPE,
        typeAttributes: {
          error: {
            title,
            messages,
            alternativeText
          }
        }
      };
    }

    const wrapableTypes = ['text', 'number', 'currency', 'percent', 'email', 'date', 'phone', 'url', 'location', 'tree'];
    const i18n$p = {
      clipText: labelClipText,
      wrapText: labelWrapText
    };

    function updateCellsWrapperText(state, colIndex, colKeyValue) {
      state.rows.forEach(row => {
        row.cells[colIndex].wrapText = state.wrapText[colKeyValue];
      });
    }

    function updateWrapTextState(state, colKeyValue) {
      const columns = getColumns(state);
      const colIndex = getStateColumnIndex(state, colKeyValue);
      const colData = columns[colIndex];
      colData.actions.internalActions.forEach(action => {
        if (action.name === 'wrap_text') {
          action.checked = state.wrapText[colKeyValue];
        }

        if (action.name === 'clip_text') {
          action.checked = !state.wrapText[colKeyValue];
        }
      });
      updateCellsWrapperText(state, colIndex, colKeyValue); // lets force a refresh on this column, because the wrapText checked value changed.

      colData.actions = Object.assign({}, colData.actions);
    }

    function getActions(state, columnDefinition) {
      const actions = [];

      if (!state.wrapText[columnDefinition.colKeyValue]) {
        // wraptext its off by default.
        state.wrapText[columnDefinition.colKeyValue] = false;
      }

      if (wrapableTypes.indexOf(columnDefinition.type) >= 0) {
        actions.push({
          label: `${i18n$p.wrapText}`,
          title: `${i18n$p.wrapText}`,
          checked: state.wrapText[columnDefinition.colKeyValue],
          name: 'wrap_text'
        });
        actions.push({
          label: `${i18n$p.clipText}`,
          title: `${i18n$p.clipText}`,
          checked: !state.wrapText[columnDefinition.colKeyValue],
          name: 'clip_text'
        });
      }

      return actions;
    }
    function handleTriggeredAction(state, action, colKeyValue) {
      if (action.name === 'wrap_text' || action.name === 'clip_text') {
        // If will change state
        if (state.wrapText[colKeyValue] !== (action.name === 'wrap_text')) {
          state.wrapText[colKeyValue] = action.name === 'wrap_text';
          updateWrapTextState(state, colKeyValue);
        }
      }
    }
    function getDefaultState() {
      return {
        wrapText: {}
      };
    }

    function getInternalActions(state, columnDefinition) {
      const internalActions = []; // just wrapper text for now.

      Array.prototype.push.apply(internalActions, getActions(state, columnDefinition));
      return internalActions;
    }

    function handleInternalTriggeredAction(dt, action, colKeyValue) {
      handleTriggeredAction(dt.state, action, colKeyValue);
    }

    function handleCustomerTriggeredAction(dt, action, colKeyValue) {
      const userColumnIndex = getUserColumnIndex(dt.state, colKeyValue);
      const customerColumnDefinition = dt.columns[userColumnIndex];
      dt.dispatchEvent(new CustomEvent('headeraction', {
        detail: {
          action: lwc.unwrap(action),
          columnDefinition: lwc.unwrap(customerColumnDefinition)
        }
      }));
    }

    function getMenuAlignment(columns, index) {
      const isLastColumn = index === columns.length - 1;
      return isLastColumn || columns[index + 1].type === 'action' ? 'right' : 'left';
    }
    /**
     * Overrides the actions with the internal ones, plus the customer ones.
     *
     * @param {Object} state The state of the datatable.
     */


    function updateHeaderActions(state) {
      const columns = getColumns(state);
      columns.forEach((column, idx) => {
        column.actions = {
          menuAlignment: getMenuAlignment(columns, idx),
          customerActions: Array.isArray(column.actions) ? column.actions : [],
          internalActions: getInternalActions(state, column)
        };
      });
    }
    function handleHeaderActionTriggered(event) {
      const {
        action,
        actionType,
        colKeyValue
      } = event.detail;
      event.stopPropagation();

      if (actionType === 'customer') {
        handleCustomerTriggeredAction(this, action, colKeyValue);
      } else {
        handleInternalTriggeredAction(this, action, colKeyValue);
      }
    }
    function getColumnActionsDefaultState() {
      return Object.assign({}, getDefaultState());
    }
    function handleHeaderActionMenuOpening(event) {
      event.stopPropagation();
      event.preventDefault();
      event.detail.saveContainerPosition(this.getViewableRect());
    }

    const SCROLLABLE_CONTAINER_SEL = '.slds-scrollable_y';
    const SCROLL_ALLOWANCE = 2;
    function getInfiniteLoadingDefaultState() {
      return {
        enableInfiniteLoading: false,
        loadMoreOffset: 20,
        isLoading: false
      };
    }
    function isLoading(state) {
      return state.isLoading;
    }
    function setLoading(state, value) {
      state.isLoading = normalizeBoolean(value);
    }
    function isInfiniteLoadingEnabled(state) {
      return state.enableInfiniteLoading;
    }
    function setInfiniteLoading(state, value) {
      state.enableInfiniteLoading = normalizeBoolean(value);
    }
    function getLoadMoreOffset(state) {
      return state.loadMoreOffset;
    }
    function setLoadMoreOffset(state, value) {
      if (!isPositiveInteger(value)) {
        // eslint-disable-next-line no-console
        console.warn(`The "loadMoreOffset" value passed into lightning:datatable
            is incorrect. "loadMoreOffset" value should be an integer >= 0.`);
      }

      state.loadMoreOffset = isPositiveInteger(value) ? parseInt(value, 10) : getInfiniteLoadingDefaultState().loadMoreOffset;
    }
    function handleLoadMoreCheck(event) {
      if (isLoading(this.state)) {
        return;
      }

      const contentContainer = lwc.unwrap(event).target.firstChild;

      if (!contentContainer) {
        return;
      }

      const offset = getOffsetFromTableEnd(contentContainer);
      const threshold = getLoadMoreOffset(this.state);

      if (offset < threshold) {
        this.dispatchEvent(new CustomEvent('loadmore'));
      }
    }

    function isScrollable(element) {
      // scrollHeight should be greater than clientHeight by some allowance
      return element && element.scrollHeight > element.clientHeight + SCROLL_ALLOWANCE;
    }

    function isScrollerVisible(elem) {
      return elem && !!(elem.offsetParent || elem.offsetHeight || elem.offsetWidth);
    }

    function hasData(root) {
      return root.querySelectorAll('tbody > tr').length > 0;
    }

    function handlePrefetch(root, state) {
      if (!isInfiniteLoadingEnabled(state) || isLoading(state) || !hasData(root)) {
        // dont prefetch if already loading or data is not set yet
        return;
      }

      const elem = root.querySelector(SCROLLABLE_CONTAINER_SEL);

      if (isScrollerVisible(elem) && !isScrollable(elem)) {
        this.dispatchEvent(new CustomEvent('loadmore'));
      }
    }

    function getOffsetFromTableEnd(el) {
      return el.scrollHeight - el.parentNode.scrollTop - el.parentNode.clientHeight;
    }

    function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }

    function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    const DEFAULTS = _objectSpread$1({}, getColumnsDefaultState(), getRowsDefaultState(), getSelectorDefaultState(), {
      headerIndexes: {}
    }, getKeyboardDefaultState(), {
      normalized: false
    }, getColumnActionsDefaultState(), getSortDefaultState(), getRowNumberState(), getResizerDefaultState(), getInfiniteLoadingDefaultState(), getInlineEditDefaultState(), getErrorsState(), {
      hideTableHeader: false
    });

    const getDefaultState$1 = function () {
      return JSON.parse(JSON.stringify(DEFAULTS));
    };
    /**
     * It generate headerIndexes based in the current metadata
     * headerIndexes represent the position of the header(column)
     * based on the unique colKeyValue
     * @param {object} columns - the current normalized column metadata
     * @returns {object} headerIndexes e.g. { 'name-text' 0, 'amount-number': 1 }
     */

    const generateHeaderIndexes = function (columns) {
      return columns.reduce((prev, col, index) => {
        prev[generateColKeyValue(col, index)] = index;
        return prev;
      }, {});
    };

    /**
     *
     * @param {CustomEvent} event - row action
     */

    function handleRowActionTriggered(event) {
      const {
        rowKeyValue,
        colKeyValue,
        action
      } = event.detail;
      const selectedRow = getUserRowByCellKeys(this.state, rowKeyValue, colKeyValue);
      event.stopPropagation();
      this.dispatchEvent(new CustomEvent('rowaction', {
        detail: {
          row: lwc.unwrap(selectedRow),
          action: lwc.unwrap(action)
        }
      }));
    }
    /**
     *
     * @param {CustomEvent} event - load dynamic actions
     */

    function handleLoadDynamicActions(event) {
      const {
        rowKeyValue,
        colKeyValue,
        actionsProviderFunction,
        doneCallback,
        saveContainerPosition
      } = event.detail;
      const selectedRow = getUserRowByCellKeys(this.state, rowKeyValue, colKeyValue);
      saveContainerPosition(this.getViewableRect());
      event.stopPropagation();
      actionsProviderFunction(lwc.unwrap(selectedRow), doneCallback);
    }
    /**
     *
     * @param {CustomEvent} event - fire `rowaction` on cell-button click
     */

    function handleCellButtonClick(event) {
      event.stopPropagation();
      const {
        rowKeyValue,
        colKeyValue
      } = event.detail;
      const row = getUserRowByCellKeys(this.state, rowKeyValue, colKeyValue);
      const userColumnIndex = getUserColumnIndex(this.state, colKeyValue);
      const userColumnDefinition = this._columns[userColumnIndex];
      this.dispatchEvent(new CustomEvent('rowaction', {
        detail: {
          row: lwc.unwrap(row),
          action: lwc.unwrap(userColumnDefinition.typeAttributes)
        }
      }));
    }

    /**
     * Based on Marc J. Schmidt library: https://github.com/marcj/css-element-queries/blob/master
     */
    class EventQueue {
      constructor() {
        this.q = [];
      }

      add(ev) {
        this.q.push(ev);
      }

      call(sizeInfo) {
        for (let i = 0, j = this.q.length; i < j; i++) {
          this.q[i].call(this, sizeInfo);
        }
      }

      remove(ev) {
        const newQueue = [];

        for (let i = 0, j = this.q.length; i < j; i++) {
          if (this.q[i] !== ev) {
            newQueue.push(this.q[i]);
          }
        }

        this.q = newQueue;
      }

      length() {
        return this.q.length;
      }

    }
    /**
     * Get element size
     * @param {HTMLElement} element - element to return the size.
     * @returns {Object} {width, height}
     */


    function getElementSize(element) {
      const rect = element.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    }

    function createResizeSensor() {
      const resizeSensor = document.createElement('div');
      resizeSensor.dir = 'ltr';
      resizeSensor.className = 'resize-sensor';
      const style = 'position: absolute; left: -10px; top: -10px; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;';
      const styleChild = 'position: absolute; left: 0; top: 0; transition: 0s;';
      resizeSensor.style.cssText = style; // eslint-disable-next-line lwc/no-inner-html

      resizeSensor.innerHTML = `<div class="resize-sensor-expand" style="${style}">` + `<div style="${styleChild}"></div>` + `</div>` + `<div class="resize-sensor-shrink" style="${style}">` + `<div style="${styleChild} width: 200%; height: 200%"></div>` + `</div>`;
      return resizeSensor;
    }
    /**
     *
     * @param {HTMLElement} element - element to listen resize.
     * @param {Function}    resizeListener - resize event listener.
     */


    function attachResizeEvent(element, resizeListener) {
      if (!element) {
        return;
      }

      if (element.resizedAttached) {
        element.resizedAttached.add(resizeListener);
        return;
      }

      element.resizedAttached = new EventQueue();
      element.resizedAttached.add(resizeListener);
      const resizeSensor = createResizeSensor();
      element.resizeSensor = resizeSensor;
      element.appendChild(resizeSensor);
      const position = (window.getComputedStyle(element) || element.style).getPropertyValue('position');

      if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
        element.style.position = 'relative';
      }

      const expand = resizeSensor.childNodes[0];
      const expandChild = expand.childNodes[0];
      const shrink = resizeSensor.childNodes[1];
      let dirty, rafId;
      let size = getElementSize(element);
      let lastWidth = size.width;
      let lastHeight = size.height;
      let initialHiddenCheck = true,
          resetRafId;

      const resetExpandShrink = function () {
        expandChild.style.width = '100000px';
        expandChild.style.height = '100000px';
        expand.scrollLeft = 100000;
        expand.scrollTop = 100000;
        shrink.scrollLeft = 100000;
        shrink.scrollTop = 100000;
      };

      const reset = function () {
        // Check if element is hidden
        if (initialHiddenCheck) {
          if (!expand.scrollTop && !expand.scrollLeft) {
            // reset
            resetExpandShrink(); // Check in next frame

            if (!resetRafId) {
              resetRafId = requestAnimationFrame(() => {
                resetRafId = 0;
                reset();
              });
            }

            return;
          }

          initialHiddenCheck = false;
        }

        resetExpandShrink();
      };

      resizeSensor.resetSensor = reset;

      const onResized = function () {
        rafId = 0;

        if (!dirty) {
          return;
        }

        lastWidth = size.width;
        lastHeight = size.height;

        if (element.resizedAttached) {
          element.resizedAttached.call(size);
        }
      };

      const onScroll = function () {
        size = getElementSize(element);
        dirty = size.width !== lastWidth || size.height !== lastHeight;

        if (dirty && !rafId) {
          rafId = requestAnimationFrame(onResized);
        }

        reset();
      };

      const addEvent = function (el, name, cb) {
        el.addEventListener(name, cb);
      };

      addEvent(expand, 'scroll', onScroll);
      addEvent(shrink, 'scroll', onScroll); // Fix for custom Elements

      requestAnimationFrame(reset);
    }

    function detach(elem, ev) {
      if (!elem) {
        return;
      }

      if (elem.resizedAttached && typeof ev === 'function') {
        elem.resizedAttached.remove(ev);

        if (elem.resizedAttached.length()) {
          return;
        }
      }

      if (elem.resizeSensor) {
        if (elem.contains(elem.resizeSensor)) {
          elem.removeChild(elem.resizeSensor);
        }

        delete elem.resizeSensor;
        delete elem.resizedAttached;
      }
    }

    class ResizeSensor {
      constructor(element, resizeListener) {
        this.targetElement = element;
        this.resizeListener = resizeListener;
        attachResizeEvent(this.targetElement, this.resizeListener);
      }

      detach() {
        detach(this.targetElement, this.resizeListener);
      }

      reset() {
        this.targetElement.resizeSensor.resetSensor();
      }

    }

    const typesMap$1 = new WeakMap();

    class LightningDatatable extends lwc.LightningElement {
      constructor() {
        super();
        this.hasDetachedListeners = true;
        this._columns = [];
        this._hideCheckboxColumn = false;
        this._draftValues = [];
        this.customerSelectedRows = null;
        this.privateDatatableId = generateUniqueId('lgt-datatable');
        this.privateSuppressBottomBar = false;
        this.state = getDefaultState$1();

        if (!typesMap$1.has(this.constructor)) {
          const privateTypes = new DatatableTypes$1(this.constructor.customTypes);
          typesMap$1.set(this.constructor, privateTypes);
        }

        this.updateRowsAndCellIndexes = updateRowsAndCellIndexes.bind(this);
      }

      get privateTypes() {
        return typesMap$1.get(this.constructor);
      }

      set columns(value) {
        this._columns = Array.isArray(value) ? value : [];
        this.updateColumns(this._columns);
      }
      /**
       * Array of the columns object that's used to define the data types.
       * Required properties include 'label', 'fieldName', and 'type'. The default type is 'text'.
       * See the Documentation tab for more information.
       * @type {array}
       */


      get columns() {
        return this._columns;
      }

      set data(value) {
        setData(this.state, value);

        if (hasValidKeyField(this.state)) {
          this.updateRowsState();
        }

        if (this.customerSelectedRows) {
          this.setSelectedRows(this.customerSelectedRows);
        }
      }
      /**
       * The array of data to be displayed.
       * @type {array}
       */


      get data() {
        return getData(this.state);
      }

      set keyField(value) {
        setKeyField(this.state, value);
        setDirtyValues(this.state, this._draftValues);
        this.updateRowsState();
      }
      /**
       * Required for better performance.
       * Associates each row with a unique ID.
       * @type {string}
       * @required
       */


      get keyField() {
        return getKeyField(this.state);
      }

      set hideCheckboxColumn(value) {
        this._hideCheckboxColumn = value;
        this.state.hideCheckboxColumn = normalizeBoolean(value); // update the columns metadata again to update the status.

        this.updateColumns(this._columns);
      }
      /**
       * If present, the checkbox column for row selection is hidden.
       * @type {boolean}
       * @default false
       */


      get hideCheckboxColumn() {
        return this._hideCheckboxColumn;
      }

      set showRowNumberColumn(value) {
        setShowRowNumberColumn(this.state, value);
        this.updateColumns(this._columns);
      }
      /**
       * If present, the row numbers are shown in the first column.
       * @type {boolean}
       * @default false
       */


      get showRowNumberColumn() {
        return hasRowNumberColumn(this.state);
      }

      set rowNumberOffset(value) {
        const {
          state
        } = this;
        setRowNumberOffset(state, value);
        adjustRowNumberColumnWidth(this.template, state);
      }
      /**
       * Determines where to start counting the row number.
       * The default is 0.
       * @type {number}
       * @default 0
       */


      get rowNumberOffset() {
        return getRowNumberOffset(this.state);
      }

      set resizeColumnDisabled(value) {
        setResizeColumnDisabled(this.state, value);
      }
      /**
       * If present, column resizing is disabled.
       * @type {boolean}
       * @default false
       */


      get resizeColumnDisabled() {
        return isResizeColumnDisabled(this.state);
      }

      set minColumnWidth(value) {
        setMinColumnWidth(this.state, value);
      }
      /**
       * The minimum width for all columns.
       * The default is 50px.
       * @type {number}
       * @default 50px
       */


      get minColumnWidth() {
        return getMinColumnWidth(this.state);
      }

      set maxColumnWidth(value) {
        setMaxColumnWidth(this.state, value);
      }
      /**
       * The maximum width for all columns.
       * The default is 1000px.
       * @type {number}
       * @default 1000px
       */


      get maxColumnWidth() {
        return getMaxColumnWidth(this.state);
      }

      set resizeStep(value) {
        setResizeStep(this.state, value);
      }
      /**
       * The width to resize the column when a user presses left or right arrow.
       * The default is 10px.
       * @type {number}
       * @default 10px
       */


      get resizeStep() {
        return getResizeStep(this.state);
      }

      set sortedBy(value) {
        setSortedBy(this.state, value);
        updateSorting(this.state);
      }
      /**
       * The column fieldName that controls the sorting order.
       * Sort the data using the onsort event handler.
       * @type {string}
       */


      get sortedBy() {
        return getSortedBy(this.state);
      }

      set sortedDirection(value) {
        setSortedDirection(this.state, value);
        updateSorting(this.state);
      }
      /**
       * Specifies the sorting direction.
       * Sort the data using the onsort event handler.
       * Valid options include 'asc' and 'desc'.
       * @type {string}
       */


      get sortedDirection() {
        return getSortedDirection(this.state);
      }

      set defaultSortDirection(value) {
        setDefaultSortDirection(this.state, value);
        updateSorting(this.state);
      }
      /**
       * Specifies the default sorting direction on an unsorted column.
       * Valid options include 'asc' and 'desc'.
       * The default is 'asc' for sorting in ascending order.
       * @type {string}
       * @default asc
       */


      get defaultSortDirection() {
        return getDefaultSortDirection(this.state);
      }

      set enableInfiniteLoading(value) {
        setInfiniteLoading(this.state, value);
      }
      /**
       * If present, you can load a subset of data and then display more
       * when users scroll to the end of the table.
       * Use with the onloadmore event handler to retrieve more data.
       * @type {boolean}
       * @default false
       */


      get enableInfiniteLoading() {
        return isInfiniteLoadingEnabled(this.state);
      }

      set loadMoreOffset(value) {
        setLoadMoreOffset(this.state, value);
      }
      /**
       * Determines when to trigger infinite loading based on
       * how many pixels the table's scroll position is from the bottom of the table.
       * The default is 20.
       * @type {number}
       * @default 20
       */


      get loadMoreOffset() {
        return getLoadMoreOffset(this.state);
      }

      set isLoading(value) {
        setLoading(this.state, value);
      }
      /**
       * If present, a spinner is shown to indicate that more data is loading.
       * @type {boolean}
       * @default false
       */


      get isLoading() {
        return isLoading(this.state);
      }

      set maxRowSelection(value) {
        const previousSelectionLenght = getCurrentSelectionLength(this.state);
        setMaxRowSelection(this.state, value);

        if (previousSelectionLenght > 0) {
          this.fireSelectedRowsChange(this.getSelectedRows());
        }
      }
      /**
       * The maximum number of rows that can be selected.
       * Checkboxes are used for selection by default,
       * and radio buttons are used when maxRowSelection is 1.
       * @type {number}
       */


      get maxRowSelection() {
        return getMaxRowSelection(this.state);
      }

      set selectedRows(value) {
        this.customerSelectedRows = value;
        this.setSelectedRows(value);
      }
      /**
       * Enables programmatic row selection with a list of key-field values.
       * @type {list}
       */


      get selectedRows() {
        return getSelectedRowsKeys(this.state);
      }

      set errors(value) {
        setErrors(this.state, value);
        this.updateRowsState();
      }
      /**
       * Specifies an object containing information about cell level, row level, and table level errors.
       * When it's set, error messages are displayed on the table accordingly.
       * @type {object}
       */


      get errors() {
        return getErrors(this.state);
      }
      /**
       * The current values per row that are provided during inline edit.
       * @type {object}
       */


      get draftValues() {
        return getDirtyValues(this.state);
      }

      set draftValues(value) {
        this._draftValues = value;
        setDirtyValues(this.state, value);

        if (hasValidKeyField(this.state)) {
          this.updateRowsAndCellIndexes(this.state);
        }
      }
      /**
       * If present, the table header is hidden.
       * @type {boolean}
       * @default false
       */


      get hideTableHeader() {
        return this.state.hideTableHeader;
      }

      set hideTableHeader(value) {
        this.state.hideTableHeader = !!value;
      }

      get hasValidKeyField() {
        if (hasValidKeyField(this.state)) {
          return true;
        } // eslint-disable-next-line no-console


        console.error(`The "keyField" is a required attribute of lightning:datatable.`);
        return false;
      }

      get showSelectAllCheckbox() {
        return !getHideSelectAllCheckbox(this.state);
      }
      /**
       * If present, the footer that displays the Save and Cancel buttons is hidden during inline editing.
       * @type {boolean}
       * @default false
       */


      get suppressBottomBar() {
        return this.privateSuppressBottomBar;
      }

      set suppressBottomBar(value) {
        this.privateSuppressBottomBar = !!value;
      }

      connectedCallback() {
        const {
          handleResizeColumn,
          handleUpdateColumnSort,
          handleCellFocusByClick,
          handleFalseCellBlur
        } = this;
        this.template.addEventListener('selectallrows', handleSelectAllRows.bind(this));
        this.template.addEventListener('deselectallrows', handleDeselectAllRows.bind(this));
        this.template.addEventListener('selectrow', handleSelectRow.bind(this));
        this.template.addEventListener('deselectrow', handleDeselectRow.bind(this));
        this.addEventListener('rowselection', handleRowSelectionChange.bind(this));
        this.template.addEventListener('resizecol', handleResizeColumn.bind(this));
        this.template.addEventListener('privateupdatecolsort', handleUpdateColumnSort.bind(this));
        this.template.addEventListener('privatecellkeydown', handleCellKeydown.bind(this));
        this.template.addEventListener('privatecellfocusedbyclick', handleCellFocusByClick.bind(this));
        this.template.addEventListener('privatecellfalseblurred', handleFalseCellBlur.bind(this)); // row-level-actions

        this.template.addEventListener('privatecellactiontriggered', handleRowActionTriggered.bind(this));
        this.template.addEventListener('privatecellactionmenuopening', handleLoadDynamicActions.bind(this));
        this.template.addEventListener('privatecellbuttonclicked', handleCellButtonClick.bind(this)); // header-actions

        this.template.addEventListener('privatecellheaderactionmenuopening', handleHeaderActionMenuOpening.bind(this));
        this.template.addEventListener('privatecellheaderactiontriggered', handleHeaderActionTriggered.bind(this)); // inline-edit

        this.template.addEventListener('privateeditcell', handleEditCell.bind(this));
      }

      render() {
        return _tmpl$J;
      }

      handleTrRowKeyDown(event) {
        // we probably should not be doing this unless we actually are interested in it
        if (this.state.keyboardMode === 'NAVIGATION' && this.state.rowMode === true) {
          event.stopPropagation();
          const tr = event.currentTarget;
          const rowKeyValue = tr.getAttribute('data-row-key-value');
          const keyCode = event.keyCode;
          const rowHasChildren = !!tr.getAttribute('aria-expanded');
          const rowExpanded = tr.getAttribute('aria-expanded') === 'true';
          const rowLevel = tr.getAttribute('aria-level');
          const evt = {
            target: tr,
            detail: {
              rowKeyValue,
              keyCode,
              rowHasChildren,
              rowExpanded,
              rowLevel,
              keyEvent: event
            }
          };
          reactToKeyboardOnRow(this, this.state, evt);
        }
      }

      disconnectedCallback() {
        // raptor does the removeEventListeners, so no need to detach them.
        this.hasDetachedListeners = true;
        const resizeTarget = lwc.unwrap(this.template.querySelector('.dt-width-observer'));
        this.privateWidthObserver.detach(resizeTarget);
      }

      renderedCallback() {
        if (this.hasDetachedListeners) {
          this.attachListeners();
        }

        const {
          state
        } = this;

        if (hasColumns(state) && !hasDefinedColumnsWidths(state)) {
          adjustColumnsSize(this.template, state);
          this.fireOnResize();
        }

        handlePrefetch.call(this, this.template, state); // customerSelectedRows is only valid till render, after it, the one used should be the one from the state.

        this.customerSelectedRows = null; // set the previous focused cell to null after render is done

        resetCellToFocusFromPrev(state);
      }

      setSelectedRows(value) {
        setSelectedRowsKeys(this.state, value);
        handleRowSelectionChange.call(this);
      }

      updateRowsState() {
        const {
          state
        } = this; // calculate cell to focus next before indexes are updated

        setCellToFocusFromPrev(state);
        this.updateRowsAndCellIndexes(state);
        adjustRowNumberColumnWidth(this.template, state); // update celltofocus next to null if the row still exists after indexes calculation

        updateCellToFocusFromPrev(state);
        syncSelectedRowsKeys(state, this.getSelectedRows()).ifChanged(selectedRows => this.fireSelectedRowsChange(selectedRows));
        syncActiveCell(state);

        if (state.keyboardMode === 'NAVIGATION') {
          updateTabIndexActiveCell(state);
          updateTabIndexActiveRow(state);
        } // if there is previously focused cell which was deleted set focus from celltofocus next


        if (state.cellToFocusNext) {
          setFocusActiveCell(this.template, this.state);
        }
      }

      updateColumns(columns) {
        const {
          state
        } = this;
        const hadTreeDataTypePreviously = hasTreeDataType(state); // calculate cell to focus next before indexes are updated

        setCellToFocusFromPrev(state);
        normalizeColumns(state, columns, this.privateTypes);
        setDirtyValues(state, this._draftValues);
        updateRowNavigationMode(hadTreeDataTypePreviously, state);
        state.headerIndexes = generateHeaderIndexes(getColumns(state));
        updateHeaderActions(state);
        this.updateRowsAndCellIndexes(state);
        updateSelectionState(state);
        adjustRowNumberColumnWidth(this.template, state);
        updateColumnWidthsMetadata(state); // set the celltofocus next to null if the column still exists after indexes calculation

        updateCellToFocusFromPrev(state);

        if (getColumns(state).length !== getColumnsWidths(state).length) {
          resetColumnWidths(state);

          if (getData(state).length > 0) {
            // when there are column changes, update the active cell
            syncActiveCell(state);
          }
        } else if (hasDefinedColumnsWidths(state)) {
          // try to adjust column size if previous size in the state and table is visible (not hidden)
          if (isTableRenderedVisible(this.template)) {
            adjustColumnsSize(this.template, state);
          } else {
            adjustColumnsSizeFromState(state);
          }
        }

        if (state.keyboardMode === 'NAVIGATION') {
          updateTabIndexActiveCell(state);
          updateTabIndexActiveRow(state);
        } // if there is previously focused cell which was deleted set focus from celltofocus next


        if (state.cellToFocusNext) {
          setFocusActiveCell(this.template, this.state);
        }
      }

      get computedTableHeaderClass() {
        if (this.state.hideTableHeader) {
          return 'slds-assistive-text';
        }

        return undefined;
      }

      get computedScrollerStyle() {
        return getTableWidthStyle(this.state);
      }

      get computedTableClass() {
        return classSet('slds-table slds-table_header-fixed slds-table_bordered slds-table_edit').add({
          'slds-table_resizable-cols': this.hasResizebleColumns
        }).add({
          'slds-tree slds-table_tree': hasTreeDataType(this.state)
        }).toString();
      }

      get computedTableRole() {
        return hasTreeDataType(this.state) ? 'treegrid' : 'grid';
      }

      get computedTableStyle() {
        return ['table-layout:fixed', getTableWidthStyle(this.state)].join(';');
      }

      get computedTbodyStyle() {
        if (hasRowNumberColumn(this.state) && getRowNumberOffset(this.state) >= 0) {
          return 'counter-reset: row-number ' + getRowNumberOffset(this.state);
        }

        return '';
      }

      get hasSelectableRows() {
        return !this.state.hideCheckboxColumn;
      }

      get hasResizebleColumns() {
        return !isResizeColumnDisabled(this.state);
      }

      get numberOfColumns() {
        return getColumns(this.state).length;
      }

      get showLoadingIndicator() {
        return isLoading(this.state);
      }

      get scrollerXStyles() {
        const styles = {
          height: '100%'
        };

        if (this.showStatusBar) {
          styles['padding-bottom'] = '3rem';
        }

        return Object.entries(styles).map(([key, value]) => key + ':' + value).join(';');
      }

      get showStatusBar() {
        return isInlineEditTriggered(this.state) && !this.suppressBottomBar;
      }

      get tableError() {
        return getTableError(this.state);
      }

      handleUpdateColumnSort(event) {
        event.stopPropagation();
        const {
          fieldName,
          sortDirection
        } = event.detail;
        this.fireSortedColumnChange(fieldName, sortDirection);
      }

      handleHorizontalScroll(event) {
        handleInlineEditPanelScroll.call(this, event);
      }

      handleVerticalScroll(event) {
        if (this.enableInfiniteLoading) {
          handleLoadMoreCheck.call(this, event);
        }

        handleInlineEditPanelScroll.call(this, event);
      }

      fireSelectedRowsChange(selectedRows) {
        const event = new CustomEvent('rowselection', {
          detail: {
            selectedRows
          }
        });
        this.dispatchEvent(event);
      }

      fireSortedColumnChange(fieldName, sortDirection) {
        const event = new CustomEvent('sort', {
          detail: {
            fieldName,
            sortDirection
          }
        });
        this.dispatchEvent(event);
      }

      fireOnResize() {
        const event = new CustomEvent('resize', {
          detail: {
            columnWidths: getCustomerColumnWidths(this.state)
          }
        });
        this.dispatchEvent(event);
      }

      handleResizeColumn(event) {
        event.stopPropagation();
        const {
          colIndex,
          widthDelta
        } = event.detail;

        if (widthDelta !== 0) {
          resizeColumnWithDelta(this.state, colIndex, widthDelta);
          this.fireOnResize();
        }
      }

      get tableTabIndex() {
        return this.state.focusIsInside ? '-1' : '0';
      }

      handleTableFocus() {
        // dont modify the state if we can't focus on elements within the table
        if (!this.state.activeCell) {
          return;
        }

        this.state.tabindex = false; // Safari don't like tabindex=-1

        if (this.state.rowMode) {
          setFocusActiveRow(this.template, this.state);
        } else {
          setFocusActiveCell(this.template, this.state, NAVIGATION_DIR.USE_CURRENT);
        }
      }

      handleCellFocusByClick(event) {
        event.stopPropagation();
        const {
          rowKeyValue,
          colKeyValue
        } = event.detail;
        const {
          state
        } = this;

        if (!isActiveCell(state, rowKeyValue, colKeyValue)) {
          if (state.rowMode && state.activeCell) {
            unsetRowNavigationMode(state);
            const {
              rowIndex
            } = getIndexesActiveCell(state);
            updateTabIndexRow(state, rowIndex, -1);
          }

          this.setActiveCell(rowKeyValue, colKeyValue);
        }

        if (!datatableHasFocus(state)) {
          setCellClickedForFocus(state);
        }
      }

      handleCellClick(event) {
        // handles the case when clicking on the margin/pading of the td/th
        const targetTagName = event.target.tagName.toLowerCase();

        if (targetTagName === 'td' || targetTagName === 'th') {
          // get the row/col key value from the primitive cell.
          const {
            rowKeyValue,
            colKeyValue
          } = event.target.querySelector(':first-child');
          const {
            state
          } = this;

          if (state.rowMode || !isActiveCell(state, rowKeyValue, colKeyValue)) {
            if (state.rowMode && state.activeCell) {
              unsetRowNavigationMode(state);
              const {
                rowIndex
              } = getIndexesActiveCell(state);
              updateTabIndexRow(state, rowIndex, -1);
            }

            this.setActiveCell(rowKeyValue, colKeyValue);
          }

          if (!datatableHasFocus(state)) {
            setCellClickedForFocus(state);
          }
        }
      }

      setActiveCell(rowKeyValue, colKeyValue) {
        const {
          template,
          state
        } = this;
        const {
          rowIndex,
          colIndex
        } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
        setBlurActiveCell(template, state);
        updateActiveCell(state, rowKeyValue, colKeyValue);
        addFocusStylesToActiveCell(template, state);
        updateTabIndex(state, rowIndex, colIndex, 0);
      }

      handleFalseCellBlur(event) {
        event.stopPropagation();
        const {
          template,
          state
        } = this;
        const {
          rowKeyValue,
          colKeyValue
        } = event.detail;

        if (!isActiveCell(state, rowKeyValue, colKeyValue)) {
          this.setActiveCell(rowKeyValue, colKeyValue);
        }

        setFocusActiveCell(template, state);
      }
      /**
       * Returns data in each selected row.
       * @returns {array} An array of data in each selected row.
       */


      getSelectedRows() {
        const data = lwc.unwrap(getData(this.state));
        return this.state.rows.reduce((prev, row, index) => {
          if (row.isSelected) {
            prev.push(data[index]);
          }

          return prev;
        }, []);
      }

      attachListeners() {
        const resizeTarget = lwc.unwrap(this.template.querySelector('.dt-width-observer'));
        this.privateWidthObserver = new ResizeSensor(resizeTarget, debounce(() => {
          // since this event handler is debounced, it might be the case that at the time the handler is called,
          // the element is disconnected (this.hasDetachedListeners)
          if (!this.hasDetachedListeners) {
            adjustColumnsSize(this.template, this.state);
          }
        }, 200));
        this.hasDetachedListeners = false;
      }

      handleTableFocusIn(event) {
        handleDatatableFocusIn.call(this, event);
      }

      handleTableFocusOut(event) {
        handleDatatableLosedFocus.call(this, event);
      }
      /**
       * @return {Object} containing the visible dimensions of the table { left, right, top, bottom, }
       */


      getViewableRect() {
        const scrollerX = this.template.querySelector('.slds-scrollable_x').getBoundingClientRect();
        const scrollerY = this.template.querySelector('.slds-scrollable_y').getBoundingClientRect();
        return {
          left: scrollerX.left,
          right: scrollerX.right,
          top: scrollerY.top,
          bottom: scrollerY.bottom
        };
      }

      handleInlineEditFinish(event) {
        handleInlineEditFinish.call(this, event);
      }

      handleMassCheckboxChange(event) {
        handleMassCheckboxChange.call(this, event);
      }

      handleInlineEditSave(event) {
        event.stopPropagation();
        event.preventDefault();
        closeInlineEdit(this);
        const draftValues = this.draftValues;
        this.dispatchEvent(new CustomEvent('save', {
          detail: {
            draftValues
          }
        }));
      }

      handleInlineEditCancel(event) {
        event.stopPropagation();
        event.preventDefault();
        closeInlineEdit(this);
        const customerEvent = new CustomEvent('cancel', {
          cancelable: true
        });
        this.dispatchEvent(customerEvent);

        if (!customerEvent.defaultPrevented) {
          cancelInlineEdit(this);
        }
      }

      handleTableKeydown(event) {
        handleKeyDown.call(this, event);
      }

    }

    lwc.registerDecorators(LightningDatatable, {
      publicProps: {
        columns: {
          config: 3
        },
        data: {
          config: 3
        },
        keyField: {
          config: 3
        },
        hideCheckboxColumn: {
          config: 3
        },
        showRowNumberColumn: {
          config: 3
        },
        rowNumberOffset: {
          config: 3
        },
        resizeColumnDisabled: {
          config: 3
        },
        minColumnWidth: {
          config: 3
        },
        maxColumnWidth: {
          config: 3
        },
        resizeStep: {
          config: 3
        },
        sortedBy: {
          config: 3
        },
        sortedDirection: {
          config: 3
        },
        defaultSortDirection: {
          config: 3
        },
        enableInfiniteLoading: {
          config: 3
        },
        loadMoreOffset: {
          config: 3
        },
        isLoading: {
          config: 3
        },
        maxRowSelection: {
          config: 3
        },
        selectedRows: {
          config: 3
        },
        errors: {
          config: 3
        },
        draftValues: {
          config: 3
        },
        hideTableHeader: {
          config: 3
        },
        suppressBottomBar: {
          config: 3
        }
      },
      publicMethods: ["getSelectedRows"],
      track: {
        privateSuppressBottomBar: 1,
        state: 1
      }
    });

    var _lightningDatatable = lwc.registerComponent(LightningDatatable, {
      tmpl: _tmpl$J
    });

    function tmpl$1e($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        h: api_element
      } = $api;
      return [api_element("div", {
        styleMap: {
          "height": "300px"
        },
        key: 2
      }, [api_custom_element("lightning-datatable", _lightningDatatable, {
        props: {
          "keyField": "id",
          "data": $cmp.data,
          "columns": $cmp.columns
        },
        key: 3
      }, [])])];
    }

    var _tmpl$K = lwc.registerTemplate(tmpl$1e);
    tmpl$1e.stylesheets = [];
    tmpl$1e.stylesheetTokens = {
      hostAttribute: "c-datatable_datatable-host",
      shadowAttribute: "c-datatable_datatable"
    };

    const recordMetadata = {
      name: 'name',
      email: 'email',
      website: 'url',
      amount: 'currency',
      phone: 'phoneNumber',
      closeAt: 'dateInFuture'
    };
    function fetchDataHelper({
      amountOfRecords
    }) {
      return fetch('https://data-faker.herokuapp.com/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          amountOfRecords,
          recordMetadata
        })
      }).then(response => response.json());
    }

    const columns = [{
      label: 'Label',
      fieldName: 'name'
    }, {
      label: 'Website',
      fieldName: 'website',
      type: 'url'
    }, {
      label: 'Phone',
      fieldName: 'phone',
      type: 'phone'
    }, {
      label: 'Balance',
      fieldName: 'amount',
      type: 'currency'
    }, {
      label: 'CloseAt',
      fieldName: 'closeAt',
      type: 'date'
    }];

    class App extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.columns = columns;
        this.data = [];
      }

      async connectedCallback() {
        const data = await fetchDataHelper({
          amountOfRecords: 5
        });
        this.data = data;
      }

    }

    lwc.registerDecorators(App, {
      track: {
        columns: 1,
        data: 1
      }
    });

    var main = lwc.registerComponent(App, {
      tmpl: _tmpl$K
    });

    registerWireService(lwc.register);

        const element = lwc.createElement('c-datatable', { is: main, fallback: true });
        document.querySelector('main').appendChild(element);

}(Engine));
