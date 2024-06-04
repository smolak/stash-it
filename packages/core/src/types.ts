export type SerializableValue = string | number | boolean | null;
export type SerializableObject = {
  [key: string]: SerializableValue | SerializableObject;
};
export type SerializableArray = Array<SerializableValue | SerializableObject>;
export type SerializableDataStructure = SerializableArray | SerializableObject;

export type Key = string;
export type BuiltKey = `@__${string}`;
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

export abstract class Adapter {
  abstract addExtra(key: BuiltKey, extra: Extra): Promise<Extra | ExtraNotAddedException>;
  abstract getExtra(key: BuiltKey): Promise<Extra | undefined>;
  abstract getItem(key: BuiltKey): Promise<Item | undefined>;
  abstract hasItem(key: BuiltKey): Promise<boolean>;
  abstract removeItem(key: BuiltKey): Promise<true | ItemNotRemovedException>;
  abstract setExtra(key: BuiltKey, extra: Extra): Promise<Extra | ExtraNotSetException>;
  abstract setItem(key: BuiltKey, value: Value, extra: Extra): Promise<Item | ItemNotSetException>;
}
