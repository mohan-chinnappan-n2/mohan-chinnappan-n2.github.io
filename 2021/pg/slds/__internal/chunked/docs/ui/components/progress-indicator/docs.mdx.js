var SLDS="object"==typeof SLDS?SLDS:{};SLDS["__internal/chunked/docs/ui/components/progress-indicator/docs.mdx.js"]=function(e){function t(t){for(var l,s,n=t[0],i=t[1],o=t[2],p=0,m=[];p<n.length;p++)s=n[p],Object.prototype.hasOwnProperty.call(a,s)&&a[s]&&m.push(a[s][0]),a[s]=0;for(l in i)Object.prototype.hasOwnProperty.call(i,l)&&(e[l]=i[l]);for(d&&d(t);m.length;)m.shift()();return c.push.apply(c,o||[]),r()}function r(){for(var e,t=0;t<c.length;t++){for(var r=c[t],l=!0,n=1;n<r.length;n++){var i=r[n];0!==a[i]&&(l=!1)}l&&(c.splice(t--,1),e=s(s.s=r[0]))}return e}var l={},a={58:0},c=[];function s(t){if(l[t])return l[t].exports;var r=l[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,s),r.l=!0,r.exports}s.m=e,s.c=l,s.d=function(e,t,r){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(s.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var l in e)s.d(r,l,function(t){return e[t]}.bind(null,l));return r},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="/assets/scripts/bundle/";var n=this.webpackJsonpSLDS___internal_chunked_docs=this.webpackJsonpSLDS___internal_chunked_docs||[],i=n.push.bind(n);n.push=t,n=n.slice();for(var o=0;o<n.length;o++)t(n[o]);var d=i;return c.push([276,0]),r()}({0:function(e,t){e.exports=React},18:function(e,t){e.exports=JSBeautify},19:function(e,t){e.exports=ReactDOM},276:function(e,t,r){"use strict";r.r(t),r.d(t,"getElement",(function(){return y})),r.d(t,"getContents",(function(){return w}));var l=r(0),a=r.n(l),c=r(4),s=r(1),n=r(23),i=r(11),o=r(15),d=r(5),p=r.n(d),m=r(7),b=r(56),u=r(22),E=r(54),O=function(e){return a.a.createElement("div",{className:p()("slds-progress",e.className)},a.a.createElement("ol",{className:"slds-progress__list"},e.children),a.a.createElement(E.a,{className:"slds-progress-bar_x-small",value:e.value}))},j=function(e){return a.a.createElement("li",{className:p()("slds-progress__item",e.className,e.active?"slds-is-active":null,e.done?"slds-is-completed":null,e.error?"slds-has-error":null)},e.done&&!e.error?a.a.createElement(m.b,{className:"slds-progress__marker slds-progress__marker_icon",symbol:"success","aria-describedby":e["aria-describedby"],assistiveText:e.done?e.children+" - Completed":null,title:e.done?e.children+" - Completed":null}):e.error?a.a.createElement(m.b,{className:"slds-progress__marker slds-progress__marker_icon",symbol:"error","aria-describedby":e["aria-describedby"],assistiveText:e.error?e.children+" - Error":null,title:e.error?e.children+" - Error":null}):a.a.createElement("button",{className:"slds-button slds-progress__marker","aria-describedby":e["aria-describedby"]},a.a.createElement("span",{className:"slds-assistive-text"},e.children," ",e.active?"- Active":null)))},h=(b.a,u.b,u.e,u.c,u.d,r(52)),S=r(37),g=c.c.code,v=c.c.h2,f=c.c.h3,_=c.c.p,y=function(){return Object(l.createElement)(c.b,{},Object(l.createElement)("div",{className:"doc lead"},"A progress indicator component communicates to the user the progress of a particular process."),Object(l.createElement)(s.a,{exampleOnly:!0},Object(l.createElement)(O,{value:"50"},Object(l.createElement)(j,{done:!0},"Step 1"),Object(l.createElement)(j,{done:!0},"Step 2"),Object(l.createElement)(j,{active:!0},"Step 3"),Object(l.createElement)(j,null,"Step 4"),Object(l.createElement)(j,null,"Step 5"))),v({id:"About-Progress-Indicator"},"About Progress Indicator"),f({id:"Implementation-Requirements"},"Implementation Requirements"),_({},"The ",g({},"slds-progress-bar")," accepts a range from 0% to 100%, and this percentage should be applied with inline styling to the ",g({},"div")," with class ",g({},"slds-progress-bar__value")," using JavaScript. If implementing a horizontal progress indicator, set the width, otherwise set the height for vertical progress indicators."),f({id:"Accessibility"},"Accessibility"),_({},"As the percentage of completion changes, be sure to update the ",g({},"aria-valuenow")," property on the ",g({},"<div>")," with ",g({},'class="slds-progress-bar"'),", as well as the ",g({},"slds-assistive-text")," ",g({},"<span>"),"."),Object(l.createElement)(n.a,{toggleCode:!1},Object(l.createElement)("div",{className:"slds-progress-bar slds-progress-bar_x-small","aria-valuemin":"0","aria-valuemax":"100","aria-valuenow":"50",role:"progressbar"},Object(l.createElement)("span",{className:"slds-progress-bar__value",style:{width:"50%"}},Object(l.createElement)("span",{className:"slds-assistive-text"},"Progress: 50%")))),f({id:"Mobile"},"Mobile"),Object(l.createElement)(S.a,{patternSpecificText:"progress indicators will have increased actionable area sizes to accommodate tapping with a finger instead of the more precise mouse cursor"}),Object(l.createElement)(s.a,{frameOnly:!0},Object(l.createElement)(O,{value:"50"},Object(l.createElement)(j,{done:!0},"Step 1"),Object(l.createElement)(j,{done:!0},"Step 2"),Object(l.createElement)(j,{active:!0},"Step 3"),Object(l.createElement)(j,null,"Step 4"),Object(l.createElement)(j,null,"Step 5"))),v({id:"Base"},"Base"),Object(l.createElement)(i.a,{title:"Progress Indicator Base Horizontal"},Object(l.createElement)(s.a,null,Object(l.createElement)(O,{value:"0"},Object(l.createElement)(j,{active:!0},"Step 1"),Object(l.createElement)(j,null,"Step 2"),Object(l.createElement)(j,null,"Step 3"),Object(l.createElement)(j,null,"Step 4"),Object(l.createElement)(j,null,"Step 5")))),v({id:"Horizontal"},"Horizontal"),f({id:"Active-Step"},"Active Step"),_({},"When a step becomes active, the ",g({},"<div>")," with class ",g({},".slds-progress__item")," should also get the class ",g({},".slds-is-active"),"."),Object(l.createElement)(o.a,{type:"a11y",header:"Accessibility Requirements"},Object(l.createElement)("p",null,'When a step is active, be sure to append "- Active" to the hidden button text in the ',Object(l.createElement)("code",null,"<span>")," with class ",Object(l.createElement)("code",null,"slds-assistive-text"),", such as ",Object(l.createElement)("code",null,"Step 1 - Active"),".")),Object(l.createElement)(i.a,{title:"Progress Indicator Active Horizontal"},Object(l.createElement)(s.a,null,Object(l.createElement)(O,{value:"0"},Object(l.createElement)(j,{active:!0},"Step 1"),Object(l.createElement)(j,null,"Step 2"),Object(l.createElement)(j,null,"Step 3"),Object(l.createElement)(j,null,"Step 4"),Object(l.createElement)(j,null,"Step 5")))),f({id:"Completed-Step"},"Completed Step"),_({},"When the step is completed, the ",g({},".slds-is-active")," class should be replaced with the class ",g({},".slds-is-completed")," on ",g({},".slds-progress__item"),". At that point, the ",g({},".slds-progress__item"),' element will receive a "success" icon, providing feedback that the step has been completed.'),Object(l.createElement)(o.a,{type:"a11y",header:"Accessibility Requirements"},Object(l.createElement)("p",null,'When a step is completed, be sure to append "- Completed" to the hidden button text in the ',Object(l.createElement)("code",null,"<span>")," with class ",Object(l.createElement)("code",null,"slds-assistive-text"),", such as ",Object(l.createElement)("code",null,"Step 2 - Completed"),".")),Object(l.createElement)(i.a,{title:"Progress Indicator Done Horizontal"},Object(l.createElement)(s.a,null,Object(l.createElement)(O,{value:"50"},Object(l.createElement)(j,{done:!0},"Step 1"),Object(l.createElement)(j,{done:!0},"Step 2"),Object(l.createElement)(j,{active:!0},"Step 3"),Object(l.createElement)(j,null,"Step 4"),Object(l.createElement)(j,null,"Step 5")))),f({id:"Error-in-a-Step"},"Error in a Step"),_({},"When an error has occurred on a step, the ",g({},"<div>")," with class ",g({},".slds-progress__item")," should also get the class ",g({},".slds-has-error"),"."),Object(l.createElement)(o.a,{type:"a11y",header:"Accessibility Requirements"},Object(l.createElement)("p",null,'When a step has an error, be sure to append "- Error" to the hidden button text in the ',Object(l.createElement)("code",null,"<span>")," with class ",Object(l.createElement)("code",null,"slds-assistive-text"),", such as ",Object(l.createElement)("code",null,"Step 3 - Error"),".")),Object(l.createElement)(i.a,{title:"Progress Indicator Done Horizontal"},Object(l.createElement)(s.a,null,Object(l.createElement)(O,{value:"50"},Object(l.createElement)(j,{done:!0},"Step 1"),Object(l.createElement)(j,{done:!0},"Step 2"),Object(l.createElement)(j,{error:!0},"Step 3"),Object(l.createElement)(j,null,"Step 4"),Object(l.createElement)(j,null,"Step 5")))),f({id:"Step-Title-Tooltip"},"Step Title Tooltip"),Object(l.createElement)(o.a,{type:"a11y",header:"Accessibility Requirements"},Object(l.createElement)("p",null,"When a step's tooltip is visible, the step's button needs the"," ",Object(l.createElement)("code",null,"aria-describedby")," attribute, whose value should be the ",Object(l.createElement)("code",null,"id")," of the associated tooltip.")),Object(l.createElement)(i.a,{title:"Progress Indicator Tooltip Horizontal"},Object(l.createElement)(s.a,null,Object(l.createElement)("div",{style:{padding:"3.5rem 1rem 0"}},Object(l.createElement)(O,{value:"50"},Object(l.createElement)(j,{done:!0},"Step 1"),Object(l.createElement)(j,{done:!0},"Step 2"),Object(l.createElement)(j,{active:!0,"aria-describedby":"step-3-tooltip"},"Step 3"),Object(l.createElement)(j,null,"Step 4"),Object(l.createElement)(j,null,"Step 5")),Object(l.createElement)(b.a,{className:"slds-nubbin_bottom",id:"step-3-tooltip",style:{position:"absolute",top:"1rem",left:"calc(50% + 6px)",transform:"translateX(-50%)"}},"Verify Email")))),f({id:"In-a-Modal"},"In a Modal"),Object(l.createElement)(i.a,{title:"Progress Indicator Horizontal in Modal"},Object(l.createElement)(s.a,{isViewport:!0,demoStyles:"height: 640px;"},Object(l.createElement)("div",null,Object(l.createElement)(u.b,{className:"slds-modal_large","aria-labelledby":"header43"},Object(l.createElement)(u.e,null,Object(l.createElement)("h2",{id:"header43",className:"slds-text-heading_medium"},"Modal header")),Object(l.createElement)(u.c,{className:"slds-grow slds-p-around_medium"}),Object(l.createElement)(u.d,{className:"slds-grid slds-grid_align-spread"},Object(l.createElement)("button",{className:"slds-button slds-button_neutral"},"Cancel"),Object(l.createElement)(O,{className:"slds-progress_shade",value:"25"},Object(l.createElement)(j,{done:!0},"Step 1"),Object(l.createElement)(j,{active:!0},"Step 2"),Object(l.createElement)(j,null,"Step 3"),Object(l.createElement)(j,null,"Step 4"),Object(l.createElement)(j,null,"Step 5")),Object(l.createElement)("button",{className:"slds-button slds-button_brand"},"Save"))),Object(l.createElement)("div",{className:"slds-backdrop slds-backdrop_open"})))),f({id:"On-a-Gray-Background"},"On a Gray Background"),Object(l.createElement)(i.a,{title:"Progress Indicator Horizontal Gray Background"},Object(l.createElement)(s.a,{demoStyles:"background-color: #F3F2F2; padding: 1rem;"},Object(l.createElement)(O,{className:"slds-progress_shade",value:"25"},Object(l.createElement)(j,{done:!0},"Step 1"),Object(l.createElement)(j,{active:!0},"Step 2"),Object(l.createElement)(j,null,"Step 3"),Object(l.createElement)(j,null,"Step 4"),Object(l.createElement)(j,null,"Step 5")))),v({id:"Vertical"},"Vertical"),_({},"To display a vertical progress indicator, the ",g({},"<div>")," with class ",g({},".slds-progress")," should also get the class ",g({},".slds-progress_vertical"),". The vertical progress indicator will take up 100% of the height of its container. The step titles in the vertical variant appear next to the step, instead of in a tooltip."),Object(l.createElement)(o.a,{type:"note",header:"Implementation Note"},Object(l.createElement)("p",null,"The key markup difference between the horizontal and vertical variants is the progress markers. Horizontal progress indicators use ",Object(l.createElement)("code",null,"<button>")," for each step, whereas Vertical progress indicator steps are not interactive and therefore simply use ",Object(l.createElement)("code",null,"<div>"),".")),Object(l.createElement)(i.a,{title:"Progress Indicator Vertical"},Object(l.createElement)(s.a,null,Object(l.createElement)(h.a,{value:"25"},Object(l.createElement)(h.b,{done:!0},"Step 1"),Object(l.createElement)(h.b,{active:!0},"Step 2"),Object(l.createElement)(h.b,null,"Step 3"),Object(l.createElement)(h.b,null,"Step 4"),Object(l.createElement)(h.b,null,"Step 5")))),f({id:"Green-Success"},"Green Success"),_({},"To create a green completed step, the ",g({},".slds-progress__item")," element should also receive the ",g({},".slds-is-completed")," class. In addition, the ",g({},"<span>")," with class ",g({},".slds-progress__marker_icon")," should also get the class ",g({},"slds-progress__marker_icon-success"),"."),Object(l.createElement)(i.a,{title:"Progress Indicator Vertical Success"},Object(l.createElement)(s.a,null,Object(l.createElement)(h.a,{value:"25"},Object(l.createElement)(h.b,{done:!0,hasSuccessMarker:!0},"Step 1"),Object(l.createElement)(h.b,{active:!0},"Step 2"),Object(l.createElement)(h.b,null,"Step 3"),Object(l.createElement)(h.b,null,"Step 4"),Object(l.createElement)(h.b,null,"Step 5")))),f({id:"Error-in-a-Step-2"},"Error in a Step"),_({},"When an error has occurred on a step, the ",g({},"<div>")," with class ",g({},".slds-progress__item")," should also get the class ",g({},".slds-has-error"),"."),Object(l.createElement)(i.a,{title:"Progress Indicator Vertical Success"},Object(l.createElement)(s.a,null,Object(l.createElement)(h.a,{value:"25"},Object(l.createElement)(h.b,{done:!0},"Step 1"),Object(l.createElement)(h.b,{error:!0},"Step 2"),Object(l.createElement)(h.b,null,"Step 3"),Object(l.createElement)(h.b,null,"Step 4"),Object(l.createElement)(h.b,null,"Step 5")))),f({id:"Multiline-Step-Titles"},"Multiline Step Titles"),_({},"The vertical progress indicator also supports multiline step descriptions."),Object(l.createElement)(i.a,{title:"Progress Indicator Vertical"},Object(l.createElement)(s.a,null,Object(l.createElement)(h.a,{value:"25"},Object(l.createElement)(h.b,{done:!0},"Step 1"),Object(l.createElement)(h.b,{active:!0},"Step 2"),Object(l.createElement)(h.b,null,"Step 3: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.  Praesent eget pellentesque lacus. Suspendisse euismod magna nec nulla ornare viverra. Sed pretium, eros ullamcorper scelerisque placerat, nunc velit volutpat libero, a semper lacus urna eget nibh. Maecenas eget tortor pulvinar, scelerisque nibh sed, fringilla erat. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut ultricies dui turpis, at posuere dolor convallis vitae."),Object(l.createElement)(h.b,null,"Step 4"),Object(l.createElement)(h.b,null,"Step 5")))))},w=function(){return Object(c.a)(y())}}});