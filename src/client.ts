import { AuthClient } from './lib/auth'
import { SpecWalletClient } from '@spec/wallet-client'
import { SpecServiceClient } from '@spec/service-client'
import {
    ApolloClient,
    createHttpLink,
    InMemoryCache,
    NormalizedCacheObject,
    ApolloQueryResult,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { DEFAULT_HEADERS } from './lib/constants'
import { stripTrailingSlash } from './lib/helpers'
import { Fetch, GenericObject, SpecClientOptions, WalletClientOptions } from './lib/types'

const DEFAULT_OPTIONS = {
    schema: 'public',
    autoRefreshToken: true,
    persistSession: true,
    headers: DEFAULT_HEADERS,
}

/**
 * Spec Client.
 *
 * A Javascript client for interacting with your Spec database and services.
 */
export default class SpecClient {
    /**
     * Spec Auth allows you to create and manage user sessions for access to data that is secured by access policies.
     */
    auth: AuthClient

    wallet: SpecWalletClient

    graph: ApolloClient<NormalizedCacheObject>

    protected schema: string
    protected authUrl: string
    protected graphUrl: string
    protected serviceUrl: string
    protected fetch?: Fetch
    protected headers: {
        [key: string]: string
    }

    /**
     * Create a new client for use in the browser.
     * @param specUrl The unique Spec URL which is supplied when you create a new project in your project dashboard.
     * @param specKey The unique Spec Key which is supplied when you create a new project in your project dashboard.
     * @param options.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Spec.
     * @param options.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
     * @param options.persistSession Set to "true" if you want to automatically save the user session into local storage.
     * @param options.headers Any additional headers to send with each network request.
     * @param options.fetch A custom fetch implementation.
     * @param options.walletOptions
     */
    constructor(protected specUrl: string, protected specKey: string, options?: SpecClientOptions) {
        if (!specUrl) throw new Error('specUrl is required.')
        if (!specKey) throw new Error('specKey is required.')

        const _specUrl = stripTrailingSlash(specUrl)
        const settings = { ...DEFAULT_OPTIONS, ...options }

        this.authUrl = `${_specUrl}/auth/v1`
        this.graphUrl = `${_specUrl}/graph/v1`
        this.serviceUrl = `${_specUrl}/service/v1`
        this.schema = settings.schema
        this.fetch = settings.fetch
        this.headers = { ...DEFAULT_HEADERS, ...options?.headers }

        this.wallet = this._initSpecWalletClient(settings.walletOptions || {})
        this.auth = this._initSpecAuthClient(settings)
        this.graph = this._initSpecGraphClient()
    }

    query(query: any, options = {}): Promise<ApolloQueryResult<any>> {
        return this.graph.query({ query, ...options })
    }

    service(id: string): SpecServiceClient {
        return new SpecServiceClient(id, {
            url: this.serviceUrl,
            headers: this._getAuthHeaders(),
            fetch: this.fetch,
        })
    }

    private _initSpecWalletClient({
        providerOptions,
        cacheProvider,
        disableInjectedProvider,
    }: WalletClientOptions): SpecWalletClient {
        return new SpecWalletClient({
            providerOptions,
            cacheProvider,
            disableInjectedProvider,
        })
    }

    private _initSpecAuthClient({
        autoRefreshToken,
        persistSession,
        localStorage,
        headers,
        fetch,
    }: SpecClientOptions): AuthClient {
        const authHeaders = {
            Authorization: `Bearer ${this.specKey}`,
            apikey: `${this.specKey}`,
        }
        return new AuthClient(this.wallet, {
            url: this.authUrl,
            headers: { ...headers, ...authHeaders },
            autoRefreshToken,
            persistSession,
            localStorage,
            fetch,
        })
    }

    private _initSpecGraphClient(): ApolloClient<NormalizedCacheObject> {
        const httpLink = createHttpLink({ uri: this.graphUrl })
        const authLink = setContext((_, { headers }) => ({
            headers: {
                ...headers,
                ...this._getAuthHeaders(),
            },
        }))
        return new ApolloClient({
            link: authLink.concat(httpLink),
            cache: new InMemoryCache(),
        })
    }

    private _getAuthHeaders(): GenericObject {
        const headers: GenericObject = this.headers
        const authBearer = this.auth.session()?.accessToken ?? this.specKey
        headers['apikey'] = this.specKey
        headers['Authorization'] = `Bearer ${authBearer}`
        return headers
    }
}
