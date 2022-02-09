# Spec JavaScript Client

# Installation

```
$ npm install --save @spec.dev/client
```

# Initialization

### Create the Spec client

```javascript
import { createClient } from '@spec.dev/client'

const specUrl = 'https://your-project-id.spec.dev'
const specKey = 'public-anon-key'
const spec = createClient(specUrl, specKey)
```

# Auth

### Signing in a user

```javascript
const { user, session, isNewUser, error } = await spec.auth.connect()
```

### Signing out a user

```javascript
const { error } = await spec.auth.disconnect()
```

# GraphQL

### Query your users and their DIDs

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

### Call a service

```javascript
const { data, error } = spec.service('<service-name>').perform(...args)
```

**Example**: Call the create DID service:

```javascript
const { data, error } = spec.service('did.create').perform('0x...')
```
