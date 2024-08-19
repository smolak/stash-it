import { describe } from "vitest";
import { runAdapterTests } from "@stash-it/dev-tools";

import { MemoryAdapter } from "./index";

describe("MemoryAdapter", () => {
  const adapter = new MemoryAdapter();

  runAdapterTests(adapter);
});
