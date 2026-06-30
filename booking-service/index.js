require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

const PORT = 3004;

const IDENTITY_URL = "http://localhost:3001";
const INVENTORY_URL = "http://localhost:3002";
const PAYMENT_URL = "http://localhost:3003";
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

const bookings = [];
let nextBookingId = 1;

app.post("/bookings", async (req, res) => {
const userId = Number(req.body.userId);
const eventId = Number(req.body.eventId);
const amount = Number(req.body.amount);

if (isNaN(userId) || isNaN(eventId) || isNaN(amount)) {
    return res.status(400).json({ error: "userId, eventId et amount sont requis" });
}

const booking = {
    id: nextBookingId++,
    userId,
    eventId,
    amount,
    status: "pending",
    reservationId: null,
};
bookings.push(booking);

try {
    const userRes = await fetch(`${IDENTITY_URL}/users/${userId}`, {
        headers: { "Authorization": `Bearer ${INTERNAL_TOKEN}` }
    });
    if (userRes.status === 404) {
    booking.status = "canceled";
    return res.status(400).json({ error: "Utilisateur inexistant", booking });
    }
    if (!userRes.ok) {
    booking.status = "canceled";
    return res.status(502).json({ error: "Identity Service en erreur", booking });
    }
} catch (err) {
    booking.status = "canceled";
    return res.status(502).json({ error: "Identity Service injoignable", booking });
}

try {
    const invRes = await fetch(`${INVENTORY_URL}/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${INTERNAL_TOKEN}` },
    body: JSON.stringify({ eventId }),
    });

    if (invRes.status === 409) {
    booking.status = "payment_failed"; 
    booking.status = "no_seat";
    return res.status(409).json({ error: "Plus de place disponible", booking });
    }
    if (!invRes.ok) {
    booking.status = "canceled";
    return res.status(502).json({ error: "Inventory Service en erreur", booking });
    }

    const reservation = await invRes.json();
    booking.reservationId = reservation.id;
} catch (err) {
    booking.status = "canceled";
    return res.status(502).json({ error: "Inventory Service injoignable", booking });
}

let paymentResult;
try {
    const payRes = await fetch(`${PAYMENT_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${INTERNAL_TOKEN}` },
    body: JSON.stringify({ amount }),
    });

    if (!payRes.ok) {
    await releaseSeat(booking.reservationId);
    booking.status = "canceled";
    return res.status(502).json({ error: "Payment Service en erreur", booking });
    }

    paymentResult = await payRes.json();
} catch (err) {
    await releaseSeat(booking.reservationId);
    booking.status = "canceled";
    return res.status(502).json({ error: "Payment Service injoignable", booking });
}


if (paymentResult.status === "accepted") {
    try {
    const confirmRes = await fetch(
        `${INVENTORY_URL}/reservations/${booking.reservationId}/confirm`,
        {   method: "POST",
            headers: { "Authorization": `Bearer ${INTERNAL_TOKEN}` }
        }
    );
    if (!confirmRes.ok) {
        await releaseSeat(booking.reservationId);
        booking.status = "canceled";
        return res.status(502).json({ error: "Échec de la confirmation", booking });
    }
    booking.status = "confirmed";
    return res.status(201).json(booking);
    } catch (err) {
    await releaseSeat(booking.reservationId);
    booking.status = "canceled";
    return res.status(502).json({ error: "Inventory injoignable à la confirmation", booking });
    }
} else {
    await releaseSeat(booking.reservationId);
    booking.status = "payment_failed";
    return res.status(200).json({ error: "Paiement refusé", booking });
}
});

app.get("/bookings/:id", (req, res) => {
const id = Number(req.params.id);
const booking = bookings.find((b) => b.id === id);
if (!booking) {
    return res.status(404).json({ error: "Réservation introuvable" });
}
return res.status(200).json(booking);
});

async function releaseSeat(reservationId) {
if (!reservationId) return;
try {
    await fetch(`${INVENTORY_URL}/reservations/${reservationId}/cancel`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${INTERNAL_TOKEN}` }
    });
} catch (err) {
    console.error("Échec de la libération de la place", reservationId, err.message);
}
}

app.listen(PORT, () => {
console.log(`Booking Service en écoute sur http://localhost:${PORT}`);
});