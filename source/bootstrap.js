var ZoteroWordToAnkiPrefPaneID;

function install() {}

async function startup({ id, version, rootURI }) {
	await Zotero.uiReadyPromise;

	Services.scriptloader.loadSubScript(rootURI + "word-to-anki.js");

	ZoteroWordToAnkiPrefPaneID = await Zotero.PreferencePanes.register({
		pluginID: id,
		id: "zotero-prefpane-word-to-anki",
		label: "zotero_anki_etymology",
		src: rootURI + "preferences.xhtml",
		scripts: [rootURI + "preferences.js"],
	});

	ZoteroWordToAnki.init({
		id,
		version,
		rootURI,
		prefPaneID: ZoteroWordToAnkiPrefPaneID,
	});
	await ZoteroWordToAnki.startup();
}

function shutdown() {
	try {
		ZoteroWordToAnki?.shutdown();
	}
	catch (e) {
		Zotero.logError(e);
	}

	if (ZoteroWordToAnkiPrefPaneID) {
		Zotero.PreferencePanes.unregister(ZoteroWordToAnkiPrefPaneID);
		ZoteroWordToAnkiPrefPaneID = null;
	}
}

function uninstall() {}
