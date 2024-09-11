import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { beforeEach } from "vitest";
import { rm } from "node:fs/promises";

beforeEach(async () => {
    // await useStorage("shield").clear(); TODO waiting for https://github.com/nuxt/test-utils/issues/531
    // this is a workaround to clean the storage
    const storagePath = fileURLToPath(new URL("../_testWithRoutesShield", import.meta.url));
    await rm(storagePath, { recursive: true, force: true });
});

describe("shield", async () => {
    await setup({
        rootDir: fileURLToPath(new URL("./fixtures/withroutes", import.meta.url)),
    });

    it("respond to api call 2 times (limit.max, limit.duration) and rejects the 3rd call if the route matches the routes option", async () => {
        // req.count = 1
        let response = await $fetch("/api/v3/example?c=1/1", {
            method: "GET",
            retryStatusCodes: [],
        });
        expect((response as any).name).toBe("Gauranga");

        // req.count = 2
        response = await $fetch("/api/v3/example?c=1/2", {
            method: "GET",
            retryStatusCodes: [],
        });
        expect((response as any).name).toBe("Gauranga");

        try {
            // req.count = 3
            // as limit.max = 2, this should throw 429 and ban for 3 seconds (limit.ban)
            expect(async () =>
                $fetch("/api/v3/example?c=1/3", { method: "GET", retryStatusCodes: [] })
            ).rejects.toThrowError();
        } catch (err) {
            const typedErr = err as { statusCode: number; statusMessage: string };
            expect(typedErr.statusCode).toBe(429);
            expect(typedErr.statusMessage).toBe("Leave me alone");
        }
    });

    it("respond to api call 2 times (limit.max, limit.duration) and accept the 3rd call if the route does not matches the routes option", async () => {
        // req.count = 1
        let response = await $fetch("/api/v2/example?c=2/1", {
            method: "GET",
            retryStatusCodes: [],
        });
        expect((response as any).name).toBe("Gauranga");

        // req.count = 2
        response = await $fetch("/api/v2/example?c=2/2", {
            method: "GET",
            retryStatusCodes: [],
        });
        expect((response as any).name).toBe("Gauranga");

        // req.count = 3
        response = await $fetch("/api/v2/example?c=2/3", {
            method: "GET",
            retryStatusCodes: [],
        });
        expect((response as any).name).toBe("Gauranga");
    });


});
