'use client';

import { useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import type { SavedChatMessage } from '@/lib/chat-history-server';

type ResponseFeedbackProps = {
	chatId: string;
	messageId: string;
	user: User;
	feedback: SavedChatMessage['feedback'];
	onChange: (feedback: SavedChatMessage['feedback']) => void;
};

export function ResponseFeedback({
	chatId,
	messageId,
	user,
	feedback,
	onChange,
}: ResponseFeedbackProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState('');
	const savingRef = useRef(false);

	async function handleFeedback(value: 'up' | 'down') {
		if (savingRef.current) return;
		savingRef.current = true;
		setIsSaving(true);
		setError('');
		const nextFeedback = feedback === value ? null : value;
		try {
			const idToken = await user.getIdToken();
			const response = await fetch('/api/chat-feedback', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${idToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chatId,
					messageId,
					feedback: nextFeedback,
				}),
			});
			if (!response.ok)
				throw new Error('Unable to save feedback. Please try again.');
			onChange(nextFeedback ?? undefined);
		} catch {
			setError('Unable to save feedback. Please try again.');
		} finally {
			savingRef.current = false;
			setIsSaving(false);
		}
	}

	return (
		<div className="mt-3">
			<div
				role="group"
				aria-label="Rate this response"
				aria-busy={isSaving}
				className="flex items-center gap-1"
			>
				{(['up', 'down'] as const).map((value) => (
					<button
						key={value}
						type="button"
						aria-label={
							value === 'up'
								? 'Helpful response'
								: 'Unhelpful response'
						}
						title={
							value === 'up'
								? 'Helpful response'
								: 'Unhelpful response'
						}
						aria-pressed={feedback === value}
						disabled={isSaving}
						onClick={() => handleFeedback(value)}
						className={`inline-flex size-11 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6CFE1] disabled:cursor-wait disabled:opacity-50 ${feedback === value ? 'bg-white/15 text-white' : 'text-white/60'}`}
					>
						<svg
							viewBox="0 0 24 24"
							fill={feedback === value ? 'currentColor' : 'none'}
							stroke="currentColor"
							strokeWidth="1.6"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
							className={`size-5 ${value === 'down' ? 'rotate-180' : ''}`}
						>
							<path d="M7 10v11H3V10h4Zm0 0 5-8a3 3 0 0 1 2 4l-1 4h6a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17.6 21H7" />
						</svg>
					</button>
				))}
			</div>
			{error ? (
				<p role="alert" className="mt-1 text-sm text-white/80">
					{error}
				</p>
			) : null}
		</div>
	);
}
