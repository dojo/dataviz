import projector from 'dojo-widgets/projector';

import max from 'src/data/max';
import createColumnChart, { ColumnChartFactory } from 'src/render/createColumnChart';
import createGroupedColumnChart, { GroupedColumnChartFactory } from 'src/render/createGroupedColumnChart';
import createStackedColumnChart, { StackedColumnChartFactory } from 'src/render/createStackedColumnChart';

const basic = (<ColumnChartFactory<number>> createColumnChart)({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	columnHeight: 150,
	columnSpacing: 3,
	columnWidth: 10,
	divisorOperator: max,
	height: 200,
	inputSeries: [-5, 5, 10],
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	},
	valueSelector(input: number) { return input; },
	width: 100,
	xInset: 30
});

const domain = (<ColumnChartFactory<number>> createColumnChart)({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	columnHeight: 200,
	columnSpacing: 3,
	columnWidth: 10,
	divisorOperator: max,
	domain: [-10, 10],
	height: 200,
	inputSeries: [-5, 5, 10],
	leftAxis: {
		range: { stepSize: 5 },
		labels: { anchor: 'end' },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	valueSelector(input: number) { return input; },
	width: 100,
	xInset: 30
});

const allNegative = (<ColumnChartFactory<number>> createColumnChart)({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	columnHeight: 150,
	columnSpacing: 3,
	columnWidth: 10,
	divisorOperator: max,
	height: 200,
	inputSeries: [-5, -10],
	leftAxis: {
		inputs: {
			labelSelector({ input }) { return String(input); }
		},
		labels: { anchor: 'end' },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	valueSelector(input: number) { return input; },
	width: 100,
	xInset: 30
});

const allNegativeDomain = (<ColumnChartFactory<number>> createColumnChart)({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	columnHeight: 200,
	columnSpacing: 3,
	columnWidth: 10,
	divisorOperator: max,
	domain: -15,
	height: 200,
	inputSeries: [-5, -10],
	leftAxis: {
		range: { stepSize: 5 },
		labels: { anchor: 'end' },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	valueSelector(input: number) { return input; },
	width: 100,
	xInset: 30
});

const group = (<GroupedColumnChartFactory<string, [string, number]>> createGroupedColumnChart)({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	columnHeight: 150,
	columnSpacing: 3,
	columnWidth: 10,
	divisorOperator: max,
	height: 200,
	groupSelector(input: [string, number]) { return input[0]; },
	inputSeries: [['foo', -5], ['foo', -5], ['bar', 5], ['bar', 10]],
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	},
	valueSelector(input: [string, number]) { return input[1]; },
	width: 100,
	xInset: 30
});

const stack = (<StackedColumnChartFactory<string, [string, number]>> createStackedColumnChart)({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	columnHeight: 150,
	columnSpacing: 3,
	columnWidth: 10,
	divisorOperator: max,
	height: 200,
	inputSeries: [['foo', -5], ['foo', -5], ['bar', 5], ['bar', 10], ['baz', -5], ['baz', 5]],
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	},
	stackSelector(input: [string, number]) { return input[0]; },
	stackSpacing: 1,
	valueSelector(input: [string, number]) { return input[1]; },
	width: 100,
	xInset: 30
});

const stackDomain = (<StackedColumnChartFactory<string, [string, number]>> createStackedColumnChart)({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	columnHeight: 150,
	columnSpacing: 3,
	columnWidth: 10,
	divisorOperator: max,
	domain: [-15, 15],
	height: 200,
	inputSeries: [['foo', -5], ['foo', -5], ['bar', 5], ['bar', 10], ['baz', -5], ['baz', 5]],
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	},
	stackSelector(input: [string, number]) { return input[0]; },
	stackSpacing: 1,
	valueSelector(input: [string, number]) { return input[1]; },
	width: 100,
	xInset: 30
});

(<any> window).basic = basic;
(<any> window).domain = domain;
(<any> window).allNegative = allNegative;
(<any> window).allNegativeDomain = allNegativeDomain;
(<any> window).group = group;
(<any> window).stack = stack;
(<any> window).stackDomain = stackDomain;

projector.append([
	basic, domain,
	allNegative, allNegativeDomain,
	group,
	stack, stackDomain
]);
projector.attach();
