import { SpecAuthClient } from '@spec/auth-js'
import { DEFAULT_HEADERS } from './lib/constants'
import { stripTrailingSlash } from './lib/helpers'
import { Fetch, GenericObject, SpecClientOptions } from './lib/types'

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
    auth: SpecAuthClient

    protected schema: string
    protected graphUrl: string
    protected authUrl: string
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
     */
    constructor(protected specUrl: string, protected specKey: string, options?: SpecClientOptions) {
        if (!specUrl) throw new Error('specUrl is required.')
        if (!specKey) throw new Error('specKey is required.')

        const _specUrl = stripTrailingSlash(specUrl)
        const settings = { ...DEFAULT_OPTIONS, ...options }

        this.graphUrl = `${_specUrl}/graph/v1`
        this.authUrl = `${_specUrl}/auth/v1`
        this.schema = settings.schema
        this.fetch = settings.fetch
        this.headers = { ...DEFAULT_HEADERS, ...options?.headers }

        this.auth = this._initSpecAuthClient(settings)
    }

    private _initSpecAuthClient({
        autoRefreshToken,
        persistSession,
        localStorage,
        headers,
        fetch,
    }: SpecClientOptions) {
        const authHeaders = {
            Authorization: `Bearer ${this.specKey}`,
            apikey: `${this.specKey}`,
        }
        return new SpecAuthClient({
            url: this.authUrl,
            headers: { ...headers, ...authHeaders },
            autoRefreshToken,
            persistSession,
            localStorage,
            fetch,
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
