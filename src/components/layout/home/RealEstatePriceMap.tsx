export default function RealEstatePriceMap() {
    return (
        <div className="flex-col px-2">
            <div className="w-full h-50 border border-black rounded-md mt-2 bg-center bg-cover"
                    style={{ backgroundImage: 'url("https://media.istockphoto.com/id/2173059563/vi/vec-to/%C4%91%E1%BA%BFn-s%E1%BB%9Bm-h%C3%ACnh-%E1%BA%A3nh-tr%C3%AAn-n%E1%BB%81n-tr%E1%BA%AFng-kh%C3%B4ng-c%C3%B3-s%E1%BA%B5n-%E1%BA%A3nh.jpg?s=1024x1024&w=is&k=20&c=NItqj_jaYCsWltHw9WRV6kzmIiyEcsYrJM2LkWxOgtk=")' }}
                    >
            </div>
            <div className="w-full mt-2">
                <div className="bg-white border rounded-md p-6">
                    <h2 className="font-bold text-lg mb-2">
                        BẢN ĐỒ CHECK GIÁ NHÀ ĐẤT GULAND
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Phần mềm không thể thiếu của môi giới và nhà đầu tư
                    </p>
                    
                    <div className="space-y-4 mb-6">
                        <div className="flex items-start">
                            <span className="font-bold mr-3">1.</span>
                            <span className="text-sm leading-relaxed">
                                Giúp lưu thông tin, vị trí thửa đất và thông tin liên hệ với 
                                chủ nhà (trực tiếp hoặc qua môi giới).
                            </span>
                        </div>
                        
                        <div className="flex items-start">
                            <span className="font-bold mr-3">2.</span>
                            <span className="text-sm leading-relaxed">
                                Giúp so sánh giá nhà đất đang quan tâm với khu vực xung quanh, 
                                hỗ trợ định giá bằng phương pháp so sánh.
                            </span>
                        </div>
                        
                        <div className="flex items-start">
                            <span className="font-bold mr-3">3.</span>
                            <span className="text-sm leading-relaxed">
                                Giúp nhà đầu tư quản lý tài sản và theo dõi biến động giá cả 
                                thị trường trong khu vực.
                            </span>
                        </div>
                        
                        <div className="flex items-start">
                            <span className="font-bold mr-3">4.</span>
                            <span className="text-sm leading-relaxed">
                                Giúp nhà môi giới quản lý nguồn hàng và trao đổi thông tin với 
                                môi giới khác.
                            </span>
                        </div>
                        
                        <div className="flex items-start">
                            <span className="font-bold mr-3">5.</span>
                            <span className="text-sm leading-relaxed">
                                Giúp đăng bán nhanh nhà đất trên bản đồ và trang mua bán của 
                                Guland.
                            </span>
                        </div>
                    </div>
                    
                    <button className="bg-blue-600 text-white px-4 py-2 rounded border border-black text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
                        Xem ngay
                        <span className="ml-2">→</span>
                    </button>
                </div>
            </div>
        </div>
    )
}