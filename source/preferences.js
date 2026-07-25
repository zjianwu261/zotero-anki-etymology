"use strict";

const WTA_PREF_BRANCH = "extensions.zotero-word-to-anki";

var Zotero_WordToAnki_Prefs = {
	_bound: false,

	async init() {
		this._cacheElements();
		this._fillForm();
		this._bindEvents();
		await this.refreshDecks({ silent: true });
	},

	_cacheElements() {
		this.elements = {
			apiKey: document.getElementById("wta-api-key"),
			apiKeyToggle: document.getElementById("wta-toggle-api-key"),
			model: document.getElementById("wta-model"),
			deck: document.getElementById("wta-deck"),
			deckList: document.getElementById("wta-deck-list"),
			refreshDecks: document.getElementById("wta-refresh-decks"),
			enableAudio: document.getElementById("wta-enable-audio"),
			allowDuplicate: document.getElementById("wta-allow-duplicate"),
			autoCreateModel: document.getElementById("wta-auto-create-model"),
			save: document.getElementById("wta-save"),
			clearKey: document.getElementById("wta-clear-key"),
			status: document.getElementById("wta-save-status"),
			advancedToggle: document.getElementById("wta-advanced-toggle"),
			advanced: document.getElementById("wta-advanced"),
			baseURL: document.getElementById("wta-base-url"),
			ankiURL: document.getElementById("wta-anki-url"),
			tags: document.getElementById("wta-tags"),
			noteModel: document.getElementById("wta-note-model"),
			frontField: document.getElementById("wta-front-field"),
			backField: document.getElementById("wta-back-field"),
			audioField: document.getElementById("wta-audio-field"),
		};
	},

	_fillForm() {
		let manualOverrides = this._getManualOverrides();
		this.elements.apiKey.value = this._get("deepseekApiKey");
		this.elements.model.value = this._normalizeModelName(this._get("deepseekModel"));
		this.elements.baseURL.value = this._get("deepseekBaseURL") || "https://api.deepseek.com";
		this.elements.ankiURL.value = this._get("ankiConnectURL") || "http://127.0.0.1:8765";
		this.elements.tags.value = this._get("tags") || "zotero-word";
		this.elements.noteModel.value = manualOverrides.modelName;
		this.elements.frontField.value = manualOverrides.frontField;
		this.elements.backField.value = manualOverrides.backField;
		this.elements.audioField.value = manualOverrides.audioField;
		this.elements.enableAudio.checked = !!this._get("enableAudio");
		this.elements.allowDuplicate.checked = !!this._get("allowDuplicate");
		this.elements.autoCreateModel.checked = this._get("autoCreateModel") !== false;
		this._setDeckOptions([], this._get("deckName") || "Default");
		this._setAdvancedOpen(false);
	},

	_bindEvents() {
		if (this._bound) {
			return;
		}
		this._bound = true;

		this._bindAction(this.elements.save, () => this.save());
		this._bindAction(this.elements.clearKey, () => this.clearApiKey());
		this._bindAction(this.elements.apiKeyToggle, () => this.toggleApiKeyVisibility());
		this._bindAction(this.elements.advancedToggle, () => this.toggleAdvanced());
		this._bindAction(this.elements.refreshDecks, () => this.refreshDecks());
	},

	_bindAction(element, handler) {
		if (!element) {
			return;
		}
		let pending = false;
		let wrapped = (event) => {
			if (pending) {
				return;
			}
			pending = true;
			setTimeout(() => {
				pending = false;
			}, 0);
			event.preventDefault?.();
			handler();
		};
		element.addEventListener("command", wrapped);
		element.addEventListener("click", wrapped);
	},

	_getManualOverrides() {
		let modelName = this._get("modelName") || "";
		let frontField = this._get("frontField") || "";
		let backField = this._get("backField") || "";
		let audioField = this._get("audioField") || "";

		if (modelName === "Basic" && frontField === "Front" && backField === "Back" && !audioField) {
			return {
				modelName: "",
				frontField: "",
				backField: "",
				audioField: "",
			};
		}

		return {
			modelName,
			frontField,
			backField,
			audioField,
		};
	},

	_setDeckOptions(deckNames, selectedDeck) {
		let deckList = this.elements.deckList;
		while (deckList.firstChild) {
			deckList.removeChild(deckList.firstChild);
		}

		let names = Array.isArray(deckNames) ? deckNames.slice() : [];
		if (selectedDeck && !names.includes(selectedDeck)) {
			names.unshift(selectedDeck);
		}
		if (!names.length) {
			names.push(selectedDeck || "Default");
		}

		for (let deckName of names) {
			let option = document.createElementNS("http://www.w3.org/1999/xhtml", "option");
			option.value = deckName;
			deckList.appendChild(option);
		}

		this.elements.deck.value = selectedDeck || names[0] || "Default";
	},

	_setAdvancedOpen(open) {
		this.elements.advanced.hidden = !open;
		this.elements.advancedToggle.setAttribute("label", open ? "收起高级" : "展开高级");
	},

	toggleAdvanced() {
		this._setAdvancedOpen(this.elements.advanced.hidden);
	},

	toggleApiKeyVisibility() {
		let showPlain = this.elements.apiKey.type === "password";
		this.elements.apiKey.type = showPlain ? "text" : "password";
		this.elements.apiKeyToggle.setAttribute("label", showPlain ? "隐藏" : "显示");
	},

	clearApiKey() {
		this.elements.apiKey.value = "";
		this.setStatus("DeepSeek API Key 已清空。");
	},

	async refreshDecks(options = {}) {
		let selectedDeck = this.elements.deck.value || this._get("deckName") || "Default";
		let ankiURL = this.elements.ankiURL.value.trim() || "http://127.0.0.1:8765";

		if (options.silent) {
			this.setStatus("正在读取 Anki 现有牌组...");
		}
		else {
			this.setStatus("正在读取 Anki 牌组列表...");
		}

		try {
			let decks = await this._ankiInvoke("deckNames", {}, ankiURL);
			decks = Array.isArray(decks) ? decks.slice().sort((a, b) => a.localeCompare(b, "zh-CN")) : [];
			this._setDeckOptions(decks, selectedDeck);
			this.setStatus(`已读取 ${decks.length} 个牌组。`);
		}
		catch (e) {
			this._setDeckOptions([], selectedDeck);
			this.setStatus(`暂时读不到 Anki 牌组。请先启动 Anki 再点“刷新”。${e?.message ? `（${e.message}）` : ""}`);
		}
	},

	// 与 word-to-anki.js 保持一致：清掉零宽字符、全角横线、引号等
	_normalizeModelName(value) {
		let name = String(value == null ? "" : value)
			.replace(/[\u200B-\u200D\uFEFF\u00A0\u3000]/g, "")
			.replace(/["'`\u300C\u300D\u300E\u300F]/g, "")
			.replace(/[\u2010-\u2015\u2212\uFF0D\u30FC]/g, "-")
			.replace(/\s+/g, "")
			.toLowerCase();
		if (!name) {
			return "deepseek-v4-flash";
		}
		let alias = {
			"deepseek": "deepseek-v4-flash",
			"deepseek-chat": "deepseek-v4-flash",
			"deepseek-reasoner": "deepseek-v4-flash",
			"deepseek-v3": "deepseek-v4-flash",
			"deepseek-r1": "deepseek-v4-flash",
			"deepseek-v4": "deepseek-v4-flash",
			"deepseek-flash": "deepseek-v4-flash",
			"deepseek-pro": "deepseek-v4-pro",
			"v4-flash": "deepseek-v4-flash",
			"v4-pro": "deepseek-v4-pro",
		};
		return alias[name] || name;
	},

	save() {
		try {
			this._set("deepseekApiKey", this.elements.apiKey.value.trim());
			this._set("deepseekBaseURL", this.elements.baseURL.value.trim() || "https://api.deepseek.com");
			this._set("deepseekModel", this._normalizeModelName(this.elements.model.value));
			this._set("ankiConnectURL", this.elements.ankiURL.value.trim() || "http://127.0.0.1:8765");
			this._set("deckName", this.elements.deck.value.trim() || "Default");
			this._set("modelName", this.elements.noteModel.value.trim());
			this._set("frontField", this.elements.frontField.value.trim());
			this._set("backField", this.elements.backField.value.trim());
			this._set("audioField", this.elements.audioField.value.trim());
			this._set("tags", this.elements.tags.value.trim() || "zotero-word");
			this._set("enableAudio", this.elements.enableAudio.checked);
			this._set("allowDuplicate", this.elements.allowDuplicate.checked);
			this._set("autoCreateModel", this.elements.autoCreateModel.checked);
			this._flushPrefsToDisk();
			this.setStatus("设置已保存。");
		}
		catch (e) {
			Zotero.logError(e);
			this.setStatus(`保存失败：${e?.message || e}`);
		}
	},

	setStatus(text) {
		this.elements.status.textContent = text;
	},

	async _ankiInvoke(action, params, ankiURL) {
		let req = await Zotero.HTTP.request("POST", ankiURL, {
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				action,
				version: 5,
				params,
			}),
			responseType: "json",
			timeout: 10000,
		});

		let payload = req.response;
		if (!payload || typeof payload !== "object") {
			throw new Error("AnkiConnect 返回了无效响应。");
		}
		if (payload.error) {
			throw new Error(payload.error);
		}
		return payload.result;
	},

	_get(name) {
		return Zotero.Prefs.get(`${WTA_PREF_BRANCH}.${name}`, true);
	},

	_set(name, value) {
		Zotero.Prefs.set(`${WTA_PREF_BRANCH}.${name}`, value, true);
	},

	_flushPrefsToDisk() {
		try {
			if (typeof Services !== "undefined" && Services.prefs?.savePrefFile) {
				Services.prefs.savePrefFile(null);
				return;
			}
			if (typeof Components !== "undefined") {
				let prefService = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefService);
				prefService.savePrefFile(null);
			}
		}
		catch (e) {
			Zotero.logError(e);
		}
	},
};

if (typeof window !== "undefined") {
	window.Zotero_WordToAnki_Prefs = Zotero_WordToAnki_Prefs;
}

(function () {
	let initPane = () => {
		let pane = document.getElementById("zotero-prefpane-word-to-anki");
		if (!pane || pane.dataset.wtaInitialized) {
			return !!pane;
		}
		pane.dataset.wtaInitialized = "true";
		Zotero_WordToAnki_Prefs.init();
		return true;
	};

	if (initPane()) {
		return;
	}

	let observer = new MutationObserver(() => {
		if (initPane()) {
			observer.disconnect();
		}
	});
	observer.observe(document.documentElement || document, {
		childList: true,
		subtree: true,
	});
})();
