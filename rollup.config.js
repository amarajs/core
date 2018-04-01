import flow from 'rollup-plugin-flow';
import buble from 'rollup-plugin-buble';

export default {
	useStrict: false,
	plugins: [
        flow(),
		buble()
	]
};
