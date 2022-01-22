import { createClient, SpecClient } from '../src/index'

const URL = 'http://localhost:8000'
const KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjczODg5NSwiZXhwIjoxOTU4MzE0ODk1fQ.zR_oRqjYyqQeKfA1DV-RnlSVplCDTIeO8Fjzj0MI4G8'

const spec = createClient(URL, KEY)

test('it should create the client connection', async () => {
    expect(spec).toBeDefined()
    expect(spec).toBeInstanceOf(SpecClient)
})

test('It should init', async () => {
    const { error } = await spec.auth.signOut()
    console.log('error', error)
    expect(error).toBeNull()
})
