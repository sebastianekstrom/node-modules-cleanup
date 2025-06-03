#!/usr/bin/env bun

import { execSync } from "child_process";
import chalk from "chalk";

const args = process.argv.slice(2);
const versionType = args.length > 0 ? args[0] : "patch"; // patch, minor, major

if (!["patch", "minor", "major"].includes(versionType)) {
  console.error(
    chalk.red("❌ Invalid version type. Use: patch, minor, or major"),
  );
  process.exit(1);
}

// Check if we're on the main branch
const currentBranch = execSync("git branch --show-current", {
  encoding: "utf8",
}).trim();
if (currentBranch !== "main") {
  console.error(
    chalk.red(
      `❌ You must be on the "main" branch to publish. Currently on: ${currentBranch}`,
    ),
  );
  process.exit(1);
}

console.log(chalk.blue("🚀 Starting publish process...\n"));

try {
  // Step 1: Run tests
  console.log(chalk.yellow("📋 Running tests..."));
  execSync("bun run test --run", { stdio: "inherit" });
  console.log(chalk.green("✅ Tests passed\n"));

  // Step 2: TypeScript compilation check
  console.log(chalk.yellow("🔍 Checking TypeScript compilation..."));
  execSync("bun run tsc", { stdio: "inherit" });
  console.log(chalk.green("✅ TypeScript compilation passed\n"));

  // Step 3: Build
  console.log(chalk.yellow("🔨 Building project..."));
  execSync("bun run build", { stdio: "inherit" });
  console.log(chalk.green("✅ Build completed\n"));

  // Step 4: Version bump
  console.log(chalk.yellow(`📦 Bumping ${versionType} version...`));
  execSync(`npm version ${versionType}`, { stdio: "inherit" });
  console.log(chalk.green("✅ Version bumped\n"));

  // Step 5: Publish
  console.log(chalk.yellow("🚀 Publishing to npm..."));
  execSync("npm publish", { stdio: "inherit" });
  console.log(chalk.green("✅ Published successfully\n"));

  // Step 6: Push to git
  console.log(chalk.yellow("📤 Pushing to git..."));
  execSync("git push origin main --follow-tags", { stdio: "inherit" });
  console.log(chalk.green("✅ Pushed to git\n"));

  console.log(chalk.bold.green("🎉 Publish process completed successfully!"));
} catch (error) {
  console.error(chalk.red("❌ Publish process failed:"));
  console.error(error);
  process.exit(1);
}
