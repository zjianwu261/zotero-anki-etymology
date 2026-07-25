"use strict";

const WTA_PLUGIN_NAME = "zotero_anki_etymology";
// DeepSeek 官方模型名（deepseek-chat / deepseek-reasoner 已于 2026-07-24 下线）
const WTA_DEFAULT_MODEL = "deepseek-v4-flash";
const WTA_KNOWN_MODELS = ["deepseek-v4-flash", "deepseek-v4-pro"];
const WTA_PREF_BRANCH = "extensions.zotero-word-to-anki";
const WTA_PREF_PANE_ID = "zotero-prefpane-word-to-anki";
const WTA_CAMBRIDGE_HEADERS = {
	"User-Agent": (
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
		+ "AppleWebKit/537.36 (KHTML, like Gecko) "
		+ "Chrome/120.0.0.0 Safari/537.36"
	),
	"Accept-Language": "en-US,en;q=0.9",
	"Referer": "https://dictionary.cambridge.org/",
};
const WTA_STRUCTURED_FIELDS = [
	"Word",
	"Part_of_Speech",
	"Pronunciation",
	"Example_Sentence",
	"Example_ZH",
	"Etymology_Breakdown",
	"Semantic_Evolution",
	"Memory_Tip",
];
// 缺少结构化笔记类型时，自动创建这个（含发音模板与样式）。
const WTA_STRUCTURED_MODEL_NAME = "词源卡";
const WTA_MODEL_CSS = `/* ═══════════════════════════════════════════════
   Anki 词源卡 CSS — 白色简洁版（放大优化）
   字体：Crimson Pro / Noto Serif SC / IM Fell English
   ═══════════════════════════════════════════════ */

/* ── 基础 ── */
.card {
  font-family: 'Crimson Pro', 'Noto Serif SC', Georgia, serif;
  max-width: 680px;
  margin: 0 auto;
  background: #ffffff;
  border: none;
  box-shadow: none;
  text-align: left;
  color: #111;
  position: relative;
}

/* ── 正面整体居中 ── */
.front {
  padding: 58px 54px 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  text-align: center;
}

/* ── 正面：装饰符号 ── */
.orn {
  font-size: 18px;
  color: rgba(0,0,0,0.12);
  margin-bottom: 22px;
  letter-spacing: .22em;
}

/* ── 正面：单词行（单词 + 喇叭并排） ── */
.f-word-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.f-word {
  font-family: 'IM Fell English', Georgia, serif;
  font-size: 66px;
  color: #111;
  line-height: 1;
  letter-spacing: -.01em;
}

/* ── 正面：词性 / 音标 ── */
.f-pos {
  font-size: 16px;
  font-style: italic;
  color: #555;
}

.f-ipa {
  font-size: 21px;
  color: #888;
  letter-spacing: .02em;
}

/* ── 正面：分隔线 ── */
.f-rule {
  width: 120px;
  height: 1px;
  margin: 28px auto;
  position: relative;
  background: linear-gradient(90deg, transparent, #333, transparent);
}

.f-rule::before {
  content: '✦';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 9px;
  color: #333;
  background: #fff;
  padding: 0 5px;
}

/* ── 正面：例句 ── */
.f-ex-lbl {
  font-size: 10px;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.22);
  margin-bottom: 10px;
}

.f-ex {
  font-size: 19px;
  font-style: italic;
  color: #222;
  line-height: 1.9;
  text-align: center;
  max-width: 500px;
}

.f-ex-zh {
  font-family: 'Noto Serif SC', serif;
  font-size: 15px;
  color: #999;
  margin-top: 8px;
  text-align: center;
  line-height: 1.8;
}

/* ── 喇叭按钮（正面和背面共用） ── */
.f-audio-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  background: none;
  border: none;
  color: rgba(0,0,0,0.18);
  cursor: pointer;
  transition: color .18s, transform .15s;
  flex-shrink: 0;
  outline: none;
  align-self: center;
}

.f-audio-btn svg {
  width: 20px;
  height: 20px;
}

.f-audio-btn:hover {
  color: #555;
}

.f-audio-btn.playing {
  color: #222;
  transform: scale(1.2);
}

/* ── 隐藏 Anki 原生播放按钮 ── */
.replay-button {
  display: none !important;
}

/* ═══════════════════════════════════════════════
   背面
   ═══════════════════════════════════════════════ */

.back {
  padding: 38px 50px 46px;
}

/* ── 背面页眉 ── */
.b-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
  margin-bottom: 24px;
  position: relative;
}

.b-head::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 36px;
  height: 2px;
  background: #333;
}

.b-word {
  font-family: 'IM Fell English', Georgia, serif;
  font-size: 32px;
  color: #111;
  line-height: 1;
}

.b-pos {
  font-size: 13px;
  font-style: italic;
  color: #555;
  padding: 3px 9px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.b-ipa {
  font-size: 16px;
  color: #999;
  margin-left: auto;
  letter-spacing: .02em;
}

/* ── 区块 ── */
.sec {
  margin-bottom: 22px;
}

.sec-lbl {
  font-size: 10px;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: #bbb;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sec-lbl::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #ddd, transparent);
}

.sec-num {
  font-size: 11px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 0 6px;
  color: #aaa;
  font-style: normal;
}

/* ── 分隔线 ── */
.hr {
  height: 1px;
  margin: 18px 0;
  background: linear-gradient(90deg, transparent, #eee 30%, #eee 70%, transparent);
}

/* ── 词源 ── */
.etym-intro {
  font-size: 16px;
  line-height: 1.85;
  color: #333;
  margin-bottom: 12px;
}

.ep-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.ep-chip {
  background: #f6f6f6;
  border: 1px solid #e4e4e4;
  border-radius: 3px;
  padding: 7px 13px 8px;
}

.ep-part {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #111;
  margin-bottom: 3px;
}

.ep-origin {
  display: block;
  font-size: 11.5px;
  color: #aaa;
  font-style: italic;
  margin-bottom: 3px;
}

.ep-meaning {
  display: block;
  font-size: 12.5px;
  color: #444;
  line-height: 1.6;
}

.etym-lit {
  font-size: 15px;
  color: #666;
  font-style: italic;
  margin-top: 10px;
  padding-left: 12px;
  border-left: 2px solid #e0e0e0;
  line-height: 1.8;
}

.etym-concl {
  font-size: 16px;
  color: #111;
  margin-top: 10px;
  font-weight: 600;
  line-height: 1.8;
}

/* ── 语义演变 ── */
.stage {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #eee;
}

.stage:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.stage-title {
  font-size: 15px;
  font-weight: 600;
  color: #222;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 7px;
  line-height: 1.45;
}

.stage-title::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #333;
  flex-shrink: 0;
}

.stage-meaning {
  font-size: 15px;
  line-height: 1.85;
  color: #333;
  margin-bottom: 8px;
}

.stage-ex {
  background: #fafafa;
  border-left: 2.5px solid #ccc;
  padding: 8px 12px;
  border-radius: 0 3px 3px 0;
}

.ex-en {
  display: block;
  font-style: italic;
  font-size: 14px;
  color: #222;
  line-height: 1.8;
}

.ex-zh {
  display: block;
  font-family: 'Noto Serif SC', serif;
  font-size: 13px;
  color: #777;
  margin-top: 4px;
  line-height: 1.75;
}

/* ── 记忆技巧 ── */
.mem {
  background: #fafafa;
  border: 1px solid #ececec;
  border-left: 3px solid #ccc;
  padding: 11px 15px 12px 20px;
  font-size: 15px;
  font-family: 'Noto Serif SC', serif;
  color: #333;
  line-height: 1.8;
  border-radius: 0 3px 3px 0;
  position: relative;
}

/* ── 背面喇叭靠右 ── */
.b-audio-btn {
  margin-left: auto;
  align-self: center;
}

/* ── 底部 ── */
.b-foot {
  margin-top: 22px;
  text-align: center;
  color: #ddd;
  font-size: 14px;
}

.stage-meaning strong {
  color: #111;
  font-weight: 600;
}

.stage + .stage {
  margin-top: 2px;
}

.etym-concl + .stage {
  margin-top: 14px;
}

.sec .stage-meaning {
  font-family: 'Noto Serif SC', 'Crimson Pro', serif;
}
`;
const WTA_AUDIO_SCRIPT = `<script>
function playAudio() {
  var nativeBtn = document.querySelector('.replay-button');
  if (nativeBtn) { nativeBtn.click(); return; }
  var audio = document.querySelector('audio');
  if (audio) { audio.currentTime = 0; audio.play(); }
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'k' || e.key === 'K') {
    e.preventDefault();
    playAudio();
    var btn = document.getElementById('audioBtn');
    if (btn) {
      btn.classList.add('playing');
      setTimeout(function() { btn.classList.remove('playing'); }, 300);
    }
  }
});
</script>`;
const WTA_AUDIO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
<path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06ZM15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z"/>
</svg>`;
const WTA_CARD_FRONT = `<div class="card front">
<div class="orn">✦ &nbsp;✦ &nbsp;✦</div>

