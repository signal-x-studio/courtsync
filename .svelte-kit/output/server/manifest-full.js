export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.Dg1MuWNU.js",app:"_app/immutable/entry/app.CM5XYc9s.js",imports:["_app/immutable/entry/start.Dg1MuWNU.js","_app/immutable/chunks/Dys0a_7U.js","_app/immutable/chunks/D8fu8Nzm.js","_app/immutable/chunks/SwpKXNH_.js","_app/immutable/entry/app.CM5XYc9s.js","_app/immutable/chunks/D8fu8Nzm.js","_app/immutable/chunks/DpoftvwD.js","_app/immutable/chunks/2ojvjqKR.js","_app/immutable/chunks/SwpKXNH_.js","_app/immutable/chunks/yzwITP8F.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
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
			},
			{
				id: "/style-guide",
				pattern: /^\/style-guide\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
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
