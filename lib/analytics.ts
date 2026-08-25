'use client';

export const cookieConsentKey = 'clai-cookie-consent';
export const cookieConsentChangedEvent = 'clai-cookie-consent-changed';

type GtagCommand =
	| ['config', string, Record<string, unknown>?]
	| ['event', string, Record<string, unknown>?]
	| ['js', Date];

declare global {
	interface Window {
		dataLayer?: GtagCommand[];
		gtag?: (...args: GtagCommand) => void;
	}
}

export function hasAnalyticsConsent() {
	if (typeof window === 'undefined') {
		return false;
	}

	return window.localStorage.getItem(cookieConsentKey) === 'accepted';
}

export function trackEvent(
	name: string,
	parameters: Record<string, unknown> = {}
) {
	if (
		typeof window === 'undefined' ||
		!window.gtag ||
		!hasAnalyticsConsent()
	) {
		return;
	}

	window.gtag('event', name, parameters);
}
