/**
 * The ELITE emblem (the crown/starburst mark), extracted from the full logo
 * (public/elite-white.svg) — just the emblem group, re-based to its own square
 * viewBox so it reads at avatar size.
 *
 * Used as the Studio workspace `icon` (the navbar chip), which is the SUPPORTED
 * way to brand the nav — `studio.components.logo` is deprecated and a no-op in
 * Studio 6.4. `fill="currentColor"` so it inherits the chip's foreground color.
 *
 * It also carries the login-card branding CSS (below). The workspace icon is the
 * only element we control that renders on the *unauthenticated* login screen —
 * `studio.components.layout` does NOT wrap it — so the <style> rides along here.
 * The selector is scoped to the login card's `[data-ui="Container"]`, which the
 * navbar chip is never inside, so the navbar emblem is untouched.
 */
const LOGIN_BRANDING_CSS = `
[data-ui="Container"] [data-ui="Flex"]:has(> div > svg[aria-label="Elite Legal Marketing"]) {
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.85rem;
}
[data-ui="Container"] [data-ui="Flex"]:has(> div > svg[aria-label="Elite Legal Marketing"]) > div:first-child {
  width: 46px;
  height: 46px;
}
[data-ui="Container"] [data-ui="Flex"]:has(> div > svg[aria-label="Elite Legal Marketing"]) > div:first-child svg {
  width: 100%;
  height: 100%;
}
`;

export function EliteMark() {
  return (
    <>
      <svg viewBox="0 0 189 213" fill="currentColor" role="img" aria-label="Elite Legal Marketing">
        <polygon points="143.15 141.94 169.11 157.01 177.94 145.59 179.2 132.72 146.78 116.5 143.15 141.94" />
        <polygon points="148.09 107.33 180.43 120.26 185.06 73.16 152.13 79.12 148.09 107.33" />
        <polygon points="128.56 162.36 140.86 185.13 152.62 178.32 163.1 164.77 142.18 148.65 128.56 162.36" />
        <polygon points="103.26 187.7 94.37 187.7 85.48 187.7 67.65 169.8 56.58 190.16 80.33 203.9 94.37 212.02 108.41 203.9 132.16 190.16 121.1 169.8 103.26 187.7" />
        <polygon points="41.96 116.5 9.54 132.72 10.81 145.59 19.64 157.01 45.59 141.94 41.96 116.5" />
        <polygon points="36.61 79.12 3.68 73.16 8.32 120.26 40.65 107.33 36.61 79.12" />
        <polygon points="46.57 148.65 25.64 164.77 36.12 178.32 47.89 185.13 60.18 162.36 46.57 148.65" />
        <polygon points="159.66 24.7 148.75 36.38 171.96 40.7 162.87 55.62 163.75 44 126.36 49 94.37 74.03 62.38 49 25 44 25.87 55.62 16.79 40.7 40 36.38 29.08 24.7 0 35.7 2.6 62.17 38.37 73.25 51.75 63.21 38.14 57.98 39.56 66.93 32.16 59.9 32.51 51.79 53.33 55.5 61.16 62.88 47.91 75.31 52.95 85.89 74.92 96.17 77.62 114.04 73.13 105.83 56.97 95.89 48.14 106.54 57.41 127.43 61.6 122.29 71.93 120.03 54.57 144.6 55.65 145.68 71.06 137.87 58.01 148.05 59.96 150.01 76.37 142.43 62.31 152.36 64.13 154.2 87.96 151.26 91.23 142.62 75.97 134.38 78.62 120.65 80.01 129.83 94.37 134.8 108.74 129.83 110.12 120.65 112.78 134.38 97.51 142.62 100.79 151.26 124.61 154.2 126.44 152.36 112.37 142.43 128.79 150.01 130.74 148.05 117.69 137.87 133.09 145.68 134.17 144.6 116.82 120.03 127.15 122.29 131.34 127.43 140.61 106.54 131.78 95.89 115.62 105.83 111.12 114.04 113.82 96.17 135.8 85.89 140.84 75.31 127.58 62.88 135.42 55.5 156.24 51.79 156.59 59.9 149.18 66.93 150.6 57.98 137 63.21 150.38 73.25 186.14 62.17 188.75 35.7 159.66 24.7" />
        <polygon points="68.44 40.85 94.37 62.17 120.3 40.85 140.73 35.48 152.61 22.03 126.63 12.2 112.06 23.26 105.37 39.37 106.5 22.75 114.8 7.73 94.37 0 73.95 7.73 82.25 22.75 83.37 39.37 76.68 23.26 62.11 12.2 36.14 22.03 48.02 35.48 68.44 40.85" />
        <polygon points="115.47 162.07 109.78 157.53 94.37 154.97 78.96 157.53 73.28 162.07 82.87 172.68 105.88 172.68 115.47 162.07" />
      </svg>
      <style>{LOGIN_BRANDING_CSS}</style>
    </>
  );
}
