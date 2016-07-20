import createMemoryStore from 'dojo-widgets/util/createMemoryStore';
import projector from 'dojo-widgets/projector';

import createColumnChart, { ColumnChartFactory } from 'src/render/createColumnChart';

import getPlayCounts, { PlayCount } from './play-counts';

const store = createMemoryStore({
	data: [
		{ id: 'chart' }
	]
});
getPlayCounts().subscribe((data) => {
	store.patch({ data }, { id: 'chart' });
});

const chart = (<ColumnChartFactory<PlayCount>> createColumnChart)({
	id: 'chart',
	stateFrom: store,
	state: {
		height: 100,
		width: 200
	},
	valueSelector(input) {
		return input.count;
	}
});

projector.append(chart);
projector.attach();
