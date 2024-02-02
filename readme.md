# Blankstorm API

This is the code for Blankstorm's REST API. 

# @blankstorm/api

This is the client-side library. It provides typings and convience functions.

# Usage

Make sure you have installed the library:

```sh
npm install @blankstorm/api
```

If you make any changes (e.g. changing an account's username or logging an account out), you will need to authenticate.

```ts
import { auth, getAccount, logout } from '@blankstorm/api';

const authToken = 'your login token';

auth(authToken);

const { id } = await getAccount('token', authToken);

await logout(id);
```