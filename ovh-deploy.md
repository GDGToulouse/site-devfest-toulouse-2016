# Déploiement sur hébergement mutualisé OVH

Ce guide explique comment déployer le site DevFest Toulouse 2016 sur un hébergement web mutualisé OVH avec Apache.

## Prérequis

- Hébergement mutualisé OVH (Pro ou Performance recommandé pour SSH)
- Accès FTP ou SSH à l'hébergement
- Node.js >= 4.0 installé localement
- Nom de domaine `devfesttoulouse.fr` configuré chez OVH

## Étape 1 : Build du projet

```bash
# Installer les dépendances
npm install
bower install

# Initialiser (télécharge fonts Google et analytics.js)
gulp init

# Build de production
gulp
```

Le build génère les fichiers optimisés dans le dossier **`dist/`**.

## Étape 2 : Configuration DNS

Dans l'espace client OVH > **Domaines** > `devfesttoulouse.fr` > **Zone DNS**, ajoutez :

| Type  | Sous-domaine   | Cible                              |
|-------|----------------|------------------------------------|
| A     | 2016           | IP de votre hébergement            |
| A     | test.2016      | IP de votre hébergement            |

Ou en CNAME :

| Type   | Sous-domaine   | Cible                              |
|--------|----------------|------------------------------------|
| CNAME  | 2016           | `votre-site.hosting.ovh.net.`      |
| CNAME  | test.2016      | `votre-site.hosting.ovh.net.`      |

> **Note** : L'IP de votre hébergement se trouve dans l'espace client OVH > Hébergement > Informations générales.

## Étape 3 : Configuration Multisite OVH

Dans l'espace client OVH > **Hébergement** > **Multisite** :

