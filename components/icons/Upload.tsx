type ImageIconProps = {
	className?: string;
};

export function Upload({ className }: ImageIconProps) {
	return (
		<svg
			className={className ?? 'size-5'}
			viewBox="0 0 24 24"
			fill="none"
			stroke="#787878"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<circle cx="8.5" cy="10" r="1.5" />
			<path d="m21 15-4.2-4.2a1.4 1.4 0 0 0-2 0L6 19" />
		</svg>
	);
}
