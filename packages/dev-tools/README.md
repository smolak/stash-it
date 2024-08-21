# `@stash-it/dev-tools`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

Set of tools for development purposes.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)
- [Contribution](#contribution)

npm
```bash
npm install @stash-it/dev-tools
```

deno
```bash
deno add @stash-it/dev-tools
```

yarn
```bash
yarn dlx jsr add @stash-it/dev-tools
```

pnpm
```bash
pnpm dlx jsr add @stash-it/dev-tools
```

bun
```bash
bunx jsr add @stash-it/dev-tools
```

## Usage

### `runAdapterTests`

If you want to create an adapter, it should pass all of those tests. Here's how you can use them.
Let's say you use vitest:

```typescript
// Vitest stuff
import { describe } from "vitest";

import { adapterTestCases } from '@stash-it/dev-tools';

// Your adapter.
import { YourAdapter } from './your-adapter';

describe('YourAdapter', () => {
  const adapter = new YourAdapter();
  
  // Add whatever validation or other stuff you need.
  
  // Run the tests.
  adapterTestCases(adapter);
});
```

This helper function accepts an adapter instance and runs tests on it. It will throw an error if any of the tests fail.
It is also capable of cleaning up after self. Meaning, if you're operating on a persistent storage, it will delete all of the
items created during the tests.

### `getHandler`

If you want to creat a plugin, you can use this helper function to get a handler for a specific hook.
Here's how you can use it:

```typescript
// Vitest stuff
import { describe, it, expect } from "vitest";

import { getHandler } from '@stash-it/dev-tools';

// Your plugin.
import { createPlugin } from './your-plugin';

describe('YourPlugin', () => {
  it('does something on buildKey', async () => {
    const plugin = createPlugin();
    const key = "key";
    const handler = getHandler('buildKey', plugin);
    
    // Here is where you can test the handler that you created.
    const result = await handler(key);
    
    // expect ... etc.
  });
});
```

Why not simply do this?

```typescript
const handler = plugin.hookHandlers.buildKey;
```

Well ... current types set around plugins are not that great.
This helper function will throw an error if the handler is not a function. Also, thanks to the argument passed (hook name),
it will know what arguments the handler should accept etc. And you don't need to reach to plugin internals. You simply
request a handler for a specific hook and that's it.

## License

MIT

## Contribution

Feel free to open an issue or a pull request.
