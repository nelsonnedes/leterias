/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores customizadas premium para a identidade visual do projeto
        megasena: {
          light: "#209869",
          DEFAULT: "#209869",
          dark: "#146545",
        },
        lotofacil: {
          light: "#930053",
          DEFAULT: "#930053",
          dark: "#620037",
        },
        quina: {
          light: "#f7a81b",
          DEFAULT: "#f7a81b",
          dark: "#b8780c",
        },
        dark: {
          card: "#12141c",
          bg: "#090a0f",
          border: "#1e2230"
        }
      }
    },
  },
  plugins: [],
}
