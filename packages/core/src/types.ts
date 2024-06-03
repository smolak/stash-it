export type SerializableValue = string | number | boolean | null;
export type SerializableObject = {
  [key: string]: SerializableValue | SerializableObject;
};
export type SerializableArray = Array<SerializableValue | SerializableObject>;
export type SerializableDataStructure = SerializableArray | SerializableObject;

export type Key = string;
export type Value = SerializableValue | SerializableDataStructure;
export type Extra = SerializableObject;

export interface Item {
  key: Key;
  value: Value;
  extra: Extra;
}

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

export class ExtraNotAddedException extends Error {
  constructor(key: Key) {
    super(`Extra for item with key ${key} could not be added.`);
  }
}

export class ExtraNotSetException extends Error {
  constructor(key: Key) {
    super(`Extra for item with key ${key} could not be set.`);
  }
}

export interface CommonMethods {
  buildKey(key: Key): Promise<Key>;
  hasItem(key: Key): Promise<boolean>;
  setItem(key: string, value: string, extra: Extra): Promise<Item | ItemNotSetException>;
  getItem(key: string): Promise<Item | undefined>;
  removeItem(key: string): Promise<true | ItemNotRemovedException>;
  getExtra(key: string): Promise<Extra | undefined>;
  addExtra(key: string, extra: Extra): Promise<Extra | ExtraNotAddedException>;
  setExtra(key: string, extra: Extra): Promise<Extra | ExtraNotSetException>;
}

export abstract class Adapter implements CommonMethods {
  buildKey(key: Key): Promise<Key> {
    console.log("foo");
    return Promise.resolve(key);
  }

  abstract addExtra(key: string, extra: Extra): Promise<Extra | ExtraNotAddedException>;
  abstract getExtra(key: string): Promise<Extra | undefined>;
  abstract getItem(key: string): Promise<Item | undefined>;
  abstract hasItem(key: Key): Promise<boolean>;
  abstract removeItem(key: string): Promise<true | ItemNotRemovedException>;
  abstract setExtra(key: string, extra: Extra): Promise<Extra | ExtraNotSetException>;
  abstract setItem(key: string, value: string, extra: Extra): Promise<Item | ItemNotSetException>;
}
