ffmpeg -i $1 -c:v libvpx -crf 10 -b:v 1M -c:a libvorbis $1.webm


