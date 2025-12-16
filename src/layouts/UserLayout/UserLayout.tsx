import Header from "@/components/html/Header/Header";
import UserInfo from "@/components/common/UserInfo/UserInfo";

import Link from "next/link";
import { UserAsideLinkMenu, UserFooterLinkMenu } from "@/components/html/UserLinkMenu/UserLinkMenu";
import BackPageInfoPanel from "@/components/html/BackPageInfoPanel/BackPageInfoPanel";
import { auth } from "@/auth";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const { user } = session!;
    return (
        <div
            className="mycontainer_admin   flex flex-col bg-f-white-100
                        md:flex-col
                        lg:flex-row lg:bg-f-gray-50 
                       
                        "
        >
            <Header className="lg:hidden bg-f-white-100" />
            <header>
                <div
                    className="w-[320px] hidden
                                    min-lg:block                                    
                                    xl:w-[345px]
                                    "
                >
                    <div
                        className="px-6 py-10
                                xl:px-8 xl:py-12
                                "
                    >
                        <Link href={"/"}>
                            <img
                                src={"/logo.svg"}
                                alt="Hotel4Box logo"
                                className="
                                    w-[124px] h-auto
                                    sm:w-[144px] sm:h-auto
                                    md:w-[180px] md:h-auto
                                    xl:w-[213.12px] xl:h-auto
                                    cursor-pointer
                                    mb-10
                    "
                            />
                        </Link>

                        <UserInfo />
                    </div>
                    <UserAsideLinkMenu />
                </div>
            </header>
            <main className=" box bg-f-white-100 w-full overflow-y-auto h-[100%] shrink-1 grow-1 basis-0 relative flex flex-col">
                <BackPageInfoPanel />
                {children}
            </main>
            <footer
                className="flex justify-around bg-f-gray-50 p-2  relative
                            md:flex 
                            lg:hidden
                            "
            >
                <UserFooterLinkMenu />
            </footer>
        </div>
    );
}
