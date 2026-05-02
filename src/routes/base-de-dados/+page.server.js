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
		// Load gastos with full category and item information
		const gastos = await db.prepare(`
			SELECT 
				g.id,
				g.data_compra,
				g.valor,
				g.parcelas,
				g.tipo,
				g.comentario,
				i.nome_item as item,
				s.nome_subcategoria as subcategoria,
				c.nome_categoria as categoria,
				CASE 
					WHEN p.Pix IS NOT NULL THEN 'Pix'
					WHEN p.Credito IS NOT NULL THEN 'Credito'
					WHEN p.Debito IS NOT NULL THEN 'Debito'
					WHEN p.Dinheiro IS NOT NULL THEN 'Dinheiro'
					ELSE 'Outro'
				END as pagamento
			FROM gastos g
			LEFT JOIN itens i ON g.id_item = i.id
			LEFT JOIN subcategorias s ON g.id_subcategoria = s.id
			LEFT JOIN categorias c ON g.id_categoria = c.id
			LEFT JOIN pagamento p ON g.id_pagamento = p.id
			ORDER BY g.data_compra DESC
		`).all();
		
		return {
			gastos: gastos.results || []
		};
	} catch (error) {
		console.error('Error loading gastos:', error);
		return {
			gastos: []
		};
	}
}
