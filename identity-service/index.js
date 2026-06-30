require("dotenv").config();
const express = require('express');
const app = express();

const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

app.use(express.json());

app.use((req, res, next) => {
    const auth = req.headers["authorization"];
    if (!auth || auth !== `Bearer ${INTERNAL_TOKEN}`) {
        return res.status(401).json({ error: "Non autorisé" });
    }
    next();
});

const PORT = 3001;

const users = [
    {id: 1, name: 'Pierre'}, 
    {id: 2, name: 'Paul'}, 
    {id: 3, name: 'Jacques'}
];

app.get("/users/:id", (req, res) => {
    const id = Number(req.params.id);
    const user = users.find((u) => u.id === id);

    if (!user) {
        return res.status(404).json({error: "Utilisateur introuvable"});
    }

    return res.status(200).json(user);
});

app.get("/users", (req, res) => {
    return res.status(200).json(users);
});

app.listen(PORT, () => {
    console.log(`Identity service en écoute sur le port ${PORT}`);
});