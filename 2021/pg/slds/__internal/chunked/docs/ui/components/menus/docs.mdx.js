var SLDS="object"==typeof SLDS?SLDS:{};SLDS["__internal/chunked/docs/ui/components/menus/docs.mdx.js"]=function(e){function t(t){for(var l,r,o=t[0],c=t[1],d=t[2],m=0,u=[];m<o.length;m++)r=o[m],Object.prototype.hasOwnProperty.call(a,r)&&a[r]&&u.push(a[r][0]),a[r]=0;for(l in c)Object.prototype.hasOwnProperty.call(c,l)&&(e[l]=c[l]);for(i&&i(t);u.length;)u.shift()();return s.push.apply(s,d||[]),n()}function n(){for(var e,t=0;t<s.length;t++){for(var n=s[t],l=!0,o=1;o<n.length;o++){var c=n[o];0!==a[c]&&(l=!1)}l&&(s.splice(t--,1),e=r(r.s=n[0]))}return e}var l={},a={48:0},s=[];function r(t){if(l[t])return l[t].exports;var n=l[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,r),n.l=!0,n.exports}r.m=e,r.c=l,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var l in e)r.d(n,l,function(t){return e[t]}.bind(null,l));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="/assets/scripts/bundle/";var o=this.webpackJsonpSLDS___internal_chunked_docs=this.webpackJsonpSLDS___internal_chunked_docs||[],c=o.push.bind(o);o.push=t,o=o.slice();for(var d=0;d<o.length;d++)t(o[d]);var i=c;return s.push([244,0]),n()}({0:function(e,t){e.exports=React},18:function(e,t){e.exports=JSBeautify},19:function(e,t){e.exports=ReactDOM},244:function(e,t,n){"use strict";n.r(t),n.d(t,"getElement",(function(){return V})),n.d(t,"getContents",(function(){return X}));var l=n(0),a=n.n(l),s=n(4),r=n(1),o=n(23),c=n(11),d=n(15),i=n(3),m=n.n(i);function u(e){return(u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function h(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function p(e,t){for(var n=0;n<t.length;n++){var l=t[n];l.enumerable=l.enumerable||!1,l.configurable=!0,"value"in l&&(l.writable=!0),Object.defineProperty(e,l.key,l)}}function b(e,t){return(b=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function g(e,t){return!t||"object"!==u(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function E(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return!1}}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var w=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&b(e,t)}(c,e);var t,n,s,r,o=(t=c,function(){var e,n=f(t);if(E()){var l=f(this).constructor;e=Reflect.construct(n,arguments,l)}else e=n.apply(this,arguments);return g(this,e)});function c(){return h(this,c),o.apply(this,arguments)}return n=c,(s=[{key:"render",value:function(){return a.a.createElement(l.Fragment,null,this.props.fragmentChildren)}}])&&p(n.prototype,s),r&&p(n,r),c}(a.a.Component);w.propTypes={fragmentChildren:m.a.node.isRequired};var y=n(9),O=n(10),_=function(e){return a.a.createElement("div",{className:"demo-only",style:{height:"260px"}},a.a.createElement(y.l,{className:"slds-is-open"},a.a.createElement(y.f,{className:"slds-dropdown_left slds-dropdown_small"},a.a.createElement(y.h,{className:"slds-dropdown_length-5"},a.a.createElement(y.g,{tabIndex:"0"},"Menu Item One"),a.a.createElement(y.g,null,"Menu Item Two"),a.a.createElement(y.g,null,"Menu Item Three"),a.a.createElement(y.g,null,"Menu Item Four"),a.a.createElement(y.g,null,"Menu Item Five"),a.a.createElement(y.g,null,"Menu Item Six"),a.a.createElement(y.g,null,"Menu Item Seven"),a.a.createElement(y.g,null,"Menu Item Eight"),a.a.createElement(y.g,null,"Menu Item Nine"),a.a.createElement(y.g,null,"Menu Item Ten")))))},j=function(e){return a.a.createElement("div",{className:"demo-only",style:{height:"300px"}},a.a.createElement(y.l,{className:"slds-is-open"},a.a.createElement(y.f,{className:"slds-dropdown_left slds-dropdown_small"},a.a.createElement(y.h,{className:"slds-dropdown_length-7"},a.a.createElement(y.g,{tabIndex:"0"},"Menu Item One"),a.a.createElement(y.g,null,"Menu Item Two"),a.a.createElement(y.g,null,"Menu Item Three"),a.a.createElement(y.g,null,"Menu Item Four"),a.a.createElement(y.g,null,"Menu Item Five"),a.a.createElement(y.g,null,"Menu Item Six"),a.a.createElement(y.g,null,"Menu Item Seven"),a.a.createElement(y.g,null,"Menu Item Eight"),a.a.createElement(y.g,null,"Menu Item Nine"),a.a.createElement(y.g,null,"Menu Item Ten")))))},v=function(e){return a.a.createElement("div",{className:"demo-only",style:{height:"430px"}},a.a.createElement(y.l,{className:"slds-is-open"},a.a.createElement(y.f,{className:"slds-dropdown_left slds-dropdown_small"},a.a.createElement(y.h,{className:"slds-dropdown_length-10"},a.a.createElement(y.g,{tabIndex:"0"},"Menu Item One"),a.a.createElement(y.g,null,"Menu Item Two"),a.a.createElement(y.g,null,"Menu Item Three"),a.a.createElement(y.g,null,"Menu Item Four"),a.a.createElement(y.g,null,"Menu Item Five"),a.a.createElement(y.g,null,"Menu Item Six"),a.a.createElement(y.g,null,"Menu Item Seven"),a.a.createElement(y.g,null,"Menu Item Eight"),a.a.createElement(y.g,null,"Menu Item Nine"),a.a.createElement(y.g,null,"Menu Item Ten")))))},I=function(e){return a.a.createElement("div",{className:"demo-only",style:{height:"260px"}},a.a.createElement(y.l,{className:"slds-is-open"},a.a.createElement(y.f,{className:"slds-dropdown_left slds-dropdown_small"},a.a.createElement(y.h,{className:"slds-dropdown_length-with-icon-5"},a.a.createElement(y.g,{tabIndex:"0"},a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-account slds-m-right_small",sprite:"standard",symbol:"account"}),"Menu Item One"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-approval slds-m-right_small",sprite:"standard",symbol:"approval"}),"Menu Item Two"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-lead slds-m-right_small",sprite:"standard",symbol:"lead"}),"Menu Item Three"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-opportunity slds-m-right_small",sprite:"standard",symbol:"opportunity"}),"Menu Item Four"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-product slds-m-right_small",sprite:"standard",symbol:"product"}),"Menu Item Five"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-account slds-m-right_small",sprite:"standard",symbol:"account"}),"Menu Item Six"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-approval slds-m-right_small",sprite:"standard",symbol:"approval"}),"Menu Item Seven"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-lead slds-m-right_small",sprite:"standard",symbol:"lead"}),"Menu Item Eight"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-opportunity slds-m-right_small",sprite:"standard",symbol:"opportunity"}),"Menu Item Nine"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-product slds-m-right_small",sprite:"standard",symbol:"product"}),"Menu Item Ten")))))},x=function(e){return a.a.createElement("div",{className:"demo-only",style:{height:"320px"}},a.a.createElement(y.l,{className:"slds-is-open"},a.a.createElement(y.f,{className:"slds-dropdown_left slds-dropdown_small"},a.a.createElement(y.h,{className:"slds-dropdown_length-with-icon-7"},a.a.createElement(y.g,{tabIndex:"0"},a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-account slds-m-right_small",sprite:"standard",symbol:"account"}),"Menu Item One"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-approval slds-m-right_small",sprite:"standard",symbol:"approval"}),"Menu Item Two"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-lead slds-m-right_small",sprite:"standard",symbol:"lead"}),"Menu Item Three"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-opportunity slds-m-right_small",sprite:"standard",symbol:"opportunity"}),"Menu Item Four"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-product slds-m-right_small",sprite:"standard",symbol:"product"}),"Menu Item Five"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-account slds-m-right_small",sprite:"standard",symbol:"account"}),"Menu Item Six"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-approval slds-m-right_small",sprite:"standard",symbol:"approval"}),"Menu Item Seven"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-lead slds-m-right_small",sprite:"standard",symbol:"lead"}),"Menu Item Eight"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-opportunity slds-m-right_small",sprite:"standard",symbol:"opportunity"}),"Menu Item Nine"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-product slds-m-right_small",sprite:"standard",symbol:"product"}),"Menu Item Ten")))))},N=function(e){return a.a.createElement("div",{className:"demo-only",style:{height:"450px"}},a.a.createElement(y.l,{className:"slds-is-open"},a.a.createElement(y.f,{className:"slds-dropdown_left slds-dropdown_small"},a.a.createElement(y.h,{className:"slds-dropdown_length-with-icon-10"},a.a.createElement(y.g,{tabIndex:"0"},a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-account slds-m-right_small",sprite:"standard",symbol:"account"}),"Menu Item One"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-approval slds-m-right_small",sprite:"standard",symbol:"approval"}),"Menu Item Two"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-lead slds-m-right_small",sprite:"standard",symbol:"lead"}),"Menu Item Three"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-opportunity slds-m-right_small",sprite:"standard",symbol:"opportunity"}),"Menu Item Four"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-product slds-m-right_small",sprite:"standard",symbol:"product"}),"Menu Item Five"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-account slds-m-right_small",sprite:"standard",symbol:"account"}),"Menu Item Six"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-approval slds-m-right_small",sprite:"standard",symbol:"approval"}),"Menu Item Seven"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-lead slds-m-right_small",sprite:"standard",symbol:"lead"}),"Menu Item Eight"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-opportunity slds-m-right_small",sprite:"standard",symbol:"opportunity"}),"Menu Item Nine"),a.a.createElement(y.g,null,a.a.createElement(O.a,{className:"slds-icon slds-icon_small slds-icon-standard-product slds-m-right_small",sprite:"standard",symbol:"product"}),"Menu Item Ten")))))},M=[{id:"dropdown-menu-length-5",label:"5 items",element:a.a.createElement(_,null)},{id:"dropdown-menu-length-7",label:"7 items",element:a.a.createElement(j,null)},{id:"dropdown-menu-length-10",label:"10 items",element:a.a.createElement(v,null)},{id:"dropdown-menu-length-5-icon",label:"5 items with icon",element:a.a.createElement(I,null)},{id:"dropdown-menu-length-7-icon",label:"7 items with icon",element:a.a.createElement(x,null)},{id:"dropdown-menu-length-10-icon",label:"10 items with icon",element:a.a.createElement(N,null)}],S=n(5),T=n.n(S);function k(){return(k=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var l in n)Object.prototype.hasOwnProperty.call(n,l)&&(e[l]=n[l])}return e}).apply(this,arguments)}function C(e,t){if(null==e)return{};var n,l,a=function(e,t){if(null==e)return{};var n,l,a={},s=Object.keys(e);for(l=0;l<s.length;l++)n=s[l],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(l=0;l<s.length;l++)n=s[l],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var P=a.a.createElement(O.a,{className:"slds-icon slds-icon_x-small slds-icon-text-default slds-m-left_small slds-shrink-none",sprite:"utility",symbol:"right"}),R=function(e){var t=e.ariaExpanded,n=e.className,l=(e.children,e.iconRight),s=e.itemName,r=e.tabIndex,o=e.title,c=e.submenuClassnames,d=C(e,["ariaExpanded","className","children","iconRight","itemName","tabIndex","title","submenuClassnames"]);return a.a.createElement("li",k({},d,{className:T()("slds-dropdown__item slds-has-submenu",n),role:"presentation"}),a.a.createElement("a",{role:"menuitem",href:"#","aria-haspopup":"true","aria-expanded":t,tabIndex:r||"-1",onClick:function(e){return e.preventDefault()}},a.a.createElement("span",{className:"slds-truncate",title:o||s},e.itemName),l||null),a.a.createElement(y.f,{className:T()("slds-dropdown_submenu",c)},a.a.createElement(y.h,{ariaLabel:s},a.a.createElement(y.g,{tabIndex:"0"},"Submenu Item One"),a.a.createElement(y.g,null,"Submenu Item Two"),a.a.createElement(y.g,null,"Submenu Item Three"),a.a.createElement("li",{className:"slds-has-divider_top-space",role:"separator"}),a.a.createElement(y.g,null,"Submenu Item Four"))))},A=function(e){return a.a.createElement(y.l,{className:"slds-is-open"},a.a.createElement(y.f,{className:"slds-dropdown_left"},a.a.createElement(y.h,{ariaLabel:"Show More"},a.a.createElement(y.g,{tabIndex:"0"},"Menu Item One"),a.a.createElement(y.g,null,"Menu Item Two"),a.a.createElement(R,{ariaExpanded:e.ariaExpanded,iconRight:P,itemName:"Menu Item Three",submenuClassnames:e.submenuClassnames||"slds-dropdown_submenu-right"}))))},W=(n(84),n(2)),L=s.c.code,F=s.c.h2,D=s.c.h3,B=s.c.h4,H=s.c.li,J=s.c.p,q=s.c.table,K=s.c.tbody,$=s.c.td,z=s.c.th,G=s.c.thead,Q=s.c.tr,U=s.c.ul,V=function(){return Object(l.createElement)(s.b,{},Object(l.createElement)("div",{className:"doc lead"},"A Menu offers a list of actions or functions that a user can access."),Object(l.createElement)(r.a,{exampleOnly:!0,demoStyles:"height: 150px;"},Object(l.createElement)(y.d,{hasLeftIcon:!0})),F({id:"About-Menu"},"About Menu"),J({},"The unordered menu list ",L({},"<ul>")," with ",L({},'role="menu"')," should be contained in a ",L({},"<div>")," with the class ",L({},".slds-dropdown"),"."),J({},"The target HTML element and dropdown need to be wrapped in the class ",L({},".slds-dropdown-trigger dropdown-trigger_click"),"."),D({id:"Accessibility"},"Accessibility"),B({id:"Markup"},"Markup"),U({},H({},"The menu trigger is a focusable element (",L({},"<a>")," or ",L({},"<button>"),") with ",L({},'aria-haspopup="true"')),H({},"The menu has ",L({},'role="menu"')," and an ",L({},"aria-label")," attribute whose value is the name of the menu trigger"),H({},"The menu items have ",L({},'role="menuitem"'),", ",L({},'role="menuitemcheckbox"'),", or ",L({},'role="menuitemradio"'),", depending on the selection options")),B({id:"Keyboard-Interactions"},"Keyboard Interactions"),J({},"The main thing that distinguishes menus from other popover blocks is keyboard navigation: elsewhere, users press the Tab key to navigate through actionable items, but in a menu, users press the arrow keys to navigate."),U({},H({},"Arrow keys cycle focus through menu items (you should use JavaScript to disable focus for any disabled items)"),H({},"If a menu item opens a submenu, pressing Enter or the right arrow key opens the submenu and focus goes to the first item in the submenu"),H({},"If a submenu is open, pressing the left arrow key closes the submenu and puts focus back on the menu item that opened the submenu"),H({},"Tab key closes the menu and moves focus to the next focusable element on the page"),H({},"Esc key closes the menu and moves focus back to the menu trigger"),H({},"Any character key moves focus to the next menu item that starts with that character, if applicable")),F({id:"Base"},"Base"),Object(l.createElement)(c.a,{title:"Menu Base"},Object(l.createElement)(r.a,{demoStyles:"height: 200px;"},Object(l.createElement)(y.b,{className:"slds-dropdown_left"}))),F({id:"With-Subheaders"},"With Subheaders"),Object(l.createElement)(d.a,{type:"a11y",header:"Accessible Role"},Object(l.createElement)("p",null,"A subheading must have ",Object(l.createElement)("code",null,'role="separator"')," on the"," ",Object(l.createElement)("code",null,"<li>")," and the content inside the ",Object(l.createElement)("code",null,"<li>")," ","should be in a ",Object(l.createElement)("code",null,"<span>"),".")),Object(l.createElement)(o.a,{toggleCode:!1},Object(l.createElement)("li",{className:"slds-dropdown__header slds-truncate",title:"Menu Sub Heading",role:"separator"},Object(l.createElement)("span",null,"Menu Sub Heading"))),Object(l.createElement)(c.a,{title:"Menu with Subheaders"},Object(l.createElement)(r.a,{demoStyles:"height: 300px;"},Object(l.createElement)(y.k,null))),F({id:"With-Icons"},"With Icons"),J({},"Icons can be included on either the left, right, or both sides of an option."),Object(l.createElement)(d.a,{type:"a11y",header:"Accessibility Note"},Object(l.createElement)("p",null,"If using one of the icons to indicate selection (e.g. checkmarks), be sure to check out the"," ",Object(l.createElement)("a",{href:"#With-Selectable-Items"},"Menus with Selectable Items")," docs for the Accessibility implications.")),D({id:"Icon-on-the-Left"},"Icon on the Left"),Object(l.createElement)(c.a,{title:"Menu with Icon Left"},Object(l.createElement)(r.a,{demoStyles:"height: 150px;"},Object(l.createElement)(y.d,{hasLeftIcon:!0}))),D({id:"Icon-on-the-Right"},"Icon on the Right"),Object(l.createElement)(c.a,{title:"Menu with Icon Right"},Object(l.createElement)(r.a,{demoStyles:"height: 150px;"},Object(l.createElement)(y.e,null))),D({id:"Double-Icon"},"Double Icon"),Object(l.createElement)(d.a,{type:"a11y",header:"Accessibility Note"},Object(l.createElement)("p",null,"If using one of the icons to indicate selection (e.g. checkmarks), be sure to check out the"," ",Object(l.createElement)("a",{href:"#With-Selectable-Items"},"Menus with Selectable Items")," docs.")),Object(l.createElement)(c.a,{title:"Menu with Double Icon"},Object(l.createElement)(r.a,{demoStyles:"height: 150px;"},Object(l.createElement)(y.c,null))),F({id:"With-Selectable-Items"},"With Selectable Items"),J({},"When creating a menu with selectable items:"),U({},H({},"All selectable items need the proper role, either ",L({},'role="menuitemcheckbox"')," or ",L({},'role="menuitemradio"')),H({},"All selectable items should contain an icon"),H({},"Each icon must have the class ",L({},"slds-icon_selected")," on the ",L({},"<svg>"),U({},H({},"This hides icons of non-selected items"))),H({},"Items that have been selected need ",L({},'aria-checked="true"')," on the ",L({},"<a>")," element")),Object(l.createElement)(d.a,{type:"a11y",header:"Revealing Icons for Selected Items"},Object(l.createElement)("p",null,"A selected item reveals its icon when the class"," ",Object(l.createElement)("code",null,"slds-is-selected")," is applied to the ",Object(l.createElement)("code",null,"<li>")," and"," ",Object(l.createElement)("code",null,'aria-checked="true"')," is applied to its"," ",Object(l.createElement)("code",null,"menuitemcheckbox")," or ",Object(l.createElement)("code",null,"menuitemradio")," child.")),Object(l.createElement)(o.a,{toggleCode:!1},Object(l.createElement)("li",{className:"slds-dropdown__item slds-is-selected",role:"presentation"},Object(l.createElement)("a",{role:"menuitemcheckbox","aria-checked":"true"},"..."))),Object(l.createElement)(c.a,{title:"Menu with Selectable Icon Left"},Object(l.createElement)(r.a,{demoStyles:"height: 150px;"},Object(l.createElement)(y.d,{isSelectable:!0}))),F({id:"With-Status-Notifications"},"With Status Notifications"),Object(l.createElement)(r.a,{demoStyles:"height: 250px;"},Object(l.createElement)(y.i,null)),J({},"To enable menu items to reflect status level notifications like Error, Success and Warning, place a modifier class onto the ",L({},"menuitem")," that has the offending notification."),J({},"The class is based on the ",L({},"slds-has-${level}")," pattern, where ",L({},"${level}")," corresponds to the level you wish to set."),U({},H({},L({},"slds-has-error")),H({},L({},"slds-has-success")),H({},L({},"slds-has-warning"))),Object(l.createElement)(o.a,{toggleCode:!1},Object(l.createElement)("a",{className:"slds-has-warning",href:"#",onClick:function(e){return e.preventDefault()},role:"menuitem",tabIndex:"-1"},"...")),Object(l.createElement)(d.a,{type:"note",header:"Warning Icon"},Object(l.createElement)("p",null,"For warning level menu items it is required that you switch the icon to use the ",Object(l.createElement)("code",null,"currentColor")," variant for icons.")),F({id:"With-Overflow-Scrolling"},"With Overflow Scrolling"),Object(l.createElement)(c.a,{title:"Menu with Overflow Scrolling"},Object(l.createElement)(r.a,{demoStyles:"height: 220px;"},Object(l.createElement)(y.j,{className:"slds-dropdown_left slds-dropdown_length-5"}))),J({},"To force overflow scrolling after either 5, 7, or 10 items, add the modifier ",L({},"slds-dropdown_length-*")," to the ",L({},"<div>")," with class ",L({},"slds-dropdown")," where the ",L({},"*")," is either 5, 7, or 10."),Object(l.createElement)(o.a,{toggleCode:!1},Object(l.createElement)("div",{className:"slds-dropdown slds-dropdown_length-5"},"...")),D({id:"Scrolling-for-Menu-Items-with-Icons"},"Scrolling for Menu Items with Icons"),J({},"To force overflow scrolling after either 5, 7, or 10 items with icons, add the modifier ",L({},"slds-dropdown_length-with-icon-*")," to the ",L({},"<div>")," with class ",L({},"slds-dropdown")," where the ",L({},"*")," is either 5, 7, or 10."),Object(l.createElement)(r.a,{demoStyles:"height: 250px;"},Object(l.createElement)(y.j,{isSelectable:!0,isSelected:"true",className:"slds-dropdown_left slds-dropdown_length-with-icon-5"})),F({id:"With-a-Submenu"},"With a Submenu"),J({},"To create a menu with a submenu, add the ",L({},"slds-has-submenu")," class to the list item, ",L({},"<li>"),", that will open the submenu."),Object(l.createElement)(d.a,{type:"a11y",header:"Accessibility Note"},Object(l.createElement)("p",null,"Any menu item that opens a submenu must have ",Object(l.createElement)("code",null,'aria-haspop="true"')," ","on the ",Object(l.createElement)("code",null,"<a>")," within the ",Object(l.createElement)("code",null,"<li>"),". In order to open the submenu, set ",Object(l.createElement)("code",null,"aria-expanded")," to ",Object(l.createElement)("code",null,"true")," on that ",Object(l.createElement)("code",null,"<a>")," when the user clicks or hovers over the list item, or presses enter while focused on the list item. Additionally, the submenu should have ",Object(l.createElement)("code",null,'role="menu"')," and an ",Object(l.createElement)("code",null,"aria-label")," ","attribute whose value matches the name of the ",Object(l.createElement)("code",null,"<li>")," that opened the submenu.")),Object(l.createElement)(o.a,{toggleCode:!1},Object(l.createElement)("li",{className:"slds-dropdown__item slds-has-submenu",role:"presentation"},Object(l.createElement)("a",{role:"menuitem",href:"#",onClick:function(e){return e.preventDefault()},"aria-haspopup":"true","aria-expanded":"true",tabIndex:"-1"},"..."),Object(l.createElement)("div",{className:"slds-dropdown slds-dropdown_submenu slds-dropdown_submenu-left"},Object(l.createElement)("ul",{className:"slds-dropdown__list",role:"menu","aria-label":"Name of Item that Opened this Menu"},"...")))),D({id:"Submenu-to-Right"},"Submenu to Right"),J({},"To open the submenu to the right of the main menu, add ",L({},"slds-dropdown_submenu-right")," to the ",L({},"<div>")," with the ",L({},"slds-dropdown_submenu")," class."),Object(l.createElement)(c.a,{title:"Menu with Submenu Right"},Object(l.createElement)(r.a,{demoStyles:"height: 300px;"},Object(l.createElement)(A,{ariaExpanded:"true"}))),D({id:"Submenu-to-Left"},"Submenu to Left"),J({},"To open the submenu to the left, add ",L({},"slds-dropdown_submenu-left")," to the ",L({},"<div>")," with the ",L({},"slds-dropdown_submenu")," class."),Object(l.createElement)(c.a,{title:"Menu with Submenu Left"},Object(l.createElement)(r.a,{demoStyles:"height: 300px; margin-left: 150px;"},Object(l.createElement)(A,{ariaExpanded:!0,submenuClassnames:"slds-dropdown_submenu-left"}))),F({id:"Overflow-Menu-with-Actions"},"Overflow Menu with Actions"),J({},"For an overflow of action items, use the overflow menu with actions styling by adding the modifier ",L({},"slds-dropdown_actions")," to the ",L({},"div")," with class ",L({},"slds-dropdown"),". This pattern is typically used in conjunction with a button group."),Object(l.createElement)(c.a,{title:"Menu with Action Overflow"},Object(l.createElement)(r.a,{demoStyles:"height: 150px;"},Object(l.createElement)(y.a,null))),F({id:"Positioning"},"Positioning"),J({},"There are 3 options for the positioning of the menu dropdown -- left, right, and bottom. To access these options, add a modifier to the ",L({},"<div>")," with class name ",L({},"slds-dropdown"),". For the standard positioning where the dropdown aligns with the left side of the dropdown trigger, use ",L({},"slds-dropdown_left"),", as seen above."),Object(l.createElement)(o.a,{toggleCode:!1},Object(l.createElement)("div",{className:"slds-dropdown slds-dropdown_left"},"...")),D({id:"Positioned-Right"},"Positioned Right"),J({},"To position the dropdown to align with the right of the dropdown trigger, use ",L({},"slds-dropdown_right"),"."),Object(l.createElement)(c.a,{title:"Menu Positioned Right"},Object(l.createElement)(r.a,{demoStyles:"height: 200px; margin-left: 90px;"},Object(l.createElement)(y.b,{className:"slds-dropdown_right"}))),D({id:"Positioned-Bottom"},"Positioned Bottom"),J({},"To position the dropdown to sit on top of the dropdown trigger, use ",L({},"slds-dropdown_bottom"),"."),Object(l.createElement)(c.a,{title:"Menu Positioned Bottom"},Object(l.createElement)(r.a,{demoStyles:"margin-left: 45px; margin-top: 163px;"},Object(l.createElement)(y.b,{className:"slds-dropdown_bottom"}))),F({id:"Width"},"Width"),J({},"To adjust the width of the menu dropdown add modifier ",L({},"slds-dropdown_*")," to the ",L({},"<div>")," with class ",L({},"slds-dropdown")," where the ",L({},"*")," is ",L({},"xx-small"),", ",L({},"x-small"),", ",L({},"small"),", ",L({},"medium"),", or ",L({},"large"),"."),Object(l.createElement)(o.a,{toggleCode:!1},Object(l.createElement)("div",{className:"slds-dropdown slds-dropdown_left slds-dropdown_medium"},"...")),q({},G({},Q({},z({},"Modifier"),z({},"Example"))),K({},Q({},$({},L({},".slds-dropdown_xx-small")," ",Object(l.createElement)("br",null)," 6rem / 96px"),$({},Object(l.createElement)("div",{style:{height:"200px",width:"320px"}},Object(l.createElement)(y.b,{className:"slds-dropdown_left slds-dropdown_xx-small"})))),Q({},$({},L({},".slds-dropdown_x-small")," ",Object(l.createElement)("br",null)," 12rem / 192px"),$({},Object(l.createElement)("div",{style:{height:"200px",width:"320px"}},Object(l.createElement)(y.b,{className:"slds-dropdown_left slds-dropdown_x-small"})))),Q({},$({},L({},".slds-dropdown_small")," ",Object(l.createElement)("br",null)," 15rem / 240px"),$({},Object(l.createElement)("div",{style:{height:"200px",width:"320px"}},Object(l.createElement)(y.b,{className:"slds-dropdown_left slds-dropdown_small"})))),Q({},$({},L({},".slds-dropdown_medium")," ",Object(l.createElement)("br",null)," 20rem / 320px"),$({},Object(l.createElement)("div",{style:{height:"200px",width:"320px"}},Object(l.createElement)(y.b,{className:"slds-dropdown_left slds-dropdown_medium"})))),Q({},$({},L({},".slds-dropdown_large")," ",Object(l.createElement)("br",null)," 25rem / 400px"),$({},Object(l.createElement)("div",{style:{height:"200px",width:"320px"}},Object(l.createElement)(y.b,{className:"slds-dropdown_left slds-dropdown_large"})))))),F({id:"Height"},"Height"),J({},"To adjust the length of visible menu dropdown items before overflow scrolling activates, add modifier ",L({},"slds-dropdown_length-*"),", or when using icons, ",L({},"slds-dropdown_length-with-icon-*"),", where the ",L({},"*")," is ",L({},"5"),", ",L({},"7"),", ",L({},"10"),". Apply the height classes to both the ",L({},"<div>"),"s with class ",L({},"slds-dropdown")," and ",L({},"slds-dropdown__list")),Object(l.createElement)(o.a,{toggleCode:!1},Object(l.createElement)("div",{className:"slds-dropdown slds-dropdown_left slds-dropdown_length-7"},Object(l.createElement)("ul",{class:"slds-dropdown__list slds-dropdown_length-7"},"..."))),q({},G({},Q({},z({},"Modifier"),z({},"Example"))),K({},Q({},$({},L({},".slds-dropdown_length-5")," ",Object(l.createElement)("br",null)," 5 items"),$({},Object(l.createElement)("div",{style:{height:"16rem",width:"320px"}},Object(l.createElement)(w,{fragmentChildren:Object(W.e)(M,"dropdown-menu-length-5")})))),Q({},$({},L({},".slds-dropdown_length-7")," ",Object(l.createElement)("br",null)," 7 items"),$({},Object(l.createElement)("div",{style:{height:"21rem",width:"320px"}},Object(l.createElement)(w,{fragmentChildren:Object(W.e)(M,"dropdown-menu-length-7")})))),Q({},$({},L({},".slds-dropdown_length-10")," ",Object(l.createElement)("br",null)," 10 items"),$({},Object(l.createElement)("div",{style:{height:"26rem",width:"320px"}},Object(l.createElement)(w,{fragmentChildren:Object(W.e)(M,"dropdown-menu-length-10")})))),Q({},$({},L({},".slds-dropdown_length-with-icon-5")," ",Object(l.createElement)("br",null)," 5 items"),$({},Object(l.createElement)("div",{style:{height:"16rem",width:"320px"}},Object(l.createElement)(w,{fragmentChildren:Object(W.e)(M,"dropdown-menu-length-5-icon")})))),Q({},$({},L({},".slds-dropdown_length-with-icon-7")," ",Object(l.createElement)("br",null)," 7 items"),$({},Object(l.createElement)("div",{style:{height:"21rem",width:"320px"}},Object(l.createElement)(w,{fragmentChildren:Object(W.e)(M,"dropdown-menu-length-7-icon")})))),Q({},$({},L({},".slds-dropdown_length-with-icon-10")," ",Object(l.createElement)("br",null)," 10 items"),$({},Object(l.createElement)("div",{style:{height:"28rem",width:"320px"}},Object(l.createElement)(w,{fragmentChildren:Object(W.e)(M,"dropdown-menu-length-10-icon")})))))))},X=function(){return Object(s.a)(V())}}});