PDFBackground = {
	id: null,
	version: null,
	rootURI: null,
	name: "Zotero PDF Background",
	initialized: false,

	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
		this.background_list = ["default", "daytime", "nighttime", "careeye", "parchment"];//背景颜色列表
	},

	log(msg) {
		Zotero.debug("zotero-pdf-bakcground: " + msg);
	},


	getPref(pref) {
		return Zotero.Prefs.get(`extensions.pdf-bakcground.${pref}`, true);
	},
	setPref(pref, value) {
		return Zotero.Prefs.set(`extensions.pdf-bakcground.${pref}`, value, true);
	},
	addToggleButton(browserWindow) {
		if (!!browserWindow.document.querySelector("#switch-toggle")) {
			log("addToggleButton: window already has toggle");
			return;
		}
		const defaultBackground = this.getPref("defaultBackground");//获得设置中背景颜色
		const style = browserWindow.document.createElement("style");
		style.setAttribute("type", "text/css");
		style.setAttribute("id", "toggle-button-style");
		style.innerHTML = `
		.toolbar #switch-toggle.background-color::before {
			content: "👁";
			font-size: 20px;
			border-radius: 3px;
			margin: -2px;
			display: inline-block;
			vertical-align: top;
			position: relative;
			z-index: 2;
		}
		.toolbar #background-selector{
			position:absolute;
			top:103%;
			background: var(--material-toolbar);
			border: var(--material-panedivider);
			border-radius: 5px;
			box-shadow: 0 0 0 1px rgba(0,0,0,.1),0 5px 10px rgba(0,0,0,.6);
			padding: 5px;
		}
		.toolbar #background-selector > li{
			list-style: none;
			line-height: 28px;
			border-radius: 5px;
			text-align: center;
			padding: 1px 13px;
		}
		@media (prefers-color-scheme: dark){
			.toolbar #background-selector > li{
				color:#ddd;
			}
		}
		
		.toolbar #background-selector > li:hover{
			background: var(--fill-quinary);
		}
		.toolbar #background-selector > li[select="true"]:before{
			content: "✓";
			position: absolute;
			margin-inline-start: -13px;
			height: 28px;
			display: flex;
			align-items: center;
		}
		`
		browserWindow.document.querySelector("head").appendChild(style);
		const toggle = browserWindow.document.createElement("button");
		toggle.setAttribute("id", "switch-toggle");
		toggle.setAttribute("title", "选择背景颜色");
		toggle.setAttribute("class", "toolbar-button toolbar-dropdown-button background-color");
		toggle.innerHTML = `
		<span class="button-background"></span>
		<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" fill="none">
			<path fill="currentColor" d="m0 2.707 4 4 4-4L7.293 2 4 5.293.707 2z"></path>
		</svg>`;
		toggle.onclick = () => {
			var selector = browserWindow.document.querySelector("#background-selector");
			if (selector.hasAttribute("style"))
				selector.removeAttribute("style")
			else
				selector.setAttribute("style", "display:none")
		};

		const selector = browserWindow.document.createElement("ul");
		selector.setAttribute("id", "background-selector");
		selector.setAttribute("style", "display:none");
		selector.innerHTML = `
		  <li value="default">默认</li>
		  <li value="daytime">日间</li>
		  <li value="nighttime">夜间</li>
		  <li value="careeye">护眼</li>
		  <li value="parchment">羊皮纸</li>
		`;
		selector.onclick = (e) => {
			this.backgroundSelectorOnClick(e, browserWindow);
		}
		const divider = browserWindow.document.createElement("div");
		divider.setAttribute("class", "divider")
		divider.setAttribute("id", "background-selector-divider")
		const middleToolbar = browserWindow.document.querySelector("#reader-ui .toolbar div.center");
		middleToolbar.insertBefore(divider, middleToolbar.firstChild);
		middleToolbar.insertBefore(selector, middleToolbar.firstChild);
		middleToolbar.insertBefore(toggle, middleToolbar.firstChild);
		log("success add toggle button")
	},
	backgroundSelectorOnClick(e, browserWindow) {
		if (e.target.nodeName.toLowerCase() == "li") {
			var bg = e.target.getAttribute("value");
		}
		this.setPref("defaultBackground", bg);
		for (let iframe of browserWindow.document.querySelectorAll("iframe[src='pdf/web/viewer.html']")) {
			var classList = iframe.contentWindow.document.querySelector("body").classList
			for (let cls of this.background_list) {
				classList.remove(cls)
			}
			classList.add(bg);
		}
		//设置按钮
		browserWindow.document.querySelector("#background-selector li[select='true']")?.removeAttribute("select");
		browserWindow.document.querySelector("#background-selector li[value=" + bg + "]").setAttribute("select", "true");
		browserWindow.document.querySelector("#background-selector").setAttribute("style", "display:none");
		return;
	},
	addWindowStyle(iframeWindow) {
		if (!!iframeWindow.document.querySelector("#pageBackground")) return
		debug("adding style for added window tab");
		const style = iframeWindow.document.createElement("style");
		style.setAttribute("type", "text/css");
		style.setAttribute("id", "pageBackground");
		style.innerHTML = `
		body.default #viewer.pdfViewer > .page > .textLayer{display:block;}
		body.daytime #viewer.pdfViewer > .page > .textLayer{display:block;background-color:rgb(225,225,225);}
		body.nighttime #viewer.pdfViewer > .page > .textLayer{display:block;background-color:rgb(5,9,5);}
		body.careeye #viewer.pdfViewer > .page > .textLayer{display:block;background-color:rgb(5,90,0);}
		body.parchment #viewer.pdfViewer > .page > .textLayer{display:block;background-color:rgb(95,60,0);}
		`
		const header = iframeWindow.document.querySelector("head");
		header.appendChild(style);
		var defaultBackground = this.getPref("defaultBackground");//获得设置中背景颜色
		if (defaultBackground == undefined) defaultBackground = "careeye";
		iframeWindow.document.querySelector("body").setAttribute("class", defaultBackground);
		log("success add window style")
	},
	addAllStyles() {
		log("add style to all open tabs")
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			var browsers = win.document.querySelectorAll("browser.reader")
			for (let bro of browsers) {
				var browserWindow = bro.contentWindow
				log(browserWindow.document.readyState)
				this.addToggleButton(browserWindow)
				for (let iframe of browserWindow.document.querySelectorAll("iframe[src='pdf/web/viewer.html']")) {
					this.addWindowStyle(iframe.contentWindow)
				}
				browserWindow.document.querySelector("#secondary-view").addEventListener('DOMNodeInserted', (e) => {
					log("secondary-view dom node inserted")
					const secondIframe = browserWindow.document.querySelector("#secondary-view iframe[src='pdf/web/viewer.html']")
					secondIframe.contentWindow.onload = () => {
						log("second iframeWindow loaded async, add style");
						this.addWindowStyle(secondIframe.contentWindow);
					}
				}, false);
			}
		}
	},
	removeAllStyle() {
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			var browsers = win.document.querySelectorAll("browser.reader")
			for (let bro of browsers) {
				bro.contentWindow.document.querySelector("#switch-toggle").remove()
				bro.contentWindow.document.querySelector("#toggle-button-style").remove()
				bro.contentWindow.document.querySelector("#background-selector").remove()
				bro.contentWindow.document.querySelector("#background-selector-divider").remove()
				for (let iframe of bro.contentDocument.querySelectorAll("iframe[src='pdf/web/viewer.html']")) {
					iframe.contentDocument.querySelector("body").removeAttribute("class");
				}
			}
		}
	},
	async main() {
		// Global properties are included automatically in Zotero 7
		var host = new URL('https://foo.com/path').host;
		this.log(`Host is ${host}`);

		// Retrieve a global pref
		this.log(`defaultBackground is ${Zotero.Prefs.get('extensions.zotero-pdf-bakcground.defaultBackground', "eyecare")}`);
		setTimeout(() => {
			this.addAllStyles();
		}, 1000);
		// regist tab add listener
		const notifierCallback = {
			notify: async (event, type, ids, extraData) => {
				// log("tab " + event + extraData[ids[0]])
				if ((event == "load" || event == "add") && type == "tab" && extraData[ids[0]].type == "reader") {
					log(`Tab with id ${ids[0]} ${event}`);
					const reader = Zotero.Reader.getByTabID(ids[0]);
					await reader._initPromise;
					const browserWindow = reader._iframeWindow
					const iframes = browserWindow.document.querySelectorAll("iframe[src='pdf/web/viewer.html']")
					for (let iframe of iframes) {
						const iframeWindow = iframe.contentWindow
						iframeWindow.onload = () => {
							log(`uninitialized tab window readystate is ${iframeWindow.document.readyState}`);
							log("iframeWindow load complete async");
							this.addToggleButton(browserWindow);
							this.addWindowStyle(iframeWindow);
						}
					}
					browserWindow.document.querySelector("#secondary-view").addEventListener('DOMNodeInserted', (e) => {
						log("secondary-view dom node inserted")
						const secondIframe = browserWindow.document.querySelector("#secondary-view iframe[src='pdf/web/viewer.html']")
						secondIframe.contentWindow.onload = () => {
							log("second iframeWindow loaded async, add style");
							this.addWindowStyle(secondIframe.contentWindow);
						}
					}, false);
				}
			}
		};
		Zotero.Notifier.registerObserver(notifierCallback, ["tab"]);
	},
};
