# 🌐 Network Designer Pro
 A complete solution for your network design and planning needs.

 

**An end-to-end network design and implementation platform**  
[![Live Demo](https://img.shields.io/badge/Demo-Live%20Application-green)](https://network-designer-frontend.onrender.com/)  
[![Sponsor](https://img.shields.io/badge/Support-Project%20via%20GitHub%20Sponsors-blue)](https://github.com/sponsors/j-mugerwa)

## 🚀 Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Multi-stage Design** | ✅ Deployed | Guided workflow from topology design to implementation |
| **Automated Reporting** | ✅ Deployed | Generate professional PDF reports with 1 click |
| **Visual Topology Builder** | ✅ Deployed | Drag-and-drop network visualization |
| **Equipment Catalog** | ✅ Deployed | Custom device templates & auto-proposals |
| **Configuration Generator** | ✅ Deployed | Templated device configs with variables |
| **Team Collaboration** | 🚧 In Progress | Real-time design collaboration |
| **Role-based Access** | 🚧 In Progress | Granular permission control |
| **Notifications** | 🚧 In Progress | Send and receive progress Notifications to team members |
| **Versioning** | 🚧 In Progress | Create and manage deployment versions in real time |
| **More Reports** | 🚧 In Progress | Generate more reports of choice |

## 🏗️ System Architecture

```mermaid
graph TD
    A[User Signup] --> B[Create New Design]
    B --> C[Invite Team Members]
    C --> D[Design Specification]
    D --> E{Approval?}
    E -->|Yes| F[Generate Reports]
    E -->|No| D
    F --> G[Visual Topology]
    G --> H[Equipment Provisioning]
    H --> I[Configuration Templates]
    I --> J[Deployment]
```

# 🧪 Demo Access

Test the deployed version with:

🔑 Email: yourschool20@gmail.com

🔒 Password: 1234567

(All demo data resets hourly)

# 💻 Tech Stack
Frontend:

Next.js 15 + React 19

Redux Toolkit + RTK Query

Vis.js Network Topology

jsPDF + PDFKit

Backend:

Node.js + Express

MongoDB Atlas

Firebase for Authentication

Puppeteer (for PDF generation)

# 🛠️ Setup Guide
### 1. Create a .env file in your Backend and Frontend directories following the .env-example provided
### 2. Clone repository
git clone https://github.com/j-mugerwa/Network-Designer

### 3. Setup backend
`cd Backend`

`npm install`

`npm run backend`

### 4. Setup frontend

`cd ../Frontend`

`npm install`

`npm run dev`

# 🤝 Contribution Roadmap
## Team Collaboration Module (Priority)

Real-time design editing

Comment threads

@mentions


## Advanced Reporting

Custom report designer

Scheduled exports

# 🤝 Contributors
Recognition Guidelines:

First-time contributors: Added to "Contributors" list

Major features: Profile + link in "Featured Contributors"

Security fixes: Special acknowledgment

### Current Team:

Joseph Mugerwa (Lead)

https://github.com/j-mugerwa/


# 🌟 Sponsors
Support these amazing organizations:

<div align="center"> <a href="https://www.bugemauniv.ac.ug/"> <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Bugema_logo.png" width="150" alt="Sponsor 1"> </a> </div>



# 💖 Support the Project
Help us improve network automation!

[![Sponsor](https://img.shields.io/badge/Support-Project%20via%20GitHub%20Sponsors-blue)](https://github.com/sponsors/j-mugerwa)

"From topology to configuration in one platform"

📧 Contact: jmugerwa2020@gmail.com

© 2024 Network Designer Pro
