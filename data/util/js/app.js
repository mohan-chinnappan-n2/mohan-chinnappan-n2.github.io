const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<CATALOG>
  <CD>
    <TITLE>Empire Burlesque</TITLE>
    <ARTIST>Bob Dylan</ARTIST>
    <COUNTRY>USA</COUNTRY>
    <COMPANY>Columbia</COMPANY>
    <PRICE>10.90</PRICE>
    <YEAR>1985</YEAR>
  </CD>
  <CD>
    <TITLE>Hide your heart</TITLE>
    <ARTIST>Bonnie Tyler</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>CBS Records</COMPANY>
    <PRICE>9.90</PRICE>
    <YEAR>1988</YEAR>
  </CD>
  <CD>
    <TITLE>Greatest Hits</TITLE>
    <ARTIST>Dolly Parton</ARTIST>
    <COUNTRY>USA</COUNTRY>
    <COMPANY>RCA</COMPANY>
    <PRICE>9.90</PRICE>
    <YEAR>1982</YEAR>
  </CD>
  <CD>
    <TITLE>Still got the blues</TITLE>
    <ARTIST>Gary Moore</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>Virgin records</COMPANY>
    <PRICE>10.20</PRICE>
    <YEAR>1990</YEAR>
  </CD>
  <CD>
    <TITLE>Eros</TITLE>
    <ARTIST>Eros Ramazzotti</ARTIST>
    <COUNTRY>EU</COUNTRY>
    <COMPANY>BMG</COMPANY>
    <PRICE>9.90</PRICE>
    <YEAR>1997</YEAR>
  </CD>
  <CD>
    <TITLE>One night only</TITLE>
    <ARTIST>Bee Gees</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>Polydor</COMPANY>
    <PRICE>10.90</PRICE>
    <YEAR>1998</YEAR>
  </CD>
  <CD>
    <TITLE>Sylvias Mother</TITLE>
    <ARTIST>Dr.Hook</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>CBS</COMPANY>
    <PRICE>8.10</PRICE>
    <YEAR>1973</YEAR>
  </CD>
  <CD>
    <TITLE>Maggie May</TITLE>
    <ARTIST>Rod Stewart</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>Pickwick</COMPANY>
    <PRICE>8.50</PRICE>
    <YEAR>1990</YEAR>
  </CD>
  <CD>
    <TITLE>Romanza</TITLE>
    <ARTIST>Andrea Bocelli</ARTIST>
    <COUNTRY>EU</COUNTRY>
    <COMPANY>Polydor</COMPANY>
    <PRICE>10.80</PRICE>
    <YEAR>1996</YEAR>
  </CD>
  <CD>
    <TITLE>When a man loves a woman</TITLE>
    <ARTIST>Percy Sledge</ARTIST>
    <COUNTRY>USA</COUNTRY>
    <COMPANY>Atlantic</COMPANY>
    <PRICE>8.70</PRICE>
    <YEAR>1987</YEAR>
  </CD>
  <CD>
    <TITLE>Black angel</TITLE>
    <ARTIST>Savage Rose</ARTIST>
    <COUNTRY>EU</COUNTRY>
    <COMPANY>Mega</COMPANY>
    <PRICE>10.90</PRICE>
    <YEAR>1995</YEAR>
  </CD>
  <CD>
    <TITLE>1999 Grammy Nominees</TITLE>
    <ARTIST>Many</ARTIST>
    <COUNTRY>USA</COUNTRY>
    <COMPANY>Grammy</COMPANY>
    <PRICE>10.20</PRICE>
    <YEAR>1999</YEAR>
  </CD>
  <CD>
    <TITLE>For the good times</TITLE>
    <ARTIST>Kenny Rogers</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>Mucik Master</COMPANY>
    <PRICE>8.70</PRICE>
    <YEAR>1995</YEAR>
  </CD>
  <CD>
    <TITLE>Big Willie style</TITLE>
    <ARTIST>Will Smith</ARTIST>
    <COUNTRY>USA</COUNTRY>
    <COMPANY>Columbia</COMPANY>
    <PRICE>9.90</PRICE>
    <YEAR>1997</YEAR>
  </CD>
  <CD>
    <TITLE>Tupelo Honey</TITLE>
    <ARTIST>Van Morrison</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>Polydor</COMPANY>
    <PRICE>8.20</PRICE>
    <YEAR>1971</YEAR>
  </CD>
  <CD>
    <TITLE>Soulsville</TITLE>
    <ARTIST>Jorn Hoel</ARTIST>
    <COUNTRY>Norway</COUNTRY>
    <COMPANY>WEA</COMPANY>
    <PRICE>7.90</PRICE>
    <YEAR>1996</YEAR>
  </CD>
  <CD>
    <TITLE>The very best of</TITLE>
    <ARTIST>Cat Stevens</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>Island</COMPANY>
    <PRICE>8.90</PRICE>
    <YEAR>1990</YEAR>
  </CD>
  <CD>
    <TITLE>Stop</TITLE>
    <ARTIST>Sam Brown</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>A and M</COMPANY>
    <PRICE>8.90</PRICE>
    <YEAR>1988</YEAR>
  </CD>
  <CD>
    <TITLE>Bridge of Spies</TITLE>
    <ARTIST>T'Pau</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>Siren</COMPANY>
    <PRICE>7.90</PRICE>
    <YEAR>1987</YEAR>
  </CD>
  <CD>
    <TITLE>Private Dancer</TITLE>
    <ARTIST>Tina Turner</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>Capitol</COMPANY>
    <PRICE>8.90</PRICE>
    <YEAR>1983</YEAR>
  </CD>
  <CD>
    <TITLE>Midt om natten</TITLE>
    <ARTIST>Kim Larsen</ARTIST>
    <COUNTRY>EU</COUNTRY>
    <COMPANY>Medley</COMPANY>
    <PRICE>7.80</PRICE>
    <YEAR>1983</YEAR>
  </CD>
  <CD>
    <TITLE>Pavarotti Gala Concert</TITLE>
    <ARTIST>Luciano Pavarotti</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>DECCA</COMPANY>
    <PRICE>9.90</PRICE>
    <YEAR>1991</YEAR>
  </CD>
  <CD>
    <TITLE>The dock of the bay</TITLE>
    <ARTIST>Otis Redding</ARTIST>
    <COUNTRY>USA</COUNTRY>
    <COMPANY>Stax Records</COMPANY>
    <PRICE>7.90</PRICE>
    <YEAR>1968</YEAR>
  </CD>
  <CD>
    <TITLE>Picture book</TITLE>
    <ARTIST>Simply Red</ARTIST>
    <COUNTRY>EU</COUNTRY>
    <COMPANY>Elektra</COMPANY>
    <PRICE>7.20</PRICE>
    <YEAR>1985</YEAR>
  </CD>
  <CD>
    <TITLE>Red</TITLE>
    <ARTIST>The Communards</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>London</COMPANY>
    <PRICE>7.80</PRICE>
    <YEAR>1987</YEAR>
  </CD>
  <CD>
    <TITLE>Unchain my heart</TITLE>
    <ARTIST>Joe Cocker</ARTIST>
    <COUNTRY>USA</COUNTRY>
    <COMPANY>EMI</COMPANY>
    <PRICE>8.20</PRICE>
    <YEAR>1987</YEAR>
  </CD>
