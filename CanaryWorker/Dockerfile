# Base Image:
# -----------
# Install source, tests, and node dependencies
FROM public.ecr.aws/lambda/nodejs:22 AS base

# Uncomment NPM_TOKEN to enable Github as private npm registry
# ARG NPM_TOKEN

# RUN npm install -g yarn
WORKDIR /usr/app

# COPY package.json jest.config.ts tsconfig.json package-lock.json ./
COPY . ./
RUN rm -rf ./node_modules

ENV npm_config_target_arch=amd64
ENV npm_config_target_platform=linux
ENV npm_config_target_libc=glibc

RUN npm install
RUN npm run build

# Lambda Extension Image:
# ----------------------
FROM alpine:latest AS layer-copy

# ARG AWS_DEFAULT_REGION
# ARG AWS_ACCESS_KEY_ID
# ARG AWS_SECRET_ACCESS_KEY
# ARG AWS_SESSION_TOKEN

# ENV AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
# ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
# ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
# ENV AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN

RUN echo "$AWS_ACCESS_KEY_ID"
RUN echo "$AWS_DEFAULT_REGION"

RUN apk add aws-cli curl unzip

# Create directory for layer installation
RUN mkdir -p /opt

## Secrets lambda layer
# RUN curl $(aws lambda get-layer-version-by-arn --arn arn:aws:lambda:us-west-2:345057560386:layer:AWS-Parameters-and-Secrets-Lambda-Extension:17 --query 'Content.Location' --output text) --output layer_secrets.zip
# RUN unzip layer_secrets.zip -d /opt
# RUN rm layer_secrets.zip

# Builder image:
# --------------
# Compile TypeScript Lambda code to JS
FROM base AS builder
RUN yarn build

# Lambda Execution Image:
# -----------------------
# Start with a fresh Lambda runtime image and copy
# the built executable. Burn in the commit hash for
# version auditing.
FROM base AS dist

# RUN npm install -g sqlite3
WORKDIR ${LAMBDA_TASK_ROOT}

COPY --from=builder /usr/app/node_modules ./node_modules
COPY --from=builder /usr/app/package.json .
COPY --from=builder /usr/app/dist/* .
COPY --from=layer-copy /opt /opt

ARG GITHUB_COMMIT_HASH
ARG VERSION_NUMBER

ENV BUILD_ID=$GITHUB_COMMIT_HASH
ENV BUILD_VERSION=$VERSION_NUMBER
CMD [ "index.handler" ]

# Test Runner Image
# -----------------
FROM base AS test
ENV NODE_ENV=test
ENTRYPOINT [ "npm" ]
# Run unit tests by default
CMD [ "run", "test", "unit" ]
