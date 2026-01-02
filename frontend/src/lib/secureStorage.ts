// First import the module 
import * as Keychain from 'react-native-keychain'

// Define the service we are working with here - Supabase
// This is a namespace inside the Keychain which prevents collisions with other credentials

const SERVICE = 'supabase-auth'

// Then  we export an object that implements Supabase’s storage adapter interface
// Supabase will call these methods automatically

export const secureStorage ={
    // When the app starts supabase needs an access token and refresh token, hence, the keychain shoudl provide it
    async getItem(key: string): Promise<string | null> {
        // Now, we read encrypted credentials from the iOS Keychain and return  username, password OR false if nothing is stored
        const credentials = await Keychain.getGenericPassword({service: SERVICE});
        // 
        if (!credentials) return null;
        // No tokens stored yet then the user is logged out
        // Supabase treats this as “no session”        
        const stored = JSON.parse(credentials.password);
        // Return exactly the token Supabase asked for
        return stored[key] ?? null;
    },

    // Supabase will call the following function when the user logs in, we need to refresh the token or we have a change in session
    async setItem(key: string, value: string): Promise<void>{
        // Read existing stored tokens (if any)
        const existing = await Keychain.getGenericPassword({service: SERVICE});

        // If tokens exist, load them otherwise start with empty object
        const data = existing ? JSON.parse(existing.password): {};
        // Add or overwrite the token Supabase wants to store
        data[key] = value;
        //  Write encrypted data to Keychain
        await Keychain.setGenericPassword('supabase', JSON.stringify(data), {
            service: SERVICE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        })
    },

    // Supabase calls this when the user is logged out or we have an invalid token
    async removeItem(key: string): Promise<void>{
        // Load current stored tokens
        const existing = await Keychain.getGenericPassword({service: SERVICE});
        // exit if there is nothing to delete
        if (!existing) return;

        // Deserialize stored token
        const data = JSON.parse(existing.password)
        // Remove only the requested token
        delete data[key];

        // If no token if left, then swipe Supabase credentials from Keychain

        if (Object.keys(data).length === 0) {
            await Keychain.resetGenericPassword({service: SERVICE});
        } else {
            // Otherwise, rewrite remaining tokens back securely
        await Keychain.setGenericPassword('supabase', JSON.stringify(data), {
            service: SERVICE,
        });
        }

    }

}