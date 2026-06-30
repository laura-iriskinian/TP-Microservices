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

const PORT = 3002;

const events = [
    {id: 1, name: "Spectacle", availableSeats: 0},
    {id: 2, name: "Concert", availableSeats: 3},
    {id: 3, name: "Conférence", availableSeats: 5}
];

const reservations = [];
let nextReservationId = 1;

app.get("/events", (req, res) => {
    return res.status(200).json(events);
});

app.post("/reservations", (req, res) => {
    const eventId = Number(req.body.eventId);
    const event = events.find((e) => e.id === eventId);

    if (!event) {
        return res.status(404).json({error: "Événement introuvable"});
    }

    if (event.availableSeats <= 0) {
        return res.status(409).json({error: "Aucune place disponible pour cet événement"});
    }

    event.availableSeats -= 1;

    const reservation = {
        id: nextReservationId++,
        eventId: event.id,
        status: "pending"
    };
    reservations.push(reservation);

    return res.status(201).json(reservation);
});

app.post("/reservations/:id/confirm", (req, res) => {
    const id = Number(req.params.id);
    const reservation = reservations.find((r) => r.id === id);

    if (!reservation) {
        return res.status(404).json({error: "Réservation introuvable"});
    }

    if (reservation.status !== "pending") {
        return res.status(409).json({error: `Impossible de confirmer : statut actuel ${reservation.status}`});
    }

    reservation.status = "confirmée";
    return res.status(200).json(reservation);
});

app.post("/reservations/:id/cancel", (req, res) => {
    const id = Number(req.params.id);
    const reservation = reservations.find((r) => r.id === id);

    if (!reservation) {
        return res.status(404).json({error: "Réservation introuvable"});
    }

    if (reservation.status === "annulée") {
        return res.status(409).json({error: `Impossible d'annuler : statut actuel ${reservation.status}`});
    }

    const event = events.find((e) => e.id === reservation.eventId);
    if (event) {
        event.availableSeats += 1;
    }

    reservation.status = "annulée";
    return res.status(200).json(reservation);
});

app.listen(PORT, () => {
    console.log(`Inventory service en écoute sur le port ${PORT}`);
});
