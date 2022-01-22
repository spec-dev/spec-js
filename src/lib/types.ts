import { SpecAuthClient } from '@spec/auth-js'
import { SpecWalletClient } from '@spec/wallet-js'

type SpecAuthClientOptions = ConstructorParameters<typeof SpecAuthClient>[0]
type SpecWalletClientOptions = ConstructorParameters<typeof SpecWalletClient>[0]

export interface AuthClientOptions extends SpecAuthClientOptions {}
export interface WalletClientOptions extends SpecWalletClientOptions {}

export type GenericObject = { [key: string]: string }

export type Fetch = typeof fetch

export type SpecClientOptions = {
    /**
     * The database schema which your tables belong to. Must be on the list of exposed schemas in Spec. Defaults to 'public'.
     */
    schema?: string
    /**
     * Optional headers for initializing the client.
     */
    headers?: GenericObject
    /**
     * Automatically refreshes the token for logged in users.
     */
    autoRefreshToken?: boolean
    /**
     * Whether to persist a logged in session to storage.
     */
    persistSession?: boolean
    /**
     * A storage provider. Used to store the logged in session.
     */
    localStorage?: AuthClientOptions['localStorage']

    walletOptions?: WalletClientOptions

    /**
     * A custom `fetch` implementation.
     */
    fetch?: Fetch
}

export interface ApiError {
    message: string
    status: number
}
