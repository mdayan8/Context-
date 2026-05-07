import fs from "fs/promises";
import path from "path";
import { globby } from "globby";
import ignore from "ignore";

export async function scanRepo(root: string = ".") {
  const ig = ignore();
  try {
    const gitignore = await fs.readFile(path.join(root, ".gitignore"), "utf-8");
    ig.add(gitignore);
  } catch (e) {}
  ig.add(["node_modules", ".git", "dist", "package-lock.json"]);

  const paths = await globby(["**/*"], {
    cwd: root,
    dot: true,
    gitignore: true,
  });

  return paths.filter(p => !ig.ignores(p));
}

export function buildTree(paths: string[]) {
  const tree: any = {};
  paths.forEach(p => {
    const parts = p.split("/");
    let current = tree;
    parts.forEach((part, i) => {
      if (!current[part]) {
        current[part] = i === parts.length - 1 ? { type: "file" } : { type: "folder", children: {} };
      }
      current = current[part].children || current[part];
    });
  });
  return tree;
}
