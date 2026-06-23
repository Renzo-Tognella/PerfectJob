#!/bin/bash
# Detecta arch + instala o binario tectonic estatico em ~/.local/bin/tectonic.
# Funciona em macOS (aarch64-apple-darwin / x86_64-apple-darwin) e Linux
# (aarch64-unknown-linux-musl / x86_64-unknown-linux-gnu).
#
# Uso: ./scripts/install-tectonic.sh
set -e

VERSION="0.16.9"
ASSET_BASE="https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@${VERSION}"
INSTALL_DIR="${HOME}/.local/bin"
TECTONIC="${INSTALL_DIR}/tectonic"

mkdir -p "${INSTALL_DIR}"

# Se ja existe e roda, nao faz nada.
if [ -x "${TECTONIC}" ] && "${TECTONIC}" --version >/dev/null 2>&1; then
  echo "tectonic ja instalado em ${TECTONIC} ($(${TECTONIC} --version))"
  exit 0
fi

# Detecta arch
OS=$(uname -s)
ARCH=$(uname -m)

case "${OS}-${ARCH}" in
  Darwin-arm64|Darwin-aarch64)
    ASSET="tectonic-${VERSION}-aarch64-apple-darwin.tar.gz" ;;
  Darwin-x86_64)
    ASSET="tectonic-${VERSION}-x86_64-apple-darwin.tar.gz" ;;
  Linux-aarch64|Linux-arm64)
    ASSET="tectonic-${VERSION}-aarch64-unknown-linux-musl.tar.gz" ;;
  Linux-x86_64)
    ASSET="tectonic-${VERSION}-x86_64-unknown-linux-gnu.tar.gz" ;;
  *)
    echo "ERRO: arch nao suportada: ${OS}-${ARCH}" >&2
    exit 1 ;;
esac

echo "Baixando tectonic (${ASSET})..."
TMP=$(mktemp -d)
curl -fsSL "${ASSET_BASE}/${ASSET}" -o "${TMP}/${ASSET}"
tar -xzf "${TMP}/${ASSET}" -C "${TMP}"
mv "${TMP}/tectonic" "${TECTONIC}"
chmod +x "${TECTONIC}"
rm -rf "${TMP}"

echo "tectonic instalado em ${TECTONIC} ($(${TECTONIC} --version))"
echo "Adicione ${INSTALL_DIR} ao PATH se ainda nao estiver."
