/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"main": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push([1,"lwc~main","node_vendors~main"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/webpack/hot sync ^\\.\\/log$":
/*!*************************************************!*\
  !*** (webpack)/hot sync nonrecursive ^\.\/log$ ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./log": "./node_modules/webpack/hot/log.js"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	if(!__webpack_require__.o(map, req)) {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return map[req];
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "./node_modules/webpack/hot sync ^\\.\\/log$";

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lwc */ "./node_modules/@lwc/engine/dist/engine.cjs.js");
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lwc__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var my_app__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! my/app */ "./src/modules/my/app/app.js");



customElements.define('my-app', Object(lwc__WEBPACK_IMPORTED_MODULE_0__["buildCustomElementConstructor"])(my_app__WEBPACK_IMPORTED_MODULE_1__["default"]));


/***/ }),

/***/ "./src/modules/my/app/app.css":
/*!************************************!*\
  !*** ./src/modules/my/app/app.css ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function stylesheet(hostSelector, shadowSelector, nativeShadow) {
  return ".center" + shadowSelector + " {text-align: center;}\n.link" + shadowSelector + " {border: none;padding: 10px;border-radius: 5px;text-decoration: none;background-color: #ff6000;color: white;margin-left: 33%;margin-right: 33%;display: inline-block;margin-top: 1em;}\n.info" + shadowSelector + " {color: black;background-color: #e4f2f8;margin: auto;padding: 15px 10px;text-align: left;width: 300px;border-radius: 5px;}\n.code" + shadowSelector + " {font-family: monospace;}\n.container" + shadowSelector + " {margin-top: 30px;}\nimg" + shadowSelector + " {max-width: 150px;}\n.greeting" + shadowSelector + " {height: 75px;}\n";
}
/* harmony default export */ __webpack_exports__["default"] = ([stylesheet]);

/***/ }),

/***/ "./src/modules/my/app/app.html":
/*!*************************************!*\
  !*** ./src/modules/my/app/app.html ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _app_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app.css */ "./src/modules/my/app/app.css");
/* harmony import */ var my_greeting__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! my/greeting */ "./src/modules/my/greeting/greeting.js");
/* harmony import */ var my_footer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! my/footer */ "./src/modules/my/footer/footer.js");
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lwc */ "./node_modules/@lwc/engine/dist/engine.cjs.js");
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lwc__WEBPACK_IMPORTED_MODULE_3__);






function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    c: api_custom_element,
    h: api_element,
    t: api_text,
    d: api_dynamic
  } = $api;
  return [api_element("div", {
    classMap: {
      "center": true,
      "greeting": true
    },
    key: 1
  }, [api_custom_element("my-greeting", my_greeting__WEBPACK_IMPORTED_MODULE_1__["default"], {
    props: {
      "speed": "medium"
    },
    key: 0
  }, [])]), api_element("div", {
    classMap: {
      "center": true
    },
    styleMap: {
      "width": "30px",
      "align": "center"
    },
    key: 6
  }, [api_element("svg", {
    attrs: {
      "viewBox": "0 0 64 64"
    },
    key: 5
  }, [api_element("path", {
    attrs: {
      "fill": "#00a1e0",
      "d": "M23 6h22l-8 18h11L20 58l6-26H16l7-26z"
    },
    key: 2
  }, []), api_element("path", {
    attrs: {
      "fill": "#032e61",
      "d": "M20 60a2 2 0 0 1-1.95-2.45L23.5 34H16a2 2 0 0 1-1.93-2.52l7-26A2 2 0 0 1 23 4h22a2 2 0 0 1 1.83 2.81L40.08 22H48a2 2 0 0 1 1.54 3.27l-28 34A2 2 0 0 1 20 60zm-1.4-30H26a2 2 0 0 1 1.95 2.45l-4.1 17.72L43.76 26H37a2 2 0 0 1-1.83-2.81L41.92 8h-17.4z"
    },
    key: 3
  }, []), api_element("path", {
    attrs: {
      "fill": "#fff",
      "d": "M26 26a2 2 0 0 1-1.93-2.53l3-11a2 2 0 1 1 3.86 1.05l-3 11A2 2 0 0 1 26 26z"
    },
    key: 4
  }, [])])]), api_element("div", {
    classMap: {
      "center": true
    },
    key: 8
  }, [api_element("div", {
    classMap: {
      "container": true
    },
    key: 7
  }, [api_text("Greeting app in LWC")])]), api_custom_element("my-footer", my_footer__WEBPACK_IMPORTED_MODULE_2__["default"], {
    key: 9
  }, [api_dynamic($cmp.footer)])];
}

/* harmony default export */ __webpack_exports__["default"] = (Object(lwc__WEBPACK_IMPORTED_MODULE_3__["registerTemplate"])(tmpl));
tmpl.stylesheets = [];

