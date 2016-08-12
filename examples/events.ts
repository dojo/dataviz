import createMemoryStore from 'dojo-widgets/util/createMemoryStore';
import projector from 'dojo-widgets/projector';

import max from 'src/data/max';
import sum from 'src/data/sum';
import sort from 'src/data/sort';
import createColumnChart from 'src/render/createColumnChart';
import createGroupedColumnChart, { SelectColumnInGroupEvent } from 'src/render/createGroupedColumnChart';

import getPlayCounts, { PlayCount } from './play-counts';

const playCounts = getPlayCounts().share();
const byProvince = sort(playCounts, ({ province }) => province);

const stateFrom = createMemoryStore({
	data: [
		{ id: 'percentageChart' },
		{ id: 'groupedByProvinceChart' }
	]
});

const percentageChart = createColumnChart<PlayCount>({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input.artist; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	columnHeight: 100,
	columnSpacing: 1,
	columnWidth: 20,
	divisorOperator: sum,
	height: 250,
	id: 'percentageChart',
	inputSeries: playCounts,
	leftAxis: {
		labels: { anchor: 'end' },
		range: { end: 100, fixed: true, stepSize: 20 },
		ticks: { length: 10 }
	},
	stateFrom,
	valueSelector(input) { return input.count; },
	width: 300,
	xInset: 50,
	yInset: 15
});

const groupedByProvinceChart = createGroupedColumnChart<string, PlayCount>({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	columnHeight: 100,
	columnSpacing: 1,
	columnWidth: 10,
	divisorOperator: max,
	height: 230,
	groupSelector(input) { return input.province; },
	groupSpacing: 10,
	id: 'groupedByProvinceChart',
	inputSeries: byProvince,
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5000 },
		ticks: { length: 10 }
	},
	state: {
		styles: { marginTop: '20px' }
	},
	topAxis: {
		inputs: {
			labelSelector({ totalValue }) { return String(totalValue); }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: 45, offset: -5 },
		ticks: { anchor: 'end', length: 10, zeroth: true }
	},
	stateFrom,
	valueSelector(input) { return input.count; },
	width: 300,
	xInset: 75,
	yInset: 25
});

// Make the charts available to the console.
(<any> window).percentageChart = percentageChart;
(<any> window).groupedByProvinceChart = groupedByProvinceChart;

percentageChart.on('selectcolumn', ({ input: { artist, count } }) => {
	console.log('%s: %i plays', artist, count);
});

// FIXME: Why can't GroupedColumnChart override the event type for 'selectcolumn'?
groupedByProvinceChart.on(
	'selectcolumn',
	({
		group,
		groupPoint: { datum: { totalValue } },
		input: { artist, count }
	}: SelectColumnInGroupEvent<string, PlayCount>) => {
		console.log('%s: %i plays, %i% of total in %s', artist, count, count / totalValue * 100, group);
	}
);

projector.append([percentageChart, groupedByProvinceChart]);
projector.attach();
