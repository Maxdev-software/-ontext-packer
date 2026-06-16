import * as fs   from "fs";
import * as path from "path";
import { buildTree, renderTree, flatRelativePaths } from "./treeBuilder";

export interface PackOptions {
  filePaths:     string[];
  workspaceRoot: string;
  maxFileSizeKb: number;
  includeTree:   boolean;
  wrapInXml:     boolean;
  projectName:   string;
}

export interface PackResult {
  markdown: string;
  skipped:  { path: string; reason: string }[];
}

const EXT_TO_LANG: Record<string, string> = {
  ts:    "typescript",
  tsx:   "typescript",
  js:    "javascript",
  jsx:   "javascript",
  mjs:   "javascript",
  cjs:   "javascript",
  py:    "python",
  rb:    "ruby",
  go:    "go",
  rs:    "rust",
  cs:    "csharp",
  java:  "java",
  cpp:   "cpp",
  cc:    "cpp",
  cxx:   "cpp",
  c:     "c",
  h:     "c",
  hpp:   "cpp",
  php:   "php",
  swift: "swift",
  kt:    "kotlin",
  dart:  "dart",
  scala: "scala",
  r:     "r",
  sh:    "bash",
  bash:  "bash",
  zsh:   "bash",
  fish:  "bash",
  ps1:   "powershell",
  yaml:  "yaml",
  yml:   "yaml",
  json:  "json",
  jsonc: "json",
  toml:  "toml",
  xml:   "xml",
  html:  "html",
  htm:   "html",
  css:   "css",
  scss:  "scss",
  sass:  "scss",
  less:  "less",
  md:    "markdown",
  mdx:   "markdown",
  sql:   "sql",
  graphql: "graphql",
  gql:   "graphql",
  proto: "protobuf",
  tf:    "hcl",
  hcl:   "hcl",
  lua:   "lua",
  vim:   "vim",
  env:   "bash",
  ini:   "ini",
  cfg:   "ini",
  conf:  "nginx",
  dockerfile: "dockerfile",
};

function getLang(filePath: string): string {
  const base = path.basename(filePath).toLowerCase();
  if (base === "dockerfile") return "dockerfile";
  if (base === "makefile")   return "makefile";
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return EXT_TO_LANG[ext] || ext || "text";
}

function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const binaryExts = new Set([
    "png","jpg","jpeg","gif","webp","ico","bmp","tiff","svg",
    "pdf","doc","docx","xls","xlsx","ppt","pptx",
    "zip","tar","gz","bz2","xz","7z","rar",
    "exe","dll","so","dylib","class","pyc","wasm",
    "mp3","mp4","wav","ogg","avi","mkv","mov",
    "ttf","otf","woff","woff2","eot",
    "db","sqlite","sqlite3",
  ]);
  return !binaryExts.has(ext);
}

export function packFiles(options: PackOptions): PackResult {
  const { filePaths, workspaceRoot, maxFileSizeKb, includeTree, wrapInXml, projectName } = options;
  const skipped: PackResult["skipped"] = [];
  const validPaths: string[] = [];

  for (const fp of filePaths) {
    try {
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        skipped.push({ path: fp, reason: "directory" });
        continue;
      }
      if (stat.size > maxFileSizeKb * 1024) {
        skipped.push({ path: fp, reason: `exceeds ${maxFileSizeKb} KB (${Math.round(stat.size / 1024)} KB)` });
        continue;
      }
      if (!isTextFile(fp)) {
        skipped.push({ path: fp, reason: "binary file" });
        continue;
      }
      validPaths.push(fp);
    } catch {
      skipped.push({ path: fp, reason: "unreadable" });
    }
  }

  const sections: string[] = [];
  const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  // ── Header ────────────────────────────────────────────────────────────────
  sections.push(
    `# Context Pack — ${projectName}`,
    ``,
    `> Packed by **Context Packer** · ${now}  `,
    `> Files: **${validPaths.length}** · Skipped: **${skipped.length}**`,
    ``,
  );

  // ── File tree ─────────────────────────────────────────────────────────────
  if (includeTree && validPaths.length > 0) {
    const tree = buildTree(validPaths, workspaceRoot);
    sections.push(
      `## File Tree`,
      ``,
      "```",
      renderTree(tree),
      "```",
      ``,
    );
  }

  // ── Flat path list ────────────────────────────────────────────────────────
  if (validPaths.length > 1) {
    const relPaths = flatRelativePaths(validPaths, workspaceRoot);
    sections.push(
      `## Files Included`,
      ``,
      relPaths.map((p) => `- \`${p}\``).join("\n"),
      ``,
    );
  }

  sections.push(`---`, ``);

  // ── File contents ─────────────────────────────────────────────────────────
  sections.push(`## File Contents`, ``);

  for (const fp of validPaths) {
    const relPath = path.relative(workspaceRoot, fp);
    const lang    = getLang(fp);
    let content: string;

    try {
      content = fs.readFileSync(fp, "utf8");
    } catch {
      skipped.push({ path: fp, reason: "read error" });
      continue;
    }

    if (wrapInXml) {
      sections.push(
        `### \`${relPath}\``,
        ``,
        `<file path="${relPath}">`,
        content,
        `</file>`,
        ``,
      );
    } else {
      sections.push(
        `### \`${relPath}\``,
        ``,
        "```" + lang,
        content,
        "```",
        ``,
      );
    }
  }

  // ── Skipped notice ────────────────────────────────────────────────────────
  if (skipped.length > 0) {
    sections.push(
      `---`,
      ``,
      `## Skipped (${skipped.length})`,
      ``,
      skipped.map((s) => `- \`${s.path}\` — ${s.reason}`).join("\n"),
      ``,
    );
  }

  return {
    markdown: sections.join("\n"),
    skipped,
  };
}
