import columnar from 'src/structure/columnar';

import getPlayCounts from './play-counts';

columnar(getPlayCounts(), (input) => input.count)
	.subscribe(results => console.log(results));