1. Cliquez sur **Ajouter un domaine ou sous-domaine**
2. Configurez `2016.devfesttoulouse.fr` :
   - Dossier racine : `2016/`
   - Cochez **SSL** (Let's Encrypt gratuit)
3. Configurez `test.2016.devfesttoulouse.fr` :
   - Dossier racine : `test-2016/` (environnement de test séparé)
   - Ou `2016/` (si même contenu que production)
   - Cochez **SSL**

## Étape 4 : Upload des fichiers

### Option A : Via FTP (FileZilla, Cyberduck, etc.)

1. Connectez-vous avec vos identifiants FTP OVH
2. Créez le dossier `/www/2016/`
3. Uploadez le **contenu** du dossier `dist/` dans `/www/2016/`

### Option B : Via SSH (hébergement Pro/Performance)

```bash
# Connexion SSH
ssh votre-login@ftp.cluster0XX.hosting.ovh.net

# Ou déploiement direct avec rsync
rsync -avz --delete dist/ votre-login@ftp.cluster0XX.hosting.ovh.net:/home/votre-login/www/2016/
```

### Option C : Via Gulp (configuration SSH)

Modifiez `config.js` :

```javascript
deploy: {
  hosting: 'ssh',  // Changer de 'firebase' à 'ssh'
  ssh: {
    env: {
      development: '/home/votre-login/www/test-2016',
      staging:     '/home/votre-login/www/test-2016',
      production:  '/home/votre-login/www/2016'
    },
    host: 'ftp.cluster0XX.hosting.ovh.net',  // Votre cluster OVH
    port: 22,
    user: 'votre-login'
  }
}
```

Puis déployez :

```bash
gulp deploy:dev   # Vers test-2016
gulp deploy:prod  # Vers 2016
```

## Étape 5 : Configuration Apache (.htaccess)

Créez le fichier `.htaccess` à la racine du dossier déployé (`/www/2016/.htaccess`) :

```apache
# ============================================
# Configuration Apache pour DevFest Toulouse
# ============================================

# Activation du moteur de réécriture
RewriteEngine On

# --------------------------------------------
# HTTPS : Forcer la connexion sécurisée
# (nécessaire pour le Service Worker)
# --------------------------------------------
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# --------------------------------------------
# SPA Routing : Redirection vers index.html
# Toutes les routes sont gérées côté client
# --------------------------------------------
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L,QSA]

# --------------------------------------------
# Compression GZIP
# --------------------------------------------
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
    AddOutputFilterByType DEFLATE application/xml application/xhtml+xml
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# --------------------------------------------
# Cache des assets statiques
# --------------------------------------------
<IfModule mod_expires.c>
    ExpiresActive On

    # Images (cache long - 1 an)
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"

    # CSS et JavaScript (cache long - 1 an)
    # Les fichiers sont versionnés par le build
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"

    # Fonts (cache long - 1 an)
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"

    # HTML (cache court pour les mises à jour)
    ExpiresByType text/html "access plus 10 minutes"

    # JSON - données dynamiques (cache court)
    ExpiresByType application/json "access plus 10 minutes"

    # Manifest PWA
    ExpiresByType application/manifest+json "access plus 1 hour"
</IfModule>

# --------------------------------------------
# Types MIME
# --------------------------------------------
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType text/css .css
    AddType application/json .json
    AddType font/woff .woff
    AddType font/woff2 .woff2
    AddType application/manifest+json .webmanifest
    AddType image/svg+xml .svg
</IfModule>

# --------------------------------------------
# En-têtes de sécurité
# --------------------------------------------
<IfModule mod_headers.c>
    # Empêcher le sniffing MIME
    Header set X-Content-Type-Options "nosniff"

    # Protection contre le clickjacking
    Header set X-Frame-Options "SAMEORIGIN"

    # Protection XSS
    Header set X-XSS-Protection "1; mode=block"

    # Referrer Policy
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# --------------------------------------------
# Interdire l'accès aux fichiers sensibles
# --------------------------------------------
<FilesMatch "(^\.htaccess|\.git|\.env|\.bowerrc)">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

## Structure finale sur l'hébergement

```
/home/votre-login/www/
│
├── 2016/                              # Production : 2016.devfesttoulouse.fr
│   ├── .htaccess                      # Configuration Apache
│   ├── index.html                     # Point d'entrée
│   ├── 404.html
│   ├── manifest.json                  # PWA manifest
│   ├── robots.txt
│   ├── cache-config.json
│   ├── bower_components/              # Dépendances Polymer
│   ├── elements/                      # Web Components
│   ├── data/                          # Données JSON (speakers, sessions...)
│   ├── images/                        # Images optimisées
│   ├── posts/                         # Articles de blog
│   ├── scripts/                       # JavaScript
│   └── themes/                        # CSS et fonts
│
└── test-2016/                         # Test : test.2016.devfesttoulouse.fr
    └── (même structure)
```

## Vérifications post-déploiement

### 1. Tester les URLs

- [ ] https://2016.devfesttoulouse.fr
- [ ] https://test.2016.devfesttoulouse.fr
- [ ] Redirection HTTP → HTTPS fonctionne
- [ ] Les routes SPA fonctionnent (ex: `/speakers`, `/schedule`)

### 2. Tester le Service Worker

Le Service Worker nécessite HTTPS. Vérifiez dans les DevTools du navigateur :
- Application > Service Workers : doit être "activated"
- Application > Cache Storage : doit contenir les assets

### 3. Tester les performances

```bash
# Depuis le projet local
gulp pagespeed
```

Ou utilisez [PageSpeed Insights](https://pagespeed.web.dev/) directement.

## Dépannage

### Erreur 500

- Vérifiez que le fichier `.htaccess` est bien encodé en UTF-8 sans BOM
- Vérifiez les logs d'erreur dans l'espace client OVH

### Pages blanches ou erreurs 404

- Vérifiez que `mod_rewrite` est activé (actif par défaut sur OVH)
- Vérifiez que le fichier `index.html` existe à la racine

### Service Worker ne fonctionne pas

- Le site doit être en HTTPS
- Vérifiez que `cache-config.json` est présent
- Videz le cache du navigateur

### Problèmes de cache

Pour forcer le rechargement après une mise à jour :
- Les assets CSS/JS sont versionnés automatiquement par le build
- Pour le HTML, attendez 10 minutes ou videz le cache

## Mise à jour du site

```bash
# 1. Faire les modifications dans app/

# 2. Rebuild
gulp

# 3. Redéployer
rsync -avz --delete dist/ votre-login@ftp.cluster0XX.hosting.ovh.net:/home/votre-login/www/2016/

# Ou avec gulp si configuré
gulp deploy:prod
```

## Notes importantes

1. **SSL/HTTPS** : Indispensable pour le Service Worker et les PWA
2. **Cluster OVH** : Remplacez `cluster0XX` par votre vrai numéro de cluster
3. **Propagation DNS** : Peut prendre jusqu'à 24-48h
4. **Cache navigateur** : Après un déploiement, les utilisateurs peuvent voir l'ancienne version pendant quelques minutes
