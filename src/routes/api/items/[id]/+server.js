import { json } from '@sveltejs/kit';

export async function DELETE({ params, platform }) {
	const db = platform.env.DB;
	
	try {
		await db.prepare('DELETE FROM itens WHERE id = ?').bind(params.id).run();
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting item:', error);
		return json({ error: 'Erro ao excluir item' }, { status: 500 });
	}
}
