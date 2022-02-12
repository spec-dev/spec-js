import { AuthClient } from './lib/auth'
import { SpecWalletClient } from '@spec.dev/wallet-client'
import { SpecServiceClient } from '@spec.dev/service-client'
import {
    ApolloClient,
    createHttpLink,
    InMemoryCache,
    NormalizedCacheObject,
    ApolloQueryResult,
    FetchResult,
    ApolloError,
    NetworkStatus,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { DEFAULT_HEADERS } from './lib/constants'
import { stripTrailingSlash } from './lib/helpers'
import { Fetch, GenericObject, SpecClientOptions, WalletClientOptions } from './lib/types'

const DEFAULT_OPTIONS = {
    schema: 'public',
    autoRefreshToken: true,
    persistSessions: true,
    recoverSessions: true,
    recoveredSessionsRequireCachedProvider: true,
    headers: DEFAULT_HEADERS,
    localDev: false,
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
     * Create a new Spec client instance.
     * @param specUrl The unique Spec URL which is supplied when you create a new project in your project dashboard.
     * @param specKey The unique Spec Key which is supplied when you create a new project in your project dashboard.
     * @param options.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Spec.
     * @param options.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
     * @param options.persistSessions Set to "true" if you want to automatically save the user session into local storage.
     * @param options.recoverSessions Set to "true" if you want to automatically recover sessions from local storage on init.
     * @param options.recoveredSessionsRequireCachedProvider Set to "true" if you want to require a cached wallet provider to exist before recovering sessions.
     * @param options.headers Any additional headers to send with each network request.
     * @param options.fetch A custom fetch implementation.
     * @param options.wallet Spec wallet client options.
     * @param options.localDev A boolean indicating whether your app is currently running in a local dev environment.
     * @param options.localApiKey Spec API Key to use with local webhooks.
     * @param options.localAuthHook The URL to hit with a webhook after auth has succeeded in local development.
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
        this.wallet = this._initSpecWalletClient(settings.wallet || {})
        const hasCachedProvider = this.wallet.hasCachedProvider

        // Don't recover sessions if a cached provider doesn't exist (and this is the desired behavior).
        if (settings.recoveredSessionsRequireCachedProvider && !hasCachedProvider) {
            settings.recoverSessions = false
        }
        // Auto-connect if cached provider exists.
        else if (hasCachedProvider) {
            this.wallet.connect()
        }

        this.auth = this._initSpecAuthClient(settings)
        this.graph = this._initSpecGraphClient()
    }

    async web3() {
        return await this.wallet.getWeb3()
    }

    async query(query: any, options = {}): Promise<ApolloQueryResult<any>> {
        try {
            return await this.graph.query({ query, ...options })
        } catch (error) {
            return {
                data: null,
                error: error as ApolloError,
                loading: false,
                networkStatus: NetworkStatus.ready,
            }
        }
    }

    async mutate(mutation: any, options = {}): Promise<FetchResult<any>> {
        try {
            return await this.graph.mutate({ mutation, ...options })
        } catch (error) {
            return {
                data: null,
                errors: [error as any],
            }
        }
    }

    service(id: string): SpecServiceClient {
        return new SpecServiceClient(id, {
            url: this.serviceUrl,
            headers: this._getAuthHeaders(),
            fetch: this.fetch,
        })
    }

    private _initSpecWalletClient(walletOptions: WalletClientOptions): SpecWalletClient {
        return new SpecWalletClient(walletOptions)
    }

    private _initSpecAuthClient({
        autoRefreshToken,
        persistSessions,
        recoverSessions,
        localStorage,
        headers,
        fetch,
        localDev,
        localApiKey,
        localAuthHook,
    }: SpecClientOptions): AuthClient {
        const authHeaders = {
            Authorization: `Bearer ${this.specKey}`,
            apikey: `${this.specKey}`,
        }
        return new AuthClient(this.wallet, {
            url: this.authUrl,
            headers: { ...headers, ...authHeaders },
            autoRefreshToken,
            persistSessions,
            recoverSessions,
            localStorage,
            fetch,
            localDev,
            localApiKey,
            localAuthHook,
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
