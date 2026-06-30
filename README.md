# Plateforme de réservation - microservices

## Configuration

Créer un fichier `.env` dans chacun des 4 dossiers, avec la même valeur :

```
INTERNAL_TOKEN=mon_token_secret_partage_123
```

## Lancement

Ouvrir 4 terminaux, un par service :

```
cd identity-service  && node index.js   # port 3001
cd inventory-service && node index.js   # port 3002
cd payment-service   && node index.js   # port 3003
cd booking-service   && node index.js   # port 3004
```

Les 4 services doivent tourner en même temps pour tester une réservation.

## Tester une réservation

Tout passe par le Booking Service (port 3004).

Les utilisateurs disponibles ont les id 1, 2 et 3.
Les événements : id 1 (3 places), id 2 (1 place), id 3 (0 place).

### Réservation qui réussit

```
curl -X POST http://localhost:3004/bookings -H "Content-Type: application/json" -d "{\"userId\":1,\"eventId\":1,\"amount\":100}"
```

Résultat attendu : statut `confirmée`.

### Utilisateur qui n'existe pas

```
curl -X POST http://localhost:3004/bookings -H "Content-Type: application/json" -d "{\"userId\":999,\"eventId\":1,\"amount\":100}"
```

Résultat attendu : réservation refusée, aucune place retirée.

### Paiement refusé (montant supérieur à 500)

```
curl -X POST http://localhost:3004/bookings -H "Content-Type: application/json" -d "{\"userId\":1,\"eventId\":1,\"amount\":900}"
```

Résultat attendu : statut `payment_failed`, et la place réservée est rendue.

### Plus de place disponible (événement 3)

```
curl -X POST http://localhost:3004/bookings -H "Content-Type: application/json" -d "{\"userId\":1,\"eventId\":3,\"amount\":100}"
```

Résultat attendu : réservation refusée, plus aucune place.

### Consulter une réservation

```
curl http://localhost:3004/bookings/1
```

### Consulter les événements et leurs places restantes

```
curl http://localhost:3002/events -H "x-internal-token: mon_token_secret_partage_123"
```

(Cet appel direct nécessite le token, car les services ne se font confiance qu'entre eux.)