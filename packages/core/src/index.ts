/** Key used to store the item. */
export type Key = string;

/** Recursive type for values that can be safely stringified. */
export type RecursiveType = string | number | boolean | null | RecursiveType[] | { [key: string]: RecursiveType };

/** Value stored in the item. */
export type Value = RecursiveType;

/** Extra data stored in the item. */
export type Extra = { [key: string]: RecursiveType };

/**
 * Item stored in the stash.
 * @template TExtra - The type of extra data, defaults to base Extra type
 */
export type Item<TExtra extends Extra = Extra> = {
  key: Key;
  value: Value;
  extra: TExtra;
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
type BeforeSetItemArgs<TExtra extends Extra = Extra> = AdapterArg & { key: Key; value: Value; extra: TExtra };
type AfterSetItemArgs<TExtra extends Extra = Extra> = AdapterArg & {
  key: Key;
  value: Value;
  extra: TExtra;
  item: Item<TExtra>;
};
type BeforeGetItemArgs = AdapterArg & { key: Key };
type AfterGetItemArgs<TExtra extends Extra = Extra> = AdapterArg & { key: Key; item: GetItemResult<TExtra> };
type BeforeHasItemArgs = AdapterArg & { key: Key };
type AfterHasItemArgs = AdapterArg & { key: Key; result: boolean };
type BeforeRemoveItemArgs = AdapterArg & { key: Key };
type AfterRemoveItemArgs = AdapterArg & { key: Key; result: boolean };
type BeforeSetExtraArgs<TExtra extends Extra = Extra> = AdapterArg & { key: Key; extra: TExtra };
type AfterSetExtraArgs<TExtra extends Extra = Extra> = AdapterArg & { key: Key; extra: SetExtraResult<TExtra> };
type BeforeGetExtraArgs = AdapterArg & { key: Key };
type AfterGetExtraArgs<TExtra extends Extra = Extra> = AdapterArg & { key: Key; extra: GetExtraResult<TExtra> };

type ExtraCouldNotBeSet = false;
/**
 * Result of setting extra data.
 * @template TExtra - The type of extra data
 */
export type SetExtraResult<TExtra extends Extra = Extra> = TExtra | ExtraCouldNotBeSet;

type ItemNotFound = undefined;
/**
 * Result of getting an item.
 * @template TExtra - The type of extra data
 */
export type GetItemResult<TExtra extends Extra = Extra> = Item<TExtra> | ItemNotFound;

type ExtraNotFound = undefined;
/**
 * Result of getting extra data.
 * @template TExtra - The type of extra data
 */
export type GetExtraResult<TExtra extends Extra = Extra> = TExtra | ExtraNotFound;

/**
 * Common interface for StashIt and adapters.
 * @template TExtra - The type of extra data
 */
interface CommonInterface<TExtra extends Extra = Extra> {
  /**
   * Store an item. Extra properties are optional - provide any subset of the accumulated plugin extras.
   */
  setItem(key: Key, value: Value, extra?: Partial<TExtra> & Extra): Promise<Item<TExtra>>;
  getItem(key: Key): Promise<GetItemResult<TExtra>>;
  hasItem(key: Key): Promise<boolean>;
  removeItem(key: Key): Promise<boolean>;
  /**
   * Update extra data. Properties are optional - provide any subset of the accumulated plugin extras.
   */
  setExtra(key: Key, extra: Partial<TExtra> & Extra): Promise<SetExtraResult<TExtra>>;
  getExtra(key: Key): Promise<GetExtraResult<TExtra>>;
  checkStorage(): Promise<true>;
}

/**
 * All types of hook handler args.
 * @template TExtra - The type of extra data
 */
export type HookHandlerArgs<TExtra extends Extra = Extra> = RequiredProperties<
  {
    buildKey: BuildKeyArgs;
    beforeSetItem: BeforeSetItemArgs<TExtra>;
    afterSetItem: AfterSetItemArgs<TExtra>;
    beforeGetItem: BeforeGetItemArgs;
    afterGetItem: AfterGetItemArgs<TExtra>;
    beforeHasItem: BeforeHasItemArgs;
    afterHasItem: AfterHasItemArgs;
    beforeRemoveItem: BeforeRemoveItemArgs;
    afterRemoveItem: AfterRemoveItemArgs;
    beforeSetExtra: BeforeSetExtraArgs<TExtra>;
    afterSetExtra: AfterSetExtraArgs<TExtra>;
    beforeGetExtra: BeforeGetExtraArgs;
    afterGetExtra: AfterGetExtraArgs<TExtra>;
  },
  Hook
>;

/**
 * Type for holding registered hook handlers for all possible hooks.
 * @template TExtra - The type of extra data
 */
export type RegisteredHookHandlers<TExtra extends Extra = Extra> = RequiredProperties<
  {
    buildKey: ReadonlyArray<HookHandler<BuildKeyArgs>>;
    beforeSetItem: ReadonlyArray<HookHandler<BeforeSetItemArgs<TExtra>>>;
    afterSetItem: ReadonlyArray<HookHandler<AfterSetItemArgs<TExtra>>>;
    beforeGetItem: ReadonlyArray<HookHandler<BeforeGetItemArgs>>;
    afterGetItem: ReadonlyArray<HookHandler<AfterGetItemArgs<TExtra>>>;
    beforeHasItem: ReadonlyArray<HookHandler<BeforeHasItemArgs>>;
    afterHasItem: ReadonlyArray<HookHandler<AfterHasItemArgs>>;
    beforeRemoveItem: ReadonlyArray<HookHandler<BeforeRemoveItemArgs>>;
    afterRemoveItem: ReadonlyArray<HookHandler<AfterRemoveItemArgs>>;
    beforeSetExtra: ReadonlyArray<HookHandler<BeforeSetExtraArgs<TExtra>>>;
    afterSetExtra: ReadonlyArray<HookHandler<AfterSetExtraArgs<TExtra>>>;
    beforeGetExtra: ReadonlyArray<HookHandler<BeforeGetExtraArgs>>;
    afterGetExtra: ReadonlyArray<HookHandler<AfterGetExtraArgs<TExtra>>>;
  },
  Hook
>;

/**
 * Plugin hook handlers type.
 * Hooks work with base Extra type since they need to handle any extra data.
 */
export type PluginHookHandlers = RequiredProperties<
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

/**
 * StashIt plugin type.
 * @template TAddsExtra - The type of extra data this plugin adds (used for type inference with .use())
 */
// biome-ignore lint/correctness/noUnusedVariables: TAddsExtra is a phantom type used for type inference with .use()
export type StashItPlugin<TAddsExtra extends Extra = Extra> = {
  hookHandlers: PluginHookHandlers;
};

/**
 * StashIt interface.
 * @template TExtra - The type of extra data
 */
export interface StashItInterface<TExtra extends Extra = Extra> extends CommonInterface<TExtra> {
  /**
   * Register a plugin and return a typed StashIt instance.
   * Plugins can be chained for type-safe composition.
   *
   * @example
   * ```typescript
   * const stash = new StashIt(adapter)
   *   .use(createTagsPlugin())
   *   .use(createTtlPlugin({ ttl: 3600 }));
   *
   * // Now __tags and __ttl are typed!
   * await stash.setItem('key', value, { __tags: ['movie'], __ttl: { ... } });
   * ```
   */
  use<PAddsExtra extends Extra>(plugin: StashItPlugin<PAddsExtra>): StashItInterface<TExtra & PAddsExtra>;
}

/**
 * StashIt adapter interface.
 * Adapters work with base Extra type since they handle raw storage.
 */
export interface StashItAdapterInterface extends CommonInterface<Extra> {
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
