ffmpeg -i MC2.webm -i MC2.mp3 -map 0:v -map 1:a -c:v copy -shortest MC2.mp4