</CATALOG>
`;




const xmlArea = document.getElementById('xmlArea');
const convertToXmlBtn = document.getElementById('convertToXmlBtn');
let dtable = null;
let myHotTable = null;


const init = (content) => {
    xmlArea.value = content;
    //  convertToXmlBtn.click();
}
init(sampleXML);

//======================


function xmlTocsv() {
    var data = $("#xmlArea").val();
   
    var xml = "";
    if (data !== null && data.trim().length !== 0) {
        try {
            xml = $.parseXML(data);
        } catch (e) {
            alert(e);
            throw e;
        }

        var x2js = new X2JS();
        data = x2js.xml2json(xml);
        
        document.getElementById("results").innerHTML = ""; // cleanup the json editor
        new JSONEditor(document.getElementById('results'), {mode: 'code'}, data);

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

    const columns = header.split(',');
    const body  = content.split('\n');
    let dtDataColumns = [];
    let columnsDef = [];
    let dtData = [];
    let hotData = [];

    const tbl = document.getElementById('tbl');

    
    // clean up the thead and tbody
    tbl.removeChild(tbl.childNodes[0]);
    tbl.removeChild(tbl.childNodes[1 ]);
    const thead = document.createElement('thead');


    let hotRow = [];
    columns.forEach( (col, index) => {
        dtDataColumns.push(col);
        const th = document.createElement('th');
        const text = document.createTextNode(col);

        hotRow.push(col);

        th.appendChild(text);
        thead.appendChild(th);
         
        // console.log(columnsDef);
        columnsDef.push( {data: col});
    });

    hotData.push(hotRow);

   


    tbl.appendChild(thead);

    body.forEach( (row, index) => {
          hotRow = [];
          if (row.trim().length !== 0)  {
            const colData = row.split(',');
            let rowData = {};
            colData.forEach( (cd, index) => {
                rowData[dtDataColumns[index]] = cd;
                hotRow.push(cd)
            });
            dtData.push(rowData);
            hotData.push(hotRow);
        }
    });
    // console.log(dtData)
    // console.log(columnsDef);


  

    if (returnFlag === undefined || !returnFlag) {
        $("#csvArea").val(header + "\n" + content);
        // console.log(columnsDef);
        

          const container = document.getElementById('hotTable');
          // console.log(container);
          // console.log(hotData);

          if (myHotTable) {
            myHotTable.updateSettings( //   we need to update with new data
              {
                data: hotData,
                rowHeaders: true,
                colHeaders: true,
                columnSorting: true,
              
                dropdownMenu: true,
                filters: true,
                
                licenseKey: 'non-commercial-and-evaluation'
                
              
              
              });
          } else {

            myHotTable = new Handsontable(container, {
              data: hotData,
              rowHeaders: true,
              colHeaders: true,
              columnSorting: true,
            
              dropdownMenu: true,
              filters: true,
              
              licenseKey: 'non-commercial-and-evaluation'
              
            });
          }
          // console.log(dtData);
          // console.log(dtable);
          if (dtable) {
            dtable.clear().draw();
           // dtable.rows(dtData);
            // dtable.columns(columnsDef)

            dtable =  $('#tbl').DataTable ({  
              destroy: true, // we need to redraw! : https://datatables.net/manual/tech-notes/3
              data: dtData, 
              columns: columnsDef 
            });
            // dtable.columns.adjust().draw();  


          }  else {
         
            dtable =  $('#tbl').DataTable ({  
              destroy: true, // we need to redraw! : https://datatables.net/manual/tech-notes/3
              data: dtData, 
              columns: columnsDef 
            });
          }
            
         
        

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
