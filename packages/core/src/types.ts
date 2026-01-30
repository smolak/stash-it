/** Key used to store the item. */
export type Key = string;

/** Recursive type for values that can be safely stringified. */
export type RecursiveType = string | number | boolean | null | RecursiveType[] | { [key: string]: RecursiveType };

/** Value stored in the item. */
export type Value = RecursiveType;

/** Extra data stored in the item. */
export type Extra = { [key: string]: RecursiveType };

/** Item stored in the stash. */
export type Item = {
  key: Key;
  value: Value;
  extra: Extra;
};

/** Hook handler function. Accepts and returns the same args, apart from the adapter, which is injected each time. */
export type HookHandler<Args extends { adapter: unknown }> = (args: Args) => Promise<Omit<Args, "adapter">>;

type RequiredProperties<T, K extends keyof T> = {
  [P in K]: T[P];
};

/** All possible hooks. */
export type Hook =
  | "buildKey"
  | "beforeSetItem"
  | "afterSetItem"
  | "beforeGetItem"
  | "afterGetItem"
  | "beforeHasItem"
  | "afterHasItem"
  | "beforeRemoveItem"
  | "afterRemoveItem"
  | "beforeSetExtra"
  | "afterSetExtra"
  | "beforeGetExtra"
  | "afterGetExtra";

type AdapterArg = { adapter: StashItAdapter };
type BuildKeyArgs = AdapterArg & { key: Key };
type BeforeSetItemArgs = AdapterArg & { key: Key; value: Value; extra: Extra };
type AfterSetItemArgs = AdapterArg & { key: Key; value: Value; extra: Extra; item: Item };
type BeforeGetItemArgs = AdapterArg & { key: Key };
type AfterGetItemArgs = AdapterArg & { key: Key; item: GetItemResult };
type BeforeHasItemArgs = AdapterArg & { key: Key };
type AfterHasItemArgs = AdapterArg & { key: Key; result: boolean };
type BeforeRemoveItemArgs = AdapterArg & { key: Key };
type AfterRemoveItemArgs = AdapterArg & { key: Key; result: boolean };
type BeforeSetExtraArgs = AdapterArg & { key: Key; extra: Extra };
type AfterSetExtraArgs = AdapterArg & { key: Key; extra: SetExtraResult };
type BeforeGetExtraArgs = AdapterArg & { key: Key };
type AfterGetExtraArgs = AdapterArg & { key: Key; extra: GetExtraResult };

type ExtraCouldNotBeSet = false;
/** Result of setting extra data. */
export type SetExtraResult = Extra | ExtraCouldNotBeSet;

type ItemNotFound = undefined;
/** Result of getting an item. */
export type GetItemResult = Item | ItemNotFound;

type ExtraNotFound = undefined;
/** Result of getting extra data. */
export type GetExtraResult = Extra | ExtraNotFound;

interface CommonInterface {
  setItem(key: Key, value: Value, extra?: Extra): Promise<Item>;
  getItem(key: Key): Promise<GetItemResult>;
  hasItem(key: Key): Promise<boolean>;
  removeItem(key: Key): Promise<boolean>;
  setExtra(key: Key, extra: Extra): Promise<SetExtraResult>;
  getExtra(key: Key): Promise<GetExtraResult>;
  checkStorage(): Promise<true>;
}

/** All types of hook handler args. */
export type HookHandlerArgs = RequiredProperties<
  {
    buildKey: BuildKeyArgs;
    beforeSetItem: BeforeSetItemArgs;
    afterSetItem: AfterSetItemArgs;
    beforeGetItem: BeforeGetItemArgs;
    afterGetItem: AfterGetItemArgs;
    beforeHasItem: BeforeHasItemArgs;
    afterHasItem: AfterHasItemArgs;
    beforeRemoveItem: BeforeRemoveItemArgs;
    afterRemoveItem: AfterRemoveItemArgs;
    beforeSetExtra: BeforeSetExtraArgs;
    afterSetExtra: AfterSetExtraArgs;
    beforeGetExtra: BeforeGetExtraArgs;
    afterGetExtra: AfterGetExtraArgs;
  },
  Hook
>;

