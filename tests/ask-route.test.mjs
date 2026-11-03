import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadRoute(providerResult) {
	let charged = 0;
	let requestBody;
	const requests = [];
	const results = Array.isArray(providerResult) ? [...providerResult] : null;
	const modules = {
		'@/lib/firebase-auth-server': {
			getBearerToken: () => 'test-token',
			requireAuthenticatedUser: async () => ({ localId: 'test-user' }),
		},
		'@/lib/daily-usage-server': {
			getDailyMessageUsage: async () => ({ used: 0, limit: 20 }),
			incrementDailyMessageUsage: async () => {
				charged++;
				return { used: 1, limit: 20 };
			},
		},
		'@/lib/chat-history-server': {
			saveAskChatTurn: async () => 'saved-message',
		},
		'@/lib/style-profile-server': {
			getServerStyleProfile: async () => null,
			formatStyleProfileForPrompt: () => '',
		},
		'@/lib/no-store-response': {
			noStoreJson: (body, init) => Response.json(body, init),
		},
	};
	const exports = {};
	vm.runInNewContext(
		ts.transpileModule(
			fs.readFileSync(
				new URL('../app/api/ask/route.ts', import.meta.url),
				'utf8'
			),
			{ compilerOptions: { module: ts.ModuleKind.CommonJS } }
		).outputText,
		{
			exports,
			crypto,
			console,
			Error,
			AbortSignal,
			process: { env: { GEMINI_API_KEY: 'test-key' } },
			require: (name) => {
				assert.ok(modules[name], name);
				return modules[name];
			},
			fetch: async (_url, init) => {
				requestBody = JSON.parse(init.body);
				requests.push(requestBody);
				assert.ok(init.signal instanceof AbortSignal);
				if (providerResult instanceof Error) throw providerResult;
				return Response.json(
					results ? results.shift() : providerResult
				);
			},
		}
	);
	return {
		charged: () => charged,
		requestBody: () => requestBody,
		requests,
		post: () =>
			exports.POST(
				new Request('https://clai.test/api/ask', {
					method: 'POST',
					body: JSON.stringify({
						prompt: 'Recreate this outfit',
						image: { data: 'aW1hZ2U=', mimeType: 'image/jpeg' },
					}),
				})
			),
	};
}

test('image advice has room for both bounded thinking and a complete answer', async () => {
	const route = loadRoute({
		candidates: [
			{
				finishReason: 'STOP',
				content: {
					parts: [
						{
							text: JSON.stringify({
								answer: 'Try a checked jacket and matching trousers.',
								intent: 'image_analysis',
								scope: 'in_scope',
							}),
						},
					],
				},
			},
		],
	});
	const response = await route.post();
	assert.equal(response.status, 200);
	assert.equal(
		(await response.json()).answer,
		'Try a checked jacket and matching trousers.'
	);
	const config = route.requestBody().generationConfig;
	assert.equal(config.maxOutputTokens, 8192);
	assert.equal(config.thinkingConfig.thinkingBudget, 1024);
	assert.ok(
		config.maxOutputTokens - config.thinkingConfig.thinkingBudget > 2400
	);
	assert.equal(route.charged(), 1);
	assert.equal(route.requests.length, 1);
});

test('truncated answers are rejected without charging or saving a partial answer', async () => {
	const route = loadRoute({
		candidates: [
			{
				finishReason: 'MAX_TOKENS',
				content: { parts: [{ text: '{"answer":"Try' }] },
			},
		],
	});
	const response = await route.post();
	assert.equal(response.status, 502);
	assert.match((await response.json()).error, /did not finish/);
	assert.equal(route.charged(), 0);
	assert.equal(route.requests.length, 2);
	assert.equal(route.requests[1].generationConfig.maxOutputTokens, 16384);
});

test('a truncated response retries with more room and charges only for the completed answer', async () => {
	const route = loadRoute([
		{
			candidates: [
				{
					finishReason: 'MAX_TOKENS',
					content: { parts: [{ text: '{"answer":"Try' }] },
				},
			],
		},
		{
			candidates: [
				{
					finishReason: 'STOP',
					content: {
						parts: [
							{
								text: JSON.stringify({
									answer: 'Try a checked jacket and matching trousers.',
									intent: 'image_analysis',
									scope: 'in_scope',
								}),
							},
						],
					},
				},
			],
		},
	]);
	const response = await route.post();
	assert.equal(response.status, 200);
	assert.equal(
		(await response.json()).answer,
		'Try a checked jacket and matching trousers.'
	);
	assert.equal(route.requests.length, 2);
	assert.equal(route.requests[0].generationConfig.maxOutputTokens, 8192);
	assert.equal(route.requests[1].generationConfig.maxOutputTokens, 16384);
	assert.deepEqual(route.requests[0].contents, route.requests[1].contents);
	assert.equal(route.charged(), 1);
});

test('provider timeouts return a usable error without charging usage', async () => {
	const error = new Error('Timed out');
	error.name = 'TimeoutError';
	const route = loadRoute(error);
	const response = await route.post();
	assert.equal(response.status, 504);
	assert.match((await response.json()).error, /too long/);
	assert.equal(route.charged(), 0);
});

test('network failures return a usable error without charging usage', async () => {
	const route = loadRoute(new TypeError('fetch failed'));
	assert.equal((await route.post()).status, 502);
	assert.equal(route.charged(), 0);
});
