import type { RateLimit } from "../types/RateLimit";
import { useRuntimeConfig } from "#imports";
import { access, appendFile, mkdir } from "node:fs/promises";

const shieldLog = async (req: RateLimit, requestIP: string, url: string) => {
  const options = useRuntimeConfig().public.nuxtApiShield;
  if (options.log?.attempts && req.count >= options.log.attempts) {
    const logLine = `${requestIP} - (${req.count}) - ${new Date(
      req.time
    ).toISOString()} - ${url}\n`;

    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");

    try {
      await access(options.log.path);
      await appendFile(`${options.log.path}/shield-${date}.log`, logLine);
    } catch (error) {
      if (error.code === "ENOENT") {
        await mkdir(options.log.path);
        await appendFile(`${options.log.path}/shield-${date}.log`, logLine);
      } else {
        console.error("Unexpected error:", error);
        // Handle other potential errors
      }
    }
  }
};

export default shieldLog;
