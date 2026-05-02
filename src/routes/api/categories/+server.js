import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
	const db = platform.env.DB;
	
	try {
		const categories = await db.prepare(`
			SELECT id, nome_categoria FROM categorias ORDER BY nome_categoria
		`).all();
		
		return json(categories.results || []);
	} catch (error) {
		console.error('Error fetching categories:', error);
		return json([], { status: 500 });
	}
}

export async function POST({ request, platform }) {
	const db = platform.env.DB;
	
	try {
		const { nome_categoria } = await request.json();
		
		if (!nome_categoria?.trim()) {
			return json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
		}
		
		const result = await db.prepare(`
			INSERT INTO categorias (nome_categoria) VALUES (?)
		`).bind(nome_categoria.trim()).run();
		
		return json({ id: result.meta.last_row_id, nome_categoria });
	} catch (error) {
		console.error('Error creating category:', error);
		return json({ error: 'Erro ao criar categoria' }, { status: 500 });
	}
}
