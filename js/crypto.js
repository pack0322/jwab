import { session_set, session_get, session_check } from './session.js';

function encodeByAES256(key, data){ //
    const cipher = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(""), // IV 초기화 벡터
        padding: CryptoJS.pad.Pkcs7, // 패딩
        mode: CryptoJS.mode.CBC //운영 모드
    });
    return cipher.toString();
}

function decodeByAES256(key, data){
    const cipher = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(""),
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
    });
    return cipher.toString(CryptoJS.enc.Utf8);
}

export function encrypt_text(password){
    const k = "key";
    const rk = k.padEnd(32, " ");
    const eb = encodeByAES256(rk, password);
    console.log("암호화된 값:", eb); // 이 위치로 옮기기
    return eb;
}
// export function decrypt_text(){
//     const k = "key"; // 서버의 키
//     const rk = k.padEnd(32, " ");  
//     const eb = session_get();
//     const b = decodeByAES256(rk, eb);
//     console.log(b);
// }

export function decrypt_text(){
    const k = "key"; // 서버의 키
    const rk = k.padEnd(32, " ");  
    const eb = session_get();

    if (!eb) {
        console.warn("sessionStorage에서 암호화된 값이 없음.");
        return;
    }

    try {
        const b = decodeByAES256(rk, eb);
        console.log("복호화된 값:", b);
    } catch (e) {
        console.error("복호화 중 오류 발생:", e.message);
    }
}
