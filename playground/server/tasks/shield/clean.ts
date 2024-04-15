import isBanExpired from "../../../../src/runtime/server/utils/isBanExpired";

export default defineTask({
  meta: {
    description: "Clean expired bans",
  },
  async run() {
    //  async run({ payload, context }) {
    //    console.log({ payload, context });

    const shieldStorage = useStorage("shield");

    const keys = await shieldStorage.getKeys();
    keys.forEach(async (key) => {
      const rateLimit = await shieldStorage.getItem(key);
      if (isBanExpired(rateLimit)) {
        await shieldStorage.removeItem(key);
      }
    });
    return { result: keys };
  },
});
