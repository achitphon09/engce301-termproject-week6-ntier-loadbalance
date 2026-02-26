// src/services/taskService.js
// Business Logic Layer + Redis Caching Integration
//
// 📌 Cache Strategy: Cache-Aside
//   GET  → ดู Cache ก่อน → ถ้า MISS → Query DB → เก็บ Cache
//   POST/PUT/DELETE → ทำงานกับ DB → Invalidate Cache

const taskRepository = require('../repositories/taskRepository');
const Task = require('../models/Task');
const { getCache, setCache, invalidateCache } = require('../config/redis');

// Cache key constants
const CACHE_KEYS = {
    ALL_TASKS: 'tasks:all',
    TASK_BY_ID: (id) => `tasks:${id}`,
    STATS: 'tasks:stats'
};

class TaskService {

    // GET all tasks — ใช้ Cache
    async getAllTasks() {
        // 1. ดู Cache ก่อน
        const cached = await getCache(CACHE_KEYS.ALL_TASKS);
        if (cached) return cached;   // 🟢 CACHE HIT

        // 2. ถ้า MISS → Query DB
        const tasks = await taskRepository.findAll();
        const json = tasks.map(t => t.toJSON());

        // 3. เก็บลง Cache (TTL 60 วินาที)
        await setCache(CACHE_KEYS.ALL_TASKS, json, 60);

        return json;  // 🔴 CACHE MISS → got from DB
    }

    // GET task by ID — ใช้ Cache
    async getTaskById(id) {
        const cached = await getCache(CACHE_KEYS.TASK_BY_ID(id));
        if (cached) return cached;

        const task = await taskRepository.findById(id);
        if (!task) {
            const error = new Error('Task not found');
            error.statusCode = 404;
            throw error;
        }

        await setCache(CACHE_KEYS.TASK_BY_ID(id), task.toJSON(), 60);
        return task.toJSON();
    }

    // POST create task — Invalidate Cache
    async createTask(taskData) {
        const validation = Task.validate(taskData);
        if (!validation.isValid) {
            const error = new Error(validation.errors.join(', '));
            error.statusCode = 400;
            throw error;
        }

        const task = await taskRepository.create(taskData);

        // ❗ Invalidate related caches
        await invalidateCache('tasks:*');

        return task.toJSON();
    }

    // PUT update task — Invalidate Cache
    async updateTask(id, taskData) {
        const existingTask = await taskRepository.findById(id);
        if (!existingTask) {
            const error = new Error('Task not found');
            error.statusCode = 404;
            throw error;
        }

        if (existingTask.status === 'DONE' && taskData.status && taskData.status !== 'DONE') {
            const error = new Error('Cannot change status of completed task');
            error.statusCode = 400;
            throw error;
        }

        const task = await taskRepository.update(id, taskData);

        // ❗ Invalidate related caches
        await invalidateCache('tasks:*');

        return task.toJSON();
    }

    // DELETE task — Invalidate Cache
    async deleteTask(id) {
        const existingTask = await taskRepository.findById(id);
        if (!existingTask) {
            const error = new Error('Task not found');
            error.statusCode = 404;
            throw error;
        }

        if (existingTask.status === 'IN_PROGRESS') {
            const error = new Error('Cannot delete task that is in progress');
            error.statusCode = 400;
            throw error;
        }

        const result = await taskRepository.delete(id);

        // ❗ Invalidate related caches
        await invalidateCache('tasks:*');

        return result;
    }

    // GET statistics — ใช้ Cache
    async getStatistics() {
        const cached = await getCache(CACHE_KEYS.STATS);
        if (cached) return cached;

        const counts = await taskRepository.countByStatus();
        const total = counts.TODO + counts.IN_PROGRESS + counts.DONE;
        const stats = {
            total,
            byStatus: counts,
            completionRate: total > 0 ? Math.round((counts.DONE / total) * 100) : 0
        };

        await setCache(CACHE_KEYS.STATS, stats, 30);
        return stats;
    }
}

module.exports = new TaskService();
