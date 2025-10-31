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
		client: {start:"_app/immutable/entry/start.CIZ99q__.js",app:"_app/immutable/entry/app.ouoGZB_x.js",imports:["_app/immutable/entry/start.CIZ99q__.js","_app/immutable/chunks/DF9wiufg.js","_app/immutable/chunks/CAX-FWec.js","_app/immutable/chunks/CPr2jWSk.js","_app/immutable/entry/app.ouoGZB_x.js","_app/immutable/chunks/CAX-FWec.js","_app/immutable/chunks/mRf8aGA8.js","_app/immutable/chunks/BVP2IYXq.js","_app/immutable/chunks/CPr2jWSk.js","_app/immutable/chunks/5yCCTwAM.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
