import { fail } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, platform }) => {
		try {
			const formData = await request.formData();
			const db = platform.env.DB;
			
			// Get item details to find category and subcategory IDs
			const itemResult = await db.prepare(`
				SELECT i.id as item_id, i.id_subcategoria, s.id_categoria, 
				       s.nome_subcategoria, c.nome_categoria
				FROM itens i
				JOIN subcategorias s ON i.id_subcategoria = s.id
				JOIN categorias c ON s.id_categoria = c.id
				WHERE i.nome_item = ?
			`).bind(formData.get('item')).first();
			
			if (!itemResult) {
				return fail(400, { error: 'Item não encontrado' });
			}
			
			// Get payment method ID
			const paymentResult = await db.prepare(`
				SELECT id FROM pagamento WHERE ? IS NOT NULL
			`).bind(formData.get('pagamento')).first();
			
			const parcelas = parseInt(formData.get('parcelas')) || 1;
			const valorTotal = parseFloat(formData.get('valor'));
			const valorParcela = Math.round((valorTotal / parcelas) * 100) / 100; // Round to 2 decimal places
			const dataInicial = new Date(formData.get('data_compra'));
			
			// Prepare batch insert for all parcels
			const inserts = [];
			for (let i = 0; i < parcelas; i++) {
				// Calculate date for this parcel (handle year transition)
				const dataParcela = new Date(dataInicial);
				dataParcela.setMonth(dataParcela.getMonth() + i);
				
				const dataFormatada = dataParcela.toISOString().split('T')[0];
				
				inserts.push(
					db.prepare(`
						INSERT INTO gastos (
							data_compra, valor, parcelas, id_categoria, id_subcategoria,
							tipo, id_pagamento, comentario
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
					`).bind(
						dataFormatada,
						valorParcela,
						parcelas,
						itemResult.id_categoria,
						itemResult.id_subcategoria,
						formData.get('tipo'),
						paymentResult?.id || 1,
						i === 0 ? formData.get('comentario') : `Parcela ${i + 1}/${parcelas}` + (formData.get('comentario') ? ` - ${formData.get('comentario')}` : '')
					)
				);
			}
			
			// Execute all inserts as a batch transaction
			await db.batch(inserts);
			
			return { success: true };
		} catch (error) {
			console.error('Error creating expense:', error);
			return fail(500, { error: 'Erro ao registrar gasto' });
		}
	}
};

/** @type {import('./$types').PageServerLoad} */
export async function load({ platform }) {
	const db = platform.env.DB;
	
	try {
		// Load items with category and subcategory info for autocomplete
		const items = await db.prepare(`
			SELECT i.id, i.nome_item, i.id_subcategoria,
			       s.nome_subcategoria, s.id_categoria,
			       c.nome_categoria
			FROM itens i
			JOIN subcategorias s ON i.id_subcategoria = s.id
			JOIN categorias c ON s.id_categoria = c.id
			ORDER BY i.nome_item
		`).all();
		
		return {
			items: items.results || []
		};
	} catch (error) {
		console.error('Error loading data:', error);
		return {
			items: []
		};
	}
}
