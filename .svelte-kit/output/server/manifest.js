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
		client: {start:"_app/immutable/entry/start.DIQIM--B.js",app:"_app/immutable/entry/app.8WuIWiLg.js",imports:["_app/immutable/entry/start.DIQIM--B.js","_app/immutable/chunks/Bc-gTxCc.js","_app/immutable/chunks/DrfFkH7i.js","_app/immutable/chunks/BhAud1kW.js","_app/immutable/entry/app.8WuIWiLg.js","_app/immutable/chunks/DrfFkH7i.js","_app/immutable/chunks/ClsaVdYO.js","_app/immutable/chunks/DrdcVeu4.js","_app/immutable/chunks/BhAud1kW.js","_app/immutable/chunks/BVc7N6hh.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
