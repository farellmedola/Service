# Ukuaji — plateforme des marchés africains

Cette version retire les cours, chandeliers, volumes, actualités, positions et ordres fictifs du prototype. L’interface ne présente que des données reçues du fournisseur, avec leurs limites et métadonnées.

## État fonctionnel
- Frontend : HTML, CSS et JavaScript natifs.
- Fournisseur prévu : [Mansa API](https://mansaapi.com/docs), API REST avec authentification Bearer.
- Backend : fonction serverless Vercel `api/market.js`; la clé fournisseur reste côté serveur.
- Ordres désactivés : aucun ordre n’est simulé ni présenté comme exécuté. Le courtier sera branché après sélection et autorisation du partenaire.
- Portefeuille désactivé : aucun solde ou historique fictif n’est créé dans le navigateur.
- Historique : la courbe n’est tracée qu’avec des points historiques réellement retournés par l’API.

## Configuration
1. Définir le Root Directory Vercel sur `ukuaji`.
2. Ajouter `MANSA_API_KEY` dans Vercel → Project Settings → Environment Variables.
3. Redéployer après ajout de la variable.

Ne jamais placer la clé dans le JavaScript client, dans Git ou dans une variable publique de build.

## API interne
- `GET /api/market?action=exchanges`
- `GET /api/market?action=stocks&exchange=BRVM&limit=200`
- `GET /api/market?action=history&exchange=JSE&symbol=NPN&range=1Y`
- `GET /api/market?action=search&q=Sonatel`

Les erreurs d’authentification, de quota et de disponibilité ne sont jamais remplacées par des valeurs de démonstration.

## Limites connues
- Aucune clé Mansa n’est encore configurée dans Vercel ; l’application affiche donc l’indisponibilité tant que cette étape n’est pas faite.
- La documentation Mansa annonce une cible de fraîcheur de 30 minutes pour certains jeux de données. L’application doit afficher les horodatages réels, sans qualifier automatiquement les cours de temps réel.
- L’historique OHLCV peut nécessiter une formule supérieure. Si l’API le refuse, le graphique reste vide.
- Neon n’est pas encore branché : le schéma existant doit être audité avant toute migration.
- Authentification, comptes, positions et réconciliation avec le courtier restent à mettre en place après définition des exigences de sécurité.

## Développement local
Installer Vercel CLI, puis lancer `npm run dev`. Placer la clé dans `.env.local` (jamais commité).
