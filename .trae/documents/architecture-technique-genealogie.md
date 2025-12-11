## 1. Architecture du système

```mermaid
graph TD
    A[Navigateur Utilisateur] --> B[Frontend React]
    B --> C[API Symfony 7]
    C --> D[MySQL Database]
    C --> E[Supabase Storage]
    C --> F[Swagger UI]
    
    subgraph "Couche Présentation"
        B
    end
    
    subgraph "Couche Application"
        C
        F
    end
    
    subgraph "Couche Données"
        D
        E
    end
```

## 2. Stack technique

- **Frontend** : React 18 + TypeScript + Vite
- **Backend** : Symfony 7.0 + PHP 8.2 + MySQL 8.0
- **Stockage** : Supabase (photos/documents), MySQL (données structurées)
- **Documentation API** : Swagger/OpenAPI 3.0
- **Authentification** : JWT (JSON Web Tokens)
- **ORM** : Doctrine 3.0
- **Validation** : Symfony Validator
- **Tests** : PHPUnit 10, Jest (frontend)

## 3. Routes de l'application

| Route | Description |
|-------|-------------|
| / | Page d'accueil publique |
| /register | Formulaire d'inscription |
| /login | Formulaire de connexion |
| /dashboard | Tableau de bord utilisateur |
| /tree/create | Création d'un nouvel arbre |
| /tree/{id}/edit | Éditeur d'arbre généalogique |
| /person/{id} | Fiche détaillée d'une personne |
| /import/gedcom | Import de fichier GEDCOM |
| /export/gedcom | Export au format GEDCOM |
| /profile | Profil et paramètres utilisateur |
| /api/doc | Documentation Swagger de l'API |

## 4. Définitions API

### 4.1 Authentification

```
POST /api/auth/register
```

**Requête:**
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| email | string | Oui | Email de l'utilisateur |
| password | string | Oui | Mot de passe (min 8 caractères) |
| firstName | string | Oui | Prénom |
| lastName | string | Oui | Nom de famille |

**Réponse:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "free"
  }
}
```

```
POST /api/auth/login
```

**Requête:**
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| email | string | Oui | Email de l'utilisateur |
| password | string | Oui | Mot de passe |

### 4.2 Gestion des arbres

```
GET /api/trees
```

**Réponse:**
```json
[
  {
    "id": "uuid",
    "name": "Arbre Familial Dupont",
    "description": "Arbre généalogique de la famille Dupont",
    "personCount": 45,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z"
  }
]
```

```
POST /api/trees
```

**Requête:**
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| name | string | Oui | Nom de l'arbre |
| description | string | Non | Description optionnelle |

### 4.3 Gestion des personnes

```
POST /api/persons
```

**Requête:**
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| treeId | string | Oui | ID de l'arbre |
| firstName | string | Oui | Prénom |
| lastName | string | Oui | Nom de famille |
| birthDate | string | Non | Date de naissance (ISO 8601) |
| deathDate | string | Non | Date de décès (ISO 8601) |
| gender | string | Non | 'M' ou 'F' |
| fatherId | string | Non | ID du père |
| motherId | string | Non | ID de la mère |

### 4.4 Import/Export GEDCOM

```
POST /api/gedcom/import
```

**Requête:** Form-data avec fichier .ged

**Réponse:**
```json
{
  "importId": "uuid",
  "status": "processing",
  "personsImported": 0,
  "familiesImported": 0,
  "errors": []
}
```

```
GET /api/gedcom/export/{treeId}
```

**Réponse:** Fichier .ged téléchargeable

## 5. Architecture serveur

```mermaid
graph TD
    A[Client HTTP] --> B[Controllers]
    B --> C[Services]
    C --> D[Repositories]
    D --> E[(MySQL)]
    C --> F[GedcomService]
    F --> G[GedcomParser]
    F --> H[GedcomGenerator]
    
    subgraph "Symfony Application"
        B
        C
        D
        F
        G
        H
    end
