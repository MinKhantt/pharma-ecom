# Pharma E-Commerce Platform

A full-stack pharmacy e-commerce system built as a **University
Computing Project**, designed to simulate a real-world online pharmacy.

The platform allows customers to browse medicines, place orders, upload
prescriptions, chat with pharmacists, and interact with an AI assistant
--- while admins manage products, users, orders, and analytics.

------------------------------------------------------------------------

## Key Features

### Customer Features

-   User authentication (JWT + Google OAuth)
-   Browse medicines with search & filters
-   Add to cart and checkout
-   Upload prescriptions for restricted medicines
-   Track orders and request returns/refunds
-   Real-time chat with pharmacist (WebSocket)
-   AI assistant for medicine-related questions
-   Submit reviews and read health articles

### Admin Features

-   Dashboard with statistics and charts
-   Product & category management (CRUD + image upload)
-   Order management with full status workflow
-   User management
-   Review moderation
-   Article publishing system
-   Real-time chat with customers

------------------------------------------------------------------------

## Project Structure

pharma-ecom/ ├── frontend/ \# React + TypeScript frontend (Vite) ├──
backend/ \# FastAPI backend API

------------------------------------------------------------------------

## Tech Stack

### Frontend

-   React 18 + TypeScript
-   Vite
-   Tailwind CSS
-   shadcn/ui (Radix UI)
-   TanStack Query
-   Zustand
-   Axios (with auto token refresh)
-   React Hook Form + Zod
-   WebSocket API

### Backend

-   FastAPI
-   PostgreSQL
-   SQLAlchemy (async)
-   Alembic (migrations)
-   Redis (token blacklist & caching)
-   JWT Authentication
-   Google OAuth
-   OpenRouter (AI chatbot)
-   WebSocket (real-time chat)

------------------------------------------------------------------------

## System Overview

-   Frontend communicates with backend via REST API\
-   Backend handles business logic, authentication, and database\
-   WebSocket enables real-time chat\
-   AI Chat powered by OpenRouter\
-   File uploads stored locally (products, prescriptions, avatars)

------------------------------------------------------------------------

## Setup Instructions

### 1. Clone Repository

``` bash
git clone https://github.com/MinKhantt/pharma-ecom.git
cd pharma-ecom
```

### 2. Setup Backend

[Go to Backend Setup →](backend/README.md)

### 3. Setup Frontend

[Go to Frontend Setup →](frontend/README.md)

------------------------------------------------------------------------

## API Documentation

After running backend:

-   Swagger UI → http://localhost:8000/docs\
-   ReDoc → http://localhost:8000/redoc

------------------------------------------------------------------------

## Core System Flows

### Order Flow

pending → confirmed → processing → shipped / ready_for_pickup →
delivered

### Prescription Flow

awaiting_prescription → upload → normal order flow

### Return & Refund

delivered → return_requested → approved → refunded

------------------------------------------------------------------------

## Purpose of the Project

This project was developed as a **University Computing Project** to
demonstrate:

-   Full-stack web development
-   Backend API design and architecture
-   Database modeling and relationships
-   Authentication and authorization (JWT, OAuth)
-   Real-time systems (WebSocket)
-   Integration of AI into web applications

------------------------------------------------------------------------

## Future Improvements

-   Real payment integration (Stripe / PayPal)
-   Cloud storage (AWS S3 / Cloudinary)
-   Deployment (Docker + CI/CD)
-   Mobile application
-   Smarter AI recommendations

