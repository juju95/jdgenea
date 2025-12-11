# Analyse de l'import GEDCOM - JdGenea

## 1. Vue d'ensemble du problème

L'import GEDCOM actuel ne traite pas l'intégralité des données du fichier. L'analyse du fichier DAVIAUD_export.ged révèle de nombreuses données non importées.

## 2. Données actuellement importées

### Personnes (INDI)
- ✅ Nom et prénom (NAME)
- ✅ Sexe (SEX)
- ✅ Date de naissance (BIRT.DATE) - mais avec des erreurs de parsing
- ✅ Lieu de naissance (BIRT.PLAC)
- ✅ Date de décès (DEAT.DATE) - mais avec des erreurs de parsing
- ✅ Lieu de décès (DEAT.PLAC)

### Familles (FAM)
- ✅ Mari (HUSB)
- ✅ Femme (WIFE)
- ✅ Enfants (CHIL)

## 3. Données NON importées (à ajouter)

### Personnes (INDI)
- ❌ **Date et heure de naissance complète** (BIRT.TIME)
- ❌ **Date et heure de décès complète** (DEAT.TIME)
- ❌ **Profession** (OCCU) - partiellement importé mais pas stocké correctement
- ❌ **Notes** (NOTE)
- ❌ **Pièces jointes/Objets multimédia** (OBJE)
- ❌ **Coordonnées GPS des lieux** (BIRT.MAP.LATI/LONG)
- ❌ **Statut de l'enfant** (_FIL)
- ❌ **Date de création** (_CREA)
- ❌ **Date de modification** (CHAN)
- ❌ **Heure de création/modification** (_CREA.TIME, CHAN.TIME)

### Familles (FAM)
- ❌ **Date de mariage** (MARR.DATE) - champ existe mais non importé
- ❌ **Lieu de mariage** (MARR.PLAC) - champ existe mais non importé
- ❌ **Heure de mariage** (MARR.TIME)

### Sources (SOUR)
- ❌ **Sources** (SOUR) - entités complètes non importées
- ❌ **Références aux sources** (SOUR @S1@)

### Objets multimédia (OBJE)
- ❌ **Objets multimédia** (OBJE) - entités complètes non importées
- ❌ **Fichiers multimédia** (FILE)
- ❌ **Titres des médias** (TITL)

### Dépôts (REPO)
- ❌ **Dépôts** (REPO) - entités complètes non importées

## 4. Problèmes identifiés dans l'import actuel

### 4.1 Parsing des dates
Le parsing des dates est trop simpliste et ne gère pas :
- Les formats de dates variés (AAAAMMJJ, JJ MMM AAAA, etc.)
- Les dates partielles (année seulement)
- Les dates approximatives (ABT, EST, CAL)
- Les périodes (FROM/TO)

### 4.2 Structure de données
Certaines entités manquent dans la base de données :
- Table des sources (sources)
- Table des objets multimédia (media_objects)
- Table des dépôts (repositories)
- Table des notes (notes)

### 4.3 Relations manquantes
- Liens entre personnes et sources
- Liens entre personnes et objets multimédia
- Liens entre familles et sources
- Liens entre événements et sources

## 5. Structure GEDCOM complète identifiée

### 5.1 Entités principales
```
295 entités total dans le fichier DAVIAUD_export.ged:
- 253 INDI (individus)
- 129 FAM (familles)
- 15 OBJE (objets multimédia)
- 12 SOUR (sources)
- 0 REPO (dépôts - non présents dans ce fichier)
```

### 5.2 Exemple de structure complète
```
0 @I15@ INDI
1 NAME Joseph Célestin/BOURLET/
2 GIVN Joseph Célestin
2 SURN BOURLET
1 SEX M
1 OCCU Électronicien
1 _FIL LEGITIMATE_CHILD
1 _CREA
2 DATE 11 JUN 2025
3 TIME 14:32:00
1 CHAN
2 DATE 11 JUN 2025
3 TIME 16:23:24
1 FAMS @F9@
1 BIRT
2 DATE 23 APR 1886
3 TIME 08:00
2 PLAC Brusvily,22100,Côtes-d'Armor,Bretagne,FRANCE,
3 MAP
4 LATI N48.390660
4 LONG W-2.127840
2 _FNA NO
2 OBJE @O4@
3 _PRIM YES
1 DEAT
2 DATE 25 DEC 1944
2 PLAC Taden,22100,Côtes-d'Armor,Bretagne,FRANCE,
3 MAP
4 LATI N48.475300
4 LONG W-2.019460
2 _FNA NO
1 FAMC @F28@
```

## 6. Recommandations pour l'import complet

### 6.1 Ajout d'entités manquantes
1. Créer les tables pour sources, objets multimédia, notes, dépôts
2. Ajouter les champs manquants aux tables existantes
3. Créer des tables de liaison pour les relations many-to-many

### 6.2 Amélioration du parsing
1. Implémenter un parser de dates GEDCOM complet
2. Gérer les différents niveaux de structure (0, 1, 2, 3, 4)
3. Conserver l'ordre et la hiérarchie des données

### 6.3 Gestion des relations
1. Importer toutes les références croisées (@xxx@)
2. Créer les liens appropriés dans la base de données
3. Préserver les IDs GEDCOM d'origine pour la traçabilité

## 7. Priorité des améliorations

1. **HAUTE** : Dates et heures de naissance/mariage/décès
2. **HAUTE** : Notes et objets multimédia
3. **MOYENNE** : Sources et références
4. **MOYENNE** : Coordonnées GPS
5. **FAIBLE** : Dépôts et métadonnées avancées