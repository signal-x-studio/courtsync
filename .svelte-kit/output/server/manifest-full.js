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
		client: {start:"_app/immutable/entry/start.DNhcTQF_.js",app:"_app/immutable/entry/app.Bgz4KrmC.js",imports:["_app/immutable/entry/start.DNhcTQF_.js","_app/immutable/chunks/CkABmOnx.js","_app/immutable/chunks/DbUpsjvX.js","_app/immutable/chunks/BHMDx88I.js","_app/immutable/entry/app.Bgz4KrmC.js","_app/immutable/chunks/DbUpsjvX.js","_app/immutable/chunks/1c6Rvobr.js","_app/immutable/chunks/6L4z5Hrz.js","_app/immutable/chunks/BHMDx88I.js","_app/immutable/chunks/DApip8Xv.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
