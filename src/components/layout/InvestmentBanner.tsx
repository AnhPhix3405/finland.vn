import { Button } from "../ui/button"
import "./investment-banner.css"
export default function InvestmentBanner() {
    return (
        <div className="banner relative">
            <h3 className="text-[14px] text-center">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec turpis enim, facilisis a metus ac, lacinia bibendum ligula. Integer elementum sed felis sit amet finibus.</h3>
            <Button variant={'ghost'} className="bg-green-400 absolute bottom-1 left-1/2 -translate-x-1/2">
                <img src="/svgs/facebook-brands-solid.svg" alt="" 
                className="w-5 h-5 block"/>
                <span className="text-white font-bold">TOI QUAN TAM</span>
            </Button>
        </div>
    )
}