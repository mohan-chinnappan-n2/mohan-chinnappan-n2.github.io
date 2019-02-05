/*jshint esversion: 6 */
class Datatable extends HTMLElement {

    // get the fields attribute 
    get fields() {
        return this.getAttribute('fields');
    }
    get bgcolor() {
         console.log(this.getAttribute('bgcolor'));
        return this.getAttribute('bgcolor');
    }
    //-------------
    get records() {
        console.log(this.getAttribute('records'));
        return this.getAttribute('records');
    }
    set records(recs) {
        console.log(recs);
        this.setAttribute('records', recs);
    }

    //=------------------
    // let us observe the attribute 'progress'
    static get observedAttributes() {
        return [ ];
    }
    // handle the change in the attribute 'progress' 
    attributeChangedCallback(name, oldValue, newValue) {

       console.log(name, oldValue, newValue);
       if (name === 'fields'  || 
           name === 'records' ||
           name === 'bgcolor' 
           ){
            this.renderDatatable();
       } 
    } 

    // helper method for datatable  
    renderDatatable() {
        console.log(this.records);
        console.log(this.bgcolor);
        // console.log(this.fields);
        this.datatableDiv.setAttribute('style',
        `
         width:${this.fields.split(',').length * 300} px; 
         background-color:${this.bgcolor};
         border-radius:10px;
         text-align:center;
         padding:5px;
        `
        );
        const thead  = this.shadowRoot.getElementById('thead');
        const headTr  = this.shadowRoot.getElementById('headTr');

        // field Header
        let fields = this.fields.split(',');
        for (let field of fields) {
            const th = document.createElement('th');
            const textContent = document.createTextNode(field);
            th.appendChild(textContent);
            headTr.appendChild(th);
        }
        thead.append(headTr);

        // records
        const tbody  = this.shadowRoot.getElementById('tbody');
        let records = this.records.split('\n');
        for (let record of records) {
            const bodyTr  = document.createElement('tr'); 
            let dfields = record.split(',');
            for (let dfield of dfields) {
                const td = document.createElement('td');
                const textContent = document.createTextNode(dfield);
                td.appendChild(textContent);
                bodyTr.appendChild(td);
            }
            tbody.appendChild(bodyTr);
        }


    }
    constructor() {
        super();
        // create shadow DOM
        const shadow = this.attachShadow({ mode: 'open'});
        this.datatableDiv = document.createElement('table');
        this.datatableDiv.setAttribute('border', 1);
        let thead = document.createElement('thead');
        thead.setAttribute('id', 'thead');
        let headTr = document.createElement('tr');
        headTr.setAttribute('id', 'headTr');
        thead.appendChild(headTr);

        let tbody = document.createElement('tbody');
        tbody.setAttribute('id', 'tbody');
        this.datatableDiv.appendChild(thead);
        this.datatableDiv.appendChild(tbody);

        // append it to the shadowRoot
        shadow.appendChild(this.datatableDiv);
        // let us render the datatable first time
        this.renderDatatable();
    }


}

customElements.define('mc-datatable', Datatable);