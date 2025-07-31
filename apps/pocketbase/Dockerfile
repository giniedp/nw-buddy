FROM alpine:latest

ARG PB_VERSION=0.29.0

RUN apk add --no-cache unzip ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 3000

# start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:3000"]

# Usage:
#   pocketbase.exe [command]
#
# Available Commands:
#   migrate     Executes app DB migration scripts
#   serve       Starts the web server (default to 127.0.0.1:8090 if no domain is specified)
#   superuser   Manage superusers
#   update      Automatically updates the current app executable with the latest available version
#
# Flags:
#       --automigrate            enable/disable auto migrations (default true)
#       --dev                    enable dev mode, aka. printing logs and sql statements to the console
#       --dir string             the PocketBase data directory (default "E:\\nw-buddy.worktrees\\playground\\apps\\pocketbase\\pb_data")
#       --encryptionEnv string   the env variable whose value of 32 characters will be used
#                                  as encryption key for the app settings (default none)
#   -h, --help                   help for pocketbase.exe
#       --hooksDir string        the directory with the JS app hooks
#       --hooksPool int          the total prewarm goja.Runtime instances for the JS app hooks execution (default 15)
#       --hooksWatch             auto restart the app on pb_hooks file change (default true)
#       --indexFallback          fallback the request to index.html on missing static path (eg. when pretty urls are used with SPA) (default true)
#       --migrationsDir string   the directory with the user defined migrations
#       --publicDir string       the directory to serve static files (default "E:\\nw-buddy.worktrees\\playground\\apps\\pocketbase\\pb_public")
#       --queryTimeout int       the default SELECT queries timeout in seconds (default 30)
#   -v, --version                version for pocketbase.exe
