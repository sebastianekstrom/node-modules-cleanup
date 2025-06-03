import { calculateSizeOfNodeModulesDirs } from "./calculateSizeOfNodeModulesDirs";
import { getDirectorySize } from "./getDirectorySize";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./getDirectorySize");
vi.mock("../output/logger");

describe("calculateSizeOfNodeModulesDirs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate the total size of node_modules directories", async () => {
    (getDirectorySize as ReturnType<typeof vi.fn>).mockImplementation(
      async (dir) => {
        if (dir === "/path/to/node_modules1") return 100;
        if (dir === "/path/to/node_modules2") return 200;
        return 0;
      },
    );

    const result = await calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: ["/path/to/node_modules1", "/path/to/node_modules2"],
    });

    expect(result.totalSize).toBe(300);
    expect(result.entries).toEqual([
      { path: "/path/to/node_modules1", size: 100 },
      { path: "/path/to/node_modules2", size: 200 },
    ]);
  });

  it("should call getDirectorySize for each directory", async () => {
    (getDirectorySize as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    await calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: ["/path/to/node_modules1", "/path/to/node_modules2"],
    });

    expect(getDirectorySize).toHaveBeenCalledTimes(2);
    expect(getDirectorySize).toHaveBeenCalledWith("/path/to/node_modules1");
    expect(getDirectorySize).toHaveBeenCalledWith("/path/to/node_modules2");
  });

  it("should write progress to stdout", async () => {
    (getDirectorySize as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: ["/path/to/node_modules1", "/path/to/node_modules2"],
    });

    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("Calculating sizes... (1/2)"),
    );
    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("Calculating sizes... (2/2)"),
    );
  });

  it("should handle empty node_modules array", async () => {
    const result = await calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: [],
    });

    expect(result.totalSize).toBe(0);
    expect(result.entries).toEqual([]);
    expect(getDirectorySize).not.toHaveBeenCalled();
  });

  it("should handle single node_modules directory", async () => {
    (getDirectorySize as ReturnType<typeof vi.fn>).mockResolvedValue(500);
    const stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    const result = await calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: ["/single/node_modules"],
    });

    expect(result.totalSize).toBe(500);
    expect(result.entries).toEqual([
      { path: "/single/node_modules", size: 500 },
    ]);

    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("Calculating sizes... (1/1)"),
    );
  });

  it("should clear progress line after calculation", async () => {
    (getDirectorySize as ReturnType<typeof vi.fn>).mockResolvedValue(100);
    const stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    await calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: ["/path/to/node_modules"],
    });

    // Check that the last call clears the progress line
    const calls = stdoutSpy.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall).toMatch(/^\r\s+\r$/); // Carriage return + spaces + carriage return
  });

  it("should handle directories with zero size", async () => {
    (getDirectorySize as ReturnType<typeof vi.fn>).mockImplementation(
      async (dir) => {
        if (dir === "/empty/node_modules") return 0;
        if (dir === "/another/node_modules") return 250;
        return 0;
      },
    );

    const result = await calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: ["/empty/node_modules", "/another/node_modules"],
    });

    expect(result.totalSize).toBe(250);
    expect(result.entries).toEqual([
      { path: "/empty/node_modules", size: 0 },
      { path: "/another/node_modules", size: 250 },
    ]);
  });

  it("should handle unexpected directory paths", async () => {
    (getDirectorySize as ReturnType<typeof vi.fn>).mockImplementation(
      async (dir) => {
        if (dir === "/path/to/node_modules1") return 100;
        if (dir === "/path/to/node_modules2") return 200;
        return 0; // This branch should be hit for other paths
      },
    );

    const result = await calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: [
        "/path/to/node_modules1",
        "/path/to/node_modules2",
        "/unexpected/path",
      ],
    });

    expect(result.totalSize).toBe(300);
    expect(result.entries).toEqual([
      { path: "/path/to/node_modules1", size: 100 },
      { path: "/path/to/node_modules2", size: 200 },
      { path: "/unexpected/path", size: 0 },
    ]);
  });
});
