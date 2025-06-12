import * as path from "path";

import { prompt } from "./output/prompt";
import { findNodeModulesFolders } from "./core/findNodeModulesFolders";
import { unitsFormatter } from "./formatters/unitsFormatter";
import { generateTable } from "./output/generateTable";
import { calculateSizeOfNodeModulesDirs } from "./core/calculateSizeOfNodeModulesDirs";
import { deleteFolders, deleteMessage } from "./core/deleteFolders";
import chalk from "chalk";
import type { PackageJson } from "type-fest";

import { generatePrefix, logger } from "./output/logger";
import { formatExecutionTime } from "./formatters/formatExecutionTime";

import packageJsonRaw from "../package.json";

const packageJson: PackageJson = packageJsonRaw as PackageJson;

const AVAILABLE_ARGS = {
  "--help": "Show help information",
  "--h": "Show help information",
  "--version": "Show package version",
  "--v": "Show package version",
  "--skip-confirmation": "Skip confirmation before deleting folders",
  "--dry": "Dry run of the cleanup process, no folders will be deleted",
};

const CONFIRMATION_RESPONSES = ["yes", "y", "kör bara kör!"];
const DRY_RUN_DELAY_RANGE = { min: 50, max: 150 };

const displayHelp = () => {
  console.log("\nUsage: npx node-modules-cleanup@latest <path> [options]\n");
  console.log("Options:");
  for (const [arg, description] of Object.entries(AVAILABLE_ARGS)) {
    console.log(`  ${arg.padEnd(20)} ${description}`);
  }
  console.log("");
};

const displayVersion = () => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`Version: ${packageJson.version}`);
};

const parseArgs = (args: string[]) => {
  return {
    help: args.includes("--help") || args.includes("--h"),
    empty: args.length < 1,
    skipConfirmation: args.includes("--skip-confirmation"),
    version: args.includes("--version") || args.includes("--v"),
    dry: args.includes("--dry"),
  };
};

const shouldExitEarly = (args: string[]) => {
  const parsedArgs = parseArgs(args);

  if (parsedArgs.help) {
    displayHelp();
    return true;
  }

  if (parsedArgs.version) {
    displayVersion();
    return true;
  }

  if (parsedArgs.empty) {
    logger({
      prefix: "error",
      message: `Path not provided. Please provide a path, e.g ${chalk.italic(
        "npx node-modules-cleanup@latest ./",
      )} for the current folder`,
    });
    return true;
  }

  return false;
};

const buildConfirmationMessage = (isDryRun: boolean) => {
  const baseMessage = `${generatePrefix(
    "info",
  )} Do you want to ${chalk.bold.red("delete")} the above folders?`;
  const confirmationPrompt = chalk.italic("(yes/no) ");

  if (isDryRun) {
      const dryRunNotice = chalk.bold(
        chalk.blue("(this is a dry run, nothing will be deleted)"),
      );
    return `${baseMessage} ${dryRunNotice} ${confirmationPrompt}`;
  }

  return `${baseMessage} ${confirmationPrompt}`;
};

const isConfirmationValid = (answer: string) => {
  return CONFIRMATION_RESPONSES.includes(answer.toLowerCase());
};

const simulateDryRun = async (entries: any[]) => {
  const fakeDelay =
    Math.floor(
      Math.random() * (DRY_RUN_DELAY_RANGE.max - DRY_RUN_DELAY_RANGE.min + 1),
    ) + DRY_RUN_DELAY_RANGE.min;

  entries.forEach((_, i) => {
    setTimeout(() => {
      process.stdout.write(deleteMessage(i + 1, entries.length));
    }, i * fakeDelay);
  });

  await new Promise((resolve) =>
    setTimeout(resolve, fakeDelay * entries.length),
  );
};

const displayResults = (
  totalTime: string,
  entriesCount: number,
  totalSize: number,
) => {
  console.log("");

  logger({
    message: "Successfully deleted all specified node_modules folders",
  });

  logger({
    prefix: "none",
    message: ` ${chalk.bold("Cleanup time:")} ${chalk.green(totalTime)}`,
  });

  logger({
    prefix: "none",
    message: ` ${chalk.bold("Folders deleted:")} ${chalk.green(entriesCount)}`,
  });

  logger({
    prefix: "none",
    message: ` ${chalk.bold("Freed up disk space:")} ${chalk.green(
      unitsFormatter(totalSize),
    )}`,
  });
};

export async function main() {
  const args = process.argv.slice(2);

  if (shouldExitEarly(args)) {
    process.exit(0);
  }

  const { skipConfirmation, dry } = parseArgs(args);
  const targetDir = path.resolve(args[0]);

  // Find node_modules directories
  const nodeModulesDirs = await findNodeModulesFolders(targetDir);
  if (nodeModulesDirs.length === 0) {
    logger({
      prefix: "error",
      message: `No node_modules folders found in the following folder: ${targetDir}`,
    });
    process.exit(0);
  }

  // Calculate sizes and display table
  const { entries, totalSize } = await calculateSizeOfNodeModulesDirs({
    nodeModulesDirs,
  });
  generateTable({ entries, totalSize });

  // Handle user confirmation
  if (!skipConfirmation) {
    const confirmationMessage = buildConfirmationMessage(dry);
    const answer = await prompt(confirmationMessage);

    if (!isConfirmationValid(answer)) {
      logger({
        message:
          "No node_modules folders were deleted. Exiting the cleanup process",
      });
      process.exit(0);
    }
  }

  // Execute deletion or dry run
  const startTime = Date.now();

  if (dry) {
    await simulateDryRun(entries);
  } else {
    await deleteFolders(entries);
  }

  // Display results
  const endTime = Date.now();
  const totalTime = formatExecutionTime(startTime, endTime);
  displayResults(totalTime, entries.length, totalSize);

  process.exit(0);
}
