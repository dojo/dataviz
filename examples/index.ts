(<DojoLoader.RootRequire> require).config({
	baseUrl: '../..',
	packages: [
		{ name: 'examples', location: '_build/examples' },
		{ name: 'src', location: '_build/src' },
		{ name: 'dojo-compose', location: 'node_modules/dojo-compose' },
		{ name: 'dojo-core', location: 'node_modules/dojo-core' },
		{ name: 'dojo-has', location: 'node_modules/dojo-has' },
		{ name: 'dojo-stores', location: 'node_modules/dojo-stores' },
		{ name: 'dojo-shim', location: 'node_modules/dojo-shim' },
		{ name: 'dojo-widgets', location: 'node_modules/dojo-widgets' },
		{ name: 'immutable', location: 'node_modules/immutable/dist' },
		{ name: 'maquette', location: 'node_modules/maquette/dist' },
		{ name: 'rxjs', location: 'node_modules/@reactivex/rxjs/dist/amd' }
	],
	map: {
		'*': {
			'maquette': 'maquette/maquette.min',
			'immutable': 'immutable/immutable.min'
		}
	}
});

/* Requiring in the main module */
require([`examples/${location.search.slice(1) || 'app'}`], function () {});
