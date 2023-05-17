const crypto = require('crypto').webcrypto;

/**
 * Generates key that can be used for e2ee, using some salt param.
 * @param value - The value to use to generate key.
 * @param salt - The salt.
 */
export async function generateKey(value: string, salt: Uint8Array) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        value,
        'PBKDF2',
        false,
        [ 'deriveKey' ]
    );

    const dk = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 128
        },
        true,
        [ 'encrypt', 'decrypt' ]
    );

    const toHexString = (bytes: ArrayBuffer) =>
        Array.from(new Uint8Array(bytes), (byte: number) =>
            // eslint-disable-next-line no-bitwise
            `0${(byte & 0xff).toString(16)}`.slice(-2)).join('');

    return toHexString(await crypto.subtle.exportKey('raw', dk));
}
