var PDFBackground;

function log(msg) {
	Zotero.debug("zotero-pdf-bakcground: " + msg);
}

function install() {
	log("plugin Installed");
}

async function startup({ id, version, rootURI }) {
	log("plugin start up");
	
	Zotero.PreferencePanes.register({
		pluginID: 'zotero-pdf-background@example.com',
		src: rootURI + 'preferences/preferences.xhtml',
		// scripts: [rootURI + 'preferences/preferences.js'],
		stylesheets: [rootURI + "preferences/preferences.css"],
		image: rootURI +'imgs/icon.png'
	});
	
	Services.scriptloader.loadSubScript(rootURI + 'zotero-pdf-bakcground.js');
	PDFBackground.init({ id, version, rootURI });
	await PDFBackground.main();
}

function onMainWindowLoad({ window }) {
	log("Zotero main window load")
}

function onMainWindowUnload({ window }) {
	log("Zotero main window unload")
}

function shutdown() {
	log("plugin Shutting down");
	PDFBackground?.removeAllStyle();
	PDFBackground = undefined;
}

function uninstall() {
	log("plugin Uninstalled");
	PDFBackground?.removeAllStyle();
}
