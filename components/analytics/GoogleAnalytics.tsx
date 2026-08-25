'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

import {
	cookieConsentChangedEvent,
	hasAnalyticsConsent,
} from '@/lib/analytics';

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
	const pathname = usePathname();
	const [hasConsent, setHasConsent] = useState(false);
	const hasSkippedInitialPageView = useRef(false);

	useEffect(() => {
		function syncConsent() {
			setHasConsent(hasAnalyticsConsent());
		}

		syncConsent();
		window.addEventListener('storage', syncConsent);
		window.addEventListener(cookieConsentChangedEvent, syncConsent);

		return () => {
			window.removeEventListener('storage', syncConsent);
			window.removeEventListener(cookieConsentChangedEvent, syncConsent);
		};
	}, []);

	useEffect(() => {
		if (!measurementId || !hasConsent || !window.gtag) {
			return;
		}

		if (!hasSkippedInitialPageView.current) {
			hasSkippedInitialPageView.current = true;
			return;
		}

		window.gtag('config', measurementId, {
			page_path: `${window.location.pathname}${window.location.search}`,
		});
	}, [hasConsent, pathname]);

	if (!measurementId || !hasConsent) {
		return null;
	}

	return (
		<>
			<Script
				src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
				strategy="afterInteractive"
			/>
			<Script id="google-analytics" strategy="afterInteractive">
				{`
					window.dataLayer = window.dataLayer || [];
					function gtag(){dataLayer.push(arguments);}
					gtag('js', new Date());
					gtag('config', '${measurementId}', {
						page_path: window.location.pathname + window.location.search
					});
				`}
			</Script>
		</>
	);
}
