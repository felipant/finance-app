import { json } from '@sveltejs/kit';

export async function PUT({ request, params, platform }) {
	const db = platform.env.DB;
	
	try {
		const gastoData = await request.json();
		
		// Get category and subcategory IDs if names provided
		let id_categoria = gastoData.id_categoria;
		let id_subcategoria = gastoData.id_subcategoria;
		
		if (gastoData.categoria && !id_categoria) {
			const catResult = await db.prepare(`
				SELECT id FROM categorias WHERE nome_categoria = ?
			`).bind(gastoData.categoria).first();
			id_categoria = catResult?.id;
		}
		
		if (gastoData.subcategoria && !id_subcategoria) {
			const subcatResult = await db.prepare(`
				SELECT id FROM subcategorias WHERE nome_subcategoria = ?
			`).bind(gastoData.subcategoria).first();
			id_subcategoria = subcatResult?.id;
		}
		
		if (!id_categoria || !id_subcategoria) {
			return json({ error: 'Categoria ou subcategoria não encontrada' }, { status: 400 });
		}
		
		// Update gasto fixo
		await db.prepare(`
			UPDATE gastos_fixos SET
				valor = ?,
				tipo = ?,
				comentario = ?,
				id_categoria = ?,
				id_subcategoria = ?
			WHERE id = ?
		`).bind(
			parseFloat(gastoData.valor),
			gastoData.tipo || 'variável',
			gastoData.comentario || '',
			id_categoria,
			id_subcategoria,
			params.id
		).run();
		
		return json({ success: true });
	} catch (error) {
		console.error('Error updating gasto fixo:', error);
		return json({ error: 'Erro ao atualizar gasto fixo' }, { status: 500 });
	}
}

export async function DELETE({ params, platform }) {
	const db = platform.env.DB;
	
	try {
		await db.prepare('DELETE FROM gastos_fixos WHERE id = ?').bind(params.id).run();
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting gasto fixo:', error);
		return json({ error: 'Erro ao excluir gasto fixo' }, { status: 500 });
	}
}
