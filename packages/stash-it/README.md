# `@stash-it/stash-it`

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)
- [Contribution](#contribution)

## Installation

npm
```bash
npx jsr add @stash-it/stash-it
```

deno
```bash
deno add @stash-it/stash-it
```

yarn
```bash
yarn dlx jsr add @stash-it/stash-it
```

pnpm
```bash
pnpm dlx jsr add @stash-it/stash-it
```

bun
```baash
bunx jsr add @stash-it/stash-it
```

## Usage

```typescript
// Import stash-it main class
import { StashIt } from '@stash-it/stash-it';

// For it to work you will also need an adapter.
// You can use any of the @stash-it adapters or create your own.
import { MemoryAdapter } from '@stash-it/adapter-memory';

// Create an instance of the adapter
const adapter = new MemoryAdapter();

// Create an instance of the stash-it
const stash = new StashIt(adapter);

// Use it
await stash.set('key', 'value');
const item = await stash.get('key');

console.log(item.value); // 'value'
```

## License

MIT

## Contribution

Feel free to open an issue or a pull request.

