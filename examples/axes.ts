// Hey! So this file renders a variety of axis options. It's by no means exhaustive, or pretty, or even sensible given
// for a column chart. It's just a way to visually verify some of the render logic, if you know what you're looking for.

import { assign, deepAssign } from 'dojo-core/lang';
import projector from 'dojo-widgets/projector';

import max from 'src/data/max';
import { Datum } from 'src/data/interfaces';
import createColumnChart, { ColumnChartFactory, ColumnChartOptions } from 'src/render/createColumnChart';
import { AxisConfiguration } from 'src/render/mixins/createAxesMixin';

const MAX_INPUT = 30;
const inputSeries = [5, 15, 25, MAX_INPUT];

const chartOptions: ColumnChartOptions<number, Datum<number>, any> = {
	inputSeries,
	width: 150,
	height: 150,
	columnHeight: 100,
	columnWidth: 20,
	columnSpacing: 1,
	divisorOperator: max,
	valueSelector(input) {
		return input;
	},
	xInset: 25,
	yInset: 25
};

function createAxesConfiguration(shared: AxisConfiguration<Datum<number>>, chartOptions: any): any {
	const config: any = {};
	for (const side of ['bottomAxis', 'leftAxis', 'rightAxis', 'topAxis']) {
		config[side] = deepAssign({}, shared);
		if (side === 'leftAxis' || side === 'rightAxis') {
			config[side].labels = assign({
				anchor: 'end'
			}, config[side].labels);
		}
		if (side === 'bottomAxis' || side === 'topAxis') {
			config[side].labels = assign({
				dominantBaseline: 'middle',
				rotation: 90
			}, config[side].labels);
		}
	}
	return assign(config, chartOptions);
}

const inputs = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	inputs: {
		labelSelector({ input }) {
			return String(input);
		}
	},
	ticks: {
		anchor: 'end',
		length: 10,
		zeroth: true
	}
}, chartOptions));

const inputsGridLines = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	inputs: {
		labelSelector({ input }) {
			return String(input);
		}
	},
	gridLines: {
		zeroth: true
	},
	ticks: {
		anchor: 'end',
		length: 10,
		zeroth: true
	}
}, chartOptions));

const inputsNoTicks = (() => {
	const config = createAxesConfiguration({
		inputs: {
			labelSelector({ input }) {
				return String(input);
			}
		}
	}, chartOptions);
	config.bottomAxis.labels.textAnchor = 'start';
	config.topAxis.labels.textAnchor = 'end';

	return (<ColumnChartFactory<number>> createColumnChart)(config);
})();

const range = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	range: { stepSize: 5 },
	ticks: {
		anchor: 'end',
		length: 10
	}
}, chartOptions));

const rangeAdjustedMax = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	range: {
		end: 32, // Needs to be rounded up to 35
		stepSize: 5
	},
	ticks: {
		anchor: 'end',
		length: 10
	}
}, chartOptions));

const rangeGridLines = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	range: { stepSize: 5 },
	gridLines: { zeroth: true },
	ticks: {
		anchor: 'end',
		length: 10
	}
}, chartOptions));

const rangeMax25 = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	range: { end: 25, stepSize: 5 },
	ticks: {
		anchor: 'end',
		length: 10
	}
}, chartOptions));

const rangeNoTicks = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	range: { stepSize: 5 }
}, chartOptions));

const hardcoded = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	hardcoded: [0, ...inputSeries.map(input => input / MAX_INPUT)].map<[number, string]>(relative => {
		return [relative, String((relative * 100).toFixed(0)) + '%'];
	}),
	ticks: {
		anchor: 'end',
		length: 10,
		zeroth: true
	}
}, chartOptions));

const hardcodedGridLines = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	hardcoded: [0, ...inputSeries.map(input => input / MAX_INPUT)].map<[number, string]>(relative => {
		return [relative, String((relative * 100).toFixed(0)) + '%'];
	}),
	gridLines: {
		zeroth: true
	},
	ticks: {
		anchor: 'end',
		length: 10,
		zeroth: true
	}
}, chartOptions));

const hardcodedNoTicks = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	hardcoded: [0, ...inputSeries.map(input => input / MAX_INPUT)].map<[number, string]>(relative => {
		return [relative, String((relative * 100).toFixed(0)) + '%'];
	})
}, chartOptions));

const hardcodedWithIgnoredSteps = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	hardcoded: [-1, 0, ...inputSeries.map(input => input / MAX_INPUT), 2].map<[number, string]>(relative => {
		return [relative, String((relative * 100).toFixed(0)) + '%'];
	}),
	ticks: {
		anchor: 'end',
		length: 10,
		zeroth: true
	}
}, chartOptions));

const shortGridLines = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	hardcoded: inputSeries.map(input => input / MAX_INPUT).map<[number, string]>(relative => {
		return [relative, String((relative * 100).toFixed(0)) + '%'];
	}),
	gridLines: {
		length: 35
	},
	ticks: {
		anchor: 'end',
		length: 10,
		zeroth: true
	}
}, chartOptions));

const longGridLines = (<ColumnChartFactory<number>> createColumnChart)(createAxesConfiguration({
	hardcoded: inputSeries.map(input => input / MAX_INPUT).map<[number, string]>(relative => {
		return [relative, String((relative * 100).toFixed(0)) + '%'];
	}),
	gridLines: {
		length: 120
	},
	ticks: {
		anchor: 'end',
		length: 10,
		zeroth: true
	}
}, chartOptions));

projector.append([
	inputs, inputsGridLines, inputsNoTicks,
	range, rangeAdjustedMax, rangeGridLines, rangeMax25, rangeNoTicks,
	hardcoded, hardcodedGridLines, hardcodedNoTicks, hardcodedWithIgnoredSteps,
	shortGridLines, longGridLines
]);
projector.attach();
