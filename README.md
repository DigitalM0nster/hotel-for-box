Настроен tailwind брейкпоинты в tailwind.css

@mixin box-style($firstBlock: false) - отступы, округления и отрицательные марджины начального блока

## SVGR с Turbopack

npm install @svgr/webpack --save-dev

    const nextConfig = {
    turbopack: {
        rules: {
            "*.svg": {
                loaders: [
                    {
                        loader: "@svgr/webpack",
                        options: {
                            expandProps: "start",
                            svgo: true,
                            svgoConfig: {
                                plugins: [
                                    {
                                        name: "removeViewBox",
                                        active: false,
                                    },
                                ],
                            },
                        },
                    },
                ],
                as: "*.js",
            },
        },
    },
    };

## ngrok http http://localhost:3000

Auth.js
npm install next-auth@beta
npx auth secret
