const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authorizeRoles } = require('../middleware/authMiddleware');

router.post('/uploads/presign', authorizeRoles('ADMIN', 'WORKER'), uploadController.createPresignedUpload);

module.exports = router;
