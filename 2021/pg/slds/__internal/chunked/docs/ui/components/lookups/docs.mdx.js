var SLDS="object"==typeof SLDS?SLDS:{};SLDS["__internal/chunked/docs/ui/components/lookups/docs.mdx.js"]=function(e){function t(t){for(var s,n,i=t[0],c=t[1],r=t[2],m=0,u=[];m<i.length;m++)n=i[m],Object.prototype.hasOwnProperty.call(o,n)&&o[n]&&u.push(o[n][0]),o[n]=0;for(s in c)Object.prototype.hasOwnProperty.call(c,s)&&(e[s]=c[s]);for(d&&d(t);u.length;)u.shift()();return l.push.apply(l,r||[]),a()}function a(){for(var e,t=0;t<l.length;t++){for(var a=l[t],s=!0,i=1;i<a.length;i++){var c=a[i];0!==o[c]&&(s=!1)}s&&(l.splice(t--,1),e=n(n.s=a[0]))}return e}var s={},o={46:0},l=[];function n(t){if(s[t])return s[t].exports;var a=s[t]={i:t,l:!1,exports:{}};return e[t].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=e,n.c=s,n.d=function(e,t,a){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(n.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)n.d(a,s,function(t){return e[t]}.bind(null,s));return a},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="/assets/scripts/bundle/";var i=this.webpackJsonpSLDS___internal_chunked_docs=this.webpackJsonpSLDS___internal_chunked_docs||[],c=i.push.bind(i);i.push=t,i=i.slice();for(var r=0;r<i.length;r++)t(i[r]);var d=c;return l.push([249,0]),a()}({0:function(e,t){e.exports=React},18:function(e,t){e.exports=JSBeautify},19:function(e,t){e.exports=ReactDOM},249:function(e,t,a){"use strict";a.r(t),a.d(t,"getElement",(function(){return T})),a.d(t,"getContents",(function(){return k}));var s=a(0),o=a.n(s),l=a(4),n=a(1),i=(a(26),a(45),a(15),a(2)),c=a(24),r=a(25),d=a(7),m=a(12),u=a(32),p=a(29),b=o.a.createElement(c.b,{id:"combobox-id-1","aria-controls":"listbox-id-1",autocomplete:!0,inputIconPosition:"right",rightInputIcon:o.a.createElement(m.a,{symbol:"search",className:"slds-icon slds-icon_x-small slds-icon-text-default",containerClassName:"slds-input__icon slds-input__icon_right",assistiveText:!1,title:!1}),results:o.a.createElement(r.e,{id:"listbox-id-1",snapshot:p.b,type:"entity",count:3}),resultsType:"listbox",hasInteractions:!0}),h=[{id:"focused",label:"Focused",element:o.a.createElement(c.b,{id:"combobox-id-2","aria-controls":"listbox-id-2",autocomplete:!0,inputIconPosition:"right",rightInputIcon:o.a.createElement(m.a,{symbol:"search",className:"slds-icon slds-icon_x-small slds-icon-text-default",containerClassName:"slds-input__icon slds-input__icon_right",assistiveText:!1,title:!1}),results:o.a.createElement(r.e,{id:"listbox-id-2",snapshot:p.b,type:"entity",count:3}),resultsType:"listbox",isOpen:!0,hasFocus:!0})},{id:"open-item-focused",label:"Open - Item Focused",element:o.a.createElement(c.b,{id:"combobox-id-3","aria-controls":"listbox-id-3",autocomplete:!0,inputIconPosition:"right",rightInputIcon:o.a.createElement(m.a,{symbol:"search",className:"slds-icon slds-icon_x-small slds-icon-text-default",containerClassName:"slds-input__icon slds-input__icon_right",assistiveText:!1,title:!1}),results:o.a.createElement(r.e,{id:"listbox-id-3",snapshot:p.c,type:"entity",count:3}),resultsType:"listbox","aria-activedescendant":"option1",isOpen:!0,hasFocus:!0})},{id:"displaying-options-based-on-input",label:"Displaying options based on user input",element:o.a.createElement(c.b,{id:"combobox-id-4","aria-controls":"listbox-id-4",autocomplete:!0,inputIconPosition:"right",rightInputIcon:o.a.createElement(m.a,{symbol:"search",className:"slds-icon slds-icon_x-small slds-icon-text-default",containerClassName:"slds-input__icon slds-input__icon_right",assistiveText:!1,title:!1}),value:"salesforce",results:o.a.createElement(r.e,{id:"listbox-id-4",snapshot:p.d,term:"salesforce",type:"entity",count:4}),resultsType:"listbox","aria-activedescendant":"option1",isOpen:!0,hasFocus:!0})},{id:"closed-option-selected",label:"Option Selected",element:o.a.createElement(c.b,{id:"combobox-id-5","aria-controls":"listbox-id-5",inputIconPosition:"left-right",leftInputIcon:o.a.createElement(u.a,{symbol:"account",className:"slds-icon_small",containerClassName:"slds-combobox__input-entity-icon",assistiveText:"Account",title:"Account"}),rightInputIcon:o.a.createElement(d.b,{className:"slds-input__icon slds-input__icon_right",symbol:"close",title:"Remove selected option",assistiveText:"Remove selected option"}),results:o.a.createElement(r.e,{id:"listbox-id-5",snapshot:p.b,type:"entity",count:2}),resultsType:"listbox",hasSelection:!0,value:"Salesforce.com, Inc.",readonly:!0})}],y=a(10),E=a(22),x=o.a.createElement("div",{className:"demo-only",style:{height:"640px"}},o.a.createElement(E.b,{className:"slds-modal_large"},o.a.createElement(E.e,null,o.a.createElement("h2",{className:"slds-text-heading_medium"},"Account name")),o.a.createElement(E.c,null,o.a.createElement("div",{className:"slds-lookup","data-select":"multi","data-scope":"single","data-typeahead":"true",role:"combobox","aria-haspopup":"listbox","aria-expanded":"true"},o.a.createElement("div",{className:"slds-form-element slds-p-top_medium slds-p-horizontal_medium slds-m-bottom_small"},o.a.createElement("label",{className:"slds-form-element__label",htmlFor:"lookup"},"Accounts"),o.a.createElement("div",{className:"slds-form-element__control slds-input-has-icon slds-input-has-icon_right"},o.a.createElement(y.a,{className:"slds-icon slds-input__icon slds-icon-text-default",sprite:"utility",symbol:"search"}),o.a.createElement("input",{id:"lookup",className:"slds-input",type:"text","aria-haspopup":"true",role:"textbox","aria-activedescendant":"","aria-autocomplete":"list","aria-controls":"lookup-grouped-table-id-1"}))),o.a.createElement("table",{className:"slds-table slds-table_bordered slds-table_cell-buffer slds-no-row-hover",role:"listbox",id:"lookup-grouped-table-id-1"},o.a.createElement("thead",null,o.a.createElement("tr",null,o.a.createElement("th",{colSpan:"4",scope:"col"},o.a.createElement("div",{className:"slds-float_right"},o.a.createElement(d.b,{className:"slds-button_icon slds-button_icon-x-small",symbol:"filterList",assistiveText:"Filter List",title:"Filter List"}),o.a.createElement(d.b,{className:"slds-button_icon slds-button_icon-x-small",symbol:"sort",assistiveText:"Sort",title:"Sort"})),"5 Results, sorted by relevancy")),o.a.createElement("tr",null,o.a.createElement("th",{scope:"col"},o.a.createElement("div",{className:"slds-truncate",title:"Account Name"},"Account Name")),o.a.createElement("th",{scope:"col"},o.a.createElement("div",{className:"slds-truncate",title:"Location"},"Location")),o.a.createElement("th",{scope:"col"},o.a.createElement("div",{className:"slds-truncate",title:"Secondary Column"},"Secondary Column")),o.a.createElement("th",{scope:"col"},o.a.createElement("div",{className:"slds-truncate",title:"Tertiary Column"},"Tertiary Column")))),o.a.createElement("tbody",null,o.a.createElement("tr",null,o.a.createElement("th",{scope:"row"},o.a.createElement("a",{id:"s01",href:"#",onClick:function(e){return e.preventDefault()},role:"option"},o.a.createElement("div",{className:"slds-truncate",title:"Acme Landscape"},o.a.createElement(y.a,{className:"slds-icon slds-icon-standard-account slds-icon_small slds-m-right_x-small",sprite:"standard",symbol:"account"}),"Acme Landscape"))),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Seattle, WA"},"Seattle, WA")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Secondary Field"},"Secondary Field")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Tertiary Field"},"Tertiary Field"))),o.a.createElement("tr",null,o.a.createElement("th",{scope:"row"},o.a.createElement("a",{id:"s02",href:"#",onClick:function(e){return e.preventDefault()},role:"option"},o.a.createElement("div",{className:"slds-truncate",title:"ACME Construction"},o.a.createElement(y.a,{className:"slds-icon slds-icon-standard-account slds-icon_small slds-m-right_x-small",sprite:"standard",symbol:"account"}),"ACME Construction"))),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"San Francisco, CA"},"San Francisco, CA")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Secondary Field"},"Secondary Field")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Tertiary Field"},"Tertiary Field"))),o.a.createElement("tr",null,o.a.createElement("th",{scope:"row"},o.a.createElement("a",{id:"s03",href:"#",onClick:function(e){return e.preventDefault()},role:"option"},o.a.createElement("div",{className:"slds-truncate",title:"Action Sports"},o.a.createElement(y.a,{className:"slds-icon slds-icon-standard-account slds-icon_small slds-m-right_x-small",sprite:"standard",symbol:"account"}),"Action Sports"))),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Madison, WI"},"Madison, WI")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Secondary Field"},"Secondary Field")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Tertiary Field"},"Tertiary Field"))),o.a.createElement("tr",null,o.a.createElement("th",{scope:"row"},o.a.createElement("a",{id:"s04",href:"#",onClick:function(e){return e.preventDefault()},role:"option"},o.a.createElement("div",{className:"slds-truncate",title:"Moderno Bistro"},o.a.createElement(y.a,{className:"slds-icon slds-icon-standard-account slds-icon_small slds-m-right_x-small",sprite:"standard",symbol:"account"}),"Moderno Bistro"))),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Acton, OH"},"Acton, OH")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Secondary Field"},"Secondary Field")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Tertiary Field"},"Tertiary Field"))),o.a.createElement("tr",null,o.a.createElement("th",{scope:"row"},o.a.createElement("a",{id:"s05",href:"#",onClick:function(e){return e.preventDefault()},role:"option"},o.a.createElement("div",{className:"slds-truncate",title:"Cozy Kitchen"},o.a.createElement(y.a,{className:"slds-icon slds-icon-standard-account slds-icon_small slds-m-right_x-small",sprite:"standard",symbol:"account"}),"Cozy Kitchen"))),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Acton, CA"},"Acton, CA")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Secondary Field"},"Secondary Field")),o.a.createElement("td",null,o.a.createElement("div",{className:"slds-truncate",title:"Tertiary Field"},"Tertiary Field"))))))),o.a.createElement(E.d,{className:"slds-modal__footer_directional"},o.a.createElement("button",{className:"slds-button slds-button_neutral"},"Cancel"),o.a.createElement("button",{className:"slds-button slds-button_neutral"},"New Account"))),o.a.createElement("div",{className:"slds-backdrop slds-backdrop_open"})),_=a(51),f=a(58),v=o.a.createElement(c.a,{id:"combobox-id-1","aria-controls":"listbox-id-1",comboboxID:"primary-combobox-id-1",autocomplete:!0,results:o.a.createElement(r.e,{id:"listbox-id-1",snapshot:p.b,type:"entity",count:4}),resultsType:"listbox",addon:o.a.createElement(_.b,{id:i.c.uniqueId("combobox-id-"),value:"Accounts",addonPosition:"start",hasInteractions:!0,comboboxAriaControls:"primary-combobox-id-1"}),addonPosition:"start",comboboxPosition:"end",inputIconPosition:"right",rightInputIcon:o.a.createElement(m.a,{symbol:"search",className:"slds-icon slds-icon_x-small slds-icon-text-default",containerClassName:"slds-input__icon slds-input__icon_right"}),hasInteractions:!0}),g=[{id:"focused",label:"Focused",element:o.a.createElement(c.a,{id:"combobox-id-1","aria-controls":"listbox-id-1",comboboxID:"primary-combobox-id-1",autocomplete:!0,results:o.a.createElement(r.e,{id:"listbox-id-1",snapshot:p.b,type:"entity",count:4}),resultsType:"listbox",addon:o.a.createElement(_.b,{id:i.c.uniqueId("combobox-id-"),value:"Accounts",addonPosition:"start",hasInteractions:!0,comboboxAriaControls:"primary-combobox-id-1"}),addonPosition:"start",comboboxPosition:"end",inputIconPosition:"right",rightInputIcon:o.a.createElement(m.a,{symbol:"search",className:"slds-icon slds-icon_x-small slds-icon-text-default",containerClassName:"slds-input__icon slds-input__icon_right"}),isOpen:!0,hasFocus:!0})},{id:"open-item-focused",label:"Open - Item Focused",element:o.a.createElement(c.a,{id:"combobox-id-2","aria-controls":"listbox-id-2",comboboxID:"primary-combobox-id-2",autocomplete:!0,results:o.a.createElement(r.e,{id:"listbox-id-2",snapshot:p.c,type:"entity",count:4}),resultsType:"listbox","aria-activedescendant":"option1",addon:o.a.createElement(_.b,{id:i.c.uniqueId("combobox-id-"),value:"Accounts",addonPosition:"start",hasInteractions:!0,comboboxAriaControls:"primary-combobox-id-2"}),addonPosition:"start",comboboxPosition:"end",inputIconPosition:"right",rightInputIcon:o.a.createElement(m.a,{symbol:"search",className:"slds-icon slds-icon_x-small slds-icon-text-default",containerClassName:"slds-input__icon slds-input__icon_right"}),isOpen:!0,hasFocus:!0})},{id:"options-selected",label:"Option(s) Selected",element:o.a.createElement(c.a,{id:"combobox-id-3","aria-controls":"listbox-id-3",comboboxID:"primary-combobox-id-3",autocomplete:!0,results:o.a.createElement(r.e,{id:"listbox-id-3",snapshot:p.b,type:"entity",count:4}),resultsType:"listbox",hasFocus:!0,addon:o.a.createElement(_.b,{id:i.c.uniqueId("combobox-id-"),value:"Accounts",addonPosition:"start",comboboxAriaControls:"primary-combobox-id-3"}),addonPosition:"start",comboboxPosition:"end",inputIconPosition:"right",rightInputIcon:o.a.createElement(m.a,{symbol:"search",className:"slds-icon slds-icon_x-small slds-icon-text-default",containerClassName:"slds-input__icon slds-input__icon_right"}),hasSelection:!0,listboxOfSelections:o.a.createElement(f.a,{snapshot:p.e,count:2})})},{id:"focused-options-selected",label:"Focused - Option(s) Selected",element:o.a.createElement(c.a,{id:"combobox-id-4","aria-controls":"listbox-id-4",comboboxID:"primary-combobox-id-4",autocomplete:!0,results:o.a.createElement(r.e,{id:"listbox-id-4",snapshot:p.b,type:"entity",count:4}),resultsType:"listbox",isOpen:!0,hasFocus:!0,addon:o.a.createElement(_.b,{id:i.c.uniqueId("combobox-id-"),value:"Accounts",addonPosition:"start",comboboxAriaControls:"primary-combobox-id-4"}),addonPosition:"start",comboboxPosition:"end",inputIconPosition:"right",rightInputIcon:o.a.createElement(m.a,{symbol:"search",className:"slds-icon slds-icon_x-small slds-icon-text-default",containerClassName:"slds-input__icon slds-input__icon_right"}),hasSelection:!0,listboxOfSelections:o.a.createElement(f.a,{snapshot:p.e,count:2})})}],N=l.c.a,S=l.c.code,O=l.c.h2,I=l.c.h3,F=l.c.li,A=l.c.p,C=l.c.strong,j=l.c.ul,T=function(){return Object(s.createElement)(l.b,{},Object(s.createElement)("div",{className:"doc lead"},"Lookup is an autocomplete combobox that will search against a database object."),Object(s.createElement)(n.a,{demoStyles:"height: 15rem;",exampleOnly:!0},Object(i.e)(h,"displaying-options-based-on-input")),O({id:"About-Lookups"},"About Lookups"),A({},C({},"Note")," — A lookup is a combobox component, please find implementation documentation under the ",N({href:"/components/combobox/#Base-Combobox"},"combobox component"),"."),A({},"The lookup can parse through single or multi scoped datasets. The parsed dataset can be filtered by single or multi option selects."),A({},"You can find the lookup component throughout most data fields that allow inline inputs. Most commonly used on ",C({},"record home")," and ",C({},"object home"),"."),I({id:"Accessibility"},"Accessibility"),A({},"Lookups allow the user to have dual keyboard focus: while focus in the input search field, the user can type text into the field and simultaneously use arrow keys to navigate up and down the results list. Use the appropriate ",C({},"ARIA")," attributes in your markup in order to effectively communicate the relationship between the input field and the results list to users of assistive technology."),A({},C({},"Expected markup:")),j({},F({},"A Combobox must come with an associated ",S({},"label")," element, with an appropriate ",S({},"for")," attribute"),F({},S({},"slds-combobox")," acts as the root node to the composite Combobox widget. It takes the ",S({},'role="combobox"')," attribute as a result",j({},F({},S({},'aria-haspopup="listbox"')," attribute is then applied to indicate the Combobox will display a popup, of type ",S({},"listbox")),F({},S({},'aria-expanded="true|false"')," attribute is applied to describe whether the popup of ",S({},"listbox")," is currently visible or not"))),F({},S({},"aria-activedescendant")," must be set to the currently selected option within the list"),F({},S({},'role="listbox"')," must be added to the list of results, each result should have ",S({},'role="option"'))),A({},C({},"Expected keyboard interactions:")),j({},F({},S({},"Up")," and ",S({},"Down")," arrow keys to cycle through the available options in the list, also updates ",S({},"aria-activedescendant")," on the input"),F({},S({},"Enter")," selects the current option and collapses the list"),F({},S({},"Escape")," collapses the list"),F({},"Character keys jumps to the first option with those characters")),O({id:"Base"},"Base"),Object(s.createElement)(n.a,{demoStyles:"height: 13rem;"},b),O({id:"States"},"States"),I({id:"Focused"},"Focused"),Object(s.createElement)(n.a,{demoStyles:"height: 13rem;"},Object(i.e)(h,"focused")),I({id:"Open-Item-Focused"},"Open - Item Focused"),Object(s.createElement)(n.a,{demoStyles:"height: 13rem;"},Object(i.e)(h,"open-item-focused")),I({id:"Displaying-options-based-on-user-input"},"Displaying options based on user input"),Object(s.createElement)(n.a,{demoStyles:"height: 14rem;"},Object(i.e)(h,"displaying-options-based-on-input")),I({id:"Option-Selected"},"Option Selected"),Object(s.createElement)(n.a,null,Object(i.e)(h,"closed-option-selected")),O({id:"Grouped"},"Grouped"),Object(s.createElement)(n.a,{isViewport:!0},x),O({id:"Multi-Entity"},"Multi Entity"),Object(s.createElement)(n.a,{demoStyles:"height: 17rem;"},v),O({id:"States-2"},"States"),I({id:"Focused-2"},"Focused"),Object(s.createElement)(n.a,{demoStyles:"height: 15rem;"},Object(i.e)(g,"focused")),I({id:"Open-Item-Focused-2"},"Open - Item Focused"),Object(s.createElement)(n.a,{demoStyles:"height: 15rem;"},Object(i.e)(g,"open-item-focused")),I({id:"Option(s)-Selected"},"Option(s) Selected"),Object(s.createElement)(n.a,null,Object(i.e)(g,"options-selected")),I({id:"Focused-Option(s)-Selected"},"Focused - Option(s) Selected"),Object(s.createElement)(n.a,{demoStyles:"height: 15rem;"},Object(i.e)(g,"focused-options-selected")))},k=function(){return Object(l.a)(T())}}});