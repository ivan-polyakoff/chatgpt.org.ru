const express = require('express');
const { modelController } = require('~/server/controllers/ModelController');
const { requireJwtAuth } = require('~/server/middleware/');
const { getModelDescriptionsPublic } = require('~/server/controllers/ModelDescriptionController');

const router = express.Router();
router.get('/', requireJwtAuth, modelController);

// Новый маршрут: /api/models/descriptions (для всех)
router.get('/descriptions', requireJwtAuth, getModelDescriptionsPublic);

module.exports = router;
