const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3003;
const MAX_AMOUNT = 500;

app.post('/payment', (req, res) => {
    const amount = Number(req.body.amount);

    if (isNan(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Montant invalide' });
    }

    if (amount > MAX_AMOUNT) {
        return res.status(400).json({ error: 'Montant supérieur au maximum autorisé' });
    }

    return res.status(200).json({ message: 'Paiement accepté' });
});

app.listen(PORT, () => {
    console.log("Payment service en écoute sur le port ${PORT}");
});