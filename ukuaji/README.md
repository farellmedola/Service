# Ukuaji — plateforme des marchés africains

Cette version retire les cours, chandeliers, volumes, actualités, positions et ordres fictifs du prototype. L’interface ne présente que des données réellement retournées par le fournisseur, avec leurs limites et horodatages.

## Architecture
- Frontend : HTML, CSS et JavaScript natifs.
- Fournisseur : [Mansa API](https://mansaapi.com/docs), REST avec authentification Bearer.
- Backend : fonctions serverless Vercel `api/market.js` et `api/health.js` ; les secrets Mansa et Neon restent exclusivement côté serveur.
- Base de données : PostgreSQL Neon via `@neondatabase/serverless`; l’endpoint `GET /api/health` vérifie la connectivité sans exposer d’identifiants.
- Ordres et portefeuille : désactivés jusqu’au branchement du courtier choisi. Aucune transaction, position ou solde n’est simulé.
- Historique : la courbe n’est tracée qu’avec des points historiques réellement retournés par l’API. Les valeurs manquantes restent manquantes.

## Configuration Vercel
1. Définir le Root Directory du projet sur `ukuaji`.
2. Ajouter `MANSA_API_KEY` et `DATABASE_READONLY_URL` dans Project Settings → Environment Variables (Preview uniquement pour les tests). Utiliser le rôle Neon `ukuaji_preview_ro` pour les lectures ; ne pas utiliser le rôle propriétaire dans l’application.
3. Laisser `MANSA_PUBLIC_DISPLAY_AUTHORIZED=false` tant que les droits applicables n’ont pas été clarifiés.
4. Laisser `MANSA_HISTORY_ENABLED=false` sur l’offre gratuite : l’historique OHLCV est réservé au plan Pro ou supérieur.
5. Passer les verrous à `true` uniquement après validation des droits et du niveau d’abonnement, puis redéployer.

La clé ne doit jamais être ajoutée au JavaScript client, au dépôt Git ou à une variable publique de build.

## API interne
- `GET /api/market?action=exchanges`
- `GET /api/market?action=stocks&exchange=BRVM&limit=200`
- `GET /api/market?action=history&exchange=JSE&symbol=NPN&range=1Y`
- `GET /api/market?action=search&q=Sonatel`
- `GET /api/health` (contrôle de disponibilité PostgreSQL, sans lecture ni écriture métier)

Le backend refuse les requêtes non-GET, valide les paramètres, applique un délai maximal, relaie les erreurs du fournisseur et met en cache les réponses réussies côté edge. Il ne fabrique aucune donnée de secours et ne relaie que les champs nécessaires à l’affichage.

## Droits et limites du fournisseur
- Les pages officielles Mansa ne sont pas parfaitement cohérentes sur l’étendue des droits du plan gratuit : la page de licence permet l’affichage avec attribution et un cache de 24 h, tandis que les pages de prix/conditions limitent l’offre gratuite à l’usage personnel et excluent la redistribution commerciale. Le verrou public reste donc fermé jusqu’à clarification.
- L’offre gratuite est limitée à 100 requêtes/jour. La documentation indique une actualisation cible de 30 minutes pendant les séances de marché. Ukuaji ne qualifie donc pas les cours de « temps réel » par défaut.
- L’historique quotidien OHLCV est réservé au plan Pro ou supérieur ; l’application ne l’appelle pas sur l’offre Standard.
- Le verrou `MANSA_PUBLIC_DISPLAY_AUTHORIZED` protège contre la diffusion publique accidentelle avant validation contractuelle.

## Neon
Le projet Neon `ukuaji` possède déjà les tables `venues`, `data_sources`, `source_reviews`, `feeds`, `instruments`, `market_observations`, `ingestion_jobs`, `ingestion_runs`, `ingestion_dead_letters` et `audit_events`. Le schéma contient notamment un contrôle explicite des droits de collecte, stockage, affichage et redistribution. Les 12 places déjà enregistrées sont encore au statut `DISCOVERED`; les sources, flux, instruments et observations ne sont pas encore initialisés.

Mansa API est enregistré comme source inactive avec statut `PUBLIC_TERMS_REVIEW`. Les secrets `MANSA_API_KEY` et `DATABASE_READONLY_URL` sont configurés côté serveur Vercel en Preview uniquement ; le rôle `ukuaji_preview_ro` dispose de SELECT sans INSERT. La connectivité est vérifiée par `/api/health`. Les droits de collecte, stockage, affichage et redistribution sont tous désactivés dans le registre de conformité. Aucune migration ni ingestion n’est lancée dans cette étape.

## Tests
`npm test` exécute les tests de la fonction API : verrou de diffusion, clé serveur obligatoire, plan Pro pour l’historique, méthode HTTP, validation des paramètres, quota fournisseur et filtrage des champs exposés.

## Développement local
Installer Vercel CLI, puis lancer `npm run dev`. Placer les variables dans `.env.local` (jamais commitées).
