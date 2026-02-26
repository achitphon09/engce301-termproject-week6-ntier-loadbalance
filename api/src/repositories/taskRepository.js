// src/repositories/taskRepository.js
const { query } = require('../config/database');
const Task = require('../models/Task');

class TaskRepository {
    async findAll() {
        const sql = `SELECT id, title, description, status, priority, created_at, updated_at FROM tasks ORDER BY CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 END, created_at DESC`;
        const result = await query(sql);
        return result.rows.map(row => new Task(row));
    }

    async findById(id) {
        const sql = 'SELECT id, title, description, status, priority, created_at, updated_at FROM tasks WHERE id = $1';
        const result = await query(sql, [id]);
        if (result.rows.length === 0) return null;
        return new Task(result.rows[0]);
    }

    async create(taskData) {
        const sql = `INSERT INTO tasks (title, description, status, priority) VALUES ($1, $2, $3, $4) RETURNING id, title, description, status, priority, created_at, updated_at`;
        const result = await query(sql, [taskData.title, taskData.description || '', taskData.status || 'TODO', taskData.priority || 'MEDIUM']);
        return new Task(result.rows[0]);
    }

    async update(id, taskData) {
        const sql = `UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), priority = COALESCE($4, priority), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, title, description, status, priority, created_at, updated_at`;
        const result = await query(sql, [taskData.title, taskData.description, taskData.status, taskData.priority, id]);
        if (result.rows.length === 0) return null;
        return new Task(result.rows[0]);
    }

    async delete(id) {
        const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
        return result.rowCount > 0;
    }

    async countByStatus() {
        const sql = 'SELECT status, COUNT(*) as count FROM tasks GROUP BY status';
        const result = await query(sql);
        return result.rows.reduce((acc, row) => { acc[row.status] = parseInt(row.count); return acc; }, { TODO: 0, IN_PROGRESS: 0, DONE: 0 });
    }
}

module.exports = new TaskRepository();
