import { json } from '@sveltejs/kit';

export async function POST({ platform }) {
	const db = platform.env.DB;
	
	try {
		// Get current month and year
		const now = new Date();
		const currentMonth = now.getMonth() + 1; // 1-12
		const currentYear = now.getFullYear();
		
		// Check if fixed expenses have already been launched for current month
		const existingExpenses = await db.prepare(`
			SELECT COUNT(*) as count
			FROM gastos 
			WHERE strftime('%m', data_compra) = ? 
			AND strftime('%Y', data_compra) = ?
			AND EXISTS (
				SELECT 1 FROM gastos_fixos gf 
				WHERE gf.id_categoria = gastos.id_categoria 
				AND gf.id_subcategoria = gastos.id_subcategoria
			)
		`).bind(
			currentMonth.toString().padStart(2, '0'),
			currentYear.toString()
		).first();
		
		if (existingExpenses.count > 0) {
			return json({ 
				success: true, 
				launched: 0,
				message: 'Gastos fixos deste mês já foram lançados' 
			});
		}
		
		// Get all fixed expenses
		const fixedExpenses = await db.prepare(`
			SELECT gf.valor, gf.tipo, gf.comentario, gf.id_categoria, gf.id_subcategoria,
			       c.nome_categoria as categoria, s.nome_subcategoria as subcategoria
			FROM gastos_fixos gf
			LEFT JOIN categorias c ON gf.id_categoria = c.id
			LEFT JOIN subcategorias s ON gf.id_subcategoria = s.id
		`).all();
		
		if (!fixedExpenses.results || fixedExpenses.results.length === 0) {
			return json({ 
				success: true, 
				launched: 0,
				message: 'Nenhum gasto fixo cadastrado' 
			});
		}
		
		// Get default payment method (Credito)
		const paymentResult = await db.prepare(`
			SELECT id FROM pagamento WHERE Credito IS NOT NULL
		`).first();
		
		const paymentId = paymentResult?.id || 1;
		
		// Create current month date
		const currentMonthDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
		
		// Prepare batch insert for all fixed expenses
		const inserts = fixedExpenses.results.map(fixedExpense => {
			return db.prepare(`
				INSERT INTO gastos (
					data_compra, valor, parcelas, id_categoria, id_subcategoria,
					tipo, id_pagamento, comentario
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				currentMonthDate,
				fixedExpense.valor,
				1, // Fixed expenses are single installment
				fixedExpense.id_categoria,
				fixedExpense.id_subcategoria,
				fixedExpense.tipo,
				paymentId,
				`Gasto fixo - ${fixedExpense.comentario || fixedExpense.categoria + '/' + fixedExpense.subcategoria}`
			);
		});
		
		// Execute batch insert
		await db.batch(inserts);
		
		return json({ 
			success: true, 
			launched: fixedExpenses.results.length,
			message: `${fixedExpenses.results.length} gastos fixos lançados com sucesso`
		});
		
	} catch (error) {
		console.error('Error launching fixed expenses:', error);
		return json({ error: 'Erro ao lançar gastos fixos' }, { status: 500 });
	}
}
