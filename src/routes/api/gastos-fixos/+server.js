import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
	const db = platform.env.DB;
	
	try {
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
		
		return json(gastosFixos.results || []);
	} catch (error) {
		console.error('Error fetching gastos fixos:', error);
		return json([], { status: 500 });
	}
}

export async function POST({ request, platform }) {
	const db = platform.env.DB;
	
	try {
		const { valor, item, tipo, comentario, categoria, subcategoria } = await request.json();
		
		if (!valor || !item || !categoria || !subcategoria) {
			return json({ error: 'Valor, item, categoria e subcategoria são obrigatórios' }, { status: 400 });
		}
		
		// Get category and subcategory IDs
		const catResult = await db.prepare(`
			SELECT id FROM categorias WHERE nome_categoria = ?
		`).bind(categoria).first();
		
		const subcatResult = await db.prepare(`
			SELECT id FROM subcategorias WHERE nome_subcategoria = ?
		`).bind(subcategoria).first();
		
		if (!catResult || !subcatResult) {
			return json({ error: 'Categoria ou subcategoria não encontrada' }, { status: 400 });
		}
		
		const result = await db.prepare(`
			INSERT INTO gastos_fixos (valor, tipo, comentario, id_categoria, id_subcategoria)
			VALUES (?, ?, ?, ?, ?)
		`).bind(
			parseFloat(valor),
			tipo || 'variável',
			comentario || '',
			catResult.id,
			subcatResult.id
		).run();
		
		const newGastoFixo = {
			id: result.meta.last_row_id,
			valor: parseFloat(valor),
			tipo: tipo || 'variável',
			comentario: comentario || '',
			categoria,
			subcategoria,
			id_categoria: catResult.id,
			id_subcategoria: subcatResult.id
		};
		
		return json(newGastoFixo);
	} catch (error) {
		console.error('Error creating gasto fixo:', error);
		return json({ error: 'Erro ao criar gasto fixo' }, { status: 500 });
	}
}
