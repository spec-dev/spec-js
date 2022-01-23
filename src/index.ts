import SpecClient from './client'
import { SpecClientOptions } from './lib/types'
import { User as AuthUser, Session as AuthSession } from '@spec/auth-js'
export * from '@apollo/client'

/**
 * Creates a new Spec Client.
 */
const createClient = (
    specUrl: string,
    specKey: string,
    options?: SpecClientOptions
): SpecClient => {
    return new SpecClient(specUrl, specKey, options)
}

export { createClient, SpecClient, SpecClientOptions, AuthUser, AuthSession }
