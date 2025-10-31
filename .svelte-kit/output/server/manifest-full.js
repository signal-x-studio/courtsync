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
		client: {start:"_app/immutable/entry/start.DJnkGd4X.js",app:"_app/immutable/entry/app.lH6XwKrM.js",imports:["_app/immutable/entry/start.DJnkGd4X.js","_app/immutable/chunks/0RgWlnTW.js","_app/immutable/chunks/Pko6iT02.js","_app/immutable/chunks/BaKoRTVr.js","_app/immutable/entry/app.lH6XwKrM.js","_app/immutable/chunks/Pko6iT02.js","_app/immutable/chunks/DOfG5Qiu.js","_app/immutable/chunks/BGoQ7gJS.js","_app/immutable/chunks/BaKoRTVr.js","_app/immutable/chunks/BqARAWy1.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
