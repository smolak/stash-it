type RecursiveType = string | number | boolean | null | RecursiveType[] | { [key: string]: RecursiveType };

/** Key used to store the item. */
export type Key = string;

/** Value stored in the item. */
export type Value = RecursiveType;

/** Extra data stored in the item. */
export type Extra = RecursiveType;

/** Item stored in the stash. */
export type Item = {
  key: Key;
  value: Value;
  extra: Extra;
};

/** Event handler function. Accepts and returns the same args. */
// eslint-disable-next-line no-unused-vars
export type HookHandler<Args> = (args: Args) => Promise<Args>;

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

type BuildKeyArgs = { key: Key };
type BeforeSetItemArgs = { key: Key; value: Value; extra: Extra };
type AfterSetItemArgs = { key: Key; value: Value; extra: Extra; item: Item };
type BeforeGetItemArgs = { key: Key };
type AfterGetItemArgs = { key: Key; item: GetItemResult };
type BeforeHasItemArgs = { key: Key };
type AfterHasItemArgs = { key: Key; result: boolean };
type BeforeRemoveItemArgs = { key: Key };
type AfterRemoveItemArgs = { key: Key; result: boolean };
type BeforeSetExtraArgs = { key: Key; extra: Extra };
type AfterSetExtraArgs = { key: Key; extra: SetExtraResult };
type BeforeGetExtraArgs = { key: Key };
type AfterGetExtraArgs = { key: Key; extra: GetExtraResult };

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

/** Plugin interface. */
export type Plugin = {
  hookHandlers: PluginHookHandlers;
};

/** StashIt interface. */
export interface StashItInterface extends CommonInterface {
  // eslint-disable-next-line no-unused-vars
  registerPlugins(plugins: Plugin[]): void;
}

/** StashIt adapter interface. */
export interface StashItAdapterInterface extends CommonInterface {}
