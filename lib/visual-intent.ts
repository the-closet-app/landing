export type VisualIntent =
	| 'outfit'
	| 'cleaning'
	| 'repair'
	| 'care'
	| 'alteration'
	| 'comparison';

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasPhrase(text: string, phrases: string[]) {
	return phrases.some((phrase) => {
		const escapedPhrase = escapeRegExp(phrase);
		const pattern = new RegExp(
			`(^|[^a-z0-9])${escapedPhrase}($|[^a-z0-9])`
		);

		return pattern.test(text);
	});
}

function hasPattern(text: string, patterns: RegExp[]) {
	return patterns.some((pattern) => pattern.test(text));
}

export function classifyVisualIntent(prompt: string): VisualIntent {
	const text = prompt.toLowerCase();

	if (
		hasPhrase(text, [
			'compare',
			'comparison',
			'comparison visual',
			'comparison image',
			'which should i buy',
			'should i buy',
			'buy this',
			'buy these',
			'option a',
			'option b',
			'before and after',
			'before-after',
		])
	) {
		return 'comparison';
	}

	if (
		hasPhrase(text, [
			'clean',
			'cleaning',
			'cleaning visual',
			'cleaning image',
			'wash',
			'washing',
			'laundry',
			'remove stain',
			'remove stains',
			'remove dirt',
			'remove marks',
			'spot clean',
			'treat stain',
			'treat stains',
			'brush dirt',
		]) ||
		hasPattern(text, [
			/\bhow\s+(do|can)\s+i\s+clean\b/,
			/\bhow\s+(do|can)\s+i\s+wash\b/,
			/\b(stain|stains|dirty|dirt|marks?)\s+(on|from)\b/,
		])
	) {
		return 'cleaning';
	}

	if (
		hasPhrase(text, [
			'repair',
			'repair visual',
			'repair image',
			'fix',
			'mend',
			'patch',
			'stitch',
			'sew',
			'darn',
			'reattach',
			'button fell',
			'fix zipper',
			'repair zipper',
			'repair hole',
			'fix hole',
			'fix tear',
			'repair tear',
		]) ||
		hasPattern(text, [
			/\bhow\s+(do|can)\s+i\s+(fix|repair|mend|patch|stitch|sew)\b/,
			/\b(hole|holes|tear|torn|ripped|rip)\s+(in|on)\b/,
		])
	) {
		return 'repair';
	}

	if (
		hasPhrase(text, [
			'alter',
			'alteration',
			'alterations',
			'alteration visual',
			'alteration image',
			'altering',
			'hem',
			'hemming',
			'hemline',
			'take in',
			'let out',
			'shorten',
			'shortening',
			'lengthen',
			'lengthening',
			'resize',
			'resizing',
			'adjust fit',
			'tailor this',
			'tailor these',
			'tailor my',
		]) ||
		hasPattern(text, [
			/\bhow\s+(do|can)\s+i\s+(alter|hem|shorten|lengthen|resize)\b/,
			/\b(can|should)\s+i\s+tailor\b/,
		])
	) {
		return 'alteration';
	}

	if (
		hasPhrase(text, [
			'care visual',
			'care image',
			'garment care',
			'fabric care',
			'care for',
			'care of',
			'look after',
			'store',
			'storage',
			'fold',
			'folding',
			'steam',
			'steaming',
			'iron',
			'ironing',
			'maintain',
			'maintenance',
			'protect',
			'preserve',
		]) ||
		hasPattern(text, [
			/\bhow\s+(do|can)\s+i\s+(store|fold|steam|iron|maintain|protect|preserve)\b/,
			/\bhow\s+(do|can)\s+i\s+care\s+for\b/,
		])
	) {
		return 'care';
	}

	if (
		hasPhrase(text, [
			'what should i wear',
			'outfit',
			'look',
			'wear to',
			'wear for',
			'dress for',
			'dressing inspiration',
			'fashion inspiration',
			'outfit inspiration',
			'look inspiration',
			'style inspiration',
			'first day',
			'school',
			'university',
			'college',
			'campus',
			'class',
			'lecture',
			'orientation',
			'wedding',
			'funeral',
			'interview',
			'wimbledon',
			'event',
			'date',
			'presentation',
		])
	) {
		return 'outfit';
	}

	return 'outfit';
}