<div class="f-word-row">
<div class="f-word">{{Word}}</div>
<div class="f-ipa">{{Pronunciation}}</div>
<div class="f-pos">{{Part_of_Speech}}</div>
<button class="f-audio-btn" id="audioBtn" onclick="playAudio()" title="按 K 键重复播放">
${WTA_AUDIO_SVG}
</button>
</div>

<div class="f-rule"></div>
<div class="f-ex-lbl">Example</div>
<div class="f-ex">{{Example_Sentence}}</div>
<div class="f-ex-zh">{{Example_ZH}}</div>

[sound:{{Word}}.mp3]

${WTA_AUDIO_SCRIPT}
</div>`;
const WTA_CARD_BACK = `<div class="card back">
<!-- 页眉 -->
<div class="b-head">
<div class="b-word">{{Word}}</div>
<div class="b-ipa">{{Pronunciation}}</div>
<div class="b-pos">{{Part_of_Speech}}</div>
<button class="f-audio-btn b-audio-btn" id="audioBtn" onclick="playAudio()" title="按 K 键重复播放">
${WTA_AUDIO_SVG}
</button>
</div>

<!-- 1. 词源拆解 -->
<div class="sec">
<div class="sec-lbl"><span class="sec-num">1</span>词源拆解</div>
{{Etymology_Breakdown}}
</div>

<div class="hr"></div>

<!-- 2. 语义演变 -->
<div class="sec">
<div class="sec-lbl"><span class="sec-num">2</span>语义演变</div>
{{Semantic_Evolution}}
</div>

<div class="hr"></div>

<!-- 记忆技巧 -->
<div class="sec">
<div class="sec-lbl">记忆技巧</div>
<div class="mem">{{Memory_Tip}}</div>
</div>

<div class="b-foot">· · ·</div>

[sound:{{Word}}.mp3]

