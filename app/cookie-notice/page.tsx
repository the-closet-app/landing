'use client';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function CookieNotice() {
	const { theme } = useTheme();
	const isLight = theme === 'light';
	const pageClass = isLight
		? 'bg-[#eff6fb] text-[#1C1C1C]'
		: 'bg-[#1C1C1C] text-white';
	const headingClass = isLight ? 'text-[#1C1C1C]/90' : 'text-white/90';
	const subheadingClass = isLight ? 'text-[#1C1C1C]/80' : 'text-white/80';
	const bodyClass = isLight ? 'text-[#1C1C1C]/65' : 'text-white/65';

	return (
		<div className={pageClass}>
			<Header />
			<main className="flex justify-center px-4 pb-10 pt-6 sm:min-h-[calc(100svh-132px)] sm:py-20">
				<section className="flex w-[min(92vw,720px)] flex-col items-start gap-4 text-left sm:gap-4 lg:gap-4">
					<h1
						className={`z-10 mb-6 w-full text-center font-mackinac text-[clamp(3.2rem,12vw,3.2rem)] font-normal leading-[1] tracking-[-.04em] sm:max-w-none ${headingClass}`}
					>
						Cookie Notice
					</h1>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						1 · What Are Cookies
					</h2>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work, remember your preferences, and provide 
						information to website owners about how their site is used. CLAi also uses similar technologies such as local storage and session storage, which function in a 
						comparable way.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						2 · How We Use Cookies
					</h2>
					<div
						className={`z-10 w-full overflow-x-auto border font-antique-legacy text-sm leading-[1.4] tracking-[-.01em] sm:text-base ${
							isLight
								? 'border-[#1C1C1C]/10 text-[#1C1C1C]/65'
								: 'border-white/10 text-white/65'
						}`}
					>
						<table className="min-w-[680px] border-collapse">
							<thead>
								<tr
									className={
										isLight
											? 'text-[#1C1C1C]/80'
											: 'text-white/80'
									}
								>
									<th className="w-[35%] px-4 py-3 text-left font-medium">
										Category
									</th>
									<th
										className={`w-[65%] border-l px-4 py-3 text-left font-medium ${
											isLight
												? 'border-[#1C1C1C]/10'
												: 'border-white/10'
										}`}
									>
										Purpose
									</th>
								</tr>
							</thead>
							<tbody>
								{[
									{
										purpose:
											'Strictly necessary',
										information:
											'Essential for the Service to function - e.g. session management, security, load balancing. These cannot be disabled.',
									},
									{
										purpose:
											'Analytics / performance',
										information:
											'Help us understand how visitors use CLAi so we can improve it - e.g. pages visited, time spent, errors encountered.',
									},
									{
										purpose:
											'Functional',
										information: 'Remember your choices and preferences - e.g. language, display settings.',
									},
									{
										purpose:
											'Marketing / Advertising',
										information: 'CLAi does not currently use marketing or advertising cookies. We do not use cookies to serve targeted ads, track users across unrelated websites, or build advertising profiles. If this changes in the future, we will update this Cookie Policy and, where required, ask for user consent before using marketing or advertising cookies.',
									},
								].map((row) => (
									<tr
										key={row.purpose}
										className={
											isLight
												? 'border-t border-[#1C1C1C]/10'
												: 'border-t border-white/10'
										}
									>
										<td className="px-4 py-4 align-top">
											{row.purpose}
										</td>
										<td
											className={`border-l px-4 py-4 align-top ${
												isLight
													? 'border-[#1C1C1C]/10'
													: 'border-white/10'
											}`}
										>
											{row.information}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						3 · Your Choices
					</h2>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						When you first visit CLAi, you will be asked to accept or reject non-essential cookies.
					</p>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						You can also control cookies through your browser settings. Most browsers allow you to refuse or delete cookies. Note that refusing strictly necessary cookies may affect the functionality of the Service.
					</p>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						For more information on controlling cookies, visit: www.aboutcookies.org or www.allaboutcookies.org.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						4 · Third-Party Cookies
					</h2>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						CLAi does not currently use marketing or advertising cookies. We do not use third-party cookies for targeted advertising, retargeting, social media tracking, or cross-site advertising profiles.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						5 · US Users - California (CCPA / CPRA)
					</h2>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						If you are a California resident, you may have additional rights regarding the use of cookies and personal information. Please see our Privacy Policy for your CCPA/CPRA rights and contact info@theclai.co to exercise them.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						6 · Data Protection
					</h2>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						For further information on how we handle your personal data, please see our Privacy Policy.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						7 · Changes to This Notice
					</h2>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						We may update this Cookie Notice from time to time as our use of cookies changes or as the law requires. We will post the updated version here with a revised &quot;last updated&quot; date.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						8 · Contact
					</h2>
					<p
						className={`z-10 text-left font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						For questions about our use of cookies: info@theclai.co
					</p>
				</section>
			</main>
			<Footer />
		</div>
	);
}
