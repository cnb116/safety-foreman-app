export const isKakao = () => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.indexOf('kakaotalk') > -1;
};

export const isAndroid = () => {
    if (typeof window === 'undefined') return false;
    return /android/i.test(window.navigator.userAgent);
};

export const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

export const openInChrome = () => {
    if (!isKakao()) return;

    if (isAndroid()) {
        // Android: Use intent scheme to open Chrome
        const url = window.location.href.replace(/^https?:\/\//i, '');
        const intentUrl = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;
    } else {
        // iOS or others: Just return false so the UI can show a modal
        return false;
    }
};
