import * as vscode   from "vscode";
import * as path      from "path";
import { packFiles }          from "./markdownPacker";
import { countTokens, TokenModel } from "./tokenCounter";
import { ContextPackerPanel } from "./panelProvider";

// ── Micromatch is not installed, ship a tiny glob matcher instead ──────────
function matchesAnyPattern(filePath: string, patterns: string[]): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  const base = path.basename(normalized);
  for (const pat of patterns) {
    // Simple patterns: *.ext or prefix/**
    if (pat.startsWith("*.")) {
      const ext = pat.slice(1);
      if (base.endsWith(ext)) return true;
    } else if (pat.endsWith("/**")) {
      const prefix = pat.slice(0, -3);
      if (normalized.includes("/" + prefix + "/") || normalized.includes(prefix + "/")) return true;
    } else if (base === pat) {
      return true;
    }
  }
  return false;
}

let panel: ContextPackerPanel | undefined;
let lastMarkdown = "";

export function activate(context: vscode.ExtensionContext): void {

  // ── Command: Pack Selected ───────────────────────────────────────────────
  const packCmd = vscode.commands.registerCommand(
    "contextPacker.packSelected",
    async (clickedUri: vscode.Uri, selectedUris: vscode.Uri[]) => {

      // VS Code passes multiselection in `selectedUris`; fallback to single
      const uris: vscode.Uri[] = selectedUris?.length
        ? selectedUris
        : clickedUri
        ? [clickedUri]
        : [];

      if (uris.length === 0) {
        vscode.window.showWarningMessage(
          "Context Packer: No files selected. Hold Ctrl and click files in the Explorer first."
        );
        return;
      }

      const cfg = vscode.workspace.getConfiguration("contextPacker");
      const maxFileSizeKb: number   = cfg.get("maxFileSize",      500);
      const includeTree: boolean    = cfg.get("includeTree",      true);
      const wrapInXml: boolean      = cfg.get("wrapInXml",        false);
      const tokenModel: TokenModel  = cfg.get("tokenModel",       "cl100k");
      const excludePatterns: string[] = cfg.get("excludePatterns", []);

      // Resolve workspace root
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
      const projectName   = workspaceRoot ? path.basename(workspaceRoot) : "Project";

      // Filter by exclude patterns
      const filePaths = uris
        .map((u) => u.fsPath)
        .filter((fp) => !matchesAnyPattern(fp, excludePatterns));

      if (filePaths.length === 0) {
        vscode.window.showWarningMessage("Context Packer: All selected files match exclusion patterns.");
        return;
      }

      const result = await vscode.window.withProgress(
        {
          location:  vscode.ProgressLocation.Notification,
          title:     "Context Packer",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: `Packing ${filePaths.length} file(s)…` });
          return packFiles({ filePaths, workspaceRoot, maxFileSizeKb, includeTree, wrapInXml, projectName });
        }
      );

      lastMarkdown = result.markdown;

      // Copy to clipboard
      await vscode.env.clipboard.writeText(result.markdown);

      // Count tokens
      const stats = countTokens(result.markdown, tokenModel);

      // Show / update panel
      if (!panel) {
        panel = ContextPackerPanel.createOrShow(context.extensionUri);
      }

      const relPaths = filePaths
        .filter((fp) => !result.skipped.some((s) => s.path === fp))
        .map((fp) => workspaceRoot ? path.relative(workspaceRoot, fp) : fp);

      panel.updateStats(
        stats,
        relPaths.length,
        result.skipped.length,
        relPaths,
        result.markdown,
      );

      // Status bar notification
      const tokenStr = stats.estimatedTokens >= 1000
        ? (stats.estimatedTokens / 1000).toFixed(1) + "k"
        : stats.estimatedTokens.toString();

      const msg = result.skipped.length > 0
        ? `📦 Copied! ~${tokenStr} tokens · ${result.skipped.length} file(s) skipped`
        : `📦 Copied! ~${tokenStr} tokens`;

      vscode.window.showInformationMessage(msg);
    }
  );

  // ── Command: Open Panel ──────────────────────────────────────────────────
  const showPanelCmd = vscode.commands.registerCommand(
    "contextPacker.showPanel",
    () => {
      if (!panel) {
        panel = ContextPackerPanel.createOrShow(context.extensionUri);
      }
    }
  );

  // ── Status bar item ──────────────────────────────────────────────────────
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text      = "$(clippy) Pack";
  statusBar.tooltip   = "Context Packer: Open Panel";
  statusBar.command   = "contextPacker.showPanel";
  statusBar.show();

  context.subscriptions.push(packCmd, showPanelCmd, statusBar);
}

export function deactivate(): void {
  panel?.dispose();
}
