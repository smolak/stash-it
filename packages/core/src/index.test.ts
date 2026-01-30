import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Extra, GetExtraResult, GetItemResult, Item, Key, SetExtraResult, Value } from "./index";
import { StashItAdapter } from "./index";

// Test adapter that exposes protected methods for testing
class TestAdapter extends StashItAdapter {
  setItemMock = vi.fn<(key: Key, value: Value, extra?: Extra) => Promise<Item>>();
  getItemMock = vi.fn<(key: Key) => Promise<GetItemResult>>();
  hasItemMock = vi.fn<(key: Key) => Promise<boolean>>();
  removeItemMock = vi.fn<(key: Key) => Promise<boolean>>();
  setExtraMock = vi.fn<(key: Key, extra: Extra) => Promise<SetExtraResult>>();
  getExtraMock = vi.fn<(key: Key) => Promise<GetExtraResult>>();

  // Expose protected validateKey for testing
  public testValidateKey(key: Key): void {
    this.validateKey(key);
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    return this.setItemMock(key, value, extra);
  }

  async getItem(key: Key): Promise<GetItemResult> {
    return this.getItemMock(key);
  }

  async hasItem(key: Key): Promise<boolean> {
    return this.hasItemMock(key);
  }

  async removeItem(key: Key): Promise<boolean> {
    return this.removeItemMock(key);
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    return this.setExtraMock(key, extra);
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    return this.getExtraMock(key);
  }
}

describe("StashItAdapter", () => {
  describe("validateKey", () => {
    let adapter: TestAdapter;

    beforeEach(() => {
      adapter = new TestAdapter();
    });

    describe("valid keys", () => {
      it.each([
        ["simple", "simple"],
        ["with_underscore", "with_underscore"],
        ["with-hyphen", "with-hyphen"],
        ["MixedCase", "MixedCase"],
        ["with123numbers", "with123numbers"],
        ["UPPERCASE", "UPPERCASE"],
        ["a", "single character"],
        ["123", "only numbers"],
        ["a_b-c123", "mixed valid characters"],
      ])("should accept '%s' (%s)", (key) => {
        expect(() => adapter.testValidateKey(key)).not.toThrow();
      });
    });

    describe("invalid keys", () => {
      it.each([
        ["with space", "contains space"],
        ["with.dot", "contains dot"],
        ["with@symbol", "contains @"],
        ["with#hash", "contains #"],
        ["with$dollar", "contains $"],
        ["with%percent", "contains %"],
        ["with!exclaim", "contains !"],
        ["with/slash", "contains /"],
        ["with\\backslash", "contains backslash"],
        ["with:colon", "contains colon"],
        ["", "empty string"],
        ["key=value", "contains ="],
        ["key?query", "contains ?"],
        ["key&more", "contains &"],
      ])("should reject '%s' (%s)", (key, _description) => {
        expect(() => adapter.testValidateKey(key)).toThrow(
          /Invalid key:.*Only alphanumeric characters.*underscores.*hyphens.*are allowed/,
        );
      });

      it("should include the invalid key in the error message", () => {
        const invalidKey = "my invalid key";
        expect(() => adapter.testValidateKey(invalidKey)).toThrow(`Invalid key: '${invalidKey}'`);
      });
    });
  });

  describe("checkStorage", () => {
    let adapter: TestAdapter;

    beforeEach(() => {
      adapter = new TestAdapter();

      // Setup default mock implementations
      adapter.setItemMock.mockResolvedValue({ key: "test", value: "value", extra: {} });
      adapter.getItemMock.mockResolvedValue({ key: "test", value: "value", extra: {} });
      adapter.hasItemMock.mockResolvedValue(true);
      adapter.removeItemMock.mockResolvedValue(true);
      adapter.setExtraMock.mockResolvedValue({ extra: "value" });
      adapter.getExtraMock.mockResolvedValue({ extra: "value" });
    });

    it("should return true when all operations succeed", async () => {
      const result = await adapter.checkStorage();
      expect(result).toBe(true);
    });

    it("should call setItem twice (initial set and update)", async () => {
      await adapter.checkStorage();
      expect(adapter.setItemMock).toHaveBeenCalledTimes(2);
    });

    it("should call hasItem once", async () => {
      await adapter.checkStorage();
      expect(adapter.hasItemMock).toHaveBeenCalledTimes(1);
    });

    it("should call getItem once", async () => {
      await adapter.checkStorage();
      expect(adapter.getItemMock).toHaveBeenCalledTimes(1);
    });

    it("should call getExtra once", async () => {
      await adapter.checkStorage();
      expect(adapter.getExtraMock).toHaveBeenCalledTimes(1);
    });

    it("should call setExtra once", async () => {
      await adapter.checkStorage();
      expect(adapter.setExtraMock).toHaveBeenCalledTimes(1);
    });

    it("should call removeItem to clean up the test item", async () => {
      await adapter.checkStorage();
      expect(adapter.removeItemMock).toHaveBeenCalledTimes(1);
    });

    it("should use a key with 'check_storage_key_' prefix", async () => {
      await adapter.checkStorage();
      const calledKey = adapter.setItemMock.mock.calls[0]?.[0];
      expect(calledKey).toMatch(/^check_storage_key_/);
    });

    describe("error handling", () => {
      it("should propagate errors from setItem", async () => {
        adapter.setItemMock.mockRejectedValue(new Error("setItem failed"));
        await expect(adapter.checkStorage()).rejects.toThrow("setItem failed");
      });

      it("should propagate errors from getItem", async () => {
        adapter.getItemMock.mockRejectedValue(new Error("getItem failed"));
        await expect(adapter.checkStorage()).rejects.toThrow("getItem failed");
      });

      it("should propagate errors from hasItem", async () => {
        adapter.hasItemMock.mockRejectedValue(new Error("hasItem failed"));
        await expect(adapter.checkStorage()).rejects.toThrow("hasItem failed");
      });

      it("should still call removeItem even if an operation fails", async () => {
        adapter.getItemMock.mockRejectedValue(new Error("getItem failed"));

        await expect(adapter.checkStorage()).rejects.toThrow();
        expect(adapter.removeItemMock).toHaveBeenCalledTimes(1);
      });

      it("should not fail if removeItem throws during cleanup", async () => {
        adapter.removeItemMock.mockRejectedValue(new Error("cleanup failed"));
        // Should complete without throwing since cleanup errors are ignored
        const result = await adapter.checkStorage();
        expect(result).toBe(true);
      });
    });
  });

  describe("connect and disconnect defaults", () => {
    it("connect should resolve without doing anything by default", async () => {
      const adapter = new TestAdapter();
      await expect(adapter.connect()).resolves.toBeUndefined();
    });

    it("disconnect should resolve without doing anything by default", async () => {
      const adapter = new TestAdapter();
      await expect(adapter.disconnect()).resolves.toBeUndefined();
    });
  });
});
