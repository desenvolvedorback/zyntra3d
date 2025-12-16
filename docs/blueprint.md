# **App Name**: DoceLink

## Core Features:

- Product Catalog: Display a catalog of available sweets with name, image, price, and detailed description.
- Shopping Cart: Allow users to add, remove, and modify the quantity of items in their cart. Persist the cart data using Firestore, and localStorage when logged out. On login, merge with remote cart, if present.
- User Authentication: Enable user registration and login with email and password, managed by Firebase Authentication.
- Admin Product Management: Provide a secure admin interface to create, update, and delete products.
- Admin News Management: Allow admins to create, update, and delete news articles displayed on the home page.
- WhatsApp Checkout: Generate a formatted message with the order details and redirect the user to WhatsApp to complete the order.
- AI-Powered Product Description Tool: Integrate a generative AI tool to assist the admin in creating engaging and descriptive product descriptions.

## Style Guidelines:

- Primary color: Deep brown (#654321) for a rich, chocolatey feel.
- Background color: Off-white (#F5F5DC) to provide a clean, subtle backdrop.
- Accent color: Dark gray (#4A4A4A) to highlight key elements.
- Body text: 'PT Sans' for readability in product descriptions and news articles.
- Headline text: 'Belleza', lending a stylish touch suitable for headlines in an arts and design context; when needed for paragraphs, adopt 'Alegreya'.
- Use minimalist icons in white or light brown for navigation and cart interactions.
- Implement subtle loading animations, smooth page transitions, and a 3D logo animation (CSS or library-based).