import { calculateSizeOfNodeModulesDirs } from "./calculateSizeOfNodeModulesDirs";
import { getDirectorySize } from "./getDirectorySize";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./getDirectorySize");
vi.mock("../output/logger");

describe("calculateSizeOfNodeModulesDirs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate the total size of node_modules directories", () => {
    (getDirectorySize as ReturnType<typeof vi.fn>).mockImplementation((dir) => {
      if (dir === "/path/to/node_modules1") return 100;
      if (dir === "/path/to/node_modules2") return 200;
      return 0;
    });

    const result = calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: ["/path/to/node_modules1", "/path/to/node_modules2"],
    });

    expect(result.totalSize).toBe(300);
    expect(result.entries).toEqual([
      { path: "/path/to/node_modules1", size: 100 },
      { path: "/path/to/node_modules2", size: 200 },
    ]);
  });

  it("should call getDirectorySize for each directory", () => {
    calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: ["/path/to/node_modules1", "/path/to/node_modules2"],
    });

    expect(getDirectorySize).toHaveBeenCalledTimes(2);
    expect(getDirectorySize).toHaveBeenCalledWith("/path/to/node_modules1");
    expect(getDirectorySize).toHaveBeenCalledWith("/path/to/node_modules2");
  });

  it("should write progress to stdout", () => {
    const stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    calculateSizeOfNodeModulesDirs({
      nodeModulesDirs: ["/path/to/node_modules1", "/path/to/node_modules2"],
    });

    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("Locating node_modules folders (found 1)..."),
    );
    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("Locating node_modules folders (found 2)..."),
    );

    stdoutSpy.mockRestore();
  });
});
