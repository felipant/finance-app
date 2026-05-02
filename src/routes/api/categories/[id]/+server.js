import { json } from '@sveltejs/kit';

export async function DELETE({ params, platform }) {
	const db = platform.env.DB;
	
	try {
		await db.prepare('DELETE FROM categorias WHERE id = ?').bind(params.id).run();
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting category:', error);
		return json({ error: 'Erro ao excluir categoria' }, { status: 500 });
	}
}
