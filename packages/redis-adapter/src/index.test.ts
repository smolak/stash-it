import { describe, it, expect } from "vitest";
import { runAdapterTests } from "@stash-it/dev-tools";

import { RedisAdapter } from "./index";

describe("redis-adapter", () => {
  const adapter = new RedisAdapter({ url: "redis://localhost:6379" });

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

  runAdapterTests(adapter);
});
