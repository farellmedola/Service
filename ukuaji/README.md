# Ukuaji — plateforme des marchés africains

Cette version retire les cours, chandeliers, volumes, actualités, positions et ordres fictifs du prototype. L’interface ne présente que des données réellement retournées par le fournisseur, avec leurs limites et horodatages.

## Architecture
- Frontend : HTML, CSS et JavaScript natifs.
- Fournisseur : [Mansa API](https://mansaapi.com/docs), REST avec authentification Bearer.
- Backend : fonction serverless Vercel `api/market.js` ; la clé Mansa reste exclusivement côté serveur.
- Ordres et portefeuille : désactivés jusqu’au branchement du courtier choisi. Aucune transaction, position ou solde n’est simulé.
- Historique : la courbe n’est tracée qu’avec des points historiques réellement retournés par l’API. Les valeurs manquantes restent manquantes.

## Configuration Vercel
1. Définir le Root Directory du projet sur `ukuaji`.
2. Ajouter `MANSA_API_KEY` dans Project Settings → Environment Variables.
3. Laisser `MANSA_PUBLIC_DISPLAY_AUTHORIZED=false` tant que les droits d’affichage public ne sont pas confirmés par écrit.
4. Passer ce verrou à `true` uniquement après validation des droits applicables, puis redéployer.

La clé ne doit jamais être ajoutée au JavaScript client, au dépôt Git ou à une variable publique de build.

## API interne
- `GET /api/market?action=exchanges`
- `GET /api/market?action=stocks&exchange=BRVM&limit=200`
- `GET /api/market?action=history&exchange=JSE&symbol=NPN&range=1Y`
- `GET /api/market?action=search&q=Sonatel`

Le backend refuse les requêtes non-GET, valide les paramètres, applique un délai maximal, relaie les erreurs du fournisseur et met en cache les réponses réussies côté edge. Il ne fabrique aucune donnée de secours.

## Droits et limites du fournisseur
- L’offre gratuite Mansa est annoncée pour un usage personnel uniquement ; les droits commerciaux et de redistribution nécessitent une formule adaptée.
- La documentation annonce une cible de fraîcheur de 30 minutes pour certains jeux de données. Ukuaji ne qualifie donc pas les cours de « temps réel » par défaut.
- L’historique quotidien OHLCV peut nécessiter une formule supérieure. Si l’API refuse cet endpoint, le graphique reste vide.
- Le verrou `MANSA_PUBLIC_DISPLAY_AUTHORIZED` protège contre la diffusion publique accidentelle avant validation contractuelle.

## Neon
Le projet Neon `ukuaji` possède déjà les tables `venues`, `data_sources`, `source_reviews`, `feeds`, `instruments`, `market_observations`, `ingestion_jobs`, `ingestion_runs`, `ingestion_dead_letters` et `audit_events`. Le schéma contient notamment un contrôle explicite des droits de collecte, stockage, affichage et redistribution. Les 12 places déjà enregistrées sont encore au statut `DISCOVERED`; les sources, flux, instruments et observations ne sont pas encore initialisés.

Aucune migration n’est lancée dans cette étape. La connexion Neon et l’ingestion doivent être ajoutées après validation des droits du fournisseur et revue du schéma de provenance. Les tables existantes ne doivent pas être contournées.

## Tests
`npm test` exécute les tests de la fonction API : verrou de diffusion, clé serveur obligatoire, méthode HTTP, validation des paramètres et propagation du quota fournisseur.

## Développement local
Installer Vercel CLI, puis lancer `npm run dev`. Placer les variables dans `.env.local` (jamais commitées).
