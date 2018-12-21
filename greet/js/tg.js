  (function() {
        var query = location.search.substr(1);
        var result = {};
        query.split("&").forEach(function(part) {
          var item = part.split("=");
          result[item[0]] = decodeURIComponent(item[1]);
        });
        var name = result.n || 'you';
        var ele = document.getElementById('mp3Name');
        var greeting = 'Happy Thanksgiving to ' + name + '!!!'; 
        ele.innerHTML = greeting;
        var title= document.getElementById('title');
        title.innerHTML = 'Happy Thanksgiving to ' + name + '!!!'; 
        var header= document.getElementById('header');
        header.innerHTML = 'Happy Thanksgiving to ' + name + '!!!'; 
})();


