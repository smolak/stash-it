# `@stash-it/redis-adapter`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

`@stash-it/redis-adapter` is a simple redis adapter that can be used with `@stash-it/stash-it`.
It uses `redis` package under the hood.

## Installation

npm

```bash
npm install @stash-it/redis-adapter
```

deno

```bash
deno add @stash-it/redis-adapter
```

yarn

```bash
yarn dlx jsr add @stash-it/redis-adapter
```

pnpm

```bash
pnpm dlx jsr add @stash-it/redis-adapter
```

bun

```bash
bunx jsr add @stash-it/redis-adapter
```

## Usage

```ts
// Import stash-it main class.
import { StashIt } from "@stash-it/stash-it";
import { RedisAdapter } from "@stash-it/redis-adapter";

// Create an instance of the adapter. Use whatever URL your redis instance runs on.
const adapter = new RedisAdapter({ url: "redis://localhost:6379" });

// And use it with stash-it.
const stash = new StashIt(adapter);
```

## License

MIT

## Contribution

Feel free to open an issue or a pull request.
