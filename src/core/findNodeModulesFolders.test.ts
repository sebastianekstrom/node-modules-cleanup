import { findNodeModulesFolders } from "./findNodeModulesFolders";
import * as fs from "fs";
import { describe, it, expect, vi } from "vitest";

vi.mock("fs", () => ({
  promises: {
    readdir: vi.fn(),
  },
}));

describe("findNodeModulesFolders", () => {
  it("should find all node_modules folders recursively", async () => {
    (fs.promises.readdir as ReturnType<typeof vi.fn>).mockImplementation(
      async (dir) => {
        switch (dir) {
          case "/start":
            return [
              { name: "project1", isDirectory: () => true },
              { name: "project2", isDirectory: () => true },
              { name: "file.txt", isDirectory: () => false },
            ];
          case "/start/project1":
            return [
              { name: "node_modules", isDirectory: () => true },
              { name: "src", isDirectory: () => true },
            ];
          case "/start/project1/src":
            return [];
          case "/start/project2":
            return [{ name: "node_modules", isDirectory: () => true }];
          default:
            return [];
        }
      },
    );

    const result = await findNodeModulesFolders("/start");
    expect(result).toEqual([
      "/start/project1/node_modules",
      "/start/project2/node_modules",
    ]);
  });

  it("should skip directories starting with dot (except root dot)", async () => {
    (fs.promises.readdir as ReturnType<typeof vi.fn>).mockImplementation(
      async (dir) => {
        switch (dir) {
          case "/start":
            return [
              { name: ".git", isDirectory: () => true },
              { name: ".vscode", isDirectory: () => true },
              { name: "project", isDirectory: () => true },
            ];
          case "/start/project":
            return [{ name: "node_modules", isDirectory: () => true }];
          default:
            return [];
        }
      },
    );

    const result = await findNodeModulesFolders("/start");
    expect(result).toEqual(["/start/project/node_modules"]);
  });

  it("should handle permission errors gracefully", async () => {
    (fs.promises.readdir as ReturnType<typeof vi.fn>).mockImplementation(
      async (dir) => {
        if (dir === "/start") {
          return [
            { name: "accessible", isDirectory: () => true },
            { name: "restricted", isDirectory: () => true },
          ];
        }
        if (dir === "/start/accessible") {
          return [{ name: "node_modules", isDirectory: () => true }];
        }
        if (dir === "/start/restricted") {
          throw new Error("EACCES: permission denied");
        }
        return [];
      },
    );

    const result = await findNodeModulesFolders("/start");
    expect(result).toEqual(["/start/accessible/node_modules"]);
  });
});
