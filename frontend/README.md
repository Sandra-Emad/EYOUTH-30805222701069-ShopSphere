# EYOUTH-30805222701069-ShopSphere — Frontend

## Overview

This folder contains the frontend application for the EYOUTH-30805222701069-ShopSphere.

The frontend provides the user interface for customers and administrators and communicates with the backend through REST APIs.

## Technologies

* React

* Vite

* React Router

* Axios

* TanStack React Query

* React Context API

* JavaScript

* CSS

## Main Features

### Customer Features

* Home page

* Product listing

* Product details

* Product search

* Product filtering

* Product sorting

* Product pagination

* Shopping cart

* User registration and login

* User profile

* Order management

### Admin Features

* Protected admin dashboard

* Product management

* Category management

* Order management

* Store statistics

* Role-based access control

## Frontend Architecture

The frontend is organized into separate areas for API communication, components, context, hooks, layouts, pages, routes, and utilities.

```text
src/

├── api/

├── components/

├── context/

├── hooks/

├── layouts/

├── pages/

├── routes/

├── utils/

├── App.jsx

├── App.css

├── index.css

└── main.jsx
```

## API Integration

The frontend communicates with the backend using Axios.

Application data is retrieved from the backend APIs rather than being hardcoded in the frontend.

Axios is also configured to handle authenticated requests and JWT-based authentication.

## State Management

The application uses:

* React Context API for shared application state

* TanStack React Query for server state, API requests, caching, and data synchronization

## Routing

React Router is used for application navigation and dynamic routes.

Product pages use dynamic product identifiers so that each product displays its own information.

Protected routes are used for authenticated and administrator-only pages.

## Authentication

The frontend supports:

* User registration

* User login

* User logout

* JWT authentication

* Protected routes

* Role-based access control

* User profile management

Customers and administrators have different access permissions.

## Loading & Error Handling

The application provides loading and error states when communicating with the backend so that users receive clear feedback instead of blank or broken pages.

## Running the Frontend

From the frontend directory:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at the local address shown by Vite in the terminal.

## Environment Variables

Frontend environment variables are stored in the frontend `.env` file when required.

Sensitive values should not be committed to the repository.

## Backend Requirement

The frontend requires the backend API to be running and properly configured in order to load products, authentication data, cart information, orders, and other server-side data.

## Project Purpose

This frontend is part of the EYOUTH-30805222701069-ShopSphere full-stack e-commerce application built to provide a complete shopping experience with customer and administrator functionality.
