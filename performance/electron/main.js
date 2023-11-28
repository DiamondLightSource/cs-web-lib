const { app, BrowserWindow } = require('electron')

const nPages=1

const createWindow = (url) => {
    const win = new BrowserWindow({
        width: 1400,
        height: 800
    })

    win.loadURL(url)
    }

app.whenReady().then(() => {
    createWindow("http://localhost:3000/performancePage")
    for (let i = 1; i < nPages; i++) {
        createWindow("http://localhost:3000/performancePage"+i)
    }
})

app.on('window-all-closed', () => {
    app.quit()
  })
