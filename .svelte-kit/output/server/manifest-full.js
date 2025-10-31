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
		client: {start:"_app/immutable/entry/start.Be8GBx20.js",app:"_app/immutable/entry/app.D0YWdBnI.js",imports:["_app/immutable/entry/start.Be8GBx20.js","_app/immutable/chunks/CXYiH5hU.js","_app/immutable/chunks/DbuvHMYe.js","_app/immutable/chunks/B7bXz0ip.js","_app/immutable/entry/app.D0YWdBnI.js","_app/immutable/chunks/DbuvHMYe.js","_app/immutable/chunks/LW9aGJv8.js","_app/immutable/chunks/CPsmpoqW.js","_app/immutable/chunks/B7bXz0ip.js","_app/immutable/chunks/jxvN46yn.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
