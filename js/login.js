import { session_set, session_get, session_check } from './session.js';
import { encrypt_text, decrypt_text } from './crypto.js';
import { generateJWT, checkAuth } from './jwt_token.js';
import { encryptAES } from './crypto2.js';

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init_logined(){
    if(sessionStorage){
        decrypt_text();
    }
    else{
        alert("세션 스토리지 지원 x");
    }
}


const check_xss = (input) => {
    const DOMPurify = window.DOMPurify;
    const sanitizedInput = DOMPurify.sanitize(input);

    if (sanitizedInput !== input) {
        alert('XSS 공격 가능성이 있는 입력값을 발견했습니다');
        return false;
    }
    return sanitizedInput;
};

//  범용 쿠키 저장 함수
function setCookie(name, value, expiredays) {
    const date = new Date();
    date.setDate(date.getDate() + expiredays);
    document.cookie = `${escape(name)}=${escape(value)}; expires=${date.toUTCString()}; path=/`;
}

//  범용 쿠키 가져오기 함수
function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [key, value] = cookie.split('=');
        if (key === name) {
            return unescape(value);
        }
    }
    return null;
}

//  로그인 횟수 증가 함수
function login_count() {
    let count = parseInt(getCookie("login_cnt")) || 0;
    count += 1;
    setCookie("login_cnt", count, 7);
    console.log(` 로그인 횟수: ${count}`);
}

//  로그아웃 횟수 증가 함수
function logout_count() {
    let count = parseInt(getCookie("logout_cnt")) || 0;
    count += 1;
    setCookie("logout_cnt", count, 7);
    console.log(` 로그아웃 횟수: ${count}`);
}

function init() {
    const emailInput = document.getElementById('typeEmailX');
    const idsave_check = document.getElementById('idSaveCheck');
    let get_id = getCookie("id");

    if (get_id) {
        emailInput.value = get_id;
        idsave_check.checked = true;
    }
    session_check();
}

    
function session_del() {
    if (sessionStorage) {
        sessionStorage.removeItem("Session_Storage_test");
        alert('로그아웃 버튼 클릭 확인 : 세션 스토리지를 삭제합니다.');
    } else {
        alert("세션 스토리지 지원 x");
    }
}

function logout() {
    session_del();
    logout_count(); //  로그아웃 횟수 증가
    location.href = '../index.html';
}

function login_failed() {
    let failCount = parseInt(getCookie("fail_cnt")) || 0;
    failCount += 1;

    setCookie("fail_cnt", failCount, 1);

    if (failCount >= 3) {
        setCookie("login_block", "true", 0.003); // 약 4분
        alert("로그인 가능 횟수를 초과했습니다. 4분간 로그인이 제한됩니다.");
        return false;
    } else {
        alert(`로그인 실패 (${failCount}/3회)`);
        return true;
    }
}
function is_login_blocked() {
    return getCookie("login_block") === "true";
}


const check_input = async () => {
    const idsave_check = document.getElementById('idSaveCheck');
    const loginForm = document.getElementById('login_form');
    const emailInput = document.getElementById('typeEmailX');
    const passwordInput = document.getElementById('typePasswordX');

    // ✅ 로그인 차단 여부 먼저 확인
    if (is_login_blocked()) {
        alert("로그인 가능 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.");
        return false;
    }

    alert('아이디, 패스워드를 체크합니다');

    const emailValue = emailInput.value.trim();
    const passwordValue = passwordInput.value.trim();

    const payload = {
        id: emailValue,
        exp: Math.floor(Date.now() / 1000) + 3600
    };
    const jwtToken = generateJWT(payload);

    const sanitizedPassword = check_xss(passwordValue);
    const sanitizedEmail = check_xss(emailValue);

    // 아래부터 모든 실패 조건마다 login_failed() 호출 추가
    if (emailValue.length > 10) {
        alert('이메일은 10글자 이하로 입력해야 합니다.');
        login_failed();
        return false;
    }

    if (passwordValue.length > 15) {
        alert('비밀번호는 15글자 이하로 입력해야 합니다.');
        login_failed();
        return false;
    }

    const repeat3Pattern = /(...)\1+/;
    if (repeat3Pattern.test(emailValue) || repeat3Pattern.test(passwordValue)) {
        alert('3글자 이상의 반복된 패턴은 사용할 수 없습니다.');
        login_failed();
        return false;
    }

    const repeat2DigitPattern = /(\d{2})[a-zA-Z가-힣]*\1/;
    if (repeat2DigitPattern.test(emailValue) || repeat2DigitPattern.test(passwordValue)) {
        alert('2자리 숫자를 반복해서 사용할 수 없습니다.');
        login_failed();
        return false;
    }

    if (emailValue.length < 5) {
        alert('아이디는 최소 5글자 이상 입력해야 합니다.');
        login_failed();
        return false;
    }

    if (passwordValue.length < 12) {
        alert('비밀번호는 반드시 12글자 이상 입력해야 합니다.');
        login_failed();
        return false;
    }

    const hasSpecialChar = passwordValue.match(/[!,@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/) !== null;
    if (!hasSpecialChar) {
        alert('패스워드는 특수문자를 1개 이상 포함해야 합니다.');
        login_failed();
        return false;
    }

    const hasUpperCase = passwordValue.match(/[A-Z]+/) !== null;
    const hasLowerCase = passwordValue.match(/[a-z]+/) !== null;
    if (!hasUpperCase || !hasLowerCase) {
        alert('패스워드는 대소문자를 1개 이상 포함해야 합니다.');
        login_failed();
        return false;
    }

    if (!sanitizedEmail || !sanitizedPassword) {
        login_failed();
        return false;
    }

    if (idsave_check.checked === true) {
        alert("쿠키를 저장합니다.", emailValue);
        setCookie("id", emailValue, 1);
        alert("쿠키 값 :" + emailValue);
    } else {
        setCookie("id", emailValue.value, 0);
    }

    // ✅ 로그인 성공 시 실패 쿠키 제거
    setCookie("fail_cnt", 0, -1);
    setCookie("login_block", "", -1);

    console.log('이메일:', emailValue);
    console.log('비밀번호:', passwordValue);

    session_set();
    localStorage.setItem('jwt_token', jwtToken);

    const encrypted = await encryptAES(passwordValue);
    sessionStorage.setItem("Session_Storage_pass2", encrypted);

    login_count();
    loginForm.submit();
};


document.getElementById("login_btn").addEventListener('click', check_input);
