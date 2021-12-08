# sudo lsof -i :1717
sudo lsof -i :$1
sudo kill -9 pid
