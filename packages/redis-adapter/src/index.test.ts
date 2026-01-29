import { runAdapterTests } from "@stash-it/dev-tools";
import { describe, expect, it } from "vitest";

import { REDIS_HOST, REDIS_PORT } from "./envVariables";
import { RedisAdapter } from "./index";

describe("redis-adapter", () => {
  describe("validation", () => {
    describe("when url is not provided", () => {
      it("throws an error", () => {
        expect(() => new RedisAdapter({ url: "" })).toThrowErrorMatchingSnapshot();
      });
    });

    describe("when url is not valid", () => {
      it("throws an error", () => {
        expect(() => new RedisAdapter({ url: "not-a-valid-url" })).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe("adapter tests", () => {
    const adapter = new RedisAdapter({ url: `redis://${REDIS_HOST}:${REDIS_PORT}` });

    runAdapterTests(adapter);
  });
});
