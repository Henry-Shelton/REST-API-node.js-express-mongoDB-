const Store = require('../models/Store');

// @desc  Create a store
// @route POST /api/v1/stores
// @access Public
exports.addStore = async (req, res, next) => {
    try {
        if (!req.body){
            return res
                .status(400)
                .send({ message:"Fill in all fields"})
        }

        //create store from model
        const store = await Store.create(req.body);

        //this is where all input fields are saved into DB

        return res.status(201).json({
            success: true,
            data: store
        });

    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'This store already exists' });
        }
        res.status(500).send({ message: "Unable to add store - server error" });
    }
};

// @desc  Get all stores
// @route GET /api/v1/stores
// @access Public
exports.getStores = async (req, res, next) => {

    //if user id is available we get all stores only for their id
    if(req.params.id){
        const id = req.params.id;

        Store.findById(id)
            .then(data =>{
                if(!data){
                    res.status(404).send({ message : "Store not found user with id "+ id})
                }else{
                    res.send(data)
                }
            })
            .catch(err =>{
                res.status(500).send({ message: "Error retrieving store with id " + id})
            })

    }else{

        //if no id is available for users stores, get all stores
        Store.find()
             .then(user => {
                res.send(user)
            })
             .catch(err => {
                res.status(500).send({ message : err.message || "Error Occurred while retrieving store information" })
            })
    }
};

// @desc  Update a store
// @route PUT /api/v1/stores/:id
// // @access Public
exports.updateStore = async (req, res, next) => {
    try {
        if (!req.body){
            return res
                .status(400)
                .send({ message:"Fill in all fields"})
        }

        const id = req.params.id
        Store.findByIdAndUpdate(id, req.body, { useFindAndModify: false} )
            .then (data => {
                if(!data){
                    res.status(404).send({ message: 'Cannot update store ${id} - not found' })
                }else{
                    res.send(data);
                }
            })
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Unable to update store information' });
    }
};

// @desc  Delete a store
// @route DELETE /api/v1/stores/:id
// @access Public
exports.deleteStore = async (req, res, next) => {
    try {

        const id = req.params.id

        Store.findByIdAndDelete(id)
            .then (data => {
                if(!data){
                    res.status(404).send({ message: 'Cannot delete store ${id} - wrong id?' })
                }else{
                    res.send({ message:"Store was deletes successfully." });
                }
            })
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Could not delete store with id=" + id });
    }
};

//these APIs are passed onto routes