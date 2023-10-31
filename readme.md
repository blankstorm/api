# Blankstorm API

This is the client-side library for Blankstorm's REST API. It provides typings and convience functions.

# Usage

Make sure you have installed the library:

```sh
npm install @blankstorm/api
```

If you make any changes (e.g. changing an account's username or logging an account out), you will need to authenticate.

```ts
import { auth, getAccountInfo, logout } from '@blankstorm/api';

const authToken = 'your login token';

auth(authToken);

const { id } = await getAccountInfo('token', authToken);

await logout(id);
```