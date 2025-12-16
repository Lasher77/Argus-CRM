# Argus CRM

Argus CRM ist ein CRM-System für Hausverwaltungen, optimiert für den Einsatz in kleinen Teams. Das Projekt besteht aus einem Node.js Backend und einer React Frontend-Anwendung. Die Daten werden in einer lokalen SQLite Datenbank gespeichert.

## Features

- **Kunden- & Kontaktverwaltung:** Verwalten von Hausverwaltungen, Objekten und Ansprechpartnern.
- **Auftragsmanagement:** Serviceaufträge erstellen, planen und dokumentieren.
- **Rechnungswesen:** Angebote und Rechnungen erstellen.
- **PDF-Vorlagen:** Integrierter Drag-and-Drop Editor für individuelle Rechnungs- und Angebotslayouts.
- **Materialverwaltung:** Einfache Lagerverwaltung und Materialverfolgung.

## Verzeichnisübersicht

- **backend** – Express API, Datenbanklogik und PDF-Rendering
- **frontend** – React Anwendung mit Material UI
- **data** – SQLite Datenbank und Vorlagen-Assets (wird automatisch erstellt)

## Voraussetzungen

- **Node.js**: Version 20 oder 22 empfohlen (Mindestens 18)
- **npm**: Wird mit Node.js installiert

## Installation

1. Repository klonen
2. Alle Abhängigkeiten installieren:

```bash
npm run install-all
```

## Datenbank initialisieren

Vor dem ersten Start muss die Datenbank initialisiert werden. Dies erstellt die notwendigen Tabellen im `data/` Ordner.

```bash
cd backend
npm run init-db
```

*Optional: Testdaten einfügen*
Wenn Sie die Anwendung testen möchten, können Sie Testdaten (inkl. Benutzer) generieren:
```bash
npm run seed-db
```
**Hinweis:** Dies erstellt Standard-Benutzer wie `admin` (Passwort: `admin123`) oder `user` (Passwort: `user123`). Der Setup-Assistent wird dann **nicht** angezeigt.

## Starten (Entwicklung)

Um Backend und Frontend gleichzeitig im Entwicklungsmodus zu starten (Hot-Reloading):

```bash
npm run dev
```

- Backend API: [http://localhost:3000](http://localhost:3000)
- Frontend: [http://localhost:3001](http://localhost:3001)

## Starten (Produktiv / Deployment)

Für den produktiven Einsatz (z.B. auf einem lokalen Mac Server oder hinter Cloudflare Tunnel) empfiehlt es sich, das Frontend zu bauen und vom Backend ausliefern zu lassen. So läuft die gesamte Anwendung über einen einzigen Port (3000).

1. Frontend bauen:
   ```bash
   cd frontend
   npm run build
   ```

2. Backend starten:
   ```bash
   cd ../backend
   npm start
   ```

Die Anwendung ist nun unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Ersteinrichtung

Beim allerersten Start der Anwendung werden Sie automatisch zum **Setup-Assistenten** weitergeleitet. Dort können Sie das erste Administrator-Konto erstellen.

**Wichtig:** Der Setup-Assistent erscheint nur, wenn die Datenbank **keine Benutzer** enthält. Haben Sie `npm run seed-db` ausgeführt, müssen Sie die Datenbank zurücksetzen, um den Assistenten zu testen:

```bash
cd backend
npm run reset-db
```

## Deployment Hinweise

- **Cloudflare Tunnel:** Da die Anwendung im Produktionsmodus alles über Port 3000 ausliefert, müssen Sie lediglich diesen Port über Ihren Tunnel freigeben.
- **Datensicherung:** Sichern Sie regelmäßig den Ordner `data/`. Er enthält die SQLite-Datenbank (`crm-argus.db`) sowie hochgeladene Bilder für Vorlagen.

## Lizenzen

Dieses Projekt steht ohne spezielle Lizenz zur Verfügung. Nutzen auf eigene Gefahr.
