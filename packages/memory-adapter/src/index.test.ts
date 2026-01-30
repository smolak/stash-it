import { runAdapterTests } from "@stash-it/dev-tools";
import { describe, expect, it } from "vitest";

import { MemoryAdapter } from "./index";

describe("MemoryAdapter", () => {
  const adapter = new MemoryAdapter();

  // Placeholder test to satisfy vitest 4.x empty suite detection
  it("should be an instance of MemoryAdapter", () => {
    expect(adapter).toBeInstanceOf(MemoryAdapter);
  });

  runAdapterTests(adapter);
});
