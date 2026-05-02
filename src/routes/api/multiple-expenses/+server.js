import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
	const db = platform.env.DB;
	
	try {
		const { header, items } = await request.json();
		
		if (!items || items.length === 0) {
			return json({ error: 'Nenhum item fornecido' }, { status: 400 });
		}
		
		// Get payment method ID
		const paymentResult = await db.prepare(`
			SELECT id FROM pagamento WHERE ${header.pagamento} IS NOT NULL
		`).first();
		
		if (!paymentResult) {
			return json({ error: 'Método de pagamento não encontrado' }, { status: 400 });
		}
		
		const paymentId = paymentResult.id;
		
		// Process each item
		const results = [];
		for (const item of items) {
			if (!item.item || !item.valor) continue;
			
			// Get item details
			const itemResult = await db.prepare(`
				SELECT i.id as item_id, i.id_subcategoria, s.id_categoria
				FROM itens i
				JOIN subcategorias s ON i.id_subcategoria = s.id
				WHERE i.nome_item = ?
			`).bind(item.item).first();
			
			if (!itemResult) {
				console.log('Item not found:', item.item);
				continue;
			}
			
			// Validate all foreign keys before insertion
			console.log('Inserting expense with foreign keys:', {
				id_item: itemResult.item_id,
				id_categoria: itemResult.id_categoria,
				id_subcategoria: itemResult.id_subcategoria,
				id_pagamento: paymentId
			});
			
			// Insert expense
			const result = await db.prepare(`
				INSERT INTO gastos (
					data_compra, valor, parcelas, id_item, id_categoria, id_subcategoria,
					tipo, id_pagamento, comentario
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				header.data_compra,
				parseFloat(item.valor),
				parseInt(header.parcelas),
				itemResult.item_id,
				itemResult.id_categoria,
				itemResult.id_subcategoria,
				header.tipo,
				paymentId,
				item.comentario || ''
			).run();
			
			results.push({
				id: result.meta.last_row_id,
				item: item.item,
				valor: item.valor
			});
		}
		
		return json({ 
			success: true, 
			inserted: results.length,
			items: results
		});
	} catch (error) {
		console.error('Error creating multiple expenses:', error);
		return json({ error: 'Erro ao registrar múltiplos gastos' }, { status: 500 });
	}
}
