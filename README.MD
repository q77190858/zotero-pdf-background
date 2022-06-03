# Zotero PDF Background Plugin

![](example1.png)

Install by downloading the [latest version](https://github.com/q77190858/zotero-pdf-background/releases/latest)

## Feature

* a green pdf background to care your eyes
* a button like a eye on the middle toolbar to switch green mode and original mode

## Todo

* add more background theme
* beautify button style

## Contribution

follow these steps to build a zotero debug environment

- [ ] Download Zotero 60 (I use a portable edition)
- [ ] Git clone
- [ ] Download and launch [zotero dev edition]([dev builds [Zotero Documentation\]](https://www.zotero.org/support/dev_builds)) with --debugger
- [ ] Launch Firefox 60
- [ ] In Firefox, go to devtools, go to settings, click *'Enable browser chrome and add-on debugging toolboxes'* and *'Enable remote debugging'*.
- [ ] In Zotero, go to setting, advanced, config editor, look up "devtools" and set true on "devtools.debugger.remote-enabled" and set "devtools.debugger.remote-port" 6100
- [ ] In Firefox, click the hamburger menu in the top right -> web developer -> Connect...
- [ ] Enter localhost:6100
- [ ] Connect
- [ ] Click "Inspect Main Process"