${WTA_AUDIO_SCRIPT}
</div>
`;

const WTA_SYSTEM_PROMPT = `你是严谨的英语词源学家兼英语教师。只返回 JSON，不加 markdown，不要输出解释性前言。格式：
{"word":"","part_of_speech":"","pronunciation":"","example_sentence":"","example_zh":"","etymology_intro":"","etymology_parts":[{"part":"","origin":"","meaning":""}],"etymology_literal":"","etymology_conclusion":"","semantic_evolution":[{"stage":"","meaning":"","example_en":"","example_zh":""}],"usage_sections":{"parts_of_speech":[{"label":"","meaning":"","example_en":"","example_zh":""}],"relatives":[{"word":"","literal":"","meaning":""}],"comparison":{"title":"","before_word":"","before_focus":"","contrast_word":"","contrast_focus":"","examples":[{"word":"","example_en":"","example_zh":""}]},"phrases":[{"phrase":"","meaning":""}],"summary":""},"memory_tip":""}
规则：
- word: 原词本身，小写或保留专名大小写
- part_of_speech: 用英文简洁列出该词主要词性，如 "preposition/conjunction/adverb"
- pronunciation: IPA，如 /taɪm/
- example_sentence/example_zh: 提供一组最常见核心义例句
- etymology_intro: 用中文写 2-4 句，先说明最早来源语言，再概括字面义
- etymology_parts: 拆解关键前缀/词根/后缀或历史形式；若该词不宜机械拆词，就填真实历史来源单元
- etymology_literal: 用中文写出字面义，如“在前面”
- etymology_conclusion: 用中文总结“核心意象如何推动后续义项发展”
- semantic_evolution: 写 3-5 个阶段，优先体现“空间/动作/具体义 → 时间/抽象义 → 现代固定用法”等脉络；每阶段必须有中文说明、英文例句、中文翻译
- usage_sections.parts_of_speech: 列出 2-4 个主要词性或用法，每项带中文释义和一组例句
- usage_sections.relatives: 列出 3-6 个同源词/近亲词；literal 写字面组合或构词说明，meaning 写现代含义
- usage_sections.comparison: 仅在存在高价值对比时填写；before_word 填当前词，contrast_word 填易混或可对比表达；examples 最多 2 条
- usage_sections.phrases: 列出 4-8 个常见短语或固定搭配，中文释义要简洁
- usage_sections.summary: 用 1 句中文做“一句话总结”，收束整个词源和语义脉络
- memory_tip: 1 句中文记忆技巧，优先利用词源核心意象，不要和 summary 重复
- 内容必须准确、克制，不要编造不确定的词源；若词源有争议，用“可能源自”“普遍认为”等表述
- 所有中文都用自然中文，不要夹杂模板腔`;

var ZoteroWordToAnki = {
	id: null,
	version: null,
	rootURI: null,
	prefPaneID: null,
	initialized: false,
	readerListeners: [],
	pendingWords: new Set(),
	cambridgeFailures: 0,

	init({ id, version, rootURI, prefPaneID }) {
		if (this.initialized) {
			return;
		}
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.prefPaneID = prefPaneID;
		this.initialized = true;
	},

	async startup() {
		this.registerReaderListeners();
		this.log(`Started ${this.version}`);
	},

	shutdown() {
		for (let { type, handler } of this.readerListeners) {
			try {
				Zotero.Reader.unregisterEventListener(type, handler);
			}
			catch (e) {
				Zotero.logError(e);
			}
		}
		this.readerListeners = [];
		this.pendingWords.clear();
		this.log("Stopped");
	},

	registerReaderListeners() {
		let selectionPopupHandler = this.handleSelectionPopup.bind(this);
		let viewContextHandler = this.handleViewContextMenu.bind(this);
		this.readerListeners.push(
			{ type: "renderTextSelectionPopup", handler: selectionPopupHandler },
			{ type: "createViewContextMenu", handler: viewContextHandler }
		);
		Zotero.Reader.registerEventListener("renderTextSelectionPopup", selectionPopupHandler, this.id);
		Zotero.Reader.registerEventListener("createViewContextMenu", viewContextHandler, this.id);
	},

	handleSelectionPopup(event) {
		let rawText = event?.params?.annotation?.text || "";
		let word = this.normalizeSelectedWord(rawText);
		if (!word) {
			return;
		}

		let button = event.doc.createElement("button");
		button.className = "toolbar-button wide-button";
		button.textContent = "导入 Anki";
		if (this.pendingWords.has(word)) {
			button.disabled = true;
			button.textContent = "导入中...";
		}
		button.addEventListener("click", async () => {
			if (button.disabled) {
				return;
			}
			button.disabled = true;
			button.textContent = "导入中...";
			let ok = await this.importWordFromReader(event.reader, rawText, { silentInvalidSelection: true });
			if (ok) {
				button.textContent = "已导入";
			}
			else {
				button.disabled = false;
				button.textContent = "导入 Anki";
			}
		});
		event.append(button);
	},

	handleViewContextMenu(event) {
		let rawText = this.getSelectedTextFromReader(event.reader);
		let word = this.normalizeSelectedWord(rawText);
		event.append({
			label: word ? `导入 "${word}" 到 Anki` : "导入到 Anki（先选中单个英文单词）",
			disabled: !word || this.pendingWords.has(word),
			persistent: true,
			onCommand: () => this.importWordFromReader(event.reader, rawText),
		});
	},

	async importWordFromReader(reader, rawText, options = {}) {
		let word = this.normalizeSelectedWord(rawText);
		if (!word) {
			if (!options.silentInvalidSelection) {
				this.showAlert(reader?._window, "请选择一个英文单词", "请先在 Zotero Reader 中选中单个英文单词，再导入 Anki。");
			}
			return false;
		}

		if (this.pendingWords.has(word)) {
			if (!options.silentInvalidSelection) {
				this.showAlert(reader?._window, "正在处理中", `${word} 正在导入中，请稍候。`);
			}
			return false;
		}

		this.pendingWords.add(word);
		let progress = this.openProgressWindow(reader?._window, word);

		try {
			let settings = this.getSettings();
			this.ensureConfigured(settings);

			progress.update("正在连接 AnkiConnect...", 10);
			await this.verifyAnkiConnect(settings);

			progress.update("正在读取 Anki 配置...", 20);
			let modelConfig = await this.resolveModelConfig(settings);

			progress.update(`正在用 DeepSeek 生成 ${word} 的词卡内容...`, 45);
			let card = await this.analyzeWord(word, settings);

			if (!settings.allowDuplicate) {
				progress.update("正在检查 Anki 中是否重复...", 65);
				let draftNote = this.buildNotePayload(card, modelConfig, settings, "");
				let canAdd = await this.canAddNote(draftNote, settings);
				if (!canAdd) {
					progress.info(`Anki 中已存在 ${word}`);
					return false;
				}
			}

			let audioMarkup = "";
			if (settings.enableAudio) {
				progress.update("正在抓取发音（Cambridge → 有道，最多 25 秒）...", 80);
				let filename = "";
				try {
					filename = await this.withTimeout(
						this.fetchAndStoreAudio(word, settings, card.word),
						25000,
						"抓取发音"
					);
				}
				catch (e) {
					// 发音失败不影响建卡，跳过即可
					this.log(`Audio step skipped for ${word}: ${e?.message || e}`, e);
					progress.update("发音抓取超时，跳过音频继续导入...", 85);
				}
				if (filename) {
					audioMarkup = `[sound:${filename}]`;
				}
			}

			progress.update("正在写入 Anki...", 90);
			let finalNote = this.buildNotePayload(card, modelConfig, settings, audioMarkup);
			await this.addNote(finalNote, settings);
			progress.success(`已导入到 Anki：${word}`);
			return true;
		}
		catch (e) {
			let message = e?.message || String(e);
			this.log(`Import failed for ${word}: ${message}`, e);
			let detail = [
				`单词：${word}`,
				"",
				message,
			];
			if (e?.wtaStatus) {
				detail.push("", `HTTP 状态码：${e.wtaStatus}`);
			}
			if (e?.wtaBody) {
				detail.push("", `服务器返回：`, e.wtaBody);
			}
			progress.error(message);
			this.showErrorDialog(reader?._window, `导入 ${word} 失败`, detail.join("\n"));
			return false;
		}
		finally {
			this.pendingWords.delete(word);
		}
	},

	getSelectedTextFromReader(reader) {
		try {
			let internalReader = reader?._internalReader || reader?._iframeWindow?.wrappedJSObject?._reader;
			let view = internalReader?._lastView;

			if (view && typeof view._getAnnotationFromTextSelection === "function") {
				let annotation = view._getAnnotationFromTextSelection("highlight");
				if (annotation?.text) {
					return annotation.text;
				}
			}

			if (
				view
				&& typeof view._getAnnotationFromSelectionRanges === "function"
				&& Array.isArray(view._selectionRanges)
				&& view._selectionRanges.length
			) {
				let annotation = view._getAnnotationFromSelectionRanges(view._selectionRanges, "highlight");
				if (annotation?.text) {
					return annotation.text;
				}
			}
		}
		catch (e) {
			this.log("Failed to get selection from internal reader", e);
		}

		try {
			let selection = reader?._iframeWindow?.getSelection?.();
			if (selection && !selection.isCollapsed) {
				return selection.toString();
			}
		}
		catch (e) {
			this.log("Failed to get browser selection", e);
		}

		return "";
	},

	normalizeSelectedWord(text) {
		if (!text) {
			return "";
		}
		let word = text.trim();
		word = word.replace(/^[^A-Za-z]+/, "").replace(/[^A-Za-z'-]+$/, "");
		if (!word) {
			return "";
		}
		if (!/^[A-Za-z][A-Za-z'-]*$/.test(word)) {
			return "";
		}
		return word.toLowerCase();
	},

	getSettings() {
		return {
			deepseekApiKey: this.getPref("deepseekApiKey"),
			deepseekBaseURL: this.getPref("deepseekBaseURL") || "https://api.deepseek.com",
			deepseekModel: this.normalizeModelName(this.getPref("deepseekModel")),
			ankiConnectURL: this.getPref("ankiConnectURL") || "http://127.0.0.1:8765",
			deckName: this.getPref("deckName") || "Default",
			modelName: this.safeText(this.getPref("modelName")),
			frontField: this.safeText(this.getPref("frontField")),
			backField: this.safeText(this.getPref("backField")),
			audioField: this.getPref("audioField") || "",
			tags: this.getPref("tags") || "zotero-word",
			enableAudio: !!this.getPref("enableAudio"),
			allowDuplicate: !!this.getPref("allowDuplicate"),
			autoCreateModel: this.getPref("autoCreateModel") !== false,
		};
	},

	ensureConfigured(settings) {
		if (!settings.deepseekApiKey) {
			this.openPreferences();
			throw new Error("请先在 Zotero 偏好设置 -> zotero_anki_etymology 中填写 DeepSeek API Key。");
		}
		if (!settings.deckName) {
			this.openPreferences();
			throw new Error("请先在 Zotero 偏好设置 -> zotero_anki_etymology 中填写 Anki 的 Deck Name。");
		}
	},

	async verifyAnkiConnect(settings) {
		try {
			await this.ankiInvoke("version", {}, settings);
		}
		catch (_e) {
			throw new Error("无法连接到 AnkiConnect。请先启动 Anki，并确认已安装 AnkiConnect 插件。");
		}
	},

	hasManualModelOverride(settings) {
		let modelName = this.safeText(settings.modelName);
		let frontField = this.safeText(settings.frontField);
		let backField = this.safeText(settings.backField);
		let audioField = this.safeText(settings.audioField);

		if (!modelName && !frontField && !backField && !audioField) {
			return false;
		}

		if (modelName === "Basic" && frontField === "Front" && backField === "Back" && !audioField) {
			return false;
		}

		return true;
	},

	async getModelNames(settings) {
		try {
			let modelNames = await this.ankiInvoke("modelNames", {}, settings);
			if (!Array.isArray(modelNames) || !modelNames.length) {
				throw new Error("笔记类型列表为空");
			}
			return modelNames;
		}
		catch (_e) {
			throw new Error("无法读取 Anki 笔记类型列表，请确认 AnkiConnect 工作正常。");
		}
	},

	async getModelFields(modelName, settings, strict = true) {
		try {
			let fields = await this.ankiInvoke("modelFieldNames", { modelName }, settings);
			if (!Array.isArray(fields) || !fields.length) {
				throw new Error("笔记类型字段为空");
			}
			return fields;
		}
		catch (_e) {
			if (strict) {
				this.openPreferences();
				throw new Error(`找不到 Anki 笔记类型 "${modelName}"，请检查高级设置。`);
			}
			return [];
		}
	},

	async resolveModelConfig(settings) {
		if (this.hasManualModelOverride(settings)) {
			let modelName = this.safeText(settings.modelName) || "Basic";
			let modelFields = await this.getModelFields(modelName, settings, true);
			return this.buildModelConfig(modelName, modelFields, settings, true);
		}

		let modelNames = await this.getModelNames(settings);
		let candidates = await this.collectModelCandidates(modelNames, settings);
		let structured = candidates.filter((config) => config.structured);

		if (structured.length) {
			structured.sort((a, b) => {
				// 同分时优先用插件自己的「词源卡」
				let aOwn = a.modelName === WTA_STRUCTURED_MODEL_NAME ? 1 : 0;
				let bOwn = b.modelName === WTA_STRUCTURED_MODEL_NAME ? 1 : 0;
				return bOwn - aOwn || b.score - a.score || a.modelName.localeCompare(b.modelName, "en");
			});
			return structured[0];
		}

		// 没有结构化笔记类型：默认强制建立/补全「词源卡」，不再回退 Basic
		if (settings.autoCreateModel) {
			let modelFields = await this.ensureStructuredModel(settings);
			let config = this.buildModelConfig(WTA_STRUCTURED_MODEL_NAME, modelFields, settings, false);
			if (!config || !config.structured) {
				throw new Error(
					`「${WTA_STRUCTURED_MODEL_NAME}」笔记类型创建后仍缺少必需字段：`
					+ `${WTA_STRUCTURED_FIELDS.join("、")}。请在 Anki 里检查该笔记类型，或临时关闭“自动创建”改用 Basic。`
				);
			}
			return config;
		}

		// 关闭自动创建时才回退到 Front/Back 双字段模型
		if (!candidates.length) {
			this.openPreferences();
			throw new Error("找不到可用的 Anki 笔记类型。请保留 Basic，或在高级设置里手动指定。");
		}
		candidates.sort((a, b) => {
			return b.score - a.score || a.modelName.localeCompare(b.modelName, "en");
		});
		return candidates[0];
	},

	// 保证「词源卡」存在且 8 个字段齐全（被用户改过也能自动补回来）
	async ensureStructuredModel(settings) {
		let modelNames = await this.getModelNames(settings).catch(() => []);
		if (!modelNames.includes(WTA_STRUCTURED_MODEL_NAME)) {
			await this.createStructuredModel(settings);
			return this.getModelFields(WTA_STRUCTURED_MODEL_NAME, settings, true);
		}

		let fields = await this.getModelFields(WTA_STRUCTURED_MODEL_NAME, settings, true);
		let missing = WTA_STRUCTURED_FIELDS.filter((field) => !fields.includes(field));
		if (!missing.length) {
			return fields;
		}
		for (let field of missing) {
			try {
				await this.ankiInvoke("modelFieldAdd", {
					modelName: WTA_STRUCTURED_MODEL_NAME,
					fieldName: field,
					index: WTA_STRUCTURED_FIELDS.indexOf(field),
				}, settings, 6);
				this.log(`Added missing field "${field}" to ${WTA_STRUCTURED_MODEL_NAME}`);
			}
			catch (e) {
				this.log(`Failed to add field "${field}"`, e);
			}
		}
		return this.getModelFields(WTA_STRUCTURED_MODEL_NAME, settings, true);
	},

	async collectModelCandidates(modelNames, settings) {
		let candidates = [];
		for (let modelName of modelNames) {
			let modelFields = await this.getModelFields(modelName, settings, false);
			if (!modelFields.length) {
				continue;
			}
			let config = this.buildModelConfig(modelName, modelFields, settings, false);
			if (config) {
				candidates.push(config);
			}
		}
		return candidates;
	},

	async createStructuredModel(settings) {
		// 已存在则跳过（理论上不会走到这里，双保险）
		let modelNames = await this.getModelNames(settings).catch(() => []);
		if (modelNames.includes(WTA_STRUCTURED_MODEL_NAME)) {
			return;
		}
		await this.ankiInvoke("createModel", {
			modelName: WTA_STRUCTURED_MODEL_NAME,
			inOrderFields: WTA_STRUCTURED_FIELDS,
			css: WTA_MODEL_CSS,
			cardTemplates: [{
				Name: "Card 1",
				Front: WTA_CARD_FRONT,
				Back: WTA_CARD_BACK,
			}],
		}, settings, 6);
		this.log(`Created structured model "${WTA_STRUCTURED_MODEL_NAME}"`);
	},

	buildModelConfig(modelName, modelFields, settings, strictManual) {
		if (this.hasStructuredFields(modelFields)) {
			return {
				modelName,
				modelFields,
				structured: true,
				audioField: this.resolveStructuredAudioField(modelName, modelFields, settings, strictManual),
				score: 400 + this.scoreModelName(modelName),
			};
		}

		let frontField = this.resolveWritableField(
			"Front",
			modelName,
			modelFields,
			settings.frontField,
			["Front", modelFields[0]],
			strictManual
		);
		let backField = this.resolveWritableField(
			"Back",
			modelName,
			modelFields,
			settings.backField,
			["Back", ...modelFields.filter((field) => field !== frontField)],
			strictManual
		);

		if (!frontField || !backField || frontField === backField) {
			if (strictManual) {
				this.openPreferences();
				throw new Error(`笔记类型 "${modelName}" 需要两个不同的写入字段。`);
			}
			return null;
		}

		return {
			modelName,
			modelFields,
			structured: false,
			frontField,
			backField,
			audioField: this.resolveAudioField(modelName, modelFields, settings, frontField, backField, strictManual),
			score: this.scoreBasicModel(modelName, modelFields),
		};
	},

	resolveWritableField(label, modelName, modelFields, preferredField, fallbackFields, strictManual) {
		let fieldSet = new Set(modelFields);
		let preferred = this.safeText(preferredField);
		if (preferred) {
			if (fieldSet.has(preferred)) {
				return preferred;
			}
			if (strictManual) {
				this.openPreferences();
				throw new Error(`Anki 笔记类型 "${modelName}" 不包含字段 "${preferred}"。`);
			}
			return "";
		}

		for (let fieldName of fallbackFields) {
			if (fieldName && fieldSet.has(fieldName)) {
				return fieldName;
			}
		}

		if (strictManual) {
			this.openPreferences();
			throw new Error(`Anki 笔记类型 "${modelName}" 缺少可用于 ${label} 的字段。`);
		}
		return "";
	},

	resolveStructuredAudioField(modelName, modelFields, settings, strictManual) {
		let fieldSet = new Set(modelFields);
		let preferred = this.safeText(settings.audioField);
		if (preferred) {
			if (fieldSet.has(preferred) && !WTA_STRUCTURED_FIELDS.includes(preferred)) {
				return preferred;
			}
			if (strictManual) {
				this.openPreferences();
				throw new Error(`Anki 笔记类型 "${modelName}" 不包含可写音频字段 "${preferred}"。`);
			}
		}
		return fieldSet.has("Audio") ? "Audio" : "";
	},

	resolveAudioField(modelName, modelFields, settings, frontField, backField, strictManual) {
		let fieldSet = new Set(modelFields);
		let preferred = this.safeText(settings.audioField);
		if (preferred) {
			if (!fieldSet.has(preferred)) {
				if (strictManual) {
					this.openPreferences();
					throw new Error(`Anki 笔记类型 "${modelName}" 不包含音频字段 "${preferred}"。`);
				}
				return "";
			}
			if (preferred === frontField || preferred === backField) {
				if (strictManual) {
					this.openPreferences();
					throw new Error("音频字段不能与 Front / Back 字段重名。");
				}
				return "";
			}
			return preferred;
		}
		if (fieldSet.has("Audio") && frontField !== "Audio" && backField !== "Audio") {
			return "Audio";
		}
		return "";
	},

	scoreBasicModel(modelName, modelFields) {
		let lowerName = modelName.toLowerCase();
		let fieldSet = new Set(modelFields);
		let score = 120;
		if (lowerName === "basic") {
			score += 140;
		}
		if (fieldSet.has("Front") && fieldSet.has("Back")) {
			score += 70;
		}
		if (modelFields.length === 2) {
			score += 20;
		}
		return score + this.scoreModelName(modelName);
	},

	scoreModelName(modelName) {
		let lowerName = modelName.toLowerCase();
		let score = 0;
		if (/\bword\b|\bvocab\b|vocabulary|english|ielts|toefl|gre/.test(lowerName)) {
			score += 25;
		}
		if (/单词|词汇|英语/.test(modelName)) {
			score += 25;
		}
		return score;
	},

	buildDeepSeekPrompt(word) {
		return [
			`分析英语单词：${word}`,
			"目标：生成适合中文学习者理解的词源卡内容。",
			"重点：",
			"1. 先讲最早来源语言和字面义。",
			"2. 明确展示语义如何从早期具体义一步步演变到现代常见义。",
			"3. 补充主要词性、同源近亲词、易混对比、常见短语和一句话总结。",
			"4. 所有内容要有教学价值，避免空话。",
		].join("\n");
	},

	// 清洗模型名：去引号、零宽字符、全角横线、空格，避免从网页复制来的字符导致 400
	normalizeModelName(value) {
		let name = this.safeText(value)
			.replace(/[\u200B-\u200D\uFEFF\u00A0\u3000]/g, "")
			.replace(/["'`\u300C\u300D\u300E\u300F]/g, "")
			.replace(/[\u2010-\u2015\u2212\uFF0D\u30FC]/g, "-")
			.replace(/\s+/g, "")
			.toLowerCase();
		if (!name) {
			return WTA_DEFAULT_MODEL;
		}
		// DeepSeek 于 2026-07-24 下线 deepseek-chat / deepseek-reasoner，
		// 官方 API 现在只接受 deepseek-v4-flash 和 deepseek-v4-pro
		let alias = {
			"deepseek": WTA_DEFAULT_MODEL,
			"deepseek-chat": WTA_DEFAULT_MODEL,
			"deepseek-reasoner": WTA_DEFAULT_MODEL,
			"deepseek-v3": WTA_DEFAULT_MODEL,
			"deepseek-v3.1": WTA_DEFAULT_MODEL,
			"deepseek-v3.2": WTA_DEFAULT_MODEL,
			"deepseek-r1": WTA_DEFAULT_MODEL,
			"deepseek-v4": WTA_DEFAULT_MODEL,
			"deepseek-flash": "deepseek-v4-flash",
			"deepseek-pro": "deepseek-v4-pro",
			"v4-flash": "deepseek-v4-flash",
			"v4-pro": "deepseek-v4-pro",
		};
		return alias[name] || name;
	},

	getDeepSeekEndpoint(settings) {
		let base = String(settings.deepseekBaseURL || "https://api.deepseek.com").trim().replace(/\/+$/, "");
		if (/\/chat\/completions$/i.test(base)) {
			return base;
		}
		return `${base}/chat/completions`;
	},

	// 从 DeepSeek 的错误响应体里抠出真正的错误说明
	extractAPIErrorDetail(text) {
		let raw = this.safeText(text);
		if (!raw) {
			return "";
		}
		try {
			let data = JSON.parse(raw);
			let detail = data?.error?.message || data?.message || data?.error?.code || "";
			if (detail) {
				return String(detail).replace(/\s+/g, " ").trim();
			}
		}
		catch (_e) {
			// 不是 JSON（可能是代理返回的 HTML），直接给原文
		}
		return raw.replace(/\s+/g, " ").slice(0, 300);
	},

	makeDeepSeekError(status, bodyText, attempt) {
		let detail = this.extractAPIErrorDetail(bodyText);
		let noRetry = true;
		let message;
		switch (status) {
			case 400:
				message = `DeepSeek 拒绝了请求 (400)：${detail || "请求参数有误"}（本次发送的模型名："${this.lastModelSent || ""}"；官方当前支持：${WTA_KNOWN_MODELS.join(" / ")}）`;
				break;
			case 401:
				message = `DeepSeek API Key 无效 (401)，请在设置中填写正确的 Key。${detail ? ` 服务器提示：${detail}` : ""}`;
				break;
			case 402:
				message = `DeepSeek 账户余额不足 (402)，请充值后重试。${detail ? ` 服务器提示：${detail}` : ""}`;
				break;
			case 403:
				message = `DeepSeek 访问被拒绝 (403)，请检查 API Key 权限或所在网络。${detail ? ` 服务器提示：${detail}` : ""}`;
				break;
			case 404:
				message = `DeepSeek 接口地址错误 (404)，请检查 Base URL。${detail ? ` 服务器提示：${detail}` : ""}`;
				break;
			case 422:
				message = `DeepSeek 参数校验失败 (422)：${detail || "请求体有误"}`;
				break;
			case 429:
				message = `请求太频繁 (429)，第 ${attempt} 次重试。${detail ? ` 服务器提示：${detail}` : ""}`;
				noRetry = false;
				break;
			case 0:
				message = "请求没有发出去（状态码 0）：可能是网络、代理或 TLS 问题，请确认能访问 api.deepseek.com。";
				noRetry = false;
				break;
			default:
				if (status >= 500) {
					message = `DeepSeek 服务器错误 (${status})，请稍后重试。${detail ? ` 服务器提示：${detail}` : ""}`;
					noRetry = false;
				}
				else {
					message = `DeepSeek 返回 ${status}：${detail || "无错误说明"}`;
				}
		}
		let error = new Error(message);
		error.wtaStatus = status;
		error.wtaNoRetry = noRetry;
		error.wtaBody = this.safeText(bodyText).slice(0, 2000);
		return error;
	},

	buildDeepSeekBody(word, model) {
		let body = {
			model,
			messages: [
				{ role: "system", content: WTA_SYSTEM_PROMPT },
				{ role: "user", content: this.buildDeepSeekPrompt(word) },
			],
			max_tokens: 4096,
			response_format: { type: "json_object" },
			// V4 默认开启思考模式，词卡任务不需要，关掉更快更便宜；
			// 关掉后 temperature 才生效
			thinking: { type: "disabled" },
			temperature: 0,
		};
		return JSON.stringify(body);
	},

	async analyzeWord(word, settings) {
		let endpoint = this.getDeepSeekEndpoint(settings);
		let model = this.normalizeModelName(settings.deepseekModel);
		this.lastModelSent = model;
		this.log(`DeepSeek request: endpoint=${endpoint} model="${model}" (raw pref: ${JSON.stringify(this.getPref("deepseekModel"))})`);
		return this.retry(async (attempt) => {
			let req;
			try {
				req = await Zotero.HTTP.request("POST", endpoint, {
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${settings.deepseekApiKey}`,
					},
					body: this.buildDeepSeekBody(word, model),
					// 自己处理状态码，这样能拿到 DeepSeek 返回的错误正文
					successCodes: false,
					timeout: 60000,
				});
			}
			catch (e) {
				// 到这里说明连接层就失败了（超时 / 断网 / 证书 / 被拦截）
				let status = e?.xmlhttp?.status || e?.status || 0;
				let bodyText = "";
				try {
					bodyText = e?.xmlhttp?.responseText || "";
				}
				catch (_e2) { /* responseType 限制，忽略 */ }
				this.log(`DeepSeek transport error (attempt ${attempt}, status ${status}): ${e?.message || e}`, e);
				if (status) {
					throw this.makeDeepSeekError(status, bodyText, attempt);
				}
				let msg = (e?.message || String(e)).replace(/\s+/g, " ");
				if (/timeout|abort/i.test(msg)) {
					throw new Error(`请求超时（第 ${attempt} 次，60 秒），请检查网络或代理。`);
				}
				throw new Error(`无法连接 DeepSeek：${msg.slice(0, 200)}`);
			}

			let status = req.status;
			let text = "";
			try {
				text = req.responseText || "";
			}
			catch (_e) { /* ignore */ }

			if (status !== 200) {
				this.log(`DeepSeek HTTP ${status} (attempt ${attempt}): ${text.slice(0, 500)}`);
				throw this.makeDeepSeekError(status, text, attempt);
			}

			let payload;
			try {
				payload = JSON.parse(text);
			}
			catch (_e) {
				throw new Error(`DeepSeek 返回的不是 JSON：${text.replace(/\s+/g, " ").slice(0, 200)}`);
			}

			let raw = this.safeText(payload?.choices?.[0]?.message?.content);
			if (!raw) {
				let finishReason = payload?.choices?.[0]?.finish_reason;
				let hint = finishReason === "length" ? "（内容被 max_tokens 截断）" : "";
				this.log(`DeepSeek empty content (attempt ${attempt}): ${text.slice(0, 500)}`);
				throw new Error(`DeepSeek 没有返回内容${hint}，第 ${attempt} 次重试。`);
			}

			try {
				let parsed = this.parseDeepSeekJSON(raw);
				parsed.word = this.normalizeSelectedWord(parsed.word) || word;
				return parsed;
			}
			catch (e) {
				this.log(`DeepSeek JSON parse failed (attempt ${attempt}): ${raw.slice(0, 500)}`, e);
				throw new Error(`解析 DeepSeek 返回的 JSON 失败（第 ${attempt} 次），可重试。`);
			}
		}, 3, 1500);
	},

	parseDeepSeekJSON(raw) {
		let clean = raw.trim();

		// 1. 去掉可能包裹的 markdown 代码块
		if (clean.includes("```")) {
			clean = clean.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/i, "").trim();
		}

		// 2. 去除 JSON 不允许的控制字符
		clean = clean.replace(/[ --]/g, "");

		// 3. 尝试直接解析
		try {
			return JSON.parse(clean);
		}
		catch (_directError) {
			// 4. 状态机修复 JSON 字符串内部的未转义换行（比正则稳健得多）
			clean = this._repairJsonNewlines(clean);
			try {
				return JSON.parse(clean);
			}
			catch (_repairError) {
				// 5. 最后一次尝试：截取第一个 { 到最后一个 }
				let start = clean.indexOf("{");
				let end = clean.lastIndexOf("}");
				if (start !== -1 && end !== -1 && end > start) {
					clean = clean.slice(start, end + 1);
				}
				return JSON.parse(clean);
			}
		}
	},

	_repairJsonNewlines(text) {
		// 状态机遍历：只在 JSON 字符串值内部将 \n / \r\n 替换为空格
		let result = "";
		let inString = false;
		let escaping = false;

		for (let i = 0; i < text.length; i++) {
			let ch = text[i];

			if (escaping) {
				result += ch;
				escaping = false;
				continue;
			}

			if (ch === "\\") {
				result += ch;
				escaping = true;
				continue;
			}

			if (ch === '"') {
				inString = !inString;
				result += ch;
				continue;
			}

			if (inString && ch === "\r") {
				// \r\n → 一个空格
				if (i + 1 < text.length && text[i + 1] === "\n") {
					i++;
				}
				result += " ";
				continue;
			}

			if (inString && ch === "\n") {
				result += " ";
				continue;
			}

			result += ch;
		}

		return result;
	},

	async fetchAndStoreAudio(word, settings, filenameBase = "") {
		let filename = this.buildAudioFilename(filenameBase || word);

		// 1. Cambridge 真人发音优先（最多 12 秒）
		// 连续失败 2 次后，本次 Zotero 会话内直接跳过 Cambridge（通常是网络不通）
		let blob = null;
		if (this.cambridgeFailures < 2) {
			blob = await this.withTimeout(this.downloadCambridgeAudio(word), 12000, "Cambridge 发音")
				.catch((e) => {
					this.log(`Cambridge audio timed out for ${word}: ${e?.message || e}`);
					return null;
				});
			if (!blob || blob.size < 1000) {
				this.cambridgeFailures++;
				if (this.cambridgeFailures >= 2) {
					this.log("Cambridge 连续失败，本次会话改用有道发音");
				}
			}
			else {
				this.cambridgeFailures = 0;
			}
		}

		// 2. Cambridge 失败 → 有道兜底（最多 10 秒）
		if (!blob || blob.size < 1000) {
			blob = await this.withTimeout(this.downloadYoudaoAudio(word), 10000, "有道发音")
				.catch((e) => {
					this.log(`Youdao audio timed out for ${word}: ${e?.message || e}`);
					return null;
				});
		}

		if (!blob || blob.size < 1000) {
			return "";
		}

		try {
			let base64 = await this.blobToBase64(blob);
			await this.ankiInvoke("storeMediaFile", { filename, data: base64 }, settings);
			return filename;
		}
		catch (e) {
			this.log(`Audio store failed for ${word}`, e);
			return "";
		}
	},

	async downloadCambridgeAudio(word) {
		let audioURL = "";
		try {
			// 只试一次：Cambridge 不通时立刻转有道，别让用户干等
			audioURL = await this.getCambridgeAudioURL(word);
		}
		catch (e) {
			this.log(`Cambridge audio URL failed for ${word}`, e);
			return null;
		}
		if (!audioURL) {
			return null;
		}
		try {
			let req = await Zotero.HTTP.request("GET", audioURL, {
				headers: WTA_CAMBRIDGE_HEADERS,
				responseType: "blob",
				timeout: 8000,
			});
			return req.response;
		}
		catch (e) {
			this.log(`Cambridge audio download failed for ${word}`, e);
			return null;
		}
	},

	async downloadYoudaoAudio(word) {
		// 有道发音 API（type=2 美式），无需解析页面，稳定可靠。
		let url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`;
		try {
			let req = await Zotero.HTTP.request("GET", url, {
				responseType: "blob",
				timeout: 8000,
			});
			return req.response;
		}
		catch (e) {
			this.log(`Youdao audio download failed for ${word}`, e);
			return null;
		}
	},

	buildAudioFilename(word) {
		let safeWord = this.safeText(word)
			.replace(/[\\/:*?"<>|]/g, "")
			.trim();
		return `${safeWord || "word"}.mp3`;
	},

	async getCambridgeAudioURL(word) {
		let url = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word.toLowerCase())}`;
		try {
			let req = await Zotero.HTTP.request("GET", url, {
				headers: WTA_CAMBRIDGE_HEADERS,
				responseType: "blob",
				timeout: 8000,
			});
			let doc = await Zotero.Utilities.Internal.blobToHTMLDocument(req.response, url);
			return this.findCambridgeAudioURL(doc);
		}
		catch (e) {
			this.log(`Cambridge page fetch failed for ${word}`, e);
			return "";
		}
	},

	findCambridgeAudioURL(doc) {
		for (let region of ["us", "uk"]) {
			let spans = Array.from(doc.querySelectorAll("span")).filter((span) => {
				let cls = (span.getAttribute("class") || "").toLowerCase();
				return cls.includes(region) && cls.includes("dpron");
			});
			for (let span of spans) {
				let source = span.querySelector('source[src$=".mp3"]');
				if (source?.getAttribute("src")) {
					return new URL(source.getAttribute("src"), "https://dictionary.cambridge.org").href;
				}
			}
		}

		let fallback = doc.querySelector('source[src$=".mp3"]');
		if (fallback?.getAttribute("src")) {
			return new URL(fallback.getAttribute("src"), "https://dictionary.cambridge.org").href;
		}
		return "";
	},

	async blobToBase64(blob) {
		let buffer = await blob.arrayBuffer();
		let bytes = new Uint8Array(buffer);
		let chunkSize = 0x8000;
		let binary = "";
		for (let i = 0; i < bytes.length; i += chunkSize) {
			let chunk = bytes.subarray(i, i + chunkSize);
			binary += String.fromCharCode.apply(null, chunk);
		}
		return btoa(binary);
	},

	buildNotePayload(card, modelConfig, settings, audioMarkup) {
		let fields = this.buildNoteFields(card, modelConfig, settings, audioMarkup);
		let note = {
			deckName: settings.deckName,
			modelName: modelConfig.modelName,
			fields,
			tags: this.parseTags(settings.tags),
		};
		if (settings.allowDuplicate) {
			note.options = {
				allowDuplicate: true,
			};
		}
		return note;
	},

	buildNoteFields(card, modelConfig, settings, audioMarkup) {
		if (modelConfig.structured) {
			let fields = {
				Word: this.escapeHTML(this.safeText(card.word)),
				Part_of_Speech: this.escapeHTML(this.safeText(card.part_of_speech)),
				Pronunciation: this.escapeHTML(this.safeText(card.pronunciation)),
				Example_Sentence: this.escapeHTML(this.safeText(card.example_sentence)),
				Example_ZH: this.escapeHTML(this.safeText(card.example_zh)),
				Etymology_Breakdown: this.renderEtymology(card),
				Semantic_Evolution: this.renderSemanticEvolution(card),
				Memory_Tip: this.escapeHTML(this.safeText(card.memory_tip)),
			};

			if (modelConfig.audioField) {
				fields[modelConfig.audioField] = audioMarkup;
			}

			return fields;
		}

		let backAudio = modelConfig.audioField ? "" : audioMarkup;
		let fields = {
			[modelConfig.frontField]: this.escapeHTML(this.safeText(card.word)),
			[modelConfig.backField]: this.buildBasicBackHTML(card, backAudio),
		};

		if (modelConfig.audioField) {
			fields[modelConfig.audioField] = audioMarkup;
		}

		return fields;
	},

	hasStructuredFields(modelFields) {
		return WTA_STRUCTURED_FIELDS.every((field) => modelFields.includes(field));
	},

	buildBasicBackHTML(card, audioMarkup) {
		let sections = [];
		if (audioMarkup) {
			sections.push(`<div>${audioMarkup}</div>`);
		}

		if (card.part_of_speech || card.pronunciation) {
			let meta = [];
			if (card.part_of_speech) {
				meta.push(`<strong>词性：</strong>${this.escapeHTML(card.part_of_speech)}`);
			}
			if (card.pronunciation) {
				meta.push(`<strong>音标：</strong>${this.escapeHTML(card.pronunciation)}`);
			}
			sections.push(`<div>${meta.join("<br>")}</div>`);
		}

		if (card.example_sentence || card.example_zh) {
			sections.push(
				[
					"<div><strong>例句</strong></div>",
					card.example_sentence ? `<div>${this.escapeHTML(card.example_sentence)}</div>` : "",
					card.example_zh ? `<div>${this.escapeHTML(card.example_zh)}</div>` : "",
				].join("")
			);
		}

		let etymology = this.renderEtymology(card);
		if (etymology) {
			sections.push(`<div><strong>词源</strong></div>${etymology}`);
		}

		let evolution = this.renderSemanticEvolution(card);
		if (evolution) {
			sections.push(`<div><strong>语义演变</strong></div>${evolution}`);
		}

		if (card.memory_tip) {
			sections.push(`<div><strong>记忆提示：</strong>${this.escapeHTML(card.memory_tip)}</div>`);
		}

		return sections.join("<hr>");
	},

	renderEtymology(data) {
		let intro = this.safeText(data.etymology_intro);
		let parts = Array.isArray(data.etymology_parts) ? data.etymology_parts : [];
		let literal = this.safeText(data.etymology_literal);
		let conclusion = this.safeText(data.etymology_conclusion);
		let relatives = Array.isArray(data?.usage_sections?.relatives) ? data.usage_sections.relatives : [];

		let html = [];
		if (intro) {
			html.push(`<div class="etym-intro">${this.escapeHTML(intro)}</div>`);
		}
		if (parts.length) {
			let items = parts.map((part) => {
				let partName = this.safeText(part.part);
				let origin = this.safeText(part.origin);
				let meaning = this.safeText(part.meaning);
				return [
					'<div class="ep-chip">',
					partName ? `<span class="ep-part">${this.escapeHTML(partName)}</span>` : "",
					origin ? `<span class="ep-origin">${this.escapeHTML(origin)}</span>` : "",
					meaning ? `<span class="ep-meaning">${this.escapeHTML(meaning)}</span>` : "",
					"</div>",
				].join("");
			}).join("");
			html.push(`<div class="ep-row">${items}</div>`);
		}
		if (literal) {
			html.push(`<div class="etym-lit">${this.escapeHTML(literal)}</div>`);
		}
		if (conclusion) {
			html.push(`<div class="etym-concl">${this.escapeHTML(conclusion)}</div>`);
		}
		if (relatives.length) {
			let items = relatives.map((item) => {
				let word = this.safeText(item.word);
				let literalText = this.safeText(item.literal);
				let meaning = this.safeText(item.meaning);
				let detail = [literalText, meaning].filter(Boolean).join("；");
				return [
					'<div class="stage-meaning">',
					word ? `<strong>${this.escapeHTML(word)}</strong>` : "",
					detail ? `：${this.escapeHTML(detail)}` : "",
					"</div>",
				].join("");
			}).join("");
			html.push(`<div class="stage"><div class="stage-title">同源近亲词</div>${items}</div>`);
		}
		return html.join("");
	},

	renderSemanticEvolution(data) {
		let stages = Array.isArray(data.semantic_evolution) ? data.semantic_evolution : [];
		let usage = data?.usage_sections || {};
		let partsOfSpeech = Array.isArray(usage.parts_of_speech) ? usage.parts_of_speech : [];
		let comparison = usage.comparison && typeof usage.comparison === "object" ? usage.comparison : {};
		let phrases = Array.isArray(usage.phrases) ? usage.phrases : [];
		let summary = this.safeText(usage.summary);

		if (!stages.length && !partsOfSpeech.length && !phrases.length && !summary && !Object.keys(comparison).length) {
			return "";
		}
		let items = stages.map((stage) => {
			let parts = ['<div class="stage">'];
			if (stage.stage) {
				parts.push(`<div class="stage-title">${this.escapeHTML(this.safeText(stage.stage))}</div>`);
			}
			if (stage.meaning) {
				parts.push(`<div class="stage-meaning">${this.escapeHTML(this.safeText(stage.meaning))}</div>`);
			}
			if (stage.example_en || stage.example_zh) {
				parts.push('<div class="stage-ex">');
				if (stage.example_en) {
					parts.push(`<span class="ex-en">${this.escapeHTML(this.safeText(stage.example_en))}</span>`);
				}
				if (stage.example_zh) {
					parts.push(`<span class="ex-zh">${this.escapeHTML(this.safeText(stage.example_zh))}</span>`);
				}
				parts.push("</div>");
			}
			parts.push("</div>");
			return parts.join("");
		});

		if (partsOfSpeech.length) {
			let blocks = partsOfSpeech.map((item) => {
				let parts = ['<div class="stage">'];
				if (item.label) {
					parts.push(`<div class="stage-title">${this.escapeHTML(this.safeText(item.label))}</div>`);
				}
				if (item.meaning) {
					parts.push(`<div class="stage-meaning">${this.escapeHTML(this.safeText(item.meaning))}</div>`);
				}
				if (item.example_en || item.example_zh) {
					parts.push('<div class="stage-ex">');
					if (item.example_en) {
						parts.push(`<span class="ex-en">${this.escapeHTML(this.safeText(item.example_en))}</span>`);
					}
					if (item.example_zh) {
						parts.push(`<span class="ex-zh">${this.escapeHTML(this.safeText(item.example_zh))}</span>`);
					}
					parts.push("</div>");
				}
				parts.push("</div>");
				return parts.join("");
			}).join("");
			items.push(`<div class="stage"><div class="stage-title">主要词性 / 用法</div>${blocks}</div>`);
		}

		if (comparison.title || comparison.before_focus || comparison.contrast_focus || (Array.isArray(comparison.examples) && comparison.examples.length)) {
			let examples = Array.isArray(comparison.examples) ? comparison.examples : [];
			let parts = ['<div class="stage">'];
			parts.push(`<div class="stage-title">${this.escapeHTML(this.safeText(comparison.title) || "易混对比")}</div>`);
			if (comparison.before_word || comparison.before_focus) {
				let before = [this.safeText(comparison.before_word), this.safeText(comparison.before_focus)]
					.filter(Boolean)
					.join("：");
				if (before) {
					parts.push(`<div class="stage-meaning">${this.escapeHTML(before)}</div>`);
				}
			}
			if (comparison.contrast_word || comparison.contrast_focus) {
				let contrast = [this.safeText(comparison.contrast_word), this.safeText(comparison.contrast_focus)]
					.filter(Boolean)
					.join("：");
				if (contrast) {
					parts.push(`<div class="stage-meaning">${this.escapeHTML(contrast)}</div>`);
				}
			}
			for (let example of examples) {
				if (!example.example_en && !example.example_zh && !example.word) {
					continue;
				}
				parts.push('<div class="stage-ex">');
				if (example.word || example.example_en) {
					let exampleEn = [this.safeText(example.word), this.safeText(example.example_en)]
						.filter(Boolean)
						.join("：");
					if (exampleEn) {
						parts.push(`<span class="ex-en">${this.escapeHTML(exampleEn)}</span>`);
					}
				}
				if (example.example_zh) {
					parts.push(`<span class="ex-zh">${this.escapeHTML(this.safeText(example.example_zh))}</span>`);
				}
				parts.push("</div>");
			}
			parts.push("</div>");
			items.push(parts.join(""));
		}

		if (phrases.length) {
			let phraseItems = phrases.map((item) => {
				let phrase = this.safeText(item.phrase);
				let meaning = this.safeText(item.meaning);
				if (!phrase && !meaning) {
					return "";
				}
				let line = phrase ? `<strong>${this.escapeHTML(phrase)}</strong>` : "";
				if (meaning) {
					line += `${phrase ? "：" : ""}${this.escapeHTML(meaning)}`;
				}
				return `<div class="stage-meaning">${line}</div>`;
			}).filter(Boolean).join("");
			if (phraseItems) {
				items.push(`<div class="stage"><div class="stage-title">常见短语</div>${phraseItems}</div>`);
			}
		}

		if (summary) {
			items.push(`<div class="stage"><div class="stage-title">一句话总结</div><div class="stage-meaning">${this.escapeHTML(summary)}</div></div>`);
		}
		return items.join("");
	},

	async canAddNote(note, settings) {
		let result = await this.ankiInvoke("canAddNotes", { notes: [note] }, settings);
		return Array.isArray(result) ? !!result[0] : false;
	},

	async addNote(note, settings) {
		let result = await this.ankiInvoke("addNote", { note }, settings);
		if (result == null) {
			throw new Error("Anki 未能创建笔记，请检查牌组、笔记类型和字段设置。");
		}
		return result;
	},

	async ankiInvoke(action, params, settings, version = 5) {
		let req = await Zotero.HTTP.request("POST", settings.ankiConnectURL, {
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				action,
				version,
				params,
			}),
			responseType: "json",
			timeout: 15000,
		});

		let payload = req.response;
		if (!payload || typeof payload !== "object") {
			throw new Error(`AnkiConnect 对 ${action} 返回了无效响应。`);
		}
		if (payload.error) {
			throw new Error(`AnkiConnect ${action} 失败：${payload.error}`);
		}
		return payload.result;
	},

	parseTags(value) {
		let parts = (value || "")
			.split(/[\s,]+/)
			.map((tag) => tag.trim())
			.filter(Boolean);
		return [...new Set(parts)];
	},

	// 给可能卡住的异步步骤加一个硬性上限，避免进度窗一直转
	withTimeout(promise, ms, label) {
		let done = false;
		let guard = Zotero.Promise.delay(ms).then(() => {
			if (done) {
				// 主任务已经结束，这个 guard 永远不 settle，避免未处理的 rejection
				return new Promise(() => {});
			}
			throw new Error(`${label}超时（${Math.round(ms / 1000)} 秒）`);
		});
		return Promise.race([promise, guard]).then(
			(value) => {
				done = true;
				return value;
			},
			(error) => {
				done = true;
				throw error;
			}
		);
	},

	retry: async function (task, attempts, delayMs) {
		let lastError;
		for (let i = 1; i <= attempts; i++) {
			try {
				return await task(i);
			}
			catch (e) {
				lastError = e;
				// Key / 余额 / 参数类错误重试没有意义，直接抛出
				if (e?.wtaNoRetry || i === attempts) {
					break;
				}
				await Zotero.Promise.delay(delayMs * i);
			}
		}
		throw lastError;
	},

	openPreferences() {
		try {
			Zotero.Utilities.Internal.openPreferences(WTA_PREF_PANE_ID);
		}
		catch (e) {
			this.log("Failed to open preferences", e);
		}
	},

	showAlert(window, title, text) {
		Zotero.alert(window || null, title, text);
	},

	copyToClipboard(text) {
		try {
			Zotero.Utilities.Internal.copyTextToClipboard(text);
			return true;
		}
		catch (e) {
			try {
				Components.classes["@mozilla.org/widget/clipboardhelper;1"]
					.getService(Components.interfaces.nsIClipboardHelper)
					.copyString(text);
				return true;
			}
			catch (e2) {
				this.log("Copy to clipboard failed", e2);
				return false;
			}
		}
	},

	// 完整错误信息 + 一键复制，避免进度窗把长文本截断
	showErrorDialog(window, title, message) {
		let text = this.safeText(message);
		try {
			let ps = Services.prompt;
			let flags = ps.BUTTON_POS_0 * ps.BUTTON_TITLE_IS_STRING
				+ ps.BUTTON_POS_1 * ps.BUTTON_TITLE_IS_STRING;
			let index = ps.confirmEx(
				window || null,
				title,
				text,
				flags,
				"确定",
				"复制错误信息",
				null,
				null,
				{}
			);
			if (index === 1) {
				this.copyToClipboard(text);
			}
		}
		catch (e) {
			this.log("showErrorDialog failed, fallback to alert", e);
			this.showAlert(window, title, text);
		}
	},

	openProgressWindow(window, word) {
		let progressWin = new Zotero.ProgressWindow({
			window,
			closeOnClick: false,
		});
		progressWin.changeHeadline("zotero_anki_etymology");
		let itemProgress = new progressWin.ItemProgress(null, `准备导入 ${word}`);
		itemProgress.setItemTypeAndIcon(null, "unfiled");
		progressWin.show();

		return {
			update(text, percent) {
				itemProgress.setText(text);
				if (typeof percent === "number") {
					itemProgress.setProgress(percent);
				}
			},
			success(text) {
				progressWin.changeHeadline("导入完成");
				itemProgress.setText(text);
				itemProgress.setProgress(100);
				progressWin.startCloseTimer(5000);
			},
			info(text) {
				progressWin.changeHeadline("无需重复导入");
				itemProgress.setText(text);
				itemProgress.setProgress(100);
				progressWin.startCloseTimer(5000);
			},
			error(text) {
				progressWin.changeHeadline("导入失败");
				itemProgress.setError();
				// 进度窗高度有限，这里只放摘要，完整信息走弹窗
				let brief = String(text).replace(/\s+/g, " ");
				itemProgress.setText(brief.length > 70 ? `${brief.slice(0, 70)}…（详见弹窗）` : brief);
				progressWin.startCloseTimer(8000);
			},
		};
	},

	getPref(name) {
		return Zotero.Prefs.get(`${WTA_PREF_BRANCH}.${name}`, true);
	},

	safeText(value) {
		return value == null ? "" : String(value).trim();
	},

	escapeHTML(value) {
		return this.safeText(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	},

	log(message, error) {
		Zotero.debug(`${WTA_PLUGIN_NAME}: ${message}`);
		if (error) {
			Zotero.logError(error);
		}
	},
};
