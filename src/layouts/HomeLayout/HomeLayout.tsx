import Footer from "@/components/html/Footer/Footer";
import Header from "@/components/html/Header/Header";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="mycontainer flex flex-col">
            <Header />

            <main
                className="shrink-1 grow-1 basis-0  mb-6 
                             lg:mb-8               
                             xl:mb-10   
                             rounded-md  
                            

         
                            "
            >
                {/* <main
                className="shrink-1 grow-1 basis-0  mb-6
                             lg:mb-8               
                             xl:mb-10   
                             rounded-md  
                            
                             outline
                             sm:outline-green-600               
                             md:outline-amber-600
                             lg:outline-blue-600              
                             xl:outline-black 
         
                            "
            > */}

                {children}
            </main>

            <Footer />
        </div>
    );
}
