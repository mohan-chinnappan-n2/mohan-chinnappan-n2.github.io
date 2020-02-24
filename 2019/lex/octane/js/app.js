/* app.js 


Original code : Chromium Authors

Modifications: Mohan Chinnappan

Feb-23-2020

*/

        var SCORESG = [];
        var SCORES = {};

        var completed = 0;
        var benchmarks = BenchmarkSuite.CountBenchmarks();
        var percentCompleted = 0;
        var success = true;
        var latencyBenchmarks = ["Splay", "Mandreel"];
        var skipBenchmarks =
            typeof skipBenchmarks === "undefined" ? [] : skipBenchmarks;

        function ShowBox(name) {
            var box = document.getElementById("Box-" + name);
            var scoreProgress = document.getElementById('score-progress');
            box.style.visibility = 'visible';
          
            
            percentCompleted  = ((++completed) / benchmarks) * 100 ;
            scoreProgress.style.width = `${percentCompleted}%`;
            scoreProgress.innerHTML=`${percentCompleted.toFixed(0)}%`;

           // console.log('% completed: ' + percentCompleted);

            latencyBenchmarks.forEach(function (entry) {
                if (name.valueOf() === entry.valueOf()) {
                    var box1 = document.getElementById("Box-" + name + "Latency");
                    box1.style.visibility = 'visible';
                }
            });
        }

        function AddResult(name, result) {
            // console.log(name + ': ' + result);
            let item = { "category": name, amount:parseInt(result)};
            SCORESG.push(item);

            SCORES[name] = parseInt(result);
          
            var box = document.getElementById("Result-" + name);
            box.innerHTML = result.toLocaleString();
            // console.log(SCORES);
        }

        function AddError(name, error) {
            console.log(name + ": " + error.message);
            if (error == "TypedArrayUnsupported") {
                AddResult(name, '<b>Unsupported<\/b>');
            } else if (error == "PerformanceNowUnsupported") {
                AddResult(name, '<b>Timer error<\/b>');
            } else {
                AddResult(name, '<b>Error</b>');
            }
            success = false;
        }

        function AddScore(score) {
            let runFPS = document.getElementById('runFPS');
            let fpsOut = document.getElementById('fps');
            var status = document.getElementById("main-banner");
            let memInfo = document.getElementById('mem-info');
            var scoreProgress = document.getElementById('score-progress');
            if (success) {
                status.innerHTML = "Octane Score: " + score.toLocaleString();
                runFPS.style.visibility ='visible';
                fpsOut.style.visibility ='visible';
                memInfo.style.visibility ='visible';
                document.getElementById('o-spinner').style.visibility='hidden';
                percentCompleted  = 100;
                
                scoreProgress.style.width = `${percentCompleted}%`;
                scoreProgress.innerHTML=`${percentCompleted.toFixed(0)}%`;
                scoreProgress.classList.remove('progress-bar-animated');

                document.getElementById('finalScore').value = JSON.stringify(SCORES, null, 4);
                document.getElementById('finalScore').style.display='block';
    
                
            } else {
                status.innerHTML = "Octane Score (incomplete): " + score;
                console.log("Octane Score (incomplete): " + score);
            }
            document.getElementById("alertbox").style.visibility = 'hidden';
        }

        

        function Run() {

            document.getElementById('o-spinner').style.visibility = 'visible';

            let runFPS = document.getElementById('runFPS');
            let fpsOut = document.getElementById('fps');
            let memInfo = document.getElementById('mem-info');


            let userAgent = navigator.userAgent;
            document.getElementById('userAgent').innerHTML =
                ` 
            ${userAgent}`;
            document.getElementById('ua-card').style.visibility='visible';
            document.getElementById('webGL').style.visibility='visible';

            findWebGL(document.getElementById('webGL'));

            
            runFPS.addEventListener('click', function() {
                getFPS(fpsOut);
            })

            if (navigator.userAgent.indexOf('Chrome') > 0 ) {
                document.getElementById('mem-info').innerHTML =  getMemoryInfo();
            }
            
            // let frameTime = 10000;
            // Report the fps only every second, to only lightly affect measurements
            // setInterval(function(){ fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps"; },1000);

            let h3s = document.getElementsByTagName('h3')
            // console.log(h3s);
            for (let i = 0; i < h3s.length; i++) {
                h3s[i].style.visibility = 'visible';
            }

            document.getElementById("main-banner").innerHTML = "Running Octane...";
            // append the progress bar elements..
            var anchor = document.getElementById("run-octane");
            var parent = document.getElementById("main-container");
            parent.appendChild(document.getElementById("inside-anchor"));
            parent.removeChild(anchor);


            BenchmarkSuite.RunSuites({
                    NotifyStart: ShowBox,
                    NotifyError: AddError,
                    NotifyResult: AddResult,
                    NotifyScore: AddScore
                },
                skipBenchmarks);
        

        }

        function CheckCompatibility() {
            // If no Typed Arrays support, show warning label.
            var hasTypedArrays = typeof Uint8Array != "undefined" &&
                typeof Float64Array != "undefined" &&
                typeof (new Uint8Array(0)).subarray != "undefined";

            if (!hasTypedArrays) {
                console.log("Typed Arrays not supported");
                document.getElementById("alertbox").style.display = "block";
            }
            if (window.document.URL.indexOf('skip_zlib=1') >= 0)
                skipBenchmarks.push("zlib");
            if (window.document.URL.indexOf('auto=1') >= 0)
                Run();
        }

        function Load() {
            setTimeout(CheckCompatibility, 200);
        }


        function getMemoryInfo(para) {

            let performance = window.performance;
            if (performance) {
            return `
            <b>Memory Info (bytes)</b><br>
            Total Heap Size: ${performance.memory.totalJSHeapSize.toLocaleString()} <br>
            Used Heap Size: ${performance.memory.usedJSHeapSize.toLocaleString()} <br>
            Heap Size Limit: ${performance.memory.jsHeapSizeLimit.toLocaleString()}<br>
            
            `
            } else {
                return "";
            }
        }


        function findWebGL(paragraph) {
            // Create canvas element. The canvas is not added to the
            // document itself, so it is never displayed in the
            // browser window.
            var canvas = document.createElement("canvas");
            // Get WebGLRenderingContext from canvas element.
            var gl = canvas.getContext("webgl") ||
                canvas.getContext("experimental-webgl");
            // Report the result.
            if (gl && gl instanceof WebGLRenderingContext) {
                paragraph.innerHTML =
                    `Your browser supports <b>WebGL</b> and has    ${gl.getSupportedExtensions().length}  extensions.<br>
                     Version: ${gl.getParameter(gl.VERSION)} <br>
                     Vendor : ${gl.getParameter(gl.VENDOR)} <br>
                     Shading Lang Ver: ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}<br>

                    `

            } else {
                paragraph.innerHTML = "Failed to get WebGL context. " +
                    "Your browser or device may not support WebGL.";
            }
        }

   


    function getFPS (loc)  {
        var before,now,fps;
        before=Date.now();
        fps=0;
        requestAnimationFrame(

            function loop(){

                now=Date.now();
                fps=Math.round(1000/(now-before));
                before=now;
                requestAnimationFrame(loop);
                loc.innerHTML = 'FPS: ' + fps;
            }
        );
    }
