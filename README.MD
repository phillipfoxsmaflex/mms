<div align="center">
  <h1>MMS</h1>
  <p><strong>Maintenance Management System</strong></p>
  <p>A powerful, self-hosted maintenance management system for web</p>
  
  [![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
  [![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
  [![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
  [![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.6.7-6DB33F?logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

**Atlas CMMS** is a comprehensive, self-hosted Computerized Maintenance Management System (CMMS) designed to simplify and automate maintenance operations across multiple industries. Built with modern technologies and containerized with Docker, it provides enterprise-grade features while remaining easy to deploy and maintain.

Think of it as **Jira for technicians** – a complete solution for managing work orders, assets, inventory, preventive maintenance, and analytics.

### 🏢 Target Industries

Atlas CMMS is versatile and suitable for various industries:

- **Facilities Management** - Buildings, property, real estate maintenance
- **Manufacturing** - Production machinery and equipment tracking
- **Healthcare** - Medical equipment maintenance and compliance
- **Hospitality** - Hotels, resorts, and venue management
- **Public Sector** - Infrastructure and public building maintenance
- **Education** - Campus and facility maintenance
- **Utilities** - Power, water, and energy system management
- **Transportation** - Fleet and vehicle maintenance

### 🌟 Why MMS?

- ✅ **Self-Hosted** - Full control over your data and infrastructure
- ✅ **Open Source** - Transparent, customizable, and community-driven
- ✅ **Docker-Based** - Easy deployment and scalability
- ✅ **Enterprise-Ready** - Role-based access, SSO, audit trails
- ✅ **Feature-Rich** - Comprehensive CMMS functionality out-of-the-box

---

## ⚡ Features

### 📝 Work Orders & Maintenance

- **Work Order Management** - Create, assign, track, and complete work orders
- **Time Logging** - Track labor hours and costs per work order
- **Priority Management** - Set and manage work order priorities
- **Work Order History** - Complete audit trail and history tracking
- **Automated Work Orders** - Create work orders automatically based on triggers
- **Preventive Maintenance** - Schedule recurring maintenance tasks
- **Work Order Templates** - Standardize common maintenance procedures

### 📊 Analytics & Reporting

- **Work Order Analytics** - Compliance, completion rates, and performance metrics
- **Cost Analysis** - Track maintenance costs and budget allocation
- **Equipment Downtime** - Monitor asset availability and reliability
- **Labor Tracking** - Analyze technician productivity and workload
- **Cost Trends** - Historical cost analysis and forecasting
- **Custom Reports** - Export data in multiple formats (PDF, Excel, CSV)
- **Dashboard** - Real-time KPIs and metrics visualization

### ⚙️ Asset & Equipment Management

- **Asset Registry** - Complete asset inventory with detailed specifications
- **Asset Hierarchy** - Organize assets by location, department, or category
- **Downtime Tracking** - Monitor equipment availability and MTBF/MTTR
- **Maintenance History** - Complete service history per asset
- **Maintenance Costs** - Track costs per asset over time
- **Asset Documentation** - Attach manuals, warranties, and specifications
- **QR Code Integration** - Mobile-friendly asset identification

### 📦 Inventory & Parts Management

- **Parts Inventory** - Track spare parts and consumables
- **Stock Alerts** - Low stock notifications and reorder points
- **Multi-Location Support** - Manage inventory across multiple warehouses
- **Parts Usage Tracking** - Link parts consumption to work orders
- **Purchase Orders** - Create and manage purchase orders
- **Vendor Management** - Track suppliers and vendor information
- **Approval Workflows** - Multi-level purchase approval process

### 👥 Team & User Management

- **Role-Based Access Control** - Customizable user roles and permissions
- **Team Management** - Organize users into teams and departments
- **Service Providers** - Manage external contractors and vendors
- **User Activity Tracking** - Audit logs and activity monitoring
- **SSO Integration** - Single Sign-On with OAuth2 providers
- **Multi-Tenancy** - Support for multiple organizations

### 🔄 Workflow & Automation

- **Workflow Engine** - Define custom workflows with automation logic
- **Trigger-Based Actions** - Automate tasks based on conditions
- **Email Notifications** - Automated alerts and reminders
- **Custom Fields** - Extend functionality with custom data fields
- **API Integration** - REST API for third-party integrations
- **Webhooks** - Real-time event notifications

### 📍 Location Management

- **Location Hierarchy** - Organize assets by location and sub-location
- **Google Maps Integration** - Visual location mapping
- **Multi-Site Support** - Manage multiple facilities or locations
- **Location-Based Assignment** - Assign work orders by location

### 📑 Request Management

- **Service Requests** - Allow users to submit maintenance requests
- **Request Portal** - Self-service portal for end users
- **Request Approval** - Approval workflow for maintenance requests
- **Request Tracking** - Track request status from submission to completion


---

## 🏗️ Architecture

MMS follows a modern microservices architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Web Frontend (React)  │  Mobile App (React Native)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway / Backend                    │
├─────────────────────────────────────────────────────────────┤
│              Spring Boot REST API (Java 17)                  │
│  • Authentication & Authorization (JWT)                      │
│  • Business Logic & Services                                 │
│  • Data Validation & Mapping                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
    ┌───────────────┐  ┌──────────┐  ┌──────────┐
    │   PostgreSQL  │  │  MinIO   │  │  SMTP    │
    │   Database    │  │  Storage │  │  Server  │
    └───────────────┘  └──────────┘  └──────────┘
```

### Technology Stack

#### Backend (API)
- **Framework**: Spring Boot 2.6.7
- **Language**: Java 17
- **Database**: PostgreSQL 16
- **ORM**: Spring Data JPA + Hibernate
- **Security**: Spring Security + JWT
- **Database Migration**: Liquibase 4.22.0
- **Documentation**: Swagger/OpenAPI
- **Object Storage**: MinIO / Google Cloud Storage
- **Email**: Spring Mail with SMTP

#### Frontend (Web)
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Data Grid**: MUI X Data Grid Pro
- **Charts**: ApexCharts
- **HTTP Client**: Axios
- **Maps**: Leaflet + Google Maps API
- **Build Tool**: Vite

#### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL 16 Alpine
- **Object Storage**: MinIO (S3-compatible)

---

## 🚀 Installation

### Prerequisites

Before installing Atlas CMMS, ensure you have:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for cloning the repository)
- At least **4GB RAM** and **20GB disk space**

### Quick Start (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/phillipfoxsmaflex/mms.git
   cd mms
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   nano .env  # Edit configuration
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **Access the application**:
   - Frontend: http://localhost:12000
   - Backend API: http://localhost:12001
   - MinIO Console: http://localhost:9001

5. **Default credentials**:
   - Check your email for registration or create a super admin account through the API

---

## ⚙️ Configuration

### Environment Variables

MMS is configured through environment variables in the `.env` file:

#### Database Configuration
```bash
POSTGRES_USER=rootUser           # PostgreSQL username
POSTGRES_PWD=mypassword          # PostgreSQL password (change in production!)
```

#### Application URLs
```bash
PUBLIC_FRONT_URL=http://localhost:12000   # Frontend URL
PUBLIC_API_URL=http://localhost:12001     # Backend API URL
```

#### Security
```bash
JWT_SECRET_KEY=your_jwt_secret   # JWT signing key (use strong random key!)
```

#### Email Configuration
```bash
ENABLE_EMAIL_NOTIFICATIONS=false # Enable/disable email notifications
INVITATION_VIA_EMAIL=false       # Require email verification for registration
SMTP_HOST=smtp.gmail.com         # SMTP server host
SMTP_PORT=587                    # SMTP server port
SMTP_USER=                       # SMTP username
SMTP_PWD=                        # SMTP password
```

#### Storage Configuration
```bash
STORAGE_TYPE=minio               # Storage type: minio or gcp
MINIO_USER=minio                 # MinIO username
MINIO_PASSWORD=minio123          # MinIO password
PUBLIC_MINIO_ENDPOINT=http://localhost:9000
```

#### Google Cloud Storage (Optional)
```bash
GCP_BUCKET_NAME=                 # GCP bucket name
GCP_JSON=                        # GCP service account JSON
GCP_PROJECT_ID=                  # GCP project ID
```

#### SSO Configuration (Optional)
```bash
ENABLE_SSO=false                 # Enable Single Sign-On
OAUTH2_PROVIDER=                 # OAuth2 provider (google, azure, etc.)
OAUTH2_CLIENT_ID=                # OAuth2 client ID
OAUTH2_CLIENT_SECRET=            # OAuth2 client secret
```

#### Branding (Optional)
```bash
LOGO_PATHS=                      # Custom logo paths (JSON format)
CUSTOM_COLORS=                   # Custom color scheme (JSON format)
BRAND_CONFIG=                    # Complete brand configuration (JSON format)
```

#### Licensing (Optional)
```bash
LICENSE_KEY=                     # Enterprise license key
LICENSE_FINGERPRINT_REQUIRED=true
```

For detailed configuration options, see [Change Ports Guide](dev-docs/Change%20Ports.md).

---

## 💻 Usage

### First-Time Setup

1. **Access the application** at http://localhost:12000
2. **Register a new account** using the registration page
3. **Create your organization** and set up your workspace
4. **Configure settings** in the admin panel:
   - User roles and permissions
   - Asset categories
   - Work order priorities
   - Locations and departments

### Common Workflows

#### Creating a Work Order
1. Navigate to **Work Orders** → **New Work Order**
2. Fill in the work order details (title, description, priority)
3. Assign to a technician or team
4. Attach related assets or locations
5. Set due date and priority
6. Save and track progress

#### Managing Assets
1. Navigate to **Assets** → **Add Asset**
2. Enter asset details (name, model, serial number)
3. Assign to a location
4. Upload documentation (manuals, warranties)
5. Generate QR code for mobile scanning

#### Preventive Maintenance
1. Navigate to **Preventive Maintenance** → **New Schedule**
2. Define the maintenance task
3. Set recurrence pattern (daily, weekly, monthly)
4. Assign to technician or team
5. System automatically creates work orders based on schedule

---

## 🛠️ Development

### Setting Up Development Environment

#### Backend (API)

1. **Prerequisites**:
   - Java 17 JDK
   - Maven 3.8+
   - PostgreSQL 16

2. **Clone and setup**:
   ```bash
   cd api
   ./mvnw clean install
   ```

3. **Run locally**:
   ```bash
   ./mvnw spring-boot:run
   ```

4. **Run tests**:
   ```bash
   ./mvnw test
   ```

For more details, see [API README](api/README.md).

#### Frontend (Web)

1. **Prerequisites**:
   - Node.js 18+
   - npm or yarn

2. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

For more details, see [Frontend README](frontend/README.md).

#### Mobile App

1. **Prerequisites**:
   - Node.js 18+
   - React Native CLI
   - Xcode (for iOS) or Android Studio

2. **Install dependencies**:
   ```bash
   cd mobile
   npm install
   ```

3. **Run on iOS**:
   ```bash
   npm run ios
   ```

4. **Run on Android**:
   ```bash
   npm run android
   ```

For more details, see [Mobile README](mobile/README.md).

### Project Structure

```
Cmms/
├── api/                      # Backend Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/        # Java source code
│   │   │   └── resources/   # Configuration files
│   │   └── test/            # Unit tests
│   ├── Dockerfile
│   └── pom.xml              # Maven configuration
├── frontend/                # React web application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── content/         # Page content
│   │   ├── hooks/           # Custom React hooks
│   │   ├── slices/          # Redux slices
│   │   └── models/          # TypeScript models
│   ├── Dockerfile
│   └── package.json
├── dev-docs/               # Developer documentation
├── scripts/                # Utility scripts
├── docker-compose.yml      # Docker Compose configuration
├── .env.example           # Environment variables template
└── README.MD              # This file
```

### Database Migrations

MMS uses Liquibase for database migrations:

```bash
cd api
./mvnw liquibase:update
```

For more information, see [Liquibase Documentation](dev-docs/Fix%20Liquibase%20lock.md).

---

## 📚 API Documentation

### REST API Endpoints

The backend exposes a RESTful API with the following main endpoints:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Work Orders**: `/api/work-orders/*`
- **Assets**: `/api/assets/*`
- **Locations**: `/api/locations/*`
- **Inventory**: `/api/parts/*`
- **Preventive Maintenance**: `/api/preventive-maintenances/*`
- **Reports**: `/api/analytics/*`

### Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:12001/swagger-ui.html
```

### Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login** to obtain a JWT token
2. **Include the token** in the Authorization header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

Example:
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
     http://localhost:12001/api/work-orders
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs** - Open an issue describing the bug
- 💡 **Suggest Features** - Share your ideas for improvements
- 📝 **Improve Documentation** - Help make the docs better
- 🔧 **Submit Code** - Fix bugs or implement features
- 🌍 **Translations** - Help translate the app to other languages

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and commit (`git commit -m 'Add amazing feature'`)
4. **Push to your branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

For detailed guidelines, see:
- [API Contributing Guide](api/CONTRIBUTING.md)
- [Frontend Contributing Guide](frontend/CONTRIBUTING.md)
- [Mobile Contributing Guide](mobile/CONTRIBUTING.md)

### Adding Translations

To add a new language translation:
1. See [Translation Guide](dev-docs/Add%20translation.md)
2. Copy an existing language file
3. Translate all strings
4. Submit a pull request

---

## 🔧 Troubleshooting

### Common Issues

#### Docker Container Won't Start

**Problem**: Containers fail to start or crash immediately

**Solution**:
```bash
# Check logs
docker-compose logs

# Restart containers
docker-compose down
docker-compose up -d
```

#### Database Connection Error

**Problem**: Backend can't connect to PostgreSQL

**Solution**:
1. Verify PostgreSQL is running: `docker ps`
2. Check credentials in `.env` file
3. Ensure ports are not in use: `netstat -an | grep 5432`

#### Frontend Can't Reach Backend

**Problem**: API calls fail with CORS or network errors

**Solution**:
1. Verify `PUBLIC_API_URL` in `.env` matches backend URL
2. Check that backend is running: `curl http://localhost:12001/api/health`
3. Ensure both use same protocol (http/https)

#### Liquibase Lock Error

**Problem**: Database migration fails with lock error

**Solution**: See [Fix Liquibase Lock Guide](dev-docs/Fix%20Liquibase%20lock.md)

#### Email Notifications Not Working

**Problem**: System doesn't send emails

**Solution**:
1. Verify SMTP configuration in `.env`
2. Check `ENABLE_EMAIL_NOTIFICATIONS=true`
3. Test SMTP credentials
4. Check firewall/security group rules for SMTP port

### Advanced Troubleshooting

#### Database Backup and Restore

See [Backup Guide](dev-docs/Backup.md) for detailed instructions.

#### Factory Reset

To reset the system to default state:
See [Factory Reset Guide](dev-docs/Factory%20Reset.md)

#### Running SQL Commands

See [SQL Command Guide](dev-docs/Run%20SQL%20command.md)

#### Changing Ports

See [Change Ports Guide](dev-docs/Change%20Ports.md)

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0).

This means you are free to:
- ✅ Use the software for any purpose
- ✅ Change the software to suit your needs
- ✅ Share the software with your friends and neighbors
- ✅ Share the changes you make

Under the following conditions:
- ⚠️ Any modifications must also be open-sourced under GPL-3.0
- ⚠️ You must include the original license and copyright notice
- ⚠️ You must state significant changes made to the software

For more information, see the [LICENSE](LICENSE) file.

---

## 💬 Support

### Getting Help

- 📖 **Documentation**: Check the [dev-docs](dev-docs/) folder
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Open an issue with the enhancement label
- 📧 **Email**: Contact the maintainers

### Community

- ⭐ **Star this repository** to show your support!
- 👥 **Join discussions** in GitHub Issues
- 🔄 **Share your use cases** with the community

### Commercial Support

For enterprise support, custom development, or consulting services, please contact the project maintainers.

---

## 🙏 Acknowledgments

MMS is built with open-source technologies and is made possible by contributions from the community.

Special thanks to:
- Spring Framework team
- React and React Native communities
- Material-UI team
- Atlas CMMS
- All contributors and users


---

<div align="center">
  <p>Made with ❤️ by the MMS Team</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>