/** Type for holding registered hook handlers for all possible hooks. */
export type RegisteredHookHandlers = RequiredProperties<
  {
    buildKey: ReadonlyArray<HookHandler<BuildKeyArgs>>;
    beforeSetItem: ReadonlyArray<HookHandler<BeforeSetItemArgs>>;
    afterSetItem: ReadonlyArray<HookHandler<AfterSetItemArgs>>;
    beforeGetItem: ReadonlyArray<HookHandler<BeforeGetItemArgs>>;
    afterGetItem: ReadonlyArray<HookHandler<AfterGetItemArgs>>;
    beforeHasItem: ReadonlyArray<HookHandler<BeforeHasItemArgs>>;
    afterHasItem: ReadonlyArray<HookHandler<AfterHasItemArgs>>;
    beforeRemoveItem: ReadonlyArray<HookHandler<BeforeRemoveItemArgs>>;
    afterRemoveItem: ReadonlyArray<HookHandler<AfterRemoveItemArgs>>;
    beforeSetExtra: ReadonlyArray<HookHandler<BeforeSetExtraArgs>>;
    afterSetExtra: ReadonlyArray<HookHandler<AfterSetExtraArgs>>;
    beforeGetExtra: ReadonlyArray<HookHandler<BeforeGetExtraArgs>>;
    afterGetExtra: ReadonlyArray<HookHandler<AfterGetExtraArgs>>;
  },
  Hook
>;

type PluginHookHandlers = RequiredProperties<
  {
    buildKey?: HookHandler<BuildKeyArgs>;
    beforeSetItem?: HookHandler<BeforeSetItemArgs>;
    afterSetItem?: HookHandler<AfterSetItemArgs>;
    beforeGetItem?: HookHandler<BeforeGetItemArgs>;
    afterGetItem?: HookHandler<AfterGetItemArgs>;
    beforeHasItem?: HookHandler<BeforeHasItemArgs>;
    afterHasItem?: HookHandler<AfterHasItemArgs>;
    beforeRemoveItem?: HookHandler<BeforeRemoveItemArgs>;
    afterRemoveItem?: HookHandler<AfterRemoveItemArgs>;
    beforeSetExtra?: HookHandler<BeforeSetExtraArgs>;
    afterSetExtra?: HookHandler<AfterSetExtraArgs>;
    beforeGetExtra?: HookHandler<BeforeGetExtraArgs>;
    afterGetExtra?: HookHandler<AfterGetExtraArgs>;
  },
  Hook
>;

/** StashIt plugin type. */
export type StashItPlugin = {
  hookHandlers: PluginHookHandlers;
};

/** StashIt interface. */
export interface StashItInterface extends CommonInterface {
  registerPlugins(plugins: StashItPlugin[]): void;
}

export interface StashItAdapterInterface extends CommonInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

/** StashIt adapter abstract class. */
export abstract class StashItAdapter implements StashItAdapterInterface {
  /**
   * Connect to the storage (DB, file system, resource of any kind where the items are stored).
   */
  async connect(): Promise<void> {
    // Do nothing by default. Implement in subclass if needed.
    // It's useful for adapters that need to open connections or set up resources.
  }

  /**
   * Disconnect from the storage.
   */
  async disconnect(): Promise<void> {
    // Do nothing by default. Implement in subclass if needed.
    // It's useful for adapters that need to close connections or clean up resources.
  }

  /**
   * Runs checks, essentially all public adapter's methods,
   * on the storage, to verify if all of those methods can be performed.
   * More precisely, if the adapter can operate (read, write, update, delete)
   * on the storage without problems.
   *
   * Resolves with `true` if all fine.
   * Should throw an error if something goes wrong.
   */
  async checkStorage(): Promise<true> {
    const randomValue = Math.random().toString(36).substring(2);
    const key: Key = `check_storage_key_${randomValue}`;
    const value: Value = "check_storage_value";
    const extra: Extra = { check_storage_extra: "check_storage_extra_value" };

    await this.connect();

    try {
      await this.setItem(key, value, extra);
      await this.hasItem(key);
      await this.getItem(key);
      await this.getExtra(key);
      await this.setItem(key, "a new value", { and: "a new extra" });
      await this.setExtra(key, { again: "new extra value" });
    } finally {
      // Always try to clean up the test item, even if operations failed
      try {
        await this.removeItem(key);
      } catch {
        // Ignore cleanup errors - the main error (if any) will be thrown
      }

      await this.disconnect();
    }

    return true;
  }

  protected validateKey(key: Key): void {
    if (!/^[A-Za-z0-9_-]+$/.test(key)) {
      throw new Error(
        `Invalid key: '${key}'. Only alphanumeric characters (a-z, A-Z, 0-9), underscores (_), and hyphens (-) are allowed.`,
      );
    }
  }

  abstract setItem(key: Key, value: Value, extra?: Extra): Promise<Item>;
  abstract getItem(key: Key): Promise<GetItemResult>;
  abstract hasItem(key: Key): Promise<boolean>;
  abstract removeItem(key: Key): Promise<boolean>;
  abstract setExtra(key: Key, extra: Extra): Promise<SetExtraResult>;
  abstract getExtra(key: Key): Promise<GetExtraResult>;
}
