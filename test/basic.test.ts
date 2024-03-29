import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { setup, $fetch } from "@nuxt/test-utils/e2e";

describe("shield", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
    // TODO empty the storage before each test
  });

  it("respond to api call 2 times (limit.max, limit.duration)", async () => {
    let response = await $fetch("/api/example", { method: "GET" });
    expect(response.name).toBe("Gauranga");

    response = await $fetch("/api/example", { method: "GET" });
    expect(response.name).toBe("Gauranga");

    try {
      response = await $fetch("/api/example", { method: "GET" });
    } catch (err) {
      const typedErr = err as { statusCode: number; statusMessage: string };
      expect(typedErr.statusCode).toBe(429);
      expect(typedErr.statusMessage).toBe("Too Many Requests");
    }
  });

  it("respond to api call after limit.ban expires", async () => {
    try {
      await $fetch("/api/example", { method: "GET" });
    } catch (err) {
      const typedErr = err as { statusCode: number; statusMessage: string };
      expect(typedErr.statusCode).toBe(429);
      expect(typedErr.statusMessage).toBe("Too Many Requests");
    }

    // here we should wait for the ban to be lifted
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const response = await $fetch("/api/example", { method: "GET" });
    expect(response.name).toBe("Gauranga");
  });
});
