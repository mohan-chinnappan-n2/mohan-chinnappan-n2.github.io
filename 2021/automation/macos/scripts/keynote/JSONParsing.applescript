-- parsing JSON
tell application "JSON Helper"
    set json to fetch JSON from "http://ip-api.com/json/8.8.8.8?fields=country,city,isp,org,as,mobile,proxy,message"
    set countryName to |country| of json
end tell


set rum_server_url to "https://mohansun-rum.herokuapp.com/time"

tell application "JSON Helper"
    set json to fetch JSON from rum_server_url
    set current_time to |time| of json
end tell


