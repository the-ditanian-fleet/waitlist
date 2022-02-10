git archive --format=tar HEAD . > archive-backend.tar
docker build . "$@"
