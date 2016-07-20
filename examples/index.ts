(<DojoLoader.RootRequire> require).config({
	baseUrl: '../..',
	packages: [
		{ name: 'examples', location: '_build/examples' },
		{ name: 'src', location: '_build/src' },
		{ name: 'dojo-compose', location: 'node_modules/dojo-compose/dist/umd' },
		{ name: 'dojo-core', location: 'node_modules/dojo-core/dist/umd' },
		{ name: 'dojo-has', location: 'node_modules/dojo-has/dist/umd' },
		{ name: 'dojo-shim', location: 'node_modules/dojo-shim/dist/umd' },
		{ name: 'dojo-widgets', location: 'node_modules/dojo-widgets/dist/umd' },
		{ name: 'immutable', location: 'node_modules/immutable/dist' },
		{ name: 'maquette', location: 'node_modules/maquette/dist' },
		{ name: 'rxjs', location: 'node_modules/@reactivex/rxjs/dist/amd' }
	],
	map: {
		'*': {
			'maquette/maquette': 'maquette/maquette.min',
			'immutable/immutable': 'immutable/immutable.min'
		}
	}
});

/* Requiring in the main module */
require(['examples/app'], function () {});
