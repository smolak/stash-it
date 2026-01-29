import { runAdapterTests } from "@stash-it/dev-tools";
import { describe } from "vitest";

import { MemoryAdapter } from "./index";

describe("MemoryAdapter", () => {
  const adapter = new MemoryAdapter();

  runAdapterTests(adapter);
});
