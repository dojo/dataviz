import projector from 'dojo-widgets/projector';

import max from '../src/data/max';
import createColumnChart from '../src/render/createColumnChart';
import createGroupedColumnChart from '../src/render/createGroupedColumnChart';
import createStackedColumnChart from '../src/render/createStackedColumnChart';

const basic = createColumnChart<number>({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	divisorOperator: max,
	inputSeries: [-5, 5, 10],
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	},
	state: {
		columnHeight: 150,
		columnSpacing: 3,
		columnWidth: 10,
		height: 200,
		width: 100,
		xInset: 30
	},
	valueSelector(input) { return input; }
});

const domain = createColumnChart<number>({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	divisorOperator: max,
	inputSeries: [-5, 5, 10],
	leftAxis: {
		range: { stepSize: 5 },
		labels: { anchor: 'end' },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	state: {
		columnHeight: 200,
		columnSpacing: 3,
		columnWidth: 10,
		domain: [-10, 10],
		height: 200,
		width: 100,
		xInset: 30
	},
	valueSelector(input) { return input; }
});

const allNegative = createColumnChart<number>({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	divisorOperator: max,
	inputSeries: [-5, -10],
	leftAxis: {
		inputs: {
			labelSelector({ input }) { return String(input); }
		},
		labels: { anchor: 'end' },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	state: {
		columnHeight: 150,
		columnSpacing: 3,
		columnWidth: 10,
		height: 200,
		width: 100,
		xInset: 30
	},
	valueSelector(input) { return input; }
});

const allNegativeDomain = createColumnChart<number>({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	divisorOperator: max,
	inputSeries: [-5, -10],
	leftAxis: {
		range: { stepSize: 5 },
		labels: { anchor: 'end' },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	state: {
		columnHeight: 200,
		columnSpacing: 3,
		columnWidth: 10,
		domain: -15,
		height: 200,
		width: 100,
		xInset: 30
	},
	valueSelector(input) { return input; }
});

const group = createGroupedColumnChart<string, [string, number]>({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	divisorOperator: max,
	groupSelector(input) { return input[0]; },
	inputSeries: [['foo', -5], ['foo', -5], ['bar', 5], ['bar', 10]],
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	},
	state: {
		columnHeight: 150,
		columnSpacing: 3,
		columnWidth: 10,
		height: 200,
		width: 100,
		xInset: 30
	},
	valueSelector(input) { return input[1]; }
});

const stack = createStackedColumnChart<string, [string, number]>({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	divisorOperator: max,
	inputSeries: [['foo', -5], ['foo', -5], ['bar', 5], ['bar', 10], ['baz', -5], ['baz', 5]],
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	},
	stackSelector(input) { return input[0]; },
	state: {
		columnHeight: 150,
		columnSpacing: 3,
		columnWidth: 10,
		height: 200,
		stackSpacing: 1,
		width: 100,
		xInset: 30
	},
	valueSelector(input) { return input[1]; }
});

const stackDomain = createStackedColumnChart<string, [string, number]>({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	divisorOperator: max,
	inputSeries: [['foo', -5], ['foo', -5], ['bar', 5], ['bar', 10], ['baz', -5], ['baz', 5]],
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	},
	stackSelector(input) { return input[0]; },
	state: {
		columnHeight: 150,
		columnSpacing: 3,
		columnWidth: 10,
		domain: [-15, 15],
		height: 200,
		stackSpacing: 1,
		width: 100,
		xInset: 30
	},
	valueSelector(input) { return input[1]; }
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
