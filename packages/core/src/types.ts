type SerializableValue = string | number | boolean | null;
type SerializableObject = {
  [key: string]: SerializableValue | SerializableObject | SerializableArray;
};
type SerializableArray = Array<SerializableValue | SerializableObject>;
type SerializableDataStructure = SerializableArray | SerializableObject;

/** Type for the key used to store the item */
export type Key = string;

/** Type for the value stored in the item */
export type Value = SerializableValue | SerializableDataStructure;

/** Type for the extra data stored in the item */
export type Extra = SerializableObject;

/** Type for the item stored in the stash */
export type Item = {
  key: Key;
  value: Value;
  extra: Extra;
};

// eslint-disable-next-line no-unused-vars
export type EventHandler<Args> = (args: Args) => Promise<Args>;

type BuildKeyArgs = { key: Key };
type PreSetItemArgs = { key: Key; value: Value; extra: Extra };
type PostSetItemArgs = { key: Key; value: Value; extra: Extra; item: Item };
type PreGetItemArgs = { key: Key };
type PostGetItemArgs = { key: Key; item: GetItemResult };
type PreHasItemArgs = { key: Key };
type PostHasItemArgs = { key: Key; result: boolean };
type PreRemoveItemArgs = { key: Key };
type PostRemoveItemArgs = { key: Key; result: boolean };
type PreSetExtraArgs = { key: Key; extra: Extra };
type PostSetExtraArgs = { key: Key; extra: SetExtraResult };
type PreGetExtraArgs = { key: Key };
type PostGetExtraArgs = { key: Key; extra: GetExtraResult };

type ExtraCouldNotBeSet = false;
export type SetExtraResult = Extra | ExtraCouldNotBeSet;

type ItemNotFound = undefined;
export type GetItemResult = Item | ItemNotFound;

type ExtraNotFound = undefined;
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

// TODO: make this use BuiltInEvent to exhaust it
export type EventHandlerArgs = {
  buildKey: BuildKeyArgs;
  preSetItem: PreSetItemArgs;
  postSetItem: PostSetItemArgs;
  preGetItem: PreGetItemArgs;
  postGetItem: PostGetItemArgs;
  preHasItem: PreHasItemArgs;
  postHasItem: PostHasItemArgs;
  preRemoveItem: PreRemoveItemArgs;
  postRemoveItem: PostRemoveItemArgs;
  preSetExtra: PreSetExtraArgs;
  postSetExtra: PostSetExtraArgs;
  preGetExtra: PreGetExtraArgs;
  postGetExtra: PostGetExtraArgs;
};

export type EventHandlers = {
  buildKey: ReadonlyArray<EventHandler<BuildKeyArgs>>;
  preSetItem: ReadonlyArray<EventHandler<PreSetItemArgs>>;
  postSetItem: ReadonlyArray<EventHandler<PostSetItemArgs>>;
  preGetItem: ReadonlyArray<EventHandler<PreGetItemArgs>>;
  postGetItem: ReadonlyArray<EventHandler<PostGetItemArgs>>;
  preHasItem: ReadonlyArray<EventHandler<PreHasItemArgs>>;
  postHasItem: ReadonlyArray<EventHandler<PostHasItemArgs>>;
  preRemoveItem: ReadonlyArray<EventHandler<PreRemoveItemArgs>>;
  postRemoveItem: ReadonlyArray<EventHandler<PostRemoveItemArgs>>;
  preSetExtra: ReadonlyArray<EventHandler<PreSetExtraArgs>>;
  postSetExtra: ReadonlyArray<EventHandler<PostSetExtraArgs>>;
  preGetExtra: ReadonlyArray<EventHandler<PreGetExtraArgs>>;
  postGetExtra: ReadonlyArray<EventHandler<PostGetExtraArgs>>;
};

export type Plugin = {
  eventHandlers: {
    buildKey?: EventHandler<BuildKeyArgs>;
    preSetItem?: EventHandler<PreSetItemArgs>;
    postSetItem?: EventHandler<PostSetItemArgs>;
    preGetItem?: EventHandler<PreGetItemArgs>;
    postGetItem?: EventHandler<PostGetItemArgs>;
    preHasItem?: EventHandler<PreHasItemArgs>;
    postHasItem?: EventHandler<PostHasItemArgs>;
    preRemoveItem?: EventHandler<PreRemoveItemArgs>;
    postRemoveItem?: EventHandler<PostRemoveItemArgs>;
    preSetExtra?: EventHandler<PreSetExtraArgs>;
    postSetExtra?: EventHandler<PostSetExtraArgs>;
    preGetExtra?: EventHandler<PreGetExtraArgs>;
    postGetExtra?: EventHandler<PostGetExtraArgs>;
  };
};

export interface StashItInterface extends CommonInterface {
  // eslint-disable-next-line no-unused-vars
  registerPlugins(plugins: Plugin[]): void;
}

export interface StashItAdapterInterface extends CommonInterface {}
