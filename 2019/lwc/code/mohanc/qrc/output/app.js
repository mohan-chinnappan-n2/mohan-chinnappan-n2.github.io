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
        h: api_element,
        c: api_custom_element
      } = $api;
      return [api_custom_element("lightning-card", _lightningCard, {
        key: 2
      }, [api_element("div", {
        classMap: {
          "qrc": true
        },
        styleMap: {
          "height": "160px",
          "width": "160px"
        },
        key: 3
      }, [])])];
    }

    var _tmpl$4 = lwc.registerTemplate(tmpl$3);
    tmpl$3.stylesheets = [];
    tmpl$3.stylesheetTokens = {
      hostAttribute: "c-qrc_qrc-host",
      shadowAttribute: "c-qrc_qrc"
    };

    /**
     * ```
     *
     * @module qrcode-generator-es6
     */
    //---------------------------------------------------------------------
    //
    // QR Code Generator for JavaScript
    //
    //---------------------------------------------------------------------
    const PAD0 = 0xec;
    const PAD1 = 0x11;
    /**
     * Displays a QR code. Set the code data with `addData` and, call `make` and then call `createSvgTag` or `createImgTag`.
     *
     *
     * @param {integer} typeNumber The minimum QR code type number from 1 to 40.  Using 0 allows any QR code type number.
     * @param {String} errorCorrectionLevel 'L','M','Q','H'
     */

    class qrcode {
      constructor(typeNumber, errorCorrectionLevel) {
        this._typeNumber = typeNumber;
        this._errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
        this._modules = null;
        this._moduleCount = 0;
        this._dataCache = null;
        this._dataList = [];

        this.makeImpl = (test, maskPattern) => {
          this._moduleCount = this._typeNumber * 4 + 17;

          this._modules = function (moduleCount) {
            let modules = new Array(moduleCount);

            for (let row = 0; row < moduleCount; row += 1) {
              modules[row] = new Array(moduleCount);

              for (let col = 0; col < moduleCount; col += 1) {
                modules[row][col] = null;
              }
            }

            return modules;
          }(this._moduleCount);

          this.setupPositionProbePattern(0, 0);
          this.setupPositionProbePattern(this._moduleCount - 7, 0);
          this.setupPositionProbePattern(0, this._moduleCount - 7);
          this.setupPositionAdjustPattern();
          this.setupTimingPattern();
          this.setupTypeInfo(test, maskPattern);

          if (this._typeNumber >= 7) {
            this.setupTypeNumber(test);
          }

          if (this._dataCache == null) {
            this._dataCache = this.createData(this._typeNumber, this._errorCorrectionLevel, this._dataList);
          }

          this.mapData(this._dataCache, maskPattern);
        };

        this.setupPositionProbePattern = (row, col) => {
          for (let r = -1; r <= 7; r += 1) {
            if (row + r <= -1 || this._moduleCount <= row + r) continue;

            for (let c = -1; c <= 7; c += 1) {
              if (col + c <= -1 || this._moduleCount <= col + c) continue;

              if (0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4) {
                this._modules[row + r][col + c] = true;
              } else {
                this._modules[row + r][col + c] = false;
              }
            }
          }
        };

        this.getBestMaskPattern = () => {
          let minLostPoint = 0;
          let pattern = 0;

          for (let i = 0; i < 8; i += 1) {
            this.makeImpl(true, i);
            let lostPoint = QRUtil.getLostPoint(this);

            if (i == 0 || minLostPoint > lostPoint) {
              minLostPoint = lostPoint;
              pattern = i;
            }
          }

          return pattern;
        };

        this.setupTimingPattern = () => {
          for (let r = 8; r < this._moduleCount - 8; r += 1) {
            if (this._modules[r][6] != null) {
              continue;
            }

            this._modules[r][6] = r % 2 == 0;
          }

          for (let c = 8; c < this._moduleCount - 8; c += 1) {
            if (this._modules[6][c] != null) {
              continue;
            }

            this._modules[6][c] = c % 2 == 0;
          }
        };

        this.setupPositionAdjustPattern = () => {
          let pos = QRUtil.getPatternPosition(this._typeNumber);

          for (let i = 0; i < pos.length; i += 1) {
            for (let j = 0; j < pos.length; j += 1) {
              let row = pos[i];
              let col = pos[j];

              if (this._modules[row][col] != null) {
                continue;
              }

              for (let r = -2; r <= 2; r += 1) {
                for (let c = -2; c <= 2; c += 1) {
                  if (r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0) {
                    this._modules[row + r][col + c] = true;
                  } else {
                    this._modules[row + r][col + c] = false;
                  }
                }
              }
            }
          }
        };

        this.setupTypeNumber = test => {
          let bits = QRUtil.getBCHTypeNumber(this._typeNumber);

          for (let i = 0; i < 18; i += 1) {
            const mod = !test && (bits >> i & 1) == 1;
            this._modules[Math.floor(i / 3)][i % 3 + this._moduleCount - 8 - 3] = mod;
          }

          for (let i = 0; i < 18; i += 1) {
            const mod = !test && (bits >> i & 1) == 1;
            this._modules[i % 3 + this._moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
          }
        };

        this.setupTypeInfo = (test, maskPattern) => {
          let data = this._errorCorrectionLevel << 3 | maskPattern;
          let bits = QRUtil.getBCHTypeInfo(data); // vertical

          for (let i = 0; i < 15; i += 1) {
            const mod = !test && (bits >> i & 1) == 1;

            if (i < 6) {
              this._modules[i][8] = mod;
            } else if (i < 8) {
              this._modules[i + 1][8] = mod;
            } else {
              this._modules[this._moduleCount - 15 + i][8] = mod;
            }
          } // horizontal


          for (let i = 0; i < 15; i += 1) {
            const mod = !test && (bits >> i & 1) == 1;

            if (i < 8) {
              this._modules[8][this._moduleCount - i - 1] = mod;
            } else if (i < 9) {
              this._modules[8][15 - i - 1 + 1] = mod;
            } else {
              this._modules[8][15 - i - 1] = mod;
            }
          } // fixed module


          this._modules[this._moduleCount - 8][8] = !test;
        };

        this.mapData = (data, maskPattern) => {
          let inc = -1;
          let row = this._moduleCount - 1;
          let bitIndex = 7;
          let byteIndex = 0;
          let maskFunc = QRUtil.getMaskFunction(maskPattern);

          for (let col = this._moduleCount - 1; col > 0; col -= 2) {
            if (col == 6) col -= 1;

            while (true) {
              for (let c = 0; c < 2; c += 1) {
                if (this._modules[row][col - c] == null) {
                  let dark = false;

                  if (byteIndex < data.length) {
                    dark = (data[byteIndex] >>> bitIndex & 1) == 1;
                  }

                  let mask = maskFunc(row, col - c);

                  if (mask) {
                    dark = !dark;
                  }

                  this._modules[row][col - c] = dark;
                  bitIndex -= 1;

                  if (bitIndex == -1) {
                    byteIndex += 1;
                    bitIndex = 7;
                  }
                }
              }

              row += inc;

              if (row < 0 || this._moduleCount <= row) {
                row -= inc;
                inc = -inc;
                break;
              }
            }
          }
        };

        this.createBytes = (buffer, rsBlocks) => {
          let offset = 0;
          let maxDcCount = 0;
          let maxEcCount = 0;
          let dcdata = new Array(rsBlocks.length);
          let ecdata = new Array(rsBlocks.length);

          for (let r = 0; r < rsBlocks.length; r += 1) {
            let dcCount = rsBlocks[r].dataCount;
            let ecCount = rsBlocks[r].totalCount - dcCount;
            maxDcCount = Math.max(maxDcCount, dcCount);
            maxEcCount = Math.max(maxEcCount, ecCount);
            dcdata[r] = new Array(dcCount);

            for (let i = 0; i < dcdata[r].length; i += 1) {
              dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
            }

            offset += dcCount;
            let rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
            let rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);
            let modPoly = rawPoly.mod(rsPoly);
            ecdata[r] = new Array(rsPoly.getLength() - 1);

            for (let i = 0; i < ecdata[r].length; i += 1) {
              let modIndex = i + modPoly.getLength() - ecdata[r].length;
              ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0;
            }
          }

          let totalCodeCount = 0;

          for (let i = 0; i < rsBlocks.length; i += 1) {
            totalCodeCount += rsBlocks[i].totalCount;
          }

          let data = new Array(totalCodeCount);
          let index = 0;

          for (let i = 0; i < maxDcCount; i += 1) {
            for (let r = 0; r < rsBlocks.length; r += 1) {
              if (i < dcdata[r].length) {
                data[index] = dcdata[r][i];
                index += 1;
              }
            }
          }

          for (let i = 0; i < maxEcCount; i += 1) {
            for (let r = 0; r < rsBlocks.length; r += 1) {
              if (i < ecdata[r].length) {
                data[index] = ecdata[r][i];
                index += 1;
              }
            }
          }

          return data;
        };

        this.createData = (typeNumber, errorCorrectionLevel, dataList) => {
          let rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);
          let buffer = qrBitBuffer();

          for (let i = 0; i < dataList.length; i += 1) {
            let data = dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
            data.write(buffer);
          } // calc num max data.


          let totalDataCount = 0;

          for (let i = 0; i < rsBlocks.length; i += 1) {
            totalDataCount += rsBlocks[i].dataCount;
          }

          if (buffer.getLengthInBits() > totalDataCount * 8) {
            throw "code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")";
          } // end code


          if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
            buffer.put(0, 4);
          } // padding


          while (buffer.getLengthInBits() % 8 != 0) {
            buffer.putBit(false);
          } // padding


          while (true) {
            if (buffer.getLengthInBits() >= totalDataCount * 8) {
              break;
            }

            buffer.put(PAD0, 8);

            if (buffer.getLengthInBits() >= totalDataCount * 8) {
              break;
            }

            buffer.put(PAD1, 8);
          }

          return this.createBytes(buffer, rsBlocks);
        };
      }

      addData(data, mode) {
        mode = mode || "Byte";
        let newData = null;

        switch (mode) {
          case "Numeric":
            newData = qrNumber(data);
            break;

          case "Alphanumeric":
            newData = qrAlphaNum(data);
            break;

          case "Byte":
            newData = qr8BitByte(data);
            break;

          case "Kanji":
            newData = qrKanji(data);
            break;

          default:
            throw "mode:" + mode;
        }

        this._dataList.push(newData);

        this._dataCache = null;
      }
      /**
       * @returns {boolean} true if the module at `row, col` is dark.
       */


      isDark(row, col) {
        if (row < 0 || this._moduleCount <= row || col < 0 || this._moduleCount <= col) {
          throw row + "," + col;
        }

        return this._modules[row][col];
      }
      /**
       * @returns {integer} The module count in one dimension of the QR code.  The total number of modules is the square of this value.
       */


      getModuleCount() {
        return this._moduleCount;
      }
      /**
       * Call this when done adding data before getting the generated QR code image.
       */


      make() {
        if (this._typeNumber < 1) {
          let typeNumber = 1;

          for (; typeNumber < 40; typeNumber++) {
            let rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this._errorCorrectionLevel);
            let buffer = qrBitBuffer();

            for (let i = 0; i < this._dataList.length; i++) {
              let data = this._dataList[i];
              buffer.put(data.getMode(), 4);
              buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
              data.write(buffer);
            }

            let totalDataCount = 0;

            for (let i = 0; i < rsBlocks.length; i++) {
              totalDataCount += rsBlocks[i].dataCount;
            }

            if (buffer.getLengthInBits() <= totalDataCount * 8) {
              break;
            }
          }

          this._typeNumber = typeNumber;
        }

        this.makeImpl(false, this.getBestMaskPattern());
      }
      /**
       * @param {Object} args
       * @param {function} [args.drawCell] A callback with arguments `column, row, x, y` to draw a cell.  `x, y` are the coordinates to draw it at.  `c, y` are the QR code module indexes.  Returns the svg element child string for the cell.
       * @param {function} [args.cellColor] A callback which returns the color for the cell.  By default, a function that returns `black`.  Unused if `drawCell` is provided.
       * @param {integer} [args.margin] The margin to draw around the QR code, by number of cells.
       * @param {Object} [args.bg] The background. White by default.
       * @param {boolean} args.bg.enabled Draw a background
       * @param {String} args.bg.fill Fill color of the background
       * @param {Object} [args.obstruction] An image to place in the center of the QR code.
       * @param {integer} args.obstruction.width Width of the obstruction as a percentage of QR code width.
       * @param {integer} args.obstruction.height Height of the obstruction as a percentage of QR code height.
       * @param {String} args.obstruction.path The path of the obstruction image. Exclusive with svgData.
       * @param {String} args.obstruction.svgData The SVG data to embed as an obstruction. Must start with `<svg`. Exclusive with path.
       * @returns {String} An svg tag as a string.
       */


      createSvgTag({
        drawCell,
        cellColor,
        cellSize,
        margin,
        bg,
        obstruction
      }) {
        drawCell = drawCell || ((c, r, x, y) => "<rect " + 'width="' + cellSize + '" ' + 'height="' + cellSize + '" ' + 'x="' + x + '" ' + 'y="' + y + '" ' + 'fill="' + cellColor(c, r) + '" ' + 'shape-rendering="crispEdges" ' + " />");

        cellColor = cellColor || (() => "black");

        cellSize = cellSize || 2;
        margin = typeof margin == "undefined" ? cellSize * 4 : margin;
        let size = this.getModuleCount() * cellSize + margin * 2;
        let qrSvg = "";
        qrSvg += '<svg version="1.1"';
        qrSvg += ' xmlns="http://www.w3.org/2000/svg"';
        qrSvg += ' xmlns:xlink="http://www.w3.org/1999/xlink"';
        qrSvg += ' viewBox="0 0 ' + size + " " + size + '" ';
        qrSvg += ' preserveAspectRatio="xMinYMin meet">';

        if (!bg) {
          bg = {
            enabled: true,
            fill: "white"
          };
        }

        if (bg.enabled) {
          qrSvg += '<rect width="100%" height="100%" fill="' + bg.fill + '" x="0" y="0"/>';
        }

        const modCount = this.getModuleCount();
        const totalSize = modCount * cellSize + margin * 2;
        let obstructionCRStart, obstructionCREnd;

        if (obstruction) {
          const {
            width,
            height
          } = obstruction;
          const spans = [Math.ceil(width * modCount), Math.ceil(height * modCount)];
          obstructionCRStart = spans.map(s => Math.floor(modCount / 2 - s / 2));
          obstructionCREnd = spans.map(s => Math.ceil(modCount / 2 + s / 2));
        }

        for (let r = 0; r < modCount; r += 1) {
          const mr = r * cellSize + margin;

          for (let c = 0; c < modCount; c += 1) {
            const mc = c * cellSize + margin;

            if (obstruction && c >= obstructionCRStart[0] && c < obstructionCREnd[0] && r >= obstructionCRStart[1] && r < obstructionCREnd[1]) {
              if (c == obstructionCRStart[0] && r == obstructionCRStart[1]) {
                const img_attrs = 'x="' + (totalSize * (1.0 - obstruction.width) * 0.5).toFixed(3) + '" ' + 'y="' + (totalSize * (1.0 - obstruction.height) * 0.5).toFixed(3) + '" ' + 'width="' + (totalSize * obstruction.width).toFixed(3) + '" ' + 'height="' + (totalSize * obstruction.height).toFixed(3) + '" ' + 'preserveAspectRatio="xMidYMid meet" ';

                if (obstruction.path) {
                  qrSvg += "<image " + img_attrs + 'xlink:href="' + obstruction.path + '" />';
                } else {
                  qrSvg += "<svg " + img_attrs + obstruction.svgData.substring(4);
                }
              }
            } else if (this.isDark(r, c)) {
              qrSvg += drawCell(c, r, mc, mr);
            }
          }
        }

        qrSvg += "</svg>";
        return qrSvg;
      }
      /**
       * @param {integer} cellSize The size of a module in pixels.
       * @param {integer} margin The margin to draw around the QR code in pixels.
       * @returns {String} An img tag as a string.
       */


      createImgTag(cellSize, margin) {
        cellSize = cellSize || 2;
        margin = typeof margin == "undefined" ? cellSize * 4 : margin;
        let size = this.getModuleCount() * cellSize + margin * 2;
        let min = margin;
        let max = size - margin;
        let self = this;
        return createImgTag(size, size, function (x, y) {
          if (min <= x && x < max && min <= y && y < max) {
            let c = Math.floor((x - min) / cellSize);
            let r = Math.floor((y - min) / cellSize);
            return self.isDark(r, c) ? 0 : 1;
          } else {
            return 1;
          }
        });
      }

    }

    var qrcode$1 = lwc.registerComponent(qrcode, {
      tmpl: _tmpl$1
    });
    /**
     *
     */

    const stringToBytesFuncs = {
      default: function (s) {
        let bytes = [];

        for (let i = 0; i < s.length; i += 1) {
          let c = s.charCodeAt(i);
          bytes.push(c & 0xff);
        }

        return bytes;
      }
    };
    /**
     *
     */

    const stringToBytes = stringToBytesFuncs["default"]; //---------------------------------------------------------------------
    // qrcode.createStringToBytes
    //---------------------------------------------------------------------

    /**
     *
     */

    const QRMode = {
      MODE_NUMBER: 1 << 0,
      MODE_ALPHA_NUM: 1 << 1,
      MODE_8BIT_BYTE: 1 << 2,
      MODE_KANJI: 1 << 3
    };
    /**
     *
     */

    const QRErrorCorrectionLevel = {
      L: 1,
      M: 0,
      Q: 3,
      H: 2
    };
    /**
     *
     */

    const QRMaskPattern = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    }; //---------------------------------------------------------------------
    // QRUtil
    //---------------------------------------------------------------------

    const QRUtil = function () {
      const PATTERN_POSITION_TABLE = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]];
      const G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
      const G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
      const G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
      let _this = {};

      let getBCHDigit = function (data) {
        let digit = 0;

        while (data != 0) {
          digit += 1;
          data >>>= 1;
        }

        return digit;
      };

      _this.getBCHTypeInfo = function (data) {
        let d = data << 10;

        while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
          d ^= G15 << getBCHDigit(d) - getBCHDigit(G15);
        }

        return (data << 10 | d) ^ G15_MASK;
      };

      _this.getBCHTypeNumber = function (data) {
        let d = data << 12;

        while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
          d ^= G18 << getBCHDigit(d) - getBCHDigit(G18);
        }

        return data << 12 | d;
      };

      _this.getPatternPosition = function (typeNumber) {
        return PATTERN_POSITION_TABLE[typeNumber - 1];
      };

      _this.getMaskFunction = function (maskPattern) {
        switch (maskPattern) {
          case QRMaskPattern.PATTERN000:
            return function (i, j) {
              return (i + j) % 2 == 0;
            };

          case QRMaskPattern.PATTERN001:
            return function (i, _) {
              return i % 2 == 0;
            };

          case QRMaskPattern.PATTERN010:
            return function (i, j) {
              return j % 3 == 0;
            };

          case QRMaskPattern.PATTERN011:
            return function (i, j) {
              return (i + j) % 3 == 0;
            };

          case QRMaskPattern.PATTERN100:
            return function (i, j) {
              return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
            };

          case QRMaskPattern.PATTERN101:
            return function (i, j) {
              return i * j % 2 + i * j % 3 == 0;
            };

          case QRMaskPattern.PATTERN110:
            return function (i, j) {
              return (i * j % 2 + i * j % 3) % 2 == 0;
            };

          case QRMaskPattern.PATTERN111:
            return function (i, j) {
              return (i * j % 3 + (i + j) % 2) % 2 == 0;
            };

          default:
            throw "bad maskPattern:" + maskPattern;
        }
      };

      _this.getErrorCorrectPolynomial = function (errorCorrectLength) {
        let a = qrPolynomial([1], 0);

        for (let i = 0; i < errorCorrectLength; i += 1) {
          a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0));
        }

        return a;
      };

      _this.getLengthInBits = function (mode, type) {
        if (1 <= type && type < 10) {
          // 1 - 9
          switch (mode) {
            case QRMode.MODE_NUMBER:
              return 10;

            case QRMode.MODE_ALPHA_NUM:
              return 9;

            case QRMode.MODE_8BIT_BYTE:
              return 8;

            case QRMode.MODE_KANJI:
              return 8;

            default:
              throw "mode:" + mode;
          }
        } else if (type < 27) {
          // 10 - 26
          switch (mode) {
            case QRMode.MODE_NUMBER:
              return 12;

            case QRMode.MODE_ALPHA_NUM:
              return 11;

            case QRMode.MODE_8BIT_BYTE:
              return 16;

            case QRMode.MODE_KANJI:
              return 10;

            default:
              throw "mode:" + mode;
          }
        } else if (type < 41) {
          // 27 - 40
          switch (mode) {
            case QRMode.MODE_NUMBER:
              return 14;

            case QRMode.MODE_ALPHA_NUM:
              return 13;

            case QRMode.MODE_8BIT_BYTE:
              return 16;

            case QRMode.MODE_KANJI:
              return 12;

            default:
              throw "mode:" + mode;
          }
        } else {
          throw "type:" + type;
        }
      };

      _this.getLostPoint = function (qrcode) {
        let moduleCount = qrcode.getModuleCount();
        let lostPoint = 0; // LEVEL1

        for (let row = 0; row < moduleCount; row += 1) {
          for (let col = 0; col < moduleCount; col += 1) {
            let sameCount = 0;
            let dark = qrcode.isDark(row, col);

            for (let r = -1; r <= 1; r += 1) {
              if (row + r < 0 || moduleCount <= row + r) {
                continue;
              }

              for (let c = -1; c <= 1; c += 1) {
                if (col + c < 0 || moduleCount <= col + c) {
                  continue;
                }

                if (r == 0 && c == 0) {
                  continue;
                }

                if (dark == qrcode.isDark(row + r, col + c)) {
                  sameCount += 1;
                }
              }
            }

            if (sameCount > 5) {
              lostPoint += 3 + sameCount - 5;
            }
          }
        } // LEVEL2


        for (let row = 0; row < moduleCount - 1; row += 1) {
          for (let col = 0; col < moduleCount - 1; col += 1) {
            let count = 0;
            if (qrcode.isDark(row, col)) count += 1;
            if (qrcode.isDark(row + 1, col)) count += 1;
            if (qrcode.isDark(row, col + 1)) count += 1;
            if (qrcode.isDark(row + 1, col + 1)) count += 1;

            if (count == 0 || count == 4) {
              lostPoint += 3;
            }
          }
        } // LEVEL3


        for (let row = 0; row < moduleCount; row += 1) {
          for (let col = 0; col < moduleCount - 6; col += 1) {
            if (qrcode.isDark(row, col) && !qrcode.isDark(row, col + 1) && qrcode.isDark(row, col + 2) && qrcode.isDark(row, col + 3) && qrcode.isDark(row, col + 4) && !qrcode.isDark(row, col + 5) && qrcode.isDark(row, col + 6)) {
              lostPoint += 40;
            }
          }
        }

        for (let col = 0; col < moduleCount; col += 1) {
          for (let row = 0; row < moduleCount - 6; row += 1) {
            if (qrcode.isDark(row, col) && !qrcode.isDark(row + 1, col) && qrcode.isDark(row + 2, col) && qrcode.isDark(row + 3, col) && qrcode.isDark(row + 4, col) && !qrcode.isDark(row + 5, col) && qrcode.isDark(row + 6, col)) {
              lostPoint += 40;
            }
          }
        } // LEVEL4


        let darkCount = 0;

        for (let col = 0; col < moduleCount; col += 1) {
          for (let row = 0; row < moduleCount; row += 1) {
            if (qrcode.isDark(row, col)) {
              darkCount += 1;
            }
          }
        }

        let ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;
        return lostPoint;
      };

      return _this;
    }(); //---------------------------------------------------------------------
    // QRMath
    //---------------------------------------------------------------------


    let QRMath = function () {
      let EXP_TABLE = new Array(256);
      let LOG_TABLE = new Array(256); // initialize tables

      for (let i = 0; i < 8; i += 1) {
        EXP_TABLE[i] = 1 << i;
      }

      for (let i = 8; i < 256; i += 1) {
        EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
      }

      for (let i = 0; i < 255; i += 1) {
        LOG_TABLE[EXP_TABLE[i]] = i;
      }

      let _this = {};

      _this.glog = function (n) {
        if (n < 1) {
          throw "glog(" + n + ")";
        }

        return LOG_TABLE[n];
      };

      _this.gexp = function (n) {
        while (n < 0) {
          n += 255;
        }

        while (n >= 256) {
          n -= 255;
        }

        return EXP_TABLE[n];
      };

      return _this;
    }(); //---------------------------------------------------------------------
    // qrPolynomial
    //---------------------------------------------------------------------


    function qrPolynomial(num, shift) {
      if (typeof num.length == "undefined") {
        throw num.length + "/" + shift;
      }

      let _num = function () {
        let offset = 0;

        while (offset < num.length && num[offset] == 0) {
          offset += 1;
        }

        let _num = new Array(num.length - offset + shift);

        for (let i = 0; i < num.length - offset; i += 1) {
          _num[i] = num[i + offset];
        }

        return _num;
      }();

      let _this = {};

      _this.getAt = function (index) {
        return _num[index];
      };

      _this.getLength = function () {
        return _num.length;
      };

      _this.multiply = function (e) {
        let num = new Array(_this.getLength() + e.getLength() - 1);

        for (let i = 0; i < _this.getLength(); i += 1) {
          for (let j = 0; j < e.getLength(); j += 1) {
            num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i)) + QRMath.glog(e.getAt(j)));
          }
        }

        return qrPolynomial(num, 0);
      };

      _this.mod = function (e) {
        if (_this.getLength() - e.getLength() < 0) {
          return _this;
        }

        let ratio = QRMath.glog(_this.getAt(0)) - QRMath.glog(e.getAt(0));
        let num = new Array(_this.getLength());

        for (let i = 0; i < _this.getLength(); i += 1) {
          num[i] = _this.getAt(i);
        }

        for (let i = 0; i < e.getLength(); i += 1) {
          num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio);
        } // recursive call


        return qrPolynomial(num, 0).mod(e);
      };

      return _this;
    } //---------------------------------------------------------------------
    // QRRSBlock
    //---------------------------------------------------------------------


    const QRRSBlock = function () {
      let RS_BLOCK_TABLE = [// L
      // M
      // Q
      // H
      // 1
      [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9], // 2
      [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16], // 3
      [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13], // 4
      [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9], // 5
      [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12], // 6
      [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15], // 7
      [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14], // 8
      [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15], // 9
      [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13], // 10
      [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16], // 11
      [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13], // 12
      [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15], // 13
      [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12], // 14
      [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13], // 15
      [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12, 7, 37, 13], // 16
      [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16], // 17
      [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15], // 18
      [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15], // 19
      [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14], // 20
      [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16], // 21
      [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17], // 22
      [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13], // 23
      [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16], // 24
      [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17], // 25
      [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16], // 26
      [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17], // 27
      [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16], // 28
      [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16], // 29
      [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16], // 30
      [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16], // 31
      [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16], // 32
      [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16], // 33
      [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16], // 34
      [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17], // 35
      [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16], // 36
      [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16], // 37
      [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16], // 38
      [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16], // 39
      [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16], // 40
      [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]];

      let qrRSBlock = function (totalCount, dataCount) {
        let _this = {};
        _this.totalCount = totalCount;
        _this.dataCount = dataCount;
        return _this;
      };

      let _this = {};

      let getRsBlockTable = function (typeNumber, errorCorrectionLevel) {
        switch (errorCorrectionLevel) {
          case QRErrorCorrectionLevel.L:
            return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];

          case QRErrorCorrectionLevel.M:
            return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];

          case QRErrorCorrectionLevel.Q:
            return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];

          case QRErrorCorrectionLevel.H:
            return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];

          default:
            return undefined;
        }
      };

      _this.getRSBlocks = function (typeNumber, errorCorrectionLevel) {
        let rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

        if (typeof rsBlock == "undefined") {
          throw "bad rs block @ typeNumber:" + typeNumber + "/errorCorrectionLevel:" + errorCorrectionLevel;
        }

        let length = rsBlock.length / 3;
        let list = [];

        for (let i = 0; i < length; i += 1) {
          let count = rsBlock[i * 3 + 0];
          let totalCount = rsBlock[i * 3 + 1];
          let dataCount = rsBlock[i * 3 + 2];

          for (let j = 0; j < count; j += 1) {
            list.push(qrRSBlock(totalCount, dataCount));
          }
        }

        return list;
      };

      return _this;
    }(); //---------------------------------------------------------------------
    // qrBitBuffer
    //---------------------------------------------------------------------


    let qrBitBuffer = function () {
      let _buffer = [];
      let _length = 0;
      let _this = {};

      _this.getBuffer = function () {
        return _buffer;
      };

      _this.getAt = function (index) {
        let bufIndex = Math.floor(index / 8);
        return (_buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
      };

      _this.put = function (num, length) {
        for (let i = 0; i < length; i += 1) {
          _this.putBit((num >>> length - i - 1 & 1) == 1);
        }
      };

      _this.getLengthInBits = function () {
        return _length;
      };

      _this.putBit = function (bit) {
        let bufIndex = Math.floor(_length / 8);

        if (_buffer.length <= bufIndex) {
          _buffer.push(0);
        }

        if (bit) {
          _buffer[bufIndex] |= 0x80 >>> _length % 8;
        }

        _length += 1;
      };

      return _this;
    }; //---------------------------------------------------------------------
    // qrNumber
    //---------------------------------------------------------------------


    let qrNumber = function (data) {
      let _mode = QRMode.MODE_NUMBER;
      let _data = data;
      let _this = {};

      _this.getMode = function () {
        return _mode;
      };

      _this.getLength = function (_) {
        return _data.length;
      };

      _this.write = function (buffer) {
        let data = _data;
        let i = 0;

        while (i + 2 < data.length) {
          buffer.put(strToNum(data.substring(i, i + 3)), 10);
          i += 3;
        }

        if (i < data.length) {
          if (data.length - i == 1) {
            buffer.put(strToNum(data.substring(i, i + 1)), 4);
          } else if (data.length - i == 2) {
            buffer.put(strToNum(data.substring(i, i + 2)), 7);
          }
        }
      };

      const strToNum = function (s) {
        let num = 0;

        for (let i = 0; i < s.length; i += 1) {
          num = num * 10 + chatToNum(s.charAt(i));
        }

        return num;
      };

      const chatToNum = function (c) {
        if ("0" <= c && c <= "9") {
          return c.charCodeAt(0) - "0".charCodeAt(0);
        }

        throw "illegal char :" + c;
      };

      return _this;
    }; //---------------------------------------------------------------------
    // qrAlphaNum
    //---------------------------------------------------------------------


    const qrAlphaNum = function (data) {
      let _mode = QRMode.MODE_ALPHA_NUM;
      let _data = data;
      let _this = {};

      _this.getMode = function () {
        return _mode;
      };

      _this.getLength = function (_) {
        return _data.length;
      };

      _this.write = function (buffer) {
        let s = _data;
        let i = 0;

        while (i + 1 < s.length) {
          buffer.put(getCode(s.charAt(i)) * 45 + getCode(s.charAt(i + 1)), 11);
          i += 2;
        }

        if (i < s.length) {
          buffer.put(getCode(s.charAt(i)), 6);
        }
      };

      const getCode = function (c) {
        if ("0" <= c && c <= "9") {
          return c.charCodeAt(0) - "0".charCodeAt(0);
        } else if ("A" <= c && c <= "Z") {
          return c.charCodeAt(0) - "A".charCodeAt(0) + 10;
        } else {
          switch (c) {
            case " ":
              return 36;

            case "$":
              return 37;

            case "%":
              return 38;

            case "*":
              return 39;

            case "+":
              return 40;

            case "-":
              return 41;

            case ".":
              return 42;

            case "/":
              return 43;

            case ":":
              return 44;

            default:
              throw "illegal char :" + c;
          }
        }
      };

      return _this;
    }; //---------------------------------------------------------------------
    // qr8BitByte
    //---------------------------------------------------------------------


    const qr8BitByte = function (data) {
      let _mode = QRMode.MODE_8BIT_BYTE;

      let _bytes = stringToBytes(data);

      let _this = {};

      _this.getMode = function () {
        return _mode;
      };

      _this.getLength = function (_) {
        return _bytes.length;
      };

      _this.write = function (buffer) {
        for (let i = 0; i < _bytes.length; i += 1) {
          buffer.put(_bytes[i], 8);
        }
      };

      return _this;
    }; //---------------------------------------------------------------------
    // qrKanji
    //---------------------------------------------------------------------


    const qrKanji = function (data) {
      let _mode = QRMode.MODE_KANJI;
      let stringToBytes = stringToBytesFuncs["SJIS"];

      {
        throw "sjis not supported.";
      }

      !function (c, code) {
        // self test for sjis support.
        let test = stringToBytes(c);

        if (test.length != 2 || (test[0] << 8 | test[1]) != code) {
          throw "sjis not supported.";
        }
      }("\u53cb", 0x9746);

      let _bytes = stringToBytes(data);

      let _this = {};

      _this.getMode = function () {
        return _mode;
      };

      _this.getLength = function (_) {
        return ~~(_bytes.length / 2);
      };

      _this.write = function (buffer) {
        let data = _bytes;
        let i = 0;

        while (i + 1 < data.length) {
          let c = (0xff & data[i]) << 8 | 0xff & data[i + 1];

          if (0x8140 <= c && c <= 0x9ffc) {
            c -= 0x8140;
          } else if (0xe040 <= c && c <= 0xebbf) {
            c -= 0xc140;
          } else {
            throw "illegal char at " + (i + 1) + "/" + c;
          }

          c = (c >>> 8 & 0xff) * 0xc0 + (c & 0xff);
          buffer.put(c, 13);
          i += 2;
        }

        if (i < data.length) {
          throw "illegal char at " + (i + 1);
        }
      };

      return _this;
    }; //=====================================================================
    // GIF Support etc.
    //
    //---------------------------------------------------------------------
    // byteArrayOutputStream
    //---------------------------------------------------------------------


    let byteArrayOutputStream = function () {
      let _bytes = [];
      let _this = {};

      _this.writeByte = function (b) {
        _bytes.push(b & 0xff);
      };

      _this.writeShort = function (i) {
        _this.writeByte(i);

        _this.writeByte(i >>> 8);
      };

      _this.writeBytes = function (b, off, len) {
        off = off || 0;
        len = len || b.length;

        for (let i = 0; i < len; i += 1) {
          _this.writeByte(b[i + off]);
        }
      };

      _this.writeString = function (s) {
        for (let i = 0; i < s.length; i += 1) {
          _this.writeByte(s.charCodeAt(i));
        }
      };

      _this.toByteArray = function () {
        return _bytes;
      };

      _this.toString = function () {
        let s = "";
        s += "[";

        for (let i = 0; i < _bytes.length; i += 1) {
          if (i > 0) {
            s += ",";
          }

          s += _bytes[i];
        }

        s += "]";
        return s;
      };

      return _this;
    }; //---------------------------------------------------------------------
    // base64EncodeOutputStream
    //---------------------------------------------------------------------


    let base64EncodeOutputStream = function () {
      let _buffer = 0;
      let _buflen = 0;
      let _length = 0;
      let _base64 = "";
      let _this = {};

      let writeEncoded = function (b) {
        _base64 += String.fromCharCode(encode(b & 0x3f));
      };

      const encode = function (n) {
        if (n < 0) ; else if (n < 26) {
          return 0x41 + n;
        } else if (n < 52) {
          return 0x61 + (n - 26);
        } else if (n < 62) {
          return 0x30 + (n - 52);
        } else if (n == 62) {
          return 0x2b;
        } else if (n == 63) {
          return 0x2f;
        }

        throw "n:" + n;
      };

      _this.writeByte = function (n) {
        _buffer = _buffer << 8 | n & 0xff;
        _buflen += 8;
        _length += 1;

        while (_buflen >= 6) {
          writeEncoded(_buffer >>> _buflen - 6);
          _buflen -= 6;
        }
      };

      _this.flush = function () {
        if (_buflen > 0) {
          writeEncoded(_buffer << 6 - _buflen);
          _buffer = 0;
          _buflen = 0;
        }

        if (_length % 3 != 0) {
          // padding
          let padlen = 3 - _length % 3;

          for (let i = 0; i < padlen; i += 1) {
            _base64 += "=";
          }
        }
      };

      _this.toString = function () {
        return _base64;
      };

      return _this;
    }; //---------------------------------------------------------------------
    // gifImage (B/W)
    //---------------------------------------------------------------------


    let gifImage = function (width, height) {
      let _width = width;
      let _height = height;

      let _data = new Array(width * height);

      let _this = {};

      _this.setPixel = function (x, y, pixel) {
        _data[y * _width + x] = pixel;
      };

      _this.write = function (out) {
        //---------------------------------
        // GIF Signature
        out.writeString("GIF87a"); //---------------------------------
        // Screen Descriptor

        out.writeShort(_width);
        out.writeShort(_height);
        out.writeByte(0x80); // 2bit

        out.writeByte(0);
        out.writeByte(0); //---------------------------------
        // Global Color Map
        // black

        out.writeByte(0x00);
        out.writeByte(0x00);
        out.writeByte(0x00); // white

        out.writeByte(0xff);
        out.writeByte(0xff);
        out.writeByte(0xff); //---------------------------------
        // Image Descriptor

        out.writeString(",");
        out.writeShort(0);
        out.writeShort(0);
        out.writeShort(_width);
        out.writeShort(_height);
        out.writeByte(0); //---------------------------------
        // Local Color Map
        //---------------------------------
        // Raster Data

        let lzwMinCodeSize = 2;
        let raster = getLZWRaster(lzwMinCodeSize);
        out.writeByte(lzwMinCodeSize);
        let offset = 0;

        while (raster.length - offset > 255) {
          out.writeByte(255);
          out.writeBytes(raster, offset, 255);
          offset += 255;
        }

        out.writeByte(raster.length - offset);
        out.writeBytes(raster, offset, raster.length - offset);
        out.writeByte(0x00); //---------------------------------
        // GIF Terminator

        out.writeString(";");
      };

      let bitOutputStream = function (out) {
        let _out = out;
        let _bitLength = 0;
        let _bitBuffer = 0;
        let _this = {};

        _this.write = function (data, length) {
          if (data >>> length != 0) {
            throw "length over";
          }

          while (_bitLength + length >= 8) {
            _out.writeByte(0xff & (data << _bitLength | _bitBuffer));

            length -= 8 - _bitLength;
            data >>>= 8 - _bitLength;
            _bitBuffer = 0;
            _bitLength = 0;
          }

          _bitBuffer = data << _bitLength | _bitBuffer;
          _bitLength = _bitLength + length;
        };

        _this.flush = function () {
          if (_bitLength > 0) {
            _out.writeByte(_bitBuffer);
          }
        };

        return _this;
      };

      const getLZWRaster = function (lzwMinCodeSize) {
        let clearCode = 1 << lzwMinCodeSize;
        let endCode = (1 << lzwMinCodeSize) + 1;
        let bitLength = lzwMinCodeSize + 1; // Setup LZWTable

        let table = lzwTable();

        for (let i = 0; i < clearCode; i += 1) {
          table.add(String.fromCharCode(i));
        }

        table.add(String.fromCharCode(clearCode));
        table.add(String.fromCharCode(endCode));
        let byteOut = byteArrayOutputStream();
        let bitOut = bitOutputStream(byteOut); // clear code

        bitOut.write(clearCode, bitLength);
        let dataIndex = 0;
        let s = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        while (dataIndex < _data.length) {
          let c = String.fromCharCode(_data[dataIndex]);
          dataIndex += 1;

          if (table.contains(s + c)) {
            s = s + c;
          } else {
            bitOut.write(table.indexOf(s), bitLength);

            if (table.size() < 0xfff) {
              if (table.size() == 1 << bitLength) {
                bitLength += 1;
              }

              table.add(s + c);
            }

            s = c;
          }
        }

        bitOut.write(table.indexOf(s), bitLength); // end code

        bitOut.write(endCode, bitLength);
        bitOut.flush();
        return byteOut.toByteArray();
      };

      const lzwTable = function () {
        let _map = {};
        let _size = 0;
        let _this = {};

        _this.add = function (key) {
          if (_this.contains(key)) {
            throw "dup key:" + key;
          }

          _map[key] = _size;
          _size += 1;
        };

        _this.size = function () {
          return _size;
        };

        _this.indexOf = function (key) {
          return _map[key];
        };

        _this.contains = function (key) {
          return typeof _map[key] != "undefined";
        };

        return _this;
      };

      return _this;
    };

    const createImgTag = function (width, height, getPixel, alt) {
      let gif = gifImage(width, height);

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          gif.setPixel(x, y, getPixel(x, y));
        }
      }

      let b = byteArrayOutputStream();
      gif.write(b);
      let base64 = base64EncodeOutputStream();
      let bytes = b.toByteArray();

      for (let i = 0; i < bytes.length; i += 1) {
        base64.writeByte(bytes[i]);
      }

      base64.flush();
      let img = "";
      img += "<img";
      img += '\u0020src="';
      img += "data:image/gif;base64,";
      img += base64;
      img += '"';
      img += '\u0020width="';
      img += width;
      img += '"';
      img += '\u0020height="';
      img += height;
      img += '"';

      if (alt) {
        img += '\u0020alt="';
        img += alt;
        img += '"';
      }

      img += "/>";
      return img;
    }; // multibyte support


    stringToBytesFuncs["UTF-8"] = function (s) {
      function toUTF8Array(str) {
        let utf8 = [];

        for (let i = 0; i < str.length; i++) {
          let charcode = str.charCodeAt(i);
          if (charcode < 0x80) utf8.push(charcode);else if (charcode < 0x800) {
            utf8.push(0xc0 | charcode >> 6, 0x80 | charcode & 0x3f);
          } else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | charcode >> 12, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
          } // surrogate pair
          else {
              i++; // UTF-16 encodes 0x10000-0x10FFFF by
              // subtracting 0x10000 and splitting the
              // 20 bits of 0x0-0xFFFFF into two halves

              charcode = 0x10000 + ((charcode & 0x3ff) << 10 | str.charCodeAt(i) & 0x3ff);
              utf8.push(0xf0 | charcode >> 18, 0x80 | charcode >> 12 & 0x3f, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
            }
        }

        return utf8;
      }

      return toUTF8Array(s);
    };

    /*
     LWC for rendering qr code 

     author: mohan chinnappan
     
     */

    class App extends lwc.LightningElement {
      renderedCallback() {
        const qrc = new qrcode$1(0, 'H'); // get the recordId

        let str = `${this.recordId}`; // console.log(`recordid: ${str}`);

        qrc.addData(str);
        qrc.make();
        let ele = this.template.querySelector("div.qrc");
        ele.innerHTML = qrc.createSvgTag({});
      }

    }

    var main = lwc.registerComponent(App, {
      tmpl: _tmpl$4
    });

    registerWireService(lwc.register);

        const element = lwc.createElement('c-qrc', { is: main, fallback: true });
        document.querySelector('main').appendChild(element);

}(Engine));
