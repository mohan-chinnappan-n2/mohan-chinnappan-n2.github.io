
class ProgressBar extends HTMLElement {

    // get the progress attribute 
    get progress() {
        return this.getAttribute('progress')
    }
    // let us observe the attribute 'progress'
    static get observedAttributes() {
        return ['progress'];
    }
    // handle the change in the attribute 'progress' 
    attributeChangedCallback(name, oldValue, newValue) {
        // console.log(name, oldValue, newValue);
       if (name === 'progress'){
            this.paintProgress();
       } 
    } 

    get pcolor() {
        return this.getAttribute('pcolor')
    }


    // helper method for progress bar painting
    paintProgress() {
        this.progressDiv.setAttribute('style',
        `
         width:${this.progress}%; 
         background-color:${this.pcolor};
         border-radius:10px;
         text-align:center;
         padding:5px;
        `
        );
        this.progressDiv.innerHTML = `${this.progress}%`;
    }
    constructor() {
        super();
        // create shadow DOM
        const shadow = this.attachShadow({ mode: 'open'});
        this.progressDiv = document.createElement('div');
        // append it to the shadowRoot
        shadow.appendChild(this.progressDiv);
        // let us paint the progress bar first time
        this.paintProgress();
    }


}

customElements.define('progress-bar', ProgressBar);