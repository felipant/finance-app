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
			SELECT id FROM pagamento WHERE ? IS NOT NULL
		`).bind(header.pagamento).first();
		
		const paymentId = paymentResult?.id || 1;
		
		// Process each item
		const results = [];
		for (const item of items) {
			if (!item.item || !item.valor) continue;
			
			// Get item details
			const itemResult = await db.prepare(`
				SELECT i.id_subcategoria, s.id_categoria
				FROM itens i
				JOIN subcategorias s ON i.id_subcategoria = s.id
				WHERE i.nome_item = ?
			`).bind(item.item).first();
			
			if (!itemResult) continue;
			
			// Insert expense
			const result = await db.prepare(`
				INSERT INTO gastos (
					data_compra, valor, parcelas, id_categoria, id_subcategoria,
					tipo, id_pagamento, comentario
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				header.data_compra,
				parseFloat(item.valor),
				parseInt(header.parcelas),
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
