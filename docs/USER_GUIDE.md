# Guide Utilisateur - SMI Corporation CMS

Guide utilisateur complet pour le système de gestion de contenu SMI Corporation.

## Table des Matières

- [Démarrage](#getting-started)
- [Rôles Utilisateur et Permissions](#user-roles--permissions)
- [Navigation et Interface](#navigation--interface)
- [Gestion de Contenu](#content-management)
- [Éditeur BBCode](#bbcode-editor)
- [Gestion des Médias](#media-management)
- [Gestion des Utilisateurs](#user-management)
- [Administration](#administration)
- [Conseils et Bonnes Pratiques](#tips--best-practices)
- [Dépannage](#troubleshooting)

## Démarrage

### Vue d'Ensemble

Bienvenue dans le système de gestion de contenu SMI Corporation ! Ce CMS puissant vous permet de créer, gérer et publier du contenu avec des capacités de formatage BBCode avancées, une gestion d'utilisateurs complète et une gestion intuitive des médias.

### Accès au Système

1. **Accès au Site Web** : Naviguez vers l'URL du site web de votre organisation
2. **Connexion** : Cliquez sur le bouton "Connexion" ou allez à `/auth/login`
3. **Identifiants** : Utilisez le nom d'utilisateur/email et le mot de passe fournis par votre administrateur

### Première Connexion

1. Saisissez votre adresse email et votre mot de passe
2. Cliquez sur "Connexion" pour accéder au système
3. Vous serez redirigé vers le tableau de bord approprié selon votre rôle :
   - **Administrateurs** : Tableau de bord admin avec accès complet au système
   - **Éditeurs de Contenu** : Interface principale avec outils de gestion de contenu
   - **Utilisateurs Réguliers** : Interface utilisateur standard

### Profil Utilisateur

Accédez à votre profil en cliquant sur votre nom dans la navigation supérieure :
- Voir vos informations de compte
- Mettre à jour vos détails personnels
- Changer votre mot de passe
- Gérer vos préférences de notification

## Rôles Utilisateur et Permissions

### Hiérarchie des Rôles

Le système utilise un système de contrôle d'accès basé sur les rôles avec les rôles typiques suivants :

#### Administrateur
- **Accès complet au système** : Contrôle total sur toutes les fonctionnalités
- **Gestion des utilisateurs** : Créer, éditer et supprimer les comptes utilisateur
- **Gestion de contenu** : Créer, éditer et publier tout le contenu
- **Gestion des médias** : Télécharger, éditer et gérer tous les fichiers médias
- **Configuration système** : Accès aux paramètres et configuration du système

#### Éditeur de Contenu
- **Gestion de contenu** : Créer, éditer et publier du contenu
- **Gestion des médias** : Télécharger et gérer les fichiers médias
- **Accès utilisateur limité** : Voir les autres utilisateurs mais ne peut pas modifier les comptes

#### Créateur de Contenu
- **Création de contenu** : Créer et éditer du contenu (nécessite approbation pour publication)
- **Téléchargement de médias** : Télécharger des fichiers médias pour leur contenu
- **Gestion de profil** : Gérer uniquement leur propre profil

#### Visualiseur
- **Accès lecture** : Voir le contenu publié
- **Gestion de profil** : Gérer uniquement leur propre profil

### Système de Permissions

Le système utilise des permissions granulaires qui peuvent être personnalisées :
- `manage_users` : Gestion des comptes utilisateur
- `manage_roles` : Gestion des rôles et permissions
- `manage_pages` : Création et édition de pages
- `manage_media` : Gestion des fichiers médias
- `publish_content`: Ability to publish content
- `manage_audit`: Access to system audit logs

## Navigation & Interface

### Main Navigation

The top navigation bar provides access to key sections:

#### Public Area
- **Home**: Website homepage
- **Pages**: Browse published content
- **About**: Organization information
- **Contact**: Contact information

#### Authenticated Users
- **Dashboard**: Personal dashboard with recent activity
- **Profile**: User profile and settings
- **Logout**: Sign out of the system

#### Admin Access
- **Admin Panel**: Complete administration interface
- **User Management**: User and role administration
- **Content Management**: Page and media management
- **System Logs**: Audit trail and system monitoring

### Dashboard

Your dashboard provides an overview of:
- **Recent Activity**: Latest content changes and updates
- **Quick Actions**: Shortcuts to common tasks
- **Content Statistics**: Overview of your content contributions
- **Notifications**: System messages and alerts

### Theme & Appearance

The system supports both light and dark themes:
- **Automatic**: Follows your system preference
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Comfortable low-light viewing
- **Toggle**: Use the theme switcher in the navigation

## Content Management

### Understanding Pages

The CMS organizes content into hierarchical pages:
- **Root Pages**: Top-level pages (e.g., "About", "Services")
- **Sub-pages**: Child pages under parent pages
- **Nested Structure**: Up to 3 levels of hierarchy
- **Slug System**: User-friendly URLs based on page titles

### Creating Content

#### Step 1: Access Page Management
1. Navigate to the Admin panel
2. Click "Page Management" or "Content"
3. Click "Create New Page"

#### Step 2: Page Details
- **Title**: Enter a descriptive page title
- **Slug**: Auto-generated URL-friendly version (editable)
- **Parent Page**: Select a parent for hierarchical organization
- **Status**: Choose "Draft" for unpublished or "Published" for live content

#### Step 3: Content Creation
- Use the advanced BBCode editor to create rich content
- Add images, formatting, and interactive elements
- Preview your content before saving

#### Step 4: Publishing
- Save as "Draft" for later editing
- Change status to "Published" when ready to go live
- Content is immediately available to users when published

### Editing Existing Content

1. **Find Content**: Use the page management interface to locate content
2. **Edit Mode**: Click the "Edit" button on any page
3. **Make Changes**: Modify title, content, or settings
4. **Save Changes**: Save as draft or publish immediately
5. **Version Control**: The system maintains change history

### Content Organization

#### Hierarchical Structure
```
Home Page
├── About Us
│   ├── Our Mission
│   ├── Team Members
│   └── Company History
├── Services
│   ├── Web Development
│   ├── Consulting
│   └── Support
└── Contact
    ├── Office Locations
    └── Contact Form
```

#### URL Structure
- Root page: `/about-us`
- Sub-page: `/about-us/our-mission`
- Deep page: `/services/web-development/portfolio`

### Content Status Management

#### Draft Status
- **Not visible** to public users
- **Editable** by content creators
- **Reviewable** by editors and administrators
- **Preserves** work in progress

#### Published Status
- **Visible** to all appropriate users
- **Live** on the website immediately
- **Searchable** and accessible via navigation
- **Cached** for optimal performance

## BBCode Editor

### Editor Interface

The BBCode editor provides a rich text editing experience with:
- **WYSIWYG Preview**: See how content will appear
- **BBCode Source**: View and edit raw BBCode
- **Toolbar**: Quick access to formatting options
- **Live Preview**: Real-time rendering of BBCode

### Basic Formatting

#### Text Formatting
```bbcode
[b]Bold text[/b]
[i]Italic text[/i]
[u]Underlined text[/u]
[s]Strikethrough text[/s]
```

#### Headings
```bbcode
[h1]Main Heading[/h1]
[h2]Sub Heading[/h2]
[h3]Section Heading[/h3]
```

#### Colors and Styles
```bbcode
[color=red]Red text[/color]
[size=18]Large text[/size]
[font=Arial]Arial font[/font]
```

### Lists and Structure

#### Unordered Lists
```bbcode
[list]
[*]First item
[*]Second item
[*]Third item
[/list]
```

#### Ordered Lists
```bbcode
[list=1]
[*]First step
[*]Second step
[*]Third step
[/list]
```

#### Definition Lists
```bbcode
[list=definition]
[*]Term: Definition of the term
[*]Another Term: Another definition
[/list]
```

### Advanced Features

#### Links
```bbcode
[url=https://example.com]Link text[/url]
[url]https://example.com[/url]
```

#### Images
```bbcode
[img]image-url.jpg[/img]
[img width=300 height=200]image-url.jpg[/img]
```

#### Quotes
```bbcode
[quote]Simple quote text[/quote]
[quote author="John Doe"]Quote with attribution[/quote]
```

#### Code Blocks
```bbcode
[code]
function example() {
    console.log("Hello World");
}
[/code]

[code lang="javascript"]
const greeting = "Hello World";
[/code]
```

### Custom BBCode Tags

The system includes custom BBCode tags for enhanced functionality:

#### Alert Boxes
```bbcode
[alert type="info"]Information message[/alert]
[alert type="warning"]Warning message[/alert]
[alert type="error"]Error message[/alert]
[alert type="success"]Success message[/alert]
```

#### Columns
```bbcode
[columns]
[column]Left column content[/column]
[column]Right column content[/column]
[/columns]
```

#### Tabs
```bbcode
[tabs]
[tab title="Tab 1"]Content for tab 1[/tab]
[tab title="Tab 2"]Content for tab 2[/tab]
[/tabs]
```

#### Spoilers
```bbcode
[spoiler]Hidden content revealed on click[/spoiler]
[spoiler title="Click to reveal"]Content with custom button text[/spoiler]
```

### Editor Tips

1. **Live Preview**: Always check the preview before publishing
2. **Copy BBCode**: Use the source view to copy formatted content
3. **Nested Tags**: BBCode tags can be nested for complex formatting
4. **Keyboard Shortcuts**: Use Ctrl+B for bold, Ctrl+I for italic
5. **Auto-save**: Content is automatically saved as you type

## Media Management

### Accessing Media Library

1. Navigate to Admin Panel
2. Click "Media Management" or "Images"
3. View the gallery of uploaded files

### Uploading Images

#### Single File Upload
1. Click "Upload Image" button
2. Select file from your computer
3. Add title, description, and alt text
4. Click "Upload" to process

#### Bulk Upload
1. Use the drag-and-drop interface
2. Select multiple files at once
3. Add metadata for each file
4. Upload all files simultaneously

#### Supported Formats
- **JPEG**: High-quality photos and images
- **PNG**: Images with transparency
- **GIF**: Animated images and simple graphics
- **WebP**: Modern, optimized format
- **SVG**: Vector graphics and icons

### Image Management

#### Image Information
- **File Details**: Name, size, format, dimensions
- **Metadata**: Title, description, alt text for accessibility
- **Upload Info**: Date uploaded, uploaded by user
- **Usage**: Where the image is currently used

#### Image Editing
- **Crop Tool**: Adjust image dimensions and aspect ratio
- **Variants**: Automatic generation of different sizes
- **Metadata Update**: Change title, description, and alt text
- **Replace**: Upload a new version while keeping the same URL

#### Image Variants
The system automatically creates multiple sizes:
- **Thumbnail**: 150x150px for previews
- **Small**: 400x300px for content embedding
- **Medium**: 800x600px for standard display
- **Large**: 1200x900px for high-resolution needs

### Using Images in Content

#### Direct Insertion
1. Place cursor in BBCode editor where you want the image
2. Click "Insert Image" button
3. Select from media library
4. Choose appropriate size variant
5. Add caption if desired

#### BBCode Method
```bbcode
[img]path/to/image.jpg[/img]
[img width=500]path/to/image.jpg[/img]
```

#### Gallery Creation
```bbcode
[gallery]
[img]image1.jpg[/img]
[img]image2.jpg[/img]
[img]image3.jpg[/img]
[/gallery]
```

### Media Organization

#### Search and Filter
- **Search**: Find images by filename, title, or description
- **Date Filter**: Filter by upload date (today, week, month, year)
- **Format Filter**: Filter by file type
- **User Filter**: Filter by who uploaded the file

#### Storage Management
- **Storage Stats**: View total storage usage
- **File Cleanup**: Remove unused or duplicate files
- **Optimization**: Automatic compression and format conversion

## User Management

*Note: User management features are only available to administrators and users with appropriate permissions.*

### User Overview

The user management system allows authorized personnel to:
- Create and manage user accounts
- Assign roles and permissions
- Monitor user activity
- Handle account-related issues

### Creating User Accounts

#### Account Creation Process
1. Navigate to Admin Panel → User Management
2. Click "Create New User"
3. Fill in required information:
   - **Name**: Full name of the user
   - **Username**: Unique username for login
   - **Email**: Valid email address (must be unique)
   - **Password**: Secure password (system enforced strength)
   - **Role**: Assign appropriate role for the user

#### User Information Fields
- **Personal Details**: Name, email, contact information
- **Account Settings**: Username, password, account status
- **Role Assignment**: Primary role and additional permissions
- **Profile Options**: Avatar, bio, preferences

### Managing Existing Users

#### User List View
- **Search**: Find users by name, email, or username
- **Filter**: Filter by role, status, or registration date
- **Sort**: Sort by various criteria (name, join date, last activity)
- **Bulk Actions**: Perform actions on multiple users

#### Individual User Management
- **View Profile**: See complete user information
- **Edit Details**: Update personal and account information
- **Change Role**: Modify user permissions and access level
- **Account Status**: Activate, deactivate, or suspend accounts
- **Password Reset**: Force password change or reset

### Role Management

#### Creating Roles
1. Navigate to Roles & Permissions
2. Click "Create New Role"
3. Enter role name and description
4. Assign specific permissions
5. Save the new role

#### Permission Assignment
- **Individual Permissions**: Grant specific capabilities
- **Role-based Permissions**: Assign pre-configured permission sets
- **Inheritance**: Roles can inherit permissions from other roles
- **Custom Combinations**: Create unique permission combinations

#### Common Role Configurations

**Content Manager Role**:
- `manage_pages`: Create and edit pages
- `manage_media`: Upload and manage media
- `publish_content`: Publish content directly

**Reviewer Role**:
- `view_drafts`: Review unpublished content
- `edit_pages`: Edit content created by others
- `moderate_content`: Approve content for publication

**Limited Editor Role**:
- `create_pages`: Create new content
- `edit_own_pages`: Edit only their own content
- `upload_media`: Upload media files

### User Activity Monitoring

#### Activity Logs
- **Login History**: Track user login/logout times
- **Content Changes**: Monitor page creation and edits
- **Media Activity**: Track file uploads and modifications
- **Permission Usage**: See when users access restricted features

#### User Statistics
- **Content Contributions**: Number of pages created/edited
- **Media Uploads**: Files uploaded and storage used
- **Activity Timeline**: Recent actions and system usage
- **Access Patterns**: Login frequency and session duration

## Administration

*Note: Administrative features require administrator role or specific permissions.*

### System Overview

The administration panel provides complete control over the CMS:
- **Dashboard**: System health and usage statistics
- **Content Management**: Oversee all content and pages
- **User Administration**: Manage users, roles, and permissions
- **Media Management**: Control file uploads and storage
- **System Settings**: Configure system behavior and features

### Content Administration

#### Content Overview
- **All Pages**: View all content regardless of author
- **Status Management**: Change publication status for any content
- **Bulk Operations**: Perform actions on multiple pages
- **Content Statistics**: Usage metrics and performance data

#### Page Management
- **Hierarchical View**: See complete page structure
- **Bulk Editing**: Edit multiple pages simultaneously
- **Mass Publishing**: Publish or unpublish multiple pages
- **Content Migration**: Move or restructure content

#### Content Moderation
- **Review Queue**: Content awaiting approval
- **Approval Workflow**: Review and approve user submissions
- **Quality Control**: Ensure content meets standards
- **Version History**: Track changes and reversions

### User Administration

#### User Overview Dashboard
- **User Statistics**: Total users, active users, new registrations
- **Role Distribution**: Number of users per role
- **Activity Metrics**: User engagement and system usage
- **Account Status**: Active, inactive, and suspended accounts

#### Bulk User Operations
- **Mass Role Assignment**: Change roles for multiple users
- **Account Actions**: Activate, deactivate, or delete multiple accounts
- **Communication**: Send messages or notifications to user groups
- **Export Data**: Generate user reports and statistics

#### Security Management
- **Session Management**: View and manage active user sessions
- **Login Monitoring**: Track failed login attempts and security events
- **Password Policies**: Enforce password strength requirements
- **Account Lockouts**: Manage temporarily locked accounts

### System Configuration

#### General Settings
- **Site Information**: Organization name, description, contact details
- **Default Permissions**: Set default roles for new users
- **Content Policies**: Publishing workflows and approval processes
- **Media Settings**: File size limits, allowed formats, storage options

#### Security Configuration
- **Authentication**: Login requirements and session management
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: Control request frequency and abuse prevention
- **Audit Logging**: System activity tracking and compliance

#### Performance Settings
- **Caching**: Content and asset caching configuration
- **Image Processing**: Automatic optimization and variant generation
- **Database**: Query optimization and performance tuning
- **CDN Integration**: Content delivery network configuration

### Audit and Monitoring

#### System Logs
- **User Actions**: Track all user activities and changes
- **Content Changes**: Monitor page creation, editing, and publishing
- **Security Events**: Login attempts, permission changes, and alerts
- **System Health**: Performance metrics and error tracking

#### Audit Trail
- **Change History**: Complete record of system modifications
- **User Attribution**: Track who made what changes when
- **Data Integrity**: Ensure accuracy and prevent unauthorized changes
- **Compliance**: Meet regulatory and organizational requirements

#### Reporting
- **Usage Reports**: System usage statistics and trends
- **User Activity**: Individual and aggregate user behavior
- **Content Analytics**: Page views, engagement, and performance
- **Security Reports**: Failed logins, suspicious activity, and threats

## Tips & Best Practices

### Content Creation Best Practices

#### Planning Your Content
1. **Outline Structure**: Plan your page hierarchy before creating content
2. **Consistent Naming**: Use clear, descriptive page titles and slugs
3. **SEO Considerations**: Include relevant keywords in titles and content
4. **User Experience**: Design content with your audience in mind

#### Writing Effective Content
1. **Clear Headlines**: Use descriptive headings that summarize content
2. **Scannable Text**: Break up long text with headings and lists
3. **Active Voice**: Write in active voice for clarity and engagement
4. **Call to Action**: Include clear next steps for readers

#### BBCode Best Practices
1. **Semantic Markup**: Use appropriate tags for content meaning
2. **Consistent Formatting**: Maintain consistent style throughout
3. **Mobile Friendly**: Ensure content displays well on all devices
4. **Accessibility**: Use alt text for images and descriptive link text

### Media Management Best Practices

#### Image Optimization
1. **Appropriate Formats**: Use JPEG for photos, PNG for graphics with transparency
2. **File Sizes**: Optimize images before upload to reduce load times
3. **Descriptive Names**: Use meaningful filenames for better organization
4. **Alt Text**: Always provide descriptive alt text for accessibility

#### Organization
1. **Naming Conventions**: Establish consistent file naming patterns
2. **Regular Cleanup**: Remove unused files to save storage space
3. **Backup Strategy**: Regularly backup important media files
4. **Version Control**: Keep track of different versions of images

### User Management Best Practices

#### Account Security
1. **Strong Passwords**: Enforce strong password requirements
2. **Regular Reviews**: Periodically review user accounts and permissions
3. **Principle of Least Privilege**: Grant minimum necessary permissions
4. **Account Cleanup**: Remove inactive or unnecessary accounts

#### Role Management
1. **Clear Definitions**: Define roles clearly with specific responsibilities
2. **Regular Audits**: Review role assignments and permissions
3. **Documentation**: Maintain documentation of role purposes and permissions
4. **Training**: Ensure users understand their roles and capabilities

### Performance Optimization

#### Content Performance
1. **Image Optimization**: Use appropriate image sizes and formats
2. **Content Length**: Balance comprehensive content with page load speed
3. **Hierarchical Structure**: Organize content logically for easy navigation
4. **Regular Updates**: Keep content fresh and relevant

#### System Performance
1. **Regular Maintenance**: Perform routine system maintenance tasks
2. **Monitor Usage**: Track system performance and user activity
3. **Capacity Planning**: Plan for growth in users and content
4. **Update Management**: Keep system components up to date

## Troubleshooting

### Common Issues and Solutions

#### Login Problems

**Issue**: Cannot log in to the system
**Solutions**:
1. **Check Credentials**: Verify username/email and password are correct
2. **Password Reset**: Use the "Forgot Password" feature if available
3. **Account Status**: Contact administrator to verify account is active
4. **Browser Issues**: Clear browser cache and cookies
5. **Network Problems**: Check internet connection and try again

**Issue**: Session expires frequently
**Solutions**:
1. **Browser Settings**: Check if cookies are enabled
2. **Security Software**: Temporarily disable ad blockers or security extensions
3. **Network Stability**: Ensure stable internet connection
4. **Contact Support**: Report frequent session timeouts to administrators

#### Content Editing Issues

**Issue**: BBCode not rendering correctly
**Solutions**:
1. **Syntax Check**: Verify BBCode tags are properly formatted and closed
2. **Nested Tags**: Check for proper nesting of BBCode elements
3. **Preview Mode**: Use the preview function to test formatting
4. **Character Encoding**: Ensure special characters are properly encoded
5. **Cache Refresh**: Refresh the page or clear browser cache

**Issue**: Cannot save content changes
**Solutions**:
1. **Session Timeout**: Log out and log back in to refresh session
2. **Permissions**: Verify you have permission to edit the content
3. **Content Length**: Check if content exceeds maximum allowed length
4. **Network Issues**: Ensure stable internet connection during save
5. **Browser Compatibility**: Try a different browser

#### Media Upload Problems

**Issue**: Image upload fails
**Solutions**:
1. **File Size**: Check file is under the maximum size limit (typically 10MB)
2. **File Format**: Ensure file is in supported format (JPEG, PNG, GIF, WebP, SVG)
3. **File Name**: Use simple filenames without special characters
4. **Browser Permissions**: Allow the website to access local files
5. **Network Connection**: Verify stable internet connection

**Issue**: Images not displaying correctly
**Solutions**:
1. **File Path**: Check that image URLs are correct and accessible
2. **File Permissions**: Verify uploaded files have correct permissions
3. **Cache Issues**: Clear browser cache and refresh the page
4. **CDN Problems**: Contact administrator if using content delivery network
5. **Format Compatibility**: Ensure browser supports the image format

#### Permission and Access Issues

**Issue**: Cannot access certain features
**Solutions**:
1. **Role Verification**: Check your assigned role and permissions with administrator
2. **Session Refresh**: Log out and log back in to refresh permissions
3. **Browser Cache**: Clear browser cache and cookies
4. **Permission Changes**: Wait for permission changes to take effect
5. **Contact Administrator**: Request access to specific features if needed

**Issue**: Features missing from interface
**Solutions**:
1. **Role Limitations**: Verify your role includes access to missing features
2. **Browser Compatibility**: Try accessing with a different browser
3. **JavaScript Disabled**: Ensure JavaScript is enabled in browser
4. **Screen Resolution**: Check if interface elements are hidden due to screen size
5. **System Updates**: Contact administrator about recent system changes

### Getting Help

#### Self-Service Resources
1. **Documentation**: Refer to this user guide and related documentation
2. **FAQ Section**: Check frequently asked questions if available
3. **System Help**: Look for help buttons or tooltips within the interface
4. **Community Forums**: Participate in user community discussions if available

#### Contacting Support
1. **Administrator Contact**: Reach out to your system administrator
2. **Help Desk**: Use internal help desk or support ticketing system
3. **Email Support**: Send detailed descriptions of issues via email
4. **Phone Support**: Call support number if provided by your organization

#### Reporting Issues
When reporting problems, include:
1. **Detailed Description**: Explain what you were trying to do and what happened
2. **Steps to Reproduce**: List the exact steps that led to the problem
3. **Error Messages**: Include any error messages or codes displayed
4. **Browser Information**: Specify browser type and version
5. **Screenshots**: Attach screenshots if helpful for understanding the issue

#### Emergency Procedures
For critical issues:
1. **Document the Problem**: Take screenshots and note exact error messages
2. **Immediate Contact**: Contact system administrator immediately
3. **Workaround**: Ask about temporary solutions while issue is resolved
4. **Escalation**: Understand escalation procedures for urgent issues
5. **Business Continuity**: Know alternative procedures for critical tasks

This user guide provides comprehensive information for effectively using the SMI Corporation CMS. For technical details and development information, refer to the [Developer Guide](DEVELOPER_GUIDE.md) and [API Reference](API_REFERENCE.md).