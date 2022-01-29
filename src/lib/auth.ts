import { SpecAuthClient, Session, User } from '@spec.dev/auth-client'
import { SpecWalletClient } from '@spec.dev/wallet-client'
import { AuthClientOptions, ApiError } from './types'

export class AuthClient extends SpecAuthClient {
    wallet: SpecWalletClient

    constructor(wallet: SpecWalletClient, options: AuthClientOptions) {
        super(options)
        this.wallet = wallet
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

            return { session, user, isNewUser, error: null }
        } catch (err) {
            return { session: null, user: null, isNewUser: false, error: err as ApiError }
        }
    }
}
