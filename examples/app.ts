import createMemoryStore from 'dojo-widgets/util/createMemoryStore';
import projector from 'dojo-widgets/projector';

import max from 'src/data/max';
import sum from 'src/data/sum';
import sort from 'src/data/sort';
import createColumnChart, { ColumnChartFactory } from 'src/render/createColumnChart';
import createGroupedColumnChart, { GroupedColumnChartFactory } from 'src/render/createGroupedColumnChart';

import getPlayCounts, { PlayCount } from './play-counts';

const playCounts = getPlayCounts().share();
const byProvince = sort(playCounts, ({ province }) => province);

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
playCounts.subscribe((inputSeries) => {
	store.patch({ inputSeries }, { id: 'percentageChart' });
});

const percentageChart = (<ColumnChartFactory<PlayCount>> createColumnChart)({
	id: 'percentageChart',
	columnSpacing: 1,
	divisorOperator: sum,
	state: {
		// Example of passing height via the state
		height: 100
	},
	stateFrom: store,
	valueSelector(input) { // Note how the input type is inferred to be PlayCount.
		return input.count;
	},
	// Example of passing width
	width: 200
});

// Example of setting columnWidth
percentageChart.columnWidth = 20;

const absoluteChart = (<ColumnChartFactory<PlayCount>> createColumnChart)({
	columnHeight: 100,
	columnSpacing: 1,
	columnWidth: 20,
	// Example of passing an observable to the chart.
	inputSeries: playCounts,
	divisorOperator: max,
	height: 100,
	valueSelector(input: PlayCount) {
		// Why isn't the input type inferred here? It is in percentageChart, seemingly due to the stateFrom option.
		return input.count;
	},
	width: 200
});

const groupedByProvinceChart = (<GroupedColumnChartFactory<PlayCount>> createGroupedColumnChart)({
	columnHeight: 100,
	columnSpacing: 1,
	columnWidth: 10,
	// Example of passing an observable to the chart.
	inputSeries: byProvince,
	divisorOperator: max,
	groupSelector(input) {
		return input.province;
	},
	groupSpacing: 10,
	height: 100,
	valueSelector(input: PlayCount) {
		// Why isn't the input type inferred here? It is in percentageChart, seemingly due to the stateFrom option.
		return input.count;
	},
	width: 200
});

// Make the charts available to the console.
(<any> window).absoluteChart = absoluteChart;
(<any> window).groupedByProvinceChart = groupedByProvinceChart;
(<any> window).percentageChart = percentageChart;

projector.append([percentageChart, absoluteChart, groupedByProvinceChart]);
projector.attach();
