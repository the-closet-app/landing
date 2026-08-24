'use client';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function PrivacyPolicy() {
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
						Privacy Policy
					</h1>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						1 · Who We Are
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						CLAi (“CLAi”, “we”, “us”, “our”) is the trading name of
						The Closet App LTD, a company registered in England and
						Wales under company number 16742543, with its registered
						office at 20 Lesney Park Road, United Kingdom.
					</p>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						You can contact us about data protection matters at:
						info@theclai.co.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						2 · Scope of This Policy
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						This Privacy Policy applies to personal information we
						collect when you:
					</p>
					<ul
						className={`z-10 list-disc pl-6 font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>join our waitlist;</li>
						<li>
							take part in our beta or early access programme;
						</li>
						<li>use the CLAi fashion intelligence chatbot; or</li>
						<li>
							contact us or interact with us in any other way.
						</li>
					</ul>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						This policy does not cover third-party websites or
						services linked from CLAi.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						3 · Information We Collect
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						3.1 · Information you give us
					</p>
					<ul
						className={`z-10 list-disc pl-6 font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>
							Your name and email address when you join the
							waitlist or sign up.
						</li>
						<li>
							Messages you send to the CLAi chatbot, including
							descriptions of your style, preferences, and goals.
						</li>
						<li>
							Photographs or images you choose to upload of
							clothing, outfits, or yourself (always optional -
							see Section 6).
						</li>
						<li>
							Feedback, ratings, survey responses, and comments.
						</li>
					</ul>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						3.2 · Information we collect automatically
					</p>
					<ul
						className={`z-10 list-disc pl-6 font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>
							Device type, browser, operating system, and IP
							address.
						</li>
						<li>
							Usage data: pages visited, features used, session
							duration.
						</li>
						<li>
							Cookie and similar tracking data (see our Cookie
							Notice).
						</li>
					</ul>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						4 · How We Use Your Information and Our Lawful Bases
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
									<th className="w-[60%] px-4 py-3 text-left font-medium">
										Purpose
									</th>
									<th
										className={`w-[40%] border-l px-4 py-3 text-left font-medium ${
											isLight
												? 'border-[#1C1C1C]/10'
												: 'border-white/10'
										}`}
									>
										Lawful Basis
									</th>
								</tr>
							</thead>
							<tbody>
								{[
									{
										purpose:
											'To operate the CLAi chatbot and waitlist',
										information:
											'Contract / Legitimate interests',
									},
									{
										purpose:
											'To generate styling and fashion guidance',
										information:
											'Contract / Legitimate interests',
									},
									{
										purpose:
											'To process images, you upload',
										information: 'Consent',
									},
									{
										purpose:
											'To improve and develop the product',
										information: 'Legitimate interests',
									},
									{
										purpose:
											'To send you waitlist and launch communications',
										information:
											'Consent (PECR) / Contract',
									},
									{
										purpose:
											'To send optional marketing emails',
										information: 'Consent',
									},
									{
										purpose:
											'To comply with legal obligations',
										information: 'Legal obligation',
									},
									{
										purpose:
											'To protect our rights and the platform',
										information: 'Legitimate interests',
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
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						5 · AI Processing and Third Parties
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						To generate responses, the content of your chats - including text and any images you upload - is processed by our AI provider, Google Gemini via Vertex AI on Google Cloud Platform, which acts as our data processor under a written agreement with us.
					</p>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						We do not sell your personal information to any third party.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						6 · Photographs and Image Processing
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						Uploading a photograph is always optional. You can use CLAi without uploading any images.
					</p>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						If you choose to upload an image, we use it only to provide you with more personalised fashion guidance.
					</p>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						We do not use your images for advertising or marketing purposes.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						7 · Sharing Your Information
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						We share personal information only in the following circumstances:
					</p>
					<ul
						className={`z-10 list-disc pl-6 font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>
							<strong>Service providers:</strong> companies that help us operate CLAi, including our AI provider (Google), hosting provider, and analytics tools, each under contracts requiring them to protect your information.
						</li>
						<li>
							<strong>Legal requirements:</strong> where we are required to disclose information by law, court order, or regulatory authority.
						</li>
						<li>
							<strong>Business transfers:</strong> in the event of a merger, acquisition, or sale of assets, your information may be transferred to the relevant third party, who will be required to honour this policy.
						</li>
						<li>
							<strong>Protection of rights:</strong> where necessary to protect the security or integrity of the platform, or the rights of CLAi or its users.
						</li>
					</ul>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						We do not sell, rent, or trade your personal information.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						8 · International Transfers
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						CLAi is operated by The Closet App LTD, a company registered in England and Wales. Our primary markets are the United Kingdom, the United States, Canada, 
						Nigeria, and selected additional African and Middle Eastern markets. Your personal information may be processed in countries other than the one in which you 
						are located, including in the United Kingdom and the United States, where our AI provider Google (Vertex AI / Gemini) and certain hosting and analytics 
						infrastructure are located.
					</p>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						Where your personal information is transferred across borders, we ensure that appropriate safeguards are in place in accordance with the data protection laws 
						applicable to your location, as set out below.
					</p>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						8.1 · Transfers Involving UK Users (UK GDPR)
					</p>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						For transfers of personal information from the United Kingdom to third countries, we rely on the following mechanisms under the UK GDPR and the Data Protection 
						Act 2018:
					</p>
					<ul
						className={`z-10 list-disc pl-6 font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>
							<strong>UK Adequacy Regulations</strong>: Where the UK Secretary of State has determined that a destination country provides an adequate level of data protection, we may transfer personal information on that basis without additional safeguards.
						</li>
						<li>
							<strong>UK International Data Transfer Agreement (IDTA)</strong>:For transfers to countries not covered by a UK adequacy decision, we rely on the IDTA, the standard contractual clauses approved by the Information Commissioner&apos;s Office (ICO). We have entered into, or will enter into, UK IDTAs with all relevant service providers handling UK personal data outside the UK.
						</li>
						<li>
							<strong>UK Addendum to EU Standard Contractual Clauses</strong>: Where a service provider uses the EU SCCs as their primary transfer mechanism, we supplement those with the UK Addendum issued by the ICO, which adapts the EU SCCs for UK law.
						</li>
					</ul>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						8.2 · Transfers Involving EEA Users (EU GDPR)
					</p>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						For transfers of personal information from the European Economic Area to third countries, we rely on the following mechanisms under EU GDPR 2016/679:
					</p>
					<ul
						className={`z-10 list-disc pl-6 font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>
							<strong>EU Adequacy Decisions (Article 45)</strong>: Where the European Commission has determined that a destination country provides adequate protection.
						</li>
						<li>
							<strong>EU Standard Contractual Clauses (Article 46)</strong>: For transfers not covered by adequacy, we rely on the European Commission&apos;s Standard Contractual Clauses adopted in June 2021 (Decision 2021/914), incorporating Module 2 (Controller to Processor) where applicable. We have entered into, or will enter into, EU SCCs with all relevant processors handling EEA personal data outside the EEA.
						</li>
						<li>
							<strong>Transfer Impact Assessments</strong>: Where we rely on SCCs, we conduct or obtain a Transfer Impact Assessment (TIA) to assess whether the laws of the destination country allow the SCCs to be effective.
						</li>
						<li>
							<strong>EU-US Data Privacy Framework (DPF)</strong>: The European Commission adopted an adequacy decision for the EU-US DPF in July 2023.
						</li>
					</ul>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						9 · Retention
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						We keep your personal information only for as long as necessary for the purposes described in this policy, or as required by applicable law.
					</p>
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
									<th className="w-[50%] px-4 py-3 text-left font-medium">
										Data Type
									</th>
									<th
										className={`w-[50%] border-l px-4 py-3 text-left font-medium ${
											isLight
												? 'border-[#1C1C1C]/10'
												: 'border-white/10'
										}`}
									>
										Retention Period
									</th>
								</tr>
							</thead>
							<tbody>
								{[
									{
										purpose:
											'Waitlist email and name',
										information:
											'1 year',
									},
									{
										purpose:
											'Chat logs (text)',
										information:
											'1 year',
									},
									{
										purpose:
											'Uploaded images',
										information: 'Not retained; deleted immediately after processing',
									},
									{
										purpose:
											'To improve and develop the product',
										information: 'Legitimate interests',
									},
									{
										purpose:
											'Beta feedback',
										information:
											'1 year',
									},
									{
										purpose:
											'Legal / compliance records',
										information: '6 year',
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
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						10 · Your Rights
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						If you are located in the United Kingdom or the European Economic Area, you have certain rights under the UK General Data Protection Regulation (UK GDPR), the EU General Data 
						Protection Regulation (EU GDPR 2016/679), and the Data Protection Act 2018 (UK). If you are located outside the United Kingdom or the European Economic Area, you may have the 
						following rights regarding your personal information:
					</p>
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
									<th className="w-[25%] px-4 py-3 text-left font-medium">
										Right
									</th>
									<th
										className={`w-[75%] border-l px-4 py-3 text-left font-medium ${
											isLight
												? 'border-[#1C1C1C]/10'
												: 'border-white/10'
										}`}
									>
										What It Means
									</th>
								</tr>
							</thead>
							<tbody>
								{[
									{
										purpose:
											'Access',
										information:
											'To request a copy of the personal information we hold about you.',
									},
									{
										purpose:
											'Correction',
										information:
											'To ask us to correct inaccurate or incomplete information.',
									},
									{
										purpose:
											'Deletion',
										information: 'To ask us to delete your personal information in certain circumstances.',
									},
									{
										purpose:
											'Restriction',
										information: 'To ask us to limit how we use your information.',
									},
									{
										purpose:
											'Objection',
										information:
											'To object to our processing based on legitimate interests.',
									},
									{
										purpose:
											'Portability',
										information: 'To receive your data in a structured, machine-readable format.',
									},
									{
										purpose:
											'Withdraw Consent',
										information: 'Where processing is based on consent, to withdraw it at any time.',
									},
									{
										purpose:
											'CCPA / CPRA (California)',
										information: 'If you are a California resident, the California Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act (CPRA), grants you the following rights in addition to those listed above: Right to Know: You have the right to request that we disclose the categories and specific pieces of personal information we have collected about you, the categories of sources from which it was collected, the business or commercial purpose for collecting, selling, or sharing it, the categories of third parties to whom we disclose it, and whether we sell or share your personal information. Right to Delete: You have the right to request deletion of personal information we have collected from you, subject to certain exceptions (for example, where retention is necessary to complete a transaction, detect security incidents, or comply with a legal obligation). Right to Correct: You have the right to request correction of inaccurate personal information we maintain about you. Right to Opt Out of Sale or Sharing: You have the right to opt out of the sale of your personal information and the sharing of your personal information for cross-context behavioural advertising purposes. CLAi does not sell your personal information. To opt out, contact:info@theclai.co . Right to Limit Use of Sensitive Personal Information: Where CLAi processes sensitive personal information (which may include the contents of your messages, photographs, and information about your style preferences), you have the right to direct us to limit our use of that information to the purposes permitted under the CPRA (broadly, providing the service you requested). To exercise this right, contact: info@theclai.co .Right to Non-Discrimination: We will not discriminate against you for exercising any of your CCPA/CPRA rights. We will not deny you goods or services, charge you different prices, provide a different level or quality of service, or suggest that you will receive a different price or quality of service because you exercised a right under the CCPA/CPRA. Right to Data Portability: To the extent applicable, you have the right to receive your personal information in a portable, usable format. How to Exercise Your California Rights: Submit a verifiable consumer request to info@theclai.co. We will respond within 45 days of receiving a verifiable request (extendable by a further 45 days where necessary, with notice). You may designate an authorised agent to submit a request on your behalf, subject to verification. California "Shine the Light" Law (Civil Code § 1798.83): California residents may also request, once per calendar year, information about personal information shared with third parties for their direct marketing purposes. If applicable, contact info@theclai.co.',
									},
									{
										purpose:
											'PIPEDA (Canada)',
										information: 'To access information, challenge accuracy, and complain to the Office of the Privacy Commissioner.',
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
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						To exercise any right, contact us at info@theclai.co. We will respond within the timeframe required by applicable law (in the UK, within one calendar month).
					</p>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						You also have the right to complain to a supervisory authority. In the UK, this is the Information Commissioner&apos;s Office (ICO): ico.org.uk / 0303 123 1113.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						11 · Children
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						CLAi is not intended for use by anyone under the age of 16. We do not knowingly collect personal information from children under this age. If you believe we have inadvertently collected information from a child, please contact us at info@theclai.co and we will delete it promptly.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						12 · Changes to This Policy
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						We may update this Privacy Policy from time to time. We will post any updated version on our website with a revised &quot;last updated&quot; date. Where changes are material, we will notify you by email (if we have your address) or by a prominent notice on the platform before the changes take effect.
					</p>
					<h2
						className={`z-10 mt-4 text-left font-mackinac text-[1.25rem] font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.5rem] ${subheadingClass}`}
					>
						13 · Contact
					</h2>
					<p
						className={`z-10 font-antique-legacy text-base font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						For any questions about this Privacy Policy or to exercise your rights:
					</p>
					<ul
						className={`z-10 list-disc pl-6 font-antique-legacy font-normal leading-[1.4] tracking-[-.01em] sm:text-[1.1rem] ${bodyClass}`}
					>
						<li>
							Privacy / data rights enquiries: info@theclai.co
						</li>
						<li>
							General enquiries: info@theclai.co
						</li>
						<li>
							Postal address: The Closet App LTD, 20 Lesney Park Road, United Kingdom
						</li>
					</ul>
				</section>
			</main>
			<Footer />
		</div>
	);
}
