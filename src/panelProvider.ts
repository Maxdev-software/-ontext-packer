import * as vscode from "vscode";
import { TokenStats, formatTokenCount } from "./tokenCounter";

export class ContextPackerPanel {
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getInitialHtml();
  }

  public static createOrShow(extensionUri: vscode.Uri): ContextPackerPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const panel = vscode.window.createWebviewPanel(
      "contextPackerPanel",
      "Context Packer",
      column || vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    return new ContextPackerPanel(panel, extensionUri);
  }

  public updateStats(
    stats: TokenStats,
    fileCount: number,
    skippedCount: number,
    filePaths: string[],
    markdown: string,
  ): void {
    this._panel.webview.postMessage({
      type: "update",
      stats,
      fileCount,
      skippedCount,
      filePaths,
      charCount:   stats.characters,
      wordCount:   stats.words,
      lineCount:   stats.lines,
      tokenCount:  stats.estimatedTokens,
      tokenStr:    formatTokenCount(stats.estimatedTokens),
      costBand:    stats.costBand,
      markdownLen: markdown.length,
    });
  }

  public dispose(): void {
    this._panel.dispose();
    while (this._disposables.length) {
      this._disposables.pop()?.dispose();
    }
  }

  private _getInitialHtml(): string {
    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Context Packer</title>
<style>
  :root {
    --bg:        var(--vscode-editor-background);
    --surface:   var(--vscode-sideBar-background, #1e1e1e);
    --border:    var(--vscode-panel-border, #333);
    --text:      var(--vscode-editor-foreground, #ccc);
    --muted:     var(--vscode-descriptionForeground, #888);
    --accent:    var(--vscode-activityBarBadge-background, #007acc);
    --green:     #3fb950;
    --yellow:    #d29922;
    --orange:    #e3702a;
    --red:       #f85149;
    --radius:    6px;
    --mono:      var(--vscode-editor-font-family, monospace);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--vscode-font-family, system-ui, sans-serif);
    font-size: 13px;
    padding: 16px;
    min-height: 100vh;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }
  .logo { font-size: 22px; }
  .title { font-size: 15px; font-weight: 600; letter-spacing: 0.02em; }
  .subtitle { font-size: 11px; color: var(--muted); margin-top: 1px; }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: var(--muted);
    text-align: center;
  }
  .empty-state .big-icon { font-size: 40px; opacity: 0.5; }
  .empty-state p { font-size: 12px; line-height: 1.6; max-width: 260px; }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 12px;
  }
  .stat-card .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .stat-card .value {
    font-family: var(--mono);
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    line-height: 1;
  }
  .stat-card.token-card {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
  }
  .stat-card.token-card .value { font-size: 28px; }
  .band-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 4px;
    background: var(--accent);
    color: #fff;
  }
  .band-tiny   { background: var(--green); }
  .band-small  { background: var(--green); }
  .band-medium { background: var(--yellow); }
  .band-large  { background: var(--orange); }
  .band-huge   { background: var(--red); }

  .context-bar-wrap {
    margin-bottom: 16px;
  }
  .context-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--muted);
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .context-bar {
    height: 6px;
    background: var(--surface);
    border-radius: 3px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .context-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease, background 0.3s ease;
    background: var(--green);
  }

  .file-list {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 8px;
    margin-bottom: 16px;
    max-height: 180px;
    overflow-y: auto;
  }
  .file-list .file-list-header {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin-bottom: 6px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--border);
  }
  .file-item {
    font-family: var(--mono);
    font-size: 11px;
    padding: 2px 4px;
    border-radius: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text);
    opacity: 0.85;
  }
  .file-item:hover { opacity: 1; background: rgba(255,255,255,0.05); }
  .file-item::before { content: "📄 "; font-size: 10px; }

  .copied-toast {
    display: none;
    background: var(--green);
    color: #fff;
    border-radius: var(--radius);
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 10px;
    animation: fadeInOut 2s ease forwards;
  }
  @keyframes fadeInOut {
    0%   { opacity: 0; transform: translateY(-4px); }
    15%  { opacity: 1; transform: translateY(0); }
    75%  { opacity: 1; }
    100% { opacity: 0; }
  }

  .tip {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.6;
    padding: 10px 12px;
    background: var(--surface);
    border-radius: var(--radius);
    border-left: 3px solid var(--accent);
  }
  .tip code {
    font-family: var(--mono);
    background: rgba(255,255,255,0.08);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 10px;
  }

  .hidden { display: none !important; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">📦</div>
  <div>
    <div class="title">Context Packer</div>
    <div class="subtitle">Select files → right-click → Pack</div>
  </div>
</div>

<div id="empty-state" class="empty-state">
  <div class="big-icon">🗂️</div>
  <p>Hold <strong>Ctrl</strong> and click files in the Explorer, then right-click → <strong>Context Packer: Pack Selected Files</strong></p>
</div>

<div id="result-state" class="hidden">
  <div id="copied-toast" class="copied-toast">✅ Copied to clipboard!</div>

  <div class="stats-grid">
    <div class="stat-card token-card">
      <div>
        <div class="label">Estimated Tokens</div>
        <div class="value" id="token-count">—</div>
      </div>
      <div class="band-badge" id="band-badge">—</div>
    </div>
    <div class="stat-card">
      <div class="label">Characters</div>
      <div class="value" id="char-count">—</div>
    </div>
    <div class="stat-card">
      <div class="label">Words</div>
      <div class="value" id="word-count">—</div>
    </div>
    <div class="stat-card">
      <div class="label">Lines</div>
      <div class="value" id="line-count">—</div>
    </div>
    <div class="stat-card">
      <div class="label">Files</div>
      <div class="value" id="file-count">—</div>
    </div>
  </div>

  <div class="context-bar-wrap">
    <div class="context-bar-label">
      <span>Context usage</span>
      <span id="context-pct">0%</span>
    </div>
    <div class="context-bar">
      <div class="context-bar-fill" id="context-fill" style="width:0%"></div>
    </div>
  </div>

  <div class="file-list" id="file-list">
    <div class="file-list-header">Packed Files</div>
    <div id="file-items"></div>
  </div>

  <div class="tip">
    The Markdown has been <strong>copied to clipboard</strong>. Paste it directly into your AI chat — or run <code>Pack</code> again to refresh.
  </div>
</div>

<script>
  const vscode = acquireVsCodeApi();

  const CONTEXT_SIZES = {
    cl100k: 128_000,
    o200k:  200_000,
    gpt2:    4_096,
  };

  function fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000)     return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "k";
    return n.toLocaleString();
  }

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (msg.type !== "update") return;

    document.getElementById("empty-state").classList.add("hidden");
    document.getElementById("result-state").classList.remove("hidden");

    // Stats
    document.getElementById("token-count").textContent = fmt(msg.tokenCount);
    document.getElementById("char-count").textContent  = fmt(msg.charCount);
    document.getElementById("word-count").textContent  = fmt(msg.wordCount);
    document.getElementById("line-count").textContent  = fmt(msg.lineCount);
    document.getElementById("file-count").textContent  = msg.fileCount;

    // Band badge
    const badge = document.getElementById("band-badge");
    badge.textContent = msg.costBand.toUpperCase();
    badge.className = "band-badge band-" + msg.costBand;

    // Context bar
    const ctxSize = CONTEXT_SIZES[msg.stats.model] || 128_000;
    const pct = Math.min(100, (msg.tokenCount / ctxSize) * 100);
    const fill = document.getElementById("context-fill");
    fill.style.width = pct.toFixed(1) + "%";
    fill.style.background = pct < 40 ? "var(--green)"
                          : pct < 75 ? "var(--yellow)"
                          :             "var(--red)";
    document.getElementById("context-pct").textContent = pct.toFixed(1) + "%";

    // File list
    const container = document.getElementById("file-items");
    container.innerHTML = "";
    (msg.filePaths || []).forEach((p) => {
      const div = document.createElement("div");
      div.className = "file-item";
      div.textContent = p;
      div.title = p;
      container.appendChild(div);
    });

    // Toast
    const toast = document.getElementById("copied-toast");
    toast.style.display = "block";
    toast.style.animation = "none";
    void toast.offsetHeight; // reflow
    toast.style.animation = "";
    setTimeout(() => { toast.style.display = "none"; }, 2200);
  });
</script>
</body>
</html>`;
  }
}
