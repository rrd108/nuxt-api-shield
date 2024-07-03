import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { beforeEach } from "vitest";
import { readFile } from "node:fs/promises";

const nuxtConfigDuration = 3;
const nuxtConfigBan = 10;

beforeEach(async () => {
  // TODO await useStorage("shield").clear();
});

describe("shield", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
  });

  it("respond to api call 2 times (limit.max, limit.duration) and rejects the 3rd call", async () => {
    // req.count = 1
    let response = await $fetch("/api/example?c=1/1", {
      method: "GET",
      retryStatusCodes: [],
    });
    expect((response as any).name).toBe("Gauranga");

    // req.count = 2
    response = await $fetch("/api/example?c=1/2", {
      method: "GET",
      retryStatusCodes: [],
    });
    expect((response as any).name).toBe("Gauranga");

    try {
      // req.count = 3
      // as limit.max = 2, this should throw 429 and ban for 3 seconds (limit.ban)
      expect(async () =>
        $fetch("/api/example?c=1/3", { method: "GET", retryStatusCodes: [] })
      ).rejects.toThrowError();
    } catch (err) {
      const typedErr = err as { statusCode: number; statusMessage: string };
      expect(typedErr.statusCode).toBe(429);
      expect(typedErr.statusMessage).toBe("Leave me alone");
    }
  });

  it("respond to the 2nd api call when more then limit.duration time passes", async () => {
    // see #13
    // req.count = 1
    let response = await $fetch("/api/example?c=2/1", {
      method: "GET",
      retryStatusCodes: [],
    });

    await new Promise((resolve) =>
      setTimeout(resolve, (nuxtConfigDuration + 1) * 1000)
    );

    // req.count = 2
    response = await $fetch("/api/example?c=2/2", {
      method: "GET",
      retryStatusCodes: [],
    });
    expect((response as any).name).toBe("Gauranga");
  });

  it.skip("respond to api call after limit.ban expires", async () => {
    // req.count reset here
    await $fetch("/api/example?c=3/1", { method: "GET", retryStatusCodes: [] }); // req.count = 1
    await $fetch("/api/example?c=3/2", { method: "GET", retryStatusCodes: [] }); // req.count = 2
    try {
      // req.count = 3
      expect(async () =>
        $fetch("/api/example?c=3/3", { method: "GET", retryStatusCodes: [] })
      ).rejects.toThrowError();
    } catch (err) {
      const typedErr = err as {
        response: Response;
        statusCode: number;
        statusMessage: string;
      };
      expect(typedErr.statusCode).toBe(429);
      expect(typedErr.statusMessage).toBe("Leave me alone");
      // retry-after = req.count (4) + 2
      expect(typedErr.response.headers.get("Retry-After")).toBe("6");
    }

    // here we should wait for the 3 sec ban to expire
    await new Promise((resolve) => setTimeout(resolve, nuxtConfigBan * 1000));
    const response = await $fetch("/api/example?c=3/4", {
      method: "GET",
      retryStatusCodes: [],
    });
    expect((response as any).name).toBe("Gauranga");
  });

  it.skip("should created a log file", async () => {
    const logDate = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const logFile = `logs/shield-${logDate}.log`;
    const contents = await readFile(logFile, { encoding: "utf8" });
    expect(contents).toContain("127.0.0.1");
  });
});
