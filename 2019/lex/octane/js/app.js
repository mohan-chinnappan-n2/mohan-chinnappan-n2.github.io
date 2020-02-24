/* app.js 


Original code : Chromium Authors

Modifications: Mohan Chinnappan

Feb-23-2020

*/

        var completed = 0;
        var benchmarks = BenchmarkSuite.CountBenchmarks();
        var success = true;
        var latencyBenchmarks = ["Splay", "Mandreel"];
        var skipBenchmarks =
            typeof skipBenchmarks === "undefined" ? [] : skipBenchmarks;

        function ShowBox(name) {
            var box = document.getElementById("Box-" + name);
            box.style.visibility = 'visible';
            var bar = document.getElementById("progress-bar").style.width = "" +
                ((++completed) / benchmarks) * 100 + "%";
            latencyBenchmarks.forEach(function (entry) {
                if (name.valueOf() === entry.valueOf()) {
                    var box1 = document.getElementById("Box-" + name + "Latency");
                    box1.style.visibility = 'visible';
                }
            });
        }

        function AddResult(name, result) {
            console.log(name + ': ' + result);
            var box = document.getElementById("Result-" + name);
            box.innerHTML = result;
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

            if (success) {
                status.innerHTML = "Octane Score: " + score.toLocaleString();
                runFPS.style.visibility ='visible';
                fpsOut.style.visibility ='visible';
                memInfo.style.visibility ='visible';
                
            } else {
                status.innerHTML = "Octane Score (incomplete): " + score;
            }
            document.getElementById("progress-bar-container").style.visibility = 'hidden';
            document.getElementById("bottom-text").style.visibility = 'visible';
            document.getElementById("inside-anchor").removeChild(document.getElementById("bar-appendix"));
            document.getElementById("alertbox").style.visibility = 'hidden';
        }

        

        function Run() {

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
            
            let frameTime = 10000;
            // Report the fps only every second, to only lightly affect measurements
            // setInterval(function(){ fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps"; },1000);

            let h3s = document.getElementsByTagName('h3')
            // console.log(h3s);
            for (let i = 0; i < h3s.length; i++) {
                h3s[i].style.visibility = 'visible';
            }

            document.getElementById("main-banner").innerHTML = "Running Octane...";
            // append the progress bar elements..
            document.getElementById("bar-appendix").innerHTML =
                "<br/><div class=\"progress \" id=\"progress-bar-container\" style=\"visibility:visible\"><div class=\"bar\"style=\"width: 0%;\" id=\"progress-bar\"></div></div>";
            var anchor = document.getElementById("run-octane");
            var parent = document.getElementById("main-container");
            parent.appendChild(document.getElementById("inside-anchor"));
            parent.removeChild(anchor);

            // document.getElementById("startup-text").innerHTML = "";

            document.getElementById("progress-bar-container").style.visibility = 'visible';

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
