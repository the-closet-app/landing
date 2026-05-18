import localFont from "next/font/local";

export const mackinac = localFont({
  src: [
    { path: "./P22_Mackinac_Pro_Book.woff2", weight: "400", style: "normal" },
    { path: "./P22_Mackinac_Pro_Bold.woff2", weight: "700", style: "normal" },
    { path: "./P22_Mackinac_Pro_Extra_Bold.woff2", weight: "800", style: "normal" },
    { path: "./P22_Mackinac_Pro_Medium.woff2", weight: "500", style: "normal" },
    { path: "./P22_Mackinac_Pro_Book_Italic.woff2", weight: "400", style: "italic" },
    { path: "./P22_Mackinac_Pro_Bold_Italic.woff2", weight: "700", style: "italic" },
    { path: "./P22_Mackinac_Pro_Extra_Bold_Italic.woff2", weight: "800", style: "italic" },
  ],
  variable: "--font-mackinac",
  display: "swap",
});

export const antiqueLegacy = localFont({
  src: [
    { path: "./Antique-Legacy-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-antique-legacy",
  display: "swap",
});
