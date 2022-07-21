#!/bin/bash
set -x
$(cd backend; /bin/bash build.sh )
$(cd frontend; /bin/bash build.sh )
