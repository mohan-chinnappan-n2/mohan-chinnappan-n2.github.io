var SLDS="object"==typeof SLDS?SLDS:{};SLDS["__internal/chunked/showcase/ui/utilities/themes/example.jsx.js"]=function(e){function t(t){for(var r,u,s=t[0],o=t[1],i=t[2],f=0,d=[];f<s.length;f++)u=s[f],Object.prototype.hasOwnProperty.call(a,u)&&a[u]&&d.push(a[u][0]),a[u]=0;for(r in o)Object.prototype.hasOwnProperty.call(o,r)&&(e[r]=o[r]);for(c&&c(t);d.length;)d.shift()();return l.push.apply(l,i||[]),n()}function n(){for(var e,t=0;t<l.length;t++){for(var n=l[t],r=!0,s=1;s<n.length;s++){var o=n[s];0!==a[o]&&(r=!1)}r&&(l.splice(t--,1),e=u(u.s=n[0]))}return e}var r={},a={184:0,6:0,22:0,73:0,80:0,93:0,94:0,96:0,97:0,98:0,103:0,104:0,127:0,131:0,135:0,140:0,142:0},l=[];function u(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,u),n.l=!0,n.exports}u.m=e,u.c=r,u.d=function(e,t,n){u.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},u.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},u.t=function(e,t){if(1&t&&(e=u(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(u.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)u.d(n,r,function(t){return e[t]}.bind(null,r));return n},u.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return u.d(t,"a",t),t},u.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},u.p="/assets/scripts/bundle/";var s=this.webpackJsonpSLDS___internal_chunked_showcase=this.webpackJsonpSLDS___internal_chunked_showcase||[],o=s.push.bind(s);s.push=t,s=s.slice();for(var i=0;i<s.length;i++)t(s[i]);var c=o;return l.push([225,0]),n()}({0:function(e,t){e.exports=React},225:function(e,t,n){"use strict";n.r(t),n.d(t,"examples",(function(){return l}));var r=n(0),a=n.n(r),l=[{id:"default",label:"Default",element:a.a.createElement("div",{className:"slds-box slds-theme_default"},a.a.createElement("p",null,"This is a ",a.a.createElement("strong",null,"default")," theme and here is a"," ",a.a.createElement("a",{href:"#",onClick:function(e){return e.preventDefault()}},"link"),"."))},{id:"shade",label:"Shade",element:a.a.createElement("div",{className:"slds-box slds-theme_shade"},a.a.createElement("p",null,"This is a ",a.a.createElement("strong",null,"default")," theme and here is a"," ",a.a.createElement("a",{href:"#",onClick:function(e){return e.preventDefault()}},"link"),"."))},{id:"texture",label:"Shade with texture",element:a.a.createElement("div",{className:"slds-box slds-theme_shade slds-theme_alert-texture"},a.a.createElement("p",null,"This theme has the ",a.a.createElement("strong",null,"alert texture")," added to the default theme and has a"," ",a.a.createElement("a",{href:"#",onClick:function(e){return e.preventDefault()}},"link"),"."))}]}});