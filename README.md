# Marvin Bank API

Marvin Bank is a world-class fintech backend application designed to simulate modern banking operations. It integrates with a simulated NIBSS (Nigerian Inter-Bank Settlement System) layer to handle identity verification (BVN/NIN), account creation, and inter-bank fund transfers.

## 🚀 Features

- **Identity Management**: Integration with NIBSS for BVN and NIN validation and insertion.
- **Account Services**: Automated account creation upon signup and real-time balance enquiries.
- **Secure Authentication**: JWT-based authentication with password hashing (bcrypt), account locking after failed attempts, and password reset functionality.
- **Fund Transfers**:
  - **Internal**: Transfer between accounts within the Marvin Bank ecosystem.
  - **External**: Inter-bank transfers via NIBSS settlement simulation.
  - **Security**: Transaction PIN verification and daily transfer limits.
- **Transaction Tracking**: Detailed transfer history and Transaction Status Query (TSQ).
- **Email Notifications**: Automated alerts for welcome messages, password resets, and debit/credit notifications using Nodemailer.
- **Security Layers**: Implementation of Helmet, CORS, HPP, and rate limiting to protect the API.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & BcryptJS
- **Communication**: Axios & Fetch API
- **Mailing**: Nodemailer
- **Security**: Helmet, HPP, express-mongo-sanitize

## 📋 Prerequisites

- Node.js (v14+ recommended)
- MongoDB (Local or Atlas instance)
- NIBSS Sandbox Credentials

## ⚙️ Installation & Setup

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd marvinBank
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `config.env` file in the root directory and populate it with the following variables:

    ```env
    NODE_ENV=development
    PORT=8000
    DATABASE_LOCAL=mongodb://localhost:27017/marvinBank

    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=90d
    JWT_COOKIE_EXPIRES_IN=90

    NIBSS_API_KEY=your_nibss_api_key
    NIBSS_SECRET_KEY=your_nibss_secret_key

    EMAIL_FROM=support@marvinbank.com
    EMAIL_TEST_HOST=smtp.mailtrap.io
    EMAIL_TEST_PORT=2525
    EMAIL_TEST_USERNAME=your_mailtrap_username
    EMAIL_TEST_PASSWORD=your_mailtrap_password

    DAILY_TRANSFER_LIMIT=1000000
    ```

4.  **Start the server**:
    ```bash
    # Development mode
    npm start
    ```

## 🛣 API Endpoints (Summary)

### Authentication & User

- `POST /api/user/signup`: Register a new user (requires BVN).
- `POST /api/user/login`: Access the application.
- `POST /api/user/forgotPassword`: Request a reset link.
- `GET /api/user/me`: Get current user profile.

### Identity (NIN/BVN)

- `POST /api/insertNin`: Onboard a new NIN.
- `POST /api/validateNin`: Verify an existing NIN.

### Transfers

- `POST /api/transfer/internal`: Send money to another Marvin Bank user.
- `POST /api/transfer/external`: Send money to external banks.
- `GET /api/transfer/name-enquiry/:accountNumber`: Verify a recipient's name.
- `GET /api/transfer/history`: View transaction logs.

### Fintech Onboarding

- `POST /api/fintech/onboard`: Register a new fintech entity on the NIBSS layer.

## 🛡 Security & Error Handling

The project uses a global error-handling middleware to provide consistent responses for operational errors (validation, database errors, JWT expiration). Security is enforced using `helmet` for HTTP headers and `express-mongo-sanitize` for NoSQL injection prevention.

---

© 2024 Marvin Bank Engineering.
