class PieChart extends HTMLElement {

   // inspiration: https://github.com/timeu/svg-piechart/blob/master/svg-piechart.html

    static get DEFAULT_COLORS16() {
        return ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#1e88e5', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
            '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
        ];
    }
    static get DEFAULT_COLORS8() {
        return ['#f44336', '#9c27b0', '#3f51b5',
            '#03a9f4', '#009688', '#8bc34a', '#ffeb3b', '#ff9800'
        ];
    }

    _upgradeProperty(prop) {
        if (this.hasOwnProperty(prop)) {
          let value = this[prop];
          delete this[prop];
          this[prop] = value;
        }
    }


    // getters
    get data() {
        return this.getAttribute('data');
    }
    get colors() {
        return this.getAttribute('colors')
    }
    get size() {
        return this.getAttribute('size');
    }
 

    // let us observe the attributes 
    static get observedAttributes() {
        return ['colors', 'size', 'data'];
    }
    // handle the change in the attribute 'progress' 
    attributeChangedCallback(name, oldValue, newValue) {
        // console.log(name, oldValue, newValue);
        this._render();
    }

    // helper method for  painting
    paint() {
        this.pieDiv.setAttribute('class', 'pie');
    }

    _calculateTotal(data) {
        // console.log(data);
        let total = 0;
        for (let i = 0; i < data.length; i++) {
            total +=  parseInt( data[i] );
        }
        return total;
    }
    _computePath(arc) {
        return 'M180,180 L' + arc.x1 + ',' + arc.y1 + ' A180,180 0 ' + arc.largeArcFlag + ',1 ' + arc.x2 + ',' + arc.y2 + ' z';
    }
    _getColors(colors) {
        if (!colors || colors.length == 0) {
            if (this.data.length > 8) {
                colors = this.constructor.DEFAULT_COLORS16;
            } else if (this.data.length > 4) {
                colors = this.constructor.DEFAULT_COLORS8;
            } else {
                colors = this.constructor.DEFAULT_COLORS4;
            }
        }
        return colors;
    }

    _calculateArcs(colors, data) {
        // console.log( typeof(data), data);
        let total = this._calculateTotal(data);
        // console.log(`total: ${total}`);
        colors = this._getColors(colors);
        let startAngle = 0;
        let endAngle = -90;
        let arcs = [];
        for (let i = 0; i < data.length; i++) {
            let angle = (360 * data[i] / total);
            let largeArcFlag = 0;
            if (angle > 180) {
                largeArcFlag = 1;
            }
            startAngle = endAngle;
            endAngle = startAngle + angle;
            let arc = {
                x1: 180 + 180 * Math.cos(Math.PI * startAngle / 180),
                y1: 180 + 180 * Math.sin(Math.PI * startAngle / 180),
                x2: 180 + 180 * Math.cos(Math.PI * endAngle / 180),
                y2: 180 + 180 * Math.sin(Math.PI * endAngle / 180),
                largeArcFlag: largeArcFlag,
                color: colors[i]
            };
            if (arc.x2 > 179.9 && arc.y2 === 0 && arc.largeArcFlag === 1) {
                arc.x2 = 179.99;
            }
            arcs.push(arc);
        }
        return arcs;
    }

 

      


    _render() {
        // TODO: remove eval!
        // console.log('rendering...', this.data, this.colors);
        let arcs = this._calculateArcs(eval(this.colors), eval(this.data));
        //console.log(arcs);
        this.svg.setAttribute('width',this.size);
        this.svg.setAttribute('height',this.size);
        while (this.svg.firstChild) {
          this.svg.removeChild(this.svg.firstChild);
        }
        for (let i = 0; i < arcs.length; i++) {
          // console.log(arcs[i]);

          let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          // IE11 does not support classList on SVG elements
          if (path.classList) {
            path.classList.add('slice');
          }
          else {
            path.setAttribute('class','slice');
          }
          path.style.fill = arcs[i].color;
          path.setAttribute('d', this._computePath(arcs[i]));
          this.svg.appendChild(path);
        }
      }


    constructor() {
        super();
        // create shadow DOM
        const shadow = this.attachShadow({
            mode: 'open'
        });

        /*
        this.data = [ 10,    20, 40,  50];
        this.size = 150;
        this.colors =  ["red", "#666", "#1e88e5", "rgba(255, 0, 20, .4)"];
        */

        this._upgradeProperty('data');
        this._upgradeProperty('colors');


        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // about viewBox attribute: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox
        this.svg.setAttribute('viewBox', "0 0 360 360");
        this.svg.setAttribute('width', this.size);
        this.svg.setAttribute('height', this.size);
        shadow.appendChild(this.svg);


        this._render();
    }


}

customElements.define('mc-pie-chart', PieChart);