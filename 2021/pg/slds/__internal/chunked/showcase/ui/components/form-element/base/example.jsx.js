var SLDS="object"==typeof SLDS?SLDS:{};SLDS["__internal/chunked/showcase/ui/components/form-element/base/example.jsx.js"]=function(e){function t(t){for(var l,o,r=t[0],d=t[1],c=t[2],s=0,u=[];s<r.length;s++)o=r[s],Object.prototype.hasOwnProperty.call(n,o)&&n[o]&&u.push(n[o][0]),n[o]=0;for(l in d)Object.prototype.hasOwnProperty.call(d,l)&&(e[l]=d[l]);for(m&&m(t);u.length;)u.shift()();return i.push.apply(i,c||[]),a()}function a(){for(var e,t=0;t<i.length;t++){for(var a=i[t],l=!0,r=1;r<a.length;r++){var d=a[r];0!==n[d]&&(l=!1)}l&&(i.splice(t--,1),e=o(o.s=a[0]))}return e}var l={},n={85:0,6:0,13:0,14:0,22:0,24:0,26:0,36:0,37:0,56:0,72:0,73:0,79:0,80:0,93:0,94:0,96:0,97:0,98:0,103:0,104:0,112:0,117:0,118:0,122:0,124:0,127:0,131:0,133:0,135:0,136:0,137:0,140:0,142:0,145:0,146:0,147:0,150:0,154:0,157:0},i=[];function o(t){if(l[t])return l[t].exports;var a=l[t]={i:t,l:!1,exports:{}};return e[t].call(a.exports,a,a.exports,o),a.l=!0,a.exports}o.m=e,o.c=l,o.d=function(e,t,a){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(o.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var l in e)o.d(a,l,function(t){return e[t]}.bind(null,l));return a},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="/assets/scripts/bundle/";var r=this.webpackJsonpSLDS___internal_chunked_showcase=this.webpackJsonpSLDS___internal_chunked_showcase||[],d=r.push.bind(r);r.push=t,r=r.slice();for(var c=0;c<r.length;c++)t(r[c]);var m=d;return i.push([262,0]),a()}({0:function(e,t){e.exports=React},16:function(e,t){e.exports=ReactDOM},262:function(e,t,a){"use strict";a.r(t),a.d(t,"states",(function(){return C})),a.d(t,"examples",(function(){return x}));var l=a(0),n=a.n(l),i=a(5),o=a(11),r=a(39),d=a(24),c=a(28),m=a(1),s=a.n(m),u=function(e){var t=e.hasTooltip,a=e.isRequired;return n.a.createElement(n.a.Fragment,null,n.a.createElement(i.a,{hasCompoundFields:!0,hasTooltip:t,isRequired:a,isDeprecated:!0,label:"Location"},n.a.createElement("div",{className:"slds-form-element__group"},n.a.createElement("div",{className:"slds-form-element__row"},n.a.createElement(i.b,{formElementClassName:"slds-size_1-of-2",labelContent:"Latitude",inputId:"input-01"},n.a.createElement(o.a,{id:"input-01"})),n.a.createElement(i.b,{formElementClassName:"slds-size_1-of-2",labelContent:"Longitude",inputId:"input-02"},n.a.createElement(o.a,{id:"input-02"}))))),n.a.createElement(i.a,{hasCompoundFields:!0,label:"Shipping Address",isAddress:!0,isDeprecated:!0},n.a.createElement("div",{className:"slds-form-element__group"},n.a.createElement("div",{className:"slds-form-element__row"},n.a.createElement(i.b,{formElementClassName:"slds-size_1-of-1",labelContent:"Shipping Street",inputId:"input-03"},n.a.createElement(o.a,{id:"input-03"}))),n.a.createElement("div",{className:"slds-form-element__row"},n.a.createElement(i.b,{formElementClassName:"slds-size_4-of-6",labelContent:"Shipping City",inputId:"input-04"},n.a.createElement(o.a,{id:"input-04"})),n.a.createElement(i.b,{formElementClassName:"slds-size_2-of-6",labelContent:"Shipping State/Province",inputId:"input-05"},n.a.createElement(o.a,{id:"input-05",defaultValue:"MT"}))),n.a.createElement("div",{className:"slds-form-element__row"},n.a.createElement(i.b,{formElementClassName:"slds-size_4-of-6",labelContent:"Shipping Zip/Postal Code",inputId:"input-06"},n.a.createElement(o.a,{id:"input-06"})),n.a.createElement(i.b,{formElementClassName:"slds-size_2-of-6",labelContent:"Shipping Country",inputId:"input-07"},n.a.createElement(o.a,{id:"input-07",defaultValue:"Canada"}))))))};u.propTypes={hasTooltip:s.a.bool,isRequired:s.a.bool};var b=a(36),p=a(38),h="Form Element Label",E="input-unique-id",f="error-message-unique-id",C=(t.default=n.a.createElement(i.b,{labelContent:h,inputId:E},n.a.createElement(o.a,{id:E})),[{id:"required",label:"Required",element:n.a.createElement(i.b,{labelContent:h,inputId:E,isRequired:!0},n.a.createElement(o.a,{id:E,required:!0}))},{id:"error",label:"Error",element:n.a.createElement(i.b,{labelContent:h,inputId:E,errorId:f,isRequired:!0,hasError:!0,inlineMessage:"This field is required"},n.a.createElement(o.a,{id:E,required:!0,"aria-describedby":f}))}]),x=[{id:"input",label:"Input",element:n.a.createElement(i.b,{labelContent:h,inputId:E},n.a.createElement(o.a,{id:E}))},{id:"textarea",label:"Textarea",element:n.a.createElement(i.b,{labelContent:h,inputId:E},n.a.createElement(r.Textarea,{id:E}))},{id:"checkbox",label:"Checkbox",element:n.a.createElement(i.b,null,n.a.createElement(d.Checkbox,{label:"Checkbox Label"}))},{id:"checkbox-required",label:"Checkbox - Required",element:n.a.createElement(i.b,null,n.a.createElement(d.Checkbox,{label:"Checkbox Label",isRequired:!0}))},{id:"checkbox-required-help-text",label:"Checkbox - Required with help text icon",element:n.a.createElement(i.b,null,n.a.createElement(d.Checkbox,{label:"Checkbox Label",isRequired:!0,hasTooltip:!0}))},{id:"checkbox-group",label:"Checkbox Group",element:n.a.createElement(i.a,{label:"Form Element Legend"},n.a.createElement(d.Checkbox,{label:"Checkbox Label"}),n.a.createElement(d.Checkbox,{label:"Checkbox Label"}))},{id:"checkbox-group-required",label:"Checkbox Group - Required",element:n.a.createElement(i.a,{label:"Form Element Legend",isRequired:!0},n.a.createElement(d.Checkbox,{label:"Checkbox Label"}),n.a.createElement(d.Checkbox,{label:"Checkbox Label"}))},{id:"checkbox-group-required-help-text",label:"Checkbox Group - Required with help text icon",element:n.a.createElement(i.a,{id:"fieldset-with-help-text",label:"Form Element Legend",isRequired:!0,hasTooltip:!0},n.a.createElement(d.Checkbox,{label:"Checkbox Label"}),n.a.createElement(d.Checkbox,{label:"Checkbox Label"}))},{id:"radio-group",label:"Radio Group",element:n.a.createElement(i.a,{label:"Form Element Label"},n.a.createElement(c.Radio,{checked:!0,label:"Radio Label One"}),n.a.createElement(c.Radio,{label:"Radio Label Two"}))},{id:"radio-group-required",label:"Radio Group - Required",element:n.a.createElement(i.a,{label:"Form Element Label",isRequired:!0},n.a.createElement(c.Radio,{checked:!0,label:"Radio Label One"}),n.a.createElement(c.Radio,{label:"Radio Label Two"}))},{id:"radio-group-required-help-text",label:"Radio Group - Required with help text icon",element:n.a.createElement(i.a,{id:"fieldset-with-help-text",label:"Form Element Label",isRequired:!0,hasTooltip:!0},n.a.createElement(c.Radio,{checked:!0,label:"Radio Label One"}),n.a.createElement(c.Radio,{label:"Radio Label Two"}))},{id:"inline-help",label:"Inline Help",element:n.a.createElement(i.b,{labelContent:h,inputId:E,inlineMessage:"ex: (415)111-2222"},n.a.createElement(o.a,{id:E}))},{id:"tooltip-help",label:"Tooltip Help",element:n.a.createElement("div",{style:{paddingTop:"3rem",position:"relative"}},n.a.createElement(i.b,{labelContent:h,inputId:E,hasTooltip:!0,showTooltip:!0},n.a.createElement(o.a,{id:E})))},{id:"required-tooltip-help",label:"Required - Tooltip Help",element:n.a.createElement("div",{style:{paddingTop:"3rem",position:"relative"}},n.a.createElement(i.b,{labelContent:h,inputId:E,hasTooltip:!0,isRequired:!0},n.a.createElement(o.a,{id:E,required:!0})))},{id:"compound-field",label:"Compound Form Layout",element:n.a.createElement(u,null)},{id:"compound-field-required",label:"Required - Compound Form Layout",element:n.a.createElement(u,null)},{id:"compound-field-required-tooltip-help",label:"Required with Tooltip Help - Compound Form Layout",element:n.a.createElement(u,null)},{id:"stacked",label:"Stacked form layout - View Mode",element:n.a.createElement(b.a,{direction:"stacked",snapshot:p.b,isViewMode:!0,hasInlineEdit:!0})},{id:"stacked-single-column",label:"Stacked form layout - 1 column - Read Only Mode",element:n.a.createElement(b.a,{direction:"stacked",snapshot:p.d,isViewMode:!0})},{id:"horizontal-single-column",label:"Horizontal form layout - 1 column - Read Only Mode",element:n.a.createElement(b.a,{direction:"horizontal",snapshot:p.d,isViewMode:!0})},{id:"edit-stacked",label:"Stacked form layout - Edit Mode",element:n.a.createElement(b.a,{direction:"stacked",snapshot:p.b})},{id:"horizontal",label:"Horizontal form layout - View Mode",element:n.a.createElement(b.a,{direction:"horizontal",snapshot:p.c,isViewMode:!0,hasInlineEdit:!0})},{id:"edit-horizontal",label:"Horizontal form layout - Edit Mode",element:n.a.createElement(b.a,{direction:"horizontal",snapshot:p.c})}]}});