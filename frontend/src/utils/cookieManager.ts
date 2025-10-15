export const getCookie = (name: string): string | null => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.split('=');
        if (cookieName.trim() === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null; // Cookie not found
}

export function setCookie(key: string, value: string) {
  document.cookie = `${key}=${value}; path=/; max-age=31536000`;
}
