import global from 'dojo-core/global';
import projector from 'dojo-widgets/projector';

import max from '../src/data/max';
import createColumnChart, { ColumnChartFactory } from '../src/render/createColumnChart';
import createGroupedColumnChart, { GroupedColumnChartFactory } from '../src/render/createGroupedColumnChart';
import createStackedColumnChart, { StackedColumnChartFactory } from '../src/render/createStackedColumnChart';

const createBasic: ColumnChartFactory<number> = createColumnChart.extend({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	}
});

const basic = createBasic({
	divisorOperator: max,
	inputSeries: [-5, 5, 10],
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

const createDomain: ColumnChartFactory<number> = createColumnChart.extend({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	leftAxis: {
		range: { stepSize: 5 },
		labels: { anchor: 'end' },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	}
});

const domain = createDomain({
	divisorOperator: max,
	inputSeries: [-5, 5, 10],
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

const createAllNegative: ColumnChartFactory<number> = createColumnChart.extend({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	leftAxis: {
		inputs: {
			labelSelector({ input }) { return String(input); }
		},
		labels: { anchor: 'end' },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	}
});

const allNegative = createAllNegative({
	divisorOperator: max,
	inputSeries: [-5, -10],
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

const createAllNegativeDomain: ColumnChartFactory<number> = createColumnChart.extend({
	bottomAxis: {
		inputs: true,
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	leftAxis: {
		range: { stepSize: 5 },
		labels: { anchor: 'end' },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	}
});

const allNegativeDomain = createAllNegativeDomain({
	divisorOperator: max,
	inputSeries: [-5, -10],
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

const createGroup: GroupedColumnChartFactory<string, [string, number]> = createGroupedColumnChart.extend({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	}
});

const group = createGroup({
	divisorOperator: max,
	groupSelector(input) { return input[0]; },
	inputSeries: [['foo', -5], ['foo', -5], ['bar', 5], ['bar', 10]],
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

const createStack: StackedColumnChartFactory<string, [string, number]> = createStackedColumnChart.extend({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	}
});

const stack = createStack({
	divisorOperator: max,
	inputSeries: [['foo', -5], ['foo', -5], ['bar', 5], ['bar', 10], ['baz', -5], ['baz', 5]],
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

const createStackDomain: StackedColumnChartFactory<string, [string, number]> = createStackedColumnChart.extend({
	bottomAxis: {
		inputs: {
			labelSelector({ input }) { return input; }
		},
		labels: { anchor: 'middle', textAnchor: 'end', rotation: -45, offset: -5 },
		ticks: { anchor: 'end', length: 5, zeroth: true }
	},
	leftAxis: {
		labels: { anchor: 'end' },
		range: { stepSize: 5 },
		ticks: { length: 5, zeroth: true }
	}
});

const stackDomain = createStackDomain({
	divisorOperator: max,
	inputSeries: [['foo', -5], ['foo', -5], ['bar', 5], ['bar', 10], ['baz', -5], ['baz', 5]],
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

global.basic = basic;
global.domain = domain;
global.allNegative = allNegative;
global.allNegativeDomain = allNegativeDomain;
global.group = group;
global.stack = stack;
global.stackDomain = stackDomain;

projector.append([
	basic, domain,
	allNegative, allNegativeDomain,
	group,
	stack, stackDomain
]);
projector.attach();