if (_app_css__WEBPACK_IMPORTED_MODULE_0__["default"]) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _app_css__WEBPACK_IMPORTED_MODULE_0__["default"])
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-app-_app-host",
  shadowAttribute: "my-app-_app"
};


/***/ }),

/***/ "./src/modules/my/app/app.js":
/*!***********************************!*\
  !*** ./src/modules/my/app/app.js ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lwc */ "./node_modules/@lwc/engine/dist/engine.cjs.js");
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lwc__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _app_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./app.html */ "./src/modules/my/app/app.html");





class App extends lwc__WEBPACK_IMPORTED_MODULE_0__["LightningElement"] {
  constructor(...args) {
    super(...args);
    this.name = "Greeting App in LWC";
  }

}

Object(lwc__WEBPACK_IMPORTED_MODULE_0__["registerDecorators"])(App, {
  fields: ["name"]
})

/* harmony default export */ __webpack_exports__["default"] = (Object(lwc__WEBPACK_IMPORTED_MODULE_0__["registerComponent"])(App, {
  tmpl: _app_html__WEBPACK_IMPORTED_MODULE_1__["default"]
}));

/***/ }),

/***/ "./src/modules/my/footer/footer.html":
/*!*******************************************!*\
  !*** ./src/modules/my/footer/footer.html ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _footer_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./footer.css */ "./node_modules/lwc-services/lib/utils/webpack/mocks/empty-style.js");
/* harmony import */ var _footer_css__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_footer_css__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lwc */ "./node_modules/@lwc/engine/dist/engine.cjs.js");
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lwc__WEBPACK_IMPORTED_MODULE_1__);




function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    h: api_element,
    d: api_dynamic
  } = $api;
  return [api_element("hr", {
    key: 0
  }, []), api_element("p", {
    key: 1
  }, [api_dynamic($cmp.name)])];
}

/* harmony default export */ __webpack_exports__["default"] = (Object(lwc__WEBPACK_IMPORTED_MODULE_1__["registerTemplate"])(tmpl));
tmpl.stylesheets = [];

if (_footer_css__WEBPACK_IMPORTED_MODULE_0___default.a) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _footer_css__WEBPACK_IMPORTED_MODULE_0___default.a)
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-footer-_footer-host",
  shadowAttribute: "my-footer-_footer"
};


/***/ }),

/***/ "./src/modules/my/footer/footer.js":
/*!*****************************************!*\
  !*** ./src/modules/my/footer/footer.js ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lwc */ "./node_modules/@lwc/engine/dist/engine.cjs.js");
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lwc__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _footer_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./footer.html */ "./src/modules/my/footer/footer.html");





class Footer extends lwc__WEBPACK_IMPORTED_MODULE_0__["LightningElement"] {
  constructor(...args) {
    super(...args);
    this.name = "copyleft";
  }

}

Object(lwc__WEBPACK_IMPORTED_MODULE_0__["registerDecorators"])(Footer, {
  fields: ["name"]
})

/* harmony default export */ __webpack_exports__["default"] = (Object(lwc__WEBPACK_IMPORTED_MODULE_0__["registerComponent"])(Footer, {
  tmpl: _footer_html__WEBPACK_IMPORTED_MODULE_1__["default"]
}));

/***/ }),

/***/ "./src/modules/my/greeting/greeting.css":
/*!**********************************************!*\
  !*** ./src/modules/my/greeting/greeting.css ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function stylesheet(hostSelector, shadowSelector, nativeShadow) {
  return ".greet" + shadowSelector + " {font-size: xx-large;}\n.fade-fast" + shadowSelector + " {opacity: 0;animation: fade-in 1s;}\n.fade-slow" + shadowSelector + " {opacity: 0;animation: fade-in 5s;}\n.fade-medium" + shadowSelector + " {opacity: 0;animation: fade-in 2s;}\n@keyframes fade-in {0% {opacity: 0;}\n35% {opacity: 1;}\n65% {opacity: 1;}\n100% {opacity: 0;}\n}.hide" + shadowSelector + " {opacity: 0;}\n";
}
/* harmony default export */ __webpack_exports__["default"] = ([stylesheet]);

/***/ }),

/***/ "./src/modules/my/greeting/greeting.html":
/*!***********************************************!*\
  !*** ./src/modules/my/greeting/greeting.html ***!
  \***********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _greeting_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./greeting.css */ "./src/modules/my/greeting/greeting.css");
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lwc */ "./node_modules/@lwc/engine/dist/engine.cjs.js");
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lwc__WEBPACK_IMPORTED_MODULE_1__);




