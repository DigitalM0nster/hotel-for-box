import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    /* config options here */

    sassOptions: {
        includePaths: [path.join(process.cwd(), "src", "styles")],
        additionalData: `        
        @use "variables" as *;
        @use "mixins" as *;              
        @reference "tailwindcss";        
        `,
    },
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

export default nextConfig;
