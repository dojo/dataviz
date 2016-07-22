import createMemoryStore from 'dojo-widgets/util/createMemoryStore';
import projector from 'dojo-widgets/projector';

import sum from 'src/data/sum';
import createColumnChart, { ColumnChartFactory } from 'src/render/createColumnChart';

import getPlayCounts, { PlayCount } from './play-counts';

const store = createMemoryStore({
	data: [
		{
			id: 'chart',
			// Example of configuring columnHeight
			columnHeight: 100
		}
	]
});

// Example of patching the store every time the data changes.
// getPlayCounts().subscribe((data) => {
// 	store.patch({ data }, { id: 'chart' });
// });

const chart = (<ColumnChartFactory<PlayCount>> createColumnChart)({
	id: 'chart',
	// Example of passing an observable to the chart.
	data: getPlayCounts(),
	divisorOperator: sum,
	state: {
		// Example of passing height via the state
		height: 100
	},
	stateFrom: store,
	valueSelector(input) {
		return input.count;
	},
	// Example of passing width
	width: 200
});

// Example of setting columnWidth
chart.columnWidth = 20;

// Make the chart available to the console.
(<any> window).chart = chart;

projector.append(chart);
projector.attach();
