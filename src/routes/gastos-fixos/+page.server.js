import { fail } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, platform }) => {
		// Handle any form submissions if needed
		return { success: true };
	}
};

/** @type {import('./$types').PageServerLoad} */
export async function load({ platform }) {
	const db = platform.env.DB;
	
	try {
		// Load gastos fixos with category and subcategory information
		const gastosFixos = await db.prepare(`
			SELECT 
				gf.id,
				gf.valor,
				gf.tipo,
				gf.comentario,
				gf.id_categoria,
				gf.id_subcategoria,
				c.nome_categoria as categoria,
				s.nome_subcategoria as subcategoria
			FROM gastos_fixos gf
			LEFT JOIN categorias c ON gf.id_categoria = c.id
			LEFT JOIN subcategorias s ON gf.id_subcategoria = s.id
			ORDER BY c.nome_categoria, s.nome_subcategoria
		`).all();
		
		return {
			gastosFixos: gastosFixos.results || []
		};
	} catch (error) {
		console.error('Error loading gastos fixos:', error);
		return {
			gastosFixos: []
		};
	}
}
