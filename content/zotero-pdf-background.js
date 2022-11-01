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
      this.background_list=["default","daytime","nighttime","careeye","parchment"];//背景颜色列表
      this.setPref("defaultBackground",this.background_list[3]);//预先写入配置
    }
    getPref(pref) {
      return Zotero.Prefs.get(`extensions.pdf-bakcground.${pref}`, true);
    }
    setPref(pref, value) {
      return Zotero.Prefs.set(`extensions.pdf-bakcground.${pref}`, value, true);
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
      const defaultBackground = this.getPref("defaultBackground");//获得设置中背景颜色
      const toggle = readerWindow.document.createElement("button");
      toggle.setAttribute("id", "switch-toggle");
      toggle.setAttribute("title", "选择背景颜色");
      toggle.setAttribute("class","toolbarButton background-color");
      toggle.innerHTML=`<span class="button-background"></span><span class="dropmarker"></span>`;
      toggle.onclick = () => {
        var selector=readerWindow.document.querySelector("#background-selector");
        if(selector.hasAttribute("class"))
          selector.removeAttribute("class")
        else
          selector.setAttribute("class","hidden")
      };
      const middleToolbar = readerWindow.document.querySelector("#toolbarViewerMiddle");
      middleToolbar.appendChild(toggle);

      const selector = readerWindow.document.createElement("ul");
      selector.setAttribute("id", "background-selector");
      selector.setAttribute("class", "hidden");
      selector.innerHTML=`
        <li value="default">默认</li>
        <li value="daytime">日间</li>
        <li value="nighttime">夜间</li>
        <li value="careeye">护眼</li>
        <li value="parchment">羊皮纸</li>
      `;
      selector.onclick = (e) => {
        this.backgroundSelectorOnClick(e,readerWindow);
      }
      middleToolbar.appendChild(selector);
    }
    hasToggle(readerWindow) {
      return !!readerWindow.document.querySelector("#switch-toggle");
    }
    backgroundSelectorOnClick(e,readerWindow) {
      if(e.target.nodeName.toLowerCase()=="li"){
        var bg=e.target.getAttribute("value");
      }
      this.setPref("defaultBackground",bg);
      readerWindow.document.querySelector("body").setAttribute("class",bg);
      //设置按钮
      readerWindow.document.querySelector("#background-selector li[select='true']").removeAttribute("select");
      readerWindow.document.querySelector("#background-selector li[value="+bg+"]").setAttribute("select","true");
      readerWindow.document.querySelector("#background-selector").setAttribute("class","hidden");
      return;
    }
    addWindowStyle(readerWindow){
      debug("adding style for added window tab");
      const style = readerWindow.document.createElement("link");
      style.setAttribute("type", "text/css");
      style.setAttribute("rel", "stylesheet");
      style.setAttribute("id", "pageBackground");
      style.setAttribute("href", "chrome://zotero-pdf-background/skin/pdf-background.css");
      const header = readerWindow.document.querySelector("head");
      header.appendChild(style);
      var defaultBackground = this.getPref("defaultBackground");//获得设置中背景颜色
      if(defaultBackground==undefined)defaultBackground="careeye";
      readerWindow.document.querySelector("body").setAttribute("class",defaultBackground);
      //设置按钮
      var ele;
      if(ele=readerWindow.document.querySelector("#background-selector li[select='true']"))ele.removeAttribute("select");
      readerWindow.document.querySelector("#background-selector li[value="+defaultBackground+"]").setAttribute("select","true");
    }
    hasWindowStyle(readerWindow) {
      return !!readerWindow.document.querySelector("#pageBackground");
    }
    addAllStyles() {
      let counter = 0;
      let win = window[counter];
      while (win) {
        if (win.document.URL.includes("viewer.html")) {
          this.addToggleButton(win);
          this.addWindowStyle(win)
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
          win.document.querySelector("#switch-toggle").remove();
          win.document.querySelector("#pageBackground").remove();
          win.document.querySelector("body").removeAttribute("class");
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
                this.addToggleButton(tabWindow);
                this.addWindowStyle(tabWindow)
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
