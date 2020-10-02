[![npm
version](https://badge.fury.io/js/next-use-redirection.svg)](https://badge.fury.io/js/next-use-redirection)

# next-use-redirection

`next-use-redirection` is a [React
hook](https://reactjs.org/docs/hooks-intro.html) for
[Next.js](https://nextjs.org/) that will use [isomorphic
redirection](https://www.npmjs.com/package/next-isomorphic-redirect) to redirect
the client to a specific URI if certain conditions are met.

TypeScript Types 

BEFORE next-use-redirection:

```TypeScript
import * as React from 'react'
import { useRedirection } from 'next-use-redirection'
import { useUser } from 'universe/frontend/hooks'
import PasswordForm from 'components/password-form'
import { WithAuthed, User } from 'types/global';

const REDIRECT_ON_NOT_FIRST_LOGIN_LOCATION = '/dashboard';

export default function FirstLoginPage() {
    const { redirecting } = useRedirection<WithAuthed<User>>({
        endpointURI: '/api/user',
        redirectTo: REDIRECT_ON_NOT_FIRST_LOGIN_LOCATION,
        redirectIf: data => !data.authed || !data.firstLogin,
        redirectArgs: { replace: true }
    });

    const { user } = useUser();

    const topmatter = (
        <header>
            <p>Welcome, {user.username}. You must update your password before you can use this account.</p>
            <hr />
            <style jsx>{`
                header {
                    margin-bottom: 15px;
                }
            `}</style>
        </header>
    );

    // ? This ensures the form is only rendered if we're not redirecting
    return redirecting !== false ? null : <PasswordForm topmatter={topmatter} />;
}
```

AFTER next-use-redirection:

```sh
# Optional: install next-use-redirection in your path
$ npm install -g next-use-redirection

# Project 1
$ next -p `next-use-redirection proj1` # Port A

# Project 2
$ gatsby develop -p `ap proj2` # Port B
# `ap` is synonymous with `next-use-redirection`!

# Project 3
$ node expressapp.js -p `npx -q next-use-redirection p3` # Or don't install next-use-redirection at all

# A week later, starting a new project...
# Project 4
$ ./koaapp.js --port `ap project-4` # Port D

# Close the project... come back to it a few weeks later
$ ./koaapp.js --port `ap project-4` # Port D (same port as before)

# And in another window, we want to start another dev instance without problems
$ ./koaapp.js --port `ap project-4` # Will run on the next available port temporarily

# You don't even need an id. Call next-use-redirection by itself and it'll use the directory name
# as the id automatically. Easy peasy!
$ cd ~/repos/freelance/shiny-new-react-app
$ npm run dev -p `ap`
# Same as: npm run dev -p `next-use-redirection shiny-new-react-app`
```

`next-use-redirection` takes in an identifier (`id`) and spits out a mapped port number.
Subsequent calls using the same `id` will get the same port number again and
again. The only exception is when the originally mapped port is being used by
another process, in which case `next-use-redirection` temporarily returns the next least
unused port using [detect-port](https://github.com/node-modules/detect-port).
Once the originally mapped port is no longer in use, later calls with the same
`id` will return it.

Port numbers start at 3000. You can change/delete your port mappings and/or
choose the next starting port in the `_portmap.json` configuration file found at
`~/.config/_portmap.json`.

This is useful if, like me, you're running any dozen dev servers off the same
rig simultaneously and like to have consistent port numbers for your projects
with the added flexibility of temporary port assignments when necessary. I use
it in my `package.json` files, composer scripts, shell scripts, and other places
like so:

```json
{
    ...
    "scripts": {
        "dev": "next -p `next-use-redirection`"
    }
}
```

Or with npx, so users who don't have next-use-redirection installed globally can still
call `npm run dev` without an issue:

```json
{
    ...
    "scripts": {
        "dev": "next -p `npx -q next-use-redirection`"
    }
}
```

> Note: using npx might add overhead to your program's start time. To make `npx
> -q next-use-redirection` return instantaneously, ensure `next-use-redirection` is installed
> globally.

## Installation and Usage

```sh
$ npm install -g next-use-redirection
$ next-use-redirection ident
$ port ident
$ port
```

This tool can also be used via npx without installing anything:

```sh
$ echo `npx next-use-redirection ident`
```

Though, this will add a few seconds to your program's start time. To avoid this,
ensure `next-use-redirection` is installed globally.
