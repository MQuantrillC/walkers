// Social apps open links in their own embedded browser, where Google
// refuses to sign people in ("disallowed_useragent"). Detect those so we can
// send people to their real browser first. "Barcelona" is Threads.
const IN_APP =
  /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|Barcelona|musical_ly|TikTok|Bytedance|Snapchat|Line\/|LinkedInApp|Twitter|Pinterest|WhatsApp|Discord/i;
// Any other app's built-in Android browser (a WebView) marks itself "; wv)".
const ANDROID_WEBVIEW = /Android.*; wv\)/;

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP.test(userAgent) || ANDROID_WEBVIEW.test(userAgent);
}

export function isAndroid(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

// Opens the same page in Chrome on Android (Instagram honours intent links).
export function chromeIntentUrl(href: string): string {
  const url = new URL(href);
  return `intent://${url.host}${url.pathname}${url.search}${url.hash}#Intent;scheme=${url.protocol.replace(":", "")};package=com.android.chrome;end`;
}
