import createMemoryStore from 'dojo-widgets/util/createMemoryStore';
import projector from 'dojo-widgets/projector';

import max from 'src/data/max';
import sum from 'src/data/sum';
import createColumnChart, { ColumnChartFactory } from 'src/render/createColumnChart';

import getPlayCounts, { PlayCount } from './play-counts';

const playCounts = getPlayCounts().share();

const store = createMemoryStore({
	data: [
		{
			id: 'percentageChart',
			// Example of configuring columnHeight
			columnHeight: 100
		}
	]
});

// Example of patching the store every time the data changes.
playCounts.subscribe((data) => {
	store.patch({ data }, { id: 'percentageChart' });
});

const percentageChart = (<ColumnChartFactory<PlayCount>> createColumnChart)({
	id: 'percentageChart',
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
percentageChart.columnWidth = 20;

const absoluteChart = (<ColumnChartFactory<PlayCount>> createColumnChart)({
	columnHeight: 100,
	columnWidth: 20,
	// Example of passing an observable to the chart.
	data: playCounts,
	divisorOperator: max,
	height: 100,
	valueSelector(input) {
		return input.count;
	},
	width: 200
});

// Make the charts available to the console.
(<any> window).absoluteChart = absoluteChart;
(<any> window).percentageChart = percentageChart;

projector.append([percentageChart, absoluteChart]);
projector.attach();
