import global from 'dojo-core/global';
import createMemoryStore from 'dojo-stores/createMemoryStore';
import projector from 'dojo-widgets/projector';

import max from '../src/data/max';
import sum from '../src/data/sum';
import sort from '../src/data/sort';
import createColumnChart, { ColumnChartFactory } from '../src/render/createColumnChart';
import createGroupedColumnChart from '../src/render/createGroupedColumnChart';
import createStackedColumnChart from '../src/render/createStackedColumnChart';

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
		}
	]
});

// Example of patching the store every time the data changes.
playCounts.subscribe((inputSeries) => {
	store.patch({ inputSeries }, { id: 'percentageChart' });
});

const percentageChart = createColumnChart<PlayCount>({
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
	divisorOperator: sum,
	state: {
		height: 250,
		columnSpacing: 1,
		columnWidth: 20,
		width: 300
	},
	stateFrom: store,
	valueSelector(input) { return input.count; }
});

const createAbsoluteChart: ColumnChartFactory<PlayCount> = createColumnChart.extend({
	columnHeight: 100,
	columnSpacing: 3,
	columnWidth: 20,
	domain: 35000,
	height: 260,
	width: 300,
	xInset: 50,
	yInset: 30
});

const absoluteChart = createAbsoluteChart({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input.artist; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5000 },
		ticks: { length: 10 }
	},
	// Example of passing an observable to the chart.
	inputSeries: playCounts,
	divisorOperator: max,
	valueSelector(input) { return input.count; }
});

const groupedByProvinceChart = createGroupedColumnChart<string, PlayCount>({
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
			labelSelector({ totalValue }) {
				return String(totalValue);
			}
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: 45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	state: {
		columnHeight: 100,
		columnSpacing: 1,
		columnWidth: 10,
		groupSpacing: 10,
		height: 230,
		styles: { marginTop: '20px' },
		width: 300,
		xInset: 75,
		yInset: 25
	},
	// Example of passing an observable to the chart.
	inputSeries: byProvince,
	divisorOperator: max,
	groupSelector(input) { return input.province; },
	valueSelector(input) { return input.count; }
});

const stackedByProvinceChart = createStackedColumnChart<string, PlayCount>({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 10000 },
		ticks: { length: 10 }
	},
	topAxis: {
		inputs: {
			labelSelector({ value }) {
				return String(value);
			}
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: 45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	state: {
		columnHeight: 200,
		columnSpacing: 10,
		columnWidth: 20,
		domain: 50000,
		height: 330,
		stackSpacing: 1,
		styles: { marginTop: '20px' },
		width: 300,
		xInset: 75,
		yInset: 25
	},
	// Example of passing an observable to the chart.
	inputSeries: byProvince,
	divisorOperator: max,
	stackSelector(input) { return input.province; },
	valueSelector(input) { return input.count; }
});

// Make the charts available to the console.
global.absoluteChart = absoluteChart;
global.groupedByProvinceChart = groupedByProvinceChart;
global.percentageChart = percentageChart;
global.stackedByProvinceChart = stackedByProvinceChart;

projector.append([percentageChart, absoluteChart, groupedByProvinceChart, stackedByProvinceChart]);
projector.attach();
