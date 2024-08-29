/** Key used to store the item. */
export type Key = string;

/** Recursive type for values that can be safely stringified */
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

/** Event handler function. Accepts and returns the same args. */
// eslint-disable-next-line no-unused-vars
export type HookHandler<Args> = (args: Args) => Promise<Omit<Args, "adapter">>;

type RequiredProperties<Object, K extends keyof Object> = {
  [P in K]: Object[P];
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
  // eslint-disable-next-line no-unused-vars
  setItem(key: Key, value: Value, extra: Extra): Promise<Item>;
  // eslint-disable-next-line no-unused-vars
  getItem(key: Key): Promise<GetItemResult>;
  // eslint-disable-next-line no-unused-vars
  hasItem(key: Key): Promise<boolean>;
  // eslint-disable-next-line no-unused-vars
  removeItem(key: Key): Promise<boolean>;
  // eslint-disable-next-line no-unused-vars
  setExtra(key: Key, extra: Extra): Promise<SetExtraResult>;
  // eslint-disable-next-line no-unused-vars
  getExtra(key: Key): Promise<GetExtraResult>;
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
  // eslint-disable-next-line no-unused-vars
  registerPlugins(plugins: StashItPlugin[]): void;
}

/** StashIt adapter abstract class. */
export abstract class StashItAdapter implements CommonInterface {
  // eslint-disable-next-line no-unused-vars
  abstract setItem(key: Key, value: Value, extra: Extra): Promise<Item>;
  // eslint-disable-next-line no-unused-vars
  abstract getItem(key: Key): Promise<GetItemResult>;
  // eslint-disable-next-line no-unused-vars
  abstract hasItem(key: Key): Promise<boolean>;
  // eslint-disable-next-line no-unused-vars
  abstract removeItem(key: Key): Promise<boolean>;
  // eslint-disable-next-line no-unused-vars
  abstract setExtra(key: Key, extra: Extra): Promise<SetExtraResult>;
  // eslint-disable-next-line no-unused-vars
  abstract getExtra(key: Key): Promise<GetExtraResult>;

  async connect(): Promise<void> {
    // Do nothing by default. Implement in subclass if needed.
    // It's useful for adapters that need to open connections or set up resources.
  }

  async disconnect(): Promise<void> {
    // Do nothing by default. Implement in subclass if needed.
    // It's useful for adapters that need to close connections or clean up resources.
  }
}
