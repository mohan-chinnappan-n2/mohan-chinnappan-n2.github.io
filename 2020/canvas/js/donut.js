const canvas  = document.getElementById("chart");
const chart = canvas.getContext("2d");

const canvas2 = document.getElementById("chart2");
const ctx2 = canvas2.getContext("2d");

const canvas3 = document.getElementById("chart3");
const ctx3 = canvas2.getContext("2d");

const chart3Legend = document.getElementById("chart3Legend");

//ref: https://code.tutsplus.com/tutorials/how-to-draw-a-pie-chart-and-doughnut-chart-using-javascript-and-html5-canvas--cms-27197
let  getRandomColor = () =>{
    const letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

let drawLine = (ctx, startX, startY, endX, endY) =>{
    ctx.beginPath();
    ctx.moveTo(startX,startY);
    ctx.lineTo(endX,endY);
    ctx.stroke();
}

let drawArc = (ctx, centerX, centerY, radius, startAngle, endAngle) =>{
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();
}

let drawPieSlice = (ctx,centerX, centerY, radius, startAngle, endAngle, color ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX,centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
}

var Piechart = function(options){
    this.options = options;
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.colors = options.colors;
 
    this.draw = function() {
        var total_value = 0;
        var color_index = 0;
        for (var categ in this.options.data){
            var val = this.options.data[categ];
            total_value += val;
        }
 
        var start_angle = 0;
        for (categ in this.options.data){
            val = this.options.data[categ];
            var slice_angle = 2 * Math.PI * val / total_value;
 
            drawPieSlice(
                this.ctx,
                this.canvas.width/2,
                this.canvas.height/2,
                Math.min(this.canvas.width/2,this.canvas.height/2),
                start_angle,
                start_angle+slice_angle,
                this.colors[color_index%this.colors.length]
            );
 
            start_angle += slice_angle;
            color_index++;
        }
 
        //drawing a white circle over the chart
        //to create the doughnut chart
        if (this.options.doughnutHoleSize){
            drawPieSlice(
                this.ctx,
                this.canvas.width/2,
                this.canvas.height/2,
                this.options.doughnutHoleSize * Math.min(this.canvas.width/2,this.canvas.height/2),
                0,
                2 * Math.PI,
                "white"
            );
        }

        start_angle = 0;
        for (categ in this.options.data){
            val = this.options.data[categ];
            slice_angle = 2 * Math.PI * val / total_value;
            var pieRadius = Math.min(this.canvas.width/2,this.canvas.height/2);
            var labelX = this.canvas.width/2 + (pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
            var labelY = this.canvas.height/2 + (pieRadius / 2) * Math.sin(start_angle + slice_angle/2);
         
            if (this.options.doughnutHoleSize){
                var offset = (pieRadius * this.options.doughnutHoleSize ) / 2;
                labelX = this.canvas.width/2 + (offset + pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
                labelY = this.canvas.height/2 + (offset + pieRadius / 2) * Math.sin(start_angle + slice_angle/2);               
            }
         
            var labelText = Math.round(100 * val / total_value);
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 20px Arial";
            this.ctx.fillText(labelText+"%", labelX,labelY);
            start_angle += slice_angle;
        }
        if (this.options.legend){
            color_index = 0;
            var legendHTML = "";
            for (categ in this.options.data){
                legendHTML += "<div><span style='display:inline-block;width:20px;background-color:"+this.colors[color_index++]+";'>&nbsp;</span> "+categ+"</div>";
            }
            this.options.legend.innerHTML = legendHTML;
        }
 
    }
}


var drawDountChart = function(canvas)  {
    this.x , this.y , this.radius , this.lineWidth , this.strockStyle , this.from , this.to = null;

    this.set = function( x, y, radius, from, to, lineWidth, strockStyle) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.from=from;
        this.to= to;
        this.lineWidth = lineWidth;
        this.strockStyle = strockStyle; 
    }

    this.draw = function(data) {
        const parts = data.parts.pt;
        const sum = parts.reduce((a, b) => a + b, 0);
        canvas.beginPath();
        canvas.lineWidth = this.lineWidth;
        canvas.strokeStyle = this.strockStyle;
        canvas.arc(this.x , this.y , this.radius , this.from , this.to);
        canvas.stroke();
        let df = 0;
        parts.forEach( part => { 
            const pv = part/sum;
            canvas.beginPath();
            canvas.strokeStyle = getRandomColor();
            canvas.arc(this.x, this.y, this.radius, df, df + (Math.PI * 2) * (pv));
            canvas.stroke();
            df += (Math.PI * 2) * (pv);
        });
    }
}

const data = { 
    parts:{"pt": [10,20,15,15,40,30,60,50 ]}
};

const drawDount = new drawDountChart(chart);
drawDount.set(150, 150, 100, 0, Math.PI, 60, "white");
drawDount.draw(data);

// testing

drawLine(ctx2,100,100,200,200);
drawArc(ctx2, 150,150,150, 0, Math.PI/3);
drawPieSlice(ctx2, 150,150,150, Math.PI/2, Math.PI/2 + Math.PI/4, 'steelblue');

// pie chart

const pieData =  {
    "Apples": 10,
    "Mangos": 14,
    "Peaches": 2,
    "Plums": 12
};

const pieChart1 = new Piechart( {
        canvas:canvas3,
        data: pieData,
        colors:["#fde23e","#f16e23", "#57d9ff","#937e88"],
        doughnutHoleSize:0.5,
        legend:chart3Legend 
    }
);
pieChart1.draw();

