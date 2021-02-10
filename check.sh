#!/bin/bash
set -ex
cd api
mypy --strict waitlist *.py
black --check waitlist *.py
pylint waitlist *.py
cd ..

cd frontend
npm run lint
npx prettier --check .
cd ..

