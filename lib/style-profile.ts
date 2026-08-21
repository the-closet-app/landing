import {
	deleteField,
	doc,
	getDoc,
	serverTimestamp,
	setDoc,
	type DocumentData,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';

import { getFirebaseDb } from '@/lib/firebase';

export type StyleProfileInput = {
	gender?: string;
	race?: string;
};

export type StyleProfile = StyleProfileInput & {
	createdAt?: DocumentData;
	updatedAt?: DocumentData;
};

export const styleProfileCollection = 'claiUserProfiles';

function cleanProfileValue(value?: string) {
	return value?.trim() || undefined;
}

export function normalizeStyleProfile(profile: StyleProfileInput) {
	return {
		gender: cleanProfileValue(profile.gender),
		race: cleanProfileValue(profile.race),
	};
}

function removeUndefinedValues(profile: StyleProfileInput) {
	const normalized = normalizeStyleProfile(profile);

	return Object.fromEntries(
		Object.entries(normalized).filter(([, value]) => value !== undefined)
	);
}

export function hasStyleProfileValue(profile: StyleProfileInput) {
	const normalized = normalizeStyleProfile(profile);

	return Boolean(normalized.gender || normalized.race);
}

export async function getStyleProfile(user: User) {
	const profileRef = doc(getFirebaseDb(), styleProfileCollection, user.uid);
	const snapshot = await getDoc(profileRef);

	if (!snapshot.exists()) {
		return null;
	}

	return snapshot.data() as StyleProfile;
}

export async function saveStyleProfile(user: User, profile: StyleProfileInput) {
	const normalized = normalizeStyleProfile(profile);
	const cleanedProfile = removeUndefinedValues(profile);
	const profileRef = doc(getFirebaseDb(), styleProfileCollection, user.uid);

	await setDoc(
		profileRef,
		{
			...cleanedProfile,
			bodyType: deleteField(),
			email: user.email ?? null,
			name: user.displayName ?? null,
			updatedAt: serverTimestamp(),
			...(hasStyleProfileValue(normalized)
				? {}
				: { skippedOptionalProfile: true }),
			createdAt: serverTimestamp(),
		},
		{ merge: true }
	);
}

export function getStyleProfileErrorMessage(error: unknown) {
	const code = (error as FirebaseError | undefined)?.code;

	if (code === 'permission-denied') {
		return 'Unable to save your style profile. Firestore permissions need to allow claiUserProfiles for signed-in users.';
	}

	if (code === 'unavailable') {
		return 'Unable to save your style profile right now. Please try again in a moment.';
	}

	return 'Unable to save your style profile right now.';
}
