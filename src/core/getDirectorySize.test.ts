import { describe, it, expect, vi } from "vitest";
import { getDirectorySize } from "./getDirectorySize";
import { exec } from "node:child_process";

vi.mock("node:child_process", () => ({
  exec: vi.fn(),
}));

const mockedExec = vi.mocked(exec);

describe("getDirectorySize", () => {
  it("should return the correct size in bytes for a given directory", async () => {
    mockedExec.mockImplementation((command: string, callback: any) => {
      callback(null, { stdout: "100\n" });
      return {} as any; // Mock return value
    });

    const dirPath = "/some/directory";
    const expectedSizeInBytes = 100 * 512;

    const size = await getDirectorySize(dirPath);

    expect(size).toBe(expectedSizeInBytes);
    expect(mockedExec).toHaveBeenCalledWith(
      `du -s "${dirPath}" | cut -f1`,
      expect.any(Function),
    );
  });

  it("should return 0 and log an error if exec throws an error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockedExec.mockImplementation((command: string, callback: any) => {
      callback(new Error("Command failed"), null);
      return {} as any; // Mock return value
    });

    const dirPath = "/some/directory";

    const size = await getDirectorySize(dirPath);

    expect(size).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Error calculating size for directory ${dirPath}:`,
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});
