# Erasmus+ Digital Photo Exhibition

A production-ready MVP for hosting digital photo exhibitions during Erasmus+ exchange programs. Built with Next.js 14, Tailwind CSS, and Supabase.

## ✨ Features

- **Country-based Access Control**: Each participating country has secure access codes
- **Photo Upload System**: Authenticated users can upload images with captions and author names
- **Masonry Gallery**: Beautiful responsive photo gallery with lightbox viewing
- **Secure Authentication**: JWT-based authentication with 24-hour expiration
- **File Validation**: Supports JPG, PNG, WebP up to 5MB
- **Responsive Design**: Modern UI that works on all devices

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Storage)
- **Authentication**: JWT with jose library
- **Image Gallery**: react-photo-album + yet-another-react-lightbox
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account and project
- npm or yarn package manager

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd erasmus-exhibit
npm install
```

### 2. Environment Configuration

Copy the `.env.local` file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
APP_JWT_SECRET=your_random_long_secret_string_here
AUTO_APPROVE=true
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Run the script to create tables, policies, and sample data

### 4. Storage Bucket Setup

The SQL script creates a `submissions` bucket automatically. Ensure your Supabase storage is enabled.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔐 Access Codes

By default, all countries use the access code: **`erasmus2024`**

You can generate new access codes using:

```bash
echo -n "your_code_here" | sha256sum
```

Then update the `country_access_codes` table in Supabase.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── country-login/     # Access code verification
│   │   ├── upload/            # Image upload endpoint
│   │   └── gallery/           # Gallery data endpoint
│   ├── c/[slug]/              # Country-specific pages
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── lib/
│   ├── supabase.ts            # Supabase client config
│   └── jwt.ts                 # JWT utilities
└── types/                     # TypeScript type definitions
```

## 🌍 Adding New Countries

1. Insert a new record in the `countries` table:

```sql
INSERT INTO countries (slug, name, flag_svg_url, is_active) 
VALUES ('portugal', 'Portugal', 'https://flagcdn.com/pt.svg', true);
```

2. Add access codes for the new country:

```sql
INSERT INTO country_access_codes (country_id, code_hash, expires_at, max_uses) 
VALUES (9, 'your_hashed_code', NULL, 100);
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based authentication
- **Access Code Hashing**: SHA-256 hashed access codes
- **File Type Validation**: Only allows safe image formats
- **File Size Limits**: Prevents abuse with 5MB limit
- **Service Role Protection**: Admin operations require service role key

## 📱 Usage Flow

1. **Home Page**: Users see a grid of participating countries
2. **Country Selection**: Click on a country to access its gallery
3. **Access Code**: Enter the country's access code
4. **Upload Photos**: Authenticated users can upload images with metadata
5. **View Gallery**: Browse all approved photos in a masonry layout
6. **Lightbox Viewing**: Click images to view in full-screen with details

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app is compatible with any Node.js hosting platform. Ensure all environment variables are properly set.

## 🧪 Testing

Test the application with the sample data:

1. Visit the home page to see countries
2. Click on any country (e.g., Germany)
3. Use access code: `erasmus2024`
4. Upload test images
5. View the gallery

## 🔧 Customization

### Styling
- Modify `src/app/globals.css` for global styles
- Update Tailwind classes in components for design changes

### Features
- Add approval workflow by setting `AUTO_APPROVE=false`
- Implement user registration/login systems
- Add photo moderation features
- Include voting/rating systems

### Database
- Add more fields to submissions (tags, categories, etc.)
- Implement user management tables
- Add analytics tracking

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions or issues:
- Check the [Issues](../../issues) page
- Review the Supabase documentation
- Contact the development team

---

**Built with ❤️ for Erasmus+ cultural exchange programs**
