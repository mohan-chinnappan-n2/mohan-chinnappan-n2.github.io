var SLDS="object"==typeof SLDS?SLDS:{};SLDS["__internal/chunked/showcase/ui/components/file-selector/image/example.jsx.js"]=function(e){function r(r){for(var l,o,s=r[0],i=r[1],c=r[2],f=0,d=[];f<s.length;f++)o=s[f],Object.prototype.hasOwnProperty.call(a,o)&&a[o]&&d.push(a[o][0]),a[o]=0;for(l in i)Object.prototype.hasOwnProperty.call(i,l)&&(e[l]=i[l]);for(u&&u(r);d.length;)d.shift()();return n.push.apply(n,c||[]),t()}function t(){for(var e,r=0;r<n.length;r++){for(var t=n[r],l=!0,s=1;s<t.length;s++){var i=t[s];0!==a[i]&&(l=!1)}l&&(n.splice(r--,1),e=o(o.s=t[0]))}return e}var l={},a={81:0,6:0,22:0,73:0,80:0,93:0,94:0,96:0,97:0,98:0,103:0,104:0,127:0,131:0,135:0,140:0,142:0},n=[];function o(r){if(l[r])return l[r].exports;var t=l[r]={i:r,l:!1,exports:{}};return e[r].call(t.exports,t,t.exports,o),t.l=!0,t.exports}o.m=e,o.c=l,o.d=function(e,r,t){o.o(e,r)||Object.defineProperty(e,r,{enumerable:!0,get:t})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,r){if(1&r&&(e=o(e)),8&r)return e;if(4&r&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(o.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&r&&"string"!=typeof e)for(var l in e)o.d(t,l,function(r){return e[r]}.bind(null,l));return t},o.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(r,"a",r),r},o.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},o.p="/assets/scripts/bundle/";var s=this.webpackJsonpSLDS___internal_chunked_showcase=this.webpackJsonpSLDS___internal_chunked_showcase||[],i=s.push.bind(s);s.push=r,s=s.slice();for(var c=0;c<s.length;c++)r(s[c]);var u=i;return n.push([155,0]),t()}({0:function(e,r){e.exports=React},155:function(e,r,t){"use strict";t.r(r),t.d(r,"states",(function(){return o}));var l=t(0),a=t.n(l),n=t(75);r.default=a.a.createElement("div",{className:"demo-only",style:{maxWidth:"320px"}},a.a.createElement(n.FileSelector,{className:"slds-file-selector_images"}));var o=[{id:"file-selector-images-error",label:"Error",element:a.a.createElement("div",{className:"demo-only",style:{maxWidth:"320px"}},a.a.createElement(n.FileSelector,{className:"slds-file-selector_images",error:!0}))},{id:"file-selector-images-dragover",label:"Dragover",element:a.a.createElement("div",{className:"demo-only",style:{maxWidth:"320px"}},a.a.createElement(n.FileSelector,{className:"slds-file-selector_images",dragover:!0}))},{id:"file-selector-images-dragover-error",label:"Dragover with error",element:a.a.createElement("div",{className:"demo-only",style:{maxWidth:"320px"}},a.a.createElement(n.FileSelector,{className:"slds-file-selector_images",dragoverError:!0,error:!0}))}]}});