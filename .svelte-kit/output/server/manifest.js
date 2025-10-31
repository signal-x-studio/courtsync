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
		client: {start:"_app/immutable/entry/start.D75KBcTk.js",app:"_app/immutable/entry/app.C3wI77wk.js",imports:["_app/immutable/entry/start.D75KBcTk.js","_app/immutable/chunks/CuWOdOaW.js","_app/immutable/chunks/DVX6VRk5.js","_app/immutable/chunks/DOd7VXKj.js","_app/immutable/entry/app.C3wI77wk.js","_app/immutable/chunks/DVX6VRk5.js","_app/immutable/chunks/BA7jJIuj.js","_app/immutable/chunks/C4ilCsHB.js","_app/immutable/chunks/DOd7VXKj.js","_app/immutable/chunks/DQzpnLv7.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
