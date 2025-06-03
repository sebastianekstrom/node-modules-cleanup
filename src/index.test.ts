import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";

vi.mock("./main", () => ({
  main: vi.fn(),
}));

describe("index.ts", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    vi.spyOn(process, "exit").mockImplementation(vi.fn() as any);
  });

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.resetModules();
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    vi.clearAllMocks();
  });

  it("should not run main() when NODE_ENV is 'test'", async () => {
    process.env.NODE_ENV = "test";

    await import("./index");

    const { main } = await import("./main");
    expect(main).not.toHaveBeenCalled();
  });

  it("should run main() when NODE_ENV is 'development'", async () => {
    process.env.NODE_ENV = "development";

    const { main } = await import("./main");
    (main as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await import("./index");

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(main).toHaveBeenCalledOnce();
  });

  it("should run main() when NODE_ENV is 'production'", async () => {
    process.env.NODE_ENV = "production";

    const { main } = await import("./main");
    (main as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await import("./index");

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(main).toHaveBeenCalledOnce();
  });

  it("should run main() when NODE_ENV is undefined", async () => {
    delete process.env.NODE_ENV;

    const { main } = await import("./main");
    (main as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await import("./index");

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(main).toHaveBeenCalledOnce();
  });

  it("should handle errors from main() and exit with code 1", async () => {
    process.env.NODE_ENV = "production";

    const testError = new Error("Test error from main()");
    const { main } = await import("./main");
    (main as ReturnType<typeof vi.fn>).mockRejectedValue(testError);

    await import("./index");

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(main).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalledWith("An error occurred:", testError);
  });

  it("should log the exact error message when main() throws", async () => {
    process.env.NODE_ENV = "production";

    const customError = new Error("Custom error message");
    const { main } = await import("./main");
    (main as ReturnType<typeof vi.fn>).mockRejectedValue(customError);

    await import("./index");

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(consoleSpy).toHaveBeenCalledWith("An error occurred:", customError);
  });

  it("should handle string errors from main()", async () => {
    process.env.NODE_ENV = "production";

    const stringError = "String error message";
    const { main } = await import("./main");
    (main as ReturnType<typeof vi.fn>).mockRejectedValue(stringError);

    await import("./index");

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(consoleSpy).toHaveBeenCalledWith("An error occurred:", stringError);
  });
});
