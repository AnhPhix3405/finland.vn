import Image from "next/image";

type Feature = {
    name: string;
    icon: string;
}

export default function QuickActionsGrid() {
    const features: Feature[] = [
        {
            name: 'Bản đồ quy hoạch',
            icon: '/svgs/map-solid.svg'
        },
        {
            name: 'Kho bản đồ quy hoạch',
            icon: '/svgs/map-solid.svg'
        },
        {
            name: 'Bản đồ giá nhà đất',
            icon: '/svgs/map-solid.svg'
        },
        {
            name: 'Dự án bất động sản',
            icon: '/svgs/map-solid.svg'
        },
        {
            name: 'Bảng giá đất 2026',
            icon: '/svgs/map-solid.svg'
        },
        {
            name: 'Hướng dẫn check quy hoạch',
            icon: '/svgs/map-solid.svg'
        },
        {
            name: "Đăng tin và gửi nhà đất",
            icon: '/svgs/map-solid.svg'
        }
    ];

    return (
        <div className="w-full max-w-sm mx-auto p-2">
            {/* Grid 2 columns for mobile 375px */}
            <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                    <button
                        key={index}
                        className="bg-white hover:bg-[#0072C6] transition-all duration-200 rounded-lg p-3 flex items-center gap-3 min-h-[50px] max-h-15 text-left shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-95 transform border border-gray-100"
                    >
                        {/* Icon - Left side */}
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                            <Image
                                src={feature.icon}
                                alt={feature.name}
                                width={20}
                                height={20}
                                className="w-5 h-5 brightness-0 " // Make SVG white
                            />
                        </div>
                        
                        {/* Text - Right side */}
                        <span className="text-black text-xs font-medium leading-tight flex-1">
                            {feature.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}