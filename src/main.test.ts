import { main } from "./main";
import { prompt } from "./output/prompt";
import { findNodeModulesFolders } from "./core/findNodeModulesFolders";
import { calculateSizeOfNodeModulesDirs } from "./core/calculateSizeOfNodeModulesDirs";
import { deleteFolders, deleteMessage } from "./core/deleteFolders";
import { logger } from "./output/logger";

import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";

vi.mock("./output/prompt");
vi.mock("./core/findNodeModulesFolders");
vi.mock("./core/calculateSizeOfNodeModulesDirs");
vi.mock("./core/deleteFolders");
vi.mock("./output/logger");

describe("main", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit: ${code as number}`);
    });
  });

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    process.argv = ["node", "script.js"];

    // Mock deleteMessage to return a string
    (deleteMessage as ReturnType<typeof vi.fn>).mockReturnValue("Deleting...");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("args", () => {
    it("should display help and exit when --help is passed", async () => {
      process.argv.push("--help");
      await expect(main()).rejects.toThrow("process.exit: 0");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
    });

    it("should display help and exit when --h is passed", async () => {
      process.argv.push("--h");
      await expect(main()).rejects.toThrow("process.exit: 0");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
    });

    it("should display version and exit when --version is passed", async () => {
      process.argv.push("--version");
      await expect(main()).rejects.toThrow("process.exit: 0");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Version:"));
    });

    it("should display version and exit when --v is passed", async () => {
      process.argv.push("--v");
      await expect(main()).rejects.toThrow("process.exit: 0");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Version:"));
    });

    it("should skip confirmation if --skip-confirmation is passed", async () => {
      process.argv.push("./some/path", "--skip-confirmation");
      (findNodeModulesFolders as ReturnType<typeof vi.fn>).mockResolvedValue([
        "/path/to/node_modules",
      ]);
      (
        calculateSizeOfNodeModulesDirs as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        entries: [{ path: "/path/to/node_modules", size: 100 }],
        totalSize: 100,
      });

      await expect(main()).rejects.toThrow("process.exit: 0");
      expect(prompt).not.toHaveBeenCalled();
      expect(deleteFolders).toHaveBeenCalledWith([
        { path: "/path/to/node_modules", size: 100 },
      ]);
    });

    it("should skip deletion of folders if --dry is passed", async () => {
      process.argv.push("./some/path", "--dry", "--skip-confirmation");
      (findNodeModulesFolders as ReturnType<typeof vi.fn>).mockResolvedValue([
        "/path/to/node_modules",
      ]);
      (
        calculateSizeOfNodeModulesDirs as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        entries: [{ path: "/path/to/node_modules", size: 100 }],
        totalSize: 100,
      });

      await expect(main()).rejects.toThrow("process.exit: 0");
      expect(deleteFolders).not.toHaveBeenCalled();
    });

    it("should handle dry run with multiple entries", async () => {
      process.argv.push("./some/path", "--dry", "--skip-confirmation");
      (findNodeModulesFolders as ReturnType<typeof vi.fn>).mockResolvedValue([
        "/path/to/node_modules1",
        "/path/to/node_modules2",
      ]);
      (
        calculateSizeOfNodeModulesDirs as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        entries: [
          { path: "/path/to/node_modules1", size: 100 },
          { path: "/path/to/node_modules2", size: 200 },
        ],
        totalSize: 300,
      });

      await expect(main()).rejects.toThrow("process.exit: 0");
      expect(deleteFolders).not.toHaveBeenCalled();
    });

    it("should show different prompt message for dry run", async () => {
      process.argv.push("./some/path", "--dry");
      (findNodeModulesFolders as ReturnType<typeof vi.fn>).mockResolvedValue([
        "/path/to/node_modules",
      ]);
      (
        calculateSizeOfNodeModulesDirs as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        entries: [{ path: "/path/to/node_modules", size: 100 }],
        totalSize: 100,
      });
      (prompt as ReturnType<typeof vi.fn>).mockResolvedValue("yes");

      await expect(main()).rejects.toThrow("process.exit: 0");
      expect(prompt).toHaveBeenCalledWith(
        expect.stringContaining("(this is a dry, run nothing will be deleted)"),
      );
      expect(deleteFolders).not.toHaveBeenCalled();
    });
  });

  it("should log error and exit when no path is provided", async () => {
    await expect(main()).rejects.toThrow("process.exit: 0");
    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "error",
        message: expect.stringContaining("Path not provided"),
      }),
    );
  });

  it("should log error and exit when no node_modules folders are found", async () => {
    process.argv.push("./some/path");
    (findNodeModulesFolders as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await expect(main()).rejects.toThrow("process.exit: 0");
    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "error",
        message: expect.stringContaining("No node_modules folders found"),
      }),
    );
  });

  it("should prompt for confirmation and delete folders", async () => {
    process.argv.push("./some/path");
    (findNodeModulesFolders as ReturnType<typeof vi.fn>).mockResolvedValue([
      "/path/to/node_modules",
    ]);
    (
      calculateSizeOfNodeModulesDirs as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      entries: [{ path: "/path/to/node_modules", size: 100 }],
      totalSize: 100,
    });
    (prompt as ReturnType<typeof vi.fn>).mockResolvedValue("yes");

    await expect(main()).rejects.toThrow("process.exit: 0");
    expect(prompt).toHaveBeenCalled();
    expect(deleteFolders).toHaveBeenCalledWith([
      { path: "/path/to/node_modules", size: 100 },
    ]);
  });

  it("should log a message and exit if user declines deletion", async () => {
    process.argv.push("./some/path");
    (findNodeModulesFolders as ReturnType<typeof vi.fn>).mockResolvedValue([
      "/path/to/node_modules",
    ]);
    (
      calculateSizeOfNodeModulesDirs as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      entries: [{ path: "/path/to/node_modules", size: 100 }],
      totalSize: 100,
    });
    (prompt as ReturnType<typeof vi.fn>).mockResolvedValue("no");

    await expect(main()).rejects.toThrow("process.exit: 0");
    expect(prompt).toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "No node_modules folders were deleted. Exiting the cleanup process",
      }),
    );
  });

  it("should accept 'y' as confirmation", async () => {
    process.argv.push("./some/path");
    (findNodeModulesFolders as ReturnType<typeof vi.fn>).mockResolvedValue([
      "/path/to/node_modules",
    ]);
    (
      calculateSizeOfNodeModulesDirs as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      entries: [{ path: "/path/to/node_modules", size: 100 }],
      totalSize: 100,
    });
    (prompt as ReturnType<typeof vi.fn>).mockResolvedValue("y");

    await expect(main()).rejects.toThrow("process.exit: 0");
    expect(deleteFolders).toHaveBeenCalledWith([
      { path: "/path/to/node_modules", size: 100 },
    ]);
  });

  it("should accept Swedish confirmation 'kör bara kör!'", async () => {
    process.argv.push("./some/path");
    (findNodeModulesFolders as ReturnType<typeof vi.fn>).mockResolvedValue([
      "/path/to/node_modules",
    ]);
    (
      calculateSizeOfNodeModulesDirs as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      entries: [{ path: "/path/to/node_modules", size: 100 }],
      totalSize: 100,
    });
    (prompt as ReturnType<typeof vi.fn>).mockResolvedValue("kör bara kör!");

    await expect(main()).rejects.toThrow("process.exit: 0");
    expect(deleteFolders).toHaveBeenCalledWith([
      { path: "/path/to/node_modules", size: 100 },
    ]);
  });
});
