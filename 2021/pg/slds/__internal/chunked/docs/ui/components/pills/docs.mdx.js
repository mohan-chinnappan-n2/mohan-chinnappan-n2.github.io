var SLDS="object"==typeof SLDS?SLDS:{};SLDS["__internal/chunked/docs/ui/components/pills/docs.mdx.js"]=function(e){function t(t){for(var a,o,s=t[0],r=t[1],c=t[2],p=0,u=[];p<s.length;p++)o=s[p],Object.prototype.hasOwnProperty.call(n,o)&&n[o]&&u.push(n[o][0]),n[o]=0;for(a in r)Object.prototype.hasOwnProperty.call(r,a)&&(e[a]=r[a]);for(d&&d(t);u.length;)u.shift()();return i.push.apply(i,c||[]),l()}function l(){for(var e,t=0;t<i.length;t++){for(var l=i[t],a=!0,s=1;s<l.length;s++){var r=l[s];0!==n[r]&&(a=!1)}a&&(i.splice(t--,1),e=o(o.s=l[0]))}return e}var a={},n={55:0},i=[];function o(t){if(a[t])return a[t].exports;var l=a[t]={i:t,l:!1,exports:{}};return e[t].call(l.exports,l,l.exports,o),l.l=!0,l.exports}o.m=e,o.c=a,o.d=function(e,t,l){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:l})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var l=Object.create(null);if(o.r(l),Object.defineProperty(l,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var a in e)o.d(l,a,function(t){return e[t]}.bind(null,a));return l},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="/assets/scripts/bundle/";var s=this.webpackJsonpSLDS___internal_chunked_docs=this.webpackJsonpSLDS___internal_chunked_docs||[],r=s.push.bind(s);s.push=t,s=s.slice();for(var c=0;c<s.length;c++)t(s[c]);var d=r;return i.push([258,0]),l()}({0:function(e,t){e.exports=React},18:function(e,t){e.exports=JSBeautify},19:function(e,t){e.exports=ReactDOM},258:function(e,t,l){"use strict";l.r(t),l.d(t,"getElement",(function(){return P})),l.d(t,"getContents",(function(){return N}));var a=l(0),n=l.n(a),i=l(4),o=l(1),s=(l(23),l(15),l(39)),r=l(2),c=l(37),d=l(10),p=l(27),u=n.a.createElement(p.d,null),m=[{id:"error",label:"Error",element:n.a.createElement(p.d,{className:"slds-has-error"},n.a.createElement("span",{className:"slds-pill__icon_container"},n.a.createElement("span",{className:"slds-icon_container",title:"Error"},n.a.createElement(d.a,{className:"slds-icon slds-icon-text-error",sprite:"utility",symbol:"error"}),n.a.createElement("span",{className:"slds-assistive-text"},"Warning"))))},{id:"truncated",label:"Truncated",demoStyles:"width: 220px;",element:n.a.createElement(p.e,null,n.a.createElement(p.d,{label:"Pill label that is longer than the area that contains it"}))}],h=[{id:"icon",label:"With icon",element:n.a.createElement(p.d,null,n.a.createElement("span",{className:"slds-pill__icon_container"},n.a.createElement("span",{className:"slds-icon_container slds-icon-standard-account",title:"Account"},n.a.createElement(d.a,{className:"slds-icon",sprite:"standard",symbol:"account"}),n.a.createElement("span",{className:"slds-assistive-text"},"Account"))))},{id:"avatar",label:"With avatar",element:n.a.createElement(p.d,null,n.a.createElement("span",{className:"slds-pill__icon_container"},n.a.createElement("span",{className:"slds-avatar slds-avatar_circle",title:"User avatar"},n.a.createElement("img",{alt:"Person name",src:"/assets/images/avatar2.jpg",title:"User avatar"}))))},{id:"container",label:"Pill with Container",element:n.a.createElement(p.e,null,n.a.createElement(p.d,null),n.a.createElement(p.d,null),n.a.createElement(p.d,null))},{id:"container-bare",label:"Pill with Bare Container - Deprecated",element:n.a.createElement(p.e,{variant:"container-bare"},n.a.createElement(p.d,null),n.a.createElement(p.d,null),n.a.createElement(p.d,null))}],b=l(43),f=l(32),E=n.a.createElement(p.e,{type:"listbox",id:"listbox-pill-default"},n.a.createElement(p.b,{id:"listbox-pill-default"},n.a.createElement(p.c,null,n.a.createElement(p.a,{tabIndex:"0"})),n.a.createElement(p.c,null,n.a.createElement(p.a,null)))),v=[{id:"listbox-pill-with-icon",label:"With icon",element:n.a.createElement(p.e,{type:"listbox",id:"listbox-pill-with-icon"},n.a.createElement(p.b,{id:"listbox-pill-with-icon"},n.a.createElement(p.c,null,n.a.createElement(p.a,{tabIndex:"0"},n.a.createElement(f.a,{containerClassName:"slds-pill__icon_container",title:"Account",assistiveText:"Account"}))),n.a.createElement(p.c,null,n.a.createElement(p.a,null,n.a.createElement(f.a,{containerClassName:"slds-pill__icon_container",symbol:"case",title:"Case",assistiveText:"Case"})))))},{id:"listbox-pill-with-avatar",label:"With avatar",element:n.a.createElement(p.e,{type:"listbox",id:"listbox-pill-with-avatar"},n.a.createElement(p.b,{id:"listbox-pill-with-avatar"},n.a.createElement(p.c,null,n.a.createElement(p.a,{tabIndex:"0"},n.a.createElement(b.a,{className:"slds-avatar_x-small slds-pill__icon_container"},n.a.createElement("img",{alt:"Person name",src:"/assets/images/avatar2.jpg",title:"User avatar"})))),n.a.createElement(p.c,null,n.a.createElement(p.a,null,n.a.createElement(b.a,{className:"slds-avatar_x-small slds-pill__icon_container"},n.a.createElement("img",{alt:"Person name",src:"/assets/images/avatar2.jpg",title:"User avatar"}))))))},{id:"listbox-pill-bare",label:"Bare",element:n.a.createElement(p.e,{type:"listbox",id:"listbox-pills-bare"},n.a.createElement(p.b,{id:"listbox-pills-bare"},n.a.createElement(p.c,null,n.a.createElement(p.a,{className:"slds-pill_bare",tabIndex:"0"})),n.a.createElement(p.c,null,n.a.createElement(p.a,{className:"slds-pill_bare"}))))},{id:"listbox-pill-group",label:"Grouped",element:n.a.createElement("div",null,n.a.createElement("div",{className:"slds-combobox_container"}),n.a.createElement(p.e,{variant:"listbox-group"},n.a.createElement(p.b,null,n.a.createElement(p.c,null,n.a.createElement(p.a,{tabIndex:"0"})),n.a.createElement(p.c,null,n.a.createElement(p.a,null)))))}],x=i.c.a,y=i.c.code,_=i.c.h2,w=i.c.h3,O=i.c.h4,g=i.c.li,j=i.c.p,k=i.c.strong,S=i.c.ul,P=function(){return Object(a.createElement)(i.b,{},Object(a.createElement)("div",{className:"lead doc"},"A pill represents an object that can be viewed with or without an icon."),Object(a.createElement)(o.a,{exampleOnly:!0},Object(r.e)(h,"icon")),_({id:"About-Pills"},"About Pills"),j({},"To create a pill, apply the ",y({},".slds-pill")," class on a ",y({},"<span>"),"."),j({},"Depending on your context, you will either need a base pill (linked or unlinked), or a pill option inside of a listbox. Note that a linked pill should not be used as a pill option inside of a listbox."),j({},"For linked pills, a modifier class of ",y({},"slds-pill_link")," needs to be added to the existing ",y({},"<span>")," with the class name of ",y({},"slds-pill"),". You need an ",y({},"<a>")," inside of the span with the ",y({},"slds-pill_link")," class. The ",y({},"<a>")," will get the class name of ",y({},"slds-pill__action"),". This will treat the interactions differently from an unlinked pill option inside of a listbox."),j({},"For both linked and unlinked pills, a ",y({},"<span>")," with the class name of ",y({},"slds-pill__label")," should contain the string of text describing the pill object."),j({},"Additionally, a pill can have an icon or image that sits to the left-hand side of the ",y({},".slds-pill__label"),". That icon or image should receive the class ",y({},".slds-pill__icon_container"),"."),j({},'You may also want the functionality to remove the pill as a selection. An "X" icon is normally used and will sit to the right-hand side of the ',y({},".slds-pill__label"),". That icon should receive the class ",y({},".slds-pill__remove"),"."),j({},"A ",y({},".slds-pill_container")," can be used as a visual container for multiple pill(s)."),w({id:"Mobile"},"Mobile"),Object(a.createElement)(c.a,{patternSpecificText:"pills will have an increased size to accommodate tapping with a finger instead of the more precise mouse cursor"}),Object(a.createElement)(o.a,{frameOnly:!0},Object(r.e)(h,"icon")),_({id:"Base"},"Base"),Object(a.createElement)(o.a,null,u),w({id:"Examples"},"Examples"),O({id:"With-Icon"},"With Icon"),Object(a.createElement)(o.a,null,Object(r.e)(h,"icon")),O({id:"With-Avatar"},"With Avatar"),Object(a.createElement)(o.a,null,Object(r.e)(h,"avatar")),O({id:"Pill-with-Container"},"Pill with Container"),Object(a.createElement)(o.a,null,Object(r.e)(h,"container")),w({id:"States"},"States"),O({id:"Error"},"Error"),Object(a.createElement)(o.a,null,Object(r.e)(m,"error")),O({id:"Truncated"},"Truncated"),j({},"The pills component will respect the width of its parent and truncate if necessary."),Object(a.createElement)(o.a,{demoStyles:"width: 220px;"},Object(r.e)(m,"truncated")),_({id:"Listbox-Of-Pill-Options"},"Listbox Of Pill Options"),Object(a.createElement)(o.a,null,E),j({},"A Listbox of Pills is a way to display a list of selected options when performing user input, usually from a multi-select ",x({href:"/components/combobox"},"Combobox"),", ",x({href:"/components/lookups"},"Lookup")," or ",x({href:"/components/picklist"},"Picklist"),"."),j({},"Note that a linked pill should not be used as a pill option inside of a listbox"),w({id:"Accessibility"},"Accessibility"),j({},k({},"Interaction requirements")),S({},g({},"Only 1 focused Pill per set of Pills"),g({},"The remove button must not be a focusable element, but can be clickable"),g({},"Delete with a keyboard is performed with the ",y({},"Backspace")," or ",y({},"Delete")," key when focused on a pill")),j({},k({},"Notable attributes")),S({},g({},y({},'role="listbox"')," is placed on the ",y({},"ul")),g({},y({},"aria-label")," is applied to ",y({},"listbox")," to describe what the list of options are to the user"),g({},y({},'aria-orientation="horizontal"')," is applied to the ",y({},"listbox")," to describe the left to right direction of the pills"),g({},y({},'role="presentation"')," is placed on the ",y({},"li")," elements"),g({},y({},'role="option"')," is placed on the ",y({},"slds-pill")," elements"),g({},y({},'aria-selected="true"')," is applied to all ",y({},"option")," elements, this is because they have all be selected"),g({},y({},'tabindex="0"')," is applied to the ",y({},"option")," that is in focus last. By default it is placed on the first ",y({},"option"))),j({},k({},"Keyboard navigation")),S({},g({},"The first ",y({},"option")," in the list will be take user focus initially, when tabbed to"),g({},y({},"Right")," arrow key will move focus to the next pill in the list"),g({},y({},"Left")," arrow key will move focus to the previous pill in the list"),g({},y({},"Left")," arrow key when on the first ",y({},"option")," should cycle user focus to the last ",y({},"option")),g({},y({},"Right")," arrow key when on the last ",y({},"option")," should cycle user focus to the first ",y({},"option")),g({},y({},"Delete")," or ",y({},"Backspace")," key when focused on an ",y({},"option")," should remove that ",y({},"option"),". Focus should then be placed on the nearest ",y({},"option"),S({},g({},"When on the last ",y({},"option"),", place user focus on the previous ",y({},"option")),g({},"When on the first ",y({},"option"),", place user focus on the next ",y({},"option")),g({},"When on the only ",y({},"option"),", place user focus on the ",y({},"listbox")," or any ",y({},"input")," element the ",y({},"option")," might be associated with")))),w({id:"Examples-2"},"Examples"),O({id:"With-Icon-2"},"With Icon"),Object(a.createElement)(o.a,null,Object(r.e)(v,"listbox-pill-with-icon")),O({id:"With-Avatar-2"},"With Avatar"),Object(a.createElement)(o.a,null,Object(r.e)(v,"listbox-pill-with-avatar")),w({id:"Layout"},"Layout"),O({id:"Bare"},"Bare"),Object(a.createElement)(o.a,null,Object(r.e)(v,"listbox-pill-bare")),_({id:"Styling-Hooks-Overview"},"Styling Hooks Overview"),Object(a.createElement)(s.a,{name:"pills",type:"component"}))},N=function(){return Object(i.a)(P())}}});