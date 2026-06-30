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

const PORT = 3003;
const MAX_AMOUNT = 500;

app.post('/payments', (req, res) => {
    const amount = Number(req.body.amount);

    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Montant invalide' });
    }

    if (amount > MAX_AMOUNT) {
        return res.status(200).json({ status: 'rejected', message: 'Montant supérieur au maximum autorisé' });
    }

    return res.status(200).json({ status: 'accepted', message: 'Paiement accepté' });
});

app.listen(PORT, () => {
    console.log(`Payment service en écoute sur le port ${PORT}`);
});
