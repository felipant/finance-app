import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
	const db = platform.env.DB;
	
	try {
		const subcategories = await db.prepare(`
			SELECT sc.id, sc.nome_subcategoria, sc.id_categoria, c.nome_categoria
			FROM subcategorias sc
			JOIN categorias c ON sc.id_categoria = c.id
			ORDER BY c.nome_categoria, sc.nome_subcategoria
		`).all();
		
		return json(subcategories.results || []);
	} catch (error) {
		console.error('Error fetching subcategories:', error);
		return json([], { status: 500 });
	}
}

export async function POST({ request, platform }) {
	const db = platform.env.DB;
	
	try {
		const { nome_subcategoria, id_categoria } = await request.json();
		
		if (!nome_subcategoria?.trim() || !id_categoria) {
			return json({ error: 'Nome e categoria são obrigatórios' }, { status: 400 });
		}
		
		const result = await db.prepare(`
			INSERT INTO subcategorias (nome_subcategoria, id_categoria) VALUES (?, ?)
		`).bind(nome_subcategoria.trim(), id_categoria).run();
		
		return json({ id: result.meta.last_row_id, nome_subcategoria, id_categoria });
	} catch (error) {
		console.error('Error creating subcategory:', error);
		return json({ error: 'Erro ao criar subcategoria' }, { status: 500 });
	}
}
