import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
	const db = platform.env.DB;
	
	try {
		const formData = await request.formData();
		const csvFile = formData.get('csv');
		
		if (!csvFile) {
			return json({ error: 'Nenhum arquivo CSV fornecido' }, { status: 400 });
		}
		
		const csvText = await csvFile.text();
		const lines = csvText.split('\n').filter(line => line.trim());
		
		if (lines.length < 2) {
			return json({ error: 'CSV inválido ou vazio' }, { status: 400 });
		}
		
		// Skip header line
		const dataLines = lines.slice(1);
		const inserts = [];
		let imported = 0;
		
		for (const line of dataLines) {
			const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
			
			if (columns.length < 8) continue;
			
			const [
				data_compra,
				valor,
				parcelas,
				id_categoria,
				id_subcategoria,
				tipo,
				id_pagamento,
				comentario
			] = columns;
			
			// Validate required fields
			if (!data_compra || !valor || !id_categoria || !id_subcategoria) continue;
			
			inserts.push(
				db.prepare(`
					INSERT INTO gastos (
						data_compra, valor, parcelas, id_categoria, id_subcategoria,
						tipo, id_pagamento, comentario
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				`).bind(
					data_compra,
					parseFloat(valor),
					parseInt(parcelas) || 1,
					parseInt(id_categoria),
					parseInt(id_subcategoria),
					tipo || 'variável',
					parseInt(id_pagamento) || 1,
					comentario || ''
				)
			);
			
			imported++;
		}
		
		if (inserts.length > 0) {
			// Execute all inserts in batches
			const batchSize = 100;
			for (let i = 0; i < inserts.length; i += batchSize) {
				const batch = inserts.slice(i, i + batchSize);
				await db.batch(batch);
			}
		}
		
		return json({ 
			success: true, 
			imported,
			total: dataLines.length
		});
	} catch (error) {
		console.error('Error importing CSV:', error);
		return json({ error: 'Erro ao importar CSV' }, { status: 500 });
	}
}
