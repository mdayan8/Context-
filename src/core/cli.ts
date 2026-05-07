import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs/promises";
import { scanRepo } from "./scanner.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const program = new Command();

program
  .name("contextos")
  .description("AI memory/context layer for any repository")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize contextOS in the current directory")
  .action(async () => {
    const spinner = ora("Initializing contextOS...").start();
    const config = {
      name: "contextOS-project",
      version: "1.0.0",
      excludes: ["node_modules", ".git"],
    };
    await fs.writeFile("contextos.json", JSON.stringify(config, null, 2));
    spinner.succeed(chalk.green("contextOS initialized! Created contextos.json"));
  });

program
  .command("map")
  .description("Build semantic architecture map")
  .action(async () => {
    const spinner = ora("Scanning repository...").start();
    const paths = await scanRepo();
    spinner.succeed(chalk.blue(`Mapped ${paths.length} files.`));
    console.log(chalk.gray("\nArchitecture Summary:"));
    paths.slice(0, 10).forEach(p => console.log(`  ${chalk.cyan("→")} ${p}`));
    if (paths.length > 10) console.log(`  ... and ${paths.length - 10} more`);
  });

program
  .command("brain")
  .description("Generate repository brain using AI")
  .action(async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.error(chalk.red("GEMINI_API_KEY is required in .env"));
      return;
    }
    const spinner = ora("Generating repo brain...").start();
    
    try {
      const packageJson = JSON.parse(await fs.readFile("package.json", "utf-8"));
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Generate a "repository brain" summary (one paragraph) for this project based on its package.json: ${JSON.stringify(packageJson)}`;
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      await fs.writeFile("memory.json", JSON.stringify({ brain: result.text }, null, 2));
      spinner.succeed(chalk.magenta("Repo brain generated and saved to memory.json"));
    } catch (e) {
      spinner.fail(chalk.red("Failed to generate brain: " + (e as Error).message));
    }
  });

program.parse();
