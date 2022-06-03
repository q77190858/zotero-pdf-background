(() => {

  function to_s(obj) {
    if (typeof obj === "string")
      return obj;
    const s = `${obj}`;
    switch (s) {
      case "[object Object]":
        return JSON.stringify(obj);
      case "[object Set]":
        return JSON.stringify(Array.from(obj));
      default:
        return s;
    }
  }
  function format(...msg) {
    return `Pdf-background: ${msg.map(to_s).join(" ")}`;
  }
  function debug(...msg) {
    Zotero.debug(format(msg));
  }


  var pdf_background = class {
    constructor() {
    }
    addEventListener(type, listener, priority) {
      this._eventListeners.push({ priority: priority != null ? priority : 10, listener, type });
      this._eventListeners.sort((obj1, obj2) => obj1.priority - obj2.priority);
    }
    addToggleButton(readerWindow) {
      if (this.hasToggle(readerWindow)) {
        debug("addToggleButton: window already has toggle");
        return;
      }
      const toggle = readerWindow.document.createElement("button");
      toggle.setAttribute("id", "switch-toggle");
      const icon = "\u{1F441}";
      toggle.textContent = icon;
      toggle.setAttribute("style", "filter:none !important; height: 20px; width: 20px");
      toggle.onclick = () => {
        this.toggleOnClick(readerWindow);
      };
      const middleToolbar = readerWindow.document.querySelector("#toolbarViewerMiddle");
      middleToolbar.appendChild(toggle);
    }
    hasToggle(readerWindow) {
      return !!readerWindow.document.querySelector("#switch-toggle");
    }
    addPageStyle(readerWindow){
      const doc = readerWindow.document;
      debug("adding style for added window tab");
      const style = doc.createElement("style");
      style.setAttribute("type", "text/css");
      style.setAttribute("id", "pageStyle");
      style.textContent = "#viewer.pdfViewer > .page > .textLayer{display:block;background-color:rgba(155,189,133,0.5);}";
      const header = doc.querySelector("head");
      header.appendChild(style);
    }
    hasPageStyle(readerWindow) {
      return !!readerWindow.document.querySelector("#pageStyle");
    }
    toggleOnClick(readerWindow) {
      if (this.hasPageStyle(readerWindow)) {
        readerWindow.document.querySelector("#pageStyle").remove();
      }else{
        this.addPageStyle(readerWindow)
      }
      return;
    }
    addAllStyles() {
      let counter = 0;
      let win = window[counter];
      while (win) {
        if (win.document.URL.includes("viewer.html")) {
          this.addPageStyle(win)
          this.addToggleButton(win);
        }
        counter++;
        win = window[counter];
      }
    }
    removeAllStyle() {
      let counter = 0;
      let win = window[counter];
      while (win) {
        if (win.document.URL.includes("viewer.html")) {
          win.document.querySelector("#pageStyle").remove();
        }
        counter++;
        win = window[counter];
      }
    }
    getTabWindowById(id) {
      const tabIndex = Zotero_Tabs._tabs.findIndex((tab) => tab.id === id);
      debug(`Select tab event tabindex: ${tabIndex}`);
      if (tabIndex === -1)
        return null;
      const activeTabWindow = window[1 + tabIndex];
      return activeTabWindow;
    }
    getTabNameById(id) {
      var _a, _b;
      const name = (_b = (_a = Zotero_Tabs._tabs.find((tab) => tab.id === id)) == null ? void 0 : _a.title) != null ? _b : "Not found";
      return name;
    }
    async load(globals) {
      this.globals = globals;
      const notifierCallback = {
        notify: async (event, type, ids, extraData) => {
          if (event === "add") {
            debug(`Tab with id ${ids[0]} added`);
            debug("finding browser tab");
            debug("Trying to find window");
            const reader = Zotero.Reader.getByTabID(ids[0]);
            await reader._initPromise;
            const tabWindow = reader._iframeWindow;
            debug(tabWindow);
            debug(`Added tab "${this.getTabNameById(ids[0])}"`);
            debug(`Added tab window readystate is ${tabWindow.document.readyState}`);
            switch (tabWindow.document.readyState) {
              case "uninitialized": {
                setTimeout(() => {
                  tabWindow.document.onreadystatechange = () => debug("in readystatechange eventlistener:");
                  debug(`Added tab windw readystate is ${tabWindow.document.readyState}`);
                  this.addPageStyle(tabWindow)
                  this.addToggleButton(tabWindow);
                  return;
                }, 300);
              }
              case "complete": {
                this.addPageStyle(tabWindow)
                this.addToggleButton(tabWindow);
              }
            }
          }
        }
      };
      Zotero.Notifier.registerObserver(notifierCallback, ["tab"]);
      this.strings = globals.document.getElementById("zotero-pdf-background-strings");
    }
  };
  Zotero.pdf_background = new pdf_background();
})();
