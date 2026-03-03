/**
 * HogarSafe - Módulo de Cifrado AES-GCM
 * Proporciona cifrado y descifrado local de datos financieros.
 */

// Generamos o recuperamos una clave persistente localmente
// En una implementación real, esta clave podría derivarse de un PIN local o Biometría
const STORAGE_KEY_NAME = 'hogarsafe_master_key';

async function getOrCreateKey(): Promise<CryptoKey> {
    const storedKey = localStorage.getItem(STORAGE_KEY_NAME);

    if (storedKey) {
        const rawKey = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
        return await crypto.subtle.importKey(
            'raw',
            rawKey,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Generar nueva clave si no existe
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const exported = await crypto.subtle.exportKey('raw', key);
    const base64Key = btoa(String.fromCharCode(...new Uint8Array(exported)));
    localStorage.setItem(STORAGE_KEY_NAME, base64Key);

    return key;
}

export async function encryptData(data: any): Promise<{ encrypted: string, iv: string }> {
    const key = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
    );

    return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

export async function decryptData(encryptedBase64: string, ivBase64: string): Promise<any> {
    try {
        const key = await getOrCreateKey();
        const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (error) {
        console.error('Error descifrando datos:', error);
        return null;
    }
}
