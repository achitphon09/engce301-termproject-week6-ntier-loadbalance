// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/tasks', (req, res, next) => taskController.getAllTasks(req, res, next));
router.get('/tasks/stats', (req, res, next) => taskController.getStatistics(req, res, next));
router.get('/tasks/:id', (req, res, next) => taskController.getTaskById(req, res, next));
router.post('/tasks', (req, res, next) => taskController.createTask(req, res, next));
router.put('/tasks/:id', (req, res, next) => taskController.updateTask(req, res, next));
router.delete('/tasks/:id', (req, res, next) => taskController.deleteTask(req, res, next));

module.exports = router;
