# Ukuaji — plateforme des marchés africains

Cette version retire les cours, chandeliers, volumes, actualités, positions et ordres fictifs du prototype. L’interface ne présente que des données réellement retournées par le fournisseur, avec leurs limites et horodatages.

## Architecture
- Frontend : HTML, CSS et JavaScript natifs.
- Fournisseur : [Mansa API](https://mansaapi.com/docs), REST avec authentification Bearer.
- Backend : fonctions serverless Vercel `api/market.js` et `api/health.js` ; les secrets Mansa et Neon restent exclusivement côté serveur.
- Base de données : PostgreSQL Neon via `@neondatabase/serverless`; l’endpoint `GET /api/health` vérifie la connectivité sans exposer d’identifiants.
- Ordres et portefeuille : désactivés jusqu’au branchement du courtier choisi. Aucune transaction, position ou solde n’est simulé.
- Historique : réservé au plan Mansa Pro ; aucune série de remplacement ni aucun point synthétique n’est généré.
- Indices et variations : lecture des snapshots panafricains via les endpoints officiels Mansa.

## Configuration Vercel
1. Définir le Root Directory du projet sur `ukuaji`.
2. Ajouter `MANSA_API_KEY` et `DATABASE_READONLY_URL` dans Project Settings → Environment Variables (Preview uniquement pour les tests). Utiliser le rôle Neon `ukuaji_preview_ro` pour les lectures ; ne pas utiliser le rôle propriétaire dans l’application.
3. `MANSA_PUBLIC_DISPLAY_AUTHORIZED=true` est configuré uniquement en Preview pour l’évaluation avec attribution. Ne jamais l’activer en Production avant validation du plan commercial et des conditions applicables.
4. Laisser `MANSA_HISTORY_ENABLED=false` sur l’offre gratuite : l’historique OHLCV est réservé au plan Pro ou supérieur.
5. N’activer les données en Production qu’après choix du plan adapté à Ukuaji, validation de l’usage commercial et contrôle de l’attribution. Redéployer ensuite.

La clé ne doit jamais être ajoutée au JavaScript client, au dépôt Git ou à une variable publique de build.

## API interne
- `GET /api/market?action=exchanges`
- `GET /api/market?action=stocks&exchange=BRVM&limit=200`
- `GET /api/market?action=indices`
- `GET /api/market?action=movers`
- `GET /api/market?action=history&exchange=JSE&symbol=NPN&range=1Y`
- `GET /api/market?action=search&q=Sonatel`
- `GET /api/health` (contrôle de disponibilité PostgreSQL, sans lecture ni écriture métier)

Le backend refuse les requêtes non-GET, valide les paramètres, applique un délai maximal, relaie les erreurs du fournisseur et met en cache les réponses réussies côté edge. Il ne fabrique aucune donnée de secours et ne relaie que les champs nécessaires à l’affichage.

## Droits et limites du fournisseur
- La page officielle de licence autorise l’affichage dans une application ou un site avec attribution sur Free et un cache maximal de 24 h. La page de prix décrit toutefois Free comme une offre d’exploration et de side projects, tandis que Starter vise les produits fintech. Ukuaji reste donc limité à un Preview d’évaluation ; le déploiement commercial Production attend le choix/accord de plan.
- La redistribution des données brutes est interdite hors accord Institutional ; l’interface ne propose ni export de flux brut ni API publique de redistribution.
- L’offre gratuite est limitée à 100 requêtes/jour. La documentation annonce une cible de fraîcheur de 30 minutes pendant les séances ; l’interface compare aussi l’horodatage réel à cette cible et signale les observations anciennes. Les données de clôture restent distinguées des cotations intraday.
- L’historique quotidien OHLCV est réservé au plan Pro ou supérieur ; l’application ne l’appelle pas sur l’offre Standard.
- Le verrou `MANSA_PUBLIC_DISPLAY_AUTHORIZED` protège contre la diffusion publique accidentelle avant validation contractuelle.

## Neon
Le projet Neon `ukuaji` possède déjà les tables `venues`, `data_sources`, `source_reviews`, `feeds`, `instruments`, `market_observations`, `ingestion_jobs`, `ingestion_runs`, `ingestion_dead_letters` et `audit_events`. Le schéma contient notamment un contrôle explicite des droits de collecte, stockage, affichage et redistribution. Les 12 places déjà enregistrées sont encore au statut `DISCOVERED`; les sources, flux, instruments et observations ne sont pas encore initialisés.

Mansa API est enregistré comme source inactive pour l’ingestion, avec un statut `DISPLAY_ONLY` limité au Preview et une échéance de réexamen à 30 jours. Les secrets `MANSA_API_KEY` et `DATABASE_READONLY_URL` sont configurés côté serveur Vercel en Preview uniquement ; le rôle `ukuaji_preview_ro` dispose de SELECT sans INSERT. La connectivité est vérifiée par `/api/health`. Les droits de collecte, stockage et redistribution restent désactivés dans le registre de conformité. Aucune observation de marché Mansa n’est persistée dans Neon : les réponses sont servies par cache Vercel dans la fenêtre autorisée. La variable historique `DATABASE_URL` (compte propriétaire) est inutilisée et doit être supprimée manuellement des variables Preview.

## Tests
`npm test` exécute les tests de la fonction API : verrou de diffusion, clé serveur obligatoire, plan Pro pour l’historique, méthode HTTP, validation des paramètres, quota fournisseur, endpoints indices/variations, cache et filtrage des champs exposés.

## Développement local
Installer Vercel CLI, puis lancer `npm run dev`. Placer les variables dans `.env.local` (jamais commitées).
