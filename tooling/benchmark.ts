import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execSync } from "node:child_process";

const README_PATH = path.resolve(process.cwd(), "README.md");
const BENCHMARK_START = "<!-- BENCHMARK:START -->";
const BENCHMARK_END = "<!-- BENCHMARK:END -->";

const FOLDER_COUNT = 50;
const PACKAGES_PER_FOLDER = 12;
const NESTED_NODE_MODULES_DEPTH = 2;
const NESTED_PACKAGES_PER_LEVEL = 3;
const SOURCE_DIRS = ["lib", "src", "dist", "types"];
const FILES_PER_DIR = 6;
const FILE_SIZE_BYTES = 8 * 1024; // 8KB per file

function updateReadme(duration: string): void {
  const readme = fs.readFileSync(README_PATH, "utf-8");

  const benchmarkSection = `${BENCHMARK_START}
| Configuration | Value |
| ------------- | ----- |
| Projects | ${FOLDER_COUNT} |
| Packages per project | ${PACKAGES_PER_FOLDER} |
| Nested node_modules depth | ${NESTED_NODE_MODULES_DEPTH} |
| Files per package | ${SOURCE_DIRS.length * FILES_PER_DIR} |

**Duration: ${duration}**

*Tested on MacBook Pro M1 Pro, 16GB RAM*
${BENCHMARK_END}`;

  let updatedReadme: string;
  if (readme.includes(BENCHMARK_START)) {
    const regex = new RegExp(
      `${BENCHMARK_START}[\\s\\S]*?${BENCHMARK_END}`,
      "g",
    );
    updatedReadme = readme.replace(regex, benchmarkSection);
  } else {
    updatedReadme = readme + "\n## Benchmark\n\n" + benchmarkSection + "\n";
  }

  fs.writeFileSync(README_PATH, updatedReadme);
}

function createPackageFiles(packageDir: string): void {
  for (const sourceDir of SOURCE_DIRS) {
    const dirPath = path.join(packageDir, sourceDir);
    fs.mkdirSync(dirPath, { recursive: true });

    for (let k = 0; k < FILES_PER_DIR; k++) {
      const ext = sourceDir === "types" ? "d.ts" : "js";
      const filePath = path.join(dirPath, `file_${k}.${ext}`);
      fs.writeFileSync(filePath, new Uint8Array(FILE_SIZE_BYTES));
    }
  }
}

function createNestedNodeModules(
  baseDir: string,
  depth: number,
  packagesCount: number,
): void {
  if (depth <= 0) return;

  const nodeModulesDir = path.join(baseDir, "node_modules");

  for (let i = 0; i < packagesCount; i++) {
    const packageDir = path.join(nodeModulesDir, `nested-pkg-${depth}-${i}`);
    createPackageFiles(packageDir);

    createNestedNodeModules(packageDir, depth - 1, NESTED_PACKAGES_PER_LEVEL);
  }
}

function generateMockData(targetDir: string): void {
  for (let i = 0; i < FOLDER_COUNT; i++) {
    const folderName = `project-${String(i).padStart(3, "0")}`;
    const nodeModulesDir = path.join(targetDir, folderName, "node_modules");

    for (let j = 0; j < PACKAGES_PER_FOLDER; j++) {
      const packageDir = path.join(nodeModulesDir, `package-${j}`);
      createPackageFiles(packageDir);

      if (j < 5) {
        createNestedNodeModules(
          packageDir,
          NESTED_NODE_MODULES_DEPTH,
          NESTED_PACKAGES_PER_LEVEL,
        );
      }
    }
  }
}

function benchmark() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "benchmark-"));

  console.log(`\nBenchmarking node-modules-cleanup`);
  console.log("=".repeat(50));

  try {
    // Step 1: Generate mock data
    console.log("\n[1/2] Generating mock data...");
    const genStart = performance.now();
    generateMockData(tempDir);
    const genDuration = performance.now() - genStart;
    console.log(
      `      Created: ${FOLDER_COUNT} projects (with nested node_modules)`,
    );
    console.log(`      Time:    ${genDuration.toFixed(2)}ms`);

    // Step 2: Run the actual CLI script
    console.log("\n[2/2] Running node-modules-cleanup...");
    const runStart = performance.now();
    execSync(`bun run dev ${tempDir} --skip-confirmation`, {
      encoding: "utf-8",
      cwd: process.cwd(),
    });
    const duration = performance.now() - runStart;
    const durationStr = `${(duration / 1000).toFixed(2)}s`;

    console.log("\n" + "=".repeat(50));
    console.log(`Duration: ${durationStr}`);

    // Cleanup remaining temp folder structure
    console.log("\nCleaning up...");
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log("Done.");

    updateReadme(durationStr);
    console.log("Benchmark results written to README.md\n");
  } catch (error) {
    console.log("\nCleaning up temporary files...");
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

benchmark();
