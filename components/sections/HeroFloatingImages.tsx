import Image from 'next/image';

const floatingImages = [
	{
		alt: '',
		className:
			'left-[-2.25rem] top-[20%] w-[92px] rotate-[-5deg] clai-float-a lg:left-[-1rem] lg:w-[116px]',
		src: '/top-left.png',
	},
	{
		alt: '',
		className:
			'right-[-2.1rem] top-[20%] w-[90px] rotate-[30deg] clai-float-b lg:right-[-2rem] lg:w-[112px]',
		src: '/top-right.png',
	},
	{
		alt: '',
		className:
			'top-[40%] left-[5%] w-[105px] h-auto rotate-[-7deg] clai-float-c lg:left-[1.5%] lg:w-[175px]',
		src: '/bottom-left.png',
	},
	{
		alt: '',
		className:
			'top-[40%] right-[5%] w-[105px] h-auto rotate-[7deg] clai-float-d lg:right-[1.5%] lg:w-[175px]',
		src: '/bottom-right.png',
	},
];

export function HeroFloatingImages() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 z-[1] hidden overflow-hidden md:block"
		>
			{floatingImages.map((image) => (
				<div
					key={image.src}
					className={`absolute opacity-90 drop-shadow-[0_18px_45px_rgba(0,0,0,0.22)] ${image.className}`}
				>
					<Image
						alt={image.alt}
						className="h-auto w-full rounded-[1.2rem]"
						height={220}
						priority={false}
						src={image.src}
						width={140}
					/>
				</div>
			))}
		</div>
	);
}
