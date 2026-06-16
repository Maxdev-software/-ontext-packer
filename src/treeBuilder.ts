import * as path from "path";

export interface FileNode {
  name: string;
  relativePath: string;
  absolutePath: string;
  isDirectory: boolean;
  children: FileNode[];
}

/**
 * Build a tree from a flat list of absolute file paths.
 * Infers intermediate directories automatically.
 */
export function buildTree(absolutePaths: string[], workspaceRoot: string): FileNode {
  const root: FileNode = {
    name: path.basename(workspaceRoot),
    relativePath: ".",
    absolutePath: workspaceRoot,
    isDirectory: true,
    children: [],
  };

  const nodeMap = new Map<string, FileNode>();
  nodeMap.set(workspaceRoot, root);

  function ensureDir(dirPath: string): FileNode {
    if (nodeMap.has(dirPath)) {
      return nodeMap.get(dirPath)!;
    }
    const parentPath = path.dirname(dirPath);
    const parent = parentPath === dirPath ? root : ensureDir(parentPath);
    const node: FileNode = {
      name: path.basename(dirPath),
      relativePath: path.relative(workspaceRoot, dirPath),
      absolutePath: dirPath,
      isDirectory: true,
      children: [],
    };
    parent.children.push(node);
    nodeMap.set(dirPath, node);
    return node;
  }

  for (const absPath of absolutePaths) {
    const dirPath = path.dirname(absPath);
    const parent  = ensureDir(dirPath);
    const node: FileNode = {
      name: path.basename(absPath),
      relativePath: path.relative(workspaceRoot, absPath),
      absolutePath: absPath,
      isDirectory: false,
      children: [],
    };
    // Avoid duplicates
    if (!parent.children.some((c) => c.absolutePath === absPath)) {
      parent.children.push(node);
    }
    nodeMap.set(absPath, node);
  }

  // Sort: dirs first, then files, both alphabetically
  function sortNode(n: FileNode): void {
    n.children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sortNode);
  }
  sortNode(root);

  return root;
}

/**
 * Render tree as ASCII art (similar to the `tree` command).
 */
export function renderTree(node: FileNode, prefix = "", isLast = true): string {
  const connector = isLast ? "└── " : "├── ";
  const icon      = node.isDirectory ? "📁 " : "📄 ";
  const line      = prefix + (prefix === "" ? "" : connector) + icon + node.name;

  const childPrefix = prefix + (prefix === "" ? "" : isLast ? "    " : "│   ");
  const children    = node.children
    .map((child, i) => renderTree(child, childPrefix, i === node.children.length - 1))
    .join("\n");

  return children ? line + "\n" + children : line;
}

/**
 * Render a flat list of relative paths for the header summary.
 */
export function flatRelativePaths(absolutePaths: string[], workspaceRoot: string): string[] {
  return absolutePaths
    .map((p) => path.relative(workspaceRoot, p))
    .sort();
}
