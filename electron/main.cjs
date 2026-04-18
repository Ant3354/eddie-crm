/**
 * Eddie CRM — Electron shell
 * - Dev: opens the UI only (run `npm run dev` separately on port 3001).
 * - Packaged: starts the Next.js standalone server in-process-as-Node, then opens the window.
 */
const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { spawn } = require('child_process')

const PORT = process.env.EDDIE_PORT || '3001'
const UI_ORIGIN = `http://127.0.0.1:${PORT}`

let mainWindow = null
let serverProcess = null

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf8')
  const out = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

/** Fill placeholders so a clean PC can run without Postgres (SQLite file next to the server bundle). */
function applyPackagedEnvDefaults(envPath) {
  let content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split(/\r?\n/)
  const out = []
  let sawDb = false
  let sawJwt = false
  for (const line of lines) {
    if (line.startsWith('DATABASE_URL=')) {
      sawDb = true
      const val = line.slice('DATABASE_URL='.length).trim()
      const needsSqlite =
        !val ||
        val.includes('USER:PASSWORD') ||
        val.includes('/DATABASE?') ||
        /^postgresql:\/\/(USER|REPLACE)/i.test(val)
      if (needsSqlite) {
        out.push('DATABASE_URL=file:./prisma/dev.db')
      } else {
        out.push(line)
      }
      continue
    }
    if (line.startsWith('JWT_SECRET=')) {
      sawJwt = true
      const val = line.slice('JWT_SECRET='.length).trim()
      const needsJwt =
        !val ||
        val.length < 16 ||
        /change-me|replace-with/i.test(val)
      if (needsJwt) {
        out.push(`JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`)
      } else {
        out.push(line)
      }
      continue
    }
    out.push(line)
  }
  if (!sawDb) out.push('DATABASE_URL=file:./prisma/dev.db')
  if (!sawJwt) out.push(`JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`)
  const next = out.join('\n')
  if (next !== content) fs.writeFileSync(envPath, next + (next.endsWith('\n') ? '' : '\n'), 'utf8')
}

function ensureUserEnv() {
  const userData = app.getPath('userData')
  const envPath = path.join(userData, '.env')
  const templatePath = path.join(process.resourcesPath, 'env.template')
  let isNew = false
  if (!fs.existsSync(envPath)) {
    isNew = true
    fs.mkdirSync(userData, { recursive: true })
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, envPath)
    } else {
      fs.writeFileSync(
        envPath,
        [
          'DATABASE_URL=file:./prisma/dev.db',
          `JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`,
          `NEXT_PUBLIC_APP_URL=${UI_ORIGIN}`,
          '',
        ].join('\n'),
        'utf8'
      )
    }
  }
  applyPackagedEnvDefaults(envPath)
  if (isNew) {
    dialog.showMessageBox({
      type: 'info',
      title: 'Eddie CRM — first run',
      message: 'Ready to use',
      detail: `Local settings (database + secret) were created at:\n\n${envPath}\n\nYou can edit this file later if you switch to PostgreSQL or change the app URL.`,
    })
  }
  return { envPath, isNew: false }
}

function getStandaloneDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'standalone')
  }
  return path.join(__dirname, '..', '.next', 'standalone')
}

function startPackagedServer() {
  const standaloneDir = getStandaloneDir()
  const serverJs = path.join(standaloneDir, 'server.js')
  if (!fs.existsSync(serverJs)) {
    dialog.showErrorBox(
      'Eddie CRM',
      `Server bundle not found:\n${serverJs}\n\nRe-install the application or run npm run build:desktop from the project.`
    )
    app.quit()
    return false
  }

  const { envPath: userEnvPath } = ensureUserEnv()

  const userEnv = parseEnvFile(userEnvPath)
  const db = userEnv.DATABASE_URL || ''
  const jwt = userEnv.JWT_SECRET || ''
  const isSqlite = /^file:/i.test(db)
  const dbInvalid =
    !db ||
    (!isSqlite && (db.includes('USER:PASSWORD') || db.includes('/DATABASE?')))
  const jwtInvalid =
    !jwt ||
    jwt.length < 16 ||
    /change-me|replace-with/i.test(jwt)
  if (dbInvalid || jwtInvalid) {
    dialog.showErrorBox(
      'Eddie CRM — configuration',
      `Please set DATABASE_URL and JWT_SECRET in:\n\n${userEnvPath}\n\nFor PostgreSQL, use a full connection string. For local SQLite, use:\nDATABASE_URL=file:./prisma/dev.db\n\nJWT_SECRET must be at least 16 random characters.`
    )
    app.quit()
    return false
  }

  const destEnv = path.join(standaloneDir, '.env')
  try {
    if (fs.existsSync(userEnvPath)) {
      fs.copyFileSync(userEnvPath, destEnv)
    }
  } catch (e) {
    console.error(e)
  }

  const mergedEnv = {
    ...process.env,
    ...userEnv,
    NODE_ENV: 'production',
    PORT,
    HOSTNAME: '0.0.0.0',
    ELECTRON_RUN_AS_NODE: '1',
  }

  serverProcess = spawn(process.execPath, [serverJs], {
    cwd: standaloneDir,
    env: mergedEnv,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const log = (buf, label) => {
    const s = buf.toString()
    if (s.trim()) console.log(`[next ${label}]`, s.trim())
  }
  serverProcess.stdout.on('data', (d) => log(d, 'out'))
  serverProcess.stderr.on('data', (d) => log(d, 'err'))

  serverProcess.on('exit', (code) => {
    serverProcess = null
    if (code && code !== 0 && !app.isQuitting) {
      dialog.showErrorBox(
        'Eddie CRM — server stopped',
        `The web server exited (code ${code}).\nCheck DATABASE_URL and JWT_SECRET in:\n${userEnvPath}`
      )
    }
  })
  return true
}

function waitForServer(timeoutMs = 90000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      fetch(`${UI_ORIGIN}/dashboard`)
        .then(() => resolve(true))
        .catch(() => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error('Server did not become ready in time.'))
            return
          }
          setTimeout(tick, 400)
        })
    }
    tick()
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.loadURL(`${UI_ORIGIN}/dashboard`)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function ready() {
  const gotLock = app.requestSingleInstanceLock()
  if (!gotLock) {
    app.quit()
    return
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  if (app.isPackaged) {
    const started = startPackagedServer()
    if (!started) return
    try {
      await waitForServer()
    } catch (e) {
      dialog.showErrorBox(
        'Eddie CRM',
        `${e.message}\n\nIf this is the first run, edit your .env file (see previous dialog), then open Eddie CRM again.`
      )
      app.quit()
      return
    }
  }

  createWindow()
}

app.isQuitting = false
app.whenReady().then(ready)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  app.isQuitting = true
  if (serverProcess) {
    try {
      serverProcess.kill()
    } catch (_) {}
    serverProcess = null
  }
})
