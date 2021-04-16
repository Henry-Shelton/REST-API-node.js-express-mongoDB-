const express = require('express');

const router = express.Router();

const { getStores, addStore, updateStore, deleteStore } = require('../controllers/stores');

router
    .route('/')
    .get(getStores)
    .post(addStore)
    .put(updateStore)
    .delete(deleteStore)


module.exports = router;