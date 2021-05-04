const { app, BrowserWindow, protocol, nativeTheme } = require('electron');
const path = require('path');
const url = require('url')
const fs = require('fs')
const { Notification } = require('electron')

function showNotification (msg) {
  const notification = {
    title: 'Toolback Electron App Warning',
    body: msg
  }
  new Notification(notification).show()
}


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1800,
    height: 900,
  });

  // and load the index.html of the app.
  // mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.loadURL(url.format({
    pathname: 'index.html',    /* Attention here: origin is path.join(__dirname, 'index.html') */
    protocol: 'file',
    slashes: true
  }))

  // nativeTheme.themeSource = 'light'
  nativeTheme.themeSource = 'dark'

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

function getPathFromUrl(some_url) {
  return some_url.split("?")[0];
}

app.on('ready', () => {

  /*
  Convert any forgotten localhost http refs to minio etc. into local file refs
  (ideally should eliminate these during export)

  These include
    http://127.0.0.1:5000/static/js-vendor/jquery-ui-1.12.1.user/jquery-ui.min.js
    http://127.0.0.1:5000/static/js-vendor/jquery-ui-1.12.1.user/images/ui-icons_ffffff_256x240.png
  which are analysed using 'url' library and changed to point to local static/ version
    --> /private/var/folders/ts/rf0k43gs789_nv29g30m8ynh0000gn/T/tb_publishing/out/my-app/src/static/js-vendor/jquery-ui-1.12.1.user/jquery-ui.min.js

    http://localhost:9000/andy.toolbackfs.devel/storage/org/user1/projects/project1/pages/McAdams-Forsythe.js
  which are analysed using 'path' library and changed to point to local version
    --> /private/var/folders/ts/rf0k43gs789_nv29g30m8ynh0000gn/T/tb_publishing/out/my-app/src/meta.js

  These urls look absolute but they will adapt to any location the electron executable is run from.
  */
  protocol.interceptFileProtocol('http', (request, callback) => {
    console.log(`** intercepted ${request.url}`)
    if (request.url.startsWith("http://localhost") ||
        request.url.startsWith("http://127.0.0.1") ||
        request.url.startsWith("http://s3-ap-southeast-2.amazonaws.com") ||
        request.url.startsWith("https://s3-ap-southeast-2.amazonaws.com")
    ) {

      const reqUrl = new URL(request.url);  // like the 'path' library but the 'url' library  is for urls. Great doco too https://nodejs.org/api/url.html
      // console.log(reqUrl);

      let basename = (reqUrl.pathname.includes('toolbackfs')) ? path.basename(request.url) : reqUrl.pathname
      let newurl = path.normalize(`${__dirname}/${basename}`)  // fixes .. and /// etc.
      console.log(`  url converted info '${newurl}'`)
      callback({ path: newurl })
    }
    else {
      console.log(`  LEFT URL ALONE ${request.url}`)
      callback(request.url)
    }
  })

  /*
   Convert server refs to e.g. /static which in electron are treated as file references to
   root / into local dir refs
   e.g. /static/storage/projects/project1.css intercepted, converted to
   /tmp/whatever/out/my-app/src/static/storage/projects/project1.css
   full request.url was file:///static/storage/projects/project1.css
  */
  protocol.interceptFileProtocol('file', (request, callback) => {

    // all request.url start with 'file://' e.g. file:///static/storage/pages/McAdams-Forsythe.css
    const url2 = request.url.substr(7)

    let newurl = path.normalize(`${__dirname}/${url2}`)
    newurl = getPathFromUrl(newurl)
    // console.log(url, 'intercepted, converted to', newurl, 'full request.url was', request.url)
    console.log(url2, 'intercepted')

    // interestingly url navigation refs like page_id would normally go to /page/page_id on the
    // server, and the server would know what to do. without a server we need to convert
    // page_id into page_id.html - but how do we know its a navigation request in order to do
    // it? maybe if no extension then do it? yes. BUT what if we get a name like Houston-Ph.D
    // then the extension will be '.D' so ALSO check if extension is not the usual 'html',
    // 'css', etc

    const ext = getPathFromUrl(newurl).split('.').pop()

    if (!ext || !['html', 'css', 'js', 'png', 'jpg', 'jpeg'].includes(ext)) {
      console.log('  No or unknown extension on', newurl, 'so adding .html')  // newurl
      newurl = newurl + '.html'
      // console.log(newurl)
      if (!fs.existsSync(newurl)) {
        const msg = `  -> prevented navigation to non-existent file '${newurl}', possibly wasn't included in the project?`
        console.log(msg)
        showNotification(msg)
        return; // prevent navigation
      }
    }
    
    callback({ path: newurl })
  })

  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  app.quit();
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
