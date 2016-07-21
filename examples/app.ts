import createMemoryStore from 'dojo-widgets/util/createMemoryStore';
import projector from 'dojo-widgets/projector';

import createColumnChart, { ColumnChartFactory } from 'src/render/createColumnChart';

import getPlayCounts, { PlayCount } from './play-counts';

const store = createMemoryStore({
	data: [
		{ id: 'chart' }
	]
});

// Example of patching the store every time the data changes.
// getPlayCounts().subscribe((data) => {
// 	store.patch({ data }, { id: 'chart' });
// });

const chart = (<ColumnChartFactory<PlayCount>> createColumnChart)({
	id: 'chart',
	stateFrom: store,
	// Example of passing an observable to the chart.
	data: getPlayCounts(),
	state: {
		// Example of passing height via the state
		height: 100
	},
	// Example of passing width
	width: 200,
	valueSelector(input) {
		return input.count;
	}
});

projector.append(chart);
projector.attach();
