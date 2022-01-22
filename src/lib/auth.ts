import { SpecAuthClient, Session } from '@spec/auth-js'
import { SpecWalletClient } from '@spec/wallet-js'
import { AuthClientOptions, ApiError } from './types'

export class AuthClient extends SpecAuthClient {
    wallet: SpecWalletClient

    constructor(wallet: SpecWalletClient, options: AuthClientOptions) {
        super(options)
        this.wallet = wallet
    }

    async connect(): Promise<{
        session: Session | null
        isNewUser: boolean
        error: ApiError | null
    }> {
        try {
            await this.wallet.connect()

            // Get current account address.
            const address = this.wallet.getCurrentAddress()
            if (!address) throw 'Failed to retrieve current wallet address.'

            // Initialize auth flow by requesting a nonce-based message to sign.
            const { data, error: initError } = await this.init(address)
            if (initError) throw initError
            if (!data?.message) throw 'Failed to retrieve message to sign.'

            // Sign the message with the user's current account.
            const signature = await this.wallet.signMessage(address, data.message)

            // Verify the signature to sign in.
            const { session, isNewUser, error: verifyError } = await this.verify(address, signature)
            if (verifyError) throw verifyError
            if (!session) throw 'Error acquiring new user session.'

            return { session, isNewUser, error: null }
        } catch (e) {
            return { session: null, isNewUser: false, error: e as ApiError }
        }
    }
}
