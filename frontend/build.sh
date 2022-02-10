git archive --format=tar HEAD . > archive-frontend.tar
docker build . "$@"
