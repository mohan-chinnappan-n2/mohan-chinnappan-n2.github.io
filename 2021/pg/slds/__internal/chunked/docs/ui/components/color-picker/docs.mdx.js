var SLDS="object"==typeof SLDS?SLDS:{};SLDS["__internal/chunked/docs/ui/components/color-picker/docs.mdx.js"]=function(e){function t(t){for(var o,s,l=t[0],i=t[1],c=t[2],u=0,m=[];u<l.length;u++)s=l[u],Object.prototype.hasOwnProperty.call(n,s)&&n[s]&&m.push(n[s][0]),n[s]=0;for(o in i)Object.prototype.hasOwnProperty.call(i,o)&&(e[o]=i[o]);for(d&&d(t);m.length;)m.shift()();return a.push.apply(a,c||[]),r()}function r(){for(var e,t=0;t<a.length;t++){for(var r=a[t],o=!0,l=1;l<r.length;l++){var i=r[l];0!==n[i]&&(o=!1)}o&&(a.splice(t--,1),e=s(s.s=r[0]))}return e}var o={},n={21:0},a=[];function s(t){if(o[t])return o[t].exports;var r=o[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,s),r.l=!0,r.exports}s.m=e,s.c=o,s.d=function(e,t,r){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(s.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)s.d(r,o,function(t){return e[t]}.bind(null,o));return r},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="/assets/scripts/bundle/";var l=this.webpackJsonpSLDS___internal_chunked_docs=this.webpackJsonpSLDS___internal_chunked_docs||[],i=l.push.bind(l);l.push=t,l=l.slice();for(var c=0;c<l.length;c++)t(l[c]);var d=i;return a.push([237,0]),r()}({0:function(e,t){e.exports=React},18:function(e,t){e.exports=JSBeautify},19:function(e,t){e.exports=ReactDOM},237:function(e,t,r){"use strict";r.r(t),r.d(t,"getElement",(function(){return Y})),r.d(t,"getContents",(function(){return Z}));var o=r(0),n=r.n(o),a=r(4),s=r(1),l=(r(26),r(45),r(15)),i=r(2),c=r(5),d=r.n(c),u=r(10),m=r(13),h=r(28),p=r(33),f=r(8),b=r(16);function y(e){return(y="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function k(e,t){for(var r=0;r<t.length;r++){var o=t[r];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function v(e,t){return(v=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function E(e,t){return!t||"object"!==y(t)&&"function"!=typeof t?_(e):t}function _(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function g(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return!1}}function O(e){return(O=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var w=["#e3abec","#c2dbf7","#9fd6ff","#9de7da","#9df0c0","#fff099","#fed49a","#d073e0","#86baf3","#5ebbff","#44d8be","#3be282","#ffe654","#ffb758","#bd35bd","#5779c1","#5ebbff","#00aea9","#3cba4c","#f5bc25","#f99221","#580d8c","#001970","#0a2399","#0b7477","#0b6b50","#b67e11","#b85d0d"],S=function(e){return n.a.createElement("span",{key:i.c.uniqueId("swatch-"),className:"slds-swatch",style:{background:e.color}},n.a.createElement("span",{className:"slds-assistive-text","aria-hidden":e.ariaHidden},e.color))},x=function(e){var t=e.hasSummaryError,r="color-picker-summary-error";return n.a.createElement(f.b,{formElementClassName:"slds-color-picker__summary",labelContent:"Choose Color",labelClassName:"slds-color-picker__summary-label",inputId:"color-picker-summary-input",hasError:t},n.a.createElement(m.a,{className:"slds-color-picker__summary-button slds-button_icon slds-button_icon-more",title:"Choose Color"},n.a.createElement(S,{color:"hsl(220, 46%, 55%)",suppressAssistiveText:!0}),n.a.createElement(u.a,{className:"slds-button__icon slds-button__icon_small slds-m-left_xx-small",sprite:"utility",symbol:"down"}),n.a.createElement("span",{className:"slds-assistive-text"},"Choose a color. Current color: #5679C0")),n.a.createElement("div",{className:"slds-color-picker__summary-input"},n.a.createElement(b.a,{id:"color-picker-summary-input",defaultValue:"#5679C0","aria-describedby":t?r:null})),t?n.a.createElement("p",{className:"slds-form-error",id:r},"Please ensure value is correct"):null)},j=function(e){var t=e.isMenuRole,r=t?"menu":"listbox",o=t?"menuitem":"option";return n.a.createElement("ul",{className:"slds-color-picker__swatches",role:r},w.map((function(e,t){return n.a.createElement("li",{key:i.c.uniqueId("color-picker-swatch-"),className:"slds-color-picker__swatch",role:"presentation"},n.a.createElement("a",{className:"slds-color-picker__swatch-trigger",href:"#",role:o,tabIndex:0===t?0:-1},n.a.createElement(S,{color:e,index:t})))})))},C=function(e){var t=i.c.uniqueId("color-picker-input-range-"),r=i.c.uniqueId("color-picker-input-hex-"),o=i.c.uniqueId("color-picker-input-r-"),a=i.c.uniqueId("color-picker-input-g-"),s=i.c.uniqueId("color-picker-input-b-"),l=e.hasCustomError;return n.a.createElement("div",{className:"slds-color-picker__custom"},n.a.createElement("p",{id:"color-picker-instructions",className:"slds-assistive-text"},"Use arrow keys to select a saturation and brightness, on an x and y axis."),n.a.createElement("div",{className:"slds-color-picker__custom-range",style:{background:"hsl(220, 100%, 50%)"}},n.a.createElement("a",{className:"slds-color-picker__range-indicator",style:{bottom:"45%",left:"46%"},href:"#","aria-live":"assertive","aria-atomic":"true","aria-describedby":"color-picker-instructions"},n.a.createElement("span",{className:"slds-assistive-text"},"Saturation: 46%. Brightness: 45%."))),n.a.createElement("div",{className:"slds-color-picker__hue-and-preview"},n.a.createElement("label",{className:"slds-assistive-text",htmlFor:t},"Select Hue"),n.a.createElement("input",{type:"range",className:"slds-color-picker__hue-slider",min:"0",max:"360",defaultValue:"208",id:t}),n.a.createElement(S,{color:"#5679C0",ariaHidden:!0})),n.a.createElement("div",{className:"slds-color-picker__custom-inputs"},n.a.createElement(f.b,{labelContent:"Hex",formElementClassName:"slds-color-picker__input-custom-hex",hasError:l,inputId:r},n.a.createElement(b.a,{id:r,defaultValue:"#5679C0","aria-describedby":l?"color-picker-custom-error":null})),n.a.createElement(f.b,{labelContent:n.a.createElement("abbr",{title:"Red"},"R"),inputId:o},n.a.createElement(b.a,{defaultValue:"86",id:o})),n.a.createElement(f.b,{labelContent:n.a.createElement("abbr",{title:"Green"},"G"),inputId:a},n.a.createElement(b.a,{defaultValue:"121",id:a})),n.a.createElement(f.b,{labelContent:n.a.createElement("abbr",{title:"blue"},"B"),inputId:s},n.a.createElement(b.a,{defaultValue:"192",id:s}))),l?n.a.createElement("p",{className:"slds-form-error",id:"color-picker-custom-error"},"Please ensure value is correct"):null)},T=function(){return n.a.createElement("div",{className:"slds-color-picker__selector-footer"},n.a.createElement(m.a,{isNeutral:!0},"Cancel"),n.a.createElement(m.a,{isBrand:!0},"Done"))},I=function(e){return n.a.createElement(h.a,{selectedIndex:e.selectedTabIndex},n.a.createElement(h.a.Item,{title:"Default",id:"color-picker-default"},n.a.createElement(j,null)),n.a.createElement(h.a.Item,{title:"Custom",id:"color-picker-custom"},n.a.createElement(C,{hasCustomError:e.hasCustomError})))},P=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&v(e,t)}(l,e);var t,r,o,a,s=(t=l,function(){var e,r=O(t);if(g()){var o=O(this).constructor;e=Reflect.construct(r,arguments,o)}else e=r.apply(this,arguments);return E(this,e)});function l(e){var t;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),(t=s.call(this)).state={selectedTabIndex:e.selectedTabIndex||0},t.isFullFeatureMode=t.isFullFeatureMode.bind(_(t)),t.isPredefinedMode=t.isPredefinedMode.bind(_(t)),t.isCustomOnlyMode=t.isCustomOnlyMode.bind(_(t)),t.isSwatchesOnlyMode=t.isSwatchesOnlyMode.bind(_(t)),t}return r=l,(o=[{key:"isFullFeatureMode",value:function(){var e=this.props,t=e.hasPredefined,r=e.hasCustom;return!(!t||!r)}},{key:"isPredefinedMode",value:function(){var e=this.props,t=e.hasPredefined,r=e.hasCustom;return!(!t||r)}},{key:"isCustomOnlyMode",value:function(){var e=this.props,t=e.hasPredefined,r=e.hasCustom;return!(t||!r)}},{key:"isSwatchesOnlyMode",value:function(){var e=this.props,t=e.hasPredefined,r=e.hasCustom;return!(t||r)}},{key:"render",value:function(){var e=this.state.selectedTabIndex,t=this.props,r=t.isOpen,o=t.hasSummaryError,a=t.hasCustomError,s=r?"slds-show":"slds-hide",l=this.isSwatchesOnlyMode()?null:n.a.createElement(x,{hasSummaryError:o}),i=this.isSwatchesOnlyMode()?null:n.a.createElement(T,null),c=null;return this.isFullFeatureMode()?c=n.a.createElement(I,{hasCustomError:a,selectedTabIndex:e}):this.isPredefinedMode()?c=n.a.createElement(j,null):this.isCustomOnlyMode()?c=n.a.createElement(C,{hasCustomError:a}):this.isSwatchesOnlyMode()&&(c=n.a.createElement(I,{selectedTabIndex:e})),n.a.createElement("div",{className:"slds-color-picker"},l,n.a.createElement(p.a,{title:"Choose a color",className:d()("slds-color-picker__selector",s),footer:i},c))}}])&&k(r.prototype,o),a&&k(r,a),l}(n.a.Component);P.defaultProps={selectedTabIndex:0,isOpen:!1,hasPredefined:!0,hasCustom:!0};var N=P,M=n.a.createElement(N,null),A=[{id:"summary-error",label:"Summary Error",element:n.a.createElement(N,{hasSummaryError:!0})},{id:"color-picker-open",label:"Open, default tab selected",element:n.a.createElement(N,{isOpen:!0})},{id:"custom-tab-selected",label:"Open, custom tab selected",element:n.a.createElement(N,{isOpen:!0,selectedTabIndex:1})},{id:"custom-tab-selected-error",label:"Open, custom tab selected, error state",element:n.a.createElement(N,{isOpen:!0,hasCustomError:!0,selectedTabIndex:1})}],R=n.a.createElement(N,{hasPredefined:!1}),F=[{id:"custom-color-picker-open",label:"Open",element:n.a.createElement(N,{isOpen:!0,hasPredefined:!1})},{id:"custom-color-picker-open-error",label:"Open with Error",element:n.a.createElement(N,{isOpen:!0,hasCustomError:!0,hasPredefined:!1})}],H=n.a.createElement(N,{hasCustom:!1}),B=[{id:"predefined-color-picker-open",label:"Open",element:n.a.createElement(N,{isOpen:!0,hasCustom:!1})}],D=r(9),q=n.a.createElement(D.l,null,n.a.createElement("div",{className:"slds-dropdown slds-dropdown_left"},n.a.createElement("div",{className:"slds-color-picker slds-color-picker_swatches-only"},n.a.createElement("div",{className:"slds-color-picker__selector"},n.a.createElement(j,{isMenuRole:!0}))))),L=[{id:"open-swatches-only-color-picker",label:"Open",element:n.a.createElement("div",{style:{height:"12rem"}},n.a.createElement(D.l,{className:"slds-is-open"},n.a.createElement("div",{className:"slds-dropdown slds-dropdown_left"},n.a.createElement("div",{className:"slds-color-picker slds-color-picker_swatches-only"},n.a.createElement("div",{className:"slds-color-picker__selector"},n.a.createElement(j,{isMenuRole:!0}))))))}],V=a.c.code,G=a.c.em,U=a.c.h2,K=a.c.h3,J=a.c.h4,W=a.c.li,z=a.c.p,Q=a.c.strong,X=a.c.ul,Y=function(){return Object(o.createElement)(a.b,{},Object(o.createElement)("div",{className:"doc lead"},"A configurable interface for color selection"),Object(o.createElement)(s.a,{exampleOnly:!0},Object(i.e)(A,"color-picker-open")),U({id:"About-Color-Picker"},"About Color Picker"),z({},"The Unified Color Picker component allows for a fully accessible and configurable color picker, allowing the user to pick from a set of predefined colors (swatches), or to pick a custom color using a HSB selection interface."),z({},"It can be configured to show one or both of those color selection interfaces."),z({},"The Unified Color Picker component allows for a fully accessible and configurable\ncolor picker, allowing the user to pick from a set of predefined colors\n(swatches), or to pick a custom color using a HSB selection interface."),z({},"It can be configured to show one or both of those color selection interfaces."),K({id:"Accessibility"},"Accessibility"),z({},"This component makes use of other components, such as Popovers, Tabs, and Input.\nAll accessibility rules and guidelines for those components ",G({},"need")," to be followed\nfor proper accessibility support."),z({},"As this is a highly interactive component, there are some key accessibility\nguidelines that must be followed for specific elements:"),z({},Q({},".slds-color-picker__summary-label")),z({},"This element ",G({},"needs")," a for attribute with the value of the\n",V({},".slds-color-picker__summary-input"),"'s ID"),z({},Q({},".slds-color-picker__swatches")),z({},"This element ",G({},"needs")," a ",V({},"role")," of ",V({},"listbox"),"."),z({},Q({},".slds-color-picker__swatch")),z({},"This element ",G({},"needs")," a ",V({},"role")," of ",V({},"presentation"),"."),z({},Q({},".slds-color-picker__swatch-trigger")),z({},"This element ",G({},"needs")," a ",V({},"role")," of ",V({},"option"),"."),z({},Q({},".slds-color-picker__range-indicator")),z({},"Since this element is focused and moved to indicate the ",G({},"working color")," it ",G({},"needs"),"\nproper aria tags to indicate its job and value. First, an ",V({},"aria-live")," attribute\n",G({},"needs")," to be set to ",V({},"assertive"),", ",V({},"aria-atomic")," ",G({},"needs")," to be set to ",V({},"true"),", and\n",V({},"aria-describedby")," needs to reference the instructions text for the custom color\npicker range, which in our example is the hidden ",V({},"#color-picker-instructions"),"\nelement."),U({id:"Base"},"Base"),Object(o.createElement)(s.a,null,M),K({id:"States"},"States"),J({id:"Summary-Error"},"Summary Error"),Object(o.createElement)(s.a,null,Object(i.e)(A,"summary-error")),J({id:"Open-default-tab-selected"},"Open, default tab selected"),Object(o.createElement)(s.a,null,Object(i.e)(A,"color-picker-open")),J({id:"Open-custom-tab-selected"},"Open, custom tab selected"),Object(o.createElement)(s.a,null,Object(i.e)(A,"custom-tab-selected")),J({id:"Open-custom-tab-selected-error-state"},"Open, custom tab selected, error state"),Object(o.createElement)(s.a,null,Object(i.e)(A,"custom-tab-selected-error")),U({id:"Custom-Only"},"Custom Only"),z({},"The Custom-Only variant should only render the custom color selection tool in the Color Picker popover. It should not be inside a tabset."),Object(o.createElement)(s.a,null,R),K({id:"States-2"},"States"),J({id:"Open"},"Open"),Object(o.createElement)(s.a,null,Object(i.e)(F,"custom-color-picker-open")),J({id:"Open-with-Error"},"Open with Error"),Object(o.createElement)(s.a,null,Object(i.e)(F,"custom-color-picker-open-error")),U({id:"Predefined-Only"},"Predefined Only"),z({},"The Predefined Only variant should only render the predefined colors selection in the Color Picker popover. It should not be inside a tabset."),Object(o.createElement)(s.a,null,H),K({id:"States-3"},"States"),J({id:"Open-2"},"Open"),Object(o.createElement)(s.a,null,Object(i.e)(B,"predefined-color-picker-open")),U({id:"Swatches-Only"},"Swatches Only"),z({},"The Swatches Only variant should only render a group of individual swatches. It should not render any of the main chrome of the color picker UI (no Summary section, no Popover, no Tabset), it should only render the Color Picker swatches selector. This component should be rendered inside a menu."),Object(o.createElement)(l.a,{type:"a11y",header:"Accessibility Note"},Object(o.createElement)("p",null,"The accessibility requirements for this Variant are slightly different from the others:"),Object(o.createElement)("ul",{className:"slds-list_dotted"},Object(o.createElement)("li",null,Object(o.createElement)("code",null,".slds-color-picker__swatches")," ",Object(o.createElement)("em",null,"needs")," a ",Object(o.createElement)("code",null,"role")," of ",Object(o.createElement)("code",null,"menu"),"."),Object(o.createElement)("li",null,Object(o.createElement)("code",null,".slds-color-picker__swatch-trigger")," ",Object(o.createElement)("em",null,"needs")," a ",Object(o.createElement)("code",null,"role")," of ",Object(o.createElement)("code",null,"option")))),Object(o.createElement)(s.a,null,q),K({id:"States-4"},"States"),J({id:"Open-3"},"Open"),Object(o.createElement)(s.a,null,Object(i.e)(L,"open-swatches-only-color-picker")),U({id:"Implementation-Guidelines"},"Implementation Guidelines"),z({},"The Color Picker is a dynamic component with several 'live' areas. These areas need to update when certain user interactions occur."),K({id:"Terms"},"Terms"),z({},"Several terms are used in this document, each with particular meaning. Please take note of the following:"),X({},W({},G({},Q({},"Need/s"))," This rule must be implemented for the component to appear or function as expected."),W({},G({},Q({},"Current color"))," The current selected, submitted, and validated color."),W({},G({},Q({},"Working color"))," The working, unsubmitted color, built with the custom-range tool.")),K({id:"Functionality"},"Functionality"),z({},"When creating an implementation of this UI component, please take note to include the following functionality:"),z({},Q({},".slds-color-picker__button")),z({},"Aside from the 'swatches-only' variant, all Color Picker variants have a summary section with a clickable button. This button ",G({},"needs")," to toggle the visibility of the ",V({},".slds-color-picker__selector")," popover."),z({},Q({},".slds-color-picker__button .slds-swatch")),z({},"This swatch ",G({},"needs")," an inline style of ",V({},"background"),", set to the ",G({},"current color"),". It ",G({},"needs")," to update whenever the ",G({},"current color")," is updated."),z({},Q({},".slds-color-picker__summary-input")),z({},"This input ",G({},"needs")," to display the hex value of the ",G({},"current color"),". It should update whenever ",G({},"current color")," is updated. The user can enter a hex color manually. The implementation should check for the validity of the submitted value before setting the color to be the ",G({},"current color"),"."),z({},Q({},".slds-color-picker__hue-slider")),z({},"In the custom picker, the hue slider is a range input element that allows the user to select a hue base for a ",G({},"working color"),". Its value ranges from 0 - 360, and represents the hue in an expected hsv color format."),z({},"When the user updates the ",G({},"current color"),", the value on this slider ",G({},"needs")," to be adjusted to the ",G({},"current color"),"'s hue."),z({},Q({},".slds-color-picker__custom-range")),z({},"The custom range represents a matrix of all saturation and brightness combinations of the ",G({},"working color"),"'s hue. The x axis of the form represents saturation, and goes from 0% to 100%. On the y axis, brightness is represented, with 0% brightness at the bottom, and 100% brightness at the top."),z({},"Keep in mind that when implementing color conversions, this custom range picker is utilizing the HSB/HSV color model, and not the HSL model."),z({},"This element ",G({},"needs")," an inline style, with the ",V({},"background")," property set to the ",G({},"working color"),"'s hue, as defined by the hue range input element described above. As this element is meant to represent the current ",G({},"working color"),"'s hue's saturation and lightness matrix, css's hsl() syntax is the most appropriate format here, with the hue being the current ",G({},"working color"),"'s hue, the saturation set to 100% and the lightness set to 50% (the 50% lightness is to adjust this HSL range for the HSB color model)."),z({},"A gradient overlay will produce the effect of the saturation and brightness matrix automatically."),z({},"Any mouse clicks on the custom range ",G({},"need")," to set the position of the ",V({},".slds-color-picker__range-indicator")," to the clicked coordinates, and also ",G({},"need")," to update the saturation and brightness values on the working color."),z({},Q({},".slds-color-picker__range-indicator")),z({},"This is the targeting element inside the custom range, and represents the current brightness and saturation values of the ",G({},"working color"),"."),z({},"It ",G({},"needs")," declarations for ",V({},"bottom")," and ",V({},"left")," positioning, so it will be properly placed over the correct area of the ",V({},".slds-color-picker__custom-range"),"."),z({},"Conveniently, the values are uniformly represented. The ",V({},"left")," declaration indicates the saturation value, from 0% to 100%, and the ",V({},"bottom")," declaration indicates the brightness value, from 0% to 100%."),z({},Q({},".slds-color-picker__hue-and-preview .slds-swatch")),z({},"This swatch is a preview element of the ",G({},"working color")," value from the hue slider and range indicator above. It ",G({},"needs")," an inline style for ",V({},"background"),", set to the completed ",G({},"working color")," value."),z({},Q({},".slds-color-picker__custom-inputs")),z({},"The Hex, R(ed), G(reen), and B(lue) text inputs included in this section are representative of the current ",G({},"working color"),"'s converted Hex or RGB values, and ",G({},"need")," to display those as their value."),z({},"Users can, however, directly input into these elements. A valid entry ",G({},"needs")," to update the working color and update related elements. The implementation should protect against invalid submissions."),K({id:"Keyboard-Interactions"},"Keyboard Interactions"),z({},Q({},".slds-color-picker__swatches")),z({},"This element has the role of ",V({},"listbox"),", and keyboard interactions when its <a> children are focused ",G({},"needs")," to behave in a menu-like fashion. Keypresses ",G({},"need")," to move the actively focused element in the appropriate direction (left/up will move to the previous item, down/right will move to the next item)."),z({},"Additionally, when focused on the first or last item, the appropriate key action ",G({},"needs")," to move the focus to the last or first item, respectively. It is expected to behave in a cyclical fashion."),z({},Q({},".slds-color-picker__range-indicator")),z({},"The range indicator, when focused, ",G({},"needs")," to respond to arrow keypresses by moving 1% in the appropriate direction, unless prohibited by a boundary."),z({},"For an additional effect, if an arrow key is pressed in combination with shift, the indicator can move 10% in the given direction, unless prohibited by a boundary."),z({},Q({},"Other Interactions")),z({},"Other expected keyboard interactions (such as input field updates) and their effects on UI can be found in the Implementation Guidelines section above."))},Z=function(){return Object(a.a)(Y())}}});