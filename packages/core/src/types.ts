export type SerializableValue = string | number | boolean | null;
export type SerializableObject = {
  [key: string]: SerializableValue | SerializableObject | SerializableArray;
};
export type SerializableArray = Array<SerializableValue | SerializableObject>;
export type SerializableDataStructure = SerializableArray | SerializableObject;

export type Key = string;
export type Value = SerializableValue | SerializableDataStructure;
export type Extra = SerializableObject;

export type Item = {
  key: Key;
  value: Value;
  extra: Extra;
};

type Event = string;
type Handler =
  | (({ stashIt }: { stashIt: StashItInterface }) => { stashIt: StashItInterface })
  | (({ key }: { key: Key }) => { key: Key })
  | (({ value }: { value: Value }) => { value: Value })
  | (({ extra }: { extra: Extra }) => { extra: Extra });

type Hook = {
  event: Event;
  handler: Handler;
};

/**
 * TODO
 * Add `reason` for exceptions? :thingking:
 */

export class ItemNotSetException extends Error {
  constructor(key: Key) {
    super(`Item with key ${key} could not be set.`);
  }
}

export class ItemNotRemovedException extends Error {
  constructor(key: Key) {
    super(`Item with key ${key} could not be removed.`);
  }
}

export class ExtraNotSetException extends Error {
  constructor(key: Key) {
    super(`Extra for item with key ${key} could not be set.`);
  }
}

export type ItemRemoved = true;
export type ItemNotPresentCouldNotRemove = false;
export type ItemRemoveResult = ItemRemoved | ItemNotPresentCouldNotRemove;

interface CommonInterface {
  hasItem(key: Key): Promise<boolean>;
  setItem(key: Key, value: Value, extra: Extra): Promise<Item | ItemNotSetException>;
  getItem(key: Key): Promise<Item | undefined>;
  removeItem(key: Key): Promise<ItemRemoveResult | ItemNotRemovedException>;
  setExtra(key: Key, extra: Extra): Promise<Extra | ExtraNotSetException>;
  getExtra(key: Key): Promise<Extra | undefined>;
}

export interface StashItInterface extends CommonInterface {}
export interface AdapterInterface extends CommonInterface {}
