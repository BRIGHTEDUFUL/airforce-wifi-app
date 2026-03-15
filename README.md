# Air Force Key Manager

Internal credential management system.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the application:
   ```bash
   npm run dev
   ```

3. Access the application at `http://localhost:3000`.

## Docker Support

1. Build the image:
   ```bash
   docker build -t airforce-key-manager .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 airforce-key-manager
   ```

## Default Credentials
- Email: `admin@airforce.mil`
- Password: `adminpassword`
- Role: Administrator
