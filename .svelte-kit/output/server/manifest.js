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
		client: {start:"_app/immutable/entry/start.DuO10YSK.js",app:"_app/immutable/entry/app.-H_R0yXF.js",imports:["_app/immutable/entry/start.DuO10YSK.js","_app/immutable/chunks/D5XyXvX-.js","_app/immutable/chunks/-KxTRp3Z.js","_app/immutable/chunks/TOAQLBvW.js","_app/immutable/entry/app.-H_R0yXF.js","_app/immutable/chunks/-KxTRp3Z.js","_app/immutable/chunks/BKCavI18.js","_app/immutable/chunks/BNlA6_UX.js","_app/immutable/chunks/TOAQLBvW.js","_app/immutable/chunks/Cy9E0dei.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
