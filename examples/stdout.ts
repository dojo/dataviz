import sum from '../src/data/sum';
import columnar from '../src/data/columnar';

import getPlayCounts from './play-counts';

columnar(getPlayCounts(), (input) => input.count, sum)
	.subscribe(results => console.log(results));
