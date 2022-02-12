# Spec JavaScript Client

The JavaScript client for Spec.

## Installation

```
$ npm install --save @spec.dev/client
```

## Initialization

To create a new client that communicates with your Spec project's API:

```javascript
import { createClient } from '@spec.dev/client'

const specUrl = 'https://your-project-id.spec.dev'
const specKey = 'public-anon-key'

// Create Spec Client.
const spec = createClient(specUrl, specKey)
```

...

## Spec Auth / Wallet Sign-in

Enabling wallet sign-in for your users is as simple as running the following function:

```javascript
const { user, session, isNewUser, error } = await spec.auth.connect()
```

...

The following can be run to sign the current user out of all active sessions.

```javascript
const { error } = await spec.auth.disconnect()
```

## GraphQL

...

```javascript
import { gql } from '@spec.dev/client'

const GET_USER_DID_PAIRS = gql`
    query getUserDidsPairs {
        users {
            id
            did {
                domain
                provider
                email
                url
                avatar
                name
                description
            }
            createdAt
        }
    }
`

const { data, error } = await spec.query(GET_USER_DID_PAIRS)
```

### Services

...

### Calling a service

```javascript
const { data, error } = spec.service('<service-name>').perform(...args)
```

**Example**: Call the create DID service:

```javascript
const { data, error } = spec.service('did.create').perform('0x...')
```

...