function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    d: api_dynamic,
    h: api_element,
    b: api_bind
  } = $api;
  const {
    _m0
  } = $ctx;
  return [api_element("div", {
    className: $cmp.animationClass,
    key: 1,
    on: {
      "animationend": _m0 || ($ctx._m0 = api_bind($cmp.handleAnimationEnd))
    }
  }, [api_element("span", {
    classMap: {
      "greet": true
    },
    key: 0
  }, [api_dynamic($cmp.greeting)])])];
}

/* harmony default export */ __webpack_exports__["default"] = (Object(lwc__WEBPACK_IMPORTED_MODULE_1__["registerTemplate"])(tmpl));
tmpl.stylesheets = [];

if (_greeting_css__WEBPACK_IMPORTED_MODULE_0__["default"]) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _greeting_css__WEBPACK_IMPORTED_MODULE_0__["default"])
}
tmpl.stylesheetTokens = {
  hostAttribute: "my-greeting-_greeting-host",
  shadowAttribute: "my-greeting-_greeting"
};


/***/ }),

/***/ "./src/modules/my/greeting/greeting.js":
/*!*********************************************!*\
  !*** ./src/modules/my/greeting/greeting.js ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lwc */ "./node_modules/@lwc/engine/dist/engine.cjs.js");
/* harmony import */ var lwc__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lwc__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _greeting_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./greeting.html */ "./src/modules/my/greeting/greeting.html");




const greetings = ['Hello', 'வணக்கம்', 'Bonjour', '你好', 'Hola', 'Привет', 'こんにちは', 'Guten Tag', 'ጤና ይስጥልኝ', 'Ciao', 'नमस्ते', '안녕하세요'];
const SPEED_CLASS_MAP = {
  slow: 'fade-slow',
  fast: 'fade-fast',
  medium: 'fade-medium'
};
const DEFAULT_SPEED = 'medium';

class Greeting extends lwc__WEBPACK_IMPORTED_MODULE_0__["LightningElement"] {
  constructor(...args) {
    super(...args);
    this.animationSpeed = DEFAULT_SPEED;
    this.index = 0;
    this.isAnimating = true;
  }

  set speed(value) {
    if (SPEED_CLASS_MAP[value]) {
      this.animationSpeed = value;
    } else {
      this.animationSpeed = DEFAULT_SPEED;
    }

    this.isAnimating = true;
  } // Return the internal speed property


  get speed() {
    return this.animationSpeed;
  } // Get the current greeting


  get greeting() {
    return greetings[this.index];
  } // Map slow, medium, fast to CSS Animations


  get animationClass() {
    if (this.isAnimating) {
      return SPEED_CLASS_MAP[this.speed];
    }

    return 'hide';
  } //Handle the animation ending, update to next hello


  handleAnimationEnd() {
    this.isAnimating = false;
    this.index = (this.index + 1) % greetings.length;
    setTimeout(() => this.updateGreeting(), 500);
  } // Update to the next greeting and start animating


  updateGreeting() {
    this.isAnimating = true;
  }

}

Object(lwc__WEBPACK_IMPORTED_MODULE_0__["registerDecorators"])(Greeting, {
  publicProps: {
    speed: {
      config: 3
    }
  },
  track: {
    animationSpeed: 1,
    index: 1,
    isAnimating: 1
  }
})

/* harmony default export */ __webpack_exports__["default"] = (Object(lwc__WEBPACK_IMPORTED_MODULE_0__["registerComponent"])(Greeting, {
  tmpl: _greeting_html__WEBPACK_IMPORTED_MODULE_1__["default"]
}));

/***/ }),

/***/ 1:
/*!***************************************************************************************************************************************************************************************************************!*\
  !*** multi (webpack)-dev-server/client?http://0.0.0.0:3001 ./node_modules/error-overlay-webpack-plugin/lib/entry-basic.js ./node_modules/error-overlay-webpack-plugin/lib/entry-devserver.js? ./src/index.js ***!
  \***************************************************************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! /Users/mchinnappan/lwc.dev/hw2-app/node_modules/webpack-dev-server/client/index.js?http://0.0.0.0:3001 */"./node_modules/webpack-dev-server/client/index.js?http://0.0.0.0:3001");
__webpack_require__(/*! /Users/mchinnappan/lwc.dev/hw2-app/node_modules/error-overlay-webpack-plugin/lib/entry-basic.js */"./node_modules/error-overlay-webpack-plugin/lib/entry-basic.js");
__webpack_require__(/*! /Users/mchinnappan/lwc.dev/hw2-app/node_modules/error-overlay-webpack-plugin/lib/entry-devserver.js? */"./node_modules/error-overlay-webpack-plugin/lib/entry-devserver.js?");
module.exports = __webpack_require__(/*! /Users/mchinnappan/lwc.dev/hw2-app/src/index.js */"./src/index.js");


/***/ })

/******/ });
//# sourceMappingURL=app.js.map