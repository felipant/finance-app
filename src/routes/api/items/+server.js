import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
	const db = platform.env.DB;
	
	try {
		const items = await db.prepare(`
			SELECT i.id, i.nome_item, i.id_subcategoria,
			       s.nome_subcategoria, s.id_categoria,
			       c.nome_categoria
			FROM itens i
			JOIN subcategorias s ON i.id_subcategoria = s.id
			JOIN categorias c ON s.id_categoria = c.id
			ORDER BY i.nome_item
		`).all();
		
		return json(items.results || []);
	} catch (error) {
		console.error('Error fetching items:', error);
		return json([], { status: 500 });
	}
}

export async function POST({ request, platform }) {
	const db = platform.env.DB;
	
	try {
		const { nome_item, id_subcategoria } = await request.json();
		
		if (!nome_item?.trim() || !id_subcategoria) {
			return json({ error: 'Nome e subcategoria são obrigatórios' }, { status: 400 });
		}
		
		const result = await db.prepare(`
			INSERT INTO itens (nome_item, id_subcategoria) VALUES (?, ?)
		`).bind(nome_item.trim(), id_subcategoria).run();
		
		return json({ id: result.meta.last_row_id, nome_item, id_subcategoria });
	} catch (error) {
		console.error('Error creating item:', error);
		return json({ error: 'Erro ao criar item' }, { status: 500 });
	}
}
