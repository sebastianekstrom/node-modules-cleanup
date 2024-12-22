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

const displayHelp = () => {
  console.log("\nUsage: npx node-modules-cleanup@latest <path> [options]\n");
  console.log("Options:");
  for (const [arg, description] of Object.entries(AVAILABLE_ARGS)) {
    console.log(`  ${arg.padEnd(20)} ${description}`);
  }
  console.log("");
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

export async function main() {
  const args = process.argv.slice(2);
  const { help, empty, skipConfirmation, version, dry } = parseArgs(args);

  if (help) {
    displayHelp();
    process.exit(0);
  }

  if (version) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Version: ${packageJson.version}`);
    process.exit(0);
  }

  if (empty) {
    logger({
      prefix: "error",
      message: `Path not provided. Please provide a path, e.g ${chalk.italic(
        "npx node-modules-cleanup@latest ./",
      )} for the current folder`,
    });
    process.exit(0);
  }

  const targetDir = path.resolve(args[0]);

  const nodeModulesDirs = await findNodeModulesFolders(targetDir);
  if (nodeModulesDirs.length === 0) {
    logger({
      prefix: "error",
      message: `No node_modules folders found in the following folder: ${targetDir}`,
    });

    process.exit(0);
  }

  const { entries, totalSize } = calculateSizeOfNodeModulesDirs({
    nodeModulesDirs,
  });

  generateTable({ entries, totalSize });

  if (!skipConfirmation) {
    const baseMessage = `${generatePrefix(
      "info",
    )} Do you want to ${chalk.bold.red("delete")} the above folders?`;
    const confirmationMessage = `${chalk.italic("(yes/no)")}`;
    const dryMessage = dry
      ? `${chalk.bold(
          chalk.blue("(this is a dry, run nothing will be deleted)"),
        )}`
      : "";

    const promptMessage = dry
      ? `${baseMessage} ${dryMessage} ${confirmationMessage}`
      : `${baseMessage} ${confirmationMessage}`;

    const answer = await prompt(promptMessage);

    if (
      answer.toLowerCase() !== "yes" &&
      answer.toLowerCase() !== "y" &&
      answer.toLowerCase() !== "kör bara kör!"
    ) {
      logger({
        message:
          "No node_modules folders were deleted. Exiting the cleanup process",
      });
      process.exit(0);
    }
  }

  const startTime = Date.now();

  if (!dry) {
    await deleteFolders(entries);
  } else {
    // Random delay between 50 and 150
    const fakeDelay = Math.floor(Math.random() * 101) + 50;
    entries.forEach((_, i) => {
      setTimeout(() => {
        process.stdout.write(deleteMessage(i + 1, entries.length));
      }, i * fakeDelay);
    });

    await new Promise((resolve) =>
      setTimeout(resolve, fakeDelay * entries.length),
    );
  }

  console.log("");
  const endTime = Date.now();
  const totalTime = formatExecutionTime(startTime, endTime);

  logger({
    message: "Successfully deleted all specified node_modules folders",
  });

  logger({
    prefix: "none",
    message: ` ${chalk.bold("Cleanup time:")} ${chalk.green(totalTime)}`,
  });

  logger({
    prefix: "none",
    message: ` ${chalk.bold("Folders deleted:")} ${chalk.green(
      entries.length,
    )}`,
  });

  logger({
    prefix: "none",
    message: ` ${chalk.bold("Freed up disk space:")} ${chalk.green(
      unitsFormatter(totalSize),
    )}`,
  });

  process.exit(0);
}
