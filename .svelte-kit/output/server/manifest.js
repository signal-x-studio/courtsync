export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.EEx_Nw8q.js",app:"_app/immutable/entry/app.BXUxEgaq.js",imports:["_app/immutable/entry/start.EEx_Nw8q.js","_app/immutable/chunks/CGJWVwF2.js","_app/immutable/chunks/DTDYVkq9.js","_app/immutable/chunks/DkSoYLQ2.js","_app/immutable/chunks/BjjkZpt7.js","_app/immutable/entry/app.BXUxEgaq.js","_app/immutable/chunks/DTDYVkq9.js","_app/immutable/chunks/Dic7hVay.js","_app/immutable/chunks/CR2NmSyQ.js","_app/immutable/chunks/BjjkZpt7.js","_app/immutable/chunks/Cpy35fQB.js","_app/immutable/chunks/DkSoYLQ2.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
