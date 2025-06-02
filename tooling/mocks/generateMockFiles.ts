import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { adjectives, animals, subjectives } from "./dictionary";

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith("--mode="));
const mode = modeArg?.split("=")[1] ?? "simple";

console.log(`${chalk.yellow("◉")} Running in ${chalk.bold(mode)} mode`);

const MOCK_LOCATION = "mock";
const MIN_FILE_SIZE_KB = 1;
const MAX_FILE_SIZE_KB = 10;

let MIN_FOLDERS_CREATED: number;
let MAX_FOLDERS_CREATE: number;
let MIN_FILES_PER_FOLDER: number;
let MAX_FILES_PER_FOLDER: number;
let MIN_SUBDIRS_PER_FOLDER: number;
let MAX_SUBDIRS_PER_FOLDER: number;

if (mode === "complex") {
  MIN_FOLDERS_CREATED = 100;
  MAX_FOLDERS_CREATE = 200;
  MIN_FILES_PER_FOLDER = 15;
  MAX_FILES_PER_FOLDER = 75;
  MIN_SUBDIRS_PER_FOLDER = 3;
  MAX_SUBDIRS_PER_FOLDER = 12;
} else {
  MIN_FOLDERS_CREATED = 40;
  MAX_FOLDERS_CREATE = 60;
  MIN_FILES_PER_FOLDER = 15;
  MAX_FILES_PER_FOLDER = 30;
  MIN_SUBDIRS_PER_FOLDER = 4;
  MAX_SUBDIRS_PER_FOLDER = 8;
}

const cleanMockFolder = () => {
  const mockFolderPath = path.resolve(MOCK_LOCATION);
  if (fs.existsSync(mockFolderPath)) {
    console.log(`${chalk.red("◉")} Removed existing mock folder`);
    fs.rmSync(mockFolderPath, { recursive: true, force: true });
  }
};

const generateMockFiles = () => {
  cleanMockFolder();

  const numberOfFolders =
    Math.floor(Math.random() * (MAX_FOLDERS_CREATE - MIN_FOLDERS_CREATED + 1)) +
    MIN_FOLDERS_CREATED;

  console.log(`${chalk.blue("◉")} Creating ${numberOfFolders} mock folders...`);

  Array.from({ length: numberOfFolders }).forEach((_, folderIndex) => {
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomSubjective =
      subjectives[Math.floor(Math.random() * subjectives.length)];
    const folderName = `${randomAdjective}${randomAnimal}${randomSubjective}`;

    const tmpDir = path.resolve(`${MOCK_LOCATION}/${folderName}`);
    const nodeModulesDir = path.join(tmpDir, "node_modules");

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    if (!fs.existsSync(nodeModulesDir)) {
      fs.mkdirSync(nodeModulesDir);
    }

    const numberOfSubdirs =
      Math.floor(
        Math.random() * (MAX_SUBDIRS_PER_FOLDER - MIN_SUBDIRS_PER_FOLDER + 1),
      ) + MIN_SUBDIRS_PER_FOLDER;

    for (let subDirIndex = 0; subDirIndex < numberOfSubdirs; subDirIndex++) {
      const subDirName = `package-${subDirIndex}`;
      const subDir = path.join(nodeModulesDir, subDirName);

      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }

      const nestedDirs = ["lib", "src", "dist", "types"];
      nestedDirs.forEach((nestedDir) => {
        const nestedPath = path.join(subDir, nestedDir);
        if (!fs.existsSync(nestedPath)) {
          fs.mkdirSync(nestedPath, { recursive: true });
        }

        const filesInNested = Math.floor(Math.random() * 5) + 1;
        for (let fileIndex = 0; fileIndex < filesInNested; fileIndex++) {
          const fileSizeKB =
            Math.floor(
              Math.random() * (MAX_FILE_SIZE_KB - MIN_FILE_SIZE_KB + 1),
            ) + MIN_FILE_SIZE_KB;
          const fileSize = fileSizeKB * 1024;

          const fileName = `file_${fileIndex}.${
            nestedDir === "types" ? "d.ts" : "js"
          }`;
          const filePath = path.join(nestedPath, fileName);
          const buffer = Buffer.alloc(fileSize);
          fs.writeFileSync(filePath, buffer);
        }
      });

      const numberOfFiles =
        Math.floor(
          Math.random() * (MAX_FILES_PER_FOLDER - MIN_FILES_PER_FOLDER + 1),
        ) + MIN_FILES_PER_FOLDER;

      for (let fileIndex = 0; fileIndex < numberOfFiles; fileIndex++) {
        const fileSizeKB =
          Math.floor(
            Math.random() * (MAX_FILE_SIZE_KB - MIN_FILE_SIZE_KB + 1),
          ) + MIN_FILE_SIZE_KB;
        const fileSize = fileSizeKB * 1024;

        const extensions = ["js", "json", "md", "ts", "css"];
        const extension =
          extensions[Math.floor(Math.random() * extensions.length)];
        const fileName = `file_${fileIndex}.${extension}`;
        const filePath = path.join(subDir, fileName);
        const buffer = Buffer.alloc(fileSize);
        fs.writeFileSync(filePath, buffer);
      }

      const packageJson = {
        name: `mock-package-${subDirIndex}`,
        version: "1.0.0",
        main: "index.js",
      };
      fs.writeFileSync(
        path.join(subDir, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );
    }

    if ((folderIndex + 1) % 10 === 0) {
      console.log(
        `${chalk.blue("◉")} Created ${
          folderIndex + 1
        }/${numberOfFolders} folders...`,
      );
    }
  });
  console.log("");

  console.log(
    `${chalk.green(
      "◉",
    )} Successfully mocked node_modules created in the ${chalk.italic(
      "./mock",
    )} folder`,
  );
  console.log("");
  console.log(
    `${chalk.blue("◉")} Run ${chalk.italic(
      "bun run dev ./mock",
    )} to run the script`,
  );
};

generateMockFiles();
