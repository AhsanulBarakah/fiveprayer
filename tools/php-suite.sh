#!/usr/bin/env bash
#
# Runs tests/php/ without wp-cli.
#
# The suites bootstrap a real WordPress (they call wp-load.php and exercise the
# REST and capability layers), so this script installs one with plain PHP and
# the fixtures in tests/php/fixtures/, then runs both suites:
#
#   ./tools/php-suite.sh                 # downloads WordPress 6.7 once
#   FIVEPRAYER_WP_DIR=/tmp/wp ./tools/php-suite.sh
#
# Environment:
#   FIVEPRAYER_WP_VERSION   WordPress version to download (default 6.7)
#   FIVEPRAYER_WP_DIR       where to install it (default .freebuff/wp)
#   FIVEPRAYER_DB_NAME      default fiveprayer_test
#   FIVEPRAYER_DB_USER      default root
#   FIVEPRAYER_DB_PASSWORD  default root
#   FIVEPRAYER_DB_HOST      default 127.0.0.1
#   FIVEPRAYER_DB_PORT      default 3306
#   FIVEPRAYER_SKIP_SUITES  set to 1 to install WordPress and stop (PHPUnit path)
#
# The database itself must exist (the script does not create it), and the
# plugin's autoloader is generated with Composer when it is available.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WP_VERSION="${FIVEPRAYER_WP_VERSION:-6.7}"
WP_DIR="${FIVEPRAYER_WP_DIR:-$ROOT/.freebuff/wp}"
PLUGIN_DIR="$WP_DIR/wp-content/plugins/fiveprayer"
# The tarball is cached separately from the install so CI can keep it between
# runs (the installed tree is disposable and carries state we do not want).
CACHE_DIR="${FIVEPRAYER_WP_CACHE:-$HOME/.wp-cache}"
TARBALL="$CACHE_DIR/wordpress-$WP_VERSION.tar.gz"

step() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }

if [ ! -f "$WP_DIR/wp-load.php" ]; then
  mkdir -p "$WP_DIR"
  if [ ! -f "$TARBALL" ]; then
    step "Downloading WordPress $WP_VERSION"
    mkdir -p "$CACHE_DIR"
    curl -fsSL "https://wordpress.org/wordpress-$WP_VERSION.tar.gz" -o "$TARBALL"
  else
    step "Using cached WordPress $WP_VERSION"
  fi
  tar -xzf "$TARBALL" -C "$WP_DIR" --strip-components=1
else
  step "Reusing WordPress in $WP_DIR"
fi

step "Installing WordPress"
cp "$ROOT/tests/php/fixtures/wp-config.php" "$WP_DIR/wp-config.php"
cp "$ROOT/tests/php/fixtures/install-wordpress.php" "$WP_DIR/install-wordpress.php"
cp "$ROOT/tests/php/fixtures/activate-plugin.php" "$WP_DIR/activate-plugin.php"
php "$WP_DIR/install-wordpress.php"

step "Copying the plugin"
rm -rf "$PLUGIN_DIR"
mkdir -p "$PLUGIN_DIR"
# tar rather than rsync: bsdtar ships with Git Bash on Windows too.
tar -C "$ROOT" \
  --exclude=.git --exclude=node_modules --exclude=vendor --exclude=.freebuff \
  -cf - . | tar -C "$PLUGIN_DIR" -xf -

if command -v composer > /dev/null 2>&1; then
  step "Generating the plugin autoloader"
  # --no-dev: the installed copy only needs its autoloader at runtime, and the
  # static-analysis tooling is not part of what WordPress loads.
  #
  # The suffix is set here, in the copy, so it differs from this repository's
  # own install: Composer derives the ComposerAutoloaderInit<hash> class name
  # from the package, and PHPUnit loads the repository autoloader before
  # WordPress loads the installed plugin — identical names fatal with "cannot
  # declare class ... already in use".
  (cd "$PLUGIN_DIR" && composer config --no-plugins autoloader-suffix FivePrayerInstalled \
    && composer install --no-dev --no-interaction --no-progress --quiet)
else
  echo "composer not found — vendor/autoload.php must already exist in the plugin."
fi

step "Activating FivePrayer"
php "$WP_DIR/activate-plugin.php"

# PHPUnit (`.github/workflows/tests.yml`) needs the same installed WordPress but
# brings its own assertions, so it installs and then stops here.
if [ "${FIVEPRAYER_SKIP_SUITES:-0}" = "1" ]; then
  printf '\n\033[32mWordPress installed and plugin activated; suites skipped.\033[0m\n'
  exit 0
fi

step "Security hardening checks"
php "$PLUGIN_DIR/tests/php/test-security-hardening.php"

step "CSS scoping checks"
php "$PLUGIN_DIR/tests/php/test-css-scoping.php"

step "Timetable month checks"
php "$PLUGIN_DIR/tests/php/test-timetable-month.php"

printf '\n\033[32mPHP suites passed.\033[0m\n'
