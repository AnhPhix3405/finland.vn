import { Button } from "../../ui/button"
// import "./investment-banner.css"
export default function InvestmentBanner() {
    return (
        <div className="px-2">
            <div
    className="
      relative w-full h-36 mt-1 px-2 pt-2 rounded-md
      before:content-['']
      before:absolute
      before:inset-0
      before:rounded-md
      before:bg-[url('https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=710&auto=format&fit=crop')]
      before:bg-center
      before:bg-cover
      before:opacity-80
      before:z-0
    "
  >
                <h3 className="text-[14px] text-center relative z-10">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec turpis enim, facilisis a metus ac, lacinia bibendum ligula. Integer elementum sed felis sit amet finibus.</h3>
                <Button variant={'ghost'} className="bg-green-400 absolute bottom-1 left-1/2 -translate-x-1/2">
                    <img src="/svgs/facebook-brands-solid.svg" alt=""
                        className="w-5 h-5 block" />
                    <span className="text-white font-bold">TOI QUAN TAM</span>
                </Button>
            </div>
        </div>
    )
}