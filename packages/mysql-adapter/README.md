# `@stash-it/mysql-adapter`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

`@stash-it/mysql-adapter` is a simple redis adapter that can be used with `@stash-it/stash-it`.
It uses `mysql2` package under the hood.

## Installation

npm

```bash
npm install @stash-it/mysql-adapter
```

deno

```bash
deno add @stash-it/mysql-adapter
```

yarn

```bash
yarn dlx jsr add @stash-it/mysql-adapter
```

pnpm

```bash
pnpm dlx jsr add @stash-it/mysql-adapter
```

bun

```bash
bunx jsr add @stash-it/mysql-adapter
```

## Usage

```ts
// Import stash-it main class.
import { StashIt } from "@stash-it/stash-it";
import { MySqlAdapter } from "@stash-it/mysql-adapter";

// Create an instance of the adapter. Use whatever configuration your MySQL instance runs on.
const adapter = new MySqlAdapter({
  host: "localhost",
  user: "root",
  password: "password",
  database: "database-name",
  // port: 3306 <-- default if not provided
});

// And use it with stash-it.
const stash = new StashIt(adapter);
```

## Development/testing

Make sure to have `.env` file with those variables (and your values):

```sh
MYSQL_CONTAINER_NAME=mysql_container
MYSQL_DATABASE=database_name
MYSQL_USER=root
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_PORT=3306
```

## License

MIT

## Contribution

Feel free to open an issue or a pull request.
