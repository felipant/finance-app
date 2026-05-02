import { json } from '@sveltejs/kit';

export async function PUT({ request, params, platform }) {
	const db = platform.env.DB;
	
	try {
		const gastoData = await request.json();
		
		// Get item details to find category and subcategory IDs
		const itemResult = await db.prepare(`
			SELECT i.id_subcategoria, s.id_categoria
			FROM itens i
			JOIN subcategorias s ON i.id_subcategoria = s.id
			WHERE i.nome_item = ?
		`).bind(gastoData.item).first();
		
		if (!itemResult) {
			return json({ error: 'Item não encontrado' }, { status: 400 });
		}
		
		// Get payment method ID
		const paymentResult = await db.prepare(`
			SELECT id FROM pagamento WHERE ? IS NOT NULL
		`).bind(gastoData.pagamento).first();
		
		// Update expense
		await db.prepare(`
			UPDATE gastos SET
				data_compra = ?,
				valor = ?,
				parcelas = ?,
				id_categoria = ?,
				id_subcategoria = ?,
				tipo = ?,
				id_pagamento = ?,
				comentario = ?
			WHERE id = ?
		`).bind(
			gastoData.data_compra,
			parseFloat(gastoData.valor),
			parseInt(gastoData.parcelas),
			itemResult.id_categoria,
			itemResult.id_subcategoria,
			gastoData.tipo,
			paymentResult?.id || 1,
			gastoData.comentario,
			params.id
		).run();
		
		return json({ success: true });
	} catch (error) {
		console.error('Error updating gasto:', error);
		return json({ error: 'Erro ao atualizar gasto' }, { status: 500 });
	}
}

export async function DELETE({ params, platform }) {
	const db = platform.env.DB;
	
	try {
		await db.prepare('DELETE FROM gastos WHERE id = ?').bind(params.id).run();
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting gasto:', error);
		return json({ error: 'Erro ao excluir gasto' }, { status: 500 });
	}
}
