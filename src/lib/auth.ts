import { SpecAuthClient, Session, User } from '@spec.dev/auth-client'
import { SpecWalletClient, events as walletEvents } from '@spec.dev/wallet-client'
import { AuthClientOptions, ApiError } from './types'

export class AuthClient extends SpecAuthClient {
    wallet: SpecWalletClient

    constructor(wallet: SpecWalletClient, options: AuthClientOptions) {
        super(options)
        this.wallet = wallet
        this._subscribeToWalletEvents()
    }

    async connect(): Promise<{
        session: Session | null
        user: User | null
        isNewUser: boolean
        error: ApiError | null
    }> {
        try {
            // Connect to the user's wallet.
            const error = await this.wallet.connect()
            if (error) throw error

            // Get the user's current account address.
            const address = await this.wallet.getCurrentAddress()
            if (!address) throw 'Failed to retrieve current wallet address.'

            // Sign in by signing and verifying a nonce-based-message.
            const { session, user, isNewUser } = await this._signInWithNonce(address)

            return { session, user, isNewUser, error: null }
        } catch (err) {
            return { session: null, user: null, isNewUser: false, error: err as ApiError }
        }
    }

    private _subscribeToWalletEvents() {
        this.wallet.onStateChange((event, data) => {
            switch (event) {
                // User changed accounts within the wallet.
                case walletEvents.ACCOUNT_CHANGED:
                    const { address } = data
                    address && this._onChangedWalletAccount(address)
                    break
                // Wallet provider was disconnected.
                case walletEvents.DISCONNECTED:
                    this.signOut()
                    break
                default:
                    break
            }
        })
    }

    private async _onChangedWalletAccount(address: string) {
        try {
            // Try signing in with a locally-stored session for this address first.
            const signedInWithCachedSession = await this.switchToInactiveSession(address)
            if (signedInWithCachedSession) return

            // Fallback to handling this as a new account.
            await this._signInWithNonce(address)
        } catch (err) {
            console.error('error switching accounts', err)
        }
    }

    private async _signInWithNonce(address: string): Promise<{
        session: Session | null
        user: User | null
        isNewUser: boolean
    }> {
        // Initialize the auth flow by requesting a nonce-based message to sign.
        const { data, error: initError } = await this.init(address)
        if (initError) throw initError
        if (!data?.message) throw 'Failed to retrieve message to sign.'

        // Sign the message with the user's current account.
        const signature = await this.wallet.signMessage(address, data.message, '')
        if (!signature) throw 'Failed to sign user auth message.'

        // Verify the signature in exchange for a new session.
        const {
            session,
            user,
            isNewUser,
            error: verifyError,
        } = await this.verify(address, signature)
        if (verifyError) throw verifyError
        if (!session) throw 'Failed to verify user signature.'

        return { session, user, isNewUser }
    }
}
