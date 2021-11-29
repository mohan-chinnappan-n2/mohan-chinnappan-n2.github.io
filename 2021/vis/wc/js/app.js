// app.js
// mohan chinnappan

Split([ "#pcontent", "#pwc"], { sizes: [45, 55] });

   

    let wcSpec =
    {
        "$schema": "https://vega.github.io/schema/vega/v5.json",
        "description": "A word cloud visualization",
        "width": 800,
        "height": 400,
        "padding": 0,
      
        "data": [
          {
            "name": "table",
            "values": ["All great things are simple." ],
            "transform": [
              {
                "type": "countpattern",
                "field": "data",
                "case": "upper",
                "pattern": "[\\w']{3,}",
                "stopwords": "(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)"
              },
              {
                "type": "formula", "as": "angle",
                "expr": "[-45, 0, 45][~~(random() * 3)]"
              },
              {
                "type": "formula", "as": "weight",
                "expr": "if(datum.text=='VEGA', 600, 300)"
              }
            ]
          }
        ],
      
        "scales": [
          {
            "name": "color",
            "type": "ordinal",
            "domain": {"data": "table", "field": "text"},
            "range": ["#d5a928", "#652c90", "#939597"]
          }
        ],
      
        "marks": [
          {
            "type": "text",
            "from": {"data": "table"},
            "encode": {
              "enter": {
                "text": {"field": "text"},
                "align": {"value": "center"},
                "baseline": {"value": "alphabetic"},
                "fill": {"scale": "color", "field": "text"}
              },
              "update": {
                "fillOpacity": {"value": 1}
              },
              "hover": {
                "fillOpacity": {"value": 0.5}
              }
            },
            "transform": [
              {
                "type": "wordcloud",
                "size": [800, 400],
                "text": {"field": "text"},
                "rotate": {"field": "datum.angle"},
                "font": "Helvetica Neue, Arial",
                "fontSize": {"field": "datum.count"},
                "fontWeight": {"field": "datum.weight"},
                "fontSizeRange": [12, 56],
                "padding": 2
              }
            ]
          }
        ]
      };

      // read params
        const query = location.search.substr(1);
        var qresult = {};
        query.split("&").forEach(function(part) {
            var item = part.split("=");
            qresult[item[0]] = decodeURIComponent(item[1]);
        });


       const url = qresult.f || './2021/v2mom.txt';


      const contentHTMLEle = document.getElementById('content-html');
      const contentEle = document.getElementById('content');

      const drawEle = document.getElementById('draw');

      async function getContent(url) {
           const response =  await fetch(url); 
           if (!response.ok) {
            const message = `An error has occured: ${response.status}`;
            throw new Error(message);
          }
          const result = await response.text();
          return result;
      };

       getContent(url).then(content => {
        contentHTMLEle.innerHTML = content;
        contentEle.value = contentHTMLEle.innerText;
        drawEle.click();


       });


      const paintWC = event => {
        const content = contentEle.value.trim().split('\n');
        // console.log(wcSpec);
        wcSpec.data[0].values = content;
        vegaEmbed('#wc', wcSpec).then(function(result) { }).catch(console.error);

      }

      drawEle.addEventListener('click', event => {
          paintWC(event);
      });

