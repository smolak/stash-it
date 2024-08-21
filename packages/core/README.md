# `@stash-it/core`

Set of interfaces and types for `@stash-it`, both main class and adapters.

The main ones you'll be interested in are:

- `StashItAdapterInterface` - interface used to create your own adapters
- `StashItPlugin` type to create your own plugins

See [usage](#usage) for examples.

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)
- [Contribution](#contribution)

## Installation

npm
```bash
npx jsr add @stash-it/core
```

deno
```bash
deno add @stash-it/core
```

yarn
```bash
yarn dlx jsr add @stash-it/core
```

pnpm
```bash
pnpm dlx jsr add @stash-it/core
```

bun
```bash
bunx jsr add @stash-it/core
```

## Usage

### `StashItAdapterInterface`

```typescript
import { StashItAdapterInterface } from '@stash-it/core';

// Your adapter class should implement this interface.
class MyAdapter implements StashItAdapterInterface {
  // Your implementation here.
}
```

### `StashItPlugin`

```typescript
import { StashItPlugin } from '@stash-it/core';

// Your plugin can be a function that returns StashItPlugin:
const myPlugin = (someArgsIfNeedBe): StashItPlugin => {
  // Your implementation here.
};

// It can also be an object, depends on what your plugin needs:
const myPlugin2: StashItPlugin = {
  // Your implementation here.
};
```

## License

MIT

## Contribution

Feel free to open an issue or a pull request.
