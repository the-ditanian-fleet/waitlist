git archive --format=tar HEAD frontend > archive-frontend.tar
git archive --format=tar HEAD api > archive-api.tar
docker build -t docker.tvdw.eu/tdf-wl2:latest .
