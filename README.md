# Argus CRM

Argus CRM ist ein einfaches CRM-System f\u00fcr Hausverwaltungen. Das Projekt besteht aus einem Node.js Backend und einer React Frontend-Anwendung. Die Daten werden in einer SQLite Datenbank gespeichert.

## Verzeichnis\u00fcbersicht

- **backend** – Express API und Datenbankinitialisierung
- **frontend** – React Anwendung mit Material UI
- **data** – SQLite Datenbank (wird beim ersten Start erstellt)

## Voraussetzungen

- Node.js >= 18
- npm

## Installation

Alle Abh\u00e4ngigkeiten k\u00f6nnen mit einem Befehl installiert werden:

```bash
npm run install-all
```

Alternativ lassen sich Backend und Frontend separat installieren:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Datenbank initialisieren

Das Backend enth\u00e4lt Skripte zum Anlegen der Datenbanktabellen und zum Einf\u00fcgen von Testdaten.

```bash
cd backend
npm run init-db   # Tabellen erstellen
npm run seed-db   # optionale Beispieldaten einf\u00fcgen
```

## Entwicklung starten

Um Backend und Frontend gleichzeitig zu starten, kann folgender Befehl im Projektstamm ausgef\u00fchrt werden:

```bash
npm run dev
```

- Backend: [http://localhost:3000](http://localhost:3000)
- Frontend: [http://localhost:3001](http://localhost:3001)

## Lizenzen

Dieses Projekt steht ohne spezielle Lizenz zur Verf\u00fcgung. Nutzen auf eigene Gefahr.
