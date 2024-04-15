import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { beforeEach } from "vitest";

beforeEach(async () => {
  // TODO await useStorage().clear();
});

describe("shield", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
  });

  it("respond to api call 2 times (limit.max, limit.duration)", async () => {
    // req.count = 1
    let response = await $fetch("/api/example", { method: "GET" });
    expect(response.name).toBe("Gauranga");

    // req.count = 2
    response = await $fetch("/api/example", { method: "GET" });
    expect(response.name).toBe("Gauranga");

    try {
      // req.count = 3
      // as limit.max = 2, this should throw 429 and ban for 3 seconds (limit.ban)
      response = await $fetch("/api/example", { method: "GET" });
      // we should never reach here
      expect(response).toBeUndefined();
    } catch (err) {
      const typedErr = err as { statusCode: number; statusMessage: string };
      expect(typedErr.statusCode).toBe(429);
      expect(typedErr.statusMessage).toBe("Too Many Requests");
    }
  });

  it("respond to api call after limit.ban expires", async () => {
    try {
      // req.count = 4
      const response = await $fetch("/api/example", { method: "GET" });
      // we should never reach here
      expect(response).toBeUndefined();
    } catch (err) {
      const typedErr = err as {
        response: Response;
        statusCode: number;
        statusMessage: string;
      };
      expect(typedErr.statusCode).toBe(429);
      expect(typedErr.statusMessage).toBe("Leave me alone"); // custom error message
      // retry-after = req.count (4) + 2
      expect(typedErr.response.headers.get("Retry-After")).toBe("6");
    }

    // here we should wait for the 3 sec ban to expire
    await new Promise((resolve) => setTimeout(resolve, 3000)); // limit.ban
    const response = await $fetch("/api/example", { method: "GET" });
    expect(response.name).toBe("Gauranga");
  });
});
