export default function PostingSupportPolicy() {
    return (
        <div className="block-freebie mt-2 ml-2 mr-2 h-47">
            <div className="block-freebie__wrp h-full bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 rounded-lg shadow-md overflow-hidden flex flex-col">
                {/* Header with warning icon and title */}
                <div className="px-4 py-2 bg-amber-100 border-b border-amber-200 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full">
                            !
                        </div>
                        <h3 className="text-base font-semibold text-amber-800">
                            Chính sách hỗ trợ thành viên đăng tin:
                        </h3>
                    </div>
                </div>

                {/* Content section */}
                <div className="block-freebie__cnt px-4 py-2 flex-1">
                    <ul className="space-y-1.5">
                        <li className="flex items-start gap-2 text-gray-700 text-sm">
                            <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span className="leading-tight">
                                <strong>Tặng 1 năm</strong> cho Tài khoản check quy hoạch VIP 
                                <span className="ml-1 text-emerald-600 font-semibold">(2.000.000đ)</span>
                            </span>
                        </li>
                        <li className="flex items-start gap-2 text-gray-700 text-sm">
                            <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span className="leading-tight">
                                <strong>Tặng 5.000.000</strong> vào Tài khoản đăng tin VIP
                            </span>
                        </li>
                        <li className="flex items-start gap-2 text-gray-700 text-sm">
                            <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span className="leading-tight">
                                <strong>Tặng VIP 1★</strong> cho tất cả tin đăng hợp lệ trên Guland
                            </span>
                        </li>
                    </ul>

                    {/* Action buttons section */}
                    <div className="block-freebie__atn mt-3">
                        <div className="flex gap-3 justify-center">
                            <button className="w-40 h-8 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded shadow-sm transition-colors duration-200 border border-amber-600 font-bold">
                                Điều kiện
                            </button>
                            <button className="w-40 h-8 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded shadow-sm transition-colors duration-200 border border-blue-600">
                                Zalo hỗ trợ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}