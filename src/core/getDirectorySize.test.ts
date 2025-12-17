import { describe, it, expect, vi } from "vitest";
import { getDirectorySize } from "./getDirectorySize";
import * as fs from "node:fs";

vi.mock("node:fs", () => ({
  promises: {
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));

const mockedReaddir = vi.mocked(fs.promises.readdir);
const mockedStat = vi.mocked(fs.promises.stat);

describe("getDirectorySize", () => {
  it("should return the correct size in bytes for a given directory", async () => {
    // Mock a directory with two files
    mockedReaddir.mockResolvedValue([
      { name: "file1.txt", isDirectory: () => false },
      { name: "file2.txt", isDirectory: () => false },
    ] as any);

    mockedStat
      .mockResolvedValueOnce({ size: 1000 } as any)
      .mockResolvedValueOnce({ size: 2000 } as any);

    const dirPath = "/some/directory";

    const size = await getDirectorySize(dirPath);

    expect(size).toBe(3000);
    expect(mockedReaddir).toHaveBeenCalledWith(dirPath, { withFileTypes: true });
  });

  it("should recursively calculate size for nested directories", async () => {
    // First call: root directory with a subdirectory and a file
    mockedReaddir
      .mockResolvedValueOnce([
        { name: "subdir", isDirectory: () => true },
        { name: "file1.txt", isDirectory: () => false },
      ] as any)
      // Second call: subdirectory with one file
      .mockResolvedValueOnce([
        { name: "file2.txt", isDirectory: () => false },
      ] as any);

    mockedStat
      .mockResolvedValueOnce({ size: 1000 } as any) // file1.txt
      .mockResolvedValueOnce({ size: 500 } as any); // file2.txt

    const size = await getDirectorySize("/root");

    expect(size).toBe(1500);
  });

  it("should return 0 if readdir throws an error", async () => {
    mockedReaddir.mockRejectedValue(new Error("Permission denied"));

    const size = await getDirectorySize("/some/directory");

    expect(size).toBe(0);
  });

  it("should skip files that cannot be accessed", async () => {
    mockedReaddir.mockResolvedValue([
      { name: "accessible.txt", isDirectory: () => false },
      { name: "inaccessible.txt", isDirectory: () => false },
    ] as any);

    mockedStat
      .mockResolvedValueOnce({ size: 1000 } as any)
      .mockRejectedValueOnce(new Error("Permission denied"));

    const size = await getDirectorySize("/some/directory");

    expect(size).toBe(1000);
  });
});
