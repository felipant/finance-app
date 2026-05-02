import { fail } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, platform }) => {
		// TODO: Implement gastos-fixos actions
		return { success: true };
	}
};

/** @type {import('./$types').PageServerLoad} */
export async function load({ platform }) {
	// TODO: Load gastos fixos from D1
	return {
		gastosFixos: []
	};
}
