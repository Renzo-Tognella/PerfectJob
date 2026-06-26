




set -e


if ! command -v tectonic >/dev/null 2>&1; then
  echo "Installing tectonic inside container..."
  ARCH=$(uname -m)
  if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    TECTONIC_ASSET="tectonic-0.16.9-aarch64-unknown-linux-musl.tar.gz"
  else
    TECTONIC_ASSET="tectonic-0.16.9-x86_64-unknown-linux-gnu.tar.gz"
  fi
  curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@0.16.9/${TECTONIC_ASSET}" \
    | tar -xz -C /tmp
  mv /tmp/tectonic /usr/local/bin/tectonic
  chmod +x /usr/local/bin/tectonic
  echo "  tectonic installed: $(/usr/local/bin/tectonic --version)"
fi

mkdir -p /app/data/resumes
exec mvn -q -Dmaven.test.skip=true spring-boot:run
