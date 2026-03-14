export default function LandUsePlanningMap() {
    return (
        <div className="w-full flex-col px-2">
            <div className="w-full h-56 border border-black rounded-md mt-2 bg-center bg-cover
             "
                    style={{ backgroundImage: 'url("https://media.istockphoto.com/id/2173059563/vi/vec-to/%C4%91%E1%BA%BFn-s%E1%BB%9Bm-h%C3%ACnh-%E1%BA%A3nh-tr%C3%AAn-n%E1%BB%81n-tr%E1%BA%AFng-kh%C3%B4ng-c%C3%B3-s%E1%BA%B5n-%E1%BA%A3nh.jpg?s=1024x1024&w=is&k=20&c=NItqj_jaYCsWltHw9WRV6kzmIiyEcsYrJM2LkWxOgtk=")' }}>
            </div>
            <div className="w-full mt-2">
                <div className="bg-white border rounded-md p-6 h-full">
                    <h2 className="font-bold text-lg mb-2">
                        BẢN ĐỒ QUY HOẠCH SỬ DỤNG ĐẤT
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        mới nhất Việt Nam
                    </p>
                    
                    <p className="text-sm mb-4 leading-relaxed">
                        Finland cung cấp bản đồ tra cứu quy hoạch sử dụng đất mới nhất của 
                        63 tỉnh thành Việt Nam, với các tiện ích:
                    </p>
                    
                    <ul className="text-sm space-y-2 mb-6">
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Tra cứu quy hoạch sử dụng đất bằng tờ thửa, toạ độ Google map.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Quét toạ độ góc ranh trên sổ đỏ, địa điểm, định vị, ghim vị trí.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Xem giá bán của các bất động sản xung quanh hỗ trợ định giá.</span>
                        </li>
                    </ul>
                    
                    <button className="bg-blue-600 text-white px-4 py-2 rounded border border-black text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
                        Xem ngay
                        <span className="ml-2">→</span>
                    </button>
                </div>
            </div>
        </div>
    )
}