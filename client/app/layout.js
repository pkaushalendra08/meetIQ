import "./globals.css";

export const metadata = {
  title: "MeetIQ: Smart Meeting Assistant",
  description: "AI Powered Smart Meeting Assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
