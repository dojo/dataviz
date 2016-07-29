import createMemoryStore from 'dojo-widgets/util/createMemoryStore';
import projector from 'dojo-widgets/projector';

import { Datum } from 'src/data/interfaces';
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
			columnHeight: 100,
			xInset: 50,
			yInset: 15
		},
		{
			id: 'groupedByProvinceChart'
		}
	]
});

// Example of patching the store every time the data changes.
playCounts.subscribe((inputSeries) => {
	store.patch({ inputSeries }, { id: 'percentageChart' });
});

const percentageChart = (<ColumnChartFactory<PlayCount>> createColumnChart)({
	id: 'percentageChart',
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input.artist; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	leftAxis: {
		labels: { anchor: 'end' },
		range: { end: 100, fixed: true, stepSize: 20 },
		ticks: { length: 10 }
	},
	rightAxis: {
		hardcoded: [[1 / 3, 'foo'], [2 / 3, 'bar'], [1, 'baz']],
		labels: { anchor: 'end' },
		ticks: { length: 10, zeroth: true }
	},
	columnSpacing: 1,
	divisorOperator: sum,
	state: {
		// Example of passing height via the state
		height: 250
	},
	stateFrom: store,
	valueSelector(input) { // Note how the input type is inferred to be PlayCount.
		return input.count;
	},
	// Example of passing width
	width: 300
});

// Example of setting columnWidth
percentageChart.columnWidth = 20;

const absoluteChart = (<ColumnChartFactory<PlayCount>> createColumnChart)({
	bottomAxis: {
		inputs: {
			labelSelector({ input }: Datum<PlayCount>) { return input.artist; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5000 },
		ticks: { length: 10 }
	},
	columnHeight: 100,
	columnSpacing: 3,
	columnWidth: 20,
	// Example of passing an observable to the chart.
	inputSeries: playCounts,
	divisorOperator: max,
	height: 260,
	valueSelector(input: PlayCount) {
		// Why isn't the input type inferred here? It is in percentageChart, seemingly due to the stateFrom option.
		return input.count;
	},
	width: 300,
	xInset: 50,
	yInset: 30
});

const groupedByProvinceChart = (<GroupedColumnChartFactory<string, PlayCount>> createGroupedColumnChart)({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5000 },
		ticks: { length: 10 }
	},
	topAxis: {
		inputs: {
			labelSelector({ columns }) {
				const sum = columns.reduce((total, { value }) => total += value, 0);
				return String(sum);
			}
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: 45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	columnHeight: 100,
	columnSpacing: 1,
	columnWidth: 10,
	state: {
		styles: { marginTop: '20px' }
	},
	// stateFrom: store,
	// Example of passing an observable to the chart.
	inputSeries: byProvince,
	divisorOperator: max,
	groupSelector(input: PlayCount) {
		return input.province;
	},
	groupSpacing: 10,
	height: 230,
	valueSelector(input: PlayCount) {
		// Why isn't the input type inferred here? It is in percentageChart, seemingly due to the stateFrom option.
		return input.count;
	},
	width: 300
});

groupedByProvinceChart.xInset = 75;
groupedByProvinceChart.yInset = 25;

// Make the charts available to the console.
(<any> window).absoluteChart = absoluteChart;
(<any> window).groupedByProvinceChart = groupedByProvinceChart;
(<any> window).percentageChart = percentageChart;

projector.append([percentageChart, absoluteChart, groupedByProvinceChart]);
projector.attach();
