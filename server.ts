import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { globby } from "globby";
import ignore from "ignore";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Core API for contextOS - File System Operations
  app.get("/api/scan", async (req, res) => {
    try {
      const ig = ignore();
      try {
        const gitignore = await fs.readFile(".gitignore", "utf-8");
        ig.add(gitignore);
      } catch (e) {
        // No gitignore
      }
      ig.add(["node_modules", ".git", "dist", "package-lock.json", ".env"]);

      const paths = await globby(["**/*"], {
        dot: true,
        gitignore: true,
      });

      const filteredPaths = paths.filter(p => !ig.ignores(p));
      res.json({ paths: filteredPaths });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/read-files", async (req, res) => {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: "Invalid files" });
    }

    try {
      const contents = await Promise.all(
        files.map(async (f) => {
          try {
            const content = await fs.readFile(f, "utf-8");
            return { path: f, content: content.slice(0, 5000) };
          } catch (e) {
            return { path: f, content: "Error reading file" };
          }
        })
      );
      res.json({ contents });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/meta", async (req, res) => {
    try {
      const packageJson = JSON.parse(await fs.readFile("package.json", "utf-8"));
      const metadata = JSON.parse(await fs.readFile("metadata.json", "utf-8"));
      res.json({ packageJson, metadata });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
