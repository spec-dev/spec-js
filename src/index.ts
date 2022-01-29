import SpecClient from './client'
import { SpecClientOptions, ApiError } from './lib/types'
import { User, Session } from '@spec.dev/auth-client'
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

export { createClient, SpecClient, SpecClientOptions, ApiError, User, Session }
