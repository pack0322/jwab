const aesKeyRaw = new TextEncoder().encode('12345678901234567890123456789012'); // 32 chars

// 암호화 함수
export async function encryptAES(text) {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96bit IV
    const key = await crypto.subtle.importKey(
        "raw",
        aesKeyRaw,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    const encoded = new TextEncoder().encode(text);
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );

    // 결과를 base64로 JSON 포맷 반환 (iv 포함)
    const result = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(ciphertext))
    };
    return btoa(JSON.stringify(result));
}

// 복호화 함수
export async function decryptAES(base64Str) {
    const decoded = JSON.parse(atob(base64Str));
    const iv = new Uint8Array(decoded.iv);
    const ciphertext = new Uint8Array(decoded.data);

    const key = await crypto.subtle.importKey(
        "raw",
        aesKeyRaw,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}
