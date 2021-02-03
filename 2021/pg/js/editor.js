// editor.js
// author: mohan chinnappan
getEle = id => document.getElementById(id);

// init the editor
initEditor = (id, value, language, theme) => {
    const editorEle = getEle(id);
    const editor = monaco.editor.create(editorEle, { value, language, theme });
    return editor;
};

const contentHtml = 
`
<html>
<head>
    <link rel="stylesheet" href="slds/assets/styles/salesforce-lightning-design-system.css"/>
</head>
<body class='container'>
    <div class="slds-text-heading_large">Welcome to the Playground!</div>
    <hr/>
    <button  onclick="alert('Branded Button!')" class="slds-button slds-button_brand">Brand Button</button>
    <button  onclick="alert('Success Button!')"class="slds-button slds-button_success">Success Button</button>
    <hr/>
    <span class="slds-badge slds-theme_success">Ramanujan</span>
    <span class="slds-badge slds-theme_warning">Tesla</span>
    <span class="slds-badge slds-theme_error">Einstein</span>

    <hr/>
    <article class="slds-card">
        <div class="slds-card__header slds-grid">
          <header class="slds-media slds-media_center slds-has-flexi-truncate">
            <div class="slds-media__figure">
              <span class="slds-icon_container slds-icon-standard-account" title="account">
                <svg class="slds-icon slds-icon_small" aria-hidden="true">
                  <use xlink:href="slds/assets/icons/standard-sprite/svg/symbols.svg#account"></use>
                </svg>
                <span class="slds-assistive-text">account</span>
              </span>
            </div>
            <div class="slds-media__body">
              <h2 class="slds-card__header-title">
                <a href="#" class="slds-card__header-link slds-truncate" title="Accounts">
                  <span>Accounts</span>
                </a>
              </h2>
            </div>
            <div class="slds-no-flex">
              <button class="slds-button slds-button_neutral">New</button>
            </div>
          </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">Account Details</div>
        <footer class="slds-card__footer">
          <a class="slds-card__footer-action" href="#">View All
            <span class="slds-assistive-text">Accounts</span>
          </a>
        </footer>
    </article>

    <pre>
            const greet = (msg) => alert(msg);
             greet('one');
             greet('two');
             greet('three');
             
    </pre>

    

</body>
</html>

`;

const contentJSON = {
    "browsers": [
      "Chrome",
      "Safari",
      "Firefox"
    ],
    "chrome_is_best": true,
    "pollution": null,
    "pi": 3.14,
    "gems": {
      "unix": [
        "ken",
        "dmr"
      ],
      "c": [
        "dmr"
      ]
    },
    "greeting": "Hello Math!"
  };

  const contentPY = `
  for x in range(3, 8, 2):
    print(x)

  def add(a, b):
    return a + b

  `;

  const contentGO = `
  package main
  import "fmt"
  func main() {
      fmt.Println("hello world")
  }
  `;

  const contentC = `
  #include <stdio.h>
    int main() {
       printf("Hello, World!");
       return 0;
    }
`;

const contentJS = `
// Definitions
class Person {
    constructor (name, city ) {
     this.name = name;
     this.city = city;
    }
}
class Customer extends Person {
    constructor (name, city, amount) {
        super(name, city);
        this.amount = amount;
    }
    deposit(amount) {
      this.amount += amount;
    }
    withDraw(amount) {
       this.amount -= amount;
    }
}
    
let myCust = new Customer('Johny Appleseed','New Found Land',  100);
// deposit money 
myCust.deposit(200);
// withdraw some
myCust.withDraw(50);


`;




parseParams = () => {
    const query = location.search.substr(1);
    let qResult = {};
    query.split("&").forEach(function(part) {
        const item = part.split("=");
        qResult[item[0]] = decodeURIComponent(item[1]);
    });
    return qResult;
}

// get the language (l) param
const params = parseParams();
let lang = params['l'] || 'html';
let content = contentHtml;

switch (lang) {
    case 'html': 
        content = contentHtml;
        break;
    case 'js':
        lang = 'javascript';
        content = contentJS;
        break;
    case 'json':
        content = JSON.stringify(contentJSON, null, 4);
        break;
    case 'py':
        lang = 'python';    
        content = contentPY;
        break;
    case 'c':
        content = contentC;
        break;
    case 'go':
    content = contentGO;
    break;

}
console.log(lang);
console.log(content);

const editor = initEditor('editor', content, lang, 'vs-dark' );
const getEditorContent = (editor) => editor.getValue();
let run = false;


// iframe update
const  iFrame = getEle('iFrame').contentWindow.document;

const cleanIFrame = (id) => {
    iFrame.body.innerHTML = '';
}
const updateIFrame = () => {
    if (run) {
        cleanIFrame();
        iFrame.open();
        iFrame.writeln(getEditorContent(editor));
        iFrame.close();
    }
}
// document.body.onkeyup = () => updateIFrame();

getEle('run').onclick = () => {
    run = !run;
    updateIFrame();
}
  

// on ready
(() => {
    updateIFrame();
})();