```

### 5.1 Structure des couches

**Controllers Layer** : Gestion des requêtes HTTP, validation des entrées, formatage des réponses
**Services Layer** : Logique métier, gestion des transactions, orchestration des opérations
**Repositories Layer** : Accès aux données, requêtes Doctrine, mapping entités
**GedcomService** : Traitement spécifique des fichiers GEDCOM (import/export)

## 6. Modèle de données

### 6.1 Schéma de la base de données

```mermaid
erDiagram
    USER ||--o{ TREE : creates
    USER ||--o{ PERSON : manages
    TREE ||--o{ PERSON : contains
    PERSON ||--o{ FAMILY : member_of
    FAMILY ||--o{ PERSON : parent_to
    PERSON ||--o{ MEDIA : has_media
    
    USER {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string role
        datetime created_at
        datetime updated_at
    }
    
    TREE {
        uuid id PK
        uuid user_id FK
        string name
        text description
        datetime created_at
        datetime updated_at
    }
    
    PERSON {
        uuid id PK
        uuid tree_id FK
        string first_name
        string last_name
        date birth_date
        date death_date
        string gender
        uuid father_id FK
        uuid mother_id FK
        datetime created_at
        datetime updated_at
    }
    
    FAMILY {
        uuid id PK
        uuid tree_id FK
        uuid husband_id FK
        uuid wife_id FK
        date marriage_date
        string marriage_place
    }
    
    MEDIA {
        uuid id PK
        uuid person_id FK
        string file_name
        string file_path
        string file_type
        datetime created_at
    }
```

### 6.2 Définitions SQL

**Table users:**
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'free' CHECK (role IN ('free', 'premium', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Table trees:**
```sql
CREATE TABLE trees (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Table persons:**
```sql
CREATE TABLE persons (
    id VARCHAR(36) PRIMARY KEY,
    tree_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    death_date DATE,
    gender VARCHAR(1) CHECK (gender IN ('M', 'F')),
    father_id VARCHAR(36),
    mother_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (father_id) REFERENCES persons(id) ON DELETE SET NULL,
    FOREIGN KEY (mother_id) REFERENCES persons(id) ON DELETE SET NULL,
    INDEX idx_tree_id (tree_id),
    INDEX idx_names (first_name, last_name),
    INDEX idx_dates (birth_date, death_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Table families:**
```sql
CREATE TABLE families (
    id VARCHAR(36) PRIMARY KEY,
    tree_id VARCHAR(36) NOT NULL,
    husband_id VARCHAR(36),
    wife_id VARCHAR(36),
    marriage_date DATE,
    marriage_place VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (husband_id) REFERENCES persons(id) ON DELETE SET NULL,
    FOREIGN KEY (wife_id) REFERENCES persons(id) ON DELETE SET NULL,
    INDEX idx_tree_id (tree_id),
    INDEX idx_spouses (husband_id, wife_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Table media:**
```sql
CREATE TABLE media (
    id VARCHAR(36) PRIMARY KEY,
    person_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    INDEX idx_person_id (person_id),
    INDEX idx_file_type (file_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6.3 Configuration Supabase

**Bucket pour le stockage des médias:**
```sql
-- Création du bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('genealogy-media', 'genealogy-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']);

-- Politiques de sécurité
CREATE POLICY "Les utilisateurs authentifiés peuvent uploader" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'genealogy-media' AND auth.uid() = owner);

CREATE POLICY "Les fichiers publics sont lisibles" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'genealogy-media');
```

## 7. Configuration de l'environnement

### 7.1 Variables d'environnement

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/genealogy"

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_EXPIRATION_TIME=3600

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# CORS
CORS_ALLOW_ORIGIN=http://localhost:3000

# Environment
APP_ENV=dev
APP_DEBUG=true
```

### 7.2 Scripts de déploiement

**Installation des dépendances:**
```bash
composer install
npm install
```

**Migrations de base de données:**
```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

**Génération des fixtures (données de test):**
```bash
php bin/console doctrine:fixtures:load
```

**Lancement du serveur de développement:**
```bash
symfony server:start
npm run dev
```