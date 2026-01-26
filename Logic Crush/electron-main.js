const {app, BrowserWindow} = require('electron')
const path = require('path')

function createWindow(){
  const win = new BrowserWindow({
    width: 560,
    height: 760,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  win.removeMenu();
  win.loadFile(path.join(__dirname,'index.html'))
}

app.whenReady().then(createWindow)
app.on('window-all-closed', ()=>{ if(process.platform!=='darwin') app.quit(); })
