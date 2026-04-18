/**
 * electron-builder config (full merge so --config does not drop package.json fields).
 * Optional local Electron: ELECTRON_DIST, Downloads path, or node_modules/electron/dist
 */
const fs = require('fs')
const path = require('path')
const pkg = require('./package.json')

function findElectronDist() {
  const candidates = [
    process.env.ELECTRON_DIST,
    path.join(__dirname, 'node_modules', 'electron', 'dist'),
  ]
  for (const dir of candidates) {
    if (!dir) continue
    const exe = path.join(dir, 'electron.exe')
    if (fs.existsSync(exe)) return path.normalize(dir)
  }
  return undefined
}

const electronDist = findElectronDist()
const base = { ...pkg.build }
if (electronDist) base.electronDist = electronDist

module.exports = base
