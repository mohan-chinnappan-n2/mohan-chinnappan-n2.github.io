function xmlTocsv() {
    var data = $("#xmlArea").val();
    var xml = "";
    if (data !== null && data.trim().length !== 0) {
        try {
            xml = $.parseXML(data);
        } catch (e) {
            throw e;
        }

        var x2js = new X2JS();
        data = x2js.xml2json(xml);
        jsonTocsvbyjson(data);
        
    }
}

function jsonTocsvbyjson(data, returnFlag) {
    arr = [];
    flag = true;

    var header = "";
    var content = "";
    var headFlag = true;

    try {

        var type1 = typeof data;

        if (type1 != "object") {
            data = processJSON($.parseJSON(data));
        } else {
            data = processJSON(data);
        }

    } catch (e) {
        if (returnFlag === undefined || !returnFlag) {
            console.error("Error in Convert to CSV");
        } else {
            console.error("Error in Convert :" + e);
        }
        return false;
    }

    $.each(data, function(k, value) {
        if (k % 2 === 0) {
            if (headFlag) {
                if (value != "end") {
                    header += value + ",";
                } else {
                    // remove last colon from string
                    header = header.substring(0, header.length - 1);
                    headFlag = false;
                }
            }
        } else {
            if (value != "end") {
                var temp = data[k - 1];
                if (header.search(temp) != -1) {
                    content += value + ",";
                }
            } else {
                // remove last colon from string
                content = content.substring(0, content.length - 1);
                content += "\n";
            }
        }

    });

    if (returnFlag === undefined || !returnFlag) {
        $("#csvArea").val(header + "\n" + content);
    } else {
        return (header + "\n" + content);
    }
}

function processJSON(data) {

    $.each(data, function(k, data1) {

        var type1 = typeof data1;

        if (type1 == "object") {

            flag = false;
            processJSON(data1);
            arr.push("end");
            arr.push("end");

        } else {
            arr.push(k, data1);
        }

    });
    return arr;
}
