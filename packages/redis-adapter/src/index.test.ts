import { describe, it, expect } from "vitest";
import { runAdapterTests } from "@stash-it/dev-tools";

import { RedisAdapter } from "./index";
import { REDIS_HOST, REDIS_PORT } from "./envVariables";

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
