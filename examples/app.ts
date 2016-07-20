import createMemoryStore from 'dojo-widgets/util/createMemoryStore';
import projector from 'dojo-widgets/projector';

import createColumnChart from 'src/render/createColumnChart';

import getPlayCounts from './play-counts';

const store = createMemoryStore({
	data: [
		{ id: 'chart' }
	]
});
getPlayCounts().subscribe((items) => {
	store.patch({ items }, { id: 'chart' });
});

const chart = createColumnChart({
	id: 'chart',
	stateFrom: store
});

projector.append(chart);
projector.attach();